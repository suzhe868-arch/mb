import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {assertMatchingRetryEmployeeCredential,assertNonSuperuserCatalogRole,runMatchingRetryScheduler,validateMatchingRetrySchedulerEnv} from '../scheduler.mjs';

function validEnv(){
 return {
  APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
  F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY',
  F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:disposable_f05_ci_only@127.0.0.1:5432/f05_catalog_test',
  F05_MATCHING_RETRY_CREDENTIAL:randomBytes(32).toString('base64url')
 };
}

await test('仅接受 loopback、test 环境、隔离 PG16 目标和有效测试员工凭证',async()=>{
 const config=validateMatchingRetrySchedulerEnv(validEnv());
 assert.equal(config.maxConcurrentTicks,1);
 assert.equal(config.batchLimit,10);
 const target=new URL(config.connectionString);
 assert.equal(target.hostname,'127.0.0.1');
 assert.equal(target.pathname,'/f05_catalog_test');
 assert.equal(target.username,'f05_catalog_ci');
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),APP_ENV:'production'}),/MATCH_RETRY_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),NODE_ENV:'production'}),/MATCH_RETRY_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),API_HOST:'0.0.0.0'}),/MATCH_RETRY_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_CATALOG_TEST_CONSENT:''}),/MATCH_RETRY_SCHEDULER_TEST_ONLY_REQUIRED/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_MATCHING_RETRY_CREDENTIAL:''}),/MATCH_RETRY_EMPLOYEE_CREDENTIAL_REQUIRED/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_MATCHING_RETRY_PRODUCTION:'true'}),/MATCH_RETRY_RUNTIME_CONFLICTING_FLAG/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_CATALOG_DATABASE_URL:'postgres://user:pass@example.com:5432/f05_catalog_test'}),/CATALOG_DATABASE_NOT_ISOLATED/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_MATCHING_RETRY_BATCH_LIMIT:'50'}),/F05_MATCHING_RETRY_BATCH_LIMIT_INVALID/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_MATCHING_RETRY_POLL_INTERVAL_MS:'10'}),/F05_MATCHING_RETRY_POLL_INTERVAL_MS_INVALID/);
 assert.throws(()=>validateMatchingRetrySchedulerEnv({...validEnv(),F05_MATCHING_RETRY_BACKOFF_BASE_MS:'2000',F05_MATCHING_RETRY_BACKOFF_MAX_MS:'1000'}),/MATCH_RETRY_BACKOFF_RANGE_INVALID/);
});

await test('idle queue 使用固定轮询间隔且每个 tick 串行执行',async()=>{
 const controller=new AbortController();
 const delays=[],logs=[];
 let calls=0,active=0,maxActive=0;
 const config={...validateMatchingRetrySchedulerEnv(validEnv()),pollIntervalMs:100,maxRuntimeMs:5000};
 const worker={async runOnce(){
  active++;maxActive=Math.max(maxActive,active);
  await new Promise(resolve=>setTimeout(resolve,5));
  active--;calls++;
  if(calls===3)controller.abort();
  return {claimed:0,outcomes:[]};
 }};
 const result=await runMatchingRetryScheduler({
  worker,config,signal:controller.signal,logger:event=>logs.push(event),
  sleep:async ms=>{delays.push(ms);}
 });
 assert.equal(result.reason,'signal');
 assert.equal(calls,3);
 assert.equal(maxActive,1);
 assert.deepEqual(delays,[100,100]);
 assert.equal(logs.filter(event=>event.event==='tick_completed').length,3);
 assert.ok(logs.every(event=>!Object.hasOwn(event,'credential')));
});

await test('连续数据库故障采用有界指数退避并仅记录稳定错误码',async()=>{
 const controller=new AbortController();
 const delays=[],logs=[];
 let calls=0;
 const config={...validateMatchingRetrySchedulerEnv(validEnv()),pollIntervalMs:100,
  maxRuntimeMs:5000,backoffBaseMs:100,backoffMaxMs:250};
 const worker={async runOnce(){
  calls++;
  if(calls<3)throw Error('TEMPORARY_DB_FAILURE');
  controller.abort();
  return {claimed:0,outcomes:[]};
 }};
 await runMatchingRetryScheduler({worker,config,signal:controller.signal,
  logger:event=>logs.push(event),sleep:async ms=>{delays.push(ms);}});
 assert.equal(calls,3);
 assert.deepEqual(delays,[100,200]);
 assert.deepEqual(logs.filter(event=>event.event==='tick_failed').map(event=>event.errorCode),
  ['TEMPORARY_DB_FAILURE','TEMPORARY_DB_FAILURE']);
});

await test('最大运行时长有界，最后一次休眠不会越过期限',async()=>{
 const config={...validateMatchingRetrySchedulerEnv(validEnv()),pollIntervalMs:100,maxRuntimeMs:250};
 let clock=0,calls=0;
 const result=await runMatchingRetryScheduler({
  worker:{async runOnce(){calls++;return {claimed:0,outcomes:[]};}},
  config,logger:()=>{},now:()=>clock,
  sleep:async ms=>{clock+=ms;}
 });
 assert.equal(result.reason,'max_runtime');
 assert.equal(result.ticks,3);
 assert.equal(calls,3);
 assert.equal(clock,250);
});

await test('运行时数据库身份必须是指定 PG16 非超级用户',async()=>{
 const identity={db:'f05_catalog_test',role:'f05_catalog_ci',version:160000,superuser:false};
 assert.equal(await assertNonSuperuserCatalogRole({
  async query(){return {rows:[identity]};}
 }),true);
 await assert.rejects(assertNonSuperuserCatalogRole({
  async query(){return {rows:[{...identity,superuser:true}]};}
 }),/MATCH_RETRY_DATABASE_SUPERUSER_DENIED/);
 await assert.rejects(assertNonSuperuserCatalogRole({
  async query(){return {rows:[{...identity,role:'postgres'}]};}
 }),/MATCH_RETRY_PG16_IDENTITY_OR_SCHEMA_DENIED/);
});

await test('凭证验证只查询哈希且拒绝不存在或不合格的会话',async()=>{
 const credential=randomBytes(32).toString('base64url');
 let captured;
 await assert.rejects(assertMatchingRetryEmployeeCredential({
  async query(sql,params){
   captured={sql,params};
   return {rows:[{valid:false}]};
  }
 },credential),/MATCH_RETRY_EMPLOYEE_CREDENTIAL_INVALID/);
 assert.match(captured.sql,/issuer='DISPOSABLE_TEST_ONLY'/);
 assert.match(captured.sql,/revoked_at IS NULL/);
 assert.match(captured.sql,/expires_at>statement_timestamp\(\)/);
 assert.match(captured.sql,/employment_status='active'/);
 assert.match(captured.sql,/role_code IN \('sales','manager','store_head'\)/);
 assert.equal(captured.params.length,1);
 assert.equal(captured.params[0].length,64);
 assert.notEqual(captured.params[0],credential);
});

await test('慢 worker 超过 tick deadline 后调度器立即结束该回合',async()=>{
 const config={...validateMatchingRetrySchedulerEnv(validEnv()),maxRuntimeMs:35,pollIntervalMs:10};
 const logs=[];
 let workerFinished=false;
 const started=Date.now();
 const result=await runMatchingRetryScheduler({
  worker:{async runOnce(){
   await new Promise(resolve=>setTimeout(resolve,180));
   workerFinished=true;
   return {claimed:1,outcomes:[{outcome:'done'}]};
  }},
  config,logger:event=>logs.push(event)
 });
 const elapsed=Date.now()-started;
 assert.equal(result.reason,'tick_deadline_exceeded');
 assert.equal(result.totalClaimed,0,'a timed-out tick must not be counted as completed');
 assert.ok(elapsed<140,'deadline should stop scheduler promptly; elapsed='+elapsed+'ms');
 assert.ok(logs.some(event=>event.event==='tick_deadline_exceeded'&&
  event.errorCode==='MATCH_RETRY_TICK_DEADLINE_EXCEEDED'&&
  event.leaseRecovery==='PERSISTED_POSTGRESQL_LEASE'));
 await new Promise(resolve=>setTimeout(resolve,190));
 assert.equal(workerFinished,true,'the test worker deliberately completes later to model an overrun');
});

