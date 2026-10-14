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
# 不得以预期红证退出 0，等 A 审核确切 SQL 事实及额外授权。
echo "F06_5C_PG1_NATIVE_DIAG_EXIT=$rc; REMAINS_SECURITY_RED"
exit 1
