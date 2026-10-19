// PDM-20 six legal catalog sorts on physical F02 vehicles + disposable verified sort facts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {createCatalogService} from '../src/catalog-service.mjs';
import {createCatalogHandler} from '../src/catalog-http.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:4,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1200});
let server,connected=false,failure;
const ids=Array.from({length:16},(_,i)=>String(62950+i));
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.vehicle_brands(brand_id,brand_name) VALUES(62950,'排序隔离品牌')");
  await db.query("INSERT INTO public.vehicle_series(series_id,brand_id,series_name) VALUES(62950,62950,'排序隔离车系')");
  await db.query("INSERT INTO public.vehicle_models(model_id,brand_id,series_id,model_name,model_year,profile_status) VALUES(62950,62950,62950,'排序隔离车型',2026,'incomplete')");
  for(let i=0;i<ids.length;i++){
   const id=ids[i],started=new Date(Date.UTC(2026,9,19,0,i,0));
   await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,model_id,created_at) VALUES($1,'mingbang','available','visible',62950,statement_timestamp())",[id]);
   await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$1,$2)",[id,started]);
   await db.query("INSERT INTO public.f05_real_catalog_visibility_test(vehicle_id,listing_cycle_id,source_type,allow_anonymous,expires_at) VALUES($1,$1,'mingbang',true,statement_timestamp()+interval '25 minutes')",[id]);
   const price=i<14?String(1000000+i*10000):null;
   await db.query("INSERT INTO public.f05_catalog_price_display_proof_test(vehicle_id,listing_cycle_id,source_type,customer_display_cents,expires_at) VALUES($1,$1,'mingbang',$2,statement_timestamp()+interval '25 minutes')",[id,price]);
   await db.query("INSERT INTO public.f05_catalog_sort_facts_test(vehicle_id,listing_cycle_id,source_type,first_registration_year,mileage_km,expires_at) VALUES($1,$1,'mingbang',$2,$3,statement_timestamp()+interval '25 minutes')",[id,2000+i,(15-i)*1000]);
  }
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const handler=createCatalogHandler(createCatalogService({pool,cursorKey:randomBytes(32)}));
 server=createServer(createFoundationHandler({catalogHandler:handler}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const get=async q=>{
  const r=await fetch('http://127.0.0.1:'+server.address().port+q);
  return {status:r.status,body:await r.json()};
 };
 const all=async sort=>{
  const root='/api/v1/catalog/vehicles?source=mingbang&modelId=62950&sort='+sort;
  const first=await get(root);
  assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.items.length,15);
  assert.ok(first.body.nextCursor,sort);
  const second=await get(root+'&cursor='+encodeURIComponent(first.body.nextCursor));
  assert.equal(second.status,200,JSON.stringify(second.body));assert.equal(second.body.items.length,1);
  const items=[...first.body.items,...second.body.items];
  assert.equal(items.length,16);
  for(const item of items){
   assert.equal(item.price,null,'server-side price sort must not disclose protected numeric price');
   assert.equal('sortPriceCents' in item,false);
   assert.equal('sortRegistrationYear' in item,false);
   assert.equal('sortMileageKm' in item,false);
  }
  return {ids:items.map(x=>x.vehicleId),cursor:first.body.nextCursor};
 };
 await test('PG16 price ascending/descending keeps consultation rows after all numeric prices and newest among consultation rows',async()=>{
  const asc=await all('price_asc');
  assert.deepEqual(asc.ids,[...ids.slice(0,14),ids[15],ids[14]]);
  const desc=await all('price_desc');
  assert.deepEqual(desc.ids,[...ids.slice(0,14).reverse(),ids[15],ids[14]]);
  const cross=await get('/api/v1/catalog/vehicles?source=mingbang&modelId=62950&sort=price_desc&cursor='+encodeURIComponent(asc.cursor));
  assert.equal(cross.status,400);assert.equal(cross.body.code,'INVALID_CURSOR');
 });
 await test('PG16 first registration year sorts independently from model year',async()=>{
  assert.deepEqual((await all('registration_year_desc')).ids,[...ids].reverse());
  assert.deepEqual((await all('registration_year_asc')).ids,ids);
  const masters=(await db.query("SELECT DISTINCT vm.model_year,s.first_registration_year FROM public.vehicles v JOIN public.vehicle_models vm ON vm.model_id=v.model_id JOIN public.f05_catalog_sort_facts_test s ON s.vehicle_id=v.vehicle_id WHERE v.model_id=62950 ORDER BY s.first_registration_year")).rows;
  assert.equal(masters.every(x=>x.model_year===2026),true);
  assert.equal(new Set(masters.map(x=>x.first_registration_year)).size,16);
 });
 await test('PG16 mileage low/high sorts use verified cycle facts and deterministic signed pagination',async()=>{
  assert.deepEqual((await all('mileage_asc')).ids,[...ids].reverse());
  assert.deepEqual((await all('mileage_desc')).ids,ids);
 });
}catch(e){failure=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
