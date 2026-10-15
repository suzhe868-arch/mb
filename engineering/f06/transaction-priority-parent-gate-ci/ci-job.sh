#!/usr/bin/env bash
set -euo pipefail
test "$GITHUB_ACTIONS" = true
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/fix/f06-5c-pg1-parent-priority-guard-ci
test "$GITHUB_REF_NAME" = fix/f06-5c-pg1-parent-priority-guard-ci
test -n "$GITHUB_SHA"
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
base=engineering/f06/transaction-priority-parent-gate-ci
mkdir -p "$base/artifacts/source"
# 严格沿用已签 5B 全链路真实非特权 PG16 测试，不跳过或改变任何冻结测试。
env GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci \
  GITHUB_REF_NAME=feat/f06-5b-lock-refund-conversion-guard-ci \
  bash engineering/f06/lock-refund-conversion-guard-ci/ci-job.sh source
# 5B 的独立审计会恢复到 5A 已签基线；回填真实 5B Sidecar 以便获得完整 190 张旧父表。
(cd engineering && env GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci \
  node f06/lock-refund-conversion-guard-ci/runner.mjs --apply)
set +e
(cd engineering && node f06/transaction-priority-parent-gate-ci/诊断父签名冲突.mjs) \
  > "$base/artifacts/source/原生PG16诊断日志.txt" 2>&1
rc=$?
set -e
cat "$base/artifacts/source/原生PG16诊断日志.txt"
(cd "$base/artifacts/source" && sha256sum *.json *.txt > 证据SHA256.txt 2>/dev/null || true)
test -s "$base/artifacts/source/真实PG16父签名兼容诊断.json"
# 绝不以手工“预期红证”或静态日志置绿；真实脚本退出0且完整JSON记录所有断言通过方可放行。
test "$rc" -eq 0
node --input-type=module -e '
import fs from "node:fs";
const report=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
if(report.status!=="ALL_NATIVE_ASSERTIONS_PASS"||
   report.sha!==process.env.GITHUB_SHA||
   report.nativeTamperMatrix?.length!==5||
   report.nativeUnsignedCancelMatrix?.length!==2||
   !report.realSignedC01JytWaitlist||
   report.realSignedC01JytWaitlist.explicitUnsignedMatchDenied!==true||
   report.realSignedC01JytWaitlist.explicitUnsignedMatchSQLSTATE!=='23514'||
   report.realSignedC01JytWaitlist.explicitNonParentIssuerDenied!==true||
   report.realSignedC01JytWaitlist.explicitNonParentIssuerSQLSTATE!=='23514'||
   report.realSignedC01JytWaitlist.explicitForgedParentPrefixDenied!==true||
   report.realSignedC01JytWaitlist.explicitForgedParentPrefixSQLSTATE!=='23514'||
   !report.realSignedR01UniqueNewPriority||
   !report.versionedNative4A||
   report.versionedNative4A.pendingReal5BRefundDenied!==true||
   report.versionedNative4A.pendingFinanceOriginalCode!=='F06_4A_UNRESOLVED_REFUND_FACT'||
   report.versionedNative4A.pendingRefundFactUnchanged!==true||
   !report.versionedNative4B4C||
   report.versionedNative4B4C.pendingReal4BRefundDenied!==true||
   report.versionedNative4B4C.pendingFinanceOriginalCode!=='F06_4C_FINANCIAL_OR_REFUND_UNKNOWN_DENY'||
   report.versionedNative4B4C.pendingRefundFactUnchanged!==true||
   report.parentAfter?.verified!==false){
 console.error("PG1_NATIVE_TRUE_ASSERTIONS_NOT_PROVEN",report.status);
 process.exit(1);
}
console.log("PG1_NATIVE_ALL_ASSERTIONS_PASS",report.sha);
' "$base/artifacts/source/真实PG16父签名兼容诊断.json"
echo "F06_5C_PG1_NATIVE_DIAG_EXIT=$rc; ALL_TRUE_NATIVE_ASSERTIONS_PASS"
# PG1 真正双物理OID验收：诊断必须成功后，先留190张旧表/24 Ledger及新Catalog签名，
# 再沿用已签F06-5B的可销毁PG16数据库快照/重建工具（仅重新绑定该旧工具的分支门禁），
# 绝不调整原父的验签器/服务/业务签名。实际DROP/CREATE操作仅在一次性CI数据库内运行。
{
 (cd engineering && node f06/transaction-priority-parent-gate-ci/双OID物理业务审计.mjs --before)
 env GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci \
     bash engineering/f06/lock-refund-conversion-guard-ci/disposable-db.sh snapshot
 env GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci \
     bash engineering/f06/lock-refund-conversion-guard-ci/disposable-db.sh restore
 (cd engineering && node f06/transaction-priority-parent-gate-ci/双OID物理业务审计.mjs --after)
} 2>&1 | tee "$base/artifacts/source/原生PG16双OID真实重建日志.txt"
test -s "$base/artifacts/source/PG1第一OID原生签名快照.json"
test -s "$base/artifacts/source/PG1双OID物理审计.json"
grep -q PG1_TWO_REAL_PHYSICAL_PG16_DATABASE_OIDS_PARENT190_SEAL_PASS \
 "$base/artifacts/source/原生PG16双OID真实重建日志.txt"
node --input-type=module -e '
import fs from "node:fs";
const report=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
if(report.status!=="PG1_TWO_REAL_PHYSICAL_PG16_DATABASE_OIDS_PARENT190_SEAL_PASS"||
   report.sourceSHA!==process.env.GITHUB_SHA||
   report.run!==process.env.GITHUB_RUN_ID||
   report.firstOid===report.secondOid||
   report.old190TableCount!==190||
   !report.PG16)process.exit(1);
console.log("PG1_NATIVE_REAL_TWO_DATABASE_OIDS_PASS",report.firstOid,report.secondOid);
' "$base/artifacts/source/PG1双OID物理审计.json"
(cd "$base/artifacts/source" && find . -maxdepth 1 -type f ! -name '证据SHA256.txt' -print0 |
 sort -z | xargs -0 sha256sum > 证据SHA256.txt)
test -s "$base/artifacts/source/证据SHA256.txt"
echo "F06_5C_PG1_NATIVE_DIAG_AND_REAL_TWO_OIDS_PASS_SHA=$GITHUB_SHA"
