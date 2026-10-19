import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedSlaHoldService} from '../src/f05-sla-hold-service.mjs';
import {createIsolatedSlaHoldHandler} from '../src/f05-sla-hold-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const bearer='A'.repeat(43),key='I'.repeat(32),url='/api/v1/catalog/consultations/59200/resume-from-hold';
const service={resume:async()=>({status:200,body:{code:'CONSULTATION_HOLD_RESUMED',holdActive:false,firstHumanResponse:false,productionReady:false}})};
async function call({path=url,method='POST',headers={},body=undefined,svc=service}={}){
 const server=createServer(createFoundationHandler({slaHoldHandler:createIsolatedSlaHoldHandler(svc,env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 try{
  const res=await fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{authorization:'Bearer '+bearer,'x-idempotency-key':key,...headers},body});
  return {status:res.status,body:await res.json()};
 }finally{await new Promise(ok=>server.close(ok))}
}
test('resume service and handler do not start without exact disposable test isolation',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedSlaHoldService({pool:{connect:async()=>{}},env:bad}));
  assert.throws(()=>createIsolatedSlaHoldHandler(service,bad));
 }
 assert.throws(()=>createIsolatedSlaHoldService({pool:{},env}));
});
test('real HTTP resume does not claim first human response, regular SLA or production status',async()=>{
 const result=await call();assert.equal(result.status,200);
 assert.equal(result.body.holdActive,false);assert.equal(result.body.firstHumanResponse,false);
 assert.equal(result.body.productionReady,false);
});
test('resume requires independent valid Employee bearer and separate event key',async()=>{
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
 assert.equal((await call({headers:{authorization:'Bearer customer-fraud'}})).status,401);
});
test('forged employee, customer, scope, owner, phone and forwarded headers are refused',async()=>{
 for(const extra of [{'x-employee-id':'59200'},{'x-customer-id':'59200'},{'x-owner-id':'59200'},
 {'x-role':'manager'},{'x-scope':'all'},{'x-phone-consent':'true'},{'x-forwarded-for':'127.0.0.1'},{cookie:'session=1'}]){
  assert.equal((await call({headers:extra})).status,403,JSON.stringify(extra));
 }
});
test('no nonempty JSON, query, invalid id or wrong HTTP method accepted',async()=>{
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({path:url+'?customerId=59200'})).status,400);
 assert.equal((await call({path:'/api/v1/catalog/consultations/0/resume-from-hold'})).status,400);
 assert.equal((await call({body:'{"permission":"override"}'})).status,403);
});
test('PG16 failure stays generic without leaking credentials or stack trace',async()=>{
 const r=await call({svc:{resume:async()=>{throw Error('internal_session_password')}}});
 assert.equal(r.status,503);assert.equal(JSON.stringify(r.body).includes('internal_session_password'),false);
});
