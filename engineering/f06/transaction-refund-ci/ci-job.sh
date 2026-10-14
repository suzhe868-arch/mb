#!/usr/bin/env bash
set -euo pipefail
mode="${1:-}";case "$mode" in source|https);; *) exit 64;; esac
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/feat/f06-5a-transaction-refund-pending-ci
test "$GITHUB_REF_NAME" = feat/f06-5a-transaction-refund-pending-ci
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
test -n "$GITHUB_SHA"
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
base=engineering/f06/transaction-refund-ci
env GITHUB_REF=refs/heads/feat/f06-4c-post-handoff-cancel-ci GITHUB_REF_NAME=feat/f06-4c-post-handoff-cancel-ci bash engineering/f06/post-handoff-cancel-ci/ci-job.sh "$mode"
mkdir -p "$base/artifacts/$mode"
if [[ "$mode" = source ]]; then
 (cd engineering && env GITHUB_REF=refs/heads/feat/f06-4c-post-handoff-cancel-ci node f06/post-handoff-cancel-ci/runner.mjs --apply)
 (cd engineering && node f06/transaction-refund-ci/audit-seal.mjs before)
 bash "$base/disposable-db.sh" snapshot
fi
(cd engineering && node f06/transaction-refund-ci/runner.mjs --inject-rollback && node f06/transaction-refund-ci/runner.mjs --apply && node f06/transaction-refund-ci/runner.mjs --verify)
if [[ "$mode" = source ]]; then
 (cd engineering && node --test f06/transaction-refund-ci/tests/source.test.mjs) 2>&1 | tee "$base/artifacts/source/native-source.log"
 grep -q '# tests 68' "$base/artifacts/source/native-source.log"
 grep -q '# fail 0' "$base/artifacts/source/native-source.log"
 (cd engineering && node f06/transaction-refund-ci/runner.mjs --verify)
 bash "$base/disposable-db.sh" restore
 (cd engineering && node f06/transaction-refund-ci/audit-seal.mjs after) 2>&1 | tee "$base/artifacts/source/audit-global-seal.log"
 grep -q F06_5A_TWO_PHYSICAL_PG_DATABASES_PARENT_184_TABLES_SEAL_PASS "$base/artifacts/source/audit-global-seal.log"
else
 openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 -keyout /tmp/f06-5a-key.pem -out /tmp/f06-5a-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
 chmod 600 /tmp/f06-5a-key.pem
 (cd engineering && node --test f06/transaction-refund-ci/tests/https.test.mjs) 2>&1 | tee "$base/artifacts/https/native-https.log"
 grep -q '# tests 9' "$base/artifacts/https/native-https.log"
 grep -q '# fail 0' "$base/artifacts/https/native-https.log"
fi
cp "$base/B自验与A交接.md" "$base/artifacts/$mode/B-handoff.md"
(cd "$base/artifacts/$mode" && sha256sum * > sha256sums.txt)
echo F06_5A_NATIVE_PG16_SUCCESS
