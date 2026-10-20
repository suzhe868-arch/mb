import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {createFoundationServer} from '../../../src/app.mjs';
import {verifyCompositeEnvironment,createCompositeDenyHandler,getCompositeSourceMatrix,F06_COMPOSITE_CONSENT} from '../../../src/f06-nonprod-composite-runtime.mjs';

const good={
 APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_COMPOSITE_TEST_CONSENT:F06_COMPOSITE_CONSENT,
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test'
};
const check=(patch)=>verifyCompositeEnvironment({...good,...patch});
test('01 显式双授权与隔离运行参数可用',()=>{
 assert.equal(check({}).status,'LOCK_RUNTIME_ONLY_SIGNED_FINANCE_SOURCE_GAP');
});
test('02 不持有Composite授权被拒',()=>assert.throws(()=>check({F06_COMPOSITE_TEST_CONSENT:undefined}),/EXPLICIT_CONSENT/));
test('03 错误授权被拒',()=>assert.throws(()=>check({F06_COMPOSITE_TEST_CONSENT:'allowed'}),/EXPLICIT_CONSENT/));
test('04 无原Lock授权不得接入',()=>assert.throws(()=>check({F06_LOCK_TEST_CONSENT:undefined}),/ORIGINAL_LOCK_CONSENT/));
test('05 APP生产拒绝',()=>assert.throws(()=>check({APP_ENV:'production'}),/NONPRODUCTION_LOOPBACK/));
test('06 NODE生产拒绝',()=>assert.throws(()=>check({NODE_ENV:'production'}),/NONPRODUCTION_LOOPBACK/));
test('07 公网监听拒绝',()=>assert.throws(()=>check({API_HOST:'0.0.0.0'}),/NONPRODUCTION_LOOPBACK/));
test('08 错误局域网host拒绝',()=>assert.throws(()=>check({API_HOST:'localhost'}),/NONPRODUCTION_LOOPBACK/));
test('09 与F03历史Auth分支冲突拒绝',()=>assert.throws(()=>check({F03_1_ENABLE_ISOLATED_AUTH:'yes'}),/COMBINATION/));
test('10 与F05 Catalog冲突拒绝',()=>assert.throws(()=>check({F05_REAL_CATALOG_ENABLE:'yes'}),/COMBINATION/));
test('11 与F05 D1冲突拒绝',()=>assert.throws(()=>check({F05_D1_BUSINESS_TEST_RUNTIME:'yes'}),/COMBINATION/));
test('12 禁止连接其他数据库',()=>assert.throws(()=>check({F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:x@127.0.0.1:5432/f03_auth_test'}),/DISPOSABLE_LOCK_DB/));
test('13 禁止连接公网PG',()=>assert.throws(()=>check({F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:x@8.8.8.8:5432/f06_lock_test'}),/DISPOSABLE_LOCK_DB/));
test('14 禁止模拟超级账号',()=>assert.throws(()=>check({F06_LOCK_DATABASE_URL:'postgres://postgres:x@127.0.0.1:5432/f06_lock_test'}),/EXPLICIT_DISPOSABLE_LOCK_DB/));
test('15 禁止动态端口',()=>assert.throws(()=>check({F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:x@127.0.0.1:5433/f06_lock_test'}),/DISPOSABLE_LOCK_DB/));
test('16 禁止URL查询参数',()=>assert.throws(()=>check({F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:x@127.0.0.1:5432/f06_lock_test?sslmode=disable'}),/DISPOSABLE_LOCK_DB/));
test('17 来源映射准确保留5项拒绝',()=>{
 const m=getCompositeSourceMatrix();
 assert.equal(m.length,6);assert.equal(m.filter(x=>x.state==='SIGNED_SOURCE_GAP').length,5);
 assert.equal(m.filter(x=>x.state==='RUNTIME_WIRED').length,1);
});
const handler=createCompositeDenyHandler();
let app,port;
before(async()=>{
 app=createFoundationServer({lockHandler:handler,readinessProbe:async()=>false});
 await new Promise((resolve,reject)=>{app.once('error',reject);app.listen(0,'127.0.0.1',resolve)});
 port=app.address().port;
});
after(async()=>{if(app?.listening)await new Promise(ok=>app.close(ok))});
async function req(path,method='POST',headers={},body=undefined){
 const opts={method,headers:{...headers}};
 if(body!==undefined){opts.body=JSON.stringify(body);opts.headers['content-type']='application/json'}
 const r=await fetch('http://127.0.0.1:'+port+path,opts);
 return {status:r.status,body:await r.json(),headers:r.headers};
}
test('18 无生产Transaction服务接线拒绝',async()=>{
 const r=await req('/api/v1/transactions/1/cancel');assert.equal(r.status,503);assert.equal(r.body.code,'F06_COMPOSITE_SIGNED_SOURCE_GAP');
});
test('19 无真实Refund付款Issuer拒绝',async()=>{
 const r=await req('/api/v1/refund-payments');assert.equal(r.status,503);
});
test('20 禁止历史PR139 CI入口被误挂',async()=>{
 const r=await req('/__ci__/f06-real-transaction/open');assert.equal(r.status,503);
});
test('21 单Runtime请求开Transaction必须安全拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/transaction/open');assert.equal(r.status,503);
});
test('22 单Runtime未签Handoff必须安全拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/transaction/handoff');assert.equal(r.status,503);
});
test('23 单Runtime未签Cancel必须安全拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/transaction/cancel');assert.equal(r.status,503);
});
test('24 单Runtime未签Deposit必须安全拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/deposit/record');assert.equal(r.status,503);
});
test('25 单Runtime未签Refund申请必须安全拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/refund/request');assert.equal(r.status,503);
});
test('26 单Runtime未签Refund关闭必须安全拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/refund/close');assert.equal(r.status,503);
});
test('27 即使客户端自报管理员身份仍拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/refund/close','POST',
 {'x-role':'admin','authorization':'Bearer '+('a'.repeat(43))},{amountCents:3000});
 assert.equal(r.status,503);assert.equal(r.body.allowed,false);
});
test('28 即使用户自称issuer仍拒绝',async()=>{
 const r=await req('/__nonprod__/f06-composite/transaction/open','POST',
 {'x-issuer':'PR139','authorization':'Bearer '+('b'.repeat(43))},{issuer:'CI_SYNTHETIC_NOT_REAL_MONEY'});
 assert.equal(r.status,503);
});
test('29 只读测试健康活性可达',async()=>{
 const r=await req('/api/v1/health/live','GET');assert.equal(r.status,200);assert.equal(r.body.ok,true);
});
test('30 只读测试Ready缺失PG真实校验必须503',async()=>{
 const r=await req('/api/v1/health/ready','GET');assert.equal(r.status,503);assert.equal(r.body.code,'DEPENDENCY_NOT_READY');
});
test('31 其它未接线接口404且无返回资金数据',async()=>{
 const r=await req('/__nonprod__/f06-composite/unknown');assert.equal(r.status,404);assert.equal(r.body.code,'NOT_IMPLEMENTED');
});
test('32 安全拒绝不回显客户端资金与Token',async()=>{
 const r=await req('/__nonprod__/f06-composite/refund/request','POST',
 {authorization:'Bearer '+('a'.repeat(43))},{amountCents:99119,token:'SECRET'});
 assert.equal(r.status,503);
 assert.ok(!JSON.stringify(r.body).includes('99119'));assert.ok(!JSON.stringify(r.body).includes('SECRET'));
 assert.equal(r.headers.get('cache-control'),'no-store');
});
