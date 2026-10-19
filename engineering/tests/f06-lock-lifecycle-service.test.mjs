import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsolatedF06LockLifecycleService} from '../src/f06-lock-lifecycle-service.mjs';
import {createDisposableF06FinanceProofAdapter} from '../src/f06-lock-lifecycle-finance-test-adapter.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:f06_ci_synthetic_only@127.0.0.1:5432/f06_lock_test',
 F06_LOCK_LIFECYCLE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY',
 F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY'};
const token='A'.repeat(43),key='x'.repeat(24),reason='confirmed';
function fakePool(){const commands=[];const client={async query(sql){commands.push(String(sql));return {rows:[]}},release(){commands.push('RELEASE')}};return {commands,connect:async()=>client,query:client.query.bind(client)}}
test('生产环境不能创建真实Lock生命周期测试服务',()=>assert.throws(()=>createIsolatedF06LockLifecycleService({pool:fakePool(),env:{...env,APP_ENV:'production'}}),/F06_LOCK/));
test('没有生命周期明确测试授权时硬拒绝且不启动事务',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env:{...env,F06_LOCK_LIFECYCLE_TEST_CONSENT:undefined}});const r=await s.act({token,lockId:'1',action:'release',idempotencyKey:key,reason});assert.equal(r.status,403);assert.equal(r.body.code,'LOCK_LIFECYCLE_TEST_CONSENT_REQUIRED');assert.equal(p.commands.length,0)});
test('无效Lock ID和非法动作在连接数据库前拒绝',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env});const r=await s.act({token,lockId:'0 OR 1=1',action:'release',idempotencyKey:key,reason});assert.equal(r.status,400);assert.equal(r.body.code,'INVALID_LOCK_LIFECYCLE_ACTION');assert.equal(p.commands.length,0)});
test('人工动作缺少原因必须拒绝',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env});const r=await s.act({token,lockId:'1',action:'release',idempotencyKey:key,reason:' '});assert.equal(r.status,400);assert.equal(p.commands.length,0)});
test('延期必须使用规范UTC毫秒时间',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env});const r=await s.act({token,lockId:'1',action:'extend',idempotencyKey:key,reason,newExpiresAt:'2030-01-01'});assert.equal(r.status,400);assert.equal(p.commands.length,0)});
test('release/cancel不能夹带延期字段',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env});const r=await s.act({token,lockId:'1',action:'cancel',idempotencyKey:key,reason,newExpiresAt:'2030-01-01T00:00:00.000Z'});assert.equal(r.status,400);assert.equal(p.commands.length,0)});
test('系统到期必须具备独立授权',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env:{...env,F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:undefined}});const r=await s.expireOrdinary({lockId:'1'});assert.equal(r.status,403);assert.equal(r.body.code,'LOCK_SYSTEM_EXPIRY_TEST_CONSENT_REQUIRED');assert.equal(p.commands.length,0)});
test('客户端提供伪造system proof不能授权到期',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env:{...env,F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:undefined}});const r=await s.expireOrdinary({lockId:'1',systemProof:'forged'});assert.equal(r.status,403);assert.equal(p.commands.length,0)});
test('故障注入必须额外显式授权',()=>assert.throws(()=>createIsolatedF06LockLifecycleService({pool:fakePool(),env,afterMutationWrite:async()=>{}}),/FAULT_INJECTION/));
test('财务proof适配器没有生命周期授权时拒绝构造',()=>assert.throws(()=>createDisposableF06FinanceProofAdapter({pool:fakePool(),env:{...env,F06_LOCK_LIFECYCLE_TEST_CONSENT:undefined}}),/CONSENT_REQUIRED/));
test('财务proof适配器拒绝非法proof kind且不触碰数据库',async()=>{const p=fakePool(),a=createDisposableF06FinanceProofAdapter({pool:p,env});await assert.rejects(()=>a.issue({lockId:'1',kind:'maybe'}),/INVALID_SYNTHETIC_FINANCE_PROOF/);assert.equal(p.commands.length,0)});
test('未授权响应不泄露token或数据库连接串',async()=>{const p=fakePool(),s=createIsolatedF06LockLifecycleService({pool:p,env:{...env,F06_LOCK_LIFECYCLE_TEST_CONSENT:undefined}});const r=await s.act({token,lockId:'1',action:'release',idempotencyKey:key,reason});assert.doesNotMatch(JSON.stringify(r),new RegExp(token));assert.doesNotMatch(JSON.stringify(r),/postgres:\/\//)});
