// A02：已签CI隔离环境、数据库物理身份、危险操作零写入验证。
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {pool,gateCI,assertCIEnv,bootstrap,reset,seed,employeePhone,collectorCallback} from '../contract.mjs';
const inventory=async()=>(await pool.query(`SELECT
 (SELECT count(*)::int FROM pg_tables WHERE schemaname='f07_phone') t,
 (SELECT count(*)::int FROM f07_phone.employees) e,
 (SELECT count(*)::int FROM f07_phone.vehicles) v,
 (SELECT count(*)::int FROM f07_phone.audit) a`)).rows[0];
const probe=async(key,value,action=bootstrap)=>{
 const before=await inventory(),old=process.env[key];
 process.env[key]=value;
 try{await assert.rejects(action(),/F07_CI_GUARD_ENV|F07_CI_GUARD_RUN_ID/)}
 finally{if(old===undefined)delete process.env[key];else process.env[key]=old;}
 assert.deepEqual(await inventory(),before);
};
test('A02 非超级用户PG16 FailClosed 17项',async t=>{
 await reset();await seed();
 const matrix=[
 ['G01 非Push事件',()=>probe('GITHUB_EVENT_NAME','pull_request')],
 ['G02 错仓库',()=>probe('GITHUB_REPOSITORY','some/other')],
 ['G03 错分支',()=>probe('GITHUB_REF','refs/heads/main')],
 ['G04 非CI',()=>probe('CI','false')],
 ['G05 GitHub Actions关闭',()=>probe('GITHUB_ACTIONS','false')],
 ['G06 APP_ENV生产',()=>probe('APP_ENV','production')],
 ['G07 NODE_ENV生产',()=>probe('NODE_ENV','production')],
 ['G08 无官方Run编号',()=>probe('GITHUB_RUN_ID','bad')],
 ['G09 错误数据库名',()=>probe('DATABASE_URL','postgres://f07_ci:f07_only_ci_app_pass@127.0.0.1:5432/postgres')],
 ['G10 外网数据库拒绝',()=>probe('DATABASE_URL','postgres://f07_ci:f07_only_ci_app_pass@external.invalid:5432/f07_ci_db')],
 ['G11 禁止未授权TRUNCATE',()=>probe('GITHUB_EVENT_NAME','schedule',reset)],
 ['G12 禁止未授权fixture写入',()=>probe('GITHUB_REF','refs/heads/main',seed)],
 ['G13 禁止未授权敏感请求',()=>probe('GITHUB_REPOSITORY','x/y',()=>employeePhone({session:'s-sale',vehicle:'v1',action:'latest'}))],
 ['G14 禁止未授权回传',()=>probe('GITHUB_EVENT_NAME','workflow_dispatch',()=>collectorCallback('{}','0','0'.repeat(64)))],
 ['G15 静态环境断言',async()=>{assert.throws(()=>assertCIEnv({...process.env,GITHUB_REF:'refs/heads/main'}),/F07_CI_GUARD_ENV_GITHUB_REF/)}]
 ];
 for(const [name,fn] of matrix)await t.test(name,fn);
 await t.test('G16 真实PostgreSQL16超级用户物理身份拒绝',async()=>{
  const before=await inventory();
  const admin=new pg.Client({connectionString:'postgres://postgres:f07_only_ci_root_pass@127.0.0.1:5432/f07_ci_db'});
  await admin.connect();
  try{await assert.rejects(gateCI(admin),/F07_CI_GUARD_PHYSICAL_DB_IDENTITY/)}
  finally{await admin.end()}
  assert.deepEqual(await inventory(),before);
 });
 await t.test('G17 原非超级用户PG16物理身份允许',async()=>{
  const c=await pool.connect();try{assert.equal(await gateCI(c),true)}finally{c.release()}
 });
 console.log('F07_A02_REAL_PG16_ZERO_WRITE_GATE_17_PASS');
});
test.after(async()=>{await pool.end()});
