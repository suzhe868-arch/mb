#!/usr/bin/env bash
set -euo pipefail
mode="$1";case "$mode" in source|https);; *) exit 64;; esac
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/feat/f06-1-lockrequest-approval-waitlist-ci
test "$GITHUB_REF_NAME" = feat/f06-1-lockrequest-approval-waitlist-ci
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test -n "$GITHUB_SHA"
echo "F06_1_PRESERVED_SIGNED_F05_11_REAL_PUSH head=$GITHUB_SHA real_ref=$GITHUB_REF"
# Historical F05-11 branch-only guard needs a compatibility subprocess.
# GitHub's signed GITHUB_REF and GITHUB_SHA remain intact and checked above.
env GITHUB_REF_NAME=feat/f05-11-cross-domain-readiness-audit bash engineering/f05/integrated-readiness-audit/ci-job.sh "$mode"
