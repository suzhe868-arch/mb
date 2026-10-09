import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../runtime-scope/migration.mjs';
import {verifyAuthDatabase} from '../../../src/f03-auth-readiness.mjs';
import {checkCustomerPhoneScope} from '../../runtime-scope/customer-phone-guard.mjs';
import {enableApprovedTemplate as enable} from '../enable-template.mjs';

const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48519'});
const db=await connect();
const target=Object.freeze({roleCode:'sales',permissionCode:'customer.phone.manage',enabled:true});
let admin1,admin2,employee,partner,restricted,revoked;
const counts=async()=>{
 const [cur,h,a]=await Promise.all([
  db.query("SELECT enabled FROM public.role_permission_defaults WHERE role_id=1 AND permission_id=11"),
  db.query("SELECT enabled,actor_kind,actor_id,occurred_at FROM public.role_default_permission_history WHERE role_id=1 AND permission_id=11 ORDER BY event_id"),
  db.query("SELECT actor_kind,actor_id,role_context,before_json,after_json,occurred_at FROM public.audit_events WHERE action='role_template.enable_customer_phone' ORDER BY audit_id")
 ]);
 return {current:cur.rows.length?cur.rows[0].enabled:null,history:h.rows,audit:a.rows};
};
const request=(token=admin1,proposal=target,options)=>enable(auth,token,proposal,options);
const changed=()=>({code:'TEMPLATE_ENABLED',changed:true});
const noOp=()=>({code:'TEMPLATE_ALREADY_ENABLED',changed:false});
const deny=()=>({code:'TEMPLATE_ENABLE_DENIED',changed:false});
const switchFalse=()=>db.query('UPDATE public.role_permission_defaults SET enabled=false,changed_at=now() WHERE role_id=1 AND permission_id=11');
test.before(async()=>{
 await verify(db);
 const l1=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'gov_main'});
 const l2=await auth.login({login:'gov_admin_two',password:'SyntheticGovAdminTwo_2026',source:'gov_second'});
 const le=await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'gov_emp'});
 assert.equal(le.restricted,true);
 restricted=le.token;
 const changedPw=await auth.change({token:le.token,csrf:le.csrf,oldPassword:'SyntheticPassword_12345',newPassword:'SyntheticGovernanceEmployee_2026'});
 assert.equal(changedPw.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 const em=await auth.login({login:'employee_test',password:'SyntheticGovernanceEmployee_2026',source:'gov_emp_new'});
 const partnerLogin=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'gov_four_s'});
 assert.equal(l1.code,'AUTH_OK');assert.equal(l2.code,'AUTH_OK');
 assert.equal(em.code,'AUTH_OK');assert.equal(partnerLogin.code,'AUTH_OK');
 admin1=l1.token;admin2=l2.token;employee=em.token;partner=partnerLogin.token;
 await db.query("DELETE FROM public.role_permission_defaults WHERE role_id=1 AND permission_id=11");
 const state=await counts();assert.equal(state.current,null);
 assert.equal(state.history.length,0);assert.equal(state.audit.length,0);
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('T01 sealed 000001/000002/000003 81-table PG16 Guard passes; untouched 80-table rejects',async()=>{
 assert.equal((await verify(db)).verified,true);
 await assert.rejects(()=>verifyAuthDatabase(auth.pool),/F03_AUTH_GUARD_TABLES/);
});
test('T02 nonexistent template row -> real current + immutable history + sanitized audit exactly once',async()=>{
 assert.deepEqual(await request(),changed());
 const s=await counts();assert.equal(s.current,true);
 assert.equal(s.history.length,1);assert.equal(s.audit.length,1);
 assert.equal(s.history[0].enabled,true);
 assert.equal(String(s.history[0].actor_id),'9');
 assert.equal(s.history[0].actor_kind,'system_admin');
 assert.equal(s.audit[0].actor_id,'9');
 assert.equal(s.audit[0].actor_kind,'system_admin');
 assert.equal(s.audit[0].before_json.enabled,null);
 assert.equal(s.audit[0].after_json.enabled,true);
 assert.equal(s.audit[0].role_context.principal_kind,'system_admin');
 assert.ok(s.audit[0].occurred_at instanceof Date);
 assert.equal(s.audit[0].occurred_at.getTime(),s.history[0].occurred_at.getTime());
 assert.doesNotMatch(JSON.stringify(s.audit[0]),/password|token|phone_number|hash|SyntheticPassword/);
});
test('T03 true NO_OP repeat and false -> true actual update produce truthful one additional history and audit',async()=>{
 assert.deepEqual(await request(),noOp());
 assert.deepEqual(await request(admin2),noOp());
 assert.equal((await counts()).history.length,1);
 await switchFalse();assert.equal((await counts()).current,false);
 assert.deepEqual(await request(admin2),changed());
 const s=await counts();
 assert.equal(s.current,true);assert.equal(s.history.length,2);assert.equal(s.audit.length,2);
 assert.equal(s.audit[1].before_json.enabled,false);
 assert.equal(s.audit[1].after_json.enabled,true);
 assert.equal(s.audit[1].actor_id,'10');
 assert.deepEqual(await request(),noOp());assert.equal((await counts()).history.length,2);
});
test('T04 two truly different live admin sessions race missing-row without duplicate success',async()=>{
 await db.query('DELETE FROM public.role_permission_defaults WHERE role_id=1 AND permission_id=11');
 const before=await counts();assert.equal(before.current,null);
 const result=await Promise.all([request(admin1),request(admin2)]);
 assert.equal(result.filter(x=>x.code==='TEMPLATE_ENABLED').length,1);
 assert.equal(result.filter(x=>x.code==='TEMPLATE_ALREADY_ENABLED').length,1);
 const after=await counts();assert.equal(after.current,true);
 assert.equal(after.history.length,before.history.length+1);
 assert.equal(after.audit.length,before.audit.length+1);
 assert.equal(after.audit.at(-1).before_json.enabled,null);
});
test('T05 fault injection after current, after history and before commit rolls back ALL three physical facts',async()=>{
 for(const stage of ['after_current','after_history','before_commit']){
  await switchFalse();
  const before=await counts();
  await assert.rejects(()=>request(admin1,target,{testCheckpoint:async point=>{if(point===stage)throw Error('SYNTHETIC_FAILURE_'+point)}}),new RegExp('SYNTHETIC_FAILURE_'+stage));
  const after=await counts();assert.equal(after.current,false,stage);
  assert.equal(after.history.length,before.history.length,stage);
  assert.equal(after.audit.length,before.audit.length,stage);
 }
 await assert.rejects(()=>request(admin1,target,{testCheckpoint:async (stage,c)=>{
  if(stage==='before_commit')await c.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE account_id=2");
 }}),/F03_2_2A_COMMIT_IDENTITY_REJECTED/);
 const now=await counts();assert.equal(now.current,false);
 const ac=(await db.query('SELECT credential_state FROM public.pc_login_accounts WHERE account_id=2')).rows[0];
 assert.equal(ac.credential_state,'enabled','failed identity commit also rolled back');
});
test('T06 no employee/4S/first-password/disabled/inactive/admin-old-session authorization, no mutations',async()=>{
 const before=await counts();
 for(const t of [employee,partner,restricted,'z'.repeat(43),null,123]){
  assert.deepEqual(await request(t),deny());
 }
 await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE account_id=9");
 assert.deepEqual(await request(admin2),deny());
 await db.query("UPDATE public.pc_login_accounts SET credential_state='enabled' WHERE account_id=9");
 await db.query("UPDATE public.system_admins SET account_status='inactive' WHERE system_admin_id=10");
 assert.deepEqual(await request(admin2),deny());
 await db.query("UPDATE public.system_admins SET account_status='active' WHERE system_admin_id=10");
 const throwaway=await auth.login({login:'gov_admin_two',password:'SyntheticGovAdminTwo_2026',source:'gov_old'});
 assert.equal(throwaway.code,'AUTH_OK');revoked=throwaway.token;
 await auth.logout(revoked);
 assert.deepEqual(await request(revoked),deny());
 const after=await counts();assert.equal(after.current,before.current);
 assert.equal(after.history.length,before.history.length);
 assert.equal(after.audit.length,before.audit.length);
});
test('T07 forged authority/target, downgrade, batch, extra fields denied with no current/history changes',async()=>{
 const before=await counts();
 const bad=[
  {roleCode:'manager',permissionCode:'customer.phone.manage',enabled:true},
  {roleCode:'sales',permissionCode:'crm.customer.view',enabled:true},
  {roleCode:'sales',permissionCode:'customer.phone.manage',enabled:false},
  {roleCode:'sales',permissionCode:'customer.phone.manage',enabled:true,actor:'system_admin'},
  {roleCode:'sales',permissionCode:'customer.phone.manage',enabled:true,global:true},
  {roleCode:'sales',permissionCode:'customer.phone.manage',enabled:true,batch:true},
  {roleCode:'sales',permissionCode:'customer.phone.manage',enabled:true,action:'delete'},
  {roleCode:'sales',permissionCode:'customer.phone.manage'},undefined,null,[],'sales',{}
 ];
 for(const input of bad)assert.deepEqual(await request(admin1,input),deny());
 const after=await counts();
 assert.equal(after.current,before.current);assert.equal(after.history.length,before.history.length);
 assert.equal(after.audit.length,before.audit.length);
});
test('T08 same original Employee session reads realtime template enable, but never bypasses object-scope, deny, customer inactive, 4S hard deny',async()=>{
 await switchFalse();
 const get=(t=employee,id='301')=>checkCustomerPhoneScope(auth,t,'customer.phone.manage',id);
 assert.equal((await get()).code,'CURRENT_CAPABILITY_DENIED');
 const before=await counts();
 assert.deepEqual(await request(admin1),changed());
 assert.equal((await get()).code,'INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW');
 assert.equal((await get(employee,'302')).code,'CAPABILITY_OBJECT_SCOPE_DENIED');
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,11,'deny',now())");
 assert.equal((await get()).code,'CURRENT_PERSONAL_DENY');
 await db.query("DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11");
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=now()-interval '1 second' WHERE scope_id=101 AND permission_id=11");
 assert.equal((await get()).code,'CAPABILITY_OBJECT_SCOPE_DENIED');
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=101 AND permission_id=11");
 await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
 assert.equal((await get()).code,'CUSTOMER_NOT_ACTIVE');
 await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=301");
 assert.equal((await get(partner)).code,'FOUR_S_HARD_DENY');
 assert.equal((await get()).code,'INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW');
 const after=await counts();assert.equal(after.history.length,before.history.length+1);
 assert.equal(after.audit.length,before.audit.length+1);
});
test('T10 after synthetic governance real PG16 physical structure and version seals are unchanged',async()=>{
 const result=await verify(db);assert.equal(result.verified,true);
 const versions=(await db.query("SELECT migration_id FROM public.f02_schema_migrations UNION ALL SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id")).rows.map(x=>x.migration_id);
 assert.deepEqual(versions,['000001_current_initial','000002_pc_auth_sessions','000003_employee_capability_scope_bindings']);
});
