import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../favorite-physical-carrier/migration.mjs';
import {verify as verifyV17} from '../../jyt-wholesale-lineage-cycle/migration.mjs';
import {issueCredential,setApiEnabled,syncUpsert,syncBatchOffline,syncCurrent,revokeCredential} from '../../jyt-wholesale-lineage-cycle/contract.mjs';
import {syntheticFavoriteChange} from '../../favorite-physical-carrier/service.mjs';

const db=await connect(),secret=randomBytes(32),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48983'});
const car='JYT-F05J-SOURCE-2026',customer=899971,other=899972,ev=x=>'f05-3j-real-pg16-'+x;
const dto=(name,state='active')=>({eventKey:ev(name),carCode:car,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const records=async(sql,params=[])=> (await db.query(sql,params)).rows;
const favorite=()=>records('SELECT row_to_json(t) AS record FROM public.f05_3g_customer_favorites t WHERE vehicle_id=$1 ORDER BY favorite_id',[vid]);
const history=()=>records('SELECT row_to_json(t) AS record FROM public.f05_3g_favorite_events t WHERE vehicle_id=$1 ORDER BY event_id',[vid]);
const rights=cy=>records('SELECT row_to_json(t) AS record FROM public.customer_price_cycle_unlocks t WHERE vehicle_id=$1 AND listing_cycle_id=$2 ORDER BY unlock_id',[vid,cy]);
const priceEvents=cy=>records('SELECT row_to_json(t) AS record FROM public.customer_price_unlock_events t WHERE vehicle_id=$1 AND listing_cycle_id=$2 ORDER BY unlock_event_id',[vid,cy]);
let admin,employee,four,token,cred,vid,oldCycle,newCycle,pre,preHistory,preRights,preEvents,oldCycleBefore,sourceLineage;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 await assert.rejects(()=>verifyV17(db),/F05_3B_FROZEN_000016_REQUIRED/);
 for(const [u,p,kind] of [['admin_test','SyntheticAdmin_1234567','admin'],['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],['four_s_test','SyntheticFourS_123456','four']]){
  const r=await auth.login({login:u,password:p,source:'f05-3j-signed-ci'});
  assert.equal(r.code,'AUTH_OK');if(kind==='admin')admin=r.token;if(kind==='employee')employee=r.token;if(kind==='four')four=r.token;
 }
 const issue=await issueCredential(auth,admin,{eventKey:ev('issue-ci-admin-source')});
 assert.equal(issue.allowed,true);token=issue.token;cred=issue.credentialId;
 for(const action of ['upsert','offline','current']){
  const c=await setApiEnabled(auth,admin,{action,enabled:true,eventKey:ev('enable-'+action)});
  assert.equal(c.allowed,true);
 }
 const row=await syncUpsert(auth,token,dto('initial-active'));
 assert.equal(row.code,'F05_3B_IMPORTED',JSON.stringify(row));
 vid=row.vehicleId;oldCycle=row.listingCycleId;
 await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[vid]);
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1),($2,'active',1,'assigned',1)",[customer,other]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(899973,$1,$2,$3,'synthetic-v19-old-cycle-only')",[customer,vid,oldCycle]);
 // Independently committed LIMITED unlock charge belongs ONLY to original ListingCycle.
 await db.query("INSERT INTO public.customer_price_unlock_events(unlock_event_id,idempotency_key,customer_id,vehicle_id,listing_cycle_id,business_day_shanghai,event_kind) VALUES(899974,$1,$2,$3,$4,(now() AT TIME ZONE 'Asia/Shanghai')::date,'successful_limited_charge')",[ev('real-price-charge-old-cycle'),customer,vid,oldCycle]);
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('J-A01 genuine v19 structure and admin-issued source separate from PC Employee/4S',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await issueCredential(auth,employee,{eventKey:ev('employee-denied') })).allowed,false);
 assert.equal((await issueCredential(auth,four,{eventKey:ev('four-denied') })).allowed,false);
 assert.equal((await syncUpsert(auth,admin,dto('pc-token-denied'))).allowed,false);
 assert.equal((await syncUpsert(auth,'jyt_login_token',dto('upstream-token-denied'))).allowed,false);
});
test('J-A02 already existing v19 Favorite ADD Current/Event before offline, old cycle has price grant',async()=>{
 const x=await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vid,action:'ADD',eventKey:ev('favorite-before-offline')});
 assert.equal(x.code,'F05_3G_APPLIED');
 pre=hash(await favorite());preHistory=hash(await history());
 preRights=hash(await rights(oldCycle));preEvents=hash(await priceEvents(oldCycle));
 oldCycleBefore=(await records('SELECT row_to_json(c) AS record FROM public.vehicle_listing_cycles c WHERE c.listing_cycle_id=$1',[oldCycle]))[0].record;
 sourceLineage=(await records('SELECT row_to_json(l) AS record FROM public.f05_3b_sync_lineages l WHERE l.vehicle_id=$1',[vid]))[0].record;
 assert.equal((await favorite()).length,1);assert.equal((await history()).length,1);
 assert.equal((await rights(oldCycle)).length,1);
 assert.equal((await records('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0].source_sale_status,'active');
});
test('J-A03 authenticated JYT bulk offline closes only prior cycle and preserves complete Favorite history',async()=>{
 const out=await syncBatchOffline(auth,token,{eventKey:ev('source-offline'),carCodes:[car]});
 assert.equal(out.count,1,JSON.stringify(out));
 const old=(await records('SELECT ended_at,end_reason,started_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1',[oldCycle]))[0];
 assert.ok(old.ended_at);assert.equal(old.end_reason,'upstream_offline');
 assert.equal(new Date(old.started_at).getTime(),new Date(oldCycleBefore.started_at).getTime());
 assert.equal(hash(await favorite()),pre);assert.equal(hash(await history()),preHistory);
 assert.equal(hash(await rights(oldCycle)),preRights);assert.equal(hash(await priceEvents(oldCycle)),preEvents);
 assert.equal((await records('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0].platform_visibility,'hidden');
 const current=await syncCurrent(auth,token,{afterVehicleId:0,limit:50,eventKey:ev('offline-hidden-from-current')});
 assert.equal(current.allowed,true);assert.equal(current.items.some(x=>x.vehicleId===vid),false);
});
test('J-A04 same batch offline event stays idempotent, distinct offline event cannot duplicate end',async()=>{
 assert.equal((await syncBatchOffline(auth,token,{eventKey:ev('source-offline'),carCodes:[car]})).count,1);
 assert.equal((await syncBatchOffline(auth,token,{eventKey:ev('repeated-state-new-event'),carCodes:[car]})).count,0);
 assert.equal((await records('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid]))[0].n,1);
});
test('J-A05 actual v19 signed JYT active relist keeps vehicle and historical Favorite but creates new cycle',async()=>{
 const up=await syncUpsert(auth,token,dto('genuine-new-cycle','active'));
 assert.equal(up.code,'F05_3B_RELISTED',JSON.stringify(up));
 assert.equal(up.vehicleId,vid);assert.notEqual(up.listingCycleId,oldCycle);
 newCycle=up.listingCycleId;
 const all=await records('SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 ORDER BY listing_cycle_id',[vid]);
 assert.equal(all.length,2);assert.equal(Number(all[0].listing_cycle_id),oldCycle);assert.ok(all[0].ended_at);assert.equal(all[1].ended_at,null);
 const v=(await records('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0];
 assert.deepEqual(v,{source_type:'wholesale',source_sale_status:'active',platform_visibility:'hidden'});
 const line=(await records('SELECT vehicle_id,current_cycle_id,source_platform,car_code FROM public.f05_3b_sync_lineages WHERE vehicle_id=$1',[vid]))[0];
 assert.equal(Number(line.current_cycle_id),newCycle);assert.equal(line.source_platform,'JYT');assert.equal(line.car_code,car);
 assert.equal(hash(await favorite()),pre);assert.equal(hash(await history()),preHistory);
 assert.equal(hash(await rights(oldCycle)),preRights);assert.equal(hash(await priceEvents(oldCycle)),preEvents);
 assert.deepEqual(await rights(newCycle),[]);assert.deepEqual(await priceEvents(newCycle),[]);
 await mkdir(new URL('../artifacts/source/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/source/verified-cycle-favorite-preservation.json',import.meta.url),JSON.stringify({favoriteCurrentBeforeSha256:pre,favoriteCurrentAfterSha256:hash(await favorite()),favoriteEventsBeforeSha256:preHistory,favoriteEventsAfterSha256:hash(await history()),oldCycleRightsBeforeSha256:preRights,oldCycleRightsAfterSha256:hash(await rights(oldCycle)),oldCycleId:oldCycle,newCycleDistinct:true,sameVehicle:true,oldCycleEnded:true,newCyclePriceGrants:0,newCyclePriceEvents:0,hiddenUnchanged:true,historyUnchanged:true},null,2)+'\n');
 console.log('F05_3J_EXISTING_FAVORITE_REAL_OFFLINE_RELIST_CYCLE_PRESERVED',JSON.stringify({sameVehicle:true,differentCycle:true,favoriteCurrentHashEqual:true,eventHistoryHashEqual:true,noPriceCarryover:true,hidden:true}));
});
test('J-A06 replay and core model mismatch cannot duplicate Vehicle or new Cycle',async()=>{
 assert.equal((await syncUpsert(auth,token,dto('genuine-new-cycle'))).code,'F05_3B_EVENT_ALREADY_PROCESSED');
 const tampered={...dto('forged-model'),modelYear:2024};
 assert.equal((await syncUpsert(auth,token,tampered)).allowed,false);
 assert.equal((await records('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid]))[0].n,2);
 assert.equal(hash(await favorite()),pre);
});
test('J-A07 price entitlement is scoped to old Cycle only, hidden cannot be promoted by Favorite',async()=>{
 const old=await records('SELECT customer_id,vehicle_id,listing_cycle_id FROM public.customer_price_cycle_unlocks WHERE vehicle_id=$1',[vid]);
 assert.equal(old.length,1);assert.equal(Number(old[0].listing_cycle_id),oldCycle);
 assert.equal((await records('SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,newCycle]))[0].n,0);
 assert.equal((await records('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0].platform_visibility,'hidden');
 assert.equal((await records('SELECT count(*)::int n FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[other,vid]))[0].n,0);
});
test('J-A08 two distinct PG16 backends contend actual JYT lineage lock with native SQLSTATE 55P03',async()=>{
 let release,signal,pid;const held=new Promise(ok=>release=ok),entered=new Promise(ok=>signal=ok);
 const pending=syncUpsert(auth,token,dto('locked-current-real'),{checkpoint:async(label,c)=>{assert.equal(label,'source_locked');pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);signal();await held}});
 await Promise.race([entered,pending.then(()=>{throw Error('JYT_CHECKPOINT_NOT_HELD')})]);
 const otherDb=await connect();
 try{
  assert.notEqual(pid,Number((await otherDb.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  await otherDb.query('BEGIN');await otherDb.query("SET LOCAL lock_timeout='240ms'");
  await assert.rejects(()=>otherDb.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+car]),e=>e.code==='55P03');
 }finally{await otherDb.query('ROLLBACK').catch(()=>{});await otherDb.end();release()}
 assert.equal((await pending).allowed,true);
 assert.equal(hash(await favorite()),pre);
});
test('J-A09 signed v19 checksum committed tamper fails closed before any source receipt/change',async()=>{
 const id='000019_favorite_carrier_ci_only';
 const prev=(await records('SELECT checksum FROM public.f03_schema_migrations WHERE migration_id=$1',[id]))[0].checksum;
 const countBefore=(await records('SELECT count(*)::int n FROM public.f05_3b_sync_receipts'))[0].n;
 try{
  await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',['0'.repeat(64),id]);
  await assert.rejects(()=>syncUpsert(auth,token,dto('should-not-apply-drift')),/F05_3G_UNAUTHORIZED_VERSION/);
 }finally{await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',[prev,id])}
 assert.equal((await verify(db)).verified,true);
 assert.equal((await records('SELECT count(*)::int n FROM public.f05_3b_sync_receipts'))[0].n,countBefore);
});
test('J-A10 Favorite REMOVE/ADD after relist remains historical and isolated from cycle price rights',async()=>{
 const x=await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vid,action:'REMOVE',eventKey:ev('remove-after-new-cycle')});
 assert.equal(x.allowed,true);
 const y=await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vid,action:'ADD',eventKey:ev('readd-after-new-cycle')});
 assert.equal(y.allowed,true);
 assert.equal((await history()).length,3);
 assert.equal((await records('SELECT current_state FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2',[customer,vid]))[0].current_state,'active');
 assert.deepEqual(await rights(newCycle),[]);
 assert.equal((await records('SELECT count(*)::int n FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0].n,1);
});
