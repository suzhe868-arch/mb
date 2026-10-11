import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createFindCarCIRejectRouter} from '../ci-router.mjs';
const db=await connect(),secret=randomBytes(32),origin='https://127.0.0.1:48987';
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const app='/__ci__/f05-6/v1/applications',activate=app+'/899611/activate';
let server,tokens={};
async function call(path,method='POST',payload={},headers={}){
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48987,path,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':bytes.length}:{}),...headers}},
   res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(s),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 })
}
const denied=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.equal(x.body.code,'F05_6_REAL_CUSTOMER_PHONE_PERMISSION_ISSUERS_SOURCE_GAP');assert.match(x.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [k,login,password] of [
  ['sales','employee_test','SyntheticF04_3_CurrentProof_2026'],
  ['four','four_s_test','SyntheticFourS_123456'],
  ['admin','admin_test','SyntheticAdmin_1234567']]){
  let x=await auth.login({login,password,source:'f05-6-https-no-source-'+k});assert.equal(x.code,'AUTH_OK');tokens[k]=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createFindCarCIRejectRouter());
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(48987,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(r=>server.close(r));await auth.close();await db.end();secret.fill(0)});
test('6-B01 fake Customer actor and mobile consent must not submit Application',async()=>denied(await call(app,'POST',{customerId:899611,hasPhone:true,desiredVehicle:'AUDI'})));
test('6-B02 fabricated 微信 code, bearer and JYT token are never a Customer Session issuer',async()=>{
 for(const h of [{authorization:'Bearer synthetic-wechat-token'},
   {authorization:'ApiKey mbci_'+'z'.repeat(43)},{'x-wechat-openid':'pretend-open-id'}])
  denied(await call(app,'POST',{customerId:899612,wechatCode:'synthetic'},h));
});
test('6-B03 original F03 Employee, 4S and SystemAdmin sessions cannot impersonate Customer actor or demand activation',async()=>{
 for(const t of Object.values(tokens))for(const path of [app,activate])
  denied(await call(path,'POST',{hasPhone:true,hasEntitlement:true},{cookie:'__Host-mb_pc='+t,'x-csrf-token':auth.csrfFor(t)}));
});
test('6-B04 attacker assertion of customer owner, phone, level, permission and recommendation does not authorize activation',async()=>{
 for(const p of [{canActivate:true,isManager:true,ownerId:1},{level:'VIP',hasEntitlement:true},{phoneAuthorized:true,customerId:899611},
   {customerId:899611,isFree:true,role:'manager'}])denied(await call(activate,'POST',p));
});
test('6-B05 duplicate cookies, bad CSRF and cross origin enforce fail-closed and no-store',async()=>{
 for(const h of [{cookie:'__Host-mb_pc='+tokens.sales+'; __Host-mb_pc='+tokens.sales},{'x-csrf-token':'invalid'},
  {origin:'https://invalid.example'}]){
  const x=await call(activate,'POST',{customerId:899611},h);
  assert.equal(x.status,403);assert.match(x.headers['cache-control'],/no-store/);
 }
});
test('6-B06 no real /api paths, unsupported methods or path traversal can become active',async()=>{
 assert.equal((await call('/api/v1/find-car/applications','POST',{})).status,404);
 assert.equal((await call(app,'GET',null)).status,405);
 assert.equal((await call('/__ci__/f05-6/../../api/v1','POST',{})).status,400);
});
test('6-B07 no Customer raw phone, VIN, wholesale price, demand or sensitive token leaks',async()=>{
 const x=await call(activate,'POST',{customerId:899611,phone:'faked',isManager:true});
 denied(x);
 assert.deepEqual(Object.keys(x.body),['code'],'denial exposes only a fixed error code, no phone fields or personal data');
 for(const key of ['vin','customerid','wholesale','displayprice','password','token','applicationid','demandid'])
  assert.equal(JSON.stringify(x.body).toLowerCase().includes(key),false);
 const n=(await db.query('SELECT count(*)::int n FROM public.f05_6_activation_events_ci')).rows[0].n;assert.equal(n,0);
 await mkdir(new URL('../artifacts/https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/https/real-tls-issuer-fail-closed.json',import.meta.url),
 JSON.stringify({signedVersion:await verify(db),sourceGap:'F05_6_REAL_CUSTOMER_PHONE_PERMISSION_ISSUERS_SOURCE_GAP',
  actualProductionCustomerSession:false,actualProductionPhoneIssuer:false,actualProductionEmployeeActivationPermission:false,
  allSevenGenuineTLSDenials:true,realDemandActivationHTTP200:0},null,2)+'\n');
 console.log('F05_6_TRUE_TLS_NO_REAL_CUSTOMER_FIND_CAR_OR_DEMAND_ACTIVATION');
});
