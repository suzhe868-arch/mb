// F05-7 bounded TTL/read-side + incremental retry; requires actual PG16 and signed-off test environment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingRetryWorker} from '../src/f05-matching-retry-worker.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:6});
const db=new pg.Client({connectionString:env.connectionString});
const credential=randomBytes(32).toString('base64url'),sha=x=>createHash('sha256').update(x).digest('hex');
let connected=false,error;
const check=async(sql,args=[]) =>(await db.query(sql,args)).rows;
const match=null;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(60100,'ttl_level')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(60100,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES(60100,'active',60100,60100,'assigned')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(60100,60100,60100,'active','{}')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,60100,statement_timestamp()+interval '20 minutes')",[sha(credential)]);
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(60100,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(60100,60100,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES(60100,60100,'brandId=59001;budgetCents=12000000',statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES(60110,'wholesale','active','visible',59001,statement_timestamp()),(60111,'wholesale','active','visible',59001,statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(60110,60110,statement_timestamp()),(60111,60111,statement_timestamp())");
  for(const table of ['f05_real_catalog_visibility_test','f05_matching_vehicle_facts_test','f05_catalog_price_display_proof_test']){
   if(table==='f05_real_catalog_visibility_test')
    await db.query("INSERT INTO public."+table+"(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(60110,60110,'wholesale',true,statement_timestamp()+interval '20 minutes'),(60111,60111,'wholesale',true,statement_timestamp()+interval '20 minutes')");
   else if(table==='f05_matching_vehicle_facts_test')
    await db.query("INSERT INTO public."+table+"(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES(60110,60110,59001,2026,30000,statement_timestamp()+interval '20 minutes'),(60111,60111,59001,2026,30000,statement_timestamp()+interval '20 minutes')");
   else
    await db.query("INSERT INTO public."+table+"(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(60110,60110,'wholesale',11000000,statement_timestamp()+interval '20 minutes'),(60111,60111,'wholesale',11000000,statement_timestamp()+interval '20 minutes')");
  }
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const matching=createIsolatedMatchingService({pool,env:process.env});
 const retry=createIsolatedMatchingRetryWorker({pool,matching,env:process.env});
 const recompute=v=>matching.recompute({credential,demandId:'60100',vehicleId:v,eventKey:randomBytes(32).toString('base64url')});
 await test('PG16 legal current pair is exposed only through valid read-time evidence',async()=>{
  assert.equal((await recompute('60110')).body.matchTier,'high');
  assert.equal((await recompute('60111')).body.matchTier,'high');
  assert.equal((await check('SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60100'))[0].n,2);
 });
 await test('PG16 natural TTL passage hides old current immediately without a write or sweep',async()=>{
  // Clock-relative timestamp is in the past; proof update also emits stale, so bypass
  // source trigger with an expired employee scope row (no change-event trigger).
  await db.query("UPDATE public.f05_matching_employee_scope_test SET expires_at=statement_timestamp()-interval '1 second' WHERE employee_id=60100");
  assert.equal((await check('SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=60100 AND current_state=\'current\''))[0].n,2);
  assert.equal((await check('SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60100'))[0].n,0);
  assert.equal((await db.query('SELECT public.f05_match_sweep_unusable_test(1) n')).rows[0].n,1);
  assert.equal((await db.query('SELECT public.f05_match_sweep_unusable_test(1) n')).rows[0].n,1);
  assert.equal((await db.query('SELECT public.f05_match_sweep_unusable_test(1) n')).rows[0].n,0);
  assert.equal((await check("SELECT count(*)::int n FROM public.matching_change_events WHERE trigger_kind='EVIDENCE_EXPIRED_OR_REVOKED' AND result_id IN (SELECT result_id FROM public.demand_match_results WHERE demand_id=60100)"))[0].n,2);
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60100 AND state='pending'"))[0].n,2);
 });
 await test('PG16 invalid expiry cannot be used as a synthetic fresh employee credential',async()=>{
  const invalid=await retry.runOnce({credential,limit:1});
  assert.equal(invalid.claimed,1);
  assert.equal(invalid.outcomes[0].outcome,'retry_pending_or_failed');
  const q=(await check("SELECT attempts,last_error FROM public.f05_matching_affected_queue_test WHERE demand_id=60100 ORDER BY attempts DESC"))[0];
  assert.equal(q.attempts,1);assert.equal(q.last_error,'MATCH_EXPLICIT_SCOPE_REQUIRED');
  assert.equal((await check('SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60100'))[0].n,0);
 });
 await test('PG16 only failed affected pair retry; no full Vehicle x Demand scan',async()=>{
  await db.query("UPDATE public.f05_matching_employee_scope_test SET expires_at=statement_timestamp()+interval '20 minutes' WHERE employee_id=60100");
  await db.query("UPDATE public.f05_matching_affected_queue_test SET next_attempt_at=statement_timestamp()-interval '1 second' WHERE demand_id=60100");
  const run=await retry.runOnce({credential,limit:2});
  assert.equal(run.claimed,2);
  assert.equal(run.outcomes.filter(x=>x.outcome==='done').length,2);
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60100"))[0].n,2);
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60100 AND state='done'"))[0].n,2);
  assert.equal((await retry.runOnce({credential,limit:2})).claimed,0);
  assert.equal((await check('SELECT count(*)::int n FROM public.recommendations WHERE customer_id=60100'))[0].n,0);
  assert.equal((await check('SELECT count(*)::int n FROM public.priority_leases WHERE customer_id=60100'))[0].n,0);
  assert.equal((await check('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE customer_id=60100'))[0].n,0);
 });
 await test('PG16 invalid batch limits fail and do not mutate source facts',async()=>{
  await assert.rejects(db.query('SELECT public.f05_match_sweep_unusable_test(0)'),/F05_TTL_BATCH_LIMIT_INVALID/);
  await assert.rejects(db.query('SELECT public.f05_match_sweep_unusable_test(201)'),/F05_TTL_BATCH_LIMIT_INVALID/);
  await assert.rejects(retry.runOnce({credential,limit:0}),/MATCH_RETRY_BATCH_LIMIT_INVALID/);
 });
}catch(e){error=e}finally{if(connected)await db.end();await pool.end()}
if(error)throw error;
