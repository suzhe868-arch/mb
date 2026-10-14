#!/usr/bin/env bash
set -euo pipefail
case "$1" in snapshot|restore);; *) exit 64;; esac
test "$GITHUB_ACTIONS" = true
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_REF" = refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci
test "$F03_1_DATABASE_URL" = postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
dump="/tmp/f06-5b-before-$GITHUB_RUN_ID.dump"
oidPath="/tmp/f06-5b-scenario-oid-$GITHUB_RUN_ID"
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
case "$1" in
snapshot)
 test ! -e "$dump"
 docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" psql -h127.0.0.1 -U f03_ci -d f03_auth_test -Atqc "SELECT oid FROM pg_database WHERE datname='f03_auth_test'" > "$oidPath"
 docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" pg_dump -h127.0.0.1 -U f03_ci -d f03_auth_test --format=custom --no-owner --no-privileges > "$dump"
 test -s "$dump";test -s "$oidPath"
 echo "F06_5B_CI_BUSINESS_SCENARIO_SNAPSHOT oid=$(cat "$oidPath")"
 ;;
restore)
 test -s "$dump";test -s "$oidPath"
 docker exec -e PGPASSWORD=disposable_bootstrap_only "$ids" psql -h127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -qc 'DROP DATABASE f03_auth_test WITH (FORCE)'
 docker exec -e PGPASSWORD=disposable_bootstrap_only "$ids" psql -h127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -qc 'CREATE DATABASE f03_auth_test OWNER f03_ci'
 docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$ids" pg_restore -h127.0.0.1 -U f03_ci -d f03_auth_test --no-owner --no-privileges --exit-on-error < "$dump"
 actual="$(docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" psql -h127.0.0.1 -U f03_ci -d f03_auth_test -Atqc "SELECT oid FROM pg_database WHERE datname='f03_auth_test'")"
 test "$actual" != "$(cat "$oidPath")"
 echo "F06_5B_SCENARIO_DATABASE_DESTROYED_FRESH_SIGNED_AUDIT old_oid=$(cat "$oidPath") new_oid=$actual"
 rm -f "$dump"
 ;;
esac
