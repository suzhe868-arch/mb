// PG1：同一非特权PG16中的原签4B→4C对照与版本化4B→4C等价实测。
import assert from 'node:assert/strict';
import {realLock,oldRef} from './真实取消前后对照.mjs';
import {openGuardedSyntheticTransactionCI} from '../lock-refund-conversion-guard-ci/service.mjs';
import {handoffSyntheticTransactionCI as oldHandoffCI} from '../transaction-handoff-ci/service.mjs';
import {cancelAfterHandoffSyntheticCI as oldCancelCI} from '../post-handoff-cancel-ci/service.mjs';
import {handoffSyntheticTransactionCI as newHandoffCI} from './signed-handoff-v2.mjs';
import {cancelAfterHandoffV2CI} from './signed-post-handoff-cancel-v2.mjs';
import {verify,gate} from './catalog-delta-verifier.mjs';

const mk=x=>'pg1-transfer-'+process.env.GITHUB_RUN_ID+'-'+x;
const one=async(c,s,p=[])=> (await c.query(s,p)).rows[0];
async function carrier(c,txid){
 return one(c,`SELECT t.status,t.completed_at,t.responsible_employee_id,
  o.original_responsible_employee_id,o.transferred_responsible_employee_id,
  o.parent_handoff_event_count,
  e.actor_employee_id,e.event_kind,k.actor_employee_id AS signed_actor,
  k.transaction_id AS signed_transaction_id
  FROM public.transactions t
  LEFT JOIN f06_4c_ci.cancel_origins o USING(transaction_id)
  LEFT JOIN f06_4c_ci.cancel_events e USING(transaction_id)
  LEFT JOIN f06_4c_ci.request_keys k USING(transaction_id)
  WHERE t.transaction_id=$1`,[txid]);
}
export async function prepareOldNative4C(c,base){
 gate();
 const {auth,token}=base;
 const oldLock=await realLock(c,auth,token,3,'4c-original');
 const newLock=await realLock(c,auth,token,5,'4c-versioned');
 const open=async(lockId,label)=>{
  const t=await oldRef('feat/f06-5b-lock-refund-conversion-guard-ci',()=>openGuardedSyntheticTransactionCI(auth,token,{
   lockId,eventKey:mk('5b-'+label)
  }));
  assert.equal(t.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(t));
  return t.transactionId;
 };
 const oldTx=await open(oldLock,'old');
 const newTx=await open(newLock,'new');
 const manager=await one(c,"SELECT role_id FROM public.roles WHERE role_code='manager'");
 assert.ok(manager);
 await c.query("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1",[manager.role_id]);
 const managerLogin=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'pg1-old4b-manager'});
 assert.equal(managerLogin.code,'AUTH_OK',JSON.stringify(managerLogin));
 const managerToken=managerLogin.token;
 const perm0=await one(c,"SELECT permission_id FROM public.permissions WHERE permission_code='transaction.responsible.transfer'");
 const transferPermission=perm0?.permission_id??969105;
 if(!perm0)await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,'transaction.responsible.transfer')",[transferPermission]);
 const mgrScope=await one(c,"SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=901 AND ended_at IS NULL LIMIT 1");
 assert.ok(mgrScope);
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()",[transferPermission]);
 const mgrBound=await one(c,"SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[transferPermission,mgrScope.scope_id]);
 if(!mgrBound)await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[transferPermission,mgrScope.scope_id]);
 const handoff=await oldRef('feat/f06-4b-transaction-handoff-ci',()=>oldHandoffCI(auth,managerToken,{
  transactionId:oldTx,newResponsibleId:4,reason:'4C合成父版本真实负责人移交来源',
  eventKey:mk('old-4b')
 }));
 assert.equal(handoff.code,'F06_4B_ATOMIC_HANDOFF_CI',JSON.stringify(handoff));
 await c.query("UPDATE public.pc_login_accounts SET credential_state='enabled',force_password_change=false WHERE account_id=5 AND employee_id=4");
 const recv=await auth.login({login:'disabled_test',password:'SyntheticDisabled_123',source:'pg1-old4c-receiver'});
 assert.equal(recv.code,'AUTH_OK',JSON.stringify(recv));
 const cancelP=await one(c,"SELECT permission_id FROM public.permissions WHERE permission_code='transaction.ci.cancel'");
 assert.ok(cancelP);
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(4,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()",[cancelP.permission_id]);
 let scope=await one(c,"SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=4 AND scope_kind='team' AND scope_reference_id=901 AND ended_at IS NULL LIMIT 1");
 if(!scope)scope=await one(c,"INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(4,'team',901) RETURNING scope_id");
 const rbound=await one(c,"SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=4 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[cancelP.permission_id,scope.scope_id]);
 if(!rbound)await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(4,$1,$2,clock_timestamp()-interval '2 minutes')",[cancelP.permission_id,scope.scope_id]);
 const old=await oldRef('feat/f06-4c-post-handoff-cancel-ci',()=>oldCancelCI(auth,recv.token,{
  transactionId:oldTx,reason:'4C合成父版本真实签名移交取消结果',
  eventKey:mk('old-4c')
 }));
 assert.equal(old.code,'F06_4C_POST_HANDOFF_CANCELLED_ATOMIC_CI',JSON.stringify(old));
 const oldCarrier=await carrier(c,oldTx);
 assert.ok(oldCarrier&&oldCarrier.signed_transaction_id);
 // 保留4A原Sales会话对照的合同：4C准备完成后恢复角色，不改旧4B/4C不可变事实。
 const sales=await one(c,"SELECT role_id FROM public.roles WHERE role_code='sales'");
 await c.query("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1",[sales.role_id]);
 return {oldTx,newTx,old,oldCarrier,receiverToken:recv.token,managerToken,
  managerRoleId:manager.role_id,receiptPermissionId:cancelP.permission_id,
  baseline:{oldHandoffTransaction:oldTx,pendingHandoffTransaction:newTx,old4CCode:old.code,
   immutableHandoffEventId:handoff.eventId,source:'SIGNED_5B_4B_4C_PARENT_SERVICES'}};
}
export async function proveVersionedNative4C(c,base,fixture){
 gate();
 const {auth}=base;
 assert.equal((await verify(c)).verified,true);
 await c.query("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1",[fixture.managerRoleId]);
 const manager=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'pg1-v2-handoff-manager'});
 assert.equal(manager.code,'AUTH_OK',JSON.stringify(manager));
 const signed=await newHandoffCI(auth,manager.token,{
  transactionId:fixture.newTx,newResponsibleId:4,
  reason:'4C合成父版本真实负责人移交来源',eventKey:mk('new-4b')
 });
 assert.equal(signed.code,'F06_4B_ATOMIC_HANDOFF_CI',JSON.stringify(signed));
 const wrong=await cancelAfterHandoffV2CI(auth,manager.token,{
  transactionId:fixture.newTx,reason:'原负责人不能越权取消已移交交易',eventKey:mk('wrong-old-4c')
 });
 assert.equal(wrong.code,'F06_4C_OLD_RESPONSIBLE_DENIED',JSON.stringify(wrong));
 // 4B已完成移交，4C真实收件人注错必须撤销状态和全部新三签，不撤销已提交4B。
 for(const cp of ['AFTER_STATUS_THROW','AFTER_EVENT_THROW','AFTER_AUDIT_THROW','BEFORE_COMMIT_THROW']){
  await assert.rejects(
   ()=>cancelAfterHandoffV2CI(auth,fixture.receiverToken,{
    transactionId:fixture.newTx,reason:'真实4C移交之后分阶段注错完整回滚',eventKey:mk('4c-rollback-'+cp),
    testCheckpoint:cp
   }),/F06_4C_INJECTED_/);
  const state=await carrier(c,fixture.newTx);
  assert.equal(state.status,'in_progress','PG1_V2_4C_INJECTION_STATUS_HALF_WRITE_'+cp);
  assert.equal(state.signed_transaction_id,null,'PG1_V2_4C_INJECTION_KEY_HALF_WRITE_'+cp);
  const facts=await one(c,"SELECT "+
   "(SELECT count(*)::int FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1) origins,"+
   "(SELECT count(*)::int FROM f06_4c_ci.cancel_events WHERE transaction_id=$1) events",
   [fixture.newTx]);
  assert.equal(facts.origins,0);assert.equal(facts.events,0);
  assert.equal((await verify(c)).verified,true);
 }
 const cancel=await cancelAfterHandoffV2CI(auth,fixture.receiverToken,{
  transactionId:fixture.newTx,reason:'4C合成父版本真实签名移交取消结果',eventKey:mk('new-4c')
 });
 assert.equal(cancel.code,fixture.old.code,'PG1_V2_SIGNED_4C_CANCEL_CODE_NOT_EQUIVALENT '+JSON.stringify(cancel));
 const now=await carrier(c,fixture.newTx);
 assert.ok(now&&now.signed_transaction_id,'PG1_V2_4C_CANCEL_SIGNED_ORIGIN_REQUIRED');

 // 4C真实正向签发后逐字段核同一Event、原4B交接和取消原因；不只信成功响应。
 const trusted=await one(c,"SELECT f06_5c_pg1_ci.valid_cancel_signature($1) signed_ok",[fixture.newTx]);
 assert.equal(trusted?.signed_ok,true,'PG1_V2_4C_FULL_SIGNED_CANCEL_ORIGIN_REQUIRED');
 const nativeChain=await one(c,"SELECT "+
  "k.event_id=e.event_id AS same_cancel_event,"+
  "h.transaction_id=o.transaction_id AS same_handoff_transaction,"+
  "e.reason=o.reason AS same_cancel_reason,"+
  "p.current_responsible_employee_id=o.transferred_responsible_employee_id AS same_responsible "+
  "FROM f06_4c_ci.cancel_origins o "+
  "JOIN f06_4c_ci.cancel_events e USING(transaction_id) "+
  "JOIN f06_4c_ci.request_keys k ON k.transaction_id=o.transaction_id AND k.event_key_sha256=e.event_key_sha256 "+
  "JOIN f06_4b_ci.responsible_projection p ON p.transaction_id=o.transaction_id "+
  "JOIN f06_4b_ci.handoff_events h ON h.event_id=p.last_event_id "+
  "WHERE o.transaction_id=$1",[fixture.newTx]);
 for(const k of ['same_cancel_event','same_handoff_transaction','same_cancel_reason','same_responsible'])
  assert.equal(nativeChain?.[k],true,'PG1_V2_4C_CROSS_EVENT_SIGNATURE_MISMATCH_'+k);
 for(const k of ['status','completed_at','responsible_employee_id','original_responsible_employee_id',
  'transferred_responsible_employee_id','parent_handoff_event_count','actor_employee_id',
  'event_kind','signed_actor'])
  assert.deepEqual(now[k],fixture.oldCarrier[k],'PG1_V2_4C_BUSINESS_DRIFT_'+k);
 const idem=await cancelAfterHandoffV2CI(auth,fixture.receiverToken,{
  transactionId:fixture.newTx,reason:'4C合成父版本真实签名移交取消结果',eventKey:mk('new-4c')
 });
 assert.equal(idem.code,'F06_4C_IDEMPOTENT_CANCEL',JSON.stringify(idem));
 const ev=await one(c,"SELECT count(*)::int n FROM f06_4c_ci.cancel_events WHERE transaction_id=$1",[fixture.newTx]);
 assert.equal(ev.n,1);
 assert.equal((await verify(c)).verified,true);
 return {old4C:fixture.old.code,new4C:cancel.code,
  oldTx:fixture.oldTx,newTx:fixture.newTx,
  oldSignedEventId:fixture.baseline.immutableHandoffEventId,
  newSignedEventId:signed.eventId,currentEmployeeId:4,
  wrongActorDenied:wrong.code,idempotent:idem.code,source:'PG16_AUTH_SIGNED_IMMUTABLE_4B_4C',
  comparedBusinessColumns:9};
}
