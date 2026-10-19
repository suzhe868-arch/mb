#!/usr/bin/env bash
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test "${GITHUB_EVENT_NAME:-}" = push
test "${GITHUB_REPOSITORY:-}" = suzhe868-arch/mb
test "${GITHUB_REF:-}" = refs/heads/feat/f06-real-lockrequest-http-pg16-01
test -n "${GITHUB_SHA:-}"
test "$(git rev-parse HEAD)" = "$GITHUB_SHA"
test "${APP_ENV:-}" = test
test "${NODE_ENV:-}" = test
test "${API_HOST:-}" = 127.0.0.1
test "${F06_LOCK_TEST_CONSENT:-}" = I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY
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
node --test tests/f06-lock-*.test.mjs
echo F06_NODE_SAME_SHA_COMPLETE
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
node scripts/f06-lock-pg16-acceptance.mjs
echo "F06_NATIVE_PG16_HTTP_SINGLE_JOB_COMPLETE head=$GITHUB_SHA"
