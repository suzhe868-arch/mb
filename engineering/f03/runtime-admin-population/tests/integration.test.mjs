import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {verify as verify81} from '../../runtime-scope/migration.mjs';
import {verifyAuthDatabase} from '../../../src/f03-auth-readiness.mjs';
import {changeAdminPopulation as change} from '../governance.mjs';
import {claimFirstBootstrap as claim} from '../bootstrap.mjs';
const db=await connect(), secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48627'});
const pass=new Map([[9,['admin_test','SyntheticAdmin_1234567']],[10,['gov_admin_two','SyntheticGovAdminTwo_2026']],[11,['sg05_third_admin','SyntheticThirdAdmin_2026']]]);
const login=async id=>{const [key,password]=pass.get(id);const x=await auth.login({login:key,password,source:'sg05_'+id+'_'+Math.random()});assert.equal(x.code,'AUTH_OK');assert.equal(x.restricted,false);return x.token};
const op=(token,id,action='deactivate',options)=>change(auth,token,{targetSystemAdminId:id,action},options);
const facts=async()=>{
 const admin=(await db.query('SELECT system_admin_id,account_status FROM public.system_admins ORDER BY system_admin_id')).rows;
 const credentials=(await db.query("SELECT system_admin_id,credential_state,credential_epoch FROM public.pc_login_accounts WHERE principal_kind='system_admin' ORDER BY system_admin_id")).rows;
 const guard=(await db.query("SELECT version,bootstrap_claimed_at FROM public.governance_population_guards WHERE guard_name='system_admin'")).rows[0];
 const audit=(await db.query("SELECT action,actor_kind,actor_id,before_json,after_json FROM public.audit_events WHERE action LIKE 'system_admin.%' ORDER BY audit_id")).rows;
 return {admin,credentials,guard,audit};
};
const restore=async()=>{
 await db.query("UPDATE public.system_admins SET account_status='active' WHERE system_admin_id IN (9,10,11)");
 await db.query("UPDATE public.pc_login_accounts SET credential_state='enabled',credential_epoch=credential_epoch+1 WHERE principal_kind='system_admin' AND system_admin_id IN (9,10,11)");
};
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('A2B-01 exact 000001-000004, 82-table seal and frozen 80/81 guards deny',async()=>{
 assert.equal((await verify(db)).verified,true);
 await assert.rejects(()=>verify81(db),/F03_2_1B_VERSION_DRIFT|F03_2_1B_/);
 await assert.rejects(()=>verifyAuthDatabase(auth.pool),/F03_AUTH_GUARD/);
 const versions=(await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id")).rows;
 assert.deepEqual(versions.map(x=>x.migration_id),['000002_pc_auth_sessions','000003_employee_capability_scope_bindings','000004_governance_population_guards']);
});
test('A2B-02 existing historical Admin permanently claims bootstrap even after inactive',async()=>{
 assert.ok((await facts()).guard.bootstrap_claimed_at instanceof Date);
 await assert.rejects(()=>claim(),/F03_2B_BOOTSTRAP_ALREADY_USED/);
 await db.query("UPDATE public.system_admins SET account_status='inactive'");
 await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE principal_kind='system_admin'");
 await assert.rejects(()=>claim(),/F03_2B_BOOTSTRAP_ALREADY_USED/);
 await restore();
 assert.equal((await verify(db)).verified,true);
});
test('A2B-03 only normal current genuine Admin session, never employee/forged/restricted',async()=>{
 const admin=await login(9);
 const employee=await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'employee_restricted'});
 assert.equal(employee.restricted,true);
 const before=await facts();
 for(const token of [employee.token,null,'x'.repeat(43),123]){
  assert.equal((await op(token,11)).changed,false);
 }
 for(const bad of [
  {targetSystemAdminId:11,action:'reset'},
  {targetSystemAdminId:11,action:'deactivate',role:'manager'},
  {targetSystemAdminId:11,action:'disableCredential',global:true},
  {targetSystemAdminId:0,action:'deactivate'},
  {targetSystemAdminId:'11',action:'deactivate'}
 ])assert.equal((await change(auth,admin,bad)).changed,false);
 const after=await facts();assert.equal(after.guard.version,before.guard.version);assert.equal(after.audit.length,before.audit.length);
});
test('A2B-04 last active identity and separately last login credential are both protected',async()=>{
 await db.query("UPDATE public.system_admins SET account_status='inactive' WHERE system_admin_id IN (10,11)");
 const token=await login(9);
 let before=await facts();assert.equal((await op(token,9)).code,'F03_2B_LAST_ACTIVE_DENY');
 let after=await facts();assert.deepEqual(after.admin,before.admin);assert.equal(after.guard.version,before.guard.version);
 await restore();
 await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE principal_kind='system_admin' AND system_admin_id IN (9,11)");
 const actor=await login(10);
 before=await facts();assert.equal((await op(actor,10,'disableCredential')).code,'F03_2B_LAST_LOGIN_DENY');
 after=await facts();assert.deepEqual(after.credentials,before.credentials);assert.equal(after.audit.length,before.audit.length);
 await restore();
});
test('A2B-06 successful deactivate atomically revokes old session and increments epoch; no-op no audit',async()=>{
 const actor=await login(9), target=await login(11);
 const before=await facts();
 assert.deepEqual(await op(actor,11),{code:'ADMIN_POPULATION_UPDATED',changed:true});
 const after=await facts();
 assert.equal(Number(after.guard.version),Number(before.guard.version)+1);
 assert.equal(after.audit.length,before.audit.length+1);
 assert.equal(after.admin.find(x=>Number(x.system_admin_id)===11).account_status,'inactive');
 assert.equal(after.credentials.find(x=>Number(x.system_admin_id)===11).credential_state,'disabled');
 assert.equal(Number(after.credentials.find(x=>Number(x.system_admin_id)===11).credential_epoch),Number(before.credentials.find(x=>Number(x.system_admin_id)===11).credential_epoch)+1);
 assert.equal(await auth.withSession(target,async()=>true),null);
 assert.deepEqual(await op(actor,11),{code:'ADMIN_ALREADY_INACTIVE',changed:false});
 assert.equal((await facts()).audit.length,after.audit.length);
 await restore();
});
test('A2B-05 two independent Admin accounts cross-deactivate under real row-lock contention never leave zero',async()=>{
 await db.query("UPDATE public.system_admins SET account_status='inactive' WHERE system_admin_id=11");
 await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE system_admin_id=11");
 const t9=await login(9),t10=await login(10),before=await facts();
 const both=await Promise.all([op(t9,10),op(t10,9)]);
 assert.equal(both.filter(x=>x.changed).length,1);
 const after=await facts();
 assert.equal(after.admin.filter(x=>x.account_status==='active').length,1);
 assert.equal(after.credentials.filter(x=>x.credential_state==='enabled').length,1);
 assert.equal(after.audit.length,before.audit.length+1);
 await restore();
});
test('A2B-05 concurrent self-deactivate vs other valid session never disable last remaining login',async()=>{
 await db.query("UPDATE public.system_admins SET account_status='inactive' WHERE system_admin_id=11");
 await db.query("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE system_admin_id=11");
 const t9=await login(9),t10=await login(10);
 const both=await Promise.all([op(t9,9),op(t10,10)]);
 assert.equal(both.filter(x=>x.changed).length,1);
 assert.equal((await facts()).admin.filter(x=>x.account_status==='active').length,1);
 await restore();
});
test('A2B-07 every injection rolls back identity, credential, revocation, immutable audit and population version',async()=>{
 const actor=await login(9),target=await login(11);
 for(const stage of ['after_change','after_revocation','after_audit','before_commit']){
  const before=await facts();
  await assert.rejects(()=>op(actor,11,'disableCredential',{testCheckpoint:async point=>{if(point===stage)throw Error('CI_FAULT_'+stage)}}),new RegExp('CI_FAULT_'+stage));
  const after=await facts();
  assert.deepEqual(after,before,stage);
  assert.equal(await auth.withSession(target,async()=>true),true);
 }
});
test('A2B-08 unsupported target or extra namespace fails closed without widening schema',async()=>{
 const actor=await login(9);
 assert.equal((await op(actor,777)).changed,false);
 await db.query('CREATE SCHEMA ci_rogue_scope');
 await db.query('CREATE TABLE ci_rogue_scope.rogue (id integer)');
 await assert.rejects(()=>verify(db),/F03_2B_IDENTITY_OR_NAMESPACE_DENY/);
 await assert.rejects(()=>op(actor,11),/F03_2B_IDENTITY_OR_NAMESPACE_DENY/);
 await db.query('DROP SCHEMA ci_rogue_scope CASCADE');
 assert.equal((await verify(db)).verified,true);
});
