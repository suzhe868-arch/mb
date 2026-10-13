import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {ciFailClosedRouter} from '../ci-router.mjs';
let server,db;const path=s=>'/__ci__/f06-4b/'+s;
async function call(path,method='POST',data={}){
 const bytes=Buffer.from(JSON.stringify(data));
 return new Promise((resolve,reject)=>{
  const r=request({hostname:'127.0.0.1',port:49042,path,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:49042','content-type':'application/json','content-length':bytes.length}},res=>{
   let b='';res.on('data',x=>b+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b),headers:res.headers}));
  });r.on('error',reject);r.end(bytes);
 });
}
const deny=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.deepEqual(x.body,{code:'F06_4B_NO_PRODUCTION_TRANSACTION_HANDOFF_ISSUER'});assert.equal(x.headers['cache-control'],'no-store')};
test.before(async()=>{
 db=await connect();assert.equal((await verify(db)).verified,true);
 server=createServer({key:readFileSync('/tmp/f06-4b-key.pem'),cert:readFileSync('/tmp/f06-4b-cert.pem')},ciFailClosedRouter());
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(49042,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));if(db)await db.end()});
test('4B-H01 生产取消Transaction路由403',async()=>deny(await call(path('transaction/cancel'))));
test('4B-H02 completed成交绝不可签发',async()=>deny(await call(path('transaction/complete'))));
test('4B-H03 实际退款绝不开放',async()=>deny(await call(path('refund/refunded'))));
test('4B-H04 资金支付Issuer拒绝',async()=>deny(await call(path('finance/pay'))));
test('4B-H05 伪造token无法打开业务',async()=>deny(await call(path('transaction/cancel'),'POST',{token:'forged'})));
test('4B-H06 伪造manager/4S/SystemAdmin都拒绝',async()=>{
 deny(await call(path('transaction/cancel'),'POST',{role:'manager'}));
 deny(await call(path('transaction/cancel'),'POST',{role:'four_s'}));
 deny(await call(path('transaction/cancel'),'POST',{principal_kind:'system_admin'}));
});
test('4B-H07 跨Scope和假许可拒绝',async()=>deny(await call(path('transaction/cancel'),'POST',{scope:'other-store',permission:'allow'})));
test('4B-H08 生产路径不存在且GET不可写',async()=>{
 assert.equal((await call('/api/transactions/cancel')).status,404);
 assert.equal((await call(path('transaction/cancel'),'GET')).status,405);
});
test('4B-H09 真实敏感字段不回显',async()=>{
 const x=await call(path('transaction/cancel'),'POST',{token:'SECRET-TOKEN',VIN:'SECRET-VIN',phone:'SECRET-PHONE',payment:'SECRET-PAYMENT'});
 deny(x);for(const secret of ['secret','vin','phone','payment'])assert.ok(!JSON.stringify(x.body).toLowerCase().includes(secret));
});
