// PDM12: true PG16 affected-scope current invalidation and append-only matching_change_events.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingHandler} from '../src/f05-matching-http.mjs';
const cfg=validateCatalogEnv(),pool=new pg.Pool({connectionString:cfg.connectionString,max:4,connectionTimeoutMillis:1400});
const db=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1400});
const token=()=>randomBytes(32).toString('base64url'),key=()=>randomBytes(32).toString('base64url');
const digest=s=>createHash('sha256').update(s).digest('hex');
const staffA=token(),staffB=token(),text='brandId=59001;minModelYear=2024;maxMileageKm=50000;budgetCents=12000000';
let server,connected=false,err;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES (59800,'f05_invalidation_level_a'),(59802,'f05_invalidation_level_b')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES "+
   "(59800,59001,'active','receiving'),(59802,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES "+
   "(59800,'active',59800,59800,'assigned'),(59802,'active',59802,59802,'assigned')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES "+
   "(59800,59800,59800,'active','{}'::jsonb),"+
   "(59801,59800,59800,'active','{}'::jsonb),"+
   "(59802,59802,59802,'active','{}'::jsonb)");
  for(const [cred,employeeId] of [[staffA,'59800'],[staffB,'59802']])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[digest(cred),employeeId]);
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES "+
   "(59800,true,statement_timestamp()+interval '20 minutes'),(59802,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES "+
   "(59800,59800,true,statement_timestamp()+interval '20 minutes'),(59802,59802,true,statement_timestamp()+interval '20 minutes')");
  for(const [demand,actor] of [['59800','59800'],['59801','59800'],['59802','59802']])
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) "+
   "VALUES($1,$2,$3,statement_timestamp()+interval '20 minutes')",[demand,actor,text]);
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES "+
   "(59810,'wholesale','active','visible',59001,statement_timestamp()),"+
   "(59811,'wholesale','active','visible',59001,statement_timestamp()),"+
   "(59812,'wholesale','active','visible',59001,statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES "+
   "(59810,59810,statement_timestamp()),(59811,59811,statement_timestamp()),(59812,59812,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES "+
   "(59810,59810,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59811,59811,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59812,59812,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES "+
   "(59810,59810,59001,2026,12000,statement_timestamp()+interval '20 minutes'),"+
   "(59811,59811,59001,2025,22000,statement_timestamp()+interval '20 minutes'),"+
   "(59812,59812,59001,2027,9000,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES "+
   "(59810,59810,'wholesale',11000000,statement_timestamp()+interval '20 minutes'),"+
   "(59811,59811,'wholesale',11500000,statement_timestamp()+interval '20 minutes'),"+
   "(59812,59812,'wholesale',11200000,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({matchingHandler:createIsolatedMatchingHandler(createIsolatedMatchingService({pool,env:process.env}),process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const doMatch=async(demand='59800',vehicle='59810',cred=staffA)=>{
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/demands/'+demand+'/vehicles/'+vehicle+'/recompute-match',
   {method:'POST',headers:{authorization:'Bearer '+cred,'x-idempotency-key':key()}});
  return {status:r.status,body:await r.json()};
 };
 const current=async(demand,vehicle)=>(await db.query(
  "SELECT result_id,match_tier,current_state,invalidated_at FROM public.demand_match_results "+
  "WHERE demand_id=$1 AND vehicle_id=$2 ORDER BY result_id DESC",[demand,vehicle])).rows;
 const countEvents=async()=>(await db.query(
  "SELECT count(*)::integer n FROM public.matching_change_events "+
  "WHERE result_id IN (SELECT result_id FROM public.demand_match_results WHERE demand_id BETWEEN 59800 AND 59802)")).rows[0].n;
 await test('PG16 independent Customer and Demand fixtures produce physically current Matches with zero change events',async()=>{
  for(const [d,v,c] of [['59800','59810',staffA],['59800','59811',staffA],['59801','59810',staffA],['59802','59812',staffB]]){
   const r=await doMatch(d,v,c);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.matchTier,'high');
  }
  assert.equal((await current('59800','59810'))[0].current_state,'current');
  assert.equal(await countEvents(),0);
 });
 await test('PG16 platform_visibility hidden alone must never erase valid internal Match Result',async()=>{
  await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=59810");
  assert.equal((await current('59800','59810'))[0].current_state,'current');
  assert.equal((await current('59801','59810'))[0].current_state,'current');
  assert.equal(await countEvents(),0);
 });
 await test('PG16 wholesale offline invalidates only affected Vehicle pair; immutable frozen matching_change_events store snapshots',async()=>{
  await db.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=59811");
  const r=(await current('59800','59811'))[0];
  assert.equal(r.current_state,'invalidated');assert.ok(r.invalidated_at instanceof Date);
  assert.equal((await current('59800','59810'))[0].current_state,'current');
  assert.equal((await current('59802','59812'))[0].current_state,'current');
  const event=(await db.query("SELECT trigger_kind,before_json,after_json,idempotency_key "+
   "FROM public.matching_change_events WHERE result_id=$1",[String(r.result_id)])).rows[0];
  assert.equal(event.trigger_kind,'VEHICLE_SALEABILITY');
  assert.equal(event.before_json.tier,'high');
  assert.equal(event.before_json.state,'current');
  assert.equal(event.after_json.state,'invalidated');
  assert.equal(event.after_json.noPriority,true);assert.equal(event.after_json.noVisibilityGrant,true);
  assert.match(event.idempotency_key,/^F05_DISPOSABLE_MATCH_INVALIDATED_/);
 });
 await test('PG16 Customer disable invalidates all Customer Demand current matches, never other Customer',async()=>{
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await current('59801','59810'))[0].current_state,'invalidated');
  assert.equal((await current('59802','59812'))[0].current_state,'current');
  const denied=await doMatch();assert.equal(denied.status,409);
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated','restored Customer must not revive old match');
  assert.equal((await doMatch()).status,200);
 });
 await test('PG16 Demand pause invalidates only its own Match Result; resume cannot revive old rows',async()=>{
  await db.query("UPDATE public.demands SET demand_state='paused' WHERE demand_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await current('59801','59810'))[0].current_state,'invalidated');
  assert.equal((await current('59802','59812'))[0].current_state,'current');
  assert.equal((await doMatch()).status,409);
  await db.query("UPDATE public.demands SET demand_state='active' WHERE demand_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await doMatch()).status,200);
 });
 await test('PG16 Customer downgrade invalidates existing Match, return to entitled level does not auto-reissue',async()=>{
  await db.query("UPDATE public.customers SET customer_level_id=59001 WHERE customer_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await doMatch()).status,409);
  await db.query("UPDATE public.customers SET customer_level_id=59800 WHERE customer_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await doMatch()).status,200);
 });
 await test('PG16 active Level entitlement revocation invalidates affected Customer matches; other Level untouched',async()=>{
  await db.query("UPDATE public.f05_find_car_level_entitlement_test SET can_activate_demand=false WHERE level_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await current('59802','59812'))[0].current_state,'current');
  assert.equal((await doMatch()).status,409);
  await db.query("UPDATE public.f05_find_car_level_entitlement_test SET can_activate_demand=true WHERE level_id=59800");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await doMatch()).status,200);
 });
 await test('PG16 ending listing cycle invalidates matching pair, reopening does not revive stale result',async()=>{
  await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=59810");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await doMatch()).status,404);
  await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=59810");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
  assert.equal((await doMatch()).status,200);
 });
 await test('PG16 audit insertion failure rolls back source vehicle offline and Match invalidation together',async()=>{
  const before=await current('59800','59810'),eventCount=await countEvents();
  await db.query("CREATE FUNCTION public.f05_match_invalidation_injected_fail() RETURNS trigger LANGUAGE plpgsql AS $$ "+
   "BEGIN RAISE EXCEPTION 'INJECTED_PDM12_CHANGE_AUDIT_FAILURE'; END $$");
  await db.query("CREATE TRIGGER f05_match_invalidation_injected_fault BEFORE INSERT ON public.matching_change_events "+
   "FOR EACH ROW EXECUTE FUNCTION public.f05_match_invalidation_injected_fail()");
  try{
   await assert.rejects(db.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=59810"),/INJECTED_PDM12_CHANGE_AUDIT_FAILURE/);
   assert.equal((await db.query("SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=59810")).rows[0].source_sale_status,'active');
   assert.deepEqual(await current('59800','59810'),before);
   assert.equal(await countEvents(),eventCount);
  }finally{
   await db.query('DROP TRIGGER f05_match_invalidation_injected_fault ON public.matching_change_events');
   await db.query('DROP FUNCTION public.f05_match_invalidation_injected_fail()');
  }
  await db.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=59810");
  assert.equal((await current('59800','59810'))[0].current_state,'invalidated');
 });
 await test('PG16 after invalidation new event cannot double-write same Match; stale event snapshots are append-only',async()=>{
  const count=await countEvents();
  await db.query("UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=59810");
  assert.equal(await countEvents(),count,'old result invalidated once only, no synthetic extra event');
  await assert.rejects(db.query("UPDATE public.matching_change_events SET trigger_kind='FORGED' WHERE result_id IN "+
   "(SELECT result_id FROM public.demand_match_results WHERE demand_id=59800)"),e=>e.code==='23514');
  await assert.rejects(db.query("DELETE FROM public.matching_change_events WHERE result_id IN "+
   "(SELECT result_id FROM public.demand_match_results WHERE demand_id=59800)"),e=>e.code==='23514');
  assert.equal((await db.query('SELECT count(*)::integer n FROM public.recommendations WHERE customer_id=59800')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::integer n FROM public.priority_leases WHERE customer_id=59800')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::integer n FROM public.vehicle_visibility_grants WHERE customer_id=59800')).rows[0].n,0);
 });
}catch(e){err=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(err)throw err;
