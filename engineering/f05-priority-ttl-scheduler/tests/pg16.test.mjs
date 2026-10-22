import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../../src/f05-matching-service.mjs';
import {createPriorityTtlSchedulerRuntime} from '../scheduler.mjs';

const env=validateCatalogEnv();
const pool=new pg.Pool({
 connectionString:env.connectionString,max:8,connectionTimeoutMillis:1000,
 query_timeout:5000,statement_timeout:5000,application_name:'f05_priority_ttl_scheduler_test'
});
const db=new pg.Client({
 connectionString:env.connectionString,connectionTimeoutMillis:1000,
 query_timeout:5000,statement_timeout:5000,application_name:'f05_priority_ttl_scheduler_test_client'
});
const sha=value=>createHash('sha256').update(value).digest('hex');
const key=()=>randomBytes(24).toString('base64url');
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
const children=[];
let dbConnected=false;

function startScheduler({maxRuntimeMs=10000,pollIntervalMs=100,batchLimit=1}={}){
 const child=spawn(process.execPath,[new URL('../run.mjs',import.meta.url).pathname],{
  env:{...process.env,
   F05_PRIORITY_TTL_MAX_RUNTIME_MS:String(maxRuntimeMs),
   F05_PRIORITY_TTL_POLL_INTERVAL_MS:String(pollIntervalMs),
   F05_PRIORITY_TTL_BATCH_LIMIT:String(batchLimit)},
  stdio:['ignore','pipe','pipe']
 });
 let stdout='',stderr='';
 child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{stdout+=chunk;});
 child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>{stderr+=chunk;});
 const exitPromise=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
 const proc={child,exitPromise,get stdout(){return stdout;},get stderr(){return stderr;}};
 children.push(proc);
 return proc;
}
function events(proc){
 return proc.stdout.split(/\r?\n/).filter(Boolean).flatMap(line=>{
  try{return [JSON.parse(line)];}catch{return [];}
 });
}
async function waitFor(check,timeoutMs,label){
 const end=Date.now()+timeoutMs;
 while(Date.now()<end){
  if(await check())return true;
  await new Promise(resolve=>setTimeout(resolve,25));
 }
 throw Error('PRIORITY_TTL_TEST_TIMEOUT_'+label);
}
async function withTimeout(promise,timeoutMs,label){
 let timer;
 try{
  return await Promise.race([
   promise,
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('PRIORITY_TTL_TEST_TIMEOUT_'+label)),timeoutMs);})
  ]);
 }finally{clearTimeout(timer);}
}
async function stopScheduler(proc){
 if(proc.child.exitCode===null&&proc.child.signalCode===null)proc.child.kill('SIGTERM');
 const exit=await withTimeout(proc.exitPromise,5000,'graceful_stop');
 assert.equal(exit.code,0,'SIGTERM should stop the scheduler cleanly; stderr='+proc.stderr);
 await waitFor(()=>events(proc).some(event=>event.event==='scheduler_stopped'),1000,'scheduler_stopped_log');
 return exit;
}
async function seedVehicle(vehicleId){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) "+
  "VALUES($1,'wholesale','active','visible',59001,statement_timestamp())",[vehicleId]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) "+
  "VALUES($1,$1,statement_timestamp())",[vehicleId]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) "+
  "VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[vehicleId]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) "+
  "VALUES($1,$1,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes')",[vehicleId]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) "+
  "VALUES($1,$1,'wholesale',11000000,statement_timestamp()+interval '20 minutes')",[vehicleId]);
}
let matching;
const employeeTokens=new Map();
async function ensureMatchingFacts(vehicleId){
 await seedVehicle(vehicleId);
 for(const employeeId of ['68900','68901']){
  const credential=employeeTokens.get(employeeId);
  const result=await matching.recompute({
   credential,demandId:employeeId,vehicleId,eventKey:key()
  });
  assert.equal(result.status,200,'real PG16 matching fixture must be accepted');
 }
}
async function createExpiredPriority(vehicleId){
 const source=(await db.query("SELECT result_id FROM public.demand_match_results "+
  "WHERE demand_id=68900 AND vehicle_id=$1 AND current_state='current' "+
  "ORDER BY result_id DESC LIMIT 1",[vehicleId])).rows[0];
 assert.ok(source,'expected a current matching result for the expired Priority fixture');
 const priorityId=(await db.query("INSERT INTO public.priority_leases "+
  "(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
  "VALUES($1,68900,68900,'active',statement_timestamp()-interval '1 second',$1,$2) RETURNING priority_id",
  [vehicleId,String(source.result_id)])).rows[0].priority_id;
 const job=(await db.query("SELECT state,due_at FROM public.f05_priority_schedule_jobs_test WHERE priority_id=$1",
  [String(priorityId)])).rows[0];
 assert.equal(job.state,'pending','active Priority insert must persist its queue job');
 assert.ok(job.due_at instanceof Date);
 assert.ok(job.due_at.getTime()<=Date.now());
 return String(priorityId);
}
async function queueState(priorityId){
 return (await db.query("SELECT j.state,j.attempts,j.last_error_code,"+
  "j.lease_until>statement_timestamp() AS lease_live,p.status AS priority_status "+
  "FROM public.f05_priority_schedule_jobs_test j JOIN public.priority_leases p "+
  "ON p.priority_id=j.priority_id WHERE j.priority_id=$1",[priorityId])).rows[0];
}
async function waitJobDone(priorityId,label){
 await waitFor(async()=>{
  const row=await queueState(priorityId);
  return row?.state==='done'&&row.priority_status==='ended';
 },12000,label);
}
async function lockVehicle(vehicleId){
 const blocker=await pool.connect();
 await blocker.query('BEGIN');
 await blocker.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vehicleId]);
 return blocker;
}
async function waitRunnerBlockedOnVehicle(proc,priorityId,label){
 await waitFor(async()=>{
  const row=await queueState(priorityId);
  if(row?.state!=='claimed'||row.lease_live!==true)return false;
  const waiting=(await db.query("SELECT count(*)::integer AS n FROM pg_catalog.pg_stat_activity "+
   "WHERE application_name='f05_priority_ttl_scheduler_disposable_only' "+
   "AND wait_event_type='Lock' AND pid<>pg_backend_pid()")).rows[0].n;
  return Number(waiting)>=1;
 },8000,label);
}

await test('F05-8 runner uses real PG16, processes durable TTL jobs, and recovers across process failure',async t=>{
 let admin;
 let blocker;
 try{
  await db.connect();dbConnected=true;
  assert.equal(await probeIsolatedCatalog(pool),true,'the full isolated Current catalog probe must pass');
  const identity=(await db.query("SELECT current_database() AS db,current_user AS role,"+
   "current_setting('server_version_num')::integer AS version,"+
   "(SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user) AS superuser")).rows[0];
  assert.equal(identity.db,'f05_catalog_test');
  assert.equal(identity.role,'f05_catalog_ci');
  assert.equal(Math.floor(Number(identity.version)/10000),16);
  assert.equal(identity.superuser,false);

  matching=createIsolatedMatchingService({pool,env:process.env});
  for(const employeeId of ['68900','68901']){
   const credential=randomBytes(32).toString('base64url');
   employeeTokens.set(employeeId,credential);
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) "+
    "VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(credential),employeeId]);
  }

  await t.test('runtime starts on non-superuser PG16 and fails closed for a superuser',async()=>{
   const runtime=await createPriorityTtlSchedulerRuntime(process.env);
   assert.equal((await runtime.pool.query('SELECT 1 AS ready')).rows[0].ready,1);
   await runtime.pool.end();
   admin=new pg.Client({
    connectionString:'postgres://postgres:disposable_bootstrap_only@127.0.0.1:5432/postgres',
    connectionTimeoutMillis:1000,query_timeout:3000,statement_timeout:3000,
    application_name:'f05_priority_ttl_scheduler_admin_negative_test'
   });
   await admin.connect();
   try{
    await admin.query('ALTER ROLE f05_catalog_ci SUPERUSER');
    await assert.rejects(createPriorityTtlSchedulerRuntime(process.env),
     /PRIORITY_TTL_DATABASE_SUPERUSER_DENIED/);
   }finally{
    await admin.query('ALTER ROLE f05_catalog_ci NOSUPERUSER');
    await admin.end();admin=null;
   }
   assert.equal((await db.query("SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user")).rows[0].rolsuper,false);
  });

  const base=BigInt(Date.now())*1000n+BigInt(process.pid%1000);
  const vehicleIds=Array.from({length:8},(_,i)=>(base+BigInt(i)).toString());
  for(const vehicleId of vehicleIds)await ensureMatchingFacts(vehicleId);

  await t.test('actual process auto-processes expired Priority, honours batch limit, and re-arbitrates',async()=>{
   const ids=vehicleIds.slice(0,2);
   const priorityIds=[];
   for(const id of ids)priorityIds.push(await createExpiredPriority(id));
   const proc=startScheduler({batchLimit:1,pollIntervalMs:100,maxRuntimeMs:12000});
   await waitFor(()=>events(proc).some(event=>event.event==='scheduler_started'),5000,'auto_runner_started');
   for(let i=0;i<priorityIds.length;i++)await waitJobDone(priorityIds[i],'auto_due_'+i);
   const tickEvents=events(proc).filter(event=>event.event==='tick_completed');
   assert.ok(tickEvents.filter(event=>event.claimed===1).length>=2,
    'batch limit 1 must require separate scheduler ticks');
   for(let i=0;i<priorityIds.length;i++){
    assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test "+
     "WHERE priority_id=$1 AND action='DONE'",[priorityIds[i]]),1);
    const sweep=(await db.query("SELECT disposition,next_priority_id FROM public.f05_priority_sweep_events_test "+
     "WHERE priority_id=$1",[priorityIds[i]])).rows[0];
    assert.ok(sweep);
    assert.equal(sweep.disposition,'REARBITRATED');
    assert.ok(sweep.next_priority_id!==null);
    assert.equal(await count("SELECT count(*) n FROM public.priority_leases "+
     "WHERE priority_id=$1 AND vehicle_id=$2 AND customer_id=68901 AND status='active'",
     [String(sweep.next_priority_id),ids[i]]),1);
   }
   await stopScheduler(proc);
  });

  await t.test('two real runner processes claim separate due jobs without duplicate arbitration',async()=>{
   const ids=vehicleIds.slice(2,4);
   const priorityIds=[];
   for(const id of ids)priorityIds.push(await createExpiredPriority(id));
   const [a,b]=[startScheduler({batchLimit:1,pollIntervalMs:100}),
    startScheduler({batchLimit:1,pollIntervalMs:100})];
   await Promise.all([
    waitFor(()=>events(a).some(event=>event.event==='scheduler_started'),5000,'runner_a_started'),
    waitFor(()=>events(b).some(event=>event.event==='scheduler_started'),5000,'runner_b_started')
   ]);
   for(let i=0;i<priorityIds.length;i++)await waitJobDone(priorityIds[i],'concurrent_due_'+i);
   await waitFor(()=>events(a).some(event=>event.event==='tick_completed'&&event.claimed===1)&&
    events(b).some(event=>event.event==='tick_completed'&&event.claimed===1),3000,'both_runners_claimed');
   for(const id of priorityIds){
    assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test "+
     "WHERE priority_id=$1 AND action='DONE'",[id]),1);
    assert.equal(await count("SELECT count(*) n FROM public.f05_priority_sweep_events_test "+
     "WHERE priority_id=$1",[id]),1);
   }
   await Promise.all([stopScheduler(a),stopScheduler(b)]);
  });

  await t.test('database sweep failure persists retry and succeeds after fault removal and restart',async()=>{
   const vehicleId=vehicleIds[4];
   const priorityId=await createExpiredPriority(vehicleId);
   await db.query('DROP TRIGGER IF EXISTS f05_priority_ttl_scheduler_fault ON public.f05_priority_sweep_events_test');
   await db.query('DROP FUNCTION IF EXISTS public.f05_priority_ttl_scheduler_fault_test()');
   await db.query("CREATE FUNCTION public.f05_priority_ttl_scheduler_fault_test() RETURNS trigger LANGUAGE plpgsql AS "+
    "$$ BEGIN RAISE EXCEPTION 'INJECTED_PRIORITY_TTL_DATABASE_FAILURE'; END $$");
   await db.query("CREATE TRIGGER f05_priority_ttl_scheduler_fault BEFORE INSERT ON public.f05_priority_sweep_events_test "+
    "FOR EACH ROW EXECUTE FUNCTION public.f05_priority_ttl_scheduler_fault_test()");
   const failing=startScheduler({batchLimit:1,pollIntervalMs:100});
   try{
    await waitFor(async()=>{
     const row=await queueState(priorityId);
     return row?.state==='pending'&&row.attempts===1&&row.last_error_code==='TTL_SWEEP_RETRYABLE';
    },8000,'database_fault_retry_persisted');
    assert.ok(events(failing).some(event=>event.event==='tick_completed'&&event.retried===1));
    assert.equal((await queueState(priorityId)).priority_status,'active',
     'failed sweep transaction must not partially end the Priority');
   }finally{
    await stopScheduler(failing);
    await db.query('DROP TRIGGER IF EXISTS f05_priority_ttl_scheduler_fault ON public.f05_priority_sweep_events_test');
    await db.query('DROP FUNCTION IF EXISTS public.f05_priority_ttl_scheduler_fault_test()');
   }
   await db.query("UPDATE public.f05_priority_schedule_jobs_test SET next_attempt_at=statement_timestamp()-interval '1 second' "+
    "WHERE priority_id=$1 AND state='pending'",[priorityId]);
   const recovery=startScheduler({batchLimit:1,pollIntervalMs:100});
   await waitJobDone(priorityId,'database_fault_recovery');
   assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test "+
    "WHERE priority_id=$1 AND action='RETRY'",[priorityId]),1);
   await stopScheduler(recovery);
  });

  await t.test('hard tick deadline exits process and a restarted runner recovers the durable lease',async()=>{
   const vehicleId=vehicleIds[5];
   const priorityId=await createExpiredPriority(vehicleId);
   blocker=await lockVehicle(vehicleId);
   const slow=startScheduler({batchLimit:1,pollIntervalMs:100,maxRuntimeMs:1000});
   await waitFor(()=>events(slow).some(event=>event.event==='scheduler_started'),5000,'deadline_runner_started');
   await waitRunnerBlockedOnVehicle(slow,priorityId,'deadline_runner_blocked');
   const exit=await withTimeout(slow.exitPromise,4000,'deadline_runner_exit');
   assert.equal(exit.code,124,'the tick deadline must hard-exit the process');
   await waitFor(()=>/scheduler_deadline_exit|scheduler_hard_deadline_exit/.test(slow.stderr),
    1000,'deadline_exit_log');
   const leased=await queueState(priorityId);
   assert.equal(leased.state,'claimed');
   assert.equal(leased.lease_live,true);
   await blocker.query('ROLLBACK');blocker.release();blocker=null;
   await db.query("UPDATE public.f05_priority_schedule_jobs_test SET "+
    "lease_until=statement_timestamp()-interval '1 second',next_attempt_at=statement_timestamp()-interval '1 second' "+
    "WHERE priority_id=$1 AND state='claimed'",[priorityId]);
   const recovery=startScheduler({batchLimit:1,pollIntervalMs:100});
   await waitJobDone(priorityId,'deadline_lease_recovery');
   assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test "+
    "WHERE priority_id=$1 AND action='RECOVERED'",[priorityId]),1);
   await stopScheduler(recovery);
  });

  await t.test('SIGKILLed runner leaves a durable lease that the next process recovers',async()=>{
   const vehicleId=vehicleIds[6];
   const priorityId=await createExpiredPriority(vehicleId);
   blocker=await lockVehicle(vehicleId);
   const crashed=startScheduler({batchLimit:1,pollIntervalMs:100});
   await waitFor(()=>events(crashed).some(event=>event.event==='scheduler_started'),5000,'crash_runner_started');
   await waitRunnerBlockedOnVehicle(crashed,priorityId,'crash_runner_blocked');
   crashed.child.kill('SIGKILL');
   const exit=await withTimeout(crashed.exitPromise,3000,'sigkill_exit');
   assert.equal(exit.signal,'SIGKILL');
   const leased=await queueState(priorityId);
   assert.equal(leased.state,'claimed');
   assert.equal(leased.lease_live,true);
   await blocker.query('ROLLBACK');blocker.release();blocker=null;
   await db.query("UPDATE public.f05_priority_schedule_jobs_test SET "+
    "lease_until=statement_timestamp()-interval '1 second',next_attempt_at=statement_timestamp()-interval '1 second' "+
    "WHERE priority_id=$1 AND state='claimed'",[priorityId]);
   const recovery=startScheduler({batchLimit:1,pollIntervalMs:100});
   await waitJobDone(priorityId,'sigkill_lease_recovery');
   assert.equal(await count("SELECT count(*) n FROM public.f05_priority_schedule_events_test "+
    "WHERE priority_id=$1 AND action='RECOVERED'",[priorityId]),1);
   await stopScheduler(recovery);
  });

  await t.test('empty queue idles, SIGTERM is graceful, and max runtime stops the process',async()=>{
   const idle=startScheduler({batchLimit:1,pollIntervalMs:100,maxRuntimeMs:10000});
   await waitFor(()=>events(idle).some(event=>event.event==='tick_completed'&&event.claimed===0),
    5000,'empty_queue_idle_tick');
   await stopScheduler(idle);
   assert.ok(events(idle).some(event=>event.event==='scheduler_stopped'&&event.reason==='signal'));
   const bounded=startScheduler({batchLimit:1,pollIntervalMs:100,maxRuntimeMs:1000});
   const exit=await withTimeout(bounded.exitPromise,3500,'max_runtime_exit');
   assert.equal(exit.code,0);
   assert.ok(events(bounded).some(event=>event.event==='scheduler_stopped'&&event.reason==='max_runtime'));
  });
 }finally{
  if(admin)await admin.end().catch(()=>{});
  if(blocker){
   await blocker.query('ROLLBACK').catch(()=>{});
   blocker.release();
  }
  for(const proc of children){
   if(proc.child.exitCode===null&&proc.child.signalCode===null)proc.child.kill('SIGKILL');
  }
  await Promise.all(children.map(proc=>proc.exitPromise.catch(()=>{})));
  if(dbConnected)await db.end().catch(()=>{});
  await pool.end().catch(()=>{});
 }
});
