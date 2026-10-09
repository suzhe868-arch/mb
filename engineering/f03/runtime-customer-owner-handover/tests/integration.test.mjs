import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback} from '../migration.mjs';
import {verify as verifyOld} from '../../runtime-handover-ledger/migration.mjs';
import {prepareCustomerOwnerHandover as prep,commitCustomerOwnerHandover as commit,retryCustomerOwnerHandover as retry,readCustomerOwnerHandoverReceipt as read} from '../service.mjs';

const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48980'});
const cred={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [user,password]=cred[type];const r=await auth.login({login:user,password,source:'h_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
let manager,manager2,head,admin,four,ordinary,restricted;
const p=(batchId=6001,itemId=7001,recipientEmployeeId=4,key='h-ci-owner-commit-00001')=>({batchId,itemId,fromEmployeeId:7,recipientEmployeeId,teamId:901,clientRequestKey:key});
const view=(batchId=6001,itemId=7001)=>({batchId,itemId,teamId:901});
const snapTables=['customers','customer_owner_history','customer_owner_handover_receipts','audit_events','handover_batches','handover_items','demands','priority_leases','recommendations','consultations','waitlists','locks','transactions','employee_permission_overrides','employee_data_scopes','employee_capability_scope_bindings','employee_receiving_eligibility','employees'];
const snapshot=async()=>{const o={};for(const t of snapTables)o[t]=(await db.query('SELECT to_jsonb(x)::text body FROM public.'+t+' x ORDER BY to_jsonb(x)::text')).rows.map(x=>x.body);return o};
const owner=async id=>String((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[id])).rows[0].current_owner_employee_id);
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const r=await login('manager');assert.equal(r.restricted,true);restricted=r.token;
 assert.equal((await auth.change({token:r.token,csrf:r.csrf,oldPassword:cred.manager[1],newPassword:'SyntheticH2CustomerOwner_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 cred.manager[1]='SyntheticH2CustomerOwner_2026';
 manager=(await login('manager')).token;manager2=(await login('manager')).token;head=(await login('head')).token;four=(await login('four')).token;ordinary=(await login('ordinary')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('H01 exact genuine PG16 000008 89-table new-only Guard; frozen 88-table verifier continues DENY',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,89);
 assert.equal((await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1")).rows[0].migration_id,'000008_customer_owner_handover_receipts');
 await assert.rejects(()=>verifyOld(db),/F03_2E_(VERSION_DRIFT|SCHEMA_DENY)/);
});
test('H02 permission independently registered and only explicitly bound, never employee.manage or default manager',async()=>{
 const before=await snapshot();
 assert.equal((await db.query("SELECT permission_id FROM public.permissions WHERE permission_code='customer.owner.transfer'")).rows[0].permission_id,'15');
 for(const token of [admin,four,ordinary,restricted,null,'A'.repeat(43)]){
  assert.notEqual((await prep(auth,token,p())).code,'H01_PREPARED_READ_ONLY');
  assert.notEqual((await commit(auth,token,p())).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 }
 const dead=(await login('manager')).token;await auth.logout(dead);
 assert.notEqual((await commit(auth,dead,p())).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal((await prep(auth,head,p())).code,'H02_BATCH_IDENTITY_DENY');
 assert.deepEqual(await snapshot(),before);
});
test('H01 prepare only current Customer owner, exact batch item/current Team scope and eligible receiver; no reusable token',async()=>{
 const before=await snapshot();
 const x=await prep(auth,manager,p());
 assert.equal(x.code,'H01_PREPARED_READ_ONLY');
 assert.equal(x.reusableCommitToken,false);assert.equal(x.otherDomainsPending,true);
 for(const bad of [{...p(),itemId:7005},{...p(),recipientEmployeeId:6},{...p(),teamId:903},{...p(),actorKind:'employee'},{...p(),batchId:6002}]){
  assert.notEqual((await prep(auth,manager,bad)).code,'H01_PREPARED_READ_ONLY');
 }
 assert.deepEqual(await snapshot(),before);
});
test('H02 deny revoked personal permission, expired Team binder, expired source member, target not receiving, same-store scope-only',async()=>{
 const before=await snapshot();
 const mutate=[
  ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=15","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=15"],
  ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND scope_id=201 AND permission_id=15","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND scope_id=201 AND permission_id=15"],
  ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=7 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=7 AND team_id=901"],
  ["UPDATE public.employees SET receiving_status='paused' WHERE employee_id=4","UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=4"],
  ["UPDATE public.employee_receiving_eligibility SET eligible=false WHERE employee_id=4","UPDATE public.employee_receiving_eligibility SET eligible=true WHERE employee_id=4"]
 ];
 for(const [set,restore] of mutate){
  await db.query(set);
  try{assert.notEqual((await commit(auth,manager,p())).code,'H03_OWNER_DOMAIN_TRANSFERRED');}
  finally{await db.query(restore)}
 }
 assert.deepEqual(await snapshot(),before);
});
test('H04 inject before/after owner/history/receipt/audit/pre-commit: all domain, history, audit and receipt roll back atomically',async()=>{
 for(const stage of ['before_owner_update','after_owner_update','after_history','after_receipt','after_audit','before_commit']){
  const before=await snapshot();
  await assert.rejects(()=>commit(auth,manager,p(),{testCheckpoint:async at=>{if(at===stage)throw Error('H_FAULT_'+stage)}}),new RegExp('H_FAULT_'+stage));
  assert.equal(await owner(301),'7');
  assert.deepEqual(await snapshot(),before);
 }
});
test('H03 exactly one synthetic Customer Owner real transaction; history, audit and receipt all linked; other seven domains and source metadata unchanged',async()=>{
 const before=await snapshot();
 const r=await commit(auth,manager,p());assert.equal(r.code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal(await owner(301),'4');
 const receipt=r.receipt;assert.equal(receipt.customerOwnerDomainTransferred,true);assert.equal(receipt.otherDomainsCompleted,false);assert.equal(receipt.batchCompleted,false);
 const now=await snapshot();
 for(const t of ['handover_batches','handover_items','demands','priority_leases','recommendations','consultations','waitlists','locks','transactions','employees','employee_permission_overrides','employee_data_scopes','employee_capability_scope_bindings'])assert.deepEqual(now[t],before[t],t+' must be unaffected by a successful single-domain receipt');
 assert.equal(now.customer_owner_history.length,before.customer_owner_history.length+1);
 assert.equal(now.customer_owner_handover_receipts.length,before.customer_owner_handover_receipts.length+1);
 assert.equal(now.audit_events.length,before.audit_events.length+1);
 const hist=(await db.query('SELECT * FROM public.customer_owner_history WHERE owner_history_id=$1',[receipt.ownerHistoryId])).rows[0];
 const aud=(await db.query('SELECT * FROM public.audit_events WHERE audit_id=$1',[receipt.auditId])).rows[0];
 assert.equal(String(hist.from_employee_id),'7');assert.equal(String(hist.to_employee_id),'4');assert.equal(aud.actor_kind,'employee');assert.equal(aud.actor_id,'5');assert.equal(aud.action,'customer.owner.handover');
 const proof=await read(auth,manager,view());assert.equal(proof.code,'H04_RECEIPT_READ_ONLY');assert.deepEqual(proof.receipt,receipt);
});
test('H04 identical item/key exact retry idempotent; mismatched key/batch/recipient/sender fail closed and old receipt unchanged',async()=>{
 const before=await snapshot();
 const r=await retry(auth,manager2,p());assert.equal(r.code,'H04_IDEMPOTENT_RECEIPT');assert.equal(r.idempotent,true);
 assert.equal((await commit(auth,manager,p())).code,'H04_IDEMPOTENT_RECEIPT');
 assert.equal((await retry(auth,manager,p(6001,7001,4,'h-ci-other-key-00001'))).code,'H04_COLLISION_DENY');
 assert.notEqual((await retry(auth,manager,{...p(),recipientEmployeeId:6})).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal((await prep(auth,manager,p())).code,'H01_OWNER_NOT_SOURCE');
 assert.deepEqual(await snapshot(),before);
});
test('H04 receipt/history immutable DB triggers reject update and delete; no ledger completed state',async()=>{
 const before=await snapshot();
 const r=(await db.query("SELECT receipt_id FROM public.customer_owner_handover_receipts WHERE item_id=7001")).rows[0].receipt_id;
 for(const query of ["UPDATE public.customer_owner_handover_receipts SET to_employee_id=6 WHERE receipt_id="+r,"DELETE FROM public.customer_owner_handover_receipts WHERE receipt_id="+r,"UPDATE public.customer_owner_history SET change_reason='fake' WHERE customer_id=301"])
  await assert.rejects(()=>db.query(query),/F02_HISTORY_APPEND_ONLY/);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.handover_items WHERE status='completed'")).rows[0].n,0);
 assert.deepEqual(await snapshot(),before);
});
test('H03 two independent real PG16 PC actors concurrently compete to transfer Customer302: exactly one winner and one immutable receipt',async()=>{
 const a=p(6003,7003,4,'h-ci-race-manager-00003'),b=p(6005,7006,6,'h-ci-race-head-00006');
 const before=await snapshot();
 const [x,y]=await Promise.all([commit(auth,manager,a),commit(auth,head,b)]);
 const winners=[x,y].filter(v=>v.code==='H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal(winners.length,1);
 assert.equal([4,6].includes(Number(await owner(302))),true);
 const r=(await db.query("SELECT count(*)::int n FROM public.customer_owner_handover_receipts WHERE customer_id=302")).rows[0].n;assert.equal(r,1);
 const histories=(await db.query('SELECT count(*)::int n FROM public.customer_owner_history WHERE customer_id=302')).rows[0].n;assert.equal(histories,1);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Customer' AND object_id='302' AND action='customer.owner.handover'")).rows[0].n,1);
 assert.equal((await db.query("SELECT count(*)::int n FROM public.handover_items WHERE status='pending'")).rows[0].n,(before.handover_items.length));
});
test('H01 sudden_inactive verified existing Customer batch permits only legal current-scope read when source has become inactive',async()=>{
 const before=await snapshot();
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  const r=await prep(auth,manager,p(6007,7008,4,'h-ci-sudden-preview-00007'));
  assert.equal(r.code,'H01_PREPARED_READ_ONLY');assert.equal(r.sourceInactive,true);assert.equal(r.reusableCommitToken,false);
  await db.query("UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=7 AND team_id=901");
  try{assert.equal((await prep(auth,manager,p(6007,7008,4,'h-ci-sudden-preview-00007'))).code,'H02_CUSTOMER_OWNER_PERMISSION_DENY');}
  finally{await db.query("UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=7 AND team_id=901")}
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 assert.deepEqual(await snapshot(),before);
});
test('H02 sudden inactive source cannot write without approved batch/Team; planned disable source preserves secured one-domain handover',async()=>{
 const before=await snapshot();
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  assert.notEqual((await commit(auth,manager,p(6001,7001,4))).code,'H03_OWNER_DOMAIN_TRANSFERRED');
  const r=await commit(auth,manager,p(6004,7004,4,'h-ci-planned-disable-00004'));
  assert.equal(r.code,'H03_OWNER_DOMAIN_TRANSFERRED');assert.equal(r.receipt.otherDomainsCompleted,false);
  assert.equal(await owner(304),'4');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 const after=await snapshot();
 for(const t of ['demands','recommendations','priority_leases','consultations','locks','transactions','waitlists','handover_batches','handover_items'])assert.deepEqual(after[t],before[t]);
});
test('H02 legal store_head must have separately bound store scope and cannot borrow team employee.manage',async()=>{
 const before=await snapshot();
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=6 AND scope_id=204 AND permission_id=15");
 try{
  const r=await commit(auth,head,p(6008,7009,4,'h-ci-store-head-000008'));
  assert.equal(r.code,'H03_OWNER_DOMAIN_TRANSFERRED');
  assert.equal(String(r.receipt.actorEmployeeId),'6');
  assert.equal(await owner(306),'4');
  assert.equal((await read(auth,head,view(6008,7009))).code,'H04_RECEIPT_READ_ONLY');
 }finally{await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=6 AND scope_id=204 AND permission_id=15")}
 const after=await snapshot();
 for(const table of ['demands','recommendations','priority_leases','consultations','waitlists','locks','transactions','handover_batches','handover_items'])assert.deepEqual(after[table],before[table],table);
});
test('H04 rollback after receipt usage denied, checksum tamper and extra schema fail closed',async()=>{
 await assert.rejects(()=>rollback(db),/H_RECEIPT_USED_ROLLBACK_DENY/);
 const old=(await db.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000008_customer_owner_handover_receipts'")).rows[0].checksum;
 await db.query("UPDATE public.f03_schema_migrations SET checksum='TAMPER' WHERE migration_id='000008_customer_owner_handover_receipts'");
 try{await assert.rejects(()=>verify(db),/H_000008_VERSION_TAMPER/);}
 finally{await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000008_customer_owner_handover_receipts'",[old])}
 await db.query('CREATE SCHEMA f03_h_illegal');
 try{await assert.rejects(()=>verify(db),/H_ISOLATION_DENY/)}
 finally{await db.query('DROP SCHEMA f03_h_illegal')}
 assert.equal((await verify(db)).verified,true);
});

test('H06 FK-valid fabricated receipt and unrelated audit/history do NOT constitute Customer Owner transfer',async()=>{
 const original=await owner(305);
 const fakeBatch=6006,fakeItem=7007;
 await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(6006,7,'planned_transfer','employee',5,'h-ci-forgery-batch-6006','CI forged receipt negative')");
 await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(7007,6006,'Customer','305',7,4)");
 const h=BigInt((await db.query('SELECT COALESCE(MAX(owner_history_id),0)::bigint+1 n FROM public.customer_owner_history')).rows[0].n);
 await db.query("INSERT INTO public.customer_owner_history(owner_history_id,customer_id,from_employee_id,to_employee_id,changed_at,change_reason) VALUES($1,305,7,4,transaction_timestamp(),'CI forged unrelated history proof')",[h.toString()]);
 const fakeAudit=(await db.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee','5','Customer','305','pc_password_self_change','{}'::jsonb,'{}'::jsonb,transaction_timestamp()) RETURNING audit_id")).rows[0].audit_id;
 const req=p(fakeBatch,fakeItem,4,'h-ci-forged-key-000006');
 const fakeDigest=await import('node:crypto').then(m=>m.createHash('sha256').update(req.clientRequestKey).digest('hex'));
 await db.query("INSERT INTO public.customer_owner_handover_receipts(item_id,batch_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,owner_history_id,audit_id,request_key_sha256) VALUES(7007,6006,305,7,4,5,901,$1,$2,$3)",[h.toString(),fakeAudit,fakeDigest]);
 assert.equal((await read(auth,manager,view(fakeBatch,fakeItem))).code,'H04_RECEIPT_PROOF_DENY');
 assert.equal((await retry(auth,manager,req)).code,'H04_RECEIPT_PROOF_DENY');
 assert.equal((await commit(auth,manager,req)).code,'H04_RECEIPT_PROOF_DENY');
 assert.equal(await owner(305),original);
 assert.equal((await db.query('SELECT status FROM public.handover_items WHERE item_id=7007')).rows[0].status,'pending');
 // Forged rows are deliberately retained only in this disposable PG16 test database:
 // genuine append-only history/receipt triggers correctly forbid removal or rewriting.
});
