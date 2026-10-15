import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {DATABASE_URL} from '../gate.mjs';
import {createSecureGateServer} from '../server.mjs';

const req=(opts={})=>new Promise((resolve,reject)=>{
 const path=opts.path||'/__ci__/f07-3/phone';
 const headers={host:'127.0.0.1:49273','x-test-source':opts.source??'JYT','x-test-publisher':opts.publisher??'123','x-test-vehicle':opts.vehicle??'456','x-test-session':opts.session??'',...(opts.headers||{})};
 const r=https.request({hostname:'127.0.0.1',port:49273,path,method:opts.method||'GET',ca:readFileSync(process.env.F07_3_TLS_CERT),servername:'localhost',headers},res=>{
  let body='';res.on('data',c=>body+=c.toString());res.on('end',()=>resolve({status:res.statusCode,body,headers:res.headers}));
 });r.on('error',reject);r.end();
});
test('F07-3 真签会话回环TLS拒绝黑箱',async t=>{
 const a=new IsolatedAuth({connectionString:DATABASE_URL,secret:randomBytes(48),origin:'https://127.0.0.1:443'});
 let server,n=0;
 try{
  const s=await a.login({login:'race_test',password:'SyntheticRace_1234567'});
  assert.equal(s.code,'AUTH_OK');
  server=await createSecureGateServer(a);
  await new Promise(resolve=>server.listen(49273,'127.0.0.1',resolve));
  const cases=[
   ['H01 电话受控',{} ,403],
   ['H02 图片', {path:'/__ci__/f07-3/image'},403],
   ['H03 报告',{path:'/__ci__/f07-3/report'},403],
   ['H04 敏感原件',{path:'/__ci__/f07-3/original'},403],
   ['H05 无会话',{session:''},403],
   ['H06 错Publisher',{publisher:'999'},403],
   ['H07 错源',{source:'MB'},403],
   ['H08 错Vehicle',{vehicle:'0'},403],
   ['H09 查询串',{path:'/__ci__/f07-3/phone?cached=1'},400],
   ['H10 URL编码',{path:'/__ci__/f07-3/%2e%2e/phone'},400],
   ['H11 不接受POST',{method:'POST'},405],
   ['H12 Host不正确',{headers:{host:'other.invalid'}},403],
   ['H13 禁止转发头',{headers:{forwarded:'for=10.1.2.3'}},403],
   ['H14 不接受Authorization',{headers:{authorization:'unused'}},403],
   ['H15 分享路由不存在',{path:'/share/vehicle/456'},404]
  ];
  for(const [name,params,status] of cases)await t.test(name,async()=>{
   const v=await req({session:s.token,...params});
   assert.equal(v.status,status);assert.equal(JSON.parse(v.body).code,'DENIED');
   assert.equal(v.headers['set-cookie'],undefined);assert.match(v.headers['cache-control'],/no-store/);
   n++;
  });
  await a.pool.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE employee_id=6');
  for(const path of ['/__ci__/f07-3/phone','/__ci__/f07-3/report'])
   await t.test('H16-17 撤权后当前拒绝 '+path,async()=>{
    const v=await req({path,session:s.token});
    assert.equal(v.status,403);n++;
   });
  console.log('F07_3_HTTPS_'+n+'_SIGNED_REAL_PG16_TLS_DENY_PASS');
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  await a.close();
 }
});
