// Full isolated F05 runtime must be constructible, not only individual service tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsolatedCatalogRuntime} from '../src/catalog-readiness.mjs';
import {createIsolatedCatalogServerOptions,REQUIRED_F05_HANDLERS} from '../src/catalog-wiring.mjs';
import {createFoundationServer} from '../src/app.mjs';

test('PG16 full F05 test-only runtime assembles all required live handlers and serves readiness',async()=>{
 const runtime=await createIsolatedCatalogRuntime(process.env);
 let server=null;
 try{
  const options=createIsolatedCatalogServerOptions(runtime,process.env);
  for(const key of REQUIRED_F05_HANDLERS){
   assert.equal(typeof options[key],'function',key);
  }
  assert.equal(options.catalogHandler instanceof Function,true);
  server=createFoundationServer(options);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const root='http://127.0.0.1:'+server.address().port;
  const ready=await fetch(root+'/api/v1/health/ready');
  assert.equal(ready.status,200);assert.equal((await ready.json()).ok,true);
  const response=await fetch(root+'/api/v1/catalog/demands/59001/actions',{
   method:'POST',
   headers:{authorization:'Bearer '+('X'.repeat(43)),'x-idempotency-key':'K'.repeat(32),
    'content-type':'application/json'},
   body:JSON.stringify({action:'PAUSE'})
  });
  const body=await response.json();
  assert.equal(response.status,401);
  assert.equal(body.code,'DEMAND_IDENTITY_REQUIRED');
  assert.equal(body.productionReady,undefined);
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  await runtime.close();
 }
});
