#!/usr/bin/env bash
set -euo pipefail

# Runs against only this Action's disposable PostgreSQL 16 service.
test "$F06_REAL_ENTRY_BRANCH" = 'feat/f06-real-deposit-ledger-http-pg16-01'
test "$F06_REAL_ENTRY_SHA" = "$GITHUB_SHA"
test "$GITHUB_ACTIONS" = 'true'
test "$GITHUB_EVENT_NAME" = 'push'
test "$F06_LOCK_TEST_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'
test "$F06_LOCK_LIFECYCLE_TEST_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY'
test "$F06_LOCK_LIFECYCLE_EXPIRY_CONSENT" = 'I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY'
test "$F06_LOCK_DATABASE_URL" = 'postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test'

mkdir -p engineering/evidence
(
  cd engineering
  node --test tests/f06-lock-expiry.test.mjs tests/f06-lock-http.test.mjs tests/f06-lock-inherited-priority.test.mjs tests/f06-lock-internal-waitlist.test.mjs tests/f06-lock-pending-provenance.test.mjs tests/f06-lock-priority-and-replay.test.mjs tests/f06-lock-readiness.test.mjs tests/f06-lock-service-boundary.test.mjs
) 2>&1 | tee engineering/evidence/F06_LOCK_BASELINE_NODE_ACCEPTANCE_TAP.log
(
  cd engineering
  node --test tests/f06-lock-lifecycle-*.test.mjs
) 2>&1 | tee engineering/evidence/F06_LOCK_LIFECYCLE_NODE_ACCEPTANCE_TAP.log

ids="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
# The only f06_lock_ci role was created by the parent Deposit job.
# Fail unless it is still the exact synthetic non-privileged test identity.
test "$(docker exec "$ids" psql -X -At -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "SELECT (rolsuper=false AND rolcreatedb=false AND rolcreaterole=false AND rolreplication=false)::text FROM pg_roles WHERE rolname='f06_lock_ci'")" = true
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c 'CREATE DATABASE f06_lock_test OWNER f06_lock_ci'

dump="$(mktemp /tmp/f06-real-deposit-native-baseline-XXXXXX.dump)"
trap 'rm -f "$dump"' EXIT
# The signed parent seal is preserved separately as f03_auth_restore_$GITHUB_RUN_ID.
# Keep the post-scenario DB intact under a run-specific name; rebuild the
# independent disposable F05 source so the official F05-8 service issues
# Priority while its signed v24 ledger is current. No Priority is hand-inserted.
export F04_1_ISOLATION_CONFIRM=I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY
export F04_2_ISOLATION_CONFIRM=I_AUTHORIZE_F04_2_DISPOSABLE_PG16_HTTPS_ONLY
export F04_3_ISOLATION_CONFIRM=I_AUTHORIZE_F04_3_DISPOSABLE_PG16_HTTPS_ONLY
export F04_4_ISOLATION_CONFIRM=I_AUTHORIZE_F04_4_DISPOSABLE_PG16_HTTPS_ONLY
export F05_1_ISOLATION_CONFIRM=I_AUTHORIZE_F05_1_DISPOSABLE_PG16_HTTPS_ONLY
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "ALTER DATABASE f03_auth_test RENAME TO f03_auth_deposit_scenario_$GITHUB_RUN_ID"
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c 'CREATE DATABASE f03_auth_test OWNER f03_ci'
(
  cd engineering
  node f05/wholesale-to-mingbang-conversion/ci-run.mjs source
  node f05/wholesale-to-mingbang-conversion/runner.mjs --verify
  node f05/customer-price-entitlement-cycle/ci-seed-jyt.mjs
  for stage in f05/favorite-physical-carrier f05/customer-price-entitlement-cycle; do
    node "$stage/runner.mjs" --apply
    node "$stage/runner.mjs" --verify
  done
  node f05/employee-price-quota-adjustment/runner.mjs --apply
  node f05/employee-price-quota-adjustment/runner.mjs --verify
  node f05/employee-price-quota-adjustment/fixtures.mjs
  node f05/find-car-application-demand-eligibility/runner.mjs --apply
  node f05/find-car-application-demand-eligibility/runner.mjs --verify
  node f05/find-car-application-demand-eligibility/fixtures.mjs
  node f05/deterministic-matching-readiness-four-tier/preseed.mjs
  node f05/deterministic-matching-readiness-four-tier/runner.mjs --apply
  node f05/deterministic-matching-readiness-four-tier/runner.mjs --verify
  node f05/deterministic-matching-readiness-four-tier/fixtures.mjs
  node f05/priority-arbitration-ttl-handover/preseed-v23.mjs
  node f05/priority-arbitration-ttl-handover/runner.mjs --apply
  node f05/priority-arbitration-ttl-handover/runner.mjs --verify
  node f06/deposit-ledger-http-pg16/seed-priority-compat.mjs
  node f05/recommendation-visibility-grants/runner.mjs --apply
  node f05/recommendation-visibility-grants/runner.mjs --verify
  node f05/pdm17-public-pool-owner-claim/runner.mjs --apply
  node f05/pdm17-public-pool-owner-claim/runner.mjs --verify
  node f05/consultation-assignee-sla/runner.mjs --apply
  node f05/consultation-assignee-sla/runner.mjs --verify
)
echo F06_AUTHENTIC_F05_V26_PRIORITY_BASE_READY
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" \
  pg_dump -h127.0.0.1 -Uf03_ci -df03_auth_test --format=custom --no-owner --no-privileges > "$dump"
test -s "$dump"
docker exec -i -e PGPASSWORD=f06_ci_synthetic_only "$ids" \
  pg_restore -h127.0.0.1 -Uf06_lock_ci -df06_lock_test --no-owner --no-privileges --exit-on-error < "$dump"
# Original signed F05 Priority is inspected read-only; no fake issuer data.
docker exec -e PGPASSWORD=f06_ci_synthetic_only "$ids" \
  psql -h127.0.0.1 -Uf06_lock_ci -df06_lock_test -X -v ON_ERROR_STOP=1 -Atc "
SELECT 'F06_ORIGINAL_PRIORITY_PROVENANCE ' || COALESCE(json_agg(row_to_json(z))::text,'[]')
FROM (
 SELECT p.priority_id,p.customer_id,p.status,p.expires_at,
        r.status AS source_status,
        (r.source_signature=p.source_signature) AS source_signature_matches,
        (p.expires_at>clock_timestamp()) AS still_valid,
        EXISTS(SELECT 1 FROM public.locks l WHERE l.vehicle_id=p.vehicle_id
          AND l.lock_status='active') AS competing_active_lock
 FROM public.f05_8_priority_ci p
 LEFT JOIN public.f05_7_result_versions_ci r
   ON r.result_id=p.source_match_result_id
 WHERE p.customer_id=899612
 ORDER BY p.priority_id
) z;"
priority_count="$(docker exec -e PGPASSWORD=f06_ci_synthetic_only "$ids" \
  psql -h127.0.0.1 -Uf06_lock_ci -df06_lock_test -X -v ON_ERROR_STOP=1 -Atc "
SELECT count(*) FROM public.f05_8_priority_ci p
JOIN public.f05_7_result_versions_ci r
 ON r.result_id=p.source_match_result_id AND r.source_signature=p.source_signature
WHERE p.customer_id=899612 AND p.status='active'
 AND p.expires_at>clock_timestamp() AND r.status='current'
")"
test "$priority_count" -ge 1
echo "F06_AUTHENTIC_PRIORITY_SOURCE_COPY_PASS count=$priority_count"
(
  cd engineering
  node scripts/f06-lock-prepare-disposable.mjs
  node scripts/f06-lock-pg16-acceptance.mjs
) 2>&1 | tee engineering/evidence/F06_PG16_NATIVE_ACCEPTANCE_RUN.log
grep -q F06_NATIVE_PG16_HTTP_ACCEPTANCE_PASS engineering/evidence/F06_PG16_NATIVE_ACCEPTANCE_RUN.log
docker exec -i -e PGPASSWORD=f06_ci_synthetic_only "$ids" \
  psql -h127.0.0.1 -Uf06_lock_ci -df06_lock_test -X -v ON_ERROR_STOP=1 \
  < engineering/sql/f06-lock-lifecycle-disposable-only.sql
(
  cd engineering
  node scripts/f06-lock-lifecycle-pg16-acceptance.mjs
) 2>&1 | tee engineering/evidence/F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_RUN.log
grep -q F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_PASS engineering/evidence/F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_RUN.log
echo "F06_REAL_DEPOSIT_INHERITED_NATIVE_LOCK_REGRESSION_PASS head=$GITHUB_SHA"
