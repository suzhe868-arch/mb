// F05-6 application-to-demand human activation in frozen F02 PG16, NEVER auto-Matching.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedFindCarService} from '../src/f05-find-car-service.mjs';
import {createIsolatedFindCarHandler} from '../src/f05-find-car-http.mjs';
import {createIsolatedFindCarActivationService} from '../src/f05-find-car-activation-service.mjs';
import {createIsolatedFindCarActivationHandler} from '../src/f05-find-car-activation-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:5,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1200});
const random=()=>randomBytes(32).toString('base64url'),hash=x=>createHash('sha256').update(x).digest('hex');
const ownerBearer=random(),otherBearer=random(),fourSBearer=random(),normalCustomer=random(),eligibleCustomer=random();
let server,connected=false,fail;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(59610,'f05_demand_entitled')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
    "(59600,59001,'active','receiving'),(59601,59001,'active','receiving'),(59602,59002,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES"+
   "(59600,'active',59610,59600,'assigned'),"+
   "(59601,'active',59001,59600,'assigned'),"+
   "(59602,'disabled',59610,59600,'assigned'),"+
   "(59603,'active',59610,59600,'assigned')");
  for(const [bearer,id] of [[ownerBearer,'59600'],[otherBearer,'59601'],[fourSBearer,'59602']])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '25 minutes')",[hash(bearer),id]);
  for(const [bearer,id] of [[eligibleCustomer,'59600'],[normalCustomer,'59601']])
   await db.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '25 minutes')",[hash(bearer),id]);
  await db.query("INSERT INTO public.f05_find_car_phone_proof_test(customer_id,phone_service_authorized,expires_at) VALUES"+
   "(59600,true,statement_timestamp()+interval '25 minutes'),"+
   "(59601,true,statement_timestamp()+interval '25 minutes'),"+
   "(59602,true,statement_timestamp()+interval '25 minutes')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES"+
   "(59610,true,statement_timestamp()+interval '25 minutes') "+
   "ON CONFLICT(level_id) DO UPDATE SET can_activate_demand=true,expires_at=excluded.expires_at");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({
  findCarHandler:createIsolatedFindCarHandler(createIsolatedFindCarService({pool,env:process.env}),process.env),
  findCarActivationHandler:createIsolatedFindCarActivationHandler(createIsolatedFindCarActivationService({pool,env:process.env}),process.env)
 }));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const root='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/find-car/applications';
 const submit=async(bearer=eligibleCustomer,eventKey=random())=>{
  const r=await fetch(root,{method:'POST',headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey,'content-type':'application/json'},
   body:JSON.stringify({originalText:'客户原话：想要奥迪A6',budgetMaxCents:'20000000'})});
  return {status:r.status,body:await r.json()};
 };
 const activate=async(appId,bearer=ownerBearer,eventKey=random())=>{
  const r=await fetch(root+'/'+appId+'/activate',{method:'POST',
   headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey}});
  return {status:r.status,body:await r.json()};
 };
 const eligible=(await submit()).body.applicationId;
 const ordinary=(await submit(normalCustomer)).body.applicationId;
 assert.ok(eligible&&ordinary);
 await test('PG16 Customer submits pending even with entitlement, no automatic Demand nor Matching',async()=>{
  const rows=(await db.query("SELECT customer_id,status,activated_demand_id FROM public.find_car_applications "+
    "WHERE application_id IN ($1,$2)",[eligible,ordinary])).rows;
  assert.equal(rows.length,2);assert.ok(rows.every(x=>x.status==='pending'&&x.activated_demand_id===null));
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demands WHERE customer_id IN (59600,59601)')).rows[0].n,0);
 });
 await test('PG16 lack explicit Employee activation Scope denies even current Owner',async()=>{
  const r=await activate(eligible);
  assert.equal(r.status,403);assert.equal(r.body.code,'FIND_CAR_EMPLOYEE_ACTIVATION_SCOPE_REQUIRED');
  await db.query("INSERT INTO public.f05_find_car_activation_scope_test(employee_id,customer_id,can_activate_demand,expires_at) VALUES"+
    "(59600,59600,true,statement_timestamp()+interval '25 minutes'),"+
    "(59600,59601,true,statement_timestamp()+interval '25 minutes'),"+
    "(59600,59602,true,statement_timestamp()+interval '25 minutes'),"+
    "(59600,59603,true,statement_timestamp()+interval '25 minutes'),"+
    "(59601,59600,true,statement_timestamp()+interval '25 minutes')");
 });
 await test('wrong Employee/4S role, unknown bearer and absent application cannot activate Demand',async()=>{
  assert.equal((await activate(eligible,otherBearer)).status,403);
  assert.equal((await activate(eligible,fourSBearer)).status,401);
  assert.equal((await activate(eligible,random())).status,401);
  assert.equal((await activate('999999999999')).status,404);
 });
 await test('ordinary Customer pending Application cannot be activated while current Level entitlement OFF',async()=>{
  const r=await activate(ordinary);
  assert.equal(r.status,403);assert.equal(r.body.code,'FIND_CAR_ENTITLEMENT_REQUIRED');
  const app=(await db.query('SELECT status,activated_demand_id FROM public.find_car_applications WHERE application_id=$1',[ordinary])).rows[0];
  assert.equal(app.status,'pending');assert.equal(app.activated_demand_id,null);
 });
 await test('revoked phone-service proof prevents activation even when entitled and staff scoped',async()=>{
  await db.query("UPDATE public.f05_find_car_phone_proof_test SET revoked_at=statement_timestamp() WHERE customer_id=59600");
  try{const r=await activate(eligible);assert.equal(r.status,403);assert.equal(r.body.code,'FIND_CAR_PHONE_SERVICE_REQUIRED')}
  finally{await db.query('UPDATE public.f05_find_car_phone_proof_test SET revoked_at=NULL WHERE customer_id=59600')}
 });
 let demandId,activatedKey=random();
 await test('human Employee activation atomically creates exactly one active Demand and binds one Application',async()=>{
  const r=await activate(eligible,ownerBearer,activatedKey);
  assert.equal(r.status,200);assert.equal(r.body.code,'FIND_CAR_DEMAND_ACTIVATED');
  assert.equal(r.body.demandCreated,true);assert.equal(r.body.matchingReady,false);assert.equal(r.body.matchingStarted,false);
  demandId=r.body.demandId;assert.ok(demandId);
  const app=(await db.query('SELECT status,activated_demand_id,assigned_employee_id FROM public.find_car_applications WHERE application_id=$1',[eligible])).rows[0];
  assert.equal(app.status,'activated');assert.equal(String(app.activated_demand_id),demandId);
  assert.equal(String(app.assigned_employee_id),'59600');
  const demand=(await db.query('SELECT customer_id,responsible_employee_id,demand_state,criteria_json,created_at FROM public.demands WHERE demand_id=$1',[demandId])).rows[0];
  assert.equal(String(demand.customer_id),'59600');assert.equal(String(demand.responsible_employee_id),'59600');
  assert.equal(demand.demand_state,'active');assert.deepEqual(demand.criteria_json,{});
  assert.ok(demand.created_at instanceof Date);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=$1',[demandId])).rows[0].n,0);
  const events=(await db.query("SELECT action,actor_employee_id,result_demand_id,result_status FROM "+
   "public.f05_find_car_application_events_test WHERE event_key=$1",[activatedKey])).rows[0];
  assert.equal(events.action,'ACTIVATE');assert.equal(events.result_status,'activated');
  assert.equal(String(events.actor_employee_id),'59600');assert.equal(String(events.result_demand_id),demandId);
 });
 await test('same activation key replays without new Demand; different key or transferred actor cannot activate twice',async()=>{
  const same=await activate(eligible,ownerBearer,activatedKey);
  assert.equal(same.status,200);assert.equal(same.body.code,'FIND_CAR_ACTIVATION_REPLAY');
  assert.equal(same.body.demandId,demandId);
  assert.equal((await activate(eligible)).status,409);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demands WHERE customer_id=59600')).rows[0].n,1);
 });
 await test('Customer downgrade after eligible pending submission blocks activation until formal re-entitlement',async()=>{
  const pending=(await submit()).body.applicationId;assert.ok(pending);
  await db.query("UPDATE public.customers SET customer_level_id=59001 WHERE customer_id=59600");
  try{
   const result=await activate(pending);assert.equal(result.status,403);assert.equal(result.body.code,'FIND_CAR_ENTITLEMENT_REQUIRED');
   assert.equal((await db.query('SELECT status FROM public.find_car_applications WHERE application_id=$1',[pending])).rows[0].status,'pending');
  }finally{await db.query('UPDATE public.customers SET customer_level_id=59610 WHERE customer_id=59600')}
 });
 await test('forced immutable event INSERT error atomically rolls back Demand creation and Application activation',async()=>{
  const app=(await submit()).body.applicationId;
  const keyValue=random();
  const before=(await db.query('SELECT count(*)::int n FROM public.demands WHERE customer_id=59600')).rows[0].n;
  await db.query("CREATE FUNCTION public.f05_demand_activation_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='ACTIVATE' THEN RAISE EXCEPTION 'INJECTED_DEMAND_ACTIVATION_AUDIT_FAIL'; END IF; RETURN NEW; END $$");
  await db.query("CREATE TRIGGER f05_demand_activation_inject BEFORE INSERT ON public.f05_find_car_application_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_demand_activation_fault()");
  try{
   const rejected=await activate(app,ownerBearer,keyValue);
   assert.equal(rejected.status,503);
   assert.equal((await db.query('SELECT count(*)::int n FROM public.demands WHERE customer_id=59600')).rows[0].n,before);
   const row=(await db.query('SELECT status,activated_demand_id FROM public.find_car_applications WHERE application_id=$1',[app])).rows[0];
   assert.equal(row.status,'pending');assert.equal(row.activated_demand_id,null);
  }finally{
   await db.query('DROP TRIGGER f05_demand_activation_inject ON public.f05_find_car_application_events_test');
   await db.query('DROP FUNCTION public.f05_demand_activation_fault()');
  }
  assert.equal((await activate(app,ownerBearer,keyValue)).status,200);
 });
 await test('parallel different activation keys yield one Demand; same-key replay returns same Demand',async()=>{
  const app=(await submit()).body.applicationId;
  const [x,y]=await Promise.all([activate(app),activate(app)]);
  assert.deepEqual([x.status,y.status].sort((a,b)=>a-b),[200,409]);
  const demand=(await db.query('SELECT activated_demand_id FROM public.find_car_applications WHERE application_id=$1',[app])).rows[0].activated_demand_id;
  assert.ok(demand);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demands WHERE demand_id=$1',[demand])).rows[0].n,1);
  const app2=(await submit()).body.applicationId;
  const k=random();
  const [a,b]=await Promise.all([activate(app2,ownerBearer,k),activate(app2,ownerBearer,k)]);
  assert.deepEqual([a.status,b.status],[200,200]);
  assert.equal(a.body.demandId,b.body.demandId);
 });
 await test('disabled Customer and revoked Employee credentials fail closed without rewriting existing Demand',async()=>{
  const app=(await submit()).body.applicationId;
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59600");
  try{assert.equal((await activate(app)).status,403)}
  finally{await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59600")}
  await db.query('UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[hash(ownerBearer)]);
  assert.equal((await activate(app)).status,401);
  assert.equal((await db.query('SELECT status FROM public.find_car_applications WHERE application_id=$1',[app])).rows[0].status,'pending');
 });
}catch(e){fail=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(fail)throw fail;
