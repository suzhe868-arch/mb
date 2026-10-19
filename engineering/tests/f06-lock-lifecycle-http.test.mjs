import test from 'node:test';import assert from 'node:assert/strict';import {createServer} from 'node:http';import {createIsolatedF06LockLifecycleHandler} from '../src/f06-lock-lifecycle-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',F06_LOCK_LIFECYCLE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY'},token='A'.repeat(43),key='x'.repeat(24),expiry='2030-01-01T00:00:00.000Z',body={action:'extend',idempotencyKey:key,reason:'confirmed',newExpiresAt:expiry};
function handler(s={act:async()=>({status:200,body:{code:'LOCK_EXTENDED'}})},e=env){return createIsolatedF06LockLifecycleHandler({service:s,env:e})}
async function request(h,{path='/api/v1/locks/9/actions',method='POST',bodyValue=body,headers={},auth=true,contentType='application/json'}={}){const server=createServer(async(req,res)=>{if(await h(req,res)!==true){res.writeHead(404);res.end('{}')}});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)});try{const init={method,headers:{...(auth?{authorization:'Bearer '+token}:{}),...(method==='POST'?{'content-type':contentType}:{}),...headers}};if(method==='POST')init.body=typeof bodyValue==='string'?bodyValue:JSON.stringify(bodyValue);const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,init);return {status:r.status,body:await r.json()}}finally{await new Promise(r=>server.close(r))}}
test('生产环境拒绝创建生命周期HTTP入口',()=>assert.throws(()=>createIsolatedF06LockLifecycleHandler({service:{act:async()=>({})},env:{...env,APP_ENV:'production'}}),/TEST_ONLY/));
test('没有生命周期服务不能启动',()=>assert.throws(()=>createIsolatedF06LockLifecycleHandler({env,service:{}}),/DEPENDENCIES/));
test('有效延期HTTP只传服务端身份和白名单字段',async()=>{let captured;const r=await request(handler({act:async a=>(captured=a,{status:200,body:{code:'LOCK_EXTENDED'}})}));assert.equal(r.status,200);assert.deepEqual(captured,{token,lockId:'9',action:'extend',idempotencyKey:key,reason:'confirmed',newExpiresAt:expiry})});
test('HTTP拒绝GET',async()=>assert.equal((await request(handler(),{method:'GET'})).status,405));
test('HTTP拒绝员工ID伪造字段',async()=>assert.equal((await request(handler(),{bodyValue:{...body,employeeId:'7'}})).status,400));
test('HTTP拒绝客户ID伪造字段',async()=>assert.equal((await request(handler(),{bodyValue:{...body,customerId:'7'}})).status,400));
test('HTTP拒绝客户端角色头',async()=>assert.equal((await request(handler(),{headers:{'x-role':'store_head'}})).status,403));
test('HTTP拒绝转发头',async()=>assert.equal((await request(handler(),{headers:{'x-forwarded-for':'127.0.0.1'}})).status,403));
test('HTTP拒绝Cookie旁路',async()=>assert.equal((await request(handler(),{headers:{cookie:'session=trusted'}})).status,403));
test('HTTP拒绝缺失Bearer',async()=>assert.equal((await request(handler(),{auth:false})).status,401));
test('HTTP拒绝非法Bearer',async()=>assert.equal((await request(handler(),{headers:{authorization:'Bearer nope'}})).status,401));
test('HTTP拒绝错误Content-Type',async()=>assert.equal((await request(handler(),{contentType:'text/plain'})).status,400));
test('HTTP拒绝release夹带延期字段',async()=>assert.equal((await request(handler(),{bodyValue:{action:'release',idempotencyKey:key,reason:'confirmed',newExpiresAt:expiry}})).status,400));
test('HTTP拒绝缺少原因',async()=>assert.equal((await request(handler(),{bodyValue:{...body,reason:' '}})).status,400));
test('HTTP拒绝查询参数绕过',async()=>assert.equal((await request(handler(),{path:'/api/v1/locks/9/actions?admin=1'})).status,404));
test('系统到期不是公开HTTP路由',async()=>assert.equal((await request(handler(),{path:'/api/v1/locks/9/expire'})).status,404));
test('无生命周期许可时不调用服务',async()=>{let called=false;const r=await request(handler({act:async()=>{called=true;return {status:200,body:{code:'BAD'}}}),{...env,F06_LOCK_LIFECYCLE_TEST_CONSENT:undefined});assert.equal(r.status,403);assert.equal(called,false)});
test('服务异常返回通用503',async()=>{const r=await request(handler({act:async()=>{throw Error('postgres secret')}}));assert.equal(r.status,503);assert.doesNotMatch(JSON.stringify(r.body),/postgres secret/)});
test('异常服务结构不能伪装成功',async()=>assert.equal((await request(handler({act:async()=>({status:200,body:{message:'fake'}})))).status,503));
test('非生命周期路由交由上层处理',async()=>{const h=handler(),server=createServer(async(req,res)=>{const x=await h(req,res);res.writeHead(x?200:204);res.end('{}')});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/v1/lock-requests`)).status,204)}finally{await new Promise(r=>server.close(r))}});
