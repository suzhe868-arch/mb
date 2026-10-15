import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {connect,verify} from '../migration.mjs';
import {ciFailClosedRouter} from '../ci-router.mjs';
let server,db;
const path=x=>'/__ci__/f06-5c/'+x;
async function call(url,method='POST',input={}){
 const buf=Buffer.from(JSON.stringify(input));
 return new Promise((resolve,reject)=>{
  const r=request({hostname:'127.0.0.1',port:49055,path:url,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:49055','content-type':'application/json','content-length':buf.length}},res=>{
   let b='';res.on('data',x=>b+=x);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(b),headers:res.headers}));
  });r.on('error',reject);r.end(buf);
 });
}
const deny=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.equal(x.body.code,'F06_5C_PRODUCTION_PRIORITY_ISSUER_NOT_WIRED');assert.equal(x.headers['cache-control'],'no-store')};
test.before(async()=>{
 db=await connect();assert.equal((await verify(db)).verified,true);
 server=createServer({key:readFileSync('/tmp/f06-5c-key.pem'),cert:readFileSync('/tmp/f06-5c-cert.pem')},ciFailClosedRouter());
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(49055,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));if(db)await db.end()});
test('5C-H01 新Priority生产签发拒绝',async()=>deny(await call(path('priority/create'))));
test('5C-H02 真实Transaction完成拒绝',async()=>deny(await call(path('transaction/complete'))));
test('5C-H03 实际退款拒绝',async()=>deny(await call(path('refund/refunded'))));
test('5C-H04 微信银行写入拒绝',async()=>deny(await call(path('finance/payment'))));
test('5C-H05 假签名经理拒绝',async()=>deny(await call(path('priority/create'),'POST',{role:'manager'})));
test('5C-H06 系统管理员不能越权',async()=>deny(await call(path('priority/create'),'POST',{principal_kind:'system_admin'})));
test('5C-H07 假权限跨店拒绝',async()=>deny(await call(path('priority/create'),'POST',{scope:'another-store',permission:'allow'})));
test('5C-H08 非隔离路径404与GET 405',async()=>{
 assert.equal((await call('/api/priorities/create')).status,404);
 assert.equal((await call(path('priority/create'),'GET')).status,405);
});
test('5C-H09 不回显敏感字段',async()=>{
 const x=await call(path('priority/create'),'POST',{token:'SECRET-TOKEN',VIN:'SECRET-VIN',phone:'SECRET-PHONE',payment:'SECRET-PAYMENT'});
 deny(x);for(const word of ['secret','vin','phone','payment'])assert.ok(!JSON.stringify(x.body).toLowerCase().includes(word));
});
