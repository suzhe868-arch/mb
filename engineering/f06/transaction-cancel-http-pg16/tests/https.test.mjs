import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {before,after,test} from 'node:test';
import {assertEntry,productionIssuer} from '../server.mjs';
let server,port;
before(async()=>{
 assertEntry();assert.equal(productionIssuer().allowed,false);
 server=createServer({key:readFileSync('/tmp/f06-cancel-key.pem'),cert:readFileSync('/tmp/f06-cancel-cert.pem')},(req,res)=>{
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
   headers:{'content-type':'application/json',authorization:'Bearer forged-system-admin'}},res=>{
   const parts=[];res.on('data',x=>parts.push(x));res.on('end',()=>{
    resolve({status:res.statusCode,body:JSON.parse(Buffer.concat(parts).toString('utf8')),headers:res.headers});
   });
  });
  req.on('error',reject);
  req.end(method==='GET'?undefined:JSON.stringify({transactionId:1,role:'admin',amountCents:99999,vin:'synthetic'}));
 });
}
for(const [n,path,method] of [
 [1,'/api/v1/transactions/1/cancel','POST'],
 [2,'/api/v1/transactions/1/complete','POST'],
 [3,'/api/v1/transactions/1','GET'],
 [4,'/api/v1/refunds/1/refunded','POST'],
 [5,'/api/v1/refund_payments','POST'],
 [6,'/api/v1/payments','POST'],
 [7,'/api/v1/bank/refund','POST'],
 [8,'/api/v1/customer/1','GET'],
 [9,'/__ci__/f06-real-transaction-cancel/cancel','POST'],
 [10,'/__ci__/f06-real-transaction-cancel/cancel','GET']
]){
 test(String(n)+' TLS生产与真钱Cancel/Refund严格拒绝 '+path,async()=>{
  const r=await call(path,method);
  assert.equal(r.status,404);assert.deepEqual(r.body,{allowed:false,code:'NOT_FOUND'});
  assert.equal(r.headers['cache-control'],'no-store');
  assert.ok(!/vin|phone|amountCents|token|bank/i.test(JSON.stringify(r.body)));
 });
}
