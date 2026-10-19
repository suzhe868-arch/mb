// PDM-10/25 F05-5 Employee daily quota additions: true frozen F02 PostgreSQL ledger.
// Employee permission and Level entitlement are disposable-test proofs, NOT F03 issuer.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const validId=s=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
const validToken=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
const validKey=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(s);
const reply=(status,code,extra={})=>({status,body:{code,...extra,productionReady:false}});
export function createIsolatedQuotaAdditionService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_EMPLOYEE_QUOTA_FORMAL_ISSUER_NOT_READY');
 return Object.freeze({async add({token,customerId,eventKey,delta}){
  if(!validId(customerId)||!validKey(eventKey)||!Number.isInteger(delta)||delta<1||delta>10000)
   return reply(400,'QUOTA_ADD_INVALID_REQUEST');
  if(!validToken(token))return reply(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const conn=await pool.connect();
  try{
   await conn.query('BEGIN');
   try{
    const employee=(await conn.query(
      "SELECT e.employee_id,r.role_code FROM public.f05_catalog_employee_sessions_test s "+
      "JOIN public.employees e ON e.employee_id=s.employee_id "+
      "JOIN public.roles r ON r.role_id=e.main_role_id "+
      "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
      "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
      "AND e.employment_status='active' AND r.role_code IN ('sales','manager','store_head') "+
      "FOR SHARE OF s,e,r",[hash(token)])).rows[0];
    if(!employee){await conn.query('ROLLBACK');return reply(401,'EMPLOYEE_IDENTITY_REQUIRED')}
    const employeeId=String(employee.employee_id);
    // Same lock key ordering as F05-4: global request key, then Customer ledger lock.
    await conn.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",['F05_QUOTA_ADD_KEY',eventKey]);
    await conn.query("SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))",['F05_PRICE_CUSTOMER',customerId]);
    const permission=(await conn.query(
      "SELECT customer.account_status,customer.current_owner_employee_id,customer.owner_assignment_state,"+
      " proof.price_access_mode,proof.daily_base_quota "+
      "FROM public.f05_catalog_quota_staff_scope_test staff "+
      "JOIN public.customers customer ON customer.customer_id=staff.customer_id "+
      "JOIN public.f05_catalog_price_entitlement_test proof ON proof.level_id=customer.customer_level_id "+
      "WHERE staff.employee_id=$1 AND staff.customer_id=$2 AND staff.can_add_price_quota=true "+
      "AND staff.issuer='DISPOSABLE_TEST_ONLY' AND staff.expires_at>statement_timestamp() "+
      "AND proof.issuer='DISPOSABLE_TEST_ONLY' AND proof.expires_at>statement_timestamp() "+
      "FOR SHARE OF staff,customer,proof",[employeeId,customerId])).rows[0];
    if(!permission){await conn.query('ROLLBACK');return reply(403,'QUOTA_EMPLOYEE_SCOPE_OR_ENTITLEMENT_REQUIRED')}
    if(permission.account_status!=='active'){await conn.query('ROLLBACK');return reply(403,'QUOTA_CUSTOMER_DISABLED')}
    if(employee.role_code==='sales'&&(
       permission.owner_assignment_state!=='assigned'||String(permission.current_owner_employee_id)!==employeeId)){
      await conn.query('ROLLBACK');return reply(403,'QUOTA_SALES_OWNER_REQUIRED');
    }
    if(permission.price_access_mode!=='LIMITED'){
     await conn.query('ROLLBACK');return reply(409,'QUOTA_UNLIMITED_ADDITION_NOT_ALLOWED');
    }
    const proofHash=hash(JSON.stringify([employeeId,customerId,delta,'FREE_QUOTA_ADDITION']));
    const prior=(await conn.query(
      "SELECT actor_employee_id,customer_id,delta,payload_sha256,business_day_shanghai,"+
      "before_remaining,after_remaining,total_temp_additions "+
      "FROM public.f05_catalog_quota_addition_events_test WHERE idempotency_key=$1",[eventKey])).rows[0];
    if(prior){
     await conn.query('ROLLBACK');
     if(String(prior.actor_employee_id)!==employeeId||String(prior.customer_id)!==customerId||
        prior.delta!==delta||prior.payload_sha256!==proofHash)
      return reply(409,'QUOTA_IDEMPOTENCY_COLLISION');
     return reply(200,'QUOTA_ADDITION_REPLAY',{customerId,added:delta,chargedMoney:false,
      businessDay:prior.business_day_shanghai.toISOString().slice(0,10),
      beforeRemaining:prior.before_remaining,afterRemaining:prior.after_remaining,
      todayTempAdditionsAtEvent:prior.total_temp_additions,recordedHistoricalSnapshot:true});
    }
    // Date is database-derived in Asia/Shanghai; no client clock or manually granted date.
    const ledger=(await conn.query(
     "INSERT INTO public.customer_day_quota_ledger "+
     "(customer_id,business_day_shanghai,base_quota,temp_additions,consumed_count,updated_at) "+
     "VALUES($1,(statement_timestamp() AT TIME ZONE 'Asia/Shanghai')::date,$2,0,0,statement_timestamp()) "+
     "ON CONFLICT (customer_id,business_day_shanghai) DO UPDATE "+
     "SET base_quota=excluded.base_quota,updated_at=statement_timestamp() "+
     "RETURNING customer_id,business_day_shanghai,base_quota,temp_additions,consumed_count",
     [customerId,Number(permission.daily_base_quota)])).rows[0];
    const remainingBefore=Math.max(0,ledger.base_quota+ledger.temp_additions-ledger.consumed_count);
    // Explicit technical guard: no integer overflows, no unbounded staff-side additions.
    if(ledger.temp_additions+delta>10000000){
     await conn.query('ROLLBACK');return reply(409,'QUOTA_ADDITION_RANGE_EXCEEDED');
    }
    const newTemp=ledger.temp_additions+delta;
    const remainingAfter=Math.max(0,ledger.base_quota+newTemp-ledger.consumed_count);
    const adjust=(await conn.query(
      "INSERT INTO public.customer_quota_adjustments "+
      "(adjustment_id,customer_id,business_day_shanghai,delta,changed_by,occurred_at) "+
      "VALUES(nextval('public.f05_catalog_quota_adjustment_id_seq'),$1,$2,$3,$4,statement_timestamp()) "+
      "RETURNING adjustment_id",
      [customerId,ledger.business_day_shanghai,delta,employeeId])).rows[0];
    await conn.query("UPDATE public.customer_day_quota_ledger "+
      "SET temp_additions=$3,updated_at=statement_timestamp() "+
      "WHERE customer_id=$1 AND business_day_shanghai=$2",
      [customerId,ledger.business_day_shanghai,newTemp]);
    await conn.query(
      "INSERT INTO public.f05_catalog_quota_addition_events_test "+
      "(idempotency_key,actor_employee_id,customer_id,business_day_shanghai,delta,payload_sha256,"+
      "adjustment_id,before_remaining,after_remaining,total_temp_additions) "+
      "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [eventKey,employeeId,customerId,ledger.business_day_shanghai,delta,proofHash,
       String(adjust.adjustment_id),remainingBefore,remainingAfter,newTemp]);
    await conn.query('COMMIT');
    return reply(200,'QUOTA_ADDITION_APPLIED',{customerId,added:delta,chargedMoney:false,
      businessDay:ledger.business_day_shanghai.toISOString().slice(0,10),
      beforeRemaining:remainingBefore,afterRemaining:remainingAfter,todayTempAdditions:newTemp});
   }catch(e){await conn.query('ROLLBACK').catch(()=>{});throw e}
  }finally{conn.release()}
 }});
}
