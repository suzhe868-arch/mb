import {connect,withF062} from './migration.mjs';
import {verify as parentVerify} from '../lock-lifecycle-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const mode=process.argv[2];
if(!['before','after'].includes(mode)||process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true'||
 process.env.GITHUB_REF!=='refs/heads/feat/f06-3a-deposit-ledger-ci'||process.env.GITHUB_EVENT_NAME!=='push')
 throw Error('F06_3A_AUDIT_NOT_REAL_PUSH');
const c=await connect(),out=resolve('f06/deposit-ledger-ci/artifacts/source');
await mkdir(out,{recursive:true});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function snap(){
 assert.equal((await withF062(()=>parentVerify(c))).verified,true);
 const meta=(await c.query("SELECT current_database() db,pg_backend_pid() pid,current_user u,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(meta.db,'f03_auth_test');assert.equal(meta.u,'f03_ci');assert.equal(meta.su,false);
 const paths=(await c.query("SELECT n.nspname s,r.relname t FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace "+
  "WHERE n.nspname IN('public','d1_owner_ci','f06_1_lock_ci','f06_2_ci') AND r.relkind IN('r','p') ORDER BY n.nspname,r.relname")).rows;
 assert.ok(paths.length>=160,'F06_3A_REQUIRES_ALL_SIGNED_PHYSICAL_TABLES');
 const tables={};for(const {s,t} of paths){
  assert.match(s,/^(public|d1_owner_ci|f06_1_lock_ci|f06_2_ci)$/);assert.match(t,/^[a-z0-9_]+$/);
  tables[s+'.'+t]=(await c.query("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) hash FROM "+s+"."+t+" x")).rows[0]
 }
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const d1=(await c.query('SELECT * FROM d1_owner_ci.attestation')).rows;
 const catalog=await getPublicStructure(c);
 const parent=(await c.query("SELECT * FROM f06_1_lock_ci.attestation")).rows;
 const p2=(await c.query("SELECT * FROM f06_2_ci.attestation")).rows;
 assert.equal(parent.length,1);assert.equal(p2.length,1);
 assert.equal(ledger.length,24);assert.equal(ledger[23].structure_sha256,catalog.sha256);assert.equal(d1.length,1);
 return {head:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,meta,tables,
 tableCount:paths.length,tableDigest:digest(tables),ledgerDigest:digest(ledger),
 d1Digest:digest(d1),catalogSha256:catalog.sha256,parentSealDigest:digest(parent),parent2SealDigest:digest(p2)};
}
try{
 const value=await snap(),path=resolve(out,'audit-before.json');
 if(mode==='before'){
  assert.equal((await c.query("SELECT to_regnamespace('f06_3a_ci')::text name")).rows[0].name,null);
  await writeFile(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  console.log('F06_3A_TRUE_SIGNED_DATABASE_BEFORE_SCENARIOS',JSON.stringify({oid:value.meta.oid,tables:value.tableCount,hash:value.tableDigest}));
 }else{
  const old=JSON.parse(await readFile(path,'utf8'));
  assert.equal(value.head,old.head);assert.equal(value.runId,old.runId);
  assert.notEqual(value.meta.oid,old.meta.oid,'scenario PG must be destroyed');
  assert.equal((await c.query("SELECT to_regnamespace('f06_3a_ci')::text name")).rows[0].name,null);
  for(const key of ['tables','tableCount','tableDigest','ledgerDigest','d1Digest','catalogSha256','parentSealDigest','parent2SealDigest'])
   assert.deepEqual(value[key],old[key],'F06_3A_GLOBAL_IMMUTABILITY_FAILED_'+key);
  const receipt={status:'PASS',head:value.head,runId:value.runId,
   businessScenarioDatabaseOid:old.meta.oid,readOnlyAuditDatabaseOid:value.meta.oid,
   beforeBackendPid:old.meta.pid,afterBackendPid:value.meta.pid,
   tableCount:value.tableCount,tableDigest:value.tableDigest,ledgerSha256:value.ledgerDigest,
   d1Sha256:value.d1Digest,catalogSha256:value.catalogSha256,parentSealDigest:value.parentSealDigest,parent2SealDigest:value.parent2SealDigest,
   productionIssuer:'SOURCE_GAP',productionPayment:'BLOCKED',f06Overall:'NOT_READY'};
  await writeFile(resolve(out,'audit-global-seal-pass.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  console.log('F06_3A_DISPOSABLE_SCENARIO_AND_SIGNED_AUDIT_GLOBAL_SEAL_PASS',JSON.stringify(receipt));
 }
}finally{await c.end()}
