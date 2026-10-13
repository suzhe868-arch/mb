// F06-2: disposable signed PG16 ordinary Lock lifecycle ONLY.
import {createHash} from 'node:crypto';
import {gate,verify} from './migration.mjs';
const deny=(code,extra={})=>({allowed:false,code,...extra});
const yes=(code,extra={})=>({allowed:true,code,...extra});
const positive=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
const digest=x=>createHash('sha256').update(x).digest('hex');
const one=async(c,s,a=[])=> (await c.query(s,a)).rows[0];
const ROLES=['sales','manager','store_head'];
const proof='CI_SYNTHETIC_LIFECYCLE_SYSTEM_NOT_PRODUCTION';
export const CI_SYSTEM_PROOF=proof;
export function productionIssuerDeny(){return deny('F06_2_PRODUCTION_LOCK_AND_MONEY_ISSUERS_NOT_WIRED')}
async function scope(c,a,lock){
 if(a.principal_kind!=='employee'||a.system_admin_id!==null||!ROLES.includes(a.role_code)||
 a.force_password_change!==false||a.credential_state!=='enabled'||a.subject_status!=='active')return false;
 // This batch introduces distinct lock.ci.manage: neither role name nor inherited approve alone suffices.
 const x=await one(c,"SELECT e.employee_id,r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='lock.ci.manage' "+
 "JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id AND ov.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id "+
 "JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships rm ON rm.employee_id=$2 AND rm.team_id=t.team_id "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND t.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (sc.ended_at IS NULL OR sc.ended_at>clock_timestamp()) "+
 "AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id) "+
 "OR (sc.scope_kind='store' AND sc.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,ov,b,sc,m,t,st,rm",[a.employee_id,lock.responsible_employee_id]);
 return !!x&&(String(a.employee_id)===String(lock.responsible_employee_id)||['manager','store_head'].includes(x.role_code));
}
async function money(c,lock){
 // No empty-table inference: only a prior physical synthetic absence attestation permits actions.
 const f=await one(c,'SELECT proof_kind FROM f06_2_ci.finance_proofs WHERE lock_id=$1 FOR SHARE',[lock.lock_id]);
 if(!f||f.proof_kind==='unknown')return deny('F06_2_DEPOSIT_ISSUER_SOURCE_GAP_UNKNOWN_DENY');
 if(f.proof_kind==='present')return deny('F06_2_EXISTING_DEPOSIT_DENY');
 const signedReceipt=await one(c,"SELECT deposit_id FROM public.deposit_receipts WHERE lock_id=$1 LIMIT 1 FOR SHARE",[lock.lock_id]);
 const tx=await one(c,"SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 LIMIT 1 FOR SHARE",[lock.lock_id]);
 if(signedReceipt||tx)return deny('F06_2_EXISTING_SIGNED_MONEY_OR_TRANSACTION_DENY');
 return yes('F06_2_CI_SYNTHETIC_ABSENCE_ONLY');
}
async function original(c,lock){
 const s=await one(c,"SELECT s.lock_id,s.customer_id,s.responsible_employee_id,s.initial_hours,s.policy_version,s.price_kind,s.price_cents,s.source_price_event_id,s.priority_origin_id "+
 "FROM f06_1_lock_ci.lock_snapshots s WHERE s.lock_id=$1 FOR SHARE",[lock.lock_id]);
 if(!s||String(s.customer_id)!==String(lock.customer_id)||String(s.responsible_employee_id)!==String(lock.responsible_employee_id))
 return deny('F06_2_SIGNED_F06_1_ORIGIN_MISSING');
 return yes('F06_2_SIGNED_SNAPSHOT',{snapshot:s});
}
async function audit(c,l,keyHash,kind,actorKind,actorId,old,after,reasonValue){
 await c.query("INSERT INTO f06_2_ci.lifecycle_events(lock_id,event_key_sha256,event_kind,actor_kind,actor_employee_id,old_status,new_status,old_expires_at,new_expires_at,reason) "+
 "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
 [l.lock_id,keyHash,kind,actorKind,actorId,old.lock_status,after.lock_status,old.expires_at,after.expires_at,reasonValue]);
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) "+
 "VALUES($1,$2,'Lock',$3,$4,$5::jsonb,$6::jsonb,clock_timestamp())",
 [actorKind==='employee'?'employee':'system',actorId===null?null:String(actorId),String(l.lock_id),'f06_2_ci_'+kind,
 JSON.stringify({lockStatus:old.lock_status,expiresAt:old.expires_at}),
 JSON.stringify({lockStatus:after.lock_status,expiresAt:after.expires_at,reason:reasonValue})]);
}
async function entry(c,id){
 const o=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[id]);
 if(!o)return null;
 await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[o.vehicle_id]);
 return one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[id]);
}
async function validate(c,l,mode){
 const origin=await original(c,l);
 if(!origin.allowed)return origin;
 const customer=await one(c,"SELECT account_status,current_owner_employee_id FROM public.customers WHERE customer_id=$1 FOR SHARE",[l.customer_id]);
 const cycle=await one(c,"SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE",[l.listing_cycle_id,l.vehicle_id]);
 if(!customer||!cycle)return deny('F06_2_UNVERIFIED_CUSTOMER_OR_CYCLE');
 if(mode==='employee'&&customer.account_status!=='active')return deny('F06_2_CUSTOMER_DISABLED_MANUAL_DENY');
 // Customer disable or archive is not a license to mutate funds or fabricate cancellation.
 return money(c,l);
}
export async function employeeLifecycleCI(auth,token,p={}){
 gate();
 if(!positive(p.lockId)||!key(p.eventKey)||!['extend','release','cancel'].includes(p.action)||!reason(p.reason)||
 (p.action==='extend'&&(!positive(p.extendHours)||Number(p.extendHours)>8760)))return deny('F06_2_BAD_EMPLOYEE_MUTATION');
 const r=await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1600ms'");
  const l=await entry(c,p.lockId);
  if(!l)return deny('F06_2_LOCK_NOT_FOUND');
  if(!await scope(c,a,l))return deny('F06_2_EMPLOYEE_PERMISSION_SCOPE_DENIED');
  const h=digest('employee:'+a.employee_id+':'+p.eventKey);
  const repeat=await one(c,'SELECT event_kind,actor_employee_id FROM f06_2_ci.lifecycle_events WHERE event_key_sha256=$1',[h]);
  if(repeat)return repeat.event_kind===p.action?yes('F06_2_IDEMPOTENT_REPLAY',{lockId:Number(l.lock_id),status:l.lock_status}):deny('F06_2_KEY_REUSED_FOR_DIFFERENT_ACTION');
  if(l.lock_status!=='active')return deny('F06_2_TERMINAL_LOCK_REJECTED');
  const eligible=await validate(c,l,'employee');if(!eligible.allowed)return eligible;
  const past=await one(c,'SELECT $1::timestamptz<=clock_timestamp() past',[l.expires_at]);
  if(p.action==='extend'&&past.past)return deny('F06_2_ALREADY_EXPIRED_EXTENSION_DENIED');
  let next;
  if(p.action==='extend'){
   next=await one(c,"UPDATE public.locks SET expires_at=expires_at+make_interval(hours=>$2::int) "+
   "WHERE lock_id=$1 AND lock_status='active' RETURNING *",[l.lock_id,Number(p.extendHours)]);
  }else{
   next=await one(c,'UPDATE public.locks SET lock_status=$2,end_reason=$3 WHERE lock_id=$1 AND lock_status=\'active\' RETURNING *',
   [l.lock_id,p.action==='cancel'?'cancelled':'released','f06_2_ci_'+p.action]);
  }
  if(!next)throw Error('F06_2_LOST_ROW_UNDER_LOCK');
  await audit(c,l,h,p.action,'employee',a.employee_id,l,next,p.reason.trim());
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_2_INJECTED_ATOMIC_ROLLBACK');
  return yes('F06_2_'+p.action.toUpperCase()+'_COMMITTED',
   {lockId:Number(l.lock_id),status:next.lock_status,expiresAt:next.expires_at,
   actorEmployeeId:Number(a.employee_id),backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return r||deny('F06_2_SIGNED_SESSION_DENIED');
}
export async function expireOrdinaryCI(c,p={}){
 gate();
 if(!positive(p.lockId)||p.ciSystemProof!==proof)return deny('F06_2_SYSTEM_ISSUER_REQUIRED');
 await verify(c);await c.query('BEGIN');
 try{
  await c.query("SET LOCAL lock_timeout='1600ms'");
  const l=await entry(c,p.lockId);
  if(!l){await c.query('ROLLBACK');return deny('F06_2_LOCK_NOT_FOUND')}
  if(l.lock_status!=='active'){await c.query('COMMIT');return yes('F06_2_SYSTEM_TERMINAL_REPLAY',{status:l.lock_status})}
  const r=await validate(c,l,'system');
  if(!r.allowed){await c.query('ROLLBACK');return r}
  const passed=await one(c,'SELECT $1::timestamptz<=clock_timestamp() passed',[l.expires_at]);
  if(!passed.passed){await c.query('ROLLBACK');return deny('F06_2_PG_CLOCK_NOT_EXPIRED')}
  const h=digest('system:expire:'+l.lock_id);
  const next=await one(c,"UPDATE public.locks SET lock_status='expired',end_reason='f06_2_ci_pg_clock_expiry' WHERE lock_id=$1 AND lock_status='active' RETURNING *",[l.lock_id]);
  if(!next)throw Error('F06_2_SYSTEM_LOST_ACTIVE_LOCK');
  await audit(c,l,h,'expire','ci_system',null,l,next,'ci_system_clock_expired_no_signed_funds');
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_2_INJECTED_ATOMIC_ROLLBACK');
  await c.query('COMMIT');
  return yes('F06_2_PG_CLOCK_EXPIRED',{lockId:Number(l.lock_id),backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 }catch(e){await c.query('ROLLBACK');if(['55P03','40P01','40001','23505'].includes(e.code))return deny('F06_2_CONTENTION_RETRY');throw e}
}
