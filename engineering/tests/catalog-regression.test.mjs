// Executable real loopback HTTP regression. Database replies are deliberately
// injected stubs; none of these tests constitute PostgreSQL 16 validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {
 createCatalogService, encodeCursor, decodeCursor,
 SQL_CATALOG_LIST, SQL_CATALOG_LIST_OLD, SQL_CATALOG_DETAIL,
} from '../src/catalog-service.mjs';
import {createCatalogHandler} from '../src/catalog-http.mjs';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog,SQL_CATALOG_IDENTITY,SQL_CATALOG_SCHEMA} from '../src/catalog-readiness.mjs';

const secret=randomBytes(32);
const row=(i,at='2026-10-15T09:00:00.123456Z',source='wholesale')=>({
 vehicleId:String(i),listingCycleId:String(i+1000),source,listingStartedAt:at,
 modelId:'123456789012345678',vin:'VIN_NEVER_EXPOSE',wholesaleCost:902991,customerEmail:'private@private.example',
 upstreamPublisherPhone:'PRIVATE_CALLER',transactionCustomerId:'hidden-client',
});
async function request(pool,path,method='GET'){
 const handler=createCatalogHandler(createCatalogService({pool,cursorKey:secret}));
 const app=createServer(createFoundationHandler({catalogHandler:handler}));
 await new Promise((resolve,reject)=>app.once('error',reject).listen(0,'127.0.0.1',resolve));
 try{
  const res=await fetch(`http://127.0.0.1:${app.address().port}${path}`,{method});
  return {status:res.status,body:await res.json(),headers:res.headers};
 }finally{await new Promise(resolve=>app.close(resolve))}
}
const byRows=(fn=()=>[row(1)])=>({query:async(sql,params)=>({rows:fn(sql,params)})});

// Signed cursor must bind exact channel, order and microsecond precision.
test('PostgreSQL temporal ordering retains six fractional digits end-to-end',async()=>{
 const at='2026-10-15T09:00:00.123456Z';
 assert.match(SQL_CATALOG_LIST,/to_char\(cy\.started_at AT TIME ZONE 'UTC'/);
 assert.match(SQL_CATALOG_LIST,/HH24:MI:SS\.US/);
 assert.match(SQL_CATALOG_LIST,/< \(\$2::timestamptz,\$3::bigint\)/);
 assert.match(SQL_CATALOG_LIST_OLD,/> \(\$2::timestamptz,\$3::bigint\)/);
 const captured=[];
 const pool=byRows((s,p)=>{captured.push({sql:s,params:p});return captured.length===1?Array.from({length:16},(_,k)=>row(k+1,at)):[row(17,at)]});
 const first=await request(pool,'/api/v1/catalog/vehicles');
 assert.equal(first.status,200);assert.equal(first.body.items.length,15);
 const cursor=first.body.nextCursor;
 assert.equal(decodeCursor(cursor,secret,'wholesale','newest').at,at);
 const next=await request(pool,'/api/v1/catalog/vehicles?cursor='+encodeURIComponent(cursor));
 assert.equal(next.status,200);assert.equal(next.body.items[0].vehicleId,'17');
 assert.equal(captured[1].params[1],at);assert.equal(captured[1].params[2],'1015');
 assert.equal(next.body.nextCursor,null);
});
test('real HTTP oldest SQL switches comparison and preserves exact source',async()=>{
 let queried;
 const r=await request(byRows((s,p)=>{queried=[s,p];return [row(7,'2026-10-15T09:00:00.123456Z','four_s')]}),'/api/v1/catalog/vehicles?source=four_s&sort=oldest');
 assert.equal(r.status,200);assert.equal(r.body.source,'four_s');assert.equal(r.body.sort,'oldest');
 assert.equal(queried[0],SQL_CATALOG_LIST_OLD);assert.equal(queried[1][0],'four_s');
});
test('large signed PostgreSQL bigint safely roundtrips without numeric coercion',async()=>{
 const id='9223372036854775807',ts='2026-10-15T09:00:00.123456Z';
 const tok=encodeCursor({at:ts,id,source:'mingbang',sort:'oldest'},secret);
 assert.equal(decodeCursor(tok,secret,'mingbang','oldest').id,id);
 const r=await request(byRows((s,p)=>[{
  ...row(8,ts,'mingbang'),vehicleId:id,listingCycleId:id,modelId:id,
 }]),'/api/v1/catalog/vehicles/'+id);
 assert.equal(r.status,200);assert.equal(r.body.vehicle.vehicleId,id);assert.equal(r.body.vehicle.modelId,id);
});
test('postgreSQL signed upper bound cannot be exceeded',async()=>{
 assert.equal((await request(byRows(),'/api/v1/catalog/vehicles/9223372036854775808')).status,400);
 assert.equal((await request(byRows(),'/api/v1/catalog/vehicles/0001')).status,400);
});
for(const bad of [
 '/api/v1/catalog/vehicles?cursor=a.b.c',
 '/api/v1/catalog/vehicles?cursor=%2Fsecret',
 '/api/v1/catalog/vehicles?sort=oldest&cursor=bad.bad',
 '/api/v1/catalog/vehicles?sort=UNKNOWN',
 '/api/v1/catalog/vehicles?source=wholesale%20OR%20true',
 '/api/v1/catalog/vehicles?source=wholesale&source=wholesale',
 '/api/v1/catalog/vehicles?__proto__=1',
 '/api/v1/catalog/vehicles?pageSize=15.0',
 '/api/v1/catalog/vehicles?region=other',
 '/api/v1/catalog/vehicles?source=FOUR_S',
 '/api/v1/catalog/vehicles?pageSize=-1',
 '/api/v1/catalog/vehicles?sort=price_asc',
])test(`bad HTTP query denied: ${bad.slice(0,55)}`,async()=>{
 const r=await request(byRows(),bad);assert.equal(r.status,400);
 assert.ok(r.body.code);assert.equal(JSON.stringify(r.body).includes('private@private.example'),false);
});
for(const wrong of ['four_s','mingbang'])test(`cursor cross-channel ${wrong} denied`,async()=>{
 const cursor=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'1001',source:'wholesale',sort:'newest'},secret);
 const r=await request(byRows(),`/api/v1/catalog/vehicles?source=${wrong}&cursor=${encodeURIComponent(cursor)}`);
 assert.equal(r.status,400);assert.equal(r.body.code,'INVALID_CURSOR');
});
test('cursor cross-order denied',async()=>{
 const cursor=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'1001',source:'wholesale',sort:'newest'},secret);
 assert.equal((await request(byRows(),'/api/v1/catalog/vehicles?sort=oldest&cursor='+encodeURIComponent(cursor))).status,400);
});
test('cursor from different signing secret rejected',async()=>{
 const cursor=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'1001',source:'wholesale',sort:'newest'},randomBytes(32));
 assert.equal((await request(byRows(),'/api/v1/catalog/vehicles?cursor='+encodeURIComponent(cursor))).status,400);
});
test('source-mismatched or untyped database projection is blocked',async()=>{
 for(const overrides of [{source:'unknown'},{listingStartedAt:'yesterday'},{vehicleId:'-1'},{modelId:'9223372036854775808'},{listingCycleId:'00'}]){
  const r=await request(byRows(()=>[{...row(5),...overrides}]),'/api/v1/catalog/vehicles');
  assert.equal(r.status,503,JSON.stringify(overrides));
  assert.equal(Object.keys(r.body).join(','),'code');
 }
});
test('HTTP only exposes declared DTO whitelist for 3 physical source kinds',async()=>{
 for(const source of ['wholesale','mingbang','four_s']){
  const id=source==='four_s'?8:source==='mingbang'?7:6;
  const r=await request(byRows(()=>[row(id,'2026-10-15T09:00:00.123456Z',source)]),`/api/v1/catalog/vehicles/${id}`);
  assert.equal(r.status,200);
  assert.deepEqual(Object.keys(r.body.vehicle).sort(),['catalogState','listingCycleId','listingStartedAt','modelId','price','priceState','source','vehicleId'].sort());
  assert.equal(r.body.vehicle.price,null);
  const json=JSON.stringify(r.body);
  for(const leak of ['VIN_NEVER_EXPOSE','PRIVATE_CALLER','private@private.example','wholesaleCost','transactionCustomerId'])assert.equal(json.includes(leak),false);
 }
});
test('detail never returns caller-controlled query-context price or priority grant',async()=>{
 const bad=await request(byRows(),'/api/v1/catalog/vehicles/7?customerId=7&unlock=1');
 assert.equal(bad.status,400);
});
test('SQL physically protects hidden, terminated cycles, and test-only proof TTL',()=>{
 for(const sql of [SQL_CATALOG_LIST,SQL_CATALOG_LIST_OLD,SQL_CATALOG_DETAIL]){
  for(const expected of ['v.platform_visibility=\'visible\'','cy.ended_at IS NULL','v.archived_at IS NULL',
   'p.allow_anonymous=true',"p.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'",
   'p.expires_at>statement_timestamp()','NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test'])assert.ok(sql.includes(expected),expected);
  for(const unsafe of ['customer_price_unlock_events','wholesale_phone','VIN_NEVER_EXPOSE'])assert.equal(sql.includes(unsafe),false);
 }
});
test('query always parameterized: search ID cannot affect SQL string',async()=>{
 let params;
 const r=await request(byRows((s,p)=>{assert.equal(s,SQL_CATALOG_DETAIL);params=p;return []}),'/api/v1/catalog/vehicles/88888');
 assert.equal(r.status,404);assert.deepEqual(params,['88888']);
});
test('dependency error message is never exposed to HTTP clients',async()=>{
 const fake={query:async()=>{throw Error('postgres://admin:secret@127.0.0.1/private_database')}};
 const r=await request(fake,'/api/v1/catalog/vehicles/77');
 assert.equal(r.status,503);assert.deepEqual(r.body,{code:'CATALOG_DEPENDENCY_NOT_READY'});
});
test('unimplemented POST endpoints cannot silently perform writes',async()=>{
 for(const path of ['/api/v1/catalog/vehicles','/api/v1/catalog/vehicles/12']){
  const r=await request(byRows(),path,'POST');assert.equal(r.status,405);
 }
});
test('unsupported API path returns NOT_IMPLEMENTED or NOT_FOUND and never database data',async()=>{
 assert.equal((await request(byRows(),'/api/v1/f05/priority/1')).status,404);
 assert.equal((await request(byRows(),'/api/v1/catalog/vehicles/12/other')).status,404);
});
test('test database policy denies no-credential, wrong host, wrong user, wrong mode',()=>{
 const base={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY',F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:pass@127.0.0.1:5432/f05_catalog_test'};
 for(const overrides of [{APP_ENV:'development'},{NODE_ENV:'production'},{F05_CATALOG_DATABASE_URL:'postgres://root:pass@127.0.0.1:5432/f05_catalog_test'},
 {F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:pass@remote.example:5432/f05_catalog_test'},
 {F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:pass@127.0.0.1:5432/other'},
 {F05_CATALOG_DATABASE_URL:'http://f05_catalog_ci:pass@127.0.0.1:5432/f05_catalog_test'},
 {F05_CATALOG_TEST_CONSENT:'yes'},{API_HOST:'0.0.0.0'}])assert.throws(()=>validateCatalogEnv({...base,...overrides}));
});

// Corrupt or competing current cycles must fail closed, never select arbitrary cycle.
test('multiple visible rows for same detail return 503, not arbitrary current cycle',async()=>{
 const r=await request(byRows(()=>[row(7),row(7)]),'/api/v1/catalog/vehicles/7');
 assert.equal(r.status,503);assert.equal(r.body.code,'CATALOG_DEPENDENCY_NOT_READY');
});
test('SQL explicitly excludes a vehicle with two simultaneous current cycles',()=>{
 for(const sql of [SQL_CATALOG_LIST,SQL_CATALOG_LIST_OLD,SQL_CATALOG_DETAIL]){
  assert.match(sql,/NOT EXISTS\(SELECT 1 FROM public\.vehicle_listing_cycles other/);
  assert.match(sql,/other\.ended_at IS NULL/);
 }
});

test('readiness uses physical database identity and all four required relations',async()=>{
 const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160009,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[{v:true,c:true,p:true,x:true,shape:true,fk:true}]}};
 assert.equal(await probeIsolatedCatalog(pool),true);
 assert.match(SQL_CATALOG_SCHEMA,/to_regclass\('public\.vehicles'\)/);
 assert.match(SQL_CATALOG_SCHEMA,/pg_catalog\.pg_attribute/);
 assert.match(SQL_CATALOG_SCHEMA,/pg_catalog\.pg_constraint/);
});
test('readiness fails if a physical table disappears after startup',async()=>{
 const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160009,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[{v:true,c:true,p:false,x:true,shape:true,fk:true}]}};
 assert.equal(await probeIsolatedCatalog(pool),false);
});
test('readiness never confuses PG17 or other database role with isolated PG16',async()=>{
 for(const identity of [{v:170003,db:'f05_catalog_test',role:'f05_catalog_ci'},
 {v:160009,db:'production',role:'f05_catalog_ci'},
 {v:160009,db:'f05_catalog_test',role:'postgres'}]){
  const pool={query:async()=>({rows:[identity]})};
  assert.equal(await probeIsolatedCatalog(pool),false);
 }
});
test('readiness physical connection errors produce denial without logs or credentials',async()=>{
 const pool={query:async()=>{throw Error('secret connectionString')}};
 assert.equal(await probeIsolatedCatalog(pool),false);
});

test('schema preflight rejects superficially named but physically wrong PG16 tables',async()=>{
 for(const missing of ['shape','fk','v','c','p','x']){
  const physical={v:true,c:true,p:true,x:true,shape:true,fk:true};physical[missing]=false;
  const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160002,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[physical]}};
  assert.equal(await probeIsolatedCatalog(pool),false,missing);
 }
});
test('schema preflight rejects omitted properties and anonymous extra trust flags',async()=>{
 for(const shape of [
  {v:true,c:true,p:true,x:true,shape:true},
  {v:true,c:true,p:true,x:true,shape:true,fk:true,unverified:true},
 ]){
  const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160002,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[shape]}};
  assert.equal(await probeIsolatedCatalog(pool),false);
 }
});

test('connection-string overrides and non-test modes cannot redirect pg Pool',()=>{
 const base={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY',F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:secret@127.0.0.1:5432/f05_catalog_test'};
 for(const bad of [
  {NODE_ENV:'development'},
  {F05_CATALOG_DATABASE_URL:base.F05_CATALOG_DATABASE_URL+'?host=remote.example'},
  {F05_CATALOG_DATABASE_URL:base.F05_CATALOG_DATABASE_URL+'?sslmode=disable'},
  {F05_CATALOG_DATABASE_URL:base.F05_CATALOG_DATABASE_URL+'#rewrite'},
  {F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:secret@127.0.0.1:5433/f05_catalog_test'},
  {F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci@127.0.0.1:5432/f05_catalog_test'},
  {F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:secret@localhost:5432/f05_catalog_test'},
  {F05_CATALOG_DATABASE_URL:'postgres://f05_catalog_ci:secret@127.0.0.1:5432/f05_catalog_test?hostaddr=10.0.0.1'},
 ])assert.throws(()=>validateCatalogEnv({...base,...bad}),JSON.stringify(bad));
});
