// PDM17 isolated CI business carrier, no public production issuer.
import {connect,gate,verify} from './migration.mjs';
const requestObjects=new WeakSet();
const valid=n=>Number.isSafeInteger(Number(n))&&Number(n)>0;
const key=s=>typeof s==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(s);
const deny=(code)=>({allowed:false,code});
const ok=(code,extra={})=>({allowed:true,code,syntheticCIOnly:true,...extra});
const row=async(c,sql,args=[])=> (await c.query(sql,args)).rows[0];
const now="statement_timestamp()";
export function syntheticServiceRequest(customerId){
 gate();if(!valid(customerId))throw Error('D1_BAD_SYNTHETIC_CUSTOMER');
 const obj=Object.freeze({customerId,source:'CI_SYNTHETIC_CUSTOMER_SERVICE_NOT_PRODUCTION'});
 requestObjects.add(obj);return obj;
}
async function present(c,actor){
 if(actor?.principal_kind!=='employee'||actor.system_admin_id!=null||
    actor.subject_status!=='active'||actor.credential_state!=='enabled'||
    actor.force_password_change||!['sales','manager','store_head'].includes(actor.role_code))
   return null;
 const e=await row(c,'SELECT employee_id,store_id,main_role_id,employment_status,receiving_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[actor.employee_id]);
 return e?.employment_status==='active'?{...e,role:actor.role_code}:null;
}
async function permit(c,e,permissionCode,teamId,storeId){
 const yes=await row(c,"SELECT EXISTS(SELECT 1 FROM public.permissions p "+
  "JOIN public.employee_permission_overrides ov ON ov.permission_id=p.permission_id AND ov.employee_id=$1 "+
  "JOIN public.employee_capability_scope_bindings b ON b.permission_id=p.permission_id AND b.employee_id=$1 "+
  "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=$1 "+
  "WHERE p.permission_code=$2 AND ov.decision='allow' "+
  "AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
  "AND sc.ended_at IS NULL AND ((sc.scope_kind='team' AND sc.scope_reference_id=$3) "+
  "OR (sc.scope_kind='store' AND sc.scope_reference_id=$4 AND $5 IN('manager','store_head'))) "+
  "FOR SHARE OF p,ov,b,sc) yes",[e.employee_id,permissionCode,teamId,storeId,e.role]);
 return yes?.yes===true;
}
async function target(c,e,teamId,storeId,{receiving=false}={}){
 if(!e||e.employment_status!=='active'||!['sales','manager','store_head'].includes(e.role)||
    Number(e.store_id)!==Number(storeId))return false;
 const member=await row(c,"SELECT m.employee_id FROM public.employee_team_memberships m "+
 "JOIN public.teams t ON t.team_id=m.team_id AND t.team_status='active' "+
 "JOIN public.stores s ON s.store_id=t.store_id AND s.status='active' "+
 "WHERE m.employee_id=$1 AND m.team_id=$2 AND m.valid_from<=statement_timestamp() "+
 "AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) FOR SHARE OF m,t,s",
 [e.employee_id,teamId]);
 if(!member)return false;
 if(receiving){
  const q=await row(c,"SELECT eligible FROM public.employee_receiving_eligibility WHERE employee_id=$1 FOR SHARE",[e.employee_id]);
  if(!q?.eligible||e.receiving_status!=='receiving')return false;
 }
 return true;
}
async function protection(c,customerId,cycle){
 if(cycle.protective_hold)return 'D1_PROTECTED_SOURCE';
 // Conservative real signed blockers; an open obligation requires separate PDM17 governance.
 for(const [tab,field,cond] of [
  ['locks','customer_id',"lock_status='active'"],
  ['transactions','customer_id',"status='in_progress'"],
  ['consultations','customer_id',"status IN ('pending','processing')"],
  ['demands','customer_id',"demand_state IN ('active','paused')"],
  ['find_car_applications','customer_id',"status='pending'"],
  ['waitlists','customer_id',"ended_at IS NULL"],
  ['crm_followup_tasks','customer_id',"task_state NOT IN ('completed','cancelled','closed','done')"],
  ['priority_leases','customer_id',"status='active'"]]){
  const x=await row(c,'SELECT 1 FROM public.'+tab+' WHERE '+field+'=$1 AND '+cond+' LIMIT 1 FOR SHARE',[customerId]);
  if(x)return 'D1_UNRESOLVED_SIGNED_PROTECTION_'+tab;
 }
 return null;
}
async function acquire(c,{customerId,requestKey,mode,employeeId,actorEmployeeId=null,permissionCode=null,receiving=false}){
 const cu=await row(c,'SELECT customer_id,current_owner_employee_id,owner_assignment_state,account_status FROM public.customers WHERE customer_id=$1 FOR UPDATE',[customerId]);
 if(!cu||cu.account_status!=='active')return deny('D1_CUSTOMER_INACTIVE_OR_MISSING');
 const pool=await row(c,'SELECT * FROM d1_owner_ci.pool_cycles WHERE customer_id=$1 ORDER BY cycle_id DESC LIMIT 1 FOR UPDATE',[customerId]);
 if(!pool)return deny('D1_NOT_FORMAL_POOL_SOURCE');
 const prior=await row(c,'SELECT * FROM d1_owner_ci.receipts WHERE request_key=$1 FOR SHARE',[requestKey]);
 if(prior)return Number(prior.customer_id)===Number(customerId)&&Number(prior.new_owner_id)===Number(employeeId)&&prior.mode===mode?
  ok('D1_IDEMPOTENT',{ownerId:Number(prior.new_owner_id),receiptId:Number(prior.receipt_id),created:false}):deny('D1_IDEMPOTENCY_COLLISION');
 if(pool.state!=='in_pool'||cu.current_owner_employee_id!==null||cu.owner_assignment_state==='assigned')
  return deny('D1_NOT_UNOWNED_ACTIVE_PUBLIC_POOL');
 const team=await row(c,"SELECT t.team_id,t.store_id FROM public.teams t JOIN public.stores s ON s.store_id=t.store_id "+
  "WHERE t.team_id=$1 AND t.team_status='active' AND s.status='active' FOR SHARE OF t,s",[pool.team_id]);
 if(!team)return deny('D1_POOL_TEAM_INACTIVE');
 const protectedCode=await protection(c,customerId,pool);
 if(protectedCode)return deny(protectedCode);
 const e=await row(c,'SELECT e.employee_id,e.store_id,e.employment_status,e.receiving_status,r.role_code role FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR SHARE OF e,r',[employeeId]);
 if(!await target(c,e,team.team_id,team.store_id,{receiving}))return deny('D1_TARGET_NOT_CURRENT_ELIGIBLE');
 if(actorEmployeeId!==null){
  const a=await row(c,'SELECT e.employee_id,e.store_id,e.employment_status,e.receiving_status,r.role_code role FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR SHARE OF e,r',[actorEmployeeId]);
  if(!a||a.employment_status!=='active'||!await permit(c,a,permissionCode,team.team_id,team.store_id))
   return deny('D1_ACTOR_INDEPENDENT_PERMISSION_SCOPE_DENIED');
  if(mode==='claim'&&Number(actorEmployeeId)!==Number(employeeId))return deny('D1_SELF_CLAIM_ONLY');
  if(mode==='assign'&&!['manager','store_head'].includes(a.role))return deny('D1_MANAGER_SCOPE_REQUIRED');
 }
 const policy=await row(c,'SELECT * FROM d1_owner_ci.config WHERE scope_team_id=$1 FOR SHARE',[team.team_id]);
 if(!policy)return deny('D1_MISSING_VERSIONED_QUOTA_POLICY');
 if(mode==='claim'){
  const daily=await row(c,"SELECT count(*)::int n,max(committed_at) last_at FROM d1_owner_ci.receipts "+
   "WHERE actor_employee_id=$1 AND mode='claim' AND committed_at>=date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai'",
  [actorEmployeeId]);
  if(daily.n>=policy.max_claims_per_day)return deny('D1_CLAIM_QUOTA_EXHAUSTED');
  if(daily.last_at && Date.now()-new Date(daily.last_at).getTime()<policy.cooldown_seconds*1000)
   return deny('D1_CLAIM_COOLDOWN');
 }
 // Store-to-owner intent alone cannot mutate anyone's existing signed business objects.
 const changed=await c.query("UPDATE public.customers SET current_owner_employee_id=$2,owner_assignment_state='assigned' "+
  "WHERE customer_id=$1 AND current_owner_employee_id IS NULL AND owner_assignment_state<>'assigned' AND account_status='active' RETURNING customer_id",
  [customerId,employeeId]);
 if(changed.rowCount!==1)return deny('D1_OWNER_CAS_FAILED');
 const histId=Number((await row(c,'SELECT COALESCE(MAX(owner_history_id),0)::bigint+1 id FROM public.customer_owner_history')).id);
 await c.query('INSERT INTO public.customer_owner_history(owner_history_id,customer_id,from_employee_id,to_employee_id,changed_at,change_reason) VALUES($1,$2,NULL,$3,transaction_timestamp(),$4)',
  [histId,customerId,employeeId,'PDM17_CI_'+mode.toUpperCase()]);
 const audit=await row(c,"INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) "+
  "VALUES($1,$2,$3::jsonb,'Customer',$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp()) RETURNING audit_id",
  [mode==='service'?'system':'employee',actorEmployeeId,JSON.stringify({source:'CI_SYNTHETIC_AUTHORITY_ONLY',mode}),
   customerId,'pdm17.public_pool.owner.'+mode,JSON.stringify({owner:null,sourceCycleId:Number(pool.cycle_id)}),
   JSON.stringify({owner:employeeId,policyVersion:Number(policy.version),sourceCycleId:Number(pool.cycle_id)})]);
 const rr=await row(c,"INSERT INTO d1_owner_ci.receipts(cycle_id,customer_id,previous_owner_id,new_owner_id,actor_employee_id,mode,request_key,original_source_json,policy_version,owner_history_id,audit_id) "+
  "VALUES($1,$2,NULL,$3,$4,$5,$6,$7::jsonb,$8,$9,$10) RETURNING receipt_id",
  [pool.cycle_id,customerId,employeeId,actorEmployeeId,mode,requestKey,JSON.stringify(pool.original_source_json),policy.version,histId,audit.audit_id]);
 await c.query("UPDATE d1_owner_ci.pool_cycles SET state='assigned',exited_at=clock_timestamp() WHERE cycle_id=$1 AND state='in_pool'",[pool.cycle_id]);
 return ok('D1_OWNER_ASSIGNED',{ownerId:Number(employeeId),receiptId:Number(rr.receipt_id),created:true,sourceCycleId:Number(pool.cycle_id)});
}
async function signed(auth,token,mode,data){
 gate();
 if(!auth||typeof auth.withSession!=='function'||!valid(data?.customerId)||!key(data?.requestKey))return deny('D1_BAD_INPUT');
 try{
 return await auth.withSession(token,async(c,actor,session)=>{
  if(session.restricted)return deny('D1_RESTRICTED_AUTH_SESSION');
  await verify(c);
  const e=await present(c,actor);if(!e)return deny('D1_EMPLOYEE_BUSINESS_IDENTITY_REQUIRED');
  await c.query('SELECT pg_advisory_xact_lock($1,$2)',[20261013,1702]);
  return acquire(c,{customerId:data.customerId,requestKey:data.requestKey,mode,
   employeeId:mode==='claim'?Number(e.employee_id):Number(data.targetEmployeeId),
   actorEmployeeId:Number(e.employee_id),
   permissionCode:mode==='claim'?'public_pool.claim.ci.synthetic':'public_pool.assign.ci.synthetic'});
 },{normalOnly:true})??deny('D1_SESSION_REVOKED');
 }catch(e){if(e.code==='55P03')return deny('D1_CONCURRENT_LOCKED');throw e}
}
export const claimCI=(auth,token,data)=>signed(auth,token,'claim',data);
export const assignCI=(auth,token,data)=>signed(auth,token,'assign',data);
export async function serviceAssignCI(actor,{requestKey}={}){
 gate();if(!requestObjects.has(actor)||!key(requestKey))return deny('D1_SYNTHETIC_SERVICE_SOURCE_REQUIRED');
 const c=await connect();
 try{
  await c.query('BEGIN');
  await verify(c);
  await c.query('SELECT pg_advisory_xact_lock($1,$2)',[20261013,1702]);
  const pool=await row(c,'SELECT * FROM d1_owner_ci.pool_cycles WHERE customer_id=$1 AND state=$2 FOR UPDATE',[actor.customerId,'in_pool']);
  if(!pool){await c.query('ROLLBACK');return deny('D1_NO_VALID_POOL_SOURCE')}
  const eligible=(await c.query("SELECT e.employee_id FROM public.employees e "+
   "JOIN public.employee_receiving_eligibility v ON v.employee_id=e.employee_id AND v.eligible=true "+
   "JOIN public.roles r ON r.role_id=e.main_role_id AND r.role_code IN('sales','manager','store_head') "+
   "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id AND m.team_id=$1 "+
   "AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) "+
   "WHERE e.employment_status='active' AND e.receiving_status='receiving' ORDER BY e.employee_id FOR SHARE OF e,v,r,m",[pool.team_id])).rows;
  if(!eligible.length){
   await c.query("UPDATE d1_owner_ci.pool_cycles SET state='pending' WHERE cycle_id=$1",[pool.cycle_id]);
   await c.query('COMMIT');
   return deny('D1_OWNER_ASSIGNMENT_PENDING_NO_ELIGIBLE_RECEIVER');
  }
  const answer=await acquire(c,{customerId:actor.customerId,requestKey,mode:'service',
   employeeId:Number(eligible[0].employee_id),receiving:true});
  if(answer.allowed)await c.query('COMMIT');else await c.query('ROLLBACK');
  return answer;
 }catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
}
export async function preClaimSummaryCI(c,customerId){
 gate();if(!valid(customerId))return deny('D1_BAD_CUSTOMER');
 const x=await row(c,"SELECT state FROM d1_owner_ci.pool_cycles WHERE customer_id=$1 ORDER BY cycle_id DESC LIMIT 1",[customerId]);
 return x?.state==='in_pool'?ok('D1_MINIMUM_PUBLIC_SUMMARY',{claimablePossible:true}):deny('D1_NOT_PUBLIC_SUMMARY');
}
export const productionDeny=()=>deny('D1_PRODUCTION_OWNER_ISSUER_NOT_WIRED');
