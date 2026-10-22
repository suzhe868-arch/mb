// Separate fail-closed disposable PG16 caller, not the F01/F03 database.
import {randomBytes} from 'node:crypto';
import {createCatalogService} from './catalog-service.mjs';
import {createCatalogHandler} from './catalog-http.mjs';
import {createIsolatedCatalogCustomerReadService} from './f05-catalog-customer-read-service.mjs';
import {createIsolatedCatalogSearchService} from './f05-catalog-search.mjs';
import {createIsolatedFavoriteService} from './f05-favorite-service.mjs';
import {createIsolatedFavoriteHandler} from './f05-favorite-http.mjs';
import {createIsolatedConsultationService} from './f05-consultation-service.mjs';
import {createIsolatedConsultationHandler} from './f05-consultation-http.mjs';
import {createIsolatedConsultationResponseService} from './f05-consultation-response-service.mjs';
import {createIsolatedConsultationResponseHandler} from './f05-consultation-response-http.mjs';
import {createIsolatedEmployeeStartService} from './f05-employee-start-service.mjs';
import {createIsolatedEmployeeStartHandler} from './f05-employee-start-http.mjs';
import {createIsolatedHandoverService} from './f05-handover-service.mjs';
import {createIsolatedHandoverHandler} from './f05-handover-http.mjs';
import {createIsolatedSlaHoldService} from './f05-sla-hold-service.mjs';
import {createIsolatedSlaHoldHandler} from './f05-sla-hold-http.mjs';
import {createIsolatedPriceUnlockService} from './f05-price-unlock-service.mjs';
import {createIsolatedPriceUnlockHandler} from './f05-price-unlock-http.mjs';
import {createIsolatedQuotaAdditionService} from './f05-quota-addition-service.mjs';
import {createIsolatedQuotaAdditionHandler} from './f05-quota-addition-http.mjs';
import {createIsolatedFindCarService} from './f05-find-car-service.mjs';
import {createIsolatedFindCarHandler} from './f05-find-car-http.mjs';
import {createIsolatedFindCarActivationService} from './f05-find-car-activation-service.mjs';
import {createIsolatedFindCarActivationHandler} from './f05-find-car-activation-http.mjs';
import {createIsolatedDemandLifecycleService} from './f05-demand-lifecycle-service.mjs';
import {createIsolatedDemandLifecycleHandler} from './f05-demand-lifecycle-http.mjs';
import {createIsolatedEmployeeVehicleReadService} from './f05-employee-vehicle-read-service.mjs';
import {createIsolatedEmployeeVehicleReadHandler} from './f05-employee-vehicle-read-http.mjs';
import {createIsolatedMatchingService} from './f05-matching-service.mjs';
import {createIsolatedMatchingHandler} from './f05-matching-http.mjs';
import {createIsolatedDictionaryService} from './f05-matching-dictionary-service.mjs';
import {createIsolatedDictionaryHandler} from './f05-matching-dictionary-http.mjs';
import {createIsolatedMatchingDiscoveryService} from './f05-matching-discovery-service.mjs';
import {createIsolatedMatchingDiscoveryHandler} from './f05-matching-discovery-http.mjs';
import {createIsolatedRecommendationService} from './f05-recommendation-service.mjs';
import {createIsolatedRecommendationHandler} from './f05-recommendation-http.mjs';
import {createIsolatedPriorityService} from './f05-priority-service.mjs';
import {createIsolatedPriorityHandler} from './f05-priority-http.mjs';
import {createIsolatedPriorityQualificationService} from './f05-priority-qualification-service.mjs';
import {createIsolatedPriorityQualificationHandler} from './f05-priority-qualification-http.mjs';
export function validateCatalogEnv(env=process.env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('CATALOG_TEST_ONLY');
 if(env.API_HOST && !['127.0.0.1','localhost','::1'].includes(env.API_HOST))throw Error('CATALOG_LOOPBACK_REQUIRED');
 if(!env.F05_CATALOG_DATABASE_URL)throw Error('CATALOG_DATABASE_REQUIRED');
 let u;try{u=new URL(env.F05_CATALOG_DATABASE_URL)}catch{throw Error('CATALOG_DB_URI_INVALID')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f05_catalog_test'||u.username!=='f05_catalog_ci'||!u.password||u.search||u.hash)throw Error('CATALOG_DATABASE_NOT_ISOLATED');
 return {connectionString:env.F05_CATALOG_DATABASE_URL};
}
// Availability must be rechecked at request time, not only at startup.
// A successful SELECT 1 alone is insufficient if the test schema was dropped.
export const SQL_CATALOG_IDENTITY = "SELECT current_setting('server_version_num')::integer AS v,current_database() AS db,current_user AS role";
// DB identity is not proof of table shape. A same-named, incompatible fixture must be denied.
// Expected original Vehicle/Cycle column types come from the sealed M94 catalog;
// p/x are additive test-only sidecars, never production source evidence.
const REQUIRED_CATALOG_COLUMNS=Object.freeze([
 ['public.vehicles','vehicle_id','bigint'],
 ['public.vehicles','source_type','text'],
 ['public.vehicles','source_sale_status','text'],
 ['public.vehicles','platform_visibility','text'],
 ['public.vehicles','archived_at','timestamp with time zone'],
 ['public.vehicles','model_id','bigint'],
 ['public.vehicle_listing_cycles','vehicle_id','bigint'],
 ['public.vehicle_listing_cycles','listing_cycle_id','bigint'],
 ['public.vehicle_listing_cycles','started_at','timestamp with time zone'],
 ['public.vehicle_listing_cycles','ended_at','timestamp with time zone'],
 ['public.f05_real_catalog_visibility_test','vehicle_id','bigint'],
 ['public.f05_real_catalog_visibility_test','listing_cycle_id','bigint'],
 ['public.f05_real_catalog_visibility_test','source_type','text'],
 ['public.f05_real_catalog_visibility_test','allow_anonymous','boolean'],
 ['public.f05_real_catalog_visibility_test','verified_isolation','text'],
 ['public.f05_real_catalog_visibility_test','expires_at','timestamp with time zone'],
 ['public.f05_real_catalog_protections_test','vehicle_id','bigint'],
 ['public.f05_real_catalog_protections_test','listing_cycle_id','bigint'],
 ['public.f05_real_catalog_protections_test','ended_at','timestamp with time zone'],
 ['public.f05_real_catalog_photo_order_test','image_id','bigint'],
 ['public.f05_real_catalog_photo_order_test','vehicle_id','bigint'],
 ['public.f05_real_catalog_photo_order_test','source_type','text'],
 ['public.f05_real_catalog_photo_order_test','original_sort_index','integer'],
 ['public.f05_real_catalog_photo_order_test','verified_isolation','text'],
 ['public.f05_catalog_customer_sessions_test','token_sha256','text'],
 ['public.f05_catalog_customer_sessions_test','customer_id','bigint'],
 ['public.f05_catalog_favorite_states_test','customer_id','bigint'],
 ['public.f05_catalog_favorite_states_test','vehicle_id','bigint'],
 ['public.f05_catalog_favorite_states_test','current_state','text'],
 ['public.f05_catalog_favorite_events_test','event_key','text'],
 ['public.f05_catalog_favorite_events_test','payload_sha256','text'],
 ['public.f05_catalog_consultation_actor_proof_test','customer_id','bigint'],
 ['public.f05_catalog_consultation_actor_proof_test','assignee_employee_id','bigint'],
 ['public.f05_catalog_consultation_actions_test','event_key','text'],
 ['public.f05_catalog_consultation_actions_test','consultation_id','bigint'],
 ['public.f05_catalog_consultation_actions_test','actor_employee_id','bigint'],
 ['public.f05_catalog_consultation_actions_test','old_assignee_employee_id','bigint'],
 ['public.f05_catalog_consultation_actions_test','new_assignee_employee_id','bigint'],
 ['public.f05_catalog_consultation_actions_test','handover_reason','text'],
 ['public.f05_catalog_employee_sessions_test','token_sha256','text'],
 ['public.f05_catalog_employee_sessions_test','employee_id','bigint'],
 ['public.f05_catalog_employee_consultation_scope_test','employee_id','bigint'],
 ['public.f05_catalog_employee_consultation_scope_test','customer_id','bigint'],
 ['public.f05_catalog_employee_consultation_scope_test','can_finalize','boolean'],
 ['public.f05_catalog_employee_consultation_scope_test','can_reassign','boolean'],
 ['public.f05_catalog_employee_consultation_scope_test','can_receive','boolean'],
 ['public.f05_catalog_employee_consultation_scope_test','can_resume_hold','boolean'],
 ['public.f05_catalog_employee_consultation_scope_test','can_record_human_response','boolean'],
 ['public.f05_consultation_human_response_events_test','event_key','text'],
 ['public.f05_consultation_human_response_events_test','is_first_response','boolean'],
 ['public.f05_priority_schedule_jobs_test','state','text'],
 ['public.f05_priority_schedule_jobs_test','attempts','integer'],
 ['public.f05_priority_schedule_events_test','action','text'],
 ['public.f05_catalog_consultation_sla_test','consultation_id','bigint'],
 ['public.f05_catalog_consultation_sla_test','effective_deadline','timestamp with time zone'],
 ['public.f05_catalog_consultation_sla_test','first_human_response_at','timestamp with time zone'],
 ['public.f05_catalog_consultation_hold_test','consultation_id','bigint'],
 ['public.f05_catalog_consultation_hold_test','active','boolean'],
 ['public.f05_catalog_consultation_hold_test','remaining_ms','bigint'],
 ['public.f05_catalog_consultation_hold_events_test','consultation_id','bigint'],
 ['public.f05_catalog_consultation_hold_events_test','action','text'],
 ['public.customer_day_quota_ledger','business_day_shanghai','date'],
 ['public.customer_price_cycle_unlocks','listing_cycle_id','bigint'],
 ['public.customer_price_unlock_events','idempotency_key','text'],
 ['public.f05_catalog_price_entitlement_test','level_id','bigint'],
 ['public.f05_catalog_price_entitlement_test','price_access_mode','text'],
 ['public.f05_catalog_price_display_proof_test','vehicle_id','bigint'],
 ['public.f05_catalog_price_display_proof_test','customer_display_cents','bigint'],
 ['public.customer_quota_adjustments','delta','integer'],
 ['public.f05_catalog_quota_staff_scope_test','employee_id','bigint'],
 ['public.f05_catalog_quota_staff_scope_test','customer_id','bigint'],
 ['public.f05_catalog_quota_addition_events_test','idempotency_key','text'],
 ['public.f05_catalog_quota_addition_events_test','before_remaining','integer'],
 ['public.find_car_applications','application_id','bigint'],
 ['public.find_car_applications','assigned_employee_id','bigint'],
 ['public.find_car_applications','activated_demand_id','bigint'],
 ['public.f05_find_car_phone_proof_test','customer_id','bigint'],
 ['public.f05_find_car_level_entitlement_test','can_activate_demand','boolean'],
 ['public.f05_find_car_application_detail_test','revision','bigint'],
 ['public.f05_find_car_application_events_test','event_key','text'],
 ['public.f05_find_car_application_events_test','actor_employee_id','bigint'],
 ['public.f05_find_car_application_events_test','result_demand_id','bigint'],
 ['public.f05_find_car_activation_scope_test','employee_id','bigint'],
 ['public.f05_find_car_activation_scope_test','customer_id','bigint'],
 ['public.demand_match_results','match_tier','text'],
 ['public.demand_match_results','current_state','text'],
 ['public.demand_match_results','match_explanation','jsonb'],
 ['public.f05_matching_employee_scope_test','can_recompute','boolean'],
 ['public.f05_matching_sales_description_test','sales_description','text'],
 ['public.f05_matching_vehicle_facts_test','source_brand_id','bigint'],
 ['public.f05_matching_vehicle_facts_test','mileage_km','integer'],
 ['public.f05_matching_vehicle_facts_test','exterior_color','text'],
 ['public.f05_matching_vehicle_facts_test','power_type','text'],
 ['public.f05_matching_vehicle_facts_test','displacement_cc','integer'],
 ['public.f05_matching_vehicle_facts_test','condition_flags','text[]'],
 ['public.f05_matching_recompute_events_test','event_key','text'],
 ['public.f05_matching_affected_queue_test','demand_id','bigint'],
 ['public.f05_matching_affected_queue_test','vehicle_id','bigint'],
 ['public.f05_matching_affected_queue_test','generation','bigint'],
 ['public.f05_matching_affected_queue_test','state','text'],
 ['public.f05_matching_rule_manage_scope_test','employee_id','bigint'],
 ['public.f05_matching_dictionary_rules_test','rule_id','bigint'],
 ['public.f05_matching_dictionary_rules_test','version','bigint'],
 ['public.f05_matching_dictionary_history_test','event_key','text'],
 ['public.f05_matching_discovery_events_test','event_key','text'],
 ['public.f05_matching_discovery_events_test','queued_count','integer'],
 ['public.f05_matching_discovery_events_test','has_more','boolean'],
 ['public.f05_recommendation_manage_scope_test','employee_id','bigint'],
 ['public.f05_recommendation_snapshot_test','recommendation_id','bigint'],
 ['public.f05_recommendation_events_test','event_key','text'],
 ['public.f05_recommendation_price_grant_events_test','unlock_id','bigint'],
 ['public.f05_priority_qualification_test','enabled','boolean'],
 ['public.f05_priority_qualification_test','revision','bigint'],
 ['public.f05_priority_qualification_manage_scope_test','can_manage','boolean'],
 ['public.f05_priority_qualification_events_test','event_key','text'],
 ['public.f05_priority_employee_scope_test','employee_id','bigint'],
 ['public.f05_priority_config_test','ttl_seconds','integer'],
 ['public.f05_priority_suppression_test','source_match_result_id','bigint'],
 ['public.f05_priority_events_test','event_key','text'],
 ['public.f05_priority_sweep_events_test','priority_id','bigint'],
  ['public.f05_demand_lifecycle_events_test','reason_text','text'],
  ['public.f05_catalog_employee_consultation_scope_test','can_manage_consultation','boolean'],
 ['public.f05_vehicle_read_scope_test','source_type','text'],
 ['public.f05_catalog_sort_facts_test','first_registration_year','integer'],
 ['public.f05_catalog_sort_facts_test','mileage_km','integer'],
]);
const EXPECTED_COLUMNS_VALUES=REQUIRED_CATALOG_COLUMNS.map(x=>`('${x[0]}','${x[1]}','${x[2]}')`).join(',');
export const SQL_CATALOG_SCHEMA=`SELECT
 to_regclass('public.vehicles') IS NOT NULL AS v,
 to_regclass('public.vehicle_listing_cycles') IS NOT NULL AS c,
 to_regclass('public.f05_real_catalog_visibility_test') IS NOT NULL AS p,
 to_regclass('public.f05_real_catalog_protections_test') IS NOT NULL AS x,
 to_regclass('public.f05_real_catalog_photo_order_test') IS NOT NULL AS po,
 to_regclass('public.f05_catalog_customer_sessions_test') IS NOT NULL AS fs,
 to_regclass('public.f05_catalog_favorite_states_test') IS NOT NULL AS ft,
 to_regclass('public.f05_catalog_favorite_events_test') IS NOT NULL AS fe,
 to_regclass('public.f05_catalog_consultation_actor_proof_test') IS NOT NULL AS cp,
 to_regclass('public.f05_catalog_consultation_actions_test') IS NOT NULL AS ca,
 to_regclass('public.f05_catalog_employee_sessions_test') IS NOT NULL AS es,
 to_regclass('public.f05_catalog_employee_consultation_scope_test') IS NOT NULL AS ec,
 to_regclass('public.f05_catalog_consultation_sla_test') IS NOT NULL AS ss,
 to_regclass('public.f05_catalog_consultation_hold_test') IS NOT NULL AS sh,
 to_regclass('public.f05_catalog_consultation_hold_events_test') IS NOT NULL AS he,
 to_regclass('public.f05_catalog_price_entitlement_test') IS NOT NULL AS pe,
 to_regclass('public.f05_catalog_price_display_proof_test') IS NOT NULL AS pp,
 to_regclass('public.f05_catalog_quota_staff_scope_test') IS NOT NULL AS qs,
 to_regclass('public.f05_catalog_quota_addition_events_test') IS NOT NULL AS qa,
 to_regclass('public.f05_find_car_phone_proof_test') IS NOT NULL AS fcp,
 to_regclass('public.f05_find_car_level_entitlement_test') IS NOT NULL AS fce,
 to_regclass('public.f05_find_car_application_detail_test') IS NOT NULL AS fcd,
 to_regclass('public.f05_find_car_application_events_test') IS NOT NULL AS fca,
 to_regclass('public.f05_find_car_activation_scope_test') IS NOT NULL AS fac,
 to_regclass('public.f05_matching_employee_scope_test') IS NOT NULL AS me,
 to_regclass('public.f05_matching_sales_description_test') IS NOT NULL AS md,
 to_regclass('public.f05_matching_vehicle_facts_test') IS NOT NULL AS mv,
 to_regclass('public.f05_matching_recompute_events_test') IS NOT NULL AS mx,
 to_regclass('public.f05_matching_affected_queue_test') IS NOT NULL AS aq,
 to_regclass('public.f05_matching_safe_current_test') IS NOT NULL AS sv,
 to_regclass('public.f05_matching_rule_manage_scope_test') IS NOT NULL AS rp,
 to_regclass('public.f05_matching_dictionary_rules_test') IS NOT NULL AS ru,
 to_regclass('public.f05_matching_dictionary_history_test') IS NOT NULL AS ra,
 to_regclass('public.f05_matching_discovery_events_test') IS NOT NULL AS di,
 to_regclass('public.f05_recommendation_manage_scope_test') IS NOT NULL AS rs,
 to_regclass('public.f05_recommendation_snapshot_test') IS NOT NULL AS rn,
 to_regclass('public.f05_recommendation_events_test') IS NOT NULL AS re,
 to_regclass('public.f05_recommendation_price_grant_events_test') IS NOT NULL AS fr,
 to_regclass('public.f05_recommendation_safe_customer_test') IS NOT NULL AS rv,
 to_regclass('public.f05_priority_qualification_test') IS NOT NULL AS p8q,
 to_regclass('public.f05_priority_employee_scope_test') IS NOT NULL AS p8s,
 to_regclass('public.f05_priority_config_test') IS NOT NULL AS p8c,
 to_regclass('public.f05_priority_suppression_test') IS NOT NULL AS p8u,
 to_regclass('public.f05_priority_events_test') IS NOT NULL AS p8e,
 to_regclass('public.f05_priority_sweep_events_test') IS NOT NULL AS p8w,
 to_regclass('public.f05_priority_qualification_manage_scope_test') IS NOT NULL AS p8m,
 to_regclass('public.f05_priority_qualification_events_test') IS NOT NULL AS p8a,
 to_regclass('public.f05_priority_safe_active_test') IS NOT NULL AS p8v,
 (to_regclass('public.f05_priority_schedule_jobs_test') IS NOT NULL
  AND to_regclass('public.f05_priority_schedule_events_test') IS NOT NULL
  AND EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname='f05_priority_schedule_enqueue_after_insert_test' AND NOT tgisinternal)
  AND EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname='f05_priority_schedule_events_no_mutation_test' AND NOT tgisinternal)) AS p8j,
 to_regclass('public.f05_vehicle_read_scope_test') IS NOT NULL AS vr,
 to_regclass('public.f05_catalog_sort_facts_test') IS NOT NULL AS so,
 (to_regclass('public.f05_consultation_human_response_events_test') IS NOT NULL
  AND EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname='f05_human_response_events_immutable_test' AND NOT tgisinternal)) AS hr,
 (SELECT count(*)=2 FROM pg_catalog.pg_trigger WHERE NOT tgisinternal
  AND tgname IN ('f05_demand_customer_safety_pause_test',
   'f05_demand_entitlement_safety_pause_test')) AS da,
 (to_regclass('public.f05_demand_lifecycle_scope_test') IS NOT NULL
  AND to_regclass('public.f05_demand_end_requests_test') IS NOT NULL
  AND to_regclass('public.f05_demand_lifecycle_events_test') IS NOT NULL
  AND EXISTS(SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgname='f05_demand_lifecycle_events_no_mutation_test' AND NOT tgisinternal)) AS dl,
 (SELECT count(*)=26 FROM pg_catalog.pg_trigger t WHERE NOT t.tgisinternal AND t.tgname IN
 ('f05_match_customer_guard_test','f05_match_employee_authority_test','f05_match_demand_lifecycle_test',
  'f05_match_vehicle_saleability_test','f05_match_listing_cycle_test',
  'f05_match_level_entitlement_test','f05_matching_change_events_append_only_test',
  'f05_match_price_fact_test','f05_match_vehicle_fact_test','f05_match_sales_description_test',
  'f05_match_vehicle_model_assignment_test','f05_match_master_model_fact_test',
  'f05_price_before_vehicle_lock_test','f05_facts_before_vehicle_lock_test',
  'f05_match_queue_affected_test','f05_matching_dictionary_history_immutable_test','f05_discovery_immutable_test',
  'f05_rec_snapshot_immutable_test','f05_rec_events_immutable_test','f05_rec_visible_hidden_test',
  'f05_priority_events_immutable_test','f05_priority_suppression_immutable_test','f05_priority_core_guard_test',
  'f05_recommendation_free_grant_immutable_test','f05_priority_sweep_immutable_test',
  'f05_priority_qual_audit_immutable_test')) AS iv,
 NOT EXISTS (
  SELECT 1 FROM (VALUES ${EXPECTED_COLUMNS_VALUES}) AS expected(relation,column_name,physical_type)
  LEFT JOIN pg_catalog.pg_attribute attr
   ON attr.attrelid=to_regclass(expected.relation)
   AND attr.attname=expected.column_name AND attr.attnum>0 AND NOT attr.attisdropped
  WHERE attr.attname IS NULL OR pg_catalog.format_type(attr.atttypid,attr.atttypmod)<>expected.physical_type
 ) AS shape,
 (SELECT count(*)=127 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='public' AND c.relkind='r') AS full,
 (SELECT count(*)=2 FROM pg_catalog.pg_constraint fk
  WHERE fk.contype='f'
   AND fk.conrelid IN (to_regclass('public.f05_real_catalog_visibility_test'),to_regclass('public.f05_real_catalog_protections_test'))
   AND fk.confrelid=to_regclass('public.vehicle_listing_cycles')
   AND array_length(fk.conkey,1)=2 AND array_length(fk.confkey,1)=2) AS fk,
 (SELECT count(*)=1 FROM pg_catalog.pg_constraint fk
  WHERE fk.contype='f'
   AND fk.conrelid=to_regclass('public.f05_real_catalog_photo_order_test')
   AND fk.confrelid=to_regclass('public.vehicle_images')) AS pf`;
export async function probeIsolatedCatalog(pool){
 try{
  const identity=(await pool.query(SQL_CATALOG_IDENTITY)).rows[0];
  if(!identity || Math.floor(Number(identity.v)/10000)!==16 || identity.db!=='f05_catalog_test' || identity.role!=='f05_catalog_ci')return false;
  const schema=(await pool.query(SQL_CATALOG_SCHEMA)).rows[0];
  return !!schema && Object.keys(schema).sort().join(',')==='aq,c,ca,cp,da,di,dl,ec,es,fac,fca,fcd,fce,fcp,fe,fk,fr,fs,ft,full,he,hr,iv,md,me,mv,mx,p,p8a,p8c,p8e,p8j,p8m,p8q,p8s,p8u,p8v,p8w,pe,pf,po,pp,qa,qs,ra,re,rn,rp,rs,ru,rv,sh,shape,so,ss,sv,v,vr,x' && Object.values(schema).every(v=>v===true);
 }catch{return false}
}
export async function createIsolatedCatalogRuntime(env=process.env){
 const conf=validateCatalogEnv(env);
 const {default:pg}=await import('pg');
 const pool=new pg.Pool({connectionString:conf.connectionString,max:4,connectionTimeoutMillis:900,query_timeout:1800,statement_timeout:1800,application_name:'f05_catalog_disposable_only'});
 try{
  if(!await probeIsolatedCatalog(pool))throw Error('CATALOG_PG16_IDENTITY_OR_SCHEMA_DENIED');
  const customerReadService=createIsolatedCatalogCustomerReadService({pool,env});
  const searchService=createIsolatedCatalogSearchService({pool,env});
  const service=createCatalogService({pool,cursorKey:randomBytes(32),customerReadService,searchService});
  const favorite=createIsolatedFavoriteService({pool,env});
  const consultation=createIsolatedConsultationService({pool,env});
  const consultationResponse=createIsolatedConsultationResponseService({pool,env});
  const employeeStart=createIsolatedEmployeeStartService({pool,env});
  const handover=createIsolatedHandoverService({pool,env});
  const slaHold=createIsolatedSlaHoldService({pool,env});
  const priceUnlock=createIsolatedPriceUnlockService({pool,env});
  const quotaAddition=createIsolatedQuotaAdditionService({pool,env});
  const findCar=createIsolatedFindCarService({pool,env});
  const activation=createIsolatedFindCarActivationService({pool,env});
  const lifecycle=createIsolatedDemandLifecycleService({pool,env});
  const employeeVehicleRead=createIsolatedEmployeeVehicleReadService({pool,env});
  const matching=createIsolatedMatchingService({pool,env});
  const dictionary=createIsolatedDictionaryService({pool,env});
  const discovery=createIsolatedMatchingDiscoveryService({pool,env});
  const recommendation=createIsolatedRecommendationService({pool,env});
  const priority=createIsolatedPriorityService({pool,env});
  const priorityQualification=createIsolatedPriorityQualificationService({pool,env});
  return {pool,handler:createCatalogHandler(service),favoriteHandler:createIsolatedFavoriteHandler(favorite,env),consultationHandler:createIsolatedConsultationHandler(consultation,env),consultationResponseHandler:createIsolatedConsultationResponseHandler(consultationResponse,env),employeeStartHandler:createIsolatedEmployeeStartHandler(employeeStart,env),handoverHandler:createIsolatedHandoverHandler(handover,env),slaHoldHandler:createIsolatedSlaHoldHandler(slaHold,env),priceUnlockHandler:createIsolatedPriceUnlockHandler(priceUnlock,env),quotaAdditionHandler:createIsolatedQuotaAdditionHandler(quotaAddition,env),findCarHandler:createIsolatedFindCarHandler(findCar,env),findCarActivationHandler:createIsolatedFindCarActivationHandler(activation,env),demandLifecycleHandler:createIsolatedDemandLifecycleHandler(lifecycle,env),employeeVehicleReadHandler:createIsolatedEmployeeVehicleReadHandler(employeeVehicleRead,env),matchingHandler:createIsolatedMatchingHandler(matching,env),dictionaryHandler:createIsolatedDictionaryHandler(dictionary,env),discoveryHandler:createIsolatedMatchingDiscoveryHandler(discovery,env),recommendationHandler:createIsolatedRecommendationHandler(recommendation,env),priorityHandler:createIsolatedPriorityHandler(priority,env),priorityQualificationHandler:createIsolatedPriorityQualificationHandler(priorityQualification,env),ready:()=>probeIsolatedCatalog(pool),close:()=>pool.end()};
 }catch(e){await pool.end();throw e}
}
