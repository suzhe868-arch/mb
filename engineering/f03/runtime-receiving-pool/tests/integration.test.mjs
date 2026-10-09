import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,apply} from '../migration.mjs';
import {verify as old82} from '../../runtime-admin-population/migration.mjs';
import {verify as old81} from '../../runtime-scope/migration.mjs';
import {verifyAuthDatabase as old80} from '../../../src/f03-auth-readiness.mjs';
import {setEmployeeEligibility as grant,changeOwnReceiving as toggle,reportPool} from '../service.mjs';
const c=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48639'});
const credentials={admin:['admin_test','SyntheticAdmin_1234567'],e6:['race_test','SyntheticRace_1234567'],e7:['limit_test','SyntheticLimit_1234567'],e5:['http_test','SyntheticHttps_1234567'],emp:['employee_test','SyntheticPassword_12345'],four:['four_s_test','SyntheticFourS_123456']};
const login=async key=>{const [name,password]=credentials[key];const r=await auth.login({login:name,password,source:'receiving_'+key+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
let admin,e6,e7,e5,ordinary,four,oldRestricted;
const g=(id,eligible,token=admin,options)=>grant(auth,token,{employeeId:id,eligible},options);
const t=(id,accepting,token,options)=>toggle(auth,token,{employeeId:id,accepting},options);
const stats=async()=>{
 const q=await Promise.all([
  c.query('SELECT employee_id,eligible,version FROM public.employee_receiving_eligibility ORDER BY employee_id'),
  c.query('SELECT employee_id,receiving_status,employment_status,main_role_id FROM public.employees ORDER BY employee_id'),
  c.query('SELECT version FROM public.receiving_pool_guards'),
  c.query("SELECT action,actor_kind,object_id,before_json,after_json FROM public.audit_events WHERE action LIKE 'receiving_%' ORDER BY audit_id"),
  c.query('SELECT count(*)::integer n FROM public.customers'),
  c.query('SELECT count(*)::integer n FROM public.consultations')
 ]);
 return {eligible:q[0].rows,employees:q[1].rows,guard:Number(q[2].rows[0].version),audit:q[3].rows,customers:q[4].rows[0].n,consultations:q[5].rows[0].n,pool:(await reportPool(c)).receivers};
};
const reset=async()=>{
 await c.query("UPDATE public.employees SET receiving_status='receiving',employment_status='active' WHERE employee_id IN (5,6,7)");
 await c.query('UPDATE public.employee_receiving_eligibility SET eligible=true,version=version+1,decided_at=now() WHERE employee_id IN (5,6,7)');
};
test.before(async()=>{
 await verify(c);
 admin=(await login('admin')).token;
 e6=(await login('e6')).token;
 e7=(await login('e7')).token;
 const restricted=await login('e5');
 assert.equal(restricted.restricted,true);oldRestricted=restricted.token;
 const changed=await auth.change({token:restricted.token,csrf:restricted.csrf,oldPassword:credentials.e5[1],newPassword:'SyntheticReceiverHead_2026'});
 assert.equal(changed.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 credentials.e5[1]='SyntheticReceiverHead_2026';e5=(await login('e5')).token;
 ordinary=(await login('emp')).token;
 four=(await login('four')).token;
});
test.after(async()=>{await auth.close();await c.end();secret.fill(0)});
test('S03-01 exact 000001-000005, 84 tables, old 80/81/82 guards reject',async()=>{
 assert.equal((await verify(c)).verified,true);
 await assert.rejects(()=>old82(c),/F03_2B_|F03_2B_MIGRATION_CHAIN_DRIFT/);
 await assert.rejects(()=>old81(c),/F03_2_1B_/);
 await assert.rejects(()=>old80(auth.pool),/F03_AUTH_GUARD/);
 const rows=(await c.query('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.deepEqual(rows.map(x=>x.migration_id),['000002_pc_auth_sessions','000003_employee_capability_scope_bindings','000004_governance_population_guards','000005_employee_receiving_pool_eligibility']);
});
test('S03-02 missing explicit eligibility => all active+receiving employees excluded, explicit admin grant starts pool',async()=>{
 assert.equal((await reportPool(c)).receivers,0);
 assert.deepEqual(await g(7,false),{code:'ELIGIBILITY_UNCHANGED',changed:false});
 assert.equal((await t(7,false,e7)).code,'RECEIVING_NOT_ELIGIBLE');
 assert.deepEqual(await g(7,true),{code:'ELIGIBILITY_UPDATED',changed:true});
 assert.equal((await reportPool(c)).receivers,1);
 assert.deepEqual(await g(7,true),{code:'ELIGIBILITY_UNCHANGED',changed:false});
});
test('S03-03 never permit Employee, 4S, restricted, expired, forged admin or invalid role to grant eligibility',async()=>{
 const before=await stats();
 const dead=(await login('admin')).token;
 await auth.logout(dead);
 for(const token of [e6,e7,e5,ordinary,four,oldRestricted,dead,'x'.repeat(43),null,123])assert.equal((await g(6,true,token)).changed,false);
 for(const input of [
  {employeeId:6,eligible:true,actor:'system_admin'},
  {employeeId:6,eligible:true,global:true},
  {employeeId:6,eligible:true,poolCount:2},
  {employeeId:'6',eligible:true},{employeeId:6,eligible:'true'},
  {employeeId:6,eligible:true,scope:'all'}
 ])assert.equal((await grant(auth,admin,input)).changed,false);
 assert.equal((await g(2,true)).changed,false); // 4S
 assert.equal((await g(3,true)).changed,false); // inactive
 assert.equal((await g(998,true)).changed,false);
 const after=await stats();
 assert.deepEqual(after,before);
});
test('S03-04 store_head, manager, sales eligible may self ON/OFF; wrong identity, role, 4S and missing eligible cannot',async()=>{
 assert.deepEqual(await g(6,true),{code:'ELIGIBILITY_UPDATED',changed:true});
 assert.deepEqual(await g(5,true),{code:'ELIGIBILITY_UPDATED',changed:true});
 const before=await stats();
 assert.equal(before.pool,3);
 assert.deepEqual(await t(6,false,e6),{code:'RECEIVING_UPDATED',changed:true});
 assert.deepEqual(await t(6,false,e6),{code:'RECEIVING_UNCHANGED',changed:false});
 assert.deepEqual(await t(6,true,e6),{code:'RECEIVING_UPDATED',changed:true});
 assert.deepEqual(await t(5,false,e5),{code:'RECEIVING_UPDATED',changed:true});
 assert.deepEqual(await t(5,true,e5),{code:'RECEIVING_UPDATED',changed:true});
 assert.equal((await t(7,false,e6)).changed,false);
 assert.equal((await t(2,false,four)).changed,false);
 assert.equal((await t(7,false,admin)).changed,false);
 assert.equal((await t(1,true,ordinary)).changed,false);
 assert.equal((await t(6,false,oldRestricted)).changed,false);
 assert.equal((await reportPool(c)).receivers,3);
});
test('S03-05 concurrent last two qualified employee OFF => only one commit, pool >=1',async()=>{
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 assert.equal((await reportPool(c)).receivers,2);
 const before=await stats();
 const results=await Promise.all([t(6,false,e6),t(7,false,e7)]);
 assert.equal(results.filter(x=>x.changed).length,1);
 assert.equal((await reportPool(c)).receivers,1);
 assert.equal((await stats()).audit.length,before.audit.length+1);
 await reset();
});
test('S03-05 admin revokes other eligibility concurrently with own OFF; one real transaction denied',async()=>{
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 const results=await Promise.all([g(7,false),t(6,false,e6)]);
 assert.equal(results.filter(x=>x.changed).length,1);
 assert.equal((await reportPool(c)).receivers,1);
 await reset();
});
test('S03-05 concurrent OFF + ON serializes via same pool singleton, final nonzero',async()=>{
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=6");
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 assert.equal((await reportPool(c)).receivers,1);
 const results=await Promise.all([t(7,false,e7),t(6,true,e6)]);
 assert.equal(results.filter(x=>x.code==='RECEIVING_UPDATED').length>=1,true);
 assert.equal((await reportPool(c)).receivers>=1,true);
 await reset();
});
test('S03-06 last employee OFF and last eligibility revoke both reject; external inactive creates zero but recovery ON restores',async()=>{
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id IN (5,6)");
 let before=await stats();assert.equal(before.pool,1);
 assert.equal((await t(7,false,e7)).code,'F03_2C_LAST_RECEIVER_DENY');
 assert.equal((await g(7,false)).code,'F03_2C_LAST_RECEIVER_DENY');
 assert.deepEqual((await stats()).eligible,before.eligible);
 await c.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 assert.equal((await reportPool(c)).empty,true);
 assert.equal((await reportPool(c)).noFallbackAdmin,true);
 assert.equal((await reportPool(c)).ownerAssignmentPendingDomain,'DEFER_F04_SG06');
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=7");
 await c.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7");
 assert.equal((await reportPool(c)).receivers,0);
 assert.deepEqual(await t(6,true,e6),{code:'RECEIVING_UPDATED',changed:true});
 assert.equal((await reportPool(c)).receivers,1);
 assert.equal((await t(6,false,e6)).code,'F03_2C_LAST_RECEIVER_DENY');
 await reset();
});
test('S03-07 injected faults after current/count/audit/before commit atomically roll back all facts',async()=>{
 for(const stage of ['after_current','after_count','after_audit','before_commit']){
  const before=await stats();
  await assert.rejects(()=>t(7,false,e7,{testCheckpoint:async point=>{if(point===stage)throw Error('CI_RECEIVING_FAULT_'+stage)}}),new RegExp('CI_RECEIVING_FAULT_'+stage));
  assert.deepEqual(await stats(),before);
  await assert.rejects(()=>g(7,false,admin,{testCheckpoint:async point=>{if(point===stage)throw Error('CI_ELIGIBILITY_FAULT_'+stage)}}),new RegExp('CI_ELIGIBILITY_FAULT_'+stage));
  assert.deepEqual(await stats(),before);
 }
 const actual=await stats();assert.ok(actual.pool>=1);
});
test('S03-08 no customer owner, consultation, demand, priority or lock mutation; only scoped employee current and audit',async()=>{
 const old=await stats();
 await t(5,false,e5);
 await t(5,true,e5);
 const after=await stats();
 assert.equal(after.customers,old.customers);
 assert.equal(after.consultations,old.consultations);
 for(const audit of after.audit)assert.doesNotMatch(JSON.stringify(audit),/password|scrypt|token_digest|customer_phone|Synthetic/);
});
test('S03-01 original 000004 checksum tamper and non-public namespace both deny 84 table guard, restore exact',async()=>{
 const row=(await c.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000004_governance_population_guards'")).rows[0];
 await c.query("UPDATE public.f03_schema_migrations SET checksum='TAMPERED' WHERE migration_id='000004_governance_population_guards'");
 try{
  await assert.rejects(()=>verify(c),/F03_2C_VERSION_DRIFT/);
  await assert.rejects(()=>apply(c),/F03_2C_VERSION_DRIFT/);
 }finally{await c.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',[row.checksum,'000004_governance_population_guards'])}
 await c.query('CREATE SCHEMA sg03_rogue');
 await c.query('CREATE TABLE sg03_rogue.extra(id integer)');
 try{
  await assert.rejects(()=>verify(c),/F03_2C_ISOLATION_DENY/);
  await assert.rejects(()=>apply(c),/F03_2C_ISOLATION_DENY/);
 }finally{await c.query('DROP SCHEMA sg03_rogue CASCADE')}
 assert.equal((await verify(c)).verified,true);
});
