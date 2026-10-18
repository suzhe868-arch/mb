import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedMatchingDiscoveryHandler} from '../src/f05-matching-discovery-http.mjs';
import {createIsolatedMatchingDiscoveryService} from '../src/f05-matching-discovery-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const stub={discover:async()=>({status:200,body:{code:'DISCOVERY_QUEUED',queued:1,productionReady:false}})};
async function request({headers={},body={kind:'NEW_DEMAND',subjectId:'60500'},path='/api/v1/catalog/matching/discovery',method='POST'}={}){
 const s=createServer(createFoundationHandler({discoveryHandler:createIsolatedMatchingDiscoveryHandler(stub,env)}));
 await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+s.address().port+path,{
   method,headers:{authorization:'Bearer '+'A'.repeat(43),'x-idempotency-key':'I'.repeat(32),
    'content-type':'application/json',...headers},...(method!=='GET'?{body:JSON.stringify(body)}:{})});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>s.close(ok))}
}
test('discovery only starts in isolated PG16 test mode',()=>{
 for(const config of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedMatchingDiscoveryHandler(stub,config));
  assert.throws(()=>createIsolatedMatchingDiscoveryService({pool:{connect(){}},env:config}));
 }
});
test('actual HTTP route rejects impersonation, cookies, body smuggling and query',async()=>{
 for(const headers of [{'x-employee-id':'60500'},{'x-customer-id':'60500'},
  {'x-forwarded-for':'127.0.0.1'},{cookie:'admin=true'}]){
   assert.equal((await request({headers})).status,403,JSON.stringify(headers));
 }
 assert.equal((await request({headers:{authorization:''}})).status,401);
 assert.equal((await request({path:'/api/v1/catalog/matching/discovery?employee=1'})).status,400);
 assert.equal((await request({body:{kind:'NEW_DEMAND',subjectId:'60500',ownerId:'60500'}})).status,400);
});
test('discovery HTTP does not emit Recommendation, Priority or source identity',async()=>{
 const r=await request();
 assert.equal(r.status,200);
 assert.equal(r.body.productionReady,false);
 assert.equal(r.body.code,'DISCOVERY_QUEUED');
});
