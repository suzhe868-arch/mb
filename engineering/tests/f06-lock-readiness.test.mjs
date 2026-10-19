import test from 'node:test';
import assert from 'node:assert/strict';
import {assertF06TestEnvironment,verifyF06TestDatabase} from '../src/f06-lock-readiness.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test'};
test('标准隔离 PostgreSQL16 连接参数被接受',()=>assert.equal(assertF06TestEnvironment(env).connectionString,env.F06_LOCK_DATABASE_URL));
for(const [field,value] of [['APP_ENV','production'],['NODE_ENV','production'],['API_HOST','0.0.0.0'],['F06_LOCK_TEST_CONSENT',''],
 ['F06_LOCK_DATABASE_URL','postgres://f06_lock_ci:pw@8.8.8.8:5432/f06_lock_test'],
 ['F06_LOCK_DATABASE_URL','postgres://postgres:pw@127.0.0.1:5432/f06_lock_test'],
 ['F06_LOCK_DATABASE_URL','postgres://f06_lock_ci:pw@127.0.0.1:5432/production'],
 ['F06_LOCK_DATABASE_URL','postgres://f06_lock_ci:pw@127.0.0.1:5432/f06_lock_test?sslmode=disable']]){
 test('拒绝非法测试启动参数 '+field+'='+value,()=>assert.throws(()=>assertF06TestEnvironment({...env,[field]:value}),/F06_LOCK/));
}
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160015,superuser:false,createdb:false,sessions:true,employees:true,requests:true,locks:true,waitlists:true,vehicles:true,public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
test('隔离真实形状经 PG16 元数据检验通过',async()=>assert.equal(await verifyF06TestDatabase({query:async()=>({rows:[ready]})}),true));
test('PostgreSQL 17 不得冒充 PG16',async()=>await assert.rejects(()=>verifyF06TestDatabase({query:async()=>({rows:[{...ready,version:170000}]})}),/SHAPE/));
test('伪造 schema 列表不能启动',async()=>await assert.rejects(()=>verifyF06TestDatabase({query:async()=>({rows:[{...ready,locks:false}]})}),/SHAPE/));
test('其他数据库角色不能启动',async()=>await assert.rejects(()=>verifyF06TestDatabase({query:async()=>({rows:[{...ready,role:'postgres'}]})}),/SHAPE/));