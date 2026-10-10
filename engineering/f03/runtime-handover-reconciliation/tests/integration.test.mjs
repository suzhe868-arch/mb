// F03-2-2N: genuine PG16 read-only receipt evidence tests, CI-only synthetic records.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../../runtime-transaction-responsible-handover/migration.mjs';
import {reconcileHandoverBatchReadOnly as reconcile} from '../service.mjs';
import {commitCustomerOwnerHandover as H} from '../../runtime-customer-owner-handover/service.mjs';
import {commitDemandResponsibleHandover as I} from '../../runtime-demand-responsible-handover/service.mjs';
import {commitConsultationAssigneeHandover as J} from '../../runtime-consultation-assignee-handover/service.mjs';
import {commitWaitlistResponsibleHandover as K} from '../../runtime-waitlist-responsible-handover/service.mjs';
import {commitLockResponsibleHandover as L} from '../../runtime-lock-responsible-handover/service.mjs';
import {commitTransactionResponsibleHandover as M} from '../../runtime-transaction-responsible-handover/service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const pw={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],other:['limit_test','SyntheticLimit_1234567'],four:['four_s_test','SyntheticFourS_123456'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async who=>{const [username,password]=pw[who];const x=await auth.login({login:username,password,source:'n_'+who+'_'+Math.random()});assert.equal(x.code,'AUTH_OK');return x};
let manager,head,restricted,other,four,admin;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const x=await login('manager');restricted=x.token;
 assert.equal((await auth.change({token:x.token,csrf:x.csrf,oldPassword:pw.manager[1],newPassword:'SyntheticN_2026_CI_Authority'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 pw.manager[1]='SyntheticN_2026_CI_Authority';
 manager=(await login('manager')).token;head=(await login('head')).token;other=(await login('other')).token;four=(await login('four')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
const p=(batch=96601,team=901)=>({batchId:batch,teamId:team});
const act=(i,k)=>({batchId:96601,itemId:i,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k});
const snapTables=['handover_batches','handover_items','customer_owner_history','audit_events','customers','demands','priority_leases','consultations','waitlists','locks','transactions','deposit_receipts','refund_cases','refund_payments','recommendations','vehicle_visibility_grants','customer_owner_handover_receipts','demand_responsible_handover_receipts','consultation_assignee_handover_receipts','waitlist_responsible_handover_receipts','lock_responsible_handover_receipts','transaction_responsible_handover_receipts'];
async function snapshot(){let x={};for(const t of snapTables)x[t]=(await db.query('SELECT to_jsonb(t)::text x FROM public.'+t+' t ORDER BY to_jsonb(t)::text')).rows.map(r=>r.x);return x}
const row=(r,k)=>r.items.find(x=>x.kind===k);
test('N01 approved M94 exact full immutable catalog seal and no N DDL',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,94);
});
test('N02 no session, restricted, sales, 4S and System Admin do not access seven kind report',async()=>{
 for(const t of [null,restricted,other,four,admin])assert.notEqual((await reconcile(auth,t,p())).code,'N03_RECONCILED_READ_ONLY');
});
test('N03 seven objects and six missing domain receipts are strictly reported pending; Priority derived not invented',async()=>{
 const before=await snapshot(),r=await reconcile(auth,manager,p());
 assert.equal(r.code,'N03_RECONCILED_READ_ONLY',JSON.stringify(r));
 assert.equal(r.items.length,7);assert.equal(row(r,'Priority').status,'DERIVATION_UNPROVEN');
 for(const k of ['Customer','Demand','Consultation','Waitlist','Lock','Transaction'])assert.equal(row(r,k).status,'NEEDS_DOMAIN_HANDOVER',k);
 assert.equal(r.observedReadOnlyState,'DEFER_DENY');assert.equal(r.batchCloseAuthorized,false);assert.equal(r.employeeDisableAuthorized,false);
 assert.deepEqual(await snapshot(),before);
});
test('N02 current manager Team permission deny, wrong team, inactive account and store-head data scope fail closed',async()=>{
 const before=await snapshot();
 assert.notEqual((await reconcile(auth,head,p())).items?.some(x=>x.status==='PROVEN_RECEIPT'),true);
 const wrong=await reconcile(auth,manager,p(96601,906));assert.equal(wrong.items.every(x=>x.status==='OUT_OF_SCOPE'||x.status==='DERIVATION_UNPROVEN'),true);
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=20");
 try{assert.equal(row(await reconcile(auth,manager,p()),'Transaction').status,'OUT_OF_SCOPE')}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=20")}
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5");
 try{assert.notEqual((await reconcile(auth,manager,p())).code,'N03_RECONCILED_READ_ONLY')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=5")}
 assert.deepEqual(await snapshot(),before);
});
test('N04 all six domain original authentic commits get six immutable linked audits and original Priority derived from Demand only',async()=>{
 const cases=[[H,13601,'H03_OWNER_DOMAIN_TRANSFERRED'],[I,13602,'I04_DEMAND_DOMAIN_TRANSFERRED'],[J,13604,'J04_CONSULTATION_TRANSFERRED'],[K,13605,'K04_WAITLIST_TRANSFERRED'],[L,13606,'L04_LOCK_TRANSFERRED'],[M,13607,'M04_TRANSACTION_TRANSFERRED']];
 for(const [idx,[fn,item,expect]] of cases.entries()){
  const r=await fn(auth,manager,act(item,'n-seven-real-receipt-'+idx+'-2026'));assert.equal(r.code,expect,JSON.stringify(r));
 }
 const before=await snapshot(),r=await reconcile(auth,manager,p());
 assert.equal(r.code,'N03_RECONCILED_READ_ONLY',JSON.stringify(r));
 for(const k of ['Customer','Demand','Consultation','Waitlist','Lock','Transaction']){const x=row(r,k);assert.equal(x.status,'PROVEN_RECEIPT',JSON.stringify(x));assert.ok(x.receiptId>0&&x.auditId>0)}
 assert.equal(row(r,'Priority').status,'PRIORITY_DERIVED_ONLY',JSON.stringify(row(r,'Priority')));
 assert.equal(r.observedReadOnlyState,'DEFER_DENY'); // true pending refund in distinct source-owned customer
 assert.equal(r.batchCloseAuthorized,false);assert.equal(r.globalReady,false);assert.deepEqual(await snapshot(),before);
});
test('N04 append-only audit cannot be tampered and reconciler creates no new audit history',async()=>{
 const before=await snapshot(),id=(await db.query('SELECT audit_id FROM public.consultation_assignee_handover_receipts WHERE item_id=13604')).rows[0].audit_id;
 await assert.rejects(()=>db.query("UPDATE public.audit_events SET action='fake.cross.domain' WHERE audit_id=$1",[id]),e=>e.message?.includes('F02_HISTORY_APPEND_ONLY'));
 const report=await reconcile(auth,manager,p());
 assert.equal(row(report,'Consultation').status,'PROVEN_RECEIPT');
 assert.deepEqual(await snapshot(),before);
});
test('N05 orphan/mismatched ledger item with same object cannot claim historical receipt',async()=>{
 const before=await snapshot(),r=await reconcile(auth,manager,p(96602));
 assert.equal(r.observedReadOnlyState,'DEFER_DENY');assert.equal(r.items.length,3);
 assert.equal(row(r,'Priority').status,'BLOCKED');
 assert.deepEqual(await snapshot(),before);
});
test('N05 multi-handover chain records genuine subsequent Demand recipient, without changing Priority TTL',async()=>{
 const old=(await db.query('SELECT expires_at FROM public.priority_leases WHERE priority_id=5011')).rows[0].expires_at;
 await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(96603,4,'planned_transfer','employee',5,'n-subsequent-chain-96603','CI independent second Demand owner transfer')");
 await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(13620,96603,'Demand','401',4,5)");
 const r=await I(auth,manager,{batchId:96603,itemId:13620,fromEmployeeId:4,recipientEmployeeId:5,teamId:901,clientRequestKey:'n-valid-second-demand-96603'});
 assert.equal(r.code,'I04_DEMAND_DOMAIN_TRANSFERRED',JSON.stringify(r));
 const report=await reconcile(auth,manager,p());
 assert.equal(row(report,'Demand').status,'PROVEN_RECEIPT');
 assert.equal(row(report,'Priority').status,'DERIVATION_UNPROVEN'); // Priority old intended recipient no longer current
 assert.equal((await db.query('SELECT expires_at FROM public.priority_leases WHERE priority_id=5011')).rows[0].expires_at.getTime(),old.getTime());
});
test('N06 true partial pending/retry/blocked cannot claim completed ledger; read-only unchanged',async()=>{
 const before=await snapshot(),r=await reconcile(auth,manager,p(96602));
 assert.equal(r.observedReadOnlyState,'DEFER_DENY');assert.equal(r.batchCloseAuthorized,false);assert.equal(row(r,'Priority').status,'BLOCKED');
 assert.deepEqual(await snapshot(),before);
});
test('N07 current customer/other domains do not drift from unrelated receipt; no new audit from reconcile',async()=>{
 const before=await snapshot();await reconcile(auth,manager,p());await reconcile(auth,manager,p(96602));assert.deepEqual(await snapshot(),before);
});
test('N08 source scope revoked at final guard produces no optimistic completion',async()=>{
 const before=await snapshot();
 const r=await reconcile(auth,manager,p(),{testCheckpoint:async(stage,c)=>{
  if(stage==='before_last_guard')await c.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=20");
 }});
 assert.equal(r.code,'N08_DRIFT_DEFER_DENY');
 assert.equal(r.batchCloseAuthorized,false);
 assert.deepEqual(await snapshot(),before);
});
test('N09 cannot forge completed SG06 states with old pending-only CHECK',async()=>{
 await assert.rejects(()=>db.query("UPDATE public.handover_batches SET status='completed' WHERE batch_id=96601"),e=>e.code==='23514');
 await assert.rejects(()=>db.query("UPDATE public.handover_items SET status='completed' WHERE item_id=13601"),e=>e.code==='23514');
});
