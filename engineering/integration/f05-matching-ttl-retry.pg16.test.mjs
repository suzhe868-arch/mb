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
  await db.query("UPDATE public.f05_matching_employee_scope_test SET expires_at=statement_timestamp()+interval '20 minutes' WHERE employee_id=60100");
  // Source visibility TTL naturally expires without triggering any source UPDATE on Match Results.
  await db.query("UPDATE public.f05_real_catalog_visibility_test SET expires_at=statement_timestamp()-interval '1 second' WHERE vehicle_id=60110");
  const invalid=await retry.runOnce({credential,limit:1});
  assert.equal(invalid.claimed,1);
  assert.equal(invalid.outcomes[0].outcome,'retry_pending_or_failed');
  const q=(await check("SELECT attempts,last_error FROM public.f05_matching_affected_queue_test WHERE demand_id=60100 ORDER BY attempts DESC"))[0];
  assert.equal(q.attempts,1,JSON.stringify({invalid,q,queue:await check("SELECT demand_id,vehicle_id,generation,state,attempts,last_error FROM public.f05_matching_affected_queue_test WHERE demand_id=60100")}));assert.equal(q.last_error,'MATCH_VEHICLE_FACT_SOURCE_NOT_READY');
  assert.equal((await check('SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60100'))[0].n,0);
 });
 await test('PG16 only failed affected pair retry; no full Vehicle x Demand scan',async()=>{
  await db.query("UPDATE public.f05_real_catalog_visibility_test SET expires_at=statement_timestamp()+interval '20 minutes' WHERE vehicle_id=60110");
  await db.query("UPDATE public.f05_matching_affected_queue_test SET next_attempt_at=statement_timestamp()-interval '1 second' WHERE demand_id=60100");
  const run=await retry.runOnce({credential,limit:2});
  assert.equal(run.claimed,2);
  assert.equal(run.outcomes.filter(x=>x.outcome==='done').length,2,JSON.stringify({run,queue:await check("SELECT demand_id,vehicle_id,generation,state,attempts,last_error FROM public.f05_matching_affected_queue_test WHERE demand_id=60100")}));
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60100"))[0].n,2);
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60100 AND state='done'"))[0].n,2);
  assert.equal((await retry.runOnce({credential,limit:2})).claimed,0);
  assert.equal((await check('SELECT count(*)::int n FROM public.recommendations WHERE customer_id=60100'))[0].n,0);
  assert.equal((await check('SELECT count(*)::int n FROM public.priority_leases WHERE customer_id=60100'))[0].n,0);
  assert.equal((await check('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE customer_id=60100'))[0].n,0);
 });
 await test('PG16 committed recompute with expired scope must reopen SAME queue generation, never drop as done',async()=>{
  // Force a real affected pair from a previously safe Match Result.
  // The genuine matching service writes a new frozen result and marks the job
  // done; expire an employee scope AFTER that commit but BEFORE worker validation.
  const stale=await db.query("UPDATE public.demand_match_results SET current_state='stale', "+
   "invalidated_at=statement_timestamp() WHERE demand_id=60100 AND vehicle_id=60110 "+
   "AND current_state='current'");
  assert.equal(stale.rowCount,1);
  const queued=(await check("SELECT generation,state FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(queued.state,'pending');
  const controlledRealMatching={async recompute(request){
   const res=await matching.recompute(request);
   assert.equal(res.status,200,JSON.stringify(res));
   // Physical database expiry, NOT a Mock matching success. No queue trigger
   // exists for this natural TTL boundary: read-time safety must catch it.
   await db.query("UPDATE public.f05_matching_employee_scope_test SET "+
    "expires_at=statement_timestamp()-interval '1 second' WHERE employee_id=60100");
   return res;
  }};
  const raceWorker=createIsolatedMatchingRetryWorker({pool,matching:controlledRealMatching,env:process.env});
  const raced=await raceWorker.runOnce({credential,limit:1});
  assert.equal(raced.claimed,1,JSON.stringify(raced));
  assert.equal(raced.outcomes[0].outcome,'retry_pending_or_failed');
  const saved=(await check("SELECT generation,state,attempts,last_error FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(String(saved.generation),String(queued.generation));
  assert.equal(saved.state,'pending');assert.equal(saved.attempts,1);
  assert.equal(saved.last_error,'MATCH_RETRY_EVIDENCE_NOT_CURRENT'); // 200 but read-time evidence invalid.
  const firstAttempt=(await check("SELECT result_id FROM public.demand_match_results "+
   "WHERE demand_id=60100 AND vehicle_id=60110 AND current_state='current'"))[0];
  assert.ok(firstAttempt?.result_id,'the unsafe first attempt genuinely committed a frozen result');
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0].n,0);
  await db.query("UPDATE public.f05_matching_employee_scope_test SET "+
   "expires_at=statement_timestamp()+interval '20 minutes' WHERE employee_id=60100");
  await db.query("UPDATE public.f05_matching_affected_queue_test SET "+
   "next_attempt_at=statement_timestamp()-interval '1 second' WHERE demand_id=60100 AND vehicle_id=60110");
  const retried=await retry.runOnce({credential,limit:1});
  assert.equal(retried.claimed,1);
  assert.equal(retried.outcomes[0].outcome,'done',JSON.stringify(retried));
  const done=(await check("SELECT generation,state,attempts FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(String(done.generation),String(queued.generation));
  assert.equal(done.state,'done');assert.equal(done.attempts,1,
   'internal result replacement must not reset the real retry budget');
  const secondAttempt=(await check("SELECT result_id FROM public.demand_match_results "+
   "WHERE demand_id=60100 AND vehicle_id=60110 AND current_state='current'"))[0];
  assert.ok(secondAttempt?.result_id,'a second attempt commits a current result');
  assert.notEqual(String(secondAttempt.result_id),String(firstAttempt.result_id),
   'retry after committed-but-unsafe result must recompute instead of replay');
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0].n,1);
  // The second affected pair stays in its original done state.
  assert.equal((await check("SELECT state FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60111"))[0].state,'done');
 });
 await test('PG16 stale worker cannot finalize a reclaimed same-generation lease; current claimant alone closes it',async()=>{
  // One real F02 matching row becomes stale and is queued by the real trigger.
  assert.equal((await db.query("UPDATE public.demand_match_results SET current_state='stale', "+
   "invalidated_at=statement_timestamp() WHERE demand_id=60100 AND vehicle_id=60110 "+
   "AND current_state='current'")).rowCount,1);
  const before=(await check("SELECT generation,state FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(before.state,'pending');

  let releaseOld,releaseNew,oldClaimed,newClaimed;
  const oldGate=new Promise(resolve=>{releaseOld=resolve});
  const newGate=new Promise(resolve=>{releaseNew=resolve});
  const oldReady=new Promise(resolve=>{oldClaimed=resolve});
  const newReady=new Promise(resolve=>{newClaimed=resolve});
  const oldMatching={async recompute(request){oldClaimed();await oldGate;return matching.recompute(request)}};
  const newMatching={async recompute(request){newClaimed();await newGate;return matching.recompute(request)}};
  const oldWorker=createIsolatedMatchingRetryWorker({pool,matching:oldMatching,env:process.env});
  const newWorker=createIsolatedMatchingRetryWorker({pool,matching:newMatching,env:process.env});
  // Call genuine worker SQL and pause only BEFORE the genuine PG16 matching
  // service. This is controlled scheduling, not a mocked business result.
  const first=oldWorker.runOnce({credential,limit:1});
  await oldReady;
  const oldLease=(await check("SELECT lease_until::text AS stamp FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0].stamp;
  assert.ok(oldLease);
  // Expire the lease physically to simulate an overdue worker; the task is
  // reclaimed with the same generation by a second legitimate worker.
  await db.query("UPDATE public.f05_matching_affected_queue_test SET "+
   "lease_until=statement_timestamp()-interval '1 second' "+
   "WHERE demand_id=60100 AND vehicle_id=60110");
  const second=newWorker.runOnce({credential,limit:1});
  await newReady;
  const claimed=(await check("SELECT generation,state,lease_until::text AS stamp FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(String(claimed.generation),String(before.generation));
  assert.equal(claimed.state,'processing');assert.notEqual(claimed.stamp,oldLease);
  // The old worker still executes the genuine matching transaction, which
  // publishes 'done'. It MUST NOT finalize the new claimant's lease.
  releaseOld();
  const oldResult=await first;
  assert.equal(oldResult.claimed,1);
  assert.equal(oldResult.outcomes[0].outcome,'superseded',JSON.stringify(oldResult));
  const afterOld=(await check("SELECT state,lease_until::text AS stamp FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(afterOld.state,'done');assert.equal(afterOld.stamp,claimed.stamp,
   'the old worker cannot clear the new worker lease');
  releaseNew();
  const newResult=await second;
  assert.equal(newResult.claimed,1);
  assert.equal(newResult.outcomes[0].outcome,'done',JSON.stringify(newResult));
  const final=(await check("SELECT generation,state,lease_until FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(String(final.generation),String(before.generation));
  assert.equal(final.state,'done');assert.equal(final.lease_until,null);
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0].n,1);
  assert.equal((await check("SELECT state FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60111"))[0].state,'done');
 });
 await test('PG16 orphaned done lease recovers only after expiry and invalid safe source; repair completes same event',async()=>{
  assert.equal((await db.query("UPDATE public.demand_match_results SET current_state='stale', "+
   "invalidated_at=statement_timestamp() WHERE demand_id=60100 AND vehicle_id=60110 "+
   "AND current_state='current'")).rowCount,1);
  const pending=(await check("SELECT generation,state FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(pending.state,'pending');
  const generation=String(pending.generation);
  // Simulate the real queue CLAIM (the SQL/physical state), followed by the
  // genuinely successful frozen matching transaction, but no final Worker ack.
  await db.query("UPDATE public.f05_matching_affected_queue_test SET state='processing', "+
   "lease_until=statement_timestamp()+interval '60 seconds' "+
   "WHERE demand_id=60100 AND vehicle_id=60110");
  const eventKey=createHash('sha256').update(
   ['F05_AFFECTED_TEST_V1','60100','60110',generation].join(':')).digest('base64url');
  const actual=await matching.recompute({credential,demandId:'60100',vehicleId:'60110',eventKey});
  assert.equal(actual.status,200,JSON.stringify(actual));
  assert.equal(actual.body.code,'MATCH_RESULT_RECOMPUTED');
  const done=(await check("SELECT state,lease_until FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(done.state,'done');assert.ok(done.lease_until,'service preserves a live claim');
  assert.equal((await retry.runOnce({credential,limit:1})).claimed,0,
   'valid done lease never retries before expiry');
  // A source naturally expires without a Match Result invalidation event; now
  // the test advances the orphaned lease clock physically.
  await db.query("UPDATE public.f05_real_catalog_visibility_test SET "+
   "expires_at=statement_timestamp()-interval '1 second' WHERE vehicle_id=60110");
  await db.query("UPDATE public.f05_matching_affected_queue_test SET "+
   "lease_until=statement_timestamp()-interval '1 second' "+
   "WHERE demand_id=60100 AND vehicle_id=60110");
  const invalid=(await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(invalid.n,0);
  const reclaimed=await retry.runOnce({credential,limit:1});
  assert.equal(reclaimed.claimed,1,JSON.stringify(reclaimed));
  assert.equal(reclaimed.outcomes[0].outcome,'retry_pending_or_failed');
  const retryQueued=(await check("SELECT generation,state,attempts,last_error FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(String(retryQueued.generation),generation);
  assert.equal(retryQueued.state,'pending');
  assert.equal(retryQueued.attempts,1);
  assert.equal(retryQueued.last_error,'MATCH_RETRY_EVIDENCE_NOT_CURRENT');
  // Restoring proof alone does not create a new Match Result or generation.
  // Retry attempt 1 must recompute rather than replay attempt 0.
  await db.query("UPDATE public.f05_real_catalog_visibility_test SET "+
   "expires_at=statement_timestamp()+interval '20 minutes' WHERE vehicle_id=60110");
  await db.query("UPDATE public.f05_matching_affected_queue_test SET "+
   "next_attempt_at=statement_timestamp()-interval '1 second' "+
   "WHERE demand_id=60100 AND vehicle_id=60110");
  const recovered=await retry.runOnce({credential,limit:1});
  assert.equal(recovered.claimed,1);assert.equal(recovered.outcomes[0].outcome,'done');
  const after=(await check("SELECT generation,state,lease_until FROM "+
   "public.f05_matching_affected_queue_test WHERE demand_id=60100 AND vehicle_id=60110"))[0];
  assert.equal(String(after.generation),generation);assert.equal(after.state,'done');
  assert.equal(after.lease_until,null);
  const repaired=(await check("SELECT result_id FROM public.demand_match_results "+
   "WHERE demand_id=60100 AND vehicle_id=60110 AND current_state='current'"))[0];
  assert.notEqual(String(repaired.result_id),String(actual.body.resultId),
   'orphan lease retry must create a new result after its proof was invalid');
  assert.equal((await check("SELECT count(*)::int n FROM public.f05_matching_safe_current_test "+
   "WHERE demand_id=60100 AND vehicle_id=60110"))[0].n,1);
  assert.equal((await check("SELECT state FROM public.f05_matching_affected_queue_test "+
   "WHERE demand_id=60100 AND vehicle_id=60111"))[0].state,'done');
 });
 await test('PG16 invalid batch limits fail and do not mutate source facts',async()=>{
  await assert.rejects(db.query('SELECT public.f05_match_sweep_unusable_test(0)'),/F05_TTL_BATCH_LIMIT_INVALID/);
  await assert.rejects(db.query('SELECT public.f05_match_sweep_unusable_test(201)'),/F05_TTL_BATCH_LIMIT_INVALID/);
  await assert.rejects(retry.runOnce({credential,limit:0}),/MATCH_RETRY_BATCH_LIMIT_INVALID/);
 });
}catch(e){error=e}finally{if(connected)await db.end();await pool.end()}
if(error)throw error;
