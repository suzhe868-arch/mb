// F06-1 PDM18: CI-only real signed PG16 LockRequest/Lock/Waitlist.
// Customer phone, Employee PC and production payment issuers are NOT wired.
import {createHash} from 'node:crypto';
import {verify,gate} from './migration.mjs';
const PROOF='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const ACCEPT=['sales','manager','store_head'];
const id=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
const ok=(code,more={})=>({allowed:true,code,...more});
const no=(code,more={})=>({allowed:false,code,...more});
const sha=x=>createHash('sha256').update(x).digest('hex');
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const one=async(c,sql,params=[])=> (await c.query(sql,params)).rows[0];
const SALE=v=>!!v&&!v.archived_at&&
 ((v.source_type==='wholesale'&&v.source_sale_status==='active')||
 (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
const lookup=async(c,table,idname,n)=>one(c,'SELECT * FROM public.'+table+' WHERE '+idname+'=$1',[n]);
function identityGuard(p,needEmployee=false){gate();if(!id(p?.requestId)&&needEmployee)return false;return true}
async function phone(c,customer){
 const f=await one(c,"SELECT phone_fact_id FROM public.customer_phone_facts WHERE customer_id=$1 "+
 "AND valid_from<=clock_timestamp() AND ended_at IS NULL ORDER BY phone_fact_id LIMIT 1 FOR SHARE",[customer]);
 return !!f;
}
async function origin(c,owner){
 return one(c,"SELECT e.employee_id,t.team_id,t.store_id,r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=e.store_id "+
 "JOIN public.stores s ON s.store_id=t.store_id "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN('sales','manager','store_head') "+
 "AND t.team_status='active' AND s.status='active' AND m.valid_from<=clock_timestamp() "+
 "AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "ORDER BY t.team_id LIMIT 1 FOR SHARE OF e,m,t,s,r",[owner]);
}
async function scope(c,actor,team){
 if(!id(actor?.employee_id)||actor.principal_kind!=='employee'||actor.system_admin_id!==null||
 !ACCEPT.includes(actor.role_code)||actor.credential_state!=='enabled'||actor.subject_status!=='active'||
 actor.force_password_change!==false)return false;
 const result=await one(c,"SELECT e.employee_id FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='lock.ci.approve' "+
 "JOIN public.employee_permission_overrides ov ON ov.permission_id=p.permission_id AND ov.employee_id=e.employee_id "+
 "JOIN public.employee_capability_scope_bindings b ON b.permission_id=p.permission_id AND b.employee_id=e.employee_id "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id AND m.team_id=$2 "+
 "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN('sales','manager','store_head') "+
 "AND ov.decision='allow' AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (sc.ended_at IS NULL OR sc.ended_at>clock_timestamp()) "+
 "AND t.team_status='active' AND st.status='active' AND "+
 "((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())) OR "+
 "(sc.scope_kind='store' AND sc.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,ov,b,sc,t,st,m",[actor.employee_id,team]);
 return !!result;
}
async function priority(c,customer,vehicle,cycle){
 const p=await one(c,"SELECT priority_id,customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,"+
 "source_match_result_id,source_signature,expires_at FROM public.f05_8_priority_ci "+
 "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>clock_timestamp() "+
 "LIMIT 1 FOR SHARE",[vehicle,cycle]);
 return {rival:!!p&&String(p.customer_id)!==String(customer),same:p&&String(p.customer_id)===String(customer)?p:null};
}
// Signed v24 trigger performs the SAME-TX state change on public.locks INSERT.
// Fail closed unless exact original Priority became ended/converted_to_lock;
// record a signed immutable Priority event with the real approver and lock.
async function closeSignedPriorityForLock(c,original,lockId,approver){
 if(!original)return null;
 const p=await one(c,"SELECT p.* FROM public.f05_8_priority_ci p "+
 "JOIN public.f05_7_result_versions_ci r ON r.result_id=p.source_match_result_id "+
 "AND r.demand_id=p.trigger_demand_id AND r.vehicle_id=p.vehicle_id "+
 "AND r.listing_cycle_id=p.listing_cycle_id AND r.source_signature=p.source_signature "+
 "WHERE p.priority_id=$1 FOR SHARE",[original.priority_id]);
 if(!p||p.status!=='ended'||p.ended_reason!=='converted_to_lock'||!p.ended_at||
  String(p.customer_id)!==String(original.customer_id))throw Error('F06_1_PRIORITY_NOT_ATOMICALLY_CONVERTED');
 const eventKey='f06-1-priority-to-lock:'+p.priority_id+':'+lockId;
 await c.query("INSERT INTO public.f05_8_events_ci(priority_id,customer_id,vehicle_id,event_kind,actor_employee_id,before_json,after_json,event_key) "+
 "VALUES($1,$2,$3,'ended',$4,$5::jsonb,$6::jsonb,$7)",
 [p.priority_id,p.customer_id,p.vehicle_id,approver,
 JSON.stringify({status:'active',triggerDemandId:p.trigger_demand_id,matchResultId:p.source_match_result_id}),
 JSON.stringify({status:'ended',reason:'converted_to_lock',lockId,endedAt:p.ended_at}),eventKey]);
 return Number(p.priority_id);
}
async function access(c,customer,vehicle,cycle,{checkHidden=true}={}){
 // Caller holds Vehicle FOR UPDATE before all checks, even during two-backend competition.
 const v=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1',[vehicle]);
 const cy=await one(c,'SELECT * FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',[vehicle,cycle]);
 const who=await one(c,'SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[customer]);
 if(!v||!cy||cy.ended_at||!SALE(v))return no('F06_1_VEHICLE_NOT_CURRENT_SALEABLE');
 if(!who||who.account_status!=='active')return no('F06_1_CUSTOMER_DISABLED');
 if(!await phone(c,customer))return no('F06_1_NO_SYNTHETIC_CURRENT_PHONE');
 if(!id(who.current_owner_employee_id)||who.owner_assignment_state!=='assigned')
  return no('F06_1_SIGNED_OWNER_REQUIRED');
 const o=await origin(c,who.current_owner_employee_id);
 if(!o)return no('F06_1_RESPONSIBLE_NOT_CURRENT');
 const pri=await priority(c,customer,vehicle,cycle);
 if(pri.rival)return no('F06_1_OTHER_CUSTOMER_PRIORITY_DENIED');
 if(checkHidden&&v.platform_visibility==='hidden'&&!pri.same){
  const g=await one(c,"SELECT g.grant_id FROM public.vehicle_visibility_grants g "+
   "JOIN public.recommendations r ON r.recommendation_id=g.source_recommendation_id "+
   "WHERE g.customer_id=$1 AND g.vehicle_id=$2 AND r.listing_cycle_id=$3 "+
   "AND g.revoked_at IS NULL AND r.status='active' LIMIT 1 FOR SHARE OF g,r",[customer,vehicle,cycle]);
  if(!g)return no('F06_1_HIDDEN_WITHOUT_SIGNED_GRANT');
 }
 return ok('F06_1_VALID_SIGNED_FACTS',{vehicle:v,cycle:cy,customer:who,origin:o,priority:pri.same});
}
async function event(c,req,kind,actorKind,actorId,keySuffix,priorStatus,finalStatus,lock=null,wait=null){
 const ev=sha(kind+':'+req+':'+keySuffix);
 await c.query("INSERT INTO f06_1_lock_ci.events(event_key_sha256,request_id,event_kind,actor_kind,actor_employee_id,prior_status,final_status,resulting_lock_id,resulting_waitlist_id) "+
 "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(event_key_sha256) DO NOTHING",
 [ev,req,kind,actorKind,actorId,priorStatus,finalStatus,lock,wait]);
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) "+
 "VALUES($1,$2,'LockRequest',$3,$4,$5::jsonb,$6::jsonb,clock_timestamp())",
 [actorKind,actorId===null?null:String(actorId),String(req),'f06_1_ci_'+kind,
 JSON.stringify({status:priorStatus}),JSON.stringify({status:finalStatus,resultingLockId:lock,resultingWaitlistId:wait})]);
}
async function finish(c,req,status,actorKind,actorId,suffix,wait=null){
 await c.query("UPDATE public.lock_requests SET status=$2,resulting_waitlist_id=$3,processed_by=$4 WHERE lock_request_id=$1 AND status='pending'",
 [req.lock_request_id,status,wait,actorKind==='employee'?actorId:null]);
 await event(c,req.lock_request_id,status,actorKind,actorId,suffix,req.status,status,null,wait);
}
// Synthetic Customer-only current PG16 projection; production issuer remains closed.
export async function customerLockProjectionCI(c,p={}){
 gate();
 if(!id(p.customerId)||!id(p.vehicleId)||!id(p.listingCycleId)||p.syntheticCustomerProof!==PROOF)
  return no('F06_1_CUSTOMER_PROJECTION_ISSUER_REQUIRED');
 await verify(c);
 await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 try{
  const who=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1',[p.customerId]);
  if(!who||who.account_status!=='active'){
   await c.query('COMMIT');return no('F06_1_CUSTOMER_PROJECTION_ACCOUNT_DENIED');
  }
  const v=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1',[p.vehicleId]);
  const cy=await one(c,'SELECT ended_at FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2',[p.vehicleId,p.listingCycleId]);
  if(!v||!cy||cy.ended_at||!SALE(v)){
   await c.query('COMMIT');return no('F06_1_CUSTOMER_PROJECTION_SOURCE_UNAVAILABLE');
  }
  const activePriority=await one(c,"SELECT customer_id FROM public.f05_8_priority_ci "+
   "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>clock_timestamp() LIMIT 1",
   [p.vehicleId,p.listingCycleId]);
  const lock=await one(c,"SELECT l.lock_id,l.customer_id,l.lock_status,s.priority_origin_id,"+
   "s.priority_origin_customer_id FROM public.locks l "+
   "LEFT JOIN f06_1_lock_ci.lock_snapshots s ON s.lock_id=l.lock_id "+
   "WHERE l.vehicle_id=$1 AND l.lock_status='active' ORDER BY l.lock_id LIMIT 1",[p.vehicleId]);
  if(lock?.priority_origin_id!==null&&lock?.priority_origin_id!==undefined){
   const signed=await one(c,"SELECT p.priority_id FROM public.f05_8_priority_ci p "+
    "JOIN public.f05_8_events_ci e ON e.priority_id=p.priority_id AND e.event_kind='ended' AND e.event_key=$2 "+
    "WHERE p.priority_id=$1 AND p.status='ended' AND p.ended_reason='converted_to_lock' "+
    "AND p.customer_id=$3 AND p.vehicle_id=$4 AND p.listing_cycle_id=$5",
    [lock.priority_origin_id,'f06-1-priority-to-lock:'+lock.priority_origin_id+':'+lock.lock_id,
     lock.customer_id,p.vehicleId,p.listingCycleId]);
   if(!signed||String(lock.priority_origin_customer_id)!==String(lock.customer_id)){
    await c.query('COMMIT');return no('F06_1_PRIORITY_LOCK_ORIGIN_UNVERIFIED');
   }
   if(String(lock.customer_id)!==String(p.customerId)){
    await c.query('COMMIT');return no('F06_1_OTHER_CUSTOMER_PRIORITY_ORIGIN_LOCK_DENIED',{listVisible:false,detailVisible:false});
   }
  }else if(activePriority&&String(activePriority.customer_id)!==String(p.customerId)){
   await c.query('COMMIT');return no('F06_1_OTHER_CUSTOMER_ACTIVE_PRIORITY_DENIED',{listVisible:false,detailVisible:false});
  }
  const ownPriority=lock?.priority_origin_id!==null&&lock?.priority_origin_id!==undefined&&
   String(lock.customer_id)===String(p.customerId);
  let visible=v.platform_visibility==='visible'||ownPriority||
   !!(activePriority&&String(activePriority.customer_id)===String(p.customerId));
  if(!visible){
   const g=await one(c,"SELECT g.grant_id FROM public.vehicle_visibility_grants g "+
    "JOIN public.recommendations r ON r.recommendation_id=g.source_recommendation_id "+
    "WHERE g.customer_id=$1 AND g.vehicle_id=$2 AND r.listing_cycle_id=$3 "+
    "AND g.revoked_at IS NULL AND r.status='active' LIMIT 1",
    [p.customerId,p.vehicleId,p.listingCycleId]);
   visible=!!g;
  }
  const response=visible?ok('F06_1_CUSTOMER_VEHICLE_SAFE_PROJECTION',
   {listVisible:true,detailVisible:true,lockStatus:lock?'locked':'available',canCreateAnotherActiveLock:!lock}):
   no('F06_1_CUSTOMER_UNDERLYING_VISIBILITY_DENIED',{listVisible:false,detailVisible:false});
  await c.query('COMMIT');return response;
 }catch(e){await c.query('ROLLBACK');throw e}
}
export function productionIssuerDeny(){return no('F06_1_PRODUCTION_LOCK_ISSUERS_NOT_WIRED')}
export async function intakeCI(c,p={}){
 gate();
 if(![p.customerId,p.vehicleId,p.listingCycleId].every(id)||p.syntheticPhoneConsent!==PROOF||!key(p.requestKey))
  return no('F06_1_CUSTOMER_OR_PHONE_PROOF_REQUIRED');
 await verify(c);
 await c.query('BEGIN');
 try{
  await c.query("SET LOCAL lock_timeout='1500ms'");
  // One physical Vehicle row is the canonical cross-request and cross-cycle mutex.
  const vehicle=await one(c,'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[p.vehicleId]);
  if(!vehicle){await c.query('ROLLBACK');return no('F06_1_VEHICLE_MISSING')}
  const digest=sha('intake:'+p.customerId+':'+p.requestKey);
  const replay=await one(c,"SELECT r.* FROM f06_1_lock_ci.request_keys k JOIN public.lock_requests r ON r.lock_request_id=k.request_id WHERE k.request_key_sha256=$1",[digest]);
  if(replay){
   const actor=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[p.customerId]);
   if(actor?.account_status!=='active'||!await phone(c,p.customerId)){
    await c.query('ROLLBACK');return no('F06_1_CUSTOMER_OR_PHONE_REVOKED_REPLAY_DENIED');
   }
   await c.query('COMMIT');return ok('F06_1_REQUEST_KEY_REPLAY',{requestId:Number(replay.lock_request_id),status:replay.status});
  }
  const facts=await access(c,p.customerId,p.vehicleId,p.listingCycleId);
  if(!facts.allowed){await c.query('ROLLBACK');return facts}
  const older=(await c.query("SELECT * FROM public.lock_requests WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status='pending' ORDER BY created_at,lock_request_id FOR UPDATE",
   [p.customerId,p.vehicleId,p.listingCycleId])).rows;
  for(const old of older){
   const past=(await one(c,'SELECT $1::timestamptz<=clock_timestamp() past',[old.expires_at])).past;
   if(past){await finish(c,old,'expired','system',null,'pending-expired-intake')}else{
    await c.query('COMMIT');return ok('F06_1_CURRENT_PENDING_REUSED',{requestId:Number(old.lock_request_id),status:'pending'})
   }
  }
  const lock=await one(c,"SELECT lock_id FROM public.locks WHERE vehicle_id=$1 AND lock_status='active' LIMIT 1",[p.vehicleId]);
  if(lock){await c.query('ROLLBACK');return no('F06_1_ACTIVE_LOCK_CUSTOMER_NEEDS_WAITLIST_NOT_REQUEST')}
  const newId=Number((await one(c,"SELECT nextval('f06_1_lock_ci.request_ids') id")).id);
  const req=await one(c,"INSERT INTO public.lock_requests(lock_request_id,customer_id,vehicle_id,listing_cycle_id,status,created_at,expires_at) "+
  "VALUES($1,$2,$3,$4,'pending',clock_timestamp(),clock_timestamp()+interval '6 hours') RETURNING *",
  [newId,p.customerId,p.vehicleId,p.listingCycleId]);
  await c.query('INSERT INTO f06_1_lock_ci.request_keys(request_id,customer_id,request_key_sha256,phone_evidence) VALUES($1,$2,$3,$4)',
   [newId,p.customerId,digest,PROOF]);
  await event(c,newId,'created','customer_synthetic',null,p.requestKey,null,'pending');
  await c.query('COMMIT');
  return ok('F06_1_PENDING_CREATED',{requestId:newId,status:'pending',createdAt:req.created_at,expiresAt:req.expires_at});
 }catch(e){await c.query('ROLLBACK');if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_1_REQUEST_CONTENTION_RETRY');throw e}
}
async function waitlistResponsible(c,req,who){
 const recommendation=await one(c,"SELECT f.original_recommender_id employee_id FROM public.recommendations r "+
 "JOIN public.f05_9_recommendation_facts_ci f ON f.recommendation_id=r.recommendation_id "+
 "WHERE r.customer_id=$1 AND r.vehicle_id=$2 AND r.listing_cycle_id=$3 AND r.status='active' "+
 "ORDER BY r.recommendation_id DESC LIMIT 1 FOR SHARE OF r,f",
 [req.customer_id,req.vehicle_id,req.listing_cycle_id]);
 const demand=await one(c,"SELECT responsible_employee_id employee_id FROM public.demands "+
 "WHERE customer_id=$1 AND demand_state IN('active','paused') ORDER BY demand_id DESC LIMIT 1 FOR SHARE",[req.customer_id]);
 const candidates=[['recommendation',recommendation?.employee_id],['demand',demand?.employee_id],
  ['owner',who.current_owner_employee_id]];
 for(const [source,idCandidate] of candidates){
  if(!id(idCandidate))continue;
  const org=await origin(c,idCandidate);
  if(org)return {employeeId:Number(idCandidate),source};
 }
 return null;
}
async function conflict(c,req,lock,actorId,suffix){
 const actual=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1',[req.vehicle_id]);
 const cycle=await one(c,'SELECT ended_at FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',[req.vehicle_id,req.listing_cycle_id]);
 const currentLock=await one(c,'SELECT customer_id FROM public.locks WHERE lock_id=$1 FOR SHARE',[lock]);
 if(!SALE(actual)||!cycle||cycle.ended_at||String(currentLock?.customer_id)===String(req.customer_id)){
  await finish(c,req,'closed_not_lockable','system',null,suffix);
  return 'closed_not_lockable';
 }
 const current=(await one(c,'SELECT account_status,current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=$1 FOR SHARE',[req.customer_id]));
 const valid=current?.account_status==='active'&&current.owner_assignment_state==='assigned'&&id(current.current_owner_employee_id)&&
  await phone(c,req.customer_id)&&await origin(c,current.current_owner_employee_id);
 const expired=(await one(c,'SELECT $1::timestamptz<=clock_timestamp() past',[req.expires_at])).past;
 if(expired){await finish(c,req,'expired','system',null,suffix);return 'expired'}
 if(!valid){await finish(c,req,'closed_not_lockable','system',null,suffix);return 'closed_not_lockable'}
 const responsible=await waitlistResponsible(c,req,current);
 if(!responsible){await finish(c,req,'closed_not_lockable','system',null,suffix);return 'closed_not_lockable'}
 let wait=await one(c,"SELECT waitlist_id FROM public.waitlists WHERE customer_id=$1 AND vehicle_id=$2 AND ended_at IS NULL LIMIT 1 FOR UPDATE",
 [req.customer_id,req.vehicle_id]);
 if(wait){
  const existing=await lookup(c,'waitlists','waitlist_id',wait.waitlist_id);
  if(String(existing.listing_cycle_id)!==String(req.listing_cycle_id)){
   await finish(c,req,'closed_not_lockable','system',null,suffix);return 'closed_not_lockable'
  }
 }else{
  const waitId=Number((await one(c,"SELECT nextval('f06_1_lock_ci.waitlist_ids') id")).id);
  wait=await one(c,"INSERT INTO public.waitlists(waitlist_id,customer_id,vehicle_id,listing_cycle_id,source_lock_request_id,active_lock_id,responsible_employee_id,ended_at) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,NULL) RETURNING waitlist_id",
   [waitId,req.customer_id,req.vehicle_id,req.listing_cycle_id,req.lock_request_id,lock,responsible.employeeId]);
  await c.query('INSERT INTO f06_1_lock_ci.waitlist_sources(waitlist_id,source_request_id,queue_created_at,queue_request_id,responsible_employee_id,responsible_origin) VALUES($1,$2,$3,$4,$5,$6)',
   [waitId,req.lock_request_id,req.created_at,req.lock_request_id,responsible.employeeId,responsible.source]);
 }
 await finish(c,req,'lock_conflict','system',null,suffix,wait.waitlist_id);
 return 'lock_conflict';
}
export async function decisionCI(auth,token,p={}){
 gate();
 if(!id(p.requestId)||!key(p.requestKey)||!['approve','reject'].includes(p.action))
  return no('F06_1_BAD_DECISION_ARGUMENTS');
 // The original F03 withSession owns BEGIN/COMMIT. Never nest an unchecked manual SQL transaction.
 const result=await auth.withSession(token,async(c,a)=>{
  if(a.principal_kind!=='employee'||a.system_admin_id!==null||!ACCEPT.includes(a.role_code)||a.force_password_change!==false||
   a.credential_state!=='enabled'||a.subject_status!=='active')
   return no('F06_1_ACTOR_NOT_TRUSTED_BUSINESS_EMPLOYEE');
  await verify(c);
  await c.query("SET LOCAL lock_timeout='1800ms'");
  let req=await lookup(c,'lock_requests','lock_request_id',p.requestId);
  if(!req)return no('F06_1_REQUEST_NOT_FOUND');
  // Deliberately lock Vehicle before Request; all writers share the same lock order.
  const vehicle=await one(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[req.vehicle_id]);
  req=await one(c,'SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR UPDATE',[p.requestId]);
  if(!vehicle||!req)return no('F06_1_REQUEST_OR_VEHICLE_MISSING');
  const provenance=await one(c,'SELECT request_id FROM f06_1_lock_ci.request_keys WHERE request_id=$1 FOR SHARE',[req.lock_request_id]);
  if(!provenance)return no('F06_1_OLD_UNTRUSTED_REQUEST_ISSUER');
  const owner=await one(c,'SELECT current_owner_employee_id,owner_assignment_state,account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[req.customer_id]);
  const org=owner&&id(owner.current_owner_employee_id)?await origin(c,owner.current_owner_employee_id):null;
  if(!org||!await scope(c,a,org.team_id))return no('F06_1_EMPLOYEE_PERMISSION_SCOPE_DENIED');
  if(req.status!=='pending')return ok('F06_1_TERMINAL_REPLAY',{backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid,requestId:Number(req.lock_request_id),status:req.status,
   lockId:req.resulting_lock_id?Number(req.resulting_lock_id):null,
   waitlistId:req.resulting_waitlist_id?Number(req.resulting_waitlist_id):null});
  const past=(await one(c,'SELECT $1::timestamptz<=clock_timestamp() past',[req.expires_at])).past;
  if(past){await finish(c,req,'expired','employee',a.employee_id,p.requestKey);return ok('F06_1_REQUEST_EXPIRED',{requestId:Number(req.lock_request_id),status:'expired'})}
  if(p.action==='reject'){await finish(c,req,'rejected','employee',a.employee_id,p.requestKey);return ok('F06_1_REJECTED',{requestId:Number(req.lock_request_id),status:'rejected'})}
  const active=await one(c,"SELECT lock_id FROM public.locks WHERE vehicle_id=$1 AND lock_status='active' ORDER BY lock_id LIMIT 1 FOR SHARE",[req.vehicle_id]);
  if(active){
   const result=await conflict(c,req,active.lock_id,a.employee_id,p.requestKey);
   return ok('F06_1_ALREADY_LOCKED_'+result.toUpperCase(),{requestId:Number(req.lock_request_id),status:result});
  }
  const v=await access(c,req.customer_id,req.vehicle_id,req.listing_cycle_id);
  if(!v.allowed){
   await finish(c,req,'closed_not_lockable','employee',a.employee_id,p.requestKey);
   return ok('F06_1_CLOSED_NOT_LOCKABLE',{requestId:Number(req.lock_request_id),reason:v.code,status:'closed_not_lockable'});
  }
  // Real PG clock / price are read at the approval boundary; no amount=0 fallback.
  const now=await one(c,'SELECT clock_timestamp() now');
  const pol=await one(c,'SELECT lock_hours,policy_version FROM f06_1_lock_ci.policy WHERE policy_id=1 FOR SHARE');
  const price=await one(c,"SELECT price_event_id,amount_cents FROM public.vehicle_price_history WHERE vehicle_id=$1 AND price_kind='customer_display' "+
   "AND amount_cents>0 AND valid_from<=$2 ORDER BY valid_from DESC,price_event_id DESC LIMIT 1 FOR SHARE",
   [req.vehicle_id,now.now]);
  const snapshotPrice=price?'numeric':'consultation';
  const lockId=Number((await one(c,"SELECT nextval('f06_1_lock_ci.lock_ids') id")).id);
  const lock=await one(c,"INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at,source_lock_request_id) "+
   "VALUES($1,$2,$3,$4,'active',$5,$6,$6::timestamptz+make_interval(hours=>$7),$8) RETURNING lock_id,created_at,expires_at",
   [lockId,req.vehicle_id,req.customer_id,req.listing_cycle_id,Number(v.origin.employee_id),now.now,pol.lock_hours,req.lock_request_id]);
  const signedPriorityId=await closeSignedPriorityForLock(c,v.priority,lockId,a.employee_id);
  await c.query("INSERT INTO f06_1_lock_ci.lock_snapshots(lock_id,approver_employee_id,responsible_employee_id,customer_id,price_kind,price_cents,source_price_event_id,initial_hours,policy_version,priority_origin_customer_id,priority_origin_id) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
   [lockId,a.employee_id,v.origin.employee_id,req.customer_id,snapshotPrice,price?.amount_cents??null,
    price?.price_event_id??null,pol.lock_hours,pol.policy_version,signedPriorityId?req.customer_id:null,signedPriorityId]);
  await c.query("UPDATE public.lock_requests SET status='approved',resulting_lock_id=$2,processed_by=$3 WHERE lock_request_id=$1 AND status='pending'",
   [req.lock_request_id,lockId,a.employee_id]);
  await event(c,req.lock_request_id,'approved','employee',a.employee_id,p.requestKey,req.status,'approved',lockId,null);
  if(p.testCheckpoint==='AFTER_PRIORITY_END_EVENT_THROW'&&process.env.GITHUB_ACTIONS==='true')
    throw Object.assign(new Error('F06_1_INJECTED_PRIORITY_ATOMIC_ROLLBACK'),{code:'F06_1_INJECTED_PRIORITY_ATOMIC_ROLLBACK'});
  if(p.testCheckpoint==='AFTER_LOCK_WRITE_THROW'&&process.env.GITHUB_ACTIONS==='true')
    throw Object.assign(new Error('F06_1_INJECTED_TX_ROLLBACK'),{code:'F06_1_INJECTED_TX_ROLLBACK'});
  const others=(await c.query("SELECT * FROM public.lock_requests WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='pending' ORDER BY created_at,lock_request_id FOR UPDATE",
   [req.vehicle_id,req.listing_cycle_id])).rows;
  const outcomes=[];
  for(const other of others)outcomes.push({requestId:Number(other.lock_request_id),
   outcome:await conflict(c,other,lockId,a.employee_id,p.requestKey)});
  return ok('F06_1_APPROVED_ATOMIC_LOCK',{requestId:Number(req.lock_request_id),lockId,approverEmployeeId:Number(a.employee_id),
   responsibleEmployeeId:Number(v.origin.employee_id),priceKind:snapshotPrice,initialHours:pol.lock_hours,
   policyVersion:pol.policy_version,priorityOrigin:!!signedPriorityId,priorityOriginId:signedPriorityId,expiresAt:lock.expires_at,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid,
   competing:outcomes});
 },{normalOnly:true});
 return result||no('F06_1_SIGNED_SESSION_DENIED');
}
