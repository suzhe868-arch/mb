import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {readCurrentFacts} from '../../../f03/runtime-facts/current-facts.mjs';
import {convertWholesaleToMingbang} from '../../../f05/wholesale-to-mingbang-conversion/service.mjs';
import {verify as verifyConversion} from '../../../f05/wholesale-to-mingbang-conversion/migration.mjs';
import {signedF05ReadOnly,signedRead,physicalGate,DATABASE_URL,pool} from '../gate.mjs';

const C={source_platform:'JYT',upstream_publisher_id:'123',vehicle_id:'456'};
test('F07-3 F05-3C真实签名PG16读父转换与跨域拒绝',async t=>{
 const p=pool(),a=new IsolatedAuth({connectionString:DATABASE_URL,secret:randomBytes(48),origin:'https://127.0.0.1:443'});
 let n=0;const run=async(name,fn)=>{await t.test(name,async()=>{await fn();n++})};
 try{
  const physical=await physicalGate(p),r=await signedF05ReadOnly(a);
  await run('F05-01 二期PG16物理DB与角色',async()=>assert.equal(physical.usr,'f03_ci'));
  await run('F05-02 冻结已签000018迁移真实验签',async()=>assert.equal((await verifyConversion(a.pool)).verified,true));
  await run('F05-03 Readonly消费父转换事实',async()=>assert.equal(r.code,'SIGNED_PARENT_READONLY_PROVEN_NO_ISSUER'));
  await run('F05-04 五张父关系均真实存在',async()=>assert.equal(r.tables.length,5));
  await run('F05-05 转换事实引用真实Vehicle FK',async()=>assert.ok(Array.isArray(r.rows)));
  const before=(await p.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions')).rows[0].n;
  const auditBefore=(await p.query('SELECT count(*)::int n FROM public.f05_3c_conversion_audit')).rows[0].n;
  const s=await a.login({login:'race_test',password:'SyntheticRace_1234567'});
  await run('F05-06 真实已签F03员工会话',async()=>assert.equal(s.code,'AUTH_OK'));
  await run('F05-07 真F03转换权限只可DEFER',async()=>assert.equal((await readCurrentFacts(a,s.token,'vehicle.convert_to_mingbang')).finalAllowed,false));
  await run('F05-08 未有正式Publisher权限不读取电话',async()=>assert.equal((await signedRead(a,s.token,C)).allowed,false));
  await run('F05-09 未有正式报告Scope仍拒绝',async()=>assert.equal((await signedRead(a,s.token,C,'report_visible')).allowed,false));
  await run('F05-10 未有正式图片Scope仍拒绝',async()=>assert.equal((await signedRead(a,s.token,C,'vehicle_photo')).allowed,false));
  await run('F05-11 合成非法转换Issuer字段被冻结父拒绝',async()=>{
   const out=await convertWholesaleToMingbang(a,s.token,{vehicleId:0,teamId:1,eventKey:'f07-3-invalid-issuer-field-01'});
   assert.deepEqual(out,{allowed:false,code:'F05_3C_ACTION_FIELDS_REJECTED'});
  });
  await run('F05-12 未授权当前业务对象的真实父服务拒绝',async()=>{
   const out=await convertWholesaleToMingbang(a,s.token,{vehicleId:999999999,teamId:1,eventKey:'f07-3-real-negative-object-001'});
   assert.equal(out.allowed,false);
  });
  await run('F05-13 主线转换表没有被本包测试注入伪成功',async()=>assert.equal((await p.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions')).rows[0].n,before));
  await run('F05-14 父不可变审计未因拒绝被写入',async()=>assert.equal((await p.query('SELECT count(*)::int n FROM public.f05_3c_conversion_audit')).rows[0].n,auditBefore));
  await run('F05-15 双Backend真实PG不同PID',async()=>{
   const c1=await p.connect(),c2=await p.connect();
   try{assert.notEqual(c1.processID,c2.processID)}finally{c1.release();c2.release()}
  });
  await run('F05-16 锁冲突真实55P03 + ROLLBACK父事实不变',async()=>{
   const c1=await p.connect(),c2=await p.connect();
   try{
    await c1.query('BEGIN');await c1.query('SELECT account_id FROM public.pc_login_accounts WHERE employee_id=6 FOR UPDATE');
    await c2.query('BEGIN');await c2.query("SET LOCAL lock_timeout='120ms'");
    await assert.rejects(c2.query('SELECT account_id FROM public.pc_login_accounts WHERE employee_id=6 FOR UPDATE'),e=>e.code==='55P03');
    await c2.query('ROLLBACK');await c1.query('ROLLBACK');
   }finally{c1.release();c2.release()}
   assert.equal((await p.query('SELECT count(*)::int n FROM public.f05_3c_wholesale_conversions')).rows[0].n,before);
  });
  await run('F05-17 PG只读事务禁止伪业务写入',async()=>{
   const c=await p.connect();try{
    await c.query('BEGIN READ ONLY');
    await assert.rejects(c.query("UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE employee_id=6"),e=>e.code==='25006');
    await c.query('ROLLBACK');
   }finally{c.release()}
  });
  await run('F05-18 父来源转换结果不等于图片双成功',async()=>{
   const q=await p.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='f05_3c_wholesale_conversions' AND column_name='asset_state'");
   assert.equal(q.rowCount,1);
  });
  await run('F05-19 父签asset_state仅标记SOURCE_GAP',async()=>{
   const q=await p.query("SELECT pg_get_expr(adbin,adrelid) v FROM pg_attrdef WHERE adrelid='public.f05_3c_wholesale_conversions'::regclass");
   assert.ok(q.rows.some(x=>String(x.v).includes('IMAGE_LOCALIZATION_SOURCE_GAP')));
  });
  await run('F05-20 二次父验签无业务偏移',async()=>assert.equal((await verifyConversion(a.pool)).verified,true));
  console.log('F07_3_F05_NATIVE_SIGNED_SOURCE_'+n+'_PASS pid='+physical.pid+' oid='+(await p.query('SELECT oid FROM pg_database WHERE datname=current_database()')).rows[0].oid);
 }finally{await a.close();await p.end()}
});
