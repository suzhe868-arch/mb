import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {ciFailClosedRouter} from '../ci-router.mjs';
let server,db;const path=s=>'/__ci__/f06-5b/'+s;
async function call(path,method='POST',data={}){
 const bytes=Buffer.from(JSON.stringify(data));
 return new Promise((resolve,reject)=>{
  const r=request({hostname:'127.0.0.1',port:49054,path,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:49054','content-type':'application/json','content-length':bytes.length}},res=>{
   let b='';res.on('data',x=>b+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b),headers:res.headers}));
  });r.on('error',reject);r.end(bytes);
 });
}
const deny=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.deepEqual(x.body,{code:'F06_5B_REAL_REFUND_ISSUER_NOT_AUTHORIZED'});assert.equal(x.headers['cache-control'],'no-store')};
test.before(async()=>{
 db=await connect();assert.equal((await verify(db)).verified,true);
 server=createServer({key:readFileSync('/tmp/f06-5b-key.pem'),cert:readFileSync('/tmp/f06-5b-cert.pem')},ciFailClosedRouter());
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(49054,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));if(db)await db.end()});
test('5B-H01 生产取消Transaction路由403',async()=>deny(await call(path('transaction/refund/start'))));
test('5B-H02 completed成交绝不可签发',async()=>deny(await call(path('transaction/complete'))));
test('5B-H03 实际退款绝不开放',async()=>deny(await call(path('refund/refunded'))));
test('5B-H04 资金支付Issuer拒绝',async()=>deny(await call(path('finance/pay'))));
test('5B-H05 伪造token无法打开业务',async()=>deny(await call(path('transaction/cancel'),'POST',{token:'forged'})));
test('5B-H06 伪造manager/4S/SystemAdmin都拒绝',async()=>{
 deny(await call(path('transaction/cancel'),'POST',{role:'manager'}));
 deny(await call(path('transaction/cancel'),'POST',{role:'four_s'}));
 deny(await call(path('transaction/cancel'),'POST',{principal_kind:'system_admin'}));
});
test('5B-H07 跨Scope和假许可拒绝',async()=>deny(await call(path('transaction/cancel'),'POST',{scope:'other-store',permission:'allow'})));
test('5B-H08 生产路径不存在且GET不可写',async()=>{
 assert.equal((await call('/api/transactions/cancel')).status,404);
 assert.equal((await call(path('transaction/cancel'),'GET')).status,405);
});
test('5B-H09 真实敏感字段不回显',async()=>{
 const x=await call(path('transaction/cancel'),'POST',{token:'SECRET-TOKEN',VIN:'SECRET-VIN',phone:'SECRET-PHONE',payment:'SECRET-PAYMENT'});
 deny(x);for(const secret of ['secret','vin','phone','payment'])assert.ok(!JSON.stringify(x.body).toLowerCase().includes(secret));
});
