import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {createFavoriteCIHandler} from '../ci-router.mjs';
import {auditFavoriteCarrier,GAP} from '../audit.mjs';
const origin='https://127.0.0.1:48987',db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,vid,cycle,employee,admin,four;
const route=()=>'/__ci__/f05-3f/v1/vehicles/'+vid+'/favorite';
const cookie=tok=>({cookie:'__Host-mb_pc='+tok,'x-csrf-token':auth.csrfFor(tok)});
const denied=x=>{
 assert.equal(x.status,403,JSON.stringify(x));
 assert.deepEqual(x.body,{code:'F05_3F_FAVORITE_CARRIER_NOT_ATTESTED'});
 assert.match(x.headers['cache-control']||'',/no-store/);
};
function call(path=route(),method='GET',headers={}){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48987,path,method,rejectUnauthorized:false,
   headers:{origin,...headers}},res=>{
   let response='';res.on('data',b=>response+=b);
   res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(response),headers:res.headers})}catch(e){reject(e)}});
  });
  req.on('error',reject);req.end();
 });
}
test.before(async()=>{
 const a=await auditFavoriteCarrier(db);assert.equal(a.code,GAP);
 const x=(await db.query("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages "+
  "WHERE source_platform='JYT' AND car_code='JYT-F05C-LOOPBACK-015'")).rows[0];
 assert.ok(x);vid=Number(x.vehicle_id);cycle=Number(x.current_cycle_id);
 for(const [name,password,k] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const login=await auth.login({login:name,password,source:'f05-3f-real-loopback-favorite-audit'});
  assert.equal(login.code,'AUTH_OK');
  if(k==='employee')employee=login.token;if(k==='admin')admin=login.token;if(k==='four')four=login.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createFavoriteCIHandler(auth));
 await new Promise((ok,no)=>{server.once('error',no);server.listen(48987,'127.0.0.1',ok)});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await auth.close();await db.end();secret.fill(0)});
test('F-B01 no Cookie/anonymous and JYT credential can access or claim any Favorite',async()=>{
 denied(await call());denied(await call(route(),'GET',{authorization:'ApiKey invalid'}));
});
test('F-B02 actual Employee read rights cannot replace signed Customer favorite source',async()=>{
 denied(await call(route(),'GET',cookie(employee)));
 denied(await call(route(),'POST',cookie(employee)));
 denied(await call(route(),'DELETE',cookie(employee)));
});
test('F-B03 genuine SystemAdmin and 4S sessions cannot invent Customer Favorite ownership',async()=>{
 denied(await call(route(),'GET',cookie(admin)));
 denied(await call(route(),'GET',cookie(four)));
});
test('F-B04 missing/forged CSRF or wrong Origin cannot bypass missing carrier',async()=>{
 denied(await call(route(),'GET',{cookie:'__Host-mb_pc='+employee}));
 denied(await call(route(),'GET',{...cookie(employee),'x-csrf-token':'bad'}));
 denied(await call(route(),'GET',{...cookie(employee),origin:'https://attacker.invalid'}));
});
test('F-B05 owner/publisher/Customer impersonation headers denied and sensitive DTO never emitted',async()=>{
 denied(await call(route(),'GET',{...cookie(employee),'x-owner':'1'}));
 denied(await call(route(),'GET',{...cookie(employee),'x-publisher-id':'665283'}));
 denied(await call(route(),'GET',{...cookie(employee),'x-customer-id':'894001'}));
 const x=await call(route(),'GET',cookie(employee));
 for(const marker of ['VIN','phone','publisher','wholesalePrice','JYT-','customerId','carCode','assetUrl'])
  assert.equal(JSON.stringify(x.body).includes(marker),false);
});
test('F-B06 only isolated expected path responds; no /v1 live Favorite, export, cache, share or history bypass',async()=>{
 assert.equal((await call(route(),'PUT',cookie(employee))).status,405);
 assert.equal((await call('/v1/vehicles/'+vid+'/favorite','GET',cookie(employee))).status,404);
 assert.equal((await call(route()+'?force=true','GET',cookie(employee))).status,404);
 for(const end of ['export','cache','share','print','history']){
  assert.equal((await call(route().replace('/favorite','/'+end),'GET',cookie(employee))).status,404);
 }
});
test('F-B07 real converted Vehicle, current Cycle, JYT lineage and conversion receipt not changed by rejected Favorite actions',async()=>{
 const x=(await db.query('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0];
 assert.deepEqual(x,{source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid])).rows[0].n,1);
 assert.equal(Number((await db.query('SELECT current_cycle_id FROM public.f05_3b_sync_lineages WHERE vehicle_id=$1',[vid])).rows[0].current_cycle_id),cycle);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
