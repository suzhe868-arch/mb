// PG1 新目录内的真实合成PG16取消对照：补丁前真实4A，补丁后版本化4A。
import assert from 'node:assert/strict';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {intakeCI,decisionCI} from '../lockrequest-approval-waitlist-ci/service.mjs';
import {openGuardedSyntheticTransactionCI} from '../lock-refund-conversion-guard-ci/service.mjs';
import {cancelSyntheticTransactionCI} from '../transaction-cancel-ci/service.mjs';
import {cancelSyntheticTransactionV2CI} from './signed-cancel-v2.mjs';
import {withF063A} from '../refund-pending-ci/migration.mjs';
import {withF062} from '../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../lock-lifecycle-ci/migration.mjs';
import {verify,gate} from './catalog-delta-verifier.mjs';

const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const mk=x=>'pg1-signed-'+process.env.GITHUB_RUN_ID+'-'+x;
const signedF06=fn=>withF063A(()=>withF062(()=>withParentBranch(fn)));
async function oldRef(name,fn){
 const a=process.env.GITHUB_REF,b=process.env.GITHUB_REF_NAME;
 try{process.env.GITHUB_REF='refs/heads/'+name;process.env.GITHUB_REF_NAME=name;return await fn()}
 finally{process.env.GITHUB_REF=a;process.env.GITHUB_REF_NAME=b}
}
const first=async(c,s,p=[])=> (await c.query(s,p)).rows[0];
async function realLock(c,auth,token,offset,label){
 const req=await signedF06(()=>intakeCI(c,{
  customerId:86180101,vehicleId:86181100+offset,listingCycleId:86182100+offset,
  requestKey:mk('intake-'+label),
  syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'
 }));
 assert.equal(req.code,'F06_1_PENDING_CREATED',JSON.stringify(req));
 const approved=await signedF06(()=>decisionCI(auth,token,{
  requestId:req.requestId,requestKey:mk('approve-'+label),action:'approve'
 }));
 assert.equal(approved.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(approved));
 return approved.lockId;
}
async function orig(c,id){
 return first(c,`SELECT t.status,t.completed_at,t.responsible_employee_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,
  o.transaction_id AS origin_id,e.event_kind,e.previous_status,e.resulting_status,
  k.action AS signed_action
  FROM public.transactions t
  LEFT JOIN f06_4a_ci.cancel_origins o USING(transaction_id)
  LEFT JOIN f06_4a_ci.cancel_events e USING(transaction_id)
  LEFT JOIN f06_4a_ci.request_keys k USING(transaction_id)
  WHERE t.transaction_id=$1`,[id]);
}
export async function prepareOldNative4A(c){
 gate();
 const auth=new IsolatedAuth({connectionString:DSN,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
 try{
  const sale=await first(c,"SELECT role_id FROM public.roles WHERE role_code='sales'");
  assert.ok(sale);
  await c.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sale.role_id]);
  await c.query('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=86180101');
  const mem=await first(c,"SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1");
  assert.ok(mem);
  const scope=await first(c,"SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[mem.team_id]);
  assert.ok(scope);
  const existing=await first(c,"SELECT permission_id FROM public.permissions WHERE permission_code='transaction.ci.cancel'");
  const perm=existing?.permission_id??969104;
  if(!existing)await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,'transaction.ci.cancel')",[perm]);
  await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()",[perm]);
  const bound=await first(c,"SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[perm,scope.scope_id]);
  if(!bound)await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scope.scope_id]);
  const logged=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'pg1-old-new-4a-native'});
  assert.equal(logged.code,'AUTH_OK',JSON.stringify(logged));
  const token=logged.token;
  const oldLock=await realLock(c,auth,token,4,'old-baseline');
  const newLock=await realLock(c,auth,token,6,'new-version');
  const open=async(lockId,label)=>{
   const tx=await oldRef('feat/f06-5b-lock-refund-conversion-guard-ci',()=>openGuardedSyntheticTransactionCI(auth,token,{
    lockId,eventKey:mk('5b-'+label)
   }));
   assert.equal(tx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(tx));
   return tx.transactionId;
  };
  const oldTx=await open(oldLock,'old4a');
  const newTx=await open(newLock,'v2-4a');
  const oldCancel=await oldRef('feat/f06-4a-transaction-cancel-ci',()=>cancelSyntheticTransactionCI(auth,token,{
   transactionId:oldTx,eventKey:mk('old-4a-cancel'),reason:'真实父版本正常签名4A取消结果对照'
  }));
  assert.equal(oldCancel.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(oldCancel));
  const oldCarrier=await orig(c,oldTx);
  assert.ok(oldCarrier&&oldCarrier.origin_id&&oldCarrier.signed_action==='cancel');
  assert.equal(oldCarrier.status,'cancelled');
  const pending=await orig(c,newTx);
  assert.equal(pending.status,'in_progress');
  assert.equal(pending.origin_id,null);
  return {auth,token,oldTx,newTx,oldCarrier,oldCancel,baseline:{
   oldLock,newLock,oldTransaction:oldTx,newTransaction:newTx,source:'F06_1_AND_5B_SIGNED_PARENT_APIS'
  }};
 }catch(e){await auth.close().catch(()=>{});throw e}
}
export async function proveVersionedNative4A(c,fixture){
 gate();
 assert.equal((await verify(c)).verified,true);
 const {auth,token,newTx,oldCarrier}=fixture;
 const after=await cancelSyntheticTransactionV2CI(auth,token,{
  transactionId:newTx,eventKey:mk('v2-4a-cancel'),reason:'真实父版本正常签名4A取消结果对照'
 });
 assert.equal(after.code,fixture.oldCancel.code,'PG1_V2_4A_ORIGINAL_BUSINESS_CODE_NOT_EQUIVALENT '+JSON.stringify(after));
 const now=await orig(c,newTx);
 assert.ok(now&&now.origin_id,'PG1_V2_4A_ORIGIN_MISSING');
 for(const k of ['status','completed_at','responsible_employee_id','customer_id','event_kind','previous_status','resulting_status','signed_action'])
  assert.deepEqual(now[k],oldCarrier[k],'PG1_V2_4A_MISMATCH_'+k);
 assert.equal(now.status,'cancelled');
 const replay=await cancelSyntheticTransactionV2CI(auth,token,{
  transactionId:newTx,eventKey:mk('v2-4a-cancel'),reason:'真实父版本正常签名4A取消结果对照'
 });
 assert.equal(replay.code,'F06_4A_IDEMPOTENT_CANCEL',JSON.stringify(replay));
 const denied=await cancelSyntheticTransactionV2CI(auth,'fake-token',{
  transactionId:newTx,eventKey:mk('v2-4a-forged'),reason:'伪造令牌不允许取消真实合成交易'
 });
 assert.equal(denied.allowed,false);
 const immut=await first(c,"SELECT count(*)::int n FROM f06_4a_ci.cancel_events WHERE transaction_id=$1",[newTx]);
 assert.equal(immut.n,1,'PG1_V2_4A_REPLAY_MUST_NOT_DUPLICATE_IMMUTABLE_EVENT');
 assert.equal((await verify(c)).verified,true);
 return {oldTx:fixture.oldTx,newTx,
  baselineCode:fixture.oldCancel.code,versionedCode:after.code,idempotentCode:replay.code,
  invalidTokenDenied:!denied.allowed,
  comparedBusinessColumns:8,realPG16:true,sourceSigned4A:true};
}
