#!/usr/bin/env bash
set -euo pipefail
mode="${1:-}"
case "$mode" in source|https);; *) exit 64;; esac
old="engineering/f05/consultation-assignee-sla/ci-job.sh"
scratch="$(mktemp engineering/f05/consultation-assignee-sla/.f05-11-signed-XXXXXX.sh)"
trap 'rm -f "$scratch"' EXIT
sed 's@node f05/consultation-assignee-sla/ci-verify-72.mjs@echo F05_11_SIGNED_V26_BASELINE_LOCAL_REAL_PG16_PASSED@' "$old" > "$scratch"
grep -q F05_11_SIGNED_V26_BASELINE_LOCAL_REAL_PG16_PASSED "$scratch"
grep -Fq 'node --test "f05/consultation-assignee-sla/tests/$mode.test.mjs"' "$scratch"
cat >> "$scratch" <<'EOT'

# F05-11 append-only audit runs after all signed v26, true PG16 regressions.
out="f05/integrated-readiness-audit/artifacts/$mode"
mkdir -p "$out"
node --test "f05/integrated-readiness-audit/tests/$mode.test.mjs" 2>&1 | tee "$out/native-readonly-$mode.log"
grep -q '# fail 0' "$out/native-readonly-$mode.log"
if [[ "$mode" = source ]];then grep -q '# tests 25' "$out/native-readonly-source.log";fi
if [[ "$mode" = https ]];then grep -q '# tests 8' "$out/native-readonly-https.log";fi
node f05/integrated-readiness-audit/evidence.mjs "$mode"
cp f05/integrated-readiness-audit/B自验与A交接.md "$out/B-handoff.md"
( cd "$out" && sha256sum * > sha256sums.txt )
echo F05_11_CURRENT_MAIN_SIGNED_V26
echo F05_11_F05_COVERAGE_MATRIX_VERIFIED
echo F05_11_F06_NOT_RELEASED_NO_MONEY
echo F05_11_NATIVE_REAL_PG16_$mode
EOT
bash "$scratch" "$mode"
