import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedFavoriteHandler} from '../src/f05-favorite-http.mjs';
import {createIsolatedFavoriteService} from '../src/f05-favorite-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const token='A'.repeat(43),eventKey='I'.repeat(32);
const service={read:async()=>({status:200,body:{code:'FAVORITE_STATE',active:false}}),
 change:async({action})=>({status:200,body:{code:'FAVORITE_APPLIED',active:action==='ADD'}})};
async function http(path,method='GET',headers={}){
 const server=createServer(createFoundationHandler({favoriteHandler:createIsolatedFavoriteHandler(service,env)}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const res=await fetch('http://127.0.0.1:'+server.address().port+path,{method,headers});
  return {status:res.status,body:await res.json()};
 }finally{await new Promise(resolve=>server.close(resolve))}
}
test('isolated favorite service never initializes in prod, auth without PG16 forbidden',()=>{
 for(const e of [{...env,APP_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'yes'}]){
  assert.throws(()=>createIsolatedFavoriteService({pool:{connect:async()=>{}},env:e}));
  assert.throws(()=>createIsolatedFavoriteHandler(service,e));
 }
 assert.throws(()=>createIsolatedFavoriteService({pool:{},env}));
});
test('true loopback HTTP never accepts unauthenticated favorite read or write',async()=>{
 const no=await http('/api/v1/catalog/vehicles/59003/favorite');
 assert.equal(no.status,401);
 assert.equal(no.body.code,'FAVORITE_TEST_CUSTOMER_IDENTITY_REQUIRED');
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite','POST',{'x-idempotency-key':eventKey})).status,401);
});
test('favorite state POST, GET and DELETE route to business handlers only with bearer + replay key',async()=>{
 const auth={authorization:'Bearer '+token,'x-idempotency-key':eventKey};
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite','GET',{authorization:auth.authorization})).body.code,'FAVORITE_STATE');
 const add=await http('/api/v1/catalog/vehicles/59003/favorite','POST',auth);
 assert.equal(add.status,200);assert.equal(add.body.active,true);
 const del=await http('/api/v1/catalog/vehicles/59003/favorite','DELETE',auth);
 assert.equal(del.status,200);assert.equal(del.body.active,false);
});
test('forged Customer, forwarded proxy and cookie cannot bypass test actor',async()=>{
 for(const headers of [
  {'x-customer-id':'59001'}, {'x-owner-id':'59001'},{'x-role':'customer'},
  {'x-forwarded-for':'127.0.0.1'}, {cookie:'SESSION=trusted'},
  {'x-wechat-openid':'trusted'},{'x-scope':'admin'}
 ]){
  const r=await http('/api/v1/catalog/vehicles/59003/favorite','GET',{authorization:'Bearer '+token,...headers});
  assert.equal(r.status,403,JSON.stringify(headers));
 }
});
test('invalid route, methods, queries and idempotency keys refused',async()=>{
 const a={authorization:'Bearer '+token};
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite?customerId=1','GET',a)).status,400);
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite','PUT',a)).status,405);
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite','POST',a)).status,400);
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite','POST',{...a,'x-idempotency-key':'a'})).status,400);
 assert.equal((await http('/api/v1/catalog/vehicles/59003/favorite','POST',{...a,'x-idempotency-key':eventKey,'x-forwarded-host':'evil'})).status,403);
});
test('database failure is generic 503 and never leaks a credential',async()=>{
 const failing={...service,read:async()=>{throw Error('secret_password_DO_NOT_LEAK')}};
 const server=createServer(createFoundationHandler({favoriteHandler:createIsolatedFavoriteHandler(failing,env)}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const res=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/vehicles/59003/favorite',{headers:{authorization:'Bearer '+token}});
  const txt=await res.text();
  assert.equal(res.status,503);assert.equal(txt.includes('secret_password'),false);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
