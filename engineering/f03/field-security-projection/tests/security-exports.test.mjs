// Synthetic F03-1 session, mutable role and scope, no actual API.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../runtime-transaction-responsible-handover/migration.mjs';
import {projectEmployeeVehicle} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let token,restricted,admin,four;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const x=await auth.login({login:'http_test',password:'SyntheticHttps_1234567',source:'p_session'});assert.equal(x.code,'AUTH_OK');restricted=x.token;
 assert.equal((await auth.change({token:x.token,csrf:x.csrf,oldPassword:'SyntheticHttps_1234567',newPassword:'SyntheticP_Secure_2026_Authority'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 token=(await auth.login({login:'http_test',password:'SyntheticP_Secure_2026_Authority',source:'p_session_updated'})).token;
 four=(await auth.login({login:'four_s_test',password:'SyntheticFourS_123456',source:'p_four_s'})).token;
 admin=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'p_control'})).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
const p=view=>({vehicleId:39001,teamId:901,view});
test('P2 current manager reads minimally allowed fields for detail/cache/export/history/print',async()=>{
 for(const view of ['detail','history','cache','export','copy','print']){
  const r=await projectEmployeeVehicle(auth,token,p(view));
  assert.equal(r.code,'P_EMPLOYEE_REDACTED',JSON.stringify(r));
  assert.equal(r.fields.price,9880000);
  assert.equal(r.internalPrice,null);
  assert.equal(r.publisherPhone,null);
  assert.ok(!JSON.stringify(r).includes('9100000'));
 }
});
test('P2 invalid/restricted/System Admin/4S sessions denied',async()=>{
 for(const t of [null,restricted,admin,four])assert.notEqual((await projectEmployeeVehicle(auth,t,p('export'))).code,'P_EMPLOYEE_REDACTED');
});
test('P2 deny precedence blocks an old cached export authorization',async()=>{
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=12");
 try{assert.equal((await projectEmployeeVehicle(auth,token,p('cache'))).code,'P_EMPLOYEE_SCOPE_DENY')}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=12")}
});
test('P2 expired capability scope rejects pre-generated exports',async()=>{
 const old=(await db.query("SELECT ended_at FROM public.employee_capability_scope_bindings WHERE employee_id=5 AND permission_id=12 AND scope_id=201")).rows[0];
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp()-interval '1 second' WHERE employee_id=5 AND permission_id=12 AND scope_id=201");
 try{assert.equal((await projectEmployeeVehicle(auth,token,p('export'))).code,'P_EMPLOYEE_SCOPE_DENY')}
 finally{await db.query('UPDATE public.employee_capability_scope_bindings SET ended_at=$1 WHERE employee_id=5 AND permission_id=12 AND scope_id=201',[old.ended_at])}
});
test('P2 inactive employee cannot reuse old session for sensitive response',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5");
 try{assert.notEqual((await projectEmployeeVehicle(auth,token,p('history'))).code,'P_EMPLOYEE_REDACTED')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=5")}
});
test('P2 wrong team and tainted cache fields fail closed',async()=>{
 assert.equal((await projectEmployeeVehicle(auth,token,{vehicleId:39001,teamId:999,view:'export'})).code,'P_EMPLOYEE_SCOPE_DENY');
 assert.equal((await projectEmployeeVehicle(auth,token,{...p('cache'),claimedOldRole:'manager'})).code,'P_EMPLOYEE_INPUT_DENY');
});
