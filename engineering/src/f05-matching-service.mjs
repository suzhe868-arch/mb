// PDM12 isolated single Demand x Vehicle matching. Genuine F02 frozen Match Results.
// Not a full Rule Dictionary and never a Recommendation, grant, Priority or Lock.
import {createHash} from 'node:crypto';
import {parseExplicitSalesDescription,evaluateExplicitMatch} from './f05-matching-evaluator.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const id=s=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
const validBearer=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
const validKey=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(s);
const reply=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
export function createIsolatedMatchingService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('PDM12_FORMAL_MATCHING_ISSUER_REQUIRED');
 return Object.freeze({async recompute({credential,demandId,vehicleId,eventKey}){
  if(!id(demandId)||!id(vehicleId)||!validKey(eventKey))return reply(400,'MATCH_INVALID_REQUEST');
  if(!validBearer(credential))return reply(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query("SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
     "AND e.employment_status='active' AND r.role_code IN ('sales','manager','store_head') "+
     "FOR SHARE OF s,e,r",[sha(credential)])).rows[0];
    if(!actor){await db.query('ROLLBACK');return reply(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const employeeId=String(actor.employee_id);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",['F05_MATCH_EVENT',eventKey]);
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",['F05_MATCH_PAIR',demandId+':'+vehicleId]);
    const demand=(await db.query("SELECT d.demand_id,d.customer_id,d.responsible_employee_id,d.demand_state,"+
     "c.account_status,c.customer_level_id "+
     "FROM public.demands d JOIN public.customers c ON c.customer_id=d.customer_id "+
     "WHERE d.demand_id=$1 FOR UPDATE OF d",[demandId])).rows[0];
    if(!demand){await db.query('ROLLBACK');return reply(404,'DEMAND_NOT_FOUND')}
    const customerId=String(demand.customer_id);
    if(String(demand.responsible_employee_id)!==employeeId){
     await db.query('ROLLBACK');return reply(403,'MATCH_RESPONSIBLE_EMPLOYEE_REQUIRED');
    }
    const permission=(await db.query("SELECT 1 FROM public.f05_matching_employee_scope_test p "+
     "WHERE p.employee_id=$1 AND p.customer_id=$2 AND p.can_recompute=true "+
     "AND p.issuer='DISPOSABLE_TEST_ONLY' AND p.expires_at>statement_timestamp() "+
     "FOR SHARE OF p",[employeeId,customerId])).rows[0];
    if(!permission){await db.query('ROLLBACK');return reply(403,'MATCH_EXPLICIT_SCOPE_REQUIRED')}
    const payload=sha(JSON.stringify([employeeId,demandId,vehicleId,'RECOMPUTE_EXPLICIT_V1']));
    const earlier=(await db.query("SELECT actor_employee_id,demand_id,vehicle_id,payload_sha256,result_id,result_tier "+
     "FROM public.f05_matching_recompute_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(earlier){
     await db.query('ROLLBACK');
     if(String(earlier.actor_employee_id)!==employeeId||String(earlier.demand_id)!==demandId||
      String(earlier.vehicle_id)!==vehicleId||earlier.payload_sha256!==payload)
      return reply(409,'MATCH_IDEMPOTENCY_COLLISION');
     return reply(200,'MATCH_RECOMPUTE_REPLAY',{demandId,vehicleId,resultId:String(earlier.result_id),
      matchTier:earlier.result_tier,matchingReady:true,historicalSnapshot:true});
    }
    const entitled=(await db.query("SELECT can_activate_demand FROM public.f05_find_car_level_entitlement_test "+
     "WHERE level_id=$1 AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
     [String(demand.customer_level_id)])).rows[0];
    if(demand.demand_state!=='active'||demand.account_status!=='active'||entitled?.can_activate_demand!==true){
     await db.query('ROLLBACK');return reply(409,'DEMAND_NOT_MATCHING_ELIGIBLE');
    }
    const description=(await db.query("SELECT sales_description,written_by_employee_id FROM public.f05_matching_sales_description_test "+
     "WHERE demand_id=$1 AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
     [demandId])).rows[0];
    if(!description||String(description.written_by_employee_id)!==employeeId){
     await db.query('ROLLBACK');return reply(409,'MATCH_SALES_DESCRIPTION_REQUIRED');
    }
    const parsed=parseExplicitSalesDescription(description.sales_description);
    if(!parsed.ready){await db.query('ROLLBACK');return reply(409,'MATCH_NOT_READY',{reason:parsed.reason})}
    const row=(await db.query("SELECT v.vehicle_id,v.source_type,v.source_sale_status,v.archived_at,"+
     "cy.listing_cycle_id,cy.ended_at,vm.brand_id,vm.model_year,"+
     "facts.source_brand_id,facts.source_model_year,facts.mileage_km,facts.interior_color,"+
     "price.customer_display_cents "+
     "FROM public.vehicles v "+
     "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL "+
     "JOIN public.f05_real_catalog_visibility_test src ON src.vehicle_id=v.vehicle_id "+
     "AND src.listing_cycle_id=cy.listing_cycle_id AND src.source_type=v.source_type "+
     "AND src.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' "+
     "AND src.expires_at>statement_timestamp() "+
     "LEFT JOIN public.vehicle_models vm ON vm.model_id=v.model_id "+
     "LEFT JOIN public.f05_matching_vehicle_facts_test facts ON facts.vehicle_id=v.vehicle_id "+
     "AND facts.listing_cycle_id=cy.listing_cycle_id AND facts.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND facts.expires_at>statement_timestamp() "+
     "LEFT JOIN public.f05_catalog_price_display_proof_test price "+
     "ON price.vehicle_id=v.vehicle_id AND price.listing_cycle_id=cy.listing_cycle_id "+
     "AND price.source_type=v.source_type AND price.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND price.expires_at>statement_timestamp() "+
     "WHERE v.vehicle_id=$1 LIMIT 1 FOR SHARE OF v,cy,src",[vehicleId])).rows[0];
    if(!row){await db.query('ROLLBACK');return reply(404,'MATCH_VEHICLE_FACT_SOURCE_NOT_READY')}
    const sellable=row.archived_at===null&&
     ((row.source_type==='wholesale'&&row.source_sale_status==='active')||
      (['mingbang','four_s'].includes(row.source_type)&&row.source_sale_status==='available'));
    if(!sellable){await db.query('ROLLBACK');return reply(409,'MATCH_VEHICLE_NOT_SELLABLE')}
    const field=(local,source)=>{
     if(local!==null&&local!==undefined&&source!==null&&source!==undefined&&String(local)!==String(source))return null;
     return local??source??null;
    };
    const matched=evaluateExplicitMatch(parsed,{
     brandId:field(row.brand_id,row.source_brand_id),
     minModelYear:field(row.model_year,row.source_model_year),
     maxMileageKm:row.mileage_km,
     interiorColor:row.interior_color,
     customerDisplayCents:row.customer_display_cents
    });
    const cycleId=String(row.listing_cycle_id);
    matched.explanation.sourceFacts={
     vehicleId,listingCycleId:cycleId,hiddenButEligible:true,
     brandId:field(row.brand_id,row.source_brand_id),
     modelYear:field(row.model_year,row.source_model_year),
     mileageKm:row.mileage_km??null,
     interiorColor:row.interior_color??null,
     customerDisplayCents:row.customer_display_cents===null?null:String(row.customer_display_cents),
     issuer:'DISPOSABLE_TEST_ONLY',provenance:'STANDALONE_EXPLICIT_FIXTURE'
    };
    // Keep the original frozen Demand criteria structured but do not turn empty
    // staff description into synthetic rules. No customer raw text is parsed.
    await db.query("UPDATE public.demands SET criteria_json=$2::jsonb WHERE demand_id=$1",
     [demandId,JSON.stringify(parsed.criteria)]);
    // One current row per Demand x Vehicle x cycle; older rows become stale history.
    await db.query("UPDATE public.demand_match_results SET current_state='stale',invalidated_at=statement_timestamp() "+
     "WHERE demand_id=$1 AND vehicle_id=$2 AND current_state='current'",[demandId,vehicleId]);
    const created=(await db.query("INSERT INTO public.demand_match_results "+
     "(demand_id,vehicle_id,listing_cycle_id,match_tier,match_explanation,current_state,calculated_at) "+
     "VALUES($1,$2,$3,$4,$5::jsonb,'current',statement_timestamp()) RETURNING result_id",
     [demandId,vehicleId,cycleId,matched.tier,JSON.stringify(matched.explanation)])).rows[0];
    await db.query("INSERT INTO public.f05_matching_recompute_events_test "+
     "(event_key,actor_employee_id,demand_id,vehicle_id,result_id,result_tier,payload_sha256) "+
     "VALUES($1,$2,$3,$4,$5,$6,$7)",
     [eventKey,employeeId,demandId,vehicleId,String(created.result_id),matched.tier,payload]);
    await db.query('COMMIT');
    return reply(200,'MATCH_RESULT_RECOMPUTED',{demandId,vehicleId,listingCycleId:cycleId,
     resultId:String(created.result_id),matchTier:matched.tier,matchingReady:true,
     noRecommendation:true,noPriority:true,noVisibilityGrant:true,
     explanation:matched.explanation});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
