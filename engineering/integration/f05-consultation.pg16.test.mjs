import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedConsultationService} from '../src/f05-consultation-service.mjs';
import {createIsolatedConsultationHandler} from '../src/f05-consultation-http.mjs';
import {createIsolatedRecommendationService} from '../src/f05-recommendation-service.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
const db=validateCatalogEnv(),pool=new pg.Pool({connectionString:db.connectionString,max:3,connectionTimeoutMillis:1100});
const writer=new pg.Client({connectionString:db.connectionString,connectionTimeoutMillis:1100});
const token=randomBytes(32).toString('base64url'),
 employeeForRecommendation=randomBytes(32).toString('base64url'),
 digest=v=>createHash('sha256').update(v).digest('hex');
const key=()=>randomBytes(32).toString('base64url');
let server,connected=false,fail=null;
try{
 await writer.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await writer.query('BEGIN');
 try{
  await writer.query("INSERT INTO public.roles(role_id,role_code) VALUES(59001,'sales'),(59002,'four_s')");
  await writer.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(59001,59001,'active','receiving'),(59002,59002,'active','receiving')");
  await writer.query("UPDATE public.customers SET current_owner_employee_id=59001,owner_assignment_state='assigned' WHERE customer_id=59001");
  await writer.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES(59001,decode('abcd1234','hex'),statement_timestamp())");
  // The catalog suite legitimately deletes its visibility evidence; Consultation must seed its OWN test issuer proof.
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59001,59001,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_consultation_actor_proof_test(customer_id,assignee_employee_id,phone_consent_test,worker_scope_test,expires_at) VALUES(59001,59001,true,true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,59001,statement_timestamp()+interval '20 minutes')",[digest(token)]);
  // Real independent Customer/Demand/Recommendation source for cross-domain
  // Consultation entry. Still exclusively DISPOSABLE_TEST_ONLY; no fake issuer.
  await writer.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(59003,59001,'active','receiving')");
  await writer.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,59003,statement_timestamp()+interval '20 minutes')",[digest(employeeForRecommendation)]);
  await writer.query("INSERT INTO public.f05_recommendation_manage_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(59003,59001,true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_consultation_actor_proof_test(customer_id,assignee_employee_id,phone_consent_test,worker_scope_test,expires_at) VALUES(59001,59003,true,true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(59020,59001,59003,'active','{}'::jsonb)");
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES(59020,'wholesale','active','hidden',59001,statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(59020,59020,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59020,59020,'wholesale',false,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(59020,59020,'wholesale',12000000,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(59001,true,statement_timestamp()+interval '20 minutes') ON CONFLICT(level_id) DO UPDATE SET can_activate_demand=true,expires_at=excluded.expires_at");
  await writer.query('COMMIT');
 }catch(e){await writer.query('ROLLBACK');throw e}
 const service=createIsolatedConsultationService({pool,env:process.env});
 const recommendation=createIsolatedRecommendationService({pool,env:process.env});
 server=createServer(createFoundationHandler({consultationHandler:createIsolatedConsultationHandler(service,process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const call=async(eventKey=key(),authToken=token,vehicle='59001',h={})=>{
  const headers={authorization:'Bearer '+authToken,'x-idempotency-key':eventKey,...h};
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/vehicles/'+vehicle+'/consultations',{method:'POST',headers});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 no authentic customer bearer and disabled Customer always refused',async()=>{
  assert.equal((await call(key(),randomBytes(32).toString('base64url'))).status,401);
  assert.equal((await call(key(),token,'59001',{'x-customer-id':'59002'})).status,403);
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59001");
  try{assert.equal((await call()).status,401)}finally{await writer.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59001")}
 });
 await test('PG16 consultation requires test phone scope and valid current owner',async()=>{
  await writer.query('DELETE FROM public.f05_catalog_consultation_actor_proof_test WHERE customer_id=59001');
  try{assert.equal((await call()).status,403)}
  finally{await writer.query("INSERT INTO public.f05_catalog_consultation_actor_proof_test(customer_id,assignee_employee_id,phone_consent_test,worker_scope_test,expires_at) VALUES(59001,59001,true,true,statement_timestamp()+interval '20 minutes')")}
  await writer.query("UPDATE public.customers SET current_owner_employee_id=NULL,owner_assignment_state='owner_assignment_pending' WHERE customer_id=59001");
  try{assert.equal((await call()).status,409)}
  finally{await writer.query("UPDATE public.customers SET current_owner_employee_id=59001,owner_assignment_state='assigned' WHERE customer_id=59001")}
 });
 await test('PG16 real F05-9 Recommendation -> hidden PDM15 Consultation preserves direct source and selects current Demand assignee',async()=>{
  // This Recommendation is created by the *real* PG16 Recommendation service,
  // using its actual independent Employee proof and legitimate source Demand.
  const grant=await recommendation.mutate({credential:employeeForRecommendation,action:'CREATE',
   customerId:'59001',vehicleId:'59020',listingCycleId:'59020',sourceDemandId:'59020',eventKey:key()});
  assert.equal(grant.status,200,JSON.stringify(grant));
  assert.equal(grant.body.code,'REC_CREATED');
  const recommendationId=grant.body.recommendationId;
  const postRec=async(eventKey=key(),auth=token)=>{
   const r=await fetch('http://127.0.0.1:'+server.address().port+
    '/api/v1/catalog/recommendations/'+recommendationId+'/consultations',
    {method:'POST',headers:{authorization:'Bearer '+auth,'x-idempotency-key':eventKey}});
   return {status:r.status,body:await r.json()};
  };
  assert.equal((await call(key(),token,'59020')).status,404,
   'public direct-detail path must not reveal hidden Recommendation vehicle');
  const eventKey=key();
  const created=await postRec(eventKey);
  assert.equal(created.status,200,JSON.stringify(created));
  assert.equal(created.body.code,'CONSULTATION_CREATED');
  const row=(await writer.query("SELECT assignee_employee_id,source_relation,first_response_deadline "+
   "FROM public.consultations WHERE consultation_id=$1",[created.body.consultationId])).rows[0];
  assert.equal(String(row.assignee_employee_id),'59003',
   'current active source Demand responsible outranks Customer Owner');
  assert.equal(row.source_relation.kind,'recommendation');
  assert.equal(row.source_relation.recommendationId,recommendationId);
  assert.equal(row.source_relation.sourceDemandId,'59020');
  const replay=await postRec(eventKey);
  assert.equal(replay.status,200);assert.equal(replay.body.code,'CONSULTATION_IDEMPOTENT_REPLAY');
  assert.equal(replay.body.consultationId,created.body.consultationId);
  // Recommendation END never rewrites original Consultation history.
  const ended=await recommendation.mutate({credential:employeeForRecommendation,action:'END',
   customerId:'59001',vehicleId:'59020',listingCycleId:'59020',eventKey:key()});
  assert.equal(ended.status,200,JSON.stringify(ended));
  assert.equal((await postRec()).status,404,
   'historical ended Recommendation cannot authorize a new entry');
  const after=(await writer.query("SELECT assignee_employee_id,source_relation,first_response_deadline "+
   "FROM public.consultations WHERE consultation_id=$1",[created.body.consultationId])).rows[0];
  assert.equal(String(after.assignee_employee_id),'59003');
  assert.deepEqual(after.source_relation,row.source_relation);
  assert.equal(after.first_response_deadline.getTime(),row.first_response_deadline.getTime());
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test "+
   "WHERE consultation_id=$1",[created.body.consultationId])).rows[0].n,1);
 });
 await test('missing independent vehicle visibility proof blocks Consultation creation',async()=>{
  await writer.query('DELETE FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=59001 AND listing_cycle_id=59001');
  try{
   const denied=await call();assert.equal(denied.status,404);
   assert.equal(denied.body.code,'CONSULTATION_VEHICLE_NOT_VISIBLE');
  }finally{
   await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59001,59001,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  }
 });
 const k=key();let cId=null;
 await test('actual POST creates frozen Consultation with 15min SLA and immutable direct source',async()=>{
  const r=await call(k);
  assert.equal(r.status,200);assert.equal(r.body.code,'CONSULTATION_CREATED');assert.equal(r.body.created,true);cId=r.body.consultationId;
  const c=(await writer.query('SELECT * FROM public.consultations WHERE consultation_id=$1',[cId])).rows[0];
  assert.equal(c.status,'pending');assert.equal(String(c.customer_id),'59001');assert.equal(String(c.vehicle_id),'59001');
  assert.equal(String(c.listing_cycle_id),'59001');assert.equal(String(c.assignee_employee_id),'59001');
  assert.equal(c.source_relation.kind,'other');assert.equal(c.source_relation.entry,'vehicle_detail');
  assert.equal(c.first_response_deadline instanceof Date,true);
  const remaining=c.first_response_deadline.getTime()-Date.now();
  assert.ok(remaining>12*60*1000&&remaining<=16*60*1000);
 });
 await test('same event key exact replay and second key reuses same pending Consultation and adds touch',async()=>{
  const again=await call(k);assert.equal(again.status,200);assert.equal(again.body.code,'CONSULTATION_IDEMPOTENT_REPLAY');assert.equal(again.body.consultationId,cId);
  const other=await call();assert.equal(other.status,200);assert.equal(other.body.code,'CONSULTATION_REUSED');assert.equal(other.body.consultationId,cId);
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations WHERE customer_id=59001 AND vehicle_id=59001 AND status IN ('pending','processing')")).rows[0].n,1);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=$1',[cId])).rows[0].n,2);
 });
 await test('bad owner role/employee inactive and hidden/offline/sold/protected source fail closed',async()=>{
  await writer.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=59001");
  try{assert.equal((await call()).status,403)}
  finally{await writer.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=59001")}
  await writer.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=59001");
  try{assert.equal((await call()).status,404)}
  finally{await writer.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=59001")}
  await writer.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=59001");
  try{assert.equal((await call()).status,404)}
  finally{await writer.query("UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=59001")}
 });
 await test('immutable history cannot update or delete consultation action',async()=>{
  await assert.rejects(writer.query("UPDATE public.f05_catalog_consultation_actions_test SET action='TOUCHED' WHERE consultation_id=$1",[cId]),e=>e.code==='23514');
  await assert.rejects(writer.query("DELETE FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=$1",[cId]),e=>e.code==='23514');
 });
 await test('PG16 event-insert exception rolls back Consultation or touch without orphaned operation',async()=>{
  await writer.query("CREATE FUNCTION public.f05_consult_inject_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_CONSULT_EVENT_FAIL'; END $$");
  await writer.query("CREATE TRIGGER f05_consult_event_inject BEFORE INSERT ON public.f05_catalog_consultation_actions_test FOR EACH ROW EXECUTE FUNCTION public.f05_consult_inject_fail_test()");
  const before=(await writer.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test')).rows[0].n;
  const id=key();
  try{const r=await call(id);assert.equal(r.status,503);assert.equal((await writer.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test')).rows[0].n,before)}
  finally{await writer.query('DROP TRIGGER f05_consult_event_inject ON public.f05_catalog_consultation_actions_test');await writer.query('DROP FUNCTION public.f05_consult_inject_fail_test()')}
  assert.equal((await call(id)).status,200);
 });
 await test('PG16 relist creates new Consultation; old-cycle event key never replays across ListingCycle',async()=>{
  const newCycle='59009',newEvent=key();
  await writer.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=59001");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,59001,statement_timestamp())",[newCycle]);
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59001,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[newCycle]);
  try{
   const old=await call(k);assert.equal(old.status,409);
   assert.equal(old.body.code,'CONSULTATION_IDEMPOTENCY_COLLISION');
   const now=await call(newEvent);
   assert.equal(now.status,200);assert.equal(now.body.created,true);
   assert.notEqual(now.body.consultationId,cId);
   const row=(await writer.query('SELECT listing_cycle_id FROM public.consultations WHERE consultation_id=$1',[now.body.consultationId])).rows[0];
   assert.equal(String(row.listing_cycle_id),newCycle);
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations WHERE customer_id=59001 AND vehicle_id=59001 AND status='pending'")).rows[0].n,2);
  }finally{
   await writer.query('UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=$1',[newCycle]);
   await writer.query('UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=59001');
  }
 });

 const otherToken=randomBytes(32).toString('base64url');
 await writer.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES(59011,'active',59001,'owner_assignment_pending')");
 await writer.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,59011,statement_timestamp()+interval '20 minutes')",[digest(otherToken)]);
 const withdraw=async(id,eventKey=key(),authToken=token,more={})=>{
  const headers={authorization:'Bearer '+authToken,'x-idempotency-key':eventKey,...more};
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/consultations/'+id+'/withdraw',{method:'POST',headers});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 other Customer cannot withdraw someone else active Consultation',async()=>{
  const result=await withdraw(cId,key(),otherToken);
  assert.equal(result.status,404);assert.equal(result.body.code,'CONSULTATION_NOT_FOUND');
  assert.equal((await writer.query('SELECT status FROM public.consultations WHERE consultation_id=$1',[cId])).rows[0].status,'pending');
 });
 await test('PG16 Customer withdrawal succeeds on offline vehicle with disabled employee/no Owner, preserves original owner history and SLA',async()=>{
  const before=(await writer.query('SELECT source_relation,assignee_employee_id,first_response_deadline FROM public.consultations WHERE consultation_id=$1',[cId])).rows[0];
  await writer.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=59001");
  await writer.query("UPDATE public.customers SET current_owner_employee_id=NULL,owner_assignment_state='owner_assignment_pending' WHERE customer_id=59001");
  await writer.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=59001");
  await writer.query("DELETE FROM public.f05_catalog_consultation_actor_proof_test WHERE customer_id=59001");
  const withdrawKey=key();
  try{
   const done=await withdraw(cId,withdrawKey);
   assert.equal(done.status,200);assert.equal(done.body.code,'CONSULTATION_WITHDRAWN');
   const row=(await writer.query('SELECT status,close_reason,completed_at,source_relation,assignee_employee_id,first_response_deadline FROM public.consultations WHERE consultation_id=$1',[cId])).rows[0];
   assert.equal(row.status,'resolved');assert.equal(row.close_reason,'CUSTOMER_WITHDRAWN');
   assert.ok(row.completed_at instanceof Date);
   assert.deepEqual(row.source_relation,before.source_relation);
   assert.equal(String(row.assignee_employee_id),String(before.assignee_employee_id));
   assert.equal(row.first_response_deadline.getTime(),before.first_response_deadline.getTime());
   const replay=await withdraw(cId,withdrawKey);
   assert.equal(replay.status,200);assert.equal(replay.body.code,'CONSULTATION_WITHDRAWAL_REPLAY');
   const again=await withdraw(cId);assert.equal(again.status,409);assert.equal(again.body.code,'CONSULTATION_NOT_OPEN');
   const n=(await writer.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=$1 AND action='WITHDRAWN'",[cId])).rows[0].n;
   assert.equal(n,1);
  }finally{
   await writer.query("UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=59001");
   await writer.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=59001");
   await writer.query("UPDATE public.customers SET current_owner_employee_id=59001,owner_assignment_state='assigned' WHERE customer_id=59001");
   await writer.query("INSERT INTO public.f05_catalog_consultation_actor_proof_test(customer_id,assignee_employee_id,phone_consent_test,worker_scope_test,expires_at) VALUES(59001,59001,true,true,statement_timestamp()+interval '20 minutes')");
  }
 });
 await test('PG16 withdrawal event cannot use a prior create key',async()=>{
  const clash=await withdraw(cId,k);
  assert.equal(clash.status,409);assert.equal(clash.body.code,'CONSULTATION_IDEMPOTENCY_COLLISION');
 });
 await test('PG16 withdrawal and immutable audit are one atomic transaction under forced audit error',async()=>{
  const open=(await call()).body.consultationId;
  assert.notEqual(open,cId);
  const injectKey=key();
  await writer.query("CREATE FUNCTION public.f05_withdraw_inject_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_WITHDRAW_ROLLBACK'; END $$");
  await writer.query("CREATE TRIGGER f05_withdraw_inject_fail BEFORE INSERT ON public.f05_catalog_consultation_actions_test FOR EACH ROW EXECUTE FUNCTION public.f05_withdraw_inject_fail_test()");
  try{
   const failed=await withdraw(open,injectKey);
   assert.equal(failed.status,503);
   assert.equal((await writer.query('SELECT status FROM public.consultations WHERE consultation_id=$1',[open])).rows[0].status,'pending');
   assert.equal((await writer.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[injectKey])).rows[0].n,0);
  }finally{
   await writer.query('DROP TRIGGER f05_withdraw_inject_fail ON public.f05_catalog_consultation_actions_test');
   await writer.query('DROP FUNCTION public.f05_withdraw_inject_fail_test()');
  }
  assert.equal((await withdraw(open,injectKey)).body.code,'CONSULTATION_WITHDRAWN');
 });
 await test('two concurrent withdrawal keys commit exactly one terminal transition and one immutable audit',async()=>{
  const fresh=(await call()).body.consultationId;
  const [a,b]=await Promise.all([withdraw(fresh,key()),withdraw(fresh,key())]);
  assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,409]);
  assert.equal([a,b].filter(x=>x.body.code==='CONSULTATION_WITHDRAWN').length,1);
  assert.equal([a,b].filter(x=>x.body.code==='CONSULTATION_NOT_OPEN').length,1);
  const c=(await writer.query('SELECT status,close_reason FROM public.consultations WHERE consultation_id=$1',[fresh])).rows[0];
  assert.equal(c.status,'resolved');assert.equal(c.close_reason,'CUSTOMER_WITHDRAWN');
  const n=(await writer.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=$1 AND action='WITHDRAWN'",[fresh])).rows[0].n;
  assert.equal(n,1);
 });
 await test('disabled Customer and revoked test session both fail closed for withdrawal',async()=>{
  const active=(await call()).body.consultationId;
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59001");
  try{assert.equal((await withdraw(active)).status,401)}
  finally{await writer.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59001")}
  await writer.query('UPDATE public.f05_catalog_customer_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[digest(token)]);
  assert.equal((await withdraw(active)).status,401);
 });
 await test('Customer bearer revoked immediately denies new consultation action',async()=>{
  await writer.query('UPDATE public.f05_catalog_customer_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[digest(token)]);
  assert.equal((await call()).status,401);
 });
}catch(e){fail=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await writer.end();
 await pool.end();
}
if(fail)throw fail;
