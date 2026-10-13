// F06-3C-1: signed nonproduction PG16 only. No payment or refunded issuer.
import {createHash} from 'node:crypto';
import {gate,verify} from './migration.mjs';
const yes=(code,data={})=>({allowed:true,code,...data});
const no=(code,data={})=>({allowed:false,code,...data});
const one=async(c,s,a=[])=> (await c.query(s,a)).rows[0];
const sha=x=>createHash('sha256').update(x).digest('hex');
const id=n=>Number.isSafeInteger(n)&&n>0;
const money=n=>id(n)&&n<=100000000000;
const key=s=>typeof s==='string'&&/^[a-zA-Z0-9:._-]{16,120}$/.test(s);
const reason=s=>typeof s==='string'&&s.trim().length>=6&&s.trim().length<=240;
export const PRODUCTION_REFUND_ISSUER='F06_3C1_PRODUCTION_REFUND_ISSUER_NOT_WIRED';
export function productionIssuerDeny(){return no(PRODUCTION_REFUND_ISSUER)}
export function refundedDeny(){return no('F06_3C1_ACTUAL_REFUND_PAYMENT_NOT_AUTHORIZED')}
async function permission(c,a,responsible,permissionCode){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||
 !['sales','manager','store_head'].includes(a.role_code)||
 a.force_password_change!==false||a.credential_state!=='enabled'||a.subject_status!=='active')return false;
 // Current legal responsible only. Managers/staff have no implicit bypass.
 if(Number(a.employee_id)!==Number(responsible))return false;
 const v=await one(c,"SELECT r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code=$2 "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id "+
 "JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships rm ON rm.employee_id=$3 AND rm.team_id=t.team_id "+
 "JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active' "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND t.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,rm",
 [a.employee_id,permissionCode,responsible]);
 return !!v&&v.role_code===a.role_code;
}
async function signedLock(c,l){
 const s=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[l.lock_id]);
 if(!s||Number(s.customer_id)!==Number(l.customer_id)||
  Number(s.responsible_employee_id)!==Number(l.responsible_employee_id))
  return no('F06_3C1_UNSIGNED_LOCK');
 const cust=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[l.customer_id]);
 const cycle=await one(c,'SELECT vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[l.listing_cycle_id,l.vehicle_id]);
 if(!cust||cust.account_status!=='active'||!cycle)return no('F06_3C1_CUSTOMER_OR_CYCLE_UNTRUSTED');
 return yes('F06_3C1_SIGNED_LOCK');
}
async function balance(c,l){
 // Explicitly exclude any unsigned public Deposit: missing provenance means money is unknown.
 const receipts=(await c.query('SELECT deposit_id,customer_id,amount_cents FROM public.deposit_receipts WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[l.lock_id])).rows;
 const sourced=(await c.query('SELECT deposit_id,customer_id,vehicle_id,listing_cycle_id,original_amount_cents FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[l.lock_id])).rows;
 if(receipts.length!==sourced.length||receipts.length===0)return no('F06_3C1_UNVERIFIED_OR_ABSENT_MONEY');
 let net=0;
 for(let i=0;i<receipts.length;i++){
  const r=receipts[i],s=sourced[i];
  if(Number(r.deposit_id)!==Number(s.deposit_id)||
   Number(r.customer_id)!==Number(l.customer_id)||Number(s.customer_id)!==Number(l.customer_id)||
   Number(r.amount_cents)!==Number(s.original_amount_cents)||
   Number(s.vehicle_id)!==Number(l.vehicle_id)||Number(s.listing_cycle_id)!==Number(l.listing_cycle_id))
   return no('F06_3C1_CROSS_SOURCE_OR_TAMPER_DENY');
  const v=await one(c,'SELECT COALESCE(sum(delta_cents),0)::bigint d FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[r.deposit_id]);
  const available=Number(r.amount_cents)+Number(v.d);
  if(!Number.isSafeInteger(available)||available<0||available>100000000000)
   return no('F06_3C1_UNVERIFIED_CORRECTION_BALANCE');
  net+=available;
 }
 if(!Number.isSafeInteger(net)||net>100000000000||net<=0)return no('F06_3C1_NO_REFUNDABLE_BALANCE');
 // F06-3C-2 is absent. Any existing payments/refunded fact means unsigned funds.
 const conflicts=await one(c,"SELECT "+
 "(SELECT count(*)::int FROM public.refund_cases rc LEFT JOIN public.locks lk ON lk.lock_id=rc.lock_id "+
 " LEFT JOIN public.transactions tr ON tr.transaction_id=rc.transaction_id "+
 " WHERE (lk.vehicle_id=$1 AND lk.listing_cycle_id=$2) OR (tr.vehicle_id=$1 AND tr.listing_cycle_id=$2)) n, "+
 "(SELECT count(*)::int FROM public.refund_cases rc "+
 " LEFT JOIN public.locks lk ON lk.lock_id=rc.lock_id LEFT JOIN public.transactions tr ON tr.transaction_id=rc.transaction_id "+
 " JOIN public.refund_payments pay ON pay.refund_id=rc.refund_id "+
 " WHERE (lk.vehicle_id=$1 AND lk.listing_cycle_id=$2) OR (tr.vehicle_id=$1 AND tr.listing_cycle_id=$2)) payments, "+
 "(SELECT count(*)::int FROM public.refund_cases rc "+
 " LEFT JOIN public.locks lk ON lk.lock_id=rc.lock_id LEFT JOIN public.transactions tr ON tr.transaction_id=rc.transaction_id "+
 " WHERE rc.status IN('pending','refunded') AND ((lk.vehicle_id=$1 AND lk.listing_cycle_id=$2) OR (tr.vehicle_id=$1 AND tr.listing_cycle_id=$2))) active",
 [l.vehicle_id,l.listing_cycle_id]);
 if(conflicts.payments>0)return no('F06_3C1_EXISTING_REFUND_PAYMENT_SOURCE_GAP');
 if(conflicts.active>0)return no('F06_3C1_EXISTING_PENDING_OR_REFUNDED_CONFLICT');
 // Other old closed refunds do not reduce money; they have no paid fact.
 return yes('F06_3C1_SIGNED_BALANCE',{netCents:net,existingCases:conflicts.n});
}
async function audit(c,actor,refundId,action,before,after){
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Refund',$2,$3,$4::jsonb,$5::jsonb,clock_timestamp())",
 [String(actor),String(refundId),'f06_3c1_ci_'+action,JSON.stringify(before),JSON.stringify(after)]);
}
const hashed=(a,k)=>sha('f06-3c1:'+a.employee_id+':'+k);
const payload=p=>sha(JSON.stringify(p));
export async function requestSyntheticRefundCI(auth,token,p={}){
 gate();
 if(!id(p.lockId)||!money(p.amountCents)||!reason(p.reason)||!key(p.eventKey)||
  p.subjectKind!=='lock')return no('F06_3C1_INVALID_REQUEST');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  const loc=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[p.lockId]);
  if(!loc)return no('F06_3C1_LOCK_MISSING');
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[loc.vehicle_id]);
  const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[p.lockId]);
  if(!await permission(c,a,l.responsible_employee_id,'refund.ci.request'))
   return no('F06_3C1_REQUEST_PERMISSION_SCOPE_DENIED');
  const h=hashed(a,p.eventKey),fingerprint=payload({action:'request',lockId:p.lockId,amount:p.amountCents,reason:p.reason.trim(),kind:p.subjectKind});
  const old=await one(c,'SELECT * FROM f06_3c1_ci.request_keys WHERE event_key_sha256=$1',[h]);
  if(old)return old.action==='request'&&old.payload_sha256===fingerprint?
   yes('F06_3C1_IDEMPOTENT_REQUEST',{refundId:Number(old.refund_id)}):no('F06_3C1_IDEMPOTENCY_CONFLICT');
  const signed=await signedLock(c,l);if(!signed.allowed)return signed;
  const tx=await one(c,'SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 FOR SHARE',[l.lock_id]);
  if(tx)return no('F06_3C1_OWNING_TRANSACTION_REQUIRES_SIGNED_TERMINAL');
  const b=await balance(c,l);if(!b.allowed)return b;
  if(p.amountCents>b.netCents)return no('F06_3C1_OVER_REFUNDABLE_BALANCE',{netCents:b.netCents});
  const item=await one(c,"INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,$2,NULL,'pending',$3) RETURNING refund_id",
   [l.customer_id,l.lock_id,p.amountCents]);
  if(p.testCheckpoint==='AFTER_PENDING_THROW')throw Error('F06_3C1_INJECTED_PENDING_ROLLBACK');
  await c.query("INSERT INTO f06_3c1_ci.refund_origins(refund_id,lock_id,customer_id,vehicle_id,listing_cycle_id,amount_cents,balance_at_request_cents,actor_employee_id,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
   [item.refund_id,l.lock_id,l.customer_id,l.vehicle_id,l.listing_cycle_id,p.amountCents,b.netCents,a.employee_id,p.reason.trim()]);
  await c.query("INSERT INTO f06_3c1_ci.status_events(refund_id,event_kind,previous_status,resulting_status,actor_employee_id,reason,event_key_sha256) VALUES($1,'pending_requested',NULL,'pending',$2,$3,$4)",
   [item.refund_id,a.employee_id,p.reason.trim(),h]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_3C1_INJECTED_EVENT_ROLLBACK');
  await c.query("INSERT INTO f06_3c1_ci.request_keys(event_key_sha256,actor_employee_id,action,refund_id,payload_sha256) VALUES($1,$2,'request',$3,$4)",
   [h,a.employee_id,item.refund_id,fingerprint]);
  await audit(c,a.employee_id,item.refund_id,'request',{}, {status:'pending',amountCents:p.amountCents,issuer:'CI_SYNTHETIC_NO_MONEY'});
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_3C1_INJECTED_AUDIT_ROLLBACK');
  return yes('F06_3C1_PENDING_NO_PAYMENT',{refundId:Number(item.refund_id),netCents:b.netCents,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||no('F06_3C1_SESSION_DENIED');
 }catch(e){if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_3C1_PG_ATOMIC_CONTENTION_DENY',{sqlstate:e.code});throw e}
}
export async function closeSyntheticRefundCI(auth,token,p={}){
 gate();
 if(!id(p.refundId)||!reason(p.closeReason)||!key(p.eventKey))
  return no('F06_3C1_INVALID_CLOSE');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  const loc=await one(c,'SELECT vehicle_id,lock_id FROM f06_3c1_ci.refund_origins WHERE refund_id=$1',[p.refundId]);
  if(!loc)return no('F06_3C1_UNSIGNED_REFUND');
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[loc.vehicle_id]);
  const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[loc.lock_id]);
  if(!l)return no('F06_3C1_SOURCE_LOCK_LOST');
  if(!await permission(c,a,l.responsible_employee_id,'refund.ci.request'))
   return no('F06_3C1_CLOSE_CURRENT_PERMISSION_SCOPE_DENIED');
  const h=hashed(a,p.eventKey),fingerprint=payload({action:'close',refundId:p.refundId,closeReason:p.closeReason.trim()});
  const old=await one(c,'SELECT * FROM f06_3c1_ci.request_keys WHERE event_key_sha256=$1',[h]);
  if(old)return old.action==='close'&&old.payload_sha256===fingerprint&&Number(old.refund_id)===p.refundId?
   yes('F06_3C1_IDEMPOTENT_CLOSE',{refundId:p.refundId}):no('F06_3C1_IDEMPOTENCY_CONFLICT');
  const r=await one(c,'SELECT * FROM public.refund_cases WHERE refund_id=$1 FOR UPDATE',[p.refundId]);
  const o=await one(c,'SELECT * FROM f06_3c1_ci.refund_origins WHERE refund_id=$1 FOR SHARE',[p.refundId]);
  if(!r||!o||Number(o.lock_id)!==Number(l.lock_id)||Number(r.lock_id)!==Number(l.lock_id)||
   Number(r.customer_id)!==Number(l.customer_id)||Number(o.customer_id)!==Number(l.customer_id)||
   Number(o.vehicle_id)!==Number(l.vehicle_id)||Number(o.listing_cycle_id)!==Number(l.listing_cycle_id)||
   r.transaction_id!==null||Number(r.expected_amount_cents)!==Number(o.amount_cents))
   return no('F06_3C1_ORIGIN_DRIFT');
  if(r.status!=='pending')return no('F06_3C1_NOT_PENDING');
  const signed=await signedLock(c,l);if(!signed.allowed)return signed;
  const paid=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[p.refundId]);
  if(paid.n!==0)return no('F06_3C1_ALREADY_PAID_NEVER_CLOSE');
  // Confirm no owning Transaction appeared during the pending interval.
  const tx=await one(c,'SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 FOR SHARE',[l.lock_id]);
  if(tx)return no('F06_3C1_TRANSACTION_SOURCE_CONFLICT');
  const changed=await one(c,"UPDATE public.refund_cases SET status='closed',close_reason=$2,closed_at=clock_timestamp() WHERE refund_id=$1 AND status='pending' RETURNING refund_id",
   [p.refundId,p.closeReason.trim()]);
  if(!changed)throw Error('F06_3C1_PENDING_ROW_LOST');
  if(p.testCheckpoint==='AFTER_CLOSE_THROW')throw Error('F06_3C1_INJECTED_CLOSE_ROLLBACK');
  await c.query("INSERT INTO f06_3c1_ci.status_events(refund_id,event_kind,previous_status,resulting_status,actor_employee_id,reason,event_key_sha256) VALUES($1,'closed_without_payment','pending','closed',$2,$3,$4)",
   [p.refundId,a.employee_id,p.closeReason.trim(),h]);
  await c.query("INSERT INTO f06_3c1_ci.request_keys(event_key_sha256,actor_employee_id,action,refund_id,payload_sha256) VALUES($1,$2,'close',$3,$4)",
   [h,a.employee_id,p.refundId,fingerprint]);
  await audit(c,a.employee_id,p.refundId,'close',{status:'pending'},{status:'closed',closeReason:p.closeReason.trim(),realPayment:false});
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_3C1_INJECTED_CLOSE_EVENT_ROLLBACK');
  return yes('F06_3C1_CLOSED_WITHOUT_PAYMENT',{refundId:p.refundId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||no('F06_3C1_SESSION_DENIED');
 }catch(e){if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_3C1_PG_ATOMIC_CONTENTION_DENY',{sqlstate:e.code});throw e}
}
export async function pendingCustomerPublicPoolGuardCI(c,customerId){
 gate();await verify(c);
 if(!id(customerId))return no('F06_3C1_INVALID_CUSTOMER');
 const x=await one(c,"SELECT count(*)::int n FROM public.refund_cases r JOIN f06_3c1_ci.refund_origins o USING(refund_id) WHERE r.customer_id=$1 AND r.status='pending'",[customerId]);
 return x.n>0?no('F06_3C1_PENDING_REFUND_PREVENTS_PUBLIC_POOL',{pendingCount:x.n}):yes('F06_3C1_NO_PENDING_REFUND_ONLY_OTHER_GUARDS_STILL_APPLY');
}
export async function pendingVehicleOccupancyGuardCI(c,vehicleId){
 gate();await verify(c);
 if(!id(vehicleId))return no('F06_3C1_INVALID_VEHICLE');
 const x=await one(c,"SELECT count(*)::int n FROM public.refund_cases r JOIN f06_3c1_ci.refund_origins o USING(refund_id) WHERE o.vehicle_id=$1 AND r.status='pending'",[vehicleId]);
 return yes('F06_3C1_REFUND_DOES_NOT_OCCUPY_VEHICLE',{pendingCount:x.n});
}
export async function syntheticTerminalTransactionRefundDenyCI(c,transactionId){
 gate();await verify(c);
 if(!id(transactionId))return no('F06_3C1_INVALID_TRANSACTION');
 const t=await one(c,'SELECT status FROM public.transactions WHERE transaction_id=$1',[transactionId]);
 return no(!t?'F06_3C1_UNKNOWN_TRANSACTION':t.status==='in_progress'?'F06_3C1_IN_PROGRESS_NOT_REFUNDABLE':'CI_SYNTHETIC_TERMINAL_SOURCE_GAP');
}
