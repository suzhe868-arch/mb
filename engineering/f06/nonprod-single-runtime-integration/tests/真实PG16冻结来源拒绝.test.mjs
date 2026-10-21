import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import pg from 'pg';
import {createIsolatedF06CompositeRuntime,F06_COMPOSITE_CONSENT} from '../../../src/f06-nonprod-composite-runtime.mjs';
const dsn='postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test';
let pool;
before(()=>{pool=new pg.Pool({connectionString:dsn,max:2,connectionTimeoutMillis:2000})});
after(async()=>{if(pool)await pool.end()});
test('01 原生非超级用户PG16真实连接',async()=>{
 const r=(await pool.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver, (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,pg_backend_pid() pid")).rows[0];
 assert.equal(r.db,'f06_lock_test');assert.equal(r.usr,'f06_lock_ci');
 assert.ok(r.ver>=160000&&r.ver<170000);assert.equal(r.su,false);assert.equal(r.cdb,false);
 assert.ok(Number(r.pid)>0);console.log('F06_164_ACTUAL_PG16_BACKEND',{pid:r.pid,version:r.ver});
});
test('02 没有合法签名迁移不可误当24条父源',async()=>{
 const r=(await pool.query("SELECT to_regclass('public.f03_schema_migrations')::text x")).rows[0];
 assert.equal(r.x,null);
});
test('03 没有原生Lock签名侧车不能宣称Lock已部署',async()=>{
 const r=(await pool.query("SELECT to_regclass('f06_real_lock_test.lock_snapshots')::text x")).rows[0];
 assert.equal(r.x,null);
});
test('04 没有PR139签名交易侧车不能创建Tx',async()=>{
 const r=(await pool.query("SELECT to_regclass('f06_real_tx_ci.attestation')::text x")).rows[0];
 assert.equal(r.x,null);
});
test('05 无可信父Schema真实装配必须拒绝而非假启动',async()=>{
 const env={
  APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',CI:process.env.CI,
  GITHUB_ACTIONS:process.env.GITHUB_ACTIONS,GITHUB_EVENT_NAME:process.env.GITHUB_EVENT_NAME,
  GITHUB_REF:process.env.GITHUB_REF,GITHUB_SHA:process.env.GITHUB_SHA,GITHUB_RUN_ID:process.env.GITHUB_RUN_ID,
  F03_1_DATABASE_URL:dsn,F03_1_HMAC_KEY_BASE64:Buffer.alloc(32,1).toString('base64'),
  F06_COMPOSITE_TEST_CONSENT:F06_COMPOSITE_CONSENT,
  F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'
 };
 await assert.rejects(createIsolatedF06CompositeRuntime(env),/F06_COMPOSITE_SINGLE_SIGNED_PG16_DATABASE_REQUIRED/i);
});
test('06 测试中不创建任何公共资金表或生产Issuer',async()=>{
 const q=(await pool.query("SELECT to_regclass('public.deposit_receipts')::text d,to_regclass('public.refund_payments')::text p")).rows[0];
 assert.equal(q.d,null);assert.equal(q.p,null);
});
