// Bootstrap only a disposable PG16 database for the scheduler acceptance job.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {compileCurrentInitial} from '../f02-1/compile-current.mjs';
import {probeIsolatedCatalog,validateCatalogEnv} from '../src/catalog-readiness.mjs';

const EXPECTED_REF='refs/heads/feat/f05-7-matching-retry-scheduler-01';
if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||
 process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REF!==EXPECTED_REF||
 !process.env.GITHUB_RUN_ID||!process.env.GITHUB_SHA)
 throw Error('MATCH_RETRY_BOOTSTRAP_GITHUB_SCOPE_DENIED');
if(process.env.APP_ENV!=='test'||process.env.NODE_ENV!=='test'||process.env.API_HOST!=='127.0.0.1'||
 process.env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('MATCH_RETRY_BOOTSTRAP_TEST_ENV_REQUIRED');
validateCatalogEnv(process.env);

const admin=new pg.Client({
 connectionString:'postgres://postgres:disposable_bootstrap_only@127.0.0.1:5432/postgres',
 connectionTimeoutMillis:1000,query_timeout:3000,statement_timeout:3000,
 application_name:'f05_matching_retry_bootstrap_admin_disposable'
});
let client;
try{
 await admin.connect();
 const identity=(await admin.query(
  "SELECT current_database() AS db,current_user AS role,current_setting('server_version_num')::integer AS version,"+
  "(SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user) AS superuser"
 )).rows[0];
 if(identity.db!=='postgres'||identity.role!=='postgres'||identity.superuser!==true||
    identity.version<160000||identity.version>=170000)
  throw Error('MATCH_RETRY_BOOTSTRAP_ADMIN_PG16_IDENTITY_DENIED');
 const roleExists=(await admin.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='f05_catalog_ci'")).rowCount!==0;
 const dbExists=(await admin.query("SELECT 1 FROM pg_catalog.pg_database WHERE datname='f05_catalog_test'")).rowCount!==0;
 if(roleExists||dbExists)throw Error('MATCH_RETRY_BOOTSTRAP_TARGET_PREEXISTS');
 await admin.query("CREATE ROLE f05_catalog_ci WITH LOGIN PASSWORD 'disposable_f05_ci_only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
 await admin.query("CREATE DATABASE f05_catalog_test OWNER f05_catalog_ci");
 client=new pg.Client({
  connectionString:process.env.F05_CATALOG_DATABASE_URL,
  connectionTimeoutMillis:1000,query_timeout:5000,statement_timeout:5000,
  application_name:'f05_matching_retry_bootstrap_nonprivileged'
 });
 await client.connect();
 const appIdentity=(await client.query(
  "SELECT current_database() AS db,current_user AS role,current_setting('server_version_num')::integer AS version,"+
  "(SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user) AS superuser"
 )).rows[0];
 if(appIdentity.db!=='f05_catalog_test'||appIdentity.role!=='f05_catalog_ci'||
    appIdentity.superuser!==false||appIdentity.version<160000||appIdentity.version>=170000)
  throw Error('MATCH_RETRY_BOOTSTRAP_NONPRIVILEGED_PG16_IDENTITY_DENIED');

 await client.query('BEGIN');
 try{
  const candidate=await compileCurrentInitial();
  const pinned=JSON.parse(await readFile(new URL('../f02-1/migrations/000001_current_initial.manifest.json',import.meta.url),'utf8'));
  if(candidate.checksum!==pinned.sha256||candidate.stats.tables!==76||
     JSON.stringify(candidate.stats)!==JSON.stringify(pinned.stats))
   throw Error('MATCH_RETRY_BOOTSTRAP_F02_SCHEMA_CHECKSUM_MISMATCH');
  await client.query(candidate.sql);
  const initialTables=(await client.query(
   "SELECT count(*)::integer AS n FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace ns "+
   "ON ns.oid=c.relnamespace WHERE ns.nspname='public' AND c.relkind='r'"
  )).rows[0].n;
  if(initialTables!==76)throw Error('MATCH_RETRY_BOOTSTRAP_F02_TABLE_COUNT_MISMATCH');

  const migrations=[
   '000027_catalog_disposable_test_only.sql',
   '000028_matching_invalidation_disposable_test_only.sql',
   '000029_matching_evidence_stale_disposable_test_only.sql',
   '000030_matching_source_lock_disposable_test_only.sql',
   '000031_matching_ttl_retry_disposable_test_only.sql',
   '000032_matching_dictionary_disposable_test_only.sql',
   '000033_matching_candidate_discovery_disposable_test_only.sql',
   '000034_matching_hard_fields_disposable_test_only.sql',
   '000035_matching_discovery_paged_audit_disposable_test_only.sql',
   '000036_matching_rule_change_discovery_disposable_test_only.sql',
   '000037_matching_dictionary_field_check_disposable_test_only.sql',
   '000038_matching_optional_price_safe_view_disposable_test_only.sql',
   '000039_recommendation_lifecycle_disposable_test_only.sql',
   '000040_priority_arbitration_disposable_test_only.sql',
   '000041_priority_safe_consumer_disposable_test_only.sql',
   '000042_recommendation_free_price_disposable_test_only.sql',
   '000043_priority_ttl_sweep_disposable_test_only.sql',
   '000044_priority_qualification_disposable_test_only.sql',
   '000045_demand_lifecycle_disposable_test_only.sql',
   '000046_consultation_manager_capability_disposable_test_only.sql',
   '000047_vehicle_employee_read_scope_disposable_test_only.sql',
   '000048_catalog_sort_facts_disposable_test_only.sql',
   '000049_consultation_human_response_disposable_test_only.sql',
   '000050_priority_reliable_scheduler_disposable_test_only.sql'
  ];
  for(const filename of migrations){
   const sql=await readFile(new URL('../catalog/'+filename,import.meta.url),'utf8');
   await client.query(sql);
  }
  await client.query('COMMIT');
 }catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
 }
 const pool=new pg.Pool({
  connectionString:process.env.F05_CATALOG_DATABASE_URL,max:2,
  connectionTimeoutMillis:900,query_timeout:1800,statement_timeout:1800,
  application_name:'f05_matching_retry_schema_probe_disposable'
 });
 try{
  if(!await probeIsolatedCatalog(pool))throw Error('MATCH_RETRY_BOOTSTRAP_SCHEMA_PROBE_DENIED');
  const tables=(await pool.query(
   "SELECT count(*)::integer AS n FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace ns "+
   "ON ns.oid=c.relnamespace WHERE ns.nspname='public' AND c.relkind='r'"
  )).rows[0].n;
  if(tables!==127)throw Error('MATCH_RETRY_BOOTSTRAP_FINAL_TABLE_COUNT_MISMATCH');
  process.stdout.write('MATCH_RETRY_PG16_SCHEMA_READY tables='+tables+' role=f05_catalog_ci superuser=false production=false\n');
 }finally{
  await pool.end();
 }
}finally{
 await client?.end().catch(()=>{});
 await admin.end().catch(()=>{});
}
