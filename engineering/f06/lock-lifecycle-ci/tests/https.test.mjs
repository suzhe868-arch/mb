import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {ciFailClosedRouter} from '../ci-router.mjs';
let srv,db;
async function call(path,method='POST',payload={}){
 const bytes=Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
 const q=request({hostname:'127.0.0.1',port:49028,path,method,rejectUnauthorized:false,
 headers:{origin:'https://127.0.0.1:49028','content-type':'application/json','content-length':bytes.length}},res=>{
 let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(body),headers:res.headers}));
 });q.on('error',reject);q.end(bytes);
 });
}
const ep=p=>'/__ci__/f06-2/'+p;
const denied=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F06_2_PRODUCTION_LOCK_AND_MONEY_ISSUERS_NOT_WIRED'});assert.equal(r.headers['cache-control'],'no-store')};
test.before(async()=>{db=await connect();assert.equal((await verify(db)).verified,true);
 srv=createServer({key:readFileSync('/tmp/f06-2-loopback-key.pem'),cert:readFileSync('/tmp/f06-2-loopback-cert.pem')},ciFailClosedRouter());
 await new Promise((resolve,reject)=>{srv.once('error',reject);srv.listen(49028,'127.0.0.1',resolve)});
});
test.after(async()=>{if(srv)await new Promise(done=>srv.close(done));if(db)await db.end()});
test('62-H01 real TLS denies F06-2 production Customer lifecycle',async()=>denied(await call(ep('customer/intake'))));
test('62-H02 synthetic phone proof cannot become real Customer issuer',async()=>denied(await call(ep('customer/intake'),'POST',{syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'})));
test('62-H03 forged Manager and role header cannot approve',async()=>denied(await call(ep('employee/approve'),'POST',{role:'manager',token:'forged'})));
test('62-H04 four_s role cannot approve business Lock',async()=>denied(await call(ep('employee/approve'),'POST',{role:'four_s'})));
test('62-H05 SystemAdmin is not an Employee Lock actor',async()=>denied(await call(ep('employee/direct-lock'),'POST',{principal_kind:'system_admin'})));
test('62-H06 no real Deposit, Refund or Transaction issuer',async()=>{for(const x of ['deposit','refund','transaction'])denied(await call(ep(x)))});
test('62-H07 no production Waitlist, manual Lock release or expiry',async()=>{for(const x of ['waitlist/auto','waitlist/manual','lock/release','lock/expiry'])denied(await call(ep(x)))});
test('62-H08 invalid method and absent production URL hard reject',async()=>{assert.equal((await call(ep('employee/approve'),'GET')).status,405);assert.equal((await call('/api/v1/lock-requests')).status,404)});
test('62-H09 TLS denial does not leak phone VIN price token customer',async()=>{
 const x=await call(ep('employee/approve'),'POST',{phone:'secret',VIN:'VIN321',price:4500000,token:'credential',customerId:86180101});denied(x);
 for(const v of ['secret','vin','4500000','credential','86180101'])assert.ok(!JSON.stringify(x.body).toLowerCase().includes(v));
});