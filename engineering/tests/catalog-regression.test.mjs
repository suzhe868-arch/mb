// Executable real loopback HTTP regression. Database replies are deliberately
// injected stubs; none of these tests constitute PostgreSQL 16 validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {
 createCatalogService, encodeCursor, decodeCursor,
 SQL_CATALOG_LIST, SQL_CATALOG_DETAIL, SQL_CATALOG_STATS,
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
 const captured=[];
 const pool=byRows((s,p)=>{captured.push({sql:s,params:p});return captured.length===1?Array.from({length:16},(_,k)=>row(k+1,at)):[row(17,at)]});
 const first=await request(pool,'/api/v1/catalog/vehicles');
 assert.equal(first.status,200);assert.equal(first.body.items.length,15);
 const cursor=first.body.nextCursor;
 assert.equal(decodeCursor(cursor,secret,'wholesale','newest').at,at);
 const next=await request(pool,'/api/v1/catalog/vehicles?cursor='+encodeURIComponent(cursor));
 assert.equal(next.status,200);assert.equal(next.body.items[0].vehicleId,'17');
 assert.equal(captured[1].params[1],at);assert.equal(captured[1].params[2],'1015');assert.deepEqual(captured[1].params.slice(3),[null,null,null,null]);
 assert.equal(next.body.nextCursor,null);
});
test('PDM05 exact modelId is parameterized in PG query before keyset pagination',async()=>{
 let captured;
 const modelId='123456789012345678';
 const result=await request(byRows((sql,params)=>{captured={sql,params};return [row(5)]}),`/api/v1/catalog/vehicles?modelId=${modelId}`);
 assert.equal(result.status,200);
 assert.equal(result.body.modelId,modelId);
 assert.deepEqual(captured.params,['wholesale',null,null,modelId,null,null,null]);
 assert.match(captured.sql,/v\.model_id=\$4::bigint/);
});
test('PDM05 modelId query cannot be SQL-injected, widened or coerced',async()=>{
 for(const bad of ['0','0001','-1','9223372036854775808','1%20OR%201%3D1','foo']){
  const res=await request(byRows(),'/api/v1/catalog/vehicles?modelId='+bad);
  assert.equal(res.status,400,bad);
  assert.equal(res.body.code,'INVALID_MODEL_ID');
 }
});
test('model-specific signed cursor is rejected in another model or an unfiltered feed',async()=>{
 const modelId='123456789012345678';
 const first=await request(byRows(()=>Array.from({length:16},(_,k)=>row(k+1))),`/api/v1/catalog/vehicles?modelId=${modelId}`);
 assert.equal(first.status,200);assert.ok(first.body.nextCursor);
 const cursor=encodeURIComponent(first.body.nextCursor);
 const wrong=await request(byRows(),'/api/v1/catalog/vehicles?modelId=20&cursor='+cursor);
 assert.equal(wrong.status,400);assert.equal(wrong.body.code,'INVALID_CURSOR');
 const bare=await request(byRows(),'/api/v1/catalog/vehicles?cursor='+cursor);
 assert.equal(bare.status,400);assert.equal(bare.body.code,'INVALID_CURSOR');
});
test('PDM05 brand and series are typed and filter through physical model master data',async()=>{
 let sql,params;
 const r=await request(byRows((s,p)=>{sql=s;params=p;return [row(2)]}),'/api/v1/catalog/vehicles?brandId=123&seriesId=456');
 assert.equal(r.status,200);assert.equal(r.body.brandId,'123');assert.equal(r.body.seriesId,'456');
 assert.deepEqual(params,['wholesale',null,null,null,'123','456',null]);
 assert.match(sql,/COALESCE\(vm\.brand_id,vs\.brand_id\)=\$5::bigint/);
 assert.match(sql,/vm\.series_id=\$6::bigint/);
 assert.match(sql,/vm\.brand_id=vs\.brand_id/);
 for(const field of ['brandId','seriesId'])for(const bad of ['0','-1','9223372036854775808','1%20OR%201%3D1']){
  const x=await request(byRows(),`/api/v1/catalog/vehicles?${field}=${bad}`);
  assert.equal(x.status,400,field+'='+bad);
 }
});
test('brand-series cursor is bound to identical hierarchy, no cross-filter reuse',async()=>{
 const first=await request(byRows(()=>Array.from({length:16},(_,k)=>row(k+1))),'/api/v1/catalog/vehicles?brandId=123&seriesId=456');
 assert.equal(first.status,200);assert.ok(first.body.nextCursor);
 const cursor=encodeURIComponent(first.body.nextCursor);
 for(const q of ['brandId=124&seriesId=456','brandId=123&seriesId=457','brandId=123','seriesId=456']){
  const x=await request(byRows(),`/api/v1/catalog/vehicles?${q}&cursor=${cursor}`);
  assert.equal(x.status,400,q);assert.equal(x.body.code,'INVALID_CURSOR');
 }
});

test('actual vehicle master names and year returned without sensitive database fields',async()=>{
 const data={...row(11),brandId:'55',seriesId:'66',brandName:'奥迪',seriesName:'A6',modelName:'45TFSI',modelYear:2026};
 const output=await request(byRows(()=>[data]),'/api/v1/catalog/vehicles/11');
 assert.equal(output.status,200);
 assert.equal(output.body.vehicle.brandName,'奥迪');
 assert.equal(output.body.vehicle.seriesName,'A6');
 assert.equal(output.body.vehicle.modelName,'45TFSI');
 assert.equal(output.body.vehicle.modelYear,2026);
 assert.equal(output.body.vehicle.price,null);
 for(const field of ['vin','wholesaleCost','customerEmail','upstreamPublisherPhone'])assert.equal(field in output.body.vehicle,false);
 const partial=await request(byRows(()=>[row(12)]),'/api/v1/catalog/vehicles/12');
 assert.equal(partial.status,200);assert.equal(partial.body.vehicle.modelName,null);
});
test('invalid or contradictory master data cannot leak through HTTP',async()=>{
 for(const change of [{brandId:'bad'},{seriesId:'9223372036854775808'},{modelYear:'2026'},{modelYear:2201},{brandName:' '},{modelName:'x'.repeat(161)},{modelId:null,modelName:'fake'}]){
  const result=await request(byRows(()=>[{...row(9),...change}]),'/api/v1/catalog/vehicles/9');
  assert.equal(result.status,503,JSON.stringify(change));
  assert.deepEqual(result.body,{code:'CATALOG_DEPENDENCY_NOT_READY'});
 }
});
test('model year exact PG16 predicate must not become first registration year',async()=>{
 let seen;
 const response=await request(byRows((sql,params)=>{seen={sql,params};return [row(1)]}),'/api/v1/catalog/vehicles?modelYear=2026');
 assert.equal(response.status,200);assert.equal(response.body.modelYear,2026);
 assert.match(seen.sql,/vm\.model_year=\$7::integer/);
 assert.equal(seen.params[6],2026);
 for(const value of ['26','0026','0','2201','2026%20OR%201%3D1']){
  const bad=await request(byRows(),'/api/v1/catalog/vehicles?modelYear='+value);
  assert.equal(bad.status,400,value);assert.equal(bad.body.code,'INVALID_MODEL_YEAR');
 }
});
test('model year changes must invalidate HMAC signed pagination cursor',async()=>{
 const first=await request(byRows(()=>Array.from({length:16},(_,k)=>row(k+1))),'/api/v1/catalog/vehicles?modelYear=2026');
 assert.equal(first.status,200);assert.ok(first.body.nextCursor);
 const second=await request(byRows(),'/api/v1/catalog/vehicles?modelYear=2025&cursor='+encodeURIComponent(first.body.nextCursor));
 assert.equal(second.status,400);assert.equal(second.body.code,'INVALID_CURSOR');
});


test('public image projection accepts only relative ordinary vehicle path',async()=>{
 const valid=await request(byRows(()=>[{...row(8),coverImagePath:'C7/2026/front.webp',source_url_fact:'https://jyt.invalid/PRIVATE'}]),'/api/v1/catalog/vehicles/8');
 assert.equal(valid.status,200);
 assert.equal(valid.body.vehicle.coverImagePath,'C7/2026/front.webp');
 assert.equal(JSON.stringify(valid.body).includes('jyt.invalid'),false);
 for(const bad of ['https://evil.invalid/photo.jpg','../secret','C7/../../secret','/root/file','C7/%2e%2e/file','C7//file','C7\\file','C7/file?secret=1','C7/file#token']){
  const x=await request(byRows(()=>[{...row(8),coverImagePath:bad}]),'/api/v1/catalog/vehicles/8');
  assert.equal(x.status,200,bad);
  assert.equal(x.body.vehicle.coverImagePath,null,bad);
 }
});
test('image SQL selects in frozen sort order, never returns upstream URL or documents',()=>{
 for(const sql of [SQL_CATALOG_LIST,SQL_CATALOG_DETAIL]){
  assert.match(sql,/FROM public\.vehicle_images vi/);
  assert.match(sql,/vi\.vehicle_id=v\.vehicle_id/);
  assert.match(sql,/po\.original_sort_index ASC,vi\.image_id ASC LIMIT 1/);
  assert.doesNotMatch(sql,/source_url_fact|vehicle_documents|origin_ref/);
 }
});

test('real HTTP public statistics use only physically scoped records',async()=>{
 const r=await request(byRows(sql=>{
  assert.equal(sql,SQL_CATALOG_STATS);
  return [{source:'wholesale',vehicleCount:'4'},{source:'mingbang',vehicleCount:'2'}];
 }),'/api/v1/catalog/stats');
 assert.equal(r.status,200);
 assert.deepEqual(r.body.bySource,{wholesale:4,mingbang:2,four_s:0});
 assert.equal(r.body.total,6);
 assert.equal(r.body.todayNewCount,null);
 assert.equal(r.body.todayNewState,'FIRST_SEEN_DEPENDENCY_BLOCKED');
 assert.equal(r.body.productionReady,false);
 assert.match(SQL_CATALOG_STATS,/f05_real_catalog_visibility_test/);
 assert.match(SQL_CATALOG_STATS,/f05_real_catalog_protections_test/);
});
test('statistics forbid query manipulation, duplicate counts and injection into projections',async()=>{
 assert.equal((await request(byRows(),'/api/v1/catalog/stats?source=wholesale')).status,400);
 assert.equal((await request(byRows(),'/api/v1/catalog/stats','POST')).status,405);
 for(const rows of [[{source:'employee',vehicleCount:'1'}],[{source:'wholesale',vehicleCount:'0 OR 1=1'}],
 [{source:'wholesale',vehicleCount:'9223372036854775807'}],
 [{source:'wholesale',vehicleCount:'1'},{source:'wholesale',vehicleCount:'1'}]]){
  const r=await request(byRows(()=>rows),'/api/v1/catalog/stats');
  assert.equal(r.status,503);assert.deepEqual(r.body,{code:'CATALOG_DEPENDENCY_NOT_READY'});
 }
});
test('PDM-20 seven sorts: six unverified business projections fail closed; oldest is prohibited',async()=>{
 const legal=['price_asc','price_desc','registration_year_desc','registration_year_asc','mileage_asc','mileage_desc'];
 for(const sort of legal){
  const r=await request(byRows(),`/api/v1/catalog/vehicles?sort=${sort}`);
  assert.equal(r.status,503,sort);
  assert.equal(r.body.code,'CATALOG_SORT_DEPENDENCY_BLOCKED');
 }
 const bad=await request(byRows(),'/api/v1/catalog/vehicles?sort=oldest');
 assert.equal(bad.status,400);
 assert.equal(bad.body.code,'INVALID_CATALOG_FILTER');
 const newest=await request(byRows(),'/api/v1/catalog/vehicles?source=four_s&sort=newest');
 assert.equal(newest.status,200);
});
test('large signed PostgreSQL bigint safely roundtrips without numeric coercion',async()=>{
 const id='9223372036854775807',ts='2026-10-15T09:00:00.123456Z';
 const tok=encodeCursor({at:ts,id,source:'mingbang',sort:'newest'},secret);
 assert.equal(decodeCursor(tok,secret,'mingbang','newest').id,id);
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
 '/api/v1/catalog/vehicles?sort=unverified_extra_sort',
])test(`bad HTTP query denied: ${bad.slice(0,55)}`,async()=>{
 const r=await request(byRows(),bad);assert.equal(r.status,400);
 assert.ok(r.body.code);assert.equal(JSON.stringify(r.body).includes('private@private.example'),false);
});
for(const wrong of ['four_s','mingbang'])test(`cursor cross-channel ${wrong} denied`,async()=>{
 const cursor=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'1001',source:'wholesale',sort:'newest'},secret);
 const r=await request(byRows(),`/api/v1/catalog/vehicles?source=${wrong}&cursor=${encodeURIComponent(cursor)}`);
 assert.equal(r.status,400);assert.equal(r.body.code,'INVALID_CURSOR');
});
test('cursor cannot open unsupported sort with the newest cursor',async()=>{
 const cursor=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'1001',source:'wholesale',sort:'newest'},secret);
 const r=await request(byRows(),'/api/v1/catalog/vehicles?sort=price_desc&cursor='+encodeURIComponent(cursor));
 assert.equal(r.status,503);assert.equal(r.body.code,'CATALOG_SORT_DEPENDENCY_BLOCKED');
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
  assert.deepEqual(Object.keys(r.body.vehicle).sort(),['catalogState','listingCycleId','listingStartedAt','modelId','brandId','seriesId','brandName','seriesName','modelName','modelYear','coverImagePath','price','priceState','source','vehicleId'].sort());
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
 for(const sql of [SQL_CATALOG_LIST,SQL_CATALOG_DETAIL]){
  for(const expected of ['v.platform_visibility=\'visible\'','cy.ended_at IS NULL','v.archived_at IS NULL',
   'p.allow_anonymous=true','p.source_type=v.source_type',"p.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'",
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
 for(const sql of [SQL_CATALOG_LIST,SQL_CATALOG_DETAIL]){
  assert.match(sql,/NOT EXISTS\(SELECT 1 FROM public\.vehicle_listing_cycles other/);
  assert.match(sql,/other\.ended_at IS NULL/);
 }
});

test('readiness uses physical database identity and all four required relations',async()=>{
 const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160009,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[{v:true,c:true,p:true,x:true,po:true,pf:true,fs:true,ft:true,fe:true,cp:true,ca:true,es:true,ec:true,ss:true,sh:true,he:true,pe:true,pp:true,qa:true,qs:true,fca:true,fcd:true,fce:true,fcp:true,fac:true,md:true,me:true,mv:true,mx:true,aq:true,sv:true,ra:true,rp:true,ru:true,di:true,rs:true,rn:true,re:true,rv:true,p8c:true,p8e:true,p8q:true,p8s:true,p8u:true,p8v:true,p8w:true,p8m:true,p8a:true,fr:true,da:true,dl:true,vr:true,iv:true,shape:true,fk:true,full:true}]}};
 assert.equal(await probeIsolatedCatalog(pool),true);
 assert.match(SQL_CATALOG_SCHEMA,/to_regclass\('public\.vehicles'\)/);
 assert.match(SQL_CATALOG_SCHEMA,/pg_catalog\.pg_attribute/);
 assert.match(SQL_CATALOG_SCHEMA,/pg_catalog\.pg_constraint/);
 assert.match(SQL_CATALOG_SCHEMA,/count\(\*\)=123/);
});
test('readiness fails if a physical table disappears after startup',async()=>{
 const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160009,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[{v:true,c:true,p:false,x:true,po:true,pf:true,fs:true,ft:true,fe:true,cp:true,ca:true,es:true,ec:true,ss:true,sh:true,he:true,pe:true,pp:true,qa:true,qs:true,fca:true,fcd:true,fce:true,fcp:true,fac:true,md:true,me:true,mv:true,mx:true,aq:true,sv:true,ra:true,rp:true,ru:true,di:true,rs:true,rn:true,re:true,rv:true,p8c:true,p8e:true,p8q:true,p8s:true,p8u:true,p8v:true,p8w:true,p8m:true,p8a:true,fr:true,da:true,dl:true,vr:true,iv:true,shape:true,fk:true,full:true}]}};
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
 for(const missing of ['shape','fk','pf','full','v','c','p','x','po','fs','ft','fe','cp','ca','es','ec','ss','sh','he','pe','pp','qa','qs','fca','fcd','fce','fcp','fac','md','me','mv','mx','aq','sv','ra','rp','ru','di','rs','rn','re','rv','p8c','p8e','p8q','p8s','p8u','p8v','p8w','p8m','p8a','fr','dl','da','vr']){
  const physical={v:true,c:true,p:true,x:true,po:true,pf:true,fs:true,ft:true,fe:true,cp:true,ca:true,es:true,ec:true,ss:true,sh:true,he:true,pe:true,pp:true,qa:true,qs:true,fca:true,fcd:true,fce:true,fcp:true,fac:true,md:true,me:true,mv:true,mx:true,aq:true,sv:true,ra:true,rp:true,ru:true,di:true,rs:true,rn:true,re:true,rv:true,p8c:true,p8e:true,p8q:true,p8s:true,p8u:true,p8v:true,p8w:true,p8m:true,p8a:true,fr:true,da:true,dl:true,vr:true,iv:true,shape:true,fk:true,full:true};physical[missing]=false;
  const pool={query:async(s)=>s===SQL_CATALOG_IDENTITY?{rows:[{v:160002,db:'f05_catalog_test',role:'f05_catalog_ci'}]}:{rows:[physical]}};
  assert.equal(await probeIsolatedCatalog(pool),false,missing);
 }
});
test('schema preflight rejects omitted properties and anonymous extra trust flags',async()=>{
 for(const shape of [
  {v:true,c:true,p:true,x:true,po:true,pf:true,fs:true,ft:true,fe:true,cp:true,ca:true,es:true,ec:true,ss:true,sh:true,he:true,pe:true,pp:true,qa:true,qs:true,fca:true,fcd:true,fce:true,fcp:true,fac:true,md:true,me:true,mv:true,mx:true,aq:true,sv:true,ra:true,rp:true,ru:true,di:true,rs:true,rn:true,re:true,rv:true,p8c:true,p8e:true,p8q:true,p8s:true,p8u:true,p8v:true,p8w:true,p8m:true,p8a:true,fr:true,da:true,dl:true,vr:true,iv:true,shape:true},
  {v:true,c:true,p:true,x:true,po:true,pf:true,fs:true,ft:true,fe:true,cp:true,ca:true,es:true,ec:true,ss:true,sh:true,he:true,pe:true,pp:true,qa:true,qs:true,fca:true,fcd:true,fce:true,fcp:true,fac:true,md:true,me:true,mv:true,mx:true,aq:true,sv:true,ra:true,rp:true,ru:true,di:true,rs:true,rn:true,re:true,rv:true,p8c:true,p8e:true,p8q:true,p8s:true,p8u:true,p8v:true,p8w:true,p8m:true,p8a:true,fr:true,da:true,dl:true,vr:true,iv:true,shape:true,fk:true,full:true,unverified:true},
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
