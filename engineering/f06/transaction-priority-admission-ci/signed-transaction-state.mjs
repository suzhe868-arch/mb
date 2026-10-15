// F06-5C：只读校验已签交易终态；只用于可销毁PG16下同Vehicle锁事务。
// 3B in_progress 是历史签发态；当前 cancelled 必须以4A/4C不可变终态证明。
// 未验证的旧3B交易、5B Guard缺失、资金或付款来源未知均FailClosed。
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const eq=(a,b)=>a!==null&&a!==undefined&&b!==null&&b!==undefined&&String(a)===String(b);
const get=async(c,s,p=[])=> (await c.query(s,p)).rows[0];
const rows=async(c,s,p=[])=> (await c.query(s,p)).rows;
const deny=code=>({allowed:false,code,CI_ONLY:true});
const fields=(a,b,names)=>names.every(k=>eq(a[k],b[k]));
const identity=['transaction_id','source_lock_id','vehicle_id','listing_cycle_id','customer_id'];

async function signedCancellation(c,t,o){
 // 单PG Client、单事务依序读取锁定行；不使用Promise.all在同一连接发并发查询。
 const a=await get(c,'SELECT * FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const x=await get(c,'SELECT * FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const p=await get(c,'SELECT * FROM f06_4b_ci.responsible_projection WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(Number(!!a)+Number(!!x)!==1)return deny('F06_5C_TERMINAL_CANCEL_SIGNATURE_MISSING_OR_CONFLICT');
 if(!fields(a||x,t,identity)||!eq((a||x).original_responsible_employee_id,o.original_responsible_employee_id)||
   (a||x).previous_status!=='in_progress'||(a||x).resulting_status!=='cancelled'||
   (a||x).issuer_kind!=='CI_SYNTHETIC_NO_MONEY'||!String((a||x).reason||'').trim())
  return deny('F06_5C_TERMINAL_CANCEL_ORIGIN_DRIFT');
 if(a){
  if(p||!eq(t.responsible_employee_id,a.original_responsible_employee_id)||
   !eq(a.actor_employee_id,t.responsible_employee_id))return deny('F06_5C_4A_RESPONSIBLE_DRIFT');
  const e=await get(c,'SELECT * FROM f06_4a_ci.cancel_events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
  const k=e&&await get(c,'SELECT * FROM f06_4a_ci.request_keys WHERE event_key_sha256=$1 FOR SHARE',[e.event_key_sha256]);
  if(!e||!k||e.event_kind!=='transaction_cancelled_without_payment'||e.previous_status!=='in_progress'||
   e.resulting_status!=='cancelled'||e.reason!==a.reason||
   !eq(e.actor_employee_id,a.actor_employee_id)||!eq(k.actor_employee_id,a.actor_employee_id)||
   !eq(k.transaction_id,t.transaction_id)||k.action!=='cancel'||!eq(e.transaction_id,t.transaction_id))
   return deny('F06_5C_4A_CANCEL_EVENT_OR_REQUEST_UNSIGNED');
 }else{
  const history=p&&await rows(c,'SELECT * FROM f06_4b_ci.handoff_events WHERE transaction_id=$1 ORDER BY event_id FOR SHARE',[t.transaction_id]);
  if(!p||!history?.length||history.length!==Number(p.event_count)||
   !eq(p.last_event_id,history.at(-1).event_id)||
   !fields(p,t,identity)||!eq(p.original_responsible_employee_id,o.original_responsible_employee_id)||
   !eq(p.current_responsible_employee_id,t.responsible_employee_id))
   return deny('F06_5C_4C_HANDOFF_PROJECTION_UNSIGNED');
  let old=o.original_responsible_employee_id,previous=null;
  for(const e of history){
   if(!eq(e.old_responsible_employee_id,old)||
      !((e.prior_event_id===null&&previous===null)||eq(e.prior_event_id,previous))||
      !eq(e.transaction_id,t.transaction_id)||
      e.synthetic_authority!=='CI_EXPLICIT_MANAGER_SCOPE_NOT_PRODUCTION')
    return deny('F06_5C_4C_HANDOFF_CHAIN_DRIFT');
   old=e.new_responsible_employee_id;previous=e.event_id;
  }
  if(!eq(old,t.responsible_employee_id)||
   !eq(x.transferred_responsible_employee_id,t.responsible_employee_id)||
   !eq(x.actor_employee_id,t.responsible_employee_id)||
   !eq(x.parent_last_handoff_event_id,p.last_event_id)||
   Number(x.parent_handoff_event_count)!==history.length)
   return deny('F06_5C_4C_CANCEL_PARENT_DRIFT');
  const e=await get(c,'SELECT * FROM f06_4c_ci.cancel_events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
  const k=e&&await get(c,'SELECT * FROM f06_4c_ci.request_keys WHERE event_key_sha256=$1 FOR SHARE',[e.event_key_sha256]);
  if(!e||!k||e.event_kind!=='post_handoff_transaction_cancelled_ci_only'||
   !eq(e.actor_employee_id,x.actor_employee_id)||!eq(e.current_responsible_employee_id,t.responsible_employee_id)||
   !eq(e.original_responsible_employee_id,o.original_responsible_employee_id)||
   !eq(e.parent_last_handoff_event_id,p.last_event_id)||e.reason!==x.reason||
   !eq(k.transaction_id,t.transaction_id)||!eq(k.actor_employee_id,x.actor_employee_id)||
   !eq(k.event_id,e.event_id))
   return deny('F06_5C_4C_CANCEL_EVENT_OR_REQUEST_UNSIGNED');
 }
 return {allowed:true,code:a?'F06_5C_SIGNED_4A_CANCEL':'F06_5C_SIGNED_4C_CANCEL'};
}
async function signedFinance(c,t,o,g){
 // Guard签的是“安全转换瞬间”无未明付款的快照。任何随后未签财务流动均需拒绝。
 const cases=await rows(c,"SELECT r.*,l.vehicle_id lock_vehicle,l.listing_cycle_id lock_cycle,"+
  "tx.vehicle_id tx_vehicle,tx.listing_cycle_id tx_cycle FROM public.refund_cases r "+
  "LEFT JOIN public.locks l ON l.lock_id=r.lock_id "+
  "LEFT JOIN public.transactions tx ON tx.transaction_id=r.transaction_id "+
  "WHERE l.vehicle_id=$1 OR tx.vehicle_id=$1 ORDER BY r.refund_id FOR SHARE OF r",[t.vehicle_id]);
 const facts=[];
 for(const r of cases){
  if((r.lock_id===null)===(r.transaction_id===null)||
   (r.lock_id!==null&&(!eq(r.lock_vehicle,t.vehicle_id)||!eq(r.lock_cycle,t.listing_cycle_id)))||
   (r.transaction_id!==null&&(!eq(r.tx_vehicle,t.vehicle_id)||!eq(r.tx_cycle,t.listing_cycle_id))))
   return deny('F06_5C_REFUND_SUBJECT_OR_CYCLE_DRIFT');
  const paid=await get(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[r.refund_id]);
  if(Number(paid.n)>0||r.status==='refunded')return deny('F06_5C_ACTUAL_PAYMENT_OR_REFUNDED_FORBIDDEN');
  if(r.status!=='closed'||!r.close_reason||!r.closed_at)
   return deny('F06_5C_PENDING_OR_UNKNOWN_FINANCE_DENIED');
  // 5B只可能在“Lock已无待退款”时签发；交易侧退款是之后的事实，不能使用旧Guard洗白。
  if(r.transaction_id!==null)return deny('F06_5C_POST_TRANSACTION_REFUND_REQUIRES_NEW_AUTHORITY');
  const origin=await get(c,'SELECT * FROM f06_3c1_ci.refund_origins WHERE refund_id=$1 FOR SHARE',[r.refund_id]);
  const ev=await rows(c,'SELECT event_kind,resulting_status FROM f06_3c1_ci.status_events WHERE refund_id=$1 ORDER BY event_id FOR SHARE',[r.refund_id]);
  if(!origin||!eq(origin.lock_id,r.lock_id)||!eq(origin.customer_id,r.customer_id)||
    !eq(origin.vehicle_id,t.vehicle_id)||!eq(origin.listing_cycle_id,t.listing_cycle_id)||
    !ev.some(e=>e.event_kind==='pending_requested'&&e.resulting_status==='pending')||
    !ev.some(e=>e.event_kind==='closed_without_payment'&&e.resulting_status==='closed'))
   return deny('F06_5C_LEGACY_REFUND_CLOSE_UNSIGNED');
  facts.push([r.refund_id,r.status,r.close_reason]);
 }
 if(Number(g.checked_refunds)!==facts.length||g.signed_refunds_sha256!==sha(JSON.stringify(facts)))
  return deny('F06_5C_5B_SIGNED_FINANCE_SNAPSHOT_DRIFT');
 const receipts=await rows(c,'SELECT * FROM public.deposit_receipts WHERE lock_id=$1 FOR SHARE',[t.source_lock_id]);
 if(receipts.length!==Number(o.deposit_receipt_count))
  return deny('F06_5C_TRANSACTION_RECEIPT_COUNT_DRIFT');
 for(const d of receipts){
  const proof=await get(c,'SELECT * FROM f06_3a_ci.receipt_provenance WHERE deposit_id=$1 FOR SHARE',[d.deposit_id]);
  if(!proof||!eq(proof.original_amount_cents,d.amount_cents)||
   !eq(proof.customer_id,t.customer_id)||!eq(d.customer_id,t.customer_id)||
   !eq(proof.vehicle_id,t.vehicle_id)||!eq(proof.listing_cycle_id,t.listing_cycle_id))
   return deny('F06_5C_DEPOSIT_PROVENANCE_DRIFT');
  const adjustments=await rows(c,'SELECT a.*,k.resulting_adjustment_id,k.action,k.deposit_id signed_deposit,'+
   'k.lock_id signed_lock,k.actor_employee_id signed_actor,k.amount_cents signed_amount,k.key_sha256 signed_key '+
   'FROM f06_3a_ci.adjustments a LEFT JOIN f06_3a_ci.request_keys k ON k.resulting_adjustment_id=a.adjustment_id '+
   'WHERE a.deposit_id=$1 FOR SHARE OF a',[d.deposit_id]);
  if(adjustments.some(z=>!eq(z.resulting_adjustment_id,z.adjustment_id)||
    !eq(z.signed_deposit,d.deposit_id)||!eq(z.signed_lock,t.source_lock_id)||
    !eq(z.signed_actor,z.actor_employee_id)||!eq(z.signed_amount,z.delta_cents)||
    z.action!==z.event_kind||z.signed_key!==z.event_key_sha256))
   return deny('F06_5C_DEPOSIT_ADJUSTMENT_UNSIGNED');
 }
 return {allowed:true,code:'F06_5C_SIGNED_FINANCE_NO_PAYMENT'};
}
export async function verifySignedTransactionVacancyCI(c,vehicleId){
 // 调用者已持有当前Vehicle FOR UPDATE，使用同一个PG Client/txid。
 const all=await rows(c,'SELECT * FROM public.transactions WHERE vehicle_id=$1 ORDER BY transaction_id FOR SHARE',[vehicleId]);
 const origins=await rows(c,'SELECT * FROM f06_3b_ci.transaction_origins WHERE vehicle_id=$1 ORDER BY transaction_id FOR SHARE',[vehicleId]);
 if(all.length!==origins.length)return deny('F06_5C_TRANSACTION_ORIGIN_CARDINALITY_DRIFT');
 for(const t of all){
  if(t.status!=='cancelled')return deny('F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS');
  const o=origins.find(z=>eq(z.transaction_id,t.transaction_id));
  if(!o||!fields(o,t,identity)||o.status!=='in_progress'||o.public_carrier_status!=='in_progress'||
   o.lock_end_reason!=='converted_to_transaction'||t.completed_at!==null)
   return deny('F06_5C_FROZEN_3B_ORIGIN_DRIFT');
  const l=await get(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR SHARE',[t.source_lock_id]);
  const snap=await get(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[t.source_lock_id]);
  if(!l||!snap||l.lock_status!=='released'||l.end_reason!=='converted_to_transaction'||
   !eq(l.vehicle_id,t.vehicle_id)||!eq(l.listing_cycle_id,t.listing_cycle_id)||!eq(l.customer_id,t.customer_id)||
   !eq(snap.customer_id,t.customer_id)||!eq(snap.responsible_employee_id,o.original_responsible_employee_id))
   return deny('F06_5C_CONVERTED_LOCK_SIGNATURE_DRIFT');
  const ev=await get(c,'SELECT * FROM f06_3b_ci.origin_events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
  const k=ev&&await get(c,'SELECT * FROM f06_3b_ci.request_keys WHERE event_key_sha256=$1 FOR SHARE',[ev.event_key_sha256]);
  if(!ev||!k||!eq(ev.source_lock_id,t.source_lock_id)||
   ev.previous_lock_status!=='active'||ev.final_lock_status!=='released'||
   ev.event_kind!=='lock_converted_to_transaction'||!eq(k.resulting_transaction_id,t.transaction_id)||
   !eq(k.source_lock_id,t.source_lock_id)||!eq(k.opening_actor_employee_id,o.opening_actor_employee_id)||
   !eq(ev.actor_employee_id,o.opening_actor_employee_id)||k.action!=='open')
   return deny('F06_5C_3B_SIGNED_EVENT_OR_KEY_DRIFT');
  const g=await get(c,'SELECT * FROM f06_5b_ci.guard_events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
  if(!g||!eq(g.source_lock_id,t.source_lock_id)||!eq(g.vehicle_id,t.vehicle_id)||
   !eq(g.listing_cycle_id,t.listing_cycle_id)||!eq(g.actor_employee_id,o.opening_actor_employee_id)||
   g.production_issuer!=='UNWIRED')return deny('F06_5C_5B_GUARD_MISSING_OR_DRIFT');
  const f=await signedFinance(c,t,o,g);if(!f.allowed)return f;
  const cancel=await signedCancellation(c,t,o);if(!cancel.allowed)return cancel;
 }
 return {allowed:true,code:'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL'};
}
