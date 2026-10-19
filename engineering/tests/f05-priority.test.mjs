import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedPriorityService} from '../src/f05-priority-service.mjs';
import {createIsolatedPriorityHandler} from '../src/f05-priority-http.mjs';
import {createIsolatedCatalogServerOptions,REQUIRED_F05_HANDLERS} from '../src/catalog-wiring.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const handler=createIsolatedPriorityHandler({act:async()=>({status:200,body:{code:'PRIORITY_RECONCILED',productionReady:false}})},env);
async function request({headers={},body={action:'RECONCILE',vehicleId:'62510'},method='POST',path='/api/v1/catalog/priority'}={}){
 const s=createServer(createFoundationHandler({priorityHandler:handler}));
 await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+s.address().port+path,{method,
   headers:{authorization:'Bearer '+'A'.repeat(43),'x-idempotency-key':'E'.repeat(32),
    'content-type':'application/json',...headers},...(method!=='GET'?{body:JSON.stringify(body)}:{})});
  return {status:r.status,data:await r.json()};
 }finally{await new Promise(ok=>s.close(ok))}
}
test('priority starts only in explicit isolated test mode',()=>{
 for(const e of [{...env,NODE_ENV:'production'},{...env,APP_ENV:'production'},
  {...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:''}]){
  assert.throws(()=>createIsolatedPriorityHandler({act(){}},e));
  assert.throws(()=>createIsolatedPriorityService({pool:{connect(){}},env:e}));
 }
});
test('priority blocks forged owner/grant/qualification/price and query controls',async()=>{
 for(const headers of [{'x-customer-id':'62500'},{'x-employee-id':'62500'},
  {'x-forwarded-for':'127.0.0.1'},{cookie:'session=bad'}])
  assert.equal((await request({headers})).status,403,JSON.stringify(headers));
 assert.equal((await request({headers:{authorization:''}})).status,401);
 assert.equal((await request({path:'/api/v1/catalog/priority?grant=1'})).status,400);
 assert.equal((await request({body:{action:'RECONCILE',vehicleId:'62510',customerId:'62500'}})).status,400);
 assert.equal((await request({method:'GET'})).status,405);
});
test('priority API does not expose raw competitor identifiers or private fields',async()=>{
 const r=await request();assert.equal(r.status,200);
 assert.equal(r.data.productionReady,false);
 assert.equal(Object.hasOwn(r.data,'customerId'),false);
 assert.equal(Object.hasOwn(r.data,'sourceMatchResultId'),false);
});

test('real startup wiring includes Recommendation, Priority and qualification; missing handler fails closed',async()=>{
 const routes={
  recommendationHandler:'/api/v1/catalog/recommendations',
  priorityHandler:'/api/v1/catalog/priority',
  priorityQualificationHandler:'/api/v1/catalog/priority/qualification'
 };
 const runtime={handler:async()=>false,ready:async()=>true};
 for(const name of REQUIRED_F05_HANDLERS){
  runtime[name]=async(req,res)=>{
   if(req.url!==routes[name])return false;
   res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});
   res.end(JSON.stringify({code:name}));return true;
  };
 }
 for(const bad of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},
  {...env,F05_CATALOG_TEST_CONSENT:''}]){
  assert.throws(()=>createIsolatedCatalogServerOptions(runtime,bad),/TEST_ONLY/);
 }
 for(const name of REQUIRED_F05_HANDLERS){
  const broken={...runtime};delete broken[name];
  assert.throws(()=>createIsolatedCatalogServerOptions(broken,env),/MISSING_/);
 }
 const app=createServer(createFoundationHandler(createIsolatedCatalogServerOptions(runtime,env)));
 await new Promise(ok=>app.listen(0,'127.0.0.1',ok));
 try{
  for(const [name,path] of Object.entries(routes)){
   const r=await fetch('http://127.0.0.1:'+app.address().port+path,{method:'POST'});
   assert.equal(r.status,200,name);
   assert.deepEqual(await r.json(),{code:name});
  }
 }finally{await new Promise(ok=>app.close(ok))}
});
