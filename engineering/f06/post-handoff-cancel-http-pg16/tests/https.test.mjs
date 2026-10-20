import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {before,after,test} from 'node:test';
import {assertEntry,createHttpServer,productionIssuerDeny} from '../server.mjs';
let server,port;
before(async()=>{
 assertEntry();assert.equal(productionIssuerDeny().allowed,false);
 const app=createHttpServer();
 const handler=app.listeners('request')[0];
 assert.equal(typeof handler,'function','F06_POST_CANCEL_TLS_REAL_HANDLER_REQUIRED');
 server=createServer({key:readFileSync('/tmp/f06-post-handoff-cancel-key.pem'),cert:readFileSync('/tmp/f06-post-handoff-cancel-cert.pem')},handler);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 port=server.address().port;
});
after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve))});
function call(path,method='POST'){
 return new Promise((resolve,reject)=>{
  const req=request({host:'127.0.0.1',port,path,method,rejectUnauthorized:false,
   headers:{'content-type':'application/json',authorization:'Bearer forged-administrator'}},res=>{
   const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,
    body:JSON.parse(Buffer.concat(chunks).toString('utf8')),headers:res.headers}));
  });
  req.on('error',reject);req.end(method==='GET'?undefined:JSON.stringify({transactionId:1,newResponsibleId:4,role:'admin',vin:'synthetic'}));
 });
}
for(const [n,path,method] of [
 [1,'/api/v1/transactions/1/handoff','POST'],
 [2,'/api/v1/transactions/1/responsible','PATCH'],
 [3,'/api/v1/transactions/1/cancel','POST'],
 [4,'/api/v1/transactions/1/refund','POST'],
 [5,'/api/v1/transactions/1/complete','POST'],
 [6,'/api/v1/transactions/1','GET'],
 [7,'/api/v1/payments','POST'],
 [8,'/api/v1/refund_payments','POST'],
 [9,'/api/v1/bank/refund','POST'],
 [10,'/__ci__/f06-real-post-handoff-cancel/cancel','POST'],
 [11,'/__ci__/f06-real-post-handoff-cancel/cancel','GET']
]){
 test(n+' TLS生产及CI写入接口拒绝 '+path,async()=>{
  const r=await call(path,method);
  if(path==='/__ci__/f06-real-post-handoff-cancel/cancel'&&method==='POST'){
   assert.equal(r.status,401);assert.deepEqual(r.body,{allowed:false,code:'F06_POST_CANCEL_SIGNED_SESSION_DENIED'});
  }else{
   assert.equal(r.status,404);assert.deepEqual(r.body,{allowed:false,code:'NOT_FOUND'});
  }
  assert.equal(r.headers['cache-control'],'no-store');
  assert.ok(!/vin|phone|token|password|amountCents/i.test(JSON.stringify(r.body)));
 });
}
