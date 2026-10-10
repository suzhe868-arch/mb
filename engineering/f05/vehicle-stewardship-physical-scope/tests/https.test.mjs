import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request} from 'node:https';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createF052VehicleHandler} from '../ci-vehicle-router.mjs';
import {issueFromTrustedManualPublication,recordTrustedManualPublicationEvent,revokeCurrentResponsibility} from '../service.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32);
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,staff,admin,four;
const loc=(id,view='detail')=>'/__ci__/f05-2/v1/vehicles/'+id+'/'+view;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
const expectDeny=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});assert.match(r.headers['cache-control'],/no-store/)};
async function call(method,path,more={},body){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48983,path,method,rejectUnauthorized:false,headers:
    {origin,...more,...(body?{'content-length':Buffer.byteLength(body),'content-type':'application/json'}:{})}},res=>{
   let text='';res.on('data',x=>text+=x);res.on('end',()=>{
    try{resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(text)})}catch(e){reject(e)}
   });
  });req.on('error',reject);req.end(body);
 });
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 let r=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-2-employee'});
 assert.equal(r.code,'AUTH_OK');staff=r.token;
 r=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-2-admin'});
 assert.equal(r.code,'AUTH_OK');admin=r.token;
 r=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f05-2-four-s'});
 assert.equal(r.code,'AUTH_OK');four=r.token;
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createF052VehicleHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48983,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('F05-2-B01 genuine TLS and absence of physical responsibility closes detail',async()=>{
 expectDeny(await call('GET',loc(49002),cookie(staff)));
});
test('F05-2-B02 signed current PG16 publishing event permits exactly 3 safe fields',async()=>{
 const origin=await recordTrustedManualPublicationEvent(auth,staff,{vehicleId:49002,listingCycleId:49012,teamId:901,eventKey:'synthetic-f05-2-https-publish-49002'});
 assert.equal(origin.allowed,true,JSON.stringify(origin));
 const out=await issueFromTrustedManualPublication(auth,staff,{vehicleId:49002,listingCycleId:49012,teamId:901,eventKey:'synthetic-f05-2-https-publish-49002'});
 assert.equal(out.code,'F05_2_ISSUED',JSON.stringify(out));
 const res=await call('GET',loc(49002),cookie(staff));
 assert.equal(res.status,200,JSON.stringify(res));
 assert.deepEqual(res.body,{code:'F05_2_MINIMAL_VEHICLE',vehicleId:49002,listingCycleId:49012,sourceKind:'mingbang'});
 assert.match(res.headers['cache-control'],/no-store/);
 assert.doesNotMatch(JSON.stringify(res.body),/vin|phone|price|merchant|customer|publisher|token|documents/i);
});
test('F05-2-B03 no unsigned wholesale/4S grant and 4S member cannot steal Mingbang-owned 4S asset',async()=>{
 for(const id of [49004,49006])expectDeny(await call('GET',loc(id),cookie(staff)));
 const origin=await recordTrustedManualPublicationEvent(auth,staff,{vehicleId:49004,listingCycleId:49014,teamId:901,eventKey:'synthetic-f05-2-https-publish-four-s-49004'});
 assert.equal(origin.allowed,true,JSON.stringify(origin));
 const signed=await issueFromTrustedManualPublication(auth,staff,{vehicleId:49004,listingCycleId:49014,teamId:901,eventKey:'synthetic-f05-2-https-publish-four-s-49004'});
 assert.equal(signed.code,'F05_2_ISSUED');
 assert.equal((await call('GET',loc(49004),cookie(staff))).status,200);
 expectDeny(await call('GET',loc(49004),cookie(four)));
});
test('F05-2-B04 System Admin, anonymous, altered headers and user-claimed merchant denied',async()=>{
 expectDeny(await call('GET',loc(49002),cookie(admin)));
 expectDeny(await call('GET',loc(49002),cookie(four)));
 expectDeny(await call('GET',loc(49002)));
 for(const h of ['x-team-id','x-merchant-id','x-owner','x-price','x-forwarded-for'])
  expectDeny(await call('GET',loc(49002),{...cookie(staff),[h]:'1'}));
 expectDeny(await call('GET',loc(49002)+'?teamId=901',cookie(staff)));
});
test('F05-2-B05 independent outlets do not inherit detail allow',async()=>{
 for(const view of ['list','export','copy','cache','print','history'])expectDeny(await call('GET',loc(49002,view),cookie(staff)));
});
test('F05-2-B06 no duplicate cookies, bearer, body, forbidden methods, Collector mutation',async()=>{
 expectDeny(await call('GET',loc(49002),{cookie:'__Host-mb_pc='+staff+'; __Host-mb_pc='+staff}));
 expectDeny(await call('GET',loc(49002),{...cookie(staff),authorization:'Bearer bogus'}));
 assert.notEqual((await call('POST',loc(49002),cookie(staff))).status,200);
 assert.notEqual((await call('GET','/admin/integrations/collector/connection',cookie(staff))).status,200);
 assert.notEqual((await call('GET',loc(49002),cookie(staff),'{"vin":"bogus"}')).status,200);
});
test('F05-2-B07 current personal deny reflected immediately over genuine HTTPS',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=14");
 try{expectDeny(await call('GET',loc(49002),cookie(staff)))}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=14")}
 assert.equal((await call('GET',loc(49002),cookie(staff))).status,200);
});
test('F05-2-B08 genuine PG16 revoked scope must fail with existing valid session',async()=>{
 const r=(await db.query("SELECT responsibility_id,version FROM public.vehicle_current_responsibilities WHERE trusted_event_key='synthetic-f05-2-https-publish-49002'")).rows[0];
 const x=await revokeCurrentResponsibility(auth,staff,{eventKey:'synthetic-f05-2-https-revoke-49002',responsibilityId:Number(r.responsibility_id),version:Number(r.version)});
 assert.equal(x.code,'F05_2_REVOKED',JSON.stringify(x));
 expectDeny(await call('GET',loc(49002),cookie(staff)));
});
test('F05-2-B09 after logout old Cookie cannot become continuing Vehicle access',async()=>{
 await auth.logout(staff);
 expectDeny(await call('GET',loc(49004),cookie(staff)));
});
