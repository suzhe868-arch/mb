// Issue171: real-run source boundary tests plus read-only tamper simulations over real PG16 rows.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import pg from 'pg';
import {assertCompositeSignedRun} from '../../nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {verifyCompositeAttestation} from '../../nonprod-single-runtime-integration/composite-issuer.mjs';
import {verifyLifecycleIssuer} from '../可信LifecycleIssuer.mjs';

const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
function configure(){
 Object.assign(process.env,{
  APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',CI:'true',GITHUB_ACTIONS:'true',
  F03_1_DATABASE_URL:DSN,
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY',
  F06_COMPOSITE_SIGNED_ISSUER:'COMPOSITE_NONPROD_SIGNED_V1'
 });
}
function tamperRead(db,match,mutate){
 return {query:async(...args)=>{
  const result=await db.query(...args);
  const sql=typeof args[0]==='string'?args[0]:String(args[0]?.text||'');
  if(!match(sql))return result;
  return {...result,rows:result.rows.map(row=>mutate({...row}))};
 }};
}
test('Issue171真实签名来源负向边界矩阵',async t=>{
 configure();
 const current=assertCompositeSignedRun();
 await t.test('01 新profile只映射到本Issue精确真实分支',()=>{
  assert.equal(current.branch,'feat/f06-nonprod-composite-lock-lifecycle-01');
  assert.equal(current.profile,'ISSUE171_COMPOSITE_LOCK_LIFECYCLE_NONPROD_V2');
  // Pure profile-map assertion on a cloned input only: it never changes process.env and never invokes an issuer or database write.
  const oldBranch='feat/f06-nonprod-single-runtime-trusted-source-01';
  const old=assertCompositeSignedRun({...process.env,GITHUB_REF_NAME:oldBranch,GITHUB_REF:'refs/heads/'+oldBranch});
  assert.equal(old.profile,'ISSUE164_COMPOSITE_NONPROD_V1');
  assert.throws(()=>assertCompositeSignedRun({...process.env,GITHUB_REF_NAME:oldBranch}),/F06_COMPOSITE_REAL_BRANCH_REF_REQUIRED/);
  console.log('F06_171_NEGATIVE_PROFILE_BRANCH_BINDING_PASS');
 });
 await t.test('02 错误Ref与分支名不一致必须拒绝',()=>{
  assert.throws(()=>assertCompositeSignedRun({...process.env,GITHUB_REF:'refs/heads/not-the-authorized-branch'}),/F06_COMPOSITE_REAL_BRANCH_REF_REQUIRED/);
 });
 await t.test('03 非Push事件不能签发',()=>{
  assert.throws(()=>assertCompositeSignedRun({...process.env,GITHUB_EVENT_NAME:'pull_request'}),/F06_COMPOSITE_NEW_ISSUER_DENIED_GITHUB_EVENT_NAME/);
 });
 await t.test('04 当前Git HEAD与签名SHA不一致必须拒绝',()=>{
  assert.throws(()=>assertCompositeSignedRun({...process.env,GITHUB_SHA:'f'.repeat(40)}));
 });
 await t.test('05 无效Run ID不能签发',()=>{
  assert.throws(()=>assertCompositeSignedRun({...process.env,GITHUB_RUN_ID:'not-a-real-run-id'}));
 });
 await t.test('06 非40位SHA不能签发',()=>{
  assert.throws(()=>assertCompositeSignedRun({...process.env,GITHUB_SHA:'deadbeef'}));
 });
 const db=new pg.Client({connectionString:DSN,connectionTimeoutMillis:5000});
 await db.connect();
 try{
  await t.test('07 真实PG16父Attestation物理OID漂移必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('db_oid'),row=>({...row,db_oid:String(BigInt(row.db_oid)+1n)}));
   await assert.rejects(()=>verifyCompositeAttestation(wrapped),/F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT/);
   console.log('F06_171_NEGATIVE_PARENT_OID_DRIFT_DENIED');
  });
  await t.test('08 真实PG16父签名源码摘要漂移必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_v1.attestation FOR SHARE'),
    row=>({...row,source_sha256:'0'.repeat(64)}));
   await assert.rejects(()=>verifyCompositeAttestation(wrapped),/F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT/);
  });
  await t.test('09 24迁移账本摘要与父Attestation不一致必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_v1.attestation FOR SHARE'),
    row=>({...row,ledger_sha256:'1'.repeat(64)}));
   await assert.rejects(()=>verifyCompositeAttestation(wrapped),/F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT/);
  });
  await t.test('10 父F05结构签名摘要与父Attestation不一致必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_v1.attestation FOR SHARE'),
    row=>({...row,parent_f05_checksum:'2'.repeat(64)}));
   await assert.rejects(()=>verifyCompositeAttestation(wrapped),/F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT/);
  });
  await t.test('11 Lifecycle父签名来源摘要不一致必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_lifecycle_v2.attestation FOR SHARE'),
    row=>({...row,parent_source_sha256:'3'.repeat(64)}));
   await assert.rejects(()=>verifyLifecycleIssuer(wrapped),/F06_171_LIFECYCLE_ISSUER_OR_PARENT_SIGNATURE_DRIFT/);
  });
  await t.test('12 Lifecycle签名源码摘要漂移必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_lifecycle_v2.attestation FOR SHARE'),
    row=>({...row,source_sha256:'4'.repeat(64)}));
   await assert.rejects(()=>verifyLifecycleIssuer(wrapped),/F06_171_LIFECYCLE_ISSUER_OR_PARENT_SIGNATURE_DRIFT/);
  });
  await t.test('13 Lifecycle签名数据库OID漂移必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_lifecycle_v2.attestation FOR SHARE'),
    row=>({...row,database_oid:String(BigInt(row.database_oid)+1n)}));
   await assert.rejects(()=>verifyLifecycleIssuer(wrapped),/F06_171_LIFECYCLE_ISSUER_OR_PARENT_SIGNATURE_DRIFT/);
  });
  await t.test('14 Lifecycle签名Run ID漂移必须拒绝',async()=>{
   const wrapped=tamperRead(db,q=>q.includes('SELECT * FROM f06_composite_lifecycle_v2.attestation FOR SHARE'),
    row=>({...row,run_id:'999999999999999999'}));
   await assert.rejects(()=>verifyLifecycleIssuer(wrapped),/F06_171_LIFECYCLE_ISSUER_OR_PARENT_SIGNATURE_DRIFT/);
  });
 }finally{await db.end()}
 t.diagnostic('F06_171_SIGNED_SOURCE_NEGATIVE_BOUNDARIES_PASS');
});
