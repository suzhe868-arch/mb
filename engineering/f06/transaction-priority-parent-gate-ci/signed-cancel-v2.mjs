// 独立PG1 v2安全入口：复制已签4A业务实现，只替换原冻结Catalog验签为严格PG1版本验签；旧4A源码仍不动。
// F06-4A: only disposable PG16 native synthetic Transaction cancellation. No production issuer.
import {createHash} from 'node:crypto';
import {gate,verify} from './catalog-delta-verifier.mjs';
const yes=(code,data={})=>({allowed:true,code,...data});
const no=(code,data={})=>({allowed:false,code,...data});
const row=async(c,s,a=[])=> (await c.query(s,a)).rows[0];
const digest=s=>createHash('sha256').update(s).digest('hex');
const id=x=>Number.isSafeInteger(x)&&x>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9:._-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
export const PRODUCTION_CANCEL_ISSUER='F06_4A_PRODUCTION_CANCEL_ISSUER_NOT_WIRED';
export function productionIssuerDeny(){return no(PRODUCTION_CANCEL_ISSUER)}
export function completedIssuerDeny(){return no('F06_4A_COMPLETED_TRANSACTION_NOT_AUTHORIZED')}
export function paymentIssuerDeny(){return no('F06_4A_REAL_MONEY_NOT_AUTHORIZED')}
async function currentPermission(c,a,responsible){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||
 !['sales','manager','store_head'].includes(a.role_code)||a.force_password_change!==false||
 a.credential_state!=='enabled'||a.subject_status!=='active'||Number(a.employee_id)!==Number(responsible))return false;
 const x=await row(c,"SELECT r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='transaction.ci.cancel' "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships rm ON rm.employee_id=$2 AND rm.team_id=t.team_id "+
 "JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active' "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND t.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,rm",[a.employee_id,responsible]);
 return !!x&&x.role_code===a.role_code;
}
async function signedOrigin(c,t){
 const o=await row(c,'SELECT * FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(!o||o.status!=='in_progress'||o.public_carrier_status!=='in_progress'||
 Number(t.source_lock_id)!==Number(o.source_lock_id)||Number(t.customer_id)!==Number(o.customer_id)||
 Number(t.vehicle_id)!==Number(o.vehicle_id)||Number(t.listing_cycle_id)!==Number(o.listing_cycle_id)||
 Number(t.responsible_employee_id)!==Number(o.original_responsible_employee_id))
 return no('F06_4A_UNSIGNED_OR_DRIFTED_ORIGIN');
 const l=await row(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[o.source_lock_id]);
 const snap=await row(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[o.source_lock_id]);
 if(!l||!snap||l.lock_status!=='released'||l.end_reason!=='converted_to_transaction'||
 Number(l.vehicle_id)!==Number(o.vehicle_id)||Number(l.customer_id)!==Number(o.customer_id)||
 Number(l.listing_cycle_id)!==Number(o.listing_cycle_id)||
 Number(snap.customer_id)!==Number(l.customer_id)||Number(snap.responsible_employee_id)!==Number(l.responsible_employee_id))
 return no('F06_4A_SOURCE_LOCK_OR_SNAPSHOT_GAP');
 const customer=await row(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[o.customer_id]);
 if(!customer||customer.account_status!=='active')return no('F06_4A_CUSTOMER_DISABLED');
 const cycle=await row(c,'SELECT vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[o.listing_cycle_id,o.vehicle_id]);
 if(!cycle)return no('F06_4A_CYCLE_MISMATCH');
 // Do not infer real money. Unproven public Deposit/Refund means cancellation must fail closed.
 const receipts=await row(c,"SELECT (SELECT count(*)::int FROM public.deposit_receipts WHERE lock_id=$1) raw, "+
 "(SELECT count(*)::int FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1) signed",[o.source_lock_id]);
 if(receipts.raw!==receipts.signed)return no('F06_4A_UNVERIFIED_MONEY_SOURCE');
 const d=(await c.query("SELECT d.deposit_id,d.customer_id,d.amount_cents,p.customer_id pc,p.vehicle_id,p.listing_cycle_id,p.original_amount_cents "+
 "FROM public.deposit_receipts d JOIN f06_3a_ci.receipt_provenance p USING(deposit_id) WHERE d.lock_id=$1 FOR SHARE OF d,p",[o.source_lock_id])).rows;
 if(d.some(x=>Number(x.customer_id)!==Number(o.customer_id)||Number(x.pc)!==Number(o.customer_id)||
 Number(x.vehicle_id)!==Number(o.vehicle_id)||Number(x.listing_cycle_id)!==Number(o.listing_cycle_id)||
 Number(x.amount_cents)!==Number(x.original_amount_cents)))return no('F06_4A_DEPOSIT_PROVENANCE_DRIFT');
 const refunds=await row(c,"SELECT count(*)::int n FROM public.refund_cases r "+
 "WHERE r.status IN('pending','refunded') AND (r.transaction_id=$1 OR r.lock_id=$2)",[t.transaction_id,o.source_lock_id]);
 if(refunds.n)return no('F06_4A_UNRESOLVED_REFUND_FACT');
 const paid=await row(c,"SELECT count(*)::int n FROM public.refund_payments pay JOIN public.refund_cases r USING(refund_id) WHERE r.transaction_id=$1 OR r.lock_id=$2",[t.transaction_id,o.source_lock_id]);
 if(paid.n)return no('F06_4A_REFUND_PAYMENT_SOURCE_GAP');
 return yes('F06_4A_SIGNED_ACTIVE_ORIGIN',{origin:o,lock:l,depositCount:d.length});
}
export async function cancelSyntheticTransactionV2CI(auth,token,p={}){
 gate();
 if(!id(p.transactionId)||!reason(p.reason)||!key(p.eventKey))return no('F06_4A_INVALID_CANCEL_ARGUMENTS');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  const v=await row(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
  if(!v)return no('F06_4A_TRANSACTION_NOT_FOUND');
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[v.vehicle_id]);
  const t=await row(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[p.transactionId]);
  if(!t)return no('F06_4A_TRANSACTION_NOT_FOUND');
  if(!await currentPermission(c,a,t.responsible_employee_id))return no('F06_4A_PERMISSION_SCOPE_DENIED');
  const h=digest('f06-4a:'+a.employee_id+':'+p.eventKey);
  const fingerprint=digest(JSON.stringify({transactionId:p.transactionId,reason:p.reason.trim(),action:'cancel'}));
  const known=await row(c,'SELECT * FROM f06_4a_ci.request_keys WHERE event_key_sha256=$1',[h]);
  if(known)return Number(known.transaction_id)===p.transactionId&&known.payload_sha256===fingerprint?
   yes('F06_4A_IDEMPOTENT_CANCEL',{transactionId:p.transactionId}):no('F06_4A_IDEMPOTENCY_CONFLICT');
  const prior=await row(c,'SELECT transaction_id FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1 FOR SHARE',[p.transactionId]);
  if(prior||t.status==='cancelled')return no('F06_4A_ALREADY_TERMINAL_NO_REVIVE');
  if(t.status!=='in_progress')return no('F06_4A_ONLY_SIGNED_IN_PROGRESS_CANCEL');
  const origin=await signedOrigin(c,t);if(!origin.allowed)return origin;
  if(p.testCheckpoint==='BEFORE_STATUS_THROW')throw Error('F06_4A_INJECTED_BEFORE_STATUS_ROLLBACK');
  const changed=await row(c,"UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1 AND status='in_progress' RETURNING transaction_id",[p.transactionId]);
  if(!changed)throw Error('F06_4A_ATOMIC_STATUS_LOST');
  if(p.testCheckpoint==='AFTER_STATUS_THROW')throw Error('F06_4A_INJECTED_STATUS_ROLLBACK');
  await c.query("INSERT INTO f06_4a_ci.cancel_origins(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,original_responsible_employee_id,actor_employee_id,previous_status,resulting_status,reason) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,'in_progress','cancelled',$8)",
   [t.transaction_id,origin.origin.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,t.responsible_employee_id,a.employee_id,p.reason.trim()]);
  await c.query("INSERT INTO f06_4a_ci.cancel_events(transaction_id,actor_employee_id,event_kind,previous_status,resulting_status,reason,event_key_sha256) "+
   "VALUES($1,$2,'transaction_cancelled_without_payment','in_progress','cancelled',$3,$4)",[t.transaction_id,a.employee_id,p.reason.trim(),h]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_4A_INJECTED_EVENT_ROLLBACK');
  await c.query("INSERT INTO f06_4a_ci.request_keys(event_key_sha256,actor_employee_id,action,transaction_id,payload_sha256) VALUES($1,$2,'cancel',$3,$4)",
   [h,a.employee_id,t.transaction_id,fingerprint]);
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) "+
   "VALUES('employee',$1,'Transaction',$2,'f06_4a_ci_normal_cancelled',$3::jsonb,$4::jsonb,clock_timestamp())",
   [String(a.employee_id),String(t.transaction_id),JSON.stringify({status:'in_progress'}),JSON.stringify({status:'cancelled',reason:p.reason.trim(),issuer:'CI_SYNTHETIC_NO_MONEY'})]);
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_4A_INJECTED_AUDIT_ROLLBACK');
  // Source carrier, lock and financial receipts remain frozen; only in-progress occupancy is released.
  const check=await row(c,'SELECT status,completed_at FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
  if(check.status!=='cancelled'||check.completed_at!==null)throw Error('F06_4A_TERMINAL_CHECK_FAILED');
  return yes('F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',{transactionId:p.transactionId,sourceLockId:Number(origin.origin.source_lock_id),backendPid:(await row(c,'SELECT pg_backend_pid() pid')).pid,pgTransactionId:(await row(c,'SELECT txid_current()::text txid')).txid});
 },{normalOnly:true});
 return result||no('F06_4A_INVALID_SIGNED_SESSION');
 }catch(e){if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_4A_PG_ATOMIC_CONTENTION_DENY',{sqlstate:e.code});throw e}
}
export async function syntheticOccupancyProjectionCI(c,vehicleId){
 gate();await verify(c);if(!id(vehicleId))return no('F06_4A_INVALID_VEHICLE');
 const rows=(await c.query("SELECT p.transaction_id,p.status,s.transaction_id AS origin_id,a.transaction_id AS cancelled_id "+
 "FROM public.transactions p LEFT JOIN f06_3b_ci.transaction_origins s USING(transaction_id) "+
 "LEFT JOIN f06_4a_ci.cancel_origins a USING(transaction_id) WHERE p.vehicle_id=$1",[vehicleId])).rows;
 if(rows.some(x=>(x.status==='in_progress'&&!x.origin_id)||(x.status==='cancelled'&&x.origin_id&&!x.cancelled_id)||
 (x.cancelled_id&&x.status!=='cancelled')))return no('F06_4A_UNTRUSTED_OCCUPANCY_SOURCE_GAP');
 if(rows.some(x=>x.status==='in_progress'))return no('F06_4A_SIGNED_TRANSACTION_OCCUPIES_VEHICLE');
 return yes('F06_4A_NO_SIGNED_IN_PROGRESS_OCCUPANCY_ONLY_CI',{hasCancelled:rows.some(x=>x.status==='cancelled'&&x.cancelled_id)});
}
export async function syntheticCustomerPublicPoolGuardCI(c,customerId){
 gate();await verify(c);if(!id(customerId))return no('F06_4A_INVALID_CUSTOMER');
 const x=await row(c,"SELECT "+
 "(SELECT count(*)::int FROM public.transactions WHERE customer_id=$1 AND status='in_progress') ongoing,"+
 "(SELECT count(*)::int FROM public.refund_cases WHERE customer_id=$1 AND status='pending') pending",[customerId]);
 return x.ongoing||x.pending?no('F06_4A_OTHER_OPEN_RESPONSIBILITY_PREVENTS_PUBLIC_POOL',{ongoing:x.ongoing,pending:x.pending}):
 yes('F06_4A_ONLY_TRANSACTION_CANCEL_GUARD_RELEASED_OTHER_RULES_APPLY');
}
