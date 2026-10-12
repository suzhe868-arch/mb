#!/usr/bin/env bash
set -euo pipefail
mode="$1"
case "$mode" in source|https);; *) exit 65;; esac
old=engineering/f05/recommendation-visibility-grants/ci-job.sh
tmp="engineering/f05/recommendation-visibility-grants/.f05-10-$$.sh"
trap 'rm -f "$tmp"' EXIT
sed 's@^ node f05/recommendation-visibility-grants/ci-verify-70.mjs$@ echo F05_10_OLD_PDM14_TESTS_PRESERVED@' "$old" > "$tmp"
grep -q 'F05_10_OLD_PDM14_TESTS_PRESERVED' "$tmp"
bash "$tmp" "$mode"
grep -q '# fail 0' "engineering/f05/recommendation-visibility-grants/artifacts/$mode/native-pg16-$mode.log"
echo "F05_10_FROZEN_F05_9_${mode}_NATIVE_PG16_PASS"
