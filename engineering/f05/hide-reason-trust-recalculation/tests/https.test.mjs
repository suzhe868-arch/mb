import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect} from '../../wholesale-to-mingbang-conversion/migration.mjs';
import {createHideReasonCIHandler} from '../ci-router.mjs';
const origin='https://127.0.0.1:48987',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let vid,cycle,server,employee,admin,four;
const ev=x=>'f05-3e-https-real-hidden-audit-'+x;
const path=()=>'/__ci__/f05-3e/v1/vehicles/'+vid+'/recalculate-visibility';
const dto=()=>({eventKey:ev('converted-car-hide-no-trusted-cause'),vehicleId:vid,teamId:901});
const cookie=x=>({cookie:'__Host-mb_pc='+x,'x-csrf-token':auth.csrfFor(x)});
const forbidden=res=>{
 assert.equal(res.status,403,JSON.stringify(res));
 assert.deepEqual(res.body,{code:'F05_3E_HIDE_REASON_NOT_ATTESTED'});
 assert.match(res.headers['cache-control']||'',/no-store/);
};
async function call(uri=path(),method='POST',payload=dto(),headers={}){
 const bytes=payload===null?null:Buffer.from(JSON.stringify(payload));
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'127.0.0.1',port:48987,path:uri,method,rejectUnauthorized:false,
   headers:{origin,...(bytes?{'content-type':'application/json','content-length':String(bytes.length)}:{}),...headers}},
   res=>{let text='';res.on('data',v=>text+=v);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(text),headers:res.headers})}catch(e){reject(e)}})});
  req.on('error',reject);if(bytes)req.write(bytes);req.end();
 });
}
test.before(async()=>{
 const s=(await db.query("SELECT vehicle_id,current_cycle_id FROM public.f05_3b_sync_lineages "+
  "WHERE source_platform='JYT' AND car_code='JYT-F05C-LOOPBACK-015'")).rows[0];
 assert.ok(s);vid=Number(s.vehicle_id);cycle=Number(s.current_cycle_id);
 for(const [name,password,type] of [
  ['employee_test','SyntheticF04_3_CurrentProof_2026','employee'],
  ['admin_test','SyntheticAdmin_1234567','admin'],
  ['four_s_test','SyntheticFourS_123456','four']]){
  const login=await auth.login({login:name,password,source:'f05-3e-ci-only-real-https'});
  assert.equal(login.code,'AUTH_OK');if(type==='employee')employee=login.token;
  if(type==='admin')admin=login.token;if(type==='four')four=login.token;
 }
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createHideReasonCIHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48987,'127.0.0.1',resolve)});
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await auth.close();await db.end();secret.fill(0)});
test('E-B01 real eligible Employee still forbidden to unhide converted vehicle with unknown manual cause',async()=>{
 forbidden(await call(path(),'POST',dto(),cookie(employee)));
});
test('E-B02 valid SystemAdmin, 4S, anonymous and integration credential cannot forge hide Admin authorization',async()=>{
 forbidden(await call());
 forbidden(await call(path(),'POST',dto(),cookie(admin)));
 forbidden(await call(path(),'POST',dto(),cookie(four)));
 forbidden(await call(path(),'POST',dto(),{authorization:'ApiKey '+'mbci_'+'a'.repeat(43)}));
});
test('E-B03 missing/wrong CSRF and external origin cannot alter business visibility',async()=>{
 forbidden(await call(path(),'POST',dto(),{cookie:'__Host-mb_pc='+employee}));
 forbidden(await call(path(),'POST',dto(),{...cookie(employee),'x-csrf-token':'forged'}));
 forbidden(await call(path(),'POST',dto(),{...cookie(employee),origin:'https://attacker.invalid'}));
});
test('E-B04 spoof publisher, reason and owner headers, extra body fields all fail closed',async()=>{
 forbidden(await call(path(),'POST',dto(),{...cookie(employee),'x-publisher-id':'665283'}));
 forbidden(await call(path(),'POST',dto(),{...cookie(employee),'x-owner':'1'}));
 forbidden(await call(path(),'POST',dto(),{...cookie(employee),'x-hide-reason':'none'}));
 forbidden(await call(path(),'POST',{...dto(),manualHideRemoved:true},cookie(employee)));
});
test('E-B05 scope-less Team/Vehicle and path confusion cannot be used to unhide',async()=>{
 forbidden(await call(path(),'POST',{...dto(),teamId:9999},cookie(employee)));
 assert.equal((await call(path(),'POST',{...dto(),vehicleId:vid+1},cookie(employee))).status,400);
 assert.equal((await call(path()+'?forceVisible=true','POST',dto(),cookie(employee))).status,404);
});
test('E-B06 CI-only exact path, no production route or sensitive list/export endpoints',async()=>{
 assert.equal((await call(path(),'GET',null,cookie(employee))).status,405);
 assert.equal((await call('/v1/vehicles/'+vid+'/recalculate-visibility','POST',dto(),cookie(employee))).status,404);
 for(const suffix of ['list','export','print','history','unhide']){
  const result=await call(path().replace('recalculate-visibility',suffix),'POST',dto(),cookie(employee));
  assert.equal(result.status,404);
 }
});
test('E-B07 original signed conversion history, current cycle and hidden state remain unchanged',async()=>{
 const v=(await db.query('SELECT source_type,source_sale_status,platform_visibility FROM public.vehicles WHERE vehicle_id=$1',[vid])).rows[0];
 assert.deepEqual(v,{source_type:'mingbang',source_sale_status:'available',platform_visibility:'hidden'});
 assert.equal((await db.query('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vid])).rows[0].n,1);
 assert.equal((await db.query('SELECT current_cycle_id FROM public.f05_3b_sync_lineages WHERE vehicle_id=$1',[vid])).rows[0].current_cycle_id,String(cycle));
 assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions WHERE vehicle_id=$1',[vid])).rows[0].n,1);
});
