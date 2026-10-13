#!/usr/bin/env bash
set -euo pipefail
mode="$1";case "$mode" in source|https);; *) exit 64;; esac
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/feat/f06-3a-deposit-ledger-ci
test "$GITHUB_REF_NAME" = feat/f06-3a-deposit-ledger-ci
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test -n "$GITHUB_SHA"
echo "F06_3A_PRESERVED_F06_2_REAL_PUSH head=$GITHUB_SHA"
env GITHUB_REF=refs/heads/feat/f06-2-lock-lifecycle-ci \
 GITHUB_REF_NAME=feat/f06-2-lock-lifecycle-ci \
 bash engineering/f06/lock-lifecycle-ci/ci-job.sh "$mode"
