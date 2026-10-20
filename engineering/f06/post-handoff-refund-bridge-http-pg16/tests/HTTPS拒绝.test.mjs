import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {before,after,test} from 'node:test';
import {assertEntry,createHttpServer} from '../server.mjs';
let server,port;
before(async()=>{
 assertEntry();
 const app=createHttpServer(),handler=app.listeners('request')[0];
 server=createServer({key:readFileSync('/tmp/f06-post-handoff-cancel-key.pem'),
  cert:readFileSync('/tmp/f06-post-handoff-cancel-cert.pem')},handler);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 port=server.address().port;
});
after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve))});
function call(path,method='POST',token=null){
 return new Promise((resolve,reject)=>{
  const headers={'content-type':'application/json'};
  if(token)headers.authorization='Bearer '+token;
  const q=request({host:'127.0.0.1',port,path,method,rejectUnauthorized:false,headers},r=>{
   const chunks=[];r.on('data',x=>chunks.push(x));r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,
    body:JSON.parse(Buffer.concat(chunks).toString('utf8'))}));
  });
  q.on('error',reject);q.end(method==='GET'?undefined:JSON.stringify({transactionId:1,amountCents:1,
   reason:'Synthetic rejected production attempt',eventKey:'issue159-tls-false-key-123456'}));
 });
}
for(const [name,path,method,expected] of [
 ['01 不允许真实退款路由','/api/v1/refund_payments','POST',404],
 ['02 不允许生产Transaction退款','/api/v1/transactions/1/refund','POST',404],
 ['03 不允许生产Transaction完成','/api/v1/transactions/1/complete','POST',404],
 ['04 不允许真实银行资金','/api/v1/bank/refund','POST',404],
 ['05 不允许微信真实退款','/api/v1/wechat/payments/refund','POST',404],
 ['06 不允许JYT外部入口','/api/v1/jyt/transactions','POST',404],
 ['07 不允许企业飞书写入','/api/v1/feishu/hooks','POST',404],
 ['08 不允许公开客户查询','/api/v1/customers','GET',404],
 ['09 无Token不能CI申请','/__ci__/f06-post-handoff-refund-bridge/request','POST',401],
 ['10 无Token不能CI关闭','/__ci__/f06-post-handoff-refund-bridge/close','POST',401],
 ['11 CI路由不允许GET','/__ci__/f06-post-handoff-refund-bridge/request','GET',404],
 ['12 CI路由不允许PATCH','/__ci__/f06-post-handoff-refund-bridge/close','PATCH',404]
]){
 test(name,async()=>{
  const r=await call(path,method);
  assert.equal(r.status,expected,JSON.stringify(r));
  assert.equal(r.body.allowed,false);
  assert.equal(r.headers['cache-control'],'no-store');
  assert.ok(!/phone|vin|secret|token|amountCents/i.test(JSON.stringify(r.body)));
 });
}
