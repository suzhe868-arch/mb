// 真PG16：无原4A/4C三签时，伪public取消必须连同事务及全部父Priority候选回滚。
// 注意：此为无真实JYT current Match前提的签名事务守卫反例，不冒充完整原PR62 C02/C03。
import assert from 'node:assert/strict';
import {gate,verify} from './catalog-delta-verifier.mjs';
const first=async(c,s,a=[])=> (await c.query(s,a)).rows[0];
async function fact(c,v,tx){
 const t=await first(c,'SELECT status FROM public.transactions WHERE transaction_id=$1',[tx]);
 const p=await first(c,"SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[v]);
 const e=await first(c,"SELECT count(*)::int n FROM public.f05_8_events_ci WHERE vehicle_id=$1 AND event_kind='created'",[v]);
 const c4=await first(c,"SELECT count(*)::int n FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1",[tx]);
 return {status:t.status,activePriority:p.n,createdEvents:e.n,authenticCancelOrigins:c4.n};
}
export async function runNativeForgedCancelMatrix(c,transactionId){
 gate();
 assert.equal((await verify(c)).verified,true);
 const tx=await first(c,'SELECT vehicle_id,customer_id,status FROM public.transactions WHERE transaction_id=$1',[transactionId]);
 assert.equal(tx.status,'in_progress');
 const pre=await fact(c,tx.vehicle_id,transactionId);
 assert.equal(pre.authenticCancelOrigins,0);
 const outcomes=[];
 for(const withUnknownRefund of [false,true]){
  let pid,txid,attempted,atIntermediate,denial=null;
  await c.query('BEGIN');
  try{
   const backend=await first(c,'SELECT pg_backend_pid()::int pid,txid_current()::text tid');
   pid=backend.pid;txid=backend.tid;
   if(withUnknownRefund)await c.query("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,NULL,$2,'pending',100)",
    [tx.customer_id,transactionId]);
   await c.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1",[transactionId]);
   attempted=await fact(c,tx.vehicle_id,transactionId);
   assert.equal(attempted.activePriority,pre.activePriority);
   assert.equal(attempted.createdEvents,pre.createdEvents);
   assert.equal(attempted.authenticCancelOrigins,0);
   assert.equal(attempted.status,'cancelled');
   atIntermediate=true;
   try{await c.query('COMMIT')}catch(e){denial={sqlstate:e.code||null,message:e.message};}
  }finally{await c.query('ROLLBACK').catch(()=>{})}
  assert.ok(denial&&denial.sqlstate==='23514'&&denial.message.includes('F06_5C_PG1_UNSIGNED_CANCEL_ROLLBACK'),
   'F06_PG1_UNSIGNED_NATIVE_COMMIT_SHOULD_FAIL_'+JSON.stringify({withUnknownRefund,denial}));
  assert.deepEqual(await fact(c,tx.vehicle_id,transactionId),pre,'F06_PG1_NATIVE_FAKE_CANCEL_HALF_WRITE');
  outcomes.push({kind:withUnknownRefund?'pending_refund_unsigned_public_cancel':'unsigned_public_cancel',
   backendPid:pid,txid,intermediateWithoutPriority:atIntermediate,
   rollbackSQLSTATE:denial.sqlstate,expectedError:'F06_5C_PG1_UNSIGNED_CANCEL_ROLLBACK',
   noCommittedPriority:true,noCommittedFakeCancel:true,realPayment:'NO'});
 }
 assert.equal((await verify(c)).verified,true);
 return outcomes;
}
