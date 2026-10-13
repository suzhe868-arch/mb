// F05-10 PDM15 disposable synthetic Consultation CI. Production identity/phone issuers are not wired.
import {verify} from './migration.mjs';
const OK=(code,more={})=>({allowed:true,code,...more});
const DENY=(code,more={})=>({allowed:false,code,...more});
const integer=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
const key=x=>typeof x==='string'&&x.length>=16&&x.length<=160;
const CUSTOMER_PROOF='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const KINDS=['recommendation','ordinary_share','search','favorite','other'];
const OPEN=['pending','processing'];
const safeError=e=>['55P03','40P01','40001','57014','23505','23514'].includes(e.code);
const row=async(c,sql,args=[])=> (await c.query(sql,args)).rows[0];
const isSaleable=v=>v&&!v.archived_at&&((v.source_type==='wholesale'&&v.source_sale_status==='active')||
 (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
function gate(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||process.env.APP_ENV!=='test'||
 process.env.NODE_ENV!=='test'||process.env.F05_2_ISOLATION_CONFIRM!=='I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'||
 process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
 throw Error('F05_10_ONLY_DISPOSABLE_SYNTHETIC_CI_ALLOWED');
}
async function fact(c,customerId,vehicleId,cycleId){
 const v=await row(c,'SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vehicleId]);
 const customer=await row(c,'SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[customerId]);
 const cycle=await row(c,'SELECT * FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',[vehicleId,cycleId]);
 if(!customer||customer.account_status!=='active'||!cycle||cycle.ended_at||!isSaleable(v))
  return DENY('F05_10_CUSTOMER_VEHICLE_OR_CYCLE_INVALID');
 if(customer.owner_assignment_state!=='assigned'||!integer(customer.current_owner_employee_id))
  return DENY('F05_10_OWNER_ASSIGNMENT_OR_PUBLIC_POOL_REQUIRED');
 const rival=await row(c,"SELECT customer_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>statement_timestamp() LIMIT 1 FOR SHARE",[vehicleId,cycleId]);
 if(rival&&Number(rival.customer_id)!==Number(customerId))return DENY('F05_10_OTHER_CUSTOMER_PRIORITY_DENIED');
 if(v.platform_visibility==='hidden'){
  const grant=await row(c,"SELECT g.grant_id FROM public.vehicle_visibility_grants g "+
  "JOIN public.recommendations r ON r.recommendation_id=g.source_recommendation_id "+
  "JOIN public.f05_9_recommendation_facts_ci f ON f.recommendation_id=r.recommendation_id "+
  "JOIN public.f05_6_level_find_policy_ci fp ON fp.level_id=$4 "+
  "WHERE g.customer_id=$1 AND g.vehicle_id=$2 AND r.listing_cycle_id=$3 "+
  "AND r.status='active' AND g.revoked_at IS NULL AND fp.find_enabled=true LIMIT 1 FOR SHARE OF r,g,f,fp",
   [customerId,vehicleId,cycleId,customer.customer_level_id]);
  if(!grant&&(!rival||Number(rival.customer_id)!==Number(customerId)))
   return DENY('F05_10_HIDDEN_OTHER_CUSTOMER_SHARE_DENIED');
 }
 return OK('F05_10_SALEABLE_CURRENT_ACCESS',{vehicle:v,customer,cycle});
}
async function teamOrigin(c,customer){
 const owner=await row(c,"SELECT employee_id,store_id FROM public.employees WHERE employee_id=$1 AND employment_status='active' FOR SHARE",[customer.current_owner_employee_id]);
 if(!owner)return null;
 return row(c,"SELECT t.team_id,t.store_id FROM public.employee_team_memberships m "+
 "JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=$2 AND t.team_status='active' "+
 "JOIN public.stores s ON s.store_id=t.store_id AND s.status='active' "+
 "WHERE m.employee_id=$1 AND m.valid_from<=statement_timestamp() "+
 "AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) ORDER BY t.team_id LIMIT 1 FOR SHARE OF t,m,s",
 [customer.current_owner_employee_id,owner.store_id]);
}
async function capability(c,employeeId,origin,kind,{accepting=false}={}){
 if(!origin||!integer(employeeId))return false;
 const e=await row(c,"SELECT e.employee_id,e.store_id,e.employment_status,e.receiving_status,r.role_code "+
 "FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
 "WHERE e.employee_id=$1 FOR SHARE OF e,r",[employeeId]);
 if(!e||e.employment_status!=='active'||!['sales','manager','store_head'].includes(e.role_code)||
   (accepting&&e.receiving_status!=='receiving')||(kind==='manage'&&!['manager','store_head'].includes(e.role_code)))
  return false;
 const code=kind==='manage'?'consultation.ci.manage':'consultation.ci.work';
 const allowed=await row(c,"SELECT EXISTS(SELECT 1 FROM public.permissions p "+
 "JOIN public.employee_permission_overrides ov ON ov.permission_id=p.permission_id AND ov.employee_id=$1 "+
 "JOIN public.employee_capability_scope_bindings b ON b.permission_id=p.permission_id AND b.employee_id=$1 "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=$1 "+
 "WHERE p.permission_code=$2 AND ov.decision='allow' "+
 "AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
 "AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) "+
 "AND ((sc.scope_kind='team' AND sc.scope_reference_id=$3) OR "+
 "(sc.scope_kind='store' AND sc.scope_reference_id=$4 AND $5 IN('manager','store_head'))) "+
 "FOR SHARE OF p,ov,b,sc) permit",
 [employeeId,code,origin.team_id,origin.store_id,e.role_code]);
 if(!allowed?.permit)return false;
 if(e.role_code==='sales'){
  if(Number(e.store_id)!==Number(origin.store_id))return false;
  const m=await row(c,"SELECT 1 FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 "+
   "AND valid_from<=statement_timestamp() AND (ended_at IS NULL OR ended_at>statement_timestamp()) FOR SHARE",[employeeId,origin.team_id]);
  if(!m)return false;
 }
 return true;
}
async function sourceRecommendation(c,{customerId,vehicleId,listingCycleId,sourceRecommendationId}){
 if(!integer(sourceRecommendationId))return null;
 const rec=await row(c,"SELECT r.*,f.original_recommender_id FROM public.recommendations r "+
 "JOIN public.f05_9_recommendation_facts_ci f ON f.recommendation_id=r.recommendation_id "+
 "WHERE r.recommendation_id=$1 AND r.customer_id=$2 AND r.vehicle_id=$3 "+
 "AND r.listing_cycle_id=$4 AND r.status='active' FOR SHARE OF r,f",
 [sourceRecommendationId,customerId,vehicleId,listingCycleId]);
 return rec??null;
}
async function assign(c,customer,origin,recommendation,sourceDemandId){
 const candidates=[];
 if(recommendation){
  const d=recommendation.source_demand_id?await row(c,"SELECT responsible_employee_id,demand_state FROM public.demands WHERE demand_id=$1 AND customer_id=$2 FOR SHARE",[recommendation.source_demand_id,customer.customer_id]):null;
  const current=d?.demand_state==='active'?Number(d.responsible_employee_id):Number(customer.current_owner_employee_id);
  if(Number(recommendation.original_recommender_id)===current)candidates.push(current);
 }
 if(integer(sourceDemandId)){
  const d=await row(c,"SELECT responsible_employee_id FROM public.demands WHERE demand_id=$1 AND customer_id=$2 AND demand_state='active' FOR SHARE",[sourceDemandId,customer.customer_id]);
  if(d)candidates.push(Number(d.responsible_employee_id));
 }
 candidates.push(Number(customer.current_owner_employee_id));
 const receiving=await c.query("SELECT e.employee_id FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
  "WHERE e.employment_status='active' AND e.receiving_status='receiving' "+
  "AND r.role_code IN('sales','manager','store_head') ORDER BY e.employee_id LIMIT 80");
 for(const r of receiving.rows)candidates.push(Number(r.employee_id));
 for(const eid of new Set(candidates))
  if(await capability(c,eid,origin,'work',{accepting:true}))return eid;
 return null;
}
async function emit(c,id,eventKey,eventKind,actorKind,actorId,facts={},evidenceKind=null){
 return row(c,"INSERT INTO public.f05_10_consultation_events_ci "+
 "(consultation_id,event_key,event_kind,actor_kind,actor_id,facts_json,evidence_kind) "+
 "VALUES($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING event_id",
 [id,eventKey,eventKind,actorKind,actorId,JSON.stringify(facts),evidenceKind]);
}
export function productionDeny(){return DENY('F05_10_PRODUCTION_CONSULTATION_ISSUER_NOT_WIRED')}
export async function createConsultationCI(c,p={}){
 gate();
 const {customerId,vehicleId,listingCycleId,eventKey,directSource='other',sourceRecommendationId=null,sourceDemandId=null,
 syntheticPhoneConsent,intent}=p;
 if(![customerId,vehicleId,listingCycleId].every(integer)||!key(eventKey)||
  !KINDS.includes(directSource)||intent!=='consult'||syntheticPhoneConsent!==CUSTOMER_PROOF||
  (directSource==='recommendation')!==integer(sourceRecommendationId))
  return DENY('F05_10_NO_SIGNED_CUSTOMER_PHONE_OR_EXPLICIT_INTENT');
 await verify(c);
 await c.query('BEGIN');
 try{
  await c.query("SET LOCAL lock_timeout='1500ms'");
  const facts=await fact(c,customerId,vehicleId,listingCycleId);
  if(!facts.allowed){await c.query('ROLLBACK');return facts}
  const existing=await row(c,"SELECT co.consultation_id FROM public.consultations co "+
   "JOIN public.f05_10_consultation_meta_ci m ON m.consultation_id=co.consultation_id "+
   "WHERE co.customer_id=$1 AND co.vehicle_id=$2 AND co.listing_cycle_id=$3 "+
   "AND co.status IN('pending','processing') FOR UPDATE OF co,m",
   [customerId,vehicleId,listingCycleId]);
  if(existing){
   const ev=await row(c,"SELECT event_id FROM public.f05_10_consultation_events_ci WHERE event_key=$1 FOR SHARE",[eventKey]);
   if(!ev)await emit(c,existing.consultation_id,eventKey,'touched','customer',customerId,{directSource});
   await c.query('COMMIT');
   return OK('F05_10_EXISTING_OPEN_TOUCH',{consultationId:Number(existing.consultation_id),created:false});
  }
  const rec=directSource==='recommendation'?await sourceRecommendation(c,p):null;
  if(directSource==='recommendation'&&!rec){await c.query('ROLLBACK');return DENY('F05_10_DIRECT_RECOMMENDATION_NOT_CURRENT_SOURCE')}
  const origin=await teamOrigin(c,facts.customer);
  const assignee=await assign(c,facts.customer,origin,rec,sourceDemandId);
  if(!assignee){await c.query('ROLLBACK');return DENY('F05_10_NO_LEGAL_ASSIGNEE')}
  const policy=await row(c,"SELECT version,seconds FROM public.f05_10_consultation_policy_ci WHERE policy_key=$1 FOR SHARE",['default']);
  if(!policy)throw Error('F05_10_NO_SYNTHETIC_POLICY');
  const source={directSource,sourceRecommendationId:rec?Number(rec.recommendation_id):null,sourceDemandId:integer(sourceDemandId)?Number(sourceDemandId):null,
   issuer:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'};
  const co=await row(c,"INSERT INTO public.consultations "+
   "(customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
   "VALUES($1,$2,$3,$4,'pending',$5::jsonb,transaction_timestamp()+($6::int*interval '1 second')) RETURNING consultation_id,first_response_deadline",
   [customerId,vehicleId,listingCycleId,assignee,JSON.stringify(source),policy.seconds]);
  await c.query("INSERT INTO public.f05_10_consultation_meta_ci "+
   "(consultation_id,source_kind,source_recommendation_id,source_demand_id,customer_id,vehicle_id,listing_cycle_id, "+
   "sla_policy_version,sla_seconds,original_deadline,remaining_ms,origin_team_id,origin_store_id) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
   [co.consultation_id,directSource,rec?rec.recommendation_id:null,integer(sourceDemandId)?sourceDemandId:null,
    customerId,vehicleId,listingCycleId,policy.version,policy.seconds,co.first_response_deadline,policy.seconds*1000,origin.team_id,origin.store_id]);
  await emit(c,co.consultation_id,eventKey,'created','customer',customerId,{assignee,source});
  await c.query('COMMIT');
  return OK('F05_10_NEW_PENDING',{consultationId:Number(co.consultation_id),assignee,created:true,
    slaSeconds:policy.seconds,directSource});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});if(safeError(e))return DENY('F05_10_CREATE_CONCURRENT_OR_CONSTRAINT_DENY');throw e}
}
async function withEmployee(auth,token,consultationId,fn){
 gate();
 if(!auth||typeof auth.withSession!=='function'||!integer(consultationId))return DENY('F05_10_SIGNED_EMPLOYEE_SESSION_REQUIRED');
 try{
 return await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||
   a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change)
   return DENY('F05_10_SIGNED_EMPLOYEE_NOT_ELIGIBLE');
  await verify(c);
  const locator=await row(c,'SELECT customer_id,vehicle_id FROM public.consultations WHERE consultation_id=$1',[consultationId]);
  if(!locator)return DENY('F05_10_NOT_FOUND');
  await c.query("SET LOCAL lock_timeout='1500ms'");
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[locator.vehicle_id]);
  const customer=await row(c,'SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[locator.customer_id]);
  const co=await row(c,'SELECT * FROM public.consultations WHERE consultation_id=$1 FOR UPDATE',[consultationId]);
  const meta=await row(c,'SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1 FOR UPDATE',[consultationId]);
  if(!customer||!co||!meta||Number(co.customer_id)!==Number(locator.customer_id)||Number(co.vehicle_id)!==Number(locator.vehicle_id))
   return DENY('F05_10_SOURCE_NOT_CURRENT');
  // Consultation scope is frozen at creation; later Customer Owner changes must not silently rewrite it.
  const origin={team_id:meta.origin_team_id,store_id:meta.origin_store_id};
  const eid=Number(a.employee_id);
  // Idempotent reconciliation is backed by source UPDATE triggers and also covers stale data.
  await c.query("SELECT public.f05_10_reconcile_assignee_ci($1,'transaction_guard')",[co.assignee_employee_id]);
  meta.assignee_handover_pending=(await row(c,
   'SELECT assignee_handover_pending FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',
   [consultationId])).assignee_handover_pending;
  const worker=await capability(c,eid,origin,'work');
  const manager=await capability(c,eid,origin,'manage');
  const isAssignee=eid===Number(co.assignee_employee_id);
  const isOwner=eid===Number(customer.current_owner_employee_id);
  return fn({c,actor:a,eid,co,meta,customer,origin,worker,manager,isAssignee,isOwner});
 },{normalOnly:true})??DENY('F05_10_SESSION_REVOKED');
 }catch(e){if(safeError(e))return DENY('F05_10_CONTENTION_OR_PERMISSION_DENIED');throw e}
}
export async function employeeConsultationActionCI(auth,token,{consultationId,eventKey,action,reason=null,targetEmployeeId=null,
 evidenceKind=null,evidenceRef=null}={}){
 if(!key(eventKey)||!['start','followup','close_resolved','close_normal','invalid','resume','handover','assignee_invalid'].includes(action))
  return DENY('F05_10_INVALID_EMPLOYEE_ACTION');
 return withEmployee(auth,token,consultationId,async x=>{
  const {c,eid,co,meta,origin,worker,manager,isAssignee}=x;
  if(!OPEN.includes(co.status))return DENY('F05_10_TERMINAL_IMMUTABLE');
  const governance=['close_resolved','close_normal','invalid','handover','assignee_invalid'].includes(action);
  if(!((isAssignee&&worker)||manager))return DENY('F05_10_ACTOR_CURRENT_OBJECT_SCOPE_DENIED');
  if(meta.customer_disabled_hold&&!governance&&action!=='resume')return DENY('F05_10_CUSTOMER_DISABLED_HOLD');
  if(meta.assignee_handover_pending&&!['handover','assignee_invalid','invalid','close_resolved','close_normal'].includes(action))
   return DENY('F05_10_PENDING_HANDOVER_REQUIRES_REASSIGN');
  // Revocation creates a pending governance fact that ordinary Sales may never
  // dismiss by recovering permission. Only an explicitly scoped manager can close/handover.
  if(meta.assignee_handover_pending&&!manager)
   return DENY('F05_10_PENDING_REQUIRES_CURRENT_SCOPED_MANAGER');
  const old=await row(c,'SELECT event_id FROM public.f05_10_consultation_events_ci WHERE event_key=$1 FOR SHARE',[eventKey]);
  if(old)return OK('F05_10_IDEMPOTENT_NO_REPLAY',{consultationId:Number(consultationId)});
  if(action==='start'){
   if(co.status==='pending')await c.query("UPDATE public.consultations SET status='processing' WHERE consultation_id=$1",[consultationId]);
   await emit(c,consultationId,eventKey,'started','employee',eid);
  }else if(action==='followup'){
   const human=['call','message','in_person'].includes(evidenceKind);
   if(typeof evidenceRef!=='string'||!/^[A-Za-z0-9._:-]{16,120}$/.test(evidenceRef))
    return DENY('F05_10_FOLLOWUP_AUDIT_REQUIRED');
   if(human){
    const proven=await row(c,"SELECT evidence_ref FROM public.f05_10_human_service_evidence_ci "+
     "WHERE evidence_ref=$1 AND consultation_id=$2 AND actor_id=$3 AND evidence_kind=$4 "+
     "AND consumed_event_id IS NULL AND captured_at<=transaction_timestamp() FOR UPDATE",
     [evidenceRef,consultationId,eid,evidenceKind]);
    if(!proven)return DENY('F05_10_UNTRUSTED_HUMAN_SERVICE_EVIDENCE');
   }
   const logged=await emit(c,consultationId,eventKey,'followup','employee',eid,{evidenceRef,synthetic:human},evidenceKind);
   if(human){
    await c.query("UPDATE public.f05_10_human_service_evidence_ci SET consumed_event_id=$2 WHERE evidence_ref=$1",
     [evidenceRef,logged.event_id]);
    if(!meta.first_response_at){
     await c.query("UPDATE public.f05_10_consultation_meta_ci SET first_response_at=transaction_timestamp(), "+
      "first_response_event_id=$2 WHERE consultation_id=$1",[consultationId,logged.event_id]);
    }
   }
  }else if(['close_resolved','close_normal','invalid'].includes(action)){
   const status=action==='invalid'?'invalid':'resolved';
   const close=action==='invalid'?'INVALID':action==='close_normal'?'NORMAL_CLOSED':'RESOLVED';
   await c.query('UPDATE public.consultations SET status=$2,close_reason=$3,completed_at=transaction_timestamp() WHERE consultation_id=$1',
    [consultationId,status,close]);
   await emit(c,consultationId,eventKey,status,'employee',eid,{close});
  }else if(action==='resume'){
   if(!meta.customer_disabled_hold||x.customer.account_status!=='active')return DENY('F05_10_RESUME_NEEDS_ACTIVE_CUSTOMER_AND_HOLD');
   if(!worker&&!manager)return DENY('F05_10_RESUME_CURRENT_SCOPE_DENIED');
   await c.query("UPDATE public.consultations SET first_response_deadline=transaction_timestamp()+($2::bigint*interval '1 millisecond') "+
    "WHERE consultation_id=$1 AND first_response_deadline IS NOT NULL AND $3::boolean",
    [consultationId,meta.remaining_ms,!meta.first_response_at]);
   await c.query("UPDATE public.f05_10_consultation_meta_ci SET customer_disabled_hold=false,hold_at=NULL WHERE consultation_id=$1",[consultationId]);
   await emit(c,consultationId,eventKey,'resume','employee',eid,{remainingMs:Number(meta.remaining_ms)});
  }else if(action==='assignee_invalid'){
   if(!manager)return DENY('F05_10_ONLY_MANAGER_CAN_MARK_PENDING');
   await c.query("UPDATE public.f05_10_consultation_meta_ci SET assignee_handover_pending=true WHERE consultation_id=$1",[consultationId]);
   await emit(c,consultationId,eventKey,'assignee_invalid','employee',eid);
  }else if(action==='handover'){
   if(!integer(targetEmployeeId)||!reason||String(reason).trim().length<3||
    Number(targetEmployeeId)===Number(co.assignee_employee_id)||!origin)
    return DENY('F05_10_INVALID_HANDOVER_TARGET');
   if(!await capability(c,targetEmployeeId,origin,'work',{accepting:true}))return DENY('F05_10_TARGET_PERMISSION_SCOPE_DENIED');
   if(!manager&&!(worker&&isAssignee))return DENY('F05_10_HANDOVER_ACTOR_DENIED');
   const event=await emit(c,consultationId,eventKey,'handover','employee',eid,
    {oldAssignee:Number(co.assignee_employee_id),newAssignee:Number(targetEmployeeId),reason});
   await c.query("INSERT INTO public.f05_10_consultation_handover_ci "+
   "(consultation_id,old_assignee_id,new_assignee_id,actor_id,reason,context_json,event_id) "+
   "VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)",
    [consultationId,co.assignee_employee_id,targetEmployeeId,eid,String(reason),
     JSON.stringify({customerId:Number(co.customer_id),vehicleId:Number(co.vehicle_id),listingCycleId:Number(co.listing_cycle_id)}),event.event_id]);
   await c.query('UPDATE public.consultations SET assignee_employee_id=$2 WHERE consultation_id=$1',[consultationId,targetEmployeeId]);
   await c.query("UPDATE public.f05_10_consultation_meta_ci SET assignee_handover_pending=false WHERE consultation_id=$1",[consultationId]);
  }
  return OK('F05_10_'+action.toUpperCase()+'_COMMITTED',{consultationId:Number(consultationId)});
 });
}
export async function withdrawConsultationCI(c,{consultationId,customerId,eventKey,syntheticPhoneConsent}={}){
 gate();
 if(!integer(consultationId)||!integer(customerId)||!key(eventKey)||syntheticPhoneConsent!==CUSTOMER_PROOF)
  return DENY('F05_10_NO_CUSTOMER_SIGNED_WITHDRAWAL');
 await verify(c);
 await c.query('BEGIN');
 try{
  const locator=await row(c,"SELECT customer_id,vehicle_id FROM public.consultations WHERE consultation_id=$1",[consultationId]);
  if(!locator||Number(locator.customer_id)!==Number(customerId)){await c.query('ROLLBACK');return DENY('F05_10_OTHER_CUSTOMER_CANNOT_WITHDRAW')}
  await c.query("SET LOCAL lock_timeout='1500ms'");
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[locator.vehicle_id]);
  const cu=await row(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[customerId]);
  const co=await row(c,'SELECT * FROM public.consultations WHERE consultation_id=$1 FOR UPDATE',[consultationId]);
  const meta=await row(c,'SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1 FOR UPDATE',[consultationId]);
  if(!cu||cu.account_status!=='active'||!co||!OPEN.includes(co.status)||!meta||meta.customer_disabled_hold){
   await c.query('ROLLBACK');return DENY('F05_10_WITHDRAW_STATUS_OR_HOLD_DENIED');
  }
  const previous=await row(c,'SELECT event_id FROM public.f05_10_consultation_events_ci WHERE event_key=$1 FOR SHARE',[eventKey]);
  if(previous){await c.query('ROLLBACK');return DENY('F05_10_WITHDRAW_REPLAY_DENIED')}
  await c.query("UPDATE public.consultations SET status='resolved',close_reason='CUSTOMER_WITHDRAWN',"+
   "completed_at=transaction_timestamp() WHERE consultation_id=$1",[consultationId]);
  await emit(c,consultationId,eventKey,'customer_withdrawn','customer',customerId);
  await c.query('COMMIT');
  return OK('F05_10_CUSTOMER_WITHDRAWN',{consultationId:Number(consultationId)});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});if(safeError(e))return DENY('F05_10_WITHDRAW_CONTENDED_DENIED');throw e}
}
export async function safeCustomerProjectionCI(c,{consultationId,customerId,syntheticPhoneConsent}={}){
 gate();
 if(!integer(consultationId)||!integer(customerId)||syntheticPhoneConsent!==CUSTOMER_PROOF)
  return DENY('F05_10_CUSTOMER_AUTH_REQUIRED');
 await verify(c);
 const co=await row(c,'SELECT * FROM public.consultations WHERE consultation_id=$1 AND customer_id=$2',[consultationId,customerId]);
 if(!co)return DENY('F05_10_NOT_OWN_CONSULTATION');
 const meta=await row(c,'SELECT * FROM public.f05_10_consultation_meta_ci WHERE consultation_id=$1',[consultationId]);
 if(!meta)return DENY('F05_10_SYNTHETIC_ISSUER_REQUIRED');
 return OK('F05_10_SAFE_CUSTOMER',{consultationId:Number(co.consultation_id),status:co.status,
  closeReason:co.close_reason,createdAt:meta.opened_at,hold:meta.customer_disabled_hold,
  firstResponseRecorded:!!meta.first_response_at});
}
export async function internalConsultationProjectionCI(auth,token,{consultationId}={}){
 return withEmployee(auth,token,consultationId,async x=>{
  if(!x.manager&&!((x.isAssignee||x.isOwner)&&x.worker))return DENY('F05_10_INTERNAL_SCOPE_DENIED');
  return OK('F05_10_INTERNAL_SCOPED',{consultationId:Number(consultationId),status:x.co.status,assigneeId:Number(x.co.assignee_employee_id),source:x.co.source_relation,hold:x.meta.customer_disabled_hold,deadline:x.co.first_response_deadline});
 })
}
