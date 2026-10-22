import test from 'node:test';
import assert from 'node:assert/strict';
import {assertNonSuperuserPriorityCatalog,runPriorityTtlScheduler,
 validatePriorityTtlSchedulerEnv} from '../scheduler.mjs';

function validEnv(){
 return {
  APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
  F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY',
  F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:disposable_f05_ci_only@127.0.0.1:5432/f05_catalog_test'
 };
}
function result(overrides={}){
 return {claimed:0,done:0,retried:0,lostLease:0,hasDue:false,...overrides};
}

await test('仅接受隔离 test/loopback/PG16 配置并拒绝生产开关',async()=>{
 const config=validatePriorityTtlSchedulerEnv(validEnv());
 assert.equal(config.maxConcurrentTicks,1);
 assert.equal(config.batchLimit,10);
 assert.equal(config.maxRuntimeMs,300000);
 const target=new URL(config.connectionString);
 assert.equal(target.hostname,'127.0.0.1');
 assert.equal(target.pathname,'/f05_catalog_test');
 assert.equal(target.username,'f05_catalog_ci');
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),APP_ENV:'production'}),
  /PRIORITY_TTL_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),NODE_ENV:'production'}),
  /PRIORITY_TTL_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),API_HOST:'0.0.0.0'}),
  /PRIORITY_TTL_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),F05_CATALOG_TEST_CONSENT:''}),
  /PRIORITY_TTL_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),F05_PRIORITY_TTL_PRODUCTION:'true'}),
  /PRIORITY_TTL_RUNTIME_CONFLICTING_FLAG/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),F05_PRIORITY_TTL_EXTERNAL_CALLS:'on'}),
  /PRIORITY_TTL_RUNTIME_CONFLICTING_FLAG/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),
  F05_CATALOG_DATABASE_URL:'postgres://user:pass@example.com:5432/f05_catalog_test'}),
  /CATALOG_DATABASE_NOT_ISOLATED/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),F05_PRIORITY_TTL_BATCH_LIMIT:'26'}),
  /F05_PRIORITY_TTL_BATCH_LIMIT_INVALID/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),F05_PRIORITY_TTL_POLL_INTERVAL_MS:'10'}),
  /F05_PRIORITY_TTL_POLL_INTERVAL_MS_INVALID/);
 assert.throws(()=>validatePriorityTtlSchedulerEnv({...validEnv(),
  F05_PRIORITY_TTL_BACKOFF_BASE_MS:'2000',F05_PRIORITY_TTL_BACKOFF_MAX_MS:'1000'}),
  /PRIORITY_TTL_BACKOFF_RANGE_INVALID/);
});

await test('空队列轮询有休眠且每个 tick 严格串行',async()=>{
 const controller=new AbortController();
 const delays=[],logs=[];
 let calls=0,active=0,maxActive=0;
 const config={...validatePriorityTtlSchedulerEnv(validEnv()),pollIntervalMs:100,maxRuntimeMs:5000};
 const worker={async runDue({limit}){
  assert.equal(limit,10);
  active++;maxActive=Math.max(maxActive,active);
  await new Promise(resolve=>setTimeout(resolve,5));
  active--;calls++;
  if(calls===3)controller.abort();
  return result();
 }};
 const out=await runPriorityTtlScheduler({worker,config,signal:controller.signal,
  logger:event=>logs.push(event),sleep:async ms=>{delays.push(ms);}});
 assert.equal(out.reason,'signal');
 assert.equal(calls,3);
 assert.equal(maxActive,1);
 assert.deepEqual(delays,[100,100]);
 assert.equal(logs.filter(event=>event.event==='tick_completed').length,3);
 assert.ok(logs.every(event=>!Object.hasOwn(event,'connectionString')));
});

await test('数据库故障采用有界指数退避且日志只保留稳定错误码',async()=>{
 const controller=new AbortController();
 const delays=[],logs=[];
 let calls=0;
 const config={...validatePriorityTtlSchedulerEnv(validEnv()),pollIntervalMs:100,
  maxRuntimeMs:5000,backoffBaseMs:100,backoffMaxMs:250};
 const worker={async runDue(){
  calls++;
  if(calls<3)throw Error('TEMPORARY_DB_FAILURE');
  controller.abort();
  return result();
 }};
 await runPriorityTtlScheduler({worker,config,signal:controller.signal,
  logger:event=>logs.push(event),sleep:async ms=>{delays.push(ms);}});
 assert.equal(calls,3);
 assert.deepEqual(delays,[100,200]);
 assert.deepEqual(logs.filter(event=>event.event==='tick_failed').map(event=>event.errorCode),
  ['TEMPORARY_DB_FAILURE','TEMPORARY_DB_FAILURE']);
 assert.ok(logs.every(event=>!Object.hasOwn(event,'customerId')));
});

await test('最大运行时长限制最后一次休眠且不超过批次边界',async()=>{
 const config={...validatePriorityTtlSchedulerEnv(validEnv()),pollIntervalMs:100,maxRuntimeMs:250};
 let clock=0,calls=0;
 const out=await runPriorityTtlScheduler({
  worker:{async runDue({limit}){assert.equal(limit,10);calls++;return result();}},
  config,logger:()=>{},now:()=>clock,sleep:async ms=>{clock+=ms;}
 });
 assert.equal(out.reason,'max_runtime');
 assert.equal(out.ticks,3);
 assert.equal(calls,3);
 assert.equal(clock,250);
});

await test('慢 worker 超过 tick 截止后本轮退出并保留租约恢复约定',async()=>{
 const config={...validatePriorityTtlSchedulerEnv(validEnv()),pollIntervalMs:10,maxRuntimeMs:35};
 const logs=[];
 let workerFinished=false;
 const started=Date.now();
 const out=await runPriorityTtlScheduler({
  worker:{async runDue(){
   await new Promise(resolve=>setTimeout(resolve,180));
   workerFinished=true;
   return result({claimed:1,done:1});
  }},
  config,logger:event=>logs.push(event)
 });
 const elapsed=Date.now()-started;
 assert.equal(out.reason,'tick_deadline_exceeded');
 assert.equal(out.totalClaimed,0,'a timed-out tick is not counted as completed');
 assert.ok(elapsed<140,'scheduler should respect the tick deadline; elapsed='+elapsed);
 assert.ok(logs.some(event=>event.event==='tick_deadline_exceeded'&&
  event.errorCode==='PRIORITY_TTL_TICK_DEADLINE_EXCEEDED'&&
  event.leaseRecovery==='PERSISTED_POSTGRESQL_LEASE'));
 await new Promise(resolve=>setTimeout(resolve,190));
 assert.equal(workerFinished,true,'the test worker deliberately finishes after the deadline');
});

await test('运行时数据库身份必须真实匹配 PG16 非超级用户',async()=>{
 const identity={db:'f05_catalog_test',role:'f05_catalog_ci',version:160000,superuser:false};
 assert.equal(await assertNonSuperuserPriorityCatalog({
  async query(){return {rows:[identity]};}
 }),true);
 await assert.rejects(assertNonSuperuserPriorityCatalog({
  async query(){return {rows:[{...identity,superuser:true}]};}
 }),/PRIORITY_TTL_DATABASE_SUPERUSER_DENIED/);
 await assert.rejects(assertNonSuperuserPriorityCatalog({
  async query(){return {rows:[{...identity,role:'postgres'}]};}
 }),/PRIORITY_TTL_PG16_IDENTITY_OR_SCHEMA_DENIED/);
 await assert.rejects(assertNonSuperuserPriorityCatalog({
  async query(){return {rows:[{...identity,version:150000}]};}
 }),/PRIORITY_TTL_PG16_IDENTITY_OR_SCHEMA_DENIED/);
});
