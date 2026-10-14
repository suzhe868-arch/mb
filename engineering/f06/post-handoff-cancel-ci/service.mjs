// F06-4C: post signed 4B handoff cancellation, only native disposable nonprivileged PG16.
import {createHash} from 'node:crypto';
import {gate,verify,withF064B} from './migration.mjs';
import {currentSignedResponsibleCI} from '../transaction-handoff-ci/service.mjs';
const yes=(code,data={})=>({allowed:true,code,...data}),no=(code,data={})=>({allowed:false,code,...data});
const one=async(c,s,p=[])=> (await c.query(s,p)).rows[0];
const sha=x=>createHash('sha256').update(x).digest('hex');
const id=x=>Number.isSafeInteger(x)&&x>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
export function productionCancelDeny(){return no('F06_4C_PRODUCTION_CANCEL_ISSUER_SOURCE_GAP')}
export function realRefundDeny(){return no('F06_4C_REAL_REFUNDED_PAYMENT_NOT_AUTHORIZED')}
export function completedDeny(){return no('F06_4C_TRANSACTION_COMPLETED_ISSUER_NOT_AUTHORIZED')}
async function permission(c,a,t){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||a.force_password_change!==false||
 a.credential_state!=='enabled'||a.subject_status!=='active'||!['sales','manager','store_head'].includes(a.role_code)||
 Number(a.employee_id)!==Number(t.responsible_employee_id))return no('F06_4C_NOT_CURRENT_RESPONSIBLE');
 const ok=await one(c,"SELECT e.employee_id FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='transaction.ci.cancel' "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id "+
 "JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships source_m ON source_m.team_id=t.team_id AND source_m.employee_id=$2 "+
 "JOIN public.customers cust ON cust.customer_id=$3 "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code=$4 "+
 "AND t.team_status='active' AND st.status='active' AND cust.account_status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND source_m.valid_from<=clock_timestamp() AND (source_m.ended_at IS NULL OR source_m.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,source_m,cust",
 [a.employee_id,t.original_responsible_employee_id,t.customer_id,a.role_code]);
 return ok?yes('F06_4C_EXPLICIT_CANCEL_PERMISSION_SCOPE_PASS'):no('F06_4C_PERMISSION_SCOPE_DENIED');
}
async function signed(c,t){
 const cur=await withF064B(()=>currentSignedResponsibleCI(c,Number(t.transaction_id)));
 if(!cur.allowed||!cur.hasHandoff||Number(cur.currentResponsibleId)!==Number(t.responsible_employee_id))
  return no('F06_4C_SIGNED_HANDOFF_SOURCE_GAP');
 const origin=await one(c,"SELECT * FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 const proj=await one(c,"SELECT * FROM f06_4b_ci.responsible_projection WHERE transaction_id=$1 FOR UPDATE",[t.transaction_id]);
 if(!origin||!proj||Number(origin.original_responsible_employee_id)!==Number(cur.originalResponsibleId)||
  Number(proj.original_responsible_employee_id)!==Number(cur.originalResponsibleId)||
  Number(proj.current_responsible_employee_id)!==Number(cur.currentResponsibleId)||
  Number(proj.event_count)<1||!proj.last_event_id||
  Number(proj.source_lock_id)!==Number(t.source_lock_id)||Number(proj.customer_id)!==Number(t.customer_id)||
  Number(proj.vehicle_id)!==Number(t.vehicle_id)||Number(proj.listing_cycle_id)!==Number(t.listing_cycle_id))
  return no('F06_4C_4B_PROJECTION_DRIFT');
 const last=await one(c,"SELECT * FROM f06_4b_ci.handoff_events WHERE event_id=$1 AND transaction_id=$2 FOR SHARE",[proj.last_event_id,t.transaction_id]);
 if(!last||Number(last.new_responsible_employee_id)!==Number(t.responsible_employee_id)||
 Number(last.actor_employee_id)===0)return no('F06_4C_LAST_HANDOFF_EVENT_INVALID');
 // Never allow an unproven 4A cancellation or F03-M receipt to masquerade as live 4B source.
 const collisions=await one(c,"SELECT "+
 "(SELECT count(*)::int FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1) parent_cancel,"+
 "(SELECT count(*)::int FROM public.transaction_responsible_handover_receipts WHERE transaction_id=$1) legacy_handoff,"+
 "(SELECT count(*)::int FROM public.refund_cases WHERE transaction_id=$1 OR lock_id=$2) refunds,"+
 "(SELECT count(*)::int FROM public.refund_payments pay JOIN public.refund_cases r USING(refund_id) WHERE r.transaction_id=$1 OR r.lock_id=$2) paid,"+
 "(SELECT count(*)::int FROM public.deposit_receipts WHERE lock_id=$2) raw,"+
 "(SELECT count(*)::int FROM f06_3a_ci.receipt_provenance WHERE lock_id=$2) signed,"+
 "(SELECT count(*)::int FROM f06_3a_ci.adjustments WHERE lock_id=$2) adjustments",
 [t.transaction_id,t.source_lock_id]);
 if(collisions.parent_cancel||collisions.legacy_handoff)return no('F06_4C_CANCEL_OR_LEGACY_HANDOFF_SOURCE_GAP');
 if(collisions.refunds||collisions.paid||collisions.raw!==collisions.signed||collisions.adjustments)
  return no('F06_4C_FINANCIAL_OR_REFUND_UNKNOWN_DENY');
 const deposits=(await c.query("SELECT d.customer_id,d.amount_cents,r.original_amount_cents,r.customer_id signed_customer,r.vehicle_id,r.listing_cycle_id FROM public.deposit_receipts d JOIN f06_3a_ci.receipt_provenance r USING(deposit_id) WHERE d.lock_id=$1 FOR SHARE OF d,r",[t.source_lock_id])).rows;
 if(deposits.some(d=>Number(d.customer_id)!==Number(t.customer_id)||Number(d.signed_customer)!==Number(t.customer_id)||
 Number(d.amount_cents)!==Number(d.original_amount_cents)||Number(d.vehicle_id)!==Number(t.vehicle_id)||
 Number(d.listing_cycle_id)!==Number(t.listing_cycle_id)))return no('F06_4C_DEPOSIT_PROVENANCE_DRIFT');
 return yes('F06_4C_SIGNED_4B_HANDOFF_AND_FINANCE',{origin,proj,last});
}
export async function cancelAfterHandoffSyntheticCI(auth,token,p={}){
 gate();if(!id(p.transactionId)||!reason(p.reason)||!key(p.eventKey))return no('F06_4C_INVALID_REQUEST');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  const f=await one(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
  if(!f)return no('F06_4C_TRANSACTION_NOT_FOUND');
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[f.vehicle_id]);
  const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[p.transactionId]);
  if(!t)return no('F06_4C_TRANSACTION_NOT_FOUND');
  if(!a||Number(a.employee_id)!==Number(t.responsible_employee_id))return no('F06_4C_OLD_RESPONSIBLE_DENIED');
  const current=await one(c,'SELECT original_responsible_employee_id FROM f06_4b_ci.responsible_projection WHERE transaction_id=$1 FOR UPDATE',[p.transactionId]);
  if(!current)return no('F06_4C_UNPROVEN_TRANSFER');
  const allowed=await permission(c,a,{...t,original_responsible_employee_id:current.original_responsible_employee_id});
  if(!allowed.allowed)return allowed;
  const k=sha('f06-4c:'+a.employee_id+':'+p.eventKey);
  const payload=sha(JSON.stringify({transactionId:p.transactionId,reason:p.reason.trim(),action:'post_handoff_cancel'}));
  const prior=await one(c,'SELECT * FROM f06_4c_ci.request_keys WHERE event_key_sha256=$1',[k]);
  if(prior)return Number(prior.transaction_id)===p.transactionId&&prior.payload_sha256===payload?
   yes('F06_4C_IDEMPOTENT_CANCEL',{transactionId:p.transactionId,eventId:Number(prior.event_id)}):
   no('F06_4C_IDEMPOTENCY_CONFLICT');
  if(t.status!=='in_progress'||t.completed_at!==null)return no('F06_4C_TERMINAL_TRANSACTION_DENY');
  const proof=await signed(c,t);if(!proof.allowed)return proof;
  if(p.testCheckpoint==='BEFORE_STATUS_THROW')throw Error('F06_4C_INJECTED_BEFORE_STATUS_ROLLBACK');
  const updated=await one(c,"UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1 AND status='in_progress' AND responsible_employee_id=$2 RETURNING transaction_id",[p.transactionId,a.employee_id]);
  if(!updated)throw Error('F06_4C_ATOMIC_CAS_FAILED');
  if(p.testCheckpoint==='AFTER_STATUS_THROW')throw Error('F06_4C_INJECTED_AFTER_STATUS_ROLLBACK');
  await c.query("INSERT INTO f06_4c_ci.cancel_origins(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,original_responsible_employee_id,transferred_responsible_employee_id,actor_employee_id,parent_last_handoff_event_id,parent_handoff_event_count,previous_status,resulting_status,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'in_progress','cancelled',$11)",
  [t.transaction_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,proof.origin.original_responsible_employee_id,a.employee_id,a.employee_id,proof.proj.last_event_id,proof.proj.event_count,p.reason.trim()]);
  const ev=await one(c,"INSERT INTO f06_4c_ci.cancel_events(transaction_id,actor_employee_id,original_responsible_employee_id,current_responsible_employee_id,parent_last_handoff_event_id,event_key_sha256,reason,event_kind) VALUES($1,$2,$3,$4,$5,$6,$7,'post_handoff_transaction_cancelled_ci_only') RETURNING event_id",
  [t.transaction_id,a.employee_id,proof.origin.original_responsible_employee_id,t.responsible_employee_id,proof.proj.last_event_id,k,p.reason.trim()]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_4C_INJECTED_AFTER_EVENT_ROLLBACK');
  await c.query("INSERT INTO f06_4c_ci.request_keys(event_key_sha256,actor_employee_id,transaction_id,payload_sha256,event_id) VALUES($1,$2,$3,$4,$5)",[k,a.employee_id,t.transaction_id,payload,ev.event_id]);
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_4c_ci_post_handoff_cancel',$3::jsonb,$4::jsonb,clock_timestamp())",[String(a.employee_id),String(t.transaction_id),JSON.stringify({status:'in_progress',currentResponsible:a.employee_id}),JSON.stringify({status:'cancelled',issuer:'CI_NO_REAL_MONEY',handoffId:Number(proof.proj.last_event_id)})]);
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_4C_INJECTED_AFTER_AUDIT_ROLLBACK');
  const fresh=await permission(c,a,{...t,original_responsible_employee_id:current.original_responsible_employee_id});
  const now=await one(c,'SELECT status,responsible_employee_id,completed_at,source_lock_id,customer_id,vehicle_id,listing_cycle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
  if(!fresh.allowed||!now||now.status!=='cancelled'||now.completed_at!==null||Number(now.responsible_employee_id)!==Number(a.employee_id)||
    ['source_lock_id','customer_id','vehicle_id','listing_cycle_id'].some(k=>Number(now[k])!==Number(t[k])))throw Error('F06_4C_PRECOMMIT_SECURITY_DRIFT');
  if(p.testCheckpoint==='BEFORE_COMMIT_THROW')throw Error('F06_4C_INJECTED_PRECOMMIT_ROLLBACK');
  return yes('F06_4C_POST_HANDOFF_CANCELLED_ATOMIC_CI',{transactionId:p.transactionId,currentResponsibleId:Number(a.employee_id),eventId:Number(ev.event_id),backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||no('F06_4C_SESSION_DENIED');
 }catch(e){if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_4C_PG_CONTENTION_ATOMIC_DENY',{sqlstate:e.code});throw e}
}
export async function postHandoffOccupancyCI(c,vehicleId){
 gate();await verify(c);if(!id(vehicleId))return no('F06_4C_INVALID_VEHICLE');
 const rows=(await c.query("SELECT t.transaction_id,t.status,o.transaction_id AS origin_id,h.transaction_id AS handoff_id,x.transaction_id AS cancel_id FROM public.transactions t LEFT JOIN f06_3b_ci.transaction_origins o USING(transaction_id) LEFT JOIN f06_4b_ci.responsible_projection h USING(transaction_id) LEFT JOIN f06_4c_ci.cancel_origins x USING(transaction_id) WHERE t.vehicle_id=$1",[vehicleId])).rows;
 if(rows.some(x=>(x.status==='cancelled'&&x.handoff_id&&!x.cancel_id)||(!x.origin_id&&x.status==='in_progress')||
 (x.cancel_id&&x.status!=='cancelled')))return no('F06_4C_UNSIGNED_CURRENT_OCCUPANCY');
 if(rows.some(x=>x.status==='in_progress'))return no('F06_4C_SIGNED_TRANSACTION_STILL_OCCUPIES');
 return yes('F06_4C_SIGNED_CANCEL_NO_IN_PROGRESS_OCCUPANCY_ONLY_CI');
}
export async function publicPoolGuardCI(c,customerId){
 gate();await verify(c);if(!id(customerId))return no('F06_4C_INVALID_CUSTOMER');
 const x=await one(c,"SELECT (SELECT count(*)::int FROM public.transactions WHERE customer_id=$1 AND status='in_progress') ongoing,(SELECT count(*)::int FROM public.refund_cases WHERE customer_id=$1 AND status='pending') pending",[customerId]);
 return x.ongoing||x.pending?no('F06_4C_PUBLIC_POOL_ACTIVE_BUSINESS_GUARD'):yes('F06_4C_ONLY_TRANSACTION_GUARD_CLEAR_OTHER_AUTHORITIES_APPLY');
}
