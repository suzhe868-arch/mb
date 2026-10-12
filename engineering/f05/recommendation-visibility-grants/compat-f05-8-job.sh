#!/usr/bin/env bash
# Re-execute frozen F05-8 37/10 plus old F05-7 compat 28/7 in own PG16.
# Only branch-specific Actions 68 gate (not frozen business test) is skipped;
# F05-9 official 70 gate independently verifies eight original jobs + new two.
set -euo pipefail
mode="${1:-}"
case "$mode" in compat-source|compat-https|priority-source|priority-https) ;; *) exit 64 ;; esac
old=engineering/f05/priority-arbitration-ttl-handover/ci-job.sh
scratch="$(mktemp engineering/f05/priority-arbitration-ttl-handover/.f05-9-compat-XXXXXX.sh)"
trap 'rm -f "$scratch"' EXIT
sed 's@^ node f05/priority-arbitration-ttl-handover/ci-verify-68.mjs$@ echo F05_9_REVALIDATES_FROZEN_F05_8_SOURCE_IN_NEW_70_JOB_GATE@' "$old" > "$scratch"
if grep -q 'node f05/priority-arbitration-ttl-handover/ci-verify-68.mjs' "$scratch";then
 echo 'F05_9_BRANCH_ONLY_AUDIT_ADAPTATION_FAILED' >&2;exit 75
fi
if ! grep -q 'node --test "f05/priority-arbitration-ttl-handover/tests/' "$scratch";then
 echo 'F05_9_FROZEN_BUSINESS_TEST_REMOVED' >&2;exit 75
fi
bash "$scratch" "$mode"
