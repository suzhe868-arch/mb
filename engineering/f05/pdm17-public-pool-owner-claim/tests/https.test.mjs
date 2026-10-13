import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {createD1DenyRouter} from '../ci-router.mjs';
const c=await connect(),origin='https://127.0.0.1:49221';let server;
const base='/__ci__/f05-10-d1/v1/';
const req=(path,method='POST',body={},headers={})=>new Promise((resolve,reject)=>{
 const data=body===null?null:Buffer.from(JSON.stringify(body));
 const x=request({hostname:'127.0.0.1',port:49221,path,method,rejectUnauthorized:false,
 headers:{origin,...(data?{'content-type':'application/json','content-length':data.length}:{}),...headers}},res=>{
  let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(text)}))});
 x.on('error',reject);if(data)x.write(data);x.end();
});
const denied=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.equal(r.body.code,
 'D1_PRODUCTION_OWNER_ISSUER_NOT_WIRED');assert.deepEqual(Object.keys(r.body),['code']);
 assert.match(r.headers['cache-control'],/no-store/)};
test.before(async()=>{assert.equal((await verify(c)).verified,true);
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},createD1DenyRouter());
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(49221,'127.0.0.1',ok)})});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));await c.end()});
test('D1-H01 fake Customer WeChat or token cannot mint public owner claim',async()=>{
 for(const headers of [{'x-wechat-openid':'forged'},{authorization:'Bearer forged'},{cookie:'__Host-mb_pc=fake'}])
  denied(await req(base+'claim','POST',{customerId:989201,employeeId:7},headers));
});
test('D1-H02 even signed employee cookie is not a production claim Issuer',async()=>{
 denied(await req(base+'claim','POST',{customerId:989201,employeeId:7},{cookie:'__Host-mb_pc=synthetic'}));
});
test('D1-H03 System Admin control plane is not automatic Customer Owner',async()=>{
 denied(await req(base+'assign','POST',{principalKind:'system_admin',targetEmployeeId:7}));
});
test('D1-H04 client cannot transfer old owner through ordinary share or owner hints',async()=>{
 denied(await req(base+'share','POST',{historicalOwner:1,forceCurrentOwner:true,customerId:989201}));
});
test('D1-H05 Customer Consent/Phone/OTP are not trustworthy synthetic issuer flags',async()=>{
 for(const payload of [{phone:'11111',otp:'123456'},{syntheticServiceSource:true},{priority:true,ownerId:1}])
  denied(await req(base+'service','POST',payload));
});
test('D1-H06 no production route exposed; GET never mutates',async()=>{
 assert.equal((await req('/api/v1/public-pool/claim','POST',{})).status,404);
 assert.equal((await req(base+'claim','GET',null)).status,405);
});
test('D1-H07 denied projection never contains phone, VIN, private data, price, token',async()=>{
 const x=await req(base+'claim','POST',{phone:'hidden',vin:'secret',token:'secret',price:123,customerId:989201});denied(x);
 for(const k of ['phone','vin','token','price','customer','owner','source'])
  assert.equal(JSON.stringify(x.body).toLowerCase().includes(k),false);
});
