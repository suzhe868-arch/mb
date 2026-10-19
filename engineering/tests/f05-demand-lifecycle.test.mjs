import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedDemandLifecycleService} from '../src/f05-demand-lifecycle-service.mjs';
import {createIsolatedDemandLifecycleHandler} from '../src/f05-demand-lifecycle-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const bearer='A'.repeat(43),eventKey='B'.repeat(32);
async function request({path='/api/v1/catalog/demands/59680/actions',method='POST',headers={},body=JSON.stringify({action:'PAUSE'}),service={action:async()=>({status:200,body:{code:'DEMAND_PAUSE_APPLIED',productionReady:false}})}}={}){
 const server=createServer(createFoundationHandler({demandLifecycleHandler:createIsolatedDemandLifecycleHandler(service,env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 try{
  const res=await fetch('http://127.0.0.1:'+server.address().port+path,{
   method,headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey,
    'content-type':'application/json',...headers},...(method==='GET'?{}:{body})});
  return {status:res.status,body:await res.json()};
 }finally{await new Promise(ok=>server.close(ok))}
}
test('Demand lifecycle service and HTTP are disabled outside isolated explicit consent',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},
  {...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'invalid'}]){
  assert.throws(()=>createIsolatedDemandLifecycleService({pool:{connect(){}},env:bad}));
  assert.throws(()=>createIsolatedDemandLifecycleHandler({action(){}},bad));
 }
});
test('real HTTP contract forwards only action and reason with DB-derived identity',async()=>{
 const r=await request();assert.equal(r.status,200);assert.equal(r.body.productionReady,false);
 assert.equal((await request({headers:{'x-owner-id':'59680'}})).status,403);
 assert.equal((await request({headers:{'x-forwarded-for':'127.0.0.1'}})).status,403);
 assert.equal((await request({headers:{authorization:''}})).status,401);
 assert.equal((await request({headers:{'x-idempotency-key':''}})).status,400);
 assert.equal((await request({path:'/api/v1/catalog/demands/0/actions'})).status,404);
 assert.equal((await request({path:'/api/v1/catalog/demands/59680/actions?role=manager'})).status,400);
 assert.equal((await request({method:'GET'})).status,405);
 assert.equal((await request({body:JSON.stringify({action:'COMPLETE',customerId:'59680'})})).status,400);
 const failed=await request({service:{action:async()=>{throw Error('PRIVATE_SCOPE_PROOF')}}});
 assert.equal(failed.status,503);assert.equal(JSON.stringify(failed.body).includes('PRIVATE_SCOPE_PROOF'),false);
});
