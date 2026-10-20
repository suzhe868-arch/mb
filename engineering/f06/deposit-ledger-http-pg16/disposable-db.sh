#!/usr/bin/env bash
set -euo pipefail
mode="§{1:-}"
case "$mode" in prepare|restore-source);; *) exit 64;; esac
test "$GITHUB_REPOSITORY" = 'suzhe868-arch/mb'
test "$GITHUB_ACTIONS" = 'true'
test "$GITHUB_EVENT_NAME" = 'push'
[[ "$GITHUB_RUN_ID" =~ ^[0-9]{6,20}$ ]]
dump="/tmp/f06-real-deposit-http-$GITHUB_RUN_ID.dump"
audit_db="f06_lock_audit_$GITHUB_RUN_ID"
restored_db="f03_auth_restore_$GITHUB_RUN_ID"
ids="$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')"
test -n "$ids"
test "$(printf '%s\n' "$ids" | wc -l | tr -d ' ')" = '1'
if [[ "$mode" = prepare ]]; then
  test ! -e "$dump"
  docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" \
    pg_dump -h 127.0.0.1 -U f03_ci -d f03_auth_test --format=custom --no-owner --no-privileges > "$dump"
  test -s "$dump"
  docker exec -e PGPASSWORD=disposable_bootstrap_only "$ids" \
    psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c "CREATE DATABASE $audit_db OWNER f06_lock_ci"
  docker exec -i -e PGPASSWORD=f06_ci_synthetic_only "$ids" \
    pg_restore -h 127.0.0.1 -U f06_lock_ci -d "$audit_db" --no-owner --no-privileges --exit-on-error < "$dump"
  echo "F06_REAL_DEPOSIT_DISPOSABLE_PARENT_COPY_READY database=$audit_db dump=$dump"
else
  test -s "$dump"
  docker exec -e PGPASSWORD=disposable_bootstrap_only "$ids" \
    psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c "CREATE DATABASE $restored_db OWNER f03_ci"
  docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$ids" \
    pg_restore -h 127.0.0.1 -U f03_ci -d "$restored_db" --no-owner --no-privileges --exit-on-error < "$dump"
  echo "F06_REAL_DEPOSIT_SOURCE_RESTORED_NEW_OID database=$restored_db dump=$dump"
fi
