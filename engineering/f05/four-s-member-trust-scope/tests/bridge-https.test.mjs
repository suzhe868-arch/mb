import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {grantMemberCreateLicense,revokeMemberCreateLicense,publishNewFourSMemberVehicle,readFourSMemberMinimalVehicle,BLOCKED} from '../source-gate.mjs';
import {createFourSMemberVehicleHandler} from '../ci-four-s-handler.mjs';
import {createF052VehicleHandler} from '../../vehicle-stewardship-physical-scope/ci-vehicle-router.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,four,other,staff,admin,license;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
const id=66021;
const path=(vehicle=id,outlet='detail')=>'/__ci__/f05-3a/v1/vehicles/'+vehicle+'/'+outlet;
const candidate={vehicleId:id,listingCycleId:id+1000,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,mileageKm:8000,city:'Suzhou',sourceKind:'four_s',eventKey:'f05-3a-real-https-publication-66021'};
const denied=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F05_VEHICLE_SCOPE_UNPROVEN'});assert.match(r.headers['cache-control'],/no-store/)};
async function get(p,headers={}){
 return new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port:48983,path:p,method:'GET',
  rejectUnauthorized:false,headers:{origin,...headers}},res=>{let body='';res.on('data',x=>body+=x);
  res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(body),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);req.end()});
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [user,password,slot] of [
  ['four_s_test','SyntheticFourS_123456','four'],['other_four_s_test','SyntheticOtherFourS_123456','other'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','staff'],['admin_test','SyntheticAdmin_1234567','admin']]){
  const result=await auth.login({login:user,password,source:'f05-3a-same-tx-https'});
  assert.equal(result.code,'AUTH_OK',user);
  if(slot==='four')four=result.token;else if(slot==='other')other=result.token;else if(slot==='staff')staff=result.token;else admin=result.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createFourSMemberVehicleHandler(auth));
 await new Promise((yes,no)=>{server.once('error',no);server.listen(48983,'127.0.0.1',yes)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('H-B01 real 4S authenticated member before separate System Admin grant remains HTTPS403',async()=>{
 denied(await get(path(),cookie(four)));
 const g=await publishNewFourSMemberVehicle(auth,four,candidate);
 assert.deepEqual(g,{allowed:false,code:BLOCKED});
});
test('H-B02 actual System Admin current Session independently grants NEW_OWN_FOUR_S_ONLY',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:'f05-3a-https-admin-grant-signed-66021'});
 assert.equal(g.allowed,true,JSON.stringify(g));license=g.licenseId;
});
test('H-B03 real four_s member current Session creates model-verified new Vehicle and HTTPS GET200 minimal only',async()=>{
 const p=await publishNewFourSMemberVehicle(auth,four,candidate);
 assert.equal(p.code,'F05_3A_MEMBER_VEHICLE_ISSUED',JSON.stringify(p));
 const response=await get(path(),cookie(four));
 assert.equal(response.status,200,JSON.stringify(response));
 assert.deepEqual(response.body,{code:'F05_3A_MEMBER_MINIMAL_VEHICLE',vehicleId:id,listingCycleId:id+1000,sourceKind:'four_s'});
 assert.equal('vin' in response.body,false);assert.equal('price' in response.body,false);
});
test('H-B04 second authenticated four_s account cannot read member2 actual object even with static role/PC grant',async()=>{
 denied(await get(path(),cookie(other)));
 assert.equal((await readFourSMemberMinimalVehicle(auth,other,{vehicleId:id,outlet:'detail'})).allowed,false);
});
test('H-B04a real HTTPS scope denies different 4S license even after direct PG16 provenance attack',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:8,eventKey:'f05-3a-https-independent-employee8-license'});
 assert.equal(g.allowed,true,JSON.stringify(g));
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_publications SET member_employee_id=8 WHERE vehicle_id=$1',[id]),/F05_3A_PUBLICATION_PROVENANCE_IMMUTABLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_publications SET license_id=$1 WHERE vehicle_id=$2',[g.licenseId,id]),/F05_3A_PUBLICATION_PROVENANCE_IMMUTABLE/);
 await assert.rejects(()=>db.query('UPDATE public.vehicles SET created_by_employee_id=8 WHERE vehicle_id=$1',[id]),/F05_3A_SIGNED_VEHICLE_CREATOR_IMMUTABLE/);
 denied(await get(path(),cookie(other)));
 const own=await get(path(),cookie(four));
 assert.equal(own.status,200,JSON.stringify(own));
 assert.deepEqual(Object.keys(own.body).sort(),['code','listingCycleId','sourceKind','vehicleId']);
});
test('H-B05 System Admin and Mingbang staff cannot read 4S business Vehicle',async()=>{
 denied(await get(path(),cookie(admin)));denied(await get(path(),cookie(staff)));
});
test('H-B06 prior Mingbang-uploaded four_s and wholesale never enter new member current business scope',async()=>{
 for(const legacy of [49004,49006,49002])denied(await get(path(legacy),cookie(four)));
});
test('H-B07 all six non-detail outlets deny 4S even if owns genuine current Vehicle',async()=>{
 for(const outlet of ['list','export','copy','cache','print','history'])denied(await get(path(id,outlet),cookie(four)));
});
test('H-B08 impersonation via headers, query, bearer token, origin and cookie cannot bypass PG16 object-source scope',async()=>{
 for(const h of ['x-owner','x-team-id','x-merchant','x-customer','x-vin']){
  denied(await get(path(),{...cookie(other),[h]:'2'}));
 }
 denied(await get(path()+'?owner=2',cookie(four)));
 denied(await get(path(),{...cookie(four),authorization:'Bearer injected'}));
 denied(await get(path(),{...cookie(four),origin:'https://attacker.invalid'}));
 denied(await get(path(),{cookie:'__Host-mb_pc=fake'}));
});
test('H-B09 System Admin revokes member license, real TLS immediately 403, no stale historical reactivation',async()=>{
 const r=await revokeMemberCreateLicense(auth,admin,{licenseId:license,version:1,eventKey:'f05-3a-https-admin-explicit-revoke-66021'});
 assert.equal(r.code,'F05_3A_LICENSE_REVOKED');
 denied(await get(path(),cookie(four)));
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_create_licenses SET revoked_at=NULL,version=version+1 WHERE license_id=$1',[license]),/F05_3A_LICENSE_REVOCATION_IRREVERSIBLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_publications SET revoked_at=NULL,version=version+1 WHERE vehicle_id=$1',[id]),/F05_3A_PUBLICATION_REVOCATION_IRREVERSIBLE/);
 denied(await get(path(),cookie(four)));
 const rows=(await db.query("SELECT actor_kind,actor_member_employee_id,actor_system_admin_id,event_kind FROM public.f05_3a_member_trust_audit WHERE license_id=$1 AND event_kind='SYSTEM_OBJECT_REVOKE'",[license])).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].actor_kind,'SYSTEM');assert.equal(rows[0].actor_member_employee_id,null);
});
test('H-B10 no 4S scope recovers from new login, account employment restored, or old trustedEventKey reuse',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=2");
 denied(await get(path(),cookie(four)));
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=2");
 denied(await get(path(),cookie(four)));
 assert.equal((await publishNewFourSMemberVehicle(auth,four,candidate)).allowed,false);
});
