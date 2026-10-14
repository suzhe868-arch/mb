#!/usr/bin/env bash
set -euo pipefail
mode="$1";case "$mode" in source|https);;*)exit 64;;esac
test "$GITHUB_REPOSITORY" = suzhe868-arch/mb
test "$GITHUB_REF" = refs/heads/feat/f06-5c-transaction-priority-admission-ci
test "$GITHUB_REF_NAME" = feat/f06-5c-transaction-priority-admission-ci
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_ACTIONS" = true
[[ "$GITHUB_SHA" =~ ^[0-9a-f]{40}$ ]]
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
base=engineering/f06/transaction-priority-admission-ci
# 旧源码原封未改，只桥接历史冻结REF；GitHub真实push、SHA及checkout绝不伪造。
env GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci GITHUB_REF_NAME=feat/f06-5b-lock-refund-conversion-guard-ci bash engineering/f06/lock-refund-conversion-guard-ci/ci-job.sh "$mode"
test "$GITHUB_REF" = refs/heads/feat/f06-5c-transaction-priority-admission-ci
test "$GITHUB_REF_NAME" = feat/f06-5c-transaction-priority-admission-ci
if [[ "$mode" = source ]];then
 (cd engineering && env GITHUB_REF=refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci GITHUB_REF_NAME=feat/f06-5b-lock-refund-conversion-guard-ci node f06/lock-refund-conversion-guard-ci/runner.mjs --apply)
 mkdir -p "$base/artifacts/source"
 (cd engineering && node f06/transaction-priority-admission-ci/audit-seal.mjs before)
 bash "$base/disposable-db.sh" snapshot
else
 mkdir -p "$base/artifacts/https"
fi
(cd engineering && node f06/transaction-priority-admission-ci/runner.mjs --inject-rollback && node f06/transaction-priority-admission-ci/runner.mjs --apply && node f06/transaction-priority-admission-ci/runner.mjs --verify)
if [[ "$mode" = source ]];then
 (cd engineering && node --test f06/transaction-priority-admission-ci/tests/source.test.mjs) 2>&1 | tee "$base/artifacts/source/native-source.log"
 grep -q '# tests 67' "$base/artifacts/source/native-source.log"
 grep -q '# fail 0' "$base/artifacts/source/native-source.log"
 bash "$base/disposable-db.sh" restore
 (cd engineering && node f06/transaction-priority-admission-ci/audit-seal.mjs after) 2>&1 | tee "$base/artifacts/source/audit-global-seal.log"
 grep -q F06_5C_TWO_PHYSICAL_PG_DATABASES_PARENT_190_TABLES_SEAL_PASS "$base/artifacts/source/audit-global-seal.log"
else
 openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 -keyout /tmp/f06-5c-key.pem -out /tmp/f06-5c-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
 chmod 600 /tmp/f06-5c-key.pem
 (cd engineering && node --test f06/transaction-priority-admission-ci/tests/https.test.mjs) 2>&1 | tee "$base/artifacts/https/native-https.log"
 grep -q '# tests 9' "$base/artifacts/https/native-https.log"
 grep -q '# fail 0' "$base/artifacts/https/native-https.log"
fi
cp "$base/B自验与A交接.md" "$base/artifacts/$mode/B-handoff.md"
(cd "$base/artifacts/$mode" && sha256sum * > sha256sums.txt)
echo F06_5C_NATIVE_PG16_A_TECH_RULING_REMEDIATION_TESTS_EXECUTED
