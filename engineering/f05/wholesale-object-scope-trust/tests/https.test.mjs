import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {createConversionCIHandler} from '../../wholesale-to-mingbang-conversion/ci-router.mjs';
import {catalogScopeSource,GAP} from '../audit.mjs';

const origin='https://127.0.0.1:48987',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const ev=s=>'f05-3d-https-no-general-jyt-source-'+s;
const cookie=x=>({cookie:'__Host-mb_pc='+x,'x-csrf-token':auth.csrfFor(x)});
let id,cy,employee,admin,four,server;
const url=()=>'/__ci__/f05-3c/v1/vehicles/'+id+'/convert-mingbang';
const payload=()=>({vehicleId:id,teamId:901,eventKey:ev('not-authorized-general-wholesale')});
const deny=r=>{
 assert.equal(r.status,403,JSON.stringify(r));
 assert.deepEqual(r.body,{code:'F05_3C_CONVERSION_SCOPE_UNPROVEN'});
 assert.match(r.headers['cache-control']||'',/no-store/);
};
function call(path,method='POST',body=payload(),headers={}){
 return new Promise((resolve,reject)=>{
  const bytes=body===null?null:Buffer.from(JSON.stringify(body));
  const req=request({hostname:'127.0.0.1',port:48987,path,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...headers}},
   response=>{
    let content='';response.on('data',b=>content+=b);
    response.on('end',()=>{try{resolve({status:response.statusCode,body:JSON.parse(content),headers:response.headers})}catch(e){reject(e)}});
   });
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
test.before(async()=>{
 const proof=await catalogScopeSource(db);assert.equal(proof.code,GAP);
 const signed=(await db.query("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages "+
  "WHERE source_platform='JYT' AND car_code='JYTF05C-UNSCOPED'")).rows[0];
 assert.ok(signed);id=Number(signed.vehicle_id);cy=Number(signed.current_cycle_id);
 for(const [name,password,kind] of [
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const res=await auth.login({login:name,password,source:'f05-3d-real-loopback-audit'});
  assert.equal(res.code,'AUTH_OK');if(kind==='admin')admin=res.token;
  if(kind==='employee')employee=res.token;if(kind==='four')four=res.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},
  await createConversionCIHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48987,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await auth.close();await db.end();secret.fill(0);
});
test('D-B01 anonymous and JYT credential cannot convert ordinary unowned wholesale',async()=>{
 deny(await call(url()));deny(await call(url(),'POST',payload(),{authorization:'ApiKey invalid'}));
});
test('D-B02 real Employee with vehicle.manage/read and Team without object scope remains HTTPS403',async()=>{
 deny(await call(url(),'POST',payload(),cookie(employee)));
});
test('D-B03 SystemAdmin and 4S valid sessions cannot borrow Employee permission',async()=>{
 deny(await call(url(),'POST',payload(),cookie(admin)));
 deny(await call(url(),'POST',payload(),cookie(four)));
});
test('D-B04 missing/bad CSRF and spoofed publisher/owner/source headers rejected',async()=>{
 deny(await call(url(),'POST',payload(),{cookie:'__Host-mb_pc='+employee}));
 deny(await call(url(),'POST',payload(),{...cookie(employee),'x-csrf-token':'bad'}));
 deny(await call(url(),'POST',payload(),{...cookie(employee),'x-publisher-id':'665283'}));
 deny(await call(url(),'POST',payload(),{...cookie(employee),'x-owner':'1'}));
});
test('D-B05 API cannot be tricked by broad Team, wrong identity or extended DTO',async()=>{
 deny(await call(url(),'POST',{...payload(),teamId:9999},cookie(employee)));
 deny(await call(url(),'POST',{...payload(),publisherId:665283},cookie(employee)));
 assert.equal((await call(url(),'POST',{...payload(),vehicleId:id+1},cookie(employee))).status,400);
});
test('D-B06 only the existing CI-only route exists; no production/public or sensitive read outlet',async()=>{
 assert.equal((await call(url(),'GET',null,cookie(employee))).status,405);
 assert.equal((await call(url()+'?owner=1','POST',payload(),cookie(employee))).status,404);
 for(const suffix of ['list','export','print','history']){
  const r=await call(url().replace('convert-mingbang',suffix),'POST',payload(),cookie(employee));
  assert.equal(r.status,404);
 }
});
test('D-B07 source denial preserves Vehicle, Cycle, JYT lineage and does not mint conversion receipt',async()=>{
 const v=(await db.query('SELECT source_type,source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[id])).rows[0];
 assert.deepEqual(v,{source_type:'wholesale',source_sale_status:'active'});
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[id])).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[id])).rows[0].n,0);
 assert.equal((await db.query('SELECT current_cycle_id FROM public.f05_3b_sync_lineages WHERE vehicle_id=$1',[id])).rows[0].current_cycle_id,String(cy));
});
