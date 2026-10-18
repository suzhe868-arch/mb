// F05-7 new candidate event -> bounded queue -> real PG16 matching; test-only, not publisher events.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedMatchingDiscoveryService} from '../src/f05-matching-discovery-service.mjs';
import {createIsolatedMatchingDiscoveryHandler} from '../src/f05-matching-discovery-http.mjs';
import {createIsolatedMatchingRetryWorker} from '../src/f05-matching-retry-worker.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:6});
const db=new pg.Client({connectionString:env.connectionString});
const sales=randomBytes(32).toString('base64url'),fourS=randomBytes(32).toString('base64url');
const key=()=>randomBytes(24).toString('base64url'),sha=x=>createHash('sha256').update(x).digest('hex');
let connected=false,server,error;
async function addVehicle(id,visibility='visible'){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active',$2,59001,statement_timestamp())",[id,visibility]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES($1,$1,59001,2026,20000,statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',11000000,statement_timestamp()+interval '20 minutes')",[id]);
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(60500,59001,'active','receiving'),(60501,59002,'active','receiving')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,60500,statement_timestamp()+interval '20 minutes'),($2,60501,statement_timestamp()+interval '20 minutes')",[sha(sales),sha(fourS)]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(60500,'discovery_level')");
  for(const id of [60500,60501]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',60500,60500,'assigned')",[id]);
   await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$1,60500,'active','{}')",[id]);
   await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(60500,$1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES($1,60500,'brandId=59001',statement_timestamp()+interval '20 minutes')",[id]);
  }
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(60500,true,statement_timestamp()+interval '20 minutes')");
  await addVehicle(60510);await addVehicle(60511,'hidden');
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const discovery=createIsolatedMatchingDiscoveryService({pool,env:process.env});
 const matching=createIsolatedMatchingService({pool,env:process.env});
 const retry=createIsolatedMatchingRetryWorker({pool,matching,env:process.env});
 server=createServer(createFoundationHandler({discoveryHandler:createIsolatedMatchingDiscoveryHandler(discovery,process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/matching/discovery';
 const post=async (kind,subjectId,credential=sales,eventKey=key())=>{
  const r=await fetch(url,{method:'POST',headers:{authorization:'Bearer '+credential,
   'x-idempotency-key':eventKey,'content-type':'application/json'},
   body:JSON.stringify({kind,subjectId})});
  return {status:r.status,body:await r.json()};
 };
 await test('real PG16: 4S and unrelated staff cannot discover first matches',async()=>{
  assert.equal((await post('NEW_DEMAND','60500',fourS)).status,403);
  assert.equal((await post('NEW_DEMAND','60500','Z'.repeat(43))).status,403);
  assert.equal((await post('NEW_DEMAND','999999')).status,403);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60500')).rows[0].n,0);
 });
 await test('NEW_DEMAND queues two scoped previously uncomputed vehicles (including hidden saleable); replay does not duplicate',async()=>{
  const k=key(),out=await post('NEW_DEMAND','60500',sales,k);
  assert.equal(out.status,200,JSON.stringify(out));
  assert.ok(out.body.queued>=2&&out.body.queued<=50,JSON.stringify(out));
  assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60500 AND vehicle_id IN (60510,60511)')).rows[0].n,2);
  const replay=await post('NEW_DEMAND','60500',sales,k);
  assert.equal(replay.body.code,'DISCOVERY_REPLAY');
  assert.equal(replay.body.hasMore,out.body.hasMore);
  assert.equal((await post('NEW_VEHICLE','60510',sales,k)).status,409);
  assert.equal((await post('NEW_DEMAND','60500')).body.queued,0);
  const run=await retry.runOnce({credential:sales,limit:50});
  assert.equal(run.claimed,out.body.queued,JSON.stringify(run));
  assert.equal(run.outcomes.every(x=>x.outcome==='done'),true,JSON.stringify(run));
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60500")).rows[0].n,out.body.queued);
 });
 await test('PG16 injected discovery audit failure rolls back *all* pending candidates, same event retries legally',async()=>{
  await db.query("CREATE FUNCTION public.f05_inject_discovery_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_DISCOVERY_AUDIT_FAIL'; END $$");
  await db.query("CREATE TRIGGER f05_inject_discovery_fault BEFORE INSERT ON public.f05_matching_discovery_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_inject_discovery_fault()");
  const k=key();
  try{
   const failed=await post('NEW_DEMAND','60501',sales,k);
   assert.equal(failed.status,503,JSON.stringify(failed));
   assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60501")).rows[0].n,0);
  }finally{
   await db.query('DROP TRIGGER f05_inject_discovery_fault ON public.f05_matching_discovery_events_test');
   await db.query('DROP FUNCTION public.f05_inject_discovery_fault()');
  }
  const valid=await post('NEW_DEMAND','60501',sales,k);
  assert.equal(valid.status,200);assert.ok(valid.body.queued>=2&&valid.body.queued<=50,JSON.stringify(valid));
  const run=await retry.runOnce({credential:sales,limit:50});
  assert.equal(run.claimed,valid.body.queued,JSON.stringify(run));
  assert.equal(run.outcomes.every(x=>x.outcome==='done'),true,JSON.stringify(run));
 });
 await test('NEW_VEHICLE reaches only currently eligible owned demands and does not write Recommendations',async()=>{
  await db.query('BEGIN');try{await addVehicle(60512);await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}
  const found=await post('NEW_VEHICLE','60512');
  assert.equal(found.status,200,JSON.stringify(found));assert.equal(found.body.queued,2);
  const run=await retry.runOnce({credential:sales,limit:10});
  assert.equal(run.claimed,2);assert.equal(run.outcomes.every(x=>x.outcome==='done'),true,JSON.stringify(run));
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE vehicle_id=60512")).rows[0].n,2);
  for(const t of ['recommendations','priority_leases','vehicle_visibility_grants'])
   assert.equal((await db.query('SELECT count(*)::int n FROM public.'+t+' WHERE customer_id IN (60500,60501)')).rows[0].n,0,t);
 });
 await test('expired matching scope excludes one Demand even when Vehicle is sellable',async()=>{
  await db.query("UPDATE public.f05_matching_employee_scope_test SET expires_at=statement_timestamp()-interval '1 second' WHERE customer_id=60501");
  await db.query('BEGIN');try{await addVehicle(60513);await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}
  const found=await post('NEW_VEHICLE','60513');
  assert.equal(found.status,200);assert.equal(found.body.queued,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE vehicle_id=60513 AND demand_id=60501")).rows[0].n,0);
  // Finish this test's single pending item before the 50-item page boundary test.
  const drained=await retry.runOnce({credential:sales,limit:10});
  assert.equal(drained.claimed,1,JSON.stringify(drained));
  assert.equal(drained.outcomes[0].outcome,'done');
 });
 await test('over 50 candidates advances as two committed pages: 50 then remainder with replay-safe hasMore',async()=>{
  await db.query('BEGIN');
  try{
   for(let i=60600;i<=60650;i++)await addVehicle(i);
   await db.query('COMMIT');
  }catch(e){await db.query('ROLLBACK');throw e}
  const idOne=key(),first=await post('NEW_DEMAND','60500',sales,idOne);
  assert.equal(first.status,200,JSON.stringify(first));
  assert.equal(first.body.queued,50);assert.equal(first.body.hasMore,true);
  assert.equal(first.body.limit,50);
  const replay=await post('NEW_DEMAND','60500',sales,idOne);
  assert.equal(replay.status,200);assert.equal(replay.body.code,'DISCOVERY_REPLAY');
  assert.equal(replay.body.queued,50);assert.equal(replay.body.hasMore,true);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60500 AND vehicle_id BETWEEN 60600 AND 60650 AND state='pending'")).rows[0].n,50);
  // Page-two audit failure must not roll back committed page one.
  await db.query("CREATE FUNCTION public.f05_discovery_page_fault() RETURNS trigger LANGUAGE plpgsql AS $ BEGIN RAISE EXCEPTION 'PAGE_TWO_AUDIT_FAILURE'; END $");
  await db.query("CREATE TRIGGER f05_discovery_page_fault BEFORE INSERT ON public.f05_matching_discovery_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_discovery_page_fault()");
  const nextKey=key();
  try{
   const rejected=await post('NEW_DEMAND','60500',sales,nextKey);
   assert.equal(rejected.status,503,JSON.stringify(rejected));
   assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60500 AND vehicle_id BETWEEN 60600 AND 60650")).rows[0].n,50);
  }finally{
   await db.query('DROP TRIGGER f05_discovery_page_fault ON public.f05_matching_discovery_events_test');
   await db.query('DROP FUNCTION public.f05_discovery_page_fault()');
  }
  const second=await post('NEW_DEMAND','60500',sales,nextKey);
  assert.equal(second.status,200,JSON.stringify(second));
  assert.equal(second.body.queued,1);assert.equal(second.body.hasMore,false);
  assert.equal((await post('NEW_DEMAND','60500')).body.queued,0);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=60500 AND vehicle_id BETWEEN 60600 AND 60650")).rows[0].n,51);
  // First page is allowed to commit without a retry worker; no head-of-line scan blockage.
  const part1=await retry.runOnce({credential:sales,limit:50});
  assert.equal(part1.claimed,50,JSON.stringify(part1));
  assert.ok(part1.outcomes.every(x=>x.outcome==='done'),JSON.stringify(part1));
  const part2=await retry.runOnce({credential:sales,limit:50});
  assert.equal(part2.claimed,1,JSON.stringify(part2));
  assert.ok(part2.outcomes.every(x=>x.outcome==='done'),JSON.stringify(part2));
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=60500 AND vehicle_id BETWEEN 60600 AND 60650")).rows[0].n,51);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_discovery_events_test WHERE trigger_kind='NEW_DEMAND' AND subject_id=60500 AND queued_count=50 AND has_more=true")).rows[0].n,1);
 });
 await test('paged discovery must revalidate revoked scope rather than trust earlier page or event key',async()=>{
  // Before this step new Vehicle has no matching Demand except the current scope owner.
  await db.query("UPDATE public.f05_matching_employee_scope_test SET can_recompute=false WHERE employee_id=60500 AND customer_id=60500");
  const denied=await post('NEW_DEMAND','60500');
  assert.equal(denied.status,403,JSON.stringify(denied));
  assert.equal(denied.body.code,'DISCOVERY_OBJECT_SCOPE_REQUIRED');
  await db.query("UPDATE public.f05_matching_employee_scope_test SET can_recompute=true WHERE employee_id=60500 AND customer_id=60500");
  const ok=await post('NEW_DEMAND','60500');
  assert.equal(ok.status,200);assert.equal(ok.body.queued,0);
 });
 await test('discovery audit append-only and one-event-per-idempotency without plaintext credential',async()=>{
  const all=(await db.query("SELECT queued_count,payload_sha256,event_key FROM public.f05_matching_discovery_events_test WHERE actor_employee_id=60500")).rows;
  assert.equal(all.every(x=>/^[0-9a-f]{64}$/.test(x.payload_sha256)),true);
  assert.equal(all.every(x=>!JSON.stringify(x).includes(sales)),true);
  await assert.rejects(db.query("DELETE FROM public.f05_matching_discovery_events_test WHERE actor_employee_id=60500"),e=>e.code==='23514');
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
