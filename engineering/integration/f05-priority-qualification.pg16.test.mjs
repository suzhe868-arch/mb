// F05-8 single Customer qualification; real non-superuser PG16 and loopback HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedPriorityService} from '../src/f05-priority-service.mjs';
import {createIsolatedPriorityQualificationService} from '../src/f05-priority-qualification-service.mjs';
import {createIsolatedPriorityQualificationHandler} from '../src/f05-priority-qualification-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:7});
const db=new pg.Client({connectionString:env.connectionString});
const tokens=[...Array(4)].map(()=>randomBytes(32).toString('base64url'));
const sha=v=>createHash('sha256').update(v).digest('hex'),key=()=>randomBytes(24).toString('base64url');
let server,connected=false,error;
const count=async(q,args=[])=>Number((await db.query(q,args)).rows[0].n);
async function vehicle(vid){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active','visible',59001,statement_timestamp())",[vid]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[vid]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[vid]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) VALUES($1,$1,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes')",[vid]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',14000000,statement_timestamp()+interval '20 minutes')",[vid]);
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.roles(role_id,role_code) VALUES(64500,'manager') ON CONFLICT DO NOTHING");
  const role=(await db.query("SELECT role_id FROM public.roles WHERE role_code='manager' ORDER BY role_id LIMIT 1")).rows[0];
  assert.ok(role);
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES "+
   "($1,$2,'active','receiving'),(64501,59001,'active','receiving'),"+
   "(64502,59001,'active','receiving'),(64503,59002,'active','receiving')",[64500,role.role_id]);
  for(let i=0;i<4;i++)await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(tokens[i]),64500+i]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(64510,'priority_qual_admin_fan')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(64510,true,statement_timestamp()+interval '20 minutes')");
  for(const [customer,emp] of [[64510,64501],[64511,64502]]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',64510,$2,'assigned')",[customer,emp]);
   await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$1,$2,'active','{}')",[customer,emp]);
   await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES($1,$2,true,statement_timestamp()+interval '20 minutes')",[emp,customer]);
   await db.query("INSERT INTO public.f05_priority_employee_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES($1,$2,true,statement_timestamp()+interval '20 minutes')",[emp,customer]);
   await db.query("INSERT INTO public.f05_priority_qualification_test(customer_id,enabled,expires_at) VALUES($1,true,statement_timestamp()+interval '20 minutes')",[customer]);
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES($1,$2,$3,statement_timestamp()+interval '20 minutes')",[customer,emp,customer===64510?'brandId=59001':'brandId=59001;interiorColor=beige']);
  }
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES(64512,'active',64510,64501,'assigned')");
  for(const customer of [64510,64511,64512])
   await db.query("INSERT INTO public.f05_priority_qualification_manage_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(64500,$1,true,statement_timestamp()+interval '20 minutes')",[customer]);
  // Explicit test scopes cannot override nonmanager roles.
  await db.query("INSERT INTO public.f05_priority_qualification_manage_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(64503,64510,true,statement_timestamp()+interval '20 minutes'),(64501,64510,true,statement_timestamp()+interval '20 minutes')");
  await vehicle(64520);await vehicle(64521);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const matching=createIsolatedMatchingService({pool,env:process.env});
 const priority=createIsolatedPriorityService({pool,env:process.env});
 const svc=createIsolatedPriorityQualificationService({pool,env:process.env});
 server=createServer(createFoundationHandler({priorityQualificationHandler:createIsolatedPriorityQualificationHandler(svc,process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const url='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/priority/qualification';
 const post=async({customerId='64510',action='DISABLE',expectedRevision=1,token=tokens[0],eventKey=key()}={})=>{
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',
   authorization:'Bearer '+token,'x-idempotency-key':eventKey},
   body:JSON.stringify({customerId,action,expectedRevision})});
  return {status:r.status,body:await r.json()};
 };
 const matches=async()=>{
  for(const v of ['64520','64521']){
   for(const [d,t] of [['64510',tokens[1]],['64511',tokens[2]]]){
    const res=await matching.recompute({credential:t,demandId:d,vehicleId:v,eventKey:key()});
    assert.equal(res.status,200,JSON.stringify(res));
   }
  }
 };
 await test('PDM13 single-customer toggle may only be manager with explicit current scope',async()=>{
  assert.equal((await post({token:tokens[1]})).status,403);
  assert.equal((await post({token:tokens[3]})).status,403);
  assert.equal((await post({customerId:'999999'})).status,403);
  assert.equal(await count('SELECT count(*) n FROM public.f05_priority_qualification_events_test'),0);
 });
 await test('all current first matches built by PDM12; prior Priority has 2 genuine active F02 rows',async()=>{
  await matches();
  for(const vid of ['64520','64521']){
   const p=await priority.act({credential:tokens[1],action:'RECONCILE',vehicleId:vid,eventKey:key()});
   assert.equal(p.status,200,JSON.stringify(p));assert.equal(p.body.outcome,'NEW');
  }
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64510 AND status='active'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE customer_id=64510"),2);
 });
 await test('invalid stale qualification version is 409 and changes no lease, Demand or Customer level',async()=>{
  const old=await post({expectedRevision:5});
  assert.equal(old.status,409,JSON.stringify(old));assert.equal(old.body.code,'PRIORITY_QUAL_STALE_REVISION');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64510 AND status='active'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_qualification_events_test"),0);
 });
 await test('fault in append-only audit rolls back qualification disable, BOTH ends and re-arbitration',async()=>{
  await db.query("CREATE FUNCTION public.f05_qual_fault() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''QUAL_AUDIT_FAULT''; END'");
  await db.query("CREATE TRIGGER f05_qual_fault BEFORE INSERT ON public.f05_priority_qualification_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_qual_fault()");
  try{
   const fail=await post();
   assert.equal(fail.status,503,JSON.stringify(fail));
   assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64510 AND status='active'"),2);
   assert.equal((await db.query("SELECT enabled,revision FROM public.f05_priority_qualification_test WHERE customer_id=64510")).rows[0].revision,'1');
  }finally{
   await db.query("DROP TRIGGER f05_qual_fault ON public.f05_priority_qualification_events_test");
   await db.query("DROP FUNCTION public.f05_qual_fault()");
  }
 });
 await test('DISABLE closes both original leases, next Customer wins and Demand remains active',async()=>{
  const eventKey=key();
  const a=await Promise.all([post({eventKey}),post({eventKey})]);
  assert.deepEqual(a.map(x=>x.status),[200,200],JSON.stringify(a));
  assert.deepEqual(a.map(x=>x.body.code).sort(),['PRIORITY_QUAL_CHANGED','PRIORITY_QUAL_REPLAY']);
  assert.deepEqual(a.map(x=>x.body.endedCount),[2,2]);
  assert.deepEqual(a.map(x=>x.body.rearbitratedCount),[2,2]);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64510 AND status='active'"),0);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64510 AND status='ended'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64511 AND status='active'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE customer_id=64511"),2);
  assert.equal(await count("SELECT count(*) n FROM public.demands WHERE demand_id=64510 AND demand_state='active'"),1);
  assert.equal(await count("SELECT count(*) n FROM public.customers WHERE customer_id=64510 AND customer_level_id=64510"),1);
  const audit=(await db.query("SELECT after_json,ended_count,rearbitrated_count FROM public.f05_priority_qualification_events_test WHERE event_key=$1",[eventKey])).rows[0];
  assert.equal(audit.after_json.reason,'priority_customer_disabled');
  assert.equal(audit.after_json.revision,2);assert.equal(audit.ended_count,2);
  assert.equal((await post({action:'DISABLE',expectedRevision:1})).body.code,'PRIORITY_QUAL_STALE_REVISION');
 });
 await test('ENABLE only restores Customer qualification, never resurrects ended leases',async()=>{
  const q=await post({action:'ENABLE',expectedRevision:2});
  assert.equal(q.status,200,JSON.stringify(q));assert.equal(q.body.revision,3);
  assert.equal(q.body.needsMatchReevaluation,true);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64510 AND status='active'"),0);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64511 AND status='active'"),2);
  assert.equal(await count("SELECT count(*) n FROM public.demands WHERE demand_id=64510 AND demand_state='active'"),1);
 });
 await test('first qualification ENABLE on Customer without Demand does not create any Priority or application',async()=>{
  const x=await post({customerId:'64512',action:'ENABLE',expectedRevision:0});
  assert.equal(x.status,200,JSON.stringify(x));assert.equal(x.body.enabled,true);
  assert.equal(x.body.revision,1);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=64512"),0);
  assert.equal(await count("SELECT count(*) n FROM public.demands WHERE customer_id=64512"),0);
  assert.equal(await count("SELECT count(*) n FROM public.find_car_applications WHERE customer_id=64512"),0);
 });
 await test('qualification audit is append-only and no Recommendation/Grant/Price right generated',async()=>{
  await assert.rejects(db.query("DELETE FROM public.f05_priority_qualification_events_test WHERE customer_id=64510"),e=>e.code==='23514');
  await assert.rejects(db.query("UPDATE public.f05_priority_qualification_events_test SET ended_count=0 WHERE customer_id=64510"),e=>e.code==='23514');
  for(const tab of ['recommendations','vehicle_visibility_grants','customer_price_cycle_unlocks'])
   assert.equal(await count('SELECT count(*) n FROM public.'+tab+' WHERE vehicle_id BETWEEN 64520 AND 64521'),0,tab);
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
