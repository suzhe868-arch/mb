// PR62真实Scenario数据库：PG1安装后的版本化Public编目、190旧父表全行COUNT/MD5及24 Ledger实证。
// CI-only；只读PG16和追加非生产证据文件，绝不修改任何已签父模式或执行生产DDL。
import assert from 'node:assert/strict';
import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {connect} from './migration.mjs';
import {verify5CVersioned} from './pg1-versioned-adapter.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const digest=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const c=await connect(),out=resolve('f06/transaction-priority-admission-ci/artifacts/source');
await mkdir(out,{recursive:true});
try{
 const verified=await verify5CVersioned(c);
 const info=(await c.query("SELECT current_database() db,pg_backend_pid() pid,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,current_user usr,current_setting('server_version_num')::int version,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(info.db,'f03_auth_test');assert.equal(info.usr,'f03_ci');assert.equal(info.su,false);
 assert.ok(info.version>=160000&&info.version<170000);
 const prior=JSON.parse(await readFile(resolve(out,'audit-before.json'),'utf8'));
 assert.equal(info.oid,prior.meta.oid,'PG1_SCENARIO_MUST_USE_ORIGINAL_NATIVE_PHYSICAL_OID');
 const namespaces=['public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci','f06_5a_ci','f06_5b_ci'];
 const named=(await c.query("SELECT n.nspname s,r.relname t FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=ANY($1::text[]) AND r.relkind IN ('r','p') ORDER BY n.nspname,r.relname",[namespaces])).rows;
 assert.equal(named.length,190);
 const tables={};
 for(const {s,t} of named){
  assert.match(s,/^[a-z0-9_]+$/);assert.match(t,/^[a-z0-9_]+$/);
  tables[s+'.'+t]=(await c.query("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) h FROM "+s+"."+t+" x")).rows[0];
 }
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24);
 assert.equal(digest(ledger),prior.ledgerDigest,'PG1_ORIGINAL_24_LEDGER_DRIFT');
 const catalog=await getPublicStructure(c);
 assert.equal(catalog.sha256,verified.newCatalog);
 const att=(await c.query('SELECT * FROM f06_5c_pg1_ci.attestation')).rows;
 assert.equal(att.length,1);
 assert.equal(att[0].source_sha256,verified.sourcePatchSha256||att[0].source_sha256);
 assert.equal(att[0].delta_sha256,verified.deltaSHA256);
 assert.equal(att[0].parent_catalog_sha256,prior.catalogSha256);
 assert.equal(att[0].post_catalog_sha256,catalog.sha256);
 assert.equal(att[0].delta_manifest.length,3);
 const expected=[
  'constraint|transactions.pg1_deferred_signed_cancel',
  'trigger|f05_8_priority_ci.pg1_signed_priority_insert',
  'trigger|transactions.pg1_deferred_signed_cancel'].sort();
 assert.deepEqual(att[0].delta_manifest.map(z=>z.kind+'|'+z.name).sort(),expected);
 const payments=(await c.query('SELECT count(*)::int n FROM public.refund_payments')).rows[0].n;
 assert.equal(payments,0,'PG1_REAL_REFUND_PAYMENTS_FORBIDDEN');
 const proof={status:'F06_5C_PG1_VERSIONED_SCENARIO_FULL_SEAL_PASS',
  sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,physicalScenarioOid:info.oid,
  backendPid:info.pid,PG16:true,nonSuperuser:true,oldParentTables:190,
  oldParentAllRowsCountMd5:tables,oldParentAllRowsSha256:digest(tables),frozen24LedgerSha:prior.ledgerDigest,
  priorCatalogSha:prior.catalogSha256,newCatalogSha:catalog.sha256,
  patchSourceSha:att[0].source_sha256,deltaSha:att[0].delta_sha256,
  manifest:att[0].delta_manifest,syntheticRealPayments:payments,
  older5CSignedSource:verified.f06_5c_source,production:'NOT_AUTHORIZED'};
 await writeFile(resolve(out,'pg1-scenario-seal.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
 console.log(proof.status,JSON.stringify({sha:proof.sha,oid:proof.physicalScenarioOid,
  parentTables:proof.oldParentTables,parentRowsSHA:proof.oldParentAllRowsSha256,
  ledgerSHA:proof.frozen24LedgerSha,oldCatalog:proof.priorCatalogSha,
  newCatalog:proof.newCatalogSha,deltaSHA:proof.deltaSha,physicalBackend:proof.backendPid}));
}finally{await c.end()}
