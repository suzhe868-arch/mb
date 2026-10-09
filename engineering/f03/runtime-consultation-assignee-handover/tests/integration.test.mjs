import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback} from '../migration.mjs';
import {verify as verify90} from '../../runtime-demand-responsible-handover/migration.mjs';
import {commitCustomerOwnerHandover as hCommit,retryCustomerOwnerHandover as hRetry} from '../../runtime-customer-owner-handover/service.mjs';
import {commitDemandResponsibleHandover as iCommit,retryDemandResponsibleHandover as iRetry} from '../../runtime-demand-responsible-handover/service.mjs';
import {prepareConsultationAssigneeHandover as prep,commitConsultationAssigneeHandover as commit,retryConsultationAssigneeHandover as retry,readConsultationAssigneeHandoverReceipt as read} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const creds={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [username,password]=creds[type];const r=await auth.login({login:username,password,source:'j_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
const req=(n=1,to=4,key='j-ci-consultation-request-0001')=>({batchId:7200+n,itemId:9200+n,fromEmployeeId:7,recipientEmployeeId:to,teamId:901,clientRequestKey:key});
const view=(batch,item,team=901)=>({batchId:batch,itemId:item,teamId:team});
const owner=async id=>String((await db.query('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=$1',[id])).rows[0].assignee_employee_id);
const domains=['customers','customer_owner_history','customer_owner_handover_receipts','demands','demand_responsible_handover_receipts','consultations','consultation_assignee_handover_receipts','priority_leases','demand_match_results','recommendations','waitlists','locks','transactions','handover_batches','handover_items','audit_events','employees'];
const snap=async()=>{const x={};for(const tab of domains)x[tab]=(await db.query('SELECT to_jsonb(t)::text body FROM public.'+tab+' t ORDER BY to_jsonb(t)::text')).rows.map(r=>r.body);return x};
const consult=async (id=5301)=>(await db.query('SELECT * FROM public.consultations WHERE consultation_id=$1',[id])).rows[0];
let manager,manager2,head,admin,four,ordinary,restricted;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const init=await login('manager');assert.equal(init.restricted,true);restricted=init.token;
 assert.equal((await auth.change({token:init.token,csrf:init.csrf,oldPassword:creds.manager[1],newPassword:'Synthetic2J_Consultation_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='Synthetic2J_Consultation_2026';
 manager=(await login('manager')).token;manager2=(await login('manager')).token;head=(await login('head')).token;admin=(await login('admin')).token;four=(await login('four')).token;ordinary=(await login('ordinary')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('J01 real pinned 90-to-91 one-table full PG16 manifest and frozen I guard rejects',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,91);
 await assert.rejects(()=>verify90(db),/I_(SCHEMA_TAMPER|CHAIN_DENY|000009_VERSION_TAMPER)/);
 assert.equal((await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1")).rows[0].migration_id,'000010_consultation_assignee_handover_receipts');
});
test('J02 independent capability DENY ordinary/4S/admin/restricted, expired and forged sessions',async()=>{
 const before=await snap();for(const token of [ordinary,four,admin,restricted,null,'A'.repeat(43)]){
  assert.notEqual((await prep(auth,token,req())).code,'J01_PREPARED_READ_ONLY');
  assert.notEqual((await commit(auth,token,req())).code,'J04_CONSULTATION_TRANSFERRED');
 }
 const dead=(await login('manager')).token;await auth.logout(dead);
 assert.notEqual((await commit(auth,dead,req())).code,'J04_CONSULTATION_TRANSFERRED');
 assert.deepEqual(await snap(),before);
});
test('J03 pending/processing preparation read-only; exact batch/item/Team identity and request shape checks',async()=>{
 const before=await snap();
 assert.equal((await prep(auth,manager,req(1))).code,'J01_PREPARED_READ_ONLY');
 assert.equal((await prep(auth,manager,req(2,4,'j-ci-valid-processing-0002'))).code,'J01_PREPARED_READ_ONLY');
 for(const p of [req(3),req(4),{...req(1),teamId:903},{...req(1),clientRequestKey:'bad'},{...req(1),itemId:9001},{...req(1),actorId:5}]){
  assert.notEqual((await prep(auth,manager,p)).code,'J01_PREPARED_READ_ONLY');
 }
 assert.deepEqual(await snap(),before);
});
test('J02 current personal deny, Team membership expiry, scope binding revoke and source inactivity fail closed',async()=>{
 const p=req(10,4,'j-ci-revoke-team-0010');
 const edits=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=17","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=17"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=17 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=17 AND scope_id=201"],
 ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=5 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=5 AND team_id=901"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"]
 ];
 for(const [bad,good] of edits){await db.query(bad);try{assert.notEqual((await commit(auth,manager,p)).code,'J04_CONSULTATION_TRANSFERRED')}finally{await db.query(good)}}
 assert.equal(await owner(5310),'7');
});
test('J02 manager cross-store explicit Team and store head precise scope; paused actor retains manual rights',async()=>{
 const before=await snap();
 const p={...req(5,4,'j-ci-cross-store-0005'),teamId:906};
 assert.equal((await prep(auth,manager,p)).code,'J01_PREPARED_READ_ONLY');
 assert.equal((await commit(auth,head,p)).code,'J03_BATCH_IDENTITY_DENY'); // foreign actor cannot reuse manager batch
 await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 try{assert.equal((await commit(auth,manager,p)).code,'J04_CONSULTATION_TRANSFERRED')}
 finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=5")}
 assert.equal(await owner(5305),'4');
 const after=await snap();
 for(const tab of ['customers','demands','priority_leases','recommendations','handover_batches','handover_items','employees'])assert.deepEqual(after[tab],before[tab],tab);
});
test('J03 terminal, damaged source relation, ended cycle and inactive Customer block reassignment',async()=>{
 const before=await snap();
 assert.notEqual((await commit(auth,manager,req(3,4,'j-ci-terminal-0003'))).code,'J04_CONSULTATION_TRANSFERRED');
 assert.notEqual((await commit(auth,manager,req(4,4,'j-ci-invalid-0004'))).code,'J04_CONSULTATION_TRANSFERRED');
 await db.query("UPDATE public.consultations SET source_relation='[]'::jsonb WHERE consultation_id=5311");
 try{assert.equal((await commit(auth,manager,req(11,4,'j-ci-invalid-origin-0011'))).code,'J03_ORIGIN_INVALID')}finally{await db.query("UPDATE public.consultations SET source_relation=$1 WHERE consultation_id=5311",[JSON.stringify({originalChannel:'ci_customer_direct',consultationId:5311})])}
 await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=2002");
 try{assert.equal((await commit(auth,manager,req(13,4,'j-ci-cycle-ended-0013'))).code,'J03_VEHICLE_LISTING_INVALID')}
 finally{await db.query("UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=2002")}
 await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=306");
 try{assert.notEqual((await commit(auth,manager,req(17,4,'j-ci-inactive-customer17'))).code,'J04_CONSULTATION_TRANSFERRED')}
 finally{await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=306")}
 assert.deepEqual(await snap(),before);
});
test('J04 processing Consultation CAS updates ONLY assignee, not 15-min deadline, status, source or first response',async()=>{
 const before=await snap(),cBefore=await consult(5302);
 const result=await commit(auth,manager,req(2,4,'j-ci-processing-0002'));
 assert.equal(result.code,'J04_CONSULTATION_TRANSFERRED');
 const cAfter=await consult(5302);
 assert.equal(cAfter.status,'processing');assert.equal(String(cAfter.assignee_employee_id),'4');
 for(const col of Object.keys(cBefore).filter(x=>x!=='assignee_employee_id'))assert.deepEqual(cAfter[col],cBefore[col],col);
 const after=await snap();
 for(const tab of domains.filter(x=>!['consultations','consultation_assignee_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[tab],before[tab],tab);
 assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal(after.consultation_assignee_handover_receipts.length,before.consultation_assignee_handover_receipts.length+1);
});
test('J04 five transaction fault injections rollback assignee, audit, receipt, existing SLA and entire ledger',async()=>{
 for(const [idx,phase] of ['before_update','after_update','after_audit','after_receipt','before_commit'].entries()){
  const n=16+idx,before=await snap();
  await assert.rejects(()=>commit(auth,manager,req(n,4,'j-ci-rollback-'+idx+'-0001'),{testCheckpoint:async tag=>{if(tag===phase)throw Error('J_FORCED_ATOMIC_ROLLBACK_'+phase)}}),/J_FORCED_ATOMIC_ROLLBACK/);
  assert.equal(await owner(5300+n),'7');assert.deepEqual(await snap(),before,phase);
 }
});
test('J05 same signed item+key idempotent without second audit; different key and cross-item collisions',async()=>{
 const p=req(12,4,'j-ci-head-idempotent-0012');
 assert.equal((await commit(auth,head,p)).code,'J04_CONSULTATION_TRANSFERRED');
 const before=await snap();
 assert.equal((await retry(auth,head,p)).code,'J05_IDEMPOTENT_RECEIPT');
 assert.equal((await retry(auth,head,{...p,clientRequestKey:'j-ci-head-different-0012'})).code,'J05_COLLISION_DENY');
 assert.equal((await retry(auth,head,{...req(14),clientRequestKey:p.clientRequestKey})).code,'J03_BATCH_IDENTITY_DENY');
 assert.deepEqual(await snap(),before);
});
test('J06 two consecutive legitimate transfers of same Consultation preserve BOTH historical receipt/audit facts',async()=>{
 const a=req(1,4,'j-ci-history-first-0001');
 const b={batchId:7260,itemId:9260,fromEmployeeId:4,recipientEmployeeId:5,teamId:901,clientRequestKey:'j-ci-history-second-0060'};
 assert.equal((await commit(auth,manager,a)).code,'J04_CONSULTATION_TRANSFERRED');
 const prior=await read(auth,manager,view(7201,9201));assert.equal(prior.code,'J05_RECEIPT_READ_ONLY');
 assert.equal((await commit(auth,manager,b)).code,'J04_CONSULTATION_TRANSFERRED');
 assert.equal(await owner(5301),'5');
 assert.deepEqual((await read(auth,manager,view(7201,9201))).receipt,prior.receipt);
 assert.equal((await read(auth,manager,view(7260,9260))).code,'J05_RECEIPT_READ_ONLY');
 const before=await snap();assert.equal((await retry(auth,manager,a)).code,'J05_IDEMPOTENT_RECEIPT');assert.deepEqual(await snap(),before);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 await db.query("UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=4 AND team_id=901");
 try{assert.equal((await read(auth,manager,view(7201,9201))).code,'J05_RECEIPT_READ_ONLY')}
 finally{await db.query("UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=4 AND team_id=901");await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
 await db.query('UPDATE public.consultations SET assignee_employee_id=6 WHERE consultation_id=5301');
 try{assert.equal((await read(auth,manager,view(7201,9201))).code,'J05_RECEIPT_PROOF_DENY')}
 finally{await db.query('UPDATE public.consultations SET assignee_employee_id=5 WHERE consultation_id=5301')}
 assert.equal((await read(auth,manager,view(7201,9201))).code,'J05_RECEIPT_READ_ONLY');
});
test('J06 historic receipt read checks CURRENT operator personal deny, inactive and revoked Team binding',async()=>{
 const p=view(7201,9201),edits=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=17","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=17"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=17 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=17 AND scope_id=201"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"],
 ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=5 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=5 AND team_id=901"]
 ];assert.equal((await read(auth,manager,p)).code,'J05_RECEIPT_READ_ONLY');
 for(const [bad,good] of edits){await db.query(bad);try{assert.notEqual((await read(auth,manager,p)).code,'J05_RECEIPT_READ_ONLY')}finally{await db.query(good)}}
 assert.equal((await read(auth,manager,p)).code,'J05_RECEIPT_READ_ONLY');
 assert.notEqual((await read(auth,manager,view(7201,9201,906))).code,'J05_RECEIPT_READ_ONLY');
});
test('J05 H then J cross-domain SAME key is collision, no second Consultation write or receipt',async()=>{
 const k='j-ci-global-H-then-J-0005',h={batchId:6015,itemId:7015,fromEmployeeId:7,recipientEmployeeId:4,teamId:906,clientRequestKey:k};
 assert.equal((await hCommit(auth,manager,h)).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 const before=await snap();assert.equal((await commit(auth,manager,req(6,4,k))).code,'J05_CROSS_DOMAIN_KEY_DENY');assert.deepEqual(await snap(),before);
});
test('J05 I then J same key collision, no cross-domain changed object',async()=>{
 const k='j-ci-global-I-then-J-0006',i={batchId:6101,itemId:8101,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k};
 assert.equal((await iCommit(auth,manager,i)).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 const before=await snap();assert.equal((await commit(auth,manager,req(7,4,k))).code,'J05_CROSS_DOMAIN_KEY_DENY');assert.deepEqual(await snap(),before);
});
test('J05 J then H reverse SAME key collision after genuine valid J receipt',async()=>{
 const k='j-ci-global-J-then-H-0007';assert.equal((await commit(auth,manager,req(7,4,k))).code,'J04_CONSULTATION_TRANSFERRED');
 const before=await snap();const h={batchId:6019,itemId:7019,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k};
 assert.equal((await hCommit(auth,manager,h)).code,'H04_CROSS_DOMAIN_KEY_DENY');assert.deepEqual(await snap(),before);
});
test('J05 J then I reverse SAME key collision and distinct I key independently allowed',async()=>{
 const k='j-ci-global-J-then-I-0008';assert.equal((await commit(auth,manager,req(8,4,k))).code,'J04_CONSULTATION_TRANSFERRED');
 const d={batchId:6102,itemId:8102,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k};
 const before=await snap();assert.equal((await iCommit(auth,manager,d)).code,'I05_CROSS_DOMAIN_KEY_DENY');assert.deepEqual(await snap(),before);
 assert.equal((await iCommit(auth,manager,{...d,clientRequestKey:'j-ci-distinct-I-key-0008'})).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
});
test('J05 H then I on third-domain-schema PG16 still enforces original two-domain global key uniqueness',async()=>{
 const k='j-ci-global-H-then-I-0009';
 const h={batchId:6017,itemId:7017,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k};
 assert.equal((await hCommit(auth,manager,h)).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal((await iCommit(auth,manager,{batchId:6125,itemId:8125,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k})).code,'I05_CROSS_DOMAIN_KEY_DENY');
});
test('J05 I then H reverse on 91-table PG16 preserves original H/I protection',async()=>{
 const k='j-ci-global-I-then-H-0010';
 assert.equal((await iCommit(auth,head,{batchId:6122,itemId:8122,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k})).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.equal((await hCommit(auth,head,{batchId:6018,itemId:7018,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k})).code,'H04_CROSS_DOMAIN_KEY_DENY');
});
test('J05 real simultaneous H/I/J THREE legally distinct PC contexts SAME key => one success and two collisions',async()=>{
 const k='j-ci-h-i-j-three-domain-race',before=await snap();
 const a=hCommit(auth,manager,{batchId:6021,itemId:7021,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k});
 const b=iCommit(auth,manager2,{batchId:6113,itemId:8113,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:k});
 const c=commit(auth,manager,req(9,4,k));
 const res=await Promise.all([a,b,c]);
 assert.equal(res.filter(x=>['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED'].includes(x.code)).length,1,JSON.stringify(res));
 assert.equal(res.filter(x=>['H04_CROSS_DOMAIN_KEY_DENY','I05_CROSS_DOMAIN_KEY_DENY','J05_CROSS_DOMAIN_KEY_DENY'].includes(x.code)).length,2,JSON.stringify(res));
 const after=await snap();assert.equal(after.audit_events.length,before.audit_events.length+1);
 const n=(await db.query('SELECT (SELECT count(*) FROM public.customer_owner_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.demand_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.consultation_assignee_handover_receipts WHERE request_key_sha256=$1) n',[createHash('sha256').update(k).digest('hex')])).rows[0].n;
 assert.equal(Number(n),1);
});
test('J04 two independent authenticated manager sessions concurrent SAME Consultation => single CAS+one receipt and idempotent peer',async()=>{
 const p=req(14,4,'j-ci-same-consultation-two-pc-0014'),before=await snap();
 const res=await Promise.all([commit(auth,manager,p),commit(auth,manager2,p)]);
 assert.equal(res.filter(x=>x.code==='J04_CONSULTATION_TRANSFERRED').length,1,JSON.stringify(res));
 assert.equal(res.filter(x=>x.code==='J05_IDEMPOTENT_RECEIPT').length,1,JSON.stringify(res));
 const after=await snap();assert.equal(after.audit_events.length,before.audit_events.length+1);assert.equal(after.consultation_assignee_handover_receipts.length,before.consultation_assignee_handover_receipts.length+1);assert.equal(await owner(5314),'4');
});
test('J05 two distinct Consultation items race same key, at most one global accepted',async()=>{
 const k='j-ci-two-item-one-key-race-0015',before=await snap();
 const r=await Promise.all([commit(auth,manager,req(15,4,k)),commit(auth,manager2,req(21,4,k))]);
 assert.equal(r.filter(x=>x.code==='J04_CONSULTATION_TRANSFERRED').length,1);
 assert.equal(r.filter(x=>x.code==='J05_COLLISION_DENY').length,1);
 const after=await snap();assert.equal(after.audit_events.length,before.audit_events.length+1);assert.equal(after.consultation_assignee_handover_receipts.length,before.consultation_assignee_handover_receipts.length+1);
});
test('J04 inactive original assignee only with approved planned/sudden inactive batch and live scope',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  assert.equal((await commit(auth,manager,req(24,4,'j-ci-approved-inactive-source24'))).code,'J04_CONSULTATION_TRANSFERRED');
  // untrusted mismatched actor or Team must still fail.
  assert.notEqual((await commit(auth,ordinary,req(25,4,'j-ci-invalid-inactive-source25'))).code,'J04_CONSULTATION_TRANSFERRED');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
});
test('J02 role downgrade and revoked recipient membership cannot be bypassed by logged-in PC session',async()=>{
 const p=req(22,4,'j-ci-role-negative-0022'),orig=(await db.query('SELECT main_role_id FROM public.employees WHERE employee_id=5')).rows[0].main_role_id;
 await db.query("UPDATE public.employees SET main_role_id=(SELECT main_role_id FROM public.employees WHERE employee_id=7) WHERE employee_id=5");
 try{assert.notEqual((await commit(auth,manager,p)).code,'J04_CONSULTATION_TRANSFERRED')}
 finally{await db.query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=5',[orig])}
 await db.query("UPDATE public.employee_team_memberships SET ended_at=now() WHERE team_id=901 AND employee_id=4");
 try{assert.notEqual((await commit(auth,manager,p)).code,'J04_CONSULTATION_TRANSFERRED')}
 finally{await db.query("UPDATE public.employee_team_memberships SET ended_at=NULL WHERE team_id=901 AND employee_id=4")}
 assert.equal(await owner(5322),'7');
});
test('J05 only real signed matching audit may prove a receipt, not fake FK-valid rows',async()=>{
 const p=req(23,4,'j-ci-fake-receipt-audit-0023'),k=createHash('sha256').update(p.clientRequestKey).digest('hex');
 const aid=(await db.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee','5','{}'::jsonb,'Consultation','5323','pc_password_self_change','{}'::jsonb,'{}'::jsonb,transaction_timestamp()) RETURNING audit_id")).rows[0].audit_id;
 await db.query("INSERT INTO public.consultation_assignee_handover_receipts(item_id,batch_id,consultation_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES(9223,7223,5323,320,7,4,5,901,$1,$2)",[aid,k]);
 assert.equal((await read(auth,manager,view(7223,9223))).code,'J05_RECEIPT_PROOF_DENY');
 assert.equal((await commit(auth,manager,p)).code,'J05_RECEIPT_PROOF_DENY');
 assert.equal(await owner(5323),'7');
});
test('J05 append-only UPDATE/DELETE PG16 denial and used migration rollback protection',async()=>{
 const id=(await db.query('SELECT receipt_id FROM public.consultation_assignee_handover_receipts ORDER BY receipt_id LIMIT 1')).rows[0].receipt_id;
 await assert.rejects(()=>db.query('UPDATE public.consultation_assignee_handover_receipts SET request_key_sha256=$1 WHERE receipt_id=$2',['a'.repeat(64),id]));
 await assert.rejects(()=>db.query('DELETE FROM public.consultation_assignee_handover_receipts WHERE receipt_id=$1',[id]));
 await assert.rejects(()=>rollback(db),/J_RECEIPT_USED_ROLLBACK_DENY/);
});
test('J07 frozen all other domains, original SLA and Recommendation non-reversal verified after committed Consultation',async()=>{
 const p=req(25,4,'j-ci-final-unchanged-sla-0025');
 const before=await snap(),c0=await consult(5325);
 assert.equal((await commit(auth,manager,p)).code,'J04_CONSULTATION_TRANSFERRED');
 const after=await snap(),c1=await consult(5325);
 for(const field of Object.keys(c0).filter(x=>x!=='assignee_employee_id'))assert.deepEqual(c1[field],c0[field],field);
 for(const domain of domains.filter(x=>!['consultations','consultation_assignee_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[domain],before[domain],domain);
 assert.equal((await verify(db)).verified,true);
});
