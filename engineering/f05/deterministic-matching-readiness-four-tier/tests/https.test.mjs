import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createMatchingCIRejectRouter} from '../ci-router.mjs';
// Logical origin/Host is intentionally fixed by the frozen CI reject-router security contract.
// Only the loopback TCP transport port is dynamically assigned by the OS; do not weaken
// the router origin, Host, TLS, Cookie, CSRF or denial assertions.
const origin='https://127.0.0.1:48988',db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,transportPort,tokens={};
async function call(path,method='POST',body={},headers={}){
 const b=body===null?null:Buffer.from(JSON.stringify(body));
 return new Promise((resolve,reject)=>{
  assert.ok(Number.isInteger(transportPort)&&transportPort>0,'HTTPS ephemeral loopback listener not ready');
  const req=request({hostname:'127.0.0.1',port:transportPort,path,method,rejectUnauthorized:false,
   headers:{host:new URL(origin).host,origin,...(b?{'content-type':'application/json','content-length':b.length}:{}),...headers}},
   res=>{let s='';res.on('data',d=>s+=d);res.on('end',()=>{
    try{resolve({status:res.statusCode,body:JSON.parse(s),headers:res.headers})}catch(e){reject(e)}
   })});
  req.on('error',reject);if(b)req.write(b);req.end();
 });
}
const match='/__ci__/f05-7/v1/match',rule='/__ci__/f05-7/v1/rule';
const denied=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.equal(x.body.code,'F05_7_PRODUCTION_MATCHING_RULE_ISSUERS_SOURCE_GAP');assert.match(x.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [who,login,password] of [
  ['sales','employee_test','SyntheticF04_3_CurrentProof_2026'],
  ['four','four_s_test','SyntheticFourS_123456'],
  ['admin','admin_test','SyntheticAdmin_1234567']]){
  const x=await auth.login({login,password,source:'f05-7-real-https-ci-'+who});assert.equal(x.code,'AUTH_OK');tokens[who]=x.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createMatchingCIRejectRouter());
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const address=server.address();assert.equal(address.address,'127.0.0.1');
 assert.ok(Number.isInteger(address.port)&&address.port>0);transportPort=address.port;
 console.log('F05_7_HTTPS_EPHEMERAL_LOOPBACK_BIND',JSON.stringify({port:transportPort,logicalOrigin:origin,host:new URL(origin).host}));
});
test.after(async()=>{if(server)await new Promise(r=>server.close(r));await auth.close();await db.end();secret.fill(0)});
test('7-B01 body fake matching-ready/high tier is denied',async()=>denied(await call(match,'POST',{matchingReady:true,tier:'high',customerId:899612})));
test('7-B02 invented AI/JYT/微信 tokens cannot sign matching rules',async()=>{
 for(const h of [{'x-wechat-openid':'fake'},{authorization:'Bearer invalid'},{'x-jyt-token':'fake'},{'x-ml-high-confidence':'1'}])
  denied(await call(rule,'POST',{AI:'guess'},h));
});
test('7-B03 employee/4S/SystemAdmin cookie does not issue current Rule permission',async()=>{
 for(const token of Object.values(tokens))for(const path of [rule,match])
  denied(await call(path,'POST',{allowRuleManagement:true},{cookie:'__Host-mb_pc='+token,'x-csrf-token':auth.csrfFor(token)}));
});
test('7-B04 wholesale/internal/VIN or alleged numeric final price cannot be trusted from HTTP',async()=>{
 for(const x of [{displayPrice:100000},{wholesalePrice:88000},{vin:'synthetic'},{isManager:true}])
  denied(await call(match,'POST',x));
});
test('7-B05 CSRF/cross-origin/duplicate-cookie remain fail closed',async()=>{
 for(const h of [{origin:'https://evil.invalid'},{'x-csrf-token':'bad'},{cookie:'__Host-mb_pc='+tokens.sales+'; __Host-mb_pc='+tokens.sales}]){
  const r=await call(rule,'POST',{},h);assert.equal(r.status,403);assert.match(r.headers['cache-control'],/no-store/);
 }
});
test('7-B06 production route absent, GET and traversal rejected',async()=>{
 assert.equal((await call('/api/v1/matching','POST',{})).status,404);
 assert.equal((await call(match,'GET',null)).status,405);
 assert.equal((await call('/__ci__/f05-7/../../api/v1','POST',{})).status,400);
});
test('7-B07 native TLS evidence discloses no personal data or customer price',async()=>{
 const x=await call(match,'POST',{phone:'fake',wholesalePrice:1});denied(x);
 assert.deepEqual(Object.keys(x.body),['code']);
 for(const p of ['customerid','wholesale','token','vin','phone','password','price'])
  assert.equal(JSON.stringify(x.body).toLowerCase().includes(p),false);
 await mkdir(new URL('../artifacts/https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/https/real-tls-prod-issuer-denial.json',import.meta.url),
  JSON.stringify({version:await verify(db),issuer:'CI_SYNTHETIC_MATCHING_INPUTS_NOT_PRODUCTION',
   productionRuleIssuer:false,productionMatchingHttp200:0,sevenGenuineTLSDenials:true},null,2)+'\n');
});
