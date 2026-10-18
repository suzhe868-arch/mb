import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedRecommendationService} from '../src/f05-recommendation-service.mjs';
import {createIsolatedRecommendationHandler} from '../src/f05-recommendation-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const handler=createIsolatedRecommendationHandler({mutate:async()=>({status:200,body:{code:'REC_CREATED',productionReady:false}})},env);
async function call({headers={},body={action:'CREATE',customerId:'62000',vehicleId:'62010',listingCycleId:'62010'},method='POST',path='/api/v1/catalog/recommendations'}={}){
 const s=createServer(createFoundationHandler({recommendationHandler:handler}));
 await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+s.address().port+path,{
   method,headers:{'content-type':'application/json',authorization:'Bearer '+'A'.repeat(43),
    'x-idempotency-key':'K'.repeat(32),...headers},
   ...(method!=='GET'?{body:JSON.stringify(body)}:{})});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>s.close(ok))}
}
test('F05-9 Recommendation handlers and real services fail closed outside isolated PG16',()=>{
 const svc={mutate:async()=>({status:200,body:{}})};
 for(const cfg of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},
  {...env,F05_CATALOG_TEST_CONSENT:''}]){
  assert.throws(()=>createIsolatedRecommendationHandler(svc,cfg));
  assert.throws(()=>createIsolatedRecommendationService({pool:{connect(){}},env:cfg}));
 }
});
test('F05-9 HTTP prohibits identity/grant/Priority smuggling and untrusted path',async()=>{
 assert.equal((await call({headers:{'x-employee-id':'62000'}})).status,403);
 assert.equal((await call({headers:{cookie:'session=forged'}})).status,403);
 assert.equal((await call({headers:{'x-forwarded-for':'127.0.0.1'}})).status,403);
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({path:'/api/v1/catalog/recommendations?grant=true'})).status,400);
 assert.equal((await call({body:{action:'CREATE',customerId:'62000',vehicleId:'62010',listingCycleId:'62010',priority:true}})).status,400);
 assert.equal((await call({method:'GET'})).status,405);
});
test('F05-9 success DTO never includes protected source, price or bearer',async()=>{
 const v=await call();
 assert.equal(v.status,200);
 assert.equal(v.body.productionReady,false);
 assert.equal(Object.hasOwn(v.body,'grantId'),false);
});
