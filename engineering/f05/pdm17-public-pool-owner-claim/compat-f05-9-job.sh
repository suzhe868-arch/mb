#!/usr/bin/env bash
set -euo pipefail
case "$1" in source|https);; *) exit 65;; esac
original=engineering/f05/recommendation-visibility-grants/ci-job.sh
tmp="engineering/f05/recommendation-visibility-grants/.f05-10-d1-$BASHPID.sh"
trap 'rm -f "$tmp"' EXIT
sed 's@^ node f05/recommendation-visibility-grants/ci-verify-70.mjs$@ echo D1_OLD_PDM14_FROZEN_BUSINESS_TESTS_PRESERVED@' "$original" > "$tmp"
grep -q 'D1_OLD_PDM14_FROZEN_BUSINESS_TESTS_PRESERVED' "$tmp"
bash "$tmp" "$1"
grep -q '# fail 0' "engineering/f05/recommendation-visibility-grants/artifacts/$1/native-pg16-$1.log"
echo "D1_FROZEN_F05_9_$1_PG16_PASSED"
