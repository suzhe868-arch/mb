#!/usr/bin/env bash
# F05-8 equivalent signed F05-7 PG16 tests (28 Source / 7 HTTPS) in independent DB.
# The original CI script, migrations, seeds and tests are not changed.
# Only its branch-specific GitHub Actions audit is replaced by F05-8's own 68-job audit.
set -euo pipefail
mode="${1:-}"
case "$mode" in source|https) ;; *) exit 64 ;; esac
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
old="$root/f05/deterministic-matching-readiness-four-tier"
# Put ephemeral copy beside original so its BASH_SOURCE-relative working directory remains correct.
scratch="$(mktemp "$old/.f05-8-equivalent-XXXXXX.sh")"
trap 'rm -f "$scratch"' EXIT
sed 's@^ node f05/deterministic-matching-readiness-four-tier/ci-verify-workflows.mjs$@ echo F05_8_EQUIVALENT_OLD_F05_7_READONLY_BUSINESS_TESTS_COMPLETE@' "$old/ci-job.sh" > "$scratch"
if grep -q 'node f05/deterministic-matching-readiness-four-tier/ci-verify-workflows.mjs' "$scratch"; then
 echo 'F05_8_BRANCH_SPECIFIC_AUDIT_NOT_REPLACED' >&2;exit 74
fi
if ! grep -q 'node --test "f05/deterministic-matching-readiness-four-tier/tests/$mode.test.mjs"' "$scratch"; then
 echo 'F05_8_SIGNED_F05_7_SOURCE_TEST_REMOVED' >&2;exit 74
fi
bash "$scratch" "$mode"
out="$root/f05/priority-arbitration-ttl-handover/artifacts/compat-$mode"
mkdir -p "$out"
cp -a "$old/artifacts/$mode/." "$out/"
cp "$old/tests/$mode.test.mjs" "$out/original-f05-7-$mode.test.mjs"
grep -q '# fail 0' "$out/true-pg16-$mode-tests.log"
if [[ "$mode" = source ]]; then
 grep -q '# tests 28' "$out/true-pg16-source-tests.log"
 for n in 25 26 27 28; do grep -q "ok $n - 7-A$n" "$out/true-pg16-source-tests.log";done
else
 grep -q '# tests 7' "$out/true-pg16-https-tests.log"
fi
( cd "$out" && sha256sum * > f05-8-compat-sha256sums.txt )
echo "F05_8_ORIGINAL_F05_7_${mode}_TRUE_PG16_EQUIVALENT_PASS"
