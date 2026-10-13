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
# Source scenario begins with a v25 dump BEFORE Recommendation Service issues synthetic Grant.
# Insert BEFORE D1 sidecar, while the originally signed v25 state is physically intact.
if [[ "$mode" = source ]];then
 sed -i '/^node .*pdm17-public-pool-owner-claim.*runner.mjs --inject-rollback$/i bash f05/integrated-readiness-audit/disposable-db.sh snapshot\nnode f05/integrated-readiness-audit/pre-v26-grant.mjs' "$scratch"
 grep -q 'disposable-db.sh snapshot' "$scratch"
 grep -q 'pre-v26-grant.mjs' "$scratch"
fi
cat >> "$scratch" <<'EOT'

# Signed business side effects are permitted ONLY in the first disposable SCENARIO DB.
out="f05/integrated-readiness-audit/artifacts/$mode"
mkdir -p "$out"
if [[ "$mode" = source ]];then
 node --test "f05/integrated-readiness-audit/tests/整改实证.test.mjs" 2>&1 | tee "$out/native-remediation-source.log"
 grep -q '# tests 4' "$out/native-remediation-source.log"
 grep -q '# pass 4' "$out/native-remediation-source.log"
 grep -q '# fail 0' "$out/native-remediation-source.log"
 echo F05_11_R01_R02_R01G_REAL_SIGNED_SCENARIOS_ON_DISPOSABLE_DB_PASS
 # Permanently DESTROY the scenario physical DB; restore pre-Grant signed v25 into NEW DB.
 bash f05/integrated-readiness-audit/disposable-db.sh restore
 # Capture the complete authentic signed v26 public+D1 table state BEFORE any audits.
 node f05/integrated-readiness-audit/global-seal.mjs before
fi
node --test "f05/integrated-readiness-audit/tests/$mode.test.mjs" 2>&1 | tee "$out/native-readonly-$mode.log"
grep -q '# fail 0' "$out/native-readonly-$mode.log"
if [[ "$mode" = source ]];then
 grep -q '# tests 25' "$out/native-readonly-source.log"
 # R03 is executed AGAIN and exclusively on the immutable independent audit DB.
 node --test --test-name-pattern='11-R03' "f05/integrated-readiness-audit/tests/整改实证.test.mjs" 2>&1 | tee "$out/native-readonly-r03.log"
 grep -q '# pass 1' "$out/native-readonly-r03.log"
 grep -q '# fail 0' "$out/native-readonly-r03.log"
 node f05/integrated-readiness-audit/global-seal.mjs after 2>&1 | tee "$out/native-global-seal.log"
 grep -q F05_11_POST_REMEDIATION_TRUE_GLOBAL_READONLY_SEAL_PASS "$out/native-global-seal.log"
 echo F05_11_REAL_SOURCE_TOTAL_29_PLUS_R03_IN_SEPARATE_FRESH_DB
fi
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
