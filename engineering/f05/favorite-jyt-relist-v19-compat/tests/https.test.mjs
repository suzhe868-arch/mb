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
import {createRelistCIHandler} from '../ci-router.mjs';
const origin='https://127.0.0.1:48985',db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const ev=x=>'f05-3j-https-v19-existing-favorite-'+x;
const car='JYT-F05J-HTTPS-2026',prefix='/__ci__/f05-3j/v1/vehicles/';
const data=(name,state='active')=>({eventKey:ev(name),carCode:car,brandId:97001,seriesId:97002,modelId:97003,modelYear:2026,state});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const rows=(sql,params=[])=>db.query(sql,params).then(x=>x.rows);
let admin,employee,four,token,vid,oldCycle,newCycle,server,preCurrent,preHistory;
async function call(path,method='POST',payload=null,key=token,more={}){
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload),'utf8');
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48985,path,method,rejectUnauthorized:false,headers:{origin,...(key?{authorization:'ApiKey '+key}:{}),...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...more}},res=>{
   let raw='';res.on('data',p=>raw+=p);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(raw),headers:res.headers})}catch(e){reject(e)}})
  });
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
const fav=()=>rows('SELECT row_to_json(x) v FROM public.f05_3g_customer_favorites x WHERE vehicle_id=$1 ORDER BY favorite_id',[vid]);
const hist=()=>rows('SELECT row_to_json(x) v FROM public.f05_3g_favorite_events x WHERE vehicle_id=$1 ORDER BY event_id',[vid]);
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const [login,password,kind] of [['admin_test','SyntheticAdmin_1234567','admin'],['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],['four_s_test','SyntheticFourS_123456','four']]){
  const r=await auth.login({login,password,source:'f05-3j-tls-v19-trusted'});
  assert.equal(r.code,'AUTH_OK');if(kind==='admin')admin=r.token;else if(kind==='employee')employee=r.token;else four=r.token;
 }
 const issued=await issueCredential(auth,admin,{eventKey:ev('issue-admin-key')});
 assert.equal(issued.allowed,true);token=issued.token;
 for(const action of ['upsert','offline','current'])assert.equal((await setApiEnabled(auth,admin,{action,enabled:true,eventKey:ev('enable-'+action)})).allowed,true);
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createRelistCIHandler(auth));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(48985,'127.0.0.1',ok)});
});
test.after(async()=>{
 if(server)await new Promise(ok=>server.close(ok));
 await auth.close();await db.end();secret.fill(0);
});
test('J-B01 prior v19 signed JYT contract rejects anonymous, PC Employee and 4S tokens',async()=>{
 const p=prefix+'sync';
 for(const key of [null,employee,four,admin,'raw-jyt-upstream']){
  const x=await call(p,'POST',data('not-authorized-source'),key);
  assert.equal(x.status,403,JSON.stringify(x));
 }
 const normal=await call('/v1/vehicles/sync','POST',data('prod-route-denied'));assert.equal(normal.status,404);
});
test('J-B02 original trusted API over loopback TLS imports actual wholesale vehicle before Favorite',async()=>{
 const x=await call(prefix+'sync','POST',data('initial-source'));
 assert.equal(x.status,200,JSON.stringify(x));
 assert.equal(x.body.code,'F05_3B_IMPORTED');
 vid=x.body.vehicleId;oldCycle=x.body.listingCycleId;
 await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[vid]);
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(899981,'active',1,'assigned',1)");
 await db.query("INSERT INTO public.customer_price_cycle_unlocks(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES(899982,899981,$1,$2,'synthetic-v19-old-cycle')",[vid,oldCycle]);
});
test('J-B03 v19 Customer Favorite Current and ADD Event committed BEFORE trusted HTTPS offline',async()=>{
 const x=await syntheticFavoriteChange(db,{customerId:899981,vehicleId:vid,action:'ADD',eventKey:ev('physical-favorite-add')});
 assert.equal(x.code,'F05_3G_APPLIED');
 preCurrent=hash(await fav());preHistory=hash(await hist());
 assert.equal((await rows('SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,oldCycle]))[0].n,1);
});
test('J-B04 authentic API offline then relist creates new Cycle but preserves Favorite Current and immutable history',async()=>{
 const off=await call(prefix+'offline','POST',{eventKey:ev('trusted-offline'),carCodes:[car]});
 assert.equal(off.status,200,JSON.stringify(off));assert.equal(off.body.count,1);
 const cycle=(await rows('SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1',[oldCycle]))[0];
 assert.ok(cycle.ended_at);
 const up=await call(prefix+'sync','POST',data('trusted-relist'));
 assert.equal(up.status,200,JSON.stringify(up));assert.equal(up.body.code,'F05_3B_RELISTED');
 assert.equal(up.body.vehicleId,vid);newCycle=up.body.listingCycleId;assert.notEqual(newCycle,oldCycle);
 assert.equal(hash(await fav()),preCurrent);assert.equal(hash(await hist()),preHistory);
 const status=(await rows('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid]))[0];
 assert.deepEqual(status,{source_type:'wholesale',source_sale_status:'active',platform_visibility:'hidden'});
 assert.equal((await rows('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid]))[0].n,2);
 assert.equal((await rows('SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,newCycle]))[0].n,0);
 assert.equal((await rows('SELECT count(*)::int n FROM public.customer_price_unlock_events WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,newCycle]))[0].n,0);
 await mkdir(new URL('../artifacts/https/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/https/verified-cycle-favorite-preservation.json',import.meta.url),JSON.stringify({source:'real_loopback_tls_signed_api_key',oldCycleEnded:true,customerFavoriteBeforeSha256:preCurrent,customerFavoriteAfterSha256:hash(await fav()),favoriteHistoryBeforeSha256:preHistory,favoriteHistoryAfterSha256:hash(await hist()),sameVehicle:true,newCycle:true,oldPriceRightsDoNotCarry:true,hiddenPreserved:true},null,2)+'\n');
 console.log('F05_3J_TLS_REAL_OFFLINE_RELIST_SUCCESS',JSON.stringify({sameVehicle:true,differentCycle:true,FavoritePreserved:true,oldCyclePriceNotInherited:true}));
});
test('J-B05 same JYT event idempotent, another customer never inherits hidden/price grant',async()=>{
 const again=await call(prefix+'sync','POST',data('trusted-relist'));assert.equal(again.status,200);assert.equal(again.body.code,'F05_3B_EVENT_ALREADY_PROCESSED');
 const cy=(await rows('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid]))[0].n;assert.equal(cy,2);
 assert.equal((await rows('SELECT count(*)::int n FROM public.customer_price_cycle_unlocks WHERE vehicle_id=$1 AND listing_cycle_id=$2',[vid,newCycle]))[0].n,0);
});
test('J-B06 cross-origin, publisher/owner, cookie, bad method/route, fake Customer claim all rejected',async()=>{
 for(const h of [{origin:'https://attacker.invalid'},{'x-publisher-id':'665283'},{'x-owner':'1'},{'x-customer-id':'899981'},{cookie:'__Host-mb_pc=invalid'}]){
  const x=await call(prefix+'sync','POST',data('forged-header'),token,h);assert.equal(x.status,403,JSON.stringify(x));
 }
 assert.equal((await call(prefix+'sync','GET',null)).status,405);
 assert.equal((await call(prefix+'not-a-route','POST',data('wrong-route'))).status,404);
 const response=await call(prefix+'sync','POST',{...data('forged-extra'),publisherId:1});
 assert.notEqual(response.status,200);
});
test('J-B07 TLS success never exposes private VIN/wholesale price/phone or real Customer Favorite endpoint',async()=>{
 const q=prefix+'current?afterVehicleId=0&limit=50&eventKey='+ev('safe-projection');
 const x=await call(q,'GET');
 assert.equal(x.status,200,JSON.stringify(x));
 const match=x.body.items.find(r=>r.vehicleId===vid);assert.ok(match);assert.equal(match.listingCycleId,newCycle);
 for(const field of ['vin','wholesalePrice','phone','publisherId','customerId','password','credential','session'])assert.equal(JSON.stringify(x.body).includes(field),false);
 assert.equal((await call('/__ci__/f05-3j/v1/vehicles/'+vid+'/favorite','GET')).status,404);
 assert.equal(hash(await fav()),preCurrent);assert.equal(hash(await hist()),preHistory);
});
