import {createFoundationServer,createFoundationHandler} from './app.mjs';
import {loadConfig} from './config.mjs';
import {createPgReadinessProbe} from './postgres.mjs';
import {IsolatedAuth} from './f03-auth-service.mjs';
import {createAuthHandler} from './f03-auth-http.mjs';
import {verifyAuthDatabase} from './f03-auth-readiness.mjs';
import {createIsolatedCatalogRuntime} from './catalog-readiness.mjs';
import {createIsolatedCatalogServerOptions} from './catalog-wiring.mjs';
import {createIsolatedF06LockRuntime} from './f06-lock-runtime.mjs';
import {createServer as createHttpsServer} from 'node:https';
import {readFile} from 'node:fs/promises';
const {host,port}=loadConfig();
let server,service,catalog,f06,composite;
if(process.env.F06_COMPOSITE_TEST_CONSENT!==undefined&&
 process.env.F06_COMPOSITE_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY')
 throw Error('F06_COMPOSITE_CONSENT_INVALID');
if(process.env.F06_LOCK_TEST_CONSENT&&
 (process.env.F05_D1_BUSINESS_TEST_RUNTIME||process.env.F05_REAL_CATALOG_ENABLE||process.env.F03_1_ENABLE_ISOLATED_AUTH))
 throw Error('F06_LOCK_RUNTIME_COMBINATION_FORBIDDEN');
if(process.env.F06_COMPOSITE_TEST_CONSENT==='I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY'){
 const {createIsolatedF06CompositeRuntime}=await import('./f06-nonprod-composite-runtime.mjs');
 composite=await createIsolatedF06CompositeRuntime(process.env);
 server=createFoundationServer({lockHandler:composite.handler,readinessProbe:composite.ready,readinessTimeoutMs:3000});
}else if(process.env.F05_D1_BUSINESS_TEST_RUNTIME==='I_ENABLE_F05_D1_DISPOSABLE_PG16_ONLY'){
 if(host!=='127.0.0.1')throw Error('D1_BUSINESS_TEST_LOOPBACK_REQUIRED');
 if(!process.env.F05_D1_TLS_KEY_PATH||!process.env.F05_D1_TLS_CERT_PATH)throw Error('D1_BUSINESS_TEST_TLS_REQUIRED');
 const {createD1BusinessTestServer}=await import('../f05/pdm17-public-pool-owner-claim/ci-business-router.mjs');
 server=createD1BusinessTestServer({issuerToken:process.env.F05_D1_CI_ISSUER_TOKEN,
  key:await readFile(process.env.F05_D1_TLS_KEY_PATH),cert:await readFile(process.env.F05_D1_TLS_CERT_PATH)});
}else if(process.env.F06_LOCK_TEST_CONSENT==='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'){
 if(host!=='127.0.0.1')throw Error('F06_LOCK_LOOPBACK_REQUIRED');
 f06=await createIsolatedF06LockRuntime(process.env);
 server=createFoundationServer({lockHandler:f06.handler,readinessProbe:f06.ready,readinessTimeoutMs:3000});
}else if(process.env.F05_REAL_CATALOG_ENABLE==='I_ENABLE_F05_TEST_ONLY_CATALOG'){
 if(process.env.F03_1_ENABLE_ISOLATED_AUTH)throw Error('CATALOG_AUTH_COMBINATION_NOT_YET_AUTHORIZED');
 if(host!=='127.0.0.1')throw Error('CATALOG_LOOPBACK_REQUIRED');
 catalog=await createIsolatedCatalogRuntime(process.env);
 server=createFoundationServer(createIsolatedCatalogServerOptions(catalog));
}else if(process.env.F03_1_ENABLE_ISOLATED_AUTH==='I_AUTHORIZE_F03_1_AUTH_IN_NEW_TEST_PG16'){
 if(host!=='127.0.0.1')throw Error('F03_AUTH_LOOPBACK_REQUIRED');
 const raw=process.env.F03_1_HMAC_KEY_BASE64||'';
 const key=Buffer.from(raw,'base64');
 if(key.length!==32)throw Error('F03_AUTH_SECRET_REQUIRED');
 service=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:key,origin:process.env.F03_1_TRUSTED_ORIGIN});
 if(!process.env.F03_1_TLS_KEY_PATH||!process.env.F03_1_TLS_CERT_PATH)throw Error('F03_AUTH_TLS_REQUIRED');
 try{await verifyAuthDatabase(service.pool,{connectionString:process.env.F03_1_DATABASE_URL})}
 catch{await service.close();throw Error('F03_AUTH_STARTUP_ISOLATION_REFUSED')}
 const guardedReady=async()=>{try{return await verifyAuthDatabase(service.pool,{connectionString:process.env.F03_1_DATABASE_URL})}catch{return false}};
 server=createHttpsServer({key:await readFile(process.env.F03_1_TLS_KEY_PATH),cert:await readFile(process.env.F03_1_TLS_CERT_PATH)},createFoundationHandler({authHandler:createAuthHandler(service,guardedReady),readinessProbe:guardedReady,readinessTimeoutMs:10000}));
}else{
 server=createFoundationServer({readinessProbe:createPgReadinessProbe(process.env),readinessTimeoutMs:3000});
}
server.listen(port,host,()=>console.info('F01 single server ready',{host,port,isolatedAuth:!!service,isolatedCatalog:!!catalog,isolatedF06Lock:!!f06,isolatedF06CompositeLockOnly:!!composite}));
const shutdown=()=>server.close(async()=>{await Promise.all([service?.close(),catalog?.close(),f06?.close(),composite?.close()]);process.exit(0)});
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
