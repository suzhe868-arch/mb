// PDM-11 Find-car Application: actual F02 find_car_applications, never an auto Demand.
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const id=s=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
const token=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
const key=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(s);
const validText=s=>typeof s==='string'&&s.trim()===s&&s.length>=1&&s.length<=1000&&Buffer.byteLength(s,'utf8')<=3000&&!/[\u0000-\u001f\u007f]/.test(s);
const validBudget=s=>s===null||(typeof s==='string'&&/^[1-9][0-9]{0,13}$/.test(s)&&BigInt(s)<100000000000000n);
const resp=(status,code,fields={})=>({status,body:{code,...fields,productionReady:false}});
const actionKey=(customerId,act,applicationId,originalText,budget,revision)=>
 sha(JSON.stringify([customerId,act,applicationId,originalText,budget,revision]));
export function createIsolatedFindCarService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_FIND_CAR_FORMAL_ISSUER_UNAVAILABLE');
 return Object.freeze({async action({credential,eventKey,kind,applicationId=null,originalText=null,budgetMaxCents=null,expectedRevision=null}){
  if(!key(eventKey)||!['CREATE','EDIT','WITHDRAW'].includes(kind)||
     (kind!=='CREATE'&&!id(applicationId))||
     (kind==='CREATE'&&applicationId!==null)||
     (kind!=='WITHDRAW'&&(!validText(originalText)||!validBudget(budgetMaxCents)))||
     (kind==='WITHDRAW'&&(originalText!==null||budgetMaxCents!==null))||
     (kind==='EDIT'&&(!Number.isSafeInteger(expectedRevision)||expectedRevision<1))||
     (kind!=='EDIT'&&expectedRevision!==null))
   return resp(400,'FIND_CAR_INVALID_REQUEST');
  if(!token(credential))return resp(401,'CUSTOMER_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const customer=(await c.query(
     "SELECT c.customer_id,c.account_status,c.current_owner_employee_id,c.owner_assignment_state,c.customer_level_id "+
     "FROM public.f05_catalog_customer_sessions_test s JOIN public.customers c ON c.customer_id=s.customer_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
     "FOR SHARE OF s,c",[sha(credential)])).rows[0];
    if(!customer||customer.account_status!=='active'){
     await c.query('ROLLBACK');return resp(401,'CUSTOMER_IDENTITY_REQUIRED');
    }
    const customerId=String(customer.customer_id);
    // Same global key serializes independent customers, then one customer's Application writes.
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_FIND_CAR_KEY',eventKey]);
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_FIND_CAR_CUSTOMER',customerId]);
    const bodyHash=actionKey(customerId,kind,applicationId,originalText,budgetMaxCents,expectedRevision);
    const prev=(await c.query(
     "SELECT event_key,payload_sha256,customer_id,application_id,action,result_status,after_revision "+
     "FROM public.f05_find_car_application_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(prev){
     await c.query('ROLLBACK');
     if(prev.payload_sha256!==bodyHash||String(prev.customer_id)!==customerId||prev.action!==kind)
      return resp(409,'FIND_CAR_IDEMPOTENCY_COLLISION');
     return resp(200,'FIND_CAR_REQUEST_REPLAY',{applicationId:String(prev.application_id),
       status:prev.result_status,revision:Number(prev.after_revision),demandCreated:false,
       historicalSnapshot:true});
    }
    let row;
    if(kind==='CREATE'||kind==='EDIT'){
     // Phone service proof must be from test fixture, not a caller-supplied header.
     const phone=(await c.query(
      "SELECT 1 FROM public.f05_find_car_phone_proof_test "+
      "WHERE customer_id=$1 AND phone_service_authorized=true AND issuer='DISPOSABLE_TEST_ONLY' "+
      "AND revoked_at IS NULL AND expires_at>statement_timestamp() FOR SHARE",[customerId])).rows[0];
     if(!phone){await c.query('ROLLBACK');return resp(403,'FIND_CAR_PHONE_SERVICE_REQUIRED')}
     const ownerId=customer.current_owner_employee_id===null?null:String(customer.current_owner_employee_id);
     if(customer.owner_assignment_state!=='assigned'||!ownerId){
      await c.query('ROLLBACK');return resp(409,'FIND_CAR_OWNER_PENDING');
     }
     const owner=(await c.query(
      "SELECT e.employee_id FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
      "WHERE e.employee_id=$1 AND e.employment_status='active' "+
      "AND r.role_code IN ('sales','manager','store_head') FOR SHARE OF e,r",[ownerId])).rows[0];
     if(!owner){await c.query('ROLLBACK');return resp(409,'FIND_CAR_OWNER_INELIGIBLE')}
     if(kind==='CREATE'){
      row=(await c.query(
       "INSERT INTO public.find_car_applications "+
       "(customer_id,status,assigned_employee_id,activated_demand_id) "+
       "VALUES($1,'pending',$2,NULL) RETURNING application_id,status,assigned_employee_id",
       [customerId,ownerId])).rows[0];
      await c.query(
       "INSERT INTO public.f05_find_car_application_detail_test "+
       "(application_id,customer_original_text,budget_max_cents,revision,updated_at) "+
       "VALUES($1,$2,$3,1,statement_timestamp())",
       [String(row.application_id),originalText,budgetMaxCents]);
     }else{
      row=(await c.query(
       "SELECT application_id,customer_id,status,activated_demand_id,assigned_employee_id "+
       "FROM public.find_car_applications WHERE application_id=$1 FOR UPDATE",[applicationId])).rows[0];
      if(!row||String(row.customer_id)!==customerId){await c.query('ROLLBACK');return resp(404,'FIND_CAR_APPLICATION_NOT_FOUND')}
      if(row.status!=='pending'||row.activated_demand_id!==null){
       await c.query('ROLLBACK');return resp(409,'FIND_CAR_APPLICATION_NOT_PENDING');
      }
      const changed=(await c.query(
       "UPDATE public.f05_find_car_application_detail_test SET "+
       "customer_original_text=$2,budget_max_cents=$3,revision=revision+1,updated_at=statement_timestamp() "+
       "WHERE application_id=$1 AND revision=$4 RETURNING revision",
       [applicationId,originalText,budgetMaxCents,expectedRevision])).rows[0];
      if(!changed){await c.query('ROLLBACK');return resp(409,'FIND_CAR_REVISION_CONFLICT')}
      row.revision=Number(changed.revision);
     }
    }else{
     row=(await c.query("SELECT application_id,customer_id,status,activated_demand_id "+
      "FROM public.find_car_applications WHERE application_id=$1 FOR UPDATE",[applicationId])).rows[0];
     if(!row||String(row.customer_id)!==customerId){await c.query('ROLLBACK');return resp(404,'FIND_CAR_APPLICATION_NOT_FOUND')}
     if(row.status!=='pending'||row.activated_demand_id!==null){
      await c.query('ROLLBACK');return resp(409,'FIND_CAR_APPLICATION_NOT_PENDING');
     }
     await c.query("UPDATE public.find_car_applications SET status='closed' "+
      "WHERE application_id=$1 AND customer_id=$2 AND status='pending'",[applicationId,customerId]);
     row.status='closed';
    }
    const number=kind==='CREATE'?1:kind==='EDIT'?row.revision:
      Number((await c.query('SELECT revision FROM public.f05_find_car_application_detail_test WHERE application_id=$1',[applicationId])).rows[0]?.revision??0);
    if(!number)throw Error('FIND_CAR_MISSING_REVISION_FACT');
    await c.query(
     "INSERT INTO public.f05_find_car_application_events_test "+
     "(event_key,payload_sha256,customer_id,application_id,action,result_status,after_revision) "+
     "VALUES($1,$2,$3,$4,$5,$6,$7)",
     [eventKey,bodyHash,customerId,String(row.application_id),kind,kind==='WITHDRAW'?'closed':'pending',number]);
    // Level entitlement is strictly a staff activation hint. Neither CREATE nor EDIT
    // creates any active Demand, MatchResult, Recommendation, Priority or visibility right.
    const entitlement=(await c.query("SELECT can_activate_demand FROM public.f05_find_car_level_entitlement_test "+
     "WHERE level_id=$1 AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
     [String(customer.customer_level_id)])).rows[0];
    await c.query('COMMIT');
    return resp(200,kind==='CREATE'?'FIND_CAR_APPLICATION_SUBMITTED':
      kind==='EDIT'?'FIND_CAR_APPLICATION_UPDATED':'FIND_CAR_APPLICATION_WITHDRAWN',
     {applicationId:String(row.application_id),status:kind==='WITHDRAW'?'closed':'pending',
      revision:number,assignedEmployeeId:kind==='CREATE'?String(row.assigned_employee_id):undefined,
      testOnlyEligibleForEmployeeActivation:entitlement?.can_activate_demand===true,
      demandCreated:false,matchingStarted:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }});
}
