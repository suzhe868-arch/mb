import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedPriceUnlockHandler} from '../src/f05-price-unlock-http.mjs';
import {createIsolatedPriceUnlockService} from '../src/f05-price-unlock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const token='A'.repeat(43),key='I'.repeat(32),path='/api/v1/catalog/vehicles/59001/customer-detail-entry';
const mock={openDetail:async()=>({status:200,body:{code:'PRICE_UNLOCKED',priceCents:'12345678',charged:true,quotaRemaining:19,productionReady:false}})};
async function call(opts={}){
 const srv=createServer(createFoundationHandler({priceUnlockHandler:createIsolatedPriceUnlockHandler(opts.svc||mock,env)}));
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+srv.address().port+(opts.path||path),{method:opts.method||'POST',
   headers:{authorization:'Bearer '+token,'x-idempotency-key':key,...opts.headers},body:opts.body});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>srv.close(ok))}
}
test('real price unlock and customer-detail entry cannot run in production or on open network',()=>{
 for(const bad of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'false'}]){
  assert.throws(()=>createIsolatedPriceUnlockHandler(mock,bad));
  assert.throws(()=>createIsolatedPriceUnlockService({pool:{connect:async()=>{}},env:bad}));
 }
 assert.throws(()=>createIsolatedPriceUnlockService({pool:{},env}));
});
test('customer entering detail receives only customer price, not any wholesale data',async()=>{
 const r=await call();assert.equal(r.status,200);assert.equal(r.body.code,'PRICE_UNLOCKED');
 assert.equal(r.body.priceCents,'12345678');assert.equal(r.body.charged,true);
 assert.equal(r.body.productionReady,false);assert.equal(JSON.stringify(r.body).includes('wholesale_price'),false);
});
test('bearer Customer and event key mandatory, no self-reported scope',async()=>{
 assert.equal((await call({headers:{authorization:''}})).status,401);
 assert.equal((await call({headers:{'x-idempotency-key':''}})).status,400);
 for(const extra of [{'x-customer-id':'59001'},{'x-employee-id':'59001'},{'x-owner-id':'59001'},{'x-role':'vip'},
  {'x-price-permission':'unlimited'},{'x-forwarded-for':'127.0.0.1'},{cookie:'session=1'}]){
  assert.equal((await call({headers:extra})).status,403,JSON.stringify(extra));
 }
});
test('GET/list prefetch, query, invalid ID, unsolicited body denied',async()=>{
 assert.equal((await call({method:'GET'})).status,405);
 assert.equal((await call({path:path+'?prefetch=true'})).status,400);
 assert.equal((await call({path:'/api/v1/catalog/vehicles/0/customer-detail-entry'})).status,400);
 assert.equal((await call({body:'{"role":"vip"}'})).status,403);
});
test('PG16/issuer failure is safely opaque; no secret and no fabricated price',async()=>{
 const r=await call({svc:{openDetail:async()=>{throw Error('JYT_SECRET_INTERNAL_PRICE_4321')}}});
 assert.equal(r.status,503);
 assert.equal(JSON.stringify(r.body).includes('JYT_SECRET_INTERNAL_PRICE_4321'),false);
 assert.equal(r.body.priceCents,undefined);
});
