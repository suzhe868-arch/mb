import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import pg from 'pg';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertF07RuntimeEnvironment,assertPhysicalPg16,createF07Runtime} from '../../../src/f07-runtime/runtime.mjs';
import {sign} from '../../collector-publisher-phone-callback-ci/contract.mjs';

let auth,runtime,handler,session;
const faults={failNextAssetCommit:false};
const origin='https://127.0.0.1:'+(process.env.API_PORT||4317);

function responseHarness(){
 const res={statusCode:0,headers:{},raw:'',writeHead(status,headers){this.statusCode=status;this.headers=headers;},end(body=''){this.raw=String(body);}};
 return res;
}
async function invokeWith(target,method,path,body,headers={}){
 const chunks=body===undefined?[]:[Buffer.from(typeof body==='string'?body:JSON.stringify(body))];
 const req=Readable.from(chunks);
 req.method=method;req.url=path;req.headers={host:'127.0.0.1:4317',...headers};
 const res=responseHarness();
 await target(req,res);
 let value={};try{value=JSON.parse(res.raw||'{}')}catch{}
 return {status:res.statusCode,headers:res.headers,body:value,raw:res.raw};
}
const invoke=(method,path,body,headers={})=>invokeWith(handler,method,path,body,headers);
function callbackPayload(overrides={}){
 return JSON.stringify({source_platform:'JYT',upstream_publisher_id:'pub-123',request_id:'job-'+(Math.floor(Math.random()*900000)+100000),
   nonce:randomUUID(),issued_at:new Date().toISOString(),status:'ok',phone:'TEST-123456',...overrides});
}
async function sendCallback(raw,ts=String(Date.now()),signature=sign(raw,ts)){
 return invoke('POST','/__ci__/f07-runtime/phone/callback',raw,{'x-f07-timestamp':ts,'x-f07-signature':signature,'content-type':'application/json'});
}
async function reset(){await runtime.resetForTests();}

before(async()=>{
 const secret=Buffer.from(process.env.F03_1_HMAC_KEY_BASE64||'','base64');
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
 const login=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'127.0.0.1'});
 assert.equal(login.code,'AUTH_OK');
 assert.equal(login.restricted,true);
 session=login.token;
 runtime=await createF07Runtime({env:process.env,auth,testFaults:faults});
 handler=createFoundationHandler({f07RuntimeHandler:runtime.handler,readinessProbe:runtime.ready,readinessTimeoutMs:3000});
});
after(async()=>{await runtime?.close();await auth?.close();});

const scenarios=[
 ['未注入 Runtime 时专属路由默认关闭',async()=>{
   const r=await invokeWith(createFoundationHandler(), 'GET','/__ci__/f07-runtime/health');
   assert.equal(r.status,404);assert.equal(r.body.code,'NOT_IMPLEMENTED');
 }],
 ['精确 consent 与 CI 环境通过',async()=>{assert.equal(assertF07RuntimeEnvironment(process.env),true)}],
 ['错误 consent 在任何业务写入前拒绝',async()=>{
   assert.throws(()=>assertF07RuntimeEnvironment({...process.env,F07_RUNTIME_TEST_CONSENT:'I_ACCEPT_ANYTHING'}),/F07_RUNTIME_ENV_F07_RUNTIME_TEST_CONSENT/);
 }],
 ['错误分支拒绝启动',async()=>{
   assert.throws(()=>assertF07RuntimeEnvironment({...process.env,GITHUB_REF:'refs/heads/main'}),/F07_RUNTIME_ENV_GITHUB_REF/);
 }],
 ['无效 Run ID 拒绝启动',async()=>{
   assert.throws(()=>assertF07RuntimeEnvironment({...process.env,GITHUB_RUN_ID:'not-a-run'}),/F07_RUNTIME_RUN_ID_REQUIRED/);
 }],
 ['错误 Runtime DSN 拒绝启动',async()=>{
   assert.throws(()=>assertF07RuntimeEnvironment({...process.env,DATABASE_URL:'postgres://wrong@127.0.0.1:5432/postgres'}),/F07_RUNTIME_ENV_DATABASE_URL/);
 }],
 ['与其他互斥测试 Runtime 同时启用时拒绝',async()=>{
   assert.throws(()=>assertF07RuntimeEnvironment({...process.env,F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'}),/F07_RUNTIME_COMBINATION_FORBIDDEN/);
 }],
 ['production 与 NODE_ENV=production 仍由原 F01 门禁拒绝',async()=>{
   const result=spawnSync(process.execPath,['engineering/src/server.mjs'],{encoding:'utf8',env:{...process.env,APP_ENV:'test',NODE_ENV:'production',API_PORT:'4318'}});
   assert.notEqual(result.status,0);assert.match(result.stderr,/F01_PRODUCTION_NOT_READY/);
 }],
 ['真实 PostgreSQL 16 与非超级用户身份通过',async()=>{
   const x=await runtime.assertPhysicalPg16();assert.equal(x.db,'f07_runtime_test');assert.equal(x.usr,'f07_runtime_ci');
   assert.equal(x.superuser,false);assert.equal(x.createdb,false);assert.equal(x.createrole,false);assert.ok(Number(x.database_oid)>0);
 }],
 ['真实 PG16 超级用户连接被物理身份门禁拒绝',async()=>{
   const superPool=new pg.Pool({connectionString:'postgres://postgres@127.0.0.1:5432/f07_runtime_test',max:1});
   const c=await superPool.connect();try{await assert.rejects(()=>assertPhysicalPg16(c),/F07_RUNTIME_PG16_NON_SUPERUSER_IDENTITY_DENIED/)}finally{c.release();await superPool.end()}
 }],
 ['合法 Collector 回调只写入合成回执并按复合发布人键缓存',async()=>{
   const raw=callbackPayload({request_id:'job-100001',nonce:randomUUID()});
   const r=await sendCallback(raw);assert.equal(r.status,200);assert.equal(r.body.status,'UPDATED');assert.equal(r.body.origin,'CI_SYNTHETIC_ONLY');
   assert.equal(Object.hasOwn(r.body,'phone'),false);
   const q=await runtime.pool.query('SELECT source_platform,upstream_publisher_id,phone_token,origin FROM f07_runtime.phone_cache');
   assert.equal(q.rowCount,1);assert.equal(q.rows[0].source_platform,'JYT');assert.equal(q.rows[0].upstream_publisher_id,'pub-123');
   assert.equal(q.rows[0].phone_token,'TEST-123456');assert.equal(q.rows[0].origin,'CI_SYNTHETIC_ONLY');
 }],
 ['错误 HMAC 签名拒绝且不落回执',async()=>{
   const r=await sendCallback(callbackPayload({request_id:'job-100002'}),String(Date.now()),'0'.repeat(64));
   assert.equal(r.status,400);assert.equal(r.body.code,'CALLBACK_SIGNATURE');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.callback_receipts')).rowCount,0);
 }],
 ['过期回调时间戳拒绝',async()=>{
   const ts=String(Date.now()-600000),raw=callbackPayload({request_id:'job-100003'});
   const r=await sendCallback(raw,ts,sign(raw,ts));assert.equal(r.status,400);assert.equal(r.body.code,'CALLBACK_EXPIRED');
 }],
 ['真实电话号码不能进入合成缓存',async()=>{
   const r=await sendCallback(callbackPayload({request_id:'job-100004',phone:'13800138000'}));
   assert.equal(r.status,422);assert.equal(r.body.code,'INVALID_CALLBACK');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.phone_cache')).rowCount,0);
 }],
 ['同一 request_id 与同一 payload 幂等返回',async()=>{
   const raw=callbackPayload({request_id:'job-100005',nonce:randomUUID()});
   assert.equal((await sendCallback(raw)).body.status,'UPDATED');
   const duplicate=await sendCallback(raw);assert.equal(duplicate.status,200);assert.equal(duplicate.body.status,'DUPLICATE');
   assert.equal((await runtime.pool.query('SELECT count(*)::int n FROM f07_runtime.callback_receipts')).rows[0].n,1);
 }],
 ['同一 request_id 不同 payload 被冲突拒绝',async()=>{
   const raw=callbackPayload({request_id:'job-100006',nonce:randomUUID()});await sendCallback(raw);
   const changed=raw.replace('TEST-123456','TEST-654321');const r=await sendCallback(changed);
   assert.equal(r.status,409);assert.equal(r.body.code,'IDEMPOTENCY_CONFLICT');
 }],
 ['跨 request_id 重放同一 nonce 被拒绝',async()=>{
   const nonce=randomUUID();await sendCallback(callbackPayload({request_id:'job-100007',nonce}));
   const r=await sendCallback(callbackPayload({request_id:'job-100008',nonce}));
   assert.equal(r.status,409);assert.equal(r.body.code,'NONCE_REPLAY');
 }],
 ['乱序回调不能覆盖更新的 Publisher 缓存',async()=>{
   const newer=new Date(Date.now()-10000).toISOString();
   const older=new Date(Date.now()-30000).toISOString();
   const first=await sendCallback(callbackPayload({request_id:'job-100009',nonce:randomUUID(),issued_at:newer,phone:'TEST-111111'}));
   const second=await sendCallback(callbackPayload({request_id:'job-100010',nonce:randomUUID(),issued_at:older,phone:'TEST-222222'}));
   assert.equal(first.body.status,'UPDATED');assert.equal(second.body.status,'STALE');
   const q=await runtime.pool.query('SELECT phone_token FROM f07_runtime.phone_cache WHERE source_platform=$1 AND upstream_publisher_id=$2',['JYT','pub-123']);
   assert.equal(q.rows[0].phone_token,'TEST-111111');
 }],
 ['回调事务中途失败会完整回滚回执与缓存',async()=>{
   faults.failNextCallbackBeforeCommit=true;
   const r=await sendCallback(callbackPayload({request_id:'job-100011',nonce:randomUUID()}));
   assert.equal(r.status,500);assert.equal(r.body.code,'INJECTED_CALLBACK_TX_ROLLBACK');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.callback_receipts WHERE request_id=$1',['job-100011'])).rowCount,0);
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.phone_cache')).rowCount,0);
 }],
 ['有效 F03 Session 也不能绕过未批准电话能力与 F05 来源缺口',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/phone/latest?vehicle_id=1',undefined,{'x-f07-test-session':session});
   assert.equal(r.status,403);assert.ok(r.body.code);assert.equal(Object.hasOwn(r.body,'phone'),false);
 }],
 ['无效 Session 的电话读取 FailClosed',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/phone/latest?vehicle_id=1',undefined,{'x-f07-test-session':'invalid-token'});
   assert.equal(r.status,403);assert.equal(r.body.code,'SESSION_OR_ADMISSION_DENIED');assert.equal(Object.hasOwn(r.body,'phone'),false);
 }],
 ['已撤销 Session 在下一次电话读取立即失效',async()=>{
   const login=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'127.0.0.1'});assert.equal(login.code,'AUTH_OK');
   await auth.logout(login.token);
   const r=await invoke('GET','/__ci__/f07-runtime/phone/latest?vehicle_id=1',undefined,{'x-f07-test-session':login.token});
   assert.equal(r.status,403);assert.equal(r.body.code,'SESSION_OR_ADMISSION_DENIED');
 }],
 ['拨号端点永远不启动系统拨号器或返回电话',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/phone/dial',{vehicle_id:'1',session});
   assert.equal(r.status,403);assert.equal(r.body.dialer,'DISABLED');assert.equal(Object.hasOwn(r.body,'phone'),false);
 }],
 ['可信父来源缺口明确报告且不授予访问权',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/parent/verify',undefined,{'x-f07-test-session':session});
   assert.equal(r.status,403);assert.equal(r.body.allowed,false);assert.equal(r.body.f05Code,'F05_CONVERSION_POSITIVE_SOURCE_GAP');
 }],
 ['路径穿越被拒绝',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/image/url?path=..%2Fsecret.jpg');assert.equal(r.status,400);assert.equal(r.body.code,'UNSAFE_PATH');
 }],
 ['图片 URL 只能来自受控域名与相对路径',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/image/url?path=photo%2F1.jpg');
   assert.equal(r.status,200);assert.equal(r.body.url,'https://img.mingbang.invalid/c/photo/1.jpg');
 }],
 ['资产化必须显式标记为合成来源',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/image/assetize',{image_id:'img-source-gap',vehicle_id:'v1',relative_path:'photo/source.jpg',origin:'SIGNED_PARENT_VERIFIED'});
   assert.equal(r.status,409);assert.equal(r.body.code,'F05_CONVERSION_POSITIVE_SOURCE_GAP');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.image_assets')).rowCount,0);
 }],
 ['合成资产化对象与数据库元数据双成功',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/image/assetize',{image_id:'img-double',vehicle_id:'v1',relative_path:'photo/double.jpg',origin:'CI_SYNTHETIC_ONLY'});
   assert.equal(r.status,200);assert.equal(r.body.status,'success');assert.equal(r.body.reused,false);
   const q=await runtime.pool.query('SELECT object_key,asset_state,origin FROM f07_runtime.image_assets WHERE image_id=$1',['img-double']);
   assert.equal(q.rowCount,1);assert.equal(q.rows[0].asset_state,'success');assert.equal(q.rows[0].origin,'CI_SYNTHETIC_ONLY');assert.equal(runtime.storage.has(q.rows[0].object_key),true);
   assert.equal(r.body.immutable_order,0);
 }],
 ['对象写入失败不会留下成功元数据',async()=>{
   runtime.storage.failNext=true;
   const r=await invoke('POST','/__ci__/f07-runtime/image/assetize',{image_id:'img-store-fail',vehicle_id:'v1',relative_path:'photo/fail.jpg',origin:'CI_SYNTHETIC_ONLY'});
   assert.equal(r.status,500);assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.image_assets WHERE image_id=$1',['img-store-fail'])).rowCount,0);
   assert.equal(runtime.storage.has('TEST_ASSET/img-store-fail'),false);
 }],
 ['数据库提交失败会补偿删除已写对象',async()=>{
   faults.failNextAssetCommit=true;
   const r=await invoke('POST','/__ci__/f07-runtime/image/assetize',{image_id:'img-db-fail',vehicle_id:'v1',relative_path:'photo/db-fail.jpg',origin:'CI_SYNTHETIC_ONLY'});
   assert.equal(r.status,500);assert.equal(runtime.storage.has('TEST_ASSET/img-db-fail'),false);
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.image_assets WHERE image_id=$1',['img-db-fail'])).rowCount,0);
   assert.ok(runtime.storage.deletes>=1);
   assert.equal((await runtime.pool.query('SELECT count(*)::int n FROM f07_runtime.asset_failures WHERE image_ref=$1',['img-db-fail'])).rows[0].n,1);
 }],
 ['首次资产化顺序被冻结，重复请求不能改写 path/order',async()=>{
   const body={image_id:'img-freeze',vehicle_id:'v1',relative_path:'photo/frozen.jpg',immutable_order:3,origin:'CI_SYNTHETIC_ONLY'};
   assert.equal((await invoke('POST','/__ci__/f07-runtime/image/assetize',body)).status,200);
   const conflict=await invoke('POST','/__ci__/f07-runtime/image/assetize',{...body,relative_path:'photo/changed.jpg',immutable_order:4});
   assert.equal(conflict.status,409);assert.equal(conflict.body.code,'IMAGE_IDEMPOTENCY_CONFLICT');
   const row=await runtime.pool.query('SELECT relative_path,immutable_order FROM f07_runtime.image_assets WHERE image_id=$1',['img-freeze']);
   assert.equal(row.rows[0].relative_path,'photo/frozen.jpg');assert.equal(row.rows[0].immutable_order,3);
 }],
 ['报告 H5 私有资源没有公共直读入口',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/image/report-h5');assert.equal(r.status,403);assert.equal(r.body.code,'REPORT_H5_PRIVATE_SOURCE_GAP');
   assert.equal(Object.hasOwn(r.body,'url'),false);
 }],
 ['零图片封面占位前先执行可信父来源门禁',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/image/cover?vehicle_id=vehicle-no-images');assert.equal(r.status,403);
   assert.equal(r.body.code,'F05_CONVERSION_POSITIVE_SOURCE_GAP');assert.equal(Object.hasOwn(r.body,'placeholder'),false);
 }],
 ['重复资产化幂等复用已有成功对象',async()=>{
   const body={image_id:'img-repeat',vehicle_id:'v1',relative_path:'photo/repeat.jpg',origin:'CI_SYNTHETIC_ONLY'};
   assert.equal((await invoke('POST','/__ci__/f07-runtime/image/assetize',body)).body.reused,false);
   const second=await invoke('POST','/__ci__/f07-runtime/image/assetize',body);assert.equal(second.status,200);assert.equal(second.body.reused,true);
   assert.equal((await runtime.pool.query('SELECT count(*)::int n FROM f07_runtime.image_assets WHERE image_id=$1',['img-repeat'])).rows[0].n,1);
 }],
 ['并发资产化只保留一份对象与元数据',async()=>{
   const body={image_id:'img-concurrent',vehicle_id:'v1',relative_path:'photo/concurrent.jpg',origin:'CI_SYNTHETIC_ONLY'};
   const results=await Promise.all([invoke('POST','/__ci__/f07-runtime/image/assetize',body),invoke('POST','/__ci__/f07-runtime/image/assetize',body)]);
   assert.ok(results.every(x=>x.status===200));assert.equal((await runtime.pool.query('SELECT count(*)::int n FROM f07_runtime.image_assets WHERE image_id=$1',['img-concurrent'])).rows[0].n,1);
   assert.equal(runtime.storage.has('TEST_ASSET/img-concurrent'),true);
 }],
 ['读取已资产化图片只使用本地 CDN Adapter',async()=>{
   await invoke('POST','/__ci__/f07-runtime/image/assetize',{image_id:'img-read',vehicle_id:'v1',relative_path:'photo/read.jpg',origin:'CI_SYNTHETIC_ONLY'});
   const r=await invoke('GET','/__ci__/f07-runtime/image/read?image_id=img-read');assert.equal(r.status,200);
   assert.equal(r.body.network,'LOCAL_ADAPTER_ONLY');assert.equal(r.body.origin,'CI_SYNTHETIC_ONLY');assert.equal(runtime.cdn.originRequests,1);
 }],
 ['PDM-23 allowlist 事件只进入本地 outbox，不实际投递',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-local',kind:'consultation_created',at:'2026-10-21T04:00:00Z'});
   assert.equal(r.status,200);assert.equal(r.body.status,'QUEUED_LOCAL_ONLY');assert.equal(r.body.code,'ROUTE_SOURCE_GAP');
   const q=await runtime.pool.query('SELECT status,origin,payload FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-local']);
   assert.equal(q.rowCount,1);assert.equal(q.rows[0].status,'QUEUED_LOCAL_ONLY');assert.equal(q.rows[0].origin,'CI_SYNTHETIC_ONLY');
   assert.equal(JSON.stringify(q.rows[0].payload).includes('phone'),false);
 }],
 ['不在 PDM-23 allowlist 的事件拒绝且不写 outbox',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-bad',kind:'arbitrary_external_send',at:'2026-10-21T04:00:00Z'});
   assert.equal(r.status,200);assert.equal(r.body.status,'NOT_ALLOWLISTED');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-bad'])).rowCount,0);
 }],
 ['通知重复投递请求按 event stage channel 去重',async()=>{
   const body={event_id:'evt-dedupe',kind:'consultation_created',stage:'stage-1',channel:'personal',at:'2026-10-21T04:00:00Z'};
   assert.equal((await invoke('POST','/__ci__/f07-runtime/notification/dispatch',body)).body.status,'QUEUED_LOCAL_ONLY');
   const second=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',body);assert.equal(second.body.status,'DEDUPED');
   assert.equal((await runtime.pool.query('SELECT count(*)::int n FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-dedupe'])).rows[0].n,1);
 }],
 ['SLA 超时没有签名事件与正式 deadline 时保留 SOURCE_GAP',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-sla',kind:'consultation_sla_timeout',at:'2026-10-21T04:00:00Z',deadline:'2026-10-21T03:00:00Z'});
   assert.equal(r.body.status,'SKIPPED');assert.equal(r.body.code,'SLA_EVENT_SOURCE_GAP');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-sla'])).rowCount,0);
 }],
 ['DND 时段延后通知且不创建 outbox',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-dnd',kind:'consultation_created',at:'2026-10-21T16:00:00Z'});
   assert.equal(r.body.status,'SKIPPED');assert.equal(r.body.code,'DND_DELAY_REVALIDATE');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.notification_outbox WHERE event_id=$1',['evt-dnd'])).rowCount,0);
 }],
 ['Incident Active 在缺少生命周期时不发送',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-incident-missing',kind:'incident_active',incident_id:'incident-missing',at:'2026-10-21T10:00:00Z'});
   assert.equal(r.body.status,'SKIPPED');assert.equal(r.body.code,'INCIDENT_CURRENT_ACTIVE_SOURCE_GAP');
 }],
 ['Incident Active 必须绑定同一活动故障且仍保留签名 Issuer 缺口',async()=>{
   await invoke('POST','/__ci__/f07-runtime/notification/incident/activate',{incident_id:'incident-one',at:'2026-10-21T10:00:00Z'});
   const r=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-incident-active',kind:'incident_active',incident_id:'incident-one',at:'2026-10-21T10:10:00Z'});
   assert.equal(r.body.status,'SKIPPED');assert.equal(r.body.code,'INCIDENT_SIGNED_ISSUER_SOURCE_GAP');
 }],
 ['Incident Recovery 必须在同一故障 clear 后发生',async()=>{
   await invoke('POST','/__ci__/f07-runtime/notification/incident/activate',{incident_id:'incident-two',at:'2026-10-21T10:00:00Z'});
   const early=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-recovery-early',kind:'incident_recovery',incident_id:'incident-two',at:'2026-10-21T10:10:00Z'});
   assert.equal(early.body.code,'RECOVERY_PREVIOUS_ACTIVE_SOURCE_GAP');
   await invoke('POST','/__ci__/f07-runtime/notification/incident/clear',{incident_id:'incident-two',at:'2026-10-21T10:30:00Z'});
   const recovery=await invoke('POST','/__ci__/f07-runtime/notification/dispatch',{event_id:'evt-recovery-after-clear',kind:'incident_recovery',incident_id:'incident-two',at:'2026-10-21T10:40:00Z'});
   assert.equal(recovery.body.code,'INCIDENT_SIGNED_ISSUER_SOURCE_GAP');
   assert.equal((await runtime.pool.query('SELECT 1 FROM f07_runtime.notification_outbox WHERE event_id LIKE $1',['evt-recovery-%'])).rowCount,0);
 }],
 ['Deep link 不能代替 Session Scope Object 授权',async()=>{
   const r=await invoke('POST','/__ci__/f07-runtime/notification/deep-link',{url:'https://evil.example/path'});
   assert.equal(r.status,403);assert.equal(r.body.origin,'SOURCE_GAP');
 }],
 ['本任务没有公网出站或真实 Feishu 投递',async()=>{
   const r=await invoke('GET','/__ci__/f07-runtime/health');assert.equal(r.status,200);assert.equal(r.body.outbound,'DISABLED');
   assert.equal(runtime.cdn.originRequests,0);
   assert.equal((await runtime.pool.query("SELECT count(*)::int n FROM f07_runtime.notification_outbox WHERE status<>'QUEUED_LOCAL_ONLY'")).rows[0].n,0);
 }]
];

for(const [name,run] of scenarios) test(name,async()=>{await reset();await run();});
test('F07_RUNTIME_INTEGRATION_BUSINESS_SCENARIOS_PASS',()=>{assert.ok(scenarios.length>=24);console.log('F07_RUNTIME_INTEGRATION_24_BUSINESS_SCENARIOS_PASS',scenarios.length)});
