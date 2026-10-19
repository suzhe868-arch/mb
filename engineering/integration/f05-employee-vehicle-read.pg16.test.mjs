// F05-1 current Employee-scoped Vehicle safe projection, real disposable PG16.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedEmployeeVehicleReadService} from '../src/f05-employee-vehicle-read-service.mjs';
import {createIsolatedEmployeeVehicleReadHandler} from '../src/f05-employee-vehicle-read-http.mjs';
const conf=validateCatalogEnv(),pool=new pg.Pool({connectionString:conf.connectionString,max:4});
const db=new pg.Client({connectionString:conf.connectionString});
const secret=()=>randomBytes(32).toString('base64url'),hash=x=>createHash('sha256').update(x).digest('hex');
const seller=secret(),fourS=secret(),other=secret();
let server,connected=false,error;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
   "(60100,59001,'active','receiving'),(60101,59002,'active','receiving'),(60102,59001,'active','receiving')");
  for(const [bearer,id] of [[seller,60100],[fourS,60101],[other,60102]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '15 minutes')",[hash(bearer),id]);
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES"+
   "(60100,'mingbang','available','visible',statement_timestamp()),"+
   "(60101,'four_s','available','hidden',statement_timestamp()),"+
   "(60102,'wholesale','active','visible',statement_timestamp())");
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES"+
   "(60100,60100,statement_timestamp()),(60101,60101,statement_timestamp()),(60102,60102,statement_timestamp())");
  await db.query("INSERT INTO public.f05_vehicle_read_scope_test(employee_id,vehicle_id,listing_cycle_id,source_type,can_read,expires_at) VALUES"+
   "(60100,60100,60100,'mingbang',true,statement_timestamp()+interval '15 minutes'),"+
   "(60100,60102,60102,'wholesale',true,statement_timestamp()+interval '15 minutes'),"+
   "(60101,60101,60101,'four_s',true,statement_timestamp()+interval '15 minutes'),"+
   "(60101,60102,60102,'wholesale',true,statement_timestamp()+interval '15 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedEmployeeVehicleReadService({pool,env:process.env});
 server=createServer(createFoundationHandler({employeeVehicleReadHandler:createIsolatedEmployeeVehicleReadHandler(service,process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const call=async(vehicleId='60100',bearer=seller,headers={})=>{
  const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/internal/vehicles/'+vehicleId,
   {headers:{authorization:'Bearer '+bearer,...headers}});
  return {status:res.status,body:await res.json()};
 };
 await test('PG16 employee read of explicit current Mingbang and wholesale scope omits VIN, phone and price',async()=>{
  for(const id of ['60100','60102']){
   const x=await call(id);assert.equal(x.status,200,JSON.stringify(x));
   assert.equal(x.body.vehicle.vehicleId,id);
   assert.equal(x.body.price,null);assert.equal(x.body.phone,null);assert.equal(x.body.vin,null);
   assert.equal(x.body.productionReady,false);
   assert.deepEqual(Object.keys(x.body.vehicle).sort(),['listingCycleId','listingStartedAt','platformVisibility','saleStatus','sourceType','vehicleId'].sort());
   assert.equal(JSON.stringify(x.body).includes('source_url_fact'),false);
  }
 });
 await test('PG16 actual 4S member only sees explicitly scoped 4S source; no cross-source Employee privilege',async()=>{
  const allowed=await call('60101',fourS);assert.equal(allowed.status,200);
  assert.equal(allowed.body.vehicle.sourceType,'four_s');
  assert.equal((await call('60102',fourS)).status,404);
  assert.equal((await call('60100',other)).status,404);
  assert.equal((await call('60101',seller)).status,404);
  assert.equal((await call('60100',secret())).status,404);
 });
 await test('PG16 stopped listing cycle, expired Employee scope and revocation immediately deny',async()=>{
  await db.query("UPDATE public.f05_vehicle_read_scope_test SET expires_at=statement_timestamp()-interval '1 second' WHERE employee_id=60100 AND vehicle_id=60102");
  assert.equal((await call('60102')).status,404);
  await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=statement_timestamp() WHERE listing_cycle_id=60100");
  assert.equal((await call('60100')).status,404);
  await db.query("UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1",[hash(fourS)]);
  assert.equal((await call('60101',fourS)).status,404);
  assert.equal((await call('60100',seller,{'x-employee-id':'60100'})).status,403);
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();await pool.end();
}
if(error)throw error;
