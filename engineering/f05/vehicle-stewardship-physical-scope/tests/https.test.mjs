// F05-2 A review corrective HTTPS: non-production loopback real TLS + M94 PG16.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request} from 'node:https';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createF052VehicleHandler} from '../ci-vehicle-router.mjs';
import {publishAndIssueFromCurrentTransaction,revokeCurrentResponsibility,transferCurrentResponsibility} from '../service.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32);
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,staff,admin,four,manager,receiver;
const path=(id,view='detail')=>'/__ci__/f05-2/v1/vehicles/'+id+'/'+view;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
const event=id=>'synthetic-f05-2-https-atomic-formal-publish-'+id;
const fresh=(id,sourceKind='mingbang')=>({vehicleId:id,listingCycleId:id+100,sourceKind,teamId:901,eventKey:event(id)});
const issue=(id,kind)=>publishAndIssueFromCurrentTransaction(auth,staff,fresh(id,kind));
const deny=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});assert.match(r.headers['cache-control'],/no-store/)};
async function call(method,url,headers={},body){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48983,path:url,method,rejectUnauthorized:false,
   headers:{origin,...headers,...(body?{'content-length':Buffer.byteLength(body),'content-type':'application/json'}:{})}},res=>{
    let b='';res.on('data',x=>b+=x);res.on('end',()=>{try{resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(b)})}catch(e){reject(e)}});
  });req.on('error',reject);req.end(body);
 });
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [login,password,target] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','staff'],
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['four_s_test','SyntheticFourS_123456','four'],
  ['race_test','SyntheticRace_1234567','manager'],
  ['limit_test','SyntheticLimit_1234567','receiver']]){
  const x=await auth.login({login,password,source:'f05-2-corrective-https'});
  assert.equal(x.code,'AUTH_OK',JSON.stringify({login,result:x.code}));
  if(target==='staff')staff=x.token;
  if(target==='admin')admin=x.token;
  if(target==='four')four=x.token;
  if(target==='manager')manager=x.token;
  if(target==='receiver')receiver=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createF052VehicleHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48983,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('R-B01 preexisting uploaded Vehicle never signed, even with current team and Session',async()=>{
 deny(await call('GET',path(49002),cookie(staff)));
 deny(await call('GET',path(49004),cookie(staff)));
});
test('R-B02 real new formally published Vehicle+Cycle+signed owner returns only three allowed fields over TLS',async()=>{
 const x=await issue(59022);assert.equal(x.code,'F05_2_ISSUED',JSON.stringify(x));
 const res=await call('GET',path(59022),cookie(staff));
 assert.equal(res.status,200,JSON.stringify(res));
 assert.deepEqual(res.body,{code:'F05_2_MINIMAL_VEHICLE',vehicleId:59022,listingCycleId:59122,sourceKind:'mingbang'});
 assert.match(res.headers['cache-control'],/no-store/);
 assert.doesNotMatch(JSON.stringify(res.body),/vin|phone|price|merchant|customer|publisher|token|documents/i);
});
test('R-B03 wholesale has no authority; valid Mingbang-created 4S source is not a 4S member grant',async()=>{
 for(const id of [49004,49006])deny(await call('GET',path(id),cookie(staff)));
 const pub=await issue(59023,'four_s');assert.equal(pub.code,'F05_2_ISSUED');
 assert.equal((await call('GET',path(59023),cookie(staff))).status,200);
 deny(await call('GET',path(59023),cookie(four)));
});
test('R-B04 System Admin, anonymous, forged team/merchant/owner and modified scope never elevate',async()=>{
 deny(await call('GET',path(59022),cookie(admin)));
 deny(await call('GET',path(59022),cookie(four)));
 deny(await call('GET',path(59022)));
 for(const h of ['x-team-id','x-merchant-id','x-owner','x-price','x-forwarded-for'])
  deny(await call('GET',path(59022),{...cookie(staff),[h]:'1'}));
 deny(await call('GET',path(59022)+'?teamId=901',cookie(staff)));
});
test('R-B05 seven outlets: detail alone allowed, list/export/copy/cache/print/history denied',async()=>{
 for(const name of ['list','export','copy','cache','print','history'])deny(await call('GET',path(59022,name),cookie(staff)));
});
test('R-B06 duplicate Cookie, bearer spoof, wrong method, POST body and old Collector path never grant',async()=>{
 deny(await call('GET',path(59022),{cookie:'__Host-mb_pc='+staff+'; __Host-mb_pc='+staff}));
 deny(await call('GET',path(59022),{...cookie(staff),authorization:'Bearer forged'}));
 assert.notEqual((await call('POST',path(59022),cookie(staff))).status,200);
 assert.notEqual((await call('GET','/admin/integrations/collector/connection',cookie(staff))).status,200);
 assert.notEqual((await call('GET',path(59022),cookie(staff),'{"vin":"fake"}')).status,200);
});
test('R-B07 handover old same-Team sales goes 403; new sales 200, manager independently scope-verified',async()=>{
 const x=(await db.query('SELECT responsibility_id,version FROM public.vehicle_current_responsibilities WHERE vehicle_id=59023 AND revoked_at IS NULL')).rows[0];
 const req={responsibilityId:Number(x.responsibility_id),version:Number(x.version),teamId:901,targetEmployeeId:7,eventKey:'synthetic-f05-2-https-manager-handover-59023'};
 const transfer=await transferCurrentResponsibility(auth,manager,req);
 assert.equal(transfer.code,'F05_2_TRANSFERRED',JSON.stringify(transfer));
 deny(await call('GET',path(59023),cookie(staff)));
 assert.equal((await call('GET',path(59023),cookie(receiver))).status,200);
 assert.equal((await call('GET',path(59023),cookie(manager))).status,200);
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=6 AND permission_id=399");
 try{deny(await call('GET',path(59023),cookie(manager)))}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=6 AND permission_id=399")}
 assert.equal((await call('GET',path(59023),cookie(receiver))).status,200);
});
test('R-B08 revoked read capability cannot revive old receipt after grant restored',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=14");
 deny(await call('GET',path(59022),cookie(staff)));
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=14");
 deny(await call('GET',path(59022),cookie(staff)));
 assert.equal((await issue(59024)).code,'F05_2_ISSUED','new formal publication after reauth is distinct');
 assert.equal((await call('GET',path(59024),cookie(staff))).status,200);
});
test('R-B09 explicit revoke atomically eliminates current HTTPS read and retains audit',async()=>{
 const x=(await db.query('SELECT responsibility_id,version FROM public.vehicle_current_responsibilities WHERE vehicle_id=59024 AND revoked_at IS NULL')).rows[0];
 const result=await revokeCurrentResponsibility(auth,staff,{eventKey:'synthetic-f05-2-https-explicit-revoke-59024',responsibilityId:Number(x.responsibility_id),version:Number(x.version)});
 assert.equal(result.code,'F05_2_REVOKED');
 deny(await call('GET',path(59024),cookie(staff)));
});
test('R-B10 receiver inactive then restored remains denied in same client and fresh Session',async()=>{
 assert.equal((await call('GET',path(59023),cookie(receiver))).status,200);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 deny(await call('GET',path(59023),cookie(receiver)));
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7");
 deny(await call('GET',path(59023),cookie(receiver)));
 const newly=await auth.login({login:'limit_test',password:'SyntheticLimit_1234567',source:'f05-2-returning'});
 assert.equal(newly.code,'AUTH_OK');
 deny(await call('GET',path(59023),cookie(newly.token)));
});
test('R-B11 logout of staff prevents replay of any old Cookie',async()=>{
 const newCar=await issue(59025);assert.equal(newCar.code,'F05_2_ISSUED');
 await auth.logout(staff);
 deny(await call('GET',path(59025),cookie(staff)));
});
