import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createServer as httpsServer,request as httpsRequest} from 'node:https';
import {connect as tlsConnect} from 'node:tls';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CrmFollowupService} from '../../../src/f05-crm-followup-service.mjs';
import {createCrmFollowupHandler} from '../../../src/f05-crm-followup-http.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertEnvironment} from '../../crm-followup-ci/environment.mjs';

const port=4411,origin='https://127.0.0.1:'+port,path='/__ci__/f05/crm-followups/301';
let server,absent,auth,token,csrf,admin,adminCsrf;
const headers=(t=token,c=csrf)=>({host:'127.0.0.1:'+port,origin,cookie:'__Host-mb_pc='+t,'x-csrf-token':c});
async function call(method='GET',url=path,body=null,h=headers()){
 const bytes=body===null?null:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  const req=httpsRequest(origin+url,{method,rejectUnauthorized:false,timeout:8000,
   headers:{...h,...(bytes?{'content-length':bytes.length}:{})}},res=>{
    const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>{
     const raw=Buffer.concat(chunks).toString('utf8');let data;
     try{data=JSON.parse(raw)}catch{data={}}
     resolve({status:res.statusCode,body:data,headers:res.headers,raw});
    });
  });
  req.on('error',reject);req.on('timeout',()=>req.destroy(Error('TIMEOUT')));
  if(bytes)req.write(bytes);req.end();
 });
}
async function wire(raw){
 return new Promise((resolve,reject)=>{
  const sock=tlsConnect({host:'127.0.0.1',port,rejectUnauthorized:false});let finished=false;
  sock.setTimeout(5000,()=>{sock.destroy();if(!finished)reject(Error('WIRE_TIMEOUT'))});
  sock.on('secureConnect',()=>sock.write(raw));
  sock.on('data',d=>{const m=d.toString('latin1').match(/^HTTP\/1\.[01] (\d{3})/);
   if(m&&!finished){finished=true;resolve(Number(m[1]));sock.destroy()}});
  sock.on('error',e=>{if(!finished)reject(e)});
 });
}
before(async()=>{
 assertEnvironment();
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin});
 const first=await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'crm-timeline-http-owner'});
 const second=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'crm-timeline-http-admin'});
 assert.equal(first.code,'AUTH_OK');assert.equal(second.code,'AUTH_OK');
 token=first.token;csrf=auth.csrfFor(token);admin=second.token;adminCsrf=auth.csrfFor(admin);
 server=httpsServer({key:await readFile(process.env.F05_CRM_TLS_KEY_PATH),cert:await readFile(process.env.F05_CRM_TLS_CERT_PATH)},
 createFoundationHandler({crmFollowupHandler:createCrmFollowupHandler({auth,service:new CrmFollowupService(auth)}),readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',e=>e?reject(e):resolve()));
});
after(async()=>{if(server)await new Promise(r=>server.close(r));if(absent)await new Promise(r=>absent.close(r));await auth?.close()});
test('H01 real TLS timeline GET defaults to <=20 safe rows and no-cache',async()=>{
 const x=await call();assert.equal(x.status,200);assert.equal(x.body.code,'OK');assert.ok(x.body.items.length>0&&x.body.items.length<=20);
 assert.equal(x.headers['cache-control'],'no-store');assert.equal(x.headers['x-content-type-options'],'nosniff');
});
test('H02 real TLS keyset limit=1 returns a cursor',async()=>{
 const x=await call('GET',path+'?limit=1');assert.equal(x.status,200);assert.equal(x.body.items.length,1);
 assert.equal(x.body.nextBeforeFollowupId,x.body.items[0].followupId);
 const y=await call('GET',path+'?limit=1&beforeFollowupId='+x.body.nextBeforeFollowupId);
 assert.equal(y.status,200);assert.equal(y.body.items.length,1);assert.notEqual(x.body.items[0].followupId,y.body.items[0].followupId);
});
test('H03 limit=50, reverse query order, and valid cursor are accepted',async()=>{
 const a=await call('GET',path+'?limit=50');assert.equal(a.status,200);assert.ok(a.body.items.length<=50);
 const b=await call('GET',path+'?beforeFollowupId='+a.body.items.at(-1).followupId+'&limit=5');
 assert.equal(b.status,200);assert.ok(b.body.items.length<=5);
});
test('H04 invalid limits, leading zeros, negative and floating numbers reject',async()=>{
 for(const q of ['limit=0','limit=51','limit=01','limit=-1','limit=1.1','limit=','limit=00020']){
  assert.equal((await call('GET',path+'?'+q)).status,400,q);
 }
});
test('H05 duplicated, unknown, percent-encoded, ambiguous query keys reject',async()=>{
 for(const q of ['limit=1&limit=2','beforeFollowupId=1&beforeFollowupId=2','sort=asc','limit=%31','%6cimit=5','limit=1;sort=2']){
  assert.equal((await call('GET',path+'?'+q)).status,400,q);
 }
});
test('H06 invalid cursor values and encoding reject',async()=>{
 for(const q of ['beforeFollowupId=0','beforeFollowupId=-1','beforeFollowupId=01','beforeFollowupId=9223372036854775808','beforeFollowupId=1%32']){
  assert.equal((await call('GET',path+'?'+q)).status,400,q);
 }
});
test('H07 query string on old by-ID GET and POST is still rejected',async()=>{
 const first=await call();const id=first.body.items[0].followupId;
 assert.equal((await call('GET',path+'/'+id+'?limit=1')).status,400);
 assert.equal((await call('POST',path+'?limit=1',null)).status,400);
});
test('H08 missing Cookie, bad Cookie and admin PC session fail closed',async()=>{
 const h=headers();delete h.cookie;assert.equal((await call('GET',path,null,h)).status,401);
 assert.equal((await call('GET',path,null,{...headers(),cookie:'invalid'})).status,401);
 assert.equal((await call('GET',path,null,headers(admin,adminCsrf))).status,403);
});
test('H09 Origin/Host spoof and missing Origin are denied',async()=>{
 const h=headers();delete h.origin;assert.equal((await call('GET',path,null,h)).status,403);
 assert.equal((await call('GET',path,null,{...headers(),origin:'https://evil.invalid'})).status,403);
 assert.equal((await call('GET',path,null,{...headers(),host:'fake.invalid'})).status,403);
});
test('H10 no CSRF or invalid CSRF denies new list',async()=>{
 const h=headers();delete h['x-csrf-token'];assert.equal((await call('GET',path,null,h)).status,403);
 assert.equal((await call('GET',path,null,{...headers(),'x-csrf-token':'invalid'})).status,403);
});
test('H11 forwarded and proxy Origin headers are rejected',async()=>{
 assert.equal((await call('GET',path,null,{...headers(),'x-forwarded-for':'127.0.0.1'})).status,403);
 assert.equal((await call('GET',path,null,{...headers(),forwarded:'for=127.0.0.1'})).status,403);
});
test('H12 GET body and non-GET method contract denied',async()=>{
 assert.equal((await call('GET',path,'{}')).status,400);
 assert.equal((await call('PUT',path,null)).status,405);
});
test('H13 TLS duplicate Host raw wire fails closed',async()=>{
 const raw='GET '+path+' HTTP/1.1\r\nHost: 127.0.0.1:'+port+'\r\nHost: 127.0.0.1:'+port+'\r\nOrigin: '+origin+'\r\nConnection: close\r\n\r\n';
 assert.ok([400,403].includes(await wire(raw)));
});
test('H14 path encoding, trailing slash and unknown path never match',async()=>{
 assert.equal((await call('GET',path+'/')).status,404);
 assert.equal((await call('GET','/__ci__/f05/crm-followups/%33%30%31')).status,404);
 // https.request normalizes a trailing bare '?' away; send the exact request target on the TLS wire.
 const raw='GET '+path+'? HTTP/1.1\r\nHost: 127.0.0.1:'+port+'\r\nOrigin: '+origin+'\r\nCookie: __Host-mb_pc='+token+'\r\nX-CSRF-Token: '+csrf+'\r\nConnection: close\r\n\r\n';
 assert.equal(await wire(raw),400);
});
test('H15 no CI injection means no registered timeline endpoint',async()=>{
 absent=httpsServer({key:await readFile(process.env.F05_CRM_TLS_KEY_PATH),cert:await readFile(process.env.F05_CRM_TLS_CERT_PATH)},
 createFoundationHandler({readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>absent.listen(4412,'127.0.0.1',e=>e?reject(e):resolve()));
 const code=await new Promise((resolve,reject)=>{
  httpsRequest('https://127.0.0.1:4412'+path,{rejectUnauthorized:false},res=>{
   res.resume();res.on('end',()=>resolve(res.statusCode));
  }).on('error',reject).end();
 });
 assert.equal(code,404);
});
test('H16 timeline errors do not echo raw source credentials or PII',async()=>{
 const x=await call();assert.equal(x.status,200);
 for(const forbidden of ['password_hash','token_digest','role_context','NEVER_EXPOSE_SECRET_42','phone_ciphertext']){
  assert.equal(x.raw.includes(forbidden),false,forbidden);
 }
});
