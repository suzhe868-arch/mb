import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedEmployeeStartHandler} from '../src/f05-employee-start-http.mjs';
import {createIsolatedEmployeeStartService} from '../src/f05-employee-start-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const token='A'.repeat(43),key='I'.repeat(32),path='/api/v1/catalog/consultations/59020/start-processing';
const svc={start:async()=>({status:200,body:{code:'CONSULTATION_PROCESSING_STARTED',status:'processing',firstHumanResponse:false,productionReady:false}})};
async function request(method='POST',headers={},url=path,service=svc){
 const server=createServer(createFoundationHandler({employeeStartHandler:createIsolatedEmployeeStartHandler(service,env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 try{
  const resp=await fetch('http://127.0.0.1:'+server.address().port+url,{method,headers});
  return {status:resp.status,body:await resp.json()};
 }finally{await new Promise(ok=>server.close(ok))}
}
test('employee start-processing disabled outside exact disposable test context',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'false'}]){
  assert.throws(()=>createIsolatedEmployeeStartHandler(svc,bad));
  assert.throws(()=>createIsolatedEmployeeStartService({pool:{connect:async()=>{}},env:bad}));
 }
 assert.throws(()=>createIsolatedEmployeeStartService({pool:{},env}));
});
test('HTTP requires independent employee bearer and valid idempotency key',async()=>{
 assert.equal((await request()).status,401);
 assert.equal((await request('POST',{'x-idempotency-key':key})).status,401);
 assert.equal((await request('POST',{authorization:'Bearer '+token})).status,400);
 assert.equal((await request('POST',{authorization:'Bearer '+token,'x-idempotency-key':key})).status,200);
});
test('POST processing never claims first human response or production readiness',async()=>{
 const r=await request('POST',{authorization:'Bearer '+token,'x-idempotency-key':key});
 assert.equal(r.status,200);
 assert.equal(r.body.status,'processing');
 assert.equal(r.body.firstHumanResponse,false);
 assert.equal(r.body.productionReady,false);
});
test('HTTP denies identity-forgery, role and scope headers, proxy headers and cookies',async()=>{
 const auth={authorization:'Bearer '+token,'x-idempotency-key':key};
 for(const extra of [{'x-employee-id':'59020'},{'x-role':'manager'},{'x-scope':'all'},
  {'x-customer-id':'59020'},{'x-forwarded-for':'127.0.0.1'},{cookie:'session=test'}]){
  assert.equal((await request('POST',{...auth,...extra})).status,403,JSON.stringify(extra));
 }
});
test('HTTP denies GET, path injection, query and unsolicited body',async()=>{
 const h={authorization:'Bearer '+token,'x-idempotency-key':key};
 assert.equal((await request('GET',h)).status,405);
 assert.equal((await request('POST',h,path+'?employeeId=1')).status,400);
 assert.equal((await request('POST',h,'/api/v1/catalog/consultations/0/start-processing')).status,400);
 assert.equal((await request('POST',{...h,'content-length':'5'})).status,403);
});
test('DB error response never reveals internal employee secrets',async()=>{
 const fail={start:async()=>{throw Error('private_employee_bearer')}};
 const r=await request('POST',{authorization:'Bearer '+token,'x-idempotency-key':key},path,fail);
 assert.equal(r.status,503);assert.equal(JSON.stringify(r.body).includes('private_employee_bearer'),false);
});
