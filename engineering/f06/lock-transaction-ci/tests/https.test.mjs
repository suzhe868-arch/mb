import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {ciFailClosedRouter} from '../ci-router.mjs';
let srv,db;
async function call(path,method='POST',data={}){
 const bytes=Buffer.from(JSON.stringify(data));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:49030,path,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:49030','content-type':'application/json','content-length':bytes.length}},res=>{
   let b='';res.on('data',x=>b+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b),headers:res.headers}));
  });req.on('error',reject);req.end(bytes);
 });
}
const ep=x=>'/__ci__/f06-3b/'+x;
const denied=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F06_3B_PRODUCTION_TRANSACTION_ISSUER_NOT_WIRED'});assert.equal(r.headers['cache-control'],'no-store')};
test.before(async()=>{
 db=await connect();assert.equal((await verify(db)).verified,true);
 srv=createServer({key:readFileSync('/tmp/f06-3b-key.pem'),cert:readFileSync('/tmp/f06-3b-cert.pem')},ciFailClosedRouter());
 await new Promise((resolve,reject)=>{srv.once('error',reject);srv.listen(49030,'127.0.0.1',resolve)});
});
test.after(async()=>{if(srv)await new Promise(ok=>srv.close(ok));if(db)await db.end()});
test('63B-H01 true TLS Deposit production issuer denied',async()=>denied(await call(ep('deposit/record'))));
test('63B-H02 fake receipt evidence cannot open financial issuer',async()=>denied(await call(ep('deposit/record'),'POST',{proof:'CI_SYNTHETIC_NOT_REAL_MONEY'})));
test('63B-H03 correction and reversal production routes denied',async()=>{denied(await call(ep('deposit/correct')));denied(await call(ep('deposit/reverse')))});
test('63B-H04 Refund and Transaction remain blocked',async()=>{denied(await call(ep('refund')));denied(await call(ep('transaction')))});
test('63B-H05 forged Manager Employee header denied',async()=>denied(await call(ep('manager/correction'),'POST',{role:'manager',token:'fake'})));
test('63B-H06 4S and SystemAdmin cannot execute Deposit',async()=>{denied(await call(ep('deposit/record'),'POST',{role:'four_s'}));denied(await call(ep('deposit/record'),'POST',{principal_kind:'system_admin'}))});
test('63B-H07 cross-team revoked scope denied',async()=>denied(await call(ep('deposit/record'),'POST',{scope:'another-team',permission:'allow'})));
test('63B-H08 absent production path and wrong method fail closed',async()=>{assert.equal((await call('/api/v1/deposits')).status,404);assert.equal((await call(ep('deposit/record'),'GET')).status,405)});
test('63B-H09 TLS response cannot leak sensitive finance and customer data',async()=>{
 const res=await call(ep('deposit/record'),'POST',{phone:'secret',VIN:'VIN321',amountCents:4500000,token:'credential',voucher:'private-note',customerId:86180101});denied(res);
 for(const x of ['secret','vin','4500000','credential','private-note','86180101'])assert.ok(!JSON.stringify(res.body).toLowerCase().includes(x));
});