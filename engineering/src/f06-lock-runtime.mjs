// F06 真实 HTTP 服务接线。明确隔离测试数据库，不允许触碰生产 Source Issuer。
import pg from 'pg';
import {assertF06TestEnvironment,verifyF06TestDatabase} from './f06-lock-readiness.mjs';
import {createIsolatedF06LockService} from './f06-lock-service.mjs';
import {createIsolatedF06LockHandler} from './f06-lock-http.mjs';
import {createIsolatedF06LockLifecycleService} from './f06-lock-lifecycle-service.mjs';
import {createIsolatedF06LockLifecycleHandler} from './f06-lock-lifecycle-http.mjs';
export async function createIsolatedF06LockRuntime(env=process.env){
 const {connectionString}=assertF06TestEnvironment(env);
 if(env.F05_REAL_CATALOG_ENABLE||env.F05_D1_BUSINESS_TEST_RUNTIME||env.F03_1_ENABLE_ISOLATED_AUTH)
  throw Error('F06_LOCK_TEST_RUNTIME_COMBINATION_FORBIDDEN');
 const pool=new pg.Pool({connectionString,max:5,connectionTimeoutMillis:2000,idleTimeoutMillis:2000});
 try{
  await verifyF06TestDatabase(pool);
  const service=createIsolatedF06LockService({pool,env});
  const lifecycleService=createIsolatedF06LockLifecycleService({pool,env});
  const lifecycleHandler=createIsolatedF06LockLifecycleHandler({service:lifecycleService,env});
  const handler=createIsolatedF06LockHandler({service,env,lifecycleHandler});
  return Object.freeze({service,lifecycleService,handler,ready:async()=>{
   try{return await verifyF06TestDatabase(pool)}catch{return false}
  },close:()=>pool.end()});
 }catch(err){await pool.end();throw err}
}