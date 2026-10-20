#!/usr/bin/env bash
set -euo pipefail
branch='feat/f06-real-lock-transaction-http-pg16-01'
parent='feat/f06-real-deposit-ledger-http-pg16-01'
f06a='feat/f06-3a-deposit-ledger-ci'
f06b='feat/f06-3b-lock-transaction-ci'
f06c='feat/f06-3c1-refund-pending-close-ci'
base='engineering/f06/lock-transaction-http-pg16'
test "$GITHUB_REPOSITORY" = 'suzhe868-arch/mb'
test "$GITHUB_REF" = "refs/heads/$branch"
test "$GITHUB_REF_NAME" = "$branch"
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test "$CI" = true
test "$APP_ENV" = test
test "$NODE_ENV" = test
test "$API_HOST" = 127.0.0.1
test "$F06_TX_TEST_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY'
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
export F06_TX_ENTRY_REF="$GITHUB_REF" F06_TX_ENTRY_BRANCH="$GITHUB_REF_NAME"
export F06_TX_ENTRY_SHA="$GITHUB_SHA" F06_TX_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_TX_ENTRY_EVENT="$GITHUB_EVENT_NAME"
export F03_1_DATABASE_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
export F06_LOCK_DATABASE_URL='postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test'
mkdir -p "$base/evidence"
node "$base/trigger-preflight.mjs"
check_tap(){
 local f="$1" want="$2" n pass fail skip cancel
 test -s "$f"
 n="$(awk '/^# tests /{x=$3}END{print x+0}' "$f")"
 pass="$(awk '/^# pass /{x=$3}END{print x+0}' "$f")"
 fail="$(awk '/^# fail /{x=$3}END{print x+0}' "$f")"
 skip="$(awk '/^# skipped /{x=$3}END{print x+0}' "$f")"
 cancel="$(awk '/^# cancelled /{x=$3}END{print x+0}' "$f")"
 test "$n" -ge "$want" && test "$n" -eq "$pass" && test "$fail" -eq 0 && test "$skip" -eq 0 && test "$cancel" -eq 0
 echo "F06_TX_TAP_PASS file=$f tests=$n pass=$pass fail=0 skipped=0 cancelled=0"
}
# The official approved Deposit suite is re-run, not paraphrased as inherited.
# Its own 257-item guards, signed 161-table Manifest, restores and native PG16
# produce one authoritative proof under THIS true Run and SHA.
env GITHUB_REF="refs/heads/$parent" GITHUB_REF_NAME="$parent" \
 bash engineering/f06/deposit-ledger-http-pg16/ci-job.sh 2>&1 | tee "$base/evidence/INHERITED_DEPOSIT_257_RUN.log"
grep -q "READY_FOR_A_REVIEW branch=$parent head=$GITHUB_SHA run_id=$GITHUB_RUN_ID" "$base/evidence/INHERITED_DEPOSIT_257_RUN.log"
echo F06_TX_INHERITED_257_GATES_SAME_SHA_PASS
id="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$id" | sed '/^$/d' | wc -l)" -eq 1
# Clone the exact signed pristine parent into another physical PG16 database,
# preserving the audited original and the independent audit-copy database.
dump="/tmp/f06-tx-parent-$GITHUB_RUN_ID.dump"
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 pg_dump -h127.0.0.1 -Uf03_ci -d"f03_auth_restore_$GITHUB_RUN_ID" --format=custom --no-owner --no-privileges > "$dump"
test -s "$dump"
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "ALTER DATABASE f03_auth_test RENAME TO f03_auth_f05_history_$GITHUB_RUN_ID"
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'CREATE DATABASE f03_auth_test OWNER f03_ci'
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 pg_restore -h127.0.0.1 -Uf03_ci -df03_auth_test --no-owner --no-privileges < "$dump"
# Only post-parent scenario source is mutable; parent seal and audit copy remain.
env GITHUB_REF="refs/heads/$f06a" GITHUB_REF_NAME="$f06a" \
 node engineering/f06/deposit-ledger-ci/runner.mjs --apply
# Native, frozen F06-3B -> F06-3C1 signature chain is applied only to
# the disposable transaction experiment, after restoring the original
# signed 161-table parent. Neither parent nor public DDL is modified.
env GITHUB_REF="refs/heads/$f06b" GITHUB_REF_NAME="$f06b" \
 node engineering/f06/lock-transaction-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$f06b" GITHUB_REF_NAME="$f06b" \
 node engineering/f06/lock-transaction-ci/runner.mjs --verify
env GITHUB_REF="refs/heads/$f06c" GITHUB_REF_NAME="$f06c" \
 node engineering/f06/refund-pending-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$f06c" GITHUB_REF_NAME="$f06c" \
 node engineering/f06/refund-pending-ci/runner.mjs --verify
echo F06_TX_TRUSTED_REFUND_3C1_NATIVE_SIGNED_PARENT_PASS
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 psql -h127.0.0.1 -Uf03_ci -df03_auth_test -X -v ON_ERROR_STOP=1 < "$base/sidecar.sql"
env GITHUB_REF="refs/heads/$f06a" GITHUB_REF_NAME="$f06a" \
 node --test "$base/tests/http.test.mjs" 2>&1 | tee "$base/evidence/TRANSACTION_HTTP_PG16_TAP.log"
check_tap "$base/evidence/TRANSACTION_HTTP_PG16_TAP.log" 52
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
 -keyout /tmp/f06-real-transaction-key.pem -out /tmp/f06-real-transaction-cert.pem \
 -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-real-transaction-key.pem
env GITHUB_REF="refs/heads/$f06a" GITHUB_REF_NAME="$f06a" \
 node --test "$base/tests/https.test.mjs" 2>&1 | tee "$base/evidence/TRANSACTION_TLS_DENY_TAP.log"
check_tap "$base/evidence/TRANSACTION_TLS_DENY_TAP.log" 9
# Destroy the mutable Transaction DB. Real restored DB gets a DIFFERENT OID.
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'DROP DATABASE f03_auth_test WITH (FORCE)'
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_tx_restored_$GITHUB_RUN_ID OWNER f03_ci"
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 pg_restore -h127.0.0.1 -Uf03_ci -d"f03_auth_tx_restored_$GITHUB_RUN_ID" --no-owner --no-privileges < "$dump"
# Native Deposit audit verifies the *entire* current signed 161-table parent
# against its untouched independent audit copy and immutable same-Run PASS.
export F06_REAL_ENTRY_REF="refs/heads/$parent" F06_REAL_ENTRY_BRANCH="$parent"
export F06_REAL_ENTRY_SHA="$GITHUB_SHA" F06_REAL_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_REAL_ENTRY_EVENT=push
export F03_1_DATABASE_URL="postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_tx_restored_$GITHUB_RUN_ID"
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_audit_$GITHUB_RUN_ID"
# Parent Deposit already created an immutable after file in this same Run.
# Preserve it under a distinct name, never overwrite or delete that evidence.
old_seal='engineering/f06/deposit-ledger-http-pg16/evidence/parent-seal-after.json'
test -s "$old_seal"
mv "$old_seal" "$base/evidence/INHERITED_DEPOSIT_PARENT_SEAL_AFTER.json"
test -s "$base/evidence/INHERITED_DEPOSIT_PARENT_SEAL_AFTER.json"
env GITHUB_REF="refs/heads/$f06a" GITHUB_REF_NAME="$f06a" \
 node engineering/f06/deposit-ledger-http-pg16/audit-seal.mjs after
test -s "$old_seal"
echo F06_TX_INDEPENDENT_NEW_OID_SIGNED_PARENT_RESTORED_PASS
node "$base/trigger-preflight.mjs"
echo "READY_FOR_A_REVIEW branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo 'PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP and PRODUCTION_FINANCIAL_CARRIER_GAP remain open.'
