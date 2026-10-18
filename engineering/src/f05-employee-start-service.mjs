// PDM-15 employee start-processing: actual PG16 mutation with test-only employee credentials.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const validId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const validToken=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const response=(status,code,other={})=>({status,body:{code,...other}});
export function createIsolatedEmployeeStartService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_EMPLOYEE_ISSUER_NOT_AVAILABLE');
 return Object.freeze({async start({token,consultationId,eventKey}){
  if(!validId(consultationId)||!validKey(eventKey))return response(400,'CONSULTATION_INVALID_REQUEST');
  if(!validToken(token))return response(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const principal=(await c.query(
     "SELECT s.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
     "AND s.expires_at>statement_timestamp() AND e.employment_status='active' "+
     "AND r.role_code IN ('sales','manager','store_head') FOR SHARE OF s,e,r",
     [hash(token)])).rows[0];
    if(!principal){await c.query('ROLLBACK');return response(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const employeeId=String(principal.employee_id);
    // Event-key and Consultation row locks serialize competing mutations.
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_CONSULTATION_EVENT',eventKey]);
    const consultation=(await c.query(
      "SELECT consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status "+
      "FROM public.consultations WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!consultation){await c.query('ROLLBACK');return response(404,'CONSULTATION_NOT_FOUND')}
    const customerId=String(consultation.customer_id);
    if(String(consultation.assignee_employee_id)!==employeeId){await c.query('ROLLBACK');return response(403,'CONSULTATION_NOT_ASSIGNEE')}
    const scope=(await c.query(
     "SELECT 1 FROM public.f05_catalog_employee_consultation_scope_test sc "+
     "JOIN public.customers customer ON customer.customer_id=sc.customer_id "+
     "WHERE sc.employee_id=$1 AND sc.customer_id=$2 AND sc.can_start_processing=true "+
     "AND sc.issuer='DISPOSABLE_TEST_ONLY' AND sc.expires_at>statement_timestamp() "+
     "AND customer.account_status='active' FOR SHARE OF sc,customer",
     [employeeId,customerId])).rows[0];
    if(!scope){await c.query('ROLLBACK');return response(403,'CONSULTATION_EMPLOYEE_SCOPE_NOT_VERIFIED')}
    const payload=hash(JSON.stringify([employeeId,consultationId,'STARTED_PROCESSING']));
    const event=(await c.query("SELECT event_key,actor_employee_id,payload_sha256,action,consultation_id "+
     "FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1",[eventKey])).rows[0];
    if(event){
     await c.query('ROLLBACK');
     if(event.action!=='STARTED_PROCESSING'||String(event.actor_employee_id)!==employeeId||
       String(event.consultation_id)!==consultationId||event.payload_sha256!==payload)
      return response(409,'CONSULTATION_IDEMPOTENCY_COLLISION');
     if(consultation.status!=='processing')return response(409,'CONSULTATION_NOT_PENDING');
     return response(200,'CONSULTATION_PROCESSING_REPLAY',{consultationId,status:'processing',firstHumanResponse:false,productionReady:false});
    }
    if(consultation.status!=='pending'){await c.query('ROLLBACK');return response(409,'CONSULTATION_NOT_PENDING')}
    await c.query("UPDATE public.consultations SET status='processing' "+
      "WHERE consultation_id=$1 AND assignee_employee_id=$2 AND status='pending'",
      [consultationId,employeeId]);
    await c.query("INSERT INTO public.f05_catalog_consultation_actions_test "+
      "(event_key,payload_sha256,customer_id,vehicle_id,listing_cycle_id,consultation_id,action,actor_employee_id) "+
      "VALUES($1,$2,$3,$4,$5,$6,'STARTED_PROCESSING',$7)",
      [eventKey,payload,customerId,String(consultation.vehicle_id),String(consultation.listing_cycle_id),consultationId,employeeId]);
    await c.query('COMMIT');
    return response(200,'CONSULTATION_PROCESSING_STARTED',{consultationId,status:'processing',firstHumanResponse:false,productionReady:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }});
}
