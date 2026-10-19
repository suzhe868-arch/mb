// PDM-11 Demand lifecycle: isolated PG16 transactions; never a production signer.
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const validId=x=>typeof x==='string'&&/^[1-9]\d{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const validToken=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const validEvent=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const reply=(status,code,fields={})=>({status,body:{code,...fields,productionReady:false}});
const actions=new Set(['PAUSE','RESUME','END_REQUEST','COMPLETE','CANCEL']);
const final=new Set(['completed','cancelled']);
export function createIsolatedDemandLifecycleService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
   env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('DEMAND_LIFECYCLE_FORMAL_ISSUER_NOT_AVAILABLE');
 return Object.freeze({async action({credential,eventKey,demandId,action,reason=null}){
  if(!validId(demandId)||!validEvent(eventKey)||!actions.has(action)||
    (['COMPLETE','CANCEL'].includes(action)?
      (typeof reason!=='string'||reason.trim()!==reason||reason.length<6||reason.length>200||/[\u0000-\u001f\u007f]/.test(reason)):
      reason!==null))return reply(400,'DEMAND_LIFECYCLE_INVALID_REQUEST');
  if(!validToken(credential))return reply(401,'DEMAND_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',
      ['F05_DEMAND_LIFECYCLE_EVENT',eventKey]);
    const actorHash=hash(credential);
    const customer=(await c.query(
     "SELECT c.customer_id FROM public.f05_catalog_customer_sessions_test s "+
     "JOIN public.customers c ON c.customer_id=s.customer_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
     "AND s.expires_at>statement_timestamp() AND c.account_status='active' "+
     "FOR SHARE OF s,c",[actorHash])).rows[0];
    let kind='customer',actorId=customer?String(customer.customer_id):null;
    if(!actorId){
     const employee=(await c.query(
      "SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
      "JOIN public.employees e ON e.employee_id=s.employee_id "+
      "JOIN public.roles r ON r.role_id=e.main_role_id "+
      "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
      "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
      "AND e.employment_status='active' AND r.role_code IN ('sales','manager','store_head') "+
      "FOR SHARE OF s,e,r",[actorHash])).rows[0];
     if(!employee){await c.query('ROLLBACK');return reply(401,'DEMAND_IDENTITY_REQUIRED')}
     kind='employee';actorId=String(employee.employee_id);
    }
    const demand=(await c.query("SELECT demand_id,customer_id,responsible_employee_id,demand_state "+
       "FROM public.demands WHERE demand_id=$1 FOR UPDATE",[demandId])).rows[0];
    if(!demand){await c.query('ROLLBACK');return reply(404,'DEMAND_NOT_FOUND')}
    const customerId=String(demand.customer_id);
    if(kind==='customer'&&customerId!==actorId){
     await c.query('ROLLBACK');return reply(404,'DEMAND_NOT_FOUND');
    }
    if(kind==='employee'){
     if(!['PAUSE','RESUME','COMPLETE','CANCEL'].includes(action)){
      await c.query('ROLLBACK');return reply(403,'DEMAND_EMPLOYEE_ACTION_INVALID');
     }
     if(String(demand.responsible_employee_id)!==actorId){
      await c.query('ROLLBACK');return reply(403,'DEMAND_RESPONSIBLE_EMPLOYEE_REQUIRED');
     }
     const scope=(await c.query(
      "SELECT 1 FROM public.f05_demand_lifecycle_scope_test "+
      "WHERE employee_id=$1 AND customer_id=$2 AND can_manage_demand=true "+
      "AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
      [actorId,customerId])).rows[0];
     if(!scope){await c.query('ROLLBACK');return reply(403,'DEMAND_EMPLOYEE_SCOPE_REQUIRED')}
    }else if(['COMPLETE','CANCEL'].includes(action)){
     await c.query('ROLLBACK');return reply(403,'DEMAND_CUSTOMER_CANNOT_FINALIZE');
    }
    const fingerprint=hash(JSON.stringify([kind,actorId,demandId,action,reason]));
    const prior=(await c.query(
     "SELECT payload_sha256,demand_id,actor_kind,actor_id,result_state,result_code "+
     "FROM public.f05_demand_lifecycle_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(prior){
     await c.query('ROLLBACK');
     if(prior.payload_sha256!==fingerprint||String(prior.demand_id)!==demandId||
       prior.actor_kind!==kind||String(prior.actor_id)!==actorId)
      return reply(409,'DEMAND_IDEMPOTENCY_COLLISION');
     return reply(200,'DEMAND_LIFECYCLE_REPLAY',{demandId,demandState:prior.result_state,
      originalResultCode:prior.result_code,historicalSnapshot:true});
    }
    const state=demand.demand_state;
    if(final.has(state)){await c.query('ROLLBACK');return reply(409,'DEMAND_TERMINAL_READ_ONLY')}
    const customerCurrent=(await c.query("SELECT c.account_status,e.can_activate_demand "+
     "FROM public.customers c LEFT JOIN public.f05_find_car_level_entitlement_test e "+
     "ON e.level_id=c.customer_level_id AND e.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND e.expires_at>statement_timestamp() WHERE c.customer_id=$1 FOR SHARE OF c",
     [customerId])).rows[0];
    if(!customerCurrent){await c.query('ROLLBACK');return reply(403,'DEMAND_CUSTOMER_UNAVAILABLE')}
    if(action==='RESUME'&&(customerCurrent.account_status!=='active'||customerCurrent.can_activate_demand!==true)){
     await c.query('ROLLBACK');return reply(403,'DEMAND_RESUME_ENTITLEMENT_REQUIRED');
    }
    if(action==='END_REQUEST'&&kind==='customer'){
     const pending=(await c.query(
      "SELECT request_id FROM public.f05_demand_end_requests_test "+
      "WHERE demand_id=$1 AND status='pending' FOR UPDATE",[demandId])).rows[0];
     if(pending){await c.query('ROLLBACK');return reply(409,'DEMAND_END_REQUEST_ALREADY_PENDING')}
     await c.query("INSERT INTO public.f05_demand_end_requests_test(demand_id,customer_id,event_key,status) "+
       "VALUES($1,$2,$3,'pending')",[demandId,customerId,eventKey]);
    }else{
     if((action==='PAUSE'&&state!=='active')||(action==='RESUME'&&state!=='paused')||
       (!['PAUSE','RESUME','COMPLETE','CANCEL'].includes(action))){
      await c.query('ROLLBACK');return reply(409,'DEMAND_INVALID_STATE_TRANSITION');
     }
     const target=action==='PAUSE'?'paused':action==='RESUME'?'active':
        action==='COMPLETE'?'completed':'cancelled';
     const changed=(await c.query(
      'UPDATE public.demands SET demand_state=$2 WHERE demand_id=$1 AND demand_state=$3 RETURNING demand_id',
      [demandId,target,state])).rows[0];
     if(!changed)throw Error('DEMAND_LIFECYCLE_CONCURRENT_WRITE');
     if(['COMPLETE','CANCEL'].includes(action))
      await c.query("UPDATE public.f05_demand_end_requests_test "+
       "SET status='processed',decision=$2,processed_at=statement_timestamp(),processed_by_employee_id=$3 "+
       "WHERE demand_id=$1 AND status='pending'",[demandId,target,actorId]);
    }
    const next=action==='END_REQUEST'?state:action==='PAUSE'?'paused':action==='RESUME'?'active':
       action==='COMPLETE'?'completed':'cancelled';
    const code=action==='END_REQUEST'?'DEMAND_END_REQUEST_PENDING':'DEMAND_'+action+'_APPLIED';
    await c.query("INSERT INTO public.f05_demand_lifecycle_events_test "+
     "(event_key,payload_sha256,demand_id,actor_kind,actor_id,action,prior_state,result_state,result_code) "+
     "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
     [eventKey,fingerprint,demandId,kind,actorId,action,state,next,code]);
    await c.query('COMMIT');
    return reply(200,code,{demandId,demandState:next,endRequestPending:action==='END_REQUEST',
      matchingReady:false,matchingStarted:false});
   }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error}
  }finally{c.release()}
 }});
}
