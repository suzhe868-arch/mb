import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedPriorityQualificationHandler} from '../src/f05-priority-qualification-http.mjs';
import {createIsolatedPriorityQualificationService} from '../src/f05-priority-qualification-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const handler=createIsolatedPriorityQualificationHandler({mutate:async()=>({status:200,body:{
 code:'PRIORITY_QUAL_CHANGED',productionReady:false}})},env);
async function post({headers={},body={action:'ENABLE',customerId:'64510',expectedRevision:1},
 method='POST',path='/api/v1/catalog/priority/qualification'}={}){
 const s=createServer(createFoundationHandler({priorityQualificationHandler:handler}));
 await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+s.address().port+path,{
   method,headers:{authorization:'Bearer '+'A'.repeat(43),'x-idempotency-key':'K'.repeat(32),
    'content-type':'application/json',...headers},...(method!=='GET'?{body:JSON.stringify(body)}:{})});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>s.close(ok))}
}
test('PDM13 Priority qualification manager endpoint fails closed outside isolated test',()=>{
 for(const e of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},
  {...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:''}]){
  assert.throws(()=>createIsolatedPriorityQualificationHandler({mutate(){}},e));
  assert.throws(()=>createIsolatedPriorityQualificationService({pool:{connect(){}},env:e}));
 }
});
test('single-customer qualification rejects forged employee, scope and priority privileges',async()=>{
 for(const headers of [{'x-employee-id':'64500'},{'x-forwarded-for':'127.0.0.1'},
  {cookie:'session=forged'},{'x-scope':'manager'}]){
  assert.equal((await post({headers})).status,403,JSON.stringify(headers));
 }
 assert.equal((await post({headers:{authorization:''}})).status,401);
 assert.equal((await post({path:'/api/v1/catalog/priority/qualification?all=true'})).status,400);
 assert.equal((await post({body:{customerId:'64510',action:'DISABLE',expectedRevision:1,
   targetCustomers:['64510','64511']}})).status,400);
 assert.equal((await post({method:'GET'})).status,405);
});
test('successful qualification result never includes competitor identity or rule source',async()=>{
 const r=await post();assert.equal(r.status,200);assert.equal(r.body.productionReady,false);
 assert.equal(Object.hasOwn(r.body,'vehicleId'),false);
 assert.equal(Object.hasOwn(r.body,'grantId'),false);
});
