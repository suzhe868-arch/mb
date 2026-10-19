import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test'};
const token='A'.repeat(43),key='x'.repeat(24);
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160015,superuser:false,createdb:false,
 sessions:true,employees:true,requests:true,locks:true,waitlists:true,vehicles:true,public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,signed_ledger_rows:24,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
function fakePool({throwQuery=null}={}){
 const commands=[];
 const client={async query(sql,params=[]){
  commands.push(sql);
  if(throwQuery&&String(sql).includes(throwQuery))throw Error('RAW_DATABASE_SECRET');
  if(String(sql).includes('current_database()'))return {rows:[ready]};
  return {rows:[]};
 },release(){commands.push('RELEASE')}};
 return {commands,connect:async()=>client,query:client.query.bind(client)};
}
test('没有明确隔离 PostgreSQL 数据库配置，服务创建直接拒绝',()=>{
 assert.throws(()=>createIsolatedF06LockService({pool:fakePool(),env:{...env,F06_LOCK_DATABASE_URL:'postgres://postgres:bad@127.0.0.1:5432/production'}}),/F06_LOCK/);
});
test('非法客户令牌不得建立任何事务',async()=>{
 const p=fakePool();const service=createIsolatedF06LockService({pool:p,env});
 assert.equal((await service.intake({token:'fake',vehicleId:'1',listingCycleId:'1',idempotencyKey:key})).status,401);
 assert.equal(p.commands.length,0);
});
test('不可用的真实 Customer 测试会话硬拒，且进行真实数据库元数据验证',async()=>{
 const p=fakePool();const service=createIsolatedF06LockService({pool:p,env});
 const r=await service.intake({token,vehicleId:'1',listingCycleId:'1',idempotencyKey:key});
 assert.equal(r.status,401);
 assert.ok(p.commands.some(x=>String(x).includes('current_database()')));
 assert.ok(p.commands.includes('COMMIT'));
});
test('不可信 Employee 测试会话在事务内拒绝，且不会写锁车',async()=>{
 const p=fakePool();const service=createIsolatedF06LockService({pool:p,env});
 const r=await service.decide({token,requestId:'1',decision:'approve',idempotencyKey:key});
 assert.equal(r.status,403);
 assert.ok(!p.commands.some(x=>String(x).includes('INSERT INTO public.locks')));
});
test('数据库异常必须 ROLLBACK 和 release，不能吞掉',async()=>{
 const p=fakePool({throwQuery:'FROM f06_real_lock_test.customer_sessions'});
 const service=createIsolatedF06LockService({pool:p,env});
 await assert.rejects(()=>service.intake({token,vehicleId:'1',listingCycleId:'1',idempotencyKey:key}),/RAW_DATABASE_SECRET/);
 assert.ok(p.commands.includes('ROLLBACK'));
 assert.ok(p.commands.includes('RELEASE'));
});