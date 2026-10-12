// F05-9: genuinely transactional CI-only PDM14 contract; no production Issuer.
// All mutations use the real F03 signed Employee transaction and original M94
// Recommendation + visibility-grant tables, with v25 immutable sidecars.
import {verify} from './migration.mjs';
const FAIL=(code,more={})=>({allowed:false,code,...more});
const OK=(code,more={})=>({allowed:true,code,...more});
const positive=n=>Number.isSafeInteger(Number(n))&&Number(n)>0;
const eventKey=s=>typeof s==='string'&&s.length>=16&&s.length<=160;
const lockVehicle=(c,v)=>c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[v]);
const sourceAuth=async(c,actor,teamId,customerId,demandId,{forTermination=false}={})=>{
 if(actor?.principal_kind!=='employee'||actor.system_admin_id!=null||
    actor.subject_status!=='active'||actor.credential_state!=='enabled'||
    actor.force_password_change||!['sales','manager','store_head'].includes(actor.role_code))
  return FAIL('F05_9_ACTIVE_MINGBANG_EMPLOYEE_REQUIRED');
 const eid=Number(actor.employee_id);
 const employee=(await c.query('SELECT employee_id,store_id,employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[eid])).rows[0];
 if(!employee||employee.employment_status!=='active')return FAIL('F05_9_EMPLOYEE_INACTIVE');
 const customer=(await c.query('SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[customerId])).rows[0];
 if(!customer||customer.account_status!=='active'||customer.owner_assignment_state!=='assigned')
  return FAIL('F05_9_CUSTOMER_NOT_ELIGIBLE');
 const entitlement=(await c.query('SELECT find_enabled FROM public.f05_6_level_find_policy_ci WHERE level_id=$1 FOR SHARE',[customer.customer_level_id])).rows[0];
 if(!entitlement?.find_enabled)return FAIL('F05_9_FIND_ENTITLEMENT_REQUIRED');
 let responsible=Number(customer.current_owner_employee_id),demand=null;
 if(demandId!==null){
  demand=(await c.query('SELECT * FROM public.demands WHERE demand_id=$1 FOR SHARE',[demandId])).rows[0];
  if(!demand||Number(demand.customer_id)!==Number(customerId))
   return FAIL('F05_9_SIGNED_SOURCE_DEMAND_NOT_CURRENT_CUSTOMER');
  if(demand.demand_state==='active')responsible=Number(demand.responsible_employee_id);
  else if(!forTermination)return FAIL('F05_9_SIGNED_SOURCE_DEMAND_NOT_ACTIVE');
  // Historic source Demand may be completed/paused/cancelled when ending
  // a recommendation. Only the CURRENT Customer owner or scoped manager
  // may close its immutable history; never the historical recommender.

 }
 if(!positive(responsible))return FAIL('F05_9_NO_CURRENT_RESPONSIBLE');
 const owner=(await c.query('SELECT store_id,employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[responsible])).rows[0];
 if(!owner||owner.employment_status!=='active')return FAIL('F05_9_CURRENT_OWNER_INACTIVE');
 // Team is determined by the actual current responsible owner's live
 // membership, NOT a free-form requested team passed by a caller.
 const origin=(await c.query("SELECT t.team_id,t.store_id FROM public.employee_team_memberships m "+
 "JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=$2 AND t.team_status='active' "+
 "JOIN public.stores st ON st.store_id=t.store_id AND st.status='active' "+
 "WHERE m.employee_id=$1 AND m.valid_from<=statement_timestamp() "+
 "AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) AND t.team_id=$3 "+
 "FOR SHARE OF m,t,st",[responsible,owner.store_id,teamId])).rows[0];
 if(!origin)return FAIL('F05_9_OBJECT_TEAM_NOT_SIGNED');
 const code='matching.rule.manage.ci.synthetic'; // CI proxy; production REC issuer remains SOURCE_GAP.
 const permit=(await c.query("SELECT EXISTS(SELECT 1 FROM public.permissions p "+
 "JOIN public.employee_permission_overrides ov ON ov.permission_id=p.permission_id AND ov.employee_id=$1 "+
 "JOIN public.employee_capability_scope_bindings b ON b.permission_id=p.permission_id AND b.employee_id=$1 "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=$1 "+
 "WHERE p.permission_code=$2 AND ov.decision='allow' AND "+
 "b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
 "AND sc.ended_at IS NULL AND "+
 "((sc.scope_kind='team' AND sc.scope_reference_id=$3) OR "+
 "(sc.scope_kind='store' AND sc.scope_reference_id=$4 AND $5 IN ('manager','store_head'))) "+
 "AND ($5 IN ('manager','store_head') OR $1=$6) "+
 "FOR SHARE OF p,ov,b,sc) yes",
 [eid,code,origin.team_id,origin.store_id,actor.role_code,responsible])).rows[0]?.yes;
 if(!permit)return FAIL('F05_9_ACTOR_CURRENT_OBJECT_SCOPE_DENIED');
 if(actor.role_code==='sales'){
  if(Number(employee.store_id)!==Number(origin.store_id))return FAIL('F05_9_SALES_OTHER_STORE_DENIED');
  const m=(await c.query("SELECT 1 FROM public.employee_team_memberships "+
   "WHERE employee_id=$1 AND team_id=$2 AND valid_from<=statement_timestamp() "+
   "AND (ended_at IS NULL OR ended_at>statement_timestamp()) FOR SHARE",[eid,teamId])).rows[0];
  if(!m)return FAIL('F05_9_SALES_TEAM_NOT_CURRENT');
 }
 return OK('F05_9_CURRENT_SCOPE',{employeeId:eid,customer,origin,demand});
};
async function withEmployee(auth,token,vehicleId,fn){
 if(!auth||typeof auth.withSession!=='function'||!positive(vehicleId))return FAIL('F05_9_SIGNED_SESSION_REQUIRED');
 try{
  return await auth.withSession(token,async(c,actor,session)=>{
   if(session.restricted)return FAIL('F05_9_RESTRICTED_SESSION');
   await verify(c);
   await lockVehicle(c,vehicleId);
   return fn(c,actor);
  },{normalOnly:true})??FAIL('F05_9_REVOKED_SESSION');
 }catch(e){
  if(String(e.message).includes('F05_9_')||String(e.message).includes('F05_8_'))return FAIL('F05_9_FAIL_CLOSED_DB', {reason:'DISPOSABLE_CI_ONLY'});
  throw e;
 }
}
async function vehicleGuard(c,vehicleId,listingCycleId,customerId){
 const v=(await c.query('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId])).rows[0];
 const cycle=(await c.query('SELECT * FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',
 [vehicleId,listingCycleId])).rows[0];
 if(!v||!cycle||cycle.ended_at||v.archived_at||
    !((v.source_type==='wholesale'&&v.source_sale_status==='active')||
      (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available')))
  return FAIL('F05_9_NOT_CURRENT_SALEABLE_CYCLE');
 const rival=(await c.query("SELECT priority_id FROM public.f05_8_priority_ci "+
  "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' "+
  "AND customer_id<>$3 AND expires_at>statement_timestamp() ORDER BY priority_id LIMIT 1 FOR SHARE",
 [vehicleId,listingCycleId,customerId])).rows[0];
 if(rival)return FAIL('F05_9_OTHER_CUSTOMER_PRIORITY_EXCLUSIVE');
 // In-progress Lock or Transaction occupancy alone is not a denial.
 return OK('F05_9_AVAILABLE',{vehicle:v,cycle});
}
const recRow=async(c,customerId,vehicleId,cycle)=>
 (await c.query("SELECT * FROM public.recommendations WHERE customer_id=$1 AND vehicle_id=$2 "+
 "AND listing_cycle_id=$3 AND status='active' ORDER BY recommendation_id LIMIT 1 FOR UPDATE",
 [customerId,vehicleId,cycle])).rows[0];
async function ensureGrant(c,recommendationId,vehicleId,customerId){
 const existing=(await c.query("SELECT grant_id FROM public.vehicle_visibility_grants "+
 "WHERE source_recommendation_id=$1 AND revoked_at IS NULL FOR UPDATE",[recommendationId])).rows[0];
 if(existing)return {created:false,id:Number(existing.grant_id)};
 const row=(await c.query("INSERT INTO public.vehicle_visibility_grants(vehicle_id,customer_id,source_recommendation_id) "+
 "VALUES($1,$2,$3) RETURNING grant_id",[vehicleId,customerId,recommendationId])).rows[0];
 return {created:true,id:Number(row.grant_id)};
}
const emit=(c,{rec,actor,event,reason=null,key,before={},after={}})=>
 c.query("INSERT INTO public.f05_9_recommendation_events_ci(recommendation_id,actor_employee_id,event_kind,event_key,reason,before_json,after_json) "+
 "VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb) RETURNING event_id",
 [rec,actor,event,key,reason,JSON.stringify(before),JSON.stringify(after)]);
export async function createRecommendationCI(auth,token,{teamId=901,customerId,vehicleId,listingCycleId,sourceDemandId=null,eventKey:key}={}){
 if(![customerId,vehicleId,listingCycleId,teamId].every(positive)||!eventKey(key)||
    (sourceDemandId!==null&&!positive(sourceDemandId)))return FAIL('F05_9_INVALID_CREATE');
 return withEmployee(auth,token,vehicleId,async(c,actor)=>{
  const scope=await sourceAuth(c,actor,teamId,customerId,sourceDemandId);if(!scope.allowed)return scope;
  const vg=await vehicleGuard(c,vehicleId,listingCycleId,customerId);if(!vg.allowed)return vg;
  const prior=await recRow(c,customerId,vehicleId,listingCycleId);
  if(prior){
   const signed=(await c.query('SELECT recommendation_id FROM public.f05_9_recommendation_facts_ci WHERE recommendation_id=$1',[prior.recommendation_id])).rows[0];
   if(!signed)return FAIL('F05_9_PRIOR_RECOMMENDATION_UNVERIFIED_ISSUER');
   const touched=(await c.query('SELECT event_id FROM public.f05_9_recommendation_events_ci WHERE event_key=$1',[key])).rows[0];
   if(!touched)await emit(c,{rec:prior.recommendation_id,actor:scope.employeeId,event:'touched',key});
   return OK('F05_9_EXISTING_ACTIVE_UNCHANGED',{recommendationId:Number(prior.recommendation_id),created:false});
  }
  const sale=vg.vehicle,wholesale=sale.source_type==='wholesale';
  const signedPrice=(await c.query('SELECT customer_display_cents FROM public.f05_4_current_price_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',
    [vehicleId,listingCycleId])).rows[0];
  const snap={kind:signedPrice?.customer_display_cents?'synthetic_customer_display':'price_consultation',
   customerDisplayCents:signedPrice?.customer_display_cents??null,
   currentSourceType:sale.source_type,issuer:'CI_SYNTHETIC_PDM10_NOT_PRODUCTION'};
  const rec=(await c.query("INSERT INTO public.recommendations(vehicle_id,customer_id,listing_cycle_id,source_demand_id,status,recommender_employee_id) "+
  "VALUES($1,$2,$3,$4,'active',$5) RETURNING recommendation_id",
  [vehicleId,customerId,listingCycleId,sourceDemandId,scope.employeeId])).rows[0];
  const rid=Number(rec.recommendation_id);
  await c.query('INSERT INTO public.f05_9_recommendation_facts_ci(recommendation_id,customer_id,vehicle_id,listing_cycle_id,original_recommender_id,original_source_demand_id,original_price_snapshot,original_source_kind,creation_key) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)',
   [rid,customerId,vehicleId,listingCycleId,scope.employeeId,sourceDemandId,JSON.stringify(snap),sale.source_type,key]);
  if(wholesale){
   await c.query("INSERT INTO public.f05_9_price_right_ci(customer_id,vehicle_id,listing_cycle_id,original_recommendation_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",[customerId,vehicleId,listingCycleId,rid]);
  }
  if(sale.platform_visibility==='hidden')await ensureGrant(c,rid,vehicleId,customerId);
  await emit(c,{rec:rid,actor:scope.employeeId,event:'created',key,after:{wholesaleFreePrice:wholesale,hidden:sale.platform_visibility==='hidden'}});
  return OK('F05_9_RECOMMENDATION_CREATED',{recommendationId:rid,created:true,wholesaleFreePrice:wholesale});
 });
}
export async function finishRecommendationCI(auth,token,{teamId=901,recommendationId,kind='end',reason=null,eventKey:key}={}){
 if(!positive(recommendationId)||!eventKey(key)||!['end','void'].includes(kind)||
    (kind==='void'&&(!reason||!String(reason).trim())))return FAIL('F05_9_INVALID_FINISH');
 if(!auth||typeof auth.withSession!=='function')return FAIL('F05_9_SIGNED_SESSION_REQUIRED');
 // Object lookup happens INSIDE the authenticated F03 session to avoid
 // unauthenticated Recommendation-ID existence disclosure.
 return await auth.withSession(token,async(c,actor,session)=>{
  if(session.restricted)return FAIL('F05_9_RESTRICTED_SESSION');
  await verify(c);
  const locator=(await c.query('SELECT vehicle_id FROM public.recommendations WHERE recommendation_id=$1',[recommendationId])).rows[0];
  if(!locator)return FAIL('F05_9_NOT_ACTIVE_RECOMMENDATION');
  await lockVehicle(c,locator.vehicle_id);
  const rec=(await c.query('SELECT * FROM public.recommendations WHERE recommendation_id=$1 FOR UPDATE',[recommendationId])).rows[0];
  if(!rec||rec.status!=='active')return FAIL('F05_9_NOT_ACTIVE_RECOMMENDATION');
  const scope=await sourceAuth(c,actor,teamId,rec.customer_id,rec.source_demand_id,{forTermination:true});
  if(!scope.allowed)return scope;
  // Ending historic business history is lawful after a Vehicle is sold,
  // cycle ends, or another Customer wins a Priority. The creation guards
  // MUST NOT be reused as termination guards or old records become stuck.
  await c.query('UPDATE public.recommendations SET status=$2 WHERE recommendation_id=$1',
   [recommendationId,kind==='void'?'void':'ended']);
  await c.query("UPDATE public.vehicle_visibility_grants SET revoked_at=transaction_timestamp() "+
   "WHERE source_recommendation_id=$1 AND revoked_at IS NULL",[recommendationId]);
  await emit(c,{rec:recommendationId,actor:scope.employeeId,
   event:kind==='void'?'voided':'ended',key,reason});
  return OK('F05_9_RECOMMENDATION_'+kind.toUpperCase(),{recommendationId:Number(recommendationId)});
 },{normalOnly:true})??FAIL('F05_9_REVOKED_SESSION');
}
export async function batchRecommendCI(auth,token,{teamId=901,customerId,vehicleCycles=[],sourceDemandId=null,eventPrefix}={}){
 if(!eventKey(eventPrefix)||!Array.isArray(vehicleCycles)||vehicleCycles.length>100)return FAIL('F05_9_INVALID_BATCH');
 const entries=[];
 for(let i=0;i<vehicleCycles.length;i++){
  const v=vehicleCycles[i];
  entries.push(await createRecommendationCI(auth,token,{teamId,customerId,vehicleId:v.vehicleId,
   listingCycleId:v.listingCycleId,sourceDemandId,eventKey:eventPrefix+'-'+i}));
 }
 return OK('F05_9_INDEPENDENT_VEHICLE_RESULTS',{entries});
}
// Customer share link carries only vehicle navigation, not any Customer identity
// from the sender. This read requires explicit synthetic CI claim, NEVER a
// production WeChat login. Production Customer Issuer remains SOURCE_GAP.
async function customerProjectionReadCI(c,{customerId,vehicleId,listingCycleId,entry='detail',
  syntheticCustomerIdentity}={}){
 if(syntheticCustomerIdentity!=='CI_SYNTHETIC_CUSTOMER_IDENTITY_NOT_PRODUCTION'||
    ![customerId,vehicleId,listingCycleId].every(positive)||
    !['detail','ordinary_share','my_recommendations'].includes(entry))
  return FAIL('F05_9_PRODUCTION_CUSTOMER_ISSUER_NOT_WIRED');
 await verify(c);
 const veh=(await c.query('SELECT vehicle_id,source_type,platform_visibility,source_sale_status,archived_at FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId])).rows[0];
 const cy=(await c.query('SELECT ended_at FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',[vehicleId,listingCycleId])).rows[0];
 const cu=(await c.query('SELECT account_status,customer_level_id FROM public.customers WHERE customer_id=$1 FOR SHARE',[customerId])).rows[0];
 const active=!!veh&&!!cy&&!cy.ended_at&&!veh.archived_at&&
   ((veh.source_type==='wholesale'&&veh.source_sale_status==='active')||
    (['mingbang','four_s'].includes(veh.source_type)&&veh.source_sale_status==='available'));
 const entitled=!!cu&&cu.account_status==='active'&&(await c.query('SELECT find_enabled FROM public.f05_6_level_find_policy_ci WHERE level_id=$1 FOR SHARE',[cu.customer_level_id])).rows[0]?.find_enabled===true;
 const exclusive=(await c.query("SELECT customer_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 "+
 "AND status='active' AND expires_at>statement_timestamp() LIMIT 1",[vehicleId,listingCycleId])).rows[0];
 const blocked=!!exclusive&&Number(exclusive.customer_id)!==Number(customerId);
 const rec=(await c.query("SELECT r.recommendation_id FROM public.recommendations r "+
  "JOIN public.f05_9_recommendation_facts_ci s ON s.recommendation_id=r.recommendation_id "+
  "WHERE r.vehicle_id=$1 AND r.customer_id=$2 AND r.listing_cycle_id=$3 AND r.status='active' LIMIT 1 FOR SHARE OF r,s",
  [vehicleId,customerId,listingCycleId])).rows[0];
 const grant=rec?(await c.query("SELECT grant_id FROM public.vehicle_visibility_grants "+
  "WHERE source_recommendation_id=$1 AND vehicle_id=$2 AND customer_id=$3 AND revoked_at IS NULL LIMIT 1 FOR SHARE",
  [rec.recommendation_id,vehicleId,customerId])).rows[0]:null;
 const publicVisible=active&&veh.platform_visibility==='visible'&&!blocked;
 const authorized=active&&!blocked&&(publicVisible||(!!rec&&!!grant&&entitled));
 const right=(await c.query("SELECT original_recommendation_id FROM public.f05_9_price_right_ci "+
  "WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 FOR SHARE",
 [customerId,vehicleId,listingCycleId])).rows[0];
 const numeric=authorized&&entitled&&!!right?
   (await c.query('SELECT customer_display_cents FROM public.f05_4_current_price_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 FOR SHARE',[vehicleId,listingCycleId])).rows[0]?.customer_display_cents:null;
 // NO VIN, no internal prices, contact, Match/Priority details, documents.
 return OK('F05_9_SAFE_CUSTOMER_PROJECTION',{vehicleId:Number(vehicleId),listingCycleId:Number(listingCycleId),
  currentSaleable:active,visible:authorized,publicVisible,
  recommendationOnlyVisible:authorized&&!publicVisible,
  hasCurrentRecommendation:!!rec,currentCycleFreeWholesaleRight:active&&!!right,
  priceStatus:authorized&&entitled&&right?(numeric?'synthetic_digital':'price_consultation'):'not_authorized',
  customerDisplayCents:numeric??null,entry,moreVehicles:true});
}
// Read-only Customer projection is a single serialized CI transaction.
// Vehicle FOR SHARE is held until COMMIT, serializing with the signed
// F05-8 Vehicle-first Priority mutation/Vehicle visibility lifecycle.
// The caller must supply an idle, dedicated PG Client (not a managed transaction).
export async function customerProjectionCI(c,query={}){
 const {customerId,vehicleId,listingCycleId,entry='detail',syntheticCustomerIdentity}=query;
 if(syntheticCustomerIdentity!=='CI_SYNTHETIC_CUSTOMER_IDENTITY_NOT_PRODUCTION'||
   ![customerId,vehicleId,listingCycleId].every(positive)||
   !['detail','ordinary_share','my_recommendations'].includes(entry))
  return FAIL('F05_9_PRODUCTION_CUSTOMER_ISSUER_NOT_WIRED');
 await c.query('BEGIN ISOLATION LEVEL READ COMMITTED');
 try{
  const result=await customerProjectionReadCI(c,query);
  await c.query('COMMIT');
  return result;
 }catch(error){
  await c.query('ROLLBACK').catch(()=>{});
  throw error;
 }
}
export const productionDeny=()=>FAIL('F05_9_PRODUCTION_RECOMMENDATION_ISSUER_NOT_WIRED');
