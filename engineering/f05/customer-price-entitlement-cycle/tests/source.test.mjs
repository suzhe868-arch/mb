import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect,verify,checksum,ID} from '../migration.mjs';
import {syntheticCustomerContext,syntheticCustomerPrice,employeeTemporaryAddAttempt} from '../service.mjs';
const db=await connect();
const cid=899411,other=899412;
const iso='2026-10-12T10:00:00.000Z',beforeMidnight='2026-10-12T15:59:59.000Z',afterMidnight='2026-10-12T16:00:00.000Z';
const ev=x=>'f05-4-ci-customer-price-'+x;
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const query=(sql,values=[])=>db.query(sql,values).then(x=>x.rows);
const intent=(mode,customer=cid)=>syntheticCustomerContext(customer,mode);
const req=(v,n,at=iso)=>({vehicleId:v.vehicleId,listingCycleId:v.cycle,idempotencyKey:ev(n),nowIso:at});
const price=(ctx,v,n,at=iso)=>syntheticCustomerPrice(db,ctx,req(v,n,at));
const limit=intent('DETAIL'),list=intent('LIST'),prefetch=intent('PREFETCH');
let vehicles,main,second,third,sign,pre;
const sums=async()=>{
 const x=await query("SELECT business_day_shanghai::text AS business_date,base_quota,temp_additions,consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=$1 ORDER BY business_day_shanghai",[cid]);
 const events=await query("SELECT vehicle_id,listing_cycle_id,business_day_shanghai::text AS business_date,event_kind FROM public.customer_price_unlock_events WHERE customer_id=$1 ORDER BY unlock_event_id",[cid]);
 const rights=await query("SELECT vehicle_id,listing_cycle_id,grant_origin FROM public.customer_price_cycle_unlocks WHERE customer_id=$1 ORDER BY unlock_id",[cid]);
 return {ledger:x,events,rights,digest:sha([x,events,rights])};
};
test.before(async()=>{
 sign=await verify(db);assert.equal(sign.verified,true);
 await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(2,'f05-4-ci-unlimited') ON CONFLICT(level_id) DO NOTHING");
 await db.query("INSERT INTO public.f05_4_level_price_policy_ci(level_id,price_mode,daily_base_quota) VALUES(1,'LIMITED',2),(2,'UNLIMITED',0)");
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1),($2,'active',1,'assigned',1)",[cid,other]);
 const v=await query("SELECT v.vehicle_id,l.current_cycle_id cycle FROM public.f05_3b_sync_lineages l JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id JOIN public.vehicle_listing_cycles c ON c.listing_cycle_id=l.current_cycle_id AND c.vehicle_id=v.vehicle_id WHERE l.source_platform='JYT' AND v.source_type='wholesale' AND v.source_sale_status='active' AND c.ended_at IS NULL ORDER BY v.vehicle_id LIMIT 8");
 vehicles=v.map(x=>({vehicleId:Number(x.vehicle_id),cycle:Number(x.cycle)}));
 assert.ok(vehicles.length>=3,'3 real previously imported JYT wholesale vehicles required');
 [main,second,third]=vehicles;
 for(const v of vehicles)await db.query("INSERT INTO public.f05_4_current_price_ci(vehicle_id,listing_cycle_id,customer_display_cents) VALUES($1,$2,12800000)",[v.vehicleId,v.cycle]);
 await db.query("UPDATE public.f05_4_current_price_ci SET customer_display_cents=NULL WHERE vehicle_id=$1 AND listing_cycle_id=$2",[main.vehicleId,main.cycle]);
});
test.after(async()=>{await db.end()});
test('4-A01 exact v20 signed new catalog, historical v19 and v18 seal, unsigned pricing source isolated',async()=>{
 assert.equal((await verify(db)).verified,true);assert.equal(sign.id,ID);assert.match(checksum,/^[0-9a-f]{64}$/);
 assert.equal((await query('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,18);
 assert.equal((await query('SELECT count(*)::int n FROM public.f05_4_migration_attestation'))[0].n,1);
});
test('4-A02 synthetic Customer context cannot be caller supplied or re-used across arbitrary IDs',async()=>{
 const p=req(main,'forged-customer-id');
 assert.equal((await syntheticCustomerPrice(db,{customerId:cid,entry:'DETAIL'},p)).code,'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP');
 assert.equal((await syntheticCustomerPrice(db,{},p)).code,'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP');
 assert.equal((await employeeTemporaryAddAttempt(null,null,{customerId:cid,extra:999})).code,'F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP');
});
test('4-A03 no signed synthetic numeric current display price returns price consultation and ZERO debit',async()=>{
 const out=await price(limit,main,'no-digital-price');
 assert.equal(out.code,'PRICE_CONSULTATION');
 assert.deepEqual((await sums()).events,[]);
});
test('4-A04 only explicit synthetic active DETAIL is eligible, list/prefetch/cache cannot charge or show LIMITED exact',async()=>{
 await db.query('UPDATE public.f05_4_current_price_ci SET customer_display_cents=12800000 WHERE vehicle_id=$1 AND listing_cycle_id=$2',[main.vehicleId,main.cycle]);
 assert.equal((await price(list,main,'list-must-hide')).code,'LIMITED_LIST_PRICE_HIDDEN');
 for(const mode of ['PREFETCH','CACHE','BACKGROUND'])
  assert.equal((await price(intent(mode),main,'not-active-'+mode)).code,'F05_4_NON_INTERACTIVE_DETAIL_NO_UNLOCK');
 assert.equal((await sums()).events.length,0);
});
test('4-A05 LIMITED first successful active DETAIL consumes exactly once and creates cycle right and immutable event',async()=>{
 const before=await sums();assert.equal(before.ledger.length,0);
 const charged=await price(limit,main,'detail-first-one');
 assert.deepEqual(charged,{code:'DIGITAL_PRICE',customerDisplayCents:12800000,source:'SYNTHETIC_CI_ONLY',charged:true,mode:'LIMITED'});
 const post=await sums();assert.equal(post.events.length,1);assert.equal(post.rights.length,1);assert.equal(post.ledger[0].consumed_count,1);
});
test('4-A06 retry with same or different key on same cycle does not double-consume; latest valid price is returned',async()=>{
 await db.query('UPDATE public.f05_4_current_price_ci SET customer_display_cents=13600000 WHERE vehicle_id=$1 AND listing_cycle_id=$2',[main.vehicleId,main.cycle]);
 for(const event of ['detail-first-one','same-cycle-different-event']){
  const x=await price(limit,main,event);assert.equal(x.code,'DIGITAL_PRICE');assert.equal(x.charged,false);assert.equal(x.customerDisplayCents,13600000);
 }
 assert.equal((await sums()).events.length,1);
});
test('4-A07 real two independent PG16 connections serialise Customer lock, only one same-cycle charge',async()=>{
 const a=await connect(),b=await connect();
 try{
  const [pidA,pidB]=await Promise.all([a.query('SELECT pg_backend_pid() pid'),b.query('SELECT pg_backend_pid() pid')]);
  assert.notEqual(pidA.rows[0].pid,pidB.rows[0].pid);
  const outputs=await Promise.all([
   syntheticCustomerPrice(a,limit,req(second,'real-concurrent-backend-a')),
   syntheticCustomerPrice(b,limit,req(second,'real-concurrent-backend-b'))
  ]);
  assert.deepEqual(outputs.map(x=>x.charged).sort(),[false,true]);
  console.log('F05_4_2_INDEPENDENT_PG16_BACKENDS_SINGLE_ATOMIC_CHARGE',JSON.stringify({pgBackendDistinct:true,chargedExactlyOnce:true}));
 }finally{await a.end();await b.end();}
 assert.equal((await sums()).events.length,2);
 assert.equal((await sums()).ledger[0].consumed_count,2);
});
test('4-A08 quota exhausted for third wholesale vehicle: --万; no new charge',async()=>{
 const x=await price(limit,third,'quota-exhausted-third');
 assert.deepEqual(x,{code:'DAILY_PRICE_QUOTA_EXHAUSTED',display:'--万'});
 assert.equal((await sums()).events.length,2);
});
test('4-A09 LIMITED→UNLIMITED does not add debit or evergreen cycle unlock rights',async()=>{
 await db.query('UPDATE public.customers SET customer_level_id=2 WHERE customer_id=$1',[cid]);
 const before=await sums();
 for(const v of [third,main]){
  for(const mode of ['LIST','DETAIL']){const x=await price(intent(mode),v,'unlimited-'+v.vehicleId+'-'+mode);assert.equal(x.mode,'UNLIMITED');assert.equal(x.charged,false);}
 }
 assert.deepEqual(await sums(),before);
});
test('4-A10 3A current-day temp additions survive UNLIMITED, and LIMITED restores without clearing consumption',async()=>{
 await db.query("UPDATE public.customer_day_quota_ledger SET temp_additions=3 WHERE customer_id=$1 AND business_day_shanghai='2026-10-12'",[cid]);
 const during=await sums();assert.equal(during.ledger[0].temp_additions,3);assert.equal(during.ledger[0].consumed_count,2);
 await db.query('UPDATE public.customers SET customer_level_id=1 WHERE customer_id=$1',[cid]);
 const x=await price(limit,third,'third-after-3a');
 assert.equal(x.code,'DIGITAL_PRICE');assert.equal(x.charged,true);
 const after=await sums();assert.equal(after.ledger[0].temp_additions,3);assert.equal(after.ledger[0].consumed_count,3);
});
test('4-A11 UTC+8 midnight rollover starts independent quota day, never erases prior ledger or cycle unlock',async()=>{
 const a=await price(intent('DETAIL',other),main,'other-before-midnight',beforeMidnight);
 assert.equal(a.code,'DIGITAL_PRICE');assert.equal(a.charged,true);
 const b=await price(intent('DETAIL',other),second,'other-after-midnight',afterMidnight);
 assert.equal(b.code,'DIGITAL_PRICE');assert.equal(b.charged,true);
 const days=await query("SELECT business_day_shanghai::text AS business_date,consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=$1 ORDER BY business_day_shanghai",[other]);
 assert.deepEqual(days.map(x=>x.business_date),['2026-10-12','2026-10-13']);
 assert.deepEqual(days.map(x=>x.consumed_count),[1,1]);
});
test('4-A12 explicit key collision across another Customer/Vehicle cannot grant entitlement',async()=>{
 const x=await price(limit,second,'detail-first-one');
 assert.equal(x.code,'F05_4_IDEMPOTENCY_KEY_COLLISION');
});
test('4-A13 Customer disable pauses both UNLIMITED and established cycle rights, history stays immutable',async()=>{
 const before=await sums();
 await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=$1",[cid]);
 assert.equal((await price(limit,main,'inactive-must-not-read')).code,'F05_4_CUSTOMER_INACTIVE_OR_UNKNOWN');
 assert.deepEqual(await sums(),before);
 await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[cid]);
 assert.equal((await price(limit,main,'restore-same-cycle')).charged,false);
});
test('4-A14 fee-free source: Recommendation FK identity does not itself prove issuer; fail closed not consume',async()=>{
 const v=third;
 await db.query("INSERT INTO public.recommendations(recommendation_id,customer_id,vehicle_id,listing_cycle_id,recommender_employee_id,status) VALUES(899413,$1,$2,$3,1,'active')",[other,v.vehicleId,v.cycle]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(customer_id,vehicle_id,listing_cycle_id,grant_origin,source_recommendation_id) VALUES($1,$2,$3,'recommendation',899413) ON CONFLICT DO NOTHING",[other,v.vehicleId,v.cycle]);
 const before=await sums();
 assert.equal((await price(intent('DETAIL',other),v,'untrusted-recommendation-source')).code,'F05_4_RECOMMENDATION_GRANT_ISSUER_SOURCE_GAP');
 assert.deepEqual(await sums(),before);
});
test('4-A15 historic debit event UPDATE/DELETE immutable and current v20 checksum tamper rejected',async()=>{
 await assert.rejects(()=>db.query("UPDATE public.customer_price_unlock_events SET idempotency_key='f05-4-fake-mutated-event' WHERE customer_id=$1",[cid]),/F05_4_SUCCESSFUL_CHARGE_EVENT_IMMUTABLE/);
 const old=(await query('SELECT checksum FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]))[0].checksum;
 try{
  await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',['0'.repeat(64),ID]);
  await assert.rejects(()=>verify(db),/F05_4_V20_CHECKSUM_TAMPERED/);
 }finally{await db.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',[old,ID]);}
 assert.equal((await verify(db)).verified,true);
});
test('4-A16 archive signed PG16 evidence without any real personal data or production Customer session',async()=>{
 const x=await sums();
 assert.ok(x.events.length>=3);
 await mkdir(new URL('../artifacts/source/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/source/real-daily-ledger-and-cycle-evidence.json',import.meta.url),
  JSON.stringify({versionSeal:sign,current:await verify(db),syntheticOnly:true,productionCustomerSession:false,priceSourceSigned:false,employeeTemporaryAdditionSourceSigned:false,customerIdHashed:sha(cid),dailyLedger:x.ledger,cycleEvents:x.events.map(e=>({day:e.business_date,kind:e.event_kind})),ledgerSHA256:sha(x.ledger),rightsSHA256:sha(x.rights),rightsCount:x.rights.length},null,2)+'\n');
 console.log('F05_4_LIMITED_UNLIMITED_3A_UTC8_REAL_PG16_CI_ONLY');
});
