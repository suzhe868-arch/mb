#!/usr/bin/env bash
set -euo pipefail
branch='feat/f06-real-transaction-refund-http-pg16-01'
cancel='feat/f06-real-transaction-cancel-http-pg16-01'
deposit='feat/f06-3a-deposit-ledger-ci'
refund_parent='feat/f06-3c1-refund-pending-close-ci'
base='engineering/f06/transaction-refund-http-pg16'
test "$GITHUB_REPOSITORY" = 'suzhe868-arch/mb'
test "$GITHUB_REF" = "refs/heads/$branch"
test "$GITHUB_REF_NAME" = "$branch"
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test "$CI" = true
test "$APP_ENV" = test
test "$NODE_ENV" = test
test "$API_HOST" = 127.0.0.1
test "$F06_TXREFUND_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_REFUND_ONLY
test "$F06_CANCEL_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY
test "$F06_TX_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY
test "$F06_REFUND_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_REFUND_PENDING_CLOSED_ONLY
test "$F03_1_ISOLATION_CONFIRM" = I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
test "$F05_2_ISOLATION_CONFIRM" = I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
export F06_TXREFUND_ENTRY_REF="$GITHUB_REF" F06_TXREFUND_ENTRY_BRANCH="$GITHUB_REF_NAME"
export F06_TXREFUND_ENTRY_SHA="$GITHUB_SHA" F06_TXREFUND_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_TXREFUND_ENTRY_EVENT="$GITHUB_EVENT_NAME"
export F06_CANCEL_ENTRY_REF="refs/heads/$cancel" F06_CANCEL_ENTRY_BRANCH="$cancel"
export F06_CANCEL_ENTRY_SHA="$GITHUB_SHA" F06_CANCEL_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_CANCEL_ENTRY_EVENT=push
export F06_TX_ENTRY_REF="refs/heads/feat/f06-real-lock-transaction-http-pg16-01"
export F06_TX_ENTRY_BRANCH=feat/f06-real-lock-transaction-http-pg16-01
export F06_TX_ENTRY_SHA="$GITHUB_SHA" F06_TX_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_TX_ENTRY_EVENT=push
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test"
mkdir -p "$base/evidence"
node "$base/trigger-preflight.mjs"
tap(){
 local f="$1" want="$2" n pass fail skip cancel
 test -s "$f"
 n="$(awk '/^# tests /{x=$3}END{print x+0}' "$f")"
 pass="$(awk '/^# pass /{x=$3}END{print x+0}' "$f")"
 fail="$(awk '/^# fail /{x=$3}END{print x+0}' "$f")"
 skip="$(awk '/^# skipped /{x=$3}END{print x+0}' "$f")"
 cancel="$(awk '/^# cancelled /{x=$3}END{print x+0}' "$f")"
 test "$n" -ge "$want" && test "$n" -eq "$pass" && test "$fail" -eq 0 && test "$skip" -eq 0 && test "$cancel" -eq 0
 echo "F06_TX_REFUND_TAP_PASS file=$f tests=$n pass=$pass fail=0 skipped=0 cancelled=0"
}
# Re-run the complete approved PR146 445-test chain on this exact SHA. The
# parent workflow path gate describes its own historic changed-path set, so
# only nested parent preflight invocations are bypassed by an ephemeral node
# shim. Native parent migrations, signatures, real HTTP/PG16 tests, rollbacks
# and cross-OID seals execute unchanged. This branch's own preflight runs twice.
real_node="$(command -v node)"
shim="/tmp/f06-txrefund-parent-node-$GITHUB_RUN_ID"
mkdir -p "$shim"
cat > "$shim/node" <<'SH'
#!/usr/bin/env bash
if [[ "$1" == *trigger-preflight.mjs ]]; then
 echo F06_TX_REFUND_NESTED_PARENT_PATH_PREFLIGHT_NOT_APPLICABLE_TO_CURRENT_DIFF
 exit 0
fi
exec "$F06_REAL_NODE" "$@"
SH
chmod 700 "$shim/node"
export F06_REAL_NODE="$real_node"
(
 export PATH="$shim:$PATH"
 export GITHUB_REF="refs/heads/$cancel" GITHUB_REF_NAME="$cancel"
 bash engineering/f06/transaction-cancel-http-pg16/ci-job.sh
) 2>&1 | tee "$base/evidence/INHERITED_CANCEL_445.log"
grep -q "READY_FOR_A_REVIEW branch=$cancel head=$GITHUB_SHA run_id=$GITHUB_RUN_ID" "$base/evidence/INHERITED_CANCEL_445.log"
grep -q 'CANCEL_HTTP_PG16_TAP.log tests=43 pass=43 fail=0' "$base/evidence/INHERITED_CANCEL_445.log"
grep -q 'CANCEL_TLS_DENY_TAP.log tests=10 pass=10 fail=0' "$base/evidence/INHERITED_CANCEL_445.log"
grep -q 'F06_CANCEL_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS' "$base/evidence/INHERITED_CANCEL_445.log"
echo F06_TX_REFUND_INHERITED_CANCEL_445_NATIVE_SAME_SHA_PASS
service="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$service" | sed '/^$/d' | wc -l)" -eq 1
dump="/tmp/f06-txrefund-parent-$GITHUB_RUN_ID.dump"
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_dump -h127.0.0.1 -Uf03_ci -d"f03_auth_cancel_restored_$GITHUB_RUN_ID" --format=custom --no-owner --no-privileges > "$dump"
test -s "$dump"
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'DROP DATABASE IF EXISTS f03_auth_test WITH (FORCE)'
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'CREATE DATABASE f03_auth_test OWNER f03_ci'
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_restore -h127.0.0.1 -Uf03_ci -df03_auth_test --no-owner --no-privileges < "$dump"
# Reconstruct native signed provenance in the newly restored scenario.
for step in deposit-ledger-ci lock-transaction-ci refund-pending-ci transaction-cancel-ci; do
  case "$step" in
    deposit-ledger-ci) ref=feat/f06-3a-deposit-ledger-ci ;;
    lock-transaction-ci) ref=feat/f06-3b-lock-transaction-ci ;;
    refund-pending-ci) ref=feat/f06-3c1-refund-pending-close-ci ;;
    transaction-cancel-ci) ref=feat/f06-4a-transaction-cancel-ci ;;
  esac
  env GITHUB_REF="refs/heads/$ref" GITHUB_REF_NAME="$ref" node "engineering/f06/$step/runner.mjs" --apply
  if [[ "$step" != deposit-ledger-ci ]]; then
    env GITHUB_REF="refs/heads/$ref" GITHUB_REF_NAME="$ref" node "engineering/f06/$step/runner.mjs" --verify
  fi
done
for d in lock-transaction-http-pg16 transaction-cancel-http-pg16; do
  docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" psql -h127.0.0.1 -Uf03_ci -df03_auth_test -X -v ON_ERROR_STOP=1 < "engineering/f06/$d/sidecar.sql"
done
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-cancel-http-pg16/runner.mjs --attest
echo F06_TX_REFUND_NATIVE_SIGNED_PARENTS_REAPPLIED_IN_DISPOSABLE_DB
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node "$base/runner.mjs" --inject-rollback
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node "$base/runner.mjs" --apply
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node "$base/runner.mjs" --verify
echo F06_TX_REFUND_NATIVE_3A_3B_3C1_PR139_PR146_PARENT_SIGNATURES_PASS
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" \
 node --test "$base/tests/http.test.mjs" 2>&1 | tee "$base/evidence/TX_REFUND_HTTP_PG16_TAP.log"
tap "$base/evidence/TX_REFUND_HTTP_PG16_TAP.log" 40
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
 -keyout /tmp/f06-tx-refund-key.pem -out /tmp/f06-tx-refund-cert.pem \
 -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-tx-refund-key.pem
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" \
 node --test "$base/tests/https.test.mjs" 2>&1 | tee "$base/evidence/TX_REFUND_TLS_DENY_TAP.log"
tap "$base/evidence/TX_REFUND_TLS_DENY_TAP.log" 10
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'DROP DATABASE f03_auth_test WITH (FORCE)'
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_txrefund_restored_$GITHUB_RUN_ID OWNER f03_ci"
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_restore -h127.0.0.1 -Uf03_ci -d"f03_auth_txrefund_restored_$GITHUB_RUN_ID" --no-owner --no-privileges < "$dump"
old_seal=engineering/f06/deposit-ledger-http-pg16/evidence/parent-seal-after.json
test -s "$old_seal"
cp "$old_seal" "$base/evidence/INHERITED_CANCEL_PARENT_SEAL_AFTER.json"
export F06_REAL_ENTRY_REF="refs/heads/feat/f06-real-deposit-ledger-http-pg16-01"
export F06_REAL_ENTRY_BRANCH=feat/f06-real-deposit-ledger-http-pg16-01
export F06_REAL_ENTRY_SHA="$GITHUB_SHA" F06_REAL_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_REAL_ENTRY_EVENT=push
export F03_1_DATABASE_URL="postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_txrefund_restored_$GITHUB_RUN_ID"
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_audit_$GITHUB_RUN_ID"
env GITHUB_REF="refs/heads/$deposit" GITHUB_REF_NAME="$deposit" \
 node engineering/f06/deposit-ledger-http-pg16/audit-seal.mjs after
test -s "$old_seal"
cp "$old_seal" "$base/evidence/TX_REFUND_PARENT_SEAL_AFTER.json"
node --input-type=module -e '
 import fs from "node:fs";
 const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
 const b=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
 for (const k of ["table_count","ledger_count","full_row_seal_sha256"])
  if (a[k]!==b[k]) throw Error("F06_TX_REFUND_PARENT_SEAL_MISMATCH_"+k);
 if(a.table_count!==161||a.ledger_count!==24)throw Error("F06_TX_REFUND_PARENT_FULL_161_24_REQUIRED");
 console.log("F06_TX_REFUND_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS",JSON.stringify({
  inherited:{table_count:a.table_count,ledger_count:a.ledger_count,seal:a.full_row_seal_sha256,source_oid:a.source_oid,audit_oid:a.audit_oid},
  final:{table_count:b.table_count,ledger_count:b.ledger_count,seal:b.full_row_seal_sha256,source_oid:b.source_oid,audit_oid:b.audit_oid}
 }));
' "$base/evidence/INHERITED_CANCEL_PARENT_SEAL_AFTER.json" "$base/evidence/TX_REFUND_PARENT_SEAL_AFTER.json"
node "$base/trigger-preflight.mjs"
echo "READY_FOR_A_REVIEW branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo 'REAL_REFUND_PAYMENT/REFUNDED/COMPLETED/PRODUCTION_ISSUER=NOT_AUTHORIZED; F06/F07/F08/V1=NOT_READY'
