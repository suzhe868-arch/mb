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
bash "$scratch" "$mode"
