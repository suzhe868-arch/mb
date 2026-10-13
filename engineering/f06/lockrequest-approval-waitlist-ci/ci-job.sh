#!/usr/bin/env bash
set -euo pipefail
mode="$1";case "$mode" in source|https);; *) exit 64;; esac
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/feat/f06-1-lockrequest-approval-waitlist-ci
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test -n "$GITHUB_SHA"
bash engineering/f06/lockrequest-approval-waitlist-ci/compat-old.sh "$mode"
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
cd engineering
out="f06/lockrequest-approval-waitlist-ci/artifacts/$mode"
mkdir -p "$out"
if [[ "$mode" = source ]];then
 node f06/lockrequest-approval-waitlist-ci/audit-seal.mjs before
 bash f06/lockrequest-approval-waitlist-ci/disposable-db.sh snapshot
fi
node f06/lockrequest-approval-waitlist-ci/runner.mjs --inject-rollback
node f06/lockrequest-approval-waitlist-ci/runner.mjs --apply
node f06/lockrequest-approval-waitlist-ci/runner.mjs --verify
if [[ "$mode" = source ]];then
 node f06/lockrequest-approval-waitlist-ci/fixtures.mjs
 node --test f06/lockrequest-approval-waitlist-ci/tests/source.test.mjs 2>&1 | tee "$out/native-source.log"
 grep -q '# fail 0' "$out/native-source.log"
 grep -q '# tests 37' "$out/native-source.log"
 node f06/lockrequest-approval-waitlist-ci/runner.mjs --verify
 bash f06/lockrequest-approval-waitlist-ci/disposable-db.sh restore
 node f06/lockrequest-approval-waitlist-ci/audit-seal.mjs after 2>&1 | tee "$out/audit-global-seal.log"
 grep -q F06_1_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS "$out/audit-global-seal.log"
else
 openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 -keyout /tmp/f06-1-loopback-key.pem -out /tmp/f06-1-loopback-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
 chmod 600 /tmp/f06-1-loopback-key.pem
 node --test f06/lockrequest-approval-waitlist-ci/tests/https.test.mjs 2>&1 | tee "$out/native-https.log"
 grep -q '# fail 0' "$out/native-https.log"
 grep -q '# tests 9' "$out/native-https.log"
fi
cp f06/lockrequest-approval-waitlist-ci/B自验与A交接.md "$out/B-handoff.md"
( cd "$out" && sha256sum * > sha256sums.txt )
echo "F06_1_DISPOSABLE_REAL_NONPRIVILEGED_PG16_SUCCESS"
