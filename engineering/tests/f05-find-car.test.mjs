import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedFindCarHandler} from '../src/f05-find-car-http.mjs';
import {createIsolatedFindCarService} from '../src/f05-find-car-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const cred='A'.repeat(43),event='K'.repeat(32),path='/api/v1/catalog/find-car/applications';
const mock={action:async({kind,applicationId})=>({status:200,body:{code:'FIND_CAR_APPLICATION_'+kind,
 applicationId:applicationId||'59500',status:kind==='WITHDRAW'?'closed':'pending',
 demandCreated:false,matchingStarted:false,productionReady:false}})};
async function call({url=path,method='POST',body=undefined,headers={},service=mock}={}){
 const srv=createServer(createFoundationHandler({findCarHandler:createIsolatedFindCarHandler(service,env)}));
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 try{
  const json=method==='POST'&&url.endsWith('/withdraw')?undefined:
   body===undefined?JSON.stringify({originalText:'找一辆二手奥迪A6',budgetMaxCents:'20000000',...(method==='PATCH'?{expectedRevision:1}:{})}):body;
  const r=await fetch('http://127.0.0.1:'+srv.address().port+url,{method,
   headers:{authorization:'Bearer '+cred,'x-idempotency-key':event,...(json===undefined?{}:{'content-type':'application/json'}),...headers},body:method==='GET'?undefined:json});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>srv.close(ok))}
}
test('Application never runs without disposable PG16 and strict local environment',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedFindCarHandler(mock,bad));
  assert.throws(()=>createIsolatedFindCarService({pool:{connect:async()=>{}},env:bad}));
 }
 assert.throws(()=>createIsolatedFindCarService({pool:{},env}));
});
test('HTTP application CREATE and PATCH and withdrawal preserve two-object state boundary',async()=>{
 const made=await call();assert.equal(made.status,200);
 assert.equal(made.body.status,'pending');assert.equal(made.body.demandCreated,false);assert.equal(made.body.matchingStarted,false);
 const edit=await call({url:path+'/59500',method:'PATCH'});assert.equal(edit.status,200);assert.equal(edit.body.status,'pending');
 const closed=await call({url:path+'/59500/withdraw',body:undefined});assert.equal(closed.status,200);assert.equal(closed.body.status,'closed');
});
test('Application rejects caller fabricated phone consent, customer, owner, grade, demand and role',async()=>{
 for(const bad of [{'x-phone-service':'true'},{'x-customer-id':'59500'},{'x-owner-id':'59500'},
 {'x-level':'vip'},{'x-entitlement':'on'},{'x-demand-id':'59500'},{'x-employee-id':'59500'},
 {'x-role':'manager'},{'x-forwarded-for':'127.0.0.1'},{cookie:'session'}]){
  assert.equal((await call({headers:bad})).status,403,JSON.stringify(bad));
 }
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
});
test('Application strict JSON disallows overposting, owner and automatic Demand activation',async()=>{
 for(const body of [
  {originalText:'找车',budgetMaxCents:null,customerId:'1'},
  {originalText:'找车',budgetMaxCents:null,activateDemand:true},
  {originalText:'找车',budgetMaxCents:null,ownerEmployeeId:'1'},
  {originalText:'找车'},{originalText:'找车',budgetMaxCents:null,expectedRevision:4}
 ]){
  assert.equal((await call({body:JSON.stringify(body)})).status,400,JSON.stringify(body));
 }
 assert.equal((await call({body:'{'})).status,400);
 assert.equal((await call({headers:{'content-type':'text/plain'}})).status,415);
});
test('Application path, method and oversized body are fail-closed',async()=>{
 assert.equal((await call({url:path+'?customerId=123'})).status,400);
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({url:path+'/0',method:'PATCH'})).status,400);
 assert.equal((await call({body:JSON.stringify({originalText:'A'.repeat(5000),budgetMaxCents:null})})).status,413);
 const error=await call({service:{action:async()=>{throw Error('CUSTOMER_PRIVATE_PHONE_SECRET')}}});
 assert.equal(error.status,503);assert.equal(JSON.stringify(error.body).includes('CUSTOMER_PRIVATE_PHONE_SECRET'),false);
});
