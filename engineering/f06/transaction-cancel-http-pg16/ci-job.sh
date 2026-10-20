#!/usr/bin/env bash
set -euo pipefail
branch=feat/f06-real-transaction-cancel-http-pg16-01
prior=feat/f06-real-refund-pending-closed-http-pg16-01
deposit=feat/f06-3a-deposit-ledger-ci
b=feat/f06-3b-lock-transaction-ci
refund=feat/f06-3c1-refund-pending-close-ci
four_a=feat/f06-4a-transaction-cancel-ci
base=engineering/f06/transaction-cancel-http-pg16
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = "refs/heads/$branch"
test "$GITHUB_REF_NAME" = "$branch"
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test "$CI" = true
test "$APP_ENV" = test
test "$NODE_ENV" = test
test "$API_HOST" = 127.0.0.1
test "$F06_CANCEL_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY
test "$F03_1_ISOLATION_CONFIRM" = I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
test "$F05_2_ISOLATION_CONFIRM" = I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
export F06_CANCEL_ENTRY_REF="$GITHUB_REF" F06_CANCEL_ENTRY_BRANCH="$GITHUB_REF_NAME"
export F06_CANCEL_ENTRY_SHA="$GITHUB_SHA" F06_CANCEL_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_CANCEL_ENTRY_EVENT="$GITHUB_EVENT_NAME"
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export F06_LOCK_DATABASE_URL=postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test
mkdir -p "$base/evidence"
node "$base/trigger-preflight.mjs"
tap(){
 local file="$1" minimum="$2" n pass fail skip cancel
 n=$(awk '/^# tests /{x=$3}END{print x+0}' "$file")
 pass=$(awk '/^# pass /{x=$3}END{print x+0}' "$file")
 fail=$(awk '/^# fail /{x=$3}END{print x+0}' "$file")
 skip=$(awk '/^# skipped /{x=$3}END{print x+0}' "$file")
 cancel=$(awk '/^# cancelled /{x=$3}END{print x+0}' "$file")
 test "$n" -ge "$minimum" && test "$n" -eq "$pass" && test "$fail" -eq 0 && test "$skip" -eq 0 && test "$cancel" -eq 0
 echo "F06_CANCEL_TAP_PASS file=$file tests=$n pass=$pass fail=0 skipped=0 cancelled=0"
}
# Native, UNCHANGED, complete parent PR143: 392 original tests, 161 frozen
# signed parent tables, 24 migration ledger and multiple real PG16 restores.
env GITHUB_REF="refs/heads/$prior" GITHUB_REF_NAME="$prior" \
 bash engineering/f06/refund-pending-closed-http-pg16/ci-job.sh 2>&1 | tee "$base/evidence/INHERITED_REFUND_392.log"
grep -q "READY_FOR_A_REVIEW branch=$prior head=$GITHUB_SHA run_id=$GITHUB_RUN_ID" "$base/evidence/INHERITED_REFUND_392.log"
grep -q 'REFUND_HTTP_PG16_TAP.log tests=63 pass=63 fail=0' "$base/evidence/INHERITED_REFUND_392.log"
grep -q 'REFUND_TLS_DENY_TAP.log tests=10 pass=10 fail=0' "$base/evidence/INHERITED_REFUND_392.log"
echo F06_CANCEL_INHERITED_392_NATIVE_SAME_SHA_PASS
id="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$id" | sed '/^$/d' | wc -l)" -eq 1
dump="/tmp/f06-cancel-parent-$GITHUB_RUN_ID.dump"
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 pg_dump -h127.0.0.1 -Uf03_ci -d"f03_auth_refund_restored_$GITHUB_RUN_ID" --format=custom --no-owner --no-privileges > "$dump"
test -s "$dump"
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres -c 'CREATE DATABASE f03_auth_test OWNER f03_ci'
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 pg_restore -h127.0.0.1 -Uf03_ci -df03_auth_test --no-owner --no-privileges < "$dump"
# Real native signed lineage, never fake 3B transaction origins.
env GITHUB_REF="refs/heads/$deposit" GITHUB_REF_NAME="$deposit" \
 node engineering/f06/deposit-ledger-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$b" GITHUB_REF_NAME="$b" \
 node engineering/f06/lock-transaction-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$b" GITHUB_REF_NAME="$b" \
 node engineering/f06/lock-transaction-ci/runner.mjs --verify
env GITHUB_REF="refs/heads/$refund" GITHUB_REF_NAME="$refund" \
 node engineering/f06/refund-pending-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$refund" GITHUB_REF_NAME="$refund" \
 node engineering/f06/refund-pending-ci/runner.mjs --verify
# Apply frozen 4A only to prove OLD cancellation is incompatible with PR139
# origins; never write or impersonate f06_3b_ci.transaction_origins.
env GITHUB_REF="refs/heads/$four_a" GITHUB_REF_NAME="$four_a" \
 node engineering/f06/transaction-cancel-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$four_a" GITHUB_REF_NAME="$four_a" \
 node engineering/f06/transaction-cancel-ci/runner.mjs --verify
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 psql -h127.0.0.1 -Uf03_ci -df03_auth_test -X -v ON_ERROR_STOP=1 \
 < engineering/f06/lock-transaction-http-pg16/sidecar.sql
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 psql -h127.0.0.1 -Uf03_ci -df03_auth_test -X -v ON_ERROR_STOP=1 < "$base/sidecar.sql"
env GITHUB_REF="refs/heads/$refund" GITHUB_REF_NAME="$refund" \
 node "$base/runner.mjs" --attest
echo F06_CANCEL_NATIVE_3B_3C1_4A_VERIFIED_REAL_TX_SOURCE_BOUND_PASS
env GITHUB_REF="refs/heads/$deposit" GITHUB_REF_NAME="$deposit" \
 node --test "$base/tests/http.test.mjs" 2>&1 | tee "$base/evidence/CANCEL_HTTP_PG16_TAP.log"
tap "$base/evidence/CANCEL_HTTP_PG16_TAP.log" 32
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
 -keyout /tmp/f06-cancel-key.pem -out /tmp/f06-cancel-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-cancel-key.pem
env GITHUB_REF="refs/heads/$deposit" GITHUB_REF_NAME="$deposit" \
 node --test "$base/tests/https.test.mjs" 2>&1 | tee "$base/evidence/CANCEL_TLS_DENY_TAP.log"
tap "$base/evidence/CANCEL_TLS_DENY_TAP.log" 9
# Destroy mutation environment. Restore and independently verify ALL 161
# original parent table COUNT/MD5 and Run-specific cross-OID Seal.
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres -c 'DROP DATABASE f03_auth_test WITH (FORCE)'
docker exec "$id" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_cancel_restored_$GITHUB_RUN_ID OWNER f03_ci"
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$id" \
 pg_restore -h127.0.0.1 -Uf03_ci -d"f03_auth_cancel_restored_$GITHUB_RUN_ID" --no-owner --no-privileges < "$dump"
export F06_REAL_ENTRY_REF=refs/heads/feat/f06-real-deposit-ledger-http-pg16-01
export F06_REAL_ENTRY_BRANCH=feat/f06-real-deposit-ledger-http-pg16-01
export F06_REAL_ENTRY_SHA="$GITHUB_SHA" F06_REAL_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_REAL_ENTRY_EVENT=push
export F03_1_DATABASE_URL="postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_cancel_restored_$GITHUB_RUN_ID"
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_audit_$GITHUB_RUN_ID"
old_seal=engineering/f06/deposit-ledger-http-pg16/evidence/parent-seal-after.json
test -s "$old_seal"
mv "$old_seal" "$base/evidence/INHERITED_REFUND_PARENT_SEAL_AFTER.json"
env GITHUB_REF="refs/heads/$deposit" GITHUB_REF_NAME="$deposit" \
 node engineering/f06/deposit-ledger-http-pg16/audit-seal.mjs after
test -s "$old_seal"
echo F06_CANCEL_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS
node "$base/trigger-preflight.mjs"
echo "READY_FOR_A_REVIEW branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo 'F06/F07/F08/V1 NOT_READY; REAL_PAYMENT_AND_REFUND_NOT_WIRED.'
