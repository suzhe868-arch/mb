// Dedicated real-PG16 transaction interleavings; never substitutes sleeps for a lock proof.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {grantMemberCreateLicense,revokeMemberCreateLicense} from '../../four-s-member-trust-scope/source-gate.mjs';
import {createManualVehicleDraftService} from '../service.mjs';
import {startHarness,login,BASE,ORIGIN} from './https-harness.mjs';
const secret=randomBytes(32);
const db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:ORIGIN});
let app,staff,four,admin;
const full=(kind,vin,description)=>({sourceType:kind,brandId:kind==='four_s'?97001:98001,
 seriesId:kind==='four_s'?97002:98002,modelId:kind==='four_s'?97003:98003,
 modelYear:2026,mileageKm:11500,city:'Suzhou',vin,description});
const save=async(token,payload)=>app.request(BASE+'/auto-save',{method:'POST',token,body:{payload}});
const publish=async(token,id)=>app.request(BASE+'/'+id+'/publish',{method:'POST',token,body:{expectedVersion:1}});
const n=async(sql,values=[])=>Number((await db.query(sql,values)).rows[0].n);
async function blocked(pattern,min=1){
 // Probe PostgreSQL's physical wait-for graph, never a mocked promise or time guess.
 // node-postgres session setup may be waiting BEFORE the expected SQL statement,
 // hence match the holder backend PID rather than the current query text.
 const pid=Number((await db.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
 for(let i=0;i<105;i++){
  const waiting=await db.query("SELECT a.pid,a.wait_event_type,a.wait_event,left(a.query,170) AS query,pg_blocking_pids(a.pid) AS blockers FROM pg_stat_activity a WHERE a.datname=current_database() AND a.usename=current_user AND a.pid<>pg_backend_pid() AND a.wait_event_type='Lock'");
  const direct=waiting.rows.filter(a=>a.blockers.map(Number).includes(pid));
  if(direct.length>=min)return;
  await new Promise(resolve=>setTimeout(resolve,25)); // sample real PG graph only
 }
 const dump=await db.query("SELECT pid,state,wait_event_type,wait_event,left(query,120) AS query,pg_blocking_pids(pid) AS blockers FROM pg_stat_activity WHERE datname=current_database() AND usename=current_user AND pid<>pg_backend_pid()");
 console.error('F05_REAL_PG16_LOCK_WAIT_NOT_OBSERVED',JSON.stringify({pattern,min,holderPid:pid,sessions:dump.rows}));
 assert.fail('Expected '+min+' PostgreSQL sessions physically waiting on holder backend '+pid+' for '+pattern);
}
async function releaseAfterObservedLock(starter,pattern,min=1){
 await db.query('BEGIN');
 try{
  const request=starter();
  await blocked(pattern,min);
  await db.query('COMMIT');
  return request;
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
}
async function draftStatus(token,id){
 const result=await app.request(BASE+'/'+id,{token});
 assert.equal(result.status,200,JSON.stringify(result.body));
 return result.body.draft;
}
async function ensureFourSLicense(){
 const old=(await db.query('SELECT license_id,version FROM public.f05_3a_member_create_licenses WHERE employee_id=2 AND revoked_at IS NULL')).rows;
 if(old.length===1)return {licenseId:Number(old[0].license_id),version:Number(old[0].version)};
 const created=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:'manual-draft-race-grant-'+randomBytes(12).toString('hex')});
 assert.equal(created.allowed,true,JSON.stringify(created));
 return {licenseId:created.licenseId,version:1};
}
test.before(async()=>{
 await verify(db);
 staff=await login(auth,'employee_test','SyntheticF04_3_CurrentProof_2026','f05-manual-race-staff');
 four=await login(auth,'four_s_test','SyntheticFourS_123456','f05-manual-race-four-s');
 admin=await login(auth,'admin_test','SyntheticAdmin_1234567','f05-manual-race-admin');
 await ensureFourSLicense();
 app=await startHarness(createManualVehicleDraftService({auth}));
});
test.after(async()=>{
 if(app)await app.close();
 await auth.close();await db.end();secret.fill(0);
});
test('R01: two PG physical sessions compete for one draft CAS version',async()=>{
 const made=await save(staff,{sourceType:'mingbang',description:'CAS initial'});
 assert.equal(made.status,201);
 await db.query('BEGIN');
 let requests;
 try{
  await db.query('SELECT draft_id FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1 FOR UPDATE',[made.body.draftId]);
  requests=[
   app.request(BASE+'/'+made.body.draftId,{method:'PUT',token:staff,body:{expectedVersion:1,payload:{description:'CAS writer A'}}}),
   app.request(BASE+'/'+made.body.draftId,{method:'PUT',token:staff,body:{expectedVersion:1,payload:{description:'CAS writer B'}}})
  ];
  await blocked('%f05_manual_vehicle_test.drafts%',1);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 const result=await Promise.all(requests);
 assert.deepEqual(result.map(x=>x.status).sort((a,b)=>a-b),[200,409],JSON.stringify(result));
 const last=await draftStatus(staff,made.body.draftId);
 assert.equal(last.version,2);
 assert.ok(['CAS writer A','CAS writer B'].includes(last.payload.description));
 console.log('R01_REAL_PG16_TWO_SESSION_CAS_LOCK_PASS');
});
test('R02: same draft two real HTTP publications race under PG row lock',async()=>{
 const made=await save(staff,full('mingbang','MB-RACE-SAME-DRAFT-20261022','single publication'));
 assert.equal(made.status,201);
 await db.query('BEGIN');
 let requests;
 try{
  await db.query('SELECT draft_id FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1 FOR UPDATE',[made.body.draftId]);
  requests=[publish(staff,made.body.draftId),publish(staff,made.body.draftId)];
  await blocked('%f05_manual_vehicle_test.drafts%',1); // second request may queue behind first authenticated session
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 const result=await Promise.all(requests);
 assert.ok(result.some(x=>x.status===200&&x.body.code==='VEHICLE_PUBLISHED'),JSON.stringify(result));
 const d=await draftStatus(staff,made.body.draftId);
 assert.equal(d.status,'published');
 assert.equal(await n('SELECT count(*)::integer n FROM public.vehicles WHERE vehicle_id=$1',[d.publishedVehicleId]),1);
 assert.equal(await n('SELECT count(*)::integer n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[d.publishedVehicleId]),1);
 console.log('R02_REAL_PG16_SAME_DRAFT_LOCK_PASS');
});
async function differentDraftSameVin(kindB,vin){
 const a=await save(staff,full('mingbang',vin,'first independent VIN draft'));
 const tokenB=kindB==='four_s'?four:staff;
 const b=await save(tokenB,full(kindB,vin,'second independent VIN draft'));
 assert.equal(a.status,201);assert.equal(b.status,201);
 assert.notEqual(a.body.draftId,b.body.draftId);
 const before=await n("SELECT count(*)::integer n FROM public.vehicles WHERE vin=$1 AND source_type IN ('mingbang','four_s')",[vin]);
 await db.query('BEGIN');
 let requests;
 try{
  await db.query('SELECT pg_advisory_xact_lock(20261023,hashtext($1::text))',[vin]);
  requests=[publish(staff,a.body.draftId),publish(tokenB,b.body.draftId)];
  await blocked('%pg_advisory_xact_lock(20261023%',1);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 const results=await Promise.all(requests);
 assert.deepEqual(results.map(x=>x.status).sort((x,y)=>x-y),[200,409],JSON.stringify(results));
 assert.equal(results.find(x=>x.status===409)?.body.code,'VIN_DUPLICATE',JSON.stringify(results));
 assert.equal(results.find(x=>x.status===409)?.body.preserveDraft,true);
 assert.ok(!results.find(x=>x.status===409)?.body.existingVehicleReference);
 assert.equal(await n("SELECT count(*)::integer n FROM public.vehicles WHERE vin=$1 AND source_type IN ('mingbang','four_s')",[vin]),before+1);
 const statuses=await Promise.all([draftStatus(staff,a.body.draftId),draftStatus(tokenB,b.body.draftId)]);
 assert.deepEqual(statuses.map(x=>x.status).sort(),['draft','published']);
 const rejected=results[0].status===409?0:1;
 assert.equal(statuses[rejected].payload.vin,vin);
 assert.equal(await n("SELECT count(*)::integer n FROM f05_manual_vehicle_test.draft_events WHERE draft_id=$1 AND event_kind='PUBLISHED'",[rejected===0?a.body.draftId:b.body.draftId]),0);
 console.log('REAL_PG16_CROSS_DRAFT_VIN_SERIALIZED_'+kindB);
}
test('R03: independent Mingbang drafts cannot concurrently publish one VIN',async()=>{
 await differentDraftSameVin('mingbang','MB-RACE-MB-MB-VIN-20261022');
});
test('R04: Mingbang and 4S sessions cannot concurrently publish one VIN',async()=>{
 await differentDraftSameVin('four_s','MB-RACE-MB-4S-VIN-20261022');
});
test('R05: committed Mingbang capability revoke overtakes blocked publish',async()=>{
 const made=await save(staff,full('mingbang',null,'capability must recheck after lock'));
 assert.equal(made.status,201);
 await db.query('BEGIN');
 let result;
 try{
  await db.query('SELECT pg_advisory_xact_lock(20261011,1)');
  const change=await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=399");
  assert.equal(change.rowCount,1);
  result=publish(staff,made.body.draftId);
  await blocked('%pg_advisory_xact_lock(20261011%',1);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 try{
  const answer=await result;
  assert.equal(answer.status,403,JSON.stringify(answer));
  assert.equal(answer.body.code,'PUBLICATION_AUTHORITY_DENIED');
  assert.equal(await n("SELECT count(*)::integer n FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1 AND status='draft' AND published_vehicle_id IS NULL",[made.body.draftId]),1);
  assert.equal(await n("SELECT count(*)::integer n FROM public.vehicles WHERE vin IS NULL AND vehicle_id=(SELECT reserved_vehicle_id FROM f05_manual_vehicle_test.drafts WHERE draft_id=$1)",[made.body.draftId]),0);
 }finally{
  await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=399");
 }
 assert.equal((await draftStatus(staff,made.body.draftId)).status,'draft');
 console.log('R05_REAL_PG16_CAPABILITY_REVOKE_BEFORE_PUBLISH_LOCK_PASS');
});
test('R06: 4S live Admin revoke races blocked publication on PG16',async()=>{
 const license=await ensureFourSLicense();
 const made=await save(four,full('four_s',null,'license revoke during publish'));
 assert.equal(made.status,201);
 await db.query('BEGIN');
 let revoke,pending;
 try{
  await db.query('SELECT license_id FROM public.f05_3a_member_create_licenses WHERE license_id=$1 FOR UPDATE',[license.licenseId]);
  revoke=revokeMemberCreateLicense(auth,admin,{licenseId:license.licenseId,version:license.version,
   eventKey:'manual-draft-race-revoke-'+randomBytes(12).toString('hex')});
  await blocked('%f05_3a_member_create_licenses%',1);
  pending=publish(four,made.body.draftId);
  await blocked('%pg_advisory_xact_lock(20261011%',1);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
 const revoked=await revoke,answer=await pending;
 assert.equal(revoked.allowed,true,JSON.stringify(revoked));
 assert.equal(answer.status,403,JSON.stringify(answer));
 assert.equal(answer.body.code,'PUBLICATION_AUTHORITY_DENIED');
 const d=await draftStatus(four,made.body.draftId);
 assert.equal(d.status,'draft');assert.equal(d.payload.description,'license revoke during publish');
 console.log('R06_REAL_PG16_ADMIN_LICENSE_REVOKE_RACE_PASS');
});
test('R07: failed same-TX publication recovers in a distinct Node process',async()=>{
 const made=await save(staff,full('mingbang','MB-RACE-RESTART-VIN-20261022','persist after rollback'));
 assert.equal(made.status,201);
 process.env.F05_MANUAL_INJECT_PUBLISH_ROLLBACK='true';
 let denied;
 try{denied=await publish(staff,made.body.draftId)}
 finally{delete process.env.F05_MANUAL_INJECT_PUBLISH_ROLLBACK}
 assert.equal(denied.status,503);assert.equal(denied.body.code,'INJECTED_PUBLISH_ROLLBACK');
 const probe=fileURLToPath(new URL('./recovery-probe.mjs',import.meta.url));
 const proof=execFileSync(process.execPath,[probe,made.body.draftId],{
  encoding:'utf8',timeout:20000,env:{...process.env,F05_MANUAL_INJECT_PUBLISH_ROLLBACK:'false'}});
 assert.match(proof,/F05_MANUAL_NEW_PROCESS_RECOVERY_PASS/);
 assert.equal((await draftStatus(staff,made.body.draftId)).status,'draft');
 const retried=await publish(staff,made.body.draftId);
 assert.equal(retried.status,200,JSON.stringify(retried));
 const again=await publish(staff,made.body.draftId);
 assert.equal(again.status,200);assert.equal(again.body.vehicleId,retried.body.vehicleId);
 console.log('R07_REAL_NODE_FRESH_PROCESS_AND_PG_ROLLBACK_RECOVERY_PASS');
});
test('R08: frozen public physical seal remains exact after new races',async()=>{
 const proof=await verify(db);
 assert.equal(proof.verified,true);assert.equal(proof.source,'F05_3A_000016');
 assert.equal(proof.publicSchemaUnchanged,true);
 console.log('R08_PUBLIC_SCHEMA_UNMODIFIED_PASS');
});
