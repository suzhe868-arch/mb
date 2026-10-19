import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createIsolatedF06LockLifecycleHandler} from '../src/f06-lock-lifecycle-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',F06_LOCK_LIFECYCLE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY'};
const token='A'.repeat(43),key='x'.repeat(24),expiry='2030-01-01T00:00:00.000Z',body={action:'extend',idempotencyKey:key,reason:'confirmed',newExpiresAt:expiry};
const handler=(service={act:async()=>({status:200,body:{code:'LOCK_EXTENDED',lockId:'9'}})},e=env)=>createIsolatedF06LockLifecycleHandler({service,env:e});
async function request(h,{path='/api/v1/locks/9/actions',method='POST',bodyValue=body,headers={},auth=true,contentType='application/json'}={}){
 const server=createServer(async(req,res)=>{if(await h(req,res)!==true){res.writeHead(404);res.end('{}')}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 try{const init={method,headers:{...(auth?{authorization:'Bearer '+token}:{}),...(method==='POST'?{'content-type':contentType}:{}),...headers}};if(method==='POST')init.body=typeof bodyValue==='string'?bodyValue:JSON.stringify(bodyValue);const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,init);return {status:r.status,body:await r.json()}}
 finally{await new Promise(resolve=>server.close(resolve))}
}
test('生产环境拒绝创建生命周期HTTP入口',()=>assert.throws(()=>createIsolatedF06LockLifecycleHandler({service:{act:async()=>({})},env:{...env,APP_ENV:'production'}}),/TEST_ONLY/));
test('缺少服务依赖时拒绝启动',()=>assert.throws(()=>createIsolatedF06LockLifecycleHandler({service:{},env}),/DEPENDENCIES/));
test('有效延期HTTP只传服务端身份和白名单字段',async()=>{let got;const r=await request(handler({act:async a=>(got=a,{status:200,body:{code:'LOCK_EXTENDED',lockId:'9'}})}));assert.equal(r.status,200);assert.deepEqual(got,{token,lockId:'9',action:'extend',idempotencyKey:key,reason:'confirmed',newExpiresAt:expiry})});
test('拒绝GET人工变更',async()=>assert.equal((await request(handler(),{method:'GET'})).status,405));
test('拒绝员工ID伪造字段',async()=>assert.equal((await request(handler(),{bodyValue:{...body,employeeId:'7'}})).status,400));
test('拒绝客户ID伪造字段',async()=>assert.equal((await request(handler(),{bodyValue:{...body,customerId:'7'}})).status,400));
test('拒绝x-role头',async()=>assert.equal((await request(handler(),{headers:{'x-role':'store_head'}})).status,403));
test('拒绝转发头',async()=>assert.equal((await request(handler(),{headers:{'x-forwarded-for':'127.0.0.1'}})).status,403));
test('拒绝Cookie身份旁路',async()=>assert.equal((await request(handler(),{headers:{cookie:'session=trusted'}})).status,403));
test('拒绝缺失Bearer身份',async()=>assert.equal((await request(handler(),{auth:false})).status,401));
test('拒绝非法Bearer身份',async()=>assert.equal((await request(handler(),{headers:{authorization:'Bearer nope'}})).status,401));
test('拒绝不正确Content-Type',async()=>assert.equal((await request(handler(),{contentType:'text/plain'})).status,400));
test('拒绝release夹带延期时间',async()=>assert.equal((await request(handler(),{bodyValue:{action:'release',idempotencyKey:key,reason:'confirmed',newExpiresAt:expiry}})).status,400));
test('拒绝缺少原因',async()=>assert.equal((await request(handler(),{bodyValue:{...body,reason:' '}})).status,400));
test('拒绝查询参数旁路',async()=>assert.equal((await request(handler(),{path:'/api/v1/locks/9/actions?admin=1'})).status,404));
test('系统到期不是公开HTTP路由',async()=>assert.equal((await request(handler(),{path:'/api/v1/locks/9/expire'})).status,404));
test('缺少生命周期测试授权时不调用服务',async()=>{let called=false;const r=await request(handler({act:async()=>{called=true;return {status:200,body:{code:'BAD'}}}},{...env,F06_LOCK_LIFECYCLE_TEST_CONSENT:undefined}));assert.equal(r.status,403);assert.equal(called,false)});
test('服务异常返回通用503且不泄露内部异常',async()=>{const r=await request(handler({act:async()=>{throw Error('postgres secret connection string')}}));assert.equal(r.status,503);assert.doesNotMatch(JSON.stringify(r.body),/postgres secret/)});
test('异常服务响应结构不能伪装为成功',async()=>{
 const h=handler({act:async()=>({status:200,body:{message:'fake'}})});
 const r=await request(h);
 assert.equal(r.status,503);
});
test('非生命周期路由交由上层处理',async()=>{const h=handler(),s=createServer(async(req,res)=>{const yes=await h(req,res);res.writeHead(yes?200:204);res.end('{}')});await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));try{assert.equal((await fetch(`http://127.0.0.1:${s.address().port}/api/v1/lock-requests`)).status,204)}finally{await new Promise(resolve=>s.close(resolve))}});
