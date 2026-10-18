import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {createCatalogService,encodeCursor,decodeCursor,SQL_CATALOG_LIST,SQL_CATALOG_DETAIL} from '../src/catalog-service.mjs';
import {createCatalogHandler} from '../src/catalog-http.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv} from '../src/catalog-readiness.mjs';
const key=randomBytes(32);
const row={vehicleId:'12',listingCycleId:'33',source:'wholesale',listingStartedAt:'2026-10-15T09:00:00.000Z',modelId:'44',vin:'SENSITIVE123',wholesaleCost:100,phone:'12345678',customerId:123};
const pool={query:async(sql,parameters)=>({rows:sql===SQL_CATALOG_DETAIL?[row]:[row]})};
const service=createCatalogService({pool,cursorKey:key});
const invoke=async(path,method='GET')=>{
 const server=createServer(createFoundationHandler({catalogHandler:createCatalogHandler(service)}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const res=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method});return [res.status,await res.text(),res.headers]}
 finally{await new Promise(resolve=>server.close(resolve))}
};
test('real Node HTTP list safely whitelists row',async()=>{
 const [status,text,headers]=await invoke('/api/v1/catalog/vehicles');
 assert.equal(status,200);assert.equal(headers.get('cache-control'),'no-store');
 assert.deepEqual(JSON.parse(text).items[0],{vehicleId:'12',listingCycleId:'33',source:'wholesale',listingStartedAt:'2026-10-15',modelId:'44',price:null,priceState:'PRICE_ENTITLEMENT_DEPENDENCY_BLOCKED',catalogState:'ISOLATED_TEST_PROJECTION_NOT_PRODUCTION'});
 for(const banned of ['vin','wholesaleCost','phone','customerId','SENSITIVE'])assert.equal(text.includes(banned),false);
});
test('detail returns same safe DTO',async()=>{const [code,b]=await invoke('/api/v1/catalog/vehicles/12');assert.equal(code,200);assert.equal(JSON.parse(b).vehicle.source,'wholesale')});
test('unknown methods prohibited',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles','POST'))[0],405));
test('no unknown filters',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?customerId=20'))[0],400));
test('no SQL injection via ids',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles/1%20OR%201=1'))[0],400));
test('duplicate filters denied',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?source=wholesale&source=mingbang'))[0],400));
test('no unauthorized region',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?region=beijing'))[0],400));
test('fixed 15 per page only',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?pageSize=100'))[0],400));
test('unknown source denied',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?source=internal'))[0],400));
test('unknown sort denied',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?sort=cost'))[0],400));
test('cursor HMAC identity prevents cross-channel reuse',()=>{const cur=encodeCursor({at:row.listingStartedAt,id:row.listingCycleId,source:'wholesale',sort:'newest'},key);assert.equal(decodeCursor(cur,key,'wholesale','newest').id,'33');assert.throws(()=>decodeCursor(cur,key,'four_s','newest'));assert.throws(()=>decodeCursor(cur+'A',key,'wholesale','newest'))});
test('cursor wrong signature denied over HTTP',async()=>assert.equal((await invoke('/api/v1/catalog/vehicles?cursor=evil.invalid'))[0],400));
test('DB unavailable strictly 503 and no secrets',async()=>{const b=createCatalogService({pool:{query:()=>{throw Error('postgres password secret')}},cursorKey:key});const s=createServer(createFoundationHandler({catalogHandler:createCatalogHandler(b)}));await new Promise(ok=>s.listen(0,'127.0.0.1',ok));try{const r=await fetch(`http://127.0.0.1:${s.address().port}/api/v1/catalog/vehicles`),t=await r.text();assert.equal(r.status,503);assert.equal(t.includes('password'),false)}finally{await new Promise(ok=>s.close(ok))}});
test('bad DB row cannot leak raw fields',async()=>{const b=createCatalogService({pool:{query:async()=>({rows:[{...row,source:'admin'}]})},cursorKey:key});const s=createServer(createFoundationHandler({catalogHandler:createCatalogHandler(b)}));await new Promise(ok=>s.listen(0,'127.0.0.1',ok));try{const r=await fetch(`http://127.0.0.1:${s.address().port}/api/v1/catalog/vehicles`);assert.equal(r.status,503)}finally{await new Promise(ok=>s.close(ok))}});
test('catalog SQL requires actual M94 cycle and explicit disposable safe evidence',()=>{for(const s of [SQL_CATALOG_LIST,SQL_CATALOG_DETAIL]){assert.match(s,/FROM public\.vehicles v LEFT JOIN public\.vehicle_models vm/);assert.match(s,/JOIN public\.vehicle_listing_cycles cy ON cy\.vehicle_id=v\.vehicle_id/);assert.match(s,/cy\.ended_at IS NULL/);assert.match(s,/f05_real_catalog_visibility_test/);assert.match(s,/NOT EXISTS\(SELECT 1 FROM public\.f05_real_catalog_protections_test/);assert.doesNotMatch(s,/(?:\$\{.*\})/)} });
test('test-only DB policy strictly refuses production and other PG database',()=>{const base={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY',F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:x@127.0.0.1:5432/f05_catalog_test'};assert.equal(validateCatalogEnv(base).connectionString,base.F05_CATALOG_DATABASE_URL);for(const bad of [{APP_ENV:'production'},{F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:x@127.0.0.1:5432/prod'},{API_HOST:'0.0.0.0'},{F05_CATALOG_TEST_CONSENT:'yes'}])assert.throws(()=>validateCatalogEnv({...base,...bad}))});
