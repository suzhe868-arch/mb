import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {createJytSyncContractHandler} from '../ci-router.mjs';
import {issueCredential,setApiEnabled,revokeCredential} from '../contract.mjs';
const origin='https://127.0.0.1:48985',db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const ev=n=>'f05-3b-live-tls-independent-api-event-'+n;
const prefix='/__ci__/f05-3b/v1/vehicles/';
let server,admin,token,credentialId,vehicleId;
const signed=p=>({
 eventKey:ev(p),carCode:'JYT-HTTPS-EXAMPLE-007',brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state:'active'
});
async function call(route,method='GET',data=null,authToken=token,additional={}){
 const bytes=data===null?null:Buffer.from(JSON.stringify(data),'utf8');
 return new Promise((resolve,reject)=>{
  const headers={origin, ...(authToken?{authorization:'ApiKey '+authToken}:{}),
   ...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...additional};
  const q=request({hostname:'127.0.0.1',port:48985,path:route,method,rejectUnauthorized:false,headers},res=>{
   let raw='';res.on('data',x=>raw+=x);res.on('end',()=>{
    try{resolve({status:res.statusCode,body:JSON.parse(raw),headers:res.headers})}catch(e){reject(e)}
   });
  });q.on('error',reject);if(bytes)q.write(bytes);q.end();
 });
}
const denied=x=>{assert.equal(x.status,403,JSON.stringify(x));assert.match(x.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const a=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f05-3b-authenticated-governance'});
 assert.equal(a.code,'AUTH_OK',a.code);admin=a.token;
 const issued=await issueCredential(auth,admin,{eventKey:ev('system-admin-control-issue')});
 assert.equal(issued.allowed,true,JSON.stringify(issued));token=issued.token;credentialId=issued.credentialId;
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createJytSyncContractHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48985,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('B-B01 POST sync is denied before specifically enabled; never uses JYT upstream token as sync credential',async()=>{
 denied(await call(prefix+'sync','POST',signed('before-api-enabled')));
 denied(await call(prefix+'sync','POST',signed('jyt-token-refused'),'JYT_LOGIN_UPSTREAM_TOKEN'));
 denied(await call(prefix+'sync','POST',signed('missing-credential'),null));
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3b_sync_lineages')).rows[0].n,0);
});
test('B-B02 independent admin explicitly enables exactly three API actions',async()=>{
 for(const action of ['upsert','current','offline']){
  const a=await setApiEnabled(auth,admin,{action,enabled:true,eventKey:ev('control-enabled-'+action)});
  assert.equal(a.allowed,true);
 }
});
test('B-B03 valid loopback TLS integration API creates real wholesale Vehicle plus cycle, only safe wire fields',async()=>{
 const r=await call(prefix+'sync','POST',signed('first-https-upsert'));
 assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.code,'F05_3B_IMPORTED');
 vehicleId=r.body.vehicleId;assert.ok(vehicleId>0);assert.ok(r.body.listingCycleId>0);
 assert.deepEqual(Object.keys(r.body).sort(),['code','listingCycleId','vehicleId']);
 assert.equal(JSON.stringify(r.body).includes('vin'),false);
});
test('B-B04 current list GET is paginated, includes only source identity and safe current cycle fields',async()=>{
 const args='?afterVehicleId=0&limit=10&eventKey='+ev('safe-current-list');
 const r=await call(prefix+'current'+args);
 assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(r.body.code,'F05_3B_CURRENT_JYT');
 const own=r.body.items.find(v=>v.vehicleId===vehicleId);assert.ok(own);
 assert.deepEqual(Object.keys(own).sort(),['carCode','listingCycleId','vehicleId']);
 for(const forbidden of ['vin','phone','publisher_id','wholesalePrice','token','password','funds'])assert.equal(JSON.stringify(r.body).includes(forbidden),false);
 const tooBig=await call(prefix+'current?afterVehicleId=0&limit=999&eventKey='+ev('big-invalid'));
 denied(tooBig);
});
test('B-B05 actual bulk offline prevents any source vehicle remaining in current set; no local business deletion',async()=>{
 const off=await call(prefix+'offline','POST',{eventKey:ev('actual-https-offline'),carCodes:['JYT-HTTPS-EXAMPLE-007']});
 assert.equal(off.status,200,JSON.stringify(off));assert.equal(off.body.count,1);
 const query=await call(prefix+'current?afterVehicleId=0&limit=50&eventKey='+ev('after-offline-list'));
 assert.equal(query.status,200);assert.equal(query.body.items.some(v=>v.vehicleId===vehicleId),false);
 const d=(await db.query('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[vehicleId])).rows[0];
 assert.equal(d.source_sale_status,'offline');
});
test('B-B06 cookie, upstream token, forged scope, fake Origin and missing TLS host cannot authorize',async()=>{
 denied(await call(prefix+'sync','POST',signed('cookie-refuse'),null,{cookie:'__Host-mb_pc=fake'}));
 denied(await call(prefix+'sync','POST',signed('forged-owner'),token,{'x-owner':'1'}));
 denied(await call(prefix+'sync','POST',signed('forged-publisher'),token,{'x-publisher-id':'665283'}));
 denied(await call(prefix+'sync','POST',signed('forged-upstream'),token,{'x-jyt-token':'fake'}));
 denied(await call(prefix+'sync','POST',signed('forged-origin'),token,{origin:'https://attacker.invalid'}));
 denied(await call(prefix+'current?afterVehicleId=0&limit=5&eventKey='+ev('bearer-invalid'), 'GET',null,'Bearer hacked'));
});
test('B-B07 route/method traversal, oversize input and unsafe contract shape cannot open bypass',async()=>{
 assert.equal((await call(prefix+'wrong','GET')).status,404);
 assert.equal((await call(prefix+'sync','GET')).status,405);
 assert.equal((await call(prefix+'current','POST',signed('wrong-method'))).status,405);
 assert.equal((await call(prefix+'%2e%2e/current','GET')).status,400);
 assert.equal((await call(prefix+'sync?danger=1','POST',signed('wrong-query'))).status,400);
 assert.equal((await call(prefix+'sync','POST',{...signed('bad-body'),unexpected:'field'})).status,403);
});
test('B-B08 credential revocation is effective without restart or cached privileges, old secret cannot recover',async()=>{
 const rev=await revokeCredential(auth,admin,{credentialId,version:1,eventKey:ev('revoke-real-tls-credential')});
 assert.equal(rev.code,'F05_3B_CREDENTIAL_REVOKED');
 denied(await call(prefix+'current?afterVehicleId=0&limit=5&eventKey='+ev('revoked-access')));
 denied(await call(prefix+'sync','POST',signed('revoked-upsert')));
 await assert.rejects(()=>db.query('UPDATE public.f05_3b_sync_credentials SET revoked_at=NULL,version=version+1 WHERE credential_id=$1',[credentialId]),/F05_3B_CREDENTIAL_REVOCATION_IRREVERSIBLE/);
});


test('B-B09 actual HTTP successes and denied calls persist immutable sanitized counts without token or VIN',async()=>{
 const data=(await db.query("SELECT action,method,http_status,actor_kind,submitted_count,returned_count,processed_count,result_code FROM public.f05_3b_api_call_logs ORDER BY call_id")).rows;
 assert.ok(data.length>=12,'all accepted and rejected operations should be audited');
 assert.ok(data.some(x=>x.action==='upsert'&&x.http_status===403&&x.actor_kind==='SYSTEM'));
 assert.ok(data.some(x=>x.action==='current'&&x.http_status===200&&x.actor_kind==='INTEGRATION'));
 assert.ok(data.some(x=>x.action==='offline'&&x.http_status===200&&Number(x.processed_count)===1));
 const serialized=JSON.stringify(data);
 for(const blocked of [token,'__Host-mb_pc','SyntheticAdmin_1234567','VIN-TEST-SECRET'])
  assert.equal(serialized.includes(blocked),false);
 const rec=(await db.query('SELECT call_id FROM public.f05_3b_api_call_logs ORDER BY call_id LIMIT 1')).rows[0];
 await assert.rejects(()=>db.query('DELETE FROM public.f05_3b_api_call_logs WHERE call_id=$1',[rec.call_id]),/F05_3B_AUDIT_IMMUTABLE/);
});
