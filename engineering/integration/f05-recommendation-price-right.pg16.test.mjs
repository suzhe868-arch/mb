// PDM10 §10 + PDM14 actual Recommendation free customer/vehicle/cycle price right.
// Real Node HTTP and PostgreSQL16 non-superuser; no issuer other than test-side scope.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedRecommendationService} from '../src/f05-recommendation-service.mjs';
import {createIsolatedRecommendationHandler} from '../src/f05-recommendation-http.mjs';
import {createIsolatedPriceUnlockService} from '../src/f05-price-unlock-service.mjs';
import {createIsolatedPriceUnlockHandler} from '../src/f05-price-unlock-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:8});
const db=new pg.Client({connectionString:env.connectionString});
const emp=randomBytes(32).toString('base64url');
const A=randomBytes(32).toString('base64url'),B=randomBytes(32).toString('base64url');
const hash=s=>createHash('sha256').update(s).digest('hex');
const key=()=>randomBytes(24).toString('base64url');
let connected=false,server,error;
const count=async(sql,args=[])=>Number((await db.query(sql,args)).rows[0].n);
async function vehicle(id,visibility='visible',price='11000000',kind='wholesale'){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,$2,$3,$4,59001,statement_timestamp())",
  [id,kind,kind==='wholesale'?'active':'available',visibility]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,$2,true,statement_timestamp()+interval '20 minutes')",[id,kind]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,$2,$3,statement_timestamp()+interval '20 minutes')",
  [id,kind,price]);
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(62800,59001,'active','receiving')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,62800,statement_timestamp()+interval '20 minutes')",[hash(emp)]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(62800,'recommendation_free_limited')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(62800,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_entitlement_test(level_id,price_access_mode,daily_base_quota,expires_at) VALUES(62800,'LIMITED',0,statement_timestamp()+interval '20 minutes')");
  for(const [id,tok] of [[62800,A],[62801,B]]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',62800,62800,'assigned')",[id]);
   await db.query("INSERT INTO public.f05_recommendation_manage_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(62800,$1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[hash(tok),id]);
  }
  await vehicle(62810,'hidden');
  await vehicle(62811,'visible');
  await vehicle(62812,'hidden',null);
  await vehicle(62813,'hidden');
  await vehicle(62814,'visible','8500000','mingbang');
  await vehicle(62815,'visible');
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({
  recommendationHandler:createIsolatedRecommendationHandler(
   createIsolatedRecommendationService({pool,env:process.env}),process.env),
  priceUnlockHandler:createIsolatedPriceUnlockHandler(
   createIsolatedPriceUnlockService({pool,env:process.env}),process.env)
 }));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const host='http://127.0.0.1:'+server.address().port;
 const recommend=async(vehicleId,customerId='62800',action='CREATE',eventKey=key(),listingCycleId=vehicleId)=>{
  const r=await fetch(host+'/api/v1/catalog/recommendations',{method:'POST',headers:{
   authorization:'Bearer '+emp,'content-type':'application/json','x-idempotency-key':eventKey},
   body:JSON.stringify({action,vehicleId,customerId,listingCycleId})});
  return {status:r.status,body:await r.json()};
 };
 const detail=async(vehicleId,token=A,eventKey=key())=>{
  const r=await fetch(host+'/api/v1/catalog/vehicles/'+vehicleId+'/customer-detail-entry',
   {method:'POST',headers:{authorization:'Bearer '+token,'x-idempotency-key':eventKey}});
  return {status:r.status,body:await r.json()};
 };
 await test('limited Customer quota zero: hidden vehicle forbidden and unrelated visible vehicle exhausted',async()=>{
  assert.equal((await detail('62810')).status,404);
  const regular=await detail('62811');
  assert.equal(regular.status,200);assert.equal(regular.body.code,'DAILY_PRICE_QUOTA_EXHAUSTED');
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800"),0);
 });
 await test('hidden wholesale Recommendation atomically makes per-cycle free F02 right, never consumes quota',async()=>{
  const evt=key();const rec=await recommend('62810','62800','CREATE',evt);
  assert.equal(rec.status,200,JSON.stringify(rec));assert.equal(rec.body.code,'REC_CREATED');
  const replay=await recommend('62810','62800','CREATE',evt);
  assert.equal(replay.body.code,'REC_REPLAY');
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62810 AND grant_origin='recommendation_free' AND source_recommendation_id=$1",[rec.body.recommendationId]),1);
  assert.equal(await count("SELECT count(*) n FROM public.f05_recommendation_price_grant_events_test WHERE recommendation_id=$1 AND outcome='RECOMMENDATION_FREE_GRANTED'",[rec.body.recommendationId]),1);
  const opened=await detail('62810');
  assert.equal(opened.status,200,JSON.stringify(opened));
  assert.equal(opened.body.code,'PRICE_ALREADY_UNLOCKED');assert.equal(opened.body.priceCents,'11000000');
  assert.equal(opened.body.charged,false);
  assert.equal(await count("SELECT count(*) n FROM public.customer_day_quota_ledger WHERE customer_id=62800"),1); // Exhausted previously, no consumption.
  assert.equal(await count("SELECT consumed_count n FROM public.customer_day_quota_ledger WHERE customer_id=62800"),0);
  assert.equal((await detail('62811')).body.code,'DAILY_PRICE_QUOTA_EXHAUSTED');
  assert.equal((await detail('62810',B)).status,404);
 });
 await test('END revokes hidden detail grant but does NOT revoke F02 price right; same cycle visible restores view',async()=>{
  const ended=await recommend('62810','62800','END');assert.equal(ended.status,200);
  assert.equal((await detail('62810')).status,404);
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62810"),1);
  await db.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=62810");
  const view=await detail('62810');assert.equal(view.status,200);assert.equal(view.body.code,'PRICE_ALREADY_UNLOCKED');
  assert.equal(view.body.charged,false);
 });
 await test('new listing cycle never inherits old recommendation free unlock',async()=>{
  await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=62810");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(62820,62810,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(62810,62820,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(62810,62820,'wholesale',15000000,statement_timestamp()+interval '20 minutes')");
  const out=await detail('62810');assert.equal(out.status,200,JSON.stringify(out));
  assert.equal(out.body.code,'DAILY_PRICE_QUOTA_EXHAUSTED');
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62810"),1);
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62810 AND listing_cycle_id=62820"),0);
 });
 await test('Recommendation while price consultation still grants free right; later numeric price uses it at zero quota',async()=>{
  const rec=await recommend('62812');assert.equal(rec.status,200,JSON.stringify(rec));
  const right=(await db.query("SELECT grant_origin,source_recommendation_id FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62812")).rows[0];
  assert.equal(right.grant_origin,'recommendation_free');assert.equal(String(right.source_recommendation_id),rec.body.recommendationId);
  const consultation=await detail('62812');assert.equal(consultation.status,200);
  assert.equal(consultation.body.code,'PRICE_CONSULTATION');assert.equal(consultation.body.charged,false);
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=19000000 WHERE vehicle_id=62812");
  const current=await detail('62812');
  assert.equal(current.status,200,JSON.stringify(current));assert.equal(current.body.code,'PRICE_ALREADY_UNLOCKED');
  assert.equal(current.body.priceCents,'19000000');assert.equal(current.body.charged,false);
  assert.equal((await detail('62812',B)).status,404);
 });
 await test('preexisting paid quota unlock remains original, Recommendation does not refund/recharge',async()=>{
  await db.query("UPDATE public.f05_catalog_price_entitlement_test SET daily_base_quota=1 WHERE level_id=62800");
  const paid=await detail('62811',B);assert.equal(paid.status,200,JSON.stringify(paid));
  assert.equal(paid.body.code,'PRICE_UNLOCKED');assert.equal(paid.body.charged,true);
  const consumed=await count("SELECT consumed_count n FROM public.customer_day_quota_ledger WHERE customer_id=62801");
  assert.equal(consumed,1);
  const original=(await db.query("SELECT unlock_id,grant_origin FROM public.customer_price_cycle_unlocks WHERE customer_id=62801 AND vehicle_id=62811")).rows[0];
  assert.equal(original.grant_origin,'limited_quota');
  const rec=await recommend('62811','62801');assert.equal(rec.status,200,JSON.stringify(rec));
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62801 AND vehicle_id=62811"),1);
  const afterward=(await db.query("SELECT unlock_id,grant_origin FROM public.customer_price_cycle_unlocks WHERE customer_id=62801 AND vehicle_id=62811")).rows[0];
  assert.equal(String(afterward.unlock_id),String(original.unlock_id));assert.equal(afterward.grant_origin,'limited_quota');
  assert.equal(await count("SELECT count(*) n FROM public.f05_recommendation_price_grant_events_test WHERE recommendation_id=$1 AND outcome='PRIOR_UNLOCK_RETAINED'",[rec.body.recommendationId]),1);
  assert.equal(await count("SELECT consumed_count n FROM public.customer_day_quota_ledger WHERE customer_id=62801"),consumed);
 });
 await test('non-wholesale Recommendation never creates wholesale cycle-price grant',async()=>{
  const rec=await recommend('62814');assert.equal(rec.status,200,JSON.stringify(rec));
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE vehicle_id=62814"),0);
  assert.equal(await count("SELECT count(*) n FROM public.f05_recommendation_price_grant_events_test WHERE recommendation_id=$1",[rec.body.recommendationId]),0);
  const d=await detail('62814');assert.equal(d.status,200);
  assert.equal(d.body.code,'CUSTOMER_DISPLAY_PRICE');assert.equal(d.body.priceCents,'8500000');
 });
 await test('forced price-grant audit failure atomically rolls back new Recommendation + grant + event',async()=>{
  await db.query("CREATE FUNCTION public.f05_free_price_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'TEST_PRICE_GRANT_FAIL'; END $$");
  await db.query("CREATE TRIGGER f05_free_price_fault BEFORE INSERT ON public.f05_recommendation_price_grant_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_free_price_fault()");
  try{
   const r=await recommend('62813');assert.equal(r.status,503,JSON.stringify(r));
   assert.equal(await count("SELECT count(*) n FROM public.recommendations WHERE customer_id=62800 AND vehicle_id=62813"),0);
   assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62813"),0);
   assert.equal(await count("SELECT count(*) n FROM public.vehicle_visibility_grants WHERE vehicle_id=62813"),0);
  }finally{
   await db.query("DROP TRIGGER f05_free_price_fault ON public.f05_recommendation_price_grant_events_test");
   await db.query("DROP FUNCTION public.f05_free_price_fault()");
  }
  const ok=await recommend('62813');assert.equal(ok.status,200);assert.equal(ok.body.code,'REC_CREATED');
 });
 await test('concurrent customer detail and Recommendation cannot duplicate right or mischarge quota',async()=>{
  await db.query("UPDATE public.f05_catalog_price_entitlement_test SET daily_base_quota=1 WHERE level_id=62800");
  const [detailRes,recRes]=await Promise.all([detail('62815',A),recommend('62815')]);
  assert.equal(recRes.status,200,JSON.stringify(recRes));
  assert.equal(detailRes.status,200,JSON.stringify(detailRes));
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62815"),1);
  assert.equal(await count("SELECT consumed_count n FROM public.customer_day_quota_ledger WHERE customer_id=62800"),detailRes.body.charged?1:0);
  assert.equal((await detail('62815')).body.code,'PRICE_ALREADY_UNLOCKED');
 });
 await test('Customer disabled pauses both hidden Recommendation and previously granted price without erasing history',async()=>{
  const before=await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62812");
  assert.equal(before,1);
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=62800");
  try{
   const blocked=await detail('62812');
   assert.equal(blocked.status,401,JSON.stringify(blocked));
   assert.equal(await count("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62800 AND vehicle_id=62812"),0);
   assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62812"),before);
  }finally{await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=62800")}
  const restored=await detail('62812');assert.equal(restored.status,200,JSON.stringify(restored));
  assert.equal(restored.body.code,'PRICE_ALREADY_UNLOCKED');assert.equal(restored.body.charged,false);
 });
 await test('Free right never substitutes for expired source price evidence, proof restoration uses current price',async()=>{
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET expires_at=statement_timestamp()-interval '1 second' WHERE vehicle_id=62812");
  const denied=await detail('62812');assert.equal(denied.status,404,JSON.stringify(denied));
  assert.equal(await count("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62800 AND vehicle_id=62812"),1);
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET expires_at=statement_timestamp()+interval '20 minutes',customer_display_cents=25000000 WHERE vehicle_id=62812");
  const fresh=await detail('62812');
  assert.equal(fresh.status,200);assert.equal(fresh.body.code,'PRICE_ALREADY_UNLOCKED');
  assert.equal(fresh.body.priceCents,'25000000');assert.equal(fresh.body.charged,false);
 });
 await test('immutable free grant events cannot be changed after Recommendation ended',async()=>{
  await assert.rejects(db.query("DELETE FROM public.f05_recommendation_price_grant_events_test WHERE customer_id=62800"),e=>e.code==='23514');
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
