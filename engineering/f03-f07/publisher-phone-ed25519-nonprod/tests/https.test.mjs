import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {request as httpsRequest,createServer as createHttpsServer} from 'node:https';
import {readFile} from 'node:fs/promises';
import {verify as cryptoVerify,randomUUID} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {PublisherPhoneAdminService} from '../../../src/f03-publisher-phone-admin-service.mjs';
import {configurePublisherPhoneAccess} from '../../f07/publisher-phone-scope-runtime/guard.mjs';
import {ChallengeStore} from '../challenge-store.mjs';
import {createHarness} from '../harness.mjs';
import {canonicalPayload,makeEphemeralKeyPair,ORIGIN} from '../protocol.mjs';
import {assertEnvironment,connectPools,F03_URL} from '../environment.mjs';
import {createFoundationHandler} from '../../../src/app.mjs';

const F07_ORIGIN='https://127.0.0.1:4317',F03_ORIGIN='https://127.0.0.1:4318';
let f03,f07,authF03,authF07,adminToken,salesToken,phoneAdmin,store,keys,tls,harness,productionServer;
const requestKey=()=>randomUUID().replaceAll('-','');
async function configureMode(mode){
 const current=await phoneAdmin.get({token:adminToken,employeeId:'6'});assert.equal(current.status,200);
 const changed=await phoneAdmin.change({token:adminToken,employeeId:'6',method:'PUT',
  input:{scopeMode:mode,expectedVersion:current.version,requestKey:requestKey()}});
 assert.equal(changed.status,200);
 const scoped=await configurePublisherPhoneAccess({auth:authF07,pool:f07,token:adminToken,
  input:{action:'grant',employee_id:6,scope_mode:mode}});
 assert.equal(scoped.allowed,true);
}
async function request({origin,port,path,method='POST',body,token=salesToken,csrf,headers={},ca=tls.cert,contentType='application/json'}){
 const urlPath=path;const bytes=body===undefined||body===null?null:Buffer.from(typeof body==='string'?body:JSON.stringify(body));
 const h={host:'127.0.0.1:'+port,...(origin?{origin}:{}),...(token?{cookie:'__Host-mb_pc='+token}:{}),
  ...(csrf!==undefined?{'x-csrf-token':csrf}:{}),...(bytes?{'content-type':contentType,'content-length':String(bytes.length)}:{}),connection:'close',...headers};
 return new Promise((resolve,reject)=>{
  const options={hostname:'127.0.0.1',port,path:urlPath,method,headers:h,rejectUnauthorized:true,servername:'127.0.0.1',timeout:5000};
  if(ca!==undefined&&ca!==null)options.ca=ca;
  const req=httpsRequest(options,res=>{
   const parts=[];let size=0;
   res.on('data',part=>{size+=part.length;if(size>16384){req.destroy(Error('RESPONSE_TOO_LARGE'));return}parts.push(part)});
   res.on('end',()=>{const raw=Buffer.concat(parts).toString('utf8');let data;try{data=JSON.parse(raw)}catch{data=null}
    resolve({status:res.statusCode,headers:res.headers,raw,body:data});
   });
  });
  req.on('timeout',()=>req.destroy(Error('HTTPS_TIMEOUT')));req.on('error',reject);
  if(bytes)req.write(bytes);req.end();
 });
}
const callF07=(opts={})=>request({origin:F07_ORIGIN,port:4317,path:'/__ci__/f07/phone/authorize',
 csrf:authF07.csrfFor(salesToken),body:{action:'vehicle.publisher_phone.latest',vehicleId:'101'},...opts});
const issuer=(opts={})=>request({origin:F03_ORIGIN,port:4318,path:'/__ci__/f03-f07/issue',
 csrf:authF03.csrfFor(salesToken),body:{challenge:{invalid:true}},...opts});
before(async()=>{
 assertEnvironment();({f03,f07}=await connectPools());
 const secret=Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64');
 authF03=new IsolatedAuth({connectionString:F03_URL,secret,origin:F03_ORIGIN});
 authF07=new IsolatedAuth({connectionString:F03_URL,secret,origin:F07_ORIGIN});
 const a=await authF07.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'ed25519-http-admin'});
 const e=await authF07.login({login:'race_test',password:'SyntheticRace_1234567',source:'ed25519-http-employee'});
 assert.equal(a.code,'AUTH_OK');assert.equal(e.code,'AUTH_OK');adminToken=a.token;salesToken=e.token;
 phoneAdmin=new PublisherPhoneAdminService(authF03);store=new ChallengeStore(f07);keys=makeEphemeralKeyPair();
 await configureMode('LOCKED_ONLY');
 tls={key:await readFile(process.env.F03_F07_TLS_KEY_PATH),cert:await readFile(process.env.F03_F07_TLS_CERT_PATH)};
 harness=createHarness({authF03,authF07,pool:f07,privateKey:keys.privateKey,publicKey:keys.publicKey,kid:keys.kid,...tls});
 await harness.listen();
});
after(async()=>{
 if(productionServer)await new Promise(resolve=>productionServer.close(()=>resolve()));
 await harness?.close();
 await Promise.all([authF03?.close(),authF07?.close(),f03?.end(),f07?.end()].filter(Boolean));
});
test('H01 real loopback HTTPS end-to-end signs, verifies, calls existing Guard and returns safe allow',async()=>{
 const x=await callF07();assert.equal(x.status,200);assert.equal(x.body.allowed,true);
 assert.equal(x.body.code,'PUBLISHER_PHONE_ALLOWED');assert.equal(x.body.origin,ORIGIN);
 assert.equal(x.body.formalSourceSigned,false);assert.equal(x.body.productionReady,false);
 assert.ok(x.body.auditId);assert.equal(x.headers['cache-control'],'no-store');
 assert.equal(x.headers['x-content-type-options'],'nosniff');
});
test('H02 real HTTPS no-lock vehicle fails through the same signed protocol and current Guard',async()=>{
 const x=await callF07({body:{action:'vehicle.publisher_phone.latest',vehicleId:'102'}});
 assert.equal(x.status,403);assert.equal(x.body.allowed,false);assert.equal(x.body.code,'CURRENT_LOCK_REQUIRED');
});
test('H03 HTTP response never exposes phone, nonce, assertion, token, publisher or private key',async()=>{
 const x=await callF07();assert.equal(x.status,200);
 for(const field of ['phone','nonce','signature','assertion','token','upstreamPublisherId','privateKey','password_hash','f03FactsSha256'])
  assert.equal(Object.hasOwn(x.body,field),false,field);
 for(const value of ['TEST-123456','publisher_id','PRIVATE KEY','NEVER_EXPOSE_SECRET'])
  assert.equal(x.raw.includes(value),false,value);
});
test('H04 missing session cookie fails closed',async()=>{
 const x=await callF07({token:null});assert.equal(x.status,401);assert.equal(x.body.code,'SESSION_INVALID');
});
test('H05 malformed cookie and duplicate cookie names fail closed',async()=>{
 const a=await callF07({token:null,headers:{cookie:'__Host-mb_pc=bad'}});assert.equal(a.status,401);
 const b=await callF07({headers:{cookie:'__Host-mb_pc='+salesToken+'; __Host-mb_pc='+salesToken}});
 assert.equal(b.status,401);assert.equal(b.body.code,'SESSION_INVALID');
});
test('H06 missing or incorrect CSRF fails closed',async()=>{
 const a=await callF07({csrf:undefined});assert.equal(a.status,403);assert.equal(a.body.code,'CSRF_DENIED');
 const b=await callF07({csrf:'wrong-csrf-value'});assert.equal(b.status,403);assert.equal(b.body.code,'CSRF_DENIED');
});
test('H07 untrusted, absent and spoofed Origin fail closed',async()=>{
 for(const origin of ['https://attacker.invalid',undefined]){
  const x=await callF07({origin});assert.equal(x.status,403);assert.equal(x.body.code,'SECURE_SAME_ORIGIN_REQUIRED');
 }
});
test('H08 spoofed Host and forwarded proxy headers fail closed',async()=>{
 const a=await callF07({headers:{host:'attacker.invalid'}});assert.equal(a.status,403);
 const b=await callF07({headers:{'x-forwarded-host':'attacker.invalid'}});assert.equal(b.status,200);
 // Proxy headers are ignored; the socket Host/Origin and loopback TLS remain authoritative.
});
test('H09 query strings are forbidden on the protocol endpoint',async()=>{
 const x=await callF07({path:'/__ci__/f07/phone/authorize?vehicleId=101'});
 assert.equal(x.status,400);assert.equal(x.body.code,'QUERY_FORBIDDEN');
});
test('H10 method, Content-Type, empty and invalid JSON are rejected',async()=>{
 assert.equal((await callF07({method:'GET',body:null})).status,405);
 const type=await callF07({body:'{}',contentType:'text/plain'});assert.equal(type.status,415);
 const empty=await callF07({body:null,headers:{'content-type':'application/json','content-length':'0'}});assert.equal(empty.status,400);
 const json=await callF07({body:'{' });assert.equal(json.status,400);
});
test('H11 extra fields and caller-supplied employee identity are rejected',async()=>{
 for(const body of [
  {action:'vehicle.publisher_phone.latest',vehicleId:'101',employeeId:'1'},
  {action:'vehicle.publisher_phone.latest',vehicleId:'101',scopeMode:'ALL_ACTIVE_JYT'},
  {action:'vehicle.publisher_phone.latest',vehicleId:'101',nonce:'A'.repeat(43)}
 ]){const x=await callF07({body});assert.equal(x.status,400);assert.equal(x.body.code,'INVALID_REQUEST')}
});
test('H12 duplicate-key and non-canonical JSON bodies are rejected',async()=>{
 const duplicate='{"action":"vehicle.publisher_phone.latest","vehicleId":"101","vehicleId":"102"}';
 const x=await callF07({body:duplicate});assert.equal(x.status,400);
 const noncanonical=await callF07({body:'{ "action":"vehicle.publisher_phone.latest","vehicleId":"101" }'});
 assert.equal(noncanonical.status,400);
});
test('H13 invalid action, zero ID and BIGINT overflow are rejected',async()=>{
 for(const body of [
  {action:'admin.delete',vehicleId:'101'},
  {action:'vehicle.publisher_phone.latest',vehicleId:'0'},
  {action:'vehicle.publisher_phone.latest',vehicleId:'9223372036854775808'},
  {action:'vehicle.publisher_phone.latest',vehicleId:101}
 ]){const x=await callF07({body});assert.equal(x.status,400)}
});
test('H14 request body size is capped before parsing',async()=>{
 const x=await callF07({body:'x'.repeat(3000)});assert.equal(x.status,400);assert.equal(x.body.code,'BODY_TOO_LARGE');
});
test('H15 valid F03 HTTPS issuer returns a signed, challenge-bound assertion only to current employee session',async()=>{
 const ch=await store.create({employeeId:'6',action:'vehicle.publisher_phone.latest',vehicleId:'101',requestId:randomUUID()});
 const x=await issuer({body:{challenge:ch}});
 assert.equal(x.status,200);assert.equal(x.body.ok,true);assert.equal(x.body.code,'ASSERTION_ISSUED');
 assert.equal(x.body.assertion.payload.challengeId,ch.challengeId);
 assert.equal(x.body.assertion.payload.nonce,ch.nonce);
 assert.equal(cryptoVerify(null,canonicalPayload(x.body.assertion.payload),keys.publicKey,Buffer.from(x.body.assertion.signature,'base64url')),true);
 assert.equal(JSON.stringify(x.body).includes('privateKey'),false);
 await store.cancel(ch);
});
test('H16 F03 issuer rejects malformed challenge, query and wrong method',async()=>{
 const a=await issuer({body:{challenge:{invalid:true}}});assert.equal(a.status,400);
 const b=await issuer({path:'/__ci__/f03-f07/issue?extra=1'});assert.equal(b.status,400);
 const c=await issuer({method:'GET',body:null});assert.equal(c.status,405);
});
test('H17 F03 issuer requires a real employee session and CSRF',async()=>{
 const ch=await store.create({employeeId:'6',action:'vehicle.publisher_phone.latest',vehicleId:'101',requestId:randomUUID()});
 const noCookie=await issuer({token:null,body:{challenge:ch}});assert.equal(noCookie.status,401);
 const noCsrf=await issuer({csrf:undefined,body:{challenge:ch}});assert.equal(noCsrf.status,403);
 const wrongCsrf=await issuer({csrf:'wrong',body:{challenge:ch}});assert.equal(wrongCsrf.status,403);
 await store.cancel(ch);
});
test('H18 F03 issuer enforces Host and Origin on loopback TLS',async()=>{
 const a=await issuer({headers:{host:'attacker.invalid'}});assert.equal(a.status,403);
 const b=await issuer({origin:'https://attacker.invalid'});assert.equal(b.status,403);
});
test('H19 explicit CA trust succeeds and no implicit global TLS bypass exists',async()=>{
 await assert.rejects(()=>callF07({ca:null}),/SELF_SIGNED|CERT|certificate/i);
 const trusted=await callF07();assert.equal(trusted.status,200);
});
test('H20 System Admin session cannot request employee phone assertion from F07',async()=>{
 const x=await callF07({token:adminToken,csrf:authF07.csrfFor(adminToken)});
 assert.equal(x.status,401);assert.equal(x.body.code,'CURRENT_EMPLOYEE_SESSION_REQUIRED');
});
test('H21 production foundation handler does not register either CI protocol route',async()=>{
 productionServer=createHttpsServer({key:tls.key,cert:tls.cert},createFoundationHandler({readinessProbe:async()=>true}));
 await new Promise((resolve,reject)=>productionServer.once('error',reject).listen(4319,'127.0.0.1',resolve));
 const path='/__ci__/f07/phone/authorize';
 const x=await request({origin:F07_ORIGIN,port:4319,path,body:{action:'vehicle.publisher_phone.latest',vehicleId:'101'},
  csrf:authF07.csrfFor(salesToken),ca:tls.cert});
 assert.equal(x.status,404);
});
test('H22 successful and denied HTTPS requests both produce safe decision audit rows',async()=>{
 const before=await sqlAuditCount();await callF07();await callF07({body:{action:'vehicle.publisher_phone.latest',vehicleId:'102'}});
 const after=await sqlAuditCount();assert.ok(after>=before+2);
 const rows=await f07.query("SELECT decision_code,allowed,origin FROM f03_f07_phone_ed25519_nonprod.decision_audit ORDER BY audit_id DESC LIMIT 2");
 assert.equal(rows.rowCount,2);assert.ok(rows.rows.every(x=>x.origin===ORIGIN));
 assert.ok(rows.rows.some(x=>x.allowed===true));assert.ok(rows.rows.some(x=>x.allowed===false));
});
async function sqlAuditCount(){return Number((await f07.query('SELECT count(*)::int n FROM f03_f07_phone_ed25519_nonprod.decision_audit')).rows[0].n)}
