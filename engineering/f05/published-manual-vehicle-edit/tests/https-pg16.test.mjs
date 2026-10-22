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
import {createManualVehicleDraftService} from '../../manual-vehicle-draft-publish/service.mjs';
import {startHarness as startAccepted214,BASE as PARENT_BASE} from '../../manual-vehicle-draft-publish/tests/https-harness.mjs';
const fourS=process.env.F05_EDIT_TEST_SOURCE==='four_s';
if(!['four_s','mingbang'].includes(process.env.F05_EDIT_TEST_SOURCE))throw Error('F05_EDIT_TEST_SOURCE_REQUIRED');
let vehicleId,cycleId;
const secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:`https://127.0.0.1:${Number(process.env.F05_EDIT_HTTP_PORT || 48986)}`});
let app,parentApp,actor,other,admin,license,path,managerCar,managerToken;
const hooks={};
async function confirmBlocked(){
 for(let n=0;n<150;n++){
  const q=await db.query("SELECT count(*)::integer n FROM pg_stat_activity a WHERE a.datname=current_database() AND a.wait_event_type='Lock' AND a.pid<>pg_backend_pid() AND cardinality(pg_blocking_pids(a.pid))>0");
  if(q.rows[0].n>0)return;
  await new Promise(resolve=>setTimeout(resolve,20));
 }
 throw Error('ISSUE216_PHYSICAL_BLOCKING_PID_NOT_OBSERVED');
}
const parentRef='refs/heads/feat/f05-manual-vehicle-draft-publish-pg16-01';
async function accepted214(call){const ref=process.env.GITHUB_REF;process.env.GITHUB_REF=parentRef;try{return await call()}finally{process.env.GITHUB_REF=ref}}
const req=(suffix='',options={})=>app.request(path+suffix,{token:actor,...options});
const stage=(patch,expectedStageVersion,expectedCurrentVersion=1)=>req('/stage',{method:'PUT',body:{patch,expectedStageVersion,expectedCurrentVersion}});
const submit=(stageVersion,currentVersion,key='issue216-commit-'+randomUUID())=>
 req('/commit',{method:'POST',body:{expectedStageVersion:stageVersion,expectedCurrentVersion:currentVersion,requestKey:key}});
const read=()=>req();
// Signed F03 fixture history in the same physical DB; DOES NOT claim F06
// Lock/Transaction signed source nor same-Vehicle F06 in-flight snapshot proof.
async function olderDomainSeal(){
 const tables=[['public.locks','lock_id'],['public.transactions','transaction_id'],
  ['public.deposit_receipts','deposit_id'],['public.audit_events','audit_id']];
 const seal=[];
 for(const [table,id] of tables){
  const row=(await db.query("SELECT count(*)::int n,md5(COALESCE(jsonb_agg(to_jsonb(x) ORDER BY "+id+"),'[]'::jsonb)::text) AS hash FROM "+table+" x")).rows[0];
  seal.push({table,count:row.n,sha:row.hash});
 }
 if(seal.slice(0,3).some(x=>x.count<1))throw Error('F03_SIGNED_FIXTURE_FINANCIAL_FACTS_MISSING');
 return seal;
}
async function count(table){return Number((await db.query('SELECT count(*)::integer n FROM '+table+' WHERE vehicle_id=$1',[vehicleId])).rows[0].n)}
test.before(async()=>{
 await verify(db);
 actor=await login(auth,fourS?'four_s_test':'employee_test',fourS?'SyntheticFourS_123456':'SyntheticF04_3_CurrentProof_2026');
 other=await login(auth,fourS?'other_four_s_test':'limit_test',fourS?'SyntheticOtherFourS_123456':'SyntheticLimit_1234567');
 admin=await login(auth,'admin_test','SyntheticAdmin_1234567');
 if(fourS){
  const g=await grantMemberCreateLicense(auth,admin,{targetEmployeeId:2,eventKey:'issue216-admin-grant-'+randomUUID()});
  assert.equal(g.allowed,true,JSON.stringify(g));license=g.licenseId;
 }
 // Same real non-superuser PG16: original A-accepted #214 HTTPS draft -> publish.
 // Compatibility REF is scoped exclusively to #214 source calls, and the
 // provenance is verified against physical draft/facts/audit after publication.
 const parentService=createManualVehicleDraftService({auth,env:{...process.env,GITHUB_REF:parentRef}});
 parentApp=await accepted214(()=>startAccepted214(parentService));
 const payload={sourceType:fourS?'four_s':'mingbang',brandId:97001,seriesId:97002,
  modelId:97003,modelYear:2026,mileageKm:16000,city:'Suzhou',
  vin:'ISSUE216-ORIGINAL-'+(fourS?'FOURS':'MINGBANG'),
  description:'Accepted 214 original description',conditionTags:['original-verified-condition'],
  retailPriceCents:8300000,...(!fourS?{wholesalePriceCents:6300000}:{})};
 const created=await accepted214(()=>parentApp.request(PARENT_BASE+'/auto-save',{method:'POST',token:actor,body:{payload}}));
 assert.equal(created.status,201,JSON.stringify(created.body));
 const issued=await accepted214(()=>parentApp.request(PARENT_BASE+'/'+created.body.draftId+'/publish',
  {method:'POST',token:actor,body:{expectedVersion:1}}));
 assert.equal(issued.status,200,JSON.stringify(issued.body));assert.equal(issued.body.code,'VEHICLE_PUBLISHED');
 vehicleId=Number(issued.body.vehicleId);cycleId=Number(issued.body.listingCycleId);
 assert.ok(vehicleId>=59000&&cycleId>=59000);path=BASE+'/'+vehicleId;
 const sourceRow=(await db.query(
  "SELECT d.draft_payload,f.mileage_km,f.city FROM f05_manual_vehicle_test.drafts d "+
  "JOIN f05_manual_vehicle_test.published_vehicle_facts f ON f.vehicle_id=d.published_vehicle_id "+
  "WHERE f.vehicle_id=$1 AND d.published_listing_cycle_id=$2",[vehicleId,cycleId])).rows[0];
 assert.equal(sourceRow.draft_payload.description,payload.description);
 assert.deepEqual(sourceRow.draft_payload.conditionTags,payload.conditionTags);
 assert.equal(Number(sourceRow.mileage_km),16000);assert.equal(sourceRow.city,'Suzhou');

 app=await start(createPublishedEditService({auth,hooks}));
});
test.after(async()=>{if(app)await app.close();if(parentApp)await parentApp.close();await auth.close();await db.end();secret.fill(0)});
test('E01 genuine trusted publication exists, live owner can read; wrong account hard deny',async()=>{
 const x=await read();
 assert.equal(x.status,200,JSON.stringify(x.body));assert.equal(x.body.code,'EDIT_DETAIL');
 assert.equal(x.body.currentVersion,1);assert.equal(x.body.projection,'CI_ONLY_PROJECTION');
 assert.equal(x.body.effective.modelId,97003);
 assert.equal(x.body.effective.mileageKm,16000);assert.equal(x.body.effective.city,'Suzhou');
 assert.equal(x.body.effective.description,'Accepted 214 original description');
 assert.deepEqual(x.body.effective.conditionTags,['original-verified-condition']);
 assert.equal(x.body.effective.customerListPriceCents,8300000);
 assert.equal('internalWholesalePriceCents' in x.body.effective,!fourS);
 const outsider=await app.request(path,{token:other});
 assert.equal(outsider.status,403,JSON.stringify(outsider.body));
});
test('E02 staged edits survive repeat HTTPS sessions without changing current Vehicle/cycle',async()=>{
 const before=await db.query('SELECT model_id,vin FROM public.vehicles WHERE vehicle_id=$1',[vehicleId]);
 const x=await stage({mileageKm:18001,city:'Shanghai',customerListPriceCents:8900000},undefined,1);
 assert.equal(x.status,200,JSON.stringify(x.body));assert.equal(x.body.stageVersion,1);
 const next=await read();assert.equal(next.body.currentVersion,1);
 assert.equal(next.body.effective.customerListPriceCents,8300000);
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
 const priorHistoric=await olderDomainSeal();
 const st=(await read()).body.draft;
 const key='issue216-idempotency-'+randomUUID();
 const r=await submit(st.stageVersion,1,key);
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.code,'EDIT_APPLIED');
 assert.equal(r.body.currentVersion,2);assert.equal(r.body.effective.customerListPriceCents,8900000);
 assert.equal((await read()).body.draft,null);
 assert.equal((await read()).body.effective.description,'Accepted 214 original description');
 assert.deepEqual((await read()).body.effective.conditionTags,['original-verified-condition']);
 assert.equal(await count('f05_published_edit_test.edit_audit'),1);
 assert.deepEqual(await olderDomainSeal(),priorHistoric,'F03 real preexisting Lock/Transaction/deposit/public audit rows unchanged');
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

test('E09 physical 4S Admin revoke races with in-flight COMMIT: commit-before-governance, then hard deny',async()=>{
 if(!fourS)return;
 const staged=await stage({city:'Shenzhen'},undefined,2);assert.equal(staged.status,200,JSON.stringify(staged.body));
 let signal,release;
 const reached=new Promise(r=>signal=r),hold=new Promise(r=>release=r);
 hooks.beforeCommit=async(ctx,c)=>{
  assert.equal(ctx.vehicleId,vehicleId);
  const ownerPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  const witness=Number((await db.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  assert.notEqual(ownerPid,witness);
  signal();await hold;
 };
 let pending;
 try{
  pending=submit(1,2);
  await reached;
  const governance=revokeMemberCreateLicense(auth,admin,{licenseId:license,version:1,eventKey:'issue216-admin-race-revoke-'+randomUUID()});
  await confirmBlocked();
  release();
  const result=await pending;
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.code,'EDIT_APPLIED');
  const rev=await governance;
  assert.equal(rev.allowed,true,JSON.stringify(rev));
 }finally{release?.();delete hooks.beforeCommit}
 const denied=await submit(1,2);assert.equal(denied.status,403,JSON.stringify(denied.body));
 assert.equal(await count('f05_published_edit_test.edit_audit'),2);
});
test('E10 real Mingbang permission governance races in-flight COMMIT, then current Vehicle receipt revokes',async()=>{
 if(fourS)return;
 const staged=await stage({city:'Nanjing'},undefined,2);
 assert.equal(staged.status,200,JSON.stringify(staged.body));
 let signal,release;
 const reached=new Promise(r=>signal=r),hold=new Promise(r=>release=r);
 hooks.beforeCommit=async(ctx,c)=>{assert.equal(ctx.vehicleId,vehicleId);signal();await hold};
 try{
  const pending=submit(1,2);
  await reached;
  const perm=(await db.query("SELECT permission_id FROM public.permissions WHERE permission_code='internal.price.view'")).rows[0];
  const revoke=db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=$1",[perm.permission_id]);
  // Dedicated probe must not share the connection occupied by the UPDATE.
  const probe=await connect();
  try{
   let blocked=false;
   for(let i=0;i<100;i++){
    const x=(await probe.query("SELECT count(*)::integer n FROM pg_stat_activity a WHERE a.datname=current_database() AND a.wait_event_type='Lock' AND a.pid<>pg_backend_pid() AND cardinality(pg_blocking_pids(a.pid))>0")).rows[0].n;
    if(x>0){blocked=true;break}
    await new Promise(r=>setTimeout(r,20));
   }
   assert.equal(blocked,true);
  }finally{await probe.end()}
  release();
  const applied=await pending;assert.equal(applied.status,200,JSON.stringify(applied.body));
  await revoke;
 }finally{release?.();delete hooks.beforeCommit}
 const denied=await read();assert.equal(denied.status,403,JSON.stringify(denied.body));
 assert.equal(await count('f05_published_edit_test.edit_audit'),2);
 assert.equal((await db.query('SELECT count(*)::integer n FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1 AND revoked_at IS NULL',[vehicleId])).rows[0].n,0);
});

test('E11 real current Mingbang manager vehicle.manage=true but internal.price.view=false edits retail price only',async()=>{
 if(fourS)return;
 const manager=await login(auth,'race_test','SyntheticRace_1234567');
 managerToken=manager;
 const recorded=await accepted214(()=>parentApp.request(PARENT_BASE+'/auto-save',{method:'POST',token:manager,
  body:{payload:{sourceType:'mingbang',brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,
   mileageKm:22000,city:'Suzhou',vin:'ISSUE216-MANAGER-PRICE-INDEPENDENT',
   description:'trusted manager original',conditionTags:['retained'],
   retailPriceCents:8200000,wholesalePriceCents:6600000}}}));
 assert.equal(recorded.status,201,JSON.stringify(recorded.body));
 const publish=await accepted214(()=>parentApp.request(PARENT_BASE+'/'+recorded.body.draftId+'/publish',
  {method:'POST',token:manager,body:{expectedVersion:1}}));
 assert.equal(publish.status,200,JSON.stringify(publish.body));
 const mid=Number(publish.body.vehicleId),url=BASE+'/'+mid;
 managerCar=mid;
 const scope=(await db.query("SELECT count(*)::integer n FROM public.vehicle_current_responsibilities "+
  "WHERE vehicle_id=$1 AND responsible_employee_id=6 AND revoked_at IS NULL",[mid])).rows[0].n;
 assert.equal(scope,1);
 const managed=await app.request(url,{token:manager});assert.equal(managed.status,200,JSON.stringify(managed.body));
 assert.equal(managed.body.effective.customerListPriceCents,8200000);
 assert.equal('internalWholesalePriceCents' in managed.body.effective,false,'sensitive original wholesale value MUST NOT leak');
 const banned=await app.request(url+'/stage',{method:'PUT',token:manager,
  body:{expectedCurrentVersion:1,patch:{internalWholesalePriceCents:1}}});
 assert.equal(banned.status,403);assert.equal(banned.body.code,'INTERNAL_PRICE_FORBIDDEN');
 assert.equal(JSON.stringify(banned.body).includes('6600000'),false);
 const staged=await app.request(url+'/stage',{method:'PUT',token:manager,
  body:{expectedCurrentVersion:1,patch:{customerListPriceCents:8400000}}});
 assert.equal(staged.status,200,JSON.stringify(staged.body));assert.equal(staged.body.stageVersion,1);
 assert.equal('internalWholesalePriceCents' in staged.body.preview,false);
 const applied=await app.request(url+'/commit',{method:'POST',token:manager,
  body:{expectedCurrentVersion:1,expectedStageVersion:1,requestKey:'issue216-manager-retail-no-internal-'+randomUUID()}});
 assert.equal(applied.status,200,JSON.stringify(applied.body));assert.equal(applied.body.code,'EDIT_APPLIED');
 assert.equal(applied.body.effective.customerListPriceCents,8400000);
 assert.equal('internalWholesalePriceCents' in applied.body.effective,false);
 const after=await app.request(url,{token:manager});
 assert.equal(after.status,200);assert.equal(after.body.effective.customerListPriceCents,8400000);
 assert.equal(after.body.effective.description,'trusted manager original');
 assert.equal('internalWholesalePriceCents' in after.body.effective,false);
 assert.equal((await db.query("SELECT count(*)::integer n FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1",[mid])).rows[0].n,1);
});

test('E12 real two independent HTTPS COMMIT requests share same version; exactly one physical PG16 commit and one immutable event',async()=>{
 if(fourS)return;
 const url=BASE+'/'+managerCar;
 const staged=await app.request(url+'/stage',{method:'PUT',token:managerToken,
  body:{expectedCurrentVersion:2,patch:{city:'Nanjing',mileageKm:23000}}});
 assert.equal(staged.status,200,JSON.stringify(staged.body));assert.equal(staged.body.stageVersion,1);
 const hold=await connect();
 try{
  await hold.query('BEGIN');
  await hold.query('SELECT pg_advisory_xact_lock(20261011,6)');
  const one=app.request(url+'/commit',{method:'POST',token:managerToken,body:{
   expectedCurrentVersion:2,expectedStageVersion:1,requestKey:'issue216-commit-race-one-'+randomUUID()}});
  const two=app.request(url+'/commit',{method:'POST',token:managerToken,body:{
   expectedCurrentVersion:2,expectedStageVersion:1,requestKey:'issue216-commit-race-two-'+randomUUID()}});
  await confirmBlocked();
  await hold.query('COMMIT');
  const both=await Promise.all([one,two]);
  assert.equal(both.filter(x=>x.status===200&&x.body.code==='EDIT_APPLIED').length,1,JSON.stringify(both));
  assert.equal(both.filter(x=>x.status===409||x.status===404).length,1,JSON.stringify(both));
  const rows=await db.query("SELECT count(*)::integer n FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1",[managerCar]);
  assert.equal(rows.rows[0].n,2,'one previous and one racing commit');
  const current=await app.request(url,{token:managerToken});
  assert.equal(current.status,200);assert.equal(current.body.currentVersion,3);
 }finally{await hold.query('ROLLBACK').catch(()=>{});await hold.end()}
});
test('E13 real governance COMMIT wins before waiting manager edit: fail closed and no partial audit',async()=>{
 if(fourS)return;
 const url=BASE+'/'+managerCar;
 const staged=await app.request(url+'/stage',{method:'PUT',token:managerToken,
  body:{expectedCurrentVersion:3,patch:{city:'Hangzhou'}}});
 assert.equal(staged.status,200,JSON.stringify(staged.body));assert.equal(staged.body.stageVersion,1);
 const holder=await connect(),probe=await connect();
 try{
  await holder.query('BEGIN');
  await holder.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=6 AND permission_id=399");
  const pending=app.request(url+'/commit',{method:'POST',token:managerToken,body:{
   expectedCurrentVersion:3,expectedStageVersion:1,requestKey:'issue216-manager-revoke-wins-'+randomUUID()}});
  let blocked=false;
  for(let i=0;i<120;i++){
   const q=(await probe.query("SELECT count(*)::integer n FROM pg_stat_activity a WHERE a.datname=current_database() AND a.wait_event_type='Lock' AND a.pid<>pg_backend_pid() AND cardinality(pg_blocking_pids(a.pid))>0")).rows[0].n;
   if(q>0){blocked=true;break}
   await new Promise(r=>setTimeout(r,20));
  }
  assert.equal(blocked,true);
  await holder.query('COMMIT');
  const denied=await pending;
  assert.equal(denied.status,403,JSON.stringify(denied.body));
  const audits=(await db.query('SELECT count(*)::integer n FROM f05_published_edit_test.edit_audit WHERE vehicle_id=$1',[managerCar])).rows[0].n;
  assert.equal(audits,2);
  assert.equal((await db.query('SELECT patch FROM f05_published_edit_test.staged_changes WHERE vehicle_id=$1',[managerCar])).rows[0].patch.city,'Hangzhou');
 }finally{await holder.query('ROLLBACK').catch(()=>{});await holder.end();await probe.end()}
});
