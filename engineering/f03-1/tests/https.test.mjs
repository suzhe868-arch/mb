import {test} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const port=48331,origin='https://127.0.0.1:'+port,cert=await readFile(process.env.F03_1_TLS_CERT_PATH);
function request(path,{method='POST',data={},cookie=null,csrf=null,sendOrigin=true,contentType='application/json'}={}){
 return new Promise((resolve,reject)=>{
  const payload=JSON.stringify(data);
  const headers={'Content-Type':contentType, 'Content-Length':Buffer.byteLength(payload)};
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
 assert.ok(typeof first.body.csrf==='string'&&first.body.csrf.length>20);
 const bad=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_34567'},cookie,csrf:'not-valid'});
 assert.equal(bad.status,401);
 const change=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_34567'},cookie,csrf:first.body.csrf});
 assert.equal(change.status,200);
 assert.equal(change.body.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 assert.ok((change.headers['set-cookie']?.[0]||'').includes('Max-Age=0'));
 const replay=await request('/api/v1/auth/password',{data:{oldPassword:'SyntheticHttps_1234567',newPassword:'NewSyntheticHttps_45678'},cookie,csrf:first.body.csrf});
 assert.equal(replay.status,401);
 const old=await request('/api/v1/auth/login',{data:{login:'http_test',password:'SyntheticHttps_1234567'}});
 assert.equal(old.status,401);
 const now=await request('/api/v1/auth/login',{data:{login:'http_test',password:'NewSyntheticHttps_34567'}});
 assert.equal(now.status,200);assert.equal(now.body.restricted,false);
 const out=await request('/api/v1/auth/logout',{cookie:(now.headers['set-cookie']||[''])[0].split(';')[0],csrf:now.body.csrf});
 assert.equal(out.status,200);
 assert.ok((out.headers['set-cookie']?.[0]||'').includes('Max-Age=0'));
 console.log('F03-1 LIVE HTTPS COOKIE, CSRF, FORCE-CHANGE, REVOKE, LOGOUT PASS');
});
