import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,apply,rollback} from '../migration.mjs';
import {verify as old84} from '../../runtime-receiving-pool/migration.mjs';
import {verify as old82} from '../../runtime-admin-population/migration.mjs';
import {verify as old81} from '../../runtime-scope/migration.mjs';
import {verifyAuthDatabase as old80} from '../../../src/f03-auth-readiness.mjs';
import {setTeamMembership as change,canManageTargetTeamScope as proof} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48729'});
const creds={a9:['admin_test','SyntheticAdmin_1234567'],a10:['gov_admin_two','SyntheticGovAdminTwo_2026'],mgr:['http_test','SyntheticHttps_1234567'],store:['race_test','SyntheticRace_1234567'],sales:['limit_test','SyntheticLimit_1234567'],four:['four_s_test','SyntheticFourS_123456'],restricted:['employee_test','SyntheticPassword_12345']};
const login=async n=>{let x=await auth.login({login:creds[n][0],password:creds[n][1],source:'sg02_'+n+'_'+Math.random()});assert.equal(x.code,'AUTH_OK');return x};
let admin1,admin2,manager,store,sales,four,restricted,restrictedManager;
const manage=(token,teamId,employeeId,action,opts)=>change(auth,token,{teamId,employeeId,action},opts);
const prove=(token=manager,teamId=901,employeeId=7,capability='employee.manage')=>proof(auth,token,{teamId,employeeId,capability});
const facts=async()=>{
 const t=(await db.query('SELECT team_id,team_status,membership_version FROM public.teams ORDER BY team_id')).rows;
 const m=(await db.query('SELECT membership_id,team_id,employee_id,valid_from,ended_at,changed_by_system_admin_id FROM public.employee_team_memberships ORDER BY membership_id')).rows;
 const a=(await db.query("SELECT action,actor_kind,actor_id,before_json,after_json FROM public.audit_events WHERE action LIKE 'team.membership.%' ORDER BY audit_id")).rows;
 return {t,m,a};
};
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 admin1=(await login('a9')).token;
 admin2=(await login('a10')).token;
 restrictedManager=await login('mgr');
 assert.equal(restrictedManager.restricted,true);
 const up=await auth.change({token:restrictedManager.token,csrf:restrictedManager.csrf,oldPassword:creds.mgr[1],newPassword:'SyntheticManagerNormal_2026'});
 assert.equal(up.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.mgr[1]='SyntheticManagerNormal_2026';manager=(await login('mgr')).token;
 store=(await login('store')).token;sales=(await login('sales')).token;
 four=(await login('four')).token;restricted=(await login('restricted')).token;
});
test.after(async()=>{await db.end();await auth.close();secret.fill(0)});
test('D01 exact sealed 000001..000006 PG16; old80/81/82/84 guards reject later physical version',async()=>{
 assert.equal((await verify(db)).verified,true);
 await assert.rejects(()=>old84(db),/F03_2C_/);
 await assert.rejects(()=>old82(db),/F03_2B_/);
 await assert.rejects(()=>old81(db),/F03_2_1B_/);
 await assert.rejects(()=>old80(auth.pool),/F03_AUTH_GUARD/);
 const v=(await db.query('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id')).rows.map(x=>x.migration_id);
 assert.deepEqual(v,['000002_pc_auth_sessions','000003_employee_capability_scope_bindings','000004_governance_population_guards','000005_employee_receiving_pool_eligibility','000006_explicit_team_memberships']);
});
test('D02 only independent normal active System Admin may add explicit members; no default team/manager/4S authority',async()=>{
 const before=await facts();
 const old=await login('a9');await auth.logout(old.token);
 for(const token of [manager,store,sales,four,restricted.token,restrictedManager.token,old.token,'z'.repeat(43),null,1]){
  assert.equal((await manage(token,901,7,'join')).allowed,false);
 }
 for(const p of [
  {teamId:901,employeeId:7,action:'join',actor:'admin'}, {teamId:901,employeeId:7,action:'join',global:true},
  {teamId:901,employeeId:7,action:'join',owner:7},{teamId:901,employeeId:7,action:'join',role:'manager'},
  {teamId:'901',employeeId:7,action:'join'},{teamId:901,employeeId:7,action:'create'}]){
  assert.equal((await change(auth,admin1,p)).allowed,false);
 }
 for(const [t,e] of [[999,7],[902,7],[901,2],[901,3],[901,999]])assert.equal((await manage(admin1,t,e,'join')).allowed,false);
 assert.deepEqual(await facts(),before);
 assert.deepEqual(await manage(admin1,901,5,'join'),{code:'TEAM_JOINED',allowed:true});
 assert.deepEqual(await manage(admin1,901,5,'join'),{code:'TEAM_NOOP',allowed:false});
 assert.deepEqual(await manage(admin2,901,7,'join'),{code:'TEAM_JOINED',allowed:true});
});
test('D03 same store, manager role, member missing, inactive team or scheduled future are never team permission',async()=>{
 assert.equal((await prove(manager,903,7)).allowed,false);
 assert.equal((await prove(manager,902,7)).allowed,false);
 assert.equal((await prove(store,901,7)).allowed,false);
 assert.equal((await prove(four,901,7)).allowed,false);
 await db.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,ended_at,changed_by_system_admin_id) VALUES(903,6,now()+interval '1 day',now()+interval '2 day',9)");
 assert.equal((await prove(manager,903,6)).allowed,false);
 assert.equal((await manage(admin1,903,6,'join')).code,'TEAM_FUTURE_OVERLAP_DENY');
});
test('D04 & D05 manager only explicit personal current allow + exact employee.manage team scope + both memberships',async()=>{
 assert.deepEqual(await prove(),{code:'TEAM_SCOPE_PROVEN_READ_ONLY',allowed:true});
 assert.equal((await prove(manager,903,7)).allowed,false);
 assert.equal((await prove(manager,901,7,'customer.phone.manage')).allowed,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=13");
 assert.equal((await prove()).allowed,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=13");
 assert.equal((await prove()).allowed,true);
 await db.query("UPDATE public.employee_capability_scope_bindings SET permission_id=14 WHERE employee_id=5 AND scope_id=201");
 assert.equal((await prove()).allowed,false);
 await db.query("UPDATE public.employee_capability_scope_bindings SET permission_id=13 WHERE employee_id=5 AND scope_id=201");
 await db.query("UPDATE public.employee_data_scopes SET ended_at=now() WHERE scope_id=201");
 assert.equal((await prove()).allowed,false);
 await db.query('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=201');
 await db.query("UPDATE public.teams SET team_status='inactive' WHERE team_id=901");
 assert.equal((await prove()).allowed,false);
 await db.query("UPDATE public.teams SET team_status='active' WHERE team_id=901");
 await db.query("UPDATE public.employees SET main_role_id=1 WHERE employee_id=5");
 assert.equal((await prove()).allowed,false);
 await db.query("UPDATE public.employees SET main_role_id=31 WHERE employee_id=5");
 assert.equal((await prove()).allowed,true);
});
test('D06 two genuine independent Admin sessions join same membership concurrently with real PG16 locks: one changed, no overlaps',async()=>{
 assert.equal((await manage(admin1,901,7,'end')).allowed,true);
 const before=await facts();
 const replies=await Promise.all([manage(admin1,901,7,'join'),manage(admin2,901,7,'join')]);
 assert.equal(replies.filter(x=>x.allowed).length,1);
 const after=await facts();
 assert.equal(after.a.length,before.a.length+1);
 assert.equal(after.m.filter(x=>Number(x.team_id)===901&&Number(x.employee_id)===7&&x.ended_at===null).length,1);
 assert.equal(Number(after.t.find(x=>Number(x.team_id)===901).membership_version),Number(before.t.find(x=>Number(x.team_id)===901).membership_version)+1);
});
test('D06 overlapping end vs new join cannot create two open intervals or delete closed membership history',async()=>{
 const before=await facts();
 const replies=await Promise.all([manage(admin1,901,7,'end'),manage(admin2,901,7,'join')]);
 assert.ok(replies.filter(x=>x.allowed).length<=2);
 const after=await facts();
 assert.equal(after.m.length>=before.m.length,true);
 assert.equal(after.m.filter(x=>Number(x.team_id)===901&&Number(x.employee_id)===7&&x.ended_at===null).length<=1,true);
 if(!(await prove()).allowed)await manage(admin2,901,7,'join');
 assert.equal((await prove()).allowed,true);
});
test('D07 transaction-injected faults roll back current membership, audit and version together; NOOP appends nothing',async()=>{
 const prior=await facts();
 assert.equal((await manage(admin1,901,7,'join')).code,'TEAM_NOOP');
 assert.deepEqual(await facts(),prior);
 for(const stage of ['after_current','after_check','after_audit','before_commit']){
  const b=await facts();
  await assert.rejects(()=>manage(admin1,901,7,'end',{testCheckpoint:async label=>{if(label===stage)throw Error('CI_TEAM_ROLLBACK_'+label)}}),new RegExp('CI_TEAM_ROLLBACK_'+stage));
  assert.deepEqual(await facts(),b);
 }
 assert.equal((await prove()).allowed,true);
});
test('D08 current read rechecks login, role, membership, target and scope expiry; cannot grant store/team by spoof',async()=>{
 const managerOld=manager;
 assert.equal((await prove(managerOld)).allowed,true);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 assert.equal((await prove(managerOld)).allowed,false);
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7");
 assert.equal((await prove(managerOld)).allowed,true);
 await db.query("UPDATE public.teams SET team_status='inactive' WHERE team_id=901");
 assert.equal((await prove(managerOld)).allowed,false);
 await db.query("UPDATE public.teams SET team_status='active' WHERE team_id=901");
 const bad=[{employeeId:7,teamId:901,capability:'employee.manage',global:true},{employeeId:7,teamId:901,capability:'employee.manage',actor:'manager'},{employeeId:7,teamId:901,capability:'vehicle.read'}];
 for(const x of bad)assert.equal((await proof(auth,manager,x)).allowed,false);
 const s=await facts();
 await db.query('CREATE SCHEMA ci_team_extra');
 try{await assert.rejects(()=>verify(db),/F03_2D_ISOLATION_DENY/);await assert.rejects(()=>apply(db),/F03_2D_ISOLATION_DENY/)}finally{await db.query('DROP SCHEMA ci_team_extra')}
 assert.deepEqual(await facts(),s);
});
test('D10 late historical 000005 checksum tamper disallows verify/apply; restore original and remain exact',async()=>{
 const old=(await db.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000005_employee_receiving_pool_eligibility'")).rows[0].checksum;
 await db.query("UPDATE public.f03_schema_migrations SET checksum='INVALID' WHERE migration_id='000005_employee_receiving_pool_eligibility'");
 try{await assert.rejects(()=>verify(db),/F03_2D_VERSION_DRIFT/);await assert.rejects(()=>apply(db),/F03_2D_VERSION_DRIFT/)}
 finally{await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000005_employee_receiving_pool_eligibility'",[old])}
 assert.equal((await verify(db)).verified,true);
});
