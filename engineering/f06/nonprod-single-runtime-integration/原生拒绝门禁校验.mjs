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
 assert.equal(field('tests'),1,'single-runtime test count');
 assert.equal(field('pass'),1,'single-runtime pass count');
 for(const x of ['fail','skipped','cancelled'])assert.equal(field(x),0,'single-runtime '+x);
 assert.ok(!/^not ok /m.test(e2e),'single-runtime raw TAP failure');
 for(const marker of [
  'F06_COMPOSITE_LOCK_REQUEST_CREATED','F06_COMPOSITE_SIGNED_LOCK_CREATED',
  'F06_COMPOSITE_DEPOSIT_ROLLBACK_ATOMIC_PASS','F06_COMPOSITE_SIGNED_DEPOSIT_CREATED',
  'F06_COMPOSITE_TRANSACTION_ROLLBACK_ATOMIC_PASS','F06_COMPOSITE_TRANSACTION_CREATED',
  'F06_COMPOSITE_HANDOFF_SIGNED','F06_COMPOSITE_POST_HANDOFF_CANCEL_SIGNED',
  'F06_COMPOSITE_LEGACY_PR146_ENTRY_STILL_REJECTS','F06_COMPOSITE_REFUND_PENDING_SIGNED',
  'F06_COMPOSITE_REFUND_CLOSED_WITHOUT_PAYMENT_SIGNED',
  'F06_164_SINGLE_PG16_CURRENT_RUN_ISSUER_AND_ALL_NINE_BUSINESS_EVENTS_VERIFIED'
 ])assert.ok(e2e.includes(marker),'single-runtime proof missing '+marker);
 const chain=readFileSync(new URL('./evidence/父链签名与初始化.log',import.meta.url),'utf8');
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
  sha,httpSecurityCases:32,nativePgFailClosed:6,singleRuntimeE2E:1,
  signedEvents:9,productionReady:false,status:'READY_FOR_A_REVIEW'
 });
}else{
 console.log('F06_164_PARTIAL_NATIVE_PASS',{
  sha,httpSecurityCases:32,nativePgFailClosed:6,singleRuntimeE2E:'PENDING',
  productionReady:false,next:'RUN_COMPOSITE_E2E_AFTER_PARENT_INIT'
 });
}
