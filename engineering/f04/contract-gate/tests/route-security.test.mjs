// F04-1 Route-Security: real non-privileged M94 PG16 + disposable loopback TLS.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer as tlsServer} from 'node:https';
import {request as httpsRequest} from 'node:https';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {createF04ContractHandler} from '../safe-router.mjs';

const ORIGIN='https://127.0.0.1:48981',SECRET=randomBytes(32);
const db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:SECRET,origin:ORIGIN});
let server,token,oldToken,adminToken,fourToken,objectToken,objectOldToken;
const cookie=t=>({'cookie':'__Host-mb_pc='+t});
async function http(method,path,headers={},body){
  return await new Promise((resolve,reject)=>{
    const req=httpsRequest({host:'127.0.0.1',port:48981,path,method,rejectUnauthorized:false,
      headers:{origin:ORIGIN,...headers,...(body?{'content-type':'application/json','content-length':Buffer.byteLength(body)}:{})}},res=>{
      let raw='';res.on('data',x=>raw+=x);res.on('end',()=>{
        try{resolve({status:res.statusCode,body:JSON.parse(raw),headers:res.headers})}
        catch(e){reject(e)}
      });
    });req.on('error',reject);req.end(body);
  });
}
test.before(async()=>{
  assert.equal((await verifyM94(db)).verified,true);
  const login=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'f04'});
  assert.equal(login.code,'AUTH_OK');oldToken=login.token;
  assert.equal((await auth.change({token:oldToken,csrf:login.csrf,oldPassword:'SyntheticHttps_1234567',
    newPassword:'SyntheticF04_2026_ContractGate'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
  const second=await auth.login({login:'http_test',password:'SyntheticF04_2026_ContractGate',source:'f04new'});
  assert.equal(second.code,'AUTH_OK');token=second.token;
  const four=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f04four'});
  assert.equal(four.code,'AUTH_OK');fourToken=four.token;
  const adm=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f04admin'});
  assert.equal(adm.code,'AUTH_OK');adminToken=adm.token;
  // M94 F03-2 scope fixture already contains exact employee1->customer302
  // object scope 102 bound to independent crm.customer.view (permission 12).
  // Only the synthetic customer's current owner fact is made current here;
  // no new or forged object/scope/capability binding is inserted.
  const ownerLogin=await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'f04-object'});
  assert.equal(ownerLogin.code,'AUTH_OK');objectOldToken=ownerLogin.token;
  assert.equal((await auth.change({token:ownerLogin.token,csrf:ownerLogin.csrf,
    oldPassword:'SyntheticPassword_12345',newPassword:'SyntheticF04_Object_2026_Current'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
  const ownerSecond=await auth.login({login:'employee_test',password:'SyntheticF04_Object_2026_Current',source:'f04-object-new'});
  assert.equal(ownerSecond.code,'AUTH_OK');objectToken=ownerSecond.token;
  await db.query("UPDATE public.customers SET owner_assignment_state='assigned',current_owner_employee_id=1 WHERE customer_id=302");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(44041,'active',1,'assigned',5)");
  const handler=await createF04ContractHandler(auth);
  server=tlsServer({key:readFileSync('/tmp/f04-ci-key.pem'),cert:readFileSync('/tmp/f04-ci-cert.pem')},handler);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48981,'127.0.0.1',resolve)});
});
test.after(async()=>{
  if(server)await new Promise(resolve=>server.close(resolve));
  await db.query('DELETE FROM public.customers WHERE customer_id=44041');
  await db.query("UPDATE public.customers SET owner_assignment_state='unassigned',current_owner_employee_id=NULL WHERE customer_id=302");
  await auth.close();await db.end();SECRET.fill(0);
});
test('F04-R01 current authenticated PC session gives only synthetic proof, no private fields',async()=>{
  const r=await http('GET','/api/v1/f04/session/proof',cookie(token));
  assert.equal(r.status,200);assert.equal(r.body.code,'F04_SESSION_PROVEN');
  assert.equal(r.body.principalKind,'employee');
  assert.equal(r.headers['cache-control'],'no-store, private, max-age=0');
  for(const forbidden of ['vin','password','price','phone','employeeId','roleCode','token','csrf'])assert.ok(!(forbidden in r.body));
});
test('F04-R02 anonymous, revoked first login token, malformed and duplicate session cookie fail',async()=>{
  assert.equal((await http('GET','/api/v1/f04/session/proof')).status,401);
  assert.equal((await http('GET','/api/v1/f04/session/proof',cookie(oldToken))).status,401);
  assert.equal((await http('GET','/api/v1/f04/session/proof',{cookie:'__Host-mb_pc=invalid'})).status,400);
  assert.equal((await http('GET','/api/v1/f04/session/proof',{cookie:'__Host-mb_pc='+token+'; __Host-mb_pc='+token})).status,400);
});
test('F04-R03 no cross-origin, bearer override, or caller-declared trusted CI header',async()=>{
  assert.equal((await http('GET','/api/v1/f04/session/proof',{...cookie(token),origin:'https://attacker.invalid'})).status,403);
  assert.equal((await http('GET','/api/v1/f04/session/proof',{...cookie(token),authorization:'Bearer forged'})).status,401);
  const r=await http('GET','/api/v1/f04/session/proof',{...cookie(token),'x-ci-isolation':'true'});
  assert.equal(r.status,200);
});
test('F04-R04 wrong method and malformed DTO reject; old routes cannot resurrect',async()=>{
  assert.equal((await http('POST','/api/v1/f04/session/proof',cookie(token))).status,405);
  assert.equal((await http('GET','/api/v1/f04/session/proof?claimedRole=admin',cookie(token))).status,422);
  assert.equal((await http('GET','/customer/vehicles',cookie(token))).status,404);
  assert.equal((await http('GET','/api/v1/staff/vehicle/export',cookie(token))).status,404);
  assert.equal((await http('GET','/api/v1/f04/vehicle/unknown',cookie(token))).status,404);
  // These three original Collector management calls are explicitly retired.
  // Neither legacy URL nor a /api/v1 wrapper may silently restore them.
  for(const [method,path] of [
    ['GET','/admin/integrations/collector/connection'],
    ['PATCH','/admin/integrations/collector/connection'],
    ['POST','/admin/integrations/collector/connection:test']
  ]){
    const x=await http(method,path,cookie(token));
    assert.equal(x.status,404,JSON.stringify(x));
    const y=await http(method,'/api/v1'+path,cookie(token));
    assert.equal(y.status,404,JSON.stringify(y));
  }
});
test('F04-R05 valid current employee CRM scope cannot grant any Vehicle outlet',async()=>{
  for(const view of ['list','detail','history','cache','export','copy','print']){
    const r=await http('GET','/api/v1/f04/vehicles/39001?teamId=901&view='+view,cookie(token));
    assert.equal(r.status,403,JSON.stringify(r.body));
    assert.equal(r.body.code,'P_VEHICLE_SCOPE_UNPROVEN',JSON.stringify(r.body));
    assert.deepEqual(Object.keys(r.body),['code']);
  }
});
test('F04-R06 four-S and System Admin principal are not employee Vehicle detail/export grants',async()=>{
  for(const t of [adminToken,fourToken]){
    const r=await http('GET','/api/v1/f04/vehicles/39001?teamId=901&view=export',cookie(t));
    assert.equal(r.status,403);assert.equal(r.body.code,'F04_BUSINESS_PRINCIPAL_DENIED');
  }
});
test('F04-R07 invalid team, client entitlement, DTO pollution and duplicate team are refused',async()=>{
  for(const q of ['teamId=0&view=detail','teamId=901&view=detail&role=manager',
    'teamId=901&teamId=901&view=detail','teamId=901&view=bogus']){
    const r=await http('GET','/api/v1/f04/vehicles/39001?'+q,cookie(token));
    assert.equal(r.status,422,JSON.stringify(r));
  }
  const p=await http('GET','/api/v1/f04/customer/vehicles/39001/price?entitlement=UNLIMITED',cookie(token));
  assert.equal(p.status,422);assert.deepEqual(p.body,{code:'F04_INVALID_DTO'});
  assert.equal((await http('GET','/api/v1/f04/customer/vehicles/39001/price',cookie(token))).status,501);
});
test('F04-R08 no client claim can bypass missing Vehicle-Team/4S ownership',async()=>{
  for(const v of [39001,39002,39005]){
    const r=await http('GET','/api/v1/f04/vehicles/'+v+'?teamId=901&view=export',cookie(token));
    assert.equal(r.status,403);
    assert.equal(r.body.code,'P_VEHICLE_SCOPE_UNPROVEN');
    assert.ok(!JSON.stringify(r.body).includes('9880000'));
  }
});
test('F04-R09 A-F04-03 owner+unrelated CRM Team grant cannot authorize target Customer',async()=>{
  const x=await http('GET','/api/v1/f04/customers/44041',cookie(token));
  assert.equal(x.status,403);assert.deepEqual(x.body,{code:'F04_CUSTOMER_SCOPE_DENIED'});
  // Employee5 has real Team grant and current owner, but lacks the actual
  // object-scope binding to the target 44041. No CRM fields may leak.
  assert.equal((await http('GET','/api/v1/f04/customers/44041?teamId=901',cookie(token))).status,422);
  assert.equal((await http('GET','/api/v1/f04/customers/44041',cookie(adminToken))).status,403);
  assert.equal((await http('GET','/api/v1/f04/customers/44041',cookie(fourToken))).status,403);
  for(const other of [301,303,306,44041]){
    const r=await http('GET','/api/v1/f04/customers/'+other,cookie(token));
    assert.equal(r.status,403,JSON.stringify({other,r}));
    assert.deepEqual(Object.keys(r.body),['code']);
  }
});
test('F04-R09a M94 existing target object scope + current owner is only positive case',async()=>{
  const original=(await db.query("SELECT b.employee_id,b.permission_id,b.scope_id,s.scope_kind,s.scope_reference_id FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=1 AND b.permission_id=12 AND b.scope_id=102")).rows;
  assert.equal(original.length,1);
  assert.equal(original[0].scope_kind,'object');
  assert.equal(Number(original[0].scope_reference_id),302);
  const r=await http('GET','/api/v1/f04/customers/302',cookie(objectToken));
  assert.equal(r.status,200,JSON.stringify(r));
  assert.deepEqual(r.body,{code:'F04_CUSTOMER_CURRENT_OWNER',customerId:302,objectScope:'CURRENT_OWNER_ONLY',disposable:true});
  assert.equal(r.headers['cache-control'],'no-store, private, max-age=0');
  assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(token))).status,403);
});
test('F04-R09c owner changes revoke prior object grant and current Team membership cannot steal',async()=>{
  await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=302');
  try{
    assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(objectToken))).status,403);
    assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(token))).status,403);
  }finally{await db.query('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=302')}
  const r=await http('GET','/api/v1/f04/customers/302',cookie(objectToken));
  assert.equal(r.status,200);
});
test('F04-R09d current personal deny and exact capability object scope expiry both revoke',async()=>{
  await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,12,'deny',now())");
  try{
    assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(objectToken))).status,403);
  }finally{await db.query("DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=12")}
  const old=(await db.query('SELECT ended_at FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=12 AND scope_id=102')).rows[0];
  await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp()-interval '2 seconds' WHERE employee_id=1 AND permission_id=12 AND scope_id=102");
  try{assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(objectToken))).status,403)}
  finally{await db.query('UPDATE public.employee_capability_scope_bindings SET ended_at=$1 WHERE employee_id=1 AND permission_id=12 AND scope_id=102',[old.ended_at])}
});
test('F04-R09e explicit real object grant survives synthetic cross-store movement, no implicit Team grants',async()=>{
  const old=(await db.query('SELECT store_id FROM public.employees WHERE employee_id=1')).rows[0];
  await db.query('UPDATE public.employees SET store_id=2 WHERE employee_id=1');
  try{
    // Unlike a generic actor-Team check, M94 target object capability
    // is explicit and independent of a same-store guessing shortcut.
    const r=await http('GET','/api/v1/f04/customers/302',cookie(objectToken));
    assert.equal(r.status,200,JSON.stringify(r));
    assert.equal((await http('GET','/api/v1/f04/customers/44041',cookie(objectToken))).status,403);
  }finally{await db.query('UPDATE public.employees SET store_id=$1 WHERE employee_id=1',[old.store_id])}
});
test('F04-R09f old password session cannot inherit current object permission; logout revokes',async()=>{
  assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(objectOldToken))).status,401);
  const another=await auth.login({login:'employee_test',password:'SyntheticF04_Object_2026_Current',source:'f04-object-final'});
  assert.equal(another.code,'AUTH_OK');
  try{
    assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(another.token))).status,200);
    await auth.logout(another.token);
    assert.equal((await http('GET','/api/v1/f04/customers/302',cookie(another.token))).status,401);
  }finally{await auth.logout(another.token)}
});
test('F04-R09b personal deny takes effect immediately for a previously logged-in PC session',async()=>{
  await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=12");
  try{
    const r=await http('GET','/api/v1/f04/vehicles/39001?teamId=901&view=export',cookie(token));
    assert.equal(r.status,403);assert.equal(r.body.code,'F04_OBJECT_SCOPE_DENIED');
  }finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=12")}
});
test('F04-R10 inactive employee revokes prior valid session immediately',async()=>{
  await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5");
  try{assert.equal((await http('GET','/api/v1/f04/session/proof',cookie(token))).status,401)}
  finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=5")}
});
test('F04-R11 all transactions/refund/lock/phone/4S management endpoints remain closed',async()=>{
  for(const path of ['/api/v1/f04/locks','/api/v1/f04/transactions','/api/v1/f04/refunds',
    '/api/v1/f04/publisher-phone']){
    const headers={...cookie(token),'x-csrf-token':auth.csrfFor(token)};
    const r=await http('POST',path,headers);
    assert.equal(r.status,501,JSON.stringify({path,r}));
    assert.deepEqual(r.body,{code:'OPEN_DEPENDENCY'});
    assert.equal((await http('POST',path,cookie(token))).status,403);
    assert.equal((await http('GET',path,headers)).status,405);
  }
  const adminHeader={...cookie(adminToken),'x-csrf-token':auth.csrfFor(adminToken)};
  assert.equal((await http('POST','/api/v1/f04/4s/accounts',adminHeader)).status,501);
  assert.equal((await http('POST','/api/v1/f04/4s/accounts',{...cookie(token),'x-csrf-token':auth.csrfFor(token)})).status,403);
  assert.equal((await http('POST','/api/v1/f04/locks',{...cookie(token),'x-csrf-token':auth.csrfFor(token),'x-request-key':'short'})).status,422);
});
test('F04-R12 body injection, stale privilege and logout deny sensitive output',async()=>{
  assert.equal((await http('GET','/api/v1/f04/session/proof',cookie(token),'{"team":901}')).status,400);
  await auth.logout(token);
  assert.equal((await http('GET','/api/v1/f04/session/proof',cookie(token))).status,401);
});

test('F04-R13 two independent current PG16 sessions with same request key cannot mutate F06',async()=>{
  // Prior R12 deliberately revoked the original token; obtain two truly
  // *current* independent sessions to test the F06 hard-deny boundary.
  const x=await auth.login({login:'http_test',password:'SyntheticF04_2026_ContractGate',source:'f04parallelA'});
  const y=await auth.login({login:'http_test',password:'SyntheticF04_2026_ContractGate',source:'f04parallelB'});
  assert.equal(x.code,'AUTH_OK');assert.equal(y.code,'AUTH_OK');
  const before=(await db.query('SELECT count(*)::int n FROM public.transactions')).rows[0].n;
  const key='f04_same_key_concurrency_20261010';
  const p=(tok)=>http('POST','/api/v1/f04/transactions',
    {...cookie(tok),'x-csrf-token':auth.csrfFor(tok),'x-request-key':key});
  try{
    const answers=await Promise.all([p(x.token),p(y.token)]);
    assert.deepEqual(answers.map(a=>a.status),[501,501]);
    assert.ok(answers.every(a=>a.body.code==='OPEN_DEPENDENCY'));
    const after=(await db.query('SELECT count(*)::int n FROM public.transactions')).rows[0].n;
    assert.equal(after,before,'NO_BUSINESS_WRITE_WHILE_CONTRACT_ONLY');
  }finally{await auth.logout(x.token)}
});
test('F04-R14 missing explicit isolation gate prevents any route startup',async()=>{
  const old=process.env.F04_1_ISOLATION_CONFIRM;
  try{
    delete process.env.F04_1_ISOLATION_CONFIRM;
    await assert.rejects(()=>createF04ContractHandler(auth),/F04_NON_PRODUCTION_GATE/);
  }finally{process.env.F04_1_ISOLATION_CONFIRM=old}
});
