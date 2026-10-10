// G1 actual 000014 PG16 verification, genuine preexisting H-M receipts.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {connect,verify} from '../migration.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {certifyHandoverItem,commitHandoverItem,commitHandoverBatch,readHandoverClosure} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
let token;
test.before(async()=>{const r=await auth.login({login:'http_test',password:'SyntheticN_2026_CI_Authority',source:'g1_current'});assert.equal(r.code,'AUTH_OK');token=r.token});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
const item=i=>({batchId:96601,itemId:i,teamId:901,requestKey:'g1-item-completion-'+i+'-2026'});
test('G1 only two authorized CHECK constraints changed, source M94 sha pinned',async()=>{
 const r=await verify(db);assert.equal(r.verified,true);assert.equal(r.objects,2120);
 const counts=await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'");assert.equal(counts.rows[0].n,94);
});
test('G1 genuine historical Demand receipt remains valid through a later proven recipient chain',async()=>{
 const result=await certifyHandoverItem(auth,token,{batchId:96601,itemId:13602,teamId:901});
 assert.equal(result.code,'G_ITEM_CERTIFIED',JSON.stringify(result));
 const newest=(await db.query('SELECT responsible_employee_id FROM public.demands WHERE demand_id=401')).rows[0];
 assert.equal(Number(newest.responsible_employee_id),5);
 const forged=await certifyHandoverItem(auth,token,{batchId:96602,itemId:13612,teamId:901});
 assert.equal(forged.ok,false);
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=13612')).rows[0].status,'retry_required');
});
test('G1 legal existing Customer immutable receipt can be completed once with audit and no domain mutation',async()=>{
 const r=await certifyHandoverItem(auth,token,{batchId:96601,itemId:13601,teamId:901});
 assert.equal(r.code,'G_ITEM_CERTIFIED',JSON.stringify(r));
 const old=(await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=301')).rows[0];
 const x=await commitHandoverItem(auth,token,item(13601));
 assert.equal(x.code,'G_ITEM_COMPLETED',JSON.stringify(x));
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=13601')).rows[0].status,'completed');
 assert.equal((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=301')).rows[0].current_owner_employee_id,old.current_owner_employee_id);
 const audits=await db.query("SELECT * FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13601' AND action='sg06.item.complete'");
 assert.equal(audits.rows.length,1);
});
test('A-G-01-d genuine Priority follows current Demand after its real second immutable receipt; expired lease or unaudited drift rejected',async()=>{
 const demand=await commitHandoverItem(auth,token,item(13602));
 assert.equal(demand.code,'G_ITEM_COMPLETED',JSON.stringify(demand));
 const lease=(await db.query('SELECT expires_at FROM public.priority_leases WHERE priority_id=5011')).rows[0];
 const current=(await db.query('SELECT responsible_employee_id FROM public.demands WHERE demand_id=401')).rows[0];
 assert.equal(Number(current.responsible_employee_id),5);
 const proven=await commitHandoverItem(auth,token,item(13603));
 assert.equal(proven.code,'G_ITEM_COMPLETED',JSON.stringify(proven));
 assert.equal((await db.query('SELECT expires_at FROM public.priority_leases WHERE priority_id=5011')).rows[0].expires_at.getTime(),lease.expires_at.getTime());
 const invalid=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13603' AND action='sg06.item.complete'")).rows[0].n;
 assert.equal(invalid,1);
 try{
  await db.query("UPDATE public.priority_leases SET expires_at=clock_timestamp()-interval '1 second' WHERE priority_id=5011");
  const denied=await certifyHandoverItem(auth,token,{batchId:96601,itemId:13603,teamId:901});
  assert.equal(denied.ok,false,JSON.stringify(denied));
 }finally{await db.query('UPDATE public.priority_leases SET expires_at=$1 WHERE priority_id=5011',[lease.expires_at])}
 try{
  await db.query('UPDATE public.demands SET responsible_employee_id=6 WHERE demand_id=401');
  const denied=await certifyHandoverItem(auth,token,{batchId:96601,itemId:13603,teamId:901});
  assert.equal(denied.ok,false,JSON.stringify(denied));
 }finally{await db.query('UPDATE public.demands SET responsible_employee_id=$1 WHERE demand_id=401',[current.responsible_employee_id])}
});
test('G1 retry identical request key idempotent; another key cannot duplicate audit',async()=>{
 const r=await commitHandoverItem(auth,token,item(13601));
 assert.equal(r.code,'G_ITEM_IDEMPOTENT');
 const different=await commitHandoverItem(auth,token,{...item(13601),requestKey:'g1-alternate-request-13601'});
 assert.equal(different.code,'G_ITEM_ALREADY_COMPLETED');
 const a=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13601' AND action='sg06.item.complete'")).rows[0].n;assert.equal(a,1);
});
test('G1 true partially completed batch cannot be promoted or disable employee',async()=>{
 const r=await commitHandoverBatch(auth,token,{batchId:96601,teamId:901,requestKey:'g1-batch-cannot-complete'});
 assert.equal(r.ok,false);
 const status=(await db.query('SELECT status FROM public.handover_batches WHERE batch_id=96601')).rows[0].status;
 assert.notEqual(status,'completed');
});
test('G1 fail-closed on unknown requester, Team and forged already-completed orphan item',async()=>{
 const r=await commitHandoverItem(auth,null,item(13604));assert.equal(r.ok,false);
 const deny=await commitHandoverItem(auth,token,{...item(13604),teamId:999});assert.equal(deny.ok,false);
 const snap=await readHandoverClosure(auth,token,{batchId:96601,teamId:901});
 assert.equal(snap.code,'G_BATCH_READ');
 assert.equal(snap.canDisable,false);
});
test('G1 after-CAS fault rolls back both completed and audit effects',async()=>{
 const before=(await db.query("SELECT status,attempt_count FROM public.handover_items WHERE item_id=13604")).rows[0];
 const count=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13604'")).rows[0].n;
 await assert.rejects(()=>commitHandoverItem(auth,token,item(13604),{testCheckpoint:async stage=>{if(stage==='after_cas')throw Error('G_SYNTHETIC_FAULT_AFTER_CAS')}}));
 const after=(await db.query("SELECT status,attempt_count FROM public.handover_items WHERE item_id=13604")).rows[0];
 assert.deepEqual(after,before);assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='13604'")).rows[0].n,count);
});


test('G1 real M94 Customer handover receipt now completes exactly one genuine new G item and batch',async()=>{
 const before=(await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37601')).rows[0];
 assert.equal(Number(before.current_owner_employee_id),4,'H old-domain receipt must already have moved current owner');
 const itemRequest={batchId:97001,itemId:17601,teamId:901,requestKey:'g-first-valid-item-17601'};
 const prepared=await certifyHandoverItem(auth,token,{batchId:97001,itemId:17601,teamId:901});
 assert.equal(prepared.code,'G_ITEM_CERTIFIED',JSON.stringify(prepared));
 const first=await commitHandoverItem(auth,token,itemRequest);
 assert.equal(first.code,'G_ITEM_COMPLETED',JSON.stringify(first));
 const retry=await commitHandoverItem(auth,token,itemRequest);
 assert.equal(retry.code,'G_ITEM_IDEMPOTENT',JSON.stringify(retry));
 assert.equal((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37601')).rows[0].current_owner_employee_id,before.current_owner_employee_id);
 const batchRequest={batchId:97001,teamId:901,requestKey:'g-first-valid-batch-97001'};
 const batch=await commitHandoverBatch(auth,token,batchRequest);
 assert.equal(batch.code,'G_BATCH_COMPLETED',JSON.stringify(batch));
 assert.equal((await commitHandoverBatch(auth,token,batchRequest)).code,'G_BATCH_IDEMPOTENT');
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='17601' AND action='sg06.item.complete'")).rows[0].n,1);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_batch' AND object_id='97001' AND action='sg06.batch.complete'")).rows[0].n,1);
 const bad=await commitHandoverBatch(auth,token,{...batchRequest,requestKey:'g-different-batch-idempotence'});
 assert.equal(bad.code,'G_BATCH_ALREADY_COMPLETED');
});
test('G1 committed batch cannot be forged as permission to act on a second pending SG06 batch',async()=>{
 const another=await commitHandoverBatch(auth,token,{batchId:97002,teamId:901,requestKey:'g-incorrect-crossbatch-completion'});
 assert.equal(another.ok,false,JSON.stringify(another));
 assert.notEqual((await db.query('SELECT status FROM public.handover_batches WHERE batch_id=97002')).rows[0].status,'completed');
});


test('G1 real PG16 final item guard detects source owner drift at before_commit and rolls back CAS and audit',async()=>{
 const row=(await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37602')).rows[0];
 const status=(await db.query('SELECT status FROM public.handover_items WHERE item_id=17602')).rows[0].status;
 const old=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='17602' AND action='sg06.item.complete'")).rows[0].n;
 const result=await commitHandoverItem(auth,token,{batchId:97002,itemId:17602,teamId:901,requestKey:'g1-beforecommit-drift-source'},{
  testCheckpoint:async(stage,c)=>{if(stage==='before_commit')await c.query('UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=37602')}
 });
 assert.equal(result.code,'G_CONCURRENT_ROLLBACK',JSON.stringify(result));
 assert.equal((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37602')).rows[0].current_owner_employee_id,row.current_owner_employee_id);
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=17602')).rows[0].status,status);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id='17602' AND action='sg06.item.complete'")).rows[0].n,old);
});
test('G1 real PG16 batch before_commit drift rolls back batch completion and appended audit',async()=>{
 const item=await commitHandoverItem(auth,token,{batchId:97002,itemId:17602,teamId:901,requestKey:'g1-legal-item-after-rollback'});
 assert.equal(item.code,'G_ITEM_COMPLETED',JSON.stringify(item));
 const before=(await db.query('SELECT status,version FROM public.handover_batches WHERE batch_id=97002')).rows[0];
 const result=await commitHandoverBatch(auth,token,{batchId:97002,teamId:901,requestKey:'g1-batch-fault-beforecommit'},{
  testCheckpoint:async(stage,c)=>{if(stage==='before_commit')await c.query('UPDATE public.customers SET current_owner_employee_id=5 WHERE customer_id=37602')}
 });
 assert.equal(result.code,'G_CONCURRENT_ROLLBACK',JSON.stringify(result));
 assert.deepEqual((await db.query('SELECT status,version FROM public.handover_batches WHERE batch_id=97002')).rows[0],before);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_batch' AND object_id='97002' AND action='sg06.batch.complete'")).rows[0].n,0);
 assert.equal(Number((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=37602')).rows[0].current_owner_employee_id),6);
});


test('G1 pending Refund for a customer after Customer owner moved blocks completed batch',async()=>{
 const r=await commitHandoverItem(auth,token,{batchId:97003,itemId:17603,teamId:901,requestKey:'g1-third-true-customer-receipt'});
 assert.equal(r.code,'G_ITEM_COMPLETED',JSON.stringify(r));
 await db.query("INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES(99003,1001,37603,2001,'released',4,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '2 hours')");
 try{
  await db.query("INSERT INTO public.refund_cases(refund_id,customer_id,lock_id,status) VALUES(99003,37603,99003,'pending')");
  try{
   const denial=await commitHandoverBatch(auth,token,{batchId:97003,teamId:901,requestKey:'g1-unpaid-refund-must-block'});
   assert.equal(denial.code,'G_PENDING_REFUND',JSON.stringify(denial));
   assert.notEqual((await db.query('SELECT status FROM public.handover_batches WHERE batch_id=97003')).rows[0].status,'completed');
  }finally{await db.query('DELETE FROM public.refund_cases WHERE refund_id=99003')}
 }finally{await db.query('DELETE FROM public.locks WHERE lock_id=99003')}
});
test('G1 two current managers cannot both close one batch with different request keys',async()=>{
 const adminSession=(await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'g1_second_manager'})).token;
 assert.ok(adminSession);
 const attempts=await Promise.all([
  commitHandoverBatch(auth,token,{batchId:97003,teamId:901,requestKey:'g1-race-0001'}),
  commitHandoverBatch(auth,adminSession,{batchId:97003,teamId:901,requestKey:'g1-race-0002'})
 ]);
 const winners=attempts.filter(x=>x.code==='G_BATCH_COMPLETED');
 assert.equal(winners.length,1,JSON.stringify(attempts));
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_batch' AND object_id='97003' AND action='sg06.batch.complete'")).rows[0].n,1);
});


test('G1 a legitimate H domain receipt key cannot be reused to create SG06 completion audit',async()=>{
 const item=(await db.query('SELECT status FROM public.handover_items WHERE item_id=13604')).rows[0];
 assert.equal(item.status,'pending');
 const result=await commitHandoverItem(auth,token,{batchId:96601,itemId:13604,teamId:901,requestKey:'g-m94-genuine-source-97001'});
 assert.equal(result.code,'G_GLOBAL_REQUEST_KEY_COLLISION',JSON.stringify(result));
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=13604')).rows[0].status,'pending');
});
test('G1 a different manager cannot replay original committed item with copied requestKey',async()=>{
 const second=(await auth.login({login:'race_test',password:'SyntheticRace_1234567',source:'g1_replay_foreign_manager'})).token;
 const result=await commitHandoverItem(auth,second,{batchId:97001,itemId:17601,teamId:901,requestKey:'g-first-valid-item-17601'});
 assert.equal(result.ok,false,JSON.stringify(result));
});
