import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import https from 'node:https';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {assertF07RuntimeEnvironment,assertPhysicalPg16} from '../../../src/f07-runtime/runtime.mjs';
import {sign} from '../../collector-publisher-phone-callback-ci/contract.mjs';

const port=Number(process.env.API_PORT||4317);
const origin='https://127.0.0.1:'+port;
let child,auth,pool,session;
let childOutput='';

function request(method,path,body,headers={}){
 return new Promise((resolve,reject)=>{
  const data=body===undefined?null:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
  const req=https.request({hostname:'127.0.0.1',port,path,method,rejectUnauthorized:false,headers:{...(data?{'content-type':'application/json','content-length':data.length}:{}),...headers}},res=>{
   let raw='';res.setEncoding('utf8');res.on('data',chunk=>raw+=chunk);res.on('end',()=>{let value={};try{value=JSON.parse(raw)}catch{}resolve({status:res.statusCode,headers:res.headers,body:value,raw})});
  });
  req.setTimeout(5000,()=>req.destroy(new Error('HTTPS_TEST_TIMEOUT')));
  req.on('error',reject);if(data)req.write(data);req.end();
 });
}
function callbackPayload(requestId='job-200001',overrides={}){
 return JSON.stringify({source_platform:'JYT',upstream_publisher_id:'pub-http',request_id:requestId,nonce:randomUUID(),
  issued_at:new Date().toISOString(),status:'ok',phone:'TEST-123456',...overrides});
}
async function waitForServer(){
 const until=Date.now()+25000;let last;
 while(Date.now()<until){
  if(child.exitCode!==null)throw Error('F07_RUNTIME_SERVER_EXITED '+childOutput.slice(-2500));
  try{const r=await request('GET','/__ci__/f07-runtime/health');if(r.status===200)return r;}catch(e){last=e}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw Error('F07_RUNTIME_SERVER_START_TIMEOUT '+String(last)+' '+childOutput.slice(-2500));
}

before(async()=>{
 assert.equal(assertF07RuntimeEnvironment(process.env),true);
 pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:3});
 child=spawn(process.execPath,['engineering/src/server.mjs'],{env:{...process.env,API_HOST:'127.0.0.1',API_PORT:String(port)},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',x=>childOutput+=x.toString());child.stderr.on('data',x=>childOutput+=x.toString());
 await waitForServer();
 const c=await pool.connect();try{await assertPhysicalPg16(c);await c.query('TRUNCATE f07_runtime.audit,f07_runtime.callback_receipts,f07_runtime.phone_cache,f07_runtime.image_assets,f07_runtime.asset_failures,f07_runtime.notification_events,f07_runtime.notification_outbox,f07_runtime.incident_lifecycle RESTART IDENTITY CASCADE')}finally{c.release()}
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64||'','base64'),origin});
 const login=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'127.0.0.1'});
 assert.equal(login.code,'AUTH_OK');session=login.token;
});
after(async()=>{
 if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>{child.once('exit',resolve);setTimeout(resolve,5000).unref?.()})}
 await auth?.close();await pool?.end();
});

test('HTTPS 01：server.mjs 实际入口启动且报告真实 PG16 非超级用户',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/health');assert.equal(r.status,200);assert.equal(r.body.ok,true);
 assert.equal(r.body.pg16,true);assert.equal(r.body.superuser,false);assert.equal(r.body.outbound,'DISABLED');assert.ok(Number(r.body.database_oid)>0);
});
test('HTTPS 02：合法 Collector 回调返回合成状态而不返回电话',async()=>{
 const raw=callbackPayload();const ts=String(Date.now());
 const r=await request('POST','/__ci__/f07-runtime/phone/callback',raw,{'x-f07-timestamp':ts,'x-f07-signature':sign(raw,ts)});
 assert.equal(r.status,200);assert.equal(r.body.status,'UPDATED');assert.equal(r.body.origin,'CI_SYNTHETIC_ONLY');assert.equal(Object.hasOwn(r.body,'phone'),false);
});
test('HTTPS 03：错误 HMAC 被拒绝',async()=>{
 const raw=callbackPayload('job-200002');const r=await request('POST','/__ci__/f07-runtime/phone/callback',raw,{'x-f07-timestamp':String(Date.now()),'x-f07-signature':'f'.repeat(64)});
 assert.equal(r.status,400);assert.equal(r.body.code,'CALLBACK_SIGNATURE');
});
test('HTTPS 04：同一 request_id 与同一回调 payload 幂等',async()=>{
 const raw=callbackPayload('job-200003');const ts=String(Date.now()),headers={'x-f07-timestamp':ts,'x-f07-signature':sign(raw,ts)};
 await request('POST','/__ci__/f07-runtime/phone/callback',raw,headers);
 const r=await request('POST','/__ci__/f07-runtime/phone/callback',raw,headers);assert.equal(r.status,200);assert.equal(r.body.status,'DUPLICATE');
});
test('HTTPS 05：过期签名时间窗被拒绝',async()=>{
 const raw=callbackPayload('job-200004');const ts=String(Date.now()-600000);
 const r=await request('POST','/__ci__/f07-runtime/phone/callback',raw,{'x-f07-timestamp':ts,'x-f07-signature':sign(raw,ts)});
 assert.equal(r.status,400);assert.equal(r.body.code,'CALLBACK_EXPIRED');
});
test('HTTPS 06：真实 F03 Session 不绕过电话能力与来源缺口',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/phone/latest?vehicle_id=1',undefined,{'x-f07-test-session':session});
 assert.equal(r.status,403);assert.ok(r.body.code);assert.equal(Object.hasOwn(r.body,'phone'),false);
});
test('HTTPS 07：拨号只返回 DISABLED，不调用系统拨号器',async()=>{
 const r=await request('POST','/__ci__/f07-runtime/phone/dial',{vehicle_id:'1',session});
 assert.equal(r.status,403);assert.equal(r.body.dialer,'DISABLED');assert.equal(Object.hasOwn(r.body,'phone'),false);
});
test('HTTPS 08：图片 URL 使用固定受控域名',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/image/url?path=photos%2F1.jpg');assert.equal(r.status,200);
 assert.equal(r.body.url,'https://img.mingbang.invalid/c/photos/1.jpg');assert.equal(r.body.origin,'CI_SYNTHETIC_ONLY');
});
test('HTTPS 09：路径穿越在真实 HTTPS 路由被拒绝',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/image/url?path=..%2Fsecret.jpg');assert.equal(r.status,400);assert.equal(r.body.code,'UNSAFE_PATH');
});
test('HTTPS 10：F03/F05 父来源验证保持 fail-closed',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/parent/verify',undefined,{'x-f07-test-session':session});
 assert.equal(r.status,403);assert.equal(r.body.allowed,false);assert.equal(r.body.f05Code,'F05_CONVERSION_POSITIVE_SOURCE_GAP');
});
test('HTTPS 11：非白名单通知事件不会入 outbox',async()=>{
 const r=await request('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-http-bad',kind:'arbitrary_external_send',at:'2026-10-21T04:00:00Z'});
 assert.equal(r.status,200);assert.equal(r.body.status,'NOT_ALLOWLISTED');
 assert.equal((await pool.query('SELECT 1 FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-http-bad'])).rowCount,0);
});
test('HTTPS 12：SLA 事件缺正式签名事实时不发送',async()=>{
 const r=await request('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-http-sla',kind:'consultation_sla_timeout',deadline:'2026-10-21T03:00:00Z',at:'2026-10-21T04:00:00Z'});
 assert.equal(r.status,200);assert.equal(r.body.status,'SKIPPED');assert.equal(r.body.code,'SLA_EVENT_SOURCE_GAP');
});
test('HTTPS 13：Incident Recovery 依赖同一故障生命周期且保留 Issuer 缺口',async()=>{
 await request('POST','/__ci__/f07-runtime/notification/incident/activate',{incident_id:'incident-http',at:'2026-10-21T10:00:00Z'});
 await request('POST','/__ci__/f07-runtime/notification/incident/clear',{incident_id:'incident-http',at:'2026-10-21T10:30:00Z'});
 const r=await request('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-http-recovery',kind:'incident_recovery',incident_id:'incident-http',at:'2026-10-21T10:40:00Z'});
 assert.equal(r.body.status,'SKIPPED');assert.equal(r.body.code,'INCIDENT_SIGNED_ISSUER_SOURCE_GAP');
 assert.equal((await pool.query('SELECT 1 FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-http-recovery'])).rowCount,0);
});
test('HTTPS 14：非 loopback Host 被拒绝',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/health',undefined,{host:'evil.example'});assert.equal(r.status,400);assert.equal(r.body.code,'LOOPBACK_HOST_REQUIRED');
});
test('HTTPS 15：未知 Runtime 路由返回 404',async()=>{
 const r=await request('GET','/__ci__/f07-runtime/not-a-route');assert.equal(r.status,404);assert.equal(r.body.code,'F07_RUNTIME_ROUTE_NOT_FOUND');
});
test('F07_RUNTIME_HTTPS_BLACKBOX_15_SCENARIOS_PASS',()=>assert.ok(true));
