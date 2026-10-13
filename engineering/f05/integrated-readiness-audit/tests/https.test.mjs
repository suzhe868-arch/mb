import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {denyConsultationIssuerRouter} from '../../consultation-assignee-sla/ci-router.mjs';
import {verify,connect} from '../../consultation-assignee-sla/migration.mjs';
let server,db;
const ep=s=>'/__ci__/f05-10/v1/'+s;
async function call(path,method='POST',payload={},headers={}){
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:49011,path,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:49011',...(bytes?{'content-type':'application/json','content-length':bytes.length}:{}),...headers}},res=>{
    let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(body)}));
   });req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
const deny=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.deepEqual(x.body,{code:'F05_10_PRODUCTION_CONSULTATION_ISSUER_NOT_WIRED'});assert.equal(x.headers['cache-control'],'no-store')};
test.before(async()=>{db=await connect();assert.equal((await verify(db)).verified,true);
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},denyConsultationIssuerRouter());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(49011,'127.0.0.1',resolve)})});
test.after(async()=>{if(server)await new Promise(done=>server.close(done));if(db)await db.end()});
test('11-H01 actual local TLS signed Consultation production issuer denied',async()=>{deny(await call(ep('create')))});
test('11-H02 role claim is not an authenticated production Employee issuer',async()=>{deny(await call(ep('create'),'POST',{customerId:989201},{'x-role':'sales'}))});
test('11-H03 forged 4S membership is not Consultation worker',async()=>{deny(await call(ep('handover'),'POST',{employeeId:2},{'x-four-s-member':'true'}))});
test('11-H04 System Admin is not a generic Customer Owner',async()=>{deny(await call(ep('owner'),'POST',{ownerId:1},{'x-system-admin':'true'}))});
test('11-H05 Priority, Recommendation and Grant cannot issue production consultations',async()=>{for(const x of ['priority','recommendation','visibility-grant'])deny(await call(ep(x),'POST',{customerId:989201}))});
test('11-H06 Lock, Transaction, Deposit and Refund cannot be created by this audit',async()=>{for(const x of ['lock','transaction','deposit','refund'])deny(await call(ep(x),'POST',{}))});
test('11-H07 absent production route returns 404, unsafe GET is not mutation',async()=>{assert.equal((await call('/api/v1/consultations','POST',{})).status,404);assert.equal((await call(ep('create'),'GET',null)).status,405)});
test('11-H08 rejection never leaks Customer, phone, VIN, private price or token',async()=>{const r=await call(ep('create'),'POST',{phone:'synthetic-only',VIN:'secret',price:888,token:'deny'});deny(r);for(const x of ['phone','vin','price','secret','bearer','customerid'])assert.ok(!JSON.stringify(r.body).toLowerCase().includes(x))});
