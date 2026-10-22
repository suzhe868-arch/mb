import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../../src/f05-matching-service.mjs';

const env=validateCatalogEnv(process.env);
const pool=new pg.Pool({
 connectionString:env.connectionString,max:6,connectionTimeoutMillis:900,
 query_timeout:2500,statement_timeout:2500,
 application_name:'f05_matching_retry_scheduler_pg16_test'
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const runnerPath=fileURLToPath(new URL('../run.mjs',import.meta.url));

function startScheduler(credential){
 const child=spawn(process.execPath,[runnerPath],{
  env:{
   ...process.env,
   F05_MATCHING_RETRY_CREDENTIAL:credential,
   F05_MATCHING_RETRY_POLL_INTERVAL_MS:'100',
   F05_MATCHING_RETRY_BATCH_LIMIT:'1',
   F05_MATCHING_RETRY_MAX_RUNTIME_MS:'30000',
   F05_MATCHING_RETRY_BACKOFF_BASE_MS:'100',
   F05_MATCHING_RETRY_BACKOFF_MAX_MS:'1000'
  },
  stdio:['ignore','pipe','pipe']
 });
 let stdout='',stderr='';
 child.stdout.on('data',chunk=>{stdout=(stdout+chunk.toString()).slice(-500000);});
 child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-500000);});
 const exitPromise=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
 return {
  child,exitPromise,
  get stdout(){return stdout;},
  get stderr(){return stderr;}
 };
}

async function waitFor(predicate,timeoutMs,label){
 const deadline=Date.now()+timeoutMs;
 while(Date.now()<deadline){
  if(await predicate())return;
  await pause(40);
 }
 throw Error('MATCH_RETRY_TEST_TIMEOUT_'+label);
}

async function withTimeout(promise,timeoutMs){
 let timer;
 const timeout=new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs);});
 const result=await Promise.race([promise,timeout]);
 clearTimeout(timer);
 return result;
}

async function stopScheduler(proc){
 if(proc.child.exitCode===null&&proc.child.signalCode===null)proc.child.kill('SIGTERM');
 let result=await withTimeout(proc.exitPromise,4000);
 if(!result){
  proc.child.kill('SIGKILL');
  result=await proc.exitPromise;
 }
 assert.equal(result.code,0,'scheduler must exit cleanly after graceful stop');
 assert.equal(proc.stdout.includes(process.env.F05_MATCHING_RETRY_CREDENTIAL??'\u0000'),false);
 return result;
}

function tickEntries(proc){
 return proc.stdout.split('\n').filter(line=>line.includes('"event":"tick_completed"')).map(line=>{
  try{return JSON.parse(line);}catch{return null;}
 }).filter(Boolean);
}

await test('真实 PG16 自动调度、双进程并发、过期租约恢复、退避重试、重启与安全停机',async()=>{
 const children=[];
 try{
  const identity=(await pool.query(
   "SELECT current_database() AS db,current_user AS role,current_setting('server_version_num')::integer AS version,"+
   "(SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user) AS superuser"
  )).rows[0];
  assert.equal(Math.floor(Number(identity.version)/10000),16);
  assert.equal(identity.db,'f05_catalog_test');
  assert.equal(identity.role,'f05_catalog_ci');
  assert.equal(identity.superuser,false);
  assert.equal(await probeIsolatedCatalog(pool),true);

  const role=(await pool.query("SELECT role_id FROM public.roles WHERE role_code='sales' ORDER BY role_id LIMIT 1")).rows[0];
  assert.ok(role,'a real base-schema sales role is required');
  const seed=BigInt(Date.now())*1000n+BigInt(process.pid%1000);
  const levelId=String(seed+1n),employeeId=String(seed+2n),customerId=String(seed+3n),demandId=String(seed+4n);
  const vehicleIds=[String(seed+10n),String(seed+11n),String(seed+12n)];
  const cycleIds=[String(seed+20n),String(seed+21n),String(seed+22n)];
  const credential=randomBytes(32).toString('base64url');
  const tokenHash=createHash('sha256').update(credential).digest('hex');

  await pool.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES($1,$2)",
   [levelId,'retry_sched_'+process.pid+'_'+Date.now()]);
  await pool.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) "+
   "VALUES($1,$2,'active','receiving')",[employeeId,String(role.role_id)]);
  await pool.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) "+
   "VALUES($1,'active',$2,$3,'assigned')",[customerId,levelId,employeeId]);
  await pool.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) "+
   "VALUES($1,$2,$3,'active','{}')",[demandId,customerId,employeeId]);
  await pool.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) "+
   "VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[tokenHash,employeeId]);
  await pool.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) "+
   "VALUES($1,true,statement_timestamp()+interval '20 minutes')",[levelId]);
  await pool.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) "+
   "VALUES($1,$2,true,statement_timestamp()+interval '20 minutes')",[employeeId,customerId]);
  await pool.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) "+
   "VALUES($1,$2,'brandId=59001;budgetCents=12000000',statement_timestamp()+interval '20 minutes')",[demandId,employeeId]);

  for(let i=0;i<vehicleIds.length;i++){
   await pool.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) "+
    "VALUES($1,'wholesale','active','visible',NULL,statement_timestamp())",[vehicleIds[i]]);
   await pool.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) "+
    "VALUES($1,$2,statement_timestamp())",[cycleIds[i],vehicleIds[i]]);
   await pool.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) "+
    "VALUES($1,$2,'wholesale',true,statement_timestamp()+interval '20 minutes')",[vehicleIds[i],cycleIds[i]]);
   await pool.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) "+
    "VALUES($1,$2,59001,2026,30000,statement_timestamp()+interval '20 minutes')",[vehicleIds[i],cycleIds[i]]);
   await pool.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) "+
    "VALUES($1,$2,'wholesale',11000000,statement_timestamp()+interval '20 minutes')",[vehicleIds[i],cycleIds[i]]);
  }

  const matching=createIsolatedMatchingService({pool,env:process.env});
  for(const vehicleId of vehicleIds){
   const result=await matching.recompute({
    credential,demandId,vehicleId,eventKey:randomBytes(24).toString('base64url')
   });
   assert.equal(result.status,200,'fixture must create a real current Match Result');
   assert.equal(result.body.code,'MATCH_RESULT_RECOMPUTED');
  }
  const beforeStale=(await pool.query(
   "SELECT count(*)::integer AS n FROM public.demand_match_results WHERE demand_id=$1 AND vehicle_id=ANY($2::bigint[]) AND current_state='current'",
   [demandId,vehicleIds]
  )).rows[0].n;
  assert.equal(beforeStale,3);

  // Start two real scheduler processes while the persistent queue has no due work.
  const first=startScheduler(credential),second=startScheduler(credential);
  children.push(first,second);
  await waitFor(()=>first.stdout.includes('"event":"scheduler_started"')&&
   second.stdout.includes('"event":"scheduler_started"'),8000,'both_processes_started');

  // A source TTL failure will be retried; another row simulates a killed process with an expired lease.
  await pool.query("UPDATE public.demand_match_results SET current_state='stale',invalidated_at=statement_timestamp() "+
   "WHERE demand_id=$1 AND vehicle_id=ANY($2::bigint[]) AND current_state='current'",[demandId,vehicleIds]);
  await pool.query("UPDATE public.f05_real_catalog_visibility_test SET expires_at=statement_timestamp()-interval '1 second' "+
   "WHERE vehicle_id=$1",[vehicleIds[1]]);
  const expiredLease=(await pool.query(
   "UPDATE public.f05_matching_affected_queue_test SET state='processing',"+
   "lease_until=statement_timestamp()-interval '1 second',next_attempt_at=statement_timestamp()-interval '1 second' "+
   "WHERE demand_id=$1 AND vehicle_id=$2 RETURNING generation",[demandId,vehicleIds[0]]
  )).rows[0];
  assert.ok(expiredLease,'a durable queue row is required to simulate a crashed lease holder');

  async function queueRows(){
   return (await pool.query(
    "SELECT vehicle_id::text AS vehicle_id,state,attempts,"+
    "(next_attempt_at>statement_timestamp()) AS backoff_active,"+
    "EXTRACT(EPOCH FROM (next_attempt_at-statement_timestamp()))*1000 AS backoff_remaining_ms "+
    "FROM public.f05_matching_affected_queue_test WHERE demand_id=$1 AND vehicle_id=ANY($2::bigint[])",
    [demandId,vehicleIds]
   )).rows;
  }
  await waitFor(async()=>{
   const rows=await queueRows();
   const byVehicle=new Map(rows.map(row=>[row.vehicle_id,row]));
   return rows.length===3&&byVehicle.get(vehicleIds[0])?.state==='done'&&
    byVehicle.get(vehicleIds[2])?.state==='done'&&
    byVehicle.get(vehicleIds[1])?.state==='pending'&&Number(byVehicle.get(vehicleIds[1])?.attempts)===1;
  },7000,'initial_auto_run_and_failed_retry');
  await Promise.all([stopScheduler(first),stopScheduler(second)]);

  const failedRow=(await pool.query(
   "SELECT state,attempts,(next_attempt_at>statement_timestamp()) AS backoff_active,"+
   "EXTRACT(EPOCH FROM (next_attempt_at-statement_timestamp()))*1000 AS backoff_remaining_ms "+
   "FROM public.f05_matching_affected_queue_test WHERE demand_id=$1 AND vehicle_id=$2",
   [demandId,vehicleIds[1]]
  )).rows[0];
  assert.equal(failedRow.state,'pending');
  assert.equal(Number(failedRow.attempts),1);
  assert.equal(failedRow.backoff_active,true,'transient source failure must persist a future retry time');
  assert.ok(Number(failedRow.backoff_remaining_ms)>0&&Number(failedRow.backoff_remaining_ms)<=2500,
   'retry backoff must be bounded and database-persisted');

  const tickLogs=[...tickEntries(first),...tickEntries(second)];
  assert.ok(tickLogs.length>=2);
  assert.ok(tickLogs.every(entry=>entry.claimed<=1),'configured batch limit must apply to every tick');
  assert.equal(first.stdout.includes(credential),false);
  assert.equal(second.stdout.includes(credential),false);
  assert.equal(first.stderr.includes(credential),false);
  assert.equal(second.stderr.includes(credential),false);

  await pool.query("UPDATE public.f05_real_catalog_visibility_test SET expires_at=statement_timestamp()+interval '20 minutes' "+
   "WHERE vehicle_id=$1",[vehicleIds[1]]);
  // A fresh process resumes only from the durable queue and waits for next_attempt_at.
  const restarted=startScheduler(credential);
  children.push(restarted);
  await waitFor(()=>restarted.stdout.includes('"event":"scheduler_started"'),8000,'restart_started');
  await waitFor(async()=>{
   const row=(await pool.query(
    "SELECT state,attempts FROM public.f05_matching_affected_queue_test WHERE demand_id=$1 AND vehicle_id=$2",
    [demandId,vehicleIds[1]]
   )).rows[0];
   return row?.state==='done'&&Number(row.attempts)===1;
  },10000,'restart_retry_completed');
  await stopScheduler(restarted);

  const events=(await pool.query(
   "SELECT vehicle_id::text AS vehicle_id,count(*)::integer AS n "+
   "FROM public.f05_matching_recompute_events_test WHERE demand_id=$1 GROUP BY vehicle_id",
   [demandId]
  )).rows;
  const eventCounts=new Map(events.map(row=>[row.vehicle_id,Number(row.n)]));
  for(const vehicleId of vehicleIds)assert.equal(eventCounts.get(vehicleId),2,
   'each pair must have one initial result and one successful scheduled retry, without duplicate events');
  const finalRows=await queueRows();
  assert.ok(finalRows.every(row=>row.state==='done'));
  assert.equal((await pool.query("SELECT count(*)::integer AS n FROM public.recommendations WHERE customer_id=$1",[customerId])).rows[0].n,0);
  assert.equal((await pool.query("SELECT count(*)::integer AS n FROM public.priority_leases WHERE customer_id=$1",[customerId])).rows[0].n,0);
  assert.equal((await pool.query("SELECT count(*)::integer AS n FROM public.vehicle_visibility_grants WHERE customer_id=$1",[customerId])).rows[0].n,0);

  // Idle polling remains bounded and SIGTERM performs a clean stop.
  const idle=startScheduler(credential);
  children.push(idle);
  await waitFor(()=>idle.stdout.includes('"event":"scheduler_started"'),8000,'idle_started');
  await pause(450);
  await stopScheduler(idle);
  const idleTicks=tickEntries(idle);
  assert.ok(idleTicks.length>=2&&idleTicks.length<=8,'idle polling must sleep rather than busy-loop');
  assert.ok(idleTicks.every(entry=>entry.claimed===0));
  assert.ok(children.every(proc=>!proc.stdout.includes(credential)&&!proc.stderr.includes(credential)));
 }finally{
  for(const child of children){
   if(child.child.exitCode===null&&child.child.signalCode===null){
    child.child.kill('SIGTERM');
    await withTimeout(child.exitPromise,1500);
    if(child.child.exitCode===null&&child.child.signalCode===null)child.child.kill('SIGKILL');
   }
  }
  await pool.end();
 }
});
