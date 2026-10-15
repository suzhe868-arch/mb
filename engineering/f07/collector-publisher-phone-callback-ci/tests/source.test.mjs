import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {bootstrap,reset,seed,pool,employeePhone,collectorCallback,callbackBody,sign,validateSignature} from '../contract.mjs';
const session='s-sale';
const a=(action='read',vehicle='v1',s=session)=>employeePhone({action,vehicle,session:s});
const call=async(request_id,extras={})=>{
 const body=callbackBody(request_id,extras), ts=String(Date.now());
 return collectorCallback(body,ts,sign(body,ts));
};
const count=async(table)=>Number((await pool.query('SELECT count(*) c FROM f07_phone.'+table)).rows[0].c);
const snapshot=async()=> (await pool.query(`SELECT md5(coalesce(string_agg(x::text,'|' ORDER BY x::text),'')) h FROM
 (SELECT row_to_json(c)::text x FROM f07_phone.cache c UNION ALL
 SELECT row_to_json(h)::text x FROM f07_phone.phone_history h UNION ALL
 SELECT row_to_json(a)::text x FROM f07_phone.audit a) t`)).rows[0].h;
const bootstrapCase=async()=>{await reset();await seed();};
test('F07-1 真PG16 Source业务合同',async t=>{
 await bootstrap();
 const cases=[
 ['S01 默认miss创建唯一任务',async()=>{const r=await a();assert.equal(r.status,'PHONE_UNAVAILABLE');assert.equal(r.created,true);assert.equal(await count('jobs'),1);}],
 ['S02 miss重复singleflight',async()=>{const x=await a(),y=await a();assert.equal(x.request_id,y.request_id);assert.equal(y.created,false);}],
 ['S03 latest重复并发singleflight',async()=>{const r=await Promise.all([a('latest'),a('latest'),a('latest')]);assert.equal(new Set(r.map(x=>x.request_id)).size,1);assert.equal(r.filter(x=>x.created).length,1);}],
 ['S04 回传建立缓存',async()=>{const r=await a();assert.equal((await call(r.request_id)).status,'UPDATED');assert.equal((await a()).phone,'TEST-123456');}],
 ['S05 同publisher多车共用当前缓存',async()=>{const r=await a();await call(r.request_id);assert.equal((await a('read','v2')).phone,'TEST-123456');}],
 ['S06 缓存命中不新建job',async()=>{await call((await a()).request_id);const n=await count('jobs');const r=await a();assert.equal(r.queued,false);assert.equal(await count('jobs'),n);}],
 ['S07 主动latest强制刷新',async()=>{await call((await a()).request_id);const r=await a('latest');assert.equal(r.queued,true);assert.equal(r.created,true);assert.equal(r.phone,'TEST-123456');}],
 ['S08 latest成功更新且保留history',async()=>{await call((await a()).request_id);const r=await a('latest');await call(r.request_id,{phone:'TEST-654321',issued_at:new Date(Date.now()+60000).toISOString()});assert.equal((await a()).phone,'TEST-654321');assert.equal(await count('phone_history'),2);}],
 ['S09 latest失败保留原号',async()=>{await call((await a()).request_id);const r=await a('latest');assert.equal((await call(r.request_id,{phone:null,status:'unavailable'})).status,'UNAVAILABLE');assert.equal((await a()).phone,'TEST-123456');assert.equal(await count('phone_history'),1);}],
 ['S10 无缓存失败仍不可用',async()=>{const r=await a();await call(r.request_id,{phone:null,status:'unavailable'});assert.equal((await a()).status,'PHONE_UNAVAILABLE');assert.equal(await count('cache'),0);}],
 ['S11 callback重复id幂等',async()=>{const r=await a();const body=callbackBody(r.request_id),ts=String(Date.now());const x=await collectorCallback(body,ts,sign(body,ts));const y=await collectorCallback(body,ts,sign(body,ts));assert.equal(x.status,'UPDATED');assert.equal(y.status,'DUPLICATE');assert.equal(await count('phone_history'),1);}],
 ['S12 同key异载荷拒绝',async()=>{const r=await a(),body=callbackBody(r.request_id),ts=String(Date.now());await collectorCallback(body,ts,sign(body,ts));const bad=callbackBody(r.request_id,{phone:'TEST-999999'});await assert.rejects(collectorCallback(bad,ts,sign(bad,ts)),{code:'IDEMPOTENCY_CONFLICT'});}],
 ['S13 NONCE跨请求重放拒绝',async()=>{const r=await a(),b=callbackBody(r.request_id),ts=String(Date.now());await collectorCallback(b,ts,sign(b,ts));const r2=await a('latest'),nonce=JSON.parse(b).nonce;const re=callbackBody(r2.request_id,{nonce});await assert.rejects(collectorCallback(re,ts,sign(re,ts)),{code:'NONCE_REPLAY'});}],
 ['S14 伪签名拒绝无写入',async()=>{const r=await a(),b=callbackBody(r.request_id);const old=await count('receipts');await assert.rejects(collectorCallback(b,String(Date.now()),'0'.repeat(64)),{code:'CALLBACK_SIGNATURE'});assert.equal(await count('receipts'),old);}],
 ['S15 时间窗口过期拒绝',async()=>{const b=callbackBody('abc'),ts=String(Date.now()-600000);assert.throws(()=>validateSignature(b,ts,sign(b,ts)),{code:'CALLBACK_EXPIRED'});}],
 ['S16 请求publisher替换拒绝',async()=>{const r=await a(),b=callbackBody(r.request_id,{upstream_publisher_id:'pub2'}),ts=String(Date.now());await assert.rejects(collectorCallback(b,ts,sign(b,ts)),{code:'REQUEST_PUBLISHER_MISMATCH'});}],
 ['S17 超前结束后无签新回传拒绝',async()=>{const r=await a();await call(r.request_id);const b=callbackBody('not-existing'),ts=String(Date.now());await assert.rejects(collectorCallback(b,ts,sign(b,ts)),{code:'REQUEST_PUBLISHER_MISMATCH'});}],
 ['S18 过期结果不倒灌当前',async()=>{await call((await a()).request_id,{issued_at:new Date(Date.now()+60000).toISOString()});const r=await a('latest');assert.equal((await call(r.request_id,{phone:'TEST-999999',issued_at:new Date(Date.now()-60000).toISOString()})).status,'STALE');assert.equal((await a()).phone,'TEST-123456');}],
 ['S19 不同publisher隔离',async()=>{await call((await a()).request_id);const r=await a('read','v3');await call(r.request_id,{upstream_publisher_id:'pub2',phone:'TEST-777777'});assert.equal((await a('read','v3')).phone,'TEST-777777');assert.equal((await a()).phone,'TEST-123456');}],
 ['S20 不同平台隔离',async()=>{await pool.query("INSERT INTO f07_phone.vehicle_scope VALUES('sale','other',true)");const r=await a('read','other');await call(r.request_id,{source_platform:'OTHER',phone:'TEST-888888'});assert.equal((await a('read','other')).phone,'TEST-888888');assert.equal((await a()).phone,null);}],
 ['S21 无敏感能力拒绝',async()=>{await assert.rejects(a('read','v1','s-no_cap'),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S22 个人DENY高于grant',async()=>{await assert.rejects(a('latest','v1','s-denied'),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S23 4S角色硬拒绝',async()=>{await assert.rejects(a('dial','v1','s-four_s'),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S24 SystemAdmin业务拒绝',async()=>{await assert.rejects(a('read','v1','s-admin'),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S25 非active员工拒绝',async()=>{await assert.rejects(a('read','v1','s-inactive'),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S26 旧会话版本拒绝',async()=>{await assert.rejects(a('read','v1','s-stale'),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S27 个人data scope拒绝',async()=>{await pool.query("UPDATE f07_phone.vehicle_scope SET active=false WHERE employee_id='sale' AND vehicle_id='v1'");await assert.rejects(a(),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S28 批发转名邦拒绝不删除缓存',async()=>{await call((await a()).request_id);await pool.query("UPDATE f07_phone.vehicles SET source_type='mingbang' WHERE id='v1'");await assert.rejects(a(),{code:'CURRENT_PERMISSION_DENIED'});assert.equal(await count('cache'),1);}],
 ['S29 4S/非listing/无publisher均拒绝',async()=>{for(const v of ['four','notlisted','nopublisher','own'])await assert.rejects(a('latest',v),{code:'CURRENT_PERMISSION_DENIED'});}],
 ['S30 批量撤权与旧请求返回无权限读',async()=>{const r=await a();await pool.query("UPDATE f07_phone.employees SET phone_capability=false WHERE id='sale'");await call(r.request_id);await assert.rejects(a(),{code:'CURRENT_PERMISSION_DENIED'});assert.equal(await count('cache'),1);}],
 ['S31 独立后台PID/事务可复查',async()=>{const x=await pool.connect(),y=await pool.connect();try{const px=(await x.query('SELECT pg_backend_pid() p,txid_current() tx')).rows[0],py=(await y.query('SELECT pg_backend_pid() p,txid_current() tx')).rows[0];assert.notEqual(px.p,py.p);console.log('F07_NATIVE_PG16_DISTINCT_BACKENDS',px.p,py.p,'tx',px.tx,py.tx);}finally{x.release();y.release();}}],
 ['S32 异常SQL回滚缓存history审计不变',async()=>{const r=await a();await call(r.request_id);const prev=await snapshot(),n=await count('cache');const c=await pool.connect();try{await c.query('BEGIN');await c.query("UPDATE f07_phone.cache SET phone='TEST-999999' WHERE publisher_id='pub1'");await assert.rejects(c.query("INSERT INTO f07_phone.cache VALUES('JYT','pub1','REAL-123','2026-10-15','fake')"));await c.query('ROLLBACK');}finally{c.release();}assert.equal(await snapshot(),prev);assert.equal(await count('cache'),n);}],
 ['S33 真实行锁等待与source_type COMMIT后拒绝',async()=>{const c=await pool.connect();try{await c.query('BEGIN');await c.query("UPDATE f07_phone.vehicles SET source_type='mingbang' WHERE id='v1'");let settled=false;const pending=a().finally(()=>{settled=true});await new Promise(r=>setTimeout(r,200));assert.equal(settled,false);await c.query('COMMIT');await assert.rejects(pending,{code:'CURRENT_PERMISSION_DENIED'});}finally{await c.query('ROLLBACK').catch(()=>{});c.release();}}],
 ['S34 latest与缓存共享源确保安全审计无号码',async()=>{const r=await a('latest');await call(r.request_id);const audit=(await pool.query('SELECT row_to_json(a)::text v FROM f07_phone.audit a')).rows.map(x=>x.v).join('|');assert.equal(audit.includes('TEST-123456'),false);}],
 ['S35 安全拨号只返回系统拨号器标识',async()=>{await call((await a()).request_id);assert.equal((await a('dial')).dialer,'SYSTEM_ONLY');}],
 ['S36 多worker不同publisher真实并发不串号',async()=>{const [x,y]=await Promise.all([a('latest','v1'),a('latest','v3')]);await Promise.all([call(x.request_id),call(y.request_id,{upstream_publisher_id:'pub2',phone:'TEST-777777'})]);assert.equal(await count('cache'),2);}]
 ];
 for(const [name,fn] of cases){
  await t.test(name,async()=>{await bootstrapCase();await fn();});
 }
 console.log('F07_SOURCE_36_BUSINESS_CASES_REAL_POSTGRES');
});
test.after(async()=>{await pool.end();});
