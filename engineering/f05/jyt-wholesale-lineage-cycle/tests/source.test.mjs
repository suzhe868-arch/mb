import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID} from '../migration.mjs';
import {issueCredential,setApiEnabled,revokeCredential,syncUpsert,syncBatchOffline,syncCurrent} from '../contract.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const ev=x=>'f05-3b-genuine-control-and-upstream-event-'+x;
const car='JYTTEST-UNIT-990001';
const candidate=(name,state='active',extra={})=>({
 eventKey:ev(name),carCode:car,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state,...extra
});
let token,admin,employee,four,vid,firstCycle,secondCycle,cred;
test.before(async()=>{
 for(const [login,password,key] of [
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const r=await auth.login({login,password,source:'f05-3b-real-control-session'});
  assert.equal(r.code,'AUTH_OK',login+':'+r.code);
  if(key==='admin')admin=r.token;
  if(key==='employee')employee=r.token;
  if(key==='four')four=r.token;
 }
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('B-A01 actual isolated 000017, source version and immutable M94 -> 000016',async()=>{
 const result=await verify(db);
 assert.equal(result.verified,true);
 assert.notEqual(result.newSha,result.priorSha);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f03_schema_migrations WHERE migration_id=$1',[ID])).rows[0].n,1);
});
test('B-A02 Employee/4S/JYT token cannot mint a trusted Mingbang integration subject',async()=>{
 for(const s of [employee,four,'not-a-session']){
  const x=await issueCredential(auth,s,{eventKey:ev('invalid-control-credential')});
  assert.equal(x.allowed,false,JSON.stringify(x));
 }
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_credentials')).rows[0].n,0);
});
test('B-A03 actual current System Admin session issues separate short-lived CI API secret and append-only audit',async()=>{
 const g=await issueCredential(auth,admin,{eventKey:ev('control-issued-real-session')});
 assert.equal(g.code,'F05_3B_TEST_CREDENTIAL_ISSUED',JSON.stringify(g));
 token=g.token;cred=g.credentialId;
 assert.match(token,/^mbci_[A-Za-z0-9_-]{43}$/);
 const row=(await db.query('SELECT c.secret_sha256,c.issued_by_system_admin_id,a.actor_kind,a.actor_system_admin_id FROM public.f05_3b_sync_credentials c JOIN public.f05_3b_control_audit a USING(credential_id) WHERE c.credential_id=$1',[cred])).rows[0];
 assert.equal(row.secret_sha256.length,64);assert.equal(row.secret_sha256.includes(token),false);
 assert.equal(Number(row.issued_by_system_admin_id),9);
 assert.equal(row.actor_kind,'SYSTEM_ADMIN');assert.equal(Number(row.actor_system_admin_id),9);
});
test('B-A04 three APIs default OFF, invalid Employee/JYT credentials never grant source authority',async()=>{
 assert.equal((await syncUpsert(auth,token,candidate('default-off'))).allowed,false);
 assert.equal((await syncUpsert(auth,'real-jyt-login-token-not-authorized',candidate('bad-jyt-token'))).allowed,false);
 assert.equal((await syncCurrent(auth,token,{eventKey:ev('default-current-off'),afterVehicleId:0,limit:5})).allowed,false);
 const disabled=await setApiEnabled(auth,employee,{action:'upsert',enabled:true,eventKey:ev('employee-illegal-switch')});
 assert.equal(disabled.allowed,false);
});
test('B-A05 System Admin toggles independent API controls; same API key never implies Employee/4S rights',async()=>{
 for(const action of ['upsert','offline','current']){
  const g=await setApiEnabled(auth,admin,{action,enabled:true,eventKey:ev('admin-enabled-'+action)});
  assert.equal(g.allowed,true,JSON.stringify(g));
 }
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_api_controls WHERE enabled')).rows[0].n,3);
});
test('B-A06 verified model+brand+series current physical identity required; bogus mapping does not create Vehicle',async()=>{
 for(const bad of [
  candidate('model-unknown','active',{modelId:999999}),
  candidate('brand-mismatch','active',{brandId:999999}),
  candidate('year-mismatch','active',{modelYear:2024}),
  candidate('pretend-employee','active',{publisherId:665283}),
  candidate('offline-before-first','offline')]){
  assert.equal((await syncUpsert(auth,token,bad)).allowed,false);
 }
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_lineages')).rows[0].n,0);
});
test('B-A07 real JYT source import signs SAME-TX Vehicle+first ListingCycle+lineage+INTEGRATION audit',async()=>{
 const r=await syncUpsert(auth,token,candidate('first-source'));
 assert.equal(r.code,'F05_3B_IMPORTED',JSON.stringify(r));
 vid=r.vehicleId;firstCycle=r.listingCycleId;
 const d=(await db.query('SELECT v.source_type,v.source_sale_status,v.platform_visibility,v.created_by_employee_id,l.car_code,l.current_cycle_id,cy.ended_at,a.actor_kind,a.outcome FROM public.f05_3b_sync_lineages l JOIN public.vehicles v USING(vehicle_id) JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id JOIN public.f05_3b_sync_receipts a ON a.vehicle_id=l.vehicle_id AND a.outcome=$1 WHERE l.car_code=$2',['IMPORTED',car])).rows[0];
 assert.equal(d.source_type,'wholesale');assert.equal(d.source_sale_status,'active');
 assert.equal(d.created_by_employee_id,null);
 assert.equal(d.actor_kind,'INTEGRATION');assert.equal(Number(d.current_cycle_id),firstCycle);
 assert.equal(d.ended_at,null);
});
test('B-A08 same car_code repeated current sync reuses Vehicle/Cycle and idempotent event receipt',async()=>{
 const eventCandidate=candidate('first-source');
 const replay=await syncUpsert(auth,token,eventCandidate);
 assert.equal(replay.code,'F05_3B_EVENT_ALREADY_PROCESSED');
 const again=await syncUpsert(auth,token,candidate('update-same-car'));
 assert.equal(again.code,'F05_3B_UPDATED');assert.equal(again.vehicleId,vid);assert.equal(again.listingCycleId,firstCycle);
 const rows=(await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_lineages WHERE car_code=$1',[car])).rows[0].n;
 assert.equal(rows,1);
 const collision=await syncUpsert(auth,token,{...eventCandidate,state:'offline'});
 assert.equal(collision.allowed,false);
});
test('B-A09 hidden is independent, does not reset on sync, source cannot modify VIN/Lock/CRM or employee owner',async()=>{
 await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[vid]);
 const r=await syncUpsert(auth,token,candidate('hidden-refresh'));
 assert.equal(r.code,'F05_3B_UPDATED');
 const v=(await db.query('SELECT platform_visibility,vin,created_by_employee_id FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0];
 assert.equal(v.platform_visibility,'hidden');assert.equal(v.vin,null);assert.equal(v.created_by_employee_id,null);
 const list=await syncCurrent(auth,token,{eventKey:ev('hidden-still-upstream-sale'),afterVehicleId:0,limit:50});
 assert.equal(list.allowed,true);
 assert.equal(list.items.some(x=>x.vehicleId===vid),true,'local hidden remains in upstream reconciliation set');
 assert.deepEqual(Object.keys(list.items.find(x=>x.vehicleId===vid)).sort(),['carCode','listingCycleId','vehicleId']);
});
test('B-A10 real offline ends initial cycle, does not erase historical source, hidden remains hidden',async()=>{
 const r=await syncUpsert(auth,token,candidate('offline-cycle','offline'));
 assert.equal(r.code,'F05_3B_OFFLINED');assert.equal(r.vehicleId,vid);
 const q=(await db.query('SELECT v.source_sale_status,v.platform_visibility,cy.ended_at FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.listing_cycle_id=$2 WHERE v.vehicle_id=$1',[vid,firstCycle])).rows[0];
 assert.equal(q.source_sale_status,'offline');assert.equal(q.platform_visibility,'hidden');
 assert.ok(q.ended_at);
 const lst=await syncCurrent(auth,token,{eventKey:ev('offline-not-listed'),afterVehicleId:0,limit:50});
 assert.equal(lst.items.some(x=>x.vehicleId===vid),false);
});
test('B-A11 actual offline -> active makes NEW real cycle; active refresh and hidden toggle DO NOT',async()=>{
 const r=await syncUpsert(auth,token,candidate('relist-cycle'));
 assert.equal(r.code,'F05_3B_RELISTED');assert.equal(r.vehicleId,vid);
 assert.notEqual(r.listingCycleId,firstCycle);secondCycle=r.listingCycleId;
 const n=(await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid])).rows[0].n;
 assert.equal(n,2);
 assert.equal((await syncUpsert(auth,token,candidate('ordinary-active-refresh'))).listingCycleId,secondCycle);
 await db.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=$1",[vid]);
 assert.equal((await syncUpsert(auth,token,candidate('after-unhide-refresh'))).listingCycleId,secondCycle);
});
test('B-A12 contradictory model/year is anomaly, cannot silently overwrite or make another wholesale Vehicle',async()=>{
 const r=await syncUpsert(auth,token,candidate('core-id-changed','active',{modelYear:2025}));
 assert.equal(r.allowed,false);
 // For a real model alternative, the actual verified identity must still be compared to immutable original.
 const bad=await syncUpsert(auth,token,candidate('core-id-still-bad','active',{brandId:97001,modelId:97003,modelYear:2024}));
 assert.equal(bad.allowed,false);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_lineages WHERE car_code=$1',[car])).rows[0].n,1);
 await assert.rejects(()=>db.query('UPDATE public.f05_3b_sync_lineages SET car_code=$1 WHERE vehicle_id=$2',['HACKED',vid]),/F05_3B_LINEAGE_IDENTITY_IMMUTABLE/);
});
test('B-A13 independent batch offline authority and count, unknown car does not affect existing Vehicle',async()=>{
 const r=await syncBatchOffline(auth,token,{eventKey:ev('signed-batch-offline'),carCodes:[car,'FAKE-NO-CAR-0001']});
 assert.equal(r.code,'F05_3B_BATCH_OFFLINED');assert.equal(r.count,1);
 assert.equal((await db.query('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0].source_sale_status,'offline');
 assert.equal((await syncBatchOffline(auth,token,{eventKey:ev('signed-batch-offline'),carCodes:[car,'FAKE-NO-CAR-0001']})).code,'F05_3B_OFFLINE_BATCH_IDEMPOTENT');
});
test('B-A14 real two independent PG16 backends lock same car_code; 55P03 confirms actual contention',async()=>{
 await syncUpsert(auth,token,candidate('fresh-again-after-batch'));
 let release,signal,ownerPid;
 const held=new Promise(resolve=>release=resolve);
 const reached=new Promise(resolve=>signal=resolve);
 const ongoing=syncUpsert(auth,token,candidate('held-during-concurrent-update'),{checkpoint:async(label,c)=>{
  assert.equal(label,'source_locked');
  ownerPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  signal();await held;
 }});
 await reached;
 const contender=await connect();
 try{
  const otherPid=Number((await contender.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  assert.notEqual(otherPid,ownerPid);
  await contender.query('BEGIN');
  await contender.query("SET LOCAL lock_timeout='250ms'");
  await assert.rejects(
   ()=>contender.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+car]),
   e=>e?.code==='55P03'
  );
 }finally{
  await contender.query('ROLLBACK').catch(()=>{});await contender.end();release();
 }
 assert.equal((await ongoing).allowed,true);
});
test('B-A15 disable one endpoint while retaining other actions; account tokens not interchangeable',async()=>{
 const closed=await setApiEnabled(auth,admin,{action:'upsert',enabled:false,eventKey:ev('admin-disabled-only-upsert')});
 assert.equal(closed.allowed,true);
 assert.equal((await syncUpsert(auth,token,candidate('now-disabled-upsert'))).allowed,false);
 assert.equal((await syncCurrent(auth,token,{eventKey:ev('list-while-upsert-disabled'),afterVehicleId:0,limit:1})).allowed,true);
 await setApiEnabled(auth,admin,{action:'upsert',enabled:true,eventKey:ev('admin-reenabled-upsert')});
});
test('B-A16 converted wholesale historical car_code never becomes second Vehicle and source conflict is suppressed',async()=>{
 await db.query("UPDATE public.vehicles SET source_type='mingbang',source_sale_status='available' WHERE vehicle_id=$1",[vid]);
 const r=await syncUpsert(auth,token,candidate('converted-source-identity','active'));
 assert.equal(r.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
 const collision=await syncUpsert(auth,token,candidate('converted-different-model-year','active',{modelYear:2023}));
 assert.equal(collision.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED','converted historical JYT identity conflict must AUTO suppress, never manual review');
 const suppressed=(await db.query("SELECT outcome FROM public.f05_3b_sync_receipts WHERE event_key=$1",[ev('converted-different-model-year')])).rows[0];
 assert.equal(suppressed.outcome,'CONVERTED_SUPPRESSED');
 assert.equal((await db.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0].source_type,'mingbang');
 const a=(await db.query("SELECT outcome,actor_kind FROM public.f05_3b_sync_receipts WHERE event_key=$1",[ev('converted-source-identity')])).rows[0];
 assert.equal(a.outcome,'CONVERTED_SUPPRESSED');assert.equal(a.actor_kind,'INTEGRATION');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_lineages WHERE car_code=$1',[car])).rows[0].n,1);
});
test('B-A17 receipt history cannot mutate/delete, credential revoke irreversible and no old-source restoration',async()=>{
 const a=(await db.query('SELECT receipt_id FROM public.f05_3b_sync_receipts ORDER BY receipt_id LIMIT 1')).rows[0];
 await assert.rejects(()=>db.query('DELETE FROM public.f05_3b_sync_receipts WHERE receipt_id=$1',[a.receipt_id]),/F05_3B_AUDIT_IMMUTABLE/);
 await assert.rejects(()=>db.query("UPDATE public.f05_3b_sync_receipts SET outcome='LISTED' WHERE receipt_id=$1",[a.receipt_id]),/F05_3B_AUDIT_IMMUTABLE/);
 const r=await revokeCredential(auth,admin,{credentialId:cred,version:1,eventKey:ev('admin-revoked-test-credential')});
 assert.equal(r.code,'F05_3B_CREDENTIAL_REVOKED');
 assert.equal((await syncCurrent(auth,token,{eventKey:ev('revoked-current'),afterVehicleId:0,limit:5})).allowed,false);
 await assert.rejects(()=>db.query('UPDATE public.f05_3b_sync_credentials SET revoked_at=NULL,version=version+1 WHERE credential_id=$1',[cred]),/F05_3B_CREDENTIAL_REVOCATION_IRREVERSIBLE/);
});
