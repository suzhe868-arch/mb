import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingHandler} from '../src/f05-matching-http.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:5});
const db=new pg.Client({connectionString:env.connectionString});
const token=randomBytes(32).toString('base64url'),hash=s=>createHash('sha256').update(s).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let server,connected=false,failure;
try {
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(60000,'f05_race_level')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(60000,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES(60000,'active',60000,60000,'assigned')");
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(60000,60000,60000,'active','{}')");
  await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,60000,statement_timestamp()+interval '20 minutes')",[hash(token)]);
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES(60000,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_employee_scope_test(employee_id,customer_id,can_recompute,expires_at) VALUES(60000,60000,true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_sales_description_test(demand_id,written_by_employee_id,sales_description,expires_at) VALUES(60000,60000,'brandId=59001;maxMileageKm=50000;budgetCents=12000000',statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES(60010,'wholesale','active','visible',59001,statement_timestamp()),(60011,'wholesale','active','visible',59001,statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(60010,60010,statement_timestamp()),(60011,60011,statement_timestamp())");
  await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(60010,60010,'wholesale',true,statement_timestamp()+interval '20 minutes'),(60011,60011,'wholesale',true,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_matching_vehicle_facts_test(vehicle_id,listing_cycle_id,source_brand_id,source_model_year,mileage_km,expires_at) VALUES(60010,60010,59001,2026,20000,statement_timestamp()+interval '20 minutes'),(60011,60011,59001,2026,21000,statement_timestamp()+interval '20 minutes')");
  await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES(60010,60010,'wholesale',11000000,statement_timestamp()+interval '20 minutes'),(60011,60011,'wholesale',11000000,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({matchingHandler:createIsolatedMatchingHandler(createIsolatedMatchingService({pool,env:process.env}),process.env)}));
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const match=async(v='60010')=>{
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/demands/60000/vehicles/'+v+'/recompute-match',
  {method:'POST',headers:{authorization:'Bearer '+token,'x-idempotency-key':randomBytes(32).toString('base64url')}});
  return {status:r.status,body:await r.json()};
 };
 const results=async(v='60010')=>(await db.query("SELECT match_tier,current_state FROM public.demand_match_results WHERE demand_id=60000 AND vehicle_id=$1 ORDER BY result_id",[v])).rows;
 await test('PG16 separate Vehicle baseline Match Results remain current',async()=>{
  assert.equal((await match()).body.matchTier,'high');
  assert.equal((await match('60011')).body.matchTier,'high');
 });
 await test('PG16 price source UPDATE first: recompute waits for commit and sees the new customer price',async()=>{
  await db.query('BEGIN');
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=12600001 WHERE vehicle_id=60010");
  let resolved=false;const pending=match().then(r=>{resolved=true;return r});
  try{await pause(110);assert.equal(resolved,false,'must not read the uncommitted old price')}
  finally{await db.query('COMMIT')}
  const r=await pending;assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.matchTier,'no_match');
  assert.deepEqual((await results()).map(r=>r.current_state),['stale','current']);
  assert.equal((await results('60011'))[0].current_state,'current');
 });
 await test('PG16 mileage source UPDATE first: recompute waits, no stale hard fact published',async()=>{
  await db.query('BEGIN');
  await db.query("UPDATE public.f05_matching_vehicle_facts_test SET mileage_km=90000 WHERE vehicle_id=60010");
  let resolved=false;const pending=match().then(r=>{resolved=true;return r});
  try{await pause(110);assert.equal(resolved,false,'must not read prior vehicle mileage')}
  finally{await db.query('COMMIT')}
  const r=await pending;assert.equal(r.status,200);assert.equal(r.body.matchTier,'no_match');
  assert.equal((await results()).filter(r=>r.current_state==='current').length,1);
 });
 await test('PG16 after changing source again, only next legal recompute can create a new current',async()=>{
  await db.query("UPDATE public.f05_matching_vehicle_facts_test SET mileage_km=20000 WHERE vehicle_id=60010");
  await db.query("UPDATE public.f05_catalog_price_display_proof_test SET customer_display_cents=11000000 WHERE vehicle_id=60010");
  assert.equal((await results()).at(-1).current_state,'stale');
  assert.equal((await match()).body.matchTier,'high');
  assert.equal((await results()).at(-1).current_state,'current');
  assert.equal((await results('60011'))[0].current_state,'current');
  assert.equal((await db.query('SELECT count(*)::int n FROM public.recommendations WHERE customer_id=60000')).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM public.priority_leases WHERE customer_id=60000')).rows[0].n,0);
 });
 await test('PG16 MATCH FIRST physically blocks concurrent price write; writer then immediately stales newly published Match',async()=>{
  // PostgreSQL BEFORE INSERT pause holds the service advisory vehicle lock.
  await db.query("CREATE FUNCTION public.f05_race_hold_insert() RETURNS trigger LANGUAGE plpgsql AS $ "+
    "BEGIN PERFORM pg_sleep(0.45); RETURN NEW; END $");
  await db.query("CREATE TRIGGER f05_race_hold_insert BEFORE INSERT ON public.demand_match_results "+
    "FOR EACH ROW EXECUTE FUNCTION public.f05_race_hold_insert()");
  let write=null;
  try{
   const inProgress=match();
   let found=false;
   for(let i=0;i<65;i++){
    const r=await db.query("SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_locks "+
     "WHERE locktype='advisory' AND granted "+
     "AND classid=hashtext('F05_MATCH_VEHICLE')::oid "+
     "AND objid=hashtext('60010')::oid AND pid<>pg_backend_pid()) yes");
    if(r.rows[0].yes){found=true;break}
    await pause(12);
   }
   assert.equal(found,true,'match must hold physical vehicle transaction advisory lock');
   let changed=false;
   write=(async()=>{
    const conn=await pool.connect();
    try{await conn.query("UPDATE public.f05_catalog_price_display_proof_test "+
     "SET customer_display_cents=12600001 WHERE vehicle_id=60010");changed=true}
    finally{conn.release()}
   })();
   await pause(70);
   assert.equal(changed,false,'source BEFORE trigger must wait on match-held vehicle lock');
   const m=await inProgress;
   assert.equal(m.status,200,JSON.stringify(m.body));
   assert.equal(m.body.matchTier,'high');
   await write;
   const rows=await results();
   assert.equal(rows.at(-1).current_state,'stale',
     'source write after Match must invalidate the freshly committed current result');
   assert.equal(rows.filter(x=>x.current_state==='current').length,0);
   assert.equal((await results('60011'))[0].current_state,'current');
  } finally{
   if(write)await write.catch(()=>{});
   await db.query('DROP TRIGGER f05_race_hold_insert ON public.demand_match_results');
   await db.query('DROP FUNCTION public.f05_race_hold_insert()');
  }
 });
} catch(e){failure=e}finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
