import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {before,after,test} from 'node:test';
import {assertEntry,productionIssuerDeny} from '../server.mjs';
let server,port;
before(async()=>{
 assertEntry();assert.equal(productionIssuerDeny().allowed,false);
 server=createServer({key:readFileSync('/tmp/f06-handoff-key.pem'),cert:readFileSync('/tmp/f06-handoff-cert.pem')},(req,res)=>{
  res.writeHead(404,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify({allowed:false,code:'NOT_FOUND'}));
 });
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
 [10,'/__ci__/f06-real-transaction-handoff/transfer','POST'],
 [11,'/__ci__/f06-real-transaction-handoff/transfer','GET']
]){
 test(n+' TLS生产及CI写入接口拒绝 '+path,async()=>{
  const r=await call(path,method);
  assert.equal(r.status,404);assert.deepEqual(r.body,{allowed:false,code:'NOT_FOUND'});
  assert.equal(r.headers['cache-control'],'no-store');
  assert.ok(!/vin|phone|token|password|amountCents/i.test(JSON.stringify(r.body)));
 });
}
