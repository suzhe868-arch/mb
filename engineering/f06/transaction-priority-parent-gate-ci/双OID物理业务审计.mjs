// PG1：真正的第二物理PG16数据库OID的完整旧190表逐行COUNT+MD5与版本化Catalog审计。
// 绝不在SQL客户端内模拟数据库OID、生成固定回放Hash或重算预期值当作证据。
// --before 对当前隔离PG16真实签名现况留档；ci-job.sh物理DROP/CREATE/pg_restore后
// --after 独立重新建立连接，校验真实新OID、旧190表每项内容、24迁移和新增三项Catalog。
import assert from 'node:assert/strict';
import pg from 'pg';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify,gate} from './catalog-delta-verifier.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const DIR=new URL('./artifacts/source/',import.meta.url);
const BEFORE=new URL('PG1第一OID原生签名快照.json',DIR);
const AFTER=new URL('PG1双OID物理审计.json',DIR);
const sha256=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const schemas=['public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci',
 'f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci','f06_5a_ci','f06_5b_ci'];
async function facts(c){
 const db=(await c.query("SELECT current_database() name,current_user usr,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,current_setting('server_version_num')::int version")).rows[0];
 assert.equal(db.name,'f03_auth_test');assert.equal(db.usr,'f03_ci');
 assert.ok(db.version>=160000&&db.version<170000);
 const snapshot=await getPublicStructure(c);
 const proof=await verify(c);
 assert.equal(proof.verified,true);
 assert.equal(snapshot.sha256,proof.postCatalog);
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24,'PG1_OID_AUDIT_24_FROZEN_LEDGER_REQUIRED');
 const names=(await c.query("SELECT n.nspname s,t.relname t FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace "+
 "WHERE n.nspname=ANY($1::text[]) AND t.relkind IN ('r','p') ORDER BY 1,2",[schemas])).rows;
 assert.equal(names.length,190,'PG1_OID_AUDIT_190_FROZEN_PARENT_TABLES_REQUIRED');
 const seals={};
 for(const {s,t} of names){
  assert.match(s,/^[a-z0-9_]+$/);assert.match(t,/^[a-z0-9_]+$/);
  const x=(await c.query("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) h FROM "+s+"."+t+" x")).rows[0];
  seals[s+'.'+t]=x;
 }
 const parentFuncs=(await c.query("SELECT p.proname,pg_get_functiondef(p.oid) AS def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace "+
 "WHERE n.nspname='public' AND p.proname IN ('f05_8_priority_guard','f05_8_reconcile_scope_ci','f05_8_close_for_occupancy','f05_8_source_change_ci') ORDER BY p.proname")).rows;
 assert.equal(parentFuncs.length,4);
 const trigs=(await c.query("SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid,true) AS def FROM pg_trigger t "+
 "JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace "+
 "WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgname LIKE 'f05_8_%' ORDER BY c.relname,t.tgname")).rows;
 const patch=(await c.query('SELECT * FROM f06_5c_pg1_ci.attestation')).rows;
 assert.equal(patch.length,1);
 return{oid:db.oid,database:db.name,user:db.usr,version:db.version,
  sourceSHA:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,
  catalogSHA:snapshot.sha256,signatureSHA:sha256(proof),
  proof,ledgerSHA:sha256(ledger),oldPriorityFunctionsSHA:sha256(parentFuncs),
  originalF05TriggersSHA:sha256(trigs),patchAttestationSHA:sha256(patch),
  tableCount:names.length,tableFacts:seals,tableFactsSHA:sha256(seals)};
}
gate();
const mode=process.argv[2];if(!['--before','--after'].includes(mode))throw Error('PG1_OID_AUDIT_EXPLICIT_STAGE_REQUIRED');
const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:5000,query_timeout:90000});
await c.connect();
try{
 const current=await facts(c);
 if(mode==='--before'){
  await mkdir(DIR,{recursive:true});
  await writeFile(BEFORE,JSON.stringify(current,null,2)+'\n');
  console.log('PG1_OID_AUDIT_NATIVE_SCENARIO_SEALED',JSON.stringify({oid:current.oid,parentTables:current.tableCount,ledger:current.ledgerSHA,catalog:current.catalogSHA}));
 }else{
  const old=JSON.parse(await readFile(BEFORE,'utf8'));
  assert.notEqual(current.oid,old.oid,'PG1_NATIVE_RESTORED_DB_OID_MUST_DIFFER');
  for(const name of ['database','user','version','sourceSHA','run','catalogSHA','signatureSHA','ledgerSHA','oldPriorityFunctionsSHA','originalF05TriggersSHA','patchAttestationSHA','tableCount','tableFactsSHA'])
   assert.deepEqual(current[name],old[name],'PG1_OID_FROZEN_SEAL_DRIFT_'+name);
  assert.deepEqual(current.tableFacts,old.tableFacts,'PG1_OID_190_TABLE_CONTENT_MISMATCH');
  assert.deepEqual(current.proof,old.proof,'PG1_OID_SOURCE_AND_CATALOG_SIGNED_PROOF_MISMATCH');
  const report={status:'PG1_TWO_REAL_PHYSICAL_PG16_DATABASE_OIDS_PARENT190_SEAL_PASS',
   firstOid:old.oid,secondOid:current.oid,old190TableCount:current.tableCount,
   old190RowsSealed:current.tableFactsSHA,frozen24LedgerSHA:current.ledgerSHA,
   catalogSHA:current.catalogSHA,patchSignatureSHA:current.patchAttestationSHA,
   sourceSHA:current.sourceSHA,run:current.run,database:current.database,PG16:true,
   signer:'REAL_POSTGRESQL16_NON_SUPERUSER_SHA256_AND_ROW_MD5'};
  await writeFile(AFTER,JSON.stringify(report,null,2)+'\n');
  console.log('PG1_TWO_REAL_PHYSICAL_PG16_DATABASE_OIDS_PARENT190_SEAL_PASS',JSON.stringify(report));
 }
}finally{await c.end()}
