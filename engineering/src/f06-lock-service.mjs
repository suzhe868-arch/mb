// F06 首条真实 LockRequest HTTP + PostgreSQL16 纵切，非生产受控测试身份。
// PDM18：LockRequest 不占车；只有授权审批才创建唯一 active Lock；冲突自动候补。
import {createHash} from 'node:crypto';
import {assertF06TestEnvironment,verifyF06TestDatabase} from './f06-lock-readiness.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const validId=value=>typeof value==='string'&&/^[1-9][0-9]{0,18}$/.test(value)&&BigInt(value)<=9223372036854775807n;
const validKey=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(value);
const validToken=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const response=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
const first=async(db,sql,args=[])=>(await db.query(sql,args)).rows[0];
const saleable=v=>!!v&&!v.archived_at&&((v.source_type==='wholesale'&&v.source_sale_status==='active')||
 (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
const denied=code=>response(403,code);
const LOCK_SCHEMA='f06_real_lock_test';

export function createIsolatedF06LockService({pool,env=process.env,afterLockWrite=null}={}){
 assertF06TestEnvironment(env);
 if(!pool||typeof pool.connect!=='function'||typeof pool.query!=='function')throw Error('F06_LOCK_PG16_POOL_REQUIRED');
 if(afterLockWrite!==null&&typeof afterLockWrite!=='function')throw Error('INVALID_FAULT_INJECTOR');

 async function tx(worker){
  const db=await pool.connect();let begun=false;
  try{
   await db.query('BEGIN');begun=true;
   await verifyF06TestDatabase(db);
   await db.query("SET LOCAL lock_timeout='1800ms'");
   const result=await worker(db);
   await db.query('COMMIT');begun=false;
   return result;
  }catch(error){if(begun)await db.query('ROLLBACK').catch(()=>{});
   if(['40P01','55P03','40001','23505'].includes(error.code))return response(409,'LOCK_CONTENTION_RETRY');
   throw error;
  }finally{db.release()}
 }
 async function customer(db,token){
  if(!validToken(token))return null;
  return first(db,`SELECT s.customer_id,c.current_owner_employee_id,c.owner_assignment_state
   FROM ${LOCK_SCHEMA}.customer_sessions s
   JOIN public.customers c ON c.customer_id=s.customer_id
   WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL
    AND s.expires_at>clock_timestamp() AND c.account_status='active'
   FOR SHARE OF s,c`,[sha(token)]);
 }
 async function employee(db,token){
  if(!validToken(token))return null;
  return first(db,`SELECT s.employee_id,r.role_code,e.employment_status,e.store_id
   FROM ${LOCK_SCHEMA}.employee_sessions s
   JOIN public.pc_login_accounts a ON a.account_id=s.account_id
    AND a.employee_id=s.employee_id AND a.principal_kind='employee' AND a.system_admin_id IS NULL
    AND a.credential_state='enabled' AND a.force_password_change=false
    AND a.credential_epoch=s.credential_epoch
   JOIN public.employees e ON e.employee_id=s.employee_id
   JOIN public.roles r ON r.role_id=e.main_role_id
   WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL
    AND s.expires_at>clock_timestamp() AND e.employment_status='active'
    AND r.role_code IN ('sales','manager','store_head')
    AND NOT EXISTS(SELECT 1 FROM public.f05_3a_member_create_licenses four_s
      WHERE four_s.employee_id=e.employee_id AND four_s.revoked_at IS NULL)
   FOR SHARE OF s,a,e,r`,[sha(token)]);
 }
 async function currentOwner(db,ownerId){
  if(!validId(String(ownerId??'')))return null;
  return first(db,`SELECT e.employee_id,t.team_id,t.store_id,r.role_code
   FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id
   JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id
   JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=e.store_id
   JOIN public.stores s ON s.store_id=t.store_id
   WHERE e.employee_id=$1 AND e.employment_status='active'
    AND r.role_code IN ('sales','manager','store_head')
    AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())
    AND t.team_status='active' AND s.status='active'
    AND NOT EXISTS(SELECT 1 FROM public.f05_3a_member_create_licenses four_s
      WHERE four_s.employee_id=e.employee_id AND four_s.revoked_at IS NULL)
   ORDER BY t.team_id LIMIT 1 FOR SHARE OF e,m,t,s,r`,[ownerId]);
 }
 async function currentPhone(db,customerId){
  return !!(await first(db,`SELECT phone_fact_id FROM public.customer_phone_facts
   WHERE customer_id=$1 AND valid_from<=clock_timestamp() AND ended_at IS NULL
   ORDER BY phone_fact_id LIMIT 1 FOR SHARE`,[customerId]));
 }
 async function scope(db,employeeId,teamId){
  return !!(await first(db,`SELECT e.employee_id FROM public.employees e
    JOIN public.roles r ON r.role_id=e.main_role_id
    JOIN public.permissions p ON p.permission_code='lock.ci.approve'
    JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id
      AND ov.permission_id=p.permission_id AND ov.decision='allow'
    JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id
      AND b.permission_id=p.permission_id AND b.granted_at<=clock_timestamp()
      AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp())
    JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=e.employee_id
      AND (sc.ended_at IS NULL OR sc.ended_at>clock_timestamp())
    JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id AND m.team_id=$2
    JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id
    WHERE e.employee_id=$1 AND e.employment_status='active'
     AND r.role_code IN ('sales','manager','store_head')
     AND t.team_status='active' AND st.status='active'
     AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())
     AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id)
      OR (sc.scope_kind='store' AND sc.scope_reference_id=t.store_id AND r.role_code IN ('manager','store_head')))
    LIMIT 1 FOR SHARE OF e,r,p,ov,b,sc,m,t,st`,[employeeId,teamId]));
 }
 async function priority(db,customerId,vehicleId,cycleId){
  const p=await first(db,`SELECT priority_id,customer_id,listing_cycle_id,status FROM public.f05_8_priority_ci
   WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'
    AND expires_at>clock_timestamp() ORDER BY priority_id LIMIT 1 FOR SHARE`,[vehicleId,cycleId]);
  return {other:!!p&&String(p.customer_id)!==String(customerId),own:p&&String(p.customer_id)===String(customerId)?p:null};
 }
 // Lock INSERT invokes the signed F05 Priority occupancy trigger. Verify original
 // Match provenance and append the corresponding same-transaction ending event.
 async function signConvertedPriority(db,original,lockId,approver,req){
  if(!original)return null;
  const p=await first(db,`SELECT p.* FROM public.f05_8_priority_ci p
   JOIN public.f05_7_result_versions_ci r ON r.result_id=p.source_match_result_id
    AND r.demand_id=p.trigger_demand_id AND r.vehicle_id=p.vehicle_id
    AND r.listing_cycle_id=p.listing_cycle_id AND r.source_signature=p.source_signature
   WHERE p.priority_id=$1 AND p.customer_id=$2 AND p.vehicle_id=$3
    AND p.listing_cycle_id=$4 FOR SHARE OF p,r`,
    [original.priority_id,req.customer_id,req.vehicle_id,req.listing_cycle_id]);
  if(!p||p.status!=='ended'||p.ended_reason!=='converted_to_lock'||!p.ended_at)
   throw Error('F06_PRIORITY_ORIGIN_SIGNATURE_OR_ATOMIC_CONVERSION_FAILED');
  const eventKey='f06-1-priority-to-lock:'+p.priority_id+':'+lockId;
  await db.query(`INSERT INTO public.f05_8_events_ci
   (priority_id,customer_id,vehicle_id,event_kind,actor_employee_id,before_json,after_json,event_key)
   VALUES($1,$2,$3,'ended',$4,$5::jsonb,$6::jsonb,$7)`,
   [p.priority_id,p.customer_id,p.vehicle_id,approver,
    JSON.stringify({status:'active',triggerDemandId:p.trigger_demand_id,matchResultId:p.source_match_result_id}),
    JSON.stringify({status:'ended',reason:'converted_to_lock',lockId,endedAt:p.ended_at}),eventKey]);
  return p.priority_id;
 }
 async function facts(db,customerId,vehicleId,cycleId,{lockedVehicle=null,internalWaitlist=false}={}){
  const vehicle=lockedVehicle??await first(db,'SELECT * FROM public.vehicles WHERE vehicle_id=$1',[vehicleId]);
  const cycle=await first(db,`SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles
   WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE`,[vehicleId,cycleId]);
  const who=await first(db,`SELECT account_status,current_owner_employee_id,owner_assignment_state
   FROM public.customers WHERE customer_id=$1 FOR SHARE`,[customerId]);
  if(!saleable(vehicle)||!cycle||cycle.ended_at)return {error:'VEHICLE_NOT_SALEABLE'};
  if(!who||who.account_status!=='active')return {error:'CUSTOMER_INACTIVE'};
  if(!await currentPhone(db,customerId))return {error:'CURRENT_PHONE_REQUIRED'};
  if(who.owner_assignment_state!=='assigned')return {error:'CUSTOMER_OWNER_REQUIRED'};
  const owner=await currentOwner(db,who.current_owner_employee_id);
  if(!owner)return {error:'RESPONSIBLE_OWNER_INACTIVE'};
  const pr=internalWaitlist?{other:false,own:null}:await priority(db,customerId,vehicleId,cycleId);
  if(!internalWaitlist&&pr.other)return {error:'OTHER_CUSTOMER_PRIORITY_HIDDEN'};
  // A verified Priority-origin active Lock inherits its original Customer's exclusive
  // visibility even though the underlying Priority lease is atomically ended.
  // Trust neither a bare Lock nor a naked snapshot: require the signed conversion event.
  const inherited=!internalWaitlist&&vehicle.platform_visibility==='hidden'&&!pr.own&&await first(db,`SELECT 1
   FROM public.locks l JOIN ${LOCK_SCHEMA}.lock_snapshots snap ON snap.lock_id=l.lock_id
   JOIN public.f05_8_priority_ci p ON p.priority_id=snap.priority_origin_id
   JOIN public.f05_8_events_ci ev ON ev.priority_id=p.priority_id
    AND ev.event_kind='ended'
    AND ev.event_key=concat('f06-1-priority-to-lock:',p.priority_id,':',l.lock_id)
   WHERE l.vehicle_id=$1 AND l.listing_cycle_id=$2 AND l.customer_id=$3
    AND l.lock_status='active' AND l.expires_at>clock_timestamp()
    AND snap.priority_origin_customer_id=l.customer_id
    AND p.customer_id=l.customer_id AND p.vehicle_id=l.vehicle_id
    AND p.listing_cycle_id=l.listing_cycle_id AND p.status='ended'
    AND p.ended_reason='converted_to_lock' LIMIT 1 FOR SHARE OF l,snap,p,ev`,
    [vehicleId,cycleId,customerId]);
  if(!internalWaitlist&&vehicle.platform_visibility==='hidden'&&!pr.own&&!inherited){
   const grant=await first(db,`SELECT g.grant_id FROM public.vehicle_visibility_grants g
    JOIN public.recommendations r ON r.recommendation_id=g.source_recommendation_id
    WHERE g.customer_id=$1 AND g.vehicle_id=$2 AND r.listing_cycle_id=$3
      AND g.revoked_at IS NULL AND r.status='active' LIMIT 1 FOR SHARE OF g,r`,
     [customerId,vehicleId,cycleId]);
   if(!grant)return {error:'HIDDEN_WITHOUT_GRANT'};
  }
  return {vehicle,cycle,who,owner,priority:pr.own};
 }
 async function event(db,req,kind,prior,after,{employeeId=null,lockId=null,waitId=null}={}){
  await db.query(`INSERT INTO ${LOCK_SCHEMA}.events
    (request_id,event_type,actor_employee_id,old_status,new_status,resulting_lock_id,resulting_waitlist_id)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,[req.lock_request_id,kind,employeeId,prior,after,lockId,waitId]);
  await db.query(`INSERT INTO public.audit_events
    (actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at)
    VALUES($1,$2,'LockRequest',$3,$4,$5::jsonb,$6::jsonb,clock_timestamp())`,
   [kind==='created'?'customer_synthetic':employeeId===null?'system':'employee',employeeId===null?null:String(employeeId),String(req.lock_request_id),
    `f06_real_test_${kind}`,JSON.stringify({status:prior}),JSON.stringify({status:after,lockId,waitlistId:waitId})]);
 }
 async function finish(db,req,kind,{employeeId=null,lockId=null,waitId=null}={}){
  const updated=await first(db,`UPDATE public.lock_requests SET status=$2,resulting_lock_id=$3,
    resulting_waitlist_id=$4,processed_by=$5 WHERE lock_request_id=$1 AND status='pending'
    RETURNING lock_request_id`,[req.lock_request_id,kind,lockId,waitId,employeeId]);
  if(!updated)throw Error('F06_LOCK_REQUEST_STATE_RACE');
  await event(db,req,kind,req.status,kind,{employeeId,lockId,waitId});
 }
 async function waitlistResponsible(db,req,who){
  const rec=await first(db,`SELECT f.original_recommender_id employee_id
   FROM public.recommendations r JOIN public.f05_9_recommendation_facts_ci f
    ON f.recommendation_id=r.recommendation_id
   WHERE r.customer_id=$1 AND r.vehicle_id=$2 AND r.listing_cycle_id=$3
    AND r.status='active' ORDER BY r.recommendation_id DESC LIMIT 1 FOR SHARE OF r,f`,
   [req.customer_id,req.vehicle_id,req.listing_cycle_id]);
  const demand=await first(db,`SELECT responsible_employee_id employee_id FROM public.demands
   WHERE customer_id=$1 AND demand_state IN('active','paused')
   ORDER BY demand_id DESC LIMIT 1 FOR SHARE`,[req.customer_id]);
  for(const [source,id] of [['recommendation',rec?.employee_id],['demand',demand?.employee_id],['owner',who?.current_owner_employee_id]]){
   if(id&&await currentOwner(db,id))return {source,employeeId:id};
  }
  return null;
 }
 async function conflict(db,req,activeLockId){
  const expires=await first(db,"SELECT $1::timestamptz<=clock_timestamp() OR $2::timestamptz+interval '6 hours'<=clock_timestamp() past",[req.expires_at,req.created_at]);
  if(expires?.past){await finish(db,req,'expired');return {requestId:String(req.lock_request_id),status:'expired'};}
  // An existing legitimate PENDING competitor can be moved to an INTERNAL Waitlist
  // even while a Priority-origin Lock hides public vehicle details from that Customer.
  const current=await facts(db,req.customer_id,req.vehicle_id,req.listing_cycle_id,{internalWaitlist:true});
  if(current.error){await finish(db,req,'closed_not_lockable');return {requestId:String(req.lock_request_id),status:'closed_not_lockable'};}
  const lock=await first(db,'SELECT customer_id FROM public.locks WHERE lock_id=$1 FOR SHARE',[activeLockId]);
  if(!lock||String(lock.customer_id)===String(req.customer_id)){
   await finish(db,req,'closed_not_lockable');return {requestId:String(req.lock_request_id),status:'closed_not_lockable'};
  }
  const responsible=await waitlistResponsible(db,req,current.who);
  if(!responsible){await finish(db,req,'closed_not_lockable');return {requestId:String(req.lock_request_id),status:'closed_not_lockable'};}
  let wait=await first(db,`SELECT * FROM public.waitlists
   WHERE customer_id=$1 AND vehicle_id=$2 AND ended_at IS NULL ORDER BY waitlist_id LIMIT 1 FOR UPDATE`,
   [req.customer_id,req.vehicle_id]);
  if(wait&&String(wait.listing_cycle_id)!==String(req.listing_cycle_id)){
   await finish(db,req,'closed_not_lockable');return {requestId:String(req.lock_request_id),status:'closed_not_lockable'};
  }
  if(!wait){
   const id=(await first(db,`SELECT nextval('${LOCK_SCHEMA}.waitlist_ids')::bigint AS id`)).id;
   wait=await first(db,`INSERT INTO public.waitlists
    (waitlist_id,customer_id,vehicle_id,listing_cycle_id,source_lock_request_id,
     active_lock_id,responsible_employee_id,ended_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,NULL) RETURNING waitlist_id`,
    [id,req.customer_id,req.vehicle_id,req.listing_cycle_id,req.lock_request_id,activeLockId,responsible.employeeId]);
   await db.query(`INSERT INTO ${LOCK_SCHEMA}.waitlist_sources
    (waitlist_id,source_request_id,responsible_employee_id,responsible_source,queue_created_at,queue_request_id)
    VALUES($1,$2,$3,$4,$5,$6)`,[wait.waitlist_id,req.lock_request_id,responsible.employeeId,responsible.source,req.created_at,req.lock_request_id]);
  }
  await finish(db,req,'lock_conflict',{waitId:wait.waitlist_id});
  return {requestId:String(req.lock_request_id),status:'lock_conflict',waitlistId:String(wait.waitlist_id)};
 }

 return Object.freeze({
  verify:()=>verifyF06TestDatabase(pool),
  async intake({token,vehicleId,listingCycleId,idempotencyKey}={}){
   if(!validToken(token))return response(401,'TEST_CUSTOMER_IDENTITY_REQUIRED');
   if(!validId(vehicleId)||!validId(listingCycleId)||!validKey(idempotencyKey))return response(400,'INVALID_LOCK_REQUEST');
   return tx(async db=>{
    const who=await customer(db,token);
    if(!who)return response(401,'TEST_CUSTOMER_IDENTITY_REQUIRED');
    // Serialize exact key first, then Vehicle: cannot resurrect stale same-key requests.
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F06_INTAKE_KEY',idempotencyKey]);
    const vehicle=await first(db,'SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vehicleId]);
    if(!vehicle)return response(404,'VEHICLE_NOT_FOUND');
    // A Priority-origin Lock is exclusively visible to its owner; deny before the occupied status leaks.
    const hiddenLock=await first(db,`SELECT 1 FROM public.locks l
     JOIN ${LOCK_SCHEMA}.lock_snapshots s ON s.lock_id=l.lock_id
     WHERE l.vehicle_id=$1 AND l.lock_status='active'
       AND s.priority_origin_id IS NOT NULL AND l.customer_id<>$2 LIMIT 1`,[vehicleId,who.customer_id]);
    if(hiddenLock)return response(404,'LOCK_REQUEST_NOT_VISIBLE');
    const digest=sha('f06-intake:'+idempotencyKey);
    const payload=sha(JSON.stringify([String(who.customer_id),vehicleId,listingCycleId]));
    const old=await first(db,`SELECT k.*,r.status,r.created_at,r.expires_at FROM ${LOCK_SCHEMA}.request_keys k
     JOIN public.lock_requests r ON r.lock_request_id=k.request_id
     WHERE k.key_sha256=$1 FOR SHARE OF k,r`,[digest]);
    if(old){
     if(old.payload_sha256!==payload||String(old.customer_id)!==String(who.customer_id))return response(409,'LOCK_IDEMPOTENCY_COLLISION');
     if(!await currentPhone(db,who.customer_id)||who.owner_assignment_state!=='assigned'||
        !await currentOwner(db,who.current_owner_employee_id))return denied('LOCK_REPLAY_IDENTITY_REVOKED');
     // Exact-key replay must never resurrect an expired PENDING application.
     if(old.status==='pending'){
      const elapsed=await first(db,"SELECT $1::timestamptz<=clock_timestamp() OR $2::timestamptz+interval '6 hours'<=clock_timestamp() AS past",[old.expires_at,old.created_at]);
      if(elapsed.past){
       const stale=await first(db,'SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR UPDATE',[old.request_id]);
       if(stale.status==='pending')await finish(db,stale,'expired');
       return response(200,'LOCK_REQUEST_REPLAY',{requestId:String(old.request_id),state:'expired'});
      }
     }
     return response(200,'LOCK_REQUEST_REPLAY',{requestId:String(old.request_id),state:old.status});
    }
    const f=await facts(db,who.customer_id,vehicleId,listingCycleId,{lockedVehicle:vehicle});
    if(f.error)return denied(f.error);
    // Fail closed if any live public M94 request lacks our exact test-only source.
    const pending=(await db.query(`SELECT r.*,k.request_id AS trusted_request_id
     FROM public.lock_requests r
     LEFT JOIN ${LOCK_SCHEMA}.request_keys k ON k.request_id=r.lock_request_id
      AND k.customer_id=r.customer_id AND k.issuer='DISPOSABLE_TEST_ONLY'
     WHERE r.customer_id=$1 AND r.vehicle_id=$2 AND r.listing_cycle_id=$3 AND r.status='pending'
     ORDER BY r.created_at,r.lock_request_id FOR UPDATE OF r`,
     [who.customer_id,vehicleId,listingCycleId])).rows;
    for(const req of pending){
     if(!req.trusted_request_id)return denied('UNTRUSTED_PENDING_REQUEST_ISSUER');
     const expired=(await first(db,"SELECT $1::timestamptz<=clock_timestamp() OR $2::timestamptz+interval '6 hours'<=clock_timestamp() AS past",[req.expires_at,req.created_at])).past;
     if(expired)await finish(db,req,'expired');
     else return response(200,'CURRENT_PENDING_REUSED',{requestId:String(req.lock_request_id),state:'pending'});
    }
    const lock=await first(db,`SELECT lock_id FROM public.locks WHERE vehicle_id=$1
      AND lock_status='active' LIMIT 1`,[vehicleId]);
    if(lock)return response(409,'VEHICLE_ALREADY_LOCKED_USE_WAITLIST');
    const requestId=(await first(db,`SELECT nextval('${LOCK_SCHEMA}.request_ids')::bigint AS id`)).id;
    const createdAt=(await first(db,'SELECT clock_timestamp() AS now')).now;
    const created=await first(db,`INSERT INTO public.lock_requests
      (lock_request_id,customer_id,vehicle_id,listing_cycle_id,status,created_at,expires_at)
      VALUES($1,$2,$3,$4,'pending',$5,$5::timestamptz+interval '6 hours')
      RETURNING lock_request_id,expires_at`,[requestId,who.customer_id,vehicleId,listingCycleId,createdAt]);
    await db.query(`INSERT INTO ${LOCK_SCHEMA}.request_keys
     (request_id,customer_id,key_sha256,payload_sha256,issuer)
     VALUES($1,$2,$3,$4,'DISPOSABLE_TEST_ONLY')`,[requestId,who.customer_id,digest,payload]);
    await event(db,created,'created',null,'pending');
    return response(201,'LOCK_REQUEST_PENDING',{requestId:String(requestId),state:'pending',expiresAt:created.expires_at});
   });
  },
  async decide({token,requestId,decision,idempotencyKey}={}){
   if(!validToken(token))return response(401,'TEST_EMPLOYEE_IDENTITY_REQUIRED');
   if(!validId(requestId)||!['approve','reject'].includes(decision)||!validKey(idempotencyKey))return response(400,'INVALID_LOCK_DECISION');
   return tx(async db=>{
    const actor=await employee(db,token);
    if(!actor)return denied('EMPLOYEE_NOT_AUTHORIZED');
    // Request lookup is non-locking: a shared vehicle FOR UPDATE is acquired first.
    const key=sha('f06-decision:'+idempotencyKey);
    const previousReq=await first(db,`SELECT vehicle_id FROM public.lock_requests WHERE lock_request_id=$1`,[requestId]);
    if(!previousReq)return response(404,'LOCK_REQUEST_NOT_FOUND');
    const v=await first(db,'SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[previousReq.vehicle_id]);
    const req=await first(db,'SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR UPDATE',[requestId]);
    if(!v||!req)return response(404,'LOCK_REQUEST_NOT_FOUND');
    const signed=await first(db,`SELECT request_id FROM ${LOCK_SCHEMA}.request_keys
      WHERE request_id=$1 AND issuer='DISPOSABLE_TEST_ONLY' FOR SHARE`,[requestId]);
    if(!signed)return denied('UNTRUSTED_LOCK_REQUEST_ISSUER');
    const owner=await first(db,`SELECT current_owner_employee_id,owner_assignment_state FROM public.customers
      WHERE customer_id=$1 AND account_status='active' FOR SHARE`,[req.customer_id]);
    if(!owner||owner.owner_assignment_state!=='assigned')return denied('CUSTOMER_OWNER_INACTIVE');
    const team=await currentOwner(db,owner.current_owner_employee_id);
    if(!team||!await scope(db,actor.employee_id,team.team_id))return denied('LOCK_APPROVAL_SCOPE_DENIED');
    const payload=sha(JSON.stringify([String(actor.employee_id),requestId,decision]));
    const prior=await first(db,`SELECT payload_sha256,result_json FROM ${LOCK_SCHEMA}.decision_keys
      WHERE key_sha256=$1 FOR SHARE`,[key]);
    if(prior){
     if(prior.payload_sha256!==payload)return response(409,'LOCK_DECISION_IDEMPOTENCY_COLLISION');
     // An exact replay preserves the original public JSON result, rather than nesting it.
     return {status:200,body:prior.result_json};
    }
    let result;
    if(req.status!=='pending')result=response(200,'LOCK_REQUEST_TERMINAL',{requestId,state:req.status});
    else if((await first(db,"SELECT $1::timestamptz<=clock_timestamp() OR $2::timestamptz+interval '6 hours'<=clock_timestamp() AS past",[req.expires_at,req.created_at])).past){
     await finish(db,req,'expired',{employeeId:actor.employee_id});
     result=response(200,'LOCK_REQUEST_EXPIRED',{requestId,state:'expired'});
    }else if(decision==='reject'){
     await finish(db,req,'rejected',{employeeId:actor.employee_id});
     result=response(200,'LOCK_REQUEST_REJECTED',{requestId,state:'rejected'});
    }else{
     const exists=await first(db,`SELECT lock_id FROM public.locks WHERE vehicle_id=$1
       AND lock_status='active' ORDER BY lock_id LIMIT 1 FOR SHARE`,[req.vehicle_id]);
     if(exists){
      const w=await conflict(db,req,exists.lock_id);
      result=response(200,'LOCK_CONFLICT_HANDLED',{requestId,state:w.status,waitlistId:w.waitlistId??null});
     }else{
      const f=await facts(db,req.customer_id,req.vehicle_id,req.listing_cycle_id,{lockedVehicle:v});
      if(f.error){
       await finish(db,req,'closed_not_lockable',{employeeId:actor.employee_id});
       result=response(200,'LOCK_REQUEST_CLOSED',{requestId,state:'closed_not_lockable'});
      }else{
       const policy=await first(db,`SELECT initial_lock_hours,version FROM ${LOCK_SCHEMA}.policy
         WHERE policy_id=1 FOR SHARE`);
       if(!policy||!Number.isInteger(policy.initial_lock_hours))throw Error('F06_LOCK_POLICY_NOT_VERIFIED');
       const now=(await first(db,'SELECT clock_timestamp() AS now')).now;
       const price=await first(db,`SELECT price_event_id,amount_cents FROM public.vehicle_price_history
         WHERE vehicle_id=$1 AND price_kind='customer_display' AND amount_cents>0
          AND valid_from<=$2 ORDER BY valid_from DESC,price_event_id DESC LIMIT 1 FOR SHARE`,[req.vehicle_id,now]);
       const lockId=(await first(db,`SELECT nextval('${LOCK_SCHEMA}.lock_ids')::bigint AS id`)).id;
       const lock=await first(db,`INSERT INTO public.locks
        (lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,
         created_at,expires_at,source_lock_request_id)
        VALUES($1,$2,$3,$4,'active',$5,$6,$6::timestamptz+make_interval(hours=>$7),$8)
        RETURNING lock_id,expires_at`,
        [lockId,req.vehicle_id,req.customer_id,req.listing_cycle_id,f.owner.employee_id,now,policy.initial_lock_hours,req.lock_request_id]);
       const priorityId=await signConvertedPriority(db,f.priority,lockId,actor.employee_id,req);
       await db.query(`INSERT INTO ${LOCK_SCHEMA}.lock_snapshots
        (lock_id,approver_employee_id,responsible_employee_id,customer_id,price_kind,price_cents,
         source_price_event_id,initial_hours,policy_version,priority_origin_customer_id,priority_origin_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [lockId,actor.employee_id,f.owner.employee_id,req.customer_id,price?'numeric':'consultation',
         price?.amount_cents??null,price?.price_event_id??null,policy.initial_lock_hours,policy.version,
         priorityId?req.customer_id:null,priorityId]);
       await finish(db,req,'approved',{employeeId:actor.employee_id,lockId});
       if(afterLockWrite)await afterLockWrite({db,requestId,lockId});
       const contenders=(await db.query(`SELECT * FROM public.lock_requests
        WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='pending'
        ORDER BY created_at,lock_request_id FOR UPDATE`,[req.vehicle_id,req.listing_cycle_id])).rows;
       const competition=[];
       for(const c of contenders)competition.push(await conflict(db,c,lockId));
       result=response(200,'LOCK_APPROVED',{requestId,lockId:String(lockId),state:'approved',
        expiresAt:lock.expires_at,initialHours:policy.initial_lock_hours,competing:competition});
      }
     }
    }
    await db.query(`INSERT INTO ${LOCK_SCHEMA}.decision_keys
     (key_sha256,payload_sha256,employee_id,request_id,result_json)
     VALUES($1,$2,$3,$4,$5::jsonb)`,[key,payload,actor.employee_id,requestId,JSON.stringify(result.body)]);
    return result;
   });
  },
  // 客户安全状态仅返回该客户自身的申请及车辆 Lock 事实，不展示责任人、价格或其他客户。
  async project({token,requestId}={}){
   if(!validToken(token)||!validId(requestId))return response(401,'TEST_CUSTOMER_IDENTITY_REQUIRED');
   return tx(async db=>{
    const who=await customer(db,token);
    if(!who)return response(401,'TEST_CUSTOMER_IDENTITY_REQUIRED');
    const req=await first(db,`SELECT lock_request_id,vehicle_id,listing_cycle_id,status,expires_at
      FROM public.lock_requests WHERE lock_request_id=$1 AND customer_id=$2 FOR SHARE`,[requestId,who.customer_id]);
    if(!req)return response(404,'LOCK_REQUEST_NOT_FOUND');
    const safe=await facts(db,who.customer_id,req.vehicle_id,req.listing_cycle_id);
    if(safe.error)return response(404,'LOCK_REQUEST_NOT_VISIBLE');
    const p=await priority(db,who.customer_id,req.vehicle_id,req.listing_cycle_id);
    const activeLock=await first(db,`SELECT l.lock_id,l.customer_id,l.lock_status,l.expires_at,s.priority_origin_id
      FROM public.locks l LEFT JOIN ${LOCK_SCHEMA}.lock_snapshots s ON s.lock_id=l.lock_id
      WHERE l.vehicle_id=$1 AND l.lock_status='active' ORDER BY l.lock_id LIMIT 1 FOR SHARE OF l`,[req.vehicle_id]);
    if(p.other||(activeLock?.priority_origin_id&&String(activeLock.customer_id)!==String(who.customer_id)))
     return response(404,'LOCK_REQUEST_NOT_VISIBLE');
    const ownLock=await first(db,`SELECT l.lock_id,l.lock_status,l.expires_at
      FROM public.locks l LEFT JOIN ${LOCK_SCHEMA}.lock_snapshots s ON s.lock_id=l.lock_id
      WHERE l.vehicle_id=$1 AND l.listing_cycle_id=$2 AND l.customer_id=$3
      ORDER BY l.lock_id DESC LIMIT 1 FOR SHARE OF l`,
      [req.vehicle_id,req.listing_cycle_id,who.customer_id]);
    let ownLockExtended=false;
    const lifecycleSidecar=await first(db,"SELECT to_regclass('f06_real_lock_test.lock_lifecycle_events') IS NOT NULL AS ready");
    if(lifecycleSidecar?.ready&&ownLock){
     const extension=await first(db,`SELECT 1 FROM f06_real_lock_test.lock_lifecycle_events
       WHERE lock_id=$1 AND action='extend' LIMIT 1 FOR SHARE`,[ownLock.lock_id]);
     ownLockExtended=!!extension;
    }
    return response(200,'LOCK_CUSTOMER_SAFE_STATUS',{requestId,status:req.status,
     vehicleId:String(req.vehicle_id),lockStatus:activeLock?'locked':'available',
     ownLock:!!activeLock&&String(activeLock.customer_id)===String(who.customer_id),
     ownLockStatus:ownLock?.lock_status??null,ownLockExpiresAt:ownLock?.expires_at??null,
     ownLockExtended});
   });
  }
 });
}