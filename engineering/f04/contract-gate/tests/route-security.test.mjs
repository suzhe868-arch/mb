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
let server,token,oldToken,adminToken,fourToken;
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
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(44041,'active',1,'assigned',5)");
  const handler=await createF04ContractHandler(auth);
  server=tlsServer({key:readFileSync('/tmp/f04-ci-key.pem'),cert:readFileSync('/tmp/f04-ci-cert.pem')},handler);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48981,'127.0.0.1',resolve)});
});
test.after(async()=>{
  if(server)await new Promise(resolve=>server.close(resolve));
  await db.query('DELETE FROM public.customers WHERE customer_id=44041');
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
test('F04-R09 current owner+CRM+Team scope authorizes only minimal own Customer',async()=>{
  const good=await http('GET','/api/v1/f04/customers/44041',cookie(token));
  assert.equal(good.status,200,JSON.stringify(good));
  assert.deepEqual(good.body,{code:'F04_CUSTOMER_CURRENT_OWNER',customerId:44041,objectScope:'CURRENT_OWNER_ONLY',disposable:true});
  assert.equal((await http('GET','/api/v1/f04/customers/44041',cookie(adminToken))).status,403);
  assert.equal((await http('GET','/api/v1/f04/customers/44041',cookie(fourToken))).status,403);
  assert.equal((await http('GET','/api/v1/f04/customers/44041?teamId=901',cookie(token))).status,422);
  await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=44041');
  try{assert.equal((await http('GET','/api/v1/f04/customers/44041',cookie(token))).status,403)}
  finally{await db.query('UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=44041')}
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
