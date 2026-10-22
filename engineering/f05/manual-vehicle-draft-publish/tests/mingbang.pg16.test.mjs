// Real PostgreSQL 16 + loopback TLS end-to-end for the F05-2 Mingbang publication path.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createManualVehicleDraftService} from '../service.mjs';
import {startHarness,login,BASE} from './https-harness.mjs';
const origin='https://127.0.0.1:48984';
const secret=randomBytes(32);
const db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let app,staff,other;
const save=async(payload)=>app.request(BASE+'/auto-save',{method:'POST',token:staff,body:{payload}});
const publish=async(draftId,expectedVersion=1)=>app.request(BASE+'/'+draftId+'/publish',{method:'POST',token:staff,body:{expectedVersion}});
const full=(changes={})=>({sourceType:'mingbang',brandId:98001,seriesId:98002,modelId:98003,modelYear:2026,mileageKm:18200,city:'Suzhou',...changes});
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
test.before(async()=>{
 await verify(db);
 staff=await login(auth,'employee_test','SyntheticF04_3_CurrentProof_2026','f05-manual-draft-publish');
 other=await login(auth,'limit_test','SyntheticLimit_1234567','f05-manual-draft-publish-cross-owner');
 app=await startHarness(createManualVehicleDraftService({auth}));
});
test.after(async()=>{
 if(app)await app.close();
 await auth.close();
 await db.end();
 secret.fill(0);
});
test('M01 blank form does not persist and no old draft is auto-selected',async()=>{
 const before=await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts');
 const blank=await app.request(BASE+'/auto-save',{method:'POST',token:staff,body:{payload:{sourceType:'mingbang'}}});
 assert.equal(blank.status,200,JSON.stringify(blank.body));
 assert.equal(blank.body.code,'DRAFT_NOT_PERSISTED');
 assert.equal(blank.body.persisted,false);
 assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts'),before);
 const list=await app.request(BASE,{token:staff});
 assert.equal(list.status,200);
 assert.deepEqual(list.body.drafts,[]);
});
test('M02 multi-draft save/list/detail and optimistic version conflict are persisted in PG16',async()=>{
 const first=await save({sourceType:'mingbang',description:'first independent draft'});
 const second=await save({sourceType:'mingbang',description:'second independent draft'});
 assert.equal(first.status,201,JSON.stringify(first.body));assert.equal(second.status,201,JSON.stringify(second.body));
 assert.notEqual(first.body.draftId,second.body.draftId);
 const list=await app.request(BASE,{token:staff});
 assert.equal(list.status,200);assert.equal(list.body.drafts.length,2);
 const detail=await app.request(BASE+'/'+first.body.draftId,{token:staff});
 assert.equal(detail.status,200);assert.equal(detail.body.draft.payload.description,'first independent draft');
 const updated=await app.request(BASE+'/'+first.body.draftId,{method:'PUT',token:staff,body:{expectedVersion:1,payload:{description:'updated first draft'}}});
 assert.equal(updated.status,200,JSON.stringify(updated.body));assert.equal(updated.body.version,2);
 const stale=await app.request(BASE+'/'+first.body.draftId,{method:'PUT',token:staff,body:{expectedVersion:1,payload:{description:'stale overwrite'}}});
 assert.equal(stale.status,409);assert.equal(stale.body.code,'DRAFT_VERSION_CONFLICT');
 assert.equal((await app.request(BASE+'/'+first.body.draftId,{token:staff})).body.draft.payload.description,'updated first draft');
});
test('M03 incomplete required fields block publish and preserve the same draft',async()=>{
 const created=await save({sourceType:'mingbang',description:'incomplete keeps its id'});
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,422);assert.equal(result.body.code,'REQUIRED_FIELDS_MISSING');
 assert.equal(result.body.preserveDraft,true);
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:staff});
 assert.equal(detail.status,200);assert.equal(detail.body.draft.status,'draft');
 assert.equal(detail.body.draft.payload.description,'incomplete keeps its id');
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicles WHERE created_by_employee_id=1 AND formally_published_at IS NOT NULL AND model_id IS NULL'),0);
});
test('M04 invalid or incomplete physical model returns MODEL_MISSING without Vehicle or Cycle',async()=>{
 const created=await save(full({modelId:98999,description:'retain invalid model selection'}));
 const beforeVehicles=await count('SELECT count(*)::int n FROM public.vehicles');
 const beforeCycles=await count('SELECT count(*)::int n FROM public.vehicle_listing_cycles');
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,422);assert.equal(result.body.code,'MODEL_MISSING');
 assert.equal(result.body.preserveDraft,true);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicles'),beforeVehicles);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicle_listing_cycles'),beforeCycles);
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:staff});
 assert.equal(detail.body.draft.payload.modelId,98999);assert.equal(detail.body.draft.status,'draft');
});
test('M05 zero images and absent prices are not publish blockers; trusted F05-2 owner, Vehicle, Cycle, facts and audits commit together',async()=>{
 const created=await save(full({vin:'MB-MANUAL-VIN-98003-A',description:'zero image and no price'}));
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,200,JSON.stringify(result.body));assert.equal(result.body.code,'VEHICLE_PUBLISHED');
 const vehicleId=Number(result.body.vehicleId),cycleId=Number(result.body.listingCycleId);
 const vehicle=(await db.query('SELECT vehicle_id,source_type,model_id,vin,created_by_employee_id,formally_published_at FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.ok(vehicle);assert.equal(vehicle.source_type,'mingbang');assert.equal(Number(vehicle.model_id),98003);
 assert.equal(vehicle.vin,'MB-MANUAL-VIN-98003-A');assert.equal(Number(vehicle.created_by_employee_id),1);assert.ok(vehicle.formally_published_at);
 assert.equal((await db.query('SELECT 1 FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 AND ended_at IS NULL',[cycleId,vehicleId])).rowCount,1);
 assert.equal((await db.query('SELECT 1 FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND responsible_employee_id=1 AND revoked_at IS NULL',[vehicleId,cycleId])).rowCount,1);
 assert.equal((await db.query('SELECT 1 FROM f05_manual_vehicle_test.published_vehicle_facts WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND mileage_km=18200 AND city=\'Suzhou\'',[vehicleId,cycleId])).rowCount,1);
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:staff});
 assert.equal(detail.body.draft.status,'published');assert.equal(Number(detail.body.draft.publishedVehicleId),vehicleId);
 assert.equal((await app.request(BASE,{token:staff})).body.drafts.some(x=>x.draftId===created.body.draftId),false);
 assert.equal((await app.request(BASE+'/'+created.body.draftId,{method:'DELETE',token:staff,body:{confirm:true,expectedVersion:2}})).body.code,'PUBLISHED_VEHICLE_CANNOT_BE_DELETED');
});
test('M06 exact VIN duplicate is fail-closed and does not leak an unauthorized existing vehicle reference',async()=>{
 const created=await save(full({vin:'MB-MANUAL-VIN-98003-A',description:'duplicate must remain editable'}));
 const before=await count("SELECT count(*)::int n FROM public.vehicles WHERE vin='MB-MANUAL-VIN-98003-A' AND source_type IN ('mingbang','four_s')");
 const result=await publish(created.body.draftId,1);
 assert.equal(result.status,409);assert.equal(result.body.code,'VIN_DUPLICATE');
 assert.equal(result.body.preserveDraft,true);assert.equal(result.body.existingVehicleReference,null);
 assert.equal(await count("SELECT count(*)::int n FROM public.vehicles WHERE vin='MB-MANUAL-VIN-98003-A' AND source_type IN ('mingbang','four_s')"),before);
 assert.equal((await app.request(BASE+'/'+created.body.draftId,{token:staff})).body.draft.status,'draft');
});
test('M07 physical delete applies only to explicitly confirmed pure drafts and leaves immutable audit',async()=>{
 const created=await save({sourceType:'mingbang',description:'delete only this draft'});
 const denied=await app.request(BASE+'/'+created.body.draftId,{method:'DELETE',token:staff,body:{confirm:false,expectedVersion:1}});
 assert.equal(denied.status,400);assert.equal(denied.body.code,'DRAFT_DELETE_CONFIRMATION_REQUIRED');
 const done=await app.request(BASE+'/'+created.body.draftId,{method:'DELETE',token:staff,body:{confirm:true,expectedVersion:1}});
 assert.equal(done.status,200);assert.equal(done.body.code,'DRAFT_DELETED');
 assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1',[created.body.draftId]),0);
 assert.equal(await count("SELECT count(*)::int n FROM f05_manual_vehicle_test.draft_events WHERE draft_id=$1 AND event_kind='DELETED'",[created.body.draftId]),1);
 const event=(await db.query("SELECT event_id FROM f05_manual_vehicle_test.draft_events WHERE draft_id=$1 AND event_kind='DELETED'",[created.body.draftId])).rows[0];
 await assert.rejects(()=>db.query('UPDATE f05_manual_vehicle_test.draft_events SET event_metadata=\'{}\'::jsonb WHERE event_id=$1',[event.event_id]),/F05_MANUAL_DRAFT_AUDIT_IMMUTABLE/);
});
test('M08 another currently authorized employee cannot read or overwrite a coworker draft',async()=>{
 const created=await save({sourceType:'mingbang',description:'private to creator'});
 const get=await app.request(BASE+'/'+created.body.draftId,{token:other});
 assert.equal(get.status,404);assert.equal(get.body.code,'DRAFT_NOT_FOUND');
 const overwrite=await app.request(BASE+'/'+created.body.draftId,{method:'PUT',token:other,body:{expectedVersion:1,payload:{description:'cross-owner overwrite'}}});
 assert.equal(overwrite.status,404);assert.equal(overwrite.body.code,'DRAFT_NOT_FOUND');
 assert.equal((await app.request(BASE+'/'+created.body.draftId,{token:staff})).body.draft.payload.description,'private to creator');
});
test('M09 untrusted caller identity headers and wrong Origin are rejected before business reads',async()=>{
 const created=await save({sourceType:'mingbang',description:'header boundary'});
 const forged=await app.request(BASE+'/'+created.body.draftId,{token:staff,headers:{'x-employee-id':'7'}});
 assert.equal(forged.status,403);assert.equal(forged.body.code,'REQUEST_CONTEXT_DENIED');
 const wrongOrigin=await app.request(BASE+'/'+created.body.draftId,{token:staff,headers:{origin:'https://attacker.invalid'}});
 assert.equal(wrongOrigin.status,403);assert.equal(wrongOrigin.body.code,'REQUEST_CONTEXT_DENIED');
});
test('M10 real publication rollback leaves no Vehicle, Cycle, fact or published draft; same draft can retry',async()=>{
 const created=await save(full({description:'retry after injected transaction failure'}));
 process.env.F05_MANUAL_INJECT_PUBLISH_ROLLBACK='true';
 let failed;
 try{failed=await publish(created.body.draftId,1)}finally{delete process.env.F05_MANUAL_INJECT_PUBLISH_ROLLBACK}
 assert.equal(failed.status,503);assert.equal(failed.body.code,'INJECTED_PUBLISH_ROLLBACK');
 const reserved=(await db.query('SELECT reserved_vehicle_id,reserved_listing_cycle_id,status,version FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1',[created.body.draftId])).rows[0];
 assert.equal(reserved.status,'draft');assert.equal(Number(reserved.version),1);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicles WHERE vehicle_id=$1',[reserved.reserved_vehicle_id]),0);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1',[reserved.reserved_listing_cycle_id]),0);
 assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.published_vehicle_facts WHERE vehicle_id=$1',[reserved.reserved_vehicle_id]),0);
 const retry=await publish(created.body.draftId,1);
 assert.equal(retry.status,200,JSON.stringify(retry.body));assert.equal(retry.body.code,'VEHICLE_PUBLISHED');
});
test('M11 concurrent publish requests converge to one Vehicle and one Cycle',async()=>{
 const created=await save(full({vin:'MB-MANUAL-CONCURRENT-VIN',description:'parallel publish intent'}));
 const results=await Promise.all([publish(created.body.draftId,1),publish(created.body.draftId,1)]);
 assert.ok(results.some(x=>x.status===200&&x.body.code==='VEHICLE_PUBLISHED'),JSON.stringify(results.map(x=>x.body)));
 const detail=await app.request(BASE+'/'+created.body.draftId,{token:staff});
 assert.equal(detail.body.draft.status,'published');
 const vehicleId=Number(detail.body.draft.publishedVehicleId),cycleId=Number(detail.body.draft.publishedListingCycleId);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicles WHERE vehicle_id=$1',[vehicleId]),1);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vehicleId,cycleId]),1);
 assert.equal(await count('SELECT count(*)::int n FROM f05_manual_vehicle_test.published_vehicle_facts WHERE vehicle_id=$1',[vehicleId]),1);
});
test('M12 final physical and private schema seals remain verifiable after publication',async()=>{
 const x=await verify(db);assert.equal(x.verified,true);assert.equal(x.publicSchemaUnchanged,true);
 assert.equal(await count("SELECT count(*)::int n FROM f05_manual_vehicle_test.draft_events WHERE event_kind='PUBLISHED'"),3);
});
