// Real PostgreSQL16 + real loopback HTTP integration. Run ONLY against an explicitly
// authorised disposable M94 fixture with the additive v27 test-only sidecars.
// The HTTP app uses a different PostgreSQL backend from the fixture writer.
// If PG16, pg driver, or preseeded M94 Vehicle/Cycle is unavailable, fail (never skip).
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {createCatalogService} from '../src/catalog-service.mjs';
import {createCatalogHandler} from '../src/catalog-http.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';

function guard(){
 const env=validateCatalogEnv();
 const vehicle=process.env.F05_CATALOG_TEST_VEHICLE_ID||'';
 const cycle=process.env.F05_CATALOG_TEST_CYCLE_ID||'';
 if(!/^[1-9]\d{0,14}$/.test(vehicle)||!/^[1-9]\d{0,14}$/.test(cycle))
  throw Error('NEED_REAL_F05_PG16_SEEDED_VEHICLE_CYCLE');
 return {...env,vehicle,cycle};
}
const cfg=guard();
const {default:pg}=await import('pg');
const writer=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1100});
const reader=new pg.Pool({connectionString:cfg.connectionString,max:2,connectionTimeoutMillis:1100});
let connected=false,created=false,transaction=false,server;
let failure=null;
try{
 await writer.connect();connected=true;
 assert.equal(await probeIsolatedCatalog(reader),true,'PG16 version, exact identity, columns, and FKs must match before any write');
 const baseline=(await writer.query('SELECT v.source_type,v.source_sale_status,v.platform_visibility,v.archived_at,cy.started_at,cy.ended_at FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id WHERE v.vehicle_id=$1 AND cy.listing_cycle_id=$2',[cfg.vehicle,cfg.cycle])).rows[0];
 assert.ok(baseline,'M94 real vehicle and listing cycle must be preseeded');
 assert.equal(baseline.archived_at,null);assert.equal(baseline.ended_at,null);
 assert.equal(baseline.platform_visibility,'visible');
 assert.ok((baseline.source_type==='wholesale'&&baseline.source_sale_status==='active')||(['mingbang','four_s'].includes(baseline.source_type)&&baseline.source_sale_status==='available'));
 const duplicateCurrent=(await writer.query('SELECT count(*)::integer AS n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1 AND ended_at IS NULL',[cfg.vehicle])).rows[0].n;
 assert.equal(duplicateCurrent,1,'No ambiguous current ListingCycle fixture');
 const preexisting=(await writer.query('SELECT (SELECT count(*) FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=$1 AND listing_cycle_id=$2) AS proof,(SELECT count(*) FROM public.f05_real_catalog_protections_test WHERE vehicle_id=$1 AND listing_cycle_id=$2) AS protections',[cfg.vehicle,cfg.cycle])).rows[0];
 assert.equal(Number(preexisting.proof),0,'Refuse to overwrite prior proof');
 assert.equal(Number(preexisting.protections),0,'Refuse to erase existing protections');

 await writer.query('BEGIN');transaction=true;
 await writer.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,allow_anonymous,expires_at) VALUES($1,$2,true,statement_timestamp()+interval '10 minutes')",[cfg.vehicle,cfg.cycle]);
 // This assertion would fail if the HTTP reader accidentally reused writer's transaction.
 const beforeCommit=(await reader.query('SELECT count(*)::integer AS n FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=$1 AND listing_cycle_id=$2',[cfg.vehicle,cfg.cycle])).rows[0].n;
 assert.equal(beforeCommit,0,'Independent pool cannot see uncommitted proof');
 await writer.query('COMMIT');transaction=false;created=true;

 const service=createCatalogService({pool:reader,cursorKey:randomBytes(32)});
 server=createServer(createFoundationHandler({catalogHandler:createCatalogHandler(service)}));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const get=async(path)=>{const res=await fetch(`http://127.0.0.1:${server.address().port}${path}`);return {status:res.status,body:await res.json()}};
 await test('PG16 committed physical proof -> independent HTTP detail positive',async()=>{
  const {status,body}=await get(`/api/v1/catalog/vehicles/${cfg.vehicle}`);
  assert.equal(status,200);assert.equal(body.vehicle.vehicleId,cfg.vehicle);
  assert.equal(body.vehicle.price,null);assert.equal(body.productionReady,false);
  assert.equal(JSON.stringify(body).includes('vin'),false);
 });
 await test('PG16 committed physical proof -> independent HTTP list positive',async()=>{
  const {status,body}=await get(`/api/v1/catalog/vehicles?source=${baseline.source_type}`);
  assert.equal(status,200);assert.ok(body.items.some(x=>x.vehicleId===cfg.vehicle));
 });
 await test('uncommitted PRIORITY does not incorrectly hide from independent reader',async()=>{
  await writer.query('BEGIN');transaction=true;
  await writer.query("INSERT INTO public.f05_real_catalog_protections_test(vehicle_id,listing_cycle_id,protection_kind) VALUES($1,$2,'PRIORITY')",[cfg.vehicle,cfg.cycle]);
  assert.equal((await get(`/api/v1/catalog/vehicles/${cfg.vehicle}`)).status,200);
  await writer.query('COMMIT');transaction=false;
  assert.equal((await get(`/api/v1/catalog/vehicles/${cfg.vehicle}`)).status,404);
  assert.equal((await get(`/api/v1/catalog/vehicles?source=${baseline.source_type}`)).body.items.some(x=>x.vehicleId===cfg.vehicle),false);
 });
 await test('disabling protection restores only the disposable eligible vehicle',async()=>{
  await writer.query("DELETE FROM public.f05_real_catalog_protections_test WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND protection_kind='PRIORITY'",[cfg.vehicle,cfg.cycle]);
  assert.equal((await get(`/api/v1/catalog/vehicles/${cfg.vehicle}`)).status,200);
 });
 await test('expires_at is a physical fail-closed expiry, not cached HTTP privilege',async()=>{
  await writer.query("UPDATE public.f05_real_catalog_visibility_test SET expires_at=statement_timestamp()-interval '1 minute' WHERE vehicle_id=$1 AND listing_cycle_id=$2",[cfg.vehicle,cfg.cycle]);
  assert.equal((await get(`/api/v1/catalog/vehicles/${cfg.vehicle}`)).status,404);
 });
 await test('malformed query cannot leak SQL information',async()=>{
  const {status,body}=await get('/api/v1/catalog/vehicles?source=wholesale%27%20OR%201%3D1');
  assert.equal(status,400);assert.equal(JSON.stringify(body).includes('database'),false);
 });
}catch(error){failure=error;
}finally{
 if(server)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
 if(connected){
  if(transaction)try{await writer.query('ROLLBACK')}catch(e){failure??=e}
  if(created){
   try{
    await writer.query('BEGIN');
    await writer.query('DELETE FROM public.f05_real_catalog_protections_test WHERE vehicle_id=$1 AND listing_cycle_id=$2',[cfg.vehicle,cfg.cycle]);
    await writer.query('DELETE FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=$1 AND listing_cycle_id=$2',[cfg.vehicle,cfg.cycle]);
    await writer.query('COMMIT');
    const after=(await writer.query('SELECT count(*)::integer AS n FROM public.f05_real_catalog_visibility_test WHERE vehicle_id=$1 AND listing_cycle_id=$2',[cfg.vehicle,cfg.cycle])).rows[0].n;
    assert.equal(after,0,'Disposable test sidecar must be cleaned after run');
   }catch(e){try{await writer.query('ROLLBACK')}catch{}failure??=e}
  }
  await writer.end();
 }
 await reader.end();
}
if(failure)throw failure;
