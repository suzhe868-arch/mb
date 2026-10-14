// F06-5A: signed cancelled Transaction-side synthetic refund; no production/payment issuer.
import {createHash} from 'node:crypto';
import {gate,verify} from './migration.mjs';
const yes=(code,extra={})=>({allowed:true,code,...extra}),no=(code,extra={})=>({allowed:false,code,...extra});
const row=async(c,sql,params=[])=> (await c.query(sql,params)).rows[0];
const hash=x=>createHash('sha256').update(x).digest('hex');
const id=x=>Number.isSafeInteger(x)&&x>0;
const money=x=>id(x)&&x<=100000000000;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
export const productionRefundIssuerDeny=()=>no('F06_5A_PRODUCTION_TRANSACTION_REFUND_ISSUER_SOURCE_GAP');
export const actualRefundPaymentDeny=()=>no('F06_5A_REFUNDED_AND_PAYMENT_FORBIDDEN');
export const completedTransactionIssuerDeny=()=>no('F06_5A_COMPLETED_TRANSACTION_NOT_AUTHORIZED');
const keyed=(a,k)=>hash('f06-5a:'+a.employee_id+':'+k);
const fp=p=>hash(JSON.stringify(p));
async function authorized(c,a,t){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||a.force_password_change!==false||
 a.credential_state!=='enabled'||a.subject_status!=='active'||!['sales','manager','store_head'].includes(a.role_code)||
 Number(a.employee_id)!==Number(t.responsible_employee_id))return no('F06_5A_NOT_CURRENT_BUSINESS_RESPONSIBLE');
 const x=await row(c,"SELECT e.employee_id FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='refund.ci.request' "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams tm ON tm.team_id=m.team_id JOIN public.stores st ON st.store_id=tm.store_id "+
 "JOIN public.employee_team_memberships rm ON rm.employee_id=$2 AND rm.team_id=tm.team_id "+
 "JOIN public.customers cust ON cust.customer_id=$3 "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code=$4 "+
 "AND cust.account_status='active' AND tm.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=tm.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=tm.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,tm,st,rm,cust",
 [a.employee_id,t.responsible_employee_id,t.customer_id,a.role_code]);
 return x?yes('F06_5A_EXPLICIT_REFUND_PERMISSION_SCOPE'):no('F06_5A_REFUND_PERMISSION_SCOPE_DENIED');
}
async function cancelledSource(c,t,l){
 const o=await row(c,"SELECT * FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 const snap=await row(c,"SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE",[t.source_lock_id]);
 if(!o||o.status!=='in_progress'||o.public_carrier_status!=='in_progress'||!snap||
 l.lock_status!=='released'||l.end_reason!=='converted_to_transaction'||t.status!=='cancelled'||t.completed_at!==null||
 Number(snap.responsible_employee_id)!==Number(o.original_responsible_employee_id)||
 Number(l.responsible_employee_id)!==Number(o.original_responsible_employee_id)||
 ['source_lock_id','customer_id','vehicle_id','listing_cycle_id'].some(k=>Number(t[k])!==Number(o[k]))||
 ['customer_id','vehicle_id','listing_cycle_id'].some(k=>Number(t[k])!==Number(l[k])))
 return no('F06_5A_UNSIGNED_TRANSACTION_OR_LOCK');
 const a=await row(c,"SELECT * FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 const x=await row(c,"SELECT * FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 if(Number(!!a)+Number(!!x)!==1)return no('F06_5A_TERMINAL_CANCEL_SIGNATURE_GAP');
 if(a){
  if(Number(t.responsible_employee_id)!==Number(o.original_responsible_employee_id)||
  Number(a.original_responsible_employee_id)!==Number(t.responsible_employee_id)||
  a.resulting_status!=='cancelled')return no('F06_5A_4A_CANCEL_ORIGIN_DRIFT');
  const h=await row(c,'SELECT count(*)::int n FROM f06_4b_ci.responsible_projection WHERE transaction_id=$1',[t.transaction_id]);
  if(h.n)return no('F06_5A_UNEXPECTED_HANDOFF');
 }else{
  const p=await row(c,'SELECT * FROM f06_4b_ci.responsible_projection WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
  const ev=p&&await row(c,'SELECT * FROM f06_4b_ci.handoff_events WHERE event_id=$1 AND transaction_id=$2 FOR SHARE',[p.last_event_id,t.transaction_id]);
  if(!p||!ev||p.event_count<1||Number(p.current_responsible_employee_id)!==Number(t.responsible_employee_id)||
  Number(ev.new_responsible_employee_id)!==Number(t.responsible_employee_id)||
  Number(x.transferred_responsible_employee_id)!==Number(t.responsible_employee_id)||
  Number(x.parent_last_handoff_event_id)!==Number(p.last_event_id)||
  Number(p.original_responsible_employee_id)!==Number(o.original_responsible_employee_id))
  return no('F06_5A_4C_SIGNED_HANDOFF_CANCEL_DRIFT');
 }
 const cyc=await row(c,"SELECT vehicle_id,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE",[t.listing_cycle_id,t.vehicle_id]);
 const v=await row(c,'SELECT archived_at,source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[t.vehicle_id]);
 if(!cyc||cyc.ended_at||!v||v.archived_at||!['available','active'].includes(v.source_sale_status))return no('F06_5A_LISTING_CYCLE_SOURCE_GAP');
 return yes('F06_5A_SIGNED_TERMINAL_SOURCE',{sourceKind:a?'F06_4A_CANCEL_SIGNED':'F06_4C_CANCEL_SIGNED'});
}
async function signedBalance(c,t,ignoreRefundId=null){
 // Balance is strictly signed deposits plus immutable 3A adjustment events, with zero unknown paid facts.
 const all=await row(c,"SELECT (SELECT count(*)::int FROM public.deposit_receipts WHERE lock_id=$1) raw,"+
 "(SELECT count(*)::int FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1) signed,"+
 "(SELECT count(*)::int FROM public.refund_payments pm JOIN public.refund_cases r USING(refund_id) "+
 " LEFT JOIN public.transactions tr ON tr.transaction_id=r.transaction_id "+
 " LEFT JOIN public.locks l ON l.lock_id=r.lock_id "+
 " WHERE (tr.vehicle_id=$2 AND tr.listing_cycle_id=$3) OR (l.vehicle_id=$2 AND l.listing_cycle_id=$3)) paid,"+
 "(SELECT count(*)::int FROM public.refund_cases r "+
 " LEFT JOIN public.transactions tr ON tr.transaction_id=r.transaction_id "+
 " LEFT JOIN public.locks l ON l.lock_id=r.lock_id "+
 " WHERE ((tr.vehicle_id=$2 AND tr.listing_cycle_id=$3) OR (l.vehicle_id=$2 AND l.listing_cycle_id=$3)) "+
 " AND r.status IN('pending','refunded') AND ($4::bigint IS NULL OR r.refund_id<>$4)) conflicts",
 [t.source_lock_id,t.vehicle_id,t.listing_cycle_id,ignoreRefundId]);
 if(all.raw===0||all.raw!==all.signed||all.paid)return no('F06_5A_DEPOSIT_OR_PAYMENT_SOURCE_GAP');
 if(all.conflicts)return no('F06_5A_ACTIVE_REFUND_CONFLICT');
 const d=(await c.query("SELECT d.deposit_id,d.customer_id,d.lock_id,d.amount_cents,p.original_amount_cents,p.customer_id signed_customer,p.vehicle_id,p.listing_cycle_id "+
 "FROM public.deposit_receipts d JOIN f06_3a_ci.receipt_provenance p USING(deposit_id) WHERE d.lock_id=$1 FOR SHARE OF d,p",[t.source_lock_id])).rows;
 if(d.length!==all.raw)return no('F06_5A_DEPOSIT_UNMATCHED');
 let net=0;
 for(const r of d){
  if(Number(r.customer_id)!==Number(t.customer_id)||Number(r.signed_customer)!==Number(t.customer_id)||
   Number(r.lock_id)!==Number(t.source_lock_id)||Number(r.amount_cents)!==Number(r.original_amount_cents)||
   Number(r.vehicle_id)!==Number(t.vehicle_id)||Number(r.listing_cycle_id)!==Number(t.listing_cycle_id))
   return no('F06_5A_DEPOSIT_PROVENANCE_DRIFT');
  const adjustments=(await c.query("SELECT a.delta_cents,a.lock_id,a.currency,k.resulting_adjustment_id FROM f06_3a_ci.adjustments a "+
   "LEFT JOIN f06_3a_ci.request_keys k ON k.resulting_adjustment_id=a.adjustment_id "+
   "WHERE a.deposit_id=$1 FOR SHARE OF a",[r.deposit_id])).rows;
  if(adjustments.some(x=>Number(x.lock_id)!==Number(t.source_lock_id)||x.currency!=='CNY'||x.resulting_adjustment_id===null))
   return no('F06_5A_UNVERIFIED_FINANCIAL_CORRECTION');
  const amt=Number(r.amount_cents)+adjustments.reduce((s,x)=>s+Number(x.delta_cents),0);
  if(!Number.isSafeInteger(amt)||amt<0||amt>100000000000)return no('F06_5A_BAD_NET_BALANCE');
  net+=amt;
 }
 if(!Number.isSafeInteger(net)||net<=0||net>100000000000)return no('F06_5A_NO_REFUNDABLE_BALANCE');
 return yes('F06_5A_SIGNED_NET_BALANCE',{netCents:net});
}
const audit=(c,actor,refundId,kind,before,after)=>c.query(
 "INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Refund',$2,$3,$4::jsonb,$5::jsonb,clock_timestamp())",
 [String(actor),String(refundId),'f06_5a_ci_'+kind,JSON.stringify(before),JSON.stringify(after)]);
async function prepare(c,transactionId){
 const found=await row(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[transactionId]);
 if(!found)return no('F06_5A_TRANSACTION_NOT_FOUND');
 await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[found.vehicle_id]);
 const t=await row(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[transactionId]);
 if(!t)return no('F06_5A_TRANSACTION_NOT_FOUND');
 const l=await row(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[t.source_lock_id]);
 if(!l)return no('F06_5A_LOCK_SOURCE_MISSING');
 const source=await cancelledSource(c,t,l);return source.allowed?yes('F06_5A_PREPARED',{t,l,source}):source;
}
export async function requestSyntheticTransactionRefundCI(auth,token,p={}){
 gate();if(!id(p.transactionId)||!money(p.amountCents)||!reason(p.reason)||!key(p.eventKey)||p.subjectKind!=='transaction')
 return no('F06_5A_INVALID_TRANSACTION_REFUND_REQUEST');
 try{return await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  const prepared=await prepare(c,p.transactionId);if(!prepared.allowed)return prepared;
  const {t,source}=prepared;
  const perm=await authorized(c,a,t);if(!perm.allowed)return perm;
  const h=keyed(a,p.eventKey),fingerprint=fp({action:'request',transactionId:p.transactionId,amount:p.amountCents,reason:p.reason.trim(),subject:'transaction'});
  const existing=await row(c,'SELECT * FROM f06_5a_ci.request_keys WHERE event_key_sha256=$1',[h]);
  if(existing)return existing.action==='request'&&existing.payload_sha256===fingerprint?
    yes('F06_5A_IDEMPOTENT_PENDING',{refundId:Number(existing.refund_id)}):no('F06_5A_IDEMPOTENCY_CONFLICT');
  const b=await signedBalance(c,t);if(!b.allowed)return b;
  if(p.amountCents>b.netCents)return no('F06_5A_AMOUNT_EXCEEDS_BALANCE',{netCents:b.netCents});
  if(p.testCheckpoint==='BEFORE_PENDING_THROW')throw Error('F06_5A_INJECTED_BEFORE_PENDING');
  const r=await row(c,"INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,NULL,$2,'pending',$3) RETURNING refund_id",[t.customer_id,t.transaction_id,p.amountCents]);
  if(p.testCheckpoint==='AFTER_PENDING_THROW')throw Error('F06_5A_INJECTED_AFTER_PENDING');
  await c.query("INSERT INTO f06_5a_ci.refund_origins(refund_id,transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,responsible_employee_id,request_actor_id,amount_cents,balance_at_request_cents,source_kind,request_reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
  [r.refund_id,t.transaction_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,t.responsible_employee_id,a.employee_id,p.amountCents,b.netCents,source.sourceKind,p.reason.trim()]);
  const e=await row(c,"INSERT INTO f06_5a_ci.status_events(refund_id,actor_employee_id,event_kind,previous_status,resulting_status,reason,event_key_sha256) VALUES($1,$2,'pending_requested',NULL,'pending',$3,$4) RETURNING event_id",[r.refund_id,a.employee_id,p.reason.trim(),h]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_5A_INJECTED_AFTER_EVENT');
  await c.query("INSERT INTO f06_5a_ci.request_keys(event_key_sha256,actor_employee_id,action,refund_id,payload_sha256,event_id) VALUES($1,$2,'request',$3,$4,$5)",[h,a.employee_id,r.refund_id,fingerprint,e.event_id]);
  await audit(c,a.employee_id,r.refund_id,'pending',{}, {status:'pending',subject:'Transaction',issuer:'CI_SYNTHETIC_NO_PAYMENT'});
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_5A_INJECTED_AFTER_AUDIT');
  const financialAtCommit=await signedBalance(c,t,Number(r.refund_id));
  if(!financialAtCommit.allowed||financialAtCommit.netCents<p.amountCents)throw Error('F06_5A_PRECOMMIT_FINANCIAL_SOURCE_CHANGED');
  if(!(await authorized(c,a,t)).allowed)throw Error('F06_5A_PRECOMMIT_PERMISSION_REVOKED');
  if(p.testCheckpoint==='BEFORE_COMMIT_THROW')throw Error('F06_5A_INJECTED_BEFORE_COMMIT');
  return yes('F06_5A_PENDING_WITHOUT_PAYMENT',{refundId:Number(r.refund_id),netCents:b.netCents,backendPid:(await row(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true})||no('F06_5A_SESSION_DENIED')}
 catch(e){if(['55P03','40P01','40001','23505','23514'].includes(e.code))return no('F06_5A_PG_ATOMIC_CONFLICT',{sqlstate:e.code});throw e}
}
export async function closeSyntheticTransactionRefundCI(auth,token,p={}){
 gate();if(!id(p.refundId)||!reason(p.closeReason)||!key(p.eventKey))return no('F06_5A_INVALID_CLOSE_REQUEST');
 try{return await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  const loc=await row(c,'SELECT * FROM f06_5a_ci.refund_origins WHERE refund_id=$1',[p.refundId]);
  if(!loc)return no('F06_5A_UNSIGNED_REFUND_CASE');
  const prepared=await prepare(c,Number(loc.transaction_id));if(!prepared.allowed)return prepared;
  const {t}=prepared,perm=await authorized(c,a,t);if(!perm.allowed)return perm;
  const h=keyed(a,p.eventKey),fingerprint=fp({action:'close',refundId:p.refundId,reason:p.closeReason.trim()});
  const existing=await row(c,'SELECT * FROM f06_5a_ci.request_keys WHERE event_key_sha256=$1',[h]);
  if(existing)return existing.action==='close'&&existing.payload_sha256===fingerprint&&Number(existing.refund_id)===p.refundId?
   yes('F06_5A_IDEMPOTENT_CLOSE',{refundId:p.refundId}):no('F06_5A_IDEMPOTENCY_CONFLICT');
  const r=await row(c,'SELECT * FROM public.refund_cases WHERE refund_id=$1 FOR UPDATE',[p.refundId]);
  const o=await row(c,'SELECT * FROM f06_5a_ci.refund_origins WHERE refund_id=$1 FOR SHARE',[p.refundId]);
  if(!r||!o||Number(r.transaction_id)!==Number(t.transaction_id)||r.lock_id!==null||
    Number(r.customer_id)!==Number(t.customer_id)||Number(r.expected_amount_cents)!==Number(o.amount_cents)||
    ['transaction_id','source_lock_id','customer_id','vehicle_id','listing_cycle_id','responsible_employee_id'].some(k=>Number(t[k])!==Number(o[k])))
    return no('F06_5A_REFUND_ORIGIN_DRIFT');
  if(r.status!=='pending')return no('F06_5A_ONLY_PENDING_CAN_CLOSE');
  const b=await signedBalance(c,t,p.refundId);if(!b.allowed)return b;
  if(Number(o.amount_cents)>b.netCents)return no('F06_5A_BALANCE_DRIFT');
  const paid=await row(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[p.refundId]);if(paid.n)return no('F06_5A_PAID_FACT_FORBIDS_CLOSE');
  if(p.testCheckpoint==='BEFORE_CLOSE_THROW')throw Error('F06_5A_INJECTED_BEFORE_CLOSE');
  const updated=await row(c,"UPDATE public.refund_cases SET status='closed',close_reason=$2,closed_at=clock_timestamp() WHERE refund_id=$1 AND status='pending' RETURNING refund_id",[p.refundId,p.closeReason.trim()]);
  if(!updated)throw Error('F06_5A_LOST_PENDING_ROW');
  if(p.testCheckpoint==='AFTER_CLOSE_THROW')throw Error('F06_5A_INJECTED_AFTER_CLOSE');
  const e=await row(c,"INSERT INTO f06_5a_ci.status_events(refund_id,actor_employee_id,event_kind,previous_status,resulting_status,reason,event_key_sha256) VALUES($1,$2,'closed_without_payment','pending','closed',$3,$4) RETURNING event_id",[p.refundId,a.employee_id,p.closeReason.trim(),h]);
  await c.query("INSERT INTO f06_5a_ci.request_keys(event_key_sha256,actor_employee_id,action,refund_id,payload_sha256,event_id) VALUES($1,$2,'close',$3,$4,$5)",[h,a.employee_id,p.refundId,fingerprint,e.event_id]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_5A_INJECTED_AFTER_CLOSE_EVENT');
  await audit(c,a.employee_id,p.refundId,'close',{status:'pending'},{status:'closed',closeReason:p.closeReason.trim(),paid:false});
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_5A_INJECTED_AFTER_CLOSE_AUDIT');
  const financialAtCommit=await signedBalance(c,t,p.refundId);
  if(!financialAtCommit.allowed||financialAtCommit.netCents<Number(o.amount_cents))throw Error('F06_5A_PRECOMMIT_FINANCIAL_SOURCE_CHANGED');
  if(!(await authorized(c,a,t)).allowed)throw Error('F06_5A_PRECOMMIT_PERMISSION_REVOKED');
  if(p.testCheckpoint==='BEFORE_COMMIT_THROW')throw Error('F06_5A_INJECTED_BEFORE_COMMIT');
  return yes('F06_5A_CLOSED_WITHOUT_PAYMENT',{refundId:p.refundId,backendPid:(await row(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true})||no('F06_5A_SESSION_DENIED')}
 catch(e){if(['55P03','40P01','40001','23505','23514'].includes(e.code))return no('F06_5A_PG_ATOMIC_CONFLICT',{sqlstate:e.code});throw e}
}
export async function pendingPublicPoolGuardCI(c,customerId){
 gate();await verify(c);if(!id(customerId))return no('F06_5A_INVALID_CUSTOMER');
 const v=await row(c,"SELECT (SELECT count(*)::int FROM public.refund_cases r JOIN f06_5a_ci.refund_origins o USING(refund_id) WHERE r.customer_id=$1 AND r.status='pending') pending,"+
 "(SELECT count(*)::int FROM public.transactions WHERE customer_id=$1 AND status='in_progress') ongoing,"+
 "(SELECT count(*)::int FROM public.refund_cases WHERE customer_id=$1 AND status='pending') all_pending",[customerId]);
 return v.pending||v.ongoing||v.all_pending?no('F06_5A_ACTIVE_RESPONSIBILITY_PREVENTS_PUBLIC_POOL',v):yes('F06_5A_REFUND_ONLY_GUARD_CLEARED_OTHER_BUSINESS_GUARDS_APPLY');
}
export async function pendingVehicleGuardCI(c,vehicleId){
 gate();await verify(c);if(!id(vehicleId))return no('F06_5A_INVALID_VEHICLE');
 const x=await row(c,"SELECT count(*)::int n FROM public.refund_cases r JOIN f06_5a_ci.refund_origins o USING(refund_id) WHERE o.vehicle_id=$1 AND r.status='pending'",[vehicleId]);
 return yes('F06_5A_REFUND_NEVER_OCCUPIES_VEHICLE',{pendingCount:x.n});
}
