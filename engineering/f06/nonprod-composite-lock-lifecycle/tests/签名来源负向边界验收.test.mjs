// Issue171: real-run source boundary tests plus read-only tamper simulations over real PG16 rows.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import pg from 'pg';
import {assertCompositeSignedRun} from '../../nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {verifyCompositeAttestation} from '../../nonprod-single-runtime-integration/composite-issuer.mjs';
import {verifyLifecycleIssuer} from '../可信LifecycleIssuer.mjs';

const DSN=process.env.F03_1_DATABASE_URL||'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
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
  async function rejectCompositeTamper(sql,args,label){
   await db.query('BEGIN');
   try{
    await db.query('DROP TRIGGER protect_attestation ON f06_composite_v1.attestation');
    await db.query(sql,args);
    await db.query('CREATE TRIGGER protect_attestation BEFORE UPDATE OR DELETE ON f06_composite_v1.attestation FOR EACH ROW EXECUTE FUNCTION f06_composite_v1.immutable()');
    await assert.rejects(()=>verifyCompositeAttestation(db),/F06_COMPOSITE_SIGNED_ISSUER_OR_PARENT_DRIFT/);
    console.log('F06_171_REAL_PG16_COMPOSITE_TAMPER_DENIED '+label);
   }finally{await db.query('ROLLBACK')}
  }
  async function rejectLifecycleTamper(sql,args,label){
   await db.query('BEGIN');
   try{
    await db.query('DROP TRIGGER prevent_attestation_mutation ON f06_composite_lifecycle_v2.attestation');
    await db.query(sql,args);
    await db.query('CREATE TRIGGER prevent_attestation_mutation BEFORE UPDATE OR DELETE ON f06_composite_lifecycle_v2.attestation FOR EACH ROW EXECUTE FUNCTION f06_composite_lifecycle_v2.reject_mutation()');
    await assert.rejects(()=>verifyLifecycleIssuer(db),/F06_171_LIFECYCLE_ISSUER_OR_PARENT_SIGNATURE_DRIFT/);
    console.log('F06_171_REAL_PG16_LIFECYCLE_TAMPER_DENIED '+label);
   }finally{await db.query('ROLLBACK')}
  }
  await t.test('07 真实PG16隔离库错误物理OID Attestation必须拒绝',async()=>{
   await rejectCompositeTamper("UPDATE f06_composite_v1.attestation SET database_oid=$1::oid WHERE seal_name='COMPOSITE_NONPROD_SIGNED_V1'",['1'],'physical_oid');
  });
  await t.test('08 真实PG16隔离库签名源码摘要漂移必须拒绝',async()=>{
   await rejectCompositeTamper("UPDATE f06_composite_v1.attestation SET source_sha256=$1 WHERE seal_name='COMPOSITE_NONPROD_SIGNED_V1'",['0'.repeat(64)],'source_sha256');
  });
  await t.test('09 真实PG16隔离库24迁移账本摘要不一致必须拒绝',async()=>{
   await rejectCompositeTamper("UPDATE f06_composite_v1.attestation SET ledger_sha256=$1 WHERE seal_name='COMPOSITE_NONPROD_SIGNED_V1'",['1'.repeat(64)],'ledger_sha256');
  });
  await t.test('10 真实PG16隔离库父F05结构签名摘要不一致必须拒绝',async()=>{
   await rejectCompositeTamper("UPDATE f06_composite_v1.attestation SET parent_f05_checksum=$1 WHERE seal_name='COMPOSITE_NONPROD_SIGNED_V1'",['2'.repeat(64)],'parent_f05_checksum');
  });
  await t.test('11 真实PG16隔离库Lifecycle父签名摘要不一致必须拒绝',async()=>{
   await rejectLifecycleTamper("UPDATE f06_composite_lifecycle_v2.attestation SET parent_source_sha256=$1 WHERE seal_name='ISSUE171_COMPOSITE_LIFECYCLE_SIGNED_V2'",['3'.repeat(64)],'parent_source_sha256');
  });
  await t.test('12 真实PG16隔离库Lifecycle源码摘要漂移必须拒绝',async()=>{
   await rejectLifecycleTamper("UPDATE f06_composite_lifecycle_v2.attestation SET source_sha256=$1 WHERE seal_name='ISSUE171_COMPOSITE_LIFECYCLE_SIGNED_V2'",['4'.repeat(64)],'source_sha256');
  });
  await t.test('13 真实PG16隔离库Lifecycle物理OID漂移必须拒绝',async()=>{
   await rejectLifecycleTamper("UPDATE f06_composite_lifecycle_v2.attestation SET database_oid=$1::oid WHERE seal_name='ISSUE171_COMPOSITE_LIFECYCLE_SIGNED_V2'",['1'],'database_oid');
  });
  await t.test('14 真实PG16隔离库Lifecycle Run ID漂移必须拒绝',async()=>{
   await rejectLifecycleTamper("UPDATE f06_composite_lifecycle_v2.attestation SET run_id=$1 WHERE seal_name='ISSUE171_COMPOSITE_LIFECYCLE_SIGNED_V2'",['999999999999999999'],'run_id');
  });
 }finally{await db.end()}
 t.diagnostic('F06_171_SIGNED_SOURCE_NEGATIVE_BOUNDARIES_PASS');
});
