#!/usr/bin/env bash
set -euo pipefail
mode="${1:-}"
case "$mode" in source|https);; *) exit 64;; esac
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test "${GITHUB_REF_NAME:-}" = feat/f05-11-cross-domain-readiness-audit
test "${GITHUB_EVENT_NAME:-}" = push
bash engineering/f05/integrated-readiness-audit/compat-f05-10.sh "$mode"
