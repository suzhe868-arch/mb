import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedConsultationHandler} from '../src/f05-consultation-http.mjs';
import {createIsolatedConsultationService} from '../src/f05-consultation-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const token='A'.repeat(43),key='Z'.repeat(32);
const mock={create:async()=>({status:200,body:{code:'CONSULTATION_CREATED',consultationId:'12',created:true,productionReady:false}})};
async function req(method='POST',headers={},url='/api/v1/catalog/vehicles/59001/consultations'){
 const server=createServer(createFoundationHandler({consultationHandler:createIsolatedConsultationHandler(mock,env)}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const result=await fetch('http://127.0.0.1:'+server.address().port+url,{method,headers});
  return {status:result.status,body:await result.json()};
 }finally{await new Promise(resolve=>server.close(resolve))}
}
test('production, nonloopback and missing isolated PG16 cannot start consultation writer',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedConsultationHandler(mock,bad));
  assert.throws(()=>createIsolatedConsultationService({pool:{connect:async()=>{}},env:bad}));
 }
 assert.throws(()=>createIsolatedConsultationService({pool:{},env}));
});
test('unauthenticated client cannot create consultation',async()=>{
 const r=await req('POST',{'x-idempotency-key':key});assert.equal(r.status,401);
 assert.equal(r.body.code,'CONSULTATION_IDENTITY_REQUIRED');
});
test('post enters actual single foundation HTTP handler with safe test Customer bearer',async()=>{
 const r=await req('POST',{authorization:'Bearer '+token,'x-idempotency-key':key});
 assert.equal(r.status,200);assert.equal(r.body.consultationId,'12');assert.equal(r.body.productionReady,false);
});
test('consultation never trusts forged Customer/Owner/phone/permission/forwarded request',async()=>{
 for(const h of [{'x-customer-id':'59002'},{'x-owner-id':'59001'},{'x-phone-verified':'yes'}, {'x-forwarded-for':'127.0.0.1'}, {cookie:'test'}, {'x-employee-id':'59001'}]){
  const r=await req('POST',{authorization:'Bearer '+token,'x-idempotency-key':key,...h});
  assert.equal(r.status,403,JSON.stringify(h));
 }
});
test('consultation method, route, query and idempotency strictly checked',async()=>{
 const h={authorization:'Bearer '+token,'x-idempotency-key':key};
 assert.equal((await req('GET',h)).status,405);
 assert.equal((await req('POST',h,'/api/v1/catalog/vehicles/59001/consultations?customerId=1')).status,400);
 assert.equal((await req('POST',{authorization:'Bearer '+token})).status,400);
 assert.equal((await req('POST',h,'/api/v1/catalog/vehicles/0/consultations')).status,400);
});
test('database errors return generic fail-closed 503 without leaking sensitive details',async()=>{
 const failing={create:async()=>{throw Error('private_key_secret')}};
 const server=createServer(createFoundationHandler({consultationHandler:createIsolatedConsultationHandler(failing,env)}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/vehicles/59001/consultations',{method:'POST',headers:{authorization:'Bearer '+token,'x-idempotency-key':key}});
  const body=await response.text();assert.equal(response.status,503);assert.equal(body.includes('private_key_secret'),false);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
