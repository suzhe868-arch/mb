// F05-7 cross-module integration: dictionary mutation -> frozen Match stale -> scoped retry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedDictionaryService} from '../src/f05-matching-dictionary-service.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingRetryWorker} from '../src/f05-matching-retry-worker.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:5});
const db=new pg.Client({connectionString:env.connectionString});
const token=randomBytes(32).toString('base64url');
const hash=s=>createHash('sha256').update(s).digest('hex'),key=()=>randomBytes(24).toString('base64url');
let conn=false,failed,ruleId;const def=value=>({token:'alias_match',mappedKey:'brandId',mappedValue:value,scopeKind:'global'});
try{
 await db.connect();conn=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES (60300,59001,'active','receiving')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,60300,statement_timestamp()+interval '20 minutes')",[hash(token)]);
  await db.query("INSERT INTO public.f05_matching_rule_manage_scope_test(employee_id,can_manage,expires_at) VALUES(60300,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(60300,'alias_match_level')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES(60300,'active',60300,60300,'assigned')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(60300,60300,60300,'active','{}')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(60300,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(60300,60300,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES(60300,60300,'alias_match',statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES(60310,'wholesale','active','visible',59001,statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(60310,60310,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(60310,60310,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES(60310,60310,59001,2026,20000,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(60310,60310,'wholesale',11000000,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const dict=createIsolatedDictionaryService({pool,env:process.env});
 const match=createIsolatedMatchingService({pool,env:process.env});
 const worker=createIsolatedMatchingRetryWorker({pool,matching:match,env:process.env});
 const recompute=()=>match.recompute({credential:token,demandId:'60300',vehicleId:'60310',eventKey:key()});
 await test('PG16 dictionary alias actually drives Demand×Vehicle current Match with rule version evidence',async()=>{
  const created=await dict.mutate({credential:token,action:'CREATE',eventKey:key(),definition:def('59001')});
  assert.equal(created.status,200,JSON.stringify(created));ruleId=created.body.ruleId;
  const initial=await recompute();assert.equal(initial.status,200,JSON.stringify(initial));
  assert.equal(initial.body.matchTier,'high');
  assert.equal(initial.body.explanation.salesDescription.ruleHits[0].ruleId,ruleId);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60300")).rows[0].n,1);
 });
 await test('PG16 edit stales only affected frozen pair then scoped retry recalculates using new rule',async()=>{
  const out=await dict.mutate({credential:token,action:'EDIT',ruleId,expectedVersion:1,eventKey:key(),definition:def('59002')});
  assert.equal(out.status,200,JSON.stringify(out));assert.equal(out.body.affectedCurrentPairsStaled,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=60300 AND current_state='current'")).rows[0].n,0);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.matching_change_events WHERE trigger_kind='RULE_DICTIONARY_CHANGE' AND result_id IN(SELECT result_id FROM public.demand_match_results WHERE demand_id=60300)")).rows[0].n,1);
  const run=await worker.runOnce({credential:token,limit:5});
  assert.equal(run.claimed,1,JSON.stringify(run));assert.equal(run.outcomes[0].outcome,'done');
  const row=(await db.query("SELECT current_state,match_tier,match_explanation FROM public.demand_match_results WHERE demand_id=60300 ORDER BY result_id DESC LIMIT 1")).rows[0];
  assert.equal(row.current_state,'current');assert.equal(row.match_tier,'no_match');
  assert.equal(row.match_explanation.salesDescription.ruleHits[0].ruleVersion,'2');
  assert.equal((await db.query("SELECT state FROM public.f05_matching_affected_queue_test WHERE demand_id=60300 AND vehicle_id=60310")).rows[0].state,'done');
 });
 await test('PG16 disable invalidates new current, retry cannot use disabled alias or grant visibility',async()=>{
  const disabled=await dict.mutate({credential:token,action:'DISABLE',ruleId,expectedVersion:2,eventKey:key()});
  assert.equal(disabled.status,200,JSON.stringify(disabled));assert.equal(disabled.body.affectedCurrentPairsStaled,1);
  const blocked=await recompute();
  assert.equal(blocked.status,409,JSON.stringify(blocked));assert.equal(blocked.body.reason,'RULE_PARSE_UNKNOWN_TOKEN');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60300")).rows[0].n,0);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.recommendations WHERE customer_id=60300")).rows[0].n,0);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.priority_leases WHERE customer_id=60300")).rows[0].n,0);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE customer_id=60300")).rows[0].n,0);
 });
}catch(e){failed=e}finally{if(conn)await db.end();await pool.end()}
if(failed)throw failed;
