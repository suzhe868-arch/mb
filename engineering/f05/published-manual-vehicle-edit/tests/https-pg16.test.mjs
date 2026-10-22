// Real non-superuser PostgreSQL16 + loopback HTTPS: Issue216 existing Vehicle staged edit.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createPublishedEditService} from '../service.mjs';
import {publishAndIssueFromCurrentTransaction} from '../../vehicle-stewardship-physical-scope/service.mjs';
import {grantMemberCreateLicense,publishNewFourSMemberVehicle,revokeMemberCreateLicense} from '../../four-s-member-trust-scope/source-gate.mjs';
import {start,login,BASE} from './harness.mjs';
const fourS=process.env.F05_EDIT_TEST_SOURCE==='four_s';
if(!['four_s','mingbang'].includes(process.env.F05_EDIT_TEST_SOURCE))throw Error('F05_EDIT_TEST_SOURCE_REQUIRED');
const vehicleId=fourS?72521:72511,cycleId=vehicleId+1000;
const secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48986'});
let app,actor,other,admin,license;
const path=BASE+'/'+vehicleId;
const req=(suffix='',options={})=>app.request(path+suffix,{token:actor,...options});
const stage=(patch,expectedStageVersion,expectedCurrentVersion=1)=>req('/stage',{method:'PUT',body:{patch,expectedStageVersion,expectedCurrentVersion}});
const submit=(stageVersion,currentVersion,key='issue216-commit-'+randomUUID())=>
 req('/commit',{method:'POST',body:{expectedStageVersion:stageVersion,expectedCurrentVersion:currentVersion,requestKey:key}});
const read=()=>req();
async function count(table){return Number((await db.query('SELECT count(*)::integer n FROM '+table+' WHERE vehicle_id=$1',[vehicleId])).rows[0].n)}
test.before(async()=>{
 await verify(db);
 actor=await login(auth,fourS?'four_s_test':'employee_test',fourS?'SyntheticFourS_123456':'SyntheticF04_3_CurrentProof_2026');
 other=await login(auth,fourS?'other_four_s_test':'limit_test',fourS?'SyntheticOtherFourS_123456':'SyntheticLimit_1234567');
 admin=await login(auth,'admin_test','SyntheticAdmin_1234567');
 if(fourS){
  const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:'issue216-admin-grant-'+randomUUID()});
  assert.equal(g.allowed,true,JSON.stringify(g));license=g.licenseId;
  const r=await publishNewFourSMemberVehicle(auth,actor,{
   vehicleId,listingCycleId:cycleId,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,
   mileageKm:16000,city:'Suzhou',eventKey:'issue216-four-s-publish-'+randomUUID(),sourceKind:'four_s'
  });
  assert.equal(r.allowed,true,JSON.stringify(r));
 }else{
  const r=await publishAndIssueFromCurrentTransaction(auth,actor,{
   vehicleId,listingCycleId:cycleId,teamId:901,sourceKind:'mingbang',eventKey:'issue216-mingbang-publish-'+randomUUID()
  },{onPublishInTransaction:async(c)=>{await c.query('UPDATE public.vehicles SET model_id=97003,vin=$1 WHERE vehicle_id=$2',['ISSUE216-INITIAL-VIN',vehicleId])}});
  assert.equal(r.allowed,true,JSON.stringify(r));
 }
 app=await start(createPublishedEditService({auth}));
});
test.after(async()=>{if(app)await app.close();await auth.close();await db.end();secret.fill(0)});
test('E01 genuine trusted publication exists, live owner can read; wrong account hard deny',async()=>{
 const x=await read();
 assert.equal(x.status,200,JSON.stringify(x.body));assert.equal(x.body.code,'EDIT_DETAIL');
 assert.equal(x.body.currentVersion,1);assert.equal(x.body.projection,'CI_ONLY_PROJECTION');
 assert.equal(x.body.effective.modelId,97003);
 assert.equal('internalWholesalePriceCents' in x.body.effective,!fourS);
 const outsider=await app.request(path,{token:other});
 assert.equal(outsider.status,403,JSON.stringify(outsider.body));
});
test('E02 staged edits survive repeat HTTPS sessions without changing current Vehicle/cycle',async()=>{
 const before=await db.query('SELECT model_id,vin FROM public.vehicles WHERE vehicle_id=$1',[vehicleId]);
 const x=await stage({mileageKm:18001,city:'Shanghai',customerListPriceCents:8900000},undefined,1);
 assert.equal(x.status,200,JSON.stringify(x.body));assert.equal(x.body.stageVersion,1);
 const next=await read();assert.equal(next.body.currentVersion,1);
 assert.equal(next.body.effective.customerListPriceCents,null);
 assert.equal(next.body.draft.preview.customerListPriceCents,8900000);
 assert.equal(next.body.draft.patch.mileageKm,18001);
 assert.deepEqual((await db.query('SELECT model_id,vin FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows,before.rows);
 assert.equal(await count('f05_published_edit_test.edit_audit'),0);
});
test('E03 CAS edit staging only one sequential version and old writer gets 409',async()=>{
 const changed=await stage({description:'original author staged description'},1,1);
 assert.equal(changed.status,200,JSON.stringify(changed.body));assert.equal(changed.body.stageVersion,2);
 const stale=await stage({description:'stale lost edit'},1,1);
 assert.equal(stale.status,409);assert.equal(stale.body.code,'EDIT_DRAFT_VERSION_CONFLICT');
 assert.equal((await read()).body.draft.patch.description,'original author staged description');
});
test('E04 no internal permission read/write leaks; 4S hard deny internal',async()=>{
 if(fourS){
  assert.equal('internalWholesalePriceCents' in (await read()).body.effective,false);
  const denied=await stage({internalWholesalePriceCents:7000000},2,1);
  assert.equal(denied.status,403);assert.equal(denied.body.code,'INTERNAL_PRICE_FORBIDDEN');
  assert.equal(JSON.stringify(denied.body).includes('7000000'),false);
 }else{
  const granted=await stage({internalWholesalePriceCents:6800000},2,1);
  assert.equal(granted.status,200,JSON.stringify(granted.body));
  assert.equal(granted.body.preview.internalWholesalePriceCents,6800000);
  // The F05-2 frozen governance trigger revokes stewardship when ANY
  // permission override changes. Permission revoke must therefore be tested
  // LAST, not repaired by re-allowing (which cannot resurrect stewardship).

 }
});
test('E05 real PG16 rollback keeps old facts, draft and audit unchanged',async()=>{
 const draft=(await read()).body.draft;const previousAudit=await count('f05_published_edit_test.edit_audit');
 process.env.F05_EDIT_INJECT_COMMIT_ROLLBACK='true';
 try{
  const r=await submit(draft.stageVersion,1);
  assert.equal(r.status,409,JSON.stringify(r.body));assert.equal(r.body.code,'EDIT_INJECTED_ROLLBACK');
 }finally{delete process.env.F05_EDIT_INJECT_COMMIT_ROLLBACK}
 assert.equal(await count('f05_published_edit_test.edit_audit'),previousAudit);
 assert.equal((await read()).body.currentVersion,1);
 assert.equal((await read()).body.draft.stageVersion,draft.stageVersion);
 const output=execFileSync(process.execPath,[fileURLToPath(new URL('./recovery-probe.mjs',import.meta.url)),String(vehicleId),String(draft.stageVersion)],
  {encoding:'utf8',timeout:15000});
 assert.match(output,/ISSUE216_REAL_INDEPENDENT_PROCESS_RECOVERY_PASS/);
});
test('E06 current legitimate commit is atomic, requestKey idempotent; only one immutable event/outbox',async()=>{
 const st=(await read()).body.draft;
 const key='issue216-idempotency-'+randomUUID();
 const r=await submit(st.stageVersion,1,key);
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.code,'EDIT_APPLIED');
 assert.equal(r.body.currentVersion,2);assert.equal(r.body.effective.customerListPriceCents,8900000);
 assert.equal((await read()).body.draft,null);
 assert.equal(await count('f05_published_edit_test.edit_audit'),1);
 const impact=(await db.query('SELECT status FROM f05_published_edit_test.impact_outbox WHERE audit_id=(SELECT audit_id FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1)',[vehicleId])).rows[0];
 assert.equal(impact.status,'NOT_CONNECTED_SOURCE_GAP');
 const again=await submit(st.stageVersion,1,key);
 assert.equal(again.status,200,JSON.stringify(again.body));assert.equal(again.body.code,'EDIT_ALREADY_APPLIED');
 assert.equal(await count('f05_published_edit_test.edit_audit'),1);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vehicleId])).rows[0].n,1);
});
test('E07 physical independent PG16 blocker serializes racing stage attempts; exactly one CAS wins',async()=>{
 const holder=await connect();
 try{
  await holder.query('BEGIN');
  await holder.query('SELECT pg_advisory_xact_lock(20261011,$1::integer)',[fourS?2:1]);
  const x=stage({city:'Suzhou',mileageKm:18200},undefined,2);
  const y=stage({city:'Hangzhou',mileageKm:18300},undefined,2);
  // Verify actual PG lock contention rather than calling a Promise-delay a test.
  let blocked=false;
  for(let i=0;i<150;i++){
   const q=(await db.query("SELECT count(*)::int n FROM pg_stat_activity a WHERE a.datname=current_database() AND a.wait_event_type='Lock' AND a.pid<>pg_backend_pid() AND cardinality(pg_blocking_pids(a.pid))>0")).rows[0].n;
   if(q>0){blocked=true;break}
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  assert.equal(blocked,true,'independent real PostgreSQL backend must physically block');
  await holder.query('COMMIT');
  const responses=await Promise.all([x,y]);
  assert.deepEqual(responses.map(v=>v.status).sort(),[200,409],JSON.stringify(responses));
  assert.equal((await read()).body.draft.stageVersion,1);
 }finally{await holder.query('ROLLBACK').catch(()=>{});await holder.end()}
});
test('E08 cancel removes only staged changes; no second public update',async()=>{
 const draft=(await read()).body.draft;
 const r=await req('/stage',{method:'DELETE',body:{expectedStageVersion:draft.stageVersion}});
 assert.equal(r.status,200);assert.equal((await read()).body.draft,null);
 assert.equal((await read()).body.currentVersion,2);
 assert.equal(await count('f05_published_edit_test.edit_audit'),1);
});
test('E08A only exact allowlisted ordinary fields can stage; invalid current model fails without modifying published data',async()=>{
 const forbidden=await stage({sourceType:'wholesale'},undefined,2);
 assert.equal(forbidden.status,400);assert.equal(forbidden.body.code,'EDIT_FIELD_FORBIDDEN');
 const entered=await stage({modelId:999999},undefined,2);
 assert.equal(entered.status,200,JSON.stringify(entered.body));
 const prior=await count('f05_published_edit_test.edit_audit');
 const failed=await submit(1,2);
 assert.equal(failed.status,422,JSON.stringify(failed.body));assert.equal(failed.body.code,'MODEL_MISSING');
 assert.equal(await count('f05_published_edit_test.edit_audit'),prior);
 assert.equal((await read()).body.draft.patch.modelId,999999);
 const cleared=await req('/stage',{method:'DELETE',body:{expectedStageVersion:1}});
 assert.equal(cleared.status,200);
});
test('E08B trusted opposite-source published VIN conflicts with edit; old effective value and edit draft survive',async()=>{
 const vin='ISSUE216-OPPOSITE-SOURCE-VIN';
 if(fourS){
  const staff=await login(auth,'employee_test','SyntheticF04_3_CurrentProof_2026');
  const r=await publishAndIssueFromCurrentTransaction(auth,staff,{
   vehicleId:72631,listingCycleId:73631,teamId:901,sourceKind:'mingbang',eventKey:'issue216-cross-source-mingbang-'+randomUUID()
  },{onPublishInTransaction:async(c)=>{await c.query('UPDATE public.vehicles SET model_id=$1,vin=$2 WHERE vehicle_id=$3',[97003,vin,72631])}});
  assert.equal(r.allowed,true,JSON.stringify(r));
 }else{
  const dealer=await login(auth,'four_s_test','SyntheticFourS_123456');
  const grant=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:'issue216-cross-source-license-'+randomUUID()});
  assert.equal(grant.allowed,true,JSON.stringify(grant));
  const r=await publishNewFourSMemberVehicle(auth,dealer,{
   vehicleId:72641,listingCycleId:73641,brandId:97001,seriesId:97002,modelId:97003,
   modelYear:2026,mileageKm:22000,city:'Suzhou',sourceKind:'four_s',
   eventKey:'issue216-cross-source-four-s-'+randomUUID()
  },{onPublishInTransaction:async(c)=>{await c.query('UPDATE public.vehicles SET vin=$1 WHERE vehicle_id=$2',[vin,72641])}});
  assert.equal(r.allowed,true,JSON.stringify(r));
 }
 const before=(await db.query('SELECT vin FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0].vin;
 const entered=await stage({vin},undefined,2);assert.equal(entered.status,200,JSON.stringify(entered.body));
 const failed=await submit(1,2);
 assert.equal(failed.status,409,JSON.stringify(failed.body));
 assert.equal(failed.body.code,'VIN_DUPLICATE');
 assert.equal((await db.query('SELECT vin FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0].vin,before);
 assert.equal((await read()).body.draft.patch.vin,vin);
 const cancel=await req('/stage',{method:'DELETE',body:{expectedStageVersion:1}});
 assert.equal(cancel.status,200);
});
test('E09 4S current Admin license revoke immediately removes old editing authority',async()=>{
 if(!fourS)return;
 const x=await stage({city:'Shenzhen'},undefined,2);assert.equal(x.status,200);
 const rev=await revokeMemberCreateLicense(auth,admin,{licenseId:license,version:1,eventKey:'issue216-admin-revoke-'+randomUUID()});
 assert.equal(rev.allowed,true,JSON.stringify(rev));
 const deny=await submit(1,2);assert.equal(deny.status,403);
 assert.equal(await count('f05_published_edit_test.edit_audit'),1);
});

test('E10 Mingbang current permission removal invalidates ownership and blocks all fresh operations',async()=>{
 if(fourS)return;
 const x=await stage({city:'Nanjing'},undefined,2);assert.equal(x.status,200,JSON.stringify(x.body));
 const perm=(await db.query("SELECT permission_id FROM public.permissions WHERE permission_code='internal.price.view'")).rows[0];
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=$1",[perm.permission_id]);
 const denied=await submit(1,2);
 assert.equal(denied.status,403,JSON.stringify(denied.body));
 assert.equal(JSON.stringify(denied.body).includes('internalWholesalePriceCents'),false);
 assert.equal(await count('f05_published_edit_test.edit_audit'),1);
 const persisted=(await db.query('SELECT patch FROM f05_published_edit_test.staged_changes WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.equal(persisted.patch.city,'Nanjing');
});
