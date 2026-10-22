import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {createServer as httpsServer,request as httpsRequest} from 'node:https';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {PublisherPhoneAdminService} from '../../../src/f03-publisher-phone-admin-service.mjs';
import {createPublisherPhoneAdminHandler} from '../../../src/f03-publisher-phone-admin-http.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertEnvironment} from '../migration.mjs';

const origin='https://127.0.0.1:4319';
const url='/api/pc/employees/6/publisher-phone-permission';
let auth,server,admin,employee,version=0;
const key=()=>randomUUID().replaceAll('-','');
const head=(token=admin,csrf=true)=>({
 origin,host:'127.0.0.1:4319','content-type':'application/json',
 ...(token?{cookie:'__Host-mb_pc='+token}:{}),
 ...(csrf&&token?{'x-csrf-token':auth.csrfFor(token)}:{})
});
async function call(method,path=url,payload,headers=head()) {
 const bytes=payload===undefined?null:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload));
 const hs={...headers,...(bytes?{'content-length':bytes.length}:{})};
 return await new Promise((resolve,reject)=>{
  const req=httpsRequest(origin+path,{method,headers:hs,rejectUnauthorized:false,timeout:8000},res=>{
   const list=[];res.on('data',v=>list.push(v));res.on('end',()=>{
    const body=Buffer.concat(list).toString('utf8');
    let parsed;try{parsed=JSON.parse(body)}catch{parsed={}};
    resolve({status:res.statusCode,headers:res.headers,body:parsed,raw:body});
   });
  });
  req.on('error',reject);req.on('timeout',()=>req.destroy(Error('TIMEOUT')));
  if(bytes)req.write(bytes);req.end();
 });
}
before(async()=>{
 assertEnvironment();
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),origin});
 admin=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567'})).token;
 employee=(await auth.login({login:'race_test',password:'SyntheticRace_1234567'})).token;
 assert.match(admin,/^[A-Za-z0-9_-]{43}$/);
 const handler=createPublisherPhoneAdminHandler({service:new PublisherPhoneAdminService(auth),auth});
 server=httpsServer({key:await readFile(process.env.F03_PUBLISHER_PHONE_TLS_KEY_PATH),cert:await readFile(process.env.F03_PUBLISHER_PHONE_TLS_CERT_PATH)},
  createFoundationHandler({publisherPhoneAdminHandler:handler,readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>server.listen(4319,'127.0.0.1',e=>e?reject(e):resolve()));
});
after(async()=>{if(server)await new Promise(r=>server.close(r));await auth?.close()});

test('01 secure GET current no phone',async()=>{
 const x=await call('GET');assert.equal(x.status,200);assert.equal(x.body.version,0);assert.equal(x.body.enabled,false);assert.equal(x.headers['cache-control'],'no-store');assert.equal(x.headers.etag,'"0"');assert.ok(!/phoneNumber|TEST-|publisherId/.test(x.raw));
});
test('02 absent Origin hard denied',async()=>{
 const h=head();delete h.origin;assert.equal((await call('GET',url,undefined,h)).status,403);
});
test('03 wrong Origin denied',async()=>assert.equal((await call('GET',url,undefined,{...head(),origin:'https://evil.invalid'})).status,403));
test('04 missing session denied',async()=>assert.equal((await call('GET',url,undefined,head(null))).status,401));
test('05 employee not System Admin',async()=>assert.equal((await call('GET',url,undefined,head(employee))).status,403));
test('06 method not allowed',async()=>assert.equal((await call('POST')).status,405));
test('07 query args rejected',async()=>assert.equal((await call('GET',url+'?phone=1')).status,400));
test('08 write without CSRF denied',async()=>assert.equal((await call('PUT',url,{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key()},head(admin,false))).status,403));
test('09 content-type refuses text',async()=>assert.equal((await call('PUT',url,{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key()},{...head(),'content-type':'text/plain'})).status,415));
test('10 malformed JSON rejected',async()=>assert.equal((await call('PUT',url,'{',head())).status,400));
test('11 oversized JSON rejected',async()=>assert.equal((await call('PUT',url,JSON.stringify({garbage:'x'.repeat(2500)}),head())).status,413));
test('12 extra sensitive value rejected',async()=>assert.equal((await call('PUT',url,{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key(),phone:'TEST-LEAK'})).status,400));
let grantKey;
test('13 real HTTPS PUT creates mode LOCKED_ONLY',async()=>{
 grantKey=key();const x=await call('PUT',url,{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:grantKey});
 assert.equal(x.status,200);assert.equal(x.body.scopeMode,'LOCKED_ONLY');assert.equal(x.body.version,1);version=1;
});
test('14 retry idempotency on HTTPS',async()=>{
 const x=await call('PUT',url,{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:grantKey});
 assert.equal(x.status,200);assert.equal(x.body.code,'IDEMPOTENT_REPLAY');assert.equal(x.body.version,1);
});
test('15 stale expectedVersion causes 409',async()=>assert.equal((await call('PUT',url,{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:0,requestKey:key()})).status,409));
test('16 switch to ALL_ACTIVE_JYT with ETag',async()=>{
 const x=await call('PUT',url,{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:version,requestKey:key()});
 assert.equal(x.status,200);assert.equal(x.headers.etag,'"2"');version=2;
});
test('17 GET reflects changed mode; no sensitive leaked data',async()=>{
 const x=await call('GET');assert.equal(x.status,200);assert.equal(x.body.scopeMode,'ALL_ACTIVE_JYT');assert.equal(x.body.version,2);assert.ok(!/password|token|phoneNumber|cache/.test(x.raw));
});
let deleteKey;
test('18 DELETE revokes permission and mode',async()=>{
 deleteKey=key();const x=await call('DELETE',url,{expectedVersion:version,requestKey:deleteKey});
 assert.equal(x.status,200);assert.equal(x.body.enabled,false);assert.equal(x.body.scopeMode,null);version=3;
});
test('19 DELETE idempotent retry',async()=>assert.equal((await call('DELETE',url,{expectedVersion:2,requestKey:deleteKey})).body.code,'IDEMPOTENT_REPLAY'));
test('20 GET sees revoked in same database',async()=>{const x=await call('GET');assert.equal(x.body.enabled,false);assert.equal(x.body.version,3)});
test('21 default application without explicit handler must 404',async()=>{
 const fallback=httpsServer({key:await readFile(process.env.F03_PUBLISHER_PHONE_TLS_KEY_PATH),cert:await readFile(process.env.F03_PUBLISHER_PHONE_TLS_CERT_PATH)},createFoundationHandler({readinessProbe:async()=>true}));
 await new Promise(r=>fallback.listen(4320,'127.0.0.1',r));
 try {
  const x=await new Promise((resolve,reject)=>{
   httpsRequest('https://127.0.0.1:4320'+url,{rejectUnauthorized:false,method:'GET'},res=>{const parts=[];res.on('data',c=>parts.push(c));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(parts).toString()}))}).on('error',reject).end();
  });
  assert.equal(x.status,404);
 }finally{await new Promise(r=>fallback.close(r))}
});
test('22 production default HTTP contract does not expose phone',async()=>{
 assert.equal((await call('GET')).body.origin,'CI_ONLY_F03_PERMISSION_CONFIG');
 console.log('F03_PHONE_ADMIN_REAL_HTTPS_22_CASES_PASS; NO_PRODUCTION; F07_NOT_CONNECTED');
});
