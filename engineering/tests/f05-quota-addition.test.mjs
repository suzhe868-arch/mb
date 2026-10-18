import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedQuotaAdditionHandler} from '../src/f05-quota-addition-http.mjs';
import {createIsolatedQuotaAdditionService} from '../src/f05-quota-addition-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const token='A'.repeat(43),key='I'.repeat(32),path='/api/v1/catalog/customers/59400/price-quota/additions';
const mock={add:async({customerId,delta})=>({status:200,body:{code:'QUOTA_ADDITION_APPLIED',customerId,added:delta,chargedMoney:false,productionReady:false}})};
async function call(options={}){
 const server=createServer(createFoundationHandler({quotaAdditionHandler:createIsolatedQuotaAdditionHandler(options.service||mock,env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 try{
  const response=await fetch('http://127.0.0.1:'+server.address().port+(options.path||path),{
   method:options.method||'POST',
   headers:{authorization:'Bearer '+token,'x-idempotency-key':key,'content-type':'application/json',...options.headers},
   body:options.method==='GET'?undefined:options.body===undefined?JSON.stringify({delta:3}):options.body});
  return {status:response.status,body:await response.json()};
 }finally{await new Promise(ok=>server.close(ok))}
}
test('test-only F05 staff quota issuer never enables a production/remote mutation',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedQuotaAdditionService({pool:{connect:async()=>{}},env:bad}));
  assert.throws(()=>createIsolatedQuotaAdditionHandler(mock,bad));
 }
 assert.throws(()=>createIsolatedQuotaAdditionService({pool:{},env}));
});
test('staff quota HTTP accepts only delta and does not represent money/fees',async()=>{
 const r=await call();assert.equal(r.status,200);assert.equal(r.body.added,3);
 assert.equal(r.body.chargedMoney,false);assert.equal(r.body.productionReady,false);
});
test('staff bearer and idempotency mandatory; all forged identity, level, quota, scope denied',async()=>{
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
 for(const h of [{'x-employee-id':'59400'},{'x-customer-id':'59400'},
   {'x-owner-id':'59400'},{'x-role':'manager'},{'x-scope':'all'},
   {'x-price-permission':'unlimited'},{'x-quota-limit':'1000'},{'x-level':'vip'},
   {'x-forwarded-for':'127.0.0.1'},{cookie:'staff-session'}]){
  assert.equal((await call({headers:h})).status,403,JSON.stringify(h));
 }
});
test('no overposting, fraudulent actor in payload, malformed body or invalid positive additions',async()=>{
 for(const b of [{delta:3,employeeId:'59400'},{delta:3,customerId:'59400'},
 {delta:0},{delta:-1},{delta:1.5},{delta:10001},{delta:'3'},{}]){
  assert.equal((await call({body:JSON.stringify(b)})).status,400,JSON.stringify(b));
 }
 assert.equal((await call({body:'{'})).status,400);
 assert.equal((await call({body:JSON.stringify({delta:3}),headers:{'content-type':'text/plain'}})).status,415);
});
test('wrong method, wrong path and oversized body rejected; generic database error',async()=>{
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({path:path+'?role=manager'})).status,400);
 assert.equal((await call({path:'/api/v1/catalog/customers/0/price-quota/additions'})).status,400);
 assert.equal((await call({body:JSON.stringify({delta:2,padding:'A'.repeat(500)})})).status,413);
 const e=await call({service:{add:async()=>{throw Error('SECRET_BACKOFFICE_AUTH')}}});
 assert.equal(e.status,503);assert.equal(JSON.stringify(e.body).includes('SECRET_BACKOFFICE_AUTH'),false);
});
