import pg from 'pg';
import {compileCurrentInitial} from './compile-current.mjs';
import {verifyF021Target,verifyDatabaseIdentity,checkMigrationVersions} from './guard.mjs';
const mode=process.argv.slice(2);
if(mode.length!==1||!['--apply','--verify','--verify-empty'].includes(mode[0]))throw Error('F02_1_REFUSED_ARGUMENTS');
const cfg=verifyF021Target(),candidate=await compileCurrentInitial();
const client=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:2000,query_timeout:90000,statement_timeout:90000,application_name:'mb_f02_1_disposable_only'});
let begun=false;
try{
 await client.connect();
 await client.query('BEGIN'+(mode[0]==='--apply'?'':' READ ONLY'));begun=true;
 if(mode[0]==='--apply')await client.query('SELECT pg_advisory_xact_lock(20261008, 201)');
 const id=(await client.query("SELECT current_database() AS database_name,current_user AS db_user,current_setting('server_version_num')::integer AS version_num,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS is_superuser,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS can_create_database,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS can_create_roles,(SELECT COUNT(*)::integer FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%') AS non_public_user_schema_count")).rows[0];
 verifyDatabaseIdentity(id);
 const tables=(await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(x=>x.tablename);
 if(mode[0]==='--verify-empty'){
  if(tables.length!==0)throw Error('F02_1_NOT_EMPTY_AFTER_INJECTED_ROLLBACK');
  await client.query('COMMIT');begun=false;
  console.log('F02-1 EMPTY ROLLBACK PASS: public tables=0, no migration metadata');
 }else{
  if(tables.length===0){
   if(mode[0]!=='--apply')throw Error('F02_1_NOT_APPLIED');
   await client.query('CREATE TABLE public.f02_schema_migrations (migration_id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
   await client.query(candidate.sql);
   if(process.env.F02_1_INJECT_TX_FAILURE==='CI_TEST_AFTER_DDL')throw Error('F02_1_INJECTED_AFTER_DDL');
   await client.query('INSERT INTO public.f02_schema_migrations(migration_id,checksum) VALUES ($1,$2)',['000001_current_initial',candidate.checksum]);
   console.log('F02-1 MIGRATION APPLIED: '+JSON.stringify(candidate.stats)+' checksum='+candidate.checksum);
  }else{
   if(!tables.includes('f02_schema_migrations'))throw Error('F02_1_REFUSED_PREEXISTING_USER_SCHEMA');
   const rows=(await client.query('SELECT migration_id,checksum FROM public.f02_schema_migrations ORDER BY migration_id')).rows;
   if(!checkMigrationVersions(rows,candidate.checksum))throw Error('F02_1_REFUSED_UNTRACKED_PARTIAL_MIGRATION');
   if(tables.length!==candidate.stats.tables+1)throw Error('F02_1_REFUSED_UNKNOWN_TABLES_OR_MISSING_TABLES');
   console.log('F02-1 MIGRATION IDEMPOTENT: known checksum, expected table inventory');
  }
  const count=(await client.query("SELECT COUNT(*)::integer AS n FROM pg_catalog.pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace")).rows[0].n;
  if(count!==candidate.stats.staticForeignKeys+candidate.stats.extraForeignKeys)throw Error('F02_1_REAL_FK_MISMATCH_'+count);
  const physicalCols=(await client.query("SELECT COUNT(*)::integer AS n FROM information_schema.columns WHERE table_schema='public' AND table_name<>'f02_schema_migrations'")).rows[0].n;
  if(physicalCols!==candidate.stats.columns)throw Error('F02_1_REAL_COLUMN_MISMATCH_'+physicalCols);
  const adminCols=(await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='system_admins'")).rows.map(x=>x.column_name);
  if(adminCols.length!==5||adminCols.includes('login_account')||adminCols.includes('credential_hash'))throw Error('F02_1_DUPLICATE_ADMIN_CREDENTIAL_COLUMN');
  await client.query('COMMIT');begun=false;
  console.log('F02-1 PHYSICAL SCHEMA PASS: tables='+candidate.stats.tables+' columns='+physicalCols+' foreign_keys='+count+' admin_columns=5; F02_1_ACCEPTED=NO');
 }
}catch(e){
 if(begun)try{await client.query('ROLLBACK')}catch{}
 console.error('F02-1 MIGRATION FAIL:',e.message);
 process.exitCode=1;
}finally{try{await client.end()}catch{}}
