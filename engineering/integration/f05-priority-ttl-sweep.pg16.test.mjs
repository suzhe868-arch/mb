// F05-8 PDM13: separate real PG16 non-superuser TTL sweep, never a prod scheduler.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedPriorityTtlSweepWorker} from '../src/f05-priority-ttl-sweep-worker.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:8});
const db=new pg.Client({connectionString:env.connectionString});
const secretA=randomBytes(32).toString('base64url'),secretB=randomBytes(32).toString('base64url');
const sha=x=>createHash('sha256').update(x).digest('hex');
const key=()=>randomBytes(24).toString('base64url');
let connected=false,error;
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
async function addVehicle(id){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active','visible',59001,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) VALUES($1,$1,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',11000000,statement_timestamp()+interval '20 minutes')",[id]);
}
async function expire(vehicleId){
 const result=(await db.query("SELECT result_id FROM public.demand_match_results "+
  "WHERE demand_id=63900 AND vehicle_id=$1 AND current_state='current'",[vehicleId])).rows[0];
 assert.ok(result?.result_id);
 return (await db.query("INSERT INTO public.priority_leases "+
  "(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
  "VALUES($1,63900,63900,'active',statement_timestamp()-interval '1 second',$1,$2) "+
  "RETURNING priority_id",[vehicleId,result.result_id])).rows[0].priority_id;
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(63900,59001,'active','receiving'),(63901,59001,'active','receiving')");
  for(const [id,token] of [[63900,secretA],[63901,secretB]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(token),id]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(63900,'f05_ttl_test_fan')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(63900,true,statement_timestamp()+interval '20 minutes')");
  for(const id of [63900,63901]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',63900,$1,'assigned')",[id]);
   await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$1,$1,'active','{}')",[id]);
   await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES($1,$1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_priority_employee_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES($1,$1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_priority_qualification_test(customer_id,enabled,expires_at) VALUES($1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) "+
    "VALUES($1,$1,$2,statement_timestamp()+interval '20 minutes')",[id,id===63900?'brandId=59001':'brandId=59001;interiorColor=beige']);
  }
  for(const id of [63910,63911,63912,63913,63914])await addVehicle(id);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const matching=createIsolatedMatchingService({pool,env:process.env});
 const worker=createIsolatedPriorityTtlSweepWorker({pool,env:process.env});
 await test('TTL sweep can only start with test-only loopback consent; batch invalid rejected',async()=>{
  for(const bad of [{...process.env,APP_ENV:'production'},{...process.env,API_HOST:'0.0.0.0'}])
   assert.throws(()=>createIsolatedPriorityTtlSweepWorker({pool,env:bad}));
  await assert.rejects(worker.runOnce({limit:0}),/BATCH_LIMIT/);
  await assert.rejects(worker.runOnce({limit:26}),/BATCH_LIMIT/);
  assert.deepEqual(await worker.runOnce({limit:5}),{examined:0,ended:0,rearbitrated:0,skipped:0,
   hasMore:false,worker:'DISPOSABLE_TEST_ONLY',productionReady:false});
 });
 await test('PDM12 real Match Results before system TTL sweep, no synthetic source awards',async()=>{
  for(const vid of [63910,63911,63912,63913,63914]){
   for(const [did,token] of [[63900,secretA],[63901,secretB]]){
    const r=await matching.recompute({credential:token,demandId:String(did),vehicleId:String(vid),eventKey:key()});
    assert.equal(r.status,200,JSON.stringify(r));
   }
  }
  assert.equal(await count("SELECT count(*) n FROM public.f05_matching_safe_current_test WHERE vehicle_id BETWEEN 63910 AND 63914"),10);
 });
 await test('bounded batch processes first 2 physical TTL leases then advances remaining, no repeated lease',async()=>{
  for(const vid of [63910,63911,63912])await expire(vid);
  const a=await worker.runOnce({limit:2});
  assert.equal(a.examined,2);assert.equal(a.rearbitrated,2);assert.equal(a.ended,0);assert.equal(a.hasMore,true);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_sweep_events_test WHERE vehicle_id IN(63910,63911) AND disposition='REARBITRATED'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id IN(63910,63911) AND status='ended'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id IN(63910,63911) AND status='active' AND customer_id=63901"),2);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_suppression_test WHERE vehicle_id IN(63910,63911) AND reason='ttl_expired'"),2);
  const second=await worker.runOnce({limit:2});
  assert.equal(second.examined,1);assert.equal(second.rearbitrated,1);assert.equal(second.hasMore,false);
  const again=await worker.runOnce({limit:2});
  assert.equal(again.examined,0);
 });
 await test('two concurrent workers cannot close one expired lease twice or create two new Priorities',async()=>{
  const expired=await expire(63913);
  const pair=await Promise.all([worker.runOnce({limit:1}),worker.runOnce({limit:1})]);
  assert.equal(pair.reduce((n,x)=>n+x.rearbitrated,0),1,JSON.stringify(pair));
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_sweep_events_test WHERE priority_id=$1",[expired]),1);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=63913 AND status='active' AND customer_id=63901"),1);
 });
 await test('failed PG16 immutable sweep audit rolls back old close+new lease+suppression; retry succeeds',async()=>{
  await expire(63914);
  await db.query("CREATE FUNCTION public.f05_sweep_fault_test() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''F05_SWEEP_FAULT''; END'");
  await db.query("CREATE TRIGGER f05_sweep_fault_test BEFORE INSERT ON public.f05_priority_sweep_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_sweep_fault_test()");
  try{
   await assert.rejects(worker.runOnce({limit:1}),/F05_SWEEP_FAULT/);
   assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=63914 AND status='active' AND customer_id=63900"),1);
   assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=63914 AND customer_id=63901"),0);
   assert.equal(await count("SELECT count(*) n FROM public.f05_priority_suppression_test WHERE vehicle_id=63914"),0);
  }finally{
   await db.query("DROP TRIGGER f05_sweep_fault_test ON public.f05_priority_sweep_events_test");
   await db.query("DROP FUNCTION public.f05_sweep_fault_test()");
  }
  const recovered=await worker.runOnce({limit:1});
  assert.equal(recovered.rearbitrated,1);assert.equal(recovered.hasMore,false);
 });
 await test('invalid competing recipient and active Lock cannot receive new lease; historical expiry closed',async()=>{
  // A fresh expired source with B disabled to prove no phantom Priority.
  await db.query("UPDATE public.f05_priority_qualification_test SET enabled=false WHERE customer_id=63901");
  await db.query("UPDATE public.priority_leases SET status='ended',ended_at=statement_timestamp() WHERE vehicle_id=63913 AND status='active'");
  // New authentic Match result, then new expired A under current cycle.
  const fresh=await matching.recompute({credential:secretA,demandId:'63900',vehicleId:'63913',eventKey:key()});
  assert.equal(fresh.status,200,JSON.stringify(fresh));
  const old=await expire(63913);
  const done=await worker.runOnce({limit:1});
  assert.equal(done.ended,1);assert.equal(done.rearbitrated,0);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE priority_id=$1 AND status='ended'",[old]),1);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=63913"),0);
  await db.query("UPDATE public.f05_priority_qualification_test SET enabled=true WHERE customer_id=63901");
 });
 await test('append-only PG16 TTL audit and no grant/Recommendation/price right introduced by worker',async()=>{
  await assert.rejects(db.query("DELETE FROM public.f05_priority_sweep_events_test WHERE vehicle_id=63910"),e=>e.code==='23514');
  for(const tab of ['recommendations','vehicle_visibility_grants','customer_price_cycle_unlocks'])
   assert.equal(await count('SELECT count(*) n FROM public.'+tab+' WHERE vehicle_id BETWEEN 63910 AND 63914'),0,tab);
 });
}catch(e){error=e}finally{
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
