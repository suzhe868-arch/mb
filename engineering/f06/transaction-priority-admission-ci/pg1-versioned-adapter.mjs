// F06-5C PR62：已验收PG1的显式 CI-only 版本化安装/验签适配。
// 不修改冻结PG1/父源码，不改变 GitHub SHA、Run、事件或真实checkout。
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {gate as gate5C,verify as verify5C,checksum as checksum5C} from './migration.mjs';
import {snapshotForAttestation,verify as verifyPG1} from '../transaction-priority-parent-gate-ci/catalog-delta-verifier.mjs';
const PG1_REF='refs/heads/fix/f06-5c-pg1-parent-priority-guard-ci';
const ORIGINAL_CATALOG='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4';
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
let queue=Promise.resolve();
async function signedPG1(fn){
 gate5C();
 const task=queue.then(async()=>{
  const before=process.env.GITHUB_REF, beforeName=process.env.GITHUB_REF_NAME;
  // 仅为已签父模块内部历史分支环境契约提供与5B同类型兼容桥。
  // GITHUB_SHA/RUN_ID、真实PR62 Push和已执行的PG16物理数据库永远不改变。
  try{
   process.env.GITHUB_REF=PG1_REF;
   process.env.GITHUB_REF_NAME=PG1_REF.slice('refs/heads/'.length);
   return await fn();
  }finally{
   process.env.GITHUB_REF=before;process.env.GITHUB_REF_NAME=beforeName;
  }
 });
 queue=task.catch(()=>{});
 return task;
}
export async function installSignedPG1InExisting5CCI(c){
 gate5C();
 const baseline=await verify5C(c);
 const pre=await getPublicStructure(c);
 assert.equal(pre.sha256,ORIGINAL_CATALOG,'F06_5C_PG1_PARENT_PRECATALOG_REQUIRED');
 assert.equal((await c.query("SELECT to_regnamespace('f06_5c_pg1_ci')::text n")).rows[0].n,null,'F06_5C_PG1_DOUBLE_INSTALL_DENIED');
 const sql=await readFile(new URL('../transaction-priority-parent-gate-ci/sidecar.sql',import.meta.url),'utf8');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const defs=(await c.query("SELECT p.proname,pg_get_functiondef(p.oid) AS def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('f05_8_priority_guard','f05_8_reconcile_scope_ci','f05_8_close_for_occupancy','f05_8_source_change_ci') ORDER BY p.proname")).rows;
 assert.equal(ledger.length,24);assert.equal(defs.length,4);
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261015,6501)');
  await c.query(sql);
  const delta=await signedPG1(()=>snapshotForAttestation(c,pre));
  assert.equal(delta.ledgerHash,sha(ledger));assert.equal(delta.priorityHash,sha(defs));
  assert.equal(delta.preCatalog,ORIGINAL_CATALOG);
  await c.query("INSERT INTO f06_5c_pg1_ci.attestation(name,source_sha256,parent_ledger_sha256,parent_priority_sha256,sidecar_chain_sha256,parent_catalog_sha256,post_catalog_sha256,delta_sha256,delta_manifest) VALUES('F06_5C_PG1',$1,$2,$3,$4,$5,$6,$7,$8::jsonb)",[
   sha(sql),delta.ledgerHash,delta.priorityHash,delta.sidecarChainHash,delta.preCatalog,
   delta.postCatalog,delta.deltaSHA256,JSON.stringify(delta.deltaManifest)]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 const result=await verify5CVersioned(c);
 return {...result,prePatchCatalog:pre.sha256,sourcePatchSha256:sha(sql),previous5CSeal:baseline.sourceSHA};
}
export const withSignedPG1Ref=signedPG1;
export async function verify5CVersioned(c){
 gate5C();
 const signed=await signedPG1(()=>verifyPG1(c));
 assert.equal(signed.verified,true);
 const a=(await c.query('SELECT * FROM f06_5c_ci.attestation')).rows;
 assert.equal(a.length,1);
 assert.equal(a[0].seal_name,'F06_5C_CI_ONLY');
 assert.equal(a[0].source_sha256,checksum5C);
 assert.equal(a[0].public_catalog_sha256,ORIGINAL_CATALOG);
 assert.equal(a[0].production_priority_issuer,'UNWIRED');
 const parent=await readFile(new URL('../lock-refund-conversion-guard-ci/sidecar.sql',import.meta.url),'utf8');
 assert.equal(a[0].parent_f06_5b_sha256,sha(parent));
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24);
 assert.equal(a[0].signed_ledger_sha256,sha(ledger));
 const count=(await c.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[]) AND c.relkind IN ('r','p')",[[
  'public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci','f06_5a_ci','f06_5b_ci'
 ]])).rows[0].n;
 assert.equal(count,190);
 return {verified:true,version:'F06_5C_PG1_V2_CI',oldCatalog:ORIGINAL_CATALOG,
  newCatalog:signed.postCatalog,deltaSHA256:signed.deltaSHA256,parent190Tables:count,
  ledgerSha256:sha(ledger),productionIssuer:'DENIED',f06_5c_source:checksum5C};
}
