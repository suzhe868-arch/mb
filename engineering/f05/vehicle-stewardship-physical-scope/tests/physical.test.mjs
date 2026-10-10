import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback,apply,PREVIOUS} from '../migration.mjs';
import {issueFromTrustedManualPublication,recordTrustedManualPublicationEvent,readMinimalCurrentVehicle,revokeCurrentResponsibility,transferCurrentResponsibility} from '../service.mjs';
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
 assert.equal((await issueFromTrustedManualPublication(auth,token,event(49002,49012,'synthetic-f05-2-duplicate-different-key'))).code,'F05_2_PUBLISHED_EVENT_SOURCE_GAP');
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

test('F05-2-A10 actual manager role and team scope signed handover keeps old immutable',async()=>{
 const eventKey='synthetic-f05-2-physical-four-s-publish-49004';
 const fact=await recordTrustedManualPublicationEvent(auth,token,event(49004,49014,eventKey));
 assert.equal(fact.allowed,true,JSON.stringify(fact));
 const old=await issueFromTrustedManualPublication(auth,token,event(49004,49014,eventKey));
 assert.equal(old.code,'F05_2_ISSUED',JSON.stringify(old));
 const req={responsibilityId:old.responsibilityId,version:1,teamId:901,targetEmployeeId:7,eventKey:'synthetic-f05-2-manager-handover-49004-to-7'};
 assert.equal((await transferCurrentResponsibility(auth,token,req)).allowed,false,'ordinary sales may not hand over');
 const manager=await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'f05-2-manager-handover'});
 assert.equal(manager.code,'AUTH_OK',JSON.stringify(manager));
 const transferred=await transferCurrentResponsibility(auth,manager.token,req);
 assert.equal(transferred.code,'F05_2_TRANSFERRED',JSON.stringify(transferred));
 assert.notEqual(transferred.responsibilityId,old.responsibilityId);
 const rows=(await db.query("SELECT responsibility_id,responsible_employee_id,revoked_at,provenance_kind FROM public.vehicle_current_responsibilities WHERE vehicle_id=49004 ORDER BY responsibility_id")).rows;
 assert.equal(rows.length,2);
 assert.ok(rows[0].revoked_at);
 assert.equal(Number(rows[1].responsible_employee_id),7);
 assert.equal(rows[1].provenance_kind,'AUTHORIZED_FORMAL_HANDOVER');
 const rec=await auth.login({login:'limit_test',password:'SyntheticLimit_1234567',source:'f05-2-handover-receiver'});
 assert.equal(rec.code,'AUTH_OK',JSON.stringify(rec));
 assert.equal((await readMinimalCurrentVehicle(auth,rec.token,{outlet:'detail',vehicleId:49004})).allowed,true);
 assert.equal((await transferCurrentResponsibility(auth,manager.token,req)).allowed,false,'stale version cannot handover twice');
});
test('F05-2-A11 actual two PostgreSQL 16 connections enforce row lock NOWAIT conflict',async()=>{
 const x=await connect(),y=await connect();
 try{
  await x.query('BEGIN');
  const active=(await x.query("SELECT responsibility_id FROM public.vehicle_current_responsibilities WHERE vehicle_id=49004 AND revoked_at IS NULL FOR UPDATE")).rows[0];
  assert.ok(active?.responsibility_id);
  await y.query('BEGIN');
  await assert.rejects(y.query("SELECT responsibility_id FROM public.vehicle_current_responsibilities WHERE responsibility_id=$1 FOR UPDATE NOWAIT",[active.responsibility_id]),/could not obtain lock/i);
  await y.query('ROLLBACK');
  await x.query('COMMIT');
  assert.equal((await y.query("SELECT count(*)::int n FROM public.vehicle_current_responsibilities WHERE vehicle_id=49004 AND revoked_at IS NULL")).rows[0].n,1);
 }finally{try{await x.query('ROLLBACK')}catch{}try{await y.query('ROLLBACK')}catch{}await x.end();await y.end()}
});
