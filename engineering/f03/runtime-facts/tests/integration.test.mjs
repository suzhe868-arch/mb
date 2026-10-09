import {test} from 'node:test';
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../../f03-1/migration.mjs';
import {readCurrentFacts} from '../current-facts.mjs';
import {parseHostCookie,validateProbe} from '../test-probe-contract.mjs';

const origin='https://127.0.0.1:48491',port=48491,secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin});
const db=await connect();let listener,employeeToken,fourSToken,adminToken,bigToken;
test.after(async()=>{if(listener)await new Promise(resolve=>listener.close(resolve));await auth.close();await db.end();secret.fill(0)});
test.before(async()=>{
 await verify(db); // reuse frozen F02 -> F03-1 version/run seal and exact physical fingerprint.
 // Synthetic fixture only. No DDL; no changes to approved migrations, schema or permission catalog design.
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (11,'customer.phone.manage'),(12,'crm.customer.view'),(13,'vehicle.read'),(14,'vehicle.manage'),(15,'lock.manage')");
  await db.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES (1,11,true,now()),(1,12,true,now()),(1,13,true,now()),(1,14,true,now()),(2,13,true,now()),(2,14,true,now())");
  await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES (2,10,'allow',now())");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const restricted=await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'current_facts_restricted'});
 assert.equal(restricted.restricted,true);
 assert.equal((await readCurrentFacts(auth,restricted.token,'customer.phone.manage')).code,'SESSION_OR_ADMISSION_DENIED');
 const changed=await auth.change({token:restricted.token,csrf:restricted.csrf,oldPassword:'SyntheticPassword_12345',newPassword:'SyntheticCurrentFacts_78901'});
 assert.equal(changed.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 assert.equal((await readCurrentFacts(auth,restricted.token,'customer.phone.manage')).code,'SESSION_OR_ADMISSION_DENIED');
 const login=await auth.login({login:'employee_test',password:'SyntheticCurrentFacts_78901',source:'current_facts_normal'});
 assert.equal(login.restricted,false);employeeToken=login.token;
 const fourS=await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'current_facts_4s'});
 assert.equal(fourS.restricted,false);fourSToken=fourS.token;
 const admin=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'current_facts_admin'});
 assert.equal(admin.restricted,false);adminToken=admin.token;
});
const probe=(token,operation)=>readCurrentFacts(auth,token,operation);
test('G01/02: a real normal F03-1 session proves current permission only; no scope or business grant',async()=>{
 const result=await probe(employeeToken,'customer.phone.manage');
 assert.deepEqual(result,{code:'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER',finalAllowed:false});
 assert.deepEqual(await probe(employeeToken,'customer.crm.read'),{code:'TECH_ALIAS_NOT_APPROVED',finalAllowed:false});
 assert.deepEqual(await probe(adminToken,'customer.crm.read'),{code:'SYSTEM_ADMIN_NO_BUSINESS_RIGHT',finalAllowed:false});
 assert.deepEqual(await probe(adminToken,'system.employee.manage'),{code:'SYSTEM_CONTROL_SCOPE_DEFER',finalAllowed:false});
});
test('G03: template changes in PostgreSQL visible to SAME old session on next independent call',async()=>{
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER');
 await db.query('BEGIN');await db.query('UPDATE public.role_permission_defaults SET enabled=false,changed_at=now() WHERE role_id=1 AND permission_id=11');await db.query('COMMIT');
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'NO_CURRENT_CAPABILITY');
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES (1,11,'allow',now())");
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER');
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=11");
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'CURRENT_PERSONAL_DENY');
 await db.query("INSERT INTO public.employee_permission_override_history(employee_id,permission_id,decision,actor_kind,actor_id,occurred_at) VALUES(1,11,'allow','employee',1,now())");
 await db.query('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11');
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'NO_CURRENT_CAPABILITY','historical allow cannot revive permission');
 await db.query('UPDATE public.role_permission_defaults SET enabled=true,changed_at=now() WHERE role_id=1 AND permission_id=11');
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER');
});
test('G04: missing permission, unknown operation, forbidden request facts, invalid ID are denied',async()=>{
 const checks=['not.a.real.operation','customer.phone.manage;DROP TABLE public.employees','__proto__','vehicle.not_known'];
 for(const op of checks)assert.equal((await probe(employeeToken,op)).code,'UNKNOWN_OR_RETIRED_OPERATION');
 assert.equal((await probe(employeeToken,'matching.rule.manage')).code,'CAPABILITY_NOT_IN_CURRENT_CATALOG');
});
test('G05: F03-1 live 4S personal allow controls all PC requests; template/history cannot substitute',async()=>{
 assert.equal((await probe(fourSToken,'vehicle.read')).code,'TECH_ALIAS_NOT_APPROVED');
 assert.equal((await probe(fourSToken,'customer.phone.manage')).code,'HARD_DENY_FOUR_S');
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=2 AND permission_id=10");
 assert.equal((await probe(fourSToken,'vehicle.read')).code,'SESSION_OR_ADMISSION_DENIED');
 await db.query("DELETE FROM public.employee_permission_overrides WHERE employee_id=2 AND permission_id=10");
 assert.equal((await probe(fourSToken,'vehicle.read')).code,'SESSION_OR_ADMISSION_DENIED');
 await db.query("INSERT INTO public.employee_permission_override_history(employee_id,permission_id,decision,actor_kind,actor_id,occurred_at) VALUES(2,10,'allow','employee',1,now())");
 assert.equal((await probe(fourSToken,'vehicle.read')).code,'SESSION_OR_ADMISSION_DENIED');
});
test('G06: current role, current store, current employment and session epoch are re-evaluated',async()=>{
 await db.query('UPDATE public.employees SET main_role_id=2 WHERE employee_id=1');
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'SESSION_OR_ADMISSION_DENIED');
 await db.query('UPDATE public.employees SET main_role_id=1 WHERE employee_id=1');
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER');
 await db.query('UPDATE public.employees SET employment_status=$1 WHERE employee_id=1',['inactive']);
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'SESSION_OR_ADMISSION_DENIED');
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
 await db.query('UPDATE public.pc_login_accounts SET credential_epoch=credential_epoch+1 WHERE account_id=1');
 assert.equal((await probe(employeeToken,'customer.phone.manage')).code,'SESSION_OR_ADMISSION_DENIED');
});
test('G07: SQL parameter integrity and lossless BIGINT > JS safe integer',async()=>{
 const huge='9007199254740993',login='huge_ci_test';
 assert.equal((await db.query('SELECT $1::bigint::text AS safe',[huge])).rows[0].safe,huge);
 await db.query('BEGIN');
 try{
  await db.query('INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) VALUES($1,1,$2,$3,1)',[huge,'active','paused']);
  await db.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,system_admin_id,password_hash,credential_state,force_password_change) SELECT $1,$2,'employee',$3,NULL,password_hash,'enabled',false FROM public.pc_login_accounts WHERE account_id=8",['9007199254740994',login,huge]);
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const large=await auth.login({login,password:'SyntheticLimit_1234567',source:'huge_ci_fixture'});
 assert.equal(large.code,'AUTH_OK');bigToken=large.token;
 assert.equal((await probe(bigToken,'customer.phone.manage')).code,'CURRENT_CAPABILITY_PRESENT_SCOPE_AND_OBJECT_DEFER');
 assert.equal((await probe(bigToken,'unknown$1;')).code,'UNKNOWN_OR_RETIRED_OPERATION');
});
test('G08: restricted, revoked and expired sessions never expose current facts',async()=>{
 const login=await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'expire_ci'});
 assert.equal(login.code,'AUTH_OK');
 await db.query("UPDATE public.pc_auth_sessions SET expires_at=now()-interval '1 second' WHERE token_digest=$1",[ (await import('../../../src/f03-auth-crypto.mjs')).sessionDigest(login.token,secret)]);
 assert.equal((await probe(login.token,'system.employee.manage')).code,'SESSION_OR_ADMISSION_DENIED');
 const old=await auth.logout(adminToken);
 assert.equal(old.code,'LOGOUT_OK');
 assert.equal((await probe(adminToken,'system.employee.manage')).code,'SESSION_OR_ADMISSION_DENIED');
});
test('G09: test probe JSON/cookie rejects principal spoofing and duplicates',()=>{
 for(const fields of [{operation:'customer.phone.manage',actor:'admin'},{operation:'customer.phone.manage',global:true},{operation:'customer.phone.manage',owner:'1'},{operation:'customer.phone.manage',role:'store_manager'},{operation:'customer.phone.manage',team:'all'},{operation:'customer.phone.manage',sql:'SELECT 1'},{}])assert.equal(validateProbe(fields).valid,false);
 assert.equal(validateProbe({operation:'customer.phone.manage'}).valid,true);
 assert.equal(parseHostCookie('__Host-mb_pc=x; __Host-mb_pc=y'),null);
 assert.equal(parseHostCookie('none=token'),null);
});
