// F04-2B: actual PG16 M94 + disposable local HTTPS for isolated 4S preflight.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:https';
import {request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {createF04_2Preflight,F04_2_PRECHECK_CONTRACT} from '../4s-preflight.mjs';
const ORIGIN='https://127.0.0.1:48982',secret=randomBytes(32);
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:ORIGIN});
let server,adminToken,fourToken,employeeToken,oldToken;
const cookie=x=>({cookie:'__Host-mb_pc='+x});
async function call(method,path,headers={},body){
 return await new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48982,method,path,rejectUnauthorized:false,
    headers:{origin:ORIGIN,...headers,...(body?{'content-type':'application/json','content-length':Buffer.byteLength(body)}:{})}},res=>{
   let raw='';res.on('data',s=>raw+=s);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(raw),headers:res.headers})}catch(e){reject(e)}});
  });req.on('error',reject);req.end(body);
 });
}
test.before(async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 const ad=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f04-2admin'});
 assert.equal(ad.code,'AUTH_OK');adminToken=ad.token;
 const four=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f04-2four'});
 assert.equal(four.code,'AUTH_OK');fourToken=four.token;
 const emp=await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'f04-2employee'});
 assert.equal(emp.code,'AUTH_OK');employeeToken=emp.token;
 const handler=await createF04_2Preflight(auth);
 server=createServer({key:readFileSync('/tmp/f04-2-ci-key.pem'),cert:readFileSync('/tmp/f04-2-ci-cert.pem')},handler);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48982,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('F04-B01 System Admin current separate principal can only see synthetic control-plane proof',async()=>{
 assert.equal(F04_2_PRECHECK_CONTRACT.length,2);
 const r=await call('GET','/api/v1/f04/4s/governance-self',cookie(adminToken));
 assert.equal(r.status,200,JSON.stringify(r));
 assert.deepEqual(r.body,{code:'F04_4S_GOVERNANCE_AUTHENTICATED',ciOnly:true,readOnly:true});
 assert.equal(r.headers['cache-control'],'private, no-store, max-age=0');
 for(const forbidden of ['name','phone','password','token','employeeId','storeId','customer','vin','price','session'])assert.ok(!(forbidden in r.body));
});
test('F04-B02 anonymous, employee, 4S cannot enter System Admin control plane',async()=>{
 for(const token of [null,employeeToken,fourToken]){
  const headers=token?cookie(token):{};
  const r=await call('GET','/api/v1/f04/4s/governance-self',headers);
  assert.equal(r.status,token?403:401,JSON.stringify(r));
  assert.equal((await call('GET','/api/v1/f04/4s/accounts/2/preflight',headers)).status,token?403:401);
 }
});
test('F04-B03 valid 4S target has no merchant attribution: deny regardless of System Admin',async()=>{
 for(const id of ['2','5','7','9999']){
  const r=await call('GET','/api/v1/f04/4s/accounts/'+id+'/preflight',cookie(adminToken));
  assert.equal(r.status,403);assert.deepEqual(r.body,{code:'F04_4S_ACCOUNT_SCOPE_UNPROVEN'});
 }
 const candidate=(await db.query("SELECT e.employee_id,r.role_code,e.store_id FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=2")).rows[0];
 assert.equal(candidate.role_code,'four_s');
 assert.equal(candidate.store_id,null,'NO_TRUSTED_MERCHANT_BINDING_NO_BUSINESS_MUTATION');
});
test('F04-B04 no non-GET/POST management, invalid path/DTO/query or body is accepted',async()=>{
 for(const method of ['POST','PATCH','PUT','DELETE']){
  assert.equal((await call(method,'/api/v1/f04/4s/accounts/2/preflight',cookie(adminToken))).status,405);
 }
 assert.equal((await call('GET','/api/v1/f04/4s/accounts/2/preflight?role=admin',cookie(adminToken))).status,422);
 assert.equal((await call('GET','/api/v1/f04/4s/accounts/2/preflight',cookie(adminToken),'{"admin":true}')).status,400);
 assert.equal((await call('GET','/api/v1/f04/4s/accounts/-1/preflight',cookie(adminToken))).status,404);
 assert.equal((await call('GET','/api/v1/f04/4s/accounts/2/edit',cookie(adminToken))).status,404);
});
test('F04-B05 origin, host, bearer and duplicate/stale cookies cannot bypass trusted Session',async()=>{
 assert.equal((await call('GET','/api/v1/f04/4s/governance-self',{...cookie(adminToken),origin:'https://evil.invalid'})).status,403);
 assert.equal((await call('GET','/api/v1/f04/4s/governance-self',{...cookie(adminToken),host:'evil.invalid'})).status,403);
 assert.equal((await call('GET','/api/v1/f04/4s/governance-self',{...cookie(adminToken),authorization:'Bearer impersonate-admin'})).status,401);
 assert.equal((await call('GET','/api/v1/f04/4s/governance-self',{cookie:'__Host-mb_pc='+adminToken+'; __Host-mb_pc='+adminToken})).status,400);
 assert.equal((await call('GET','/api/v1/f04/4s/governance-self',{cookie:'__Host-mb_pc=invalid'})).status,400);
});
test('F04-B06 identity state and force password change immediately revoke preflight',async()=>{
 const original=(await db.query("SELECT force_password_change FROM public.pc_login_accounts WHERE normalized_login_key='admin_test'")).rows[0].force_password_change;
 await db.query("UPDATE public.pc_login_accounts SET force_password_change=true WHERE normalized_login_key='admin_test'");
 try{assert.equal((await call('GET','/api/v1/f04/4s/governance-self',cookie(adminToken))).status,403)}
 finally{await db.query('UPDATE public.pc_login_accounts SET force_password_change=$1 WHERE normalized_login_key=$2',[original,'admin_test'])}
 assert.equal((await call('GET','/api/v1/f04/4s/governance-self',cookie(adminToken))).status,200);
});
test('F04-B07 two independent valid System Admin PG16 sessions cannot write accounts',async()=>{
 const second=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f04-2-second'});
 assert.equal(second.code,'AUTH_OK');
 const before=(await db.query("SELECT count(*)::int n FROM public.pc_login_accounts")).rows[0].n;
 try{
  const hits=await Promise.all([adminToken,second.token].map(tok=>call('GET','/api/v1/f04/4s/accounts/2/preflight',
   {...cookie(tok),'x-ci-isolation':'true','x-request-key':'same-request-key-f042'})));
  assert.deepEqual(hits.map(x=>x.status),[403,403]);
  assert.ok(hits.every(x=>x.body.code==='F04_4S_ACCOUNT_SCOPE_UNPROVEN'));
  assert.equal((await db.query("SELECT count(*)::int n FROM public.pc_login_accounts")).rows[0].n,before);
  await auth.logout(second.token);
  assert.equal((await call('GET','/api/v1/f04/4s/governance-self',cookie(second.token))).status,403);
 }finally{await auth.logout(second.token)}
});
test('F04-B08 old CRM/Vehicle/funds routes still refuse System Admin privilege pivot',async()=>{
 for(const [method,path] of [['GET','/api/v1/f04/customers/302'],
  ['GET','/api/v1/f04/vehicles/39001?teamId=901&view=export']]){
  const r=await call(method,path,cookie(adminToken));assert.equal(r.status,403,JSON.stringify(r));
 }
 for(const path of ['/admin/integrations/collector/connection','/api/v1/admin/integrations/collector/connection:test']){
  assert.equal((await call('GET',path,cookie(adminToken))).status,404);
 }
 const r=await call('POST','/api/v1/f04/transactions',cookie(adminToken));
 assert.equal(r.status,403,'CSRF hard deny');
});
test('F04-B09 production or absent explicit F04-2 startup gate fails closed',async()=>{
 const old=process.env.F04_2_ISOLATION_CONFIRM;
 try{
  delete process.env.F04_2_ISOLATION_CONFIRM;
  await assert.rejects(()=>createF04_2Preflight(auth),/F04_2_STARTUP_ENV_DENIED/);
 }finally{process.env.F04_2_ISOLATION_CONFIRM=old}
});
