import {test} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {sessionDigest} from '../../src/f03-auth-crypto.mjs';
const port=48331,origin='https://127.0.0.1:'+port,cert=await readFile(process.env.F03_1_TLS_CERT_PATH);
function request(path,{method='POST',data={},cookie=null,csrf=null,sendOrigin=true,contentType='application/json'}={}){
 return new Promise((resolve,reject)=>{
  const payload=JSON.stringify(data);
  const headers={'Content-Type':contentType};
  if(method!=='GET')headers['Content-Length']=Buffer.byteLength(payload);
  if(sendOrigin)headers.Origin=origin;
  if(cookie)headers.Cookie=cookie;
  if(csrf)headers['X-CSRF-Token']=csrf;
  const req=https.request({hostname:'127.0.0.1',port,path,method,ca:cert,headers},res=>{
   let s='';res.on('data',x=>s+=x.toString());res.on('end',()=>{
    try{resolve({status:res.statusCode,body:JSON.parse(s),headers:res.headers})}catch(e){reject(e)}
   });
  });
  req.on('error',reject);req.end(method==='GET'?'':payload);
 });
}
let server;
test.before(async()=>{
 server=spawn(process.execPath,['dist/server.mjs'],{
  cwd:new URL('../../',import.meta.url),
  env:{...process.env,API_HOST:'127.0.0.1',API_PORT:String(port),
   F03_1_ENABLE_ISOLATED_AUTH:'I_AUTHORIZE_F03_1_AUTH_IN_NEW_TEST_PG16',F03_1_TRUSTED_ORIGIN:origin},
  stdio:'ignore'
 });
 let alive=false;
 for(let i=0;i<50;i++){
  if(server.exitCode!==null)throw Error('F03_1_SINGLE_SERVICE_DIED');
  try{const v=await request('/api/v1/health/live',{method:'GET'});if(v.status===200){alive=true;break}}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.equal(alive,true,'single server not ready');
});
test.after(()=>{if(server&&!server.killed)server.kill('SIGTERM')});
test('TLS health/default 404, POST-only and trusted Origin guard',async()=>{
 assert.equal((await request('/api/v1/health/live',{method:'GET'})).status,200);
 assert.equal((await request('/api/v1/no-business',{method:'GET'})).status,404);
 assert.equal((await request('/api/v1/auth/login',{method:'GET'})).status,405);
 assert.equal((await request('/api/v1/auth/login',{sendOrigin:false,data:{login:'http_test',password:'SyntheticHttps_1234567'}})).status,403);
 assert.equal((await request('/api/v1/auth/admin',{data:{governanceApproved:true}})).status,404);
 console.log('F03-1 HTTPS ROUTING AND ORIGIN PASS');
});
test('real HTTPS initial restricted login, CSRF, password change, cookie clearing, logout',async()=>{
 const invalid=await request('/api/v1/auth/login',{data:{login:'nonexistent_http',password:'SyntheticHttps_1234567'}});
 assert.deepEqual([invalid.status,invalid.body.code],[401,'AUTH_FAILED']);
 const first=await request('/api/v1/auth/login',{data:{login:'  HTTP_TEST ',password:'SyntheticHttps_1234567'}});
 assert.equal(first.status,200);assert.equal(first.body.restricted,true);
 const rawCookie=first.headers['set-cookie']?.[0]||'';
 assert.ok(rawCookie.startsWith('__Host-mb_pc='));
 for(const v of ['Secure','HttpOnly','Path=/','SameSite=Lax'])assert.ok(rawCookie.includes(v));
 assert.equal(/;\s*Domain=/i.test(rawCookie),false);
 const cookie=rawCookie.split(';')[0];
 const mixedCookie='tracking=test; '+cookie+'; display=dark';
 assert.ok(typeof first.body.csrf==='string'&&first.body.csrf.length>20);
 const bad=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_34567'},cookie:mixedCookie,csrf:'not-valid'});
 assert.equal(bad.status,401);
 const duplicateChange=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_34567'},cookie:cookie+'; '+cookie,csrf:first.body.csrf});
 assert.equal(duplicateChange.status,400,'duplicate same-name Cookie must reject');
 const change=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_34567'},cookie:mixedCookie,csrf:first.body.csrf});
 assert.equal(change.status,200);
 assert.equal(change.body.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 assert.ok((change.headers['set-cookie']?.[0]||'').includes('Max-Age=0'));
 const replay=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_45678'},cookie,csrf:first.body.csrf});
 assert.equal(replay.status,401);
 const old=await request('/api/v1/auth/login',{data:{login:'http_test',password:'SyntheticHttps_1234567'}});
 assert.equal(old.status,401);
 const now=await request('/api/v1/auth/login',{data:{login:'http_test',password:'NewSyntheticHttps_34567'}});
 assert.equal(now.status,200);assert.equal(now.body.restricted,false);
 const currentCookie=(now.headers['set-cookie']||[''])[0].split(';')[0];
 const mixedCurrent='analytics=fixture; '+currentCookie+'; mode=synthetic';
 const duplicateLogout=await request('/api/v1/auth/logout',{cookie:currentCookie+'; '+currentCookie,csrf:now.body.csrf});
 assert.equal(duplicateLogout.status,400);
 const noCsrf=await request('/api/v1/auth/logout',{cookie:mixedCurrent});
 assert.equal(noCsrf.status,403,'valid session logout requires CSRF, even when clearing cookie');
 const out=await request('/api/v1/auth/logout',{cookie:mixedCurrent,csrf:now.body.csrf});
 assert.equal(out.status,200);
 assert.ok((out.headers['set-cookie']?.[0]||'').includes('Max-Age=0'));
 const replay=await request('/api/v1/auth/password',{data:{oldPassword:'NewSyntheticHttps_34567',newPassword:'NotAllowedSynthetic_8777'},cookie:mixedCurrent,csrf:now.body.csrf});
 assert.equal(replay.status,401,'after logout real old session must be invalid');
 const c=new pg.Client({connectionString:process.env.F03_1_DATABASE_URL});await c.connect();
 try{
  const key=Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64');
  const token=currentCookie.slice('__Host-mb_pc='.length);
  const row=(await c.query('SELECT revoked_at FROM public.pc_auth_sessions WHERE token_digest=$1',[sessionDigest(token,key)])).rows[0];
  assert.ok(row?.revoked_at,'PostgreSQL row must be revoked by mixed-Cookie logout');
  key.fill(0);
 }finally{await c.end()}
 console.log('F03-1 HTTPS MIXED/REPEATED COOKIE, REAL PG REVOCATION AND REPLAY DENIAL PASS');
});

test('health readiness and auth routes fail closed during PG structure drift and recover',async()=>{
 const c=new pg.Client({connectionString:process.env.F03_1_DATABASE_URL});await c.connect();
 try{
  assert.equal((await request('/api/v1/health/ready',{method:'GET'})).status,200);
  await c.query('CREATE VIEW public.f03_http_rogue AS SELECT 1 AS illegal');
  try{
   assert.equal((await request('/api/v1/health/live',{method:'GET'})).status,200);
   assert.equal((await request('/api/v1/health/ready',{method:'GET'})).status,503);
   assert.equal((await request('/api/v1/auth/login',{data:{login:'admin_test',password:'SyntheticAdmin_1234567'}})).status,503);
  }finally{await c.query('DROP VIEW public.f03_http_rogue')}
  assert.equal((await request('/api/v1/health/ready',{method:'GET'})).status,200);
  const resumed=await request('/api/v1/auth/login',{data:{login:'admin_test',password:'SyntheticAdmin_1234567'}});
  assert.equal(resumed.status,200);
  const cookie=(resumed.headers['set-cookie']||[''])[0].split(';')[0];
  assert.equal((await request('/api/v1/auth/logout',{cookie,csrf:resumed.body.csrf})).status,200);
 }finally{await c.end()}
 console.log('F03-1 LIVE DB STRUCTURE GUARD FAIL CLOSED AND RESTORED PASS');
});
