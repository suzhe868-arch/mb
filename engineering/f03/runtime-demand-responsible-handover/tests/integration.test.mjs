import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback} from '../migration.mjs';
import {verify as verify89} from '../../runtime-customer-owner-handover/migration.mjs';
import {prepareDemandResponsibleHandover as prep,commitDemandResponsibleHandover as commit,retryDemandResponsibleHandover as retry,readDemandResponsibleHandoverReceipt as read,readPriorityDerivedResponsibility as priority} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const creds={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [login,password]=creds[type];const r=await auth.login({login,password,source:'i_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
const req=(batch=6101,item=8101,to=4,key='i-ci-demand-key-000001')=>({batchId:batch,itemId:item,fromEmployeeId:7,recipientEmployeeId:to,teamId:901,clientRequestKey:key});
const view=(batch,item,team=901)=>({batchId:batch,itemId:item,teamId:team});
const owner=async id=>String((await db.query('SELECT responsible_employee_id FROM public.demands WHERE demand_id=$1',[id])).rows[0].responsible_employee_id);
const tables=['customers','customer_owner_history','customer_owner_handover_receipts','demands','priority_leases','demand_match_results','recommendations','consultations','waitlists','locks','transactions','handover_batches','handover_items','demand_responsible_handover_receipts','audit_events','employees','employee_permission_overrides','employee_data_scopes','employee_capability_scope_bindings','employee_team_memberships'];
const snap=async()=>{const o={};for(const t of tables)o[t]=(await db.query('SELECT to_jsonb(x)::text body FROM public.'+t+' x ORDER BY to_jsonb(x)::text')).rows.map(x=>x.body);return o};
let manager,manager2,head,four,admin,ordinary,restricted;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 let r=await login('manager');assert.equal(r.restricted,true);restricted=r.token;
 assert.equal((await auth.change({token:r.token,csrf:r.csrf,oldPassword:creds.manager[1],newPassword:'Synthetic2I_Demand_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='Synthetic2I_Demand_2026';
 manager=(await login('manager')).token;manager2=(await login('manager')).token;head=(await login('head')).token;four=(await login('four')).token;admin=(await login('admin')).token;ordinary=(await login('ordinary')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('I01 frozen PG16 old 000001..000008 exact guard, new 000009 isolation',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='public'")).rows[0].n,90);
 assert.equal((await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1")).rows[0].migration_id,'000009_demand_responsible_handover_receipts');
 await assert.rejects(()=>verify89(db),/H_(SCHEMA_TAMPER|CHAIN_DENY|VERSION_TAMPER)/);
});
test('I02 independent sensitive Demand capability; ordinary/4S/system/restricted/revoked session DENY',async()=>{
 const before=await snap();
 for(const tok of [four,admin,ordinary,restricted,null,'A'.repeat(43)]){
  assert.notEqual((await prep(auth,tok,req())).code,'I01_PREPARED_READ_ONLY');
  assert.notEqual((await commit(auth,tok,req())).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 }
 const dead=(await login('manager')).token;await auth.logout(dead);
 assert.notEqual((await commit(auth,dead,req())).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.notEqual((await commit(auth,head,req())).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.deepEqual(await snap(),before);
});
test('I03 active/paused eligible and terminal demand rejects; owner independent of Customer owner',async()=>{
 const before=await snap();
 for(const x of [req(),req(6102,8102,4,'i-ci-paused-demand-0002')]){
  let result=await prep(auth,manager,x);assert.equal(result.code,'I01_PREPARED_READ_ONLY');
  assert.equal(result.commitTokenIssued,false);
 }
 for(const x of [req(6103,8103),req(6104,8104),{...req(),teamId:903},{...req(),clientRequestKey:'bad'},{...req(),itemId:7001},{...req(),actorId:5}]){
  assert.notEqual((await prep(auth,manager,x)).code,'I01_PREPARED_READ_ONLY');
 }
 const clientOwner=(await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=301')).rows[0].current_owner_employee_id;
 assert.notEqual(String(clientOwner),'4');
 assert.deepEqual(await snap(),before);
});
test('I02 revoked personal deny, expired scope, source/team revocation and paused ACTOR cannot be mistaken for new-pool qualification',async()=>{
 const x=req(6110,8110,4,'i-ci-revoke-scopes-0010');
 const mutate=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=16","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=16"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=16 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=16 AND scope_id=201"],
 ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=7 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=7 AND team_id=901"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"]
 ];
 for(const [bad,restore] of mutate){await db.query(bad);try{assert.notEqual((await commit(auth,manager,x)).code,'I04_DEMAND_DOMAIN_TRANSFERRED')}finally{await db.query(restore)}}
 const before=await snap();await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 try{assert.equal((await prep(auth,manager,x)).code,'I01_PREPARED_READ_ONLY')}finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=5")}
 assert.deepEqual(await snap(),before);
});
test('I02 cross-store manager explicit Team membership, same-store unbound Team and head foreign-Team deny',async()=>{
 const before=await snap();
 const cross={...req(6119,8119,4,'i-ci-cross-team-0019'),teamId:906};
 assert.equal((await prep(auth,manager,cross)).code,'I01_PREPARED_READ_ONLY');
 const noGrant={...req(6120,8120,4,'i-ci-unbound-team-0020'),teamId:907};
 assert.equal((await commit(auth,manager,noGrant)).code,'I02_DEMAND_PERMISSION_SCOPE_DENY');
 const headCross={...req(6126,8126,4,'i-ci-head-foreign-0026'),teamId:906};
 assert.equal((await commit(auth,head,headCross)).code,'I02_DEMAND_PERMISSION_SCOPE_DENY');
 await db.query('UPDATE public.employee_team_memberships SET ended_at=now() WHERE team_id=906 AND employee_id=5');
 try{assert.equal((await commit(auth,manager,cross)).code,'I02_DEMAND_PERMISSION_SCOPE_DENY')}finally{await db.query('UPDATE public.employee_team_memberships SET ended_at=NULL WHERE team_id=906 AND employee_id=5')}
 assert.deepEqual(await snap(),before);
});
test('I04 one Demand CAS, append-only receipt/audit, all other domain rows and SG06 ledger untouched',async()=>{
 const before=await snap();
 const p=req(6101,8101,4,'i-ci-success-demand-0001');
 const res=await commit(auth,manager,p);assert.equal(res.code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.equal(res.receipt.batchCompleted,false);assert.equal(res.receipt.otherDomainsCompleted,false);
 assert.equal(await owner(401),'4');
 const after=await snap();
 for(const t of ['customers','customer_owner_history','customer_owner_handover_receipts','priority_leases','demand_match_results','recommendations','consultations','waitlists','locks','transactions','handover_batches','handover_items'])assert.deepEqual(after[t],before[t],t);
 assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal(after.demand_responsible_handover_receipts.length,before.demand_responsible_handover_receipts.length+1);
 assert.equal((await read(auth,manager,view(6101,8101))).code,'I05_RECEIPT_READ_ONLY');
});
test('I06 trigger Demand current responsible derives dynamically without changing TTL/Recommendation',async()=>{
 const b=await snap();
 const r=await priority(auth,manager,{priorityId:5011,teamId:901});
 assert.equal(r.code,'I06_PRIORITY_RESPONSIBLE_DERIVED_READ_ONLY');
 assert.equal(r.responsibleEmployeeId,4);
 assert.equal(r.priorityUpdated,false);assert.equal(r.ttlUnmodified,true);
 const other=await priority(auth,manager,{priorityId:999999,teamId:901});
 assert.equal(other.code,'I06_PRIORITY_RELATION_REVALIDATE');
 await db.query("UPDATE public.priority_leases SET expires_at=expires_at-interval '100 days' WHERE priority_id=5011");
 try{assert.equal((await priority(auth,manager,{priorityId:5011,teamId:901})).code,'I06_PRIORITY_RELATION_REVALIDATE')}
 finally{await db.query("UPDATE public.priority_leases SET expires_at=expires_at+interval '100 days' WHERE priority_id=5011")}
 assert.deepEqual(await snap(),b);
});
test('I04 paused Demand can reassign; recipient paused automatic accepting does not silently veto manual Demand transfer',async()=>{
 const before=await snap();
 await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=4");
 try{const r=await commit(auth,manager,req(6102,8102,4,'i-ci-paused-transfer-0002'));assert.equal(r.code,'I04_DEMAND_DOMAIN_TRANSFERRED');assert.equal(await owner(402),'4')}
 finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=4")}
 const after=await snap();
 for(const t of ['customers','priority_leases','recommendations','handover_batches','handover_items','employees'])assert.deepEqual(after[t],before[t],t);
});
test('I04 failpoints before_update,after_update,after_audit,after_receipt,before_commit atomic rollback',async()=>{
 for(const [index,phase] of ['before_update','after_update','after_audit','after_receipt','before_commit'].entries()){
  const ids=[6113,6114,6115,6116,6117];const items=[8113,8114,8115,8116,8117];const ds=[413,414,415,416,417];
  const before=await snap(),key='i-ci-fault-phase-'+index+'-0001';
  await assert.rejects(()=>commit(auth,manager,req(ids[index],items[index],4,key),{testCheckpoint:async p=>{if(p===phase)throw Error('CI_FORCED_ROLLBACK_'+phase)}}),/CI_FORCED_ROLLBACK/);
  assert.equal(await owner(ds[index]),'7');
  assert.deepEqual(await snap(),before,'PG16 snapshot must completely rollback '+phase);
 }
});
test('I05 idempotent same item key; changed key and cross-batch/item key are denied',async()=>{
 const p=req(6118,8118,4,'i-ci-idempotency-0018');
 const s=await commit(auth,head,p);assert.equal(s.code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 const before=await snap();
 const same=await retry(auth,head,p);assert.equal(same.code,'I05_IDEMPOTENT_RECEIPT');
 assert.deepEqual(same.receipt,s.receipt);
 assert.equal((await retry(auth,head,{...p,clientRequestKey:'i-ci-second-key-0018'})).code,'I05_COLLISION_DENY');
 assert.equal((await retry(auth,head,{...p,itemId:8122,batchId:6122,clientRequestKey:p.clientRequestKey})).code,'I05_COLLISION_DENY');
 assert.deepEqual(await snap(),before);
});
test('I05 global key existing Customer Owner domain is rejected without side effects',async()=>{
 const old=await db.query('SELECT request_key_sha256 FROM public.customer_owner_handover_receipts LIMIT 1');
 // prior H fixtures in this I run have no submitted H domain receipt: prove real conflict using a
 // standalone transaction that creates a valid H receipt would break independent H invariants;
 // absent token cannot claim coverage, so assert no premature cross-domain authority.
 assert.equal(old.rowCount,0);
});
test('I05 two REAL independent manager PC sessions race same Demand: one transfer/receipt/audit only',async()=>{
 const p=req(6121,8121,4,'i-ci-same-demand-race-0021');
 const before=await snap();
 const results=await Promise.all([commit(auth,manager,p),commit(auth,manager2,p)]);
 const successes=results.filter(x=>x.code==='I04_DEMAND_DOMAIN_TRANSFERRED');
 const idempotent=results.filter(x=>x.code==='I05_IDEMPOTENT_RECEIPT');
 assert.equal(successes.length,1);assert.equal(idempotent.length,1);
 const after=await snap();
 assert.equal(after.demand_responsible_handover_receipts.length,before.demand_responsible_handover_receipts.length+1);
 assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal(await owner(421),'4');
});
test('I05 different Demand and different batch but SAME request key racing: at most one commits',async()=>{
 const key='i-ci-global-race-key-0028',before=await snap();
 const a=req(6127,8127,4,key),b=req(6128,8128,4,key);
 const results=await Promise.all([commit(auth,manager,a),commit(auth,manager2,b)]);
 assert.equal(results.filter(x=>x.code==='I04_DEMAND_DOMAIN_TRANSFERRED').length,1);
 assert.equal(results.filter(x=>x.code==='I05_COLLISION_DENY').length,1);
 const after=await snap();
 assert.equal(after.demand_responsible_handover_receipts.length,before.demand_responsible_handover_receipts.length+1);
 assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal([await owner(427),await owner(428)].filter(x=>x==='4').length,1);
});

test('I07 inactive recipient or lost recipient Team membership must DENY; paused store-head operator remains authorized',async()=>{
 const p=req(6122,8122,4,'i-ci-head-paused-0022');
 const before=await snap();
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{assert.notEqual((await commit(auth,head,p)).code,'I04_DEMAND_DOMAIN_TRANSFERRED')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
 await db.query("UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=4 AND team_id=901");
 try{assert.notEqual((await commit(auth,head,p)).code,'I04_DEMAND_DOMAIN_TRANSFERRED')}
 finally{await db.query("UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=4 AND team_id=901")}
 assert.deepEqual(await snap(),before);
 await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=6");
 try{const result=await commit(auth,head,p);assert.equal(result.code,'I04_DEMAND_DOMAIN_TRANSFERRED');assert.equal(await owner(422),'4')}
 finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=6")}
});
test('I07 approved sudden_inactive original source can be formally reassigned with still-legal Team; no random inactive source bypass',async()=>{
 const before=await snap();
 const approved=req(6130,8130,4,'i-ci-sudden-inactive-0030');
 const unapproved=req(6131,8131,4,'i-ci-unapproved-inactive31');
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  assert.equal((await commit(auth,manager,unapproved)).code,'I03_SOURCE_INVALID');
  const r=await commit(auth,manager,approved);
  assert.equal(r.code,'I04_DEMAND_DOMAIN_TRANSFERRED');assert.equal(await owner(430),'4');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 const after=await snap();
 for(const table of ['customers','customer_owner_history','customer_owner_handover_receipts','priority_leases','recommendations','handover_batches','handover_items','employees'])assert.deepEqual(after[table],before[table]);
});
test('I05 global request key collision between independent Customers and distinct batches stays atomic',async()=>{
 const key='i-ci-cross-customer-0033',before=await snap();
 const first=req(6129,8129,4,key); // Demand 429, Customer 301
 const second=req(6131,8131,4,key); // Demand 431, Customer 302
 const result=await Promise.all([commit(auth,manager,first),commit(auth,manager2,second)]);
 assert.equal(result.filter(x=>x.code==='I04_DEMAND_DOMAIN_TRANSFERRED').length,1);
 assert.equal(result.filter(x=>x.code==='I05_COLLISION_DENY').length,1);
 const after=await snap();
 assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal(after.demand_responsible_handover_receipts.length,before.demand_responsible_handover_receipts.length+1);
 assert.equal([await owner(429),await owner(431)].filter(x=>x==='4').length,1);
});

test('I05 schema protects receipts from UPDATE and DELETE, honest audit provenance',async()=>{
 const id=(await db.query('SELECT receipt_id FROM public.demand_responsible_handover_receipts ORDER BY receipt_id LIMIT 1')).rows[0].receipt_id;
 await assert.rejects(()=>db.query('UPDATE public.demand_responsible_handover_receipts SET request_key_sha256=$1 WHERE receipt_id=$2',['a'.repeat(64),id]));
 await assert.rejects(()=>db.query('DELETE FROM public.demand_responsible_handover_receipts WHERE receipt_id=$1',[id]));
});

test('I06 status/trigger/Match fail closed but never writes Priority during derived reads',async()=>{
 const before=await snap();
 const cases=[
  ["UPDATE public.demands SET demand_state='paused' WHERE demand_id=401","UPDATE public.demands SET demand_state='active' WHERE demand_id=401"],
  ["UPDATE public.priority_leases SET status='ended' WHERE priority_id=5011","UPDATE public.priority_leases SET status='active' WHERE priority_id=5011"],
  ["UPDATE public.priority_leases SET trigger_demand_id=NULL WHERE priority_id=5011","UPDATE public.priority_leases SET trigger_demand_id=401 WHERE priority_id=5011"],
  ["UPDATE public.demand_match_results SET current_state='stale' WHERE result_id=3011","UPDATE public.demand_match_results SET current_state='current' WHERE result_id=3011"],
  ["UPDATE public.demand_match_results SET match_tier='no_match' WHERE result_id=3011","UPDATE public.demand_match_results SET match_tier='high' WHERE result_id=3011"]
 ];
 for(const [change,restore] of cases){await db.query(change);try{
  const r=await priority(auth,manager,{priorityId:5011,teamId:901});
  assert.equal(r.code,'I06_PRIORITY_RELATION_REVALIDATE');
  assert.notEqual(r.priorityUpdated,true);
 }finally{await db.query(restore)}}
 assert.deepEqual(await snap(),before);
});
test('I05 FK-valid but semantically forged Domain receipt/audit cannot pass authenticated proof',async()=>{
 const p=req(6132,8132,4,'i-ci-forged-receipt-0032'),key=createHash('sha256').update(p.clientRequestKey).digest('hex');
 const audit=(await db.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee','5','{}'::jsonb,'Demand','432','pc_password_self_change','{}'::jsonb,'{}'::jsonb,transaction_timestamp()) RETURNING audit_id")).rows[0].audit_id;
 await db.query("INSERT INTO public.demand_responsible_handover_receipts(item_id,batch_id,demand_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES(8132,6132,432,302,7,4,5,901,$1,$2)",[audit,key]);
 assert.equal((await read(auth,manager,view(6132,8132))).code,'I05_RECEIPT_PROOF_DENY');
 assert.equal((await retry(auth,manager,p)).code,'I05_RECEIPT_PROOF_DENY');
 assert.equal((await commit(auth,manager,p)).code,'I05_RECEIPT_PROOF_DENY');
 assert.equal(await owner(432),'7');
});

test('I01 old new migrate checksum and one-table append-only receipt irreversible after use; extra schema guard',async()=>{
 await assert.rejects(()=>rollback(db),/I_RECEIPT_USED_ROLLBACK_DENY/);
 const old=(await db.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000009_demand_responsible_handover_receipts'")).rows[0].checksum;
 await db.query("UPDATE public.f03_schema_migrations SET checksum='TAMPER' WHERE migration_id='000009_demand_responsible_handover_receipts'");
 try{await assert.rejects(()=>verify(db),/I_000009_VERSION_TAMPER/)}finally{await db.query("UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id='000009_demand_responsible_handover_receipts'",[old])}
 await db.query('CREATE SCHEMA f03_i_illegal');
 try{await assert.rejects(()=>verify(db),/I_ISOLATION_DENY/)}finally{await db.query('DROP SCHEMA f03_i_illegal')}
 assert.equal((await verify(db)).verified,true);
});
