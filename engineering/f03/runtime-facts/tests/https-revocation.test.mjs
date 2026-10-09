// Real ephemeral HTTPS probe, never imported by engineering/src/server.mjs.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../../f03-1/migration.mjs';
import {readCurrentFacts} from '../current-facts.mjs';
import {parseHostCookie,validateProbe} from '../test-probe-contract.mjs';

const port=48492,origin='https://127.0.0.1:'+port;
const key=await readFile(process.env.F03_1_TLS_KEY_PATH),cert=await readFile(process.env.F03_1_TLS_CERT_PATH);
const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const db=await connect();let server;
const json=(res,status,code)=>{const body=JSON.stringify({code});res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Content-Length':Buffer.byteLength(body)});res.end(body)};
async function call(token,body,overrideCookie){
 const payload=JSON.stringify(body);
 return new Promise((resolve,reject)=>{
  const headers={'Content-Type':'application/json',Origin:origin,'Content-Length':Buffer.byteLength(payload)};
  if(token||overrideCookie)headers.Cookie=overrideCookie??'__Host-mb_pc='+token;
  const req=https.request({hostname:'127.0.0.1',port,path:'/__f03_2_1a_probe',method:'POST',ca:cert,headers},res=>{
   let s='';res.on('data',chunk=>{s+=chunk;if(s.length>500)req.destroy(Error('TOO_LARGE'))});
   res.on('end',()=>{try{resolve({status:res.statusCode,...JSON.parse(s)})}catch(e){reject(e)}});
  });
  req.on('error',reject);req.end(payload);
 });
}
test.before(async()=>{
 await verify(db);
 server=https.createServer({key,cert},async(req,res)=>{
  if(req.socket.remoteAddress!=='127.0.0.1'||req.url!=='/__f03_2_1a_probe'||req.method!=='POST'||req.headers.origin!==origin){json(res,404,'PROBE_NOT_AVAILABLE');return}
  const cookie=parseHostCookie(req.headers.cookie);
  if(!cookie){json(res,401,'SESSION_OR_ADMISSION_DENIED');return}
  try{
   let body='';for await(const part of req){body+=part.toString();if(body.length>1000){json(res,400,'BAD_PROBE_INPUT');return}}
   let raw;try{raw=JSON.parse(body)}catch{json(res,400,'BAD_PROBE_INPUT');return}
   const parsed=validateProbe(raw);if(!parsed.valid){json(res,400,'BAD_PROBE_INPUT');return}
   const decision=await readCurrentFacts(auth,cookie,parsed.operation);
   json(res,403,decision.code); // Always DENY business; current facts are not an API grant.
  }catch{json(res,503,'GUARD_UNAVAILABLE')}
 });
 await new Promise((resolve,reject)=>server.listen(port,'127.0.0.1',e=>e?reject(e):resolve()));
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 await db.end();await auth.close();secret.fill(0);key.fill(0);
});
test('G10 real login -> true first-login password change -> normal HTTPS probe -> other PG connection revoke -> SAME old session denied',async()=>{
 const restricted=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'f03_2_https_first'});
 assert.equal(restricted.code,'AUTH_OK');assert.equal(restricted.restricted,true);
 assert.deepEqual(await call(restricted.token,{operation:'customer.phone.manage'}),{status:403,code:'SESSION_OR_ADMISSION_DENIED'});
 const change=await auth.change({token:restricted.token,csrf:restricted.csrf,oldPassword:'SyntheticHttps_1234567',newPassword:'SyntheticF032Https_2026'});
 assert.equal(change.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 const normal=await auth.login({login:'http_test',password:'SyntheticF032Https_2026',source:'f03_2_https_normal'});
 assert.equal(normal.code,'AUTH_OK');assert.equal(normal.restricted,false);
 const first=await call(normal.token,{operation:'customer.phone.manage'});
 assert.deepEqual(first,{status:403,code:'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER'});
 await db.query('BEGIN');
 try{
  await db.query("UPDATE public.role_permission_defaults SET enabled=false,changed_at=now() WHERE role_id=1 AND permission_id=11");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const removed=await call(normal.token,{operation:'customer.phone.manage'});
 assert.deepEqual(removed,{status:403,code:'NO_CURRENT_CAPABILITY'});
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,11,'allow',now())");
 assert.deepEqual(await call(normal.token,{operation:'customer.phone.manage'}),{status:403,code:'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER'});
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=5 AND permission_id=11");
 assert.deepEqual(await call(normal.token,{operation:'customer.phone.manage'}),{status:403,code:'CURRENT_PERSONAL_DENY'});
 await db.query("UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE account_id=6");
 assert.deepEqual(await call(normal.token,{operation:'customer.phone.manage'}),{status:403,code:'SESSION_OR_ADMISSION_DENIED'});
});
test('G11 HTTPS refuses forged identity, duplicate cookie, unknown operation and never returns facts or secrets',async()=>{
 const normal=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'f03_2_https_admin'});
 assert.equal(normal.code,'AUTH_OK');assert.equal(normal.restricted,false);
 const token=normal.token;
 assert.deepEqual(await call(token,{operation:'customer.crm.read'}),{status:403,code:'SYSTEM_ADMIN_NO_BUSINESS_RIGHT'});
 assert.deepEqual(await call(token,{operation:'system.employee.manage'}),{status:403,code:'SYSTEM_CONTROL_SCOPE_DEFER'});
 const bad=await call(token,{operation:'customer.crm.read',actor:{kind:'employee',role:'sales',global:true}});
 assert.deepEqual(bad,{status:400,code:'BAD_PROBE_INPUT'});
 const duplicate=await call(null,{operation:'customer.phone.manage'},'__Host-mb_pc='+token+'; __Host-mb_pc='+token);
 assert.deepEqual(duplicate,{status:401,code:'SESSION_OR_ADMISSION_DENIED'});
 assert.deepEqual(await call(token,{operation:'?;DROP TABLE system_admins'}),{status:403,code:'UNKNOWN_OR_RETIRED_OPERATION'});
});
test('G12 4S revoke through independent PG session denies old authenticated HTTPS PC probe',async()=>{
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(2,10,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()");
 const s=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'f03_2_https_4s'});
 assert.equal(s.code,'AUTH_OK');
 assert.equal((await call(s.token,{operation:'vehicle.read'})).code,'TECH_ALIAS_NOT_APPROVED');
 await db.query("DELETE FROM public.employee_permission_overrides WHERE employee_id=2 AND permission_id=10");
 assert.deepEqual(await call(s.token,{operation:'vehicle.read'}),{status:403,code:'SESSION_OR_ADMISSION_DENIED'});
});
