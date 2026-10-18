// PDM12 F05-7: frozen physical PG16 demand_match_results, 4 tiers, no Recommendation/Priority.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingHandler} from '../src/f05-matching-http.mjs';
const cfg=validateCatalogEnv(),pool=new pg.Pool({connectionString:cfg.connectionString,max:5,connectionTimeoutMillis:1500});
const writer=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1500});
const rand=()=>randomBytes(32).toString('base64url'),sha=x=>createHash('sha256').update(x).digest('hex');
const employeeToken=rand(),otherToken=rand(),fourSToken=rand();
const desc='brandId=59001;minModelYear=2024;maxMileageKm=50000;budgetCents=12000000;interiorColor=black';
let server,connected=false,failure;
try{
 await writer.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await writer.query('BEGIN');
 try{
  await writer.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(59700,'matching_v1_test_entitled')");
  await writer.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
    "(59700,59001,'active','receiving'),(59701,59002,'active','receiving'),(59702,59001,'active','receiving')");
  await writer.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES"+
    "(59700,'active',59700,'assigned',59700),(59701,'active',59001,'assigned',59700)");
  await writer.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES"+
    "(59700,59700,59700,'active','{}'::jsonb),"+
    "(59701,59700,59700,'paused','{}'::jsonb),"+
    "(59702,59700,59700,'active','{}'::jsonb),"+
    "(59703,59701,59700,'active','{}'::jsonb)");
  for(const [token,id] of [[employeeToken,'59700'],[otherToken,'59702'],[fourSToken,'59701']])
   await writer.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(token),id]);
  await writer.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES"+
   "(59700,true,statement_timestamp()+interval '20 minutes') ON CONFLICT(level_id) DO UPDATE SET can_activate_demand=true,expires_at=excluded.expires_at");
  await writer.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES"+
   "(59700,59700,true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES"+
   "(59700,59700,$1,statement_timestamp()+interval '20 minutes'),"+
   "(59701,59700,$1,statement_timestamp()+interval '20 minutes'),"+
   "(59703,59700,$1,statement_timestamp()+interval '20 minutes')",[desc]);
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES"+
   "(59710,'wholesale','active','visible',59001,statement_timestamp()),"+
   "(59711,'wholesale','active','hidden',59001,statement_timestamp()),"+
   "(59712,'wholesale','active','visible',NULL,statement_timestamp()),"+
   "(59713,'wholesale','active','visible',59001,statement_timestamp()),"+
   "(59714,'wholesale','offline','visible',59001,statement_timestamp()),"+
   "(59715,'wholesale','active','visible',NULL,statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES"+
   "(59710,59710,statement_timestamp()),(59711,59711,statement_timestamp()),"+
   "(59712,59712,statement_timestamp()),(59713,59713,statement_timestamp()),"+
   "(59714,59714,statement_timestamp()),(59715,59715,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES"+
   "(59710,59710,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59711,59711,'wholesale',false,statement_timestamp()+interval '20 minutes'),"+
   "(59712,59712,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59713,59713,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59714,59714,'wholesale',true,statement_timestamp()+interval '20 minutes'),"+
   "(59715,59715,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) VALUES"+
   "(59710,59710,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes'),"+
   "(59711,59711,59001,2026,20000,'white',statement_timestamp()+interval '20 minutes'),"+
   "(59712,59712,59001,NULL,NULL,NULL,statement_timestamp()+interval '20 minutes'),"+
   "(59713,59713,59001,2026,90000,'black',statement_timestamp()+interval '20 minutes'),"+
   "(59714,59714,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes'),"+
   "(59715,59715,59001,2027,10000,'black',statement_timestamp()+interval '20 minutes')");
  await writer.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES"+
   "(59710,59710,'wholesale',11500000,statement_timestamp()+interval '20 minutes'),"+
   "(59711,59711,'wholesale',12600000,statement_timestamp()+interval '20 minutes'),"+
   "(59712,59712,'wholesale',NULL,statement_timestamp()+interval '20 minutes'),"+
   "(59713,59713,'wholesale',11500000,statement_timestamp()+interval '20 minutes'),"+
   "(59714,59714,'wholesale',11500000,statement_timestamp()+interval '20 minutes'),"+
   "(59715,59715,'wholesale',11500000,statement_timestamp()+interval '20 minutes')");
  await writer.query('COMMIT');
 }catch(e){await writer.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({matchingHandler:createIsolatedMatchingHandler(createIsolatedMatchingService({pool,env:process.env}),process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const base='http://127.0.0.1:'+server.address().port;
 const call=async({demand='59700',vehicle='59710',credential=employeeToken,eventKey=rand()}={})=>{
  const r=await fetch(base+'/api/v1/catalog/demands/'+demand+'/vehicles/'+vehicle+'/recompute-match',{
   method:'POST',headers:{authorization:'Bearer '+credential,'x-idempotency-key':eventKey}});
  return {status:r.status,body:await r.json()};
 };
 const results=async(vehicle)=> (await writer.query(
  "SELECT result_id,match_tier,match_explanation,current_state,calculated_at,invalidated_at "+
  "FROM public.demand_match_results WHERE demand_id=59700 AND vehicle_id=$1 ORDER BY result_id",[vehicle])).rows;
 await test('PG16 unknown bearer, 4S and unrelated employee cannot recompute match',async()=>{
  assert.equal((await call({credential:rand()})).status,401);
  assert.equal((await call({credential:fourSToken})).status,401);
  assert.equal((await call({credential:otherToken})).status,403);
  assert.equal((await call({demand:'999999'})).status,404);
 });
 await test('PG16 Demand guard: cannot run paused, no scope, no entitlement or absent sales description',async()=>{
  assert.equal((await call({demand:'59701'})).status,409);
  assert.equal((await call({demand:'59703'})).status,403);
  assert.equal((await call({demand:'59702'})).status,409);
  await writer.query("DELETE FROM public.f05_matching_employee_scope_test WHERE employee_id=59700");
  try{assert.equal((await call()).status,403)}
  finally{await writer.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(59700,59700,true,statement_timestamp()+interval '20 minutes')")}
  await writer.query("UPDATE public.f05_find_car_level_entitlement_test SET can_activate_demand=false WHERE level_id=59700");
  try{assert.equal((await call()).status,409)}
  finally{await writer.query("UPDATE public.f05_find_car_level_entitlement_test SET can_activate_demand=true WHERE level_id=59700")}
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=59700")).rows[0].n,0);
 });
 const firstKey=rand();
 await test('PG16 current tier HIGH is frozen F02 physical Match Result with explanation but no recommendation',async()=>{
  const r=await call({eventKey:firstKey});assert.equal(r.status,200,JSON.stringify(r.body));
  assert.equal(r.body.matchTier,'high');assert.equal(r.body.noRecommendation,true);assert.equal(r.body.matchingReady,true);
  assert.equal(r.body.explanation.sourceFacts.hiddenButEligible,false);
  const saved=await results('59710');assert.equal(saved.length,1);
  assert.equal(saved[0].current_state,'current');assert.equal(saved[0].match_tier,'high');
  assert.equal(saved[0].match_explanation.components.filter(x=>x.category==='hard').length,4);
  assert.ok(saved[0].calculated_at instanceof Date);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.recommendations WHERE customer_id=59700')).rows[0].n,0);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.priority_leases WHERE customer_id=59700')).rows[0].n,0);
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE customer_id=59700')).rows[0].n,0);
  const demand=(await writer.query('SELECT criteria_json FROM public.demands WHERE demand_id=59700')).rows[0];
  assert.equal(demand.criteria_json.minModelYear,2024);
 });
 await test('PG16 physically hidden but sellable vehicle matches ACCEPTABLE at exact 5% budget tolerance',async()=>{
  const r=await call({vehicle:'59711'});
  assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.matchTier,'acceptable');
  assert.equal(r.body.explanation.sourceFacts.hiddenButEligible,true);
  assert.equal((await results('59711'))[0].match_tier,'acceptable');
  assert.equal((await writer.query('SELECT platform_visibility FROM public.vehicles WHERE vehicle_id=59711')).rows[0].platform_visibility,'hidden');
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.vehicle_visibility_grants WHERE vehicle_id=59711')).rows[0].n,0);
 });
 await test('PG16 confirmed hard condition with unknown vehicle evidence yields confirmation_needed not acceptable',async()=>{
  const r=await call({vehicle:'59712'});
  assert.equal(r.status,200);assert.equal(r.body.matchTier,'confirmation_needed');
  const explanation=(await results('59712'))[0].match_explanation;
  assert.ok(explanation.components.some(x=>x.category==='hard'&&x.outcome==='unknown'));
  assert.equal((await writer.query('SELECT count(*)::int n FROM public.priority_leases WHERE vehicle_id=59712')).rows[0].n,0);
 });
 await test('PG16 explicit mileage hard failure wins and produces NO_MATCH, never loose approximate suggestion',async()=>{
  const r=await call({vehicle:'59713'});assert.equal(r.status,200);
  assert.equal(r.body.matchTier,'no_match');
  assert.ok((await results('59713'))[0].match_explanation.components.some(x=>x.key==='maxMileageKm'&&x.outcome==='fail'));
 });
 await test('PG16 JYT explicit model-year/brand survives absent local model mapping and can match HIGH',async()=>{
  const r=await call({vehicle:'59715'});assert.equal(r.status,200);
  assert.equal(r.body.matchTier,'high');
  assert.equal((await writer.query('SELECT model_id FROM public.vehicles WHERE vehicle_id=59715')).rows[0].model_id,null);
 });
 await test('PG16 invalid staff description creates no match; no matching ready from arbitrary unparsed text',async()=>{
  await writer.query("UPDATE public.f05_matching_sales_description_test SET sales_description='客户只说随便看看' WHERE demand_id=59700");
  try{
   const r=await call({vehicle:'59710'});assert.equal(r.status,409);assert.equal(r.body.code,'MATCH_NOT_READY');
   assert.equal((await results('59710')).length,1);
  }finally{await writer.query("UPDATE public.f05_matching_sales_description_test SET sales_description=$1 WHERE demand_id=59700",[desc])}
 });
 await test('PG16 sold vehicle and missing evidence never enter new result, even if hidden is allowed',async()=>{
  assert.equal((await call({vehicle:'59714'})).status,409);
  await writer.query('DELETE FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=59710');
  try{assert.equal((await call({vehicle:'59710'})).status,404)}
  finally{await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59710,59710,'wholesale',true,statement_timestamp()+interval '20 minutes')")}
 });
 await test('PG16 event key replay no second result, different vehicle same key returns strict collision',async()=>{
  const r=await call({eventKey:firstKey});assert.equal(r.status,200);
  assert.equal(r.body.code,'MATCH_RECOMPUTE_REPLAY');assert.equal(r.body.matchingReady,false);
  assert.equal((await results('59710')).length,1);
  assert.equal((await call({vehicle:'59711',eventKey:firstKey})).status,409);
 });
 await test('PG16 changed legitimate customer display price stale-archives old tier and appends new exact tier',async()=>{
  await writer.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=12600001 WHERE vehicle_id=59710");
  const newResult=await call();assert.equal(newResult.status,200);
  assert.equal(newResult.body.matchTier,'no_match');
  const states=await results('59710');
  assert.equal(states.length,2);assert.equal(states[0].match_tier,'high');assert.equal(states[0].current_state,'stale');
  assert.ok(states[0].invalidated_at instanceof Date);
  assert.equal(states[1].match_tier,'no_match');assert.equal(states[1].current_state,'current');
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=59700 AND vehicle_id=59710 AND current_state='current'")).rows[0].n,1);
 });
 await test('PG16 two independent concurrent triggers for one Demand Vehicle serialize and retain exactly one current',async()=>{
  const [a,b]=await Promise.all([call({vehicle:'59711'}),call({vehicle:'59711'})]);
  assert.equal(a.status,200);assert.equal(b.status,200);
  assert.equal((await writer.query("SELECT count(*)::int n FROM public.demand_match_results WHERE demand_id=59700 AND vehicle_id=59711 AND current_state='current'")).rows[0].n,1);
  assert.equal((await results('59711')).length,3);
 });
 await test('PG16 forced recompute audit failure rolls back stale marking, new result and Demand criteria together',async()=>{
  await writer.query("UPDATE public.f05_matching_sales_description_test SET sales_description='brandId=59001;maxMileageKm=50000' WHERE demand_id=59700");
  const old=(await writer.query('SELECT criteria_json FROM public.demands WHERE demand_id=59700')).rows[0].criteria_json;
  const key=rand(),before=(await results('59710')).length;
  await writer.query("CREATE FUNCTION public.f05_match_audit_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_MATCH_AUDIT_FAILURE'; END $$");
  await writer.query("CREATE TRIGGER f05_match_audit_fault BEFORE INSERT ON public.f05_matching_recompute_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_match_audit_fail_test()");
  try{
   const bad=await call({vehicle:'59710',eventKey:key});assert.equal(bad.status,503);
   assert.deepEqual((await writer.query('SELECT criteria_json FROM public.demands WHERE demand_id=59700')).rows[0].criteria_json,old);
   assert.equal((await results('59710')).length,before);
   assert.equal((await results('59710')).at(-1).current_state,'stale',
    'changed sales description already stales the old result before the failed retry');
   assert.equal((await writer.query('SELECT count(*)::int n FROM public.f05_matching_recompute_events_test WHERE event_key=$1',[key])).rows[0].n,0);
  }finally{
   await writer.query('DROP TRIGGER f05_match_audit_fault ON public.f05_matching_recompute_events_test');
   await writer.query('DROP FUNCTION public.f05_match_audit_fail_test()');
  }
  const good=await call({vehicle:'59710',eventKey:key});assert.equal(good.status,200);
 });
 await test('PG16 current Owner reassignment revokes old sales matching authority and safe visibility immediately',async()=>{
  const previous=(await writer.query(
   "SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=59700 AND vehicle_id=59710")).rows[0].n;
  assert.equal(previous,1);
  const before=await results('59710');
  // A committed owner transfer with an unchanged old Demand and Scope must not
  // leave former owner able to read/create matching authority.
  await writer.query("UPDATE public.customers SET current_owner_employee_id=59702 WHERE customer_id=59700");
  try{
   const now=(await writer.query(
    "SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=59700 AND vehicle_id=59710")).rows[0].n;
   assert.equal(now,0,'old matching current must disappear at READ time');
   const unauthorized=await call({vehicle:'59710'});
   assert.equal(unauthorized.status,403,JSON.stringify(unauthorized));
   assert.equal(unauthorized.body.code,'MATCH_CURRENT_CUSTOMER_OWNER_REQUIRED');
   const latest=await results('59710');
   assert.equal(latest.length,before.length,
    'stale Owner cannot create Match Result even with old test Scope');
   assert.equal(latest.at(-1).current_state,'invalidated',
    'historical Match must be physically invalidated on custody change');
   assert.equal((await writer.query("SELECT count(*)::int n FROM public.matching_change_events "+
    "WHERE trigger_kind='CUSTOMER_OWNER_CHANGED' AND result_id=$1",
    [latest.at(-1).result_id])).rows[0].n,1);
  }finally{
   await writer.query("UPDATE public.customers SET current_owner_employee_id=59700 WHERE customer_id=59700");
  }
  assert.equal((await writer.query(
   "SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=59700 AND vehicle_id=59710")).rows[0].n,0,
   'restoring the Owner does not resurrect an invalidated historical Match');
  const recovered=await call({vehicle:'59710'});
  assert.equal(recovered.status,200,JSON.stringify(recovered));
  assert.equal((await writer.query(
   "SELECT count(*)::int n FROM public.f05_matching_safe_current_test WHERE demand_id=59700 AND vehicle_id=59710")).rows[0].n,1);
 });
 await test('PG16 append-only matching event rejects UPDATE/DELETE and Employee session revocation fails closed',async()=>{
  await assert.rejects(writer.query('DELETE FROM public.f05_matching_recompute_events_test WHERE demand_id=59700'),e=>e.code==='23514');
  await assert.rejects(writer.query("UPDATE public.f05_matching_recompute_events_test SET result_tier='high' WHERE demand_id=59700"),e=>e.code==='23514');
  await writer.query('UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[sha(employeeToken)]);
  assert.equal((await call()).status,401);
 });
}catch(e){failure=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await writer.end();
 await pool.end();
}
if(failure)throw failure;
