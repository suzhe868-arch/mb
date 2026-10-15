import test from 'node:test';
import assert from 'node:assert/strict';
import {pool,assertCIEnv,physicalGate,bootstrap} from '../contract.mjs';
test('F07-2 八项环境/数据库零写入拒绝',async t=>{
 const original={...process.env};
 await bootstrap();const before=(await pool.query("SELECT count(*) n FROM f07_images.vehicles")).rows[0].n;
 const wrong=[
  ['repo',{GITHUB_REPOSITORY:'attacker/elsewhere'}],
  ['ref',{GITHUB_REF:'refs/heads/main'}],
  ['event',{GITHUB_EVENT_NAME:'pull_request'}],
  ['ci',{CI:'false'}],['actions',{GITHUB_ACTIONS:'false'}],
  ['dbname',{DATABASE_URL:'postgres://f07_image_ci:pass@127.0.0.1:5432/postgres'}],
  ['hostname',{DATABASE_URL:'postgres://f07_image_ci:pass@169.254.169.254:5432/f07_image_ci_db'}],
  ['runid',{GITHUB_RUN_ID:'invalid'}],['appenv',{APP_ENV:'production'}]
 ];
 for(const [name,mutation] of wrong)await t.test(name,async()=>{
  assert.throws(()=>assertCIEnv({...original,...mutation}),/F07_2_CI_/);
  const after=(await pool.query("SELECT count(*) n FROM f07_images.vehicles")).rows[0].n;
  assert.equal(after,before);
 });
 await t.test('真实PG16非特权角色不能SET ROLE postgres',async()=>{
  await assert.rejects(pool.query('SET ROLE postgres'),e=>e.code==='42501');
  assert.equal((await pool.query('SELECT current_user u')).rows[0].u,'f07_image_ci');
  assert.equal((await pool.query('SELECT count(*) n FROM f07_images.vehicles')).rows[0].n,before);
 });
 const client=await pool.connect();
 try{const x=await physicalGate(client);assert.equal(x.usr,'f07_image_ci');assert(x.ver>=160000&&x.ver<170000);assert.equal(x.su,false);console.log('F07_2_PHYSICAL_REAL_PG16_NON_SUPERUSER_ZERO_WRITE_9_PASS',x.pid);}
 finally{client.release();await pool.end();}
});
