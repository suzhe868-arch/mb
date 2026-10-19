// F05-7 PDM12 first-match pairs after saved Dictionary Rule activation/edit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedDictionaryService} from '../src/f05-matching-dictionary-service.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingRetryWorker} from '../src/f05-matching-retry-worker.mjs';
import {createIsolatedMatchingDiscoveryService} from '../src/f05-matching-discovery-service.mjs';
import {createIsolatedMatchingDiscoveryHandler} from '../src/f05-matching-discovery-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:6});
const db=new pg.Client({connectionString:env.connectionString});
const credential=randomBytes(32).toString('base64url'),badActor=randomBytes(32).toString('base64url');
const key=()=>randomBytes(24).toString('base64url'),hash=x=>createHash('sha256').update(x).digest('hex');
let connected=false,server,error,ruleId;
async function vehicle(id,model,brand){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active','visible',$2,statement_timestamp())",[id,model]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[id]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[id]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES($1,$1,$2,2026,21000,statement_timestamp()+interval '20 minutes')",[id,brand]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',12000000,statement_timestamp()+interval '20 minutes')",[id]);
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.vehicle_brands(brand_id,brand_name) VALUES(61301,'F05词典作用域品牌')");
  await db.query("INSERT INTO public.vehicle_series(series_id,brand_id,series_name) VALUES(61301,61301,'F05词典作用域车系')");
  await db.query("INSERT INTO public.vehicle_models(model_id,brand_id,series_id,model_name,model_year,profile_status) VALUES(61301,61301,61301,'F05词典作用域车型',2026,'incomplete')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(61300,59001,'active','receiving'),(61301,59002,'active','receiving')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,61300,statement_timestamp()+interval '20 minutes'),($2,61301,statement_timestamp()+interval '20 minutes')",[hash(credential),hash(badActor)]);
  await db.query("INSERT INTO public.f05_matching_rule_manage_scope_test(employee_id,can_manage,expires_at) VALUES(61300,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(61300,'rule_change_level')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(61300,true,statement_timestamp()+interval '20 minutes')");
  for(const id of [61300,61302]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',61300,61300,'assigned')",[id]);
   await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$1,61300,'active','{}')",[id]);
   await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(61300,$1,true,statement_timestamp()+interval '20 minutes')",[id]);
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES($1,61300,$2,statement_timestamp()+interval '20 minutes')",[id,id===61300?'alias_rule_613':'brandId=61301']);
  }
  await vehicle(61310,61301,61301);await vehicle(61311,61301,61301);
  await vehicle(61312,59001,59001);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const dictionary=createIsolatedDictionaryService({pool,env:process.env});
 const matching=createIsolatedMatchingService({pool,env:process.env});
 const retry=createIsolatedMatchingRetryWorker({pool,matching,env:process.env});
 const discovery=createIsolatedMatchingDiscoveryService({pool,env:process.env});
 server=createServer(createFoundationHandler({discoveryHandler:createIsolatedMatchingDiscoveryHandler(discovery,process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/matching/discovery';
 const post=async(id,person=credential,eventKey=key())=>{
  const response=await fetch(url,{method:'POST',headers:{authorization:'Bearer '+person,
   'x-idempotency-key':eventKey,'content-type':'application/json'},
   body:JSON.stringify({kind:'RULE_CHANGE',subjectId:id})});
  return {status:response.status,body:await response.json()};
 };
 await test('untrusted/4S Employee cannot discover other owner demands or invent nonexistent rule',async()=>{
  assert.equal((await post('999999')).body.code,'DISCOVERY_RULE_NOT_ENABLED');
  assert.equal((await post('999999',badActor)).status,403);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=61300")).rows[0].n,0);
 });
 await test('brand scoped enabled Rule discovers *new* two pairs with zero prior Match Result',async()=>{
  const created=await dictionary.mutate({credential,action:'CREATE',eventKey:key(),
   definition:{token:'alias_rule_613',mappedKey:'brandId',mappedValue:'61301',scopeKind:'brand',brandId:'61301'}});
  assert.equal(created.status,200,JSON.stringify(created));ruleId=created.body.ruleId;
  assert.equal((await db.query('SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=61300')).rows[0].n,0);
  const eventKey=key();
  const one=await post(ruleId,credential,eventKey);
  assert.equal(one.status,200,JSON.stringify(one));assert.equal(one.body.queued,2);assert.equal(one.body.hasMore,false);
  assert.equal((await post(ruleId,credential,eventKey)).body.code,'DISCOVERY_REPLAY');
  assert.equal((await post(ruleId,badActor)).status,403);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_affected_queue_test WHERE demand_id=61302 OR vehicle_id=61312")).rows[0].n,0);
  const run=await retry.runOnce({credential,limit:10});
  assert.equal(run.claimed,2,JSON.stringify(run));assert.ok(run.outcomes.every(x=>x.outcome==='done'),JSON.stringify(run));
  const matched=(await db.query("SELECT match_tier,match_explanation FROM public.demand_match_results WHERE demand_id=61300 AND current_state='current' ORDER BY vehicle_id")).rows;
  assert.deepEqual(matched.map(x=>x.match_tier),['high','high']);
  assert.equal(matched[0].match_explanation.salesDescription.ruleHits[0].ruleId,ruleId);
 });
 await test('Rule edit invalidates old current, scoped re-discovery only queues first unmatched vehicle',async()=>{
  const edited=await dictionary.mutate({credential,action:'EDIT',ruleId,expectedVersion:1,
   eventKey:key(),definition:{token:'alias_rule_613',mappedKey:'brandId',mappedValue:'999999',scopeKind:'brand',brandId:'61301'}});
  assert.equal(edited.status,200,JSON.stringify(edited));assert.equal(edited.body.affectedCurrentPairsStaled,2);
  await db.query('BEGIN');try{await vehicle(61313,61301,61301);await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}
  const got=await post(ruleId);
  assert.equal(got.status,200,JSON.stringify(got));assert.equal(got.body.queued,1);
  const run=await retry.runOnce({credential,limit:10});
  assert.equal(run.claimed,3,JSON.stringify(run));assert.ok(run.outcomes.every(x=>x.outcome==='done'),JSON.stringify(run));
  const latest=(await db.query("SELECT match_tier,match_explanation FROM public.demand_match_results WHERE demand_id=61300 AND current_state='current' ORDER BY vehicle_id")).rows;
  assert.deepEqual(latest.map(x=>x.match_tier),['no_match','no_match','no_match']);
  assert.equal(latest[2].match_explanation.salesDescription.ruleHits[0].ruleVersion,'2');
 });
 await test('disabled rule hard-denies new discovery; cannot resurface stale or create grant',async()=>{
  const dis=await dictionary.mutate({credential,action:'DISABLE',ruleId,expectedVersion:2,eventKey:key()});
  assert.equal(dis.status,200,JSON.stringify(dis));assert.equal(dis.body.affectedCurrentPairsStaled,3);
  const blocked=await post(ruleId);
  assert.equal(blocked.status,409,JSON.stringify(blocked));assert.equal(blocked.body.code,'DISCOVERY_RULE_NOT_ENABLED');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=61300")).rows[0].n,0);
  for(const t of ['recommendations','priority_leases','vehicle_visibility_grants'])
   assert.equal((await db.query('SELECT count(*)::int n FROM public.'+t+' WHERE customer_id=61300')).rows[0].n,0,t);
 });
 await test('PG16 dictionary physical schema accepts every newly supported multi-value hard field',async()=>{
  for(const [i,mappedKey,mappedValue] of [
   [1,'exteriorColor','red|blue'],[2,'powerType','gasoline|hybrid'],
   [3,'displacementMinCc','1400'],[4,'displacementMaxCc','2500'],
   [5,'displacementCc','1400|1600'],[6,'excludeCondition','flood|fire'],
   [7,'interiorColor','beige']]){
   const created=await dictionary.mutate({credential,action:'CREATE',eventKey:key(),
    definition:{token:'new_field_'+i+'_613',mappedKey,mappedValue,scopeKind:'global'}});
   assert.equal(created.status,200,JSON.stringify({mappedKey,created}));
   const saved=(await db.query('SELECT mapped_key,mapped_value FROM public.f05_matching_dictionary_rules_test WHERE rule_id=$1',[created.body.ruleId])).rows[0];
   assert.equal(saved.mapped_key,mappedKey);assert.equal(saved.mapped_value,mappedValue);
  }
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
