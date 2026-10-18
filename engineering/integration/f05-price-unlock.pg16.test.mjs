// PDM-10 real frozen F02 customer_day_quota_ledger+cycle_unlocks+successful events.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedPriceUnlockService} from '../src/f05-price-unlock-service.mjs';
import {createIsolatedPriceUnlockHandler} from '../src/f05-price-unlock-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:4,connectionTimeoutMillis:1200});
const writer=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1200});
const random=()=>randomBytes(32).toString('base64url'),digest=x=>createHash('sha256').update(x).digest('hex');
const limitedBearer=random(),unlimitedBearer=random(),otherBearer=random();
let srv,connected=false,fail;
try{
 await writer.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await writer.query('BEGIN');
 try{
  await writer.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(59302,'f05_test_unlimited')");
  await writer.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES"+
   "(59300,'active',59001,'owner_assignment_pending'),(59301,'active',59001,'owner_assignment_pending'),(59302,'active',59302,'owner_assignment_pending')");
  for(const [token,id] of [[limitedBearer,'59300'],[otherBearer,'59301'],[unlimitedBearer,'59302']])
   await writer.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[digest(token),id]);
  await writer.query("INSERT INTO public.f05_catalog_price_entitlement_test(level_id,price_access_mode,daily_base_quota,expires_at) VALUES"+
   "(59001,'LIMITED',1,statement_timestamp()+interval '20 minutes'),(59302,'UNLIMITED',0,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES"+
   "(59301,'wholesale','active','visible',statement_timestamp()),"+
   "(59302,'wholesale','active','visible',statement_timestamp()),"+
   "(59303,'wholesale','active','visible',statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES"+
   "(59301,59301,statement_timestamp()),(59302,59302,statement_timestamp()),(59303,59303,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES"+
   "(59001,59001,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59301,59301,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59302,59302,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59303,59303,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES"+
   "(59001,59001,'wholesale',12600000,statement_timestamp()+interval '20 minutes'),"+
   "(59301,59301,'wholesale',13100000,statement_timestamp()+interval '20 minutes'),"+
   "(59302,59302,'wholesale',NULL,statement_timestamp()+interval '20 minutes'),"+
   "(59303,59303,'wholesale',7200000,statement_timestamp()+interval '20 minutes')");
  await writer.query('COMMIT');
 }catch(e){await writer.query('ROLLBACK');throw e}
 srv=createServer(createFoundationHandler({priceUnlockHandler:createIsolatedPriceUnlockHandler(createIsolatedPriceUnlockService({pool,env:process.env}),process.env)}));
 await new Promise((ok,bad)=>{srv.once('error',bad);srv.listen(0,'127.0.0.1',ok)});
 const call=async(vehicleId='59001',bearer=limitedBearer,eventKey=random())=>{
  const res=await fetch('http://127.0.0.1:'+srv.address().port+'/api/v1/catalog/vehicles/'+vehicleId+'/customer-detail-entry',
   {method:'POST',headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey}});
  return {status:res.status,body:await res.json()};
 };
 await test('PG16 unknown bearer, disabled Customer and absent entitlement hard deny without price or quota events',async()=>{
  assert.equal((await call('59001',random())).status,401);
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59300");
  try{assert.equal((await call()).status,401)}
  finally{await writer.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59300")}
  await writer.query("DELETE FROM public.f05_catalog_price_entitlement_test WHERE level_id=59001");
  try{assert.equal((await call()).status,404)}
  finally{await writer.query("INSERT INTO public.f05_catalog_price_entitlement_test(level_id,price_access_mode,daily_base_quota,expires_at) VALUES(59001,'LIMITED',1,statement_timestamp()+interval '20 minutes')")}
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=59300')).rows[0].n,0);
 });
 await test('PG16 verified price consultation does not consume quota, create ledger or unlock',async()=>{
  const r=await call('59302');assert.equal(r.status,200);assert.equal(r.body.code,'PRICE_CONSULTATION');
  assert.equal(r.body.priceCents,null);assert.equal(r.body.charged,false);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.customer_day_quota_ledger WHERE customer_id=59300')).rows[0].n,0);
 });
 await test('PG16 hidden/expired/unverified price-proof cannot reveal any numeric amount or charge quota',async()=>{
  await writer.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=59301");
  try{assert.equal((await call('59301')).status,404)}
  finally{await writer.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=59301")}
  await writer.query("DELETE FROM public.f05_catalog_price_display_proof_test WHERE vehicle_id=59301");
  try{assert.equal((await call('59301')).status,404)}
  finally{await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(59301,59301,'wholesale',13100000,statement_timestamp()+interval '20 minutes')")}
 });
 const firstKey=random();
 await test('PG16 first LIMITED detail entry atomically charges one quota and stores exact current cycle right',async()=>{
  const r=await call('59001',limitedBearer,firstKey);
  assert.equal(r.status,200);assert.equal(r.body.code,'PRICE_UNLOCKED');assert.equal(r.body.priceCents,'12600000');
  assert.equal(r.body.charged,true);assert.equal(r.body.quotaRemaining,0);
  const ledger=(await writer.query("SELECT * FROM public.customer_day_quota_ledger WHERE customer_id=59300")).rows[0];
  assert.equal(ledger.base_quota,1);assert.equal(ledger.temp_additions,0);assert.equal(ledger.consumed_count,1);
  assert.equal(ledger.business_day_shanghai instanceof Date,true);
  const right=(await writer.query("SELECT grant_origin FROM public.customer_price_cycle_unlocks WHERE customer_id=59300 AND vehicle_id=59001 AND listing_cycle_id=59001")).rows[0];
  assert.equal(right.grant_origin,'limited_quota');
  const charge=(await writer.query("SELECT event_kind FROM public.customer_price_unlock_events WHERE idempotency_key=$1",[firstKey])).rows[0];
  assert.equal(charge.event_kind,'successful_limited_charge');
 });
 await test('PG16 repeat entry and current price change preserve unlock, return new price, no second charge',async()=>{
  const r=await call('59001',limitedBearer,firstKey);assert.equal(r.status,200);
  assert.equal(r.body.code,'PRICE_ALREADY_UNLOCKED');assert.equal(r.body.charged,false);
  await writer.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=13400000 WHERE vehicle_id=59001");
  const newer=await call('59001');assert.equal(newer.status,200);
  assert.equal(newer.body.priceCents,'13400000');assert.equal(newer.body.charged,false);
  assert.equal((await writer.query('SELECT consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=59300')).rows[0].consumed_count,1);
 });
 await test('PG16 exhausted LIMITED quota masks value as --万 rather than leaking numeric price or charging',async()=>{
  const r=await call('59301');assert.equal(r.status,200);
  assert.equal(r.body.code,'DAILY_PRICE_QUOTA_EXHAUSTED');assert.equal(r.body.priceDisplay,'--万');
  assert.equal(r.body.priceCents,null);assert.equal(r.body.charged,false);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=59300')).rows[0].n,1);
 });
 await test('PG16 UNLIMITED browsing never creates permanent cycle unlock or daily quota consumption',async()=>{
  const r=await call('59301',unlimitedBearer);assert.equal(r.status,200);
  assert.equal(r.body.code,'UNLIMITED_DISPLAY_PRICE');assert.equal(r.body.priceCents,'13100000');
  assert.equal(r.body.charged,false);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.customer_day_quota_ledger WHERE customer_id=59302')).rows[0].n,0);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=59302')).rows[0].n,0);
  const next=await call('59301',unlimitedBearer);
  assert.equal(next.body.charged,false);
 });
 await test('PG16 level quota increase is read from current test entitlement and next vehicle unlocks once',async()=>{
  await writer.query("UPDATE public.f05_catalog_price_entitlement_test SET daily_base_quota=2 WHERE level_id=59001");
  const r=await call('59301');assert.equal(r.status,200);assert.equal(r.body.code,'PRICE_UNLOCKED');
  assert.equal(r.body.charged,true);assert.equal(r.body.quotaRemaining,0);
  assert.equal((await writer.query('SELECT consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=59300')).rows[0].consumed_count,2);
 });
 await test('PG16 idempotency event key cannot cross Customer nor Vehicle / listing cycle',async()=>{
  assert.equal((await call('59303',limitedBearer,firstKey)).status,409);
  assert.equal((await call('59001',otherBearer,firstKey)).status,409);
 });
 await test('PG16 two simultaneous keys for the same Customer and Vehicle charge once',async()=>{
  const [a,b]=await Promise.all([call('59303',otherBearer),call('59303',otherBearer)]);
  assert.equal(a.status,200);assert.equal(b.status,200);
  assert.deepEqual([a.body.charged,b.body.charged].sort(),[false,true]);
  assert.equal((await writer.query('SELECT consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=59301')).rows[0].consumed_count,1);
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=59301 AND vehicle_id=59303")).rows[0].n,1);
 });
 await test('PG16 event failure rolls back quota, unlock, and event with retry of same key',async()=>{
  await writer.query("UPDATE public.f05_catalog_price_entitlement_test SET daily_base_quota=3 WHERE level_id=59001");
  const keyValue=random();
  await writer.query("CREATE FUNCTION public.f05_price_event_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_PRICE_EVENT_FAILURE'; END $$");
  await writer.query("CREATE TRIGGER f05_price_fail_inject BEFORE INSERT ON public.customer_price_unlock_events FOR EACH ROW EXECUTE FUNCTION public.f05_price_event_fail_test()");
  try{
   const bad=await call('59303',limitedBearer,keyValue);assert.equal(bad.status,503);
   assert.equal((await writer.query("SELECT consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=59300")).rows[0].consumed_count,2);
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=59300 AND vehicle_id=59303")).rows[0].n,0);
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE idempotency_key=$1",[keyValue])).rows[0].n,0);
  }finally{
   await writer.query('DROP TRIGGER f05_price_fail_inject ON public.customer_price_unlock_events');
   await writer.query('DROP FUNCTION public.f05_price_event_fail_test()');
  }
  const retried=await call('59303',limitedBearer,keyValue);assert.equal(retried.status,200);assert.equal(retried.body.charged,true);
 });
 await test('PG16 previous unlock remains across quota-day boundary; expired cycle right cannot unlock new cycle',async()=>{
  // Move current ledger to prior day to emulate UTC+8 boundary without changing server clock.
  await writer.query("UPDATE public.customer_day_quota_ledger SET business_day_shanghai=business_day_shanghai-interval '1 day' WHERE customer_id=59300");
  const same=await call('59001');assert.equal(same.status,200);assert.equal(same.body.charged,false);
  await writer.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=59001");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(59304,59001,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59001,59304,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(59001,59304,'wholesale',14000000,statement_timestamp()+interval '20 minutes')");
  try{
   const crossed=await call('59001',limitedBearer,firstKey);assert.equal(crossed.status,409);
   const fresh=await call('59001');assert.equal(fresh.status,200);assert.equal(fresh.body.charged,true);
   assert.equal(fresh.body.priceCents,'14000000');
   const ledgers=(await writer.query("SELECT consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=59300 ORDER BY business_day_shanghai")).rows;
   assert.deepEqual(ledgers.map(x=>x.consumed_count),[3,1]);
  }finally{
   await writer.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=59304");
   await writer.query("UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=59001");
  }
 });
}catch(e){fail=e}finally{
 if(srv)await new Promise((ok,bad)=>srv.close(e=>e?bad(e):ok()));
 if(connected)await writer.end();
 await pool.end();
}
if(fail)throw fail;
