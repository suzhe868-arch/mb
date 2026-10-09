import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,apply} from '../migration.mjs';
import {verify as old86} from '../../runtime-team-scope/migration.mjs';
import {verify as old84} from '../../runtime-receiving-pool/migration.mjs';
import {verify as old82} from '../../runtime-admin-population/migration.mjs';
import {verify as old81} from '../../runtime-scope/migration.mjs';
import {verifyAuthDatabase as old80} from '../../../src/f03-auth-readiness.mjs';
import {createHandoverDraft as create,addPendingHandoverItem as add,recordItemFailure as fail,retryPendingItem as retry} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48794'});
const creds={manager:['http_test','SyntheticHttps_1234567'],other:['race_test','SyntheticRace_1234567'],ordinary:['limit_test','SyntheticLimit_1234567'],four:['four_s_test','SyntheticFourS_123456'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async k=>{const r=await auth.login({login:creds[k][0],password:creds[k][1],source:'sg06_'+k+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
let manager,secondToken,other,ordinary,four,admin,oldRestricted,batchId,item1,item2,itemDemand;
const draft=(requestKey='sg06-draft-key-000001',sourceEmployeeId=7)=>({changeKind:'planned_transfer',invalidAt:null,reason:'CI synthetic handover',requestKey,sourceEmployeeId});
const item=(batchId,objectKind,objectId,intendedToEmployeeId=4,fromEmployeeId=7)=>({batchId,objectKind,objectId,intendedToEmployeeId,fromEmployeeId});
const auditRows=()=>db.query("SELECT audit_id,actor_id,action,object_kind,object_id,role_context,before_json,after_json FROM public.audit_events WHERE action LIKE 'handover.%' ORDER BY audit_id").then(r=>r.rows);
const snap=async()=>({
 batches:(await db.query('SELECT * FROM public.handover_batches ORDER BY batch_id')).rows,
 items:(await db.query('SELECT * FROM public.handover_items ORDER BY item_id')).rows,
 audit:await auditRows()
});
const business=async()=>({
 people:(await db.query('SELECT employee_id,store_id,main_role_id,employment_status,receiving_status FROM public.employees ORDER BY employee_id')).rows,
 customers:(await db.query('SELECT customer_id,current_owner_employee_id,owner_assignment_state FROM public.customers ORDER BY customer_id')).rows,
 demands:(await db.query('SELECT demand_id,responsible_employee_id FROM public.demands ORDER BY demand_id')).rows
});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const x=await login('manager');assert.equal(x.restricted,true);oldRestricted=x.token;
 assert.equal((await auth.change({token:x.token,csrf:x.csrf,oldPassword:creds.manager[1],newPassword:'SyntheticHandoverManager_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='SyntheticHandoverManager_2026';
 manager=(await login('manager')).token;secondToken=(await login('manager')).token;
 other=(await login('other')).token;ordinary=(await login('ordinary')).token;
 four=(await login('four')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('E01 complete 000001..000007 immutable 88-table PG16; old guard versions fail-closed',async()=>{
 assert.equal((await verify(db)).verified,true);
 const versions=(await db.query('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id')).rows.map(x=>x.migration_id);
 assert.deepEqual(versions,['000002_pc_auth_sessions','000003_employee_capability_scope_bindings','000004_governance_population_guards','000005_employee_receiving_pool_eligibility','000006_explicit_team_memberships','000007_handover_batch_item_ledger']);
 for(const [guard,re] of [[old86,/F03_2D_/],[old84,/F03_2C_/],[old82,/F03_2B_/],[old81,/F03_2_1B_/]])await assert.rejects(()=>guard(db),re);
 await assert.rejects(()=>old80(auth.pool),/F03_AUTH_GUARD/);
});
test('E02 current scoped manager alone drafts; 4S, Admin, absent-scope, restricted, logout and request spoof deny',async()=>{
 const before=await snap();
 const dead=(await login('other')).token;await auth.logout(dead);
 for(const token of [four,ordinary,admin,oldRestricted,dead,null,'a'.repeat(43)]){
  assert.equal((await create(auth,token,draft('sg06-reject-key-00001'))).ok,false);
 }
 for(const p of [{...draft(),actor:'manager'},{...draft(),handoverComplete:true},{...draft(),scope:'global'}, {...draft(),sourceEmployeeId:3},{...draft(),reason:'password_token=a'}]){
  assert.equal((await create(auth,manager,p)).ok,false);
 }
 assert.deepEqual(await snap(),before);
 const created=await create(auth,manager,draft());assert.equal(created.code,'LEDGER_DRAFT_CREATED');batchId=created.batchId;
 const replay=await create(auth,manager,draft());assert.deepEqual(replay,{code:'LEDGER_DRAFT_NOOP',ok:true,batchId});
 assert.equal((await create(auth,other,draft())).code,'LEDGER_REQUEST_KEY_COLLISION');
 assert.equal((await create(auth,manager,{...draft(),sourceEmployeeId:6})).ok,false);
});
test('E03 verified Customer and Demand pending-only items, missing/false owner/unsupported domain cannot register',async()=>{
 const bad=[item(batchId,'Customer','999'),item(batchId,'Customer','301',7),item(batchId,'Customer','301',4,6),item(batchId,'Priority','1'),item(batchId,'Transaction','1'),item(batchId,'Customer','bad'),{...item(batchId,'Customer','301'),alreadyTransferred:true}];
 for(const p of bad)assert.equal((await add(auth,manager,p)).ok,false);
 const r1=await add(auth,manager,item(batchId,'Customer','301'));assert.equal(r1.code,'LEDGER_ITEM_PENDING_ONLY');item1=r1.itemId;
 const r2=await add(auth,manager,item(batchId,'Customer','302'));assert.equal(r2.code,'LEDGER_ITEM_PENDING_ONLY');item2=r2.itemId;
 const r3=await add(auth,manager,item(batchId,'Demand','401'));assert.equal(r3.code,'LEDGER_ITEM_PENDING_ONLY');itemDemand=r3.itemId;
 assert.deepEqual(await add(auth,manager,item(batchId,'Demand','401')),{code:'LEDGER_ITEM_NOOP',ok:true,itemId:itemDemand});
 assert.equal((await add(auth,manager,item(batchId,'Customer','301',6))).ok,false);
 assert.equal((await db.query('SELECT count(*)::int n FROM public.handover_items WHERE status IN (\'pending\',\'retry_required\',\'blocked\')')).rows[0].n,3);
});
test('E04 two real PC sessions race for one object in a new batch, only single row and audit; request key scoped to actor',async()=>{
 const b=(await create(auth,manager,draft('sg06-second-batch-00002'))).batchId;
 const previous=(await auditRows()).length;
 const p=item(b,'Customer','301');
 const outcomes=await Promise.all([add(auth,manager,p),add(auth,secondToken,p)]);
 assert.equal(outcomes.filter(x=>x.code==='LEDGER_ITEM_PENDING_ONLY').length,1);
 assert.equal(outcomes.filter(x=>x.code==='LEDGER_ITEM_NOOP').length,1);
 assert.equal((await auditRows()).length,previous+1); // one item; batch draft was already counted
});
test('E05 one item failure commits while injected audit failure for another item rolls back only that item',async()=>{
 const f=await fail(auth,manager,{itemId:item1,attemptKey:'sg06-failure-item1-001',errorCode:'DOMAIN_ADAPTER_UNAVAILABLE'});assert.equal(f.code,'LEDGER_FAILURE_RECORDED');
 const kept=await snap();
 await assert.rejects(()=>fail(auth,manager,{itemId:item2,attemptKey:'sg06-failure-item2-002',errorCode:'DOMAIN_REVALIDATION_FAILED'},{testCheckpoint:async p=>{if(p==='after_current')throw Error('CI_ITEM2_FAULT')}}),/CI_ITEM2_FAULT/);
 assert.deepEqual(await snap(),kept);
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=$1',[item1])).rows[0].status,'retry_required');
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=$1',[item2])).rows[0].status,'pending');
});
test('E06 retry pending and failure intents are replay-idempotent across transactions and concurrent workers',async()=>{
 assert.equal((await fail(auth,manager,{itemId:item1,attemptKey:'sg06-failure-item1-001',errorCode:'DOMAIN_ADAPTER_UNAVAILABLE'})).code,'LEDGER_STATUS_NOOP');
 assert.equal((await retry(auth,manager,{itemId:item1,retryKey:'sg06-retry-item1-0001'})).code,'LEDGER_RETRY_PENDING_ONLY');
 assert.equal((await retry(auth,manager,{itemId:item1,retryKey:'sg06-retry-item1-0001'})).code,'LEDGER_STATUS_NOOP');
 const one=await snap();
 assert.equal((await fail(auth,manager,{itemId:item1,attemptKey:'sg06-failure-item1-001',errorCode:'DOMAIN_ADAPTER_UNAVAILABLE'})).code,'LEDGER_STATUS_NOOP');
 assert.deepEqual(await snap(),one);
 const out=await Promise.all([
  fail(auth,manager,{itemId:item1,attemptKey:'sg06-failure-item1-003',errorCode:'CONFLICT_RETRY'}),
  fail(auth,secondToken,{itemId:item1,attemptKey:'sg06-failure-item1-004',errorCode:'CONFLICT_RETRY'})
 ]);
 assert.equal(out.filter(x=>x.code==='LEDGER_FAILURE_RECORDED').length,1);
 assert.equal((await db.query('SELECT attempt_count FROM public.handover_items WHERE item_id=$1',[item1])).rows[0].attempt_count,'2');
});
test('E06 fault injection at after_current/after_audit rolls back current, audit and batch version atomically',async()=>{
 for(const point of ['after_current','after_audit']){
  const b=await snap();
  await assert.rejects(()=>fail(auth,manager,{itemId:item2,attemptKey:'sg06-fault-item2-'+point,errorCode:'CONFLICT_RETRY'},{testCheckpoint:async p=>{if(p===point)throw Error('CI_'+point)}}),new RegExp('CI_'+point));
  assert.deepEqual(await snap(),b);
 }
});
test('E07 no owner, Demand responsible, employee identity/role/store edits; never completed, no successful domain audit',async()=>{
 const domain=await business();
 await fail(auth,manager,{itemId:item2,attemptKey:'sg06-failure-item2-005',errorCode:'DOMAIN_ADAPTER_UNAVAILABLE'});
 await retry(auth,manager,{itemId:item2,retryKey:'sg06-retry-item2-0002'});
 assert.deepEqual(await business(),domain);
 const s=await snap();
 assert.ok(s.batches.every(x=>['collecting','pending_domain_handover','blocked'].includes(x.status)));
 assert.ok(s.items.every(x=>['pending','retry_required','blocked'].includes(x.status)));
 assert.ok(s.audit.every(x=>!JSON.stringify(x).match(/HANDOVER_COMPLETE|domain\.transfer\.success|password_hash|token_digest/)));
});
test('E08 fail-closed on invalid scope, inactive source/target and stale structural seal, then restore',async()=>{
 const b=await snap();
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=13");
 assert.equal((await add(auth,manager,item(batchId,'Customer','301'))).ok,false);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=13");
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 assert.equal((await retry(auth,manager,{itemId:item1,retryKey:'sg06-inactive-source-01'})).ok,false);
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7");
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 assert.equal((await retry(auth,manager,{itemId:item1,retryKey:'sg06-inactive-target-01'})).ok,false);
 await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4");
 assert.deepEqual(await snap(),b);
 const old=(await db.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000006_explicit_team_memberships'")).rows[0].checksum;
 await db.query("UPDATE public.f03_schema_migrations SET checksum='TAMPER' WHERE migration_id='000006_explicit_team_memberships'");
 try{await assert.rejects(()=>verify(db),/F03_2E_VERSION_DRIFT/);await assert.rejects(()=>apply(db),/F03_2E_VERSION_DRIFT/)}
 finally{await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000006_explicit_team_memberships'",[old])}
 await db.query('CREATE SCHEMA sg06_unexpected');
 try{await assert.rejects(()=>verify(db),/F03_2E_ISOLATION_DENY/)}finally{await db.query('DROP SCHEMA sg06_unexpected')}
 assert.equal((await verify(db)).verified,true);
});
