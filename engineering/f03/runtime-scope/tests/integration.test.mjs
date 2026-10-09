import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {checkCustomerPhoneScope as check} from '../customer-phone-guard.mjs';
import {verifyAuthDatabase} from '../../../src/f03-auth-readiness.mjs';
const secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48500'});
const c=await connect();let employee,other,partner,admin;
test.after(async()=>{await auth.close();await c.end();secret.fill(0)});
test.before(async()=>{
 await verify(c);
 const before=await auth.login({login:'employee_test',password:'SyntheticPassword_12345',source:'scope_restricted'});
 assert.equal(before.restricted,true);
 assert.equal((await check(auth,before.token,'customer.phone.manage','301')).allowed,false);
 const change=await auth.change({token:before.token,csrf:before.csrf,oldPassword:'SyntheticPassword_12345',newPassword:'SyntheticScopeEmployee_2026'});
 assert.equal(change.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 employee=(await auth.login({login:'employee_test',password:'SyntheticScopeEmployee_2026',source:'scope_normal'})).token;
 other=(await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'scope_other'})).token;
 partner=(await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'scope_4s'})).token;
 admin=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'scope_admin'})).token;
 assert.ok(employee&&other&&partner&&admin);
});
const go=(token=employee,operation='customer.phone.manage',id='301')=>check(auth,token,operation,id);
const result=(code,allowed=false)=>({code,allowed});
test('S01 current employee + current exact capability + own object scope + active customer ALLOWS internal guard ONLY',async()=>{
 assert.deepEqual(await go(),result('INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',true));
 assert.deepEqual(await go(other),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 assert.deepEqual(await go(employee,'customer.phone.manage','302'),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 assert.deepEqual(await go(employee,'customer.phone.manage','303'),result('CUSTOMER_NOT_ACTIVE'));
});
test('S02 absent binding, other capability, cross-customer, current role not auto owner/team/store grants',async()=>{
 assert.deepEqual(await go(employee,'customer.phone.manage','302'),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 assert.deepEqual(await go(employee,'vehicle.read','301'),result('OTHER_ACTION_DEFER_DENY'));
 assert.deepEqual(await go(employee,'customer.crm.read','301'),result('OTHER_ACTION_DEFER_DENY'));
 await c.query("UPDATE public.employee_data_scopes SET scope_kind='store' WHERE scope_id=101");
 assert.deepEqual(await go(),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 await c.query("UPDATE public.employee_data_scopes SET scope_kind='object' WHERE scope_id=101");
 assert.deepEqual(await go(),result('INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',true));
});
test('S03 PostgreSQL composite FK rejects stealing another employee scope; CHECK/time and PK/FK deny',async()=>{
 const bad=async(sql,params=[])=>{
  await c.query('SAVEPOINT tmp');try{await c.query(sql,params);await c.query('ROLLBACK TO SAVEPOINT tmp');assert.fail('PG constraint unexpectedly allowed bogus binding')}
  catch(e){if(e.code===undefined)throw e;await c.query('ROLLBACK TO SAVEPOINT tmp');assert.ok(['23503','23505','23514'].includes(e.code),e.code)}
  finally{await c.query('RELEASE SAVEPOINT tmp')}
 };
 await c.query('BEGIN');try{
  await bad("INSERT INTO public.employee_capability_scope_bindings(employee_id,scope_id,permission_id,granted_at) VALUES (7,103,12,now())");
  await bad("INSERT INTO public.employee_capability_scope_bindings(employee_id,scope_id,permission_id,granted_at) VALUES (1,101,999,now())");
  await bad("INSERT INTO public.employee_capability_scope_bindings(employee_id,scope_id,permission_id,granted_at,ended_at) VALUES (1,11,104,now(),now()-interval '1 day')");
  await bad("INSERT INTO public.employee_capability_scope_bindings(employee_id,scope_id,permission_id,granted_at) VALUES (1,101,11,now())");
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
});
test('S04 revoked personal current deny, template disabled, missing scope, bound permission mismatch and recovery',async()=>{
 assert.equal((await go()).allowed,true);
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,11,'deny',now())");
 assert.deepEqual(await go(),result('CURRENT_PERSONAL_DENY'));
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=1 AND permission_id=11");
 assert.equal((await go()).allowed,true);
 await c.query('DELETE FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=11');
 await c.query('UPDATE public.role_permission_defaults SET enabled=false,changed_at=now() WHERE role_id=1 AND permission_id=11');
 assert.deepEqual(await go(),result('CURRENT_CAPABILITY_DENIED'));
 await c.query('UPDATE public.role_permission_defaults SET enabled=true,changed_at=now() WHERE role_id=1 AND permission_id=11');
 assert.deepEqual(await go(),result('INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',true));
 await c.query('DELETE FROM public.employee_capability_scope_bindings WHERE scope_id=101 AND permission_id=11');
 assert.deepEqual(await go(),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES (1,11,101,now()-interval '1 minute')");
});
test('S05 scope timing now-ended/unstarted/future-ended and customer inactive revalidated',async()=>{
 await c.query("UPDATE public.employee_capability_scope_bindings SET granted_at=now()+interval '1 hour' WHERE scope_id=101 AND permission_id=11");
 assert.deepEqual(await go(),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 await c.query("UPDATE public.employee_capability_scope_bindings SET granted_at=now()-interval '1 day', ended_at=now()-interval '10 seconds' WHERE scope_id=101 AND permission_id=11");
 assert.deepEqual(await go(),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 await c.query("UPDATE public.employee_capability_scope_bindings SET ended_at=now()+interval '1 day' WHERE scope_id=101 AND permission_id=11");
 assert.deepEqual(await go(),result('INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',true));
 await c.query("UPDATE public.employee_data_scopes SET ended_at=now()-interval '1 second' WHERE scope_id=101");
 assert.deepEqual(await go(),result('CAPABILITY_OBJECT_SCOPE_DENIED'));
 await c.query("UPDATE public.employee_data_scopes SET ended_at=now()+interval '1 day' WHERE scope_id=101");
 assert.deepEqual(await go(),result('INTERNAL_CUSTOMER_PHONE_SCOPE_ALLOW',true));
 await c.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
 assert.deepEqual(await go(),result('CUSTOMER_NOT_ACTIVE'));
 await c.query("UPDATE public.customers SET account_status='active' WHERE customer_id=301");
});
test('S06 4S hard deny and admin hard deny even with high role/individual permission, unknown IDs and ops',async()=>{
 assert.deepEqual(await go(partner),result('FOUR_S_HARD_DENY'));
 assert.deepEqual(await go(admin),result('SYSTEM_ADMIN_HARD_DENY'));
 for(const id of ['0','-1','1e3','1; DROP TABLE customers','900719925474099312345678','9223372036854775808',null,301])assert.deepEqual(await go(employee,'customer.phone.manage',id),result('INVALID_CUSTOMER_ID'));
 assert.deepEqual(await go(employee,'customer.phone.manage','99999'),result('CUSTOMER_OBJECT_MISSING'));
 for(const op of ['vehicle.read','lock.manage','transaction.manage','customer.phone.manage;--'])assert.deepEqual(await go(employee,op),result('OTHER_ACTION_DEFER_DENY'));
 assert.deepEqual(await go('x'.repeat(43)),result('SESSION_OR_PC_ADMISSION_DENIED'));
});
test('S07 old approved 80-table guard rejects this real 81-table new DB; new guard accepts full pinned structure',async()=>{
 const same=await verify(c);assert.equal(same.verified,true);
 await assert.rejects(()=>verifyAuthDatabase(auth.pool),/F03_AUTH_GUARD_TABLES/);
});
