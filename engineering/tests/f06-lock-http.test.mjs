import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createIsolatedF06LockHandler} from '../src/f06-lock-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'};
const token='A'.repeat(43);
const requestBody={vehicleId:'1',listingCycleId:'2',idempotencyKey:'x'.repeat(24)};
function service(){return {intake:async()=>({status:201,body:{code:'PENDING',requestId:'3'}}),decide:async()=>({status:200,body:{code:'APPROVED'}})}};
function handler(svc=service()){return createIsolatedF06LockHandler({env,service:svc})}
async function request(h,{path='/api/v1/lock-requests',method='POST',body=requestBody,headers={},auth=true}={}){
 const server=createServer(async(req,res)=>{if(await h(req,res)!==true){res.writeHead(404);res.end('{}')}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 try{
  const json=typeof body==='string'?body:JSON.stringify(body);
  const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method,
   headers:{...(auth?{authorization:'Bearer '+token}:{}),'content-type':'application/json',...headers},
   body:method==='POST'?json:undefined});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(resolve=>server.close(resolve))}
}
test('正式生产环境不能创建 F06 测试入口',()=>assert.throws(()=>createIsolatedF06LockHandler({env:{...env,APP_ENV:'production'},service:service()}),/F06_LOCK_TEST_ONLY/));
test('无完整服务拒绝启动',()=>assert.throws(()=>createIsolatedF06LockHandler({env,service:{}}),/DEPENDENCIES/));
test('客户申请仅将 token 和合法字段传给事务服务，不允许客户端提供身份',async()=>{
 let captured; const h=handler({intake:async arg=>(captured=arg,{status:201,body:{code:'PENDING'}}),decide:async()=>({status:500,body:{code:'BAD'}})});
 const r=await request(h);assert.equal(r.status,201);assert.deepEqual(captured,{token,vehicleId:'1',listingCycleId:'2',idempotencyKey:'x'.repeat(24)});
});
test('员工审批合法路由，仅传 token 与服务器验证后的字段',async()=>{
 let captured;const h=handler({intake:async()=>({status:500,body:{code:'BAD'}}),decide:async arg=>(captured=arg,{status:200,body:{code:'OK'}})});
 const r=await request(h,{path:'/api/v1/lock-requests/9/decision',body:{decision:'approve',idempotencyKey:'x'.repeat(24)}});
 assert.equal(r.status,200);assert.deepEqual(captured,{token,requestId:'9',decision:'approve',idempotencyKey:'x'.repeat(24)});
});
test('拒绝员工 ID 从请求正文冒充',async()=>{
 const r=await request(handler(),{path:'/api/v1/lock-requests/9/decision',body:{decision:'approve',employeeId:'1',idempotencyKey:'x'.repeat(24)}});
 assert.equal(r.status,400);
});
test('拒绝客户 ID 从正文冒充',async()=>{
 const r=await request(handler(),{body:{...requestBody,customerId:'1'}});assert.equal(r.status,400);
});
test('拒绝 forwarded 请求头',async()=>{const r=await request(handler(),{headers:{'x-forwarded-for':'8.8.8.8'}});assert.equal(r.status,403)});
test('拒绝客户端 x-role 头',async()=>{const r=await request(handler(),{headers:{'x-role':'store_head'}});assert.equal(r.status,403)});
test('拒绝缺失 bearer 身份',async()=>{const r=await request(handler(),{auth:false});assert.equal(r.status,401)});
test('拒绝非法 Authorization',async()=>{const r=await request(handler(),{headers:{authorization:'Bearer rubbish'}});assert.equal(r.status,401)});
test('拒绝 SQL 注入型 ID',async()=>{const r=await request(handler(),{body:{...requestBody,vehicleId:'1 OR 1=1'}});assert.equal(r.status,400)});
test('拒绝巨大 ID',async()=>{const r=await request(handler(),{body:{...requestBody,listingCycleId:'9223372036854775808'}});assert.equal(r.status,400)});
test('拒绝非法请求路径',async()=>{const r=await request(handler(),{path:'/api/v1/lock-requests/1%2Fdecision',body:{decision:'approve',idempotencyKey:'x'.repeat(24)}});assert.equal(r.status,404)});
test('拒绝 query 参数旁路',async()=>{const r=await request(handler(),{path:'/api/v1/lock-requests?admin=1'});assert.equal(r.status,404)});
test('拒绝不支持的动作',async()=>{const r=await request(handler(),{method:'GET'});assert.equal(r.status,405)});
test('数据库错误不能暴露 SQL',async()=>{
 const h=handler({intake:async()=>{throw Error('SELECT secret_password')},decide:async()=>{throw Error('SELECT secret_password')}});
 const r=await request(h);assert.equal(r.status,503);assert.equal(r.body.code,'LOCK_SERVICE_UNAVAILABLE');
 assert.doesNotMatch(JSON.stringify(r.body),/secret_password/);
});
test('服务不能产生伪造结构响应',async()=>{
 const h=handler({intake:async()=>({status:200,body:{message:'fake'}}),decide:async()=>({status:200,body:{code:'OK'}})});
 const r=await request(h);assert.equal(r.status,503);
});
test('Customer own Lock status uses only trusted GET bearer and returns safe projection',async()=>{
 let captured;const h=handler({intake:async()=>({status:503,body:{code:'BAD'}}),decide:async()=>({status:503,body:{code:'BAD'}}),
  project:async arg=>(captured=arg,{status:200,body:{code:'LOCK_CUSTOMER_SAFE_STATUS',lockStatus:'locked',ownLock:true}})});
 const r=await request(h,{path:'/api/v1/lock-requests/9/status',method:'GET'});
 assert.equal(r.status,200);assert.deepEqual(captured,{token,requestId:'9'});
 assert.equal(r.body.lockStatus,'locked');assert.equal(r.body.ownLock,true);
 assert.doesNotMatch(JSON.stringify(r.body),/approver|customerId|price|amount|employee/i);
});
test('Customer status endpoint is not a POST and refuses absent projection service',async()=>{
 const h=handler();
 const refused=await request(h,{path:'/api/v1/lock-requests/9/status',method:'POST'});
 assert.equal(refused.status,405);
 const unavailable=await request(h,{path:'/api/v1/lock-requests/9/status',method:'GET'});
 assert.equal(unavailable.status,503);
});
