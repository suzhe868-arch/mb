import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../favorite-physical-carrier/migration.mjs';
import {issueCredential,setApiEnabled,revokeCredential,syncUpsert,syncBatchOffline,syncCurrent} from '../../jyt-wholesale-lineage-cycle/contract.mjs';
import {convertWholesaleToMingbang,SOURCE_GAP} from '../../wholesale-to-mingbang-conversion/service.mjs';
import {syntheticFavoriteChange} from '../../favorite-physical-carrier/service.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const car='JYTF05C-UNSCOPED',customer=899992;
const ev=n=>'f05-3k-replay-converted-v19-'+n;
const dto=(n,modelYear=2026)=>({eventKey:ev(n),carCode:car,brandId:97001,seriesId:97002,modelId:97003,modelYear,state:'active'});
const sha=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const rows=(sql,p=[])=>db.query(sql,p).then(x=>x.rows);
const counts=async()=>{
 const r=await rows('SELECT (SELECT count(*)::int FROM public.vehicles WHERE vehicle_id=$1) vehicle_count,(SELECT count(*)::int FROM public.vehicle_listing_cycles WHERE vehicle_id=$1) cycle_count,(SELECT count(*)::int FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1) conversion_count',[vid]);return r[0];
};
const snapshot=async()=>{
 const tables={
  vehicles:['vehicle_id=$1',[vid]],
  cycles:['vehicle_id=$1',[vid]],
  lineage:['vehicle_id=$1',[vid]],
  conversions:['vehicle_id=$1',[vid]],
  conversionAudit:['conversion_id IN (SELECT conversion_id FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1)',[vid]],
  favorites:['vehicle_id=$1',[vid]],
  favoriteEvents:['vehicle_id=$1',[vid]],
  customers:['customer_id=$1',[customer]],
  locks:['vehicle_id=$1',[vid]],
  transactions:['vehicle_id=$1',[vid]],
  recommendations:['vehicle_id=$1',[vid]],
  priceUnlocks:['vehicle_id=$1',[vid]],
  priceEvents:['vehicle_id=$1',[vid]],
  images:['vehicle_id=$1',[vid]],
  visibility:['vehicle_id=$1',[vid]],
  priceHistory:['vehicle_id=$1',[vid]]
 };
 const names={vehicles:'vehicles',cycles:'vehicle_listing_cycles',lineage:'f05_3b_sync_lineages',conversions:'f05_3c_wholesale_conversions',conversionAudit:'f05_3c_conversion_audit',favorites:'f05_3g_customer_favorites',favoriteEvents:'f05_3g_favorite_events',customers:'customers',locks:'locks',transactions:'transactions',recommendations:'recommendations',priceUnlocks:'customer_price_cycle_unlocks',priceEvents:'customer_price_unlock_events',images:'vehicle_images',visibility:'vehicle_visibility_grants',priceHistory:'vehicle_price_history'};
 const result={};
 for(const [name,[filter,params]] of Object.entries(tables)){
  const data=(await rows('SELECT row_to_json(t) record FROM public.'+names[name]+' t WHERE '+filter+' ORDER BY to_jsonb(t)::text',params)).map(x=>x.record);
  result[name]={rows:data.length,sha256:sha(data)};
 }
 return {tables:result,sha256:sha(result)};
};
let admin,employee,four,token,credentialId,vid,cycle,before,afterConversion,conversionEvent;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [name,password,kind] of [['admin_test','SyntheticAdmin_1234567','admin'],['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],['four_s_test','SyntheticFourS_123456','four']]){
  const a=await auth.login({login:name,password,source:'f05-3k-isolated-multi-service'});assert.equal(a.code,'AUTH_OK');
  if(kind==='admin')admin=a.token;else if(kind==='employee')employee=a.token;else four=a.token;
 }
 const p=await issueCredential(auth,admin,{eventKey:ev('system-admin-issued-api-key')});
 assert.equal(p.allowed,true,JSON.stringify(p));token=p.token;credentialId=p.credentialId;
 for(const action of ['upsert','offline','current'])
  assert.equal((await setApiEnabled(auth,admin,{action,enabled:true,eventKey:ev('enable-'+action)})).allowed,true);
 const x=(await rows("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages WHERE source_platform='JYT' AND car_code=$1",[car]))[0];
 assert.ok(x,'original trusted F05-3C stage I JYT import must exist');vid=Number(x.vehicle_id);cycle=Number(x.current_cycle_id);
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1)",[customer]);
 await db.query("INSERT INTO public.recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id,recommender_employee_id,status) VALUES(899993,$1,$2,$3,1,'active')",[customer,vid,cycle]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(899994,$1,$2,$3,'f05-3k-synthetic-existing-only')",[customer,vid,cycle]);
 await db.query("INSERT INTO public.vehicle_images(image_id,vehicle_id,relative_path,source_url_fact,asset_storage_status) VALUES(899995,$1,'source/JYT/F05K-ORIGINAL','synthetic-upstream-relative-source','pending')",[vid]);
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('K-A01 true v19 PG16 signed chain, independent SystemAdmin source versus Employee/4S',async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const wrong of [admin,employee,four,'jyt-original-login-token']){
  assert.equal((await syncUpsert(auth,wrong,dto('unauthorized-import'))).allowed,false);
 }
 assert.equal((await issueCredential(auth,employee,{eventKey:ev('employee-fake-issuer')})).allowed,false);
});
test('K-A02 genuine original JYT syncUpsert v19 source and existing Favorite before conversion',async()=>{
 const imported=await syncUpsert(auth,token,dto('original-jyt-sync-v19'));
 assert.equal(imported.allowed,true,JSON.stringify(imported));
 assert.equal(imported.vehicleId,vid);assert.equal(imported.listingCycleId,cycle);
 assert.deepEqual(await counts(),{vehicle_count:1,cycle_count:1,conversion_count:0});
 const add=await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vid,action:'ADD',eventKey:ev('favorite-committed-before-conversion')});
 assert.equal(add.code,'F05_3G_APPLIED');
 assert.equal((await rows('SELECT count(*)::int n FROM public.f05_3g_favorite_events WHERE vehicle_id=$1',[vid]))[0].n,1);
 before=await snapshot();
 const unauthorized=await convertWholesaleToMingbang(auth,employee,{vehicleId:vid,teamId:901,eventKey:ev('favorite-never-grants-owner')});
 assert.deepEqual(unauthorized,{allowed:false,code:SOURCE_GAP});
 assert.deepEqual(await snapshot(),before);
});
test('K-A03 real active Lock, original conversion and TWO backend advisory lock conflict',async()=>{
 const scope=await db.query("UPDATE public.locks SET expires_at=now()+interval '2 hours' WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND responsible_employee_id=1 RETURNING lock_id",[vid,cycle]);
 assert.equal(scope.rowCount,1,'valid original current business Lock must preexist');
 before=await snapshot();
 conversionEvent=ev('one-legitimate-employee-conversion');
 let resume,entered,pid;
 const held=new Promise(ok=>resume=ok),signal=new Promise(ok=>entered=ok);
 const pending=convertWholesaleToMingbang(auth,employee,{vehicleId:vid,teamId:901,eventKey:conversionEvent},
  {checkpoint:async(stage,c)=>{assert.equal(stage,'employee_and_source_physically_locked');pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);entered();await held;}});
 await Promise.race([signal,pending.then(()=>{throw Error('conversion failed to enter real PG16 checkpoint')})]);
 const other=await connect();
 try{
  const pid2=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  assert.notEqual(pid2,pid);
  await other.query('BEGIN');await other.query("SET LOCAL lock_timeout='240ms'");
  await assert.rejects(()=>other.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+car]),e=>e.code==='55P03');
  console.log('F05_3K_NATIVE_CONVERSION_JYT_LOCK_55P03',JSON.stringify({distinctBackends:true,sqlstate:'55P03'}));
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();resume()}
 const out=await pending;
 assert.equal(out.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE',JSON.stringify(out));
 assert.equal(out.vehicleId,vid);assert.equal(out.listingCycleId,cycle);
 afterConversion=await snapshot();
 for(const k of Object.keys(before.tables).filter(x=>!['vehicles','conversions','conversionAudit'].includes(x)))
  assert.deepEqual(afterConversion.tables[k],before.tables[k],'old carrier changed: '+k);
 assert.deepEqual((await rows('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0],
  {source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.deepEqual(await counts(),{vehicle_count:1,cycle_count:1,conversion_count:1});
 console.log('F05_3K_REAL_V19_FAVORITE_BEFORE_CONVERSION',JSON.stringify({favoriteEventPreserved:true,sameVehicleCycle:true,sourceType:'mingbang'}));
});
test('K-A04 old carCode active replay is SUPPRESSED, no resurrection, immutable carrier byte hashes',async()=>{
 for(const name of ['post-conversion-active','out-of-order-old-active']){
  const out=await syncUpsert(auth,token,dto(name));
  assert.equal(out.allowed,false,JSON.stringify(out));
  assert.equal(out.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
  assert.deepEqual(await snapshot(),afterConversion);
 }
 assert.deepEqual(await counts(),{vehicle_count:1,cycle_count:1,conversion_count:1});
});
test('K-A05 old converted code with conflicting source model cannot become a second wholesale identity',async()=>{
 const p=await syncUpsert(auth,token,dto('post-conversion-model-conflict',2023));
 assert.deepEqual(p,{allowed:false,code:'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED'});
 assert.deepEqual(await snapshot(),afterConversion);
});
test('K-A06 old JYT offline and current must never delete Mingbang, end Cycle, or show converted in wholesale list',async()=>{
 const p=await syncBatchOffline(auth,token,{eventKey:ev('post-conversion-batch-offline'),carCodes:[car]});
 assert.equal(p.allowed,true);assert.equal(p.count,0);
 const current=await syncCurrent(auth,token,{afterVehicleId:0,limit:50,eventKey:ev('current-wholesale-after-conversion')});
 assert.equal(current.allowed,true);assert.equal(current.items.some(x=>x.vehicleId===vid),false);
 assert.deepEqual(await snapshot(),afterConversion);
});
test('K-A07 suppressed source receipt can be retried, no event collision or conversion replay',async()=>{
 const same=await syncUpsert(auth,token,dto('post-conversion-active'));
 assert.equal(same.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
 const changed={...dto('post-conversion-active'),modelYear:2024};
 assert.equal((await syncUpsert(auth,token,changed)).code,'F05_3B_EVENT_KEY_PAYLOAD_COLLISION');
 assert.equal((await convertWholesaleToMingbang(auth,employee,{vehicleId:vid,teamId:901,eventKey:conversionEvent})).code,'F05_3C_SAME_EVENT_ALREADY_CONVERTED');
 assert.equal((await convertWholesaleToMingbang(auth,employee,{vehicleId:vid,teamId:901,eventKey:ev('second-conversion') })).allowed,false);
 assert.deepEqual(await snapshot(),afterConversion);
});
test('K-A08 revoked API token, wrong Employee and forged publisher cannot mutate converted Vehicle',async()=>{
 const revoked=await revokeCredential(auth,admin,{credentialId,eventKey:ev('revoke-legitimate-key'),version:1});
 assert.equal(revoked.allowed,true,JSON.stringify(revoked));
 assert.equal((await syncUpsert(auth,token,dto('revoked-credential-replay'))).allowed,false);
 assert.equal((await convertWholesaleToMingbang(auth,four,{vehicleId:vid,teamId:901,eventKey:ev('four-s-denied')})).allowed,false);
 assert.equal((await convertWholesaleToMingbang(auth,admin,{vehicleId:vid,teamId:901,eventKey:ev('admin-denied')})).allowed,false);
 assert.deepEqual(await snapshot(),afterConversion);
});
test('K-A09 historical favorite events and conversion irreversible, physical SQL reversal denied',async()=>{
 await assert.rejects(()=>db.query("UPDATE public.vehicles SET source_type='wholesale',source_sale_status='active' WHERE vehicle_id=$1",[vid]),/F05_3C_WHOLESALE_SOURCE_REVERSAL_FORBIDDEN/);
 await assert.rejects(()=>db.query('UPDATE public.f05_3g_favorite_events SET event_key=$1 WHERE vehicle_id=$2',[ev('illegal-event-alter'),vid]),/F05_3G_FAVORITE_EVENT_IMMUTABLE/);
 assert.deepEqual(await snapshot(),afterConversion);
});
test('K-A10 native complete PG16 relation SHA and immutable receipt outcomes archived for A review',async()=>{
 const snap=await snapshot();assert.deepEqual(snap,afterConversion);
 const receipts=(await rows('SELECT action,outcome,event_key,vehicle_id FROM public.f05_3b_sync_receipts WHERE car_code=$1 ORDER BY event_key',[car]))
  .map(({action,outcome,event_key,vehicle_id})=>({action,outcome,eventHash:sha(event_key),vehicleId:vehicle_id}));
 assert.ok(receipts.some(x=>x.outcome==='CONVERTED_SUPPRESSED'));
 await mkdir(new URL('../artifacts/source/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/source/verified-converted-replay-snapshots.json',import.meta.url),
  JSON.stringify({beforeConversion:before,afterConversion,afterAllReplay:snap,receipts,shaPreservedAfterReplay:true,
   sourceGap:['CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP','GENERAL_WHOLESALE_VEHICLE_SCOPE_SOURCE_GAP_PENDING_PRODUCT_DECISION','IMAGE_LOCALIZATION_SOURCE_GAP','HIDE_REASON_RECALCULATION_SOURCE_GAP']},null,2)+'\n');
 console.log('F05_3K_ORIGINAL_SERVICES_REPLAY_GUARD_CONFIRMED',JSON.stringify({converted:true,sourceSuppressed:true,carriersUnchanged:true,replayCount:receipts.length}));
});
