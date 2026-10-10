import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback,apply,PREVIOUS} from '../migration.mjs';
import {issueFromTrustedManualPublication,recordTrustedManualPublicationEvent,readMinimalCurrentVehicle,revokeCurrentResponsibility} from '../service.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32);
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let token;
test.before(async()=>{
 const r=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-2-physical'});
 assert.equal(r.code,'AUTH_OK',JSON.stringify(r));token=r.token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
const event=(id,cycle,key)=>({vehicleId:id,listingCycleId:cycle,teamId:901,eventKey:key});
const pubKey='synthetic-f05-2-manual-publish-49002';
test('F05-2-A01 true M94 schema and migration evidence',async()=>{
 const s=await verify(db);
 assert.equal(s.verified,true);assert.equal(s.oldSha,PREVIOUS);
 assert.ok(s.added.some(x=>x.includes('vehicle_current_responsibilities')));
 assert.ok(s.added.some(x=>x.includes('vehicle_responsibility_audit_events')));
 assert.equal((await db.query("SELECT count(*)::int n FROM public.f03_schema_migrations WHERE migration_id='000015_vehicle_current_responsibility_ci_only'")).rows[0].n,1);
 assert.equal((await apply(db)).newSha,s.newSha);
});
test('F05-2-A02 even real vehicle uploader cannot read without a signed event',async()=>{
 assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false);
 assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49004,outlet:'detail'})).allowed,false);
});
test('F05-2-A03 verified real PG16 publication sign makes minimum read possible',async()=>{
 assert.equal((await issueFromTrustedManualPublication(auth,token,event(49006,49016,'synthetic-f05-2-forbidden-wholesale-49006'))).allowed,false);
 const origin=await recordTrustedManualPublicationEvent(auth,token,event(49002,49012,pubKey));
 assert.equal(origin.allowed,true,JSON.stringify(origin));
 const s=await issueFromTrustedManualPublication(auth,token,event(49002,49012,pubKey));
 assert.equal(s.code,'F05_2_ISSUED',JSON.stringify(s));
 const r=await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'});
 assert.deepEqual(r,{code:'F05_2_MINIMAL_VEHICLE',allowed:true,vehicleId:49002,listingCycleId:49012,sourceKind:'mingbang'});
});
test('F05-2-A04 event replay and duplicate current responsibility never elevate',async()=>{
 const a=await issueFromTrustedManualPublication(auth,token,event(49002,49012,pubKey));
 assert.equal(a.code,'F05_2_IDEMPOTENT');
 assert.equal((await issueFromTrustedManualPublication(auth,token,event(49002,49012,'synthetic-f05-2-duplicate-different-key'))).code,'F05_2_ALREADY_ASSIGNED');
 assert.equal((await issueFromTrustedManualPublication(auth,token,event(49004,49014,pubKey))).allowed,false);
});
test('F05-2-A05 personal deny is live; revoked capability does not survive',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=14");
 try{assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false)}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=14")}
 assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,true);
});
test('F05-2-A06 expired or altered source no longer reads against signed row',async()=>{
 await db.query("UPDATE public.vehicles SET source_type='four_s' WHERE vehicle_id=49002");
 try{assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false)}
 finally{await db.query("UPDATE public.vehicles SET source_type='mingbang' WHERE vehicle_id=49002")}
 await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=49012");
 try{assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false)}
 finally{await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=49012")}
});
test('F05-2-A07 inactive and lost team scope deny despite historical signed provenance',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 try{assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false)}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1")}
 await db.query("UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=29001");
 try{assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false)}
 finally{await db.query("UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=29001")}
});
test('F05-2-A08 unsigned 4S self representation and unapproved sensitive outlets hard-deny',async()=>{
 assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49004,outlet:'detail'})).allowed,false);
 for(const outlet of ['export','list','copy','print','history','cache']){
  assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet})).allowed,false);
 }
});
test('F05-2-A09 real revoke invalidates read, historical rows and immutable audit remain',async()=>{
 const row=(await db.query("SELECT responsibility_id,version FROM public.vehicle_current_responsibilities WHERE trusted_event_key=$1",[pubKey])).rows[0];
 const out=await revokeCurrentResponsibility(auth,token,{eventKey:'synthetic-f05-2-revoke-49002-accepted',responsibilityId:Number(row.responsibility_id),version:Number(row.version)});
 assert.equal(out.code,'F05_2_REVOKED',JSON.stringify(out));
 assert.equal((await readMinimalCurrentVehicle(auth,token,{vehicleId:49002,outlet:'detail'})).allowed,false);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_responsibility_audit_events WHERE responsibility_id=$1',[row.responsibility_id])).rows[0].n,2);
 await assert.rejects(db.query("DELETE FROM public.vehicle_responsibility_audit_events WHERE responsibility_id=$1",[row.responsibility_id]),/F05_2_AUDIT_IMMUTABLE/);
 await assert.rejects(rollback(db),/USED_HISTORY_ROLLBACK_DENY/);
});
