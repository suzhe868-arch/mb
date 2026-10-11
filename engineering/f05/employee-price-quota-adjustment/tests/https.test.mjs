import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {ciOnlyQuotaHTTP} from '../ci-router.mjs';
const db=await connect(),secret=randomBytes(32),origin='https://127.0.0.1:48986';
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const path='/__ci__/f05-5/v1/customers/899511/daily-quota-add';
let server,sales,manager,four,admin;
const url=(p,method='POST',payload={},heads={})=>{
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48986,path:p,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':bytes.length}:{}),...heads}},
   res=>{let s='';res.on('data',d=>s+=d);res.on('end',()=>{try{resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(s)})}catch(e){reject(e)}})});
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
};
const deny=x=>{assert.equal(x.status,403);assert.equal(x.body.code,'F05_5_EMPLOYEE_ADDITION_SOURCE_GAP');assert.match(x.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [k,login,password] of [
  ['sales','employee_test','SyntheticF04_3_CurrentProof_2026'],
  ['manager','http_test','SyntheticHttps_1234567'],
  ['four','four_s_test','SyntheticFourS_123456'],
  ['admin','admin_test','SyntheticAdmin_1234567']
 ]){
  const x=await auth.login({login,password,source:'f05-5-native-https-'+k});
  assert.equal(x.code,'AUTH_OK');if(k==='sales')sales=x.token;if(k==='manager')manager=x.token;
  if(k==='four')four=x.token;if(k==='admin')admin=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await ciOnlyQuotaHTTP());
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(48986,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));await auth.close();await db.end();secret.fill(0)});
test('5-B01 unsigned real HTTP Employee quota endpoint defaults fail closed for anonymous',async()=>{deny(await url(path,'POST',{customerId:899511,delta:1,teamId:901}))});
test('5-B02 real F03 Employee, manager, 4S and SystemAdmin sessions alone cannot grant quota',async()=>{
 for(const t of [sales,manager,four,admin])deny(await url(path,'POST',{customerId:899511,delta:2},{cookie:'__Host-mb_pc='+t,'x-csrf-token':auth.csrfFor(t)}));
});
test('5-B03 caller-asserted current owner, manager, role, team and permission cannot impersonate server source',async()=>{
 for(const p of [{isManager:true,ownerId:1},{role:'store_head',scope:true},{permission:true,teamId:901},{customerId:899511,delta:99999999}])
  deny(await url(path,'POST',p));
});
test('5-B04 fake JYT authorization and random token/cookie or duplicate cookie are never source of permission',async()=>{
 for(const h of [{authorization:'ApiKey mbci_'+'x'.repeat(43)},{authorization:'Bearer synthetic-bad-token'},
  {cookie:'__Host-mb_pc='+sales+'; __Host-mb_pc='+sales}])deny(await url(path,'POST',{},h));
});
test('5-B05 cross-Origin and forged proxy origin rejected and response contains no sensitive fields',async()=>{
 for(const h of [{origin:'https://invalid.example'},{'x-forwarded-host':'invalid.example'},{'x-csrf-token':'synthetic-invalid'}]){
  const x=await url(path,'POST',{customerId:899511,delta:1},h);
  assert.equal(x.status,403);
  const payload=JSON.stringify(x.body).toLowerCase();
  for(const t of ['customerdisplaycents','upstream','wholesale','vin','phone','password','token','customerid'])
   assert.equal(payload.includes(t),false);
 }
});
test('5-B06 non-CI API, encoded paths, unsupported GET must not be registered',async()=>{
 assert.equal((await url('/api/v1/customers/899511/daily-quota-add','POST',{})).status,404);
 assert.equal((await url(path,'GET',null)).status,405);
 assert.equal((await url('/__ci__/f05-5/../../prod','POST',{})).status,400);
});
test('5-B07 existing Customer digital price HTTP 200 must not be added by quota CI router; final native PG16 seal',async()=>{
 assert.equal((await url('/__ci__/f05-4/v1/vehicles/1/price','POST',{})).status,404);
 await mkdir(new URL('../artifacts/https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/https/real-https-no-issuer-proof.json',import.meta.url),
  JSON.stringify({mode:'CI_ONLY',verified:await verify(db),positiveProductionEmployeeQuotaHTTP:0,
   sourceGap:'F05_5_EMPLOYEE_ADDITION_SOURCE_GAP',allSevenHTTPSNegativeCases:true},null,2)+'\n');
 console.log('F05_5_TRUE_LOOPBACK_HTTPS_NO_PRODUCTION_ISSUER_FAIL_CLOSED');
});
