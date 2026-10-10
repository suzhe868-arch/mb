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
  // Governance may win by refusing the transfer, or the manager may commit first.
  // Either outcome must satisfy actual CAS/ownership semantics and no leak.
  assert.ok(x.allowed===true||x.code==='F05_2_TRANSFER_PERMISSION_OR_RECEIVER_DENIED',JSON.stringify(x));
  const rows=(await db.query("SELECT responsible_employee_id,revoked_at FROM public.vehicle_current_responsibilities WHERE vehicle_id=59015 ORDER BY responsibility_id")).rows;
  if(x.allowed){
   assert.equal(rows.length,2);assert.ok(rows[0].revoked_at);assert.equal(Number(rows[1].responsible_employee_id),7);
  }else{
   assert.equal(rows.length,1);assert.equal(rows[0].revoked_at,null);
  }
  await other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=7 AND permission_id=14");
  assert.equal((await view(receiver,59015)).allowed,false);
  await other.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=7 AND permission_id=14");
  assert.equal((await view(receiver,59015)).allowed,false,'revoked receiver cannot auto-reactivate');
 }finally{await other.end()}
});

test('R-A15 scope/role governance cannot COMMIT between proven Vehicle row lock and read COMMIT',async()=>{
 const s=await publish(59017);assert.equal(s.code,'F05_2_ISSUED');
 const other=await connect();
 try{
  const r=await readMinimalCurrentVehicle(auth,staff,{vehicleId:59017,outlet:'detail'},{
   testCheckpoint:async()=>{
    await other.query('BEGIN');await other.query("SET LOCAL lock_timeout='250ms'");
    await assert.rejects(other.query("UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=29001"),e=>e.code==='55P03','scope governance trigger must wait for signed current Vehicle read COMMIT');
    await other.query('ROLLBACK');
   }});
  assert.equal(r.allowed,true);
  await other.query("UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=29001");
  assert.equal((await view(staff,59017)).allowed,false);
  await other.query("UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=29001");
  assert.equal((await view(staff,59017)).allowed,false);
 }finally{await other.end()}
});
test('R-A16 actual publication transaction and capability revocation have a single COMMIT order',async()=>{
 const other=await connect(),p=fresh(59018);
 try{
  const signed=await publishAndIssueFromCurrentTransaction(auth,staff,p,{
   testCheckpoint:async phase=>{
    assert.equal(phase,'publisher_permission_proven');
    await other.query('BEGIN');await other.query("SET LOCAL lock_timeout='250ms'");
    await assert.rejects(other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=399"),e=>e.code==='55P03','publisher must serialize before governance capability revoke');
    await other.query('ROLLBACK');
   }});
  assert.equal(signed.code,'F05_2_ISSUED',JSON.stringify(signed));
  assert.equal((await view(staff,59018)).allowed,true);
  await other.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=399");
  assert.equal((await view(staff,59018)).allowed,false);
  await other.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=399");
  assert.equal((await view(staff,59018)).allowed,false,'permission restore does not resurrect old signed owner');
 }finally{await other.end()}
});

// A-F05-2-05: genuine nonprivileged PG16 facts, no mocked audit or actor.
test('R-A17 a separate PG16 governance writer cannot impersonate the revoked employee',async()=>{
 const items=(await db.query("SELECT a.*,r.vehicle_id,r.responsible_employee_id FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.vehicle_id=59002 AND a.event_kind='REVOKE' AND a.source_evidence LIKE 'F05_2_CI_AUTOMATIC_INVALIDATION_%' ORDER BY a.audit_id")).rows;
 assert.equal(items.length,1);
 const a=items[0];
 assert.equal(a.actor_kind,'SYSTEM');
 assert.equal(a.actor_employee_id,null,'SYSTEM cannot claim affected employee ID as human actor');
 assert.equal(a.actor_system_code,'F05_2_GOVERNANCE_INVALIDATION');
 assert.equal(Number(a.previous_employee_id),1);
 assert.equal(a.current_employee_id,null);
 assert.equal(Number(a.responsible_employee_id),1);
 assert.equal(a.actor_context.trigger,'f05_2_governance_invalidate');
 assert.equal(a.actor_context.cause,'GOVERNANCE_employee_permission_overrides');
 assert.equal(a.actor_context.source.source_table,'employee_permission_overrides');
 assert.equal(a.actor_context.source.source_operation,'UPDATE');
 assert.equal(Number(a.actor_context.source.affected_employee_id),1);
 assert.equal(a.actor_context.database_actor,'f03_ci');
 assert.ok(Number(a.actor_context.transaction_id)>0);
 assert.equal(a.before_state.active,true);
 assert.equal(a.after_state.active,false);
 assert.equal(a.before_state.revoked_at,null);
 assert.ok(a.after_state.revoked_at);
 assert.equal(Number(a.after_state.version),Number(a.before_state.version)+1);
 assert.equal(Number(a.after_state.responsible_employee_id),1);
 assert.ok(a.happened_at);
});
test('R-A18 employee inactive at automatic revoke remains the subject and never a human actor',async()=>{
 const x=(await db.query("SELECT a.actor_kind,a.actor_employee_id,a.actor_system_code,a.actor_context,a.previous_employee_id,a.current_employee_id,a.before_state,a.after_state FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.vehicle_id=59006 AND a.event_kind='REVOKE'")).rows;
 assert.equal(x.length,1);
 const e=x[0];
 assert.equal(e.actor_kind,'SYSTEM');assert.equal(e.actor_employee_id,null);
 assert.equal(e.actor_system_code,'F05_2_GOVERNANCE_INVALIDATION');
 assert.equal(Number(e.previous_employee_id),1);assert.equal(e.current_employee_id,null);
 assert.equal(e.actor_context.cause,'GOVERNANCE_employees');
 assert.equal(e.actor_context.source.source_table,'employees');
 assert.equal(e.actor_context.source.source_operation,'UPDATE');
 assert.equal(e.before_state.active,true);assert.equal(e.after_state.active,false);
 assert.equal((await db.query("SELECT employment_status FROM public.employees WHERE employee_id=1")).rows[0].employment_status,'active');
});
test('R-A19 direct employee ISSUE/REVOKE and manager TRANSFER keep separately proven real human actors',async()=>{
 const x=(await db.query("SELECT r.vehicle_id,a.event_kind,a.actor_kind,a.actor_employee_id,a.actor_system_code,a.previous_employee_id,a.current_employee_id FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.vehicle_id IN(59009,59010) ORDER BY r.vehicle_id,a.audit_id")).rows;
 const p=x.filter(z=>Number(z.vehicle_id)===59009);
 assert.equal(p.length,2);assert.deepEqual(p.map(z=>z.event_kind),['ISSUE','REVOKE']);
 for(const a of p){assert.equal(a.actor_kind,'EMPLOYEE');assert.equal(Number(a.actor_employee_id),1);assert.equal(a.actor_system_code,null)}
 const h=x.filter(z=>Number(z.vehicle_id)===59010);
 assert.equal(h.length,3);assert.equal(h[0].event_kind,'ISSUE');
 assert.equal(Number(h[0].actor_employee_id),1);
 for(const a of h.slice(1)){
  assert.equal(a.event_kind,'TRANSFER');assert.equal(a.actor_kind,'EMPLOYEE');
  assert.equal(Number(a.actor_employee_id),6,'true manager rather than the old owner');
  assert.equal(a.actor_system_code,null);
  assert.equal(Number(a.previous_employee_id),1);
  assert.equal(Number(a.current_employee_id),7);
 }
});
test('R-A20 duplicate governance trigger and post-inactive reactivation cannot create another SYSTEM event',async()=>{
 const count=async()=>(await db.query("SELECT count(*)::int n FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.vehicle_id=59002 AND a.actor_kind='SYSTEM'")).rows[0].n;
 assert.equal(await count(),1);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=14");
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
 assert.equal(await count(),1);
 assert.equal((await view(staff,59002)).allowed,false);
 const id=(await db.query("SELECT a.audit_id FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.vehicle_id=59002 AND a.actor_kind='SYSTEM'")).rows[0].audit_id;
 await assert.rejects(db.query("UPDATE public.vehicle_responsibility_audit_events SET actor_employee_id=1 WHERE audit_id=$1",[id]),/F05_2_AUDIT_IMMUTABLE/);
});
test('R-A21 physical actor CHECK rejects SYSTEM+human and anonymous EMPLOYEE, preserving immutable audit',async()=>{
 const id=(await db.query("SELECT responsibility_id FROM public.vehicle_current_responsibilities WHERE vehicle_id=59002")).rows[0].responsibility_id;
 await assert.rejects(db.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_kind,actor_employee_id,actor_system_code,actor_context,previous_employee_id,source_evidence) VALUES($1,'invalid-system-human-identity-59002','REVOKE','SYSTEM',1,'F05_2_GOVERNANCE_INVALIDATION','{\"trigger\":\"f05_2_governance_invalidate\"}'::jsonb,1,'REJECT_MISATTRIBUTED_SYSTEM_ACTOR')",[id]),e=>e.code==='23514');
 await assert.rejects(db.query("INSERT INTO public.vehicle_responsibility_audit_events(responsibility_id,event_key,event_kind,actor_kind,actor_employee_id,previous_employee_id,source_evidence) VALUES($1,'invalid-anonymous-human-identity-59002','REVOKE','EMPLOYEE',NULL,1,'REJECT_ANONYMOUS_HUMAN_ACTOR')",[id]),e=>e.code==='23514');
 const count=(await db.query("SELECT count(*)::int n FROM public.vehicle_responsibility_audit_events a JOIN public.vehicle_current_responsibilities r USING(responsibility_id) WHERE r.vehicle_id=59002")).rows[0].n;
 assert.equal(count,2,'only historical manual issue and system revoke persist');
});
