import {createFoundationServer,createFoundationHandler} from './app.mjs';
import {loadConfig} from './config.mjs';
import {createPgReadinessProbe} from './postgres.mjs';
import {IsolatedAuth} from './f03-auth-service.mjs';
import {createAuthHandler} from './f03-auth-http.mjs';
import {createServer as createHttpsServer} from 'node:https';
import {readFile} from 'node:fs/promises';
const {host,port}=loadConfig();
let server,service;
if(process.env.F03_1_ENABLE_ISOLATED_AUTH==='I_AUTHORIZE_F03_1_AUTH_IN_NEW_TEST_PG16'){
 if(host!=='127.0.0.1')throw Error('F03_AUTH_LOOPBACK_REQUIRED');
 const raw=process.env.F03_1_HMAC_KEY_BASE64||'';
 const key=Buffer.from(raw,'base64');
 if(key.length!==32)throw Error('F03_AUTH_SECRET_REQUIRED');
 service=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:key,origin:process.env.F03_1_TRUSTED_ORIGIN});
 if(!process.env.F03_1_TLS_KEY_PATH||!process.env.F03_1_TLS_CERT_PATH)throw Error('F03_AUTH_TLS_REQUIRED');
 server=createHttpsServer({
  key:await readFile(process.env.F03_1_TLS_KEY_PATH),
  cert:await readFile(process.env.F03_1_TLS_CERT_PATH),
 },createFoundationHandler({
  authHandler:createAuthHandler(service),
  readinessProbe:async()=>{try{await service.pool.query('SELECT 1');return true}catch{return false}},
  readinessTimeoutMs:3000,
 }));
}else{
 server=createFoundationServer({readinessProbe:createPgReadinessProbe(process.env),readinessTimeoutMs:3000});
}
server.listen(port,host,()=>console.info('F01 single server ready', {host,port,isolatedAuth:!!service}));
const shutdown=()=>server.close(async()=>{await service?.close();process.exit(0)});
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
