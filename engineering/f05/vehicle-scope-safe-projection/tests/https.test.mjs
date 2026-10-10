import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {createF05VehicleProjectionHandler,VEHICLE_OUTLETS} from '../ci-vehicle-router.mjs';
import {verifyLiveM94} from '../source-verifier.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,staff,admin,four;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
async function call(method,path,headers={},body){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48983,path,method,rejectUnauthorized:false,
    headers:{origin,...headers,...(body?{'content-length':Buffer.byteLength(body),'content-type':'application/json'}:{})}},res=>{
    let b='';res.on('data',c=>b+=c);res.on('end',()=>{
     try{resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(b),raw:b})}catch(e){reject(e)}
    });
   });req.on('error',reject);req.end(body);
 });
}
const loc=(id,view='detail')=>'/__ci__/f05/v1/vehicles/'+id+'/'+view;
test.before(async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 let s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-1-employee'});assert.equal(s.code,'AUTH_OK');staff=s.token;
 s=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-1-admin'});assert.equal(s.code,'AUTH_OK');admin=s.token;
 s=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f05-1-four-s'});assert.equal(s.code,'AUTH_OK');four=s.token;
 await db.query("UPDATE public.customers SET owner_assignment_state='assigned',current_owner_employee_id=1 WHERE customer_id=302");
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},
  await createF05VehicleProjectionHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48983,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await db.query("UPDATE public.customers SET owner_assignment_state='unassigned',current_owner_employee_id=NULL WHERE customer_id=302");
 await auth.close();await db.end();secret.fill(0);
});
const safeDenied=r=>{
 assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});
 assert.match(r.headers['cache-control'],/no-store/);
 for(const f of ['fields','vehicleId','listingCycleId','sourceKind','vin','publisherPhone','internalWholesalePrice','phone','token','merchantId','price','customerId','data','payload'])
  assert.ok(!(f in r.body),'leak '+f);
};
test('F05-1-B01 genuine PG16 M94, real TLS, seven Vehicle outlets',async()=>{
 assert.equal((await verifyLiveM94(db)).verified,true);assert.equal(VEHICLE_OUTLETS.length,7);
 assert.equal((await verifyM94(db)).verified,true);
});
test('F05-1-B02 a valid Employee Session + uploader/current store cannot grant any of 3 sources',async()=>{
 for(const id of [39001,39002,39003])for(const outlet of VEHICLE_OUTLETS)
  safeDenied(await call('GET',loc(id,outlet),cookie(staff)));
});
test('F05-1-B03 4S represented-principal absent, System Admin cannot pretend sales',async()=>{
 for(const token of [four,admin])for(const id of [39001,39002,39003])
  safeDenied(await call('GET',loc(id),cookie(token)));
});
test('F05-1-B04 frontend owner/store/team/merchant/level and internal price spoof hard-denied',async()=>{
 for(const header of ['x-team-id','x-merchant-id','x-owner','x-role','x-customer-level','x-scope','x-price','x-vin','x-forwarded-for'])
  safeDenied(await call('GET',loc(39002),{...cookie(staff),[header]:'1'}));
 for(const query of ['?teamId=1','?merchantId=1','?scope=all','?export=1'])
  safeDenied(await call('GET',loc(39002)+query,cookie(staff)));
});
test('F05-1-B05 historical cycle or forged visible grants never permit old-owner cached read',async()=>{
 safeDenied(await call('GET',loc(39004,'history'),cookie(staff)));
 for(const view of ['cache','export','print','copy','history'])
  safeDenied(await call('GET',loc(39003,view),cookie(staff)));
});
test('F05-1-B06 missing Session, duplicate cookies, bearer and Customer auth header denied',async()=>{
 assert.equal((await call('GET',loc(39001))).status,403);
 assert.equal((await call('GET',loc(39001),{cookie:'__Host-mb_pc=invalid'})).status,403);
 assert.equal((await call('GET',loc(39001),{cookie:'__Host-mb_pc='+staff+'; __Host-mb_pc='+staff})).status,403);
 safeDenied(await call('GET',loc(39001),{...cookie(staff),authorization:'Bearer forged'}));
});
test('F05-1-B07 methods/body/unknown/old Collector and URI injection are rejected',async()=>{
 assert.equal((await call('POST',loc(39001),cookie(staff))).status,405);
 assert.equal((await call('GET','/__ci__/f05/v1/vehicles/39001/nuke',cookie(staff))).status,404);
 assert.equal((await call('GET','/admin/integrations/collector/connection',cookie(staff))).status,404);
 assert.equal((await call('GET','/__ci__/f05/v1/vehicles/%2e%2e%2f39001/detail',cookie(staff))).status,400);
 assert.equal((await call('GET',loc(39001),cookie(staff),'{"vin":"PRIVATE"}')).status,400);
});
test('F05-1-B08 only F04-1 signed current-owner CustomerId read remains a 200 regression',async()=>{
 const target='/__ci__/current/v1/objects/customers/302/proof';
 let r=await call('GET',target,cookie(staff));assert.equal(r.status,200,JSON.stringify(r));
 assert.deepEqual(r.body,{code:'F04_CUSTOMER_CURRENT_OWNER',customerId:302,objectScope:'CURRENT_OWNER_ONLY',disposable:true});
 await db.query("UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=302");
 try{assert.equal((await call('GET',target,cookie(staff))).status,403)}
 finally{await db.query("UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=302")}
});
test('F05-1-B09 no new Vehicle rows, price/quota, financial or source-fact writes',async()=>{
 let before=(await db.query("SELECT (SELECT count(*) FROM public.vehicles) vehicles,(SELECT count(*) FROM public.vehicle_price_history) prices,(SELECT count(*) FROM public.customer_price_unlock_events) quotas,(SELECT count(*) FROM public.vehicle_conversions) conversions")).rows[0];
 for(const id of [39001,39002,39003])safeDenied(await call('GET',loc(id),cookie(staff)));
 let after=(await db.query("SELECT (SELECT count(*) FROM public.vehicles) vehicles,(SELECT count(*) FROM public.vehicle_price_history) prices,(SELECT count(*) FROM public.customer_price_unlock_events) quotas,(SELECT count(*) FROM public.vehicle_conversions) conversions")).rows[0];
 assert.deepEqual(after,before);
});
