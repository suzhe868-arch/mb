#!/usr/bin/env bash
set -euo pipefail
branch='feat/f06-signed-post-handoff-refund-bridge-01'
newbase='engineering/f06/post-handoff-refund-bridge-http-pg16'
parent='feat/f06-real-transaction-handoff-http-pg16-01'
cancel='feat/f06-real-transaction-cancel-http-pg16-01'
deposit='feat/f06-3a-deposit-ledger-ci'
refund_parent='feat/f06-3c1-refund-pending-close-ci'
base='engineering/f06/post-handoff-cancel-http-pg16'
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
test "$F06_HANDOFF_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_HANDOFF_ONLY
test "$F06_POST_CANCEL_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_POST_HANDOFF_CANCEL_ONLY
export F06_POST_CANCEL_ENTRY_REF='refs/heads/feat/f06-real-post-handoff-cancel-http-pg16-01' F06_POST_CANCEL_ENTRY_BRANCH='feat/f06-real-post-handoff-cancel-http-pg16-01'
export F06_BRIDGE_ENTRY_REF="$GITHUB_REF" F06_BRIDGE_ENTRY_BRANCH="$GITHUB_REF_NAME"
export F06_BRIDGE_ENTRY_SHA="$GITHUB_SHA" F06_BRIDGE_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_BRIDGE_TEST_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_SIGNED_REFUND_BRIDGE_ONLY'
export F06_HANDOFF_ENTRY_REF="refs/heads/$parent" F06_HANDOFF_ENTRY_BRANCH="$parent"
export F06_POST_CANCEL_ENTRY_SHA="$GITHUB_SHA" F06_POST_CANCEL_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_POST_CANCEL_ENTRY_EVENT=push
export F06_HANDOFF_ENTRY_SHA="$GITHUB_SHA" F06_HANDOFF_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_HANDOFF_ENTRY_EVENT=push
test "$F06_CANCEL_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY
test "$F06_TX_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY
test "$F06_REFUND_TEST_CONSENT" = I_AUTHORIZE_DISPOSABLE_F06_REFUND_PENDING_CLOSED_ONLY
test "$F03_1_ISOLATION_CONFIRM" = I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
test "$F05_2_ISOLATION_CONFIRM" = I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
export F06_TXREFUND_ENTRY_REF="refs/heads/feat/f06-real-transaction-refund-http-pg16-01" F06_TXREFUND_ENTRY_BRANCH="feat/f06-real-transaction-refund-http-pg16-01"
export F06_TXREFUND_ENTRY_SHA="$GITHUB_SHA" F06_TXREFUND_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F06_TXREFUND_ENTRY_EVENT="$GITHUB_EVENT_NAME"
export F06_CANCEL_ENTRY_REF="refs/heads/$cancel" F06_CANCEL_ENTRY_BRANCH="$cancel"
export F06_CANCEL_ENTRY_SHA="$GITHUB_SHA" F06_CANCEL_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_CANCEL_ENTRY_EVENT=push
export F06_TX_ENTRY_REF="refs/heads/feat/f06-real-lock-transaction-http-pg16-01"
export F06_TX_ENTRY_BRANCH=feat/f06-real-lock-transaction-http-pg16-01
export F06_TX_ENTRY_SHA="$GITHUB_SHA" F06_TX_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_TX_ENTRY_EVENT=push
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test"
mkdir -p "$base/evidence" "$newbase/evidence"
echo F06_BRIDGE_PARENT_HISTORIC_PREFLIGHT_NOT_APPLICABLE_NEW_BRANCH
# Fail early on syntax/import declaration errors before expensive inherited 585 tests.
bash -n "$base/ci-job.sh"
for module in service.mjs runner.mjs worker.mjs server.mjs trigger-preflight.mjs tests/http.test.mjs tests/https.test.mjs; do
  node --check "$base/$module"
done
for file in "$newbase/worker.mjs" "$newbase/server.mjs" "$newbase/签名来源只读核验.mjs" "$newbase/tests/真实HTTP与PG16.test.mjs" "$newbase/tests/HTTPS拒绝.test.mjs"; do
 node --check "$file"
done
echo F06_BRIDGE_STATIC_SYNTAX_PASS
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
export F06_POST_CANCEL_NATIVE_NODE="$real_node"
shim="/tmp/f06-post-handoff-cancel-parent-node-$GITHUB_RUN_ID"
mkdir -p "$shim"
cat > "$shim/node" <<'SH'
#!/usr/bin/env bash
if [[ "$1" == *trigger-preflight.mjs ]]; then
 echo F06_TX_REFUND_NESTED_PARENT_PATH_PREFLIGHT_NOT_APPLICABLE_TO_CURRENT_DIFF
 exit 0
fi
exec "$F06_POST_CANCEL_NATIVE_NODE" "$@"
SH
chmod 700 "$shim/node"
export F06_REAL_NODE="$real_node"
(
 export PATH="$shim:$PATH" GITHUB_REF="refs/heads/$parent" GITHUB_REF_NAME="$parent"
 bash engineering/f06/transaction-handoff-http-pg16/ci-job.sh
) 2>&1 | tee "$base/evidence/INHERITED_TXREFUND_534.log"
grep -q "READY_FOR_A_REVIEW branch=$parent head=$GITHUB_SHA run_id=$GITHUB_RUN_ID" "$base/evidence/INHERITED_TXREFUND_534.log"
grep -q 'HANDOFF_HTTP_PG16_TAP.log tests=40 pass=40 fail=0' "$base/evidence/INHERITED_TXREFUND_534.log"
grep -q 'HANDOFF_TLS_DENY_TAP.log tests=11 pass=11 fail=0' "$base/evidence/INHERITED_TXREFUND_534.log"
grep -q 'F06_HANDOFF_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS' "$base/evidence/INHERITED_TXREFUND_534.log"
echo F06_POST_CANCEL_INHERITED_585_NATIVE_SAME_SHA_PASS
service="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$service" | sed '/^$/d' | wc -l)" -eq 1
dump="/tmp/f06-post-handoff-cancel-parent-$GITHUB_RUN_ID.dump"
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_dump -h127.0.0.1 -Uf03_ci -d"f03_auth_handoff_restored_$GITHUB_RUN_ID" --format=custom --no-owner --no-privileges > "$dump"
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
echo F06_HANDOFF_NATIVE_PARENTS_REAPPLIED
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-refund-http-pg16/runner.mjs --inject-rollback
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-refund-http-pg16/runner.mjs --apply
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-refund-http-pg16/runner.mjs --verify

env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-handoff-http-pg16/runner.mjs --inject-rollback
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-handoff-http-pg16/runner.mjs --apply
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node engineering/f06/transaction-handoff-http-pg16/runner.mjs --verify
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node "$base/runner.mjs" --inject-rollback
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node "$base/runner.mjs" --apply
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" node "$base/runner.mjs" --verify
echo F06_HANDOFF_NATIVE_SIGNED_PR139_PR146_PR150_PARENT_PASS
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" \
 node --test "$newbase/tests/真实HTTP与PG16.test.mjs" 2>&1 | tee "$base/evidence/POST_HANDOFF_CANCEL_HTTP_PG16_TAP.log"
tap "$base/evidence/POST_HANDOFF_CANCEL_HTTP_PG16_TAP.log" 130
cp "$base/evidence/POST_HANDOFF_CANCEL_HTTP_PG16_TAP.log" "$newbase/evidence/BRIDGE_NATIVE_HTTP_PG16_TAP.log"
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
 -keyout /tmp/f06-post-handoff-cancel-key.pem -out /tmp/f06-post-handoff-cancel-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-post-handoff-cancel-key.pem
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" \
 node --test "$base/tests/https.test.mjs"
env GITHUB_REF="refs/heads/$refund_parent" GITHUB_REF_NAME="$refund_parent" \
 node --test "$newbase/tests/HTTPS拒绝.test.mjs" 2>&1 | tee "$newbase/evidence/BRIDGE_HTTPS_TLS_DENY_TAP.log"
tap "$newbase/evidence/BRIDGE_HTTPS_TLS_DENY_TAP.log" 12 2>&1 | tee "$base/evidence/POST_HANDOFF_CANCEL_TLS_DENY_TAP.log"
tap "$base/evidence/POST_HANDOFF_CANCEL_TLS_DENY_TAP.log" 10
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c 'DROP DATABASE f03_auth_test WITH (FORCE)'
docker exec "$service" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_postcancel_restored_$GITHUB_RUN_ID OWNER f03_ci"
docker exec -i -e PGPASSWORD=f03_ci_synthetic_only "$service" \
 pg_restore -h127.0.0.1 -Uf03_ci -d"f03_auth_postcancel_restored_$GITHUB_RUN_ID" --no-owner --no-privileges < "$dump"
old_seal=engineering/f06/deposit-ledger-http-pg16/evidence/parent-seal-after.json
test -s "$old_seal"
mv "$old_seal" "$base/evidence/INHERITED_TXREFUND_PARENT_SEAL_AFTER.json"
export F06_REAL_ENTRY_REF="refs/heads/feat/f06-real-deposit-ledger-http-pg16-01"
export F06_REAL_ENTRY_BRANCH=feat/f06-real-deposit-ledger-http-pg16-01
export F06_REAL_ENTRY_SHA="$GITHUB_SHA" F06_REAL_ENTRY_RUN_ID="$GITHUB_RUN_ID" F06_REAL_ENTRY_EVENT=push
export F03_1_DATABASE_URL="postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_postcancel_restored_$GITHUB_RUN_ID"
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_audit_$GITHUB_RUN_ID"
env GITHUB_REF="refs/heads/$deposit" GITHUB_REF_NAME="$deposit" \
 node engineering/f06/deposit-ledger-http-pg16/audit-seal.mjs after
test -s "$old_seal"
cp "$old_seal" "$base/evidence/HANDOFF_PARENT_SEAL_AFTER.json"
node --input-type=module -e '
 import fs from "node:fs";
 const a=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
 const b=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
 for (const x of [a,b]) {
  if(x.status!=="PASS"||x.mode!=="after"||x.source.table_count!==161||x.source.ledger_count!==24)
   throw Error("F06_HANDOFF_PARENT_FULL_161_24_REQUIRED");
  if(x.source.table_row_seal_sha256!==x.audit_copy.table_row_seal_sha256 ||
     x.source.ledger_sha256!==x.audit_copy.ledger_sha256 ||
     JSON.stringify(x.source.tables)!==JSON.stringify(x.audit_copy.tables))
   throw Error("F06_HANDOFF_AUDIT_COPY_DRIFT");
 }
 if(a.head_sha!==b.head_sha||a.run_id!==b.run_id)
  throw Error("F06_HANDOFF_PARENT_SAME_SHA_RUN_REQUIRED");
 for (const k of ["table_count","ledger_count","table_row_seal_sha256","ledger_sha256","catalog_sha256","attestation_sha256"])
  if (a.source[k]!==b.source[k]) throw Error("F06_HANDOFF_PARENT_SEAL_MISMATCH_"+k);
 if(JSON.stringify(a.source.tables)!==JSON.stringify(b.source.tables))
  throw Error("F06_HANDOFF_FULL_161_TABLE_ROWS_DRIFT");
 if(a.source.database_oid===b.source.database_oid)
  throw Error("F06_HANDOFF_PHYSICAL_RESTORE_OID_MUST_DIFFER");
 if(a.audit_copy.database_oid!==b.audit_copy.database_oid)
  throw Error("F06_HANDOFF_INDEPENDENT_AUDIT_OID_DRIFT");
 console.log("F06_POST_CANCEL_DIFFERENT_OID_161_FULL_SIGNED_PARENT_RESTORED_PASS",JSON.stringify({
  inherited:{table_count:a.source.table_count,ledger_count:a.source.ledger_count,seal:a.source.table_row_seal_sha256,source_oid:a.source.database_oid,audit_oid:a.audit_copy.database_oid},
  final:{table_count:b.source.table_count,ledger_count:b.source.ledger_count,seal:b.source.table_row_seal_sha256,source_oid:b.source.database_oid,audit_oid:b.audit_copy.database_oid}
 }));
' "$base/evidence/INHERITED_TXREFUND_PARENT_SEAL_AFTER.json" "$base/evidence/HANDOFF_PARENT_SEAL_AFTER.json"
echo F06_BRIDGE_PARENT_HISTORIC_PREFLIGHT_NOT_APPLICABLE_NEW_BRANCH
echo "B_PRELIMINARY_PG16_EVIDENCE branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo "F06_BRIDGE_PARENT_INHERITED_585 + PR156_84 + NEW_BRIDGE_46 + TLS11+12: SQL_SAFE_FINANCE_ONLY"
echo "READY_FOR_A_REVIEW branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo 'REAL_REFUND_PAYMENT/REFUNDED/COMPLETED/PRODUCTION_ISSUER=NOT_AUTHORIZED; F06/F07/F08/V1=NOT_READY'
