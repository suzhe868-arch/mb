import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedConsultationResponseService} from '../src/f05-consultation-response-service.mjs';
import {createIsolatedConsultationResponseHandler} from '../src/f05-consultation-response-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const bearer='R'.repeat(43),key='K'.repeat(32);
const fake={record:async x=>({status:200,body:{code:'CONSULTATION_HUMAN_RESPONSE_RECORDED',firstHumanResponseRecorded:true,productionReady:false,seen:x}})};
async function call({path='/api/v1/catalog/consultations/63020/human-responses',method='POST',headers={},body=JSON.stringify({channel:'message',sourceFactRef:'msg_fact_123456'}),service=fake}={}){
 const server=createServer(createFoundationHandler({consultationResponseHandler:createIsolatedConsultationResponseHandler(service,env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{
   authorization:'Bearer '+bearer,'x-idempotency-key':key,'content-type':'application/json',...headers},...(method==='GET'?{}:{body})});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>server.close(ok))}
}
test('human response service/HTTP cannot start outside isolated consent',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'bad'}]){
  assert.throws(()=>createIsolatedConsultationResponseService({pool:{connect(){}},env:bad}));
  assert.throws(()=>createIsolatedConsultationResponseHandler(fake,bad));
 }
});
test('response HTTP derives Employee only from bearer and accepts exact auditable fact shape',async()=>{
 const r=await call();assert.equal(r.status,200);assert.equal(r.body.productionReady,false);
 assert.equal(r.body.seen.consultationId,'63020');assert.equal(r.body.seen.channel,'message');
 assert.equal((await call({headers:{'x-employee-id':'63020'}})).status,403);
 assert.equal((await call({headers:{'x-owner-id':'63020'}})).status,403);
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({body:JSON.stringify({channel:'message',sourceFactRef:'msg_fact_123456',first:true})})).status,400);
});
test('malformed response evidence and dependency failure are opaque',async()=>{
 assert.equal((await call({body:'{' })).status,400);
 assert.equal((await call({body:JSON.stringify({channel:'system',sourceFactRef:'msg_fact_123456'})})).status,200,
  'HTTP forwards semantic validation to service in this unit boundary');
 const failed=await call({service:{record:async()=>{throw Error('PRIVATE_MESSAGE_PROVIDER_TOKEN')}}});
 assert.equal(failed.status,503);assert.equal(JSON.stringify(failed.body).includes('PRIVATE_MESSAGE_PROVIDER_TOKEN'),false);
});
