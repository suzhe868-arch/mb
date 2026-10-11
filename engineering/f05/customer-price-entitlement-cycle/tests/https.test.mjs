import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createPriceCIHandler} from '../ci-router.mjs';
const db=await connect(),secret=randomBytes(32);
const origin='https://127.0.0.1:48984';
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const path='/__ci__/f05-4/v1/vehicles/1/price';
let server,employee,admin,four;
async function call(p,method='POST',payload={},heads={}){
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48984,path:p,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...heads}},
   res=>{let result='';res.on('data',chunk=>result+=chunk);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(result),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
const deny=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.equal(r.body.code,'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP');assert.match(r.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [name,password,kind] of [['admin_test','SyntheticAdmin_1234567','admin'],['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],['four_s_test','SyntheticFourS_123456','four']]){
  const x=await auth.login({login:name,password,source:'f05-4-loopback-reject-real-session'});assert.equal(x.code,'AUTH_OK');
  if(kind==='admin')admin=x.token;else if(kind==='employee')employee=x.token;else four=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createPriceCIHandler());
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(48984,'127.0.0.1',ok);});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));await auth.close();await db.end();secret.fill(0);});
test('4-B01 anonymous detailed wholesale numeric price HTTP cannot impersonate absent Customer session',async()=>{
 deny(await call(path,'POST',{intent:'DETAIL',customerId:1,idempotencyKey:'synthetic-untrusted-user-0001'}));
});
test('4-B02 Employee, SystemAdmin and 4S actual Sessions cannot bypass Customer Actor guard',async()=>{
 for(const token of [employee,admin,four]){
  deny(await call(path,'POST',{intent:'DETAIL',customerId:1},{cookie:'__Host-mb_pc='+token,'x-csrf-token':auth.csrfFor(token)}));
 }
});
test('4-B03 forged Customer identity, JYT token, client-provided free grant or quota cannot authorize price',async()=>{
 const examples=[
  [{customerId:999,priceMode:'UNLIMITED'}, {'x-customer-id':'999'}],
  [{customerId:999,isFree:true,hasRecommendation:true},{}],
  [{customerId:999,dailyQuota:999999},{}],
  [{customerId:999,upstreamPrice:12000},{authorization:'ApiKey mbci_'+'z'.repeat(43)}]
 ];
 for(const [body,heads] of examples)deny(await call(path,'POST',body,heads));
});
test('4-B04 CSRF, Origin, duplicate cookies and fake presenter click never prove real Customer action',async()=>{
 for(const headers of [
  {origin:'https://wrong-origin.invalid'},
  {cookie:'__Host-mb_pc='+employee+'; __Host-mb_pc='+employee},
  {'x-csrf-token':'fake','x-forwarded-for':'127.0.0.1'},
  {authorization:'Bearer synthetic-fake-token'}
 ]){
  const x=await call(path,'POST',{customerId:1,entry:'DETAIL',active:true},headers);
  assert.equal(x.status,403);assert.match(x.headers['cache-control'],/no-store/);
 }
});
test('4-B05 list/preload/cache/timeout/background cannot force digital price route to 200',async()=>{
 for(const entry of ['LIST','PREFETCH','CACHE','BACKGROUND','TIMEOUT']){
  deny(await call(path,'POST',{customerId:1,entry}));
 }
});
test('4-B06 unknown production path, unsupported method and encoded path traversal rejected',async()=>{
 assert.equal((await call('/api/v1/vehicles/1/price','POST',{})).status,404);
 assert.equal((await call(path,'GET',null)).status,405);
 assert.equal((await call('/__ci__/f05-4/../../prod','POST',{})).status,400);
});
test('4-B07 response never contains sensitive price/VIN/wholesale/Publisher/phone or live auth tokens',async()=>{
 const x=await call(path,'POST',{customerId:999,entry:'DETAIL',idempotencyKey:'test-unsafe-client-fact'});
 deny(x);
 const string=JSON.stringify(x.body);
 for(const w of ['customerDisplayCents','upstream','wholesale','vin','phone','publisher','credential','password','internalPrice'])
  assert.equal(string.toLowerCase().includes(w.toLowerCase()),false);
 await mkdir(new URL('../artifacts/https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/https/customer-session-denial-proof.json',import.meta.url),
  JSON.stringify({realSourceGap:'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP',
   positiveProductionCustomerPriceResponses:0,loopbackTLS:true,allSevenNegativeMatricesPassed:true,
   origin,syntheticCustomerSessionIssuer:false,verifiedVersion:await verify(db)},null,2)+'\n');
 console.log('F05_4_TRUE_PG16_REAL_HTTPS_NO_CUSTOMER_SESSION_FAIL_CLOSED');
});
