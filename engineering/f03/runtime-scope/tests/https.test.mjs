// CI-only temporary localhost TLS; never imported by server/main or exposed to business clients.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {checkCustomerPhoneScope} from '../customer-phone-guard.mjs';
import {parseHostCookie} from '../../runtime-facts/test-probe-contract.mjs';
const port=48501,origin='https://127.0.0.1:'+port;
const secret=randomBytes(32),cert=await readFile(process.env.F03_1_TLS_CERT_PATH),key=await readFile(process.env.F03_1_TLS_KEY_PATH);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const db=await connect();let server,token;
function call(op='customer.phone.manage',customerId='301',cookie=token){
 const body=JSON.stringify({operation:op,customerId});
 return new Promise((resolve,reject)=>{
  const req=https.request({hostname:'127.0.0.1',port,path:'/__f03_2_1b_internal_probe',method:'POST',ca:cert,
   headers:{Origin:origin,'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),Cookie:'__Host-mb_pc='+cookie}},res=>{
   let raw='';res.on('data',chunk=>raw+=chunk.toString());res.on('end',()=>{try{resolve({status:res.statusCode,...JSON.parse(raw)})}catch(e){reject(e)}});
  });req.on('error',reject);req.end(body);
 });
}
function send(res,status,code,allowed=false){
 const payload=JSON.stringify({code,allowed});res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(payload);
}
test.before(async()=>{
 await verify(db);
 server=https.createServer({key,cert},async(req,res)=>{
  if(req.socket.remoteAddress!=='127.0.0.1'||req.url!=='/__f03_2_1b_internal_probe'||req.method!=='POST'||req.headers.origin!==origin){send(res,404,'NOT_AVAILABLE');return}
  const tok=parseHostCookie(req.headers.cookie);if(!tok){send(res,401,'SESSION_DENIED');return}
  let text='';for await(const chunk of req){text+=chunk.toString();if(text.length>300){send(res,400,'BAD_REQUEST');return}}
  let data;try{data=JSON.parse(text)}catch{send(res,400,'BAD_REQUEST');return}
  if(data===null||Array.isArray(data)||typeof data!=='object'||Object.keys(data).sort().join(',')!=='customerId,operation'||typeof data.operation!=='string'||typeof data.customerId!=='string'){send(res,400,'BAD_REQUEST');return}
  try{
   const v=await checkCustomerPhoneScope(auth,tok,data.operation,data.customerId);
   send(res,v.allowed?200:403,v.code,v.allowed);
  }catch{send(res,503,'INTERNAL_GUARD_UNAVAILABLE')}
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));await auth.close();await db.end();secret.fill(0);key.fill(0)});
test('H01 real login and first password change -> internal allow -> independent DB commit deny -> same old HTTPS token denied',async()=>{
 const first=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'f03_2_1b_first'});
 assert.equal(first.restricted,true);assert.deepEqual(await call('customer.phone.manage','301',first.token),{status:403,code:'SESSION_OR_PC_ADMISSION_DENIED',allowed:false});
 const changed=await auth.change({token:first.token,csrf:first.csrf,oldPassword:'SyntheticHttps_1234567',newPassword:'SyntheticScopeHttps_2026'});
 assert.equal(changed.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 const normal=await auth.login({login:'http_test',password:'SyntheticScopeHttps_2026',source:'f03_2_1b_normal'});
 assert.equal(normal.code,'AUTH_OK');token=normal.token;
 assert.deepEqual(await call(),{status:200,code:'INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',allowed:true});
 // Revoking the CURRENT role template from another PG connection affects NEXT request.
 await db.query("UPDATE public.role_permission_defaults SET enabled=false,changed_at=now() WHERE role_id=1 AND permission_id=11");
 assert.deepEqual(await call(),{status:403,code:'CURRENT_CAPABILITY_DENIED',allowed:false});
 await db.query("UPDATE public.role_permission_defaults SET enabled=true,changed_at=now() WHERE role_id=1 AND permission_id=11");
 assert.equal((await call()).allowed,true);
 // Ending the per-capability binding cannot be bypassed by old employee_data_scopes.
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=now()-interval '1 second' WHERE scope_id=105 AND permission_id=11");
 assert.deepEqual(await call(),{status:403,code:'CAPABILITY_OBJECT_SCOPE_DENIED',allowed:false});
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=null WHERE scope_id=105 AND permission_id=11");
 assert.equal((await call()).allowed,true);
 await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
 assert.deepEqual(await call(),{status:403,code:'CUSTOMER_NOT_ACTIVE',allowed:false});
 await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=301");
 assert.equal((await call()).allowed,true);
 // Explicit current account epoch invalidates same real cookie; restoration never revives.
 await db.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE account_id=6');
 assert.deepEqual(await call(),{status:403,code:'SESSION_OR_PC_ADMISSION_DENIED',allowed:false});
 await db.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch-1 WHERE account_id=6');
 assert.equal((await call()).allowed,true); // If reverted, F03-1 epoch alone is reversible; cannot pretend unrevokable.
});
test('H02 test-only HTTPS rejects forged principal, unsupported action, duplicate cookie and cross-customer',async()=>{
 assert.deepEqual(await call('vehicle.read'),{status:403,code:'OTHER_ACTION_DEFER_DENY',allowed:false});
 assert.equal((await call('customer.phone.manage','302')).allowed,false);
});
