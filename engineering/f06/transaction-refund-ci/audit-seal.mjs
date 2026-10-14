import {connect,withF064C} from './migration.mjs';
import {verify as parentVerify} from '../post-handoff-cancel-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const mode=process.argv[2];
if(!['before','after'].includes(mode)||process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true'||
 process.env.GITHUB_REF!=='refs/heads/feat/f06-5a-transaction-refund-pending-ci'||process.env.GITHUB_EVENT_NAME!=='push')
 throw Error('F06_5A_AUDIT_REQUIRES_SIGNED_PUSH');
const c=await connect(),out=resolve('f06/transaction-refund-ci/artifacts/source');
await mkdir(out,{recursive:true});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function snap(){
 assert.equal((await withF064C(()=>parentVerify(c))).verified,true);
 const meta=(await c.query("SELECT current_database() db,pg_backend_pid() pid,current_user u,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(meta.db,'f03_auth_test');assert.equal(meta.u,'f03_ci');assert.equal(meta.su,false);
 const tables=(await c.query("SELECT n.nspname s,r.relname t FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace "+
  "WHERE n.nspname IN('public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci') AND r.relkind IN('r','p') ORDER BY n.nspname,r.relname")).rows;
 assert.ok(tables.length>=184,'F06_5A_SIGNED_PARENT_ENTITY_MINIMUM_184');
 const results={};for(const {s,t} of tables){
  assert.match(s,/^(public|d1_owner_ci|f06_1_lock_ci|f06_2_ci|f06_3a_ci|f06_3b_ci|f06_3c1_ci|f06_4a_ci|f06_4b_ci|f06_4c_ci)$/);assert.match(t,/^[a-z0-9_]+$/);
  results[s+'.'+t]=(await c.query("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) hash FROM "+s+"."+t+" x")).rows[0];
 }
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const catalog=await getPublicStructure(c);
 const d1=(await c.query('SELECT * FROM d1_owner_ci.attestation')).rows;
 const seals=[];
 for(const p of ['f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci'])
  seals.push({p,rows:(await c.query('SELECT * FROM '+p+'.attestation')).rows});
 assert.equal(ledger.length,24);assert.equal(ledger[23].structure_sha256,catalog.sha256);
 assert.equal(d1.length,1);assert.ok(seals.every(x=>x.rows.length===1));
 return {head:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,meta,tables:results,tableCount:tables.length,
  tableDigest:digest(results),ledgerDigest:digest(ledger),catalogSha256:catalog.sha256,
  d1Digest:digest(d1),parentSealDigest:digest(seals)};
}
try{
 const value=await snap(),path=resolve(out,'audit-before.json');
 if(mode==='before'){
  assert.equal((await c.query("SELECT to_regnamespace('f06_5a_ci')::text n")).rows[0].n,null);
  await writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  console.log('F06_5A_REAL_OLD_TABLES_SEALED',JSON.stringify({oid:value.meta.oid,tables:value.tableCount,digest:value.tableDigest}));
 }else{
  const old=JSON.parse(await readFile(path,'utf8'));
  assert.equal(value.head,old.head);assert.equal(value.run,old.run);
  assert.notEqual(value.meta.oid,old.meta.oid,'different PG physical database OIDs required');
  assert.equal((await c.query("SELECT to_regnamespace('f06_5a_ci')::text n")).rows[0].n,null);
  for(const key of ['tables','tableCount','tableDigest','ledgerDigest','catalogSha256','d1Digest','parentSealDigest'])
   assert.deepEqual(value[key],old[key],'F06_5A_GLOBAL_SEAL_DRIFT_'+key);
  const report={status:'PASS',head:value.head,runId:value.run,businessScenarioOid:old.meta.oid,
   independentAuditOid:value.meta.oid,beforePid:old.meta.pid,afterPid:value.meta.pid,
   tableCount:value.tableCount,tableDigest:value.tableDigest,ledgerDigest:value.ledgerDigest,
   publicCatalogSha256:value.catalogSha256,d1Seal:value.d1Digest,parentSeal:value.parentSealDigest,
   productionCancelIssuer:'SOURCE_GAP',payment:'NOT_AUTHORIZED',v1:'NOT_READY'};
  await writeFile(resolve(out,'audit-global-seal-pass.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log('F06_5A_TWO_PHYSICAL_PG_DATABASES_PARENT_184_TABLES_SEAL_PASS',JSON.stringify(report));
 }
}finally{await c.end()}
