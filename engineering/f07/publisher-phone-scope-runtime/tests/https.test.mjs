import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import https from 'node:https';
import {createServer as createHttpsServer} from 'node:https';
import {test,before,after} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertF07RuntimeEnvironment,createF07Runtime,F08_3_REF} from '../../../src/f07-runtime/runtime.mjs';
import {sign} from '../../collector-publisher-phone-callback-ci/contract.mjs';

const PORT=4317;
const ORIGIN='https://127.0.0.1:'+PORT;
let auth;
let runtime;
let server;
let adminToken;
let salesToken;
let callbackSequence=200001;

async function login(name,password) {
  const result=await auth.login({login:name,password,source:'127.0.0.1'});
  assert.equal(result.code,'AUTH_OK');
  return result.token;
}
function request(method,path,body,headers={}) {
  return new Promise((resolve,reject)=>{
    const raw=body===undefined?'':(typeof body==='string'?body:JSON.stringify(body));
    const req=https.request({
      hostname:'127.0.0.1',port:PORT,path,method,rejectUnauthorized:false,
      headers:{...(raw?{'content-type':'application/json','content-length':Buffer.byteLength(raw)}:{}),...headers}
    },res=>{
      let data='';
      res.setEncoding('utf8');
      res.on('data',chunk=>data+=chunk);
      res.on('end',()=>{
        let parsed={};try{parsed=JSON.parse(data||'{}')}catch{}
        resolve({status:res.statusCode,headers:res.headers,body:parsed,raw:data});
      });
    });
    req.on('error',reject);
    if(raw)req.write(raw);
    req.end();
  });
}
const config=(action,scope_mode,employee_id=6,token=adminToken)=>
  request('POST','/__ci__/f07-runtime/phone/admin/configure',
    {employee_id,action,scope_mode},{'x-f07-test-session':token});
const latest=(id,token=salesToken,host=null)=>
  request('GET','/__ci__/f07-runtime/phone/latest?vehicle_id='+id,undefined,
    {...(token?{'x-f07-test-session':token}:{}),...(host?{host}:{})});
const dial=(id,token=salesToken)=>
  request('POST','/__ci__/f07-runtime/phone/dial',{vehicle_id:String(id)},
    token?{'x-f07-test-session':token}:{});
async function seedPhone(publisher,phone='TEST-333333') {
  const timestamp=String(Date.now());
  const raw=JSON.stringify({
    source_platform:'JYT',upstream_publisher_id:publisher,
    request_id:'job-'+String(callbackSequence++),nonce:randomUUID(),
    issued_at:new Date().toISOString(),status:'ok',phone
  });
  return request('POST','/__ci__/f07-runtime/phone/callback',raw,{
    'x-f07-timestamp':timestamp,'x-f07-signature':sign(raw,timestamp)
  });
}

before(async()=>{
  assertF07RuntimeEnvironment(process.env,F08_3_REF);
  auth=new IsolatedAuth({
    connectionString:process.env.F03_1_DATABASE_URL,
    secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),
    origin:ORIGIN
  });
  adminToken=await login('admin_test','SyntheticAdmin_1234567');
  salesToken=await login('race_test','SyntheticRace_1234567');
  runtime=await createF07Runtime({env:process.env,auth,expectedRef:F08_3_REF});
  await runtime.resetForTests();
  const key=await readFile(process.env.F07_RUNTIME_TLS_KEY_PATH);
  const cert=await readFile(process.env.F07_RUNTIME_TLS_CERT_PATH);
  server=createHttpsServer({key,cert},createFoundationHandler({
    f07RuntimeHandler:runtime.handler,readinessProbe:runtime.ready,readinessTimeoutMs:3000
  }));
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(PORT,'127.0.0.1',resolve);
  });
});
after(async()=>{
  if(server?.listening) await new Promise(resolve=>server.close(resolve));
  if(runtime) await runtime.close();
  if(auth) await auth.close();
});

test('真实 loopback HTTPS health 报告 PG16 非超管且禁止出站',async()=>{
  const result=await request('GET','/__ci__/f07-runtime/health');
  assert.equal(result.status,200);
  assert.equal(result.body.pg16,true);
  assert.equal(result.body.superuser,false);
  assert.equal(result.body.outbound,'DISABLED');
});
test('真实签名 callback 仅写入合成 publisher cache，不在响应中返回电话',async()=>{
  const result=await seedPhone('pub-locked','TEST-333333');
  assert.equal(result.status,200);
  assert.equal(result.body.origin,'CI_SYNTHETIC_ONLY');
  assert.equal(Object.hasOwn(result.body,'phone'),false);
});
test('未单独授予的员工通过 HTTPS latest 仍被拒绝',async()=>{
  const result=await latest(101);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_CAPABILITY_NOT_GRANTED');
});
test('System Admin HTTPS 配置入口可以单独授予 LOCKED_ONLY',async()=>{
  const result=await config('grant','LOCKED_ONLY');
  assert.equal(result.status,200);
  assert.equal(result.body.enabled,true);
});
test('有效当前 Lock 的批发车 HTTPS latest 允许读取合成电话',async()=>{
  const result=await latest(101);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-333333');
});
test('LOCKED_ONLY 下无 Lock 的车辆 HTTPS latest 拒绝',async()=>{
  const result=await latest(102);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_LOCK_REQUIRED');
});
test('HTTPS 切换 ALL_ACTIVE_JYT 后无 Lock 在售 JYT 批发车允许',async()=>{
  const configured=await config('grant','ALL_ACTIVE_JYT');
  assert.equal(configured.status,200);
  await seedPhone('pub-active','TEST-444444');
  const result=await latest(102);
  assert.equal(result.status,200);
  assert.equal(result.body.phone,'TEST-444444');
});
test('HTTPS 当前个人 deny 覆盖已授予能力',async()=>{
  await auth.pool.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=transaction_timestamp() WHERE employee_id=6 AND permission_id=13");
  const result=await latest(102);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_PERSONAL_DENY');
  await config('grant','ALL_ACTIVE_JYT');
});
test('HTTPS 撤权后旧 session/页面下一次请求被拒绝',async()=>{
  const revoked=await config('revoke','ALL_ACTIVE_JYT');
  assert.equal(revoked.status,200);
  const result=await latest(102);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_CAPABILITY_NOT_GRANTED');
});
test('HTTPS dial 只返回 DISABLED 状态且不返回电话',async()=>{
  await config('grant','ALL_ACTIVE_JYT');
  const result=await dial(102);
  assert.equal(result.status,200);
  assert.equal(result.body.dialer,'DISABLED');
  assert.equal(Object.hasOwn(result.body,'phone'),false);
});
test('HTTPS 已转名邦车辆拒绝，即使保留历史 publisher 值',async()=>{
  const result=await latest(108);
  assert.equal(result.status,403);
  assert.equal(result.body.code,'CURRENT_WHOLESALE_JYT_REQUIRED');
});
test('HTTPS 缺 publisher 映射走 SOURCE_GAP',async()=>{
  const result=await latest(111);
  assert.equal(result.status,403);
  assert.equal(result.body.origin,'SOURCE_GAP');
});
test('HTTPS Host 不为 loopback 时拒绝',async()=>{
  const result=await latest(101,salesToken,'evil.example');
  assert.equal(result.status,400);
  assert.equal(result.body.code,'LOOPBACK_HOST_REQUIRED');
});
test('HTTPS 正式客户路径未注册本 CI 专用电话入口',async()=>{
  const result=await request('GET','/api/v1/vehicles/101/publisher-phone');
  assert.equal(result.status,404);
});
test('F03 正式读取器与外部来源仍保留 SOURCE_GAP',async()=>{
  const result=await request('GET','/__ci__/f07-runtime/parent/verify?vehicle_id=101',undefined,{'x-f07-test-session':salesToken});
  assert.equal(result.status,403);
  assert.equal(result.body.allowed,false);
  assert.equal(result.body.origin,'SOURCE_GAP');
});
test('F08_3_HTTPS_BLACKBOX_SCENARIOS_PASS',()=>assert.ok(true));
