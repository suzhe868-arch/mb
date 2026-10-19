import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedHandoverHandler} from '../src/f05-handover-http.mjs';
import {createIsolatedHandoverService} from '../src/f05-handover-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const bearer='A'.repeat(43),event='I'.repeat(32),path='/api/v1/catalog/consultations/59100/reassign';
const mock={reassign:async(params)=>({status:200,body:{code:'CONSULTATION_REASSIGNED',consultationId:params.consultationId,oldAssigneeEmployeeId:'59100',newAssigneeEmployeeId:params.targetEmployeeId,firstHumanResponse:false,productionReady:false}})};
async function call({route=path,body={targetEmployeeId:'59101',reason:'客户正常转交另一销售'},method='POST',headers={},service=mock}={}){
 const srv=createServer(createFoundationHandler({handoverHandler:createIsolatedHandoverHandler(service,env)}));
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 try{
  const res=await fetch('http://127.0.0.1:'+srv.address().port+route,{method,headers:{authorization:'Bearer '+bearer,'x-idempotency-key':event,'content-type':'application/json',...headers},body:method==='POST'?(typeof body==='string'?body:JSON.stringify(body)):undefined});
  return {status:res.status,body:await res.json()};
 }finally{await new Promise(ok=>srv.close(ok))}
}
test('handover service and HTTP never start in production or without disposable PG16',()=>{
 for(const e of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'no'}]){
  assert.throws(()=>createIsolatedHandoverService({pool:{connect:async()=>{}},env:e}));
  assert.throws(()=>createIsolatedHandoverHandler(mock,e));
 }
 assert.throws(()=>createIsolatedHandoverService({pool:{},env}));
});
test('real HTTP accepts Unicode reason but never infers first human response from handover',async()=>{
 const r=await call();
 assert.equal(r.status,200);
 assert.equal(r.body.newAssigneeEmployeeId,'59101');
 assert.equal(r.body.firstHumanResponse,false);
 assert.equal(r.body.productionReady,false);
});
test('HTTP refuses missing or forged Employee identity and scope headers',async()=>{
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
 for(const fake of [{'x-employee-id':'59100'},{'x-customer-id':'59100'},{'x-role':'manager'},
 {'x-owner-id':'59100'},{'x-scope':'all'},{'x-forwarded-for':'127.0.0.1'},{cookie:'login=1'}]){
  assert.equal((await call({headers:fake})).status,403,JSON.stringify(fake));
 }
});
test('HTTP refuses injected JSON actor claims, omitted reason and malformed JSON',async()=>{
 assert.equal((await call({body:{targetEmployeeId:'59101',reason:'合法交接原因',customerId:'59100'}})).status,400);
 assert.equal((await call({body:{targetEmployeeId:'59101'}})).status,400);
 assert.equal((await call({body:'{'})).status,400);
 assert.equal((await call({body:{targetEmployeeId:'59101',reason:'合法交接原因'},headers:{'content-type':'text/plain'}})).status,415);
});
test('HTTP invalid methods, id, unsupported query, oversized payload all denied',async()=>{
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({route:path+'?employeeId=59101'})).status,400);
 assert.equal((await call({route:'/api/v1/catalog/consultations/0/reassign'})).status,400);
 assert.equal((await call({body:{targetEmployeeId:'59101',reason:'A'.repeat(600)}})).status,413);
});
test('DB unavailability produces generic 503 and hides details',async()=>{
 const r=await call({service:{reassign:async()=>{throw Error('postgres_secret_password')}}});
 assert.equal(r.status,503);
 assert.equal(JSON.stringify(r.body).includes('postgres_secret_password'),false);
});
