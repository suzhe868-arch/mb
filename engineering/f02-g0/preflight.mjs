import pg from 'pg';
import {verifyIsolatedConfig,forbidMigrationExecution,assertReadOnlyPg16Identity} from './guard.mjs';
forbidMigrationExecution(process.argv.slice(2)); // --apply, --reset, legacy scripts: hard refused.
const cfg=verifyIsolatedConfig();
const client=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1800,query_timeout:2500,statement_timeout:2500,application_name:'mingbang_f02_g0_readonly'});
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const result=await client.query("SELECT current_database() AS database_name, current_user AS db_user, current_setting('server_version_num')::integer AS version_num, (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS is_superuser, (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS can_create_database, (SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS can_create_roles, (SELECT COUNT(*)::integer FROM pg_catalog.pg_tables WHERE schemaname='public') AS public_table_count");
  assertReadOnlyPg16Identity(result.rows[0]);
  await client.query('SAVEPOINT readonly_probe');
  let refused=false;
  try { await client.query('CREATE TEMP TABLE f02_g0_must_not_create(id integer)'); }
  catch(e) {refused=e?.code==='25006';}
  await client.query('ROLLBACK TO SAVEPOINT readonly_probe');
  if(!refused)throw Error('F02_G0_ENGINE_READONLY_NOT_ENFORCED');
  await client.query('ROLLBACK');
  console.log('F02-G0 PG16 identity PASS: f02_schema_test / f02_ci / non-superuser / empty-public-schema');
  console.log('F02-G0 server READ ONLY refusal PASS: SQLSTATE 25006; migration execution disabled');
}catch(e){
  console.error('F02-G0 preflight FAIL:',String(e?.message).startsWith('F02_G0_')?e.message:'DATABASE_OR_GUARD_FAILED');
  process.exitCode=1;
}finally{try{await client.end();}catch{/* no secrets */}}
