import {createHash} from 'node:crypto';
import {assertF06TestEnvironment,verifyF06TestDatabase} from './f06-lock-readiness.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const validId=value=>typeof value==='string'&&/^[1-9][0-9]{0,18}$/.test(value)&&BigInt(value)<=9223372036854775807n;
export function validateResponsibleHandoverChain({initialResponsibleEmployeeId,currentResponsibleEmployeeId,receipts}={}){
 const initial=String(initialResponsibleEmployeeId??''),current=String(currentResponsibleEmployeeId??'');
 if(!validId(initial)||!validId(current)||!Array.isArray(receipts))return false;
 if(receipts.length===0)return initial===current;
 if(String(receipts[0]?.from_employee_id??'')!==initial||String(receipts[receipts.length-1]?.to_employee_id??'')!==current)return false;
 const keys=new Set();let previous=null;
 for(const r of receipts){
  const from=String(r?.from_employee_id??''),to=String(r?.to_employee_id??'');
  if(!validId(from)||!validId(to))return false;
  const key=r?.request_key_sha256;
  if(typeof key!=='string'||!/^[a-f0-9]{64}$/.test(key)||keys.has(key))return false;
  const committedAt=r?.committed_at instanceof Date?r.committed_at.getTime():Date.parse(String(r?.committed_at??''));
  if(!Number.isFinite(committedAt))return false;
  let auditId;try{auditId=BigInt(r?.audit_id)}catch{return false}
  if(auditId<=0n)return false;
  if(previous&&(previous.to!==from||committedAt<previous.committedAt||auditId<=previous.auditId))return false;
  keys.add(key);previous={to,committedAt,auditId};
 }
 return true;
}
const validKey=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(value);
const validToken=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const validReason=value=>typeof value==='string'&&value.trim().length>=1&&value.trim().length<=240;
const validIso=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return false;try{return new Date(value).toISOString()===value}catch{return false}};
const response=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
const denied=code=>response(403,code);
const first=async(db,sql,args=[])=>((await db.query(sql,args)).rows[0]);
const LOCK_SCHEMA='f06_real_lock_test';
const LIFECYCLE_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY';
const EXPIRY_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY';
const FAULT_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_FAULTS';
const saleable=v=>!!v&&!v.archived_at&&((v.source_type==='wholesale'&&v.source_sale_status==='active')||(['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
export function createIsolatedF06LockLifecycleService({pool,env=process.env,afterMutationWrite=null}={}){
 assertF06TestEnvironment(env);
 if(!pool||typeof pool.connect!=='function'||typeof pool.query!=='function')throw Error('F06_LOCK_LIFECYCLE_PG16_POOL_REQUIRED');
 if(afterMutationWrite!==null&&(typeof afterMutationWrite!=='function'||env.NODE_ENV!=='test'||env.F06_LOCK_LIFECYCLE_FAULT_INJECTION!==FAULT_CONSENT))throw Error('F06_LOCK_LIFECYCLE_FAULT_INJECTION_NOT_AUTHORIZED');
 async function tx(worker){
  const db=await pool.connect();let begun=false;
  try{await db.query('BEGIN');begun=true;await verifyF06TestDatabase(db);await db.query("SET LOCAL lock_timeout='1800ms'");const result=await worker(db);await db.query('COMMIT');begun=false;return result}
  catch(error){if(begun)await db.query('ROLLBACK').catch(()=>{});if(['40P01','55P03','40001','23505'].includes(error.code))return response(409,'LOCK_LIFECYCLE_CONTENTION_RETRY');throw error}
  finally{db.release()}
 }
 async function employee(db,token){
  if(!validToken(token))return null;
  return first(db,`SELECT s.employee_id,r.role_code,e.employment_status,e.store_id
   FROM ${LOCK_SCHEMA}.employee_sessions s
   JOIN public.pc_login_accounts a ON a.account_id=s.account_id AND a.employee_id=s.employee_id
    AND a.principal_kind='employee' AND a.system_admin_id IS NULL AND a.credential_state='enabled'
    AND a.force_password_change=false AND a.credential_epoch=s.credential_epoch
   JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id
   WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL
    AND s.expires_at>clock_timestamp() AND e.employment_status='active'
    AND r.role_code IN('sales','manager','store_head')
    AND NOT EXISTS(SELECT 1 FROM public.f05_3a_member_create_licenses x WHERE x.employee_id=e.employee_id AND x.revoked_at IS NULL)
   FOR SHARE OF s,a,e,r`,[sha(token)]);
 }
 async function currentOwner(db,id){
  if(!validId(String(id??'')))return null;
  return first(db,`SELECT e.employee_id,t.team_id,t.store_id,r.role_code
   FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id
   JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id
   JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=e.store_id
   JOIN public.stores s ON s.store_id=t.store_id
   WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN('sales','manager','store_head')
    AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())
    AND t.team_status='active' AND s.status='active'
    AND NOT EXISTS(SELECT 1 FROM public.f05_3a_member_create_licenses x WHERE x.employee_id=e.employee_id AND x.revoked_at IS NULL)
   ORDER BY t.team_id LIMIT 1 FOR SHARE OF e,m,t,s,r`,[id]);
 }
 async function hasManageScope(db,actor,lock){
  return !!(await first(db,`SELECT e.employee_id FROM public.employees e
   JOIN public.roles r ON r.role_id=e.main_role_id
   JOIN public.permissions p ON p.permission_code='lock.ci.manage'
   JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id AND ov.decision='allow'
   JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id
    AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp())
   JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=e.employee_id AND (sc.ended_at IS NULL OR sc.ended_at>clock_timestamp())
   JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id
   JOIN public.teams t ON t.team_id=m.team_id JOIN public.stores st ON st.store_id=t.store_id
   JOIN public.employee_team_memberships rm ON rm.employee_id=$2 AND rm.team_id=t.team_id
   JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active'
   WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN('sales','manager','store_head')
    AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())
    AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp())
    AND t.team_status='active' AND st.status='active'
    AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id)
      OR (sc.scope_kind='store' AND sc.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head')))
    AND NOT EXISTS(SELECT 1 FROM public.f05_3a_member_create_licenses x WHERE x.employee_id=e.employee_id AND x.revoked_at IS NULL)
   LIMIT 1 FOR SHARE OF e,r,p,ov,b,sc,m,t,st,rm`,[actor.employee_id,lock.responsible_employee_id]));
 }
 async function authorized(db,actor,lock){
  const owner=await currentOwner(db,lock.responsible_employee_id);if(!owner)return false;
  if(String(actor.employee_id)===String(lock.responsible_employee_id))return true;
  return hasManageScope(db,actor,lock);
 }
 async function lockEntry(db,id){
  const ref=await first(db,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[id]);if(!ref)return null;
  const vehicle=await first(db,'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[ref.vehicle_id]);
  const lock=await first(db,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[id]);
  return lock?{lock,vehicleExists:!!vehicle}:null;
 }
 async function snapshot(db,lock){
  const s=await first(db,`SELECT lock_id,customer_id,responsible_employee_id,initial_hours,policy_version,price_kind,price_cents,
    source_price_event_id,priority_origin_customer_id,priority_origin_id FROM ${LOCK_SCHEMA}.lock_snapshots WHERE lock_id=$1 FOR SHARE`,[lock.lock_id]);
  return s&&String(s.customer_id)===String(lock.customer_id)?s:null;
 }
 const str=value=>value===undefined||value===null?null:String(value);
 async function handoverReceiptEventProven(db,r){
  const q=await db.query("SELECT b.source_employee_id bs,b.initiated_by_id ba,i.batch_id ib,i.object_kind ik,i.object_id io,i.from_employee_id iff,i.intended_to_employee_id ito,w.customer_id wc,a.actor_kind ak,a.actor_id aid,a.object_kind aok,a.object_id aoid,a.action act,a.role_context rc,a.before_json bj,a.after_json aj,a.occurred_at ats FROM public.handover_batches b JOIN public.handover_items i ON i.item_id=$2 JOIN public.locks w ON w.lock_id=$3 JOIN public.audit_events a ON a.audit_id=$4 WHERE b.batch_id=$1 FOR SHARE OF b,i,a",[r.batch_id,r.item_id,r.lock_id,r.audit_id]);
  const v=q.rows[0];
  return !!v&&q.rows.length===1&&str(v.bs)===str(r.from_employee_id)&&str(v.ba)===str(r.actor_employee_id)&&str(v.ib)===str(r.batch_id)&&v.ik==='Lock'&&v.io===str(r.lock_id)&&str(v.iff)===str(r.from_employee_id)&&str(v.ito)===str(r.to_employee_id)&&str(v.wc)===str(r.customer_id)&&v.ak==='employee'&&str(v.aid)===str(r.actor_employee_id)&&v.aok==='Lock'&&str(v.aoid)===str(r.lock_id)&&v.act==='lock.responsible.handover'&&v.rc?.scope==='SG06_CI_ONLY_LOCK'&&str(v.rc.batchId)===str(r.batch_id)&&str(v.rc.itemId)===str(r.item_id)&&str(v.rc.teamId)===str(r.scope_team_id)&&v.rc.requestKeySha256===r.request_key_sha256&&str(v.bj?.responsible)===str(r.from_employee_id)&&str(v.aj?.responsible)===str(r.to_employee_id)&&v.ats?.getTime()===r.committed_at?.getTime();
 }
 async function verifyResponsibleHandover(db,lock,snap){
  const initial=String(snap?.responsible_employee_id??''),current=String(lock?.responsible_employee_id??'');
  if(!validId(initial)||!validId(current))return {ok:false};
  const carrier=await first(db,"SELECT to_regclass('public.lock_responsible_handover_receipts') IS NOT NULL AS available");
  if(!carrier?.available)return {ok:initial===current};
  const rows=(await db.query("SELECT receipt_id,item_id,batch_id,lock_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256,committed_at FROM public.lock_responsible_handover_receipts WHERE lock_id=$1 ORDER BY committed_at,receipt_id FOR SHARE",[lock.lock_id])).rows;
  if(!validateResponsibleHandoverChain({initialResponsibleEmployeeId:initial,currentResponsibleEmployeeId:current,receipts:rows}))return {ok:false};
  if(!rows.length)return {ok:true};
  for(const r of rows){
   if(String(r.lock_id)!==String(lock.lock_id)||String(r.customer_id)!==String(lock.customer_id)||!await handoverReceiptEventProven(db,r))return {ok:false};
  }
  const live=await first(db,'SELECT customer_id,responsible_employee_id FROM public.locks WHERE lock_id=$1 FOR SHARE',[lock.lock_id]);
  if(!live||String(live.customer_id)!==String(lock.customer_id)||String(live.responsible_employee_id)!==current)return {ok:false};
  return {ok:true};
 }
 async function context(db,lock,action,vehicleExists){
  if(!vehicleExists)return {deny:response(409,'LOCK_CURRENT_VEHICLE_MISSING')};
  const snap=await snapshot(db,lock);if(!snap)return {deny:response(409,'LOCK_SIGNED_SNAPSHOT_MISSING')};
  const handover=await verifyResponsibleHandover(db,lock,snap);if(!handover.ok)return {deny:response(409,'RESPONSIBLE_HANDOFF_CARRIER_UNVERIFIED')};
  const customer=await first(db,'SELECT account_status,current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=$1 FOR SHARE',[lock.customer_id]);
  const cycle=await first(db,'SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[lock.listing_cycle_id,lock.vehicle_id]);
  const vehicle=await first(db,'SELECT source_type,source_sale_status,archived_at FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[lock.vehicle_id]);
  if(!customer||!cycle||!vehicle)return {deny:response(409,'LOCK_CURRENT_FACTS_UNVERIFIED')};
  if(action!=='expire'){
   if(customer.account_status!=='active')return {deny:response(409,'CUSTOMER_INACTIVE_MANUAL_MUTATION_DENIED')};
   if(customer.owner_assignment_state!=='assigned'||!await currentOwner(db,customer.current_owner_employee_id))return {deny:response(409,'CUSTOMER_OWNER_UNVERIFIED')};
  }
  if((action==='extend'||action==='expire')&&(cycle.ended_at||vehicle.archived_at||!saleable(vehicle)))return {deny:response(409,'LOCK_SOURCE_OR_CYCLE_NOT_CURRENT')};
  return {snapshot:snap,customer,cycle,vehicle};
 }
 async function financeGuard(db,lock){
  const tables=await first(db,`SELECT to_regclass('public.deposit_receipts') IS NOT NULL AS receipts_available,
   to_regclass('public.transactions') IS NOT NULL AS transactions_available,
   to_regclass('public.refund_cases') IS NOT NULL AS refunds_available`);
  if(!tables?.receipts_available||!tables?.transactions_available||!tables?.refunds_available)return {ok:false,result:response(409,'LOCK_FINANCIAL_SOURCE_UNKNOWN_DENY')};
  const refund=await first(db,'SELECT refund_id FROM public.refund_cases WHERE lock_id=$1 LIMIT 1 FOR SHARE',[lock.lock_id]);
  if(refund)return {ok:false,result:response(409,'LOCK_REFUND_FACT_PRESENT_DENY')};
  const receipt=await first(db,'SELECT deposit_id FROM public.deposit_receipts WHERE lock_id=$1 LIMIT 1 FOR SHARE',[lock.lock_id]);
  const transaction=await first(db,'SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 LIMIT 1 FOR SHARE',[lock.lock_id]);
  if(receipt)return {ok:false,result:response(409,'LOCK_FINANCIAL_FACT_PRESENT_DENY')};
  if(transaction)return {ok:false,result:response(409,'LOCK_TRANSACTION_PRESENT_DENY')};
  const p=await first(db,`SELECT proof_kind,issuer,synthetic_only,evidence_sha256 FROM ${LOCK_SCHEMA}.lock_lifecycle_finance_proofs WHERE lock_id=$1 FOR SHARE`,[lock.lock_id]);
  if(!p||p.issuer!=='DISPOSABLE_TEST_ONLY'||p.synthetic_only!==true||p.proof_kind==='unknown')return {ok:false,result:response(409,'LOCK_FINANCIAL_SOURCE_UNKNOWN_DENY')};
  if(p.proof_kind==='present')return {ok:false,result:response(409,'LOCK_FINANCIAL_FACT_PRESENT_DENY')};
  const expectedAbsenceEvidence=sha(JSON.stringify({issuer:'DISPOSABLE_TEST_ONLY',lockId:String(lock.lock_id),kind:'absent',observedReceipt:false,observedTransaction:false,observedRefund:false,source:'isolated-pg16-fixture'}));
  if(p.proof_kind!=='synthetic_absence_confirmed'||p.evidence_sha256!==expectedAbsenceEvidence)return {ok:false,result:response(409,'LOCK_FINANCIAL_SOURCE_UNKNOWN_DENY')};
  return {ok:true};
 }
 async function activeLockIsUnique(db,lock){
  const rows=(await db.query("SELECT lock_id FROM public.locks WHERE vehicle_id=$1 AND lock_status='active' ORDER BY lock_id FOR UPDATE",[lock.vehicle_id])).rows;
  return rows.length===1&&String(rows[0].lock_id)===String(lock.lock_id);
 }
 async function existingEvent(db,keyHash,payloadHash,actorKind,actorId,action,lockId){
  const p=await first(db,`SELECT payload_sha256,actor_kind,actor_employee_id,action,lock_id,result_json
   FROM ${LOCK_SCHEMA}.lock_lifecycle_events WHERE event_key_sha256=$1 FOR SHARE`,[keyHash]);
  if(!p)return null;
  if(p.payload_sha256!==payloadHash||p.actor_kind!==actorKind||String(p.actor_employee_id??'')!==String(actorId??'')||p.action!==action||String(p.lock_id)!==String(lockId))
   return response(409,'LOCK_LIFECYCLE_IDEMPOTENCY_COLLISION');
  return {status:200,body:p.result_json};
 }
 async function record(db,{lock,keyHash,payloadHash,action,actorKind,actorId,before,after,reason,result}){
  await db.query(`INSERT INTO ${LOCK_SCHEMA}.lock_lifecycle_events
   (lock_id,event_key_sha256,payload_sha256,action,actor_kind,actor_employee_id,old_status,new_status,
    old_expires_at,new_expires_at,reason,result_json)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
   [lock.lock_id,keyHash,payloadHash,action,actorKind,actorId,before.lock_status,after.lock_status,before.expires_at,after.expires_at,reason,JSON.stringify(result.body)]);
  await db.query(`INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at)
   VALUES($1,$2,'Lock',$3,$4,$5::jsonb,$6::jsonb,clock_timestamp())`,
   [actorKind==='employee'?'employee':'system',actorId===null?null:String(actorId),String(lock.lock_id),'f06_lock_lifecycle_'+action,
    JSON.stringify({lockStatus:before.lock_status,expiresAt:before.expires_at}),
    JSON.stringify({lockStatus:after.lock_status,expiresAt:after.expires_at,reason,action})]);
 }
 async function afterWrite(db,details){if(afterMutationWrite)await afterMutationWrite({db,...details})}
 return Object.freeze({
  verify:()=>verifyF06TestDatabase(pool),
  async act({token,lockId,action,idempotencyKey,reason,newExpiresAt}={}){
   if(env.F06_LOCK_LIFECYCLE_TEST_CONSENT!==LIFECYCLE_CONSENT)return denied('LOCK_LIFECYCLE_TEST_CONSENT_REQUIRED');
   if(!validToken(token))return response(401,'TEST_EMPLOYEE_IDENTITY_REQUIRED');
   if(!validId(lockId)||!['extend','release','cancel'].includes(action)||!validKey(idempotencyKey)||!validReason(reason)||(action==='extend'?!validIso(newExpiresAt):newExpiresAt!==undefined))return response(400,'INVALID_LOCK_LIFECYCLE_ACTION');
   const why=reason.trim();
   return tx(async db=>{
    const actor=await employee(db,token);if(!actor)return denied('EMPLOYEE_NOT_AUTHORIZED');
    const entry=await lockEntry(db,lockId);if(!entry)return response(404,'LOCK_NOT_FOUND');
    const lock=entry.lock;if(!await authorized(db,actor,lock))return denied('LOCK_LIFECYCLE_PERMISSION_SCOPE_DENIED');
    const keyHash=sha('f06-lock-lifecycle:'+idempotencyKey);
    const payloadHash=sha(JSON.stringify([String(actor.employee_id),String(lockId),action,why,newExpiresAt??null]));
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F06_LOCK_LIFECYCLE_KEY',keyHash]);
    const prior=await existingEvent(db,keyHash,payloadHash,'employee',actor.employee_id,action,lockId);if(prior)return prior;
    if(lock.lock_status!=='active')return response(409,'LOCK_NOT_ACTIVE');
    if(!await activeLockIsUnique(db,lock))return response(409,'LOCK_ACTIVE_COMPETITION_OR_DUPLICATE_DENY');
    const signed=await snapshot(db,lock);
    if(!signed)return response(409,'LOCK_SIGNED_SNAPSHOT_MISSING');
    if(action==='extend'&&signed.priority_origin_id)return response(409,'PRIORITY_ORIGIN_ORDINARY_EXTENSION_DENIED');
    const ctx=await context(db,lock,action,entry.vehicleExists);if(ctx.deny)return ctx.deny;
    const money=await financeGuard(db,lock);if(!money.ok)return money.result;
    let next;
    if(action==='extend'){
     const check=await first(db,`SELECT $1::timestamptz>expires_at AND $1::timestamptz>clock_timestamp() AS valid,
      expires_at<=clock_timestamp() AS already_expired FROM public.locks WHERE lock_id=$2`,[newExpiresAt,lock.lock_id]);
     if(check?.already_expired)return response(409,'LOCK_ALREADY_EXPIRED_EXTENSION_DENIED');
     if(!check?.valid)return response(400,'LOCK_EXTENSION_MUST_MOVE_EXPIRY_FORWARD');
     next=await first(db,"UPDATE public.locks SET expires_at=$2 WHERE lock_id=$1 AND lock_status='active' RETURNING *",[lock.lock_id,newExpiresAt]);
    }else{
     const status=action==='cancel'?'cancelled':'released',endReason=action==='cancel'?'manual_cancel':'manual_release';
     next=await first(db,"UPDATE public.locks SET lock_status=$2,end_reason=$3 WHERE lock_id=$1 AND lock_status='active' RETURNING *",[lock.lock_id,status,endReason]);
    }
    if(!next)throw Error('LOCK_LIFECYCLE_LOST_ACTIVE_ROW');
    const code=action==='extend'?'LOCK_EXTENDED':action==='release'?'LOCK_RELEASED':'LOCK_CANCELLED';
    const result=response(200,code,{lockId:String(lock.lock_id),lockStatus:next.lock_status,expiresAt:next.expires_at,wasExtended:action==='extend'});
    await record(db,{lock,keyHash,payloadHash,action,actorKind:'employee',actorId:actor.employee_id,before:lock,after:next,reason:why,result});
    await afterWrite(db,{action,lockId:String(lock.lock_id),actorEmployeeId:String(actor.employee_id)});
    return result;
   });
  },
  async expireOrdinary({lockId}={}){
   if(env.F06_LOCK_LIFECYCLE_TEST_CONSENT!==LIFECYCLE_CONSENT||env.F06_LOCK_LIFECYCLE_EXPIRY_CONSENT!==EXPIRY_CONSENT)return denied('LOCK_SYSTEM_EXPIRY_TEST_CONSENT_REQUIRED');
   if(!validId(lockId))return response(400,'INVALID_LOCK_ID');
   return tx(async db=>{
    const entry=await lockEntry(db,lockId);if(!entry)return response(404,'LOCK_NOT_FOUND');
    const lock=entry.lock,keyHash=sha('f06-lock-lifecycle-system-expire:'+lockId);
    const payloadHash=sha(JSON.stringify(['system',String(lockId),'expire','ordinary_expiry_no_verified_money',null]));
    const prior=await existingEvent(db,keyHash,payloadHash,'system',null,'expire',lockId);if(prior)return prior;
    if(lock.lock_status!=='active')return response(409,'LOCK_NOT_ACTIVE');
    if(!await activeLockIsUnique(db,lock))return response(409,'LOCK_ACTIVE_COMPETITION_OR_DUPLICATE_DENY');
    const ctx=await context(db,lock,'expire',entry.vehicleExists);if(ctx.deny)return ctx.deny;
    if(ctx.snapshot.priority_origin_id)return response(409,'PRIORITY_ORIGIN_ORDINARY_EXPIRY_DENIED');
    const money=await financeGuard(db,lock);if(!money.ok)return money.result;
    const deadline=await first(db,'SELECT $1::timestamptz<=clock_timestamp() AS expired',[lock.expires_at]);
    if(!deadline?.expired)return response(409,'LOCK_NOT_EXPIRED_BY_DATABASE_CLOCK');
    const reason='system_clock_expiry_without_verified_deposit_or_transaction';
    const next=await first(db,"UPDATE public.locks SET lock_status='expired',end_reason='ordinary_expiry_no_deposit' WHERE lock_id=$1 AND lock_status='active' RETURNING *",[lock.lock_id]);
    if(!next)throw Error('LOCK_LIFECYCLE_LOST_ACTIVE_ROW');
    const result=response(200,'LOCK_EXPIRED',{lockId:String(lock.lock_id),lockStatus:next.lock_status,expiresAt:next.expires_at,wasExtended:false});
    await record(db,{lock,keyHash,payloadHash,action:'expire',actorKind:'system',actorId:null,before:lock,after:next,reason,result});
    await afterWrite(db,{action:'expire',lockId:String(lock.lock_id),actorEmployeeId:null});
    return result;
   });
  }
 });
}
