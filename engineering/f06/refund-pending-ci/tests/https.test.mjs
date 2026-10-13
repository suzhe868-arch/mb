import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {ciFailClosedRouter} from '../ci-router.mjs';
let server,db;
const path=x=>'/__ci__/f06-3c1/'+x;
async function call(path,method='POST',data={}){
 const bytes=Buffer.from(JSON.stringify(data));
 return new Promise((resolve,reject)=>{
  const r=request({hostname:'127.0.0.1',port:49031,path,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:49031','content-type':'application/json','content-length':bytes.length}},res=>{
   let b='';res.on('data',x=>b+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b),headers:res.headers}));
  });r.on('error',reject);r.end(bytes);
 });
}
const denied=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.deepEqual(x.body,{code:'F06_3C1_NO_PRODUCTION_REFUND_ISSUER'});assert.equal(x.headers['cache-control'],'no-store')};
test.before(async()=>{
 db=await connect();assert.equal((await verify(db)).verified,true);
 server=createServer({key:readFileSync('/tmp/f06-3c1-key.pem'),cert:readFileSync('/tmp/f06-3c1-cert.pem')},ciFailClosedRouter());
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(49031,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));if(db)await db.end()});
test('3C1-H01 实际refunded HTTPS绝不开放',async()=>denied(await call(path('refund/refunded'))));
test('3C1-H02 退款付款凭证绝不开放',async()=>denied(await call(path('refund/payments'))));
test('3C1-H03 pending虚拟参数不启生产',async()=>denied(await call(path('refund/pending'), 'POST',{amount:100})));
test('3C1-H04 closed虚拟接口不启生产',async()=>denied(await call(path('refund/closed'))));
test('3C1-H05 伪员工经理Token拒绝',async()=>denied(await call(path('manager/confirm'),'POST',{role:'manager',token:'forged'})));
test('3C1-H06 4S与SystemAdmin拒绝',async()=>{denied(await call(path('refund/pending'),'POST',{role:'four_s'}));denied(await call(path('refund/pending'),'POST',{principal_kind:'system_admin'}))});
test('3C1-H07 跨团队和权限伪造拒绝',async()=>denied(await call(path('refund/pending'),'POST',{scope:'other-store',permission:'allow'})));
test('3C1-H08 外部生产路由404且GET405',async()=>{assert.equal((await call('/api/refunds')).status,404);assert.equal((await call(path('refund/pending'),'GET')).status,405)});
test('3C1-H09 财务客户手机号VIN不泄漏',async()=>{
 const x=await call(path('refund/refunded'),'POST',{VIN:'SECRET-VIN',phone:'SECRET-PHONE',token:'SECRET-TOKEN',voucher:'SECRET-VOUCHER',amount:98765432});
 denied(x);for(const s of ['secret','vin','98765432'])assert.ok(!JSON.stringify(x.body).toLowerCase().includes(s));
});
