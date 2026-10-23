import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {createServer as httpsServer,request as httpsRequest} from 'node:https';
import {connect as tlsConnect} from 'node:tls';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CustomerAccountStatusService} from '../../../src/f03-customer-account-status-service.mjs';
import {createCustomerAccountStatusHandler} from '../../../src/f03-customer-account-status-http.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertEnvironment} from '../environment.mjs';

const port=4392,origin='https://127.0.0.1:'+port,path='/__ci__/f03/customer-account-status/301';
let server,absent,auth,token,csrf,admin,adminCsrf;
const newKey=()=>randomUUID().replaceAll('-','');
const headers=(t=token,c=csrf,k=newKey())=>({host:'127.0.0.1:'+port,origin,cookie:'__Host-mb_pc='+t,'x-csrf-token':c,'idempotency-key':k,'content-type':'application/json'});
async function call(method='GET',url=path,body,head=headers()){
 const bytes=body===undefined?null:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  const req=httpsRequest(origin+url,{method,headers:{...head,...(bytes?{'content-length':bytes.length}:{})},rejectUnauthorized:false,timeout:8000},res=>{
   const parts=[];res.on('data',v=>parts.push(v));res.on('end',()=>{const raw=Buffer.concat(parts).toString();let payload;
    try{payload=JSON.parse(raw)}catch{payload={}}resolve({status:res.statusCode,headers:res.headers,body:payload,raw})});
  });req.on('error',reject);req.on('timeout',()=>req.destroy(Error('TIMEOUT')));if(bytes)req.write(bytes);req.end();
 });
}
async function rawWire(text){
 return new Promise((resolve,reject)=>{
  const s=tlsConnect({host:'127.0.0.1',port,rejectUnauthorized:false});let data='',done=false;
  s.setTimeout(5000,()=>{s.destroy();if(!done)reject(Error('HTTPS_TIMEOUT'))});
  s.on('secureConnect',()=>s.write(text));
  s.on('data',x=>{data+=x.toString('latin1');const match=data.match(/^HTTP\/1\.[01] ([0-9]{3})/);if(match&&!done){done=true;resolve(Number(match[1]));s.destroy()}});
  s.on('error',e=>{if(!done)reject(e)});
 });
}
before(async()=>{
 assertEnvironment();
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin});
 const manager=await auth.login({login:'manager_account_ci',password:'SyntheticManager_2026!',source:'account-status-https-manager'});
 const administrator=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'account-status-https-admin'});
 assert.equal(manager.code,'AUTH_OK');assert.equal(administrator.code,'AUTH_OK');token=manager.token;csrf=auth.csrfFor(token);admin=administrator.token;adminCsrf=auth.csrfFor(admin);
 server=httpsServer({key:await readFile(process.env.F03_ACCOUNT_STATUS_TLS_KEY_PATH),cert:await readFile(process.env.F03_ACCOUNT_STATUS_TLS_CERT_PATH)},
 createFoundationHandler({customerAccountStatusHandler:createCustomerAccountStatusHandler({auth,service:new CustomerAccountStatusService(auth)}),readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',e=>e?reject(e):resolve()));
});
after(async()=>{if(server)await new Promise(r=>server.close(r));if(absent)await new Promise(r=>absent.close(r));await auth?.close()});
test('H01 real HTTPS GET returns only current governance status and no sensitive fields',async()=>{
 const x=await call('GET');assert.equal(x.status,200);assert.equal(x.body.code,'OK');
 assert.equal(x.headers['cache-control'],'no-store');assert.equal(x.raw.includes('password_hash'),false);
});
test('H02 missing and cross-origin requests fail closed',async()=>{
 const h=headers();delete h.origin;assert.equal((await call('GET',path,undefined,h)).status,403);
 assert.equal((await call('GET',path,undefined,{...headers(),origin:'https://evil.invalid'})).status,403);
});
test('H03 no/duplicate/malformed session cookie denied',async()=>{
 const h=headers();delete h.cookie;assert.equal((await call('GET',path,undefined,h)).status,401);
 assert.equal((await call('GET',path,undefined,{...headers(),cookie:'__Host-mb_pc='+token+'; __Host-mb_pc='+token})).status,401);
 assert.equal((await call('GET',path,undefined,{...headers(),cookie:'bad'})).status,401);
});
test('H04 disabled method and query param denied',async()=>{
 assert.equal((await call('PUT')).status,405);
 assert.equal((await call('GET',path+'?unsafe=1')).status,400);
 assert.equal((await call('GET',path+'/disable')).status,405);
});
test('H05 missing CSRF, invalid key, missing key rejected',async()=>{
 const h=headers();delete h['x-csrf-token'];assert.equal((await call('POST',path+'/disable',{reason:'Synthetic account test'},h)).status,403);
 const h2=headers();delete h2['idempotency-key'];assert.equal((await call('POST',path+'/disable',{reason:'Synthetic account test'},h2)).status,400);
 assert.equal((await call('POST',path+'/disable',{reason:'Synthetic account test'},{...headers(),'idempotency-key':'tooShort'})).status,400);
});
test('H06 malformed JSON, body whitelist, content-type denied',async()=>{
 assert.equal((await call('POST',path+'/disable','{bad-json')).status,400);
 assert.equal((await call('POST',path+'/disable',{reason:'Synthetic account test',admin:true})).status,400);
 assert.equal((await call('POST',path+'/disable',{reason:'Synthetic account test'},{...headers(),'content-type':'text/plain'})).status,415);
});
test('H07 forbidden forwarding and Host spoof fail closed',async()=>{
 assert.equal((await call('GET',path,undefined,{...headers(),'x-forwarded-for':'127.0.0.1'})).status,403);
 assert.equal((await call('GET',path,undefined,{...headers(),host:'evil.invalid'})).status,403);
});
test('H08 GET body and oversized POST rejected',async()=>{
 assert.equal((await call('GET',path,'{}')).status,400);
 assert.equal((await call('POST',path+'/disable',{reason:'X'.repeat(2400)})).status,413);
});
test('H09 real HTTPS disable succeeds with transactionally paused demands',async()=>{
 const x=await call('POST',path+'/disable',{reason:'Synthetic account governance'});assert.equal(x.status,200);assert.equal(x.body.accountStatus,'inactive');
 const y=await call('GET');assert.equal(y.body.accountStatus,'inactive');assert.equal(y.body.demandCounts.active,0);
});
test('H10 read remains available while inactive to authorized manager; restoration does not reactivate demands',async()=>{
 const x=await call('POST',path+'/restore',{reason:'Synthetic restore account'},{...headers(admin,adminCsrf)});
 assert.equal(x.status,200);assert.equal(x.body.accountStatus,'active');
 const y=await call('GET');assert.equal(y.body.demandCounts.active,0);
});
test('H11 replay same key with same payload exactly once',async()=>{
 const k=newKey();const h=headers(admin,adminCsrf,k);
 const first=await call('POST',path+'/disable',{reason:'Synthetic account replay'},h);
 const replay=await call('POST',path+'/disable',{reason:'Synthetic account replay'},h);
 assert.equal(first.status,200);assert.deepEqual(first.body,replay.body);
 assert.equal((await call('POST',path+'/disable',{reason:'Changed reason unsafe'},h)).status,409);
 const restored=await call('POST',path+'/restore',{reason:'Synthetic account restored for dependent legacy guards'},headers(admin,adminCsrf));
 assert.equal(restored.status,200);
});
test('H12 raw duplicate sensitive/forwarded headers are rejected',async()=>{
 const raw='GET '+path+' HTTP/1.1\r\nHost: 127.0.0.1:'+port+'\r\nHost: 127.0.0.1:'+port+'\r\nOrigin: '+origin+'\r\nConnection: close\r\n\r\n';
 const duplicate=await rawWire(raw);assert.ok([400,403].includes(duplicate));
});
test('H13 default server does not expose CI account status handler',async()=>{
 absent=httpsServer({key:await readFile(process.env.F03_ACCOUNT_STATUS_TLS_KEY_PATH),cert:await readFile(process.env.F03_ACCOUNT_STATUS_TLS_CERT_PATH)},
 createFoundationHandler({readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>absent.listen(4393,'127.0.0.1',e=>e?reject(e):resolve()));
 const res=await new Promise((resolve,reject)=>{
  httpsRequest('https://127.0.0.1:4393'+path,{rejectUnauthorized:false},x=>{let b='';x.on('data',c=>b+=c);x.on('end',()=>resolve({status:x.statusCode,b}))}).on('error',reject).end();
 });
 assert.equal(res.status,404);
});
test('H14 unknown path not taken over by CI handler',async()=>{assert.equal((await call('GET','/__ci__/f03/customer-account-status/301/unrecognized')).status,404)});
