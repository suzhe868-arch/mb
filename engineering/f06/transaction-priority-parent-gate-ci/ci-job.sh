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
   !report.realSignedR01UniqueNewPriority||
   !report.versionedNative4A||
   !report.versionedNative4B4C||
   report.parentAfter?.verified!==false){
 console.error("PG1_NATIVE_TRUE_ASSERTIONS_NOT_PROVEN",report.status);
 process.exit(1);
}
console.log("PG1_NATIVE_ALL_ASSERTIONS_PASS",report.sha);
' "$base/artifacts/source/真实PG16父签名兼容诊断.json"
echo "F06_5C_PG1_NATIVE_DIAG_EXIT=$rc; ALL_TRUE_NATIVE_ASSERTIONS_PASS"
