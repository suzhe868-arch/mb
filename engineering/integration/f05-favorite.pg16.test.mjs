// F05-3G favorite: real isolated PostgreSQL16 + real Node HTTP, no synthetic production issuer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedFavoriteService} from '../src/f05-favorite-service.mjs';
import {createIsolatedFavoriteHandler} from '../src/f05-favorite-http.mjs';
import {createFoundationHandler} from '../src/app.mjs';
const env=validateCatalogEnv();
const pool=new pg.Pool({connectionString:env.connectionString,max:3,connectionTimeoutMillis:1100});
const writer=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1100});
const vehicleId='59003',cycleId='59003',otherCustomer='59004';
const activeToken=randomBytes(32).toString('base64url');
const disabledToken=randomBytes(32).toString('base64url');
const otherToken=randomBytes(32).toString('base64url');
const sha=s=>createHash('sha256').update(s).digest('hex');
const event=()=>randomBytes(32).toString('base64url');
let server,connected=false,fixture=false,failure;
try{
 await writer.connect();connected=true;
 assert.equal(await probeIsolatedCatalog(pool),true,'F05 PG16 must have exact verified 82-table disposable shape');
 await writer.query('BEGIN');
 try{
  await writer.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES(59004,'active',59001,'owner_assignment_pending')");
  await writer.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES(59003,'wholesale','active','visible',statement_timestamp())");
  await writer.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES(59003,59003,statement_timestamp())");
  await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES(59003,59003,'wholesale',true,statement_timestamp()+interval '10 minutes')");
  for(const [t,id] of [[activeToken,'59001'],[disabledToken,'59002'],[otherToken,otherCustomer]])
   await writer.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '5 minutes')",[sha(t),id]);
  await writer.query('COMMIT');fixture=true;
 }catch(e){await writer.query('ROLLBACK');throw e}
 const svc=createIsolatedFavoriteService({pool,env:process.env});
 const handler=createIsolatedFavoriteHandler(svc,process.env);
 server=createServer(createFoundationHandler({favoriteHandler:handler}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const call=async(method='GET',token=activeToken,key=null,extraHeaders={})=>{
  const headers={authorization:'Bearer '+token,...extraHeaders};
  if(key)headers['x-idempotency-key']=key;
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/vehicles/'+vehicleId+'/favorite',{method,headers});
  return {status:r.status,body:await r.json()};
 };
 await test('real HTTP refuses unknown bearer, disabled Customer and forged actor id',async()=>{
  assert.equal((await call('GET',randomBytes(32).toString('base64url'))).status,401);
  assert.equal((await call('GET',disabledToken)).status,401);
  assert.equal((await call('POST',disabledToken,event())).status,401);
  assert.equal((await call('GET',activeToken,null,{'x-customer-id':'59002'})).status,403);
 });
 await test('physical PG16 Customer row is bound to bearer; initial state absent',async()=>{
  const r=await call();
  assert.equal(r.status,200);assert.equal(r.body.active,false);assert.equal(r.body.version,null);
  assert.equal((await call('GET',otherToken)).body.active,false);
 });
 const keyAdd=event();
 await test('real HTTP POST commits active favorite and immutable audit in PG16',async()=>{
  const r=await call('POST',activeToken,keyAdd);
  assert.equal(r.status,200);assert.equal(r.body.code,'FAVORITE_APPLIED');assert.equal(r.body.active,true);
  assert.equal(r.body.version,'1');
  const x=(await writer.query('SELECT current_state,state_version FROM public.f05_catalog_favorite_states_test WHERE customer_id=59001 AND vehicle_id=59003')).rows[0];
  assert.equal(x.current_state,'active');assert.equal(String(x.state_version),'1');
  const e=(await writer.query('SELECT customer_id,vehicle_id,action FROM public.f05_catalog_favorite_events_test WHERE event_key=$1',[keyAdd])).rows[0];
  assert.equal(String(e.customer_id),'59001');assert.equal(String(e.vehicle_id),vehicleId);assert.equal(e.action,'ADD');
 });
 await test('exact idempotent retry is stable; changed action/customer collision is blocked',async()=>{
  const replay=await call('POST',activeToken,keyAdd);
  assert.equal(replay.status,200);assert.equal(replay.body.code,'FAVORITE_IDEMPOTENT_REPLAY');assert.equal(replay.body.version,'1');
  const collision=await call('DELETE',activeToken,keyAdd);
  assert.equal(collision.status,409);assert.equal(collision.body.code,'FAVORITE_IDEMPOTENCY_COLLISION');
  const across=await call('POST',otherToken,keyAdd);
  assert.equal(across.status,409);assert.equal(across.body.code,'FAVORITE_IDEMPOTENCY_COLLISION');
  const n=(await writer.query('SELECT count(*)::int n FROM public.f05_catalog_favorite_events_test')).rows[0].n;
  assert.equal(n,1);
 });
 await test('different Customer cannot read another favorite',async()=>{
  const r=await call('GET',otherToken);assert.equal(r.status,200);assert.equal(r.body.active,false);
 });
 await test('second ADD is a real audited NOOP without version mutation',async()=>{
  const r=await call('POST',activeToken,event());
  assert.equal(r.status,200);assert.equal(r.body.code,'FAVORITE_NOOP');assert.equal(r.body.version,'1');
 });
 await test('DELETE is a real PG16 state transition; removal is idempotent and audit remains',async()=>{
  const removed=await call('DELETE',activeToken,event());
  assert.equal(removed.status,200);assert.equal(removed.body.active,false);assert.equal(removed.body.version,'2');
  const noop=await call('DELETE',activeToken,event());
  assert.equal(noop.status,200);assert.equal(noop.body.code,'FAVORITE_NOOP');assert.equal(noop.body.version,'2');
  assert.equal((await call()).body.active,false);
 });
 await test('favorite relationship survives source change and old source cannot grant new ADD',async()=>{
  const add=await call('POST',activeToken,event());assert.equal(add.status,200);assert.equal(add.body.version,'3');
  await writer.query("UPDATE public.vehicles SET source_type='mingbang',source_sale_status='available' WHERE vehicle_id=59003");
  try{
   assert.equal((await call()).body.active,true);
   const blocked=await call('POST',activeToken,event());assert.equal(blocked.status,404);
   const remove=await call('DELETE',activeToken,event());assert.equal(remove.status,200);assert.equal(remove.body.active,false);
  }finally{await writer.query("UPDATE public.vehicles SET source_type='wholesale',source_sale_status='active' WHERE vehicle_id=59003")}
 });
 await test('physical hidden vehicle cannot be newly favorited',async()=>{
  await writer.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=59003");
  try{assert.equal((await call('POST',activeToken,event())).status,404)}
  finally{await writer.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=59003")}
 });
 await test('database exception at audit INSERT rolls back previous state update and key',async()=>{
  await writer.query("CREATE FUNCTION public.f05_favorite_inject_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_F05_TX_ROLLBACK'; END $$");
  await writer.query("CREATE TRIGGER f05_catalog_inject_fail BEFORE INSERT ON public.f05_catalog_favorite_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_favorite_inject_fail_test()");
  const before=(await writer.query('SELECT current_state,state_version FROM public.f05_catalog_favorite_states_test WHERE customer_id=59001 AND vehicle_id=59003')).rows[0];
  const k=event();
  try{
   const r=await call('POST',activeToken,k);
   assert.equal(r.status,503);assert.equal(r.body.code,'FAVORITE_DATABASE_UNAVAILABLE');
   const after=(await writer.query('SELECT current_state,state_version FROM public.f05_catalog_favorite_states_test WHERE customer_id=59001 AND vehicle_id=59003')).rows[0];
   assert.deepEqual(after,before);
   assert.equal((await writer.query('SELECT count(*)::int n FROM public.f05_catalog_favorite_events_test WHERE event_key=$1',[k])).rows[0].n,0);
  }finally{
   await writer.query('DROP TRIGGER f05_catalog_inject_fail ON public.f05_catalog_favorite_events_test');
   await writer.query('DROP FUNCTION public.f05_favorite_inject_fail_test()');
  }
  const r=await call('POST',activeToken,k);assert.equal(r.status,200);assert.equal(r.body.active,true);
 });
 await test('PG16 audit append-only trigger refuses UPDATE and DELETE',async()=>{
  const k=keyAdd;
  await assert.rejects(writer.query('UPDATE public.f05_catalog_favorite_events_test SET event_key=$2 WHERE event_key=$1',[k,event()]),e=>e.code==='23514');
  await assert.rejects(writer.query('DELETE FROM public.f05_catalog_favorite_events_test WHERE event_key=$1',[k]),e=>e.code==='23514');
 });
 await test('Customer session revocation immediately fails closed',async()=>{
  await writer.query('UPDATE public.f05_catalog_customer_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[sha(activeToken)]);
  assert.equal((await call('GET',activeToken)).status,401);
  assert.equal((await call('POST',activeToken,event())).status,401);
 });
}catch(e){failure=e;
}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected){
  if(fixture){
   try{
    await writer.query('BEGIN');
    await writer.query('DELETE FROM public.f05_catalog_favorite_events_test WHERE FALSE');
    // Immutable audit remains in disposable DB until the GitHub service container is destroyed.
    // The harness never attempts to alter audit history to fake cleanup.
    await writer.query('COMMIT');
   }catch(e){await writer.query('ROLLBACK').catch(()=>{});failure??=e}
  }
  await writer.end();
 }
 await pool.end();
}
if(failure)throw failure;
