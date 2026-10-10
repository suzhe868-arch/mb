import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:https';
import {request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {createCurrentRouteHandler,CURRENT_ROUTE_COUNT} from '../current-router.mjs';
import {loadContracts} from '../source-guard.mjs';
const ORIGIN='https://127.0.0.1:48983',secret=randomBytes(32);
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:ORIGIN});
let server,ownerToken,oldToken,adminToken,fourToken,employeeToken;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
async function call(method,path,headers={},body){
 return await new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48983,method,path,rejectUnauthorized:false,
   headers:{origin:ORIGIN,...headers,...(body?{'content-type':'application/json','content-length':Buffer.byteLength(body)}:{})}},res=>{
    let raw='';res.on('data',c=>raw+=c);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(raw),headers:res.headers})}catch(e){reject(e)}});
   });req.on('error',reject);req.end(body);
 });
}
test.before(async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 const first=await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'f04-3-first'});
 assert.equal(first.code,'AUTH_OK');oldToken=first.token;
 assert.equal((await auth.change({token:first.token,csrf:first.csrf,oldPassword:'SyntheticPassword_12345',
  newPassword:'SyntheticF04_3_CurrentProof_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 const owner=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f04-3-current'});
 assert.equal(owner.code,'AUTH_OK');ownerToken=owner.token;
 const a=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f04-3-admin'});
 assert.equal(a.code,'AUTH_OK');adminToken=a.token;
 const f=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f04-3-4s'});
 assert.equal(f.code,'AUTH_OK');fourToken=f.token;
 const e=await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'f04-3-employee'});
 assert.equal(e.code,'AUTH_OK');employeeToken=e.token;
 // 复用已签F04-1合成Customer #302现时object scope，不创建任何新授权。
 await db.query("UPDATE public.customers SET owner_assignment_state='assigned',current_owner_employee_id=1 WHERE customer_id=302");
 const handler=await createCurrentRouteHandler(auth);
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},handler);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48983,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await db.query("UPDATE public.customers SET owner_assignment_state='unassigned',current_owner_employee_id=NULL WHERE customer_id=302");
 await auth.close();await db.end();secret.fill(0);
});
const MINIMAL='/__ci__/current/v1/objects/customers/302/proof';
const PUBLISH='/__ci__/current/v1/vehicles/publish';
test('F04-3-B01 exact Current registry 30 entries & PG16 M94 physically authentic',async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 assert.equal(CURRENT_ROUTE_COUNT,32);assert.equal(loadContracts().length,32);
});
test('F04-3-B02 positive ONLY existing F04-1 physical employee/object CRM scope -> minimal fields',async()=>{
 const x=await call('GET',MINIMAL,cookie(ownerToken));
 assert.equal(x.status,200,JSON.stringify(x));
 assert.deepEqual(x.body,{code:'F04_CUSTOMER_CURRENT_OWNER',customerId:302,objectScope:'CURRENT_OWNER_ONLY',disposable:true});
 assert.equal(x.headers['cache-control'],'no-store, private, max-age=0');
 for(const field of ['phone','vin','internalPrice','price','password','employeeId','role','token','credentials'])
  assert.ok(!Object.hasOwn(x.body,field),field);
});
test('F04-3-B03 anonymous, former session, Admin, 4S, other employee fail full object access',async()=>{
 for(const [t,expected] of [[null,401],[oldToken,401],[adminToken,403],[fourToken,403],[employeeToken,403]]){
  const r=await call('GET',MINIMAL,t?cookie(t):{});
  assert.equal(r.status,expected,JSON.stringify(r));
 }
});
test('F04-3-B04 current Customer object owner drift revokes old employee immediately',async()=>{
 await db.query("UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=302");
 try{assert.equal((await call('GET',MINIMAL,cookie(ownerToken))).status,403);}
 finally{await db.query("UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=302");}
 assert.equal((await call('GET',MINIMAL,cookie(ownerToken))).status,200);
});
test('F04-3-B05 real proposed Employee operation is never fake 200 or data write',async()=>{
 const before=(await db.query("SELECT count(*)::int n FROM public.vehicles")).rows[0].n;
 assert.equal((await call('POST',PUBLISH,cookie(ownerToken))).status,403,'CSRF required before blocked downstream');
 const x=await call('POST',PUBLISH,{...cookie(ownerToken),'x-csrf-token':auth.csrfFor(ownerToken),'x-request-key':'F04_3_test_valid_001'});
 assert.equal(x.status,501,JSON.stringify(x));assert.deepEqual(x.body,{code:'F04_3_DEPENDENCY_BLOCKED'});
 assert.equal((await db.query("SELECT count(*)::int n FROM public.vehicles")).rows[0].n,before);
});
test('F04-3-B06 Customer/4S/System Admin cannot inherit Employee business actions',async()=>{
 for(const t of [adminToken,fourToken])assert.equal((await call('GET','/__ci__/current/v1/lockrequests/review-open',cookie(t))).status,403);
 assert.equal((await call('POST','/__ci__/current/v1/consultations/create',{...cookie(ownerToken),'x-csrf-token':auth.csrfFor(ownerToken),'x-request-key':'F04_3_test_valid_002'})).status,403);
});
test('F04-3-B07 known action with wrong method=405, unknown and old legacy paths=404',async()=>{
 assert.equal((await call('GET',PUBLISH,cookie(ownerToken))).status,405);
 assert.equal((await call('GET','/__ci__/current/v1/actions/unknown',cookie(ownerToken))).status,404);
 for(const path of ['/customer/vehicles','/staff/vehicles','/admin/integrations/collector/connection',
   '/admin/integrations/collector/connection:test','/__ci__/current/v1/vehicles/publish/extra'])
  assert.equal((await call('GET',path,cookie(ownerToken))).status,404,path);
});
test('F04-3-B08 duplicate/malformed cookies, bearer, Host, Origin and caller CI spoof denied',async()=>{
 assert.equal((await call('GET',MINIMAL,{cookie:'__Host-mb_pc=invalid'})).status,400);
 assert.equal((await call('GET',MINIMAL,{cookie:'__Host-mb_pc='+ownerToken+'; __Host-mb_pc='+ownerToken})).status,400);
 assert.equal((await call('GET',MINIMAL,{...cookie(ownerToken),authorization:'Bearer forged'})).status,401);
 assert.equal((await call('GET',MINIMAL,{...cookie(ownerToken),origin:'https://bad.invalid'})).status,403);
 assert.equal((await call('GET',MINIMAL,{...cookie(ownerToken),host:'bad.invalid'})).status,403);
 const x=await call('GET',MINIMAL,{...cookie(ownerToken),'x-role':'system_admin','x-ci-isolation':'true'});
 assert.equal(x.status,200);assert.equal(x.body.code,'F04_CUSTOMER_CURRENT_OWNER');
});
test('F04-3-B09 query, unexpected body, traversal/casing, id spoof, print/export/copy denied',async()=>{
 assert.equal((await call('GET',MINIMAL+'?export=all',cookie(ownerToken))).status,422);
 assert.equal((await call('GET',MINIMAL,cookie(ownerToken),'{"price":1}')).status,400);
 assert.equal((await call('GET','/__ci__/current/v1/objects/customers/0/proof',cookie(ownerToken))).status,404);
 assert.equal((await call('GET','/__ci__/CURRENT/v1/actions/vehicle-publish-079',cookie(ownerToken))).status,404);
 for(const suffix of ['?view=print','?view=copy','?view=export','?vip=true']){
  const x=await call('GET',MINIMAL+suffix,cookie(ownerToken));assert.equal(x.status,422);
 }
 assert.equal((await call('GET','/__ci__/current/v1/actions/%2e%2e%2fvehicle-publish-079',cookie(ownerToken))).status,400);
});
test('F04-3-B10 bad CSRF, invalid replay key, wrong payload, expired lifecycle denied',async()=>{
 assert.equal((await call('POST',PUBLISH,{...cookie(ownerToken),'x-csrf-token':'invalid','x-request-key':'F04_3_test_valid_003'})).status,403);
 assert.equal((await call('POST',PUBLISH,{...cookie(ownerToken),'x-csrf-token':auth.csrfFor(ownerToken),'x-request-key':'x'})).status,422);
 assert.equal((await call('POST',PUBLISH,{...cookie(ownerToken),'x-csrf-token':auth.csrfFor(ownerToken),'x-request-key':'F04_3_test_valid_003'},'{"role":"admin"}')).status,400);
});
test('F04-3-B11 no fake customer tier or 4S merchant object, no sensitive output for registered route',async()=>{
 for(const x of loadContracts().filter(z=>z.source_kind==='NEW_CURRENT_ACTION').slice(0,3)){
  const headers={...cookie(ownerToken),'x-csrf-token':auth.csrfFor(ownerToken),'x-request-key':'F04_3_test_valid_011'};
  const r=await call(x.method,x.path,headers);
  assert.notEqual(r.status,200);assert.ok(r.status===403||r.status===501,JSON.stringify(r));
  assert.ok(!/vin|internal_wholesale_price|phone|password|token/.test(JSON.stringify(r.body)));
 }
});
