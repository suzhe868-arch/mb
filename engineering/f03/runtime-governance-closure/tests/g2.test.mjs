import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {commitPlannedGovernance,commitPlannedStoreTransferAsSystemAdmin} from '../governance.mjs';
import {commitHandoverItem,commitHandoverBatch} from '../service.mjs';
const c=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let manager,head,admin,oldStaffSession;
test.before(async()=>{const x=await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'g2_planned'});assert.equal(x.code,'AUTH_OK');manager=x.token;
 head=(await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'g2_store_head'})).token;
 admin=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567',source:'g2_control_plane'})).token;
 oldStaffSession=(await auth.login({login:'synthetic_g_user_78',password:'SyntheticG_Disposable_78_2026',source:'g2_employee78_before'})).token;
 assert.ok(oldStaffSession);
});
test.after(async()=>{await auth.close();await c.end();secret.fill(0)});
test('G2 separate real PG16 schema 000014 is exact',async()=>{assert.equal((await verify(c)).verified,true)});
test('G2 pending SG06 batch cannot trigger planned store transfer, downgrade or disable',async()=>{
 const old=(await c.query('SELECT employment_status,main_role_id,store_id FROM public.employees WHERE employee_id=7')).rows[0];
 for(const action of ['planned_transfer','planned_downgrade','planned_disable']){
  const r=await commitPlannedGovernance(auth,manager,{action,batchId:96601,employeeId:7,teamId:901});
  assert.equal(r.ok,false,JSON.stringify(r));
 }
 const now=(await c.query('SELECT employment_status,main_role_id,store_id FROM public.employees WHERE employee_id=7')).rows[0];assert.deepEqual(now,old);
});
test('G2 cannot let current employee self-govern or use absent Team capability',async()=>{
 const r=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:96601,employeeId:5,teamId:901});assert.equal(r.ok,false);
 const rr=await commitPlannedGovernance(auth,manager,{action:'planned_transfer',batchId:96601,employeeId:7,teamId:999});assert.equal(rr.ok,false);
});
test('G2 old receipts and N readonly does not magically authorize employee deactivation',async()=>{
 const before=(await c.query("SELECT count(*)::int n FROM public.handover_items WHERE batch_id=96601 AND status<>'completed'")).rows[0].n;
 assert.ok(before>0);
 const r=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:96601,employeeId:7,teamId:901});
 assert.equal(r.code,'G_PLANNED_NOT_CERTIFIED');
});


const close=async(batch,item)=>{
 const v=await commitHandoverItem(auth,manager,{batchId:batch,itemId:item,teamId:901,requestKey:'g2-current-completion-'+item+'-test'});
 assert.equal(v.code,'G_ITEM_COMPLETED',JSON.stringify(v));
 const x=await commitHandoverBatch(auth,manager,{batchId:batch,teamId:901,requestKey:'g2-current-batch-'+batch+'-test'});
 assert.equal(x.code,'G_BATCH_COMPLETED',JSON.stringify(x));
};
test('G2 genuine immutable M94 source 76 receipt and completed G batch gate planned employee disable',async()=>{
 await close(97001,17601);
 // A-G-01-b: forged current owner not backed by any successor receipt.
 const prior=(await c.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37601')).rows[0].current_owner_employee_id;
 const original=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=76')).rows[0];
 try{
  await c.query('UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=37601');
  const bad=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:97001,employeeId:76,teamId:901});
  assert.equal(bad.code,'G_PLANNED_UNPROVEN_RECEIPT_AUDIT',JSON.stringify(bad));
  assert.equal((await c.query('SELECT employment_status FROM public.employees WHERE employee_id=76')).rows[0].employment_status,original.employment_status);
 }finally{await c.query('UPDATE public.customers SET current_owner_employee_id=$1 WHERE customer_id=37601',[prior])}
 // A-G-01-d: current data-scope revoke independently blocks planned action.
 const cap=(await c.query('SELECT ended_at FROM public.employee_capability_scope_bindings WHERE employee_id=5 AND permission_id=13 AND scope_id=201')).rows[0];
 try{
  await c.query("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp()-interval '1 second' WHERE employee_id=5 AND permission_id=13 AND scope_id=201");
  const denied=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:97001,employeeId:76,teamId:901});
  assert.equal(denied.code,'G_PLANNED_NOT_CERTIFIED',JSON.stringify(denied));
 }finally{await c.query('UPDATE public.employee_capability_scope_bindings SET ended_at=$1 WHERE employee_id=5 AND permission_id=13 AND scope_id=201',[cap.ended_at])}
 // A-G-01-d: even after moving Customer ownership, a pending Refund for
 // this batch's customer must still block personnel governance.
 await c.query("INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES(99201,1001,37601,2001,'released',4,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '2 hours')");
 try{
  await c.query("INSERT INTO public.refund_cases(refund_id,customer_id,lock_id,status) VALUES(99201,37601,99201,'pending')");
  try{
   const denied=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:97001,employeeId:76,teamId:901});
   assert.equal(denied.code,'G_PLANNED_UNPROVEN_RECEIPT_AUDIT',JSON.stringify(denied));
  }finally{await c.query('DELETE FROM public.refund_cases WHERE refund_id=99201')}
 }finally{await c.query('DELETE FROM public.locks WHERE lock_id=99201')}
 // A-G-01-e: independent PostgreSQL session cannot alter the locked
 // customer's responsibility during G2's proof-to-commit interval.
 let racingWriteRejected=false;
 const r=await commitPlannedGovernance(auth,manager,{action:'planned_disable',batchId:97001,employeeId:76,teamId:901},{
  testCheckpoint:async(stage)=>{
   if(stage==='before_revoke'){
    const second=await connect();
    try{
     await second.query('BEGIN');
     await second.query("SET LOCAL lock_timeout='90ms'");
     await assert.rejects(()=>second.query('UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=37601'),e=>{racingWriteRejected=e.code==='55P03';return racingWriteRejected});
    }finally{await second.query('ROLLBACK');await second.end()}
   }
  }
 });
 assert.equal(racingWriteRejected,true);
 assert.equal(r.code,'G_PLANNED_APPLIED',JSON.stringify(r));
 const e=(await c.query('SELECT employment_status,receiving_status FROM public.employees WHERE employee_id=76')).rows[0];
 assert.equal(e.employment_status,'inactive');assert.equal(e.receiving_status,'paused');
 const pc=(await c.query('SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=76')).rows[0];
 assert.equal(pc.credential_state,'disabled');
 const a=(await c.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='employee' AND object_id='76' AND action='sg06.governance.planned_disable'")).rows[0].n;
 assert.equal(a,1);
});
test('G2 verified planned manager downgrade requires store head role and never resurrects old permissions',async()=>{
 await close(97002,17602);
 // A-G-01-c: 77→4→6 has two actual frozen H receipts/audits.
 assert.equal((await c.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37602')).rows[0].current_owner_employee_id,'6');
 assert.equal((await c.query('SELECT count(*)::int n FROM public.customer_owner_handover_receipts WHERE customer_id=37602')).rows[0].n,2);
 const originalOwner=(await c.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37602')).rows[0].current_owner_employee_id;
 try{
  await c.query('UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=37602');
  const wrong=await commitPlannedGovernance(auth,head,{action:'planned_downgrade',batchId:97002,employeeId:77,teamId:901});
  assert.equal(wrong.code,'G_PLANNED_UNPROVEN_RECEIPT_AUDIT',JSON.stringify(wrong));
  assert.equal((await c.query('SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=77')).rows[0].credential_state,'enabled');
 }finally{await c.query('UPDATE public.customers SET current_owner_employee_id=$1 WHERE customer_id=37602',[originalOwner])}
 const forbidden=await commitPlannedGovernance(auth,manager,{action:'planned_downgrade',batchId:97002,employeeId:77,teamId:901});
 assert.equal(forbidden.ok,false,JSON.stringify(forbidden));
 const r=await commitPlannedGovernance(auth,head,{action:'planned_downgrade',batchId:97002,employeeId:77,teamId:901});
 assert.equal(r.code,'G_PLANNED_APPLIED',JSON.stringify(r));
 const em=(await c.query('SELECT r.role_code,e.receiving_status FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=77')).rows[0];
 assert.equal(em.role_code,'sales');assert.equal(em.receiving_status,'paused');
 const creds=(await c.query('SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=77')).rows[0].credential_state;
 assert.equal(creds,'disabled');
});
test('G2 verified complete SG06 batch allows System Admin-only planned cross-store transfer, reissues no credential',async()=>{
 const wrong=await commitPlannedStoreTransferAsSystemAdmin(auth,manager,{batchId:97003,employeeId:78,targetStoreId:2,targetTeamId:906,reason:'CI cross store planned management'});
 assert.equal(wrong.code,'G_TRANSFER_CONTROL_PLANE_DENY');
 await close(97003,17603);
 const priorOwner=(await c.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37603')).rows[0].current_owner_employee_id;
 try{
  await c.query('UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=37603');
  const deny=await commitPlannedStoreTransferAsSystemAdmin(auth,admin,{batchId:97003,employeeId:78,targetStoreId:2,targetTeamId:906,reason:'refuse unattributed owner scope drift'});
  assert.equal(deny.code,'G_TRANSFER_UNPROVEN_LEDGER',JSON.stringify(deny));
  assert.equal((await c.query('SELECT store_id FROM public.employees WHERE employee_id=78')).rows[0].store_id,'1');
 }finally{await c.query('UPDATE public.customers SET current_owner_employee_id=$1 WHERE customer_id=37603',[priorOwner])}
 const r=await commitPlannedStoreTransferAsSystemAdmin(auth,admin,{batchId:97003,employeeId:78,targetStoreId:2,targetTeamId:906,reason:'synthetic approved planned crossstore transfer'});
 assert.equal(r.code,'G_TRANSFER_APPLIED',JSON.stringify(r));
 const emp=(await c.query('SELECT store_id,receiving_status FROM public.employees WHERE employee_id=78')).rows[0];
 assert.equal(Number(emp.store_id),2);assert.equal(emp.receiving_status,'paused');
 const team=(await c.query('SELECT changed_by_system_admin_id,ended_at FROM public.employee_team_memberships WHERE employee_id=78 AND team_id=906')).rows[0];
 assert.equal(Number(team.changed_by_system_admin_id),9);assert.equal(team.ended_at,null);
 const old=(await c.query('SELECT ended_at FROM public.employee_team_memberships WHERE employee_id=78 AND team_id=901')).rows[0];
 assert.ok(old.ended_at!==null);
 assert.equal((await c.query('SELECT credential_state FROM public.pc_login_accounts WHERE employee_id=78')).rows[0].credential_state,'disabled');
 assert.equal(await auth.withSession(oldStaffSession,async()=>true),null);
});
