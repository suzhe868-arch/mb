// PDM-11: Employee manual Application -> one active Demand. No automated Matching.
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const reply=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
export function createIsolatedFindCarActivationService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_FORMAL_EMPLOYEE_DEMAND_ACTIVATION_NOT_READY');
 return Object.freeze({async activate({credential,eventKey,applicationId}){
  if(!id(applicationId)||!key(eventKey))return reply(400,'FIND_CAR_ACTIVATION_INVALID_REQUEST');
  if(!token(credential))return reply(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const employee=(await c.query(
     "SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id "+
     "JOIN public.roles r ON r.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
     "AND e.employment_status='active' AND r.role_code IN ('sales','manager','store_head') "+
     "FOR SHARE OF s,e,r",[hash(credential)])).rows[0];
    if(!employee){await c.query('ROLLBACK');return reply(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const actorId=String(employee.employee_id);
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_FIND_CAR_KEY',eventKey]);
    const row=(await c.query("SELECT application_id,customer_id,status,assigned_employee_id,activated_demand_id "+
     "FROM public.find_car_applications WHERE application_id=$1 FOR UPDATE",[applicationId])).rows[0];
    if(!row){await c.query('ROLLBACK');return reply(404,'FIND_CAR_APPLICATION_NOT_FOUND')}
    const customerId=String(row.customer_id);
    if(String(row.assigned_employee_id)!==actorId){
     await c.query('ROLLBACK');return reply(403,'FIND_CAR_NOT_ASSIGNED_EMPLOYEE');
    }
    const scope=(await c.query("SELECT 1 FROM public.f05_find_car_activation_scope_test "+
     "WHERE employee_id=$1 AND customer_id=$2 AND can_activate_demand=true "+
     "AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
     [actorId,customerId])).rows[0];
    if(!scope){await c.query('ROLLBACK');return reply(403,'FIND_CAR_EMPLOYEE_ACTIVATION_SCOPE_REQUIRED')}
    const payload=hash(JSON.stringify([actorId,applicationId,'ACTIVATE']));
    const prior=(await c.query("SELECT action,customer_id,application_id,payload_sha256,result_demand_id,result_status "+
     "FROM public.f05_find_car_application_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(prior){
     await c.query('ROLLBACK');
     if(prior.action!=='ACTIVATE'||prior.payload_sha256!==payload||
       String(prior.customer_id)!==customerId||String(prior.application_id)!==applicationId||
       String(prior.result_demand_id)!==String(row.activated_demand_id))
      return reply(409,'FIND_CAR_IDEMPOTENCY_COLLISION');
     return reply(200,'FIND_CAR_ACTIVATION_REPLAY',{applicationId,demandId:String(prior.result_demand_id),
      applicationStatus:'activated',demandCreated:false,matchingReady:false,historicalSnapshot:true});
    }
    if(row.status!=='pending'||row.activated_demand_id!==null){
     await c.query('ROLLBACK');return reply(409,'FIND_CAR_APPLICATION_NOT_PENDING');
    }
    const customer=(await c.query(
     "SELECT c.account_status,c.customer_level_id,ent.can_activate_demand "+
     "FROM public.customers c "+
     "JOIN public.f05_find_car_level_entitlement_test ent ON ent.level_id=c.customer_level_id "+
     "WHERE c.customer_id=$1 AND ent.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND ent.expires_at>statement_timestamp() FOR SHARE OF c,ent",[customerId])).rows[0];
    if(!customer||customer.account_status!=='active'){
     await c.query('ROLLBACK');return reply(403,'FIND_CAR_CUSTOMER_NOT_ACTIVE');
    }
    if(customer.can_activate_demand!==true){
     await c.query('ROLLBACK');return reply(403,'FIND_CAR_ENTITLEMENT_REQUIRED');
    }
    const phone=(await c.query("SELECT 1 FROM public.f05_find_car_phone_proof_test "+
     "WHERE customer_id=$1 AND phone_service_authorized=true AND issuer='DISPOSABLE_TEST_ONLY' "+
     "AND revoked_at IS NULL AND expires_at>statement_timestamp() FOR SHARE",[customerId])).rows[0];
    if(!phone){await c.query('ROLLBACK');return reply(403,'FIND_CAR_PHONE_SERVICE_REQUIRED')}
    // Customer's raw original wording is *not* matching criteria. Formal sales
    // matching description, dictionary parsing, and readiness happen separately.
    const detail=(await c.query("SELECT revision,customer_original_text "+
     "FROM public.f05_find_car_application_detail_test WHERE application_id=$1 FOR SHARE",[applicationId])).rows[0];
    if(!detail){throw Error('FIND_CAR_APPLICATION_RAW_SOURCE_MISSING')}
    const demand=(await c.query("INSERT INTO public.demands "+
      "(customer_id,responsible_employee_id,demand_state,criteria_json) "+
      "VALUES($1,$2,'active','{}'::jsonb) RETURNING demand_id,created_at",
      [customerId,actorId])).rows[0];
    const changed=(await c.query("UPDATE public.find_car_applications SET status='activated',activated_demand_id=$2 "+
     "WHERE application_id=$1 AND status='pending' AND activated_demand_id IS NULL RETURNING application_id",
     [applicationId,String(demand.demand_id)])).rows[0];
    if(!changed)throw Error('FIND_CAR_APPLICATION_ACTIVATION_LOST_RACE');
    await c.query("INSERT INTO public.f05_find_car_application_events_test "+
     "(event_key,payload_sha256,customer_id,application_id,action,result_status,after_revision,actor_employee_id,result_demand_id) "+
     "VALUES($1,$2,$3,$4,'ACTIVATE','activated',$5,$6,$7)",
     [eventKey,payload,customerId,applicationId,String(detail.revision),actorId,String(demand.demand_id)]);
    await c.query('COMMIT');
    return reply(200,'FIND_CAR_DEMAND_ACTIVATED',{applicationId,demandId:String(demand.demand_id),
     responsibleEmployeeId:actorId,applicationStatus:'activated',demandState:'active',
     demandCreated:true,matchingReady:false,matchingStarted:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }});
}
