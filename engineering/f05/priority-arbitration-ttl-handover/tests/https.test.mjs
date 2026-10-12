import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createPriorityCIRejectRouter} from '../ci-router.mjs';
const origin='https://127.0.0.1:48988',db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,tokens={};
async function call(path,method='POST',body={},headers={}){
 const b=body===null?null:Buffer.from(JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48988,path,method,rejectUnauthorized:false,
   headers:{origin,...(b?{'content-type':'application/json','content-length':b.length}:{}),...headers}},
   res=>{let s='';res.on('data',d=>s+=d);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(s),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);if(b)req.write(b);req.end();
 });
}
const path=x=>'/__ci__/f05-8/v1/'+x;
const denied=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.equal(r.body.code,'F05_8_PRIORITY_ISSUER_NOT_PRODUCTION');assert.match(r.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [name,login,password] of [
  ['sales','employee_test','SyntheticF04_3_CurrentProof_2026'],
  ['4s','four_s_test','SyntheticFourS_123456'],
  ['admin','admin_test','SyntheticAdmin_1234567']]){
  const x=await auth.login({login,password,source:'f05-8-true-tls-'+name});assert.equal(x.code,'AUTH_OK');tokens[name]=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},
  await createPriorityCIRejectRouter());
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(48988,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(r=>server.close(r));await auth.close();await db.end();secret.fill(0)});
test('8-B01 invented Priority qualification and VIP level do not issue real action',async()=>{
 for(const body of [{customerId:899612,enabled:true},{level:'VIP',priorityEnabled:true},{priority:true,role:'manager'}])
  denied(await call(path('qualification'),'POST',body));
});
test('8-B02 forged match tier, TTL and manual override are all denied',async()=>{
 for(const body of [{tier:'high',customerId:1},{manualOverride:true},{expiresAt:'2099-01-01',renew:true}])
  denied(await call(path('priority'),'POST',body));
});
test('8-B03 employee, 4S, SystemAdmin sessions do not turn into production Priority Issuers',async()=>{
 for(const token of Object.values(tokens))for(const endpoint of ['priority','qualification','handover'])
  denied(await call(path(endpoint),'POST',{customerId:899612},{cookie:'__Host-mb_pc='+token,'x-csrf-token':auth.csrfFor(token)}));
});
test('8-B04 no real Customer link visibility, old share link, history or priority lease customer pass',async()=>{
 for(const endpoint of ['vehicle','share','recommendation'])
  denied(await call(path(endpoint),'POST',{link:'stale',customerId:899613,priorityId:1}));
});
test('8-B05 fake Lock/Transaction/Deposit/wholesale price signals cannot bypass guards',async()=>{
 for(const body of [{activeLock:false,vehicleId:1},{transactionCancelled:true},{priceUnlocked:true},{wholesalePrice:1},{depositReceived:true}])
  denied(await call(path('priority'),'POST',body));
});
test('8-B06 signed Employee cookie with CSRF omitted/duplicate Cookie remains fail-closed',async()=>{
 for(const h of [{cookie:'__Host-mb_pc='+tokens.sales},{cookie:'__Host-mb_pc='+tokens.sales+'; __Host-mb_pc='+tokens.sales},
  {'x-csrf-token':'wrong',cookie:'__Host-mb_pc='+tokens.sales}])
   assert.equal((await call(path('release'),'POST',{},h)).status,403);
});
test('8-B07 cross-Origin identity and fake WeChat/phone/JYT headers denied',async()=>{
 for(const h of [{origin:'https://evil.invalid'},{'x-wechat-openid':'fake'},
  {'x-jyt-token':'invalid'},{authorization:'Bearer synthetic'},{'x-priority-issuer':'true'}]){
  const r=await call(path('ttl'),'POST',{ttlSeconds:86400},h);assert.equal(r.status,403);
 }
});
test('8-B08 no production /api positive Priority route or public GET',async()=>{
 assert.equal((await call('/api/v1/priority','POST',{})).status,404);
 assert.equal((await call('/api/v1/customer/priority','POST',{})).status,404);
 assert.equal((await call(path('priority'),'GET',null)).status,405);
});
test('8-B09 traversal, encoding tricks and unexpected request paths do not leak private details',async()=>{
 for(const p of ['/__ci__/f05-8/../../api/v1','/__ci__/f05-8/%2e%2e/api','/__ci__/f05-8/v1/priority?open=true'])
  assert.ok([400,404].includes((await call(p,'POST',{})).status));
});
test('8-B10 native TLS issuer denials leak no VIN, customer price, token or phone',async()=>{
 const x=await call(path('priority'),'POST',{vin:'fake',phone:'fake',price:1,token:'fake'});denied(x);
 assert.deepEqual(Object.keys(x.body),['code']);
 for(const word of ['wholesale','customerid','phone','vin','password','token','price'])
  assert.equal(JSON.stringify(x.body).toLowerCase().includes(word),false);
 await mkdir(new URL('../artifacts/priority-https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/priority-https/real-tls-priority-issuer-denial.json',import.meta.url),
  JSON.stringify({signed:await verify(db),CI_ONLY:true,productionPriorityIssuer:false,
  testCases:10,positiveProductionHTTP200:0},null,2)+'\n');
});
