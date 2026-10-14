// PG1 实测诊断：仅可销毁合成 PG16。保留真正红证，不得把已知接口破坏标记为通过。
import assert from 'node:assert/strict';
import pg from 'pg';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {verify as verifyParent} from '../lock-refund-conversion-guard-ci/migration.mjs';
import {snapshotForAttestation,verify as verifyPatchCatalog} from './catalog-delta-verifier.mjs';
import {runNativeTamperMatrix} from './原生篡改反例.mjs';
import {prepareOldNative4A,proveVersionedNative4A} from './真实取消前后对照.mjs';
import {prepareOldNative4C,proveVersionedNative4C} from './真实移交取消前后对照.mjs';
import {runNativeForgedCancelMatrix} from './伪造取消原生反例.mjs';

const OUT=new URL('./artifacts/source/',import.meta.url);
const digest=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/fix/f06-5c-pg1-parent-priority-guard-ci';
const REQUIRED={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',
  GITHUB_REF:REF,CI:'true',APP_ENV:'test',NODE_ENV:'test',F03_1_DATABASE_URL:DSN,
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
for(const [key,value] of Object.entries(REQUIRED))assert.equal(process.env[key],value,'F06_PG1_ISOLATION_DENY_'+key);
assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:5000,query_timeout:90000});
let cancelFixture,handoffFixture;
const report={task:'F06-5C-PG1',sha:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,
  status:'BLOCKED_PENDING_NATIVE_TEST',production:'DENIED'};
async function rows(sql,args=[]){return (await c.query(sql,args)).rows}
// 冻结 5B 校验器自身锁定旧分支值；仅在离线合成 CI 中复用既签名校验，不改变校验实现。
async function verifyFrozenParent(client){
 const original=process.env.GITHUB_REF;
 try{process.env.GITHUB_REF='refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci';return await verifyParent(client)}
 finally{process.env.GITHUB_REF=original}
}
async function sealedParent(){
 const oldFunctions=await rows("SELECT p.proname,pg_get_functiondef(p.oid) AS def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('f05_8_priority_guard','f05_8_reconcile_scope_ci','f05_8_close_for_occupancy','f05_8_source_change_ci') ORDER BY p.proname");
 assert.equal(oldFunctions.length,4);
 const oldTriggers=await rows("SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid,true) AS def FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgname LIKE 'f05_8_%' ORDER BY c.relname,t.tgname");
 const ledger=await rows('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id');
 assert.equal(ledger.length,24);
 const tables=await rows("SELECT n.nspname s,c.relname t FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1::text[]) AND c.relkind IN ('r','p') ORDER BY 1,2",
  [['public','d1_owner_ci','f06_1_lock_ci','f06_2_ci','f06_3a_ci','f06_3b_ci','f06_3c1_ci','f06_4a_ci','f06_4b_ci','f06_4c_ci','f06_5a_ci','f06_5b_ci']]);
 assert.equal(tables.length,190,'PG1_190_FROZEN_PARENT_TABLES_REQUIRED');
 const tableFacts={};for(const {s,t} of tables){
   assert.match(s,/^[a-z0-9_]+$/);assert.match(t,/^[a-z0-9_]+$/);
   tableFacts[s+'.'+t]=(await rows("SELECT count(*)::int n, md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) h FROM "+s+"."+t+" x"))[0];
 }
 return {functionHash:digest(oldFunctions),triggerHash:digest(oldTriggers),ledgerHash:digest(ledger),
  tableCount:tables.length,tableHash:digest(tableFacts)};
}
try{
 await c.connect();
 const db=(await rows("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) super,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid,pg_backend_pid() pid"))[0];
 assert.equal(db.db,'f03_auth_test');assert.equal(db.usr,'f03_ci');assert.equal(db.super,false);assert.equal(db.createdb,false);
 assert.ok(db.v>=160000&&db.v<170000);
 report.db=db;
 report.preParentVerification=(await verifyFrozenParent(c)).verified;
 assert.equal(report.preParentVerification,true);
 cancelFixture=await prepareOldNative4A(c);
 report.oldSigned4ABaseline=cancelFixture.baseline;
 handoffFixture=await prepareOldNative4C(c,cancelFixture);
 report.oldSigned4B4CBaseline=handoffFixture.baseline;
 const before=await getPublicStructure(c);
 const old=await sealedParent();
 report.before={catalog:before.sha256,...old};
 assert.equal((await rows("SELECT to_regnamespace('f06_5c_pg1_ci')::text n"))[0].n,null);
 const sql=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8'),sourceHash=digest(sql);
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261015,6501)');
  await c.query(sql);
  const signedDelta=await snapshotForAttestation(c,before);
  assert.equal(signedDelta.ledgerHash,old.ledgerHash);
  assert.equal(signedDelta.priorityHash,old.functionHash);
  assert.equal(signedDelta.preCatalog,before.sha256);
  assert.match(signedDelta.sidecarChainHash,/^[0-9a-f]{64}$/);
  report.signedCatalogDelta=signedDelta;
  await c.query("INSERT INTO f06_5c_pg1_ci.attestation(name,source_sha256,parent_ledger_sha256,parent_priority_sha256,sidecar_chain_sha256,parent_catalog_sha256,post_catalog_sha256,delta_sha256,delta_manifest) VALUES('F06_5C_PG1',$1,$2,$3,$4,$5,$6,$7,$8::jsonb)",
   [sourceHash,old.ledgerHash,old.functionHash,signedDelta.sidecarChainHash,signedDelta.preCatalog,signedDelta.postCatalog,signedDelta.deltaSHA256,JSON.stringify(signedDelta.deltaManifest)]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 const after=await getPublicStructure(c),fresh=await sealedParent();
 for(const k of ['functionHash','triggerHash','ledgerHash','tableCount','tableHash'])assert.equal(fresh[k],old[k],'F06_PG1_PARENT_MUTATED_'+k);
 const oldObjectKeys=new Map(before.objects.map(o=>[o.kind+'|'+o.name,o.definition]));
 const added=after.objects.filter(o=>!oldObjectKeys.has(o.kind+'|'+o.name));
 const changed=after.objects.filter(o=>oldObjectKeys.has(o.kind+'|'+o.name)&&oldObjectKeys.get(o.kind+'|'+o.name)!==o.definition);
 const actualNames=added.map(o=>o.name).sort();
 // PostgreSQL 的 CONSTRAINT TRIGGER 同时出现在 pg_trigger 与 pg_constraint 两种编目视图。
 // 不因同名项重复就错报越权；必须恰好两个触发器和一条受控约束记录。
 assert.deepEqual(added.filter(o=>o.kind==='trigger').map(o=>o.name).sort(),
   ['f05_8_priority_ci.pg1_signed_priority_insert','transactions.pg1_deferred_signed_cancel'].sort(),
   'PG1_ONLY_TWO_ADDED_PUBLIC_TRIGGERS');
 assert.deepEqual(added.filter(o=>o.kind==='constraint').map(o=>o.name),
   ['transactions.pg1_deferred_signed_cancel'],
   'PG1_ONLY_ONE_ADDED_CONSTRAINT_RECORD');
 assert.equal(added.length,3,'PG1_UNAUTHORIZED_ADDITIONAL_CATALOG_OBJECT');
 assert.equal(changed.length,0,'PG1_EXISTING_PUBLIC_DEFINITION_CHANGED');
 report.after={catalog:after.sha256,addedPublicObjects:added,changedPublicObjects:changed.length,
   ...fresh,privateSourceSHA256:sourceHash};
 report.versionedVerifier=await verifyPatchCatalog(c);
 assert.equal(report.versionedVerifier.verified,true);
 report.nativeTamperMatrix=await runNativeTamperMatrix(c);
 assert.equal(report.nativeTamperMatrix.length,5);
 assert.notEqual(before.sha256,after.sha256,'PG1_PUBLIC_CATALOG_MUST_NOT_BE_MISREPORTED_IDENTICAL');
 try{
  report.nativeUnsignedCancelMatrix=await runNativeForgedCancelMatrix(c,cancelFixture.newTx);
  assert.equal(report.nativeUnsignedCancelMatrix.length,2);
  report.versionedNative4A=await proveVersionedNative4A(c,cancelFixture);
  report.versionedNative4B4C=await proveVersionedNative4C(c,cancelFixture,handoffFixture);
  const status=await verifyFrozenParent(c);
  report.parentAfter={verified:status.verified};
  report.status='F06_PG1_UNEXPECTED_PARENT_VERIFICATION_ACCEPTED';
 }catch(e){
  report.parentAfter={verified:false,code:e.code||null,message:e.message};
  report.status=e.message?.includes('F05_10_CATALOG_DRIFT')?'PG1_V2_CATALOG_VERIFIED_OLD_FROZEN_EXPECTED_FAIL_CLOSED_SECURITY_UNTESTED':'BLOCKED_UNEXPECTED_PARENT_VERIFIER_FAILURE';
 }
} catch(e){
 report.status='BLOCKED_PG1_NATIVE_DIAGNOSTIC_FAILED';
 report.error={message:e.message,code:e.code||null,stack:e.stack?.slice(0,1700)||null};
} finally{
 try{await mkdir(OUT,{recursive:true});await writeFile(new URL('真实PG16父签名兼容诊断.json',OUT),JSON.stringify(report,null,2)+'\n')}finally{await cancelFixture?.auth.close().catch(()=>{});await c.end().catch(()=>{})}
 console.log('F06_5C_PG1_NATIVE_STATUS',JSON.stringify({status:report.status,parentAfter:report.parentAfter,problem:report.error}));
}
if(report.status!=='F06_PG1_UNEXPECTED_PARENT_VERIFICATION_ACCEPTED')process.exitCode=1;
else process.exitCode=1; // 该工具只生成诊断；绝不据此标记整个 PG1 可交 A。
