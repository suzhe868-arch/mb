#!/usr/bin/env bash
# Current B-window D1 business validation only.
# Rebuilds signed v25 prerequisites but deliberately does NOT run the old F05-7
# compatibility suite, frozen workflow-count audit, evidence upload, or production action.
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test -n "${GITHUB_RUN_ID:-}"
export CI=true APP_ENV=test NODE_ENV=test
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F03_1_DATABASE_URL=postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F04_1_ISOLATION_CONFIRM=I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY
export F04_2_ISOLATION_CONFIRM=I_AUTHORIZE_F04_2_DISPOSABLE_PG16_HTTPS_ONLY
export F04_3_ISOLATION_CONFIRM=I_AUTHORIZE_F04_3_DISPOSABLE_PG16_HTTPS_ONLY
export F04_4_ISOLATION_CONFIRM=I_AUTHORIZE_F04_4_DISPOSABLE_PG16_HTTPS_ONLY
export F05_1_ISOLATION_CONFIRM=I_AUTHORIZE_F05_1_DISPOSABLE_PG16_HTTPS_ONLY
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

node f05/wholesale-to-mingbang-conversion/ci-run.mjs source
node f05/wholesale-to-mingbang-conversion/runner.mjs --verify
node f05/customer-price-entitlement-cycle/ci-seed-jyt.mjs

for lane in favorite-physical-carrier customer-price-entitlement-cycle employee-price-quota-adjustment find-car-application-demand-eligibility; do
  node "f05/$lane/runner.mjs" --inject-rollback
  node "f05/$lane/runner.mjs" --apply
  node "f05/$lane/runner.mjs" --verify
  if test -f "f05/$lane/fixtures.mjs"; then node "f05/$lane/fixtures.mjs"; fi
done

node f05/deterministic-matching-readiness-four-tier/preseed.mjs
node f05/deterministic-matching-readiness-four-tier/runner.mjs --inject-rollback
node f05/deterministic-matching-readiness-four-tier/runner.mjs --apply
node f05/deterministic-matching-readiness-four-tier/runner.mjs --verify
node f05/deterministic-matching-readiness-four-tier/fixtures.mjs

# Build v24/v25 from the signed v23 facts, but do not execute the old F05-7 test suite.
node f05/priority-arbitration-ttl-handover/preseed-v23.mjs
node f05/priority-arbitration-ttl-handover/runner.mjs --inject-rollback
node f05/priority-arbitration-ttl-handover/runner.mjs --apply
node f05/priority-arbitration-ttl-handover/runner.mjs --verify
node f05/recommendation-visibility-grants/runner.mjs --inject-rollback
node f05/recommendation-visibility-grants/runner.mjs --apply
node f05/recommendation-visibility-grants/runner.mjs --verify

node f05/pdm17-public-pool-owner-claim/runner.mjs --inject-rollback
node f05/pdm17-public-pool-owner-claim/runner.mjs --apply
node f05/pdm17-public-pool-owner-claim/runner.mjs --verify
node f05/pdm17-public-pool-owner-claim/fixtures.mjs

node --test f05/pdm17-public-pool-owner-claim/tests/source.test.mjs 2>&1 | tee /tmp/f05-d1-current-source.log
grep -q '# fail 0' /tmp/f05-d1-current-source.log
node f05/pdm17-public-pool-owner-claim/runner.mjs --verify

openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 1 \
 -keyout /tmp/f04-3-ci-key.pem -out /tmp/f04-3-ci-cert.pem -subj '/CN=127.0.0.1' >/dev/null 2>&1
chmod 600 /tmp/f04-3-ci-key.pem
node --test f05/pdm17-public-pool-owner-claim/tests/business-https.test.mjs 2>&1 | tee /tmp/f05-d1-current-https.log
grep -q '# fail 0' /tmp/f05-d1-current-https.log
node f05/pdm17-public-pool-owner-claim/runner.mjs --verify

echo F05_D1_CURRENT_PG16_OWNER_CONSULTATION_PASS
