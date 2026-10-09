import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../runtime-handover-ledger/migration.mjs';
import {setManagerPersonalEmployeeManageDecision as decide,grantManagerTeamCapabilityScope as grant,endManagerTeamCapabilityScope as end,readManagerTeamGovernanceProof as prove} from '../service.mjs';
import {createHandoverDraft} from '../../runtime-handover-ledger/service.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48629'});
const credentials={adminA:['admin_test','SyntheticAdmin_1234567'],adminB:['gov_admin_two','SyntheticGovAdminTwo_2026'],manager5:['http_test','SyntheticHttps_1234567'],manager6:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],restricted:['employee_test','SyntheticPassword_12345']};
const login=async key=>{const x=await auth.login({login:credentials[key][0],password:credentials[key][1],source:'sg04_'+key+'_'+Math.random()});assert.equal(x.code,'AUTH_OK');return x};
let adminA,adminB,manager5,manager6,four,ordinary,restricted,oldManager5;
const decision=(token,managerEmployeeId=5,choice='allow',opts)=>decide(auth,token,{managerEmployeeId,decision:choice},opts);
const team=(token,managerEmployeeId=5,teamId=904,opts)=>grant(auth,token,{managerEmployeeId,teamId},opts);
const remove=(token,managerEmployeeId=5,teamId=904,opts)=>end(auth,token,{managerEmployeeId,teamId},opts);
const proof=(token=manager5,managerEmployeeId=5,teamId=904,employeeId=7)=>prove(auth,token,{managerEmployeeId,teamId,employeeId});
const state=async()=>({
 overrides:(await db.query("SELECT employee_id,permission_id,decision,changed_at FROM public.employee_permission_overrides WHERE permission_id=13 ORDER BY employee_id")).rows,
 history:(await db.query("SELECT employee_id,permission_id,decision,actor_kind,actor_id,occurred_at FROM public.employee_permission_override_history WHERE permission_id=13 ORDER BY event_id")).rows,
 scopes:(await db.query("SELECT scope_id,employee_id,scope_kind,scope_reference_id,ended_at FROM public.employee_data_scopes WHERE employee_id IN(5,6) ORDER BY scope_id")).rows,
 bindings:(await db.query("SELECT employee_id,scope_id,permission_id,granted_at,ended_at FROM public.employee_capability_scope_bindings WHERE employee_id IN(5,6) ORDER BY scope_id,permission_id")).rows,
 audit:(await db.query("SELECT actor_kind,actor_id,object_kind,object_id,action,before_json,after_json FROM public.audit_events WHERE action LIKE 'sg04.%' ORDER BY audit_id")).rows
});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 adminA=(await login('adminA')).token;adminB=(await login('adminB')).token;
 const m5=await login('manager5');oldManager5=m5.token;assert.equal(m5.restricted,true);
 assert.equal((await auth.change({token:m5.token,csrf:m5.csrf,oldPassword:credentials.manager5[1],newPassword:'SyntheticSG04ManagerNew_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 credentials.manager5[1]='SyntheticSG04ManagerNew_2026';manager5=(await login('manager5')).token;
 manager6=(await login('manager6')).token;
 four=(await login('four')).token;ordinary=(await login('ordinary')).token;
 restricted=(await login('restricted')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});

test('F01: 000001..000007 exact frozen PG16 88/536/344/138 structure and no new migration',async()=>{
 const v=(await verify(db)).verified;assert.equal(v,true);
 assert.deepEqual((await db.query('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id')).rows.map(x=>x.migration_id),[
 '000002_pc_auth_sessions','000003_employee_capability_scope_bindings','000004_governance_population_guards','000005_employee_receiving_pool_eligibility','000006_explicit_team_memberships','000007_handover_batch_item_ledger']);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,88);
});
test('F02: current System Admin only; manager/4S/restricted/old-session/unauthorized fields all deny without DB change',async()=>{
 const prior=await state();
 const dead=(await login('adminA')).token;await auth.logout(dead);
 for(const token of [manager5,manager6,four,ordinary,restricted,oldManager5,dead,'1'.repeat(43),null]){
  assert.equal((await decision(token,5,'deny')).changed,false);
  assert.equal((await team(token,5,904)).changed,false);
 }
 assert.equal((await decide(auth,adminA,{managerEmployeeId:5,decision:'allow',actorKind:'system_admin'})).changed,false);
 assert.equal((await grant(auth,adminA,{managerEmployeeId:5,teamId:904,global:true})).changed,false);
 assert.equal((await decision(adminA,7,'allow')).changed,false);
 assert.equal((await decision(adminA,999,'allow')).changed,false);
 assert.deepEqual(await state(),prior);
});
test('F03/F04: trusted pre-existing employee.manage, personal allow/deny/revoke current and append-only immutable history',async()=>{
 const base=await state();
 assert.equal((await decision(adminA,5,'allow')).code,'SG04_PERSONAL_NOOP');
 assert.deepEqual(await state(),base);
 assert.deepEqual(await decision(adminA,5,'deny'),{code:'SG04_PERSONAL_UPDATED',changed:true});
 assert.equal((await proof(manager5,5,901)).allowed,false);
 const denied=await state();
 assert.equal((await decision(adminB,5,'deny')).code,'SG04_PERSONAL_NOOP');
 assert.deepEqual(await state(),denied);
 assert.equal((await decision(adminB,5,'revoke')).changed,true);
 const noOverride=await state();assert.equal(noOverride.overrides.some(x=>Number(x.employee_id)===5),false);
 assert.equal((await decision(adminB,5,'revoke')).code,'SG04_PERSONAL_NOOP');
 assert.deepEqual(await state(),noOverride);
 assert.equal((await decision(adminA,5,'allow')).changed,true);
 const all=await state(),hist=all.history.filter(x=>Number(x.employee_id)===5);
 assert.deepEqual(hist.slice(-3).map(x=>x.decision),['deny','revoked','allow']);
 assert.equal(all.audit.filter(x=>x.object_kind==='employee_permission_override').length,3);
 assert.equal((await proof(manager5,5,901)).allowed,true);
});
test('F05: role alone, same store, absent/team inactive/expired manager membership, no scope and other capability all deny',async()=>{
 assert.equal((await proof(manager5,5,904)).allowed,false);
 assert.equal((await proof(manager5,5,905)).allowed,false);
 assert.equal((await proof(manager5,5,903)).allowed,false); // Only vehicle.read 14 on 202, no 13 binding
 assert.equal((await proof(manager5,6,901)).allowed,false); // PC actor cannot spoof other current manager
 assert.equal((await proof(four,5,901)).allowed,false); // hard 4S deny
 assert.equal((await team(adminA,5,905)).changed,false);
 assert.equal((await team(adminA,5,999)).changed,false);
 assert.equal((await team(adminA,7,904)).changed,false);
 assert.equal((await team(adminA,6,904)).changed,false); // same store, not member of 904
 await db.query("UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=5 AND team_id=904");
 assert.equal((await team(adminA,5,904)).changed,false);
 assert.equal((await proof(manager5,5,904)).allowed,false);
 await db.query("UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=5 AND team_id=904");
 assert.equal((await verify(db)).verified,true);
});
test('F06: 2 independent real System Admin sessions racing first team scope create only one active scope and binding',async()=>{
 const prior=await state();
 const replies=await Promise.all([team(adminA,5,904),team(adminB,5,904)]);
 assert.equal(replies.filter(x=>x.changed).length,1);
 assert.equal(replies.filter(x=>x.code==='SG04_TEAM_GRANT_NOOP').length,1);
 const r=await db.query("SELECT sc.scope_id,sc.ended_at,b.ended_at bind_end FROM public.employee_data_scopes sc JOIN public.employee_capability_scope_bindings b ON b.scope_id=sc.scope_id AND b.permission_id=13 WHERE sc.employee_id=5 AND sc.scope_kind='team' AND sc.scope_reference_id=904 AND sc.ended_at IS NULL AND b.ended_at IS NULL");
 assert.equal(r.rowCount,1);
 const after=await state();
 assert.equal(after.audit.length,prior.audit.length+1);
 assert.equal((await proof(manager5,5,904)).allowed,true);
});
test('F06: concurrent personal override same desired value only one current/history/audit',async()=>{
 const init=await state();
 const results=await Promise.all([decision(adminA,6,'deny'),decision(adminB,6,'deny')]);
 assert.equal(results.filter(x=>x.changed).length,1);
 assert.equal(results.filter(x=>x.code==='SG04_PERSONAL_NOOP').length,1);
 const after=await state();
 assert.equal(after.history.length,init.history.length+1);
 assert.equal(after.audit.length,init.audit.length+1);
 assert.equal((await decision(adminA,6,'allow')).changed,true);
});
test('F07: team capability end preserves shared scope if other permission still bound',async()=>{
 const r=await team(adminA,5,903);assert.equal(r.code,'SG04_TEAM_GRANTED');
 assert.equal((await proof(manager5,5,903)).allowed,true);
 for(const point of ['after_current','after_history','after_audit','before_commit']){
  const prior=await state();
  await assert.rejects(()=>remove(adminB,5,903,{testCheckpoint:async s=>{if(s===point)throw Error('CI_TEAM_END_ROLLBACK_'+point)}}),new RegExp('CI_TEAM_END_ROLLBACK_'+point));
  assert.deepEqual(await state(),prior);
  assert.equal((await proof(manager5,5,903)).allowed,true);
 }
 assert.equal((await remove(adminB,5,903)).code,'SG04_TEAM_ENDED');
 const scope=(await db.query("SELECT ended_at FROM public.employee_data_scopes WHERE scope_id=202")).rows[0];
 assert.equal(scope.ended_at,null);
 const bind14=(await db.query("SELECT ended_at FROM public.employee_capability_scope_bindings WHERE scope_id=202 AND permission_id=14")).rows[0];
 assert.equal(bind14.ended_at,null);
 assert.equal((await proof(manager5,5,903)).allowed,false);
 assert.equal((await remove(adminA,5,903)).code,'SG04_TEAM_END_NOOP');
 assert.equal((await remove(adminA,5,904)).code,'SG04_TEAM_ENDED');
 assert.equal((await proof(manager5,5,904)).allowed,false);
});
test('F08: exact transaction failure injection after current, history and audit restores all current/history/audit bytes',async()=>{
 for(const stage of ['after_current','after_history','after_audit','before_commit']){
  const baseline=await state();
  await assert.rejects(()=>decision(adminA,5,'deny',{testCheckpoint:async(at)=>{if(at===stage)throw Error('CI_ROLLBACK_'+stage)}}),new RegExp('CI_ROLLBACK_'+stage));
  assert.deepEqual(await state(),baseline);
 }
 for(const stage of ['after_current','after_audit','before_commit']){
  const baseline=await state();
  await assert.rejects(()=>team(adminA,5,904,{testCheckpoint:async(at)=>{if(at===stage)throw Error('CI_TEAM_'+stage)}}),new RegExp('CI_TEAM_'+stage));
  assert.deepEqual(await state(),baseline);
 }
 assert.equal((await verify(db)).verified,true);
});
test('F07: pending SG06 ledger blocks personal deny/revoke and last Team scope end; never treats ledger as business completion',async()=>{
 assert.equal((await team(adminA,6,901)).code,'SG04_TEAM_GRANT_NOOP');
 const p={changeKind:'planned_transfer',invalidAt:null,reason:'Synthetic SG04 ledger pending',requestKey:'sg04-pending-ledger-0001',sourceEmployeeId:7};
 const draft=await createHandoverDraft(auth,manager6,p);
 assert.equal(draft.code,'LEDGER_DRAFT_CREATED');
 assert.equal((await decision(adminA,6,'deny')).code,'SG04_HANDOVER_PENDING_DEFER_DENY');
 assert.equal((await decision(adminA,6,'revoke')).code,'SG04_HANDOVER_PENDING_DEFER_DENY');
 assert.equal((await remove(adminA,6,901)).code,'SG04_HANDOVER_PENDING_DEFER_DENY');
 assert.equal((await db.query('SELECT status FROM public.handover_batches WHERE batch_id=$1',[draft.batchId])).rows[0].status,'collecting');
});
test('F08: no physical DDL, F03 guard extra-schema and version tamper hard DENY',async()=>{
 const old=(await db.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000007_handover_batch_item_ledger'")).rows[0].checksum;
 await db.query("UPDATE public.f03_schema_migrations SET checksum='TAMPER' WHERE migration_id='000007_handover_batch_item_ledger'");
 try{await assert.rejects(()=>verify(db),/F03_2E_VERSION_DRIFT/);await assert.rejects(()=>decision(adminA,5,'allow'),/F03_2E_VERSION_DRIFT/)}
 finally{await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000007_handover_batch_item_ledger'",[old])}
 await db.query('CREATE SCHEMA sg04_illegal_extra');
 try{await assert.rejects(()=>verify(db),/F03_2E_ISOLATION_DENY/)}
 finally{await db.query('DROP SCHEMA sg04_illegal_extra')}
 assert.equal((await verify(db)).verified,true);
});
