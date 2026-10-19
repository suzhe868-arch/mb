// PDM-15 auditable human response; isolated PG16 only, never a production message/phone issuer.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const event=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const ref=x=>typeof x==='string'&&x.length>=8&&x.length<=200&&x.trim()===x&&!/[\u0000-\u001f\u007f]/.test(x);
const channels=new Set(['message','phone','offline']);
const out=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
export function createIsolatedConsultationResponseService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
   env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('CONSULTATION_RESPONSE_FORMAL_ISSUER_UNAVAILABLE');
 return Object.freeze({async record({credential,consultationId,eventKey,channel,sourceFactRef}){
  if(!id(consultationId)||!event(eventKey)||!channels.has(channel)||!ref(sourceFactRef))
   return out(400,'CONSULTATION_RESPONSE_INVALID_REQUEST');
  if(!token(credential))return out(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query("SELECT s.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
     "AND s.expires_at>statement_timestamp() AND e.employment_status='active' "+
     "AND r.role_code IN ('sales','manager','store_head') FOR SHARE OF s,e,r",[hash(credential)])).rows[0];
    if(!actor){await db.query('ROLLBACK');return out(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const actorId=String(actor.employee_id);
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_CONSULTATION_EVENT',eventKey]);
    const c=(await db.query("SELECT consultation_id,customer_id,assignee_employee_id,status,first_response_deadline "+
     "FROM public.consultations WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!c){await db.query('ROLLBACK');return out(404,'CONSULTATION_NOT_FOUND')}
    const customerId=String(c.customer_id);
    if(String(c.assignee_employee_id)!==actorId){await db.query('ROLLBACK');return out(403,'CONSULTATION_NOT_ASSIGNEE')}
    if(!['pending','processing'].includes(c.status)){await db.query('ROLLBACK');return out(409,'CONSULTATION_NOT_OPEN')}
    const scope=(await db.query("SELECT 1 FROM public.f05_catalog_employee_consultation_scope_test sc "+
     "JOIN public.customers cu ON cu.customer_id=sc.customer_id "+
     "WHERE sc.employee_id=$1 AND sc.customer_id=$2 AND sc.can_record_human_response=true "+
     "AND sc.issuer='DISPOSABLE_TEST_ONLY' AND sc.expires_at>statement_timestamp() "+
     "AND cu.account_status='active' FOR SHARE OF sc,cu",[actorId,customerId])).rows[0];
    if(!scope){await db.query('ROLLBACK');return out(403,'CONSULTATION_RESPONSE_SCOPE_REQUIRED')}
    const hold=(await db.query("SELECT 1 FROM public.f05_catalog_consultation_hold_test "+
     "WHERE consultation_id=$1 AND active=true FOR SHARE",[consultationId])).rows[0];
    if(hold){await db.query('ROLLBACK');return out(409,'CONSULTATION_CUSTOMER_DISABLED_HOLD')}
    const sla=(await db.query("SELECT consultation_id,effective_deadline,first_human_response_at "+
     "FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!sla){await db.query('ROLLBACK');return out(503,'CONSULTATION_SLA_NOT_READY')}
    const payload=hash(JSON.stringify([actorId,consultationId,channel,sourceFactRef]));
    const prior=(await db.query("SELECT payload_sha256,consultation_id,actor_employee_id,channel,is_first_response,occurred_at "+
     "FROM public.f05_consultation_human_response_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(prior){
     await db.query('ROLLBACK');
     if(prior.payload_sha256!==payload||String(prior.consultation_id)!==consultationId||
       String(prior.actor_employee_id)!==actorId||prior.channel!==channel)
      return out(409,'CONSULTATION_RESPONSE_IDEMPOTENCY_COLLISION');
     return out(200,'CONSULTATION_RESPONSE_REPLAY',{consultationId,channel,
      firstHumanResponseRecorded:prior.is_first_response===true,
      firstHumanResponseAt:prior.occurred_at instanceof Date?prior.occurred_at.toISOString():prior.occurred_at,
      historicalSnapshot:true});
    }
    const at=(await db.query('SELECT statement_timestamp() at')).rows[0].at;
    const first=sla.first_human_response_at===null;
    if(first){
     const changed=await db.query("UPDATE public.f05_catalog_consultation_sla_test "+
      "SET first_human_response_at=$2 WHERE consultation_id=$1 AND first_human_response_at IS NULL",
      [consultationId,at]);
     if(changed.rowCount!==1)throw Error('CONSULTATION_FIRST_RESPONSE_RACE');
    }
    await db.query("INSERT INTO public.f05_consultation_human_response_events_test "+
     "(event_key,payload_sha256,consultation_id,actor_employee_id,channel,source_fact_ref,is_first_response,occurred_at) "+
     "VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
     [eventKey,payload,consultationId,actorId,channel,sourceFactRef,first,at]);
    await db.query('COMMIT');
    return out(200,'CONSULTATION_HUMAN_RESPONSE_RECORDED',{consultationId,channel,
     firstHumanResponseRecorded:first,firstHumanResponseAt:(first?at:sla.first_human_response_at).toISOString()});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
