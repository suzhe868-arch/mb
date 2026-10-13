#!/usr/bin/env bash
# F05-11 R04: a signed v25 fixture database is strictly destroyed after real COMMIT scenarios.
# PostgreSQL superuser is used solely for disposable database lifecycle; all business migrations,
# Services and read audit still run as nonprivileged f03_ci (no CREATEDB/CREATEROLE).
set -euo pipefail
mode="${1:-}"
case "$mode" in snapshot|restore) ;; *) exit 64;; esac
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_EVENT_NAME:-}" = push
test "${GITHUB_REF_NAME:-}" = feat/f05-11-cross-domain-readiness-audit
test "${F03_1_DATABASE_URL:-}" = postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
run="${GITHUB_RUN_ID:?}"
dump="/tmp/f05-11-clean-v25-${run}.dump"
first="/tmp/f05-11-scenario-oid-${run}"
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
pg_as_ci(){ docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" "$@"; }
pg_as_admin(){ docker exec -e PGPASSWORD=disposable_bootstrap_only "$ids" "$@"; }
case "$mode" in
 snapshot)
  test ! -e "$dump"
  oid="$(pg_as_ci psql -h127.0.0.1 -U f03_ci -d f03_auth_test -Atqc "SELECT oid FROM pg_database WHERE datname='f03_auth_test'")"
  [[ "$oid" =~ ^[0-9]+$ ]]
  echo "$oid" > "$first"
  pg_as_ci pg_dump -h127.0.0.1 -U f03_ci -d f03_auth_test --format=custom --no-owner --no-privileges > "$dump"
  test -s "$dump"
  echo "F05_11_DISPOSABLE_SCENARIO_V25_SNAPSHOT_CREATED oid=$oid"
 ;;
 restore)
  test -s "$dump"; test -s "$first"
  original="$(cat "$first")"; [[ "$original" =~ ^[0-9]+$ ]]
  # R01/R02/R01G signed service COMMITs and CustomerDisabledHold stay in this disposed DB.
  pg_as_admin psql -h127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -qc "DROP DATABASE f03_auth_test WITH (FORCE)"
  pg_as_admin psql -h127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -qc "CREATE DATABASE f03_auth_test OWNER f03_ci"
  pg_as_ci pg_restore -h127.0.0.1 -U f03_ci -d f03_auth_test --no-owner --no-privileges --exit-on-error < "$dump"
  now="$(pg_as_ci psql -h127.0.0.1 -U f03_ci -d f03_auth_test -Atqc "SELECT oid FROM pg_database WHERE datname='f03_auth_test'")"
  [[ "$now" =~ ^[0-9]+$ && "$now" != "$original" ]]
  rm -f "$dump"
  echo "F05_11_DISPOSABLE_SCENARIO_DESTROYED_NEW_AUDIT_DATABASE original_oid=$original audit_oid=$now"
  # Recreate accepted v25 D1 sidecar then signed v26 IN THE NEW physical database.
  # Do not recreate a v25 Grant/Recommendation fixture or execute the R01/R02 business actors here.
  node f05/pdm17-public-pool-owner-claim/runner.mjs --inject-rollback
  node f05/pdm17-public-pool-owner-claim/runner.mjs --apply
  node f05/pdm17-public-pool-owner-claim/runner.mjs --verify
  node f05/pdm17-public-pool-owner-claim/fixtures.mjs
  node f05/consultation-assignee-sla/integration-before-v26.mjs 2>&1 | tee f05/integrated-readiness-audit/artifacts/source/audit-before-v26.log
  node f05/consultation-assignee-sla/runner.mjs --inject-rollback
  node f05/consultation-assignee-sla/runner.mjs --apply
  node f05/consultation-assignee-sla/runner.mjs --verify
  node f05/consultation-assignee-sla/fixtures.mjs
  node f05/consultation-assignee-sla/runner.mjs --verify
 ;;
esac
