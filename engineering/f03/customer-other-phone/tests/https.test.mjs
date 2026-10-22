import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {createServer as httpsServer,request as httpsRequest} from 'node:https';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';
import {createCustomerOtherPhoneHandler} from '../../../src/f03-customer-other-phone-http.mjs';
import {CustomerOtherPhoneService} from '../../../src/f03-customer-other-phone-service.mjs';
import {assertEnvironment} from '../environment.mjs';

const port=4318,origin='https://127.0.0.1:'+port,path='/__ci__/f03/customers/301/other-phones';
let auth,server,fallback,token,csrf,key;
const phone='13012345678';
const idempotencyKey=()=>randomUUID().replaceAll('-','');
const reqHeaders=(withToken=true,withCsrf=true,key=idempotencyKey())=>({
 origin,host:'127.0.0.1:'+port,'content-type':'application/json','idempotency-key':key,
 ...(withToken?{cookie:'__Host-mb_pc='+token}:{}),
 ...(withCsrf&&withToken?{'x-csrf-token':csrf}:{})
});
async function call(method,url=path,payload,headers=reqHeaders()){
 const bytes=payload===undefined?null:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const options={method,headers:{...headers,...(bytes?{'content-length':bytes.length}:{})},rejectUnauthorized:false,timeout:8000};
  const request=httpsRequest(origin+url,options,res=>{
   const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>{
    const raw=Buffer.concat(chunks).toString('utf8');let body;try{body=JSON.parse(raw)}catch{body={}};
    resolve({status:res.statusCode,headers:res.headers,body,raw});
   });
  });
  request.on('error',reject);request.on('timeout',()=>request.destroy(Error('TIMEOUT')));
  if(bytes)request.write(bytes);request.end();
 });
}
before(async()=>{
 assertEnvironment();key=Buffer.from(process.env.F03_CUSTOMER_PHONE_KEY_BASE64||'','base64');assert.equal(key.length,32);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin});
 const login=await auth.login({login:'employee_test',password:'SyntheticScopeEmployee_2026',source:'customer_phone_https'});
 assert.equal(login.code,'AUTH_OK');assert.equal(login.restricted,false);token=login.token;csrf=auth.csrfFor(token);
 const service=new CustomerOtherPhoneService(auth,{key});
 const handler=createCustomerOtherPhoneHandler({service,auth});
 server=httpsServer({key:await readFile(process.env.F03_CUSTOMER_PHONE_TLS_KEY_PATH),cert:await readFile(process.env.F03_CUSTOMER_PHONE_TLS_CERT_PATH)},
  createFoundationHandler({customerOtherPhoneHandler:handler,readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',e=>e?reject(e):resolve()));
});
after(async()=>{
 if(server)await new Promise(r=>server.close(r));
 if(fallback)await new Promise(r=>fallback.close(r));
 await auth?.close();key?.fill(0);
});
test('01 real HTTPS list is same-origin, current-scope guarded and mask-only',async()=>{
 const out=await call('GET');assert.equal(out.status,200);assert.equal(out.headers['cache-control'],'no-store');
 assert.ok(Array.isArray(out.body.phones));assert.equal(out.raw.includes(phone),false);assert.equal(out.raw.includes('phone_ciphertext'),false);
});
test('02 absent and wrong Origin are rejected',async()=>{
 const no=reqHeaders();delete no.origin;assert.equal((await call('GET',path,undefined,no)).status,403);
 assert.equal((await call('GET',path,undefined,{...reqHeaders(),origin:'https://evil.invalid'})).status,403);
});
test('03 missing, duplicate, and malformed session cookies are denied',async()=>{
 assert.equal((await call('GET',path,undefined,reqHeaders(false))).status,401);
 const duplicate={...reqHeaders(),cookie:'__Host-mb_pc='+token+'; __Host-mb_pc='+token};
 assert.equal((await call('GET',path,undefined,duplicate)).status,401);
 const malformed={...reqHeaders(),cookie:'__Host-mb_pc=not-a-token'};
 assert.equal((await call('GET',path,undefined,malformed)).status,401);
});
test('04 query strings, missing Idempotency-Key, and unsupported methods are rejected',async()=>{
 assert.equal((await call('GET',path+'?phone='+phone)).status,400);
 assert.equal((await call('PUT',path)).status,405);
 const noKey=reqHeaders();delete noKey['idempotency-key'];
 assert.equal((await call('POST',path,{phoneNumber:phone},noKey)).status,400);
});
test('05 CSRF, content type, malformed JSON, and extra fields are rejected',async()=>{
 assert.equal((await call('POST',path,{phoneNumber:phone},reqHeaders(true,false))).status,403);
 assert.equal((await call('POST',path,{phoneNumber:phone},{...reqHeaders(),'content-type':'text/plain'})).status,415);
 assert.equal((await call('POST',path,'{',reqHeaders())).status,400);
 assert.equal((await call('POST',path,{phoneNumber:phone,primaryPhone:phone},reqHeaders())).status,400);
});
test('06 oversized request body, forwarded headers and incorrect Host are rejected',async()=>{
 assert.equal((await call('POST',path,JSON.stringify({phoneNumber:'1'.repeat(2200)}),reqHeaders())).status,413);
 assert.equal((await call('GET',path,undefined,{...reqHeaders(),host:'evil.invalid'})).status,403);
 assert.equal((await call('GET',path,undefined,{...reqHeaders(),'x-forwarded-for':'127.0.0.1'})).status,403);
});
test('07 HTTPS add returns a mask and never returns the submitted phone',async()=>{
 const out=await call('POST',path,{phoneNumber:phone});
 assert.equal(out.status,200);assert.equal(out.body.maskedPhone,'130****5678');assert.equal(out.raw.includes(phone),false);
});
test('08 replace and end use explicit fact IDs and never expose plaintext',async()=>{
 const listOut=await call('GET');const row=listOut.body.phones.find(x=>x.maskedPhone==='130****5678');assert.ok(row);
 const replacement='13112345678';
 const replaced=await call('POST',path+'/'+row.phoneFactId+'/replace',{phoneNumber:replacement});
 assert.equal(replaced.status,200);assert.equal(replaced.raw.includes(replacement),false);
 const ended=await call('POST',path+'/'+replaced.body.phoneFactId+'/end',{});
 assert.equal(ended.status,200);assert.equal(ended.body.active,false);
});
test('09 default application without explicit injection keeps the CI route unavailable',async()=>{
 fallback=httpsServer({key:await readFile(process.env.F03_CUSTOMER_PHONE_TLS_KEY_PATH),cert:await readFile(process.env.F03_CUSTOMER_PHONE_TLS_CERT_PATH)},
  createFoundationHandler({readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>fallback.listen(4319,'127.0.0.1',e=>e?reject(e):resolve()));
 const fallbackUrl='https://127.0.0.1:4319'+path;
 const out=await new Promise((resolve,reject)=>{
  httpsRequest(fallbackUrl,{method:'GET',rejectUnauthorized:false},res=>{res.resume();res.on('end',()=>resolve(res.statusCode))}).on('error',reject).end();
 });
 assert.equal(out,404);
});
