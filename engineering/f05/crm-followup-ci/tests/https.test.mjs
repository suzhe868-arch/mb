import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {createServer as httpsServer,request as httpsRequest} from 'node:https';
import {connect as tlsConnect} from 'node:tls';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CrmFollowupService} from '../../../src/f05-crm-followup-service.mjs';
import {createCrmFollowupHandler} from '../../../src/f05-crm-followup-http.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {assertEnvironment} from '../environment.mjs';

const port=4396,origin='https://127.0.0.1:'+port,path='/__ci__/f05/crm-followups/301';
let server,absent,auth,token,csrf,admin,adminCsrf,created;
const key=()=>randomUUID().replaceAll('-','');
const payload=(content='Synthetic CRM followup from real TLS')=>({content,businessDemandId:null,source:{kind:'manual',reference:'https_ci_01'}});
const head=(t=token,c=csrf,k=key())=>({host:'127.0.0.1:'+port,origin,cookie:'__Host-mb_pc='+t,'x-csrf-token':c,'idempotency-key':k,'content-type':'application/json'});
async function call(method='POST',url=path,body=payload(),headers=head()){
 const bytes=body===null?null:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  const req=httpsRequest(origin+url,{method,headers:{...headers,...(bytes?{'content-length':bytes.length}:{})},rejectUnauthorized:false,timeout:8000},res=>{
   const chunks=[];res.on('data',v=>chunks.push(v));res.on('end',()=>{
    const raw=Buffer.concat(chunks).toString('utf8');let json;
    try{json=JSON.parse(raw)}catch{json={}}
    resolve({status:res.statusCode,body:json,headers:res.headers,raw});
   });
  });req.on('error',reject);req.on('timeout',()=>req.destroy(Error('HTTPS_TIMEOUT')));if(bytes)req.write(bytes);req.end();
 });
}
async function wire(raw){
 return new Promise((resolve,reject)=>{
  const sock=tlsConnect({host:'127.0.0.1',port,rejectUnauthorized:false});let done=false;
  sock.setTimeout(5000,()=>{sock.destroy();if(!done)reject(Error('WIRE_TIMEOUT'))});
  sock.on('secureConnect',()=>sock.write(raw));
  sock.on('data',d=>{const m=d.toString('latin1').match(/^HTTP\/1\.[01] (\d{3})/);if(m&&!done){done=true;resolve(Number(m[1]));sock.destroy()}});
  sock.on('error',e=>{if(!done)reject(e)});
 });
}
before(async()=>{
 assertEnvironment();
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin});
 const a=await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'crm-https-owner'});
 const d=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'crm-https-admin'});
 assert.equal(a.code,'AUTH_OK');assert.equal(d.code,'AUTH_OK');
 token=a.token;csrf=auth.csrfFor(token);admin=d.token;adminCsrf=auth.csrfFor(admin);
 const keyPath=process.env.F05_CRM_TLS_KEY_PATH,certPath=process.env.F05_CRM_TLS_CERT_PATH;
 server=httpsServer({key:await readFile(keyPath),cert:await readFile(certPath)},
 createFoundationHandler({crmFollowupHandler:createCrmFollowupHandler({auth,service:new CrmFollowupService(auth)}),readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',e=>e?reject(e):resolve()));
});
after(async()=>{if(server)await new Promise(r=>server.close(r));if(absent)await new Promise(r=>absent.close(r));await auth?.close()});
test('H01 actual TLS valid POST appends Customer followup',async()=>{
 const x=await call();assert.equal(x.status,201);assert.equal(x.body.code,'CREATED');created=x.body.followupId;
 assert.equal(x.headers['cache-control'],'no-store');
});
test('H02 actual TLS scoped GET reads one safe projection',async()=>{
 const x=await call('GET',path+'/'+created,null);
 assert.equal(x.status,200);assert.equal(x.body.content,'Synthetic CRM followup from real TLS');
 assert.equal(x.raw.includes('password_hash'),false);
});
test('H03 missing Origin and hostile Origin fail closed',async()=>{
 const h=head();delete h.origin;assert.equal((await call('POST',path,payload(),h)).status,403);
 assert.equal((await call('POST',path,payload(),{...head(),origin:'https://evil.invalid'})).status,403);
});
test('H04 invalid/missing/duplicate session cookie fails',async()=>{
 const h=head();delete h.cookie;assert.equal((await call('POST',path,payload(),h)).status,401);
 assert.equal((await call('POST',path,payload(),{...head(),cookie:'bad'})).status,401);
 assert.equal((await call('POST',path,payload(),{...head(),cookie:'__Host-mb_pc='+token+'; __Host-mb_pc='+token})).status,401);
});
test('H05 missing CSRF, altered CSRF and idempotency key rejected',async()=>{
 const h=head();delete h['x-csrf-token'];assert.equal((await call('POST',path,payload(),h)).status,403);
 assert.equal((await call('POST',path,payload(),{...head(),'x-csrf-token':'bad'})).status,403);
 const h2=head();delete h2['idempotency-key'];assert.equal((await call('POST',path,payload(),h2)).status,400);
});
test('H06 forwarded, forged Host and proxy hint headers denied',async()=>{
 assert.equal((await call('POST',path,payload(),{...head(),'x-forwarded-for':'127.0.0.1'})).status,403);
 assert.equal((await call('POST',path,payload(),{...head(),host:'evil.invalid'})).status,403);
});
test('H07 invalid JSON, unexpected fields and array fail safely',async()=>{
 assert.equal((await call('POST',path,'{oops')).status,400);
 assert.equal((await call('POST',path,{...payload(),admin:true})).status,400);
 assert.equal((await call('POST',path,[])).status,400);
});
test('H08 unsupported Content-Type and oversized JSON rejected',async()=>{
 assert.equal((await call('POST',path,payload(),{...head(),'content-type':'text/plain'})).status,415);
 assert.equal((await call('POST',path,payload('x'.repeat(9000)))).status,413);
});
test('H09 absent valid scope and admin control plane cannot insert',async()=>{
 assert.equal((await call('POST',path,payload(),head(admin,adminCsrf))).status,403);
 assert.equal((await call('POST','/__ci__/f05/crm-followups/302',payload())).status,403);
});
test('H10 query strings, unsupported verbs, and malformed path fail closed',async()=>{
 assert.equal((await call('POST',path+'?trace=1')).status,400);
 assert.equal((await call('PUT',path)).status,405);
 assert.equal((await call('POST',path+'/strange')).status,404);
});
test('H11 actual TLS request replay returns same immutable followup',async()=>{
 const k=key(),h=head(token,csrf,k);
 const x=await call('POST',path,payload('Immutable replay note'),h);
 const y=await call('POST',path,payload('Immutable replay note'),h);
 assert.equal(x.status,201);assert.deepEqual(x.body,y.body);
 assert.equal((await call('POST',path,payload('Payload tamper note'),h)).status,409);
});
test('H12 duplicate Host security header raw TLS rejected',async()=>{
 const raw='GET '+path+'/'+created+' HTTP/1.1\r\nHost: 127.0.0.1:'+port+'\r\nHost: 127.0.0.1:'+port+'\r\nOrigin: '+origin+'\r\nConnection: close\r\n\r\n';
 assert.ok([400,403].includes(await wire(raw)));
});
test('H13 GET body rejected and no cross-Customer read',async()=>{
 assert.equal((await call('GET',path+'/'+created,'{}')).status,400);
 assert.equal((await call('GET','/__ci__/f05/crm-followups/302/'+created,null)).status,403);
});
test('H14 default production-style foundation handler has no CRM route',async()=>{
 absent=httpsServer({key:await readFile(process.env.F05_CRM_TLS_KEY_PATH),cert:await readFile(process.env.F05_CRM_TLS_CERT_PATH)},
 createFoundationHandler({readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>absent.listen(4397,'127.0.0.1',e=>e?reject(e):resolve()));
 const x=await new Promise((resolve,reject)=>{
  httpsRequest('https://127.0.0.1:4397'+path,{rejectUnauthorized:false},res=>{
   const parts=[];res.on('data',p=>parts.push(p));res.on('end',()=>resolve(res.statusCode));
  }).on('error',reject).end();
 });
 assert.equal(x,404);
});
