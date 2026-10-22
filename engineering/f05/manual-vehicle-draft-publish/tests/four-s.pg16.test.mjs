// Real PostgreSQL 16 + loopback TLS end-to-end for the F05-3A own-4S publication path.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {grantMemberCreateLicense,revokeMemberCreateLicense} from '../../four-s-member-trust-scope/source-gate.mjs';
import {createManualVehicleDraftService} from '../service.mjs';
import {startHarness,login,BASE} from './https-harness.mjs';
const origin='https://127.0.0.1:48984';
const secret=randomBytes(32);
const db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let app,four,admin,other,staff,activeLicense,firstPublishedVehicle;
const save=async(payload)=>app.request(BASE+'/auto-save',{method:'POST',token:four,body:{payload}});
const publish=async(draftId,expectedVersion=1)=>app.request(BASE+'/'+draftId+'/publish',{method:'POST',token:four,body:{expectedVersion}});
const full=(changes={})=>({sourceType:'four_s',brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,mileageKm:16000,city:'Suzhou',...changes});
async function ensureLicense(){
 const current=(await db.query('SELECT license_id,version FROM public.f05_3a_member_create_licenses WHERE employee_id=2 AND revoked_at IS NULL')).rows;
 if(current.length===1){activeLicense={licenseId:Number(current[0].license_id),version:Number(current[0].version)};return}
 const granted=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:'manual-draft-admin-license-'+randomBytes(16).toString('hex')});
 assert.equal(granted.allowed,true,JSON.stringify(granted));
 activeLicense={licenseId:granted.licenseId,version:1};
}
test.before(async()=>{
 await verify(db);
 admin=await login(auth,'admin_test','SyntheticAdmin_1234567','f05-manual-draft-publish-admin');
 four=await login(auth,'four_s_test','SyntheticFourS_123456','f05-manual-draft-publish-member');
 other=await login(auth,'other_four_s_test','SyntheticOtherFourS_123456','f05-manual-draft-publish-other-member');
 staff=await login(auth,'employee_test','SyntheticF04_3_CurrentProof_2026','f05-manual-draft-publish-cross-source');
 await ensureLicense();
 app=await startHarness(createManualVehicleDraftService({auth}));
});
test.after(async()=>{
 if(app)await app.close();
 await auth.close();
 await db.end();
 secret.fill(0);
});
test('S01 four_s source is fixed to the current member; empty form still creates no row',async()=>{
 const blank=await app.request(BASE+'/auto-save',{method:'POST',token:four,body:{payload:{sourceType:'four_s'}}});
 assert.equal(blank.status,200);assert.equal(blank.body.code,'DRAFT_NOT_PERSISTED');
 const wrongSource=await app.request(BASE+'/auto-save',{method:'POST',token:four,body:{payload:{sourceType:'mingbang',description:'wrong source'}}});
 assert.equal(wrongSource.status,403);assert.equal(wrongSource.body.code,'SOURCE_TYPE_NOT_ALLOWED');
});
test('S02 model missing preserves 4S draft and does not create a Vehicle or Cycle',async()=>{
 const created=await save(full({modelId:97999,description:'4S model not confirmed'}));
 assert.equal(created.status,201,JSON.stringify(created.body));
 const beforeV=Number((await db.query('SELECT count(*)::int n FROM public.vehicles')).rows[0].n);
 const beforeC=Number((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles')).rows[0].n);
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,422);assert.equal(result.body.code,'MODEL_MISSING');
 assert.equal(Number((await db.query('SELECT count(*)::int n FROM public.vehicles')).rows[0].n),beforeV);
 assert.equal(Number((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles')).rows[0].n),beforeC);
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:four});
 assert.equal(detail.body.draft.status,'draft');assert.equal(detail.body.draft.payload.modelId,97999);
});
test('S03 current 4S member publishes a real Vehicle/Cycle, same-subject license receipt, model facts and audit atomically',async()=>{
 const created=await save(full({vin:'MB-FOURS-VIN-97003-A',description:'0 image and no price'}));
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.code,'VEHICLE_PUBLISHED');
 const vehicleId=Number(result.body.vehicleId),cycleId=Number(result.body.listingCycleId);
 firstPublishedVehicle=vehicleId;
 const vehicle=(await db.query('SELECT vehicle_id,source_type,model_id,vin,created_by_employee_id,formally_published_at FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.ok(vehicle);assert.equal(vehicle.source_type,'four_s');assert.equal(Number(vehicle.model_id),97003);
 assert.equal(vehicle.vin,'MB-FOURS-VIN-97003-A');assert.equal(Number(vehicle.created_by_employee_id),2);assert.ok(vehicle.formally_published_at);
 const receipt=(await db.query('SELECT member_employee_id,license_id,brand_id,series_id,model_id,model_year,mileage_km,city FROM public.f05_3a_member_publications WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND revoked_at IS NULL',[vehicleId,cycleId])).rows[0];
 assert.ok(receipt);assert.equal(Number(receipt.member_employee_id),2);assert.equal(Number(receipt.license_id),activeLicense.licenseId);
 assert.equal(Number(receipt.brand_id),97001);assert.equal(Number(receipt.series_id),97002);assert.equal(Number(receipt.model_id),97003);
 assert.equal(Number(receipt.model_year),2026);assert.equal(Number(receipt.mileage_km),16000);assert.equal(receipt.city,'Suzhou');
 assert.equal((await db.query("SELECT 1 FROM public.f05_3a_member_trust_audit WHERE publication_id=(SELECT publication_id FROM public.f05_3a_member_publications WHERE vehicle_id=$1) AND event_kind='MEMBER_PUBLISH' AND actor_kind='FOUR_S_MEMBER' AND actor_member_employee_id=2",[vehicleId])).rowCount,1);
 assert.equal((await db.query('SELECT 1 FROM f05_manual_vehicle_test.published_vehicle_facts WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vehicleId,cycleId])).rowCount,1);
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:four});
 assert.equal(detail.body.draft.status,'published');assert.equal(Number(detail.body.draft.publishedVehicleId),vehicleId);
});
test('S04 another 4S account and Mingbang employee cannot read or modify this member draft',async()=>{
 const created=await save({sourceType:'four_s',description:'4S private draft'});
 const otherRead=await app.request(BASE+'/'+created.body.draftId,{token:other});
 assert.equal(otherRead.status,404);assert.equal(otherRead.body.code,'DRAFT_NOT_FOUND');
 const staffRead=await app.request(BASE+'/'+created.body.draftId,{token:staff});
 assert.equal(staffRead.status,404);assert.equal(staffRead.body.code,'DRAFT_NOT_FOUND');
 const otherWrite=await app.request(BASE+'/'+created.body.draftId,{method:'PUT',token:other,body:{expectedVersion:1,payload:{description:'impersonated overwrite'}}});
 assert.equal(otherWrite.status,404);
 assert.equal((await app.request(BASE+'/'+created.body.draftId,{token:four})).body.draft.payload.description,'4S private draft');
});
test('S05 exact duplicate VIN is denied without creating a second 4S Vehicle and keeps draft editable',async()=>{
 const created=await save(full({vin:'MB-FOURS-VIN-97003-A',description:'duplicate 4S VIN'}));
 const before=Number((await db.query("SELECT count(*)::int n FROM public.vehicles WHERE vin='MB-FOURS-VIN-97003-A' AND source_type IN ('mingbang','four_s')")).rows[0].n);
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,409);assert.equal(result.body.code,'VIN_DUPLICATE');assert.equal(result.body.preserveDraft,true);
 assert.equal(Number((await db.query("SELECT count(*)::int n FROM public.vehicles WHERE vin='MB-FOURS-VIN-97003-A' AND source_type IN ('mingbang','four_s')")).rows[0].n),before);
 assert.equal((await app.request(BASE+'/'+created.body.draftId,{token:four})).body.draft.status,'draft');
});
test('S06 license revocation racing the current publish path is fail-closed and does not delete draft',async()=>{
 const created=await save(full({description:'retain draft if current license revoked'}));
 const license=(await db.query('SELECT license_id,version FROM public.f05_3a_member_create_licenses WHERE employee_id=2 AND revoked_at IS NULL')).rows[0];
 assert.ok(license);
 const revoked=await revokeMemberCreateLicense(auth,admin,{licenseId:Number(license.license_id),version:Number(license.version),
  eventKey:'manual-draft-revoke-license-'+randomBytes(16).toString('hex')});
 assert.equal(revoked.allowed,true,JSON.stringify(revoked));
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,403);assert.equal(result.body.code,'PUBLICATION_AUTHORITY_DENIED');
 assert.equal(result.body.preserveDraft,true);
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:four});
 assert.equal(detail.status,200);assert.equal(detail.body.draft.status,'draft');
 assert.equal(detail.body.draft.payload.description,'retain draft if current license revoked');
 if(firstPublishedVehicle!==undefined){
  const pub=(await db.query('SELECT revoked_at FROM public.f05_3a_member_publications WHERE vehicle_id=$1',[firstPublishedVehicle])).rows[0];
  assert.notEqual(pub.revoked_at,null,'license revocation must invalidate current 4S object');
 }
});
test('S07 final F05-3A public seal and private draft schema remain valid',async()=>{
 const x=await verify(db);assert.equal(x.verified,true);assert.equal(x.source,'F05_3A_000016');assert.equal(x.publicSchemaUnchanged,true);
 assert.equal(Number((await db.query("SELECT count(*)::int n FROM f05_manual_vehicle_test.draft_events WHERE event_kind='PUBLISHED'")).rows[0].n),1);
});
