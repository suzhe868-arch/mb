import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {pool,bootstrap,reset,seed,sign,callbackBody} from '../contract.mjs';
import {startServer} from '../server.mjs';
let server,port;
before(async()=>{await bootstrap();({server,port}=await startServer());});
after(async()=>{server?.close();await pool.end();});
async function request(path,body,headers={}){
 return new Promise((resolve,reject)=>{
  const isPost=body!==undefined;
  const req=https.request({hostname:'127.0.0.1',port,path,method:isPost?'POST':'GET',
   rejectUnauthorized:false,headers:{'content-type':'application/json',...headers}},res=>{
   let raw='';res.on('data',x=>raw+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(raw),raw}));
  });req.on('error',reject);req.end(body);
 });
}
const employee=(body={session:'s-sale',vehicle:'v1',action:'read'})=>request('/employee/phone',JSON.stringify(body));
const callback=(raw,ts=String(Date.now()),signature=sign(raw,ts))=>request('/integration/collector/publisher-phone',raw,
 {'x-f07-timestamp':ts,'x-f07-signature':signature});
const resetCase=async()=>{await reset();await seed();};
const tests=[
 ['H01 未命中经TLS返回不可用并建任务',async()=>{const x=await employee();assert.equal(x.status,200);assert.equal(x.body.status,'PHONE_UNAVAILABLE');assert.equal(x.body.created,true);}],
 ['H02 合法合成Collector签名更新缓存',async()=>{const x=await employee(),r=await callback(callbackBody(x.body.request_id));assert.equal(r.status,200);assert.equal(r.body.status,'UPDATED');assert.equal((await employee()).body.phone,'TEST-123456');}],
 ['H03 伪造签名FailClosed',async()=>{const x=await employee(),raw=callbackBody(x.body.request_id),r=await callback(raw,String(Date.now()),'0'.repeat(64));assert.equal(r.status,400);assert.equal(r.body.error,'CALLBACK_SIGNATURE');}],
 ['H04 过期时间戳拒绝',async()=>{const x=await employee(),raw=callbackBody(x.body.request_id),ts=String(Date.now()-600000),r=await callback(raw,ts);assert.equal(r.body.error,'CALLBACK_EXPIRED');}],
 ['H05 不同publisher替换请求拒绝',async()=>{const x=await employee(),r=await callback(callbackBody(x.body.request_id,{upstream_publisher_id:'other_pub'}));assert.equal(r.status,400);assert.equal(r.body.error,'REQUEST_PUBLISHER_MISMATCH');}],
 ['H06 禁止原始JYT Token字段混入回传',async()=>{const x=await employee(),r=await callback(callbackBody(x.body.request_id,{jyt_token:'forbidden'}));assert.equal(r.status,400);assert.equal(r.body.error,'INVALID_CALLBACK');assert.equal(r.raw.includes('forbidden'),false);}],
 ['H07 4S和SystemAdmin业务权限拒绝',async()=>{for(const s of ['s-four_s','s-admin']){const r=await employee({session:s,vehicle:'v1',action:'read'});assert.equal(r.status,403);assert.equal(r.body.error,'CURRENT_PERMISSION_DENIED');}}],
 ['H08 旧会话权限撤销即刻拒绝',async()=>{await pool.query("UPDATE f07_phone.employees SET session_version=2 WHERE id='sale'");const r=await employee();assert.equal(r.status,403);}],
 ['H09 source_type切换后拒绝read/latest',async()=>{await pool.query("UPDATE f07_phone.vehicles SET source_type='mingbang' WHERE id='v1'");for(const a of ['read','latest'])assert.equal((await employee({session:'s-sale',vehicle:'v1',action:a})).status,403);}],
 ['H10 安全公开投影不含发布人电话',async()=>{const x=await employee();await callback(callbackBody(x.body.request_id));const r=await request('/public/vehicle/v1');assert.equal(r.status,200);assert.equal(JSON.stringify(r.body).includes('TEST-'),false);}],
 ['H11 TLS失败回传保留原缓存',async()=>{const x=await employee();await callback(callbackBody(x.body.request_id));const refresh=await employee({session:'s-sale',vehicle:'v1',action:'latest'});await callback(callbackBody(refresh.body.request_id,{phone:null,status:'unavailable'}));assert.equal((await employee()).body.phone,'TEST-123456');}],
 ['H12 非法HTTP路由404',async()=>{assert.equal((await request('/collector/phone','{}')).status,404);}],
 ['H13 非法JSON不泄漏',async()=>{const r=await request('/employee/phone','{bad');assert.equal(r.status,400);assert.equal(r.raw.includes('TEST-'),false);}],
 ['H14 同key异body返回409',async()=>{const x=await employee(),b=callbackBody(x.body.request_id);assert.equal((await callback(b)).status,200);const r=await callback(callbackBody(x.body.request_id,{phone:'TEST-111111'}));assert.equal(r.status,409);}],
 ['H15 公开响应不带鉴权秘密',async()=>{const r=await request('/public/vehicle/v1');assert.equal(r.raw.includes(process.env.F07_COLLECTOR_TEST_SECRET),false);}]
];
test('F07-1 loopback TLS HTTPS真实入口测试',async t=>{
 for(const [name,fn] of tests){await t.test(name,async()=>{await resetCase();await fn();});}
 console.log('F07_HTTPS_15_SECURITY_CASES_REAL_TLS');
});
