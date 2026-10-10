import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {deactivateSuddenInactive,restoreEmployeeSafely} from '../governance.mjs';
const c=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let manager,control,oldEmployeeSession;
test.before(async()=>{
 assert.equal((await verify(c)).verified,true);
 manager=(await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'g3_manager'})).token;
 control=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'g3_sys_admin'})).token;
 oldEmployeeSession=(await auth.login({login:'limit_test',password:'SyntheticLimit_1234567',source:'g3_future_revoked'})).token;
});
test.after(async()=>{await auth.close();await c.end();secret.fill(0)});
test('G3 sudden inactive first revokes credential and old login, without altering pending SG06',async()=>{
 const before=(await c.query('SELECT status FROM public.handover_items WHERE item_id=13602')).rows[0].status;
 const r=await deactivateSuddenInactive(auth,manager,{employeeId:7,teamId:901,reason:'isolated synthetic emergency revocation'});
 assert.equal(r.code,'G_SUDDEN_DISABLED',JSON.stringify(r));
 assert.equal((await c.query("SELECT employment_status FROM public.employees WHERE employee_id=7")).rows[0].employment_status,'inactive');
 assert.equal((await c.query("SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=7")).rows[0].credential_state,'disabled');
 assert.equal((await c.query('SELECT status FROM public.handover_items WHERE item_id=13602')).rows[0].status,before);
 assert.equal(await auth.withSession(oldEmployeeSession,async()=>true),null);
});
test('G3 noncontrol employee cannot restore an inactive employee',async()=>{
 const r=await restoreEmployeeSafely(auth,manager,{employeeId:7,reason:'false actor restore should deny'});
 assert.equal(r.code,'G_RESTORE_CONTROL_PLANE_DENY');
});
test('G3 legitimate control-plane restore does not resurrect old sessions, receiving or scope',async()=>{
 const r=await restoreEmployeeSafely(auth,control,{employeeId:7,reason:'isolated controlled test restore'});
 assert.equal(r.code,'G_RESTORE_ONLY',JSON.stringify(r));
 const e=(await c.query('SELECT employment_status,receiving_status FROM public.employees WHERE employee_id=7')).rows[0];
 assert.equal(e.employment_status,'active');assert.equal(e.receiving_status,'paused');
 const account=(await c.query('SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=7')).rows[0];
 assert.equal(account.credential_state,'disabled');
 assert.equal(await auth.withSession(oldEmployeeSession,async()=>true),null);
 assert.equal((await c.query('SELECT count(*)::int n FROM public.employee_data_scopes WHERE employee_id=7 AND (ended_at IS NULL OR ended_at>clock_timestamp())')).rows[0].n,0);
});
test('G3 emergency deactivation is not replayable to duplicate audit',async()=>{
 const r=await deactivateSuddenInactive(auth,manager,{employeeId:7,teamId:901,reason:'second synthetic emergency should fail'});
 assert.equal(r.ok,false);
 assert.equal((await c.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='employee' AND object_id='7' AND action='sg06.sudden.inactive'")).rows[0].n,1);
});
