#!/usr/bin/env bash
set -euo pipefail
mode="${1:-}";case "$mode" in source|https);; *) exit 64;; esac
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/feat/f06-2-lock-lifecycle-ci
test "$GITHUB_REF_NAME" = feat/f06-2-lock-lifecycle-ci
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test -n "$GITHUB_SHA"
echo "F06_2_INHERITED_F06_1_SIGNED_NATIVE_PG16 real_ref=$GITHUB_REF head=$GITHUB_SHA"
env GITHUB_REF=refs/heads/feat/f06-1-lockrequest-approval-waitlist-ci \
 GITHUB_REF_NAME=feat/f06-1-lockrequest-approval-waitlist-ci \
 bash engineering/f06/lockrequest-approval-waitlist-ci/ci-job.sh "$mode"
