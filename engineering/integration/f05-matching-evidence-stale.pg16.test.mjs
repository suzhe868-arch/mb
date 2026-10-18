// PDM12: proof that source price / Vehicle evidence / salesperson description
// edits mark precisely the affected frozen Match Result 'stale', never auto-recommend.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingHandler} from '../src/f05-matching-http.mjs';
const cfg=validateCatalogEnv(),pool=new pg.Pool({connectionString:cfg.connectionString,max:5,connectionTimeoutMillis:1600});
const db=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1600});
const random=()=>randomBytes(32).toString('base64url'),hash=s=>createHash('sha256').update(s).digest('hex');
const tokenA=random(),tokenB=random();
const description='brandId=59001;maxMileageKm=50000;budgetCents=12000000';
let srv,connected=false,failed;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES"+
   "(59900,'f05_stale_level_a'),(59902,'f05_stale_level_b')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
   "(59900,59001,'active','receiving'),(59902,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES"+
   "(59900,'active',59900,59900,'assigned'),(59902,'active',59902,59902,'assigned')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES"+
   "(59900,59900,59900,'active','{}'::jsonb),"+
   "(59902,59902,59902,'active','{}'::jsonb)");
  for(const [t,e] of [[tokenA,'59900'],[tokenB,'59902']])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) "+
    "VALUES($1,$2,statement_timestamp()+interval '30 minutes')",[hash(t),e]);
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES"+
   "(59900,true,statement_timestamp()+interval '30 minutes'),"+
   "(59902,true,statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES"+
   "(59900,59900,true,statement_timestamp()+interval '30 minutes'),"+
   "(59902,59902,true,statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES"+
   "(59900,59900,$1,statement_timestamp()+interval '30 minutes'),"+
   "(59902,59902,$1,statement_timestamp()+interval '30 minutes')",[description]);
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES"+
   "(59910,'wholesale','active','visible',59001,statement_timestamp()),"+
   "(59911,'wholesale','active','visible',59001,statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES"+
   "(59910,59910,statement_timestamp()),(59911,59911,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES"+
   "(59910,59910,'wholesale',true,statement_timestamp()+interval '30 minutes'),"+
   "(59911,59911,'wholesale',true,statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) VALUES"+
   "(59910,59910,59001,2026,12000,'black',statement_timestamp()+interval '30 minutes'),"+
   "(59911,59911,59001,2026,18000,'black',statement_timestamp()+interval '30 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES"+
   "(59910,59910,'wholesale',11000000,statement_timestamp()+interval '30 minutes'),"+
   "(59911,59911,'wholesale',11000000,statement_timestamp()+interval '30 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 srv=createServer(createFoundationHandler({matchingHandler:createIsolatedMatchingHandler(createIsolatedMatchingService({pool,env:process.env}),process.env)}));
 await new Promise((ok,bad)=>{srv.once('error',bad);srv.listen(0,'127.0.0.1',ok)});
 const run=async(d='59900',v='59910',tok=tokenA)=>{
  const r=await fetch('http://127.0.0.1:'+srv.address().port+'/api/v1/catalog/demands/'+d+'/vehicles/'+v+'/recompute-match',{
    method:'POST',headers:{authorization:'Bearer '+tok,'x-idempotency-key':random()}});
  return {status:r.status,body:await r.json()};
 };
 const latest=async(d='59900',v='59910')=>(await db.query(
  "SELECT result_id,current_state,match_tier,invalidated_at FROM public.demand_match_results "+
  "WHERE demand_id=$1 AND vehicle_id=$2 ORDER BY result_id DESC",[d,v])).rows[0];
 const event=async(resultId)=>(await db.query("SELECT trigger_kind,before_json,after_json "+
  "FROM public.matching_change_events WHERE result_id=$1",[String(resultId)])).rows;
 const reseed=async(d='59900',v='59910',tok=tokenA)=>{
  const r=await run(d,v,tok);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.matchingReady,true);
  return latest(d,v);
 };
 await test('PG16 test-only source facts generate three independent physical current Results',async()=>{
  for(const [d,v,t] of [['59900','59910',tokenA],['59900','59911',tokenA],['59902','59910',tokenB]]){
   const r=await reseed(d,v,t);assert.equal(r.current_state,'current');assert.equal(r.match_tier,'high');
  }
  assert.equal((await db.query("SELECT count(*)::int n FROM public.matching_change_events WHERE result_id IN "+
   "(SELECT result_id FROM public.demand_match_results WHERE demand_id IN (59900,59902))")).rows[0].n,0);
 });
 await test('PG16 same numeric customer display price is not a change and does not invalidate Match',async()=>{
  const was=await latest();
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=11000000 WHERE vehicle_id=59910");
  assert.deepEqual(await latest(),was);assert.equal((await event(was.result_id)).length,0);
 });
 await test('PG16 price change invalidates to STALE every Demand matched to exact Vehicle-cycle, not another Vehicle',async()=>{
  const a=await latest(),b=await latest('59902','59910'),other=await latest('59900','59911');
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=12600001 WHERE vehicle_id=59910");
  for(const [id,d] of [[a.result_id,'59900'],[b.result_id,'59902']]){
   const changed=await latest(d,'59910');assert.equal(changed.current_state,'stale');assert.ok(changed.invalidated_at instanceof Date);
   const events=await event(id);assert.equal(events.length,1);assert.equal(events[0].trigger_kind,'CUSTOMER_DISPLAY_PRICE');
   assert.equal(events[0].before_json.state,'current');assert.equal(events[0].after_json.state,'stale');
   assert.equal(events[0].after_json.noPriority,true);assert.equal(events[0].after_json.noVisibilityGrant,true);
  }
  assert.deepEqual(await latest('59900','59911'),other);
  const v=await reseed();assert.equal(v.match_tier,'no_match');
  assert.equal((await reseed('59902','59910',tokenB)).match_tier,'no_match');
  // Restore truthful display price; now-new current results must also be stale.
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=11000000 WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
  await reseed();await reseed('59902','59910',tokenB);
 });
 await test('PG16 source vehicle mileage change stales only that Vehicle, then computes explicit no_match',async()=>{
  const old=await latest();
  await db.query("UPDATE public.f05_matching_vehicle_facts_test SET mileage_km=90000 WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
  assert.equal((await event(old.result_id))[0].trigger_kind,'VEHICLE_SOURCE_FACT');
  assert.equal((await latest('59900','59911')).current_state,'current');
  assert.equal((await reseed()).match_tier,'no_match');
  await db.query("UPDATE public.f05_matching_vehicle_facts_test SET mileage_km=12000 WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
  assert.equal((await reseed()).match_tier,'high');
 });
 await test('PG16 source fact DELETE stales only current cycle, missing hard mileage becomes confirmation_needed',async()=>{
  const before=await latest();
  await db.query("DELETE FROM public.f05_matching_vehicle_facts_test WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
  assert.equal((await event(before.result_id))[0].trigger_kind,'VEHICLE_SOURCE_FACT');
  assert.equal((await reseed()).match_tier,'confirmation_needed');
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test "+
   "(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) "+
   "VALUES(59910,59910,59001,2026,12000,'black',statement_timestamp()+interval '30 minutes')");
  assert.equal((await latest()).current_state,'stale');
  await reseed();
 });
 await test('PG16 sales description change affects its Demand across vehicles, not other Customer Demand',async()=>{
  // Previous Vehicle fact changes legitimately staled both Customers sharing the Vehicle.
  // Give the independent Demand a new verified current result for exact scope comparison.
  await reseed('59902','59910',tokenB);
  const prev=await latest(),other=await latest('59902','59910'),v2=await latest('59900','59911');
  await db.query("UPDATE public.f05_matching_sales_description_test SET sales_description='brandId=59001;budgetCents=10000000' WHERE demand_id=59900");
  assert.equal((await latest()).current_state,'stale');
  assert.equal((await latest('59900','59911')).current_state,'stale');
  assert.equal((await latest('59902','59910')).current_state,'current');
  assert.equal((await event(prev.result_id))[0].trigger_kind,'SALES_MATCH_DESCRIPTION');
  assert.equal((await event(v2.result_id))[0].trigger_kind,'SALES_MATCH_DESCRIPTION');
  assert.equal((await event(other.result_id)).length,0);
  assert.equal((await reseed()).match_tier,'no_match');
  await db.query("UPDATE public.f05_matching_sales_description_test SET sales_description=$1 WHERE demand_id=59900",[description]);
  assert.equal((await latest()).current_state,'stale');
  await reseed();await reseed('59900','59911');
 });
 await test('PG16 assigning different mapped model stales Vehicle pairs, current source facts may still match',async()=>{
  const before=await latest();
  await db.query("UPDATE public.vehicles SET model_id=NULL WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
  assert.equal((await event(before.result_id))[0].trigger_kind,'VEHICLE_MODEL_ASSIGNMENT');
  assert.equal((await latest('59900','59911')).current_state,'current');
  assert.equal((await reseed()).match_tier,'high');
  await db.query("UPDATE public.vehicles SET model_id=59001 WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
  await reseed();
 });
 await test('PG16 model master fact change stales all associated current Vehicle pairs and preserves history',async()=>{
  const before=await latest(),was=(await db.query("SELECT model_year FROM public.vehicle_models WHERE model_id=59001")).rows[0].model_year;
  const change=was===2023?2025:2023;
  await db.query("UPDATE public.vehicle_models SET model_year=$1 WHERE model_id=59001",[change]);
  assert.equal((await latest()).current_state,'stale');
  assert.equal((await event(before.result_id))[0].trigger_kind,'MASTER_MODEL_FACT');
  assert.equal((await latest('59900','59911')).current_state,'stale');
  const recomputed=await reseed();assert.equal(recomputed.match_tier,'high','year is not a requested hard criterion');
  await db.query("UPDATE public.vehicle_models SET model_year=$1 WHERE model_id=59001",[was]);
  assert.equal((await latest()).current_state,'stale');
  await reseed();await reseed('59900','59911');await reseed('59902','59910',tokenB);
 });
 await test('PG16 forced matching change audit failure rolls back source price and Match stale transaction together',async()=>{
  // Every producer mutation before this test may have correctly staled old current rows.
  // Establish a fresh current result so the injected append-only audit fault must fire.
  await reseed();
  const before=await latest(),price=(await db.query("SELECT customer_display_cents FROM public.f05_catalog_price_display_proof_test WHERE vehicle_id=59910")).rows[0].customer_display_cents;
  await db.query("CREATE FUNCTION public.f05_stale_injected_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_STALE_AUDIT_FAILURE'; END $$");
  await db.query("CREATE TRIGGER f05_stale_injected_failure_trg BEFORE INSERT ON public.matching_change_events "+
   "FOR EACH ROW EXECUTE FUNCTION public.f05_stale_injected_failure()");
  try{
   await assert.rejects(db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=12500000 WHERE vehicle_id=59910"),
    /INJECTED_STALE_AUDIT_FAILURE/);
   assert.equal((await db.query("SELECT customer_display_cents FROM public.f05_catalog_price_display_proof_test WHERE vehicle_id=59910")).rows[0].customer_display_cents,price);
   assert.deepEqual(await latest(),before);
   assert.equal((await event(before.result_id)).length,0);
  }finally{
   await db.query("DROP TRIGGER f05_stale_injected_failure_trg ON public.matching_change_events");
   await db.query("DROP FUNCTION public.f05_stale_injected_failure()");
  }
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=12500000 WHERE vehicle_id=59910");
  assert.equal((await latest()).current_state,'stale');
 });
 await test('PG16 same Match Result cannot emit a second stale event; no Recommendation/Priority/visibility grants',async()=>{
  const result=await latest(),auditCount=(await db.query(
   "SELECT count(*)::int n FROM public.matching_change_events WHERE result_id IN "+
   "(SELECT result_id FROM public.demand_match_results WHERE demand_id IN (59900,59902))")).rows[0].n;
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=12400000 WHERE vehicle_id=59910");
  assert.equal((await db.query("SELECT count(*)::int n FROM public.matching_change_events WHERE result_id IN "+
   "(SELECT result_id FROM public.demand_match_results WHERE demand_id IN (59900,59902))")).rows[0].n,auditCount);
  assert.equal((await latest()).current_state,'stale');
  await assert.rejects(db.query("DELETE FROM public.matching_change_events WHERE result_id=$1",[result.result_id]),e=>e.code==='23514');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.recommendations WHERE customer_id IN (59900,59902)')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.priority_leases WHERE customer_id IN (59900,59902)')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE customer_id IN (59900,59902)')).rows[0].n,0);
 });
}catch(e){failed=e}finally{
 if(srv)await new Promise((ok,bad)=>srv.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(failed)throw failed;
