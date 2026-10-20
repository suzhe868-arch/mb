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
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "CREATE ROLE f06_lock_ci LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD 'f06_ci_synthetic_only'"
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c 'CREATE DATABASE f06_lock_test OWNER f06_lock_ci'

dump="$(mktemp /tmp/f06-real-deposit-native-baseline-XXXXXX.dump)"
trap 'rm -f "$dump"' EXIT
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
