// F05-8 real non-superuser PostgreSQL16 arbitration, TTL, release and match invalidation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedPriorityService} from '../src/f05-priority-service.mjs';
import {createIsolatedPriorityHandler} from '../src/f05-priority-http.mjs';
import {SQL_CATALOG_DETAIL,SQL_CATALOG_LIST,SQL_CATALOG_STATS} from '../src/catalog-service.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:7});
const db=new pg.Client({connectionString:env.connectionString});
const A=randomBytes(32).toString('base64url'),B=randomBytes(32).toString('base64url'),fourS=randomBytes(32).toString('base64url');
const sha=x=>createHash('sha256').update(x).digest('hex');
const key=()=>randomBytes(24).toString('base64url');
let connected=false,server,error;
const count=async(sql,p=[])=>Number((await db.query(sql,p)).rows[0].n);
async function addVehicle(vid){
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'wholesale','active','hidden',59001,statement_timestamp())",[vid]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,statement_timestamp())",[vid]);
 await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'wholesale',true,statement_timestamp()+interval '20 minutes')",[vid]);
 await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,interior_color,expires_at) VALUES($1,$1,59001,2026,20000,'black',statement_timestamp()+interval '20 minutes')",[vid]);
 await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'wholesale',10000000,statement_timestamp()+interval '20 minutes')",[vid]);
}
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(62500,59001,'active','receiving'),(62501,59001,'active','receiving'),(62502,59002,'active','receiving')");
  for(const [id,token] of [[62500,A],[62501,B],[62502,fourS]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[sha(token),id]);
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(62500,'priority_test_fan')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(62500,true,statement_timestamp()+interval '20 minutes')");
  for(const [customer,staff] of [[62500,62500],[62501,62501]]){
   await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES($1,'active',62500,$2,'assigned')",[customer,staff]);
   await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES($1,$2,true,statement_timestamp()+interval '20 minutes')",[staff,customer]);
   await db.query("INSERT INTO public.f05_priority_employee_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES($1,$2,true,statement_timestamp()+interval '20 minutes')",[staff,customer]);
   await db.query("INSERT INTO public.f05_priority_qualification_test(customer_id,enabled,expires_at) VALUES($1,true,statement_timestamp()+interval '20 minutes')",[customer]);
  }
  await db.query("INSERT INTO public.f05_priority_employee_scope_test(employee_id,customer_id,can_manage,expires_at) VALUES(62502,62500,true,statement_timestamp()+interval '20 minutes')");
  for(const [demand,owner,customer,descr,offset] of [
   [62500,62500,62500,'brandId=59001',1],
   [62503,62500,62500,'brandId=59001',2],
   [62501,62501,62501,'brandId=59001;interiorColor=beige',3]]){
   await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json,created_at) VALUES($1,$2,$3,'active','{}',statement_timestamp()-$4::integer*interval '1 day')",[demand,customer,owner,offset]);
   await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES($1,$2,$3,statement_timestamp()+interval '20 minutes')",[demand,owner,descr]);
  }
  await addVehicle(62510);await addVehicle(62511);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const matching=createIsolatedMatchingService({pool,env:process.env});
 const priority=createIsolatedPriorityService({pool,env:process.env});
 server=createServer(createFoundationHandler({priorityHandler:createIsolatedPriorityHandler(priority,process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const endpoint='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/priority';
 const post=async({vehicleId='62510',action='RECONCILE',token=A,eventKey=key(),body=null,headers={}}={})=>{
  const response=await fetch(endpoint,{method:'POST',headers:{
   'content-type':'application/json',authorization:'Bearer '+token,
   'x-idempotency-key':eventKey,...headers},body:JSON.stringify(body??{action,vehicleId})});
  return {status:response.status,body:await response.json()};
 };
 const match=async(d,vehicleId,token)=>matching.recompute({credential:token,
  demandId:String(d),vehicleId:String(vehicleId),eventKey:key()});
 await test('PDM13 uses genuine current high/acceptable and has no priority when no Match',async()=>{
  assert.equal((await post()).status,403);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62510"),0);
  for(const [d,token] of [[62500,A],[62503,A],[62501,B]]){
   const got=await match(d,62510,token);
   assert.equal(got.status,200,JSON.stringify(got));
  }
  assert.equal(await count("SELECT count(*) n FROM public.f05_matching_safe_current_test WHERE vehicle_id=62510"),3);
 });
 await test('two simultaneous real HTTP events elect high over older acceptable; same Customer best Demand wins',async()=>{
  const sameKey=key();const concurrent=await Promise.all([post({eventKey:sameKey}),post({eventKey:sameKey})]);
  assert.deepEqual(concurrent.map(x=>x.status),[200,200],JSON.stringify(concurrent));
  assert.deepEqual(concurrent.map(x=>x.body.code).sort(),['PRIORITY_EVENT_REPLAY','PRIORITY_RECONCILED']);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62510 AND status='active'"),1);
  const p=(await db.query("SELECT * FROM public.priority_leases WHERE vehicle_id=62510 AND status='active'")).rows[0];
  assert.equal(String(p.customer_id),'62500');assert.equal(String(p.trigger_demand_id),'62503');
  assert.ok(new Date(p.expires_at)>new Date());
  assert.ok(new Date(p.expires_at).getTime()-Date.now()<=86400000);
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=62510"),1);
  await db.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=62510");
  assert.match(SQL_CATALOG_LIST,/f05_priority_safe_active_test/);
  assert.match(SQL_CATALOG_STATS,/f05_priority_safe_active_test/);
  assert.equal((await db.query(SQL_CATALOG_DETAIL,['62510'])).rows.length,0);
  for(const name of ['recommendations','vehicle_visibility_grants','customer_price_cycle_unlocks'])
   assert.equal(await count('SELECT count(*) n FROM public.'+name+' WHERE vehicle_id=62510'),0,name);
  assert.equal((await post({token:fourS})).status,403);
  await assert.rejects(db.query("UPDATE public.priority_leases SET expires_at=statement_timestamp()+interval '5 days' WHERE priority_id=$1",[p.priority_id]),e=>e.code==='23514');
 });
 await test('explicit release by trigger Employee suppresses ALL older matching versions, re-arbitrates second Customer',async()=>{
  const denied=await post({action:'RELEASE',token:B});
  assert.equal(denied.status,403,JSON.stringify(denied));
  const res=await post({action:'RELEASE',token:A});
  assert.equal(res.status,200,JSON.stringify(res));assert.equal(res.body.outcome,'REARBITRATED');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62510 AND status='active'"),1);
  const winner=(await db.query("SELECT * FROM public.priority_leases WHERE vehicle_id=62510 AND status='active'")).rows[0];
  assert.equal(String(winner.customer_id),'62501');
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_suppression_test WHERE customer_id=62500 AND vehicle_id=62510"),1);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE customer_id=62500 AND vehicle_id=62510 AND status='ended'"),1);
  assert.equal((await post({token:B})).body.outcome,'UNCHANGED');
 });
 await test('other Customer release leaves no old-source resurrection; genuine recompute is new opportunity',async()=>{
  const gone=await post({action:'RELEASE',token:B});
  assert.equal(gone.status,200,JSON.stringify(gone));assert.equal(gone.body.outcome,'ENDED');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62510 AND status='active'"),0);
  assert.equal((await db.query(SQL_CATALOG_DETAIL,['62510'])).rows.length,1);
  const suppressed=await post();
  assert.equal(suppressed.status,200,JSON.stringify(suppressed));
  assert.equal(suppressed.body.outcome,'NO_CANDIDATE'); // A's old Match cannot renew protection.
  const fresh=await match(62500,62510,A);
  assert.equal(fresh.status,200,JSON.stringify(fresh));
  const returned=await post({token:A});
  assert.equal(returned.status,200,JSON.stringify(returned));
  assert.equal(returned.body.outcome,'NEW');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62510 AND status='active' AND customer_id=62500"),1);
 });
 await test('PDM12 fact mutation immediately hides old Priority from read-time view; legitimate owner ends stale lease',async()=>{
  await db.query("UPDATE public.f05_matching_vehicle_facts_test SET mileage_km=50000 WHERE vehicle_id=62510");
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=62510"),0);
  const stale=await post({token:A});
  assert.equal(stale.status,200,JSON.stringify(stale));assert.equal(stale.body.outcome,'ENDED');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62510 AND status='active'"),0);
 });
 await test('expired active Priority is ended before any re-arbitration; no TTL resurrection',async()=>{
  for(const [d,token] of [[62500,A],[62503,A],[62501,B]]){
   const got=await match(d,62511,token);assert.equal(got.status,200,JSON.stringify(got));
  }
  const earliest=(await db.query("SELECT result_id FROM public.demand_match_results WHERE demand_id=62503 AND vehicle_id=62511 AND current_state='current'")).rows[0];
  const old=(await db.query("INSERT INTO public.priority_leases "+
   "(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
   "VALUES(62511,62500,62503,'active',statement_timestamp()-interval '1 second',62511,$1) RETURNING priority_id",
   [earliest.result_id])).rows[0];
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=62511"),0);
  const result=await post({vehicleId:'62511',token:A});
  assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.body.outcome,'REARBITRATED');
  const winner=(await db.query("SELECT * FROM public.priority_leases WHERE vehicle_id=62511 AND status='active'")).rows[0];
  assert.equal(String(winner.customer_id),'62501');
  assert.notEqual(String(winner.priority_id),String(old.priority_id));
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_suppression_test WHERE vehicle_id=62511 AND customer_id=62500"),1);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62511 AND status='ended'"),1);
 });
 await test('active Lock blocks Priority and read-side protection; releasing occupancy requires new lease',async()=>{
  await db.query("INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) "+
    "VALUES(62520,62511,62500,62511,'active',62500,statement_timestamp(),statement_timestamp()+interval '72 hours')");
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=62511"),0);
  const close=await post({vehicleId:'62511',token:B});
  assert.equal(close.status,200,JSON.stringify(close));assert.equal(close.body.outcome,'ENDED');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62511 AND status='active'"),0);
  await db.query("UPDATE public.locks SET lock_status='cancelled',end_reason='test_customer_cancelled' WHERE lock_id=62520");
  const restored=await post({vehicleId:'62511',token:B});
  assert.equal(restored.status,200,JSON.stringify(restored));assert.equal(restored.body.outcome,'NEW');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62511 AND status='active'"),1);
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62511 AND status='ended'"),2);
 });
 await test('qualification disabled makes active Priority read-time invalid and closes without regrant',async()=>{
  await db.query("UPDATE public.f05_priority_qualification_test SET enabled=false WHERE customer_id=62501");
  assert.equal(await count("SELECT count(*) n FROM public.f05_priority_safe_active_test WHERE vehicle_id=62511"),0);
  const ended=await post({vehicleId:'62511',token:B});
  assert.equal(ended.status,200,JSON.stringify(ended));assert.equal(ended.body.outcome,'ENDED');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62511 AND status='active'"),0);
  await db.query("UPDATE public.f05_priority_qualification_test SET enabled=true WHERE customer_id=62501");
  const newSource=await post({vehicleId:'62511',token:B});
  assert.equal(newSource.status,200,JSON.stringify(newSource));assert.equal(newSource.body.outcome,'NEW');
  assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62511 AND status='active'"),1);
 });
 await test('concurrent qualification revocation cannot issue a Priority from a stale enabled snapshot',async()=>{
  await addVehicle(62512);
  const source=await match(62503,62512,A);
  assert.equal(source.status,200,JSON.stringify(source));
  const revoker=await pool.connect();
  let committed=false;
  try{
   await revoker.query('BEGIN');
   await revoker.query("UPDATE public.f05_priority_qualification_test SET enabled=false WHERE customer_id=62500");
   // The Priority read may see the previously committed enabled=true value.
   // Its FINAL FOR SHARE must wait for this writer, then recheck false.
   const pending=post({vehicleId:'62512',token:A});
   await new Promise(resolve=>setTimeout(resolve,75));
   await revoker.query('COMMIT');committed=true;
   const result=await pending;
   assert.equal(result.status,200,JSON.stringify(result));
   assert.equal(result.body.outcome,'NO_CANDIDATE',JSON.stringify(result));
   assert.equal(await count("SELECT count(*) n FROM public.priority_leases WHERE vehicle_id=62512 AND status='active'"),0);
  }finally{
   if(!committed)await revoker.query('ROLLBACK').catch(()=>{});
   revoker.release();
  }
 });
 await test('append-only audit cannot be erased; Priority release cannot create Recommendation or grant',async()=>{
  await assert.rejects(db.query("DELETE FROM public.f05_priority_events_test WHERE vehicle_id=62510"),e=>e.code==='23514');
  await assert.rejects(db.query("UPDATE public.f05_priority_suppression_test SET reason='ttl_expired' WHERE vehicle_id=62510"),e=>e.code==='23514');
  for(const n of ['recommendations','vehicle_visibility_grants','customer_price_cycle_unlocks'])
   assert.equal(await count('SELECT count(*) n FROM public.'+n+' WHERE vehicle_id IN (62510,62511)'),0,n);
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
