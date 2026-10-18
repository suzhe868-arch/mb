// PDM-11 real frozen F02 find_car_applications, not Demand and never formal phone/WeChat issuer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedFindCarService} from '../src/f05-find-car-service.mjs';
import {createIsolatedFindCarHandler} from '../src/f05-find-car-http.mjs';
const conf=validateCatalogEnv();
const pool=new pg.Pool({connectionString:conf.connectionString,max:5,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:conf.connectionString,connectionTimeoutMillis:1200});
const key=()=>randomBytes(32).toString('base64url'),hash=s=>createHash('sha256').update(s).digest('hex');
const validBearer=key(),noPhoneBearer=key(),noOwnerBearer=key(),inactiveOwnerBearer=key(),fourSBearer=key(),disabledBearer=key(),premiumBearer=key();
const tokens=[[validBearer,59500],[noPhoneBearer,59501],[noOwnerBearer,59502],[inactiveOwnerBearer,59503],
 [fourSBearer,59504],[disabledBearer,59505],[premiumBearer,59506]];
let server,connected=false,failure;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(59506,'f05_find_car_test_enabled')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
   "(59500,59001,'active','receiving'),(59501,59001,'inactive','receiving'),(59502,59002,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES"+
   "(59500,'active',59001,59500,'assigned'),"+
   "(59501,'active',59001,59500,'assigned'),"+
   "(59502,'active',59001,NULL,'owner_assignment_pending'),"+
   "(59503,'active',59001,59501,'assigned'),"+
   "(59504,'active',59001,59502,'assigned'),"+
   "(59505,'disabled',59001,59500,'assigned'),"+
   "(59506,'active',59506,59500,'assigned')");
  for(const [token,id] of tokens)
   await db.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) "+
    "VALUES($1,$2,statement_timestamp()+interval '25 minutes')",[hash(token),id]);
  await db.query("INSERT INTO public.f05_find_car_phone_proof_test(customer_id,phone_service_authorized,expires_at) VALUES"+
   "(59500,true,statement_timestamp()+interval '25 minutes'),"+
   "(59502,true,statement_timestamp()+interval '25 minutes'),"+
   "(59503,true,statement_timestamp()+interval '25 minutes'),"+
   "(59504,true,statement_timestamp()+interval '25 minutes'),"+
   "(59505,true,statement_timestamp()+interval '25 minutes'),"+
   "(59506,true,statement_timestamp()+interval '25 minutes')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES"+
   "(59001,false,statement_timestamp()+interval '25 minutes'),"+
   "(59506,true,statement_timestamp()+interval '25 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedFindCarService({pool,env:process.env});
 server=createServer(createFoundationHandler({findCarHandler:createIsolatedFindCarHandler(service,process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const root='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/find-car/applications';
 const send=async({bearer=validBearer,action='CREATE',id=null,originalText='找一台2026款奥迪A6，车况好',budgetMaxCents='20000000',revision=1,eventKey=key()}={})=>{
  const url=action==='CREATE'?root:action==='EDIT'?root+'/'+id:root+'/'+id+'/withdraw';
  const body=action==='WITHDRAW'?undefined:JSON.stringify({originalText,budgetMaxCents,...(action==='EDIT'?{expectedRevision:revision}:{})});
  const r=await fetch(url,{method:action==='EDIT'?'PATCH':'POST',headers:{
   authorization:'Bearer '+bearer,'x-idempotency-key':eventKey,...(body?{'content-type':'application/json'}:{})},body});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 unknown or disabled Customer and no authenticated phone fact cannot create Application',async()=>{
  assert.equal((await send({bearer:key()})).status,401);
  assert.equal((await send({bearer:disabledBearer})).status,401);
  const r=await send({bearer:noPhoneBearer});
  assert.equal(r.status,403);assert.equal(r.body.code,'FIND_CAR_PHONE_SERVICE_REQUIRED');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id IN (59501,59505)')).rows[0].n,0);
 });
 await test('PG16 no current Owner, inactive Owner or 4S Owner must never establish ownerless Application',async()=>{
  const pending=await send({bearer:noOwnerBearer});
  assert.equal(pending.status,409);assert.equal(pending.body.code,'FIND_CAR_OWNER_PENDING');
  assert.equal((await send({bearer:inactiveOwnerBearer})).body.code,'FIND_CAR_OWNER_INELIGIBLE');
  assert.equal((await send({bearer:fourSBearer})).body.code,'FIND_CAR_OWNER_INELIGIBLE');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id IN (59502,59503,59504)')).rows[0].n,0);
 });
 const firstKey=key();
 let applicationId;
 await test('PG16 ordinary Customer creates assigned pending Application, raw text+budget separate, no Demand/Matching',async()=>{
  const result=await send({eventKey:firstKey});
  assert.equal(result.status,200);assert.equal(result.body.code,'FIND_CAR_APPLICATION_SUBMITTED');
  assert.equal(result.body.status,'pending');assert.equal(result.body.demandCreated,false);
  assert.equal(result.body.matchingStarted,false);
  assert.equal(result.body.testOnlyEligibleForEmployeeActivation,false);
  applicationId=result.body.applicationId;
  const app=(await db.query('SELECT customer_id,status,assigned_employee_id,activated_demand_id,created_at FROM public.find_car_applications WHERE application_id=$1',[applicationId])).rows[0];
  assert.equal(String(app.customer_id),'59500');assert.equal(app.status,'pending');assert.equal(String(app.assigned_employee_id),'59500');
  assert.equal(app.activated_demand_id,null);assert.ok(app.created_at instanceof Date);
  const raw=(await db.query('SELECT customer_original_text,budget_max_cents,revision FROM public.f05_find_car_application_detail_test WHERE application_id=$1',[applicationId])).rows[0];
  assert.equal(raw.customer_original_text,'找一台2026款奥迪A6，车况好');assert.equal(String(raw.budget_max_cents),'20000000');
  assert.equal(String(raw.revision),'1');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demands WHERE customer_id=59500')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id IN (SELECT demand_id FROM public.demands WHERE customer_id=59500)')).rows[0].n,0);
 });
 await test('same create key safely replays history, different original text or customer cannot consume old key',async()=>{
  const same=await send({eventKey:firstKey});assert.equal(same.status,200);
  assert.equal(same.body.code,'FIND_CAR_REQUEST_REPLAY');assert.equal(same.body.applicationId,applicationId);
  assert.equal((await send({eventKey:firstKey,originalText:'另一条找车要求'})).status,409);
  assert.equal((await send({eventKey:firstKey,bearer:premiumBearer})).status,409);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id=59500')).rows[0].n,1);
 });
 const editKey=key();
 await test('PG16 optimistic edit updates same Application/revision/task, preserving assigned owner and created_at',async()=>{
  const before=(await db.query('SELECT assigned_employee_id,created_at FROM public.find_car_applications WHERE application_id=$1',[applicationId])).rows[0];
  const changed=await send({action:'EDIT',id:applicationId,originalText:'找一台宝马5系，预算增加',budgetMaxCents:'23000000',eventKey:editKey});
  assert.equal(changed.status,200);assert.equal(changed.body.code,'FIND_CAR_APPLICATION_UPDATED');
  assert.equal(changed.body.revision,2);
  const after=(await db.query('SELECT status,assigned_employee_id,activated_demand_id,created_at FROM public.find_car_applications WHERE application_id=$1',[applicationId])).rows[0];
  assert.equal(after.status,'pending');assert.equal(after.activated_demand_id,null);
  assert.equal(String(after.assigned_employee_id),String(before.assigned_employee_id));
  assert.equal(after.created_at.getTime(),before.created_at.getTime());
  const raw=(await db.query('SELECT revision,customer_original_text,budget_max_cents FROM public.f05_find_car_application_detail_test WHERE application_id=$1',[applicationId])).rows[0];
  assert.equal(String(raw.revision),'2');assert.equal(raw.customer_original_text,'找一台宝马5系，预算增加');
  assert.equal(String(raw.budget_max_cents),'23000000');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id=59500')).rows[0].n,1);
 });
 await test('stale edit revision fails and same edit key historical replay cannot overwrite newer state',async()=>{
  assert.equal((await send({action:'EDIT',id:applicationId,revision:1,originalText:'第三次编辑'})).status,409);
  const replay=await send({action:'EDIT',id:applicationId,revision:1,originalText:'找一台宝马5系，预算增加',budgetMaxCents:'23000000',eventKey:editKey});
  assert.equal(replay.body.code,'FIND_CAR_REQUEST_REPLAY');
  assert.equal(replay.body.revision,2);
  const current=(await db.query('SELECT revision FROM public.f05_find_car_application_detail_test WHERE application_id=$1',[applicationId])).rows[0];
  assert.equal(String(current.revision),'2');
 });
 await test('premium/test entitlement also only creates pending Application, never active Demand',async()=>{
  const premium=await send({bearer:premiumBearer});
  assert.equal(premium.status,200);assert.equal(premium.body.status,'pending');
  assert.equal(premium.body.testOnlyEligibleForEmployeeActivation,true);
  assert.equal(premium.body.demandCreated,false);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demands WHERE customer_id=59506')).rows[0].n,0);
 });
 const withdrawKey=key();
 await test('Customer may withdraw own pending Application without phone permission; closes, never physically deletes',async()=>{
  await db.query('UPDATE public.f05_find_car_phone_proof_test SET revoked_at=statement_timestamp() WHERE customer_id=59500');
  const result=await send({action:'WITHDRAW',id:applicationId,eventKey:withdrawKey});
  assert.equal(result.status,200);assert.equal(result.body.status,'closed');
  const row=(await db.query('SELECT status,activated_demand_id,assigned_employee_id FROM public.find_car_applications WHERE application_id=$1',[applicationId])).rows[0];
  assert.equal(row.status,'closed');assert.equal(row.activated_demand_id,null);assert.equal(String(row.assigned_employee_id),'59500');
  assert.equal((await send({action:'WITHDRAW',id:applicationId,eventKey:withdrawKey})).body.code,'FIND_CAR_REQUEST_REPLAY');
  assert.equal((await send({action:'WITHDRAW',id:applicationId})).status,409);
  assert.equal((await send({action:'EDIT',id:applicationId,revision:2,originalText:'不能复活'})).status,403);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_find_car_application_events_test WHERE application_id=$1',[applicationId])).rows[0].n,3);
 });
 await test('other Customer cannot edit or withdraw an Application by guessing its id',async()=>{
  assert.equal((await send({bearer:premiumBearer,action:'WITHDRAW',id:applicationId})).status,404);
  assert.equal((await send({bearer:premiumBearer,action:'EDIT',id:applicationId,originalText:'越权修改'})).status,404);
 });
 await test('forced application-audit failure rolls back frozen Application and sidecar detail atomically',async()=>{
  const old=(await db.query('SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id=59506')).rows[0].n;
  const k=key();
  await db.query("CREATE FUNCTION public.f05_find_car_audit_fault_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_FIND_CAR_AUDIT_FAILURE'; END $$");
  await db.query('CREATE TRIGGER f05_find_car_audit_inject BEFORE INSERT ON public.f05_find_car_application_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_find_car_audit_fault_test()');
  try{
   const failed=await send({bearer:premiumBearer,eventKey:k});
   assert.equal(failed.status,503);
   assert.equal((await db.query('SELECT count(*)::int n FROM public.find_car_applications WHERE customer_id=59506')).rows[0].n,old);
   assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_find_car_application_events_test WHERE event_key=$1',[k])).rows[0].n,0);
  }finally{
   await db.query('DROP TRIGGER f05_find_car_audit_inject ON public.f05_find_car_application_events_test');
   await db.query('DROP FUNCTION public.f05_find_car_audit_fault_test()');
  }
  assert.equal((await send({bearer:premiumBearer,eventKey:k})).status,200);
 });
 await test('PG16 competing same-key CREATE commits once; distinct keys allow separate pending Applications',async()=>{
  const k=key();
  const [a,b]=await Promise.all([send({bearer:premiumBearer,eventKey:k}),send({bearer:premiumBearer,eventKey:k})]);
  assert.deepEqual([a.status,b.status],[200,200]);
  assert.equal(a.body.applicationId,b.body.applicationId);
  assert.deepEqual([a.body.code,b.body.code].sort(),['FIND_CAR_APPLICATION_SUBMITTED','FIND_CAR_REQUEST_REPLAY']);
  const independent=await send({bearer:premiumBearer});
  assert.equal(independent.status,200);assert.notEqual(independent.body.applicationId,a.body.applicationId);
 });
 await test('append-only raw Application audit refuses UPDATE/DELETE, Customer revoke closes session',async()=>{
  await assert.rejects(db.query("DELETE FROM public.f05_find_car_application_events_test WHERE customer_id=59500"),e=>e.code==='23514');
  await assert.rejects(db.query("UPDATE public.f05_find_car_application_events_test SET result_status='closed' WHERE customer_id=59500"),e=>e.code==='23514');
  await db.query('UPDATE public.f05_catalog_customer_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[hash(premiumBearer)]);
  assert.equal((await send({bearer:premiumBearer})).status,401);
 });
}catch(e){failure=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
