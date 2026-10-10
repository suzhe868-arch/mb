import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer,request} from 'node:https';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {createCoverageConsumerHandler,F04_4_CONSUMER_ACTION_COUNT} from '../consumer-router.mjs';
import {loadIncremental} from '../coverage-verify.mjs';
const origin='https://127.0.0.1:48983',secret=randomBytes(32),db=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
let server,staff,admin,four;
const cookie=t=>({cookie:'__Host-mb_pc='+t});
async function call(method,path,headers={},body){
 return new Promise((resolve,reject)=>{
  let req=request({hostname:'127.0.0.1',port:48983,path,method,rejectUnauthorized:false,headers:{origin,...headers,...(body?{'content-length':Buffer.byteLength(body),'content-type':'application/json'}:{})}},res=>{
   let t='';res.on('data',d=>t+=d);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(t),headers:res.headers})}catch(e){reject(e)}});
  });req.on('error',reject);req.end(body);
 });
}
test.before(async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 // The old F04-3 frozen TLS regression has already changed this synthetic password on its own isolated PG16 DB.
 let x=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f04-4-worker'});assert.equal(x.code,'AUTH_OK');staff=x.token;
 x=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f04-4-admin'});assert.equal(x.code,'AUTH_OK');admin=x.token;
 x=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f04-4-four-s'});assert.equal(x.code,'AUTH_OK');four=x.token;
 await db.query("UPDATE public.customers SET owner_assignment_state='assigned',current_owner_employee_id=1 WHERE customer_id=302");
 server=createServer({key:readFileSync('/tmp/f04-3-ci-key.pem'),cert:readFileSync('/tmp/f04-3-ci-cert.pem')},await createCoverageConsumerHandler(auth));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(48983,'127.0.0.1',resolve)});
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await db.query("UPDATE public.customers SET owner_assignment_state='unassigned',current_owner_employee_id=NULL WHERE customer_id=302");
 await auth.close();await db.end();secret.fill(0);
});
const candidate=loadIncremental().actions;
test('F04-4-B01 8 new safe contracts and sealed real independent PG16',async()=>{assert.equal(F04_4_CONSUMER_ACTION_COUNT,8);assert.equal((await verifyM94(db)).verified,true)});
test('F04-4-B02 only proven F04-1 CustomerId exact scope can 200',async()=>{let r=await call('GET','/__ci__/current/v1/objects/customers/302/proof',cookie(staff));assert.equal(r.status,200,JSON.stringify(r));assert.deepEqual(r.body,{code:'F04_CUSTOMER_CURRENT_OWNER',customerId:302,objectScope:'CURRENT_OWNER_ONLY',disposable:true})});
test('F04-4-B03 all 8 new actions are not fake-200 or fake domain mutation',async()=>{
 const before=(await db.query("SELECT count(*)::int n FROM public.vehicles")).rows[0].n;
 for(const a of candidate){const tok=a.actor==='SYSTEM_ADMIN'?admin:staff;const h={...cookie(tok),'x-csrf-token':auth.csrfFor(tok),'x-request-key':'F04_4_CI_valid_key_00001'};
  const x=await call(a.method,a.path,h);assert.notEqual(x.status,200,a.intent);assert.ok([403,501].includes(x.status),JSON.stringify(x));
  assert.ok(!/vin|phone|price|password|token|merchant/.test(JSON.stringify(x.body)));
 }
 assert.equal((await db.query("SELECT count(*)::int n FROM public.vehicles")).rows[0].n,before);
});
test('F04-4-B04 4S and SystemAdmin cannot inherit unrelated employee business scope',async()=>{
 for(const a of candidate){let x=await call(a.method,a.path,{...cookie(four),'x-csrf-token':auth.csrfFor(four),'x-request-key':'F04_4_CI_valid_key_00002'});assert.equal(x.status,403,a.intent);
 if(a.actor!=='SYSTEM_ADMIN'){let y=await call(a.method,a.path,{...cookie(admin),'x-csrf-token':auth.csrfFor(admin),'x-request-key':'F04_4_CI_valid_key_00003'});assert.equal(y.status,403,a.intent)}
 }
 let a=candidate.find(x=>x.actor==='SYSTEM_ADMIN');let r=await call(a.method,a.path,{...cookie(staff),'x-csrf-token':auth.csrfFor(staff),'x-request-key':'F04_4_CI_valid_key_00004'});assert.equal(r.status,403);
});
test('F04-4-B05 no cookie/header spoof grants Customer, fake VIP or 4S merchant',async()=>{
 let a=candidate[0];for(const h of [{},{authorization:'Bearer fake'},{cookie:'__Host-mb_pc=invalid'},{cookie:'__Host-mb_pc='+staff+'; __Host-mb_pc='+staff}, {...cookie(staff),'x-future-customer-auth-not-implemented':'yes'}]){
  let x=await call(a.method,a.path,h);assert.equal(x.status,403,JSON.stringify(x));
 }
});
test('F04-4-B06 CSRF, idempotency, body injection and export/query guarded',async()=>{
 let a=candidate[0],valid={...cookie(staff),'x-csrf-token':auth.csrfFor(staff),'x-request-key':'F04_4_CI_valid_key_00005'};
 assert.equal((await call(a.method,a.path,cookie(staff))).status,403);
 assert.equal((await call(a.method,a.path,{...valid,'x-csrf-token':'bogus'})).status,403);
 assert.equal((await call(a.method,a.path,{...valid,'x-request-key':'x'})).status,403);
 assert.equal((await call(a.method,a.path,valid,'{"vin":"PRIVATE"}')).status,400);
 assert.equal((await call(a.method,a.path+'?view=export',valid)).status,403);
});
test('F04-4-B07 unknown, old Collector and malicious URI cannot become Current',async()=>{
 let a=candidate[0];
 assert.equal((await call('GET',a.path,cookie(staff))).status,405);
 assert.equal((await call('GET','/__ci__/current/v1/coverage/unknown',cookie(staff))).status,404);
 assert.equal((await call('GET','/admin/integrations/collector/connection',cookie(staff))).status,404);
 assert.equal((await call('GET','/__ci__/current/v1/coverage/%2e%2e%2f'+a.intent,cookie(staff))).status,400);
});
test('F04-4-B08 live current owner drift revokes only accepted minimal scope',async()=>{
 await db.query("UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=302");
 try{assert.equal((await call('GET','/__ci__/current/v1/objects/customers/302/proof',cookie(staff))).status,403)}
 finally{await db.query("UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=302")}
});
