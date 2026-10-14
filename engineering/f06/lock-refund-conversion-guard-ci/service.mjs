// Nonproduction F06-3B signed PG16 conversion. No HTTP production issuer or real transaction.
import {createHash} from 'node:crypto';
import {gate,verify} from './migration.mjs';
import {signedBalance} from '../transaction-refund-ci/service.mjs';
const yes=(code,more={})=>({allowed:true,code,...more});
const no=(code,more={})=>({allowed:false,code,...more});
const one=async(c,sql,args=[])=> (await c.query(sql,args)).rows[0];
const sha=s=>createHash('sha256').update(s).digest('hex');
const id=x=>Number.isSafeInteger(x)&&x>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const sale=v=>!!v&&!v.archived_at&&
 ((v.source_type==='wholesale'&&v.source_sale_status==='active')||
 (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
export const PRODUCTION_TRANSACTION_ISSUER='F06_5B_PRODUCTION_TRANSACTION_ISSUER_NOT_WIRED';
export const PUBLIC_TRANSACTION_CARRIER='SIGNED_PUBLIC_IN_PROGRESS_CI_ONLY';
export function productionIssuerDeny(){return no(PRODUCTION_TRANSACTION_ISSUER)}
async function employeePermission(c,a,l,permission){
 if(a?.principal_kind!=='employee'||a.system_admin_id!==null||
 !['sales','manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||
 a.subject_status!=='active'||a.force_password_change!==false)return false;
 const v=await one(c,"SELECT e.employee_id,r.role_code FROM public.employees e "+
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
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN ('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,rm",
 [a.employee_id,permission,l.responsible_employee_id]);
 return !!v&&v.role_code===a.role_code;
}
async function actorAllowed(c,a,l){
 if(await employeePermission(c,a,l,'transaction.ci.open')&&Number(a.employee_id)===Number(l.responsible_employee_id))return true;
 return ['manager','store_head'].includes(a.role_code)&&
 await employeePermission(c,a,l,'transaction.ci.open')&&
 await employeePermission(c,a,l,'transaction.ci.manage');
}
export async function currentSyntheticTransactionCI(c,vehicleId){
 gate();await verify(c);
 const rows=(await c.query("SELECT t.transaction_id,t.source_lock_id,t.original_responsible_employee_id,t.customer_id,t.listing_cycle_id,t.priority_origin_id,t.status FROM f06_3b_ci.transaction_origins t JOIN public.transactions p ON p.transaction_id=t.transaction_id AND p.source_lock_id=t.source_lock_id AND p.vehicle_id=t.vehicle_id AND p.customer_id=t.customer_id AND p.listing_cycle_id=t.listing_cycle_id AND p.status='in_progress' WHERE t.vehicle_id=$1 AND t.status='in_progress'",[vehicleId])).rows;
 if(rows.length>1)throw Error('F06_5B_DUPLICATE_OCCUPANCY');
 return rows[0]?yes('F06_5B_SIGNED_IN_PROGRESS_CI',{transactionId:Number(rows[0].transaction_id),sourceLockId:Number(rows[0].source_lock_id),responsibleId:Number(rows[0].original_responsible_employee_id),customerId:Number(rows[0].customer_id),priorityOriginId:rows[0].priority_origin_id}):no('F06_5B_NO_ACTIVE_TRANSACTION');
}

// Only called inside the SAME actual PG16 transaction after locking Vehicle and Lock.
// Frozen F06-3B stays unchanged as evidence of the original conversion vulnerability.
async function signedLockRefundExclusionCI(c,l){
 const cases=(await c.query(
  "SELECT r.*,o.lock_id signed_lock,o.customer_id signed_customer,o.vehicle_id signed_vehicle,"+
  "o.listing_cycle_id signed_cycle,f.refund_id signed_tx_refund "+
  "FROM public.refund_cases r "+
  "LEFT JOIN public.locks lk ON lk.lock_id=r.lock_id "+
  "LEFT JOIN public.transactions tx ON tx.transaction_id=r.transaction_id "+
  "LEFT JOIN f06_3c1_ci.refund_origins o ON o.refund_id=r.refund_id "+
  "LEFT JOIN f06_5a_ci.refund_origins f ON f.refund_id=r.refund_id "+
  "WHERE (lk.vehicle_id=$1 AND lk.listing_cycle_id=$2) "+
  "OR (tx.vehicle_id=$1 AND tx.listing_cycle_id=$2) "+
  "ORDER BY r.refund_id FOR UPDATE OF r",[l.vehicle_id,l.listing_cycle_id])).rows;
 const facts=[];
 for(const r of cases){
  const paid=await one(c,"SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1",[r.refund_id]);
  if(paid.n>0)return no('F06_5B_REAL_REFUND_PAYMENT_SOURCE_GAP');
  if(r.status==='pending')return no('F06_5B_LOCK_PENDING_REFUND_CONVERSION_DENY',{refundId:Number(r.refund_id)});
  if(r.status==='refunded')return no('F06_5B_REFUNDED_OR_UNKNOWN_MONEY_DENY');
  if(r.status!=='closed'||!r.close_reason||!r.closed_at)return no('F06_5B_REFUND_STATUS_SOURCE_GAP');
  if(r.lock_id!==null){
   if(r.transaction_id!==null||Number(r.signed_lock)!==Number(r.lock_id)||
      Number(r.signed_vehicle)!==Number(l.vehicle_id)||
      Number(r.signed_cycle)!==Number(l.listing_cycle_id)||
      Number(r.signed_customer)!==Number(r.customer_id))
     return no('F06_5B_LEGACY_REFUND_ORIGIN_DRIFT');
   const ev=(await c.query(
    "SELECT event_kind,resulting_status FROM f06_3c1_ci.status_events WHERE refund_id=$1 ORDER BY event_id FOR SHARE",
    [r.refund_id])).rows;
   if(!ev.some(e=>e.event_kind==='pending_requested'&&e.resulting_status==='pending')||
      !ev.some(e=>e.event_kind==='closed_without_payment'&&e.resulting_status==='closed'))
     return no('F06_5B_LEGACY_REFUND_CLOSE_UNSIGNED');
  }else if(r.transaction_id!==null){
   if(r.signed_tx_refund===null)return no('F06_5B_TRANSACTION_REFUND_UNSIGNED');
  }else return no('F06_5B_REFUND_SUBJECT_XOR_BROKEN');
  facts.push([r.refund_id,r.status,r.close_reason]);
 }
 // Public receipt count alone is never trusted: enforce the 5A signed immutable 3A ledger.
 const receipt=await one(c,"SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1",[l.lock_id]);
 if(receipt.n>0){
  const b=await signedBalance(c,{source_lock_id:l.lock_id,customer_id:l.customer_id,
   vehicle_id:l.vehicle_id,listing_cycle_id:l.listing_cycle_id});
  if(!b.allowed)return no('F06_5B_FINANCE_'+b.code);
 }
 return yes('F06_5B_SIGNED_REFUND_EXCLUSION',{checkedRefundCount:facts.length,refundDigest:sha(JSON.stringify(facts))});
}

export async function openGuardedSyntheticTransactionCI(auth,token,p={}){
 gate();
 if(!id(p.lockId)||!key(p.eventKey))return no('F06_5B_INVALID_ARGUMENTS');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);
  await c.query("SET LOCAL lock_timeout='1500ms'");
  const known=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[p.lockId]);
  if(!known)return no('F06_5B_SOURCE_LOCK_NOT_FOUND');
  // Global vehicle mutex precedes lock row, permission rows, and transaction occupancy.
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[known.vehicle_id]);
  const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[p.lockId]);
  if(!l)return no('F06_5B_SOURCE_LOCK_NOT_FOUND');
  if(!await actorAllowed(c,a,l))return no('F06_5B_OPEN_PERMISSION_SCOPE_DENIED');
  const guarded=await signedLockRefundExclusionCI(c,l);
  if(!guarded.allowed)return guarded;
  const keyHash=sha('f06-3b:'+a.employee_id+':'+p.eventKey);
  const old=await one(c,'SELECT * FROM f06_3b_ci.request_keys WHERE event_key_sha256=$1',[keyHash]);
  if(old)return Number(old.source_lock_id)===p.lockId&&old.action==='open'?
   yes('F06_5B_IDEMPOTENT_CONVERSION',{transactionId:Number(old.resulting_transaction_id)}):
   no('F06_5B_IDEMPOTENCY_KEY_CONFLICT');
  const expired=await one(c,'SELECT $1::timestamptz<=clock_timestamp() AS ended',[l.expires_at]);
  if(l.lock_status!=='active'||expired.ended)return no('F06_5B_NOT_ACTIVE_CURRENT_LOCK');
  const signed=await one(c,"SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE",[l.lock_id]);
  if(!signed||Number(signed.customer_id)!==Number(l.customer_id)||
    Number(signed.responsible_employee_id)!==Number(l.responsible_employee_id)||
    !Number.isSafeInteger(Number(signed.initial_hours))||Number(signed.initial_hours)<=0)return no('F06_5B_UNSIGNED_LOCK_ORIGIN');
  const cust=await one(c,"SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE",[l.customer_id]);
  if(!cust||cust.account_status!=='active')return no('F06_5B_CUSTOMER_DISABLED');
  const cyc=await one(c,"SELECT ended_at,vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE",[l.listing_cycle_id,l.vehicle_id]);
  const v=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1',[l.vehicle_id]);
  if(!cyc||cyc.ended_at||!sale(v))return no('F06_5B_SOURCE_OR_CYCLE_UNAVAILABLE');
  const occupied=await one(c,"SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 AND status IN ('pending','in_progress','trading','active') LIMIT 1 FOR SHARE",[l.vehicle_id]);
  const oldTx=await one(c,"SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 LIMIT 1 FOR SHARE",[l.lock_id]);
  if(occupied||oldTx)return no('F06_5B_EXISTING_TRANSACTION_DENY');
  const extra=await one(c,"SELECT transaction_id FROM f06_3b_ci.transaction_origins WHERE vehicle_id=$1 LIMIT 1 FOR SHARE",[l.vehicle_id]);
  if(extra)return no('F06_5B_IN_PROGRESS_OCCUPANCY_DENY');
  // Read-only provenance; never infer that a missing real issuer proves no funds.
  const finance=await one(c,"SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1",[l.lock_id]);
  const before={lockStatus:l.lock_status,responsibleEmployeeId:l.responsible_employee_id,sourceLockId:l.lock_id};
  // The signed public M94 schema supports in_progress and its unique vehicle index.
  // Preserve the true status in public, and add CI-only immutable origin/actor facts.
  const atWrite=await signedLockRefundExclusionCI(c,l);
  if(!atWrite.allowed)return atWrite;
  const tx=await one(c,"INSERT INTO public.transactions(source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) VALUES($1,$2,$3,$4,'in_progress',$5) RETURNING transaction_id",
   [l.lock_id,l.customer_id,l.vehicle_id,l.listing_cycle_id,l.responsible_employee_id]);
  if(p.testCheckpoint==='AFTER_TRANSACTION_THROW')throw Error('F06_5B_INJECTED_TRANSACTION_ROLLBACK');
  await c.query("UPDATE public.locks SET lock_status='released',end_reason='converted_to_transaction' WHERE lock_id=$1 AND lock_status='active'",[l.lock_id]);
  if(p.testCheckpoint==='AFTER_LOCK_THROW')throw Error('F06_5B_INJECTED_LOCK_ROLLBACK');
  await c.query("INSERT INTO f06_3b_ci.transaction_origins(transaction_id,source_lock_id,vehicle_id,listing_cycle_id,customer_id,original_responsible_employee_id,opening_actor_employee_id,status,public_carrier_status,lock_end_reason,lock_initial_hours,lock_policy_version,source_price_kind,source_price_cents,priority_origin_id,deposit_receipt_count) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,'in_progress','in_progress','converted_to_transaction',$8,$9,$10,$11,$12,$13)",
   [tx.transaction_id,l.lock_id,l.vehicle_id,l.listing_cycle_id,l.customer_id,l.responsible_employee_id,a.employee_id,signed.initial_hours,signed.policy_version,signed.price_kind,signed.price_cents,signed.priority_origin_id,finance.n]);
  await c.query("INSERT INTO f06_3b_ci.request_keys(event_key_sha256,opening_actor_employee_id,source_lock_id,resulting_transaction_id,action) VALUES($1,$2,$3,$4,'open')",
   [keyHash,a.employee_id,l.lock_id,tx.transaction_id]);
  await c.query("INSERT INTO f06_3b_ci.origin_events(transaction_id,source_lock_id,previous_lock_status,final_lock_status,event_kind,actor_employee_id,event_key_sha256) VALUES($1,$2,'active','released','lock_converted_to_transaction',$3,$4)",
   [tx.transaction_id,l.lock_id,a.employee_id,keyHash]);
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_3b_ci_lock_converted_to_transaction',$3::jsonb,$4::jsonb,clock_timestamp())",
   [String(a.employee_id),String(tx.transaction_id),JSON.stringify(before),JSON.stringify({transactionId:tx.transaction_id,status:'in_progress',physicalCarrier:'in_progress',lockStatus:'released'})]);
  await c.query("INSERT INTO f06_5b_ci.guard_events(transaction_id,source_lock_id,vehicle_id,listing_cycle_id,actor_employee_id,checked_refunds,signed_refunds_sha256) VALUES($1,$2,$3,$4,$5,$6,$7)",
   [tx.transaction_id,l.lock_id,l.vehicle_id,l.listing_cycle_id,a.employee_id,atWrite.checkedRefundCount,atWrite.refundDigest]);
  const finalGuard=await signedLockRefundExclusionCI(c,l);
  if(!finalGuard.allowed||finalGuard.refundDigest!==atWrite.refundDigest)throw Error('F06_5B_ATOMIC_COMMIT_GUARD_DRIFT');
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_5B_INJECTED_AUDIT_ROLLBACK');
  const last=await one(c,"SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1",[l.lock_id]);
  if(last.lock_status!=='released'||last.end_reason!=='converted_to_transaction')throw Error('F06_5B_NOT_ATOMICALLY_CONVERTED');
  return yes('F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',{transactionId:Number(tx.transaction_id),sourceLockId:p.lockId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid,carrier:PUBLIC_TRANSACTION_CARRIER});
 },{normalOnly:true});
 return result||no('F06_5B_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_5B_PG_CONTENTION_ATOMIC_DENY',{sqlstate:e.code});
  throw e;
 }
}

// CI-side adapter guard for NEW Lock/Priority acquisition, not retroactive production wiring.
// Caller must recheck under the same Vehicle mutex in its own physical PG transaction.
// Existing F06-1 Priority/Lock issuer is frozen and NOT silently patched by this adapter.
export const openSyntheticTransactionCI=openGuardedSyntheticTransactionCI;
export async function syntheticNewOccupancyGuardCI(c,vehicleId,kind){
 gate();await verify(c);
 if(!id(vehicleId)||!['lock','priority'].includes(kind))return no('F06_5B_INVALID_ACQUISITION');
 const v=await one(c,'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId]);
 if(!v)return no('F06_5B_VEHICLE_NOT_FOUND');
 // Fail closed for any signed public in_progress, including a transaction lacking this CI sidecar.
 const occupied=await one(c,"SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 AND status IN ('in_progress','pending') LIMIT 1 FOR SHARE",[vehicleId]);
 const signed=await one(c,"SELECT transaction_id FROM f06_3b_ci.transaction_origins WHERE vehicle_id=$1 AND status='in_progress' LIMIT 1 FOR SHARE",[vehicleId]);
 if(occupied||signed)return no('F06_5B_TRADING_OCCUPANCY_DENY',{kind,carrier:PUBLIC_TRANSACTION_CARRIER});
 return yes('F06_5B_NO_SYNTHETIC_TRADING_OCCUPANCY',{kind});
}
