import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID} from '../migration.mjs';
import {grantMemberCreateLicense,revokeMemberCreateLicense,publishNewFourSMemberVehicle,readFourSMemberMinimalVehicle,assessFourSMemberAuthority,BLOCKED} from '../source-gate.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let four,other,staff,admin,first,second;
const event=n=>'f05-3a-audited-member-transaction-'+n;
const candidate=(id,changes={})=>({vehicleId:id,listingCycleId:id+1000,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,mileageKm:16000,city:'Suzhou',sourceKind:'four_s',eventKey:event(id),...changes});
const view=(tok,id)=>readFourSMemberMinimalVehicle(auth,tok,{vehicleId:id,outlet:'detail'});
const allowed=(r,code)=>{assert.equal(r.allowed,true,JSON.stringify(r));assert.equal(r.code,code)};
test.before(async()=>{
 for(const [login,password,slot] of [
  ['four_s_test','SyntheticFourS_123456','four'],['other_four_s_test','SyntheticOtherFourS_123456','other'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','staff'],['admin_test','SyntheticAdmin_1234567','admin']]){
  const r=await auth.login({login,password,source:'f05-3a-real-admin-governance'});
  assert.equal(r.code,'AUTH_OK',login+':'+r.code);
  if(slot==='four')four=r.token;else if(slot==='other')other=r.token;else if(slot==='staff')staff=r.token;else admin=r.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('H-A01 true independent 000016 additive migration, immutable old M94 and 000015',async()=>{
 const integrity=await verify(db);
 assert.equal(integrity.verified,true);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f03_schema_migrations WHERE migration_id=$1',[ID])).rows[0].n,1);
 assert.notEqual(integrity.newSha,integrity.priorSha);
});
test('H-A02 role static allow / Customer scope insufficient; System Admin credential required to grant',async()=>{
 assert.deepEqual(await assessFourSMemberAuthority(auth,four),{allowed:false,code:BLOCKED});
 assert.deepEqual(await publishNewFourSMemberVehicle(auth,four,candidate(65021)),{allowed:false,code:BLOCKED});
 for(const token of [four,other,staff,'']){
  const x=await grantMemberCreateLicense(auth,token,{targetEmployeeId:2,eventKey:event('fake-admin-grant')});
  assert.equal(x.allowed,false);
 }
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3a_member_create_licenses')).rows[0].n,0);
});
test('H-A03 real authenticated active System Admin issues current member-only scope, genuine immutable admin audit',async()=>{
 const x=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-license-first')});
 allowed(x,'F05_3A_LICENSE_GRANTED');first=x.licenseId;
 const r=(await db.query("SELECT l.employee_id,l.granted_by_system_admin_id,l.scope_kind,l.version,a.event_kind,a.actor_kind,a.actor_system_admin_id,a.actor_member_employee_id,a.before_state,a.after_state FROM public.f05_3a_member_create_licenses l JOIN public.f05_3a_member_trust_audit a ON a.license_id=l.license_id WHERE l.license_id=$1 AND a.event_kind='ADMIN_GRANT'",[first])).rows[0];
 assert.equal(Number(r.employee_id),2);assert.equal(Number(r.granted_by_system_admin_id),9);
 assert.equal(r.actor_kind,'SYSTEM_ADMIN');assert.equal(Number(r.actor_system_admin_id),9);assert.equal(r.actor_member_employee_id,null);
 assert.equal(r.before_state.active,false);assert.equal(r.after_state.active,true);
 allowed(await assessFourSMemberAuthority(auth,four),'F05_3A_ADMIN_GOVERNED_NEW_OWN_FOUR_S_ONLY');
});
test('H-A04 incomplete PDM06 original seven fields, mismatched physical brand-series-model and impersonation DENY',async()=>{
 for(const bad of [candidate(65022,{brandId:97004}),candidate(65022,{modelYear:2025}),candidate(65022,{city:''}),candidate(65022,{mileageKm:-1}),
  candidate(65022,{sourceKind:'mingbang'}),candidate(65022,{modelId:11111})]){
  assert.equal((await publishNewFourSMemberVehicle(auth,four,bad)).allowed,false);
 }
 for(const tok of [admin,staff,other]){
  assert.equal((await publishNewFourSMemberVehicle(auth,tok,candidate(65022))).allowed,false);
 }
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicles WHERE vehicle_id=65022')).rows[0].n,0);
});
test('H-A05 genuine current four_s Session publishes NEW Vehicle+Cycle+physical model+owner+immutable audit in one COMMIT',async()=>{
 const x=await publishNewFourSMemberVehicle(auth,four,candidate(65031));
 allowed(x,'F05_3A_MEMBER_VEHICLE_ISSUED');
 const p=(await db.query("SELECT p.*,v.created_by_employee_id,v.source_type,v.model_id as actual_model,cy.ended_at,a.actor_kind,a.actor_member_employee_id,a.actor_system_admin_id,a.before_state,a.after_state FROM public.f05_3a_member_publications p JOIN public.vehicles v USING(vehicle_id) JOIN public.vehicle_listing_cycles cy USING(listing_cycle_id) JOIN public.f05_3a_member_trust_audit a ON a.publication_id=p.publication_id AND a.event_kind='MEMBER_PUBLISH' WHERE p.vehicle_id=65031")).rows[0];
 assert.equal(Number(p.member_employee_id),2);assert.equal(Number(p.created_by_employee_id),2);
 assert.equal(Number(p.license_id),first);assert.equal(p.source_type,'four_s');
 assert.equal(Number(p.model_id),97003);assert.equal(Number(p.actual_model),97003);
 assert.equal(p.city,'Suzhou');assert.equal(Number(p.mileage_km),16000);
 assert.equal(p.actor_kind,'FOUR_S_MEMBER');assert.equal(Number(p.actor_member_employee_id),2);
 assert.equal(p.actor_system_admin_id,null);assert.equal(p.before_state.vehicleExists,false);
});
test('H-A06 only account itself minimal detail; second independently authenticated four_s, staff, Admin and old vehicles denied',async()=>{
 allowed(await view(four,65031),'F05_3A_MEMBER_MINIMAL_VEHICLE');
 for(const tok of [other,staff,admin,'']){
  assert.equal((await view(tok,65031)).allowed,false);
 }
 for(const id of [49004,49006,49002]){
  assert.equal((await view(four,id)).allowed,false);
 }
 assert.equal((await readFourSMemberMinimalVehicle(auth,four,{vehicleId:65031,outlet:'export'})).allowed,false);
});
test('H-A07 attempt to replay event, reuse ID, claim uploaded old four_s or collide license must not create owner',async()=>{
 for(const p of [candidate(65031),candidate(49004),candidate(65032,{eventKey:event(65031)})]){
  assert.equal((await publishNewFourSMemberVehicle(auth,four,p)).allowed,false);
 }
 assert.equal((await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-license-second')})).allowed,false);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_3a_member_publications WHERE vehicle_id=65031")).rows[0].n,1);
});
test('H-A08 real Admin revocation CAS closes license AND active Vehicle scope; system auto actor distinct from 4S affected subject',async()=>{
 const x=await revokeMemberCreateLicense(auth,admin,{licenseId:first,version:1,eventKey:event('sysadmin-license-revoke')});
 allowed(x,'F05_3A_LICENSE_REVOKED');
 assert.equal((await view(four,65031)).allowed,false);
 assert.equal((await assessFourSMemberAuthority(auth,four)).allowed,false);
 const audit=(await db.query("SELECT event_kind,actor_kind,actor_member_employee_id,actor_system_admin_id,affected_employee_id,actor_context FROM public.f05_3a_member_trust_audit WHERE license_id=$1 AND event_kind IN('ADMIN_REVOKE','SYSTEM_OBJECT_REVOKE') ORDER BY audit_id",[first])).rows;
 assert.equal(audit.length,2);
 const system=audit.find(x=>x.event_kind==='SYSTEM_OBJECT_REVOKE'),human=audit.find(x=>x.event_kind==='ADMIN_REVOKE');
 assert.equal(system.actor_kind,'SYSTEM');assert.equal(system.actor_member_employee_id,null);
 assert.equal(system.actor_system_admin_id,null);assert.equal(Number(system.affected_employee_id),2);
 assert.equal(system.actor_context.trigger,'f05_3a_invalidation');
 assert.equal(human.actor_kind,'SYSTEM_ADMIN');assert.equal(Number(human.actor_system_admin_id),9);
 assert.equal((await revokeMemberCreateLicense(auth,admin,{licenseId:first,version:1,eventKey:event('repeat-revoke')})).allowed,false);
});
test('H-A09 new independent Admin license, permission deny automatically revokes, allow restoration does NOT resurrect old Vehicle',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-license-third')});
 allowed(g,'F05_3A_LICENSE_GRANTED');second=g.licenseId;
 allowed(await publishNewFourSMemberVehicle(auth,four,candidate(65041)),'F05_3A_MEMBER_VEHICLE_ISSUED');
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=2 AND permission_id=10");
 assert.equal((await view(four,65041)).allowed,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=2 AND permission_id=10");
 assert.equal((await view(four,65041)).allowed,false);
 assert.equal((await assessFourSMemberAuthority(auth,four)).allowed,false);
 const x=(await db.query("SELECT event_kind,actor_kind,actor_member_employee_id FROM public.f05_3a_member_trust_audit WHERE license_id=$1 AND event_kind='SYSTEM_LICENSE_REVOKE'",[second])).rows;
 assert.equal(x.length,1);assert.equal(x[0].actor_kind,'SYSTEM');assert.equal(x[0].actor_member_employee_id,null);
});
test('H-A10 account disabled/restored and employment inactive/active cannot restore old scope',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-license-fourth')});
 allowed(g,'F05_3A_LICENSE_GRANTED');
 allowed(await publishNewFourSMemberVehicle(auth,four,candidate(65051)),'F05_3A_MEMBER_VEHICLE_ISSUED');
 await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE normalized_login_key='four_s_test'");
 assert.equal((await view(four,65051)).allowed,false);
 await db.query("UPDATE public.pc_login_accounts SET credential_state='enabled' WHERE normalized_login_key='four_s_test'");
 assert.equal((await view(four,65051)).allowed,false);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=2");
 assert.equal((await view(four,65051)).allowed,false);
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=2");
 assert.equal((await view(four,65051)).allowed,false);
});
test('H-A11 two independent PG16 sessions prove license revocation is physically blocked before publisher COMMIT',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-concurrency-issue')});
 allowed(g,'F05_3A_LICENSE_GRANTED');
 let signal,release,ownerPid;const locked=new Promise(r=>signal=r),hold=new Promise(r=>release=r);
 const publication=publishNewFourSMemberVehicle(auth,four,candidate(65061),{testCheckpoint:async(label,c)=>{
  assert.equal(label,'after_license_locked');
  ownerPid=Number((await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
  signal();await hold;
 }});
 await locked;
 const contender=await connect();
 try{
  const contenderPid=Number((await contender.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
  assert.notEqual(contenderPid,ownerPid,'two actual independent non-privileged PG16 backends');
  await contender.query('BEGIN');
  await contender.query("SET LOCAL lock_timeout = '250ms'");
  await assert.rejects(
   ()=>contender.query("UPDATE public.f05_3a_member_create_licenses SET revoked_at=transaction_timestamp(),version=version+1 WHERE license_id=$1 AND revoked_at IS NULL",[g.licenseId]),
   e=>e?.code==='55P03'
  ,'governance UPDATE must reach PG16 row lock wait and timeout before publication commits');
 }finally{
  await contender.query('ROLLBACK').catch(()=>{});
  await contender.end();
  release();
 }
 allowed(await publication,'F05_3A_MEMBER_VEHICLE_ISSUED');
 const revocation=await revokeMemberCreateLicense(auth,admin,{licenseId:g.licenseId,version:1,eventKey:event('sysadmin-concurrency-revoke')});
 allowed(revocation,'F05_3A_LICENSE_REVOKED');
 assert.equal((await view(four,65061)).allowed,false);
 const state=(await db.query('SELECT revoked_at IS NOT NULL AS revoked FROM public.f05_3a_member_publications WHERE vehicle_id=65061')).rows[0];
 assert.equal(state.revoked,true,'AFTER governance commit publication is irreversibly revoked');
});
test('H-A12 audit immutable and cannot spoof system-auto as 4S human or system_admin',async()=>{
 const row=(await db.query('SELECT audit_id FROM public.f05_3a_member_trust_audit ORDER BY audit_id LIMIT 1')).rows[0];
 await assert.rejects(()=>db.query("UPDATE public.f05_3a_member_trust_audit SET before_state='{}'::jsonb WHERE audit_id=$1",[row.audit_id]),/F05_3A_AUDIT_IMMUTABLE/);
 await assert.rejects(()=>db.query('DELETE FROM public.f05_3a_member_trust_audit WHERE audit_id=$1',[row.audit_id]),/F05_3A_AUDIT_IMMUTABLE/);
 await assert.rejects(()=>db.query("INSERT INTO public.f05_3a_member_trust_audit(event_key,license_id,event_kind,actor_kind,actor_member_employee_id,affected_employee_id) VALUES($1,$2,'SYSTEM_OBJECT_REVOKE','SYSTEM',2,2)",[event('forged-system-actor'),first]),/check constraint/i);
});

test('H-A13 vehicle source switch or cycle end revokes ONLY this object; same 4S member license and other own cars survive',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-individual-cycle-scope')});
 allowed(g,'F05_3A_LICENSE_GRANTED');
 allowed(await publishNewFourSMemberVehicle(auth,four,candidate(65071)),'F05_3A_MEMBER_VEHICLE_ISSUED');
 allowed(await publishNewFourSMemberVehicle(auth,four,candidate(65081)),'F05_3A_MEMBER_VEHICLE_ISSUED');
 await db.query("UPDATE public.vehicles SET source_type='mingbang' WHERE vehicle_id=65071");
 assert.equal((await view(four,65071)).allowed,false);
 allowed(await view(four,65081),'F05_3A_MEMBER_MINIMAL_VEHICLE');
 assert.equal((await db.query('SELECT revoked_at IS NULL AS active FROM public.f05_3a_member_create_licenses WHERE license_id=$1',[g.licenseId])).rows[0].active,true);
 await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=transaction_timestamp() WHERE listing_cycle_id=66081");
 assert.equal((await view(four,65081)).allowed,false);
 assert.equal((await db.query('SELECT revoked_at IS NULL AS active FROM public.f05_3a_member_create_licenses WHERE license_id=$1',[g.licenseId])).rows[0].active,true);
 const system=(await db.query("SELECT actor_kind,actor_member_employee_id,actor_context->>'cause' as cause FROM public.f05_3a_member_trust_audit WHERE license_id=$1 AND event_kind='SYSTEM_OBJECT_REVOKE'",[g.licenseId])).rows;
 assert.equal(system.length,2);assert.ok(system.every(x=>x.actor_kind==='SYSTEM'&&x.actor_member_employee_id===null));
 assert.deepEqual(system.map(x=>x.cause).sort(),['CYCLE_CHANGED','VEHICLE_CHANGED']);
 allowed(await revokeMemberCreateLicense(auth,admin,{licenseId:g.licenseId,version:1,eventKey:event('sysadmin-close-remaining-license')}),'F05_3A_LICENSE_REVOKED');
});
test('H-A14 two PG16 backends prove in-flight detail FOR SHARE blocks real employee inactive COMMIT',async()=>{
 const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('sysadmin-read-versus-inactive')});
 allowed(g,'F05_3A_LICENSE_GRANTED');
 allowed(await publishNewFourSMemberVehicle(auth,four,candidate(65091)),'F05_3A_MEMBER_VEHICLE_ISSUED');
 let enter,release,readerPid;const reached=new Promise(r=>enter=r),hold=new Promise(r=>release=r);
 const viewFirst=readFourSMemberMinimalVehicle(auth,four,{vehicleId:65091,outlet:'detail'},{
  testCheckpoint:async(label,c)=>{
   assert.equal(label,'owned_object_locked');
   readerPid=Number((await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
   enter();await hold;
  }
 });
 await reached;
 const writer=await connect();
 try{
  assert.notEqual(Number((await writer.query('SELECT pg_backend_pid() AS pid')).rows[0].pid),readerPid);
  await writer.query('BEGIN');
  await writer.query("SET LOCAL lock_timeout = '250ms'");
  await assert.rejects(
   ()=>writer.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=2"),
   e=>e?.code==='55P03'
  ,'inactive SQL must actually wait for the detail transaction row lock');
 }finally{
  await writer.query('ROLLBACK').catch(()=>{});
  await writer.end();
  release();
 }
 allowed(await viewFirst,'F05_3A_MEMBER_MINIMAL_VEHICLE');
 const committed=await connect();
 try{
  await committed.query('BEGIN');
  await committed.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=2");
  await committed.query('COMMIT');
 }catch(e){await committed.query('ROLLBACK').catch(()=>{});throw e}finally{await committed.end()}
 assert.equal((await view(four,65091)).allowed,false,'AFTER separate actual governance COMMIT access is denied');
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=2");
 assert.equal((await view(four,65091)).allowed,false,'rehire never resurrects revoked license');
});

test('H-A15 composite license-member FK and source identity cannot be transferred to another 4S subject',async()=>{
 const mine=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:event('my-bound-license-signed')});
 const theirs=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:8,eventKey:event('other-bound-license-signed')});
 allowed(mine,'F05_3A_LICENSE_GRANTED');allowed(theirs,'F05_3A_LICENSE_GRANTED');
 allowed(await publishNewFourSMemberVehicle(auth,four,candidate(65101)),'F05_3A_MEMBER_VEHICLE_ISSUED');
 assert.equal((await view(other,65101)).allowed,false);
 await assert.rejects(()=>db.query("UPDATE public.f05_3a_member_publications SET member_employee_id=8 WHERE vehicle_id=65101"),/F05_3A_PUBLICATION_PROVENANCE_IMMUTABLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_publications SET license_id=$1 WHERE vehicle_id=65101',[theirs.licenseId]),/F05_3A_PUBLICATION_PROVENANCE_IMMUTABLE/);
 await assert.rejects(()=>db.query('UPDATE public.vehicles SET created_by_employee_id=8 WHERE vehicle_id=65101'),/F05_3A_SIGNED_VEHICLE_CREATOR_IMMUTABLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_create_licenses SET employee_id=8 WHERE license_id=$1',[mine.licenseId]),/F05_3A_LICENSE_PROVENANCE_IMMUTABLE/);
 const fk=(await db.query("SELECT count(*)::int AS n FROM pg_constraint WHERE conrelid='public.f05_3a_member_publications'::regclass AND conname='f05_3a_publication_license_owner_fk' AND contype='f' AND array_length(conkey,1)=2")).rows[0];
 assert.equal(fk.n,1,'PG16 must enforce BOTH license_id and signed employee_id');
 // A mismatched pair on a fresh disposable object is rejected by PG16, not API validation.
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id,formally_published_at,model_id) VALUES(65111,'four_s','available','visible',8,transaction_timestamp(),97003)");
  await db.query('INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(66111,65111,transaction_timestamp())');
  await assert.rejects(()=>db.query("INSERT INTO public.f05_3a_member_publications(vehicle_id,listing_cycle_id,license_id,member_employee_id,trusted_event_key,brand_id,series_id,model_id,model_year,mileage_km,city) VALUES(65111,66111,$1,8,$2,97001,97002,97003,2026,1000,'Suzhou')",[mine.licenseId,event('forged-license-member-binding')]),e=>e?.code==='23503');
 }finally{await db.query('ROLLBACK')}
 assert.equal((await view(other,65101)).allowed,false);
 allowed(await view(four,65101),'F05_3A_MEMBER_MINIMAL_VEHICLE');
});

test('H-A16 revoked licenses, publications and versions are physically irreversible in PostgreSQL',async()=>{
 const revoked=(await db.query('SELECT revoked_at,version FROM public.f05_3a_member_create_licenses WHERE license_id=$1',[first])).rows[0];
 assert.notEqual(revoked.revoked_at,null);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_create_licenses SET revoked_at=NULL,version=version+1 WHERE license_id=$1',[first]),/F05_3A_LICENSE_REVOCATION_IRREVERSIBLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_create_licenses SET version=1 WHERE license_id=$1',[first]),/F05_3A_LICENSE_REVOCATION_IRREVERSIBLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_publications SET revoked_at=NULL,version=version+1 WHERE vehicle_id=65031'),/F05_3A_PUBLICATION_REVOCATION_IRREVERSIBLE/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3a_member_publications SET version=1 WHERE vehicle_id=65031'),/F05_3A_PUBLICATION_REVOCATION_IRREVERSIBLE/);
 assert.equal((await view(four,65031)).allowed,false);
 assert.equal((await view(other,65031)).allowed,false);
});
