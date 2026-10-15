import test from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {bootstrap,reset,seed,pool} from '../contract.mjs';
import {createServer} from '../server.mjs';
async function request(port,path,token='s-user'){
 return new Promise((resolve,reject)=>{
  https.get({hostname:'127.0.0.1',port,path,headers:{host:'127.0.0.1:'+port,'x-test-session':token},
   rejectUnauthorized:false,timeout:4000},res=>{
    const b=[];res.on('data',x=>b.push(x));res.on('end',()=>resolve({status:res.statusCode,body:Buffer.concat(b).toString(),headers:res.headers}));
  }).on('error',reject);
 });
}
test('F07-2 loopback HTTPS + 独立真PG16 20项黑箱安全用例',async t=>{
 await bootstrap();await reset();await seed();
 const app=await createServer();const get=(path,token)=>request(app.port,path,token);
 try{
  const cases=[
   ['H01 CDN首次MISS同次有可识别测试图',async()=>{const x=await get('/media/vehicle_photo/p1');assert.equal(x.status,200);assert.match(x.body,/TEST_IMAGE/);assert.equal(app.cdn.misses,1);}],
   ['H02 再次HIT不追加origin',async()=>{const n=app.cdn.originRequests;const x=await get('/media/vehicle_photo/p1');assert.equal(x.status,200);assert.equal(app.cdn.originRequests,n);assert(app.cdn.hits>0);}],
   ['H03 URL始终受控名邦图片域',async()=>{const x=await get('/media/vehicle_photo/p2');assert.match(x.headers['x-controlled-url'],/^https:\/\/img.mingbang.invalid\//);assert.doesNotMatch(JSON.stringify(x.headers),/reports\.jyt\.invalid/);}],
   ['H04 旧链接Session撤销须403',async()=>{await get('/media/vehicle_photo/p1');await pool.query("UPDATE f07_images.sessions SET active=false WHERE token='s-user'");assert.equal((await get('/media/vehicle_photo/p1')).status,403);}],
   ['H05 旧图权限撤回不能缓存越权',async()=>{await pool.query("UPDATE f07_images.sessions SET active=true,scope_vehicle='v2' WHERE token='s-user'");assert.equal((await get('/media/vehicle_photo/p1')).status,403);}],
   ['H06 Priority本人可看隐藏图',async()=>{assert.equal((await get('/media/vehicle_photo/ph','s-owner')).status,200);}],
   ['H07 Priority非本人不能看隐藏图',async()=>{assert.equal((await get('/media/vehicle_photo/ph','s-outsider')).status,403);}],
   ['H08 出险走独立报告域',async()=>{await pool.query("UPDATE f07_images.sessions SET scope_vehicle='v1' WHERE token='s-user'");const x=await get('/media/accident_report/r1');assert.equal(x.status,200);assert.match(x.headers['x-controlled-url'],/^https:\/\/report.mingbang.invalid\//);}],
   ['H09 不能用普通相册枚举出险',async()=>{assert.equal((await get('/media/vehicle_photo/r1')).status,403);}],
   ['H10 customer_visible变化旧报告拒绝',async()=>{await pool.query("UPDATE f07_images.pictures SET customer_visible=false WHERE id='r1'");assert.equal((await get('/media/accident_report/r1')).status,403);}],
   ['H11 维保H5使用名邦报告域',async()=>{const x=await get('/h5/h5');assert.equal(x.status,200);assert.match(x.body,/report\.mingbang\.invalid/);assert.doesNotMatch(x.body,/reports\.jyt\.invalid/);}],
   ['H12 敏感文件直接枚举拒绝',async()=>{assert.equal((await get('/media/sensitive_document/doc')).status,403);}],
   ['H13 编码穿越拒绝',async()=>{const x=await get('/media/vehicle_photo/%2e%2e%2fp1');assert.notEqual(x.status,200);}],
   ['H14 任意origin和Metadata SSRF无代理入口',async()=>{const x=await get('/proxy?origin=http://169.254.169.254/latest/meta-data');assert.notEqual(x.status,200);}],
   ['H15 旧分享安全字段白名单',async()=>{const x=await get('/share/p1');assert.equal(x.status,200);assert.deepEqual(Object.keys(JSON.parse(x.body)).sort(),['cta','image','model']);assert.doesNotMatch(x.body,/VIN|price|phone|wholesale/);}],
   ['H16 分享卡旧Session撤销重新403',async()=>{await pool.query("UPDATE f07_images.sessions SET denied=true WHERE token='s-user'");assert.equal((await get('/share/p1')).status,403);}],
   ['H17 visible且Priority独占非本人403',async()=>{await pool.query("UPDATE f07_images.vehicles SET priority_actor='user' WHERE id='v1'");await pool.query("UPDATE f07_images.sessions SET scope_vehicle='v1' WHERE token='s-outsider'");assert.equal((await get('/media/vehicle_photo/p1','s-outsider')).status,403);}],
   ['H18 visible且Priority独占本人仍可读',async()=>{await pool.query("UPDATE f07_images.sessions SET denied=false WHERE token='s-user'");assert.equal((await get('/media/vehicle_photo/p1','s-user')).status,200);}],
   ['H19 Priority撤销后旧URL需按新域即时允许',async()=>{await pool.query("UPDATE f07_images.vehicles SET priority_actor=NULL WHERE id='v1'");assert.equal((await get('/media/vehicle_photo/p1','s-outsider')).status,200);}],
   ['H20 H5报告customer_visible撤权旧URL即时403',async()=>{assert.equal((await get('/h5/h5','s-user')).status,200);await pool.query("UPDATE f07_images.pictures SET customer_visible=false WHERE id='h5'");assert.equal((await get('/h5/h5','s-user')).status,403);}]
  ];
  for(const [name,run] of cases)await t.test(name,run);
  console.log('F07_2_HTTPS_20_LOOPBACK_TLS_REAL_PG16_PASS');
 }finally{await app.close();await pool.end();}
});
