import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {createIsolatedEmployeeVehicleReadService} from '../src/f05-employee-vehicle-read-service.mjs';
import {createIsolatedEmployeeVehicleReadHandler} from '../src/f05-employee-vehicle-read-http.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
test('Vehicle Employee scope HTTP and service fail closed for production, missing scopes and arbitrary actor headers',async()=>{
 for(const wrong of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},
  {...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:''}]){
  assert.throws(()=>createIsolatedEmployeeVehicleReadService({pool:{query(){}},env:wrong}));
  assert.throws(()=>createIsolatedEmployeeVehicleReadHandler({get(){}},wrong));
 }
 const svc={get:async()=>({status:200,body:{code:'EMPLOYEE_VEHICLE_SCOPED',productionReady:false}})};
 const srv=createServer(createFoundationHandler({employeeVehicleReadHandler:createIsolatedEmployeeVehicleReadHandler(svc,env)}));
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 const root='http://127.0.0.1:'+srv.address().port+'/api/v1/catalog/internal/vehicles/60100';
 try{
  const call=async(headers={})=>{const r=await fetch(root,{headers:{authorization:'Bearer '+'A'.repeat(43),...headers}});return r.status};
  assert.equal(await call(),200);
  assert.equal(await call({'x-employee-id':'60100'}),403);
  assert.equal(await call({'x-source-type':'four_s'}),403);
  assert.equal(await call({authorization:'Bearer BAD'}),401);
 }finally{await new Promise(ok=>srv.close(ok))}
});
