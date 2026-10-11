import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../favorite-physical-carrier/migration.mjs';
import {createCustomerActorAuditCIHandler} from '../ci-router.mjs';
const db=await connect(),origin='https://127.0.0.1:48987',secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,vid,employee,admin,four;
const path=()=>'/__ci__/f05-3h/v1/vehicles/'+vid+'/favorite';
const headers=t=>({cookie:'__Host-mb_pc='+t,'x-csrf-token':auth.csrfFor(t)});
const deny=x=>{
 assert.equal(x.status,403,JSON.stringify(x));
 assert.deepEqual(x.body,{code:'F05_3H_CUSTOMER_IDENTITY_SOURCE_GAP'});
 assert.match(x.headers['cache-control']||'',/no-store/);
};
function call(url=path(),method='POST',head={}){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48987,path:url,method,rejectUnauthorized:false,headers:{origin,...head}},
   res=>{let data='';res.on('data',x=>data+=x);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(data),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);req.end();
 });
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const line=(await db.query("SELECT vehicle_id FROM public.f05_3b_sync_lineages WHERE source_platform='JYT' AND car_code='JYT-F05C-LOOPBACK-015'")).rows[0];
 assert.ok(line);vid=Number(line.vehicle_id);
 for(const [u,p,kind] of [['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['admin_test','SyntheticAdmin_1234567','admin'],['four_s_test','SyntheticFourS_123456','four']]){
  const x=await auth.login({login:u,password:p,source:'f05-3h-physical-only-no-real-customer'});
  assert.equal(x.code,'AUTH_OK');if(kind==='employee')employee=x.token;
  if(kind==='admin')admin=x.token;if(kind==='four')four=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createCustomerActorAuditCIHandler(auth));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(48987,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(ok=>server.close(ok));await auth.close();await db.end();secret.fill(0)});
test('H-B01 anonymous and JYT integration token cannot claim Favorite',async()=>{
 deny(await call());deny(await call(path(),'POST',{authorization:'ApiKey mbci_'+'a'.repeat(43)}));
});
test('H-B02 Employee/4S/SystemAdmin actual cookie and valid CSRF never substitute genuine Customer Session',async()=>{
 for(const tok of [employee,four,admin]){
  for(const method of ['GET','POST','DELETE'])deny(await call(path(),method,headers(tok)));
 }
});
test('H-B03 missing/repeated cookie, malformed CSRF and external Origin all fail-closed',async()=>{
 deny(await call(path(),'POST',{cookie:'__Host-mb_pc='+employee}));
 deny(await call(path(),'POST',{...headers(employee),'x-csrf-token':'bad'}));
 deny(await call(path(),'POST',{...headers(employee),origin:'https://attacker.invalid'}));
 deny(await call(path(),'POST',{...headers(employee),cookie:'__Host-mb_pc='+employee+'; __Host-mb_pc='+employee}));
});
test('H-B04 forged Customer ID, owner, JYT publisher and trusted=true headers never grant identity',async()=>{
 for(const h of [{'x-customer-id':'899801'},{'x-owner':'1'},{'x-publisher-id':'665283'},{'x-trusted':'true'}])
  deny(await call(path(),'POST',{...headers(employee),...h}));
});
test('H-B05 no production route, export, print, share, cache, historical leakage or query bypass',async()=>{
 assert.equal((await call('/v1/vehicles/'+vid+'/favorite','POST',headers(employee))).status,404);
 assert.equal((await call(path()+'?customerId=899801','POST',headers(employee))).status,404);
 assert.equal((await call(path(),'PATCH',headers(employee))).status,405);
 for(const suffix of ['export','print','share','cache','history'])
  assert.equal((await call(path().replace('/favorite','/'+suffix),'GET',headers(employee))).status,404);
});
test('H-B06 no VIN, price, phone, JYT data or active customer existence disclosure in minimal response',async()=>{
 const x=await call(path(),'GET',headers(employee));deny(x);
 for(const secret of ['customerId','vehicleId','VIN','phone','JYT-','carCode','wholesalePrice','password','openId'])
  assert.equal(JSON.stringify(x.body).includes(secret),false);
});
test('H-B07 real signed Favorite v19 physical model is present; HTTP denial does not write any relation or event',async()=>{
 const before=(await db.query(
 "SELECT (SELECT count(*)::int FROM public.f05_3g_customer_favorites) carrier,"+
 "(SELECT count(*)::int FROM public.f05_3g_favorite_events) events")).rows[0];
 deny(await call(path(),'POST',headers(employee)));
 deny(await call(path(),'DELETE',headers(employee)));
 const after=(await db.query(
 "SELECT (SELECT count(*)::int FROM public.f05_3g_customer_favorites) carrier,"+
 "(SELECT count(*)::int FROM public.f05_3g_favorite_events) events")).rows[0];
 assert.deepEqual(after,before);
});
