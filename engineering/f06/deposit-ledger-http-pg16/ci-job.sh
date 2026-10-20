#!/usr/bin/env bash
set -euo pipefail

branch='feat/f06-real-deposit-ledger-http-pg16-01'
parent_branch='feat/f06-3a-deposit-ledger-ci'
test "$GITHUB_REPOSITORY" = 'suzhe868-arch/mb'
test "$GITHUB_REF" = "refs/heads/$branch"
test "$GITHUB_REF_NAME" = "$branch"
test "$GITHUB_EVENT_NAME" = 'push'
test "$GITHUB_ACTIONS" = 'true'
test "$CI" = 'true'
test "$APP_ENV" = 'test'
test "$NODE_ENV" = 'test'
test "$API_HOST" = '127.0.0.1'
test -n "$GITHUB_SHA"
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
test "$F06_REAL_DEPOSIT_TEST_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_DEPOSIT_HTTP_PG16_ONLY'
test "$F03_1_ISOLATION_CONFIRM" = 'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'
test "$F05_2_ISOLATION_CONFIRM" = 'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'
test "$F06_LOCK_TEST_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'
test "$F06_LOCK_LIFECYCLE_TEST_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY'
test "$F06_LOCK_LIFECYCLE_EXPIRY_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY'

export F06_REAL_ENTRY_REF="$GITHUB_REF"
export F06_REAL_ENTRY_BRANCH="$GITHUB_REF_NAME"
export F06_REAL_ENTRY_SHA="$GITHUB_SHA"
export F06_REAL_ENTRY_EVENT="$GITHUB_EVENT_NAME"
export F06_REAL_ENTRY_RUN_ID="$GITHUB_RUN_ID"
export F03_1_DATABASE_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
export F06_LOCK_DATABASE_URL='postgres://f06_lock_ci:f06_lock_ci_synthetic_only@127.0.0.1:5432/f06_lock_test'
export F03_1_ISOLATION_CONFIRM='I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'
export F05_2_ISOLATION_CONFIRM='I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'

base='engineering/f06/deposit-ledger-http-pg16'
mkdir -p "$base/evidence"

assert_tap() {
  local file="$1" expected="$2" actual pass fail skipped cancelled
  test -s "$file"
  actual="$(awk '/^# tests /{n=$3} END{print n+0}' "$file")"
  pass="$(awk '/^# pass /{n=$3} END{print n+0}' "$file")"
  fail="$(awk '/^# fail /{n=$3} END{print n+0}' "$file")"
  skipped="$(awk '/^# skipped /{n=$3} END{print n+0}' "$file")"
  cancelled="$(awk '/^# cancelled /{n=$3} END{print n+0}' "$file")"
  if [[ "$actual" -ne "$expected" || "$pass" -ne "$expected" || "$fail" -ne 0 || "$skipped" -ne 0 || "$cancelled" -ne 0 ]]; then
    echo "F06_REAL_DEPOSIT_TAP_COUNT_FAILED file=$file expected=$expected tests=$actual pass=$pass fail=$fail skipped=$skipped cancelled=$cancelled"
    return 1
  fi
  echo "F06_REAL_DEPOSIT_TAP_PASS file=$file tests=$actual pass=$actual fail=0 skipped=0 cancelled=0"
}

node "$base/trigger-preflight.mjs"

# Reuse the signed historical chain exactly once. This chain prepares an empty
# PG16 service, runs inherited F06-1/F06-2 CI and signed F06-3A Source tests,
# then restores the signed parent database after its scenario.
env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    bash engineering/f06/deposit-ledger-ci/ci-job.sh source
grep -q '# tests 28' engineering/f06/deposit-ledger-ci/artifacts/source/native-source.log
grep -q '# fail 0' engineering/f06/deposit-ledger-ci/artifacts/source/native-source.log

# The native F06 lock baseline uses a distinct disposable DB in the same
# PostgreSQL service. Never attempt to bootstrap the parent database twice.
bash "$base/native-regression.sh"
assert_tap engineering/evidence/F06_LOCK_BASELINE_NODE_ACCEPTANCE_TAP.log 54
assert_tap engineering/evidence/F06_LOCK_LIFECYCLE_NODE_ACCEPTANCE_TAP.log 37
assert_tap engineering/evidence/F06_PG16_NATIVE_ACCEPTANCE_TAP.log 21
assert_tap engineering/evidence/F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_TAP.log 36

node --test engineering/f05/tests/source-gate-event-evidence.test.mjs 2>&1 | tee "$base/evidence/F05_INIT_18_TAP.log"
assert_tap "$base/evidence/F05_INIT_18_TAP.log" 18

bash "$base/disposable-db.sh" prepare
export F06_LOCK_DATABASE_URL="postgres://f06_lock_ci:f06_lock_ci_synthetic_only@127.0.0.1:5432/f06_lock_audit_$GITHUB_RUN_ID"
env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node "$base/audit-seal.mjs" before

env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node engineering/f06/deposit-ledger-ci/runner.mjs --apply
env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node engineering/f06/deposit-ledger-ci/runner.mjs --verify

env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node --test "$base/tests/http.test.mjs" 2>&1 | tee "$base/evidence/DEPOSIT_HTTP_PG16_TAP.log"
assert_tap "$base/evidence/DEPOSIT_HTTP_PG16_TAP.log" 38

openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
  -keyout /tmp/f06-3a-key.pem -out /tmp/f06-3a-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-3a-key.pem
env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node --test engineering/f06/deposit-ledger-ci/tests/https.test.mjs 2>&1 | tee "$base/evidence/F06_3A_HTTPS_TAP.log"
assert_tap "$base/evidence/F06_3A_HTTPS_TAP.log" 9

openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
  -keyout /tmp/f06-real-deposit-key.pem -out /tmp/f06-real-deposit-cert.pem -subj '/CN=localhost' >/dev/null 2>&1
chmod 600 /tmp/f06-real-deposit-key.pem
env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node --test "$base/tests/https.test.mjs" 2>&1 | tee "$base/evidence/DEPOSIT_TLS_DENY_TAP.log"
assert_tap "$base/evidence/DEPOSIT_TLS_DENY_TAP.log" 9

env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node "$base/audit-seal.mjs" verify-scenario
bash "$base/disposable-db.sh" restore-source
export F03_1_DATABASE_URL="postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_restore_$GITHUB_RUN_ID"
env GITHUB_REF="refs/heads/$parent_branch" GITHUB_REF_NAME="$parent_branch" \
    node "$base/audit-seal.mjs" after

node "$base/trigger-preflight.mjs"
echo "READY_FOR_A_REVIEW branch=$branch head=$GITHUB_SHA run_id=$GITHUB_RUN_ID"
echo 'PRODUCTION_FINANCIAL_CARRIER_GAP remains open; this is non-production acceptance only.'