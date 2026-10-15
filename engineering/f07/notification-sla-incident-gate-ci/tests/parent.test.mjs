// 独立PG16内，真实冻结F03签名Session的NEGATIVE_ONLY；不向通知写入真实能力。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {verifyAuthDatabase} from '../../../src/f03-auth-readiness.mjs';
import {readCurrentFacts} from '../../../f03/runtime-facts/current-facts.mjs';
import {assertCIEnv,physicalGate,parentConfigMutation,DSN} from '../gate.mjs';
test('F07-4 冻结F03真实登录、撤权和配置能力缺签负证',async t=>{
 assertCIEnv();
 const url='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
 assert.notEqual(url,DSN);
 const auth=new IsolatedAuth({connectionString:url,secret:randomBytes(48),origin:'https://127.0.0.1:49274'});
 let n=0;const check=async(name,fn)=>{await t.test(name,async()=>{await fn();n++;});};
 try{
  await check('P01 冻结F03真实独立物理PG16版本签名',async()=>{
   assert.equal(await verifyAuthDatabase(auth.pool),true);
   const v=(await auth.pool.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
   assert.equal(v.db,'f03_auth_test');assert.equal(v.usr,'f03_ci');assert.equal(v.su,false);assert.ok(v.ver>=160000&&v.ver<170000);
  });
  const session=await auth.login({login:'race_test',password:'SyntheticRace_1234567'});
  await check('P02 真冻结F03登录可得到已签Token',async()=>assert.equal(session.code,'AUTH_OK'));
  await check('P03 真冻结F03 withSession当前员工',async()=>assert.equal(String(await auth.withSession(session.token,async(_,a)=>a.employee_id,{normalOnly:true})),'6'));
  await check('P04 真父已签目录没有通知配置正向能力',async()=>{
   const r=await readCurrentFacts(auth,session.token,'notification.config.write');
   assert.equal(r.code,'UNKNOWN_OR_RETIRED_OPERATION');assert.equal(r.finalAllowed,false);
  });
  await check('P05 真实F03业务已编目仍不代表当前Scope/对象通过',async()=>{
   const r=await readCurrentFacts(auth,session.token,'customer.crm.read');
   assert.equal(r.finalAllowed,false);
  });
  await check('P06 合成通知配置绝不能复用真实身份冒充signed positive',async()=>{
   const r=await parentConfigMutation(null,{company_on:false},{token:session.token});
   assert.equal(r.allowed,false);assert.equal(r.code,'NOTIFICATION_CONFIG_SIGNED_PARENT_SOURCE_GAP');
  });
  await auth.pool.query("UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE employee_id=6");
  await check('P07 真父COMMIT后旧Token立即无效',async()=>assert.equal(await auth.withSession(session.token,async()=>true,{normalOnly:true}),null));
  await check('P08 真父已撤权Token读取仍失败',async()=>{
   const r=await readCurrentFacts(auth,session.token,'customer.crm.read');assert.equal(r.finalAllowed,false);
  });
  const admin=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567'});
  await check('P09 System Admin登录本身并不获得通知配置能力',async()=>{
   assert.equal(admin.code,'AUTH_OK');
   assert.equal(await auth.withSession(admin.token,async()=>true,{normalOnly:true}),true); // F03登录事实不等于业务权限允许
  });
  await check('P10 真实F03未知通知cap不会凭System Admin默认开通',async()=>{
   const r=await readCurrentFacts(auth,admin.token,'notification.config.write');
   assert.equal(r.finalAllowed,false);
  });
  assert.equal(n,10);
  console.log('F07_4_F03_SIGNED_PARENT_NEGATIVE_ONLY_10_PASS');
  console.log('NOTIFICATION_SIGNED_ISSUER_SOURCE_GAP SLA_EVENT_SOURCE_GAP');
 }finally{await auth.close();}
});
