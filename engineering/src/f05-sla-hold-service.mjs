// Isolated PDM-15 Customer disabled hold and explicit Employee resumption.
// The Customer status change is observed by the PG16 trigger; this service never forges it.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const validId=s=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
const validToken=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
const validKey=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(s);
const output=(status,code,extra={})=>({status,body:{code,...extra}});
export function createIsolatedSlaHoldService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
    env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
   throw Error('F05_SLA_HOLD_ISSUER_UNAVAILABLE');
 return Object.freeze({async resume({token,consultationId,eventKey}){
  if(!validId(consultationId)||!validKey(eventKey))return output(400,'SLA_HOLD_INVALID_REQUEST');
  if(!validToken(token))return output(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const actor=(await c.query(
     "SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.expires_at>statement_timestamp() "+
     "AND s.revoked_at IS NULL AND e.employment_status='active' "+
     "AND r.role_code IN ('sales','manager','store_head') FOR SHARE OF s,e,r",
     [hash(token)])).rows[0];
    if(!actor){await c.query('ROLLBACK');return output(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const employeeId=String(actor.employee_id);
    // Global key before object lock, identical order to other consultation employee mutations.
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_CONSULTATION_EVENT',eventKey]);
    const row=(await c.query("SELECT consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status "+
      "FROM public.consultations WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!row){await c.query('ROLLBACK');return output(404,'CONSULTATION_NOT_FOUND')}
    if(String(row.assignee_employee_id)!==employeeId){await c.query('ROLLBACK');return output(403,'CONSULTATION_NOT_ASSIGNEE')}
    const customerId=String(row.customer_id);
    const permission=(await c.query("SELECT c.account_status FROM public.f05_catalog_employee_consultation_scope_test sc "+
     "JOIN public.customers c ON c.customer_id=sc.customer_id "+
     "WHERE sc.employee_id=$1 AND sc.customer_id=$2 AND sc.can_resume_hold=true "+
     "AND sc.issuer='DISPOSABLE_TEST_ONLY' AND sc.expires_at>statement_timestamp() "+
     "FOR SHARE OF sc,c",[employeeId,customerId])).rows[0];
    if(!permission){await c.query('ROLLBACK');return output(403,'CONSULTATION_RESUME_SCOPE_REQUIRED')}
    if(permission.account_status!=='active'){await c.query('ROLLBACK');return output(409,'CUSTOMER_STILL_DISABLED')}
    const guard=(await c.query("SELECT active,version,remaining_ms,resumed_by_employee_id FROM public.f05_catalog_consultation_hold_test "+
      "WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!guard){await c.query('ROLLBACK');return output(409,'CONSULTATION_HOLD_NOT_PRESENT')}
    const payload=hash(JSON.stringify([employeeId,consultationId,String(guard.version),'EXPLICIT_RESUME']));
    const previous=(await c.query("SELECT action,actor_employee_id,payload_sha256,consultation_id "+
      "FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1",[eventKey])).rows[0];
    if(previous){
     await c.query('ROLLBACK');
     if(previous.action!=='HOLD_RESUMED'||String(previous.actor_employee_id)!==employeeId||
       String(previous.consultation_id)!==consultationId||previous.payload_sha256!==payload)
       return output(409,'CONSULTATION_IDEMPOTENCY_COLLISION');
     if(guard.active||String(guard.resumed_by_employee_id)!==employeeId)return output(409,'CONSULTATION_HOLD_VERSION_CHANGED');
     return output(200,'CONSULTATION_HOLD_RESUME_REPLAY',{consultationId,holdActive:false,firstHumanResponse:false,productionReady:false});
    }
    if(!guard.active){await c.query('ROLLBACK');return output(409,'CONSULTATION_HOLD_ALREADY_RESUMED')}
    if(!['pending','processing'].includes(row.status)){await c.query('ROLLBACK');return output(409,'CONSULTATION_NOT_OPEN')}
    const millis=guard.remaining_ms===null?null:String(guard.remaining_ms);
    if(millis!==null){
     const updated=(await c.query("UPDATE public.f05_catalog_consultation_sla_test "+
       "SET effective_deadline=statement_timestamp()+($2::bigint * interval '1 millisecond') "+
       "WHERE consultation_id=$1 AND first_human_response_at IS NULL RETURNING consultation_id",
       [consultationId,millis])).rows[0];
     if(!updated)throw Error('HOLD_REMAINING_WITHOUT_VERIFIED_SLA_FACT');
    }
    await c.query("UPDATE public.f05_catalog_consultation_hold_test "+
      "SET active=false,resumed_at=statement_timestamp(),resumed_by_employee_id=$2 "+
      "WHERE consultation_id=$1 AND active=true",[consultationId,employeeId]);
    await c.query("INSERT INTO public.f05_catalog_consultation_hold_events_test "+
      "(consultation_id,action,hold_version,actor_employee_id,remaining_ms) "+
      "VALUES($1,'HOLD_RESUMED',$2,$3,$4)",[consultationId,String(guard.version),employeeId,millis]);
    await c.query("INSERT INTO public.f05_catalog_consultation_actions_test "+
      "(event_key,payload_sha256,customer_id,vehicle_id,listing_cycle_id,consultation_id,action,actor_employee_id) "+
      "VALUES($1,$2,$3,$4,$5,$6,'HOLD_RESUMED',$7)",
      [eventKey,payload,customerId,String(row.vehicle_id),String(row.listing_cycle_id),consultationId,employeeId]);
    await c.query('COMMIT');
    return output(200,'CONSULTATION_HOLD_RESUMED',{consultationId,holdActive:false,firstHumanResponse:false,firstResponseSlaRemainingVerified:millis!==null,productionReady:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }});
}
