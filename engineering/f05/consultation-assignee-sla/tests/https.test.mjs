import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {denyConsultationIssuerRouter} from '../ci-router.mjs';
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:randomBytes(32),origin:'https://127.0.0.1:48989'});
let server,token;
const ep=s=>'/__ci__/f05-10/v1/'+s;
async function call(path,method='POST',obj={},headers={}){
 const data=obj===null?null:Buffer.from(JSON.stringify(obj));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48989,path,method,rejectUnauthorized:false,
   headers:{origin:'https://127.0.0.1:48989',...(data?{'content-type':'application/json','content-length':data.length}:{}),...headers}},res=>{
   let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve({status:res.statusCode,
    headers:res.headers,body:JSON.parse(body)}))});
  req.on('error',reject);if(data)req.write(data);req.end();
 });
}
const deny=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.deepEqual(r.body,{code:'F05_10_PRODUCTION_CONSULTATION_ISSUER_NOT_WIRED'});
 assert.equal(r.headers['cache-control'],'no-store')};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const s=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-10-native-tls'});
 assert.equal(s.code,'AUTH_OK');token=s.token;
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},denyConsultationIssuerRouter());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48989,'127.0.0.1',resolve)});
});
test.after(async()=>{if(server)await new Promise(done=>server.close(done));await auth.close();await db.end()});
test('10-H01 signed employee session does not issue production Consultation',async()=>{
 deny(await call(ep('consultation'),'POST',{customerId:899612},{cookie:'__Host-mb_pc='+token,'x-csrf-token':auth.csrfFor(token)}));
});
test('10-H02 synthetic consent, fake phone and WeChat all denied',async()=>{
 for(const p of [{phoneConsent:true},{wechat:'fake'},{syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}])
  deny(await call(ep('create'),'POST',p));
});
test('10-H03 no permission by ordinary share, Recommendation, Lock or Transaction',async()=>{
 for(const path of ['share','recommendation','lock','transaction','favorite'])
  deny(await call(ep(path),'POST',{customerId:899612,created:true}));
});
test('10-H04 no admin, 4S or forged role business issuer',async()=>{
 for(const h of [{authorization:'Bearer admin'},{'x-four-s-member':'true'},{'x-system-admin':'true'},{origin:'https://attacker.invalid'}])
  deny(await call(ep('create'),'POST',{customerId:899612},h));
});
test('10-H05 all internal, hold, withdrawal and follow-up production mutation denied',async()=>{
 for(const path of ['handover','withdraw','hold','resume','first-response','internal-read'])
  deny(await call(ep(path),'POST',{consultationId:1}));
});
test('10-H06 production API absent; GET is not a mutation',async()=>{
 assert.equal((await call('/api/v1/consultations','POST',{})).status,404);
 assert.equal((await call(ep('consultation'),'GET',null)).status,405);
});
test('10-H07 denied response has no customer, VIN, phone, price, token or sensitive chat',async()=>{
 const result=await call(ep('create'),'POST',{vin:'X',phone:'11111',token:'secret',price:8,chat:'private'});
 deny(result);const b=JSON.stringify(result.body).toLowerCase();
 for(const word of ['vin','phone','token','price','customerid','chat','wechat','employee'])
  assert.equal(b.includes(word),false);
});
