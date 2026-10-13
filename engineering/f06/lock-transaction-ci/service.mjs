// Nonproduction F06-3B signed PG16 conversion. No HTTP production issuer or real transaction.
import {createHash} from 'node:crypto';
import {gate,verify} from './migration.mjs';
const yes=(code,more={})=>({allowed:true,code,...more});
const no=(code,more={})=>({allowed:false,code,...more});
const one=async(c,sql,args=[])=> (await c.query(sql,args)).rows[0];
const sha=s=>createHash('sha256').update(s).digest('hex');
const id=x=>Number.isSafeInteger(x)&&x>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const sale=v=>!!v&&!v.archived_at&&
 ((v.source_type==='wholesale'&&v.source_sale_status==='active')||
 (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
export const PRODUCTION_TRANSACTION_ISSUER='F06_3B_PRODUCTION_TRANSACTION_ISSUER_NOT_WIRED';
export const PRODUCTION_PHYSICAL_CARRIER_GAP='PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP';
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
 const rows=(await c.query("SELECT t.transaction_id,t.source_lock_id,t.original_responsible_employee_id,t.customer_id,t.listing_cycle_id,t.priority_origin_id,t.status FROM f06_3b_ci.transaction_origins t WHERE t.vehicle_id=$1 AND t.status='in_progress'",[vehicleId])).rows;
 if(rows.length>1)throw Error('F06_3B_DUPLICATE_OCCUPANCY');
 return rows[0]?yes('F06_3B_SIGNED_IN_PROGRESS_CI',{transactionId:Number(rows[0].transaction_id),sourceLockId:Number(rows[0].source_lock_id),responsibleId:Number(rows[0].original_responsible_employee_id),customerId:Number(rows[0].customer_id),priorityOriginId:rows[0].priority_origin_id}):no('F06_3B_NO_ACTIVE_TRANSACTION');
}
export async function openSyntheticTransactionCI(auth,token,p={}){
 gate();
 if(!id(p.lockId)||!key(p.eventKey))return no('F06_3B_INVALID_ARGUMENTS');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);
  await c.query("SET LOCAL lock_timeout='1500ms'");
  const known=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[p.lockId]);
  if(!known)return no('F06_3B_SOURCE_LOCK_NOT_FOUND');
  // Global vehicle mutex precedes lock row, permission rows, and transaction occupancy.
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[known.vehicle_id]);
  const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[p.lockId]);
  if(!l)return no('F06_3B_SOURCE_LOCK_NOT_FOUND');
  if(!await actorAllowed(c,a,l))return no('F06_3B_OPEN_PERMISSION_SCOPE_DENIED');
  const keyHash=sha('f06-3b:'+a.employee_id+':'+p.eventKey);
  const old=await one(c,'SELECT * FROM f06_3b_ci.request_keys WHERE event_key_sha256=$1',[keyHash]);
  if(old)return Number(old.source_lock_id)===p.lockId&&old.action==='open'?
   yes('F06_3B_IDEMPOTENT_CONVERSION',{transactionId:Number(old.resulting_transaction_id)}):
   no('F06_3B_IDEMPOTENCY_KEY_CONFLICT');
  if(l.lock_status!=='active'||new Date(l.expires_at).getTime()<=Date.now())return no('F06_3B_NOT_ACTIVE_CURRENT_LOCK');
  const signed=await one(c,"SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE",[l.lock_id]);
  if(!signed||Number(signed.customer_id)!==Number(l.customer_id)||
    Number(signed.responsible_employee_id)!==Number(l.responsible_employee_id)||
    !Number.isSafeInteger(Number(signed.initial_hours))||Number(signed.initial_hours)<=0)return no('F06_3B_UNSIGNED_LOCK_ORIGIN');
  const cust=await one(c,"SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE",[l.customer_id]);
  if(!cust||cust.account_status!=='active')return no('F06_3B_CUSTOMER_DISABLED');
  const cyc=await one(c,"SELECT ended_at,vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE",[l.listing_cycle_id,l.vehicle_id]);
  const v=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1',[l.vehicle_id]);
  if(!cyc||cyc.ended_at||!sale(v))return no('F06_3B_SOURCE_OR_CYCLE_UNAVAILABLE');
  const occupied=await one(c,"SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 AND status IN ('pending','in_progress') LIMIT 1 FOR SHARE",[l.vehicle_id]);
  const oldTx=await one(c,"SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 LIMIT 1 FOR SHARE",[l.lock_id]);
  if(occupied||oldTx)return no('F06_3B_EXISTING_TRANSACTION_DENY');
  const extra=await one(c,"SELECT transaction_id FROM f06_3b_ci.transaction_origins WHERE vehicle_id=$1 LIMIT 1 FOR SHARE",[l.vehicle_id]);
  if(extra)return no('F06_3B_IN_PROGRESS_OCCUPANCY_DENY');
  // Read-only provenance; never infer that a missing real issuer proves no funds.
  const finance=await one(c,"SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1",[l.lock_id]);
  const before={lockStatus:l.lock_status,responsibleEmployeeId:l.responsible_employee_id,sourceLockId:l.lock_id};
  // Public legacy carrier permits 'pending' but that DOES NOT mean PDM19 'in_progress'.
  // The signed CI-sidecar owns that correspondence and the physical public gap stays reported.
  const tx=await one(c,"INSERT INTO public.transactions(source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) VALUES($1,$2,$3,$4,'pending',$5) RETURNING transaction_id",
   [l.lock_id,l.customer_id,l.vehicle_id,l.listing_cycle_id,l.responsible_employee_id]);
  if(p.testCheckpoint==='AFTER_TRANSACTION_THROW')throw Error('F06_3B_INJECTED_TRANSACTION_ROLLBACK');
  await c.query("UPDATE public.locks SET lock_status='released',end_reason='converted_to_transaction' WHERE lock_id=$1 AND lock_status='active'",[l.lock_id]);
  if(p.testCheckpoint==='AFTER_LOCK_THROW')throw Error('F06_3B_INJECTED_LOCK_ROLLBACK');
  await c.query("INSERT INTO f06_3b_ci.transaction_origins(transaction_id,source_lock_id,vehicle_id,listing_cycle_id,customer_id,original_responsible_employee_id,opening_actor_employee_id,status,public_carrier_status,lock_end_reason,lock_initial_hours,lock_policy_version,source_price_kind,source_price_cents,priority_origin_id,deposit_receipt_count) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,'in_progress','pending','converted_to_transaction',$8,$9,$10,$11,$12,$13)",
   [tx.transaction_id,l.lock_id,l.vehicle_id,l.listing_cycle_id,l.customer_id,l.responsible_employee_id,a.employee_id,signed.initial_hours,signed.policy_version,signed.price_kind,signed.price_cents,signed.priority_origin_id,finance.n]);
  await c.query("INSERT INTO f06_3b_ci.request_keys(event_key_sha256,opening_actor_employee_id,source_lock_id,resulting_transaction_id,action) VALUES($1,$2,$3,$4,'open')",
   [keyHash,a.employee_id,l.lock_id,tx.transaction_id]);
  await c.query("INSERT INTO f06_3b_ci.origin_events(transaction_id,source_lock_id,previous_lock_status,final_lock_status,event_kind,actor_employee_id,event_key_sha256) VALUES($1,$2,'active','released','lock_converted_to_transaction',$3,$4)",
   [tx.transaction_id,l.lock_id,a.employee_id,keyHash]);
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_3b_ci_lock_converted_to_transaction',$3::jsonb,$4::jsonb,clock_timestamp())",
   [String(a.employee_id),String(tx.transaction_id),JSON.stringify(before),JSON.stringify({transactionId:tx.transaction_id,status:'in_progress',physicalCarrier:'pending',lockStatus:'released'})]);
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_3B_INJECTED_AUDIT_ROLLBACK');
  const last=await one(c,"SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1",[l.lock_id]);
  if(last.lock_status!=='released'||last.end_reason!=='converted_to_transaction')throw Error('F06_3B_NOT_ATOMICALLY_CONVERTED');
  return yes('F06_3B_ATOMIC_SYNTHETIC_IN_PROGRESS',{transactionId:Number(tx.transaction_id),sourceLockId:p.lockId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid,carrier:PRODUCTION_PHYSICAL_CARRIER_GAP});
 },{normalOnly:true});
 return result||no('F06_3B_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_3B_PG_CONTENTION_ATOMIC_DENY',{sqlstate:e.code});
  throw e;
 }
}

// CI-side adapter guard for NEW Lock/Priority acquisition, not retroactive production wiring.
// Caller must recheck under the same Vehicle mutex in its own physical PG transaction.
// Existing F06-1 Priority/Lock issuer is frozen and NOT silently patched by this adapter.
export async function syntheticNewOccupancyGuardCI(c,vehicleId,kind){
 gate();await verify(c);
 if(!id(vehicleId)||!['lock','priority'].includes(kind))return no('F06_3B_INVALID_ACQUISITION');
 const v=await one(c,'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId]);
 if(!v)return no('F06_3B_VEHICLE_NOT_FOUND');
 const occupied=await one(c,"SELECT s.transaction_id FROM f06_3b_ci.transaction_origins s JOIN public.transactions t ON t.transaction_id=s.transaction_id WHERE s.vehicle_id=$1 AND s.status='in_progress' AND t.status='pending' LIMIT 1 FOR SHARE OF s,t",[vehicleId]);
 if(occupied)return no('F06_3B_TRADING_OCCUPANCY_DENY',{kind,carrier:PRODUCTION_PHYSICAL_CARRIER_GAP});
 return yes('F06_3B_NO_SYNTHETIC_TRADING_OCCUPANCY',{kind});
}
