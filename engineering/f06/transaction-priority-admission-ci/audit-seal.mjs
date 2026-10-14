// 逐表全行 COUNT+MD5 和 D1/父签对照；拒绝用理论数量替代真实结果。
import {connect,withF065B} from './migration.mjs';
import {verify as verify5B} from '../lock-refund-conversion-guard-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const mode=process.argv[2];
if(!['before','after'].includes(mode)||process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true'||
 process.env.GITHUB_REF!=='refs/heads/feat/f06-5c-transaction-priority-admission-ci'||process.env.GITHUB_EVENT_NAME!=='push')
 throw Error('F06_5C_AUDIT_REQUIRES_GENUINE_PUSH');
const c=await connect(),out=resolve('f06/transaction-priority-admission-ci/artifacts/source');
await mkdir(out,{recursive:true});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function snap(){
 assert.equal((await withF065B(()=>verify5B(c))).verified,true);
 const meta=(await c.query("SELECT current_database() db,pg_backend_pid() pid,current_user u,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(meta.db,'f03_auth_test');assert.equal(meta.u,'f03_ci');assert.equal(meta.su,false);
 const namespaces=['public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci','f06_5a_ci','f06_5b_ci'];
 const rows=(await c.query("SELECT n.nspname s,r.relname t FROM pg_class r JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=ANY($1::text[]) AND r.relkind IN ('r','p') ORDER BY n.nspname,r.relname",[namespaces])).rows;
 const tables={};
 for(const {s,t} of rows){
  assert.ok(namespaces.includes(s));assert.match(t,/^[a-z0-9_]+$/);
  tables[s+'.'+t]=(await c.query("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) hash FROM "+s+"."+t+" x")).rows[0];
 }
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24);
 const catalog=await getPublicStructure(c);
 const d1=(await c.query('SELECT * FROM d1_owner_ci.attestation')).rows;
 const sidecars={};
 for(const s of namespaces.filter(x=>x.startsWith('f06_')))sidecars[s]=(await c.query('SELECT * FROM '+s+'.attestation')).rows;
 assert.ok(Object.values(sidecars).every(x=>x.length===1));
 return {head:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,meta,tables,tableCount:rows.length,tableDigest:digest(tables),
  ledgerDigest:digest(ledger),catalogSha256:catalog.sha256,d1Digest:digest(d1),parentSidecars:digest(sidecars)};
}
try{
 const now=await snap(),path=resolve(out,'audit-before.json');
 if(mode==='before'){
  assert.equal((await c.query("SELECT to_regnamespace('f06_5c_ci')::text n")).rows[0].n,null);
  await writeFile(path,JSON.stringify(now,null,2)+'\n',{flag:'wx'});
  console.log('F06_5C_REAL_OLD_TABLE_COUNT',JSON.stringify({oid:now.meta.oid,count:now.tableCount,digest:now.tableDigest}));
  // A施工单写死192张，实际数字必须以物理PG catalog为准：不足则真实失败。
  assert.ok(now.tableCount>=192,'F06_5C_A_RELEASED_192_PARENT_TABLES_NOT_PRESENT');
 }else{
  const before=JSON.parse(await readFile(path,'utf8'));
  assert.notEqual(before.meta.oid,now.meta.oid);
  assert.equal(before.head,now.head);assert.equal(before.runId,now.runId);
  assert.equal((await c.query("SELECT to_regnamespace('f06_5c_ci')::text n")).rows[0].n,null);
  for(const k of ['tables','tableCount','tableDigest','ledgerDigest','catalogSha256','d1Digest','parentSidecars'])
   assert.deepEqual(now[k],before[k],'F06_5C_PARENT_SEAL_DRIFT_'+k);
  assert.ok(now.tableCount>=192);
  const proof={status:'PASS',sha:now.head,runId:now.runId,scenarioOid:before.meta.oid,auditOid:now.meta.oid,
   beforePid:before.meta.pid,afterPid:now.meta.pid,parentTableCount:now.tableCount,tableDigest:now.tableDigest,
   original24Ledger:now.ledgerDigest,catalog:now.catalogSha256,d1:now.d1Digest,parentSignatures:now.parentSidecars,
   atomicPriorityIssuer:'UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP',production:'NOT_AUTHORIZED'};
  await writeFile(resolve(out,'audit-global-seal-pass.json'),JSON.stringify(proof,null,2)+'\n',{flag:'wx'});
  console.log('F06_5C_TWO_PHYSICAL_PG_DATABASES_PARENT_192_TABLES_SEAL_PASS',JSON.stringify(proof));
 }
}finally{await c.end()}
