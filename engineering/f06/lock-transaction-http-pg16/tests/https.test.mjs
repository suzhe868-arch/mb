import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {before,after,test} from 'node:test';
import {productionDenyHandler} from '../server.mjs';
let server,port;
before(async()=>{
 server=createServer({key:readFileSync('/tmp/f06-real-transaction-key.pem'),cert:readFileSync('/tmp/f06-real-transaction-cert.pem')},productionDenyHandler());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 port=server.address().port;
});
after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve))});
function call(path,method='POST',payload={}){
 return new Promise((resolve,reject)=>{
  const req=request({host:'127.0.0.1',port,path,method,rejectUnauthorized:false,headers:{'content-type':'application/json',authorization:'Bearer-forged-token'}},res=>{
   const parts=[];res.on('data',x=>parts.push(x));res.on('end',()=>{
    const value=JSON.parse(Buffer.concat(parts).toString('utf8'));resolve({status:res.statusCode,body:value,headers:res.headers});
   });
  });req.on('error',reject);req.end(method==='GET'?undefined:JSON.stringify(payload));
 });
}
for(const [n,path,method] of [
 [1,'/api/v1/transactions','POST'],[2,'/api/v1/transactions/1/complete','POST'],
 [3,'/api/v1/transactions/1/cancel','POST'],[4,'/api/v1/refunds','POST'],
 [5,'/api/v1/payments','POST'],[6,'/api/v1/locks/1/release','POST'],
 [7,'/__ci__/f06-real-lock-transaction/open','POST'],[8,'/__ci__/f06-real-lock-transaction/open','GET'],
 [9,'/api/v1/transactions/1','GET']
]){
 test(String(n)+' TLS生产与非生产交易入口硬拒: '+path,async()=>{
  const r=await call(path,method,{role_code:'manager',system_admin_id:1,amountCents:1234});
  assert.equal(r.status,404);assert.deepEqual(r.body,{allowed:false,code:'NOT_FOUND'});
  assert.equal(r.headers['cache-control'],'no-store');
  assert.equal(r.body.amountCents,undefined);
 });
}
