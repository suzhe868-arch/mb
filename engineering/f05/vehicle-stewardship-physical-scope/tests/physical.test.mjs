// A-F05-2-01/02/03/04: exclusively real isolated PG16, no mocked ownership.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback,apply,PREVIOUS} from '../migration.mjs';
import {
 issueFromTrustedManualPublication,recordTrustedManualPublicationEvent,
 publishAndIssueFromCurrentTransaction,readMinimalCurrentVehicle,
 revokeCurrentResponsibility,transferCurrentResponsibility
} from '../service.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let staff,manager,receiver;
const key=n=>'synthetic-f05-2-formal-published-event-'+n;
const fresh=(id,kind='mingbang')=>({vehicleId:id,listingCycleId:id+100,teamId:901,sourceKind:kind,eventKey:key(id)});
const view=(t,id)=>readMinimalCurrentVehicle(auth,t,{vehicleId:id,outlet:'detail'});
const publish=async(id,kind)=>publishAndIssueFromCurrentTransaction(auth,staff,fresh(id,kind));
test.before(async()=>{
 for(const [user,pass,assign] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','staff'],
  ['race_test','SyntheticRace_1234567','manager'],
  ['limit_test','SyntheticLimit_1234567','receiver']]){
  const r=await auth.login({login:user,password:pass,source:'f05-2-rework-physical'});
  assert.equal(r.code,'AUTH_OK',JSON.stringify(r));
  if(assign==='staff')staff=r.token;else if(assign==='manager')manager=r.token;else receiver=r.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('R-A01 old sealed 94-table PG16 schema immutable and new additive catalog exact',async()=>{
 const x=await verify(db);assert.equal(x.oldSha,PREVIOUS);assert.equal(x.verified,true);
 assert.ok(x.added.some(a=>a.includes('f05_2_employment_epoch_guard')));
 assert.ok(x.added.some(a=>a.includes('f05_2_override_epoch_guard')));
 assert.equal((await apply(db)).newSha,x.newSha);
});
test('R-A02 old uploader and fake retroactive publication cannot mint owner',async()=>{
 assert.equal((await view(staff,49002)).allowed,false);
 assert.equal((await recordTrustedManualPublicationEvent(auth,staff,{vehicleId:49002,listingCycleId:49012,teamId:901,eventKey:key(49002)})).allowed,false);
 assert.equal((await issueFromTrustedManualPublication(auth,staff,{vehicleId:49002,listingCycleId:49012,teamId:901,eventKey:key(49002)})).allowed,false);
 assert.equal((await publishAndIssueFromCurrentTransaction(auth,staff,{...fresh(49002),listingCycleId:49012})).allowed,false);
 assert.equal((await view(staff,49002)).allowed,false);
});
test('R-A03 only authenticated new formal publication commits Vehicle Cycle owner and audit atomically',async()=>{
 const out=await publish(59002);
 assert.equal(out.code,'F05_2_ISSUED',JSON.stringify(out));
 assert.deepEqual(await view(staff,59002),{code:'F05_2_MINIMAL_VEHICLE',allowed:true,vehicleId:59002,listingCycleId:59102,sourceKind:'mingbang'});
 const x=(await db.query("SELECT v.created_by_employee_id,v.formally_published_at,x.responsible_employee_id,x.trusted_event_key,COUNT(*) OVER() n FROM public.vehicles v JOIN public.vehicle_current_responsibilities x USING(vehicle_id) WHERE v.vehicle_id=59002")).rows[0];
 assert.equal(Number(x.created_by_employee_id),1);assert.equal(Number(x.responsible_employee_id),1);
 assert.equal(x.trusted_event_key,key(59002));assert.equal(Number(x.n),1);assert.ok(x.formally_published_at);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_id='59002' AND action='vehicle.manual.published'")).rows[0].n,1);
});
test('R-A04 duplicate signed same intent idempotent, different key, actor or old upload refused',async()=>{
 assert.equal((await publish(59002)).code,'F05_2_IDEMPOTENT');
 assert.equal((await publishAndIssueFromCurrentTransaction(auth,staff,{...fresh(59002),eventKey:key(59002)+'_DIFFERENT'})).allowed,false);
 assert.equal((await publishAndIssueFromCurrentTransaction(auth,manager,fresh(59002))).allowed,false);
 assert.equal((await publishAndIssueFromCurrentTransaction(auth,staff,{...fresh(59014),sourceKind:'wholesale'})).allowed,false);
});
test('R-A05 personal deny COMMIT irrevocably ends old Vehicle receipt; re-allow no resurrection',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=14");
 assert.equal((await view(staff,59002)).allowed,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=14");
 assert.equal((await view(staff,59002)).allowed,false,'old grant cannot revive after reauthorization');
 assert.equal((await db.query("SELECT count(*)::int n FROM public.vehicle_current_responsibilities WHERE vehicle_id=59002 AND revoked_at IS NULL")).rows[0].n,0);
 assert.ok((await db.query("SELECT count(*)::int n FROM public.vehicle_responsibility_audit_events WHERE source_evidence LIKE 'F05_2_CI_AUTOMATIC_INVALIDATION_%'")).rows[0].n>=1);
});
test('R-A06 physical source change and cycle end cannot be reverted into old ownership',async()=>{
 assert.equal((await publish(59004)).allowed,true);
 await db.query("UPDATE public.vehicles SET source_type='four_s' WHERE vehicle_id=59004");
 assert.equal((await view(staff,59004)).allowed,false);
 await db.query("UPDATE public.vehicles SET source_type='mingbang' WHERE vehicle_id=59004");
 assert.equal((await view(staff,59004)).allowed,false);
 assert.equal((await publish(59005)).allowed,true);
 await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=59105");
 assert.equal((await view(staff,59005)).allowed,false);
 await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=59105");
 assert.equal((await view(staff,59005)).allowed,false);
});
test('R-A07 inactive-to-active and scope-reissued do not resurrect historical responsibility',async()=>{
 assert.equal((await publish(59006)).allowed,true);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 assert.equal((await view(staff,59006)).allowed,false);
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
 assert.equal((await view(staff,59006)).allowed,false);
 assert.equal((await publish(59007)).allowed,true);
 await db.query("UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=29001");
 assert.equal((await view(staff,59007)).allowed,false);
 await db.query("UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=29001");
 assert.equal((await view(staff,59007)).allowed,false);
 assert.equal((await publish(59008)).allowed,true);
 await db.query("UPDATE public.employees SET store_id=NULL WHERE employee_id=1");
 assert.equal((await view(staff,59008)).allowed,false);
 await db.query("UPDATE public.employees SET store_id=1 WHERE employee_id=1");
 assert.equal((await view(staff,59008)).allowed,false);
});
test('R-A08 old 4S and wholesale never auto-mint, non-detail exits stay denied',async()=>{
 assert.equal((await view(staff,49004)).allowed,false);
 assert.equal((await view(staff,49006)).allowed,false);
 for(const outlet of ['list','export','copy','cache','print','history'])
  assert.equal((await readMinimalCurrentVehicle(auth,staff,{vehicleId:59008,outlet})).allowed,false);
});
test('R-A09 explicit revocation preserves immutable history; used migration cannot rollback',async()=>{
 const s=await publish(59009);assert.equal(s.code,'F05_2_ISSUED');
 const done=await revokeCurrentResponsibility(auth,staff,{eventKey:'synthetic-f05-2-rework-explicit-revoke-59009',responsibilityId:s.responsibilityId,version:1});
 assert.equal(done.code,'F05_2_REVOKED',JSON.stringify(done));
 assert.equal((await view(staff,59009)).allowed,false);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_responsibility_audit_events WHERE responsibility_id=$1',[s.responsibilityId])).rows[0].n,2);
 await assert.rejects(db.query('DELETE FROM public.vehicle_responsibility_audit_events WHERE responsibility_id=$1',[s.responsibilityId]),/F05_2_AUDIT_IMMUTABLE/);
 await assert.rejects(rollback(db),/USED_HISTORY_ROLLBACK_DENY/);
});
test('R-A10 real manager and scope transfer: old same-team sales 403, receiver 200, manager separately proven',async()=>{
 const s=await publish(59010,'four_s');assert.equal(s.code,'F05_2_ISSUED');
 const p={responsibilityId:s.responsibilityId,version:1,teamId:901,targetEmployeeId:7,eventKey:'synthetic-f05-2-authorized-manager-transfer-59010'};
 assert.equal((await transferCurrentResponsibility(auth,staff,p)).allowed,false);
 assert.equal((await transferCurrentResponsibility(auth,manager,p)).code,'F05_2_TRANSFERRED');
 assert.equal((await view(staff,59010)).allowed,false,'former ordinary sales remains same Team but has no current Vehicle');
 assert.equal((await view(receiver,59010)).allowed,true,'new current owner remains valid');
 assert.equal((await view(manager,59010)).allowed,true,'manager must also have independent manage + read scope');
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=6 AND permission_id=399");
 assert.equal((await view(manager,59010)).allowed,false,'manager role alone cannot bypass missing cap');
 assert.equal((await view(receiver,59010)).allowed,true,'manager losing own capability must not revoke recipient');
 assert.equal((await transferCurrentResponsibility(auth,manager,p)).allowed,false,'stale CAS and removed capability denied');
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=6 AND permission_id=399");
});
test('R-A11 two independent PG16 sessions: read-before-governance COMMIT or revoke-before-read, never stale-after-commit',async()=>{
 const s=await publish(59011);assert.equal(s.code,'F05_2_ISSUED');
 const other=await connect();
 try{
  const r=await readMinimalCurrentVehicle(auth,staff,{vehicleId:59011,outlet:'detail'},{
   testCheckpoint:async phase=>{
    assert.equal(phase,'responsibility_locked');
    await other.query('BEGIN');
    await other.query("SET LOCAL lock_timeout='250ms'");
    await assert.rejects(other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=14"),e=>e.code==='55P03','revocation trigger must wait for active signed read transaction');
    await other.query('ROLLBACK');
   }});
  assert.equal(r.allowed,true,'reader serializes before failed concurrent revocation');
  await other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=14");
  assert.equal((await view(staff,59011)).allowed,false);
  await other.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=14");
  assert.equal((await view(staff,59011)).allowed,false);
 }finally{await other.end()}
});
test('R-A12 source_type write cannot COMMIT during locked Vehicle read; later source flip invalidates',async()=>{
 const s=await publish(59012);assert.equal(s.code,'F05_2_ISSUED');
 const other=await connect();
 try{
  const read=await readMinimalCurrentVehicle(auth,staff,{vehicleId:59012,outlet:'detail'},{
   testCheckpoint:async()=>{
    await other.query('BEGIN');await other.query("SET LOCAL lock_timeout='250ms'");
    await assert.rejects(other.query("UPDATE public.vehicles SET source_type='four_s' WHERE vehicle_id=59012"),e=>e.code==='55P03');
    await other.query('ROLLBACK');
   }});
  assert.equal(read.allowed,true);
  await other.query("UPDATE public.vehicles SET source_type='four_s' WHERE vehicle_id=59012");
  assert.equal((await view(staff,59012)).allowed,false);
  await other.query("UPDATE public.vehicles SET source_type='mingbang' WHERE vehicle_id=59012");
  assert.equal((await view(staff,59012)).allowed,false);
 }finally{await other.end()}
});
test('R-A13 two concurrent same event publish calls remain unique and share one physically proven owner',async()=>{
 const p=fresh(59013);
 const results=await Promise.all([publishAndIssueFromCurrentTransaction(auth,staff,p),publishAndIssueFromCurrentTransaction(auth,staff,p)]);
 assert.deepEqual(results.map(x=>x.code).sort(),['F05_2_IDEMPOTENT','F05_2_ISSUED']);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_current_responsibilities WHERE vehicle_id=59013')).rows[0].n,1);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_id='59013' AND action='vehicle.manual.published'")).rows[0].n,1);
});
test('R-A14 concurrent recipient capability revoke meets handover at advisory lock and invalidates signed successor',async()=>{
 const s=await publish(59015);assert.equal(s.code,'F05_2_ISSUED');
 const p={responsibilityId:s.responsibilityId,version:1,teamId:901,targetEmployeeId:7,eventKey:'synthetic-f05-2-transfer-governance-race-59015'};
 const other=await connect();
 try{
  const x=await transferCurrentResponsibility(auth,manager,p,{testCheckpoint:async()=>{
   await other.query('BEGIN');await other.query("SET LOCAL lock_timeout='250ms'");
   await assert.rejects(other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=7 AND permission_id=14"),e=>e.code==='55P03');
   await other.query('ROLLBACK');
  }});
  assert.equal(x.allowed,true,JSON.stringify(x));
  await other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=7 AND permission_id=14");
  assert.equal((await view(receiver,59015)).allowed,false);
  await other.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=7 AND permission_id=14");
  assert.equal((await view(receiver,59015)).allowed,false,'revoked receiver cannot auto-reactivate');
 }finally{await other.end()}
});
