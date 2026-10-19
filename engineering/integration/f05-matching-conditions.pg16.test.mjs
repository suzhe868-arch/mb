// PDM12 additional supported hard fields: real disposable PostgreSQL16 state/invalidation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:4});
const db=new pg.Client({connectionString:env.connectionString});
const credential=randomBytes(32).toString('base64url');
const sha=x=>createHash('sha256').update(x).digest('hex');
const key=()=>randomBytes(24).toString('base64url');
const description='exteriorColor=red|blue;powerType=gasoline|hybrid;displacementMinCc=1400;displacementMaxCc=2500;excludeCondition=flood|major_accident;interiorColor=beige';
let connected=false,failure;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(60800,59001,'active','receiving')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,60800,statement_timestamp()+interval '20 minutes')",[sha(credential)]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(60800,'hard_condition_level')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES(60800,'active',60800,60800,'assigned')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(60800,60800,60800,'active','{}')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(60800,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(60800,60800,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES(60800,60800,$1,statement_timestamp()+interval '20 minutes')",[description]);
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES(60810,'wholesale','active','visible',59001,statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(60810,60810,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(60810,60810,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,exterior_color,power_type,displacement_cc,condition_flags,expires_at) VALUES(60810,60810,59001,2026,18000,'beige','red','gasoline',2000,ARRAY[]::text[],statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(60810,60810,'wholesale',10500000,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedMatchingService({pool,env:process.env});
 const calc=()=>service.recompute({credential,demandId:'60800',vehicleId:'60810',eventKey:key()});
 const change=async(sql)=>{
  await db.query(sql);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,0);
  assert.equal((await db.query("SELECT state FROM public.f05_matching_affected_queue_test WHERE demand_id=60800 AND vehicle_id=60810")).rows[0].state,'pending');
 };
 await test('PG16 hard multi-value OR and AND independent components, known exclusions empty yields high',async()=>{
  const r=await calc();assert.equal(r.status,200,JSON.stringify(r));
  assert.equal(r.body.matchTier,'high');
  assert.equal(r.body.explanation.components.filter(x=>x.category==='hard').length,5);
  assert.deepEqual(r.body.explanation.sourceFacts.conditionFlags,[]);
  assert.equal(r.body.explanation.sourceFacts.displacementCc,2000);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,1);
 });
 await test('PG16 soft interior mismatch only degrades high to acceptable with immutable stale audit',async()=>{
  await change("UPDATE public.f05_matching_vehicle_facts_test SET interior_color='black' WHERE vehicle_id=60810");
  const r=await calc();assert.equal(r.status,200);assert.equal(r.body.matchTier,'acceptable');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.matching_change_events WHERE trigger_kind='VEHICLE_SOURCE_FACT' AND result_id IN (SELECT result_id FROM public.demand_match_results WHERE demand_id=60800)")).rows[0].n,1);
 });
 await test('PG16 missing hard power or condition evidence cannot become high or acceptable',async()=>{
  await change("UPDATE public.f05_matching_vehicle_facts_test SET power_type=NULL WHERE vehicle_id=60810");
  assert.equal((await calc()).body.matchTier,'confirmation_needed');
  await change("UPDATE public.f05_matching_vehicle_facts_test SET power_type='hybrid',condition_flags=NULL WHERE vehicle_id=60810");
  assert.equal((await calc()).body.matchTier,'confirmation_needed');
 });
 await test('PG16 hard exclusion and exterior OR nonmembership yield no_match, no automatic grant',async()=>{
  await change("UPDATE public.f05_matching_vehicle_facts_test SET condition_flags=ARRAY['flood']::text[] WHERE vehicle_id=60810");
  assert.equal((await calc()).body.matchTier,'no_match');
  await change("UPDATE public.f05_matching_vehicle_facts_test SET condition_flags=ARRAY[]::text[],exterior_color='white' WHERE vehicle_id=60810");
  assert.equal((await calc()).body.matchTier,'no_match');
  for(const t of ['recommendations','priority_leases','vehicle_visibility_grants'])
   assert.equal((await db.query('SELECT count(*)::int n FROM public.'+t+' WHERE customer_id=60800')).rows[0].n,0);
 });
 await test('PG16 displacement upper bound fails, then valid blue+hybrid range recovers acceptable',async()=>{
  await change("UPDATE public.f05_matching_vehicle_facts_test SET exterior_color='blue',displacement_cc=2600 WHERE vehicle_id=60810");
  assert.equal((await calc()).body.matchTier,'no_match');
  await change("UPDATE public.f05_matching_vehicle_facts_test SET displacement_cc=2000 WHERE vehicle_id=60810");
  assert.equal((await calc()).body.matchTier,'acceptable');
 });
 await test('PG16 physical constraints reject fabricated condition codes or out-of-range displacement',async()=>{
  await assert.rejects(db.query("UPDATE public.f05_matching_vehicle_facts_test SET condition_flags=ARRAY['made_up']::text[] WHERE vehicle_id=60810"),e=>e.code==='23514');
  await assert.rejects(db.query("UPDATE public.f05_matching_vehicle_facts_test SET displacement_cc=99999 WHERE vehicle_id=60810"),e=>e.code==='23514');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,1);
 });
 await test('PG16 no budget requires no price: current soft tier remains safe without price proof',async()=>{
  await db.query("DELETE FROM public.f05_catalog_price_display_proof_test WHERE vehicle_id=60810");
  const recomputed=await calc();
  assert.equal(recomputed.status,200,JSON.stringify(recomputed));
  assert.equal(recomputed.body.matchTier,'acceptable');
  assert.equal(recomputed.body.explanation.sourceFacts.customerDisplayCents,null);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,1);
 });
 await test('PG16 budget with missing price must be current confirmation_needed, not false no_match',async()=>{
  await db.query("UPDATE public.f05_matching_sales_description_test SET sales_description=sales_description||';budgetCents=11000000' WHERE demand_id=60800");
  const result=await calc();
  assert.equal(result.status,200,JSON.stringify(result));
  assert.equal(result.body.matchTier,'confirmation_needed');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,1);
  assert.equal(result.body.explanation.components.find(x=>x.key==='budgetCents').outcome,'unknown');
 });
 await test('PG16 numeric price restores budget comparison; expiry never leaves an old confident current',async()=>{
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(60810,60810,'wholesale',10500000,statement_timestamp()+interval '20 minutes')");
  const result=await calc();
  assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.matchTier,'acceptable');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,1);
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET expires_at=statement_timestamp()-interval '1 second' WHERE vehicle_id=60810");
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60800")).rows[0].n,0);
 });
}catch(e){failure=e}finally{if(connected)await db.end();await pool.end()}
if(failure)throw failure;
