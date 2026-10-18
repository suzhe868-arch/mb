// PDM-14 F05-9 isolated PG16 Recommendation: Match/Priority never automatically grant.
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const bearer=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const resp=(status,code,rest={})=>({status,body:{code,...rest,productionReady:false}});
export function createIsolatedRecommendationService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('F05_RECOMMENDATION_FORMAL_ISSUER_REQUIRED');
 return Object.freeze({async mutate({credential,action,customerId,vehicleId,listingCycleId,sourceDemandId=null,eventKey}={}){
  if(!bearer(credential))return resp(401,'REC_EMPLOYEE_REQUIRED');
  if(!['CREATE','END','VOID'].includes(action)||![customerId,vehicleId,listingCycleId].every(id)||
   (sourceDemandId!==null&&!id(sourceDemandId))||!key(eventKey)||
   (action!=='CREATE'&&sourceDemandId!==null))return resp(400,'REC_INVALID_REQUEST');
  const fingerprint=sha(JSON.stringify([action,customerId,vehicleId,listingCycleId,sourceDemandId]));
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query("SELECT emp.employee_id FROM public.f05_catalog_employee_sessions_test session "+
     "JOIN public.employees emp ON emp.employee_id=session.employee_id "+
     "JOIN public.roles role ON role.role_id=emp.main_role_id "+
     "JOIN public.f05_recommendation_manage_scope_test scope ON scope.employee_id=emp.employee_id AND scope.customer_id=$2 "+
     "WHERE session.token_sha256=$1 AND session.issuer='DISPOSABLE_TEST_ONLY' AND session.revoked_at IS NULL "+
     "AND session.expires_at>statement_timestamp() AND emp.employment_status='active' "+
     "AND role.role_code IN('sales','manager','store_head') AND scope.can_manage=true "+
     "AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp() "+
     "FOR SHARE OF session,emp,role,scope",[sha(credential),customerId])).rows[0];
    if(!actor){await db.query('ROLLBACK');return resp(403,'REC_EMPLOYEE_SCOPE_REQUIRED')}
    const employeeId=String(actor.employee_id);
    // Same vehicle row lock prevents concurrent revoke/new create/visible->hidden races.
    const vehicle=(await db.query("SELECT v.vehicle_id,v.source_type,v.source_sale_status,v.archived_at,v.platform_visibility "+
     "FROM public.vehicles v WHERE v.vehicle_id=$1 FOR UPDATE",[vehicleId])).rows[0];
    if(!vehicle){await db.query('ROLLBACK');return resp(404,'REC_VEHICLE_NOT_FOUND')}
    const customer=(await db.query("SELECT customer_id,account_status,current_owner_employee_id,customer_level_id "+
     "FROM public.customers WHERE customer_id=$1 FOR SHARE",[customerId])).rows[0];
    if(!customer||String(customer.current_owner_employee_id)!==employeeId){
     await db.query('ROLLBACK');return resp(403,'REC_CURRENT_OWNER_REQUIRED');
    }
    // Replay is evaluated after current identity/scope, never a bypass via old token.
    await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_REC_EVENT'),hashtext($1))",[eventKey]);
    const replay=(await db.query("SELECT fingerprint,actor_employee_id,recommendation_id,action "+
     "FROM public.f05_recommendation_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(replay){
     await db.query('ROLLBACK');
     if(replay.fingerprint!==fingerprint||String(replay.actor_employee_id)!==employeeId)
      return resp(409,'REC_IDEMPOTENCY_COLLISION');
     return resp(200,'REC_REPLAY',{recommendationId:String(replay.recommendation_id),action:replay.action});
    }
    const cycle=(await db.query("SELECT 1 FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 "+
     "AND vehicle_id=$2 AND ended_at IS NULL FOR SHARE",[listingCycleId,vehicleId])).rows[0];
    if(!cycle){await db.query('ROLLBACK');return resp(409,'REC_LISTING_CYCLE_NOT_CURRENT')}
    const existing=(await db.query("SELECT recommendation_id,status,source_demand_id,recommender_employee_id "+
     "FROM public.recommendations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 "+
     "AND status='active' FOR UPDATE",[customerId,vehicleId,listingCycleId])).rows[0];
    if(action==='CREATE'){
     const eligible=customer.account_status==='active'&&
      ((vehicle.source_type==='wholesale'&&vehicle.source_sale_status==='active')||
       (['mingbang','four_s'].includes(vehicle.source_type)&&vehicle.source_sale_status==='available'))
      &&vehicle.archived_at===null;
     if(!eligible){await db.query('ROLLBACK');return resp(409,'REC_CUSTOMER_OR_VEHICLE_INELIGIBLE')}
     const level=(await db.query("SELECT 1 FROM public.f05_find_car_level_entitlement_test "+
      "WHERE level_id=$1 AND issuer='DISPOSABLE_TEST_ONLY' AND can_activate_demand=true "+
      "AND expires_at>statement_timestamp() FOR SHARE",[String(customer.customer_level_id)])).rows[0];
     if(!level){await db.query('ROLLBACK');return resp(403,'REC_FIND_CAR_ENTITLEMENT_REQUIRED')}
     const source=(await db.query("SELECT 1 FROM public.f05_real_catalog_visibility_test "+
      "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND source_type=$3 "+
      "AND verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' "+
      "AND expires_at>statement_timestamp() FOR SHARE",
      [vehicleId,listingCycleId,vehicle.source_type])).rows[0];
     if(!source){await db.query('ROLLBACK');return resp(409,'REC_SOURCE_PROOF_REQUIRED')}
     const rival=(await db.query("SELECT 1 FROM public.priority_leases WHERE vehicle_id=$1 AND listing_cycle_id=$2 "+
      "AND status='active' AND expires_at>statement_timestamp() AND customer_id<>$3 FOR SHARE",
      [vehicleId,listingCycleId,customerId])).rows[0];
     if(rival){await db.query('ROLLBACK');return resp(409,'REC_OTHER_PRIORITY_EXCLUSIVE')}
     if(sourceDemandId!==null){
      const demand=(await db.query("SELECT 1 FROM public.demands WHERE demand_id=$1 AND customer_id=$2 "+
       "AND responsible_employee_id=$3 AND demand_state='active' FOR SHARE",
       [sourceDemandId,customerId,employeeId])).rows[0];
      if(!demand){await db.query('ROLLBACK');return resp(403,'REC_SOURCE_DEMAND_SCOPE_REQUIRED')}
     }
    }else if(!existing){await db.query('ROLLBACK');return resp(404,'REC_ACTIVE_NOT_FOUND')}
    let recId,code,kind,before=null;
    if(action==='CREATE'&&existing){
     recId=String(existing.recommendation_id);code='REC_ACTIVE_REUSED';kind='TOUCH';
    }else if(action==='CREATE'){
     const created=(await db.query("INSERT INTO public.recommendations "+
      "(vehicle_id,customer_id,listing_cycle_id,source_demand_id,status,recommender_employee_id) "+
      "VALUES($1,$2,$3,$4,'active',$5) RETURNING recommendation_id",
      [vehicleId,customerId,listingCycleId,sourceDemandId,employeeId])).rows[0];
     recId=String(created.recommendation_id);code='REC_CREATED';kind='CREATE';
     const price=(await db.query("SELECT customer_display_cents FROM public.f05_catalog_price_display_proof_test "+
      "WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND source_type=$3 "+
      "AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
      [vehicleId,listingCycleId,vehicle.source_type])).rows[0];
     await db.query("INSERT INTO public.f05_recommendation_snapshot_test "+
      "(recommendation_id,customer_id,vehicle_id,listing_cycle_id,customer_price_cents,source_kind,"+
      "original_recommender,original_source_demand) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [recId,customerId,vehicleId,listingCycleId,price?.customer_display_cents??null,
       vehicle.source_type,employeeId,sourceDemandId]);
     if(vehicle.platform_visibility==='hidden')await db.query(
      "INSERT INTO public.vehicle_visibility_grants(vehicle_id,customer_id,source_recommendation_id) "+
      "VALUES($1,$2,$3)",[vehicleId,customerId,recId]);
    }else{
     recId=String(existing.recommendation_id);kind=action;
     before={status:'active'};
     await db.query("UPDATE public.recommendations SET status=$2 WHERE recommendation_id=$1",
      [recId,action==='VOID'?'void':'ended']);
     await db.query("UPDATE public.vehicle_visibility_grants SET revoked_at=statement_timestamp() "+
      "WHERE source_recommendation_id=$1 AND revoked_at IS NULL",[recId]);
     code=action==='VOID'?'REC_VOIDED':'REC_ENDED';
    }
    await db.query("INSERT INTO public.f05_recommendation_events_test "+
     "(event_key,fingerprint,actor_employee_id,recommendation_id,action,before_json,after_json) "+
     "VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)",
     [eventKey,fingerprint,employeeId,recId,kind,before?JSON.stringify(before):null,
      JSON.stringify({status:kind==='VOID'?'void':kind==='END'?'ended':'active',
       source:'DISPOSABLE_TEST_ONLY',visibilityGrantOnlyFromRecommendation:true})]);
    await db.query('COMMIT');
    return resp(200,code,{recommendationId:recId,customerId,vehicleId,listingCycleId,
     noAutomaticPriority:true,noAutomaticLock:true});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
