import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {request as httpRequest} from 'node:http';
import {spawnSync} from 'node:child_process';
import {createFoundationHandler} from '../../../src/app.mjs';

let server,port;
before(async()=>{
 server=createServer(createFoundationHandler({readinessProbe:async()=>false,readinessTimeoutMs:30}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 port=server.address().port;
});
after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve));});
const get=(path,method='GET')=>new Promise((resolve,reject)=>{
 const req=httpRequest({host:'127.0.0.1',port,path,method,timeout:2000},res=>{
  let s='';res.setEncoding('utf8');res.on('data',x=>s+=x);
  res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(s),headers:res.headers}));
 });
 req.on('timeout',()=>req.destroy(Error('TEST_TIMEOUT')));req.on('error',reject);req.end();
});
const base=()=>{const env={...process.env,APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',API_PORT:'0'};
 for(const k of ['F07_RUNTIME_TEST_CONSENT','F06_COMPOSITE_TEST_CONSENT','F06_LOCK_TEST_CONSENT','F05_D1_BUSINESS_TEST_RUNTIME','F05_REAL_CATALOG_ENABLE','F03_1_ENABLE_ISOLATED_AUTH','ALLOW_DEV_PUBLIC_BIND'])delete env[k];
 env.API_PORT='43991';return env;
};
function refuse(overrides,message){
 const cp=spawnSync(process.execPath,['engineering/src/server.mjs'],{cwd:process.cwd(),env:{...base(),...overrides},encoding:'utf8',timeout:5000});
 assert.notEqual(cp.status,0,'拒绝性启动未退出（可能超时）');
 assert.equal(cp.signal,null,'进程超时或被信号终止不能证明主动拒绝');
 assert.match(cp.stderr+cp.stdout,new RegExp(message));
}
test('A01 默认健康存活接口200',async()=>{const r=await get('/api/v1/health/live');assert.equal(r.status,200);assert.deepEqual(r.body,{ok:true});});
test('A02 依赖未就绪返回503',async()=>{const r=await get('/api/v1/health/ready');assert.equal(r.status,503);assert.equal(r.body.code,'DEPENDENCY_NOT_READY');});
test('A03 GET 未知F07路由404',async()=>{const r=await get('/__ci__/f07-runtime/health');assert.equal(r.status,404);assert.equal(r.body.code,'NOT_IMPLEMENTED');});
test('A04 POST未知F07路由404',async()=>assert.equal((await get('/__ci__/f07-runtime/phone/dial','POST')).status,404));
test('A05 未经授权的F06交易路由404',async()=>assert.equal((await get('/__ci__/f06-composite/transaction')).status,404));
test('A06 未经授权的F03路由404',async()=>assert.equal((await get('/api/v1/auth/me')).status,404));
test('A07 未经授权的F05路由404',async()=>assert.equal((await get('/api/v1/vehicles')).status,404));
test('A08 F01只允许GET健康接口',async()=>{const r=await get('/api/v1/health/live','POST');assert.equal(r.status,405);assert.equal(r.body.code,'METHOD_NOT_ALLOWED');});
test('A09 APP_ENV生产拒绝',()=>refuse({APP_ENV:'production'},'F01_PRODUCTION_NOT_READY'));
test('A10 NODE_ENV生产拒绝',()=>refuse({NODE_ENV:'production'},'F01_PRODUCTION_NOT_READY'));
test('A11 F07错误许可拒绝',()=>refuse({F07_RUNTIME_TEST_CONSENT:'BAD'},'F07_RUNTIME_CONSENT_INVALID'));
test('A12 F07与F06 Composite组合拒绝',()=>refuse({F07_RUNTIME_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F07_RUNTIME_ONLY',F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY'},'F07_RUNTIME_COMBINATION_FORBIDDEN'));
test('A13 F07与F03隔离Auth组合拒绝',()=>refuse({F07_RUNTIME_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F07_RUNTIME_ONLY',F03_1_ENABLE_ISOLATED_AUTH:'I_AUTHORIZE_F03_1_AUTH_IN_NEW_TEST_PG16'},'F07_RUNTIME_COMBINATION_FORBIDDEN'));
test('A14 F06 Lock与F05 Catalog组合拒绝',()=>refuse({F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',F05_REAL_CATALOG_ENABLE:'I_ENABLE_F05_TEST_ONLY_CATALOG'},'F06_LOCK_RUNTIME_COMBINATION_FORBIDDEN'));
test('A15 F07运行不得绑定公网',()=>refuse({API_HOST:'0.0.0.0',ALLOW_DEV_PUBLIC_BIND:'I_ACCEPT_LOCAL_NETWORK_EXPOSURE',F07_RUNTIME_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F07_RUNTIME_ONLY'},'F07_RUNTIME_LOOPBACK_REQUIRED'));
test('A16 F06 Composite不得绑定公网',()=>refuse({API_HOST:'0.0.0.0',ALLOW_DEV_PUBLIC_BIND:'I_ACCEPT_LOCAL_NETWORK_EXPOSURE',F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY'},'F06_COMPOSITE_LOOPBACK_REQUIRED'));
test('A17 F05 Catalog与F03 Auth组合拒绝',()=>refuse({F05_REAL_CATALOG_ENABLE:'I_ENABLE_F05_TEST_ONLY_CATALOG',F03_1_ENABLE_ISOLATED_AUTH:'I_AUTHORIZE_F03_1_AUTH_IN_NEW_TEST_PG16'},'CATALOG_AUTH_COMBINATION_NOT_YET_AUTHORIZED'));
test('A18 F03 Auth不得绑定公网',()=>refuse({API_HOST:'0.0.0.0',ALLOW_DEV_PUBLIC_BIND:'I_ACCEPT_LOCAL_NETWORK_EXPOSURE',F03_1_ENABLE_ISOLATED_AUTH:'I_AUTHORIZE_F03_1_AUTH_IN_NEW_TEST_PG16'},'F03_AUTH_LOOPBACK_REQUIRED'));
