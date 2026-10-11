import {test} from 'node:test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../favorite-physical-carrier/migration.mjs';
import {createConversionCIHandler} from '../ci-router.mjs';
import {syntheticFavoriteChange} from '../../favorite-physical-carrier/service.mjs';
import {createHash} from 'node:crypto';

const origin='https://127.0.0.1:48987',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const ev=x=>'f05-3i-https-real-employee-current-'+x;
const prefix=id=>'/__ci__/f05-3i/v1/vehicles/'+id+'/convert-mingbang';
const cookie=t=>({'cookie':'__Host-mb_pc='+t,'x-csrf-token':auth.csrfFor(t)});
let admin,employee,four,server,jyt,vid,cycle;
async function call(path,method='POST',payload={},headers={}){
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48987,path,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...headers}},
   res=>{let data='';res.on('data',b=>data+=b);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(data),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
const requestDto=()=>({eventKey:ev('authorized-locked-car'),teamId:901,vehicleId:vid});
const forbidden=res=>{assert.equal(res.status,403,JSON.stringify(res));assert.deepEqual(res.body,{code:'F05_3C_CONVERSION_SCOPE_UNPROVEN'});assert.match(res.headers['cache-control'],/no-store/)};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [login,password,kind] of [
  ['admin_test','SyntheticAdmin_1234567','admin'],['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const r=await auth.login({login,password,source:'f05-3i-loopback-real-https'});
  assert.equal(r.code,'AUTH_OK',login);if(kind==='admin')admin=r.token;else if(kind==='employee')employee=r.token;else four=r.token;
 }
 jyt='mbci_'+'a'.repeat(43);
 assert.match(jyt||'',/^mbci_[a-zA-Z0-9_-]{43}$/);
 const signed=(await db.query("SELECT l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l WHERE l.source_platform='JYT' AND l.car_code=$1",['JYT-F05C-LOOPBACK-015'])).rows[0];
 assert.ok(signed,'signed v17 source missing before v18');vid=Number(signed.vehicle_id);cycle=Number(signed.current_cycle_id);
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(896900,'active',1,'assigned',1)");
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES(896901,896900,$1,$2,'active',1,now()-interval '2 hours',now()+interval '2 hours')",[vid,cycle]);
 const favorited=await syntheticFavoriteChange(db,{customerId:896900,vehicleId:vid,action:'ADD',eventKey:'f05-3i-pre-existing-favorite-before-http-conversion'});
 assert.equal(favorited.code,'F05_3G_APPLIED');
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createConversionCIHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48987,'127.0.0.1',resolve)});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await auth.close();await db.end();secret.fill(0)});
test('I-B01 anonymous and JYT integration token lack Employee current scope',async()=>{
 forbidden(await call(prefix(vid),'POST',requestDto()));
 forbidden(await call(prefix(vid),'POST',requestDto(),{authorization:'ApiKey '+jyt}));
});
test('I-B02 SystemAdmin and 4S current Sessions cannot convert wholesale even with current token/CSRF',async()=>{
 forbidden(await call(prefix(vid),'POST',requestDto(),cookie(admin)));
 forbidden(await call(prefix(vid),'POST',requestDto(),cookie(four)));
});
test('I-B03 missing/corrupted CSRF, forged owner or publisher, source credential header cannot bypass',async()=>{
 forbidden(await call(prefix(vid),'POST',requestDto(),{'cookie':'__Host-mb_pc='+employee}));
 forbidden(await call(prefix(vid),'POST',requestDto(),{...cookie(employee),'x-csrf-token':'invalid'}));
 forbidden(await call(prefix(vid),'POST',requestDto(),{...cookie(employee),'x-publisher-id':'665283'}));
 forbidden(await call(prefix(vid),'POST',requestDto(),{...cookie(employee),'x-owner':'1'}));
 forbidden(await call(prefix(vid),'POST',requestDto(),{...cookie(employee),origin:'https://attacker.invalid'}));
});
test('I-B04 exactly one authenticated current Employee scope conversion HTTPS200, no sensitive DTO',async()=>{
 const pre=(await db.query('SELECT row_to_json(f) as row FROM public.f05_3g_customer_favorites f WHERE customer_id=896900 AND vehicle_id=$1',[vid])).rows[0].row;
 const historical=(await db.query('SELECT row_to_json(e) as row FROM public.f05_3g_favorite_events e WHERE customer_id=896900 AND vehicle_id=$1 ORDER BY event_id',[vid])).rows.map(x=>x.row);
 const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 const out=await call(prefix(vid),'POST',requestDto(),cookie(employee));
 assert.equal(out.status,200,JSON.stringify(out));
 assert.equal(out.body.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal(out.body.vehicleId,vid);assert.equal(out.body.listingCycleId,cycle);
 assert.equal(sha((await db.query('SELECT row_to_json(f) as row FROM public.f05_3g_customer_favorites f WHERE customer_id=896900 AND vehicle_id=$1',[vid])).rows[0].row),sha(pre));
 assert.equal(sha((await db.query('SELECT row_to_json(e) as row FROM public.f05_3g_favorite_events e WHERE customer_id=896900 AND vehicle_id=$1 ORDER BY event_id',[vid])).rows.map(x=>x.row)),sha(historical));
 await writeFile(new URL('../artifacts/https/verified-pre-post-hashes.json',import.meta.url),JSON.stringify({favoriteCurrentBeforeSha256:sha(pre),favoriteHistoryBeforeSha256:sha(historical),sameAfterConversion:true,order:'v19_Favorite_ADD_then_HTTPS_F05-3C_conversion'},null,2)+'\n');
 assert.equal(out.body.assetState,'IMAGE_LOCALIZATION_SOURCE_GAP');
 assert.deepEqual(Object.keys(out.body).sort(),['assetState','code','conversionId','listingCycleId','vehicleId','visibilityState']);
 for(const forbiddenField of ['VIN','phone','publisher','wholesalePrice','JYT-','token','customerId'])
  assert.equal(JSON.stringify(out.body).includes(forbiddenField),false);
});
test('I-B05 HTTPS idempotent repeat same event and no subsequent second conversion',async()=>{
 const r=await call(prefix(vid),'POST',requestDto(),cookie(employee));
 assert.equal(r.status,200);assert.equal(r.body.code,'F05_3C_SAME_EVENT_ALREADY_CONVERTED');
 forbidden(await call(prefix(vid),'POST',{...requestDto(),eventKey:ev('different-click-rejected')},cookie(employee)));
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
test('I-B06 method, path variants, query, body confusion and six sensitive business outlets denied',async()=>{
 assert.equal((await call(prefix(vid),'GET',null,cookie(employee))).status,405);
 assert.equal((await call(prefix(vid)+'?owner=1','POST',requestDto(),cookie(employee))).status,404);
 assert.equal((await call(prefix(vid),'POST',{...requestDto(),publisherId:665283},cookie(employee))).status,403);
 assert.equal((await call(prefix(vid),'POST',{...requestDto(),vehicleId:vid+1},cookie(employee))).status,400);
 assert.equal((await call(prefix(vid).replace('/convert-mingbang','/%2e%2e/convert-mingbang'),'POST',requestDto(),cookie(employee))).status,400);
 for(const outlet of ['list','export','copy','cache','print','history']){
  assert.equal((await call(prefix(vid).replace('/convert-mingbang','/'+outlet),'POST',requestDto(),cookie(employee))).status,404);
 }
});
test('I-B07 real TLS never registers ordinary production route nor exposes original JYT credential/asset location',async()=>{
 const v=(await db.query('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0];
 assert.equal(v.source_type,'mingbang');assert.equal(v.source_sale_status,'available');
 assert.equal(v.platform_visibility,'hidden','keep hidden until trusted source scope rules recalculate');
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
