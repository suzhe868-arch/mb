import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const patterns=[
 {file:'./evidence/HTTP隔离拒绝_TAP.log',count:32},
 {file:'./evidence/真实PG16缺签_TAP.log',count:6}
];
const sha=process.env.GITHUB_SHA;
assert.match(sha||'',/^[0-9a-f]{40}$/);
for(const {file,count} of patterns){
 const text=readFileSync(new URL(file,import.meta.url),'utf8');
 const field=(name)=>{
  const match=[...text.matchAll(new RegExp('^# '+name+' (\\d+)$','gm'))].at(-1);
  assert.ok(match,file+' missing '+name);
  return Number(match[1]);
 };
 assert.equal(field('tests'),count,file+' test count');
 assert.equal(field('pass'),count,file+' pass count');
 for(const x of ['fail','skipped','cancelled'])assert.equal(field(x),0,file+' '+x);
 assert.ok(!/^not ok /m.test(text),file+' raw TAP failure');
}
const pg=readFileSync(new URL('./evidence/真实PG16缺签_TAP.log',import.meta.url),'utf8');
assert.ok(pg.includes('F06_164_ACTUAL_PG16_BACKEND'),'native nonprivileged PG proof missing');
if(process.env.F06_164_REQUIRE_E2E==='1'){
 const e2e=readFileSync(new URL('./evidence/单Runtime闭环_TAP.log',import.meta.url),'utf8');
 const field=(name)=>{
  const match=[...e2e.matchAll(new RegExp('^# '+name+' (\\d+)$','gm'))].at(-1);
  assert.ok(match,'single-runtime E2E missing '+name);
  return Number(match[1]);
 };
 assert.ok(field('tests')>=20,'at least 20 single-runtime integration/security scenarios required');
 assert.ok(field('pass')>=20,'at least 20 single-runtime scenarios must pass');
 for(const x of ['fail','skipped','cancelled'])assert.equal(field(x),0,'single-runtime '+x);
 assert.ok(!/^not ok /m.test(e2e),'single-runtime raw TAP failure');
 for(const marker of [
  'F06_COMPOSITE_LOCK_REQUEST_CREATED','F06_COMPOSITE_SIGNED_LOCK_CREATED',
  'F06_COMPOSITE_DEPOSIT_ROLLBACK_ATOMIC_PASS','F06_COMPOSITE_SIGNED_DEPOSIT_CREATED',
  'F06_COMPOSITE_TRANSACTION_ROLLBACK_ATOMIC_PASS','F06_COMPOSITE_TRANSACTION_CREATED',
  'F06_COMPOSITE_HANDOFF_SIGNED','F06_COMPOSITE_POST_HANDOFF_CANCEL_SIGNED',
  'F06_COMPOSITE_LEGACY_PR146_ENTRY_STILL_REJECTS','F06_COMPOSITE_REFUND_PENDING_SIGNED',
  'F06_COMPOSITE_REFUND_CLOSED_WITHOUT_PAYMENT_SIGNED',
  'F06_COMPOSITE_HANDOFF_ROLLBACK_ATOMIC_PASS',
  'F06_COMPOSITE_TX_DOUBLE_BACKEND_IDEMPOTENCY_PASS',
  'F06_COMPOSITE_REFUND_DOUBLE_BACKEND_IDEMPOTENCY_PASS',
  'F06_COMPOSITE_REFUND_DOUBLE_BACKEND_COMPETITION_PASS',
  'F06_COMPOSITE_PRODUCTION_PAYMENT_COMPLETION_HARD_DENY',
  'F06_COMPOSITE_PERMISSION_AND_SESSION_REVOCATION_DENY',
  'F06_164_SINGLE_PG16_CURRENT_RUN_ISSUER_AND_ALL_NINE_BUSINESS_EVENTS_VERIFIED'
 ])assert.ok(e2e.includes(marker),'single-runtime proof missing '+marker);
 const chain=readFileSync(new URL('./evidence/父链签名与初始化.log',import.meta.url),'utf8');
 const sealBefore=readFileSync(new URL('./evidence/父表161迁移24Seal前置证据.log',import.meta.url),'utf8');
 const sealAfter=readFileSync(new URL('./evidence/父表161迁移24Seal恢复证据.log',import.meta.url),'utf8');
 const beforeLine=sealBefore.match(/F06_164_PARENT_161_TABLE_24_LEDGER_CROSS_OID_BASELINE_PASS (\{[^\n]+\})/);
 assert.ok(beforeLine,'161-table/24-migration cross-OID baseline proof missing');
 const beforeSeal=JSON.parse(beforeLine[1]);
 assert.equal(beforeSeal.tableCount,161);
 assert.equal(beforeSeal.migrationCount,24);
 assert.notEqual(beforeSeal.scenarioOid,beforeSeal.baselineOid);
 assert.equal(beforeSeal.scenarioSeal,beforeSeal.baselineSeal);
 const afterLine=sealAfter.match(/F06_164_DIFFERENT_OID_161_TABLE_24_LEDGER_SEAL_PASS (\{[^\n]+\})/);
 assert.ok(afterLine,'161-table/24-migration restored-OID seal proof missing');
 const seal=JSON.parse(afterLine[1]);
 assert.equal(seal.sha,sha,'parent seal SHA must equal the final workflow SHA');
 assert.equal(seal.runId,process.env.GITHUB_RUN_ID,'parent seal Run ID must equal this official Run');
 assert.equal(seal.tableCount,161);
 assert.equal(seal.migrationCount,24);
 assert.notEqual(seal.sourceOidBefore,seal.baselineOid);
 assert.notEqual(seal.sourceOidBefore,seal.restoreOid);
 assert.notEqual(seal.baselineOid,seal.restoreOid);
 assert.equal(seal.sourceBaselineSeal,seal.baselineSeal);
 assert.equal(seal.baselineSeal,seal.restoredSeal);
 assert.equal(seal.unauthorizedParentDrift,false);
 for(const marker of [
  'F06_164_SIGNED_COMPOSITE_ISSUER_ATTESTED',
  'F06_164_FIVE_NATIVE_PARENT_SCHEMA_STEPS_SIGNED_NO_LEGACY_REF_SPOOF',
  'F06_164_PR139_NATIVE_LOCK_TO_TRANSACTION_SIDECAR_VERIFIED',
  'F06_164_PR146_OLD_API_STILL_CLOSED_NEW_PATH_PARENT_ONLY_SEALED',
  'F06_164_PR150_ORIGINAL_REFUND_CORE_SIDECAR_SIGNED',
  'F06_164_PR153_NATIVE_HANDOFF_SIDECAR_SIGNED',
  'F06_164_PR156_NATIVE_POST_HANDOFF_CANCEL_SIDECAR_SIGNED'
 ])assert.ok(chain.includes(marker),'native source initialization missing '+marker);
 console.log('F06_164_FULL_NATIVE_COMPOSITE_PASS',{
  sha,httpSecurityCases:32,nativePgFailClosed:6,singleRuntimeE2E:field('tests'),
  signedEvents:9,parentTables:161,parentMigrations:24,crossOidSeal:true,productionReady:false,status:'READY_FOR_A_REVIEW'
 });
}else{
 console.log('F06_164_PARTIAL_NATIVE_PASS',{
  sha,httpSecurityCases:32,nativePgFailClosed:6,singleRuntimeE2E:'PENDING',
  productionReady:false,next:'RUN_COMPOSITE_E2E_AFTER_PARENT_INIT'
 });
}
