import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {convertWholesaleToMingbang,SOURCE_GAP} from '../service.mjs';
import {syncUpsert,syncBatchOffline,syncCurrent} from '../v18-sync.mjs';
import {verify as frozenV17Verify} from '../../jyt-wholesale-lineage-cycle/migration.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const ev=s=>'f05-3c-real-pg16-conversion-'+s;
const car=s=>'JYTF05C-'+s;
const original=s=>({eventKey:ev('jyt-'+s),carCode:car(s),brandId:97001,seriesId:97002,
 modelId:97003,modelYear:2026,state:'active'});
const identities=new Map(),tokens={};
async function sync(s){const row=(await db.query("SELECT l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l WHERE l.source_platform='JYT' AND l.car_code=$1",[car(s)])).rows[0];assert.ok(row,'missing signed pre-000018 source '+s);const x={vehicleId:Number(row.vehicle_id),listingCycleId:Number(row.current_cycle_id)};identities.set(s,x);return x}
const snapshot=async(vehicle,cycle)=>{
 const tables=['locks','transactions','recommendations','customer_price_cycle_unlocks',
  'customer_price_unlock_events','vehicle_images','vehicle_price_history','vehicle_visibility_grants'];
 const result={};
 for(const name of tables){
  const filter=['vehicle_visibility_grants','vehicle_images','vehicle_price_history'].includes(name)?
   'vehicle_id=$1':'vehicle_id=$1 AND listing_cycle_id=$2';
  result[name]=(await db.query('SELECT row_to_json(t) AS record FROM public.'+name+' t WHERE '+filter+' ORDER BY to_jsonb(t)::text',[vehicle,...(filter.includes('$2')?[cycle]:[])])).rows.map(x=>x.record);
 }
 return {result,sha:createHash('sha256').update(JSON.stringify(result)).digest('hex')};
};
test.before(async()=>{
 const a=await verify(db);assert.equal(a.verified,true);
 for(const [name,password,key] of [
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const r=await auth.login({login:name,password,source:'f05-3c-real-scoped-conversion'});
  assert.equal(r.code,'AUTH_OK',name+':'+r.code);tokens[key]=r.token;
 }
 tokens.api=process.env.F05_3C_CI_EPHEMERAL_SYNC_TOKEN;
 assert.match(tokens.api||'',/^mbci_[a-zA-Z0-9_-]{43}$/);
 for(const s of ['LOCKED','UNSCOPED','TRADING','COMPLETED','CONCURRENT','REVOKED','TX_RACE','SCOPE_RACE'])await sync(s);
 // Synthetic current business relationship: not a fake ownership flag or publisher,
 // actual nonprivileged PG16 FK-backed Customer and Lock with a current employee.
 for(const [i,s] of ['LOCKED','TRADING','COMPLETED','CONCURRENT','REVOKED','TX_RACE','SCOPE_RACE'].entries()){
  const {vehicleId,listingCycleId}=identities.get(s),customer=894001+i,lock=895001+i;
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1)",[customer]);
  await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES($1,$2,$3,$4,'active',1,now()-interval '2 hours',now()+interval '2 hours')",
   [lock,customer,vehicleId,listingCycleId]);
  if(s==='TRADING'||s==='COMPLETED'||s==='TX_RACE'){
   await db.query("INSERT INTO public.transactions(transaction_id,customer_id,vehicle_id,listing_cycle_id,responsible_employee_id,source_lock_id,status,completed_at) VALUES($1,$2,$3,$4,1,$5,$6,$7)",
    [896001+i,customer,vehicleId,listingCycleId,lock,s==='COMPLETED'?'completed':'trading',s==='COMPLETED'?new Date():null]);
  }
 }
 const {vehicleId,listingCycleId}=identities.get('LOCKED');
 await db.query("INSERT INTO public.recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id,recommender_employee_id,status) VALUES(897001,894001,$1,$2,1,'active')",[vehicleId,listingCycleId]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(897002,894001,$1,$2,'synthetic-f05-3c-current-cycle')",[vehicleId,listingCycleId]);
 await db.query("INSERT INTO public.vehicle_images(image_id,vehicle_id,relative_path,source_url_fact,asset_storage_status) VALUES(897003,$1,'source/JYT/F05C-ORIGINAL','synthetic-upstream-relative-source','pending')",[vehicleId]);
 await db.query("INSERT INTO public.vehicle_price_history(price_event_id,vehicle_id,amount_cents,price_kind,valid_from) VALUES(897004,$1,2200000,'wholesale',now()-interval '1 day')",[vehicleId]);
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('C-A01 physical 000018 true PG16 version, old 000017 frozen and new audit relations',async()=>{
 const r=await verify(db);assert.equal(r.verified,true);assert.notEqual(r.priorSha,r.newSha);
});
test('C-A02 no employee, System Admin and 4S are all hard denied',async()=>{
 const p={vehicleId:identities.get('LOCKED').vehicleId,teamId:901,eventKey:ev('denied-invalid-principal')};
 for(const token of ['',tokens.admin,tokens.four,tokens.api]){
  const out=await convertWholesaleToMingbang(auth,token,p);
  assert.equal(out.allowed,false,JSON.stringify(out));
 }
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions')).rows[0].n,0);
});
test('C-A03 even current valid employee role+capability cannot invent object ownership for unscoped wholesale',async()=>{
 const out=await convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId:identities.get('UNSCOPED').vehicleId,teamId:901,eventKey:ev('unscoped-no-owner')});
 assert.deepEqual(out,{allowed:false,code:SOURCE_GAP});
});
test('C-A04 genuine employee current Lock, team and two capabilities convert same Vehicle/Cycle; independent image source GAP',async()=>{
 const {vehicleId,listingCycleId}=identities.get('LOCKED');
 const before=await snapshot(vehicleId,listingCycleId);
 const out=await convertWholesaleToMingbang(auth,tokens.employee,{vehicleId,teamId:901,eventKey:ev('locked-vehicle-authorized')});
 assert.equal(out.allowed,true,JSON.stringify(out));
 assert.equal(out.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal(out.vehicleId,vehicleId);assert.equal(out.listingCycleId,listingCycleId);
 assert.equal(out.assetState,'IMAGE_LOCALIZATION_SOURCE_GAP');
 const after=await snapshot(vehicleId,listingCycleId);
 assert.equal(after.sha,before.sha,'all eight actual PG16 history carrier rows unchanged');
 const v=(await db.query('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.deepEqual(v,{source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vehicleId])).rows[0].n,1);
 const c=(await db.query('SELECT * FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.equal(c.before_state.carCode,car('LOCKED'));assert.equal(c.actor_employee_id,'1');
 assert.equal(c.asset_state,'IMAGE_LOCALIZATION_SOURCE_GAP');
 assert.equal(c.source_evidence.origin,'CURRENT_EMPLOYEE_SESSION_AND_EXISTING_BUSINESS_OBJECT_SCOPE');
});
test('C-A05 idempotent retry cannot create second Vehicle/Cycle or convert again with another event',async()=>{
 const {vehicleId,listingCycleId}=identities.get('LOCKED');
 const same=await convertWholesaleToMingbang(auth,tokens.employee,{vehicleId,teamId:901,eventKey:ev('locked-vehicle-authorized')});
 assert.equal(same.code,'F05_3C_SAME_EVENT_ALREADY_CONVERTED');
 assert.equal(same.listingCycleId,listingCycleId);
 assert.equal((await convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('different-conversion-click')})).allowed,false);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vehicleId])).rows[0].n,1);
});
test('C-A06 old JYT code converted cannot reactivate wholesale on upsert/offline/list; reversal SQL is physically denied',async()=>{
 const {vehicleId}=identities.get('LOCKED');
 const res=await syncUpsert(auth,tokens.api,{...original('LOCKED'),eventKey:ev('post-converted-jyt-core-changed'),modelYear:2023});
 assert.equal(res.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
 const off=await syncBatchOffline(auth,tokens.api,{eventKey:ev('post-converted-upstream-offline'),carCodes:[car('LOCKED')]});
 assert.equal(off.count,0);
 const list=await syncCurrent(auth,tokens.api,{eventKey:ev('upstream-current-after-converted'),afterVehicleId:0,limit:50});
 assert.equal(list.items.some(x=>x.vehicleId===vehicleId),false);
 await assert.rejects(()=>db.query("UPDATE public.vehicles SET source_type='wholesale',source_sale_status='active' WHERE vehicle_id=$1",[vehicleId]),/F05_3C_WHOLESALE_SOURCE_REVERSAL_FORBIDDEN/);
});
test('C-A07 existing active Transaction trading permits conversion without rewriting historic transaction/Lock',async()=>{
 const {vehicleId,listingCycleId}=identities.get('TRADING');
 const prior=await snapshot(vehicleId,listingCycleId);
 const out=await convertWholesaleToMingbang(auth,tokens.employee,{vehicleId,teamId:901,eventKey:ev('trading-allowed')});
 assert.equal(out.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal((await snapshot(vehicleId,listingCycleId)).sha,prior.sha);
});
test('C-A08 completed Transaction prevents conversion even with real Lock, role, team, permissions',async()=>{
 const {vehicleId}=identities.get('COMPLETED');
 const out=await convertWholesaleToMingbang(auth,tokens.employee,{vehicleId,teamId:901,eventKey:ev('completed-must-deny')});
 assert.equal(out.code,'F05_3C_COMPLETED_TRANSACTION_BLOCKS_CONVERSION');
 assert.equal((await db.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0].source_type,'wholesale');
});
test('C-A09 actual 2 PG16 backends and same JYT advisory lock prove 55P03 collision before commit',async()=>{
 const {vehicleId}=identities.get('CONCURRENT');
 let release,started,pid;const held=new Promise(resolve=>release=resolve),locked=new Promise(resolve=>started=resolve);
 const converting=convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('truly-concurrent-single-winner')},
  {checkpoint:async(label,c)=>{assert.equal(label,'employee_and_source_physically_locked');
   pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);started();await held;}});
 await locked;
 const contender=await connect();
 try{
  assert.notEqual(pid,Number((await contender.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await contender.query('BEGIN');await contender.query("SET LOCAL lock_timeout='250ms'");
  await assert.rejects(()=>contender.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+car('CONCURRENT')]),e=>e?.code==='55P03');
 }finally{await contender.query('ROLLBACK').catch(()=>{});await contender.end();release()}
 assert.equal((await converting).allowed,true);
 assert.equal((await convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('concurrent-second-loser')})).allowed,false);
});
test('C-A10 capability revoke real PG16 governance blocks Employee despite Lock, restoration not falsely asserted',async()=>{
 const {vehicleId}=identities.get('REVOKED');
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=(SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage')");
 const out=await convertWholesaleToMingbang(auth,tokens.employee,{vehicleId,teamId:901,eventKey:ev('revoke-governance-denies')});
 assert.equal(out.allowed,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=1 AND permission_id=(SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage')");
});
test('C-A11 immutable actor and source snapshots reject forged SQL modification or deletion',async()=>{
 const {vehicleId}=identities.get('LOCKED');
 const c=(await db.query('SELECT conversion_id FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vehicleId])).rows[0];
 await assert.rejects(()=>db.query('UPDATE public.f05_3c_wholesale_conversions SET actor_employee_id=9 WHERE conversion_id=$1',[c.conversion_id]),/F05_3C_SIGNED_HISTORY_IMMUTABLE/);
 await assert.rejects(()=>db.query('DELETE FROM public.f05_3c_wholesale_conversions WHERE conversion_id=$1',[c.conversion_id]),/F05_3C_SIGNED_HISTORY_IMMUTABLE/);
 const aud=(await db.query('SELECT audit_id FROM public.f05_3c_conversion_audit WHERE conversion_id=$1',[c.conversion_id])).rows[0];
 await assert.rejects(()=>db.query('DELETE FROM public.f05_3c_conversion_audit WHERE audit_id=$1',[aud.audit_id]),/F05_3C_SIGNED_HISTORY_IMMUTABLE/);
});

test('C-A12 real v18 signed JYT unconverted wholesale sync/offline/relist stays same vehicle with a genuinely NEW cycle',async()=>{
 const x=(await db.query("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages WHERE car_code='JYTF05C-SYNC-V18'")).rows[0];
 assert.ok(x);
 const vid=Number(x.vehicle_id),first=Number(x.current_cycle_id);
 const p={eventKey:ev('v18-positive-upsert'),carCode:'JYTF05C-SYNC-V18',
  brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state:'active'};
 const refresh=await syncUpsert(auth,tokens.api,p);
 assert.equal(refresh.code,'F05_3B_UPDATED',JSON.stringify(refresh));
 assert.equal(refresh.vehicleId,vid);assert.equal(refresh.listingCycleId,first);
 const duplicate=await syncUpsert(auth,tokens.api,p);
 assert.equal(duplicate.code,'F05_3B_EVENT_ALREADY_PROCESSED');
 const batch1={eventKey:ev('v18-real-source-offline'),carCodes:['JYTF05C-SYNC-V18']};
 const offline=await syncBatchOffline(auth,tokens.api,batch1);
 assert.equal(offline.count,1,JSON.stringify(offline));
 const replay1=await syncBatchOffline(auth,tokens.api,batch1);
 assert.equal(replay1.code,'F05_3B_OFFLINE_BATCH_IDEMPOTENT');
 assert.equal(replay1.count,1,'replay preserves immutable original count_rows');
 const receipt1=(await db.query(
  'SELECT count_rows FROM public.f05_3b_sync_receipts WHERE event_key=$1',[batch1.eventKey])).rows;
 assert.equal(receipt1.length,1);assert.equal(Number(receipt1[0].count_rows),1);
 const changed=await syncBatchOffline(auth,tokens.api,
  {...batch1,carCodes:[...batch1.carCodes,car('UNSCOPED')]});
 assert.equal(changed.code,'F05_3C_V18_EVENT_PAYLOAD_COLLISION');
 const zeroBatch={...batch1,eventKey:ev('v18-new-event-all-already-offline')};
 assert.equal((await syncBatchOffline(auth,tokens.api,zeroBatch)).count,0);
 assert.equal((await syncBatchOffline(auth,tokens.api,zeroBatch)).count,0);
 const recZero=(await db.query(
  'SELECT count_rows FROM public.f05_3b_sync_receipts WHERE event_key=$1',
  [zeroBatch.eventKey])).rows;
 assert.equal(recZero.length,1);assert.equal(Number(recZero[0].count_rows),0);
 const empty=await syncCurrent(auth,tokens.api,{eventKey:ev('v18-current-exclude-offline'),afterVehicleId:0,limit:50});
 assert.equal(empty.allowed,true);
 assert.equal(empty.items.some(x=>x.vehicleId===vid),false);
 const relist=await syncUpsert(auth,tokens.api,{...p,eventKey:ev('v18-relist-new-cycle')});
 assert.equal(relist.code,'F05_3B_RELISTED',JSON.stringify(relist));
 assert.equal(relist.vehicleId,vid);assert.notEqual(relist.listingCycleId,first);
 const current=await syncCurrent(auth,tokens.api,{eventKey:ev('v18-current-list-again'),afterVehicleId:0,limit:50});
 assert.equal(current.allowed,true);assert.ok(current.items.some(x=>x.vehicleId===vid));
 const line=(await db.query("SELECT current_cycle_id FROM public.f05_3b_sync_lineages WHERE car_code='JYTF05C-SYNC-V18'")).rows[0];
 assert.equal(Number(line.current_cycle_id),relist.listingCycleId);
 // Both cars were imported and signed by F05-3B before 000018.
 const two={eventKey:ev('v18-two-real-cars-one-concurrent-batch'),
  carCodes:['JYTF05C-SYNC-V18','JYT-F05C-LOOPBACK-015']};
 const results=await Promise.all([
  syncBatchOffline(auth,tokens.api,two),syncBatchOffline(auth,tokens.api,two)]);
 assert.equal(results.length,2);
 assert.ok(results.every(x=>x.allowed===true&&x.count===2),JSON.stringify(results));
 assert.equal((await syncBatchOffline(auth,tokens.api,two)).count,2);
 const receipts=(await db.query(
  'SELECT count_rows,outcome FROM public.f05_3b_sync_receipts WHERE event_key=$1',
  [two.eventKey])).rows;
 assert.equal(receipts.length,1);
 assert.equal(Number(receipts[0].count_rows),2);
 assert.equal(receipts[0].outcome,'OFFLINED');
 const rows=(await db.query(
  "SELECT v.source_sale_status,cy.ended_at FROM public.f05_3b_sync_lineages l "+
  "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
  "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id "+
  "WHERE l.car_code=ANY($1)",[two.carCodes])).rows;
 assert.equal(rows.length,2);
 assert.ok(rows.every(x=>x.source_sale_status==='offline'&&x.ended_at!==null));
 assert.equal((await syncBatchOffline(auth,tokens.api,
  {...two,carCodes:[two.carCodes[0]]})).code,'F05_3C_V18_EVENT_PAYLOAD_COLLISION');
 assert.equal((await syncUpsert(auth,tokens.api,
  {...p,eventKey:two.eventKey,state:'offline'})).code,'F05_3C_V18_EVENT_PAYLOAD_COLLISION');
 const allZero={...two,eventKey:ev('v18-two-offline-new-event-zero')};
 assert.equal((await syncBatchOffline(auth,tokens.api,allZero)).count,0);
 assert.equal((await syncBatchOffline(auth,tokens.api,allZero)).count,0);
});
test('C-A13 old v17 strict seal refuses v18; only new exact-v18 signed adapter accepts; forged API secret and switched-off action deny',async()=>{
 await assert.rejects(()=>frozenV17Verify(db),/F05_3B_FROZEN_000016_REQUIRED/);
 const p={eventKey:ev('v18-invalid-api-credential'),afterVehicleId:0,limit:5};
 assert.equal((await syncCurrent(auth,'mbci_'+'a'.repeat(43),p)).allowed,false);
 await db.query("UPDATE public.f05_3b_api_controls SET enabled=false,version=version+1 WHERE action='current'");
 const denied=await syncCurrent(auth,tokens.api,{...p,eventKey:ev('v18-current-switch-disabled')});
 assert.equal(denied.allowed,false,'true v18 switch must be checked inside transaction');
 await db.query("UPDATE public.f05_3b_api_controls SET enabled=true,version=version+1 WHERE action='current'");
 const success=await syncCurrent(auth,tokens.api,{...p,eventKey:ev('v18-current-switch-restored')});
 assert.equal(success.allowed,true);
});
test('C-A14 true PG16 atomic v18 version record tamper fails closed and rolls back',async()=>{
 const before=await verify(db);assert.equal(before.verified,true);
 await db.query('BEGIN');
 try{
  try{
   await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000018_wholesale_mingbang_conversion_ci_only'",
    ['0'.repeat(64)]);
   await assert.rejects(()=>verify(db),/F05_3C_UNAUTHORIZED_MIGRATION/);
  }catch(e){
   if(!/(IMMUTABLE|DENIED|PROTECTED|FROZEN|migration|permission|readonly|trigger|UNAUTHORIZED_MIGRATION)/i.test(e.message))throw e;
  }
 }finally{await db.query('ROLLBACK')}
 assert.equal((await verify(db)).newSha,before.newSha);
});

test('C-A15 concurrent Transaction completed update truly hits FOR SHARE row lock 55P03 before conversion commits',async()=>{
 const {vehicleId}=identities.get('TX_RACE');
 let release,notify,heldPid;
 const pending=new Promise(resolve=>release=resolve);
 const entered=new Promise(resolve=>notify=resolve);
 const converting=convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('real-trading-vs-complete-tx')},
  {checkpoint:async(point,c)=>{
    assert.equal(point,'employee_and_source_physically_locked');
    heldPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
    notify();await pending;
  }});
 await entered;
 const contender=await connect();
 try{
  assert.notEqual(heldPid,Number((await contender.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await contender.query('BEGIN');
  await contender.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>contender.query(
   "UPDATE public.transactions SET status='completed',completed_at=now() WHERE vehicle_id=$1 AND status='trading'",
   [vehicleId]),e=>e?.code==='55P03');
 }finally{
  await contender.query('ROLLBACK').catch(()=>{});await contender.end();release();
 }
 assert.equal((await converting).code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 const preserved=(await db.query('SELECT status,completed_at FROM public.transactions WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.equal(preserved.status,'trading');assert.equal(preserved.completed_at,null);
});
test('C-A16 independent PG backend governance revoke waits on active conversion actor advisory 55P03',async()=>{
 const {vehicleId}=identities.get('SCOPE_RACE');
 let release,notify,actorBackend;
 const pending=new Promise(resolve=>release=resolve);
 const entered=new Promise(resolve=>notify=resolve);
 const converting=convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('real-scope-revoke-vs-conversion')},
  {checkpoint:async(point,c)=>{
   assert.equal(point,'employee_and_source_physically_locked');
   actorBackend=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   notify();await pending;
  }});
 await entered;
 const contender=await connect();
 try{
  assert.notEqual(actorBackend,Number((await contender.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await contender.query('BEGIN');await contender.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>contender.query(
   "UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=(SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage')"),e=>e?.code==='55P03');
 }finally{
  await contender.query('ROLLBACK').catch(()=>{});await contender.end();release();
 }
 assert.equal((await converting).code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
});

test('C-A17 two independent real PG16 backends lock current Lock-only scope FOR SHARE until commit',async()=>{
 const {vehicleId,listingCycleId}=identities.get('REVOKED');
 let resume,signal,backendPid;
 const pending=new Promise(resolve=>resume=resolve),entered=new Promise(resolve=>signal=resolve);
 const converting=convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('lock-only-current-authorization-concurrent-write')},
  {checkpoint:async(point,c)=>{
   assert.equal(point,'employee_and_source_physically_locked');
   backendPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   signal();await pending;
  }});
 await entered;
 const writer=await connect();
 try{
  assert.notEqual(backendPid,Number((await writer.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await writer.query('BEGIN');
  await writer.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>writer.query(
   "UPDATE public.locks SET expires_at=now()-interval '2 minutes' WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND responsible_employee_id=1",
   [vehicleId,listingCycleId]),e=>e?.code==='55P03');
  await writer.query('ROLLBACK');
  await writer.query('BEGIN');
  await writer.query("SET LOCAL lock_timeout='300ms'");
  await assert.rejects(()=>writer.query(
   "UPDATE public.locks SET lock_status='cancelled' WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND responsible_employee_id=1",
   [vehicleId,listingCycleId]),e=>e?.code==='55P03');
 }finally{await writer.query('ROLLBACK').catch(()=>{});await writer.end();resume()}
 assert.equal((await converting).code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',
  [vehicleId])).rows[0].n,1);
});

test('C-A18 expired Lock-only scope fails closed without a new conversion receipt',async()=>{
 const {vehicleId,listingCycleId}=identities.get('UNSCOPED');
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(894099,'active',1,'assigned',1)");
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES(895099,894099,$1,$2,'active',1,now()-interval '2 hours',now()-interval '1 minute')",
  [vehicleId,listingCycleId]);
 const out=await convertWholesaleToMingbang(auth,tokens.employee,
  {vehicleId,teamId:901,eventKey:ev('expired-lock-not-current-object-scope')});
 assert.deepEqual(out,{allowed:false,code:SOURCE_GAP});
 assert.equal((await db.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1',
  [vehicleId])).rows[0].source_type,'wholesale');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',
  [vehicleId])).rows[0].n,0);
});
