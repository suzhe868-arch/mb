import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {before,after,test} from 'node:test';
import {assertRealEntry,productionRefundIssuer} from '../server.mjs';
let server,port;
before(async()=>{
 assertRealEntry();
 assert.equal(productionRefundIssuer().allowed,false);
 server=createServer({
  key:readFileSync('/tmp/f06-refund-ci-key.pem'),
  cert:readFileSync('/tmp/f06-refund-ci-cert.pem')
 },(req,res)=>{
  res.writeHead(404,{'content-type':'application/json; charset=utf-8',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify({allowed:false,code:'NOT_FOUND'}));
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 port=server.address().port;
});
after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve))});
function call(path,method='POST',body={}){
 return new Promise((resolve,reject)=>{
  const req=request({host:'127.0.0.1',port,path,method,rejectUnauthorized:false,
   headers:{'content-type':'application/json',authorization:'Bearer unauthorized role admin and money'}},res=>{
   const bytes=[];res.on('data',part=>bytes.push(part));
   res.on('end',()=>{
    const b=JSON.parse(Buffer.concat(bytes).toString('utf8'));
    resolve({status:res.statusCode,body:b,headers:res.headers});
   });
  });
  req.on('error',reject);req.end(method==='GET'?undefined:JSON.stringify(body));
 });
}
for(const [n,path,method] of [
 [1,'/api/v1/refunds','POST'],
 [2,'/api/v1/refunds/1/closed','POST'],
 [3,'/api/v1/refunds/1/refunded','POST'],
 [4,'/api/v1/refund_payments','POST'],
 [5,'/api/v1/transactions','POST'],
 [6,'/api/v1/transactions/1/complete','POST'],
 [7,'/api/v1/bank/refund','POST'],
 [8,'/__ci__/f06-real-refund/pending','POST'],
 [9,'/__ci__/f06-real-refund/closed','POST'],
 [10,'/__ci__/f06-real-refund/pending','GET']
]){
 test(String(n)+' TLS非生产之外全拒: '+path,async()=>{
  const r=await call(path,method,{system_admin_id:1,role_code:'manager',phone:'fake',vin:'fake',amountCents:10000});
  assert.equal(r.status,404);assert.deepEqual(r.body,{allowed:false,code:'NOT_FOUND'});
  assert.equal(r.headers['cache-control'],'no-store');
  const data=JSON.stringify(r.body);assert.ok(!/amountCents|phone|vin|account|token/i.test(data));
 });
}
