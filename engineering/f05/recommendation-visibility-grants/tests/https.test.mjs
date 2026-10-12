import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {request,createServer} from 'node:https';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createRecommendationDenyRouter} from '../ci-router.mjs';
const db=await connect(),auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,
 secret:randomBytes(32),origin:'https://127.0.0.1:48989'});
const origin='https://127.0.0.1:48989';let server,token;
const endpoint=what=>'/__ci__/f05-9/v1/'+what;
async function call(path,method='POST',obj={},headers={}){
 const data=obj===null?null:Buffer.from(JSON.stringify(obj));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48989,path,method,rejectUnauthorized:false,
   headers:{origin,...(data?{'content-type':'application/json','content-length':data.length}:{}),...headers}},res=>{
    let s='';res.on('data',d=>s+=d);res.on('end',()=>resolve({status:res.statusCode,
     headers:res.headers,body:JSON.parse(s)}))});
  req.on('error',reject);if(data)req.write(data);req.end();
 });
}
const deny=r=>{assert.equal(r.status,403,JSON.stringify(r));assert.equal(r.body.code,
 'F05_9_PRODUCTION_RECOMMENDATION_ISSUER_NOT_WIRED');assert.deepEqual(Object.keys(r.body),['code']);
 assert.match(r.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f05-9-TLS'});
 assert.equal(login.code,'AUTH_OK');token=login.token;
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},
 createRecommendationDenyRouter());
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48989,'127.0.0.1',resolve)});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await auth.close();await db.end()});
test('9-H01 signed Employee cookie and valid CSRF cannot mint production Recommendation',async()=>{
 deny(await call(endpoint('recommendation'),'POST',{customerId:899612,vehicleId:1},
  {cookie:'__Host-mb_pc='+token,'x-csrf-token':auth.csrfFor(token)}));
});
test('9-H02 ordinary share cannot transfer grant, price right, Priority or Customer identity',async()=>{
 for(const kind of ['share','grant','price','recommendation'])deny(await call(endpoint(kind),'POST',
  {customerId:899612,ownerId:1,priorityId:1,shareOrigin:899613}));
});
test('9-H03 client self-claimed owner and fake WeChat data always denied',async()=>{
 for(const head of [{'x-wechat-openid':'fake'},{authorization:'Bearer forged'},
  {'x-recommendation-issuer':'true'},{origin:'https://attacker.invalid'}])
  deny(await call(endpoint('recommendation'),'POST',{customerId:899612},head));
});
test('9-H04 staff signed session and synthetic pricing cannot issue live wholesale free-right',async()=>{
 for(const payload of [{sourceType:'wholesale',freePrice:true},{priceCents:1,quotaFree:true},
   {vehicleId:1,hidden:true},{forceVisibility:true}])deny(await call(endpoint('price-right'),'POST',payload));
});
test('9-H05 share, favorite, Consultation and Lock routes do not become Recommendation Issuers',async()=>{
 for(const kind of ['favorite','consultation','lock','share']){
  deny(await call(endpoint(kind),'POST',{createRecommendation:true,customerId:899612}));
 }
});
test('9-H06 no production API Recommendation endpoints or unguarded public GET',async()=>{
 assert.equal((await call('/api/v1/recommendation','POST',{})).status,404);
 assert.equal((await call('/api/v1/share/recommendation','POST',{})).status,404);
 assert.equal((await call(endpoint('recommendation'),'GET',null)).status,405);
});
test('9-H07 TLS denial body has no Customer data, VIN, source phone, internal price or tokens',async()=>{
 const x=await call(endpoint('recommendation'),'POST',{vin:'sensitive',phone:'11111',token:'secret',price:100000});
 deny(x);
 for(const name of ['vin','phone','token','price','customer','source','jyt','priority'])
  assert.equal(JSON.stringify(x.body).toLowerCase().includes(name),false);
});
