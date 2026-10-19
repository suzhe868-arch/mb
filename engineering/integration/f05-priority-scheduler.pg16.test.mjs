// PDM-13 durable Priority TTL queue: physical PG16 claim/retry/recovery.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedPrioritySchedulerWorker} from '../src/f05-priority-scheduler-worker.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:8});
const db=new pg.Client({connectionString:env.connectionString});
const a=randomBytes(32).toString('base64url'),b=randomBytes(32).toString('base64url');
const sha=x=>createHash('sha256').update(x).digest('hex'),key=()=>randomBytes(24).toString('base64url');
let connected=false,failure;
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
async function vehicle(id){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active','visible',59001,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) VALUES($1,$1,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',11000000,statement_timestamp()+interval '20 minutes')",[id]);
}
async function expired(vehicleId){
 const m=(await db.query("SELECT result_id FROM public.demand_match_results WHERE demand_id=68900 AND vehicle_id=$1 AND current_state='current'",[vehicleId])).rows[0];
 assert.ok(m);
 return (await db.query("INSERT INTO public.priority_leases(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
  "VALUES($1,68900,68900,'active',statement_timestamp()-interval '1 second',$1,$2) RETURNING priority_id",[vehicleId,m.result_id])).rows[0].priority_id;
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(68900,59001,'active','receiving'),(68901,59001,'active','receiving')");
  for(const [id,t] of [[68900,a],[68901,b]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(t),id]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(68900,'scheduler_priority_fan')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(68900,true,statement_timestamp()+interval '20 minutes')");
  for(const id of [68900,68901]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',68900,$1,'assigned')",[id]);
   await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$1,$1,'active','{}')",[id]);
   await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES($1,$1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_priority_qualification_test(customer_id,enabled,expires_at) VALUES($1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES($1,$1,'brandId=59001',statement_timestamp()+interval '20 minutes')",[id]);
  }
  for(const id of [68910,68911,68912])await vehicle(id);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const matching=createIsolatedMatchingService({pool,env:process.env});
 for(const vid of [68910,68911,68912])for(const [d,t] of [[68900,a],[68901,b]]){
  const r=await matching.recompute({credential:t,demandId:String(d),vehicleId:String(vid),eventKey:key()});
  assert.equal(r.status,200,JSON.stringify(r));
 }
 const worker=createIsolatedPrioritySchedulerWorker({pool,env:process.env});
 await test('PG16 active Priority insert durably enqueues exact TTL job; due run ends/rearbitrates and schedules replacement',async()=>{
  const old=await expired(68910);
  const job=(await db.query("SELECT state,due_at,attempts FROM public.f05_priority_schedule_jobs_test WHERE priority_id=$1",[old])).rows[0];
  assert.equal(job.state,'pending');assert.equal(job.attempts,0);assert.ok(job.due_at instanceof Date);
  const x=await worker.runDue({limit:5});
  assert.equal(x.claimed,1);assert.equal(x.done,1);assert.equal(x.retried,0);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE priority_id=$1 AND status='ended'",[old]),1);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=68910 AND status='active' AND customer_id=68901"),1);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_jobs_test j JOIN public.priority_leases p ON p.priority_id=j.priority_id WHERE p.vehicle_id=68910"),2);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test WHERE priority_id=$1 AND action='DONE'",[old]),1);
 });
 await test('PG16 two scheduler workers claim one due job only once',async()=>{
  const old=await expired(68911);
  const other=createIsolatedPrioritySchedulerWorker({pool,env:process.env});
  const [x,y]=await Promise.all([worker.runDue({limit:1}),other.runDue({limit:1})]);
  assert.equal(x.done+y.done,1,JSON.stringify({x,y}));
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test WHERE priority_id=$1 AND action='DONE'",[old]),1);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_sweep_events_test WHERE priority_id=$1",[old]),1);
 });
 await test('PG16 sweep failure persists retry with no partial Priority mutation; retry later succeeds',async()=>{
  const old=await expired(68912);
  await db.query("CREATE FUNCTION public.f05_scheduler_sweep_fault_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_SCHEDULER_SWEEP_FAIL'; END $$");
  await db.query("CREATE TRIGGER f05_scheduler_sweep_fault BEFORE INSERT ON public.f05_priority_sweep_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_scheduler_sweep_fault_test()");
  try{
   const failed=await worker.runDue({limit:1});
   assert.equal(failed.retried,1);assert.equal(failed.done,0);
   const j=(await db.query("SELECT state,attempts,last_error_code,next_attempt_at FROM public.f05_priority_schedule_jobs_test WHERE priority_id=$1",[old])).rows[0];
   assert.equal(j.state,'pending');assert.equal(j.attempts,1);assert.equal(j.last_error_code,'TTL_SWEEP_RETRYABLE');
   assert.ok(j.next_attempt_at instanceof Date);
   assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE priority_id=$1 AND status='active'",[old]),1);
  }finally{
   await db.query("DROP TRIGGER f05_scheduler_sweep_fault ON public.f05_priority_sweep_events_test");
   await db.query("DROP FUNCTION public.f05_scheduler_sweep_fault_test()");
  }
  await db.query("UPDATE public.f05_priority_schedule_jobs_test SET next_attempt_at=statement_timestamp()-interval '1 second' WHERE priority_id=$1",[old]);
  const recovered=await worker.runDue({limit:1});
  assert.equal(recovered.done,1);assert.equal(recovered.retried,0);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test WHERE priority_id=$1 AND action='RETRY'",[old]),1);
 });
 await test('PG16 expired claimed scheduler lease is recoverable after simulated worker crash',async()=>{
  const active=(await db.query("SELECT p.priority_id,p.vehicle_id FROM public.priority_leases p WHERE p.vehicle_id=68912 AND p.status='active' LIMIT 1")).rows[0];
  await db.query("UPDATE public.priority_leases SET expires_at=statement_timestamp()-interval '1 second' WHERE priority_id=$1",[active.priority_id]);
  await db.query("UPDATE public.f05_priority_schedule_jobs_test SET due_at=statement_timestamp()-interval '1 second',next_attempt_at=statement_timestamp()-interval '1 second',state='claimed',lease_token='crashed_worker_lease_token_123456',lease_until=statement_timestamp()-interval '1 second',attempts=1 WHERE priority_id=$1",[active.priority_id]);
  const x=await worker.runDue({limit:1});
  assert.equal(x.claimed,1);assert.equal(x.done,1);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test WHERE priority_id=$1 AND action='RECOVERED'",[active.priority_id]),1);
 });
 await test('PG16 scheduler audit is append-only and invalid batch/env fail closed',async()=>{
  await assert.rejects(db.query("DELETE FROM public.f05_priority_schedule_events_test"),e=>e.code==='23514');
  await assert.rejects(worker.runDue({limit:0}),/BATCH_LIMIT/);
  assert.throws(()=>createIsolatedPrioritySchedulerWorker({pool,env:{...process.env,APP_ENV:'production'}}));
 });
}catch(e){failure=e}finally{
 if(connected)await db.end();await pool.end();
}
if(failure)throw failure;
