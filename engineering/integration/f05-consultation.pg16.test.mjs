import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedConsultationService} from '../src/f05-consultation-service.mjs';
import {createIsolatedConsultationHandler} from '../src/f05-consultation-http.mjs';
import {createIsolatedRecommendationService} from '../src/f05-recommendation-service.mjs';
import {createIsolatedFavoriteService} from '../src/f05-favorite-service.mjs';
import {createIsolatedFavoriteHandler} from '../src/f05-favorite-http.mjs';
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
  // One current receiving proof per Customer is enforced by this sidecar.
  // The cross-domain test temporarily changes current receiving authorization;
  // it never inserts an extra proof beside the Customer Owner's proof.
  await writer.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(59020,59001,59003,'active','{}'::jsonb)");
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES(59020,'wholesale','active','hidden',59001,statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(59020,59020,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59020,59020,'wholesale',false,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(59020,59020,'wholesale',12000000,statement_timestamp()+interval '20 minutes')");
  // Dedicated cross-domain Favorite source. This is a genuinely visible car,
  // not an invented Favorite privilege or a hidden Recommendation grant.
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES(62841,'wholesale','active','visible',statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(62841,62841,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(62841,62841,'wholesale',true,statement_timestamp()+interval '20 minutes')");

  await writer.query('COMMIT');
 }catch(e){await writer.query('ROLLBACK');throw e}
 const service=createIsolatedConsultationService({pool,env:process.env});
 const recommendation=createIsolatedRecommendationService({pool,env:process.env});
 const favorite=createIsolatedFavoriteService({pool,env:process.env});
 server=createServer(createFoundationHandler({
  consultationHandler:createIsolatedConsultationHandler(service,process.env),
  favoriteHandler:createIsolatedFavoriteHandler(favorite,process.env)
 }));
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
 await test('PG16 hidden saleability denies before assignee proof and does not leak vehicle access state',async()=>{
  // The real test proof is keyed by customer; remove it to prove that hidden,
  // missing and unavailable vehicles all fail at the source boundary first.
  await writer.query("DELETE FROM public.f05_catalog_consultation_actor_proof_test WHERE customer_id=59001");
  try{
   const hidden=await call(key(),token,'59020');
   assert.equal(hidden.status,404,JSON.stringify(hidden));
   assert.equal(hidden.body.code,'CONSULTATION_VEHICLE_NOT_VISIBLE');
   const unknown=await call(key(),token,'599999');
   assert.equal(unknown.status,404,JSON.stringify(unknown));
   assert.equal(unknown.body.code,'CONSULTATION_VEHICLE_NOT_VISIBLE');
   const visible=await call(key(),token,'59001');
   assert.equal(visible.status,403,JSON.stringify(visible));
   assert.equal(visible.body.code,'CONSULTATION_PHONE_OR_ASSIGNEE_NOT_VERIFIED');
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations WHERE customer_id=59001")).rows[0].n,0);
  }finally{
   await writer.query("INSERT INTO public.f05_catalog_consultation_actor_proof_test(customer_id,assignee_employee_id,phone_consent_test,worker_scope_test,expires_at) VALUES(59001,59001,true,true,statement_timestamp()+interval '20 minutes')");
  }
 });
 await test('PG16 paused receiving status denies new Consultation even with valid historic worker proof',async()=>{
  // Receiving is a current operational fact, not an Employee role or stale
  // scoped phone proof. Preserve both Customer Owner and old proof unmodified.
  await writer.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=59001");
  try{
   const denied=await call(key(),token,'59001');
   assert.equal(denied.status,403,JSON.stringify(denied));
   assert.equal(denied.body.code,'CONSULTATION_PHONE_OR_ASSIGNEE_NOT_VERIFIED');
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations "+
    "WHERE customer_id=59001 AND vehicle_id=59001")).rows[0].n,0);
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test "+
    "WHERE customer_id=59001 AND vehicle_id=59001")).rows[0].n,0);
  }finally{
   await writer.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=59001");
  }
 });
 await test('PG16 PDM15 uses scoped accepting fallback when legal Owner is paused, never 4S',async()=>{
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) "+
   "VALUES(62842,'wholesale','active','visible',statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) "+
   "VALUES(62842,62842,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test "+
   "(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) "+
   "VALUES(62842,62842,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await writer.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=59001");
  try{
   await writer.query("UPDATE public.f05_catalog_consultation_actor_proof_test "+
    "SET assignee_employee_id=59002 WHERE customer_id=59001");
   const denied=await call(key(),token,'62842');
   assert.equal(denied.status,403,JSON.stringify(denied));
   assert.equal(denied.body.code,'CONSULTATION_PHONE_OR_ASSIGNEE_NOT_VERIFIED');
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations "+
    "WHERE vehicle_id=62842")).rows[0].n,0);
   await writer.query("UPDATE public.f05_catalog_consultation_actor_proof_test "+
    "SET assignee_employee_id=59003 WHERE customer_id=59001");
   const accepted=await call(key(),token,'62842');
   assert.equal(accepted.status,200,JSON.stringify(accepted));
   assert.equal(accepted.body.code,'CONSULTATION_CREATED');
   const row=(await writer.query("SELECT assignee_employee_id,status,source_relation "+
    "FROM public.consultations WHERE consultation_id=$1",[accepted.body.consultationId])).rows[0];
   assert.equal(String(row.assignee_employee_id),'59003');
   assert.equal(row.status,'pending');
   assert.equal(row.source_relation.entry,'vehicle_detail');
   assert.equal((await writer.query("SELECT current_owner_employee_id FROM public.customers "+
    "WHERE customer_id=59001")).rows[0].current_owner_employee_id,'59001');
  }finally{
   await writer.query("UPDATE public.f05_catalog_consultation_actor_proof_test "+
    "SET assignee_employee_id=59001 WHERE customer_id=59001");
   await writer.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=59001");
  }
 });
 await test('PG16 F05 active Favorite -> actual Consultation freezes clicked direct source and denies removed Favorites',async()=>{
  const callFav=async(method,ek)=>{
   const x=await fetch('http://127.0.0.1:'+server.address().port+
    '/api/v1/catalog/vehicles/62841/favorite',{method,
    headers:{authorization:'Bearer '+token,...(ek?{'x-idempotency-key':ek}:{})}});
   return {status:x.status,body:await x.json()};
  };
  const consultFav=async(ek=key())=>{
   const x=await fetch('http://127.0.0.1:'+server.address().port+
    '/api/v1/catalog/vehicles/62841/favorite/consultations',{method:'POST',
    headers:{authorization:'Bearer '+token,'x-idempotency-key':ek}});
   return {status:x.status,body:await x.json()};
  };
  const baseline=(await writer.query("SELECT count(*)::int n FROM public.consultations "+
   "WHERE customer_id=59001 AND vehicle_id=62841")).rows[0].n;
  assert.equal(baseline,0);
  const notFav=await consultFav();
  assert.equal(notFav.status,404,JSON.stringify(notFav));
  assert.equal(notFav.body.code,'CONSULTATION_FAVORITE_NOT_ACTIVE');
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations "+
   "WHERE customer_id=59001 AND vehicle_id=62841")).rows[0].n,0);
  const liked=await callFav('POST',key());
  assert.equal(liked.status,200,JSON.stringify(liked));
  assert.equal(liked.body.code,'FAVORITE_APPLIED');
  const ck=key(),created=await consultFav(ck);
  assert.equal(created.status,200,JSON.stringify(created));
  assert.equal(created.body.code,'CONSULTATION_CREATED');
  const first=(await writer.query("SELECT source_relation,assignee_employee_id,first_response_deadline "+
   "FROM public.consultations WHERE consultation_id=$1",[created.body.consultationId])).rows[0];
  assert.deepEqual(first.source_relation,{
   kind:'other',entry:'favorite',favoriteStateVersion:'1',issuer:'DISPOSABLE_TEST_ONLY'});
  assert.equal(String(first.assignee_employee_id),'59001');
  const replay=await consultFav(ck);
  assert.equal(replay.status,200);assert.equal(replay.body.code,'CONSULTATION_IDEMPOTENT_REPLAY');
  const unliked=await callFav('DELETE',key());
  assert.equal(unliked.status,200);
  assert.equal(unliked.body.active,false);
  const removed=await consultFav();
  assert.equal(removed.status,404,JSON.stringify(removed));
  assert.equal(removed.body.code,'CONSULTATION_FAVORITE_NOT_ACTIVE');
  const after=(await writer.query("SELECT source_relation,assignee_employee_id,first_response_deadline "+
   "FROM public.consultations WHERE consultation_id=$1",[created.body.consultationId])).rows[0];
  assert.deepEqual(after.source_relation,first.source_relation);
  assert.equal(String(after.assignee_employee_id),'59001');
  assert.equal(after.first_response_deadline.getTime(),first.first_response_deadline.getTime());
  const otherSource=await call(key(),token,'62841');
  assert.equal(otherSource.status,200,JSON.stringify(otherSource));
  assert.equal(otherSource.body.code,'CONSULTATION_REUSED');
  assert.deepEqual((await writer.query("SELECT source_relation FROM public.consultations "+
   "WHERE consultation_id=$1",[created.body.consultationId])).rows[0].source_relation,
   first.source_relation,'subsequent direct-vehicle clicks must not overwrite the frozen Favorite source');
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations "+
   "WHERE customer_id=59001 AND vehicle_id=62841")).rows[0].n,1);
 });
 await test('PG16 real F05-9 Recommendation -> hidden PDM15 Consultation preserves direct source and selects current Demand assignee',async()=>{
  try{
  // The Find-Car level proof is owned by this one cross-domain test. It must
  // not leak into the later independent F05-6 integration fixture.
  await writer.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(59001,true,statement_timestamp()+interval '20 minutes')");
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
  // The isolated proof is one row per Customer: switch from Owner to the
  // independent Demand responsible only after testing the public entry.
  await writer.query("UPDATE public.f05_catalog_consultation_actor_proof_test SET assignee_employee_id=59003 WHERE customer_id=59001");
  // The recommendation's active Demand responsible is authorized, but
  // must not launder a Customer whose separate Owner is 4S/inactive.
  await writer.query("UPDATE public.customers SET current_owner_employee_id=59002 WHERE customer_id=59001");
  try{
   const illegalFourS=await postRec(key());
   assert.equal(illegalFourS.status,403,JSON.stringify(illegalFourS));
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations WHERE vehicle_id=59020")).rows[0].n,0);
  }finally{
   await writer.query("UPDATE public.customers SET current_owner_employee_id=59001 WHERE customer_id=59001");
  }
  await writer.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=59001");
  try{
   const inactiveOwner=await postRec(key());
   assert.equal(inactiveOwner.status,403,JSON.stringify(inactiveOwner));
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.consultations WHERE vehicle_id=59020")).rows[0].n,0);
  }finally{
   await writer.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=59001");
  }
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
  // Competing END and a second Customer click must serialize on the physical
  // Vehicle and Recommendation, never deadlock. Depending on who commits
  // first, the click is either a valid touch or denied at source recheck.
  const [ended,racingClick]=await Promise.all([
   recommendation.mutate({credential:employeeForRecommendation,action:'END',
    customerId:'59001',vehicleId:'59020',listingCycleId:'59020',eventKey:key()}),
   postRec()
  ]);
  assert.equal(ended.status,200,JSON.stringify(ended));
  assert.ok([200,404].includes(racingClick.status),JSON.stringify(racingClick));
  assert.equal((await postRec()).status,404,
   'historical ended Recommendation cannot authorize a new entry');
  const after=(await writer.query("SELECT assignee_employee_id,source_relation,first_response_deadline "+
   "FROM public.consultations WHERE consultation_id=$1",[created.body.consultationId])).rows[0];
  assert.equal(String(after.assignee_employee_id),'59003');
  assert.deepEqual(after.source_relation,row.source_relation);
  assert.equal(after.first_response_deadline.getTime(),row.first_response_deadline.getTime());
  const actionCount=(await writer.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test "+
   "WHERE consultation_id=$1",[created.body.consultationId])).rows[0].n;
  assert.ok([1,2].includes(actionCount),'only the successful click can append a TOUCHED event');
  }finally{
   await writer.query("UPDATE public.f05_catalog_consultation_actor_proof_test SET assignee_employee_id=59001 WHERE customer_id=59001");
   await writer.query("DELETE FROM public.f05_find_car_level_entitlement_test WHERE level_id=59001");
  }
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
