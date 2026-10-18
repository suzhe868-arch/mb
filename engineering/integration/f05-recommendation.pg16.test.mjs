// PDM14: actual loopback Employee POST -> F02 frozen Recommendation/grants in non-superuser PG16.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedRecommendationService} from '../src/f05-recommendation-service.mjs';
import {createIsolatedRecommendationHandler} from '../src/f05-recommendation-http.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:6});
const db=new pg.Client({connectionString:env.connectionString});
const staff=randomBytes(32).toString('base64url'),member4s=randomBytes(32).toString('base64url');
const hash=s=>createHash('sha256').update(s).digest('hex');
const key=()=>randomBytes(24).toString('base64url');
let connected=false,server,error,firstId,secondId;
async function vehicle(id,hidden){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active',$2,59001,statement_timestamp())",[id,hidden?'hidden':'visible']);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',12000000,statement_timestamp()+interval '20 minutes')",[id]);
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(62000,59001,'active','receiving'),(62001,59002,'active','receiving')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,62000,statement_timestamp()+interval '20 minutes'),($2,62001,statement_timestamp()+interval '20 minutes')",[hash(staff),hash(member4s)]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(62000,'recommendation_fan')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(62000,true,statement_timestamp()+interval '20 minutes')");
  for(const n of [62000,62002]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',62000,62000,'assigned')",[n]);
   await db.query("INSERT INTO public.f05_recommendation_manage_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(62000,$1,true,statement_timestamp()+interval '20 minutes')",[n]);
  }
  await db.query("INSERT INTO public.f05_recommendation_manage_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(62001,62000,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(62000,62000,62000,'active','{}')");
  await vehicle(62010,true);await vehicle(62011,false);
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(62000,62000,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES(62000,62000,'brandId=59001',statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES(62011,62011,59001,2026,20000,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_priority_qualification_test(customer_id,enabled,expires_at) VALUES(62000,true,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const svc=createIsolatedRecommendationService({pool,env:process.env});
 const matching=createIsolatedMatchingService({pool,env:process.env});
 server=createServer(createFoundationHandler({recommendationHandler:createIsolatedRecommendationHandler(svc,process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const endpoint='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/recommendations';
 const post=async({customerId='62000',vehicleId='62010',listingCycleId=vehicleId,sourceDemandId=null,
 action='CREATE',credential=staff,eventKey=key()}={})=>{
  const res=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',
   authorization:'Bearer '+credential,'x-idempotency-key':eventKey},
   body:JSON.stringify({action,customerId,vehicleId,listingCycleId,
    ...(sourceDemandId!==null?{sourceDemandId}:{})})});
  return {status:res.status,body:await res.json()};
 };
 const number=async(sql,params=[])=>Number((await db.query(sql,params)).rows[0].n);
 await test('4S and false current Customer responsibility denied even with fake scope',async()=>{
  assert.equal((await post({credential:member4s})).status,403);
  assert.equal((await post({customerId:'999999'})).status,403);
  assert.equal((await post({sourceDemandId:'999999'})).status,403);
  assert.equal(await number('SELECT count(*) n FROM public.recommendations WHERE vehicle_id=62010'),0);
 });
 await test('PG16 pending Owner state with residual employee ID cannot sign Recommendation or hidden grant',async()=>{
  const beforeRec=await number("SELECT count(*) n FROM public.recommendations WHERE customer_id=62000 AND vehicle_id=62010");
  const beforeEvents=await number("SELECT count(*) n FROM public.f05_recommendation_events_test WHERE actor_employee_id=62000");
  // This is physically persisted Customer state, not a forged HTTP role claim.
  // A stale foreign-key owner ID is NOT authority while custody is pending.
  await db.query("UPDATE public.customers SET owner_assignment_state='owner_assignment_pending' WHERE customer_id=62000");
  try{
   const denied=await post({sourceDemandId:'62000'});
   assert.equal(denied.status,403,JSON.stringify(denied));
   assert.equal(denied.body.code,'REC_CURRENT_OWNER_REQUIRED');
   assert.equal(await number("SELECT count(*) n FROM public.recommendations WHERE customer_id=62000 AND vehicle_id=62010"),beforeRec);
   assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_events_test WHERE actor_employee_id=62000"),beforeEvents);
   assert.equal(await number("SELECT count(*) n FROM public.vehicle_visibility_grants WHERE customer_id=62000 AND vehicle_id=62010"),0);
   assert.equal(await number("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62000 AND vehicle_id=62010"),0);
  }finally{
   await db.query("UPDATE public.customers SET owner_assignment_state='assigned' WHERE customer_id=62000");
  }
 });
 await test('real hidden wholesale Recommendation creates exactly one grant and immutable price snapshot',async()=>{
  const eventKey=key();
  const created=await post({sourceDemandId:'62000',eventKey});
  assert.equal(created.status,200,JSON.stringify(created));assert.equal(created.body.code,'REC_CREATED');
  firstId=created.body.recommendationId;
  assert.equal((await post({sourceDemandId:'62000',eventKey})).body.code,'REC_REPLAY');
  const again=await post({sourceDemandId:'62000'});
  assert.equal(again.status,200);assert.equal(again.body.code,'REC_ACTIVE_REUSED');
  assert.equal(again.body.recommendationId,firstId);
  assert.equal(await number("SELECT count(*) n FROM public.recommendations WHERE customer_id=62000 AND vehicle_id=62010 AND status='active'"),1);
  assert.equal(await number("SELECT count(*) n FROM public.vehicle_visibility_grants WHERE customer_id=62000 AND source_recommendation_id=$1 AND revoked_at IS NULL",[firstId]),1);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62000 AND vehicle_id=62010"),1);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62002 AND vehicle_id=62010"),0);
  const snap=(await db.query('SELECT * FROM public.f05_recommendation_snapshot_test WHERE recommendation_id=$1',[firstId])).rows[0];
  assert.equal(String(snap.customer_price_cents),'12000000');assert.equal(String(snap.original_source_demand),'62000');
  // Recommendation conveys a PDM10 F02 physical free *cycle* unlock, not just a
  // historical snapshot and not a customer-wide price permission.
  assert.equal(await number("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62000 AND vehicle_id=62010 AND listing_cycle_id=62010 AND grant_origin='recommendation_free' AND source_recommendation_id=$1",[firstId]),1);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_price_grant_events_test WHERE recommendation_id=$1 AND outcome='RECOMMENDATION_FREE_GRANTED'",[firstId]),1);
  assert.equal(await number("SELECT count(*) n FROM public.customer_day_quota_ledger WHERE customer_id=62000"),0);
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=13000000 WHERE vehicle_id=62010");
  const frozen=(await db.query("SELECT customer_price_cents FROM public.f05_recommendation_snapshot_test WHERE recommendation_id=$1",[firstId])).rows[0];
  assert.equal(String(frozen.customer_price_cents),'12000000');
 });
 await test('end revokes its hidden grant but retains immutable recommendation and price history',async()=>{
  const ended=await post({action:'END'});
  assert.equal(ended.status,200,JSON.stringify(ended));assert.equal(ended.body.code,'REC_ENDED');
  assert.equal(await number("SELECT count(*) n FROM public.vehicle_visibility_grants WHERE source_recommendation_id=$1 AND revoked_at IS NULL",[firstId]),0);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62010 AND customer_id=62000"),0);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_snapshot_test WHERE recommendation_id=$1",[firstId]),1);
  assert.equal(await number("SELECT count(*) n FROM public.customer_price_cycle_unlocks WHERE customer_id=62000 AND vehicle_id=62010 AND listing_cycle_id=62010 AND grant_origin='recommendation_free' AND source_recommendation_id=$1",[firstId]),1);
  assert.equal((await post({action:'END'})).status,404);
  const recreated=await post();
  assert.equal(recreated.status,200,JSON.stringify(recreated));secondId=recreated.body.recommendationId;
  assert.notEqual(secondId,firstId);
  assert.equal(await number("SELECT count(*) n FROM public.recommendations WHERE vehicle_id=62010 AND customer_id=62000"),2);
 });
 await test('visible recommendation does not grant, visible->hidden automatically creates one scoped grant',async()=>{
  const res=await post({vehicleId:'62011'});
  assert.equal(res.status,200,JSON.stringify(res));
  assert.equal(await number("SELECT count(*) n FROM public.vehicle_visibility_grants WHERE vehicle_id=62011"),0);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62000"),1);
  await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=62011");
  assert.equal(await number("SELECT count(*) n FROM public.vehicle_visibility_grants WHERE vehicle_id=62011 AND customer_id=62000 AND revoked_at IS NULL"),1);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62000"),1);
 });
 await test('Customer disable and entitlement expiry suspend hidden detail without ending Recommendation',async()=>{
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=62000");
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62000"),0);
  assert.equal((await post({vehicleId:'62011'})).status,409);
  assert.equal(await number("SELECT count(*) n FROM public.recommendations WHERE customer_id=62000 AND status='active'"),2);
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=62000");
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62000"),2);
  await db.query("UPDATE public.f05_find_car_level_entitlement_test SET expires_at=statement_timestamp()-interval '1 second' WHERE level_id=62000");
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62000"),0);
  await db.query("UPDATE public.f05_find_car_level_entitlement_test SET expires_at=statement_timestamp()+interval '20 minutes' WHERE level_id=62000");
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE customer_id=62000"),2);
 });
 await test('competing real Priority hides other Customer previous active Recommendation, without deletion',async()=>{
  const other=await post({customerId:'62002',vehicleId:'62011'});
  assert.equal(other.status,200,JSON.stringify(other));
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62002"),1);
  const matched=await matching.recompute({credential:staff,demandId:'62000',
   vehicleId:'62011',eventKey:key()});
  assert.equal(matched.status,200,JSON.stringify(matched));
  assert.equal(matched.body.matchTier,'high');
  const match={result_id:matched.body.resultId};
  const lease=(await db.query("INSERT INTO public.priority_leases(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
   "VALUES(62011,62000,62000,'active',statement_timestamp()+interval '1 hour',62011,$1) RETURNING priority_id",[match.result_id])).rows[0];
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62002"),0);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62000"),1);
  assert.equal((await post({customerId:'62002',vehicleId:'62011'})).status,409);
  // Raw active Priority is not sufficient once the underlying PDM12 Match is stale:
  // Recommendation B restores at read time, without deleting any Recommendation.
  await db.query("UPDATE public.f05_matching_vehicle_facts_test SET mileage_km=30001 WHERE vehicle_id=62011");
  assert.equal(await number("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=62011"),0);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62002"),1);
  await db.query("UPDATE public.priority_leases SET status='ended',ended_at=statement_timestamp() WHERE priority_id=$1",[lease.priority_id]);
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62002"),1);
 });
 await test('void leaves complete history; physically mutable event/snapshot archive rejected',async()=>{
  const destroyed=await post({action:'VOID',vehicleId:'62011'});
  assert.equal(destroyed.status,200,JSON.stringify(destroyed));
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_safe_customer_test WHERE vehicle_id=62011 AND customer_id=62000"),0);
  await assert.rejects(db.query("DELETE FROM public.f05_recommendation_snapshot_test WHERE recommendation_id=$1",[firstId]),e=>e.code==='23514');
  await assert.rejects(db.query("UPDATE public.f05_recommendation_events_test SET action='VOID' WHERE actor_employee_id=62000"),e=>e.code==='23514');
  assert.equal(await number("SELECT count(*) n FROM public.f05_recommendation_snapshot_test WHERE recommendation_id=$1",[firstId]),1);
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
