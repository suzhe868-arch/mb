#!/usr/bin/env bash
set -euo pipefail
branch='feat/f06-real-refund-pending-closed-http-pg16-01'
prior='feat/f06-real-lock-transaction-http-pg16-01'
dep='feat/f06-3a-deposit-ledger-ci'
f06b='feat/f06-3b-lock-transaction-ci'
f06c='feat/f06-3c1-refund-pending-close-ci'
base='engineering/f06/refund-pending-closed-http-pg16'
test "$GITHUB_REPOSITORY" = 'suzhe868-arch/mb'
test "$GITHUB_REF" = "refs/heads/$branch"
test "$GITHUB_REF_NAME" = "$branch"
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test "$CI" = true
test "$APP_ENV" = test
test "$NODE_ENV" = test
test "$API_HOST" = 127.0.0.1
test "$F06_REFUND_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_REFUND_PENDING_CLOSED_ONLY
test "$F03_1_ISOLATION_CONFIRM" = I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
test "$F05_2_ISOLATION_CONFIRM" = I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
export F06_REFUND_ENTRY_REF="$GITHUB_REF" F06_REFUND_ENTRY_BRANCH="$GITHUB_REF_NAME"
export F06_REFUND_ENTRY_SHA="$GITHUB_SHA" F06_REFUND_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_REFUND_ENTRY_EVENT="$GITHUB_EVENT_NAME"
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export F06_LOCK_DATABASE_URL=postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test
mkdir -p "$base/evidence"
node "$base/trigger-preflight.mjs"
tap(){
 local path="$1" want="$2" count passed fail skip cancel
 count=$(awk '/^# tests /{x=$3}END{print x+0}' "$path")
 passed=$(awk '/^# pass /{x=$3}END{print x+0}' "$path")
 fail=$(awk '/^# fail /{x=$3}END{print x+0}' "$path")
 skip=$(awk '/^# skipped /{x=$3}END{print x+0}' "$path")
 cancel=$(awk '/^# cancelled /{x=$3}END{print x+0}' "$path")
 test "$count" -ge "$want" && test "$passed" -eq "$count" && test "$fail" -eq 0 && test "$skip" -eq 0 && test "$cancel" -eq 0
 echo "F06_REFUND_TAP_PASS file=$path tests=$count pass=$passed fail=0 skipped=0 cancelled=0"
}
# Complete inherited F06 PR139 319 tests and unchanged parent native 161-table seal
# in THIS exact GitHub Push HEAD, not a previous-run count or mocked pass.
env GITHUB_REF="refs/heads/$prior" GITHUB_REF_NAME="$prior" \
 bash engineering/f06/lock-transaction-http-pg16/ci-job.sh 2>&1 | tee "$base/evidence/INHERITED_TRANSACTION_319.log"
grep -q "READY_FOR_A_REVIEW branch=$prior head=$GITHUB_SHA run_id=$GITHUB_RUN_ID" "$base/evidence/INHERITED_TRANSACTION_319.log"
grep -q 'TRANSACTION_HTTP_PG16_TAP.log tests=53 pass=53 fail=0' "$base/evidence/INHERITED_TRANSACTION_319.log"
grep -q 'TRANSACTION_TLS_DENY_TAP.log tests=9 pass=9 fail=0' "$base/evidence/INHERITED_TRANSACTION_319.log"
echo F06_REFUND_NATIVE_INHERITED_319_SAME_SHA_PASS
service="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$service" | sed '/^$/d' | wc -l)" -eq 1
# PR139 ends with a pristine independently restored PG database. Clone it
# into a NEW physical scenario OID, preserving previous source and audit copy.
dump="/tmp/f06-refund-parent-$GITHUB_RUN_ID.dump"
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_dump -h127.0.0.1 -Uf03_ci -d"f03_auth_tx_restored_$GITHUB_RUN_ID" --format=custom --no-owner --no-privileges > "$dump"
test -s "$dump"
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_test OWNER f03_ci"
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_restore -h127.0.0.1 -Uf03_ci -df03_auth_test --no-owner --no-privileges < "$dump"
# The original signed sidecars are applied by their original runners in
# disposable f03_auth_test, never through hand-written refund origin rows.
env GITHUB_REF="refs/heads/$dep" GITHUB_REF_NAME="$dep" \
 node engineering/f06/deposit-ledger-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$f06b" GITHUB_REF_NAME="$f06b" \
 node engineering/f06/lock-transaction-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$f06b" GITHUB_REF_NAME="$f06b" \
 node engineering/f06/lock-transaction-ci/runner.mjs --verify
env GITHUB_REF="refs/heads/$f06c" GITHUB_REF_NAME="$f06c" \
 node engineering/f06/refund-pending-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$f06c" GITHUB_REF_NAME="$f06c" \
 node engineering/f06/refund-pending-ci/runner.mjs --verify
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 psql -h127.0.0.1 -Uf03_ci -df03_auth_test -X -v ON_ERROR_STOP=1 \
 < engineering/f06/lock-transaction-http-pg16/sidecar.sql
echo F06_REFUND_NATIVE_3B_3C1_SIGNED_SIDECAR_PARENT_PASS
# The HTTP server itself always sees the actual NEW branch in ENTRY_*;
# historic parent GITHUB_REF is set only in this scoped Node subprocess.
env GITHUB_REF="refs/heads/$dep" GITHUB_REF_NAME="$dep" \
 node --test "$base/tests/http.test.mjs" 2>&1 | tee "$base/evidence/REFUND_HTTP_PG16_TAP.log"
tap "$base/evidence/REFUND_HTTP_PG16_TAP.log" 32
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
 -keyout /tmp/f06-refund-ci-key.pem -out /tmp/f06-refund-ci-cert.pem \
 -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-refund-ci-key.pem
env GITHUB_REF="refs/heads/$dep" GITHUB_REF_NAME="$dep" \
 node --test "$base/tests/https.test.mjs" 2>&1 | tee "$base/evidence/REFUND_TLS_DENY_TAP.log"
tap "$base/evidence/REFUND_TLS_DENY_TAP.log" 9
# Destructively dispose of ONLY the synthetic Refund scenario database;
# verify restored parent snapshot against its actual same-Run full Manifest.
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'DROP DATABASE f03_auth_test WITH (FORCE)'
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_refund_restored_$GITHUB_RUN_ID OWNER f03_ci"
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_restore -h127.0.0.1 -Uf03_ci -d"f03_auth_refund_restored_$GITHUB_RUN_ID" --no-owner --no-privileges < "$dump"
export F06_REAL_ENTRY_REF="refs/heads/feat/f06-real-deposit-ledger-http-pg16-01"
export F06_REAL_ENTRY_BRANCH="feat/f06-real-deposit-ledger-http-pg16-01"
export F06_REAL_ENTRY_SHA="$GITHUB_SHA" F06_REAL_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_REAL_ENTRY_EVENT=push
export F03_1_DATABASE_URL="postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_refund_restored_$GITHUB_RUN_ID"
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_audit_$GITHUB_RUN_ID"
oldseal=engineering/f06/deposit-ledger-http-pg16/evidence/parent-seal-after.json
test -s "$oldseal"
mv "$oldseal" "$base/evidence/INHERITED_TRANSACTION_PARENT_SEAL_AFTER.json"
env GITHUB_REF="refs/heads/$dep" GITHUB_REF_NAME="$dep" \
 node engineering/f06/deposit-ledger-http-pg16/audit-seal.mjs after
test -s "$oldseal"
echo F06_REFUND_DIFFERENT_OID_161_TABLE_FULL_SIGNED_PARENT_RESTORED_PASS
node "$base/trigger-preflight.mjs"
echo "READY_FOR_A_REVIEW branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo 'F06_REFUND_REAL_MONEY_ISSUER_NOT_WIRED; F06/F07/F08/V1 NOT_READY.'
