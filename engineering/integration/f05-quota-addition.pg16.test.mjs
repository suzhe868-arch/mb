// PDM-10 and PDM-25: actual PG16 F02 quota adjustments + daily ledger, not mock accounting.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedQuotaAdditionService} from '../src/f05-quota-addition-service.mjs';
import {createIsolatedQuotaAdditionHandler} from '../src/f05-quota-addition-http.mjs';
import {createIsolatedPriceUnlockService} from '../src/f05-price-unlock-service.mjs';
import {createIsolatedPriceUnlockHandler} from '../src/f05-price-unlock-http.mjs';
const env=validateCatalogEnv();
const pool=new pg.Pool({connectionString:env.connectionString,max:5,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1200});
const rand=()=>randomBytes(32).toString('base64url'),hash=s=>createHash('sha256').update(s).digest('hex');
const sales=rand(),manager=rand(),fourS=rand(),head=rand(),customerBearer=rand();
let server,connected=false,failure;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.roles(role_id,role_code) VALUES(59401,'manager'),(59403,'store_head')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
   "(59400,59001,'active','receiving'),(59401,59401,'active','receiving'),"+
   "(59402,59002,'active','receiving'),(59403,59403,'active','receiving')");
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES"+
   "(59400,'f05_quota_limited'),(59402,'f05_quota_unlimited')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES"+
   "(59400,'active',59400,59400,'assigned'),"+
   "(59401,'active',59400,59400,'assigned'),"+
   "(59402,'active',59402,59400,'assigned'),"+
   "(59403,'disabled',59400,59400,'assigned'),"+
   "(59404,'active',59400,59401,'assigned')");
  for(const [credential,employeeId] of [[sales,'59400'],[manager,'59401'],[fourS,'59402'],[head,'59403']]){
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) "+
     "VALUES($1,$2,statement_timestamp()+interval '30 minutes')",[hash(credential),employeeId]);
  }
  await db.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) "+
    "VALUES($1,59400,statement_timestamp()+interval '30 minutes')",[hash(customerBearer)]);
  await db.query("INSERT INTO public.f05_catalog_price_entitlement_test(level_id,price_access_mode,daily_base_quota,expires_at) VALUES"+
   "(59400,'LIMITED',1,statement_timestamp()+interval '30 minutes'),"+
   "(59402,'UNLIMITED',0,statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.f05_catalog_quota_staff_scope_test(employee_id,customer_id,can_add_price_quota,expires_at) VALUES"+
   "(59400,59400,true,statement_timestamp()+interval '30 minutes'),"+
   "(59400,59401,true,statement_timestamp()+interval '30 minutes'),"+
   "(59400,59402,true,statement_timestamp()+interval '30 minutes'),"+
   "(59400,59403,true,statement_timestamp()+interval '30 minutes'),"+
   "(59400,59404,true,statement_timestamp()+interval '30 minutes'),"+
   "(59401,59400,true,statement_timestamp()+interval '30 minutes'),"+
   "(59401,59401,true,statement_timestamp()+interval '30 minutes'),"+
   "(59401,59404,true,statement_timestamp()+interval '30 minutes'),"+
   "(59402,59400,true,statement_timestamp()+interval '30 minutes'),"+
   "(59403,59401,true,statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES"+
   "(59420,'wholesale','active','visible',statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES"+
   "(59420,59420,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES"+
   "(59420,59420,'wholesale',true,statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES"+
   "(59420,59420,'wholesale',15600000,statement_timestamp()+interval '30 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({
   quotaAdditionHandler:createIsolatedQuotaAdditionHandler(createIsolatedQuotaAdditionService({pool,env:process.env}),process.env),
   priceUnlockHandler:createIsolatedPriceUnlockHandler(createIsolatedPriceUnlockService({pool,env:process.env}),process.env)
 }));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const root='http://127.0.0.1:'+server.address().port;
 const add=async({customer='59400',bearer=sales,delta=2,eventKey=rand()}={})=>{
  const r=await fetch(root+'/api/v1/catalog/customers/'+customer+'/price-quota/additions',{
   method:'POST',headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey,'content-type':'application/json'},
   body:JSON.stringify({delta})});
  return {status:r.status,body:await r.json()};
 };
 const unlock=async(vehicleId)=>{
  const r=await fetch(root+'/api/v1/catalog/vehicles/'+vehicleId+'/customer-detail-entry',{
   method:'POST',headers:{authorization:'Bearer '+customerBearer,'x-idempotency-key':rand()}});
  return {status:r.status,body:await r.json()};
 };
 const ledger=async(id='59400')=>(await db.query(
  "SELECT business_day_shanghai,base_quota,temp_additions,consumed_count FROM public.customer_day_quota_ledger "+
  "WHERE customer_id=$1 ORDER BY business_day_shanghai DESC",[id])).rows;
 await test('PG16 new staff feature rejects 4S, unknown credentials, and Sales not current owner even with data scope',async()=>{
  assert.equal((await add({bearer:rand()})).status,401);
  assert.equal((await add({bearer:fourS})).status,401);
  const nonOwner=await add({customer:'59404'});
  assert.equal(nonOwner.status,403);assert.equal(nonOwner.body.code,'QUOTA_SALES_OWNER_REQUIRED');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.customer_quota_adjustments WHERE customer_id=59400")).rows[0].n,0);
 });
 const firstKey=rand();
 await test('PG16 Sales owner adds free daily quota with immutable physical adjustment and exact before/after audit',async()=>{
  const r=await add({eventKey:firstKey});
  assert.equal(r.status,200);assert.equal(r.body.code,'QUOTA_ADDITION_APPLIED');
  assert.equal(r.body.added,2);assert.equal(r.body.chargedMoney,false);
  assert.equal(r.body.beforeRemaining,1);assert.equal(r.body.afterRemaining,3);
  assert.equal(r.body.todayTempAdditions,2);
  const rows=await ledger();
  assert.equal(rows.length,1);assert.equal(rows[0].base_quota,1);
  assert.equal(rows[0].temp_additions,2);assert.equal(rows[0].consumed_count,0);
  const adjustment=(await db.query("SELECT customer_id,delta,changed_by,business_day_shanghai,occurred_at "+
    "FROM public.customer_quota_adjustments WHERE customer_id=59400")).rows[0];
  assert.equal(String(adjustment.changed_by),'59400');assert.equal(adjustment.delta,2);
  assert.ok(adjustment.occurred_at instanceof Date);
  const audit=(await db.query("SELECT actor_employee_id,before_remaining,after_remaining,total_temp_additions FROM "+
    "public.f05_catalog_quota_addition_events_test WHERE idempotency_key=$1",[firstKey])).rows[0];
  assert.equal(String(audit.actor_employee_id),'59400');
  assert.equal(audit.before_remaining,1);assert.equal(audit.after_remaining,3);
  assert.equal(audit.total_temp_additions,2);
 });
 await test('PG16 staff addition becomes immediately usable by LIMITED customer detail unlock; never charges money',async()=>{
  for(const vehicle of ['59001','59301','59303']){
   const r=await unlock(vehicle);
   assert.equal(r.status,200,JSON.stringify(r.body));
   assert.equal(r.body.code,'PRICE_UNLOCKED');
   assert.equal(r.body.charged,true);
  }
  assert.equal((await ledger())[0].consumed_count,3);
  const excess=await unlock('59420');
  assert.equal(excess.body.code,'DAILY_PRICE_QUOTA_EXHAUSTED');
  assert.equal(excess.body.priceCents,null);
  const extra=await add({delta:1});
  assert.equal(extra.status,200);assert.equal(extra.body.beforeRemaining,0);assert.equal(extra.body.afterRemaining,1);
  const now=await unlock('59420');
  assert.equal(now.body.code,'PRICE_UNLOCKED');assert.equal(now.body.charged,true);
  assert.equal((await ledger())[0].temp_additions,3);assert.equal((await ledger())[0].consumed_count,4);
 });
 await test('same operation key replays without adding quota; altered amount, target or actor key collision',async()=>{
  const replay=await add({eventKey:firstKey});
  assert.equal(replay.status,200);assert.equal(replay.body.code,'QUOTA_ADDITION_REPLAY');
  assert.equal(replay.body.beforeRemaining,1);assert.equal(replay.body.afterRemaining,3);
  assert.equal((await add({eventKey:firstKey,delta:3})).status,409);
  assert.equal((await add({eventKey:firstKey,customer:'59401'})).status,409);
  assert.equal((await add({eventKey:firstKey,bearer:manager})).status,409);
  assert.equal((await ledger())[0].temp_additions,3);
 });
 await test('manager and store head require separate scoped capability but not Customer owner',async()=>{
  const managerNonOwner=await add({customer:'59404',bearer:manager,delta:2});
  assert.equal(managerNonOwner.status,200);
  assert.equal(managerNonOwner.body.added,2);
  const storeHead=await add({customer:'59401',bearer:head,delta:1});
  assert.equal(storeHead.status,200);assert.equal(storeHead.body.chargedMoney,false);
  const managerScope=await add({customer:'59402',bearer:manager});
  assert.equal(managerScope.status,403);
  assert.equal((await ledger('59404'))[0].temp_additions,2);
 });
 await test('Customer disabled, unlimited entitlement, revoked scope and inactive employee deny with no mutations',async()=>{
  assert.equal((await add({customer:'59403'})).status,403);
  assert.equal((await add({customer:'59402'})).status,409);
  await db.query("DELETE FROM public.f05_catalog_quota_staff_scope_test WHERE employee_id=59400 AND customer_id=59401");
  try{assert.equal((await add({customer:'59401'})).status,403)}
  finally{await db.query("INSERT INTO public.f05_catalog_quota_staff_scope_test(employee_id,customer_id,can_add_price_quota,expires_at) VALUES(59400,59401,true,statement_timestamp()+interval '30 minutes')")}
  await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=59400");
  try{assert.equal((await add()).status,401)}
  finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=59400")}
  assert.equal((await db.query("SELECT count(*)::int n FROM public.customer_quota_adjustments WHERE customer_id=59403 OR customer_id=59402")).rows[0].n,0);
 });
 await test('LIMITED→UNLIMITED→LIMITED retains legal same-day temporary additions and past charges',async()=>{
  const original=(await ledger())[0];
  await db.query("UPDATE public.customers SET customer_level_id=59402 WHERE customer_id=59400");
  try{
   const r=await add({delta:2});
   assert.equal(r.status,409);assert.equal(r.body.code,'QUOTA_UNLIMITED_ADDITION_NOT_ALLOWED');
   assert.deepEqual((await ledger())[0],original);
  }finally{await db.query("UPDATE public.customers SET customer_level_id=59400 WHERE customer_id=59400")}
  assert.equal((await ledger())[0].temp_additions,3);
  assert.equal((await ledger())[0].consumed_count,4);
 });
 const separateKey=rand();
 await test('audit insert exception rolls back frozen adjustment AND customer-day ledger, with safe same-key retry',async()=>{
  const old=(await ledger('59401'))[0];
  const prior=(await db.query("SELECT count(*)::int n FROM public.customer_quota_adjustments WHERE customer_id=59401")).rows[0].n;
  await db.query("CREATE FUNCTION public.f05_staff_quota_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_QUOTA_HISTORY_FAILURE'; END $$");
  await db.query("CREATE TRIGGER f05_staff_quota_fault BEFORE INSERT ON public.f05_catalog_quota_addition_events_test "+
   "FOR EACH ROW EXECUTE FUNCTION public.f05_staff_quota_fail_test()");
  try{
   const bad=await add({customer:'59401',delta:2,eventKey:separateKey});
   assert.equal(bad.status,503);
   assert.deepEqual((await ledger('59401'))[0],old);
   assert.equal((await db.query("SELECT count(*)::int n FROM public.customer_quota_adjustments WHERE customer_id=59401")).rows[0].n,prior);
   assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_catalog_quota_addition_events_test WHERE idempotency_key=$1",[separateKey])).rows[0].n,0);
  }finally{
   await db.query("DROP TRIGGER f05_staff_quota_fault ON public.f05_catalog_quota_addition_events_test");
   await db.query("DROP FUNCTION public.f05_staff_quota_fail_test()");
  }
  assert.equal((await add({customer:'59401',delta:2,eventKey:separateKey})).status,200);
 });
 await test('two concurrent different request keys on same Customer append both additions without lost update',async()=>{
  const before=(await ledger('59401'))[0].temp_additions;
  const [a,b]=await Promise.all([add({customer:'59401',delta:3}),add({customer:'59401',delta:4})]);
  assert.equal(a.status,200);assert.equal(b.status,200);
  assert.equal((await ledger('59401'))[0].temp_additions,before+7);
  const n=(await db.query("SELECT count(*)::int n FROM public.customer_quota_adjustments WHERE customer_id=59401")).rows[0].n;
  assert.equal(n,4);
 });
 await test('same-key concurrent retries affect the day ledger only once',async()=>{
  const k=rand(),before=(await ledger('59401'))[0].temp_additions;
  const [a,b]=await Promise.all([add({customer:'59401',delta:5,eventKey:k}),add({customer:'59401',delta:5,eventKey:k})]);
  assert.deepEqual([a.status,b.status],[200,200]);
  assert.deepEqual([a.body.code,b.body.code].sort(),['QUOTA_ADDITION_APPLIED','QUOTA_ADDITION_REPLAY']);
  assert.equal((await ledger('59401'))[0].temp_additions,before+5);
 });
 await test('next UTC+8 business day starts fresh additions; replay uses original historical day snapshot',async()=>{
  const old=(await ledger('59401'))[0];
  await db.query("UPDATE public.customer_day_quota_ledger SET business_day_shanghai=business_day_shanghai-interval '1 day' WHERE customer_id=59401");
  const today=await add({customer:'59401',delta:1,eventKey:rand()});
  assert.equal(today.status,200);assert.equal(today.body.todayTempAdditions,1);
  assert.equal((await ledger('59401')).length,2);
  const replay=await add({customer:'59401',delta:2,eventKey:separateKey});
  assert.equal(replay.body.code,'QUOTA_ADDITION_REPLAY');
  assert.equal(replay.body.businessDay,old.business_day_shanghai.toISOString().slice(0,10));
  assert.equal((await ledger('59401'))[0].temp_additions,1);
 });
 await test('frozen adjustment and test audit refuse UPDATE/DELETE; revoked staff bearer loses replay',async()=>{
  await assert.rejects(db.query("UPDATE public.customer_quota_adjustments SET delta=99 WHERE customer_id=59400"),e=>e.code==='23514');
  await assert.rejects(db.query("DELETE FROM public.customer_quota_adjustments WHERE customer_id=59400"),e=>e.code==='23514');
  await assert.rejects(db.query("DELETE FROM public.f05_catalog_quota_addition_events_test WHERE customer_id=59400"),e=>e.code==='23514');
  await db.query("UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1",[hash(sales)]);
  assert.equal((await add({eventKey:firstKey})).status,401);
 });
}catch(e){failure=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
