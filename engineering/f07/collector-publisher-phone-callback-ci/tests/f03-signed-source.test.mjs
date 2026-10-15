// A03：真正调用冻结F03-1 IsolatedAuth、80表物理签名与F03-2 current facts。
// 当前上游电话能力TECH_ALIAS_PENDING_A；本包明确保留FailClosed，不冒充SIGNED_F03业务授权。
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {verifyAuthDatabase} from '../../../src/f03-auth-readiness.mjs';
import {readCurrentFacts} from '../../../f03/runtime-facts/current-facts.mjs';
test('A03 原签F03真实会话权限拒绝证据',async t=>{
 const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(48),origin:'https://127.0.0.1:443'});
 try{
  await t.test('P01 F03 PG16 80表版本封印与运行号真验签',async()=>{
   assert.equal(await verifyAuthDatabase(auth.pool),true);
  });
  const login=await auth.login({login:'race_test',password:'SyntheticRace_1234567'});
  await t.test('P02 冻结IsolatedAuth真实登录签出有效会话',async()=>{
   assert.equal(login.code,'AUTH_OK');
   assert.equal(login.restricted,false);
   assert.equal(String(await auth.withSession(login.token,async(_,a)=>a.employee_id,{normalOnly:true})),'6');
  });
  await t.test('P03 真F03物理权限Catalog缺少发布人能力时拒绝',async()=>{
   const r=await readCurrentFacts(auth,login.token,'vehicle.publisher_phone.read');
   assert.equal(r.finalAllowed,false);
   assert.equal(r.code,'CAPABILITY_NOT_IN_CURRENT_CATALOG');
  });
  await t.test('P04 即使临时合成模板具备能力，F03待签别名仍拒绝',async()=>{
   await auth.pool.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(91001,'publisher.phone.sensitive')");
   await auth.pool.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES(1,91001,true,now())");
   const r=await readCurrentFacts(auth,login.token,'vehicle.publisher_phone.read');
   assert.equal(r.finalAllowed,false);
   assert.equal(r.code,'TECH_ALIAS_NOT_APPROVED');
  });
  await t.test('P05 真F03个人显式DENY覆盖模板允许',async()=>{
   await auth.pool.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(6,91001,'deny',now())");
   const r=await readCurrentFacts(auth,login.token,'vehicle.publisher_phone.read');
   assert.equal(r.finalAllowed,false);
   assert.equal(r.code,'CURRENT_PERSONAL_DENY');
  });
  await t.test('P06 账号credential_epoch变更COMMIT后旧会话拒绝',async()=>{
   await auth.pool.query("UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE employee_id=6");
   assert.equal(await auth.withSession(login.token,async()=>true,{normalOnly:true}),null);
   const r=await readCurrentFacts(auth,login.token,'vehicle.publisher_phone.read');
   assert.equal(r.finalAllowed,false);
   assert.equal(r.code,'SESSION_OR_ADMISSION_DENIED');
  });
  await t.test('P07 旧会话latest仍严拒',async()=>{
   const r=await readCurrentFacts(auth,login.token,'vehicle.publisher_phone.latest');
   assert.equal(r.finalAllowed,false);
  });
  console.log('F07_A03_SIGNED_F03_REAL_SESSION_DENY_PROOF_7_PASS');
  console.log('F07_A03_SOURCE_GAP_PHONE_ALIAS_AND_SCOPE_OBJECT_DEFER');
 }finally{await auth.close();}
});
