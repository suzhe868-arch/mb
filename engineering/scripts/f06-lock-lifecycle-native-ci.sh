#!/usr/bin/env bash
set -euo pipefail
assert_tap_summary() {
  local log="$1" expected="$2" mode="$3" label="$4"
  local tests pass fail skipped cancelled
  tests="$(awk '$1=="#" && $2=="tests" {v=$3} END {print v+0}' "$log")"
  pass="$(awk '$1=="#" && $2=="pass" {v=$3} END {print v+0}' "$log")"
  fail="$(awk '$1=="#" && $2=="fail" {v=$3} END {print v+0}' "$log")"
  skipped="$(awk '$1=="#" && $2=="skipped" {v=$3} END {print v+0}' "$log")"
  cancelled="$(awk '$1=="#" && $2=="cancelled" {v=$3} END {print v+0}' "$log")"
  if [[ "$mode" == exact ]]; then test "$tests" -eq "$expected"; else test "$tests" -ge "$expected"; fi
  test "$pass" -eq "$tests"
  test "$fail" -eq 0
  test "$skipped" -eq 0
  test "$cancelled" -eq 0
  printf '%s tests=%s pass=%s fail=%s skipped=%s cancelled=%s\n' "$label" "$tests" "$pass" "$fail" "$skipped" "$cancelled"
}
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_EVENT_NAME:-}" = push
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test "${GITHUB_REF:-}" = refs/heads/feat/f06-real-lock-lifecycle-http-pg16-02
test -n "${GITHUB_SHA:-}"
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
test "${APP_ENV:-}" = test
test "${NODE_ENV:-}" = test
test "${API_HOST:-}" = 127.0.0.1
test "${F06_LOCK_TEST_CONSENT:-}" = I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY
test "${F06_LOCK_LIFECYCLE_TEST_CONSENT:-}" = I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY
test "${F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:-}" = I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY
test "${F06_LOCK_DATABASE_URL:-}" = postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test
test "${F03_1_DATABASE_URL:-}" = postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test
export CI=true
export F03_1_ISOLATION_CONFIRM=I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY
export F05_2_ISOLATION_CONFIRM=I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY
export F04_1_ISOLATION_CONFIRM=I_AUTHORIZE_F04_1_DISPOSABLE_PG16_HTTPS_ONLY
export F04_2_ISOLATION_CONFIRM=I_AUTHORIZE_F04_2_DISPOSABLE_PG16_HTTPS_ONLY
export F04_3_ISOLATION_CONFIRM=I_AUTHORIZE_F04_3_DISPOSABLE_PG16_HTTPS_ONLY
export F04_4_ISOLATION_CONFIRM=I_AUTHORIZE_F04_4_DISPOSABLE_PG16_HTTPS_ONLY
export F05_1_ISOLATION_CONFIRM=I_AUTHORIZE_F05_1_DISPOSABLE_PG16_HTTPS_ONLY
echo "F06_OFFICIAL_SHA $GITHUB_SHA"
echo "F06_REAL_NODE_VERSION $(node --version)"
cd engineering
npm ci --ignore-scripts --no-audit --no-fund
node --check src/f06-lock-lifecycle-service.mjs
node --check src/f06-lock-lifecycle-http.mjs
node --check src/f06-lock-lifecycle-finance-test-adapter.mjs
node --check src/f06-lock-runtime.mjs
node --check src/f06-lock-service.mjs
node --check tests/f06-lock-lifecycle-service.test.mjs
node --check tests/f06-lock-lifecycle-http.test.mjs
node --check integration/f06-lock-lifecycle.pg16.test.mjs
node --check scripts/f06-lock-lifecycle-pg16-acceptance.mjs
bash -n scripts/f06-lock-lifecycle-native-ci.sh
mkdir -p evidence
node --test tests/f06-lock-expiry.test.mjs tests/f06-lock-http.test.mjs tests/f06-lock-inherited-priority.test.mjs tests/f06-lock-internal-waitlist.test.mjs tests/f06-lock-pending-provenance.test.mjs tests/f06-lock-priority-and-replay.test.mjs tests/f06-lock-readiness.test.mjs tests/f06-lock-service-boundary.test.mjs 2>&1 | tee evidence/F06_LOCK_BASELINE_NODE_ACCEPTANCE_TAP.log
assert_tap_summary evidence/F06_LOCK_BASELINE_NODE_ACCEPTANCE_TAP.log 54 exact F06_BASELINE_NODE
node --test tests/f06-lock-lifecycle-*.test.mjs 2>&1 | tee evidence/F06_LOCK_LIFECYCLE_NODE_ACCEPTANCE_TAP.log
assert_tap_summary evidence/F06_LOCK_LIFECYCLE_NODE_ACCEPTANCE_TAP.log 20 minimum F06_LIFECYCLE_NODE
echo "F06_NODE_BASELINE_54_AND_LIFECYCLE_TESTS_COMPLETE head=$GITHUB_SHA"
ids="$(docker ps --filter ancestor=postgres:16-alpine --format '{{.ID}}')"
test "$(printf '%s\n' "$ids" | sed '/^$/d' | wc -l)" -eq 1
pgid="$(docker image inspect postgres:16-alpine --format '{{.Id}}')"
docker tag postgres:16-alpine public.ecr.aws/docker/library/postgres:16-alpine
test "$(docker image inspect public.ecr.aws/docker/library/postgres:16-alpine --format '{{.Id}}')" = "$pgid"
test "$(docker ps --filter ancestor=public.ecr.aws/docker/library/postgres:16-alpine --format '{{.ID}}')" = "$ids"
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE ROLE f03_ci LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD 'f03_ci_synthetic_only'"
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f03_auth_test OWNER f03_ci"
# ORIGINAL unmodified migrations prove the 94-table M94 and all F05 v26 ledger entries.
node f05/wholesale-to-mingbang-conversion/ci-run.mjs source
node f05/wholesale-to-mingbang-conversion/runner.mjs --verify
node f05/customer-price-entitlement-cycle/ci-seed-jyt.mjs
# Each fixture verifies its *own* signed version and must precede next migration.
for stage in f05/favorite-physical-carrier f05/customer-price-entitlement-cycle
do
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
# Original F05-8 service creates a genuine signed CI Priority from current Match, no manual Source insert.
node scripts/f06-lock-seed-signed-priority.mjs
node f05/recommendation-visibility-grants/runner.mjs --apply
node f05/recommendation-visibility-grants/runner.mjs --verify
node f05/pdm17-public-pool-owner-claim/runner.mjs --apply
node f05/pdm17-public-pool-owner-claim/runner.mjs --verify
node f05/consultation-assignee-sla/runner.mjs --apply
node f05/consultation-assignee-sla/runner.mjs --verify
echo F06_ORIGINAL_SIGNED_M94_F05_24_MIGRATIONS_VERIFIED
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE ROLE f06_lock_ci LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD 'f06_ci_synthetic_only'"
docker exec "$ids" psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres \
 -c "CREATE DATABASE f06_lock_test OWNER f06_lock_ci"
dump="$(mktemp /tmp/f06-lock-authentic-pg16-XXXXXX.dump)"
trap 'rm -f "$dump"' EXIT
docker exec -e PGPASSWORD=f03_ci_synthetic_only "$ids" \
 pg_dump -h127.0.0.1 -Uf03_ci -df03_auth_test --format=custom --no-owner --no-privileges > "$dump"
test -s "$dump"
docker exec -i -e PGPASSWORD=f06_ci_synthetic_only "$ids" \
 pg_restore -h127.0.0.1 -Uf06_lock_ci -df06_lock_test --no-owner --no-privileges --exit-on-error < "$dump"
rm -f "$dump"
# The signed ledger is COPY-VERIFIED, never spoofed or manually inserted.
node --input-type=module <<'JS'
import pg from 'pg';
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const out=[];
for(const [who,url] of [
 ['source',process.env.F03_1_DATABASE_URL],
 ['target',process.env.F06_LOCK_DATABASE_URL]]) {
 const c=new pg.Client({connectionString:url});
 await c.connect();
 try{
  const id=(await c.query("SELECT current_database() db,current_user role,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
  const chain=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
  if(id.v<160000||id.v>=170000||id.su||chain.length!==24||
     chain[23].migration_id!=='000026_consultation_ci_only')throw Error('F06_AUTHENTIC_SIGNED_CHAIN_MISSING_'+who);
  out.push({who,sha:sha(chain),count:chain.length,role:id.role,db:id.db});
 }finally{await c.end()}
}
if(out[0].sha!==out[1].sha||out[0].db!=='f03_auth_test'||out[1].db!=='f06_lock_test'||
 out[0].role!=='f03_ci'||out[1].role!=='f06_lock_ci')throw Error('F06_AUTHENTIC_LEDGER_RESTORE_DRIFT');
console.info('F06_AUTHENTIC_ORIGINAL_F03_F05_LEDGER_PARITY',JSON.stringify(out));
JS
node scripts/f06-lock-prepare-disposable.mjs
node scripts/f06-lock-pg16-acceptance.mjs 2>&1 | tee evidence/F06_PG16_NATIVE_ACCEPTANCE_RUN.log
grep -q 'F06_NATIVE_PG16_HTTP_ACCEPTANCE_PASS' evidence/F06_PG16_NATIVE_ACCEPTANCE_RUN.log
docker exec -i -e PGPASSWORD=f06_ci_synthetic_only "$ids" psql -h127.0.0.1 -Uf06_lock_ci -df06_lock_test -X -v ON_ERROR_STOP=1 < sql/f06-lock-lifecycle-disposable-only.sql
node scripts/f06-lock-lifecycle-pg16-acceptance.mjs 2>&1 | tee evidence/F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_RUN.log
grep -q 'F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_PASS' evidence/F06_LOCK_LIFECYCLE_PG16_ACCEPTANCE_RUN.log
echo "F06_LIFECYCLE_ALL_GATES_PASS head=$GITHUB_SHA baseline_node=54 lifecycle_pg16_min=32 productionReady=false"
