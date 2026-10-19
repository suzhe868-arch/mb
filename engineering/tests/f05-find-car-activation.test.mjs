import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedFindCarActivationService} from '../src/f05-find-car-activation-service.mjs';
import {createIsolatedFindCarActivationHandler} from '../src/f05-find-car-activation-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const cred='A'.repeat(43),key='K'.repeat(32),url='/api/v1/catalog/find-car/applications/59530/activate';
const fake={activate:async()=>({status:200,body:{code:'FIND_CAR_DEMAND_ACTIVATED',demandId:'59540',demandCreated:true,matchingReady:false,matchingStarted:false,productionReady:false}})};
async function call({path=url,method='POST',headers={},body=undefined,service=fake}={}){
 const srv=createServer(createFoundationHandler({findCarActivationHandler:createIsolatedFindCarActivationHandler(service,env)}));
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+srv.address().port+path,{method,headers:{
   authorization:'Bearer '+cred,'x-idempotency-key':key,...headers},body});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>srv.close(ok))}
}
test('manual activation HTTP and PG16 service never start in production or network-open mode',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedFindCarActivationService({pool:{connect:async()=>{}},env:bad}));
  assert.throws(()=>createIsolatedFindCarActivationHandler(fake,bad));
 }
 assert.throws(()=>createIsolatedFindCarActivationService({pool:{},env}));
});
test('Employee manual activation may create active Demand but never implies matching ready',async()=>{
 const r=await call();assert.equal(r.status,200);
 assert.equal(r.body.demandCreated,true);assert.equal(r.body.matchingReady,false);
 assert.equal(r.body.matchingStarted,false);assert.equal(r.body.productionReady,false);
});
test('activation cannot derive authority from forged Customer, Employee, Role, Level or Owner',async()=>{
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
 for(const bad of [{'x-customer-id':'59530'},{'x-employee-id':'59530'},{'x-owner-id':'59530'},
 {'x-role':'manager'},{'x-entitlement':'true'},{'x-phone-service':'yes'},{'x-demand-id':'59530'},
 {'x-forwarded-for':'127.0.0.1'},{cookie:'Employee=admin'}]){
  assert.equal((await call({headers:bad})).status,403,JSON.stringify(bad));
 }
});
test('Activation rejects GET, wrong route, query, caller-provided demand and client body',async()=>{
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({path:url+'?entitlement=true'})).status,400);
 assert.equal((await call({path:'/api/v1/catalog/find-car/applications/0/activate'})).status,400);
 assert.equal((await call({body:'{"demandId":"1"}'})).status,403);
});
test('Activation SQL failure returns generic not-ready without leaking identity',async()=>{
 const r=await call({service:{activate:async()=>{throw Error('PRIVATE_EMPLOYEE_SIGNATURE_ABCDE')}}});
 assert.equal(r.status,503);
 assert.equal(JSON.stringify(r.body).includes('PRIVATE_EMPLOYEE_SIGNATURE_ABCDE'),false);
});
