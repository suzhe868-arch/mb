// F05 directory Customer price projection and deterministic search on real disposable PG16 + Node HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createCatalogService} from '../src/catalog-service.mjs';
import {createCatalogHandler} from '../src/catalog-http.mjs';
import {createIsolatedCatalogCustomerReadService} from '../src/f05-catalog-customer-read-service.mjs';
import {createIsolatedCatalogSearchService} from '../src/f05-catalog-search.mjs';
import {createIsolatedPriceUnlockService} from '../src/f05-price-unlock-service.mjs';
import {createIsolatedPriceUnlockHandler} from '../src/f05-price-unlock-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:8,connectionTimeoutMillis:1000,query_timeout:4000,statement_timeout:4000});
const writer=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1000,query_timeout:5000,statement_timeout:5000});
const sha=value=>createHash('sha256').update(value).digest('hex'),token=()=>randomBytes(32).toString('base64url'),key=()=>randomBytes(24).toString('base64url');
const limitedToken=token(),unlimitedToken=token();let server,connected=false,failure;
const vehicleIds=Array.from({length:20},(_,i)=>String(60310+i));
async function count(sql){return Number((await writer.query(sql)).rows[0].n)}
async function snapshot(){return {
 matches:await count('SELECT count(*)::int n FROM public.demand_match_results'),
 recommendations:await count('SELECT count(*)::int n FROM public.f05_recommendation_safe_customer_test'),
 unlocks:await count('SELECT count(*)::int n FROM public.customer_price_cycle_unlocks'),
 quota:await count('SELECT count(*)::int n FROM public.customer_day_quota_ledger')
}}
try{
 await writer.connect();connected=true;
 assert.equal(await probeIsolatedCatalog(pool),true,'fresh disposable PG16 schema must match the current manifest');
 await writer.query('BEGIN');
 try{
  await writer.query("INSERT INTO public.vehicle_brands(brand_id,brand_name) VALUES(60300,'目录搜索隔离品牌')");
  await writer.query("INSERT INTO public.vehicle_series(series_id,brand_id,series_name) VALUES(60300,60300,'目录搜索隔离车系')");
  await writer.query("INSERT INTO public.vehicle_models(model_id,brand_id,series_id,model_name,model_year,profile_status) VALUES(60300,60300,60300,'目录搜索2026款',2026,'incomplete'),(60301,60300,60300,'目录搜索2025款',2025,'incomplete')");
  await writer.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(60300,'catalog_limited'),(60301,'catalog_unlimited')");
  await writer.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES(60300,'active',60300,'owner_assignment_pending'),(60301,'active',60301,'owner_assignment_pending')");
  await writer.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,60300,statement_timestamp()+interval '20 minutes'),($2,60301,statement_timestamp()+interval '20 minutes')",[sha(limitedToken),sha(unlimitedToken)]);
  await writer.query("INSERT INTO public.f05_catalog_price_entitlement_test(level_id,price_access_mode,daily_base_quota,expires_at) VALUES(60300,'LIMITED',1,statement_timestamp()+interval '20 minutes'),(60301,'UNLIMITED',0,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(60390,59001,'active','receiving')");
  const rule=(word,mappedKey,mappedValue,status='enabled')=>writer.query("INSERT INTO public.f05_matching_dictionary_rules_test(token,mapped_key,mapped_value,scope_kind,status,created_by,updated_by) VALUES($1,$2,$3,'global',$4,60390,60390)",[word,mappedKey,mappedValue,status]);
  await rule('26款','minModelYear','2026');await rule('奥迪A6','brandId','60300');
  await rule('冲突','brandId','60300');await rule('冲突','brandId','60301');await rule('停用词','brandId','60300','disabled');
  for(let i=0;i<vehicleIds.length;i++){
   const id=vehicleIds[i],modelId=i===17?'60301':'60300',source=i===18?'mingbang':'wholesale';
   const status=source==='wholesale'?'active':'available',visibility=i===19?'hidden':'visible',price=i===16?null:String(12000000+i*100000);
   await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,$2,$3,$4,$5,statement_timestamp())",[id,source,status,visibility,modelId]);
   await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
   await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,$2,true,statement_timestamp()+interval '20 minutes')",[id,source]);
   await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,$2,$3,statement_timestamp()+interval '20 minutes')",[id,source,price]);
  }
  await writer.query('COMMIT');
 }catch(e){await writer.query('ROLLBACK');throw e}
 const customerReadService=createIsolatedCatalogCustomerReadService({pool,env:process.env});
 const searchService=createIsolatedCatalogSearchService({pool,env:process.env});
 const catalog=createCatalogService({pool,cursorKey:randomBytes(32),customerReadService,searchService});
 const unlock=createIsolatedPriceUnlockService({pool,env:process.env});
 server=createServer(createFoundationHandler({catalogHandler:createCatalogHandler(catalog),priceUnlockHandler:createIsolatedPriceUnlockHandler(unlock,process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const origin='http://127.0.0.1:'+server.address().port;
 const get=async(path,bearer=null)=>{const headers=bearer?{authorization:'Bearer '+bearer}:{};const res=await fetch(origin+path,{headers});return {status:res.status,body:await res.json()}};
 const detail=async(id,bearer=null)=>get('/api/v1/catalog/vehicles/'+id,bearer);
 const entry=async(id,bearer,eventKey=key())=>{const res=await fetch(origin+'/api/v1/catalog/vehicles/'+id+'/customer-detail-entry',{method:'POST',headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey}});return {status:res.status,body:await res.json()}};
 await test('PG16 anonymous projection preserves safe DTO and never emits price fields',async()=>{
  const r=await get('/api/v1/catalog/vehicles?source=wholesale');assert.equal(r.status,200);assert.equal(r.body.items[0].price,null);
  assert.equal('priceCents' in r.body.items[0],false);assert.equal(r.body.items.some(x=>Object.hasOwn(x,'vin')||Object.hasOwn(x,'phone')),false);
  const forgedHeader=await fetch(origin+'/api/v1/catalog/vehicles',{headers:{'x-customer-id':'60300'}});assert.equal(forgedHeader.status,403);
  const forgedQuery=await get('/api/v1/catalog/vehicles?customerId=60300');assert.equal(forgedQuery.status,400);
 });
 await test('PG16 deterministic search, numeric price range and cursor are read-only',async()=>{
  const before=await snapshot(),first=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款 奥迪A6'));
  assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.searchExpression,'26款;奥迪A6');assert.equal(first.body.items.length,15);
  assert.ok(first.body.nextCursor);assert.ok(first.body.items.every(x=>x.modelYear===2026));
  const cross=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款')+'&cursor='+encodeURIComponent(first.body.nextCursor));
  assert.equal(cross.status,400);assert.equal(cross.body.code,'INVALID_CURSOR');
  const second=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款 奥迪A6')+'&cursor='+encodeURIComponent(first.body.nextCursor));
  assert.equal(second.status,200);assert.equal(second.body.items.length,2);
  const priceCursor=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款 奥迪A6')+'&minPriceCents=12000000&maxPriceCents=13900000');
  assert.equal(priceCursor.status,200);assert.ok(priceCursor.body.nextCursor);
  const crossPrice=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款 奥迪A6')+'&minPriceCents=12000000&maxPriceCents=13899999&cursor='+encodeURIComponent(priceCursor.body.nextCursor));
  assert.equal(crossPrice.status,400);assert.equal(crossPrice.body.code,'INVALID_CURSOR');
  const ranged=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款 奥迪A6')+'&minPriceCents=12500000&maxPriceCents=12900000',limitedToken);
  assert.equal(ranged.status,200);assert.ok(ranged.body.items.length>0);assert.ok(ranged.body.items.every(x=>x.price===null));
  const unknown=await get('/api/v1/catalog/vehicles?q='+encodeURIComponent('完全未知'));
  assert.equal(unknown.status,409);assert.equal(unknown.body.reason,'RULE_PARSE_UNKNOWN_TOKEN');
  const conflict=await get('/api/v1/catalog/vehicles?q='+encodeURIComponent('冲突'));
  assert.equal(conflict.status,409);assert.equal(conflict.body.reason,'RULE_PARSE_SCOPE_CONFLICT');
  const disabled=await get('/api/v1/catalog/vehicles?q='+encodeURIComponent('停用词'));
  assert.equal(disabled.status,409);assert.equal(disabled.body.reason,'RULE_PARSE_UNKNOWN_TOKEN');
  await writer.query("UPDATE public.f05_matching_dictionary_rules_test SET mapped_value='2025',version=version+1,updated_at=statement_timestamp() WHERE token='26款'");
  const stale=await get('/api/v1/catalog/vehicles?source=wholesale&q='+encodeURIComponent('26款 奥迪A6')+'&cursor='+encodeURIComponent(first.body.nextCursor));
  assert.equal(stale.status,400);assert.equal(stale.body.code,'INVALID_CURSOR');
  await writer.query("UPDATE public.f05_matching_dictionary_rules_test SET mapped_value='2026',version=version+1,updated_at=statement_timestamp() WHERE token='26款'");
  assert.deepEqual(await snapshot(),before,'search must not create Demand, Match, Recommendation, unlock or quota side effects');
 });
 await test('PG16 LIMITED list hides digits; detail entry unlocks once; exhausted and consultation are distinct',async()=>{
  const list=await get('/api/v1/catalog/vehicles?source=wholesale',limitedToken);assert.equal(list.status,200);
  assert.ok(list.body.items.every(x=>x.price===null&&x.priceCents===null));
  assert.ok(list.body.items.every(x=>x.priceState==='PRICE_HIDDEN_LIMITED_LIST'||x.priceState==='PRICE_CONSULTATION'));
  const before=await count("SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=60300");
  const quotaBefore=await count("SELECT count(*)::int n FROM public.customer_day_quota_ledger WHERE customer_id=60300");
  const unlockBefore=await count("SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=60300");
  const notEntered=await detail('60310',limitedToken);assert.equal(notEntered.status,200);assert.equal(notEntered.body.vehicle.price,null);
  assert.equal(await count("SELECT count(*)::int n FROM public.customer_day_quota_ledger WHERE customer_id=60300"),quotaBefore);
  assert.equal(await count("SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=60300"),unlockBefore);
  assert.equal(notEntered.body.vehicle.priceState,'PRICE_DETAIL_ENTRY_REQUIRED');assert.equal(notEntered.body.vehicle.priceDisplay,'——万');
  const eventKey=key(),unlocked=await entry('60310',limitedToken,eventKey);
  assert.equal(unlocked.status,200,JSON.stringify(unlocked.body));assert.equal(unlocked.body.code,'PRICE_UNLOCKED');
  const visible=await detail('60310',limitedToken);assert.equal(visible.status,200);assert.equal(visible.body.vehicle.price,'12万');
  assert.equal(visible.body.vehicle.priceCents,'12000000');
  assert.equal((await entry('60310',limitedToken,eventKey)).status,200);
  assert.equal(await count("SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE customer_id=60300"),before+1);
  const exhausted=await detail('60311',limitedToken);assert.equal(exhausted.status,200);
  assert.equal(exhausted.body.vehicle.priceState,'DAILY_PRICE_QUOTA_EXHAUSTED');assert.equal(exhausted.body.vehicle.priceDisplay,'--万');
  const consultation=await detail('60326',limitedToken);assert.equal(consultation.status,200);
  assert.equal(consultation.body.vehicle.priceState,'PRICE_CONSULTATION');assert.equal(consultation.body.vehicle.priceDisplay,'价格咨询');
 });
 await test('PG16 UNLIMITED and current level changes are resolved from current Customer row',async()=>{
  const beforeUnlock=await count("SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=60301");
  const beforeQuota=await count("SELECT count(*)::int n FROM public.customer_day_quota_ledger WHERE customer_id=60301");
  const list=await get('/api/v1/catalog/vehicles?source=wholesale',unlimitedToken);assert.equal(list.status,200);
  assert.ok(list.body.items.some(x=>x.price==='12万'&&x.priceCents==='12000000'));
  assert.equal((await detail('60310',unlimitedToken)).body.vehicle.price,'12万');
  assert.equal(await count("SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE customer_id=60301"),beforeUnlock);
  assert.equal(await count("SELECT count(*)::int n FROM public.customer_day_quota_ledger WHERE customer_id=60301"),beforeQuota);
  await writer.query("UPDATE public.customers SET customer_level_id=60301 WHERE customer_id=60300");
  assert.equal((await detail('60311',limitedToken)).body.vehicle.price,'12.1万');
  await writer.query("UPDATE public.customers SET customer_level_id=60300 WHERE customer_id=60300");
  assert.equal((await detail('60311',limitedToken)).body.vehicle.priceState,'DAILY_PRICE_QUOTA_EXHAUSTED');
 });
 await test('PG16 old cycle unlock cannot authorize new cycle; expired price proof fails closed',async()=>{
  await writer.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=60310");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(61310,60310,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(60310,61310,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(60310,61310,'wholesale',12500000,statement_timestamp()+interval '20 minutes')");
  try{
   const current=await detail('60310',limitedToken);assert.equal(current.status,200);assert.equal(current.body.vehicle.listingCycleId,'61310');
   assert.equal(current.body.vehicle.priceState,'DAILY_PRICE_QUOTA_EXHAUSTED');
   await writer.query("UPDATE public.f05_catalog_price_display_proof_test SET expires_at=statement_timestamp()-interval '1 second' WHERE vehicle_id=60310 AND listing_cycle_id=61310");
   const expired=await detail('60310',unlimitedToken);assert.equal(expired.status,200);
   assert.equal(expired.body.vehicle.priceState,'PRICE_CONSULTATION');assert.equal(expired.body.vehicle.priceDisplay,'价格咨询');
  }finally{
   await writer.query("DELETE FROM public.f05_catalog_price_display_proof_test WHERE vehicle_id=60310 AND listing_cycle_id=61310");
   await writer.query("DELETE FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=60310 AND listing_cycle_id=61310");
   await writer.query("DELETE FROM public.vehicle_listing_cycles WHERE listing_cycle_id=61310");
   await writer.query("UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=60310");
  }
 });
 await test('PG16 revoked Customer session and hidden/Priority vehicles fail closed',async()=>{
  const invalid=await fetch(origin+'/api/v1/catalog/vehicles',{headers:{authorization:'Bearer bad'}});assert.equal(invalid.status,401);
  await writer.query("UPDATE public.f05_catalog_customer_sessions_test SET revoked_at=statement_timestamp() WHERE customer_id=60300");
  const revoked=await get('/api/v1/catalog/vehicles?source=wholesale',limitedToken);
  assert.equal(revoked.status,401);assert.equal(revoked.body.code,'CUSTOMER_IDENTITY_REQUIRED');
  assert.equal((await detail('60329',unlimitedToken)).status,404);
  await writer.query("INSERT INTO public.f05_real_catalog_protections_test(vehicle_id,listing_cycle_id,protection_kind) VALUES(60311,60311,'PRIORITY')");
  try{assert.equal((await detail('60311',unlimitedToken)).status,404)}
  finally{await writer.query("DELETE FROM public.f05_real_catalog_protections_test WHERE vehicle_id=60311 AND listing_cycle_id=60311 AND protection_kind='PRIORITY'")}
 });
}catch(e){failure=e}
finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await writer.end().catch(()=>{});
 await pool.end().catch(()=>{});
}
if(failure)throw failure;
