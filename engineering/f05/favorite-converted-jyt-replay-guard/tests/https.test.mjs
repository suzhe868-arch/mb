import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../favorite-physical-carrier/migration.mjs';
import {issueCredential,setApiEnabled} from '../../jyt-wholesale-lineage-cycle/contract.mjs';
import {syntheticFavoriteChange} from '../../favorite-physical-carrier/service.mjs';
import {createKJytHandler,createKConversionHandler} from '../ci-router.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48987'});
const ev=n=>'f05-3k-real-https-converted-source-'+n;
const car='JYTF05C-UNSCOPED',customer=899997;
const prefixJ='/__ci__/f05-3k/jyt/v1/vehicles/';
const prefixC=id=>'/__ci__/f05-3k/employee/v1/vehicles/'+id+'/convert-mingbang';
const dto=(name,year=2026)=>({eventKey:ev(name),carCode:car,brandId:97001,seriesId:97002,modelId:97003,modelYear:year,state:'active'});
const sha=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
const rows=(sql,p=[])=>db.query(sql,p).then(r=>r.rows);
const cookie=t=>({cookie:'__Host-mb_pc='+t,'x-csrf-token':auth.csrfFor(t)});
let admin,employee,four,key,vid,cycle,serverJ,serverC,preFavorite,preEvents,post;
const stable=async()=>{
 const tables=['vehicles','vehicle_listing_cycles','f05_3b_sync_lineages','f05_3c_wholesale_conversions',
  'f05_3g_customer_favorites','f05_3g_favorite_events','locks','recommendations','customer_price_cycle_unlocks',
  'customer_price_unlock_events','transactions','vehicle_images','vehicle_visibility_grants','vehicle_price_history'];
 const result={};
 for(const table of tables){
  const x=await rows('SELECT row_to_json(t) v FROM public.'+table+' t WHERE vehicle_id=$1 ORDER BY to_jsonb(t)::text',[vid]);
  result[table]={rows:x.length,sha256:sha(x)};
 }
 return result;
};
async function call(port,path,method='POST',data=null,headers={}){
 const bytes=data===null?null:Buffer.from(JSON.stringify(data));
 const origin='https://127.0.0.1:'+port;
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port,path,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...headers}},
   res=>{let buf='';res.on('data',s=>buf+=s);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(buf),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
const j=(p,m='POST',body=null,heads={})=>call(48985,p,m,body,heads);
const c=(p,m='POST',body=null,heads={})=>call(48987,p,m,body,heads);
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [login,password,kind] of [['admin_test','SyntheticAdmin_1234567','admin'],['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],['four_s_test','SyntheticFourS_123456','four']]){
  const s=await auth.login({login,password,source:'f05-3k-real-https-session'});assert.equal(s.code,'AUTH_OK');
  if(kind==='admin')admin=s.token;else if(kind==='employee')employee=s.token;else four=s.token;
 }
 const issued=await issueCredential(auth,admin,{eventKey:ev('admin-issued-trusted-jyt-key')});assert.equal(issued.allowed,true);key=issued.token;
 for(const action of ['upsert','offline','current'])assert.equal((await setApiEnabled(auth,admin,{action,enabled:true,eventKey:ev('switch-'+action)})).allowed,true);
 const line=(await rows("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages WHERE source_platform='JYT' AND car_code=$1",[car]))[0];
 assert.ok(line,'real original trusted v17 imported Vehicle required');
 vid=Number(line.vehicle_id);cycle=Number(line.current_cycle_id);
 const ssl={key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')};
 serverJ=createServer(ssl,await createKJytHandler(auth));
 serverC=createServer(ssl,await createKConversionHandler(auth));
 await new Promise((ok,bad)=>{serverJ.once('error',bad);serverJ.listen(48985,'127.0.0.1',ok)});
 await new Promise((ok,bad)=>{serverC.once('error',bad);serverC.listen(48987,'127.0.0.1',ok)});
});
test.after(async()=>{
 for(const server of [serverJ,serverC])if(server)await new Promise(ok=>server.close(ok));
 await auth.close();await db.end();secret.fill(0);
});
test('K-B01 separate original contract endpoints refuse anonymous, Admin-as-Employee and Employee-as-JYT',async()=>{
 const p=await j(prefixJ+'sync','POST',dto('anonymous'),{});assert.equal(p.status,403);
 const adminAsEmployee=await c(prefixC(vid),'POST',{vehicleId:vid,teamId:901,eventKey:ev('admin-denied')},cookie(admin));
 assert.equal(adminAsEmployee.status,403);
 assert.equal((await j(prefixJ+'sync','POST',dto('employee-cookie'),cookie(employee))).status,403);
 assert.equal((await c(prefixC(vid),'POST',{vehicleId:vid,teamId:901,eventKey:ev('four-denied')},cookie(four))).status,403);
});
test('K-B02 authentic PG16 v19 JYT service proves original identity, commits Favorite before conversion',async()=>{
 const imported=await j(prefixJ+'sync','POST',dto('old-wholesale-source-v19'),{authorization:'ApiKey '+key});
 assert.equal(imported.status,200,JSON.stringify(imported));
 assert.equal(imported.body.vehicleId,vid);assert.equal(imported.body.listingCycleId,cycle);
 assert.equal((await rows("SELECT source_type FROM public.vehicles WHERE vehicle_id=$1",[vid]))[0].source_type,'wholesale');
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',1)",[customer]);
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(899998,$1,$2,$3,'f05-3k-ci-previous-period')",[customer,vid,cycle]);
 const fav=await syntheticFavoriteChange(db,{customerId:customer,vehicleId:vid,action:'ADD',eventKey:ev('favorite-committed-before-https-conversion')});
 assert.equal(fav.code,'F05_3G_APPLIED');
 preFavorite=sha(await rows('SELECT row_to_json(t) v FROM public.f05_3g_customer_favorites t WHERE vehicle_id=$1',[vid]));
 preEvents=sha(await rows('SELECT row_to_json(t) v FROM public.f05_3g_favorite_events t WHERE vehicle_id=$1',[vid]));
 assert.equal((await rows('SELECT count(*)::int n FROM public.f05_3g_favorite_events WHERE vehicle_id=$1',[vid]))[0].n,1);
});
test('K-B03 genuine Employee cookie+CSRF and current Lock convert via ORIGINAL signed HTTPS service',async()=>{
 const restored=await db.query("UPDATE public.locks SET expires_at=now()+interval '2 hours' WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND lock_status='active' AND responsible_employee_id=1 RETURNING lock_id",[vid,cycle]);
 assert.equal(restored.rowCount,1);
 const res=await c(prefixC(vid),'POST',{vehicleId:vid,teamId:901,eventKey:ev('verified-employee-conversion')},cookie(employee));
 assert.equal(res.status,200,JSON.stringify(res));assert.equal(res.body.code,'F05_3C_CONVERTED_SAME_VEHICLE_CYCLE');
 assert.equal(res.body.vehicleId,vid);assert.equal(res.body.listingCycleId,cycle);
 assert.deepEqual((await rows('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0],
  {source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.equal(sha(await rows('SELECT row_to_json(t) v FROM public.f05_3g_customer_favorites t WHERE vehicle_id=$1',[vid])),preFavorite);
 assert.equal(sha(await rows('SELECT row_to_json(t) v FROM public.f05_3g_favorite_events t WHERE vehicle_id=$1',[vid])),preEvents);
 post=await stable();
 console.log('F05_3K_TLS_REAL_EMPLOYEE_CONVERTED_V19_FAVORITE_PRESERVED');
});
test('K-B04 original JYT HTTPS API suppresses converted old carCode and preserves all immutable business rows',async()=>{
 for(const [event,year] of [['replayed-old-active',2026],['replayed-conflicting-model',2022]]){
  const out=await j(prefixJ+'sync','POST',dto(event,year),{authorization:'ApiKey '+key});
  assert.equal(out.status,403,JSON.stringify(out));assert.equal(out.body.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
  assert.deepEqual(await stable(),post);
 }
 const offline=await j(prefixJ+'offline','POST',{carCodes:[car],eventKey:ev('converted-offline-attempt')},{authorization:'ApiKey '+key});
 assert.equal(offline.status,200,JSON.stringify(offline));assert.equal(offline.body.count,0);
 const current=await j(prefixJ+'current?afterVehicleId=0&limit=50&eventKey='+ev('current-no-revived-wholesale'),'GET',null,{authorization:'ApiKey '+key});
 assert.equal(current.status,200,JSON.stringify(current));assert.equal(current.body.items.some(x=>x.vehicleId===vid),false);
 assert.deepEqual(await stable(),post);
 console.log('F05_3K_TLS_ORIGINAL_JYT_OLD_CODE_REPLAY_SUPPRESSED');
});
test('K-B05 repeated JYT event and signed Employee conversion idempotence cannot duplicate Vehicle/Cycle',async()=>{
 const retry=await j(prefixJ+'sync','POST',dto('replayed-old-active'),{authorization:'ApiKey '+key});
 assert.equal(retry.status,403);assert.equal(retry.body.code,'F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
 const conversion=await c(prefixC(vid),'POST',{vehicleId:vid,teamId:901,eventKey:ev('verified-employee-conversion')},cookie(employee));
 assert.equal(conversion.status,200);assert.equal(conversion.body.code,'F05_3C_SAME_EVENT_ALREADY_CONVERTED');
 assert.deepEqual(await stable(),post);
 assert.equal((await rows('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid]))[0].n,1);
});
test('K-B06 loopback TLS reject cross-Origin, no CSRF, forged publisher, duplicate Cookie, wrong URL and unsafe method',async()=>{
 const payload={vehicleId:vid,teamId:901,eventKey:ev('attack-must-not-convert')};
 for(const h of [
  {cookie:'__Host-mb_pc='+employee},
  {...cookie(employee),origin:'https://attacker.invalid'},
  {...cookie(employee),'x-owner':'1'},
  {cookie:'__Host-mb_pc='+employee+'; __Host-mb_pc='+employee,'x-csrf-token':auth.csrfFor(employee)},
  {authorization:'ApiKey '+key}
 ]){
  const res=await c(prefixC(vid),'POST',payload,h);assert.equal(res.status,403,JSON.stringify(res));
 }
 assert.equal((await c(prefixC(vid),'GET',null,cookie(employee))).status,405);
 assert.equal((await j('/v1/vehicles/sync','POST',dto('forbidden-production'),{authorization:'ApiKey '+key})).status,404);
 assert.equal((await c('/__ci__/f05-3k/employee/v1/vehicles/1/other','POST',payload,cookie(employee))).status,404);
 assert.deepEqual(await stable(),post);
});
test('K-B07 final HTTPS response excludes VIN/private price/phone/credentials and records immutable hashes',async()=>{
 const response=await j(prefixJ+'current?afterVehicleId=0&limit=50&eventKey='+ev('safe-read-final'),'GET',null,{authorization:'ApiKey '+key});
 assert.equal(response.status,200);
 const serialized=JSON.stringify(response.body);
 for(const forbidden of ['vin','wholesalePrice','phone','publisherId','customerId','password','credential','session'])
  assert.equal(serialized.includes(forbidden),false);
 assert.deepEqual(await stable(),post);
 await mkdir(new URL('../artifacts/https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/https/verified-converted-replay-snapshots.json',import.meta.url),
  JSON.stringify({customerFavoriteBeforeSha256:preFavorite,customerHistoryBeforeSha256:preEvents,
   afterConversion:post,afterAllJytReplay:await stable(),sameVehicleId:true,sameCycleId:true,
   conversionOriginalHttps:true,sourceContractOriginalHttps:true,oldJytCodeSuppressed:true,hiddenNotRestored:true,
   onlySyntheticCustomerNoRealWechatSession:true},null,2)+'\n');
 console.log('F05_3K_NATIVE_TLS_MULTI_SERVICE_END_TO_END_PASS');
});
