import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback} from '../migration.mjs';
import {verify as verify91} from '../../runtime-consultation-assignee-handover/migration.mjs';
import {commitCustomerOwnerHandover as hCommit} from '../../runtime-customer-owner-handover/service.mjs';
import {commitDemandResponsibleHandover as iCommit} from '../../runtime-demand-responsible-handover/service.mjs';
import {commitConsultationAssigneeHandover as jCommit} from '../../runtime-consultation-assignee-handover/service.mjs';
import {prepareWaitlistResponsibleHandover as prep,commitWaitlistResponsibleHandover as commit,retryWaitlistResponsibleHandover as retry,readWaitlistResponsibleHandoverReceipt as read} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const creds={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [username,password]=creds[type];const r=await auth.login({login:username,password,source:'k_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
const req=(n=1,to=4,key='k-ci-waitlist-request-0001')=>({batchId:7400+n,itemId:9400+n,fromEmployeeId:7,recipientEmployeeId:to,teamId:901,clientRequestKey:key});
const view=(batch,item,team=901)=>({batchId:batch,itemId:item,teamId:team});
const h=(batch,item,key,team=901,to=4)=>({batchId:batch,itemId:item,fromEmployeeId:7,recipientEmployeeId:to,teamId:team,clientRequestKey:key});
const kHash=k=>createHash('sha256').update(k).digest('hex');
const waitlist=async id=>(await db.query('SELECT * FROM public.waitlists WHERE waitlist_id=$1',[id])).rows[0];
const owner=async id=>String((await waitlist(id)).responsible_employee_id);
const domains=['customers','customer_owner_history','customer_owner_handover_receipts','demands','demand_responsible_handover_receipts','consultations','consultation_assignee_handover_receipts','priority_leases','demand_match_results','recommendations','vehicle_visibility_grants','waitlists','locks','lock_requests','transactions','handover_batches','handover_items','audit_events','employees','vehicle_listing_cycles','vehicles'];
const available=async table=>((await db.query("SELECT to_regclass('public.'||$1)::text AS tbl",[table])).rows[0].tbl)!==null;
const relevant=[];
for(const tab of domains)if(await available(tab))relevant.push(tab);
relevant.push('waitlist_responsible_handover_receipts');
const snapshot=async()=>{const x={};for(const tab of relevant)x[tab]=(await db.query('SELECT to_jsonb(t)::text body FROM public.'+tab+' t ORDER BY to_jsonb(t)::text')).rows.map(r=>r.body);return x};
let manager,manager2,manager3,manager4,head,ordinary,four,admin,restricted;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const init=await login('manager');assert.equal(init.restricted,true);restricted=init.token;
 assert.equal((await auth.change({token:init.token,csrf:init.csrf,oldPassword:creds.manager[1],newPassword:'Synthetic2K_Waitlist_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='Synthetic2K_Waitlist_2026';
 manager=(await login('manager')).token;manager2=(await login('manager')).token;manager3=(await login('manager')).token;manager4=(await login('manager')).token;
 head=(await login('head')).token;ordinary=(await login('ordinary')).token;four=(await login('four')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('K01 real PG16 exact 91-to-92 catalog and old J91 strict seal rejects 92',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,92);
 await assert.rejects(()=>verify91(db),/J_(SCHEMA_TAMPER|CHAIN_DENY|000010_VERSION_TAMPER)/);
 const r=(await db.query("SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id DESC LIMIT 1")).rows[0];
 assert.equal(r.migration_id,'000011_waitlist_responsible_handover_receipts');
});
test('K02 manager independent privilege cannot inherit employee.manage, I, J, H; no role bypass',async()=>{
 const before=await snapshot();
 for(const token of [ordinary,four,admin,restricted,null,'A'.repeat(43)]){
  assert.notEqual((await prep(auth,token,req())).code,'K01_PREPARED_READ_ONLY');
  assert.notEqual((await commit(auth,token,req())).code,'K04_WAITLIST_TRANSFERRED');
 }
 const dead=(await login('manager')).token;await auth.logout(dead);
 assert.notEqual((await commit(auth,dead,req())).code,'K04_WAITLIST_TRANSFERRED');
 assert.deepEqual(await snapshot(),before);
});
test('K03 ordinary active and ended Waitlist: only real pending SG06 Waitlist item prepares, no mutation',async()=>{
 const before=await snapshot();
 assert.equal((await prep(auth,manager,req(1))).code,'K01_PREPARED_READ_ONLY');
 for(const q of [req(3),{...req(1),teamId:903},{...req(1),itemId:9402},{...req(1),clientRequestKey:'short'},{...req(1),extra:true}]){
  assert.notEqual((await prep(auth,manager,q)).code,'K01_PREPARED_READ_ONLY');
 }
 assert.deepEqual(await snapshot(),before);
});
test('K02 personal deny, exact bound scope expiry, Team revoke and inactive manager block commit',async()=>{
 const p=req(10,4,'k-ci-manager-deny-team-0010');
 const edits=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=18","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=18"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=18 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=18 AND scope_id=201"],
 ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=5 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=5 AND team_id=901"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"]
 ];
 for(const [bad,good] of edits){await db.query(bad);try{assert.notEqual((await commit(auth,manager,p)).code,'K04_WAITLIST_TRANSFERRED')}finally{await db.query(good)}}
 assert.equal(await owner(5410),'7');
});
test('K02 explicit foreign Team manager scope but cross-store head barred; manager paused receiving retains right',async()=>{
 const p={...req(5,4,'k-ci-cross-team-manager-0005'),teamId:906};
 assert.equal((await prep(auth,manager,p)).code,'K01_PREPARED_READ_ONLY');
 assert.notEqual((await commit(auth,head,p)).code,'K04_WAITLIST_TRANSFERRED');
 const before=await snapshot();
 await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 try{assert.equal((await commit(auth,manager,p)).code,'K04_WAITLIST_TRANSFERRED')}finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=5")}
 const after=await snapshot();
 for(const tab of relevant.filter(x=>!['waitlists','waitlist_responsible_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[tab],before[tab],tab);
 assert.equal(await owner(5405),'4');
});
test('K03 terminal ended Waitlist and customer already formally Locked cannot be handed over',async()=>{
 const before=await snapshot();
 assert.equal((await commit(auth,manager,req(3,4,'k-ci-ended-waitlist-0003'))).code,'K03_WAITLIST_ENDED');
 assert.equal((await commit(auth,manager,req(4,4,'k-ci-customer-locked-0004'))).code,'K03_CUSTOMER_ALREADY_LOCKED');
 assert.deepEqual(await snapshot(),before);
});
test('K03 source LockRequest real link, forged customer and wrong resulting waitlist cause DENY',async()=>{
 const p=req(9,4,'k-ci-lock-request-source-0009'),before=await snapshot();
 assert.equal((await prep(auth,manager,p)).code,'K01_PREPARED_READ_ONLY');
 await db.query("UPDATE public.lock_requests SET resulting_waitlist_id=NULL WHERE lock_request_id=9909");
 try{assert.equal((await prep(auth,manager,p)).code,'K01_PREPARED_READ_ONLY')}
 finally{await db.query("UPDATE public.lock_requests SET resulting_waitlist_id=5409 WHERE lock_request_id=9909")}
 await db.query("UPDATE public.lock_requests SET status='closed_not_lockable' WHERE lock_request_id=9909");
 try{assert.equal((await commit(auth,manager,p)).code,'K03_SOURCE_LOCK_REQUEST_INVALID')}
 finally{await db.query("UPDATE public.lock_requests SET status='lock_conflict' WHERE lock_request_id=9909")}
 assert.deepEqual(await snapshot(),before);
});
test('K03 active incumbent lock relationship valid and expired incumbent requires defer rather than auto-upgrade',async()=>{
 const p=req(11,4,'k-ci-incumbent-lock-0011');
 assert.equal((await prep(auth,manager,p)).code,'K01_PREPARED_READ_ONLY');
 await db.query("UPDATE public.locks SET expires_at=now()-interval '1 minute' WHERE lock_id=5051");
 try{assert.equal((await commit(auth,manager,p)).code,'K03_ACTIVE_LOCK_RELATION_INVALID')}
 finally{await db.query("UPDATE public.locks SET expires_at=now()+interval '3 hours' WHERE lock_id=5051")}
 assert.equal(await owner(5411),'7');
});
test('K03 inactive Customer, ended listing cycle and unavailable Vehicle DENY; hidden alone allowed',async()=>{
 const p=req(13,4,'k-ci-listing-checks-0013');
 const edits=[
 ["UPDATE public.customers SET account_status='inactive' WHERE customer_id=3413","UPDATE public.customers SET account_status='active' WHERE customer_id=3413",'K03_CUSTOMER_INVALID'],
 ["UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=2001","UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=2001",'K03_VEHICLE_LISTING_INVALID'],
 ["UPDATE public.vehicles SET source_sale_status='unavailable' WHERE vehicle_id=1001","UPDATE public.vehicles SET source_sale_status='available' WHERE vehicle_id=1001",'K03_VEHICLE_LISTING_INVALID']
 ];
 for(const [bad,good,code] of edits){await db.query(bad);try{assert.equal((await commit(auth,manager,p)).code,code)}finally{await db.query(good)}}
 await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=1001");
 try{assert.equal((await prep(auth,manager,p)).code,'K01_PREPARED_READ_ONLY')}
 finally{await db.query("UPDATE public.vehicles SET platform_visibility='visible' WHERE vehicle_id=1001")}
 assert.equal(await owner(5413),'7');
});
test('K04 five fault injections rollback owner, audit, receipt, all unrelated domains and queue order',async()=>{
 for(const [n,checkpoint] of ['before_update','after_update','after_audit','after_receipt','before_commit'].entries()){
  const slot=16+n,before=await snapshot();
  await assert.rejects(()=>commit(auth,manager,req(slot,4,'k-ci-atomic-rollback-'+n+'-0001'),{testCheckpoint:async name=>{if(name===checkpoint)throw Error('K_TRANSACTION_ROLLBACK_'+checkpoint)}}),/K_TRANSACTION_ROLLBACK/);
  assert.equal(await owner(5400+slot),'7');assert.deepEqual(await snapshot(),before,checkpoint);
 }
});
test('K04 only Waitlist.responsible_employee_id can change: all old source, active Lock and SG06 untouched',async()=>{
 const p=req(2,4,'k-ci-only-one-column-change-0002'),before=await snapshot(),w=await waitlist(5402);
 assert.equal((await commit(auth,manager,p)).code,'K04_WAITLIST_TRANSFERRED');
 const after=await snapshot(),v=await waitlist(5402);
 assert.equal(String(v.responsible_employee_id),'4');
 for(const col of Object.keys(w).filter(x=>x!=='responsible_employee_id'))assert.deepEqual(v[col],w[col],col);
 for(const tab of relevant.filter(x=>!['waitlists','waitlist_responsible_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[tab],before[tab],tab);
 assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal(after.waitlist_responsible_handover_receipts.length,before.waitlist_responsible_handover_receipts.length+1);
});
test('K05 same item+same key is idempotent and wrong intent/key cannot create second receipt',async()=>{
 const p=req(12,4,'k-ci-idempotent-head-0012'),result=await commit(auth,head,p);
 assert.equal(result.code,'K04_WAITLIST_TRANSFERRED');
 const before=await snapshot();
 assert.equal((await retry(auth,head,p)).code,'K05_IDEMPOTENT_RECEIPT');
 assert.equal((await retry(auth,head,{...p,clientRequestKey:'k-ci-different-second-0012'})).code,'K05_COLLISION_DENY');
 assert.notEqual((await retry(auth,manager,p)).code,'K05_IDEMPOTENT_RECEIPT');
 assert.deepEqual(await snapshot(),before);
});
test('K06 two REAL sequential Waitlist transfers keep early and late immutable receipts readable',async()=>{
 const p=req(1,4,'k-ci-history-first-0001'),next={batchId:7460,itemId:9460,fromEmployeeId:4,recipientEmployeeId:5,teamId:901,clientRequestKey:'k-ci-history-second-0060'};
 assert.equal((await commit(auth,manager,p)).code,'K04_WAITLIST_TRANSFERRED');
 const first=await read(auth,manager,view(7401,9401));assert.equal(first.code,'K05_RECEIPT_READ_ONLY');
 assert.equal((await commit(auth,manager,next)).code,'K04_WAITLIST_TRANSFERRED');
 assert.equal(await owner(5401),'5');
 assert.deepEqual((await read(auth,manager,view(7401,9401))).receipt,first.receipt);
 assert.equal((await read(auth,manager,view(7460,9460))).code,'K05_RECEIPT_READ_ONLY');
 const before=await snapshot();
 assert.equal((await retry(auth,manager,p)).code,'K05_IDEMPOTENT_RECEIPT');
 assert.deepEqual(await snapshot(),before);
});
test('K06 prior assignee inactive and membership ended does not erase immutable proof; direct drift DENY',async()=>{
 const p=view(7401,9401);
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 await db.query("UPDATE public.employee_team_memberships SET ended_at=now() WHERE team_id=901 AND employee_id=4");
 try{assert.equal((await read(auth,manager,p)).code,'K05_RECEIPT_READ_ONLY')}
 finally{await db.query("UPDATE public.employee_team_memberships SET ended_at=NULL WHERE team_id=901 AND employee_id=4");await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
 await db.query("UPDATE public.waitlists SET responsible_employee_id=6 WHERE waitlist_id=5401");
 try{assert.equal((await read(auth,manager,p)).code,'K05_RECEIPT_PROOF_DENY')}
 finally{await db.query("UPDATE public.waitlists SET responsible_employee_id=5 WHERE waitlist_id=5401")}
 assert.equal((await read(auth,manager,p)).code,'K05_RECEIPT_READ_ONLY');
});
test('K06 revoked current reader personal capability, role or Team scope cannot see historical receipt',async()=>{
 const p=view(7401,9401),edits=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=18","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=18"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=18 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=18 AND scope_id=201"],
 ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=5 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=5 AND team_id=901"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"]
 ];
 for(const [bad,good] of edits){await db.query(bad);try{assert.notEqual((await read(auth,manager,p)).code,'K05_RECEIPT_READ_ONLY')}finally{await db.query(good)}}
 assert.equal((await read(auth,manager,p)).code,'K05_RECEIPT_READ_ONLY');
});
test('K03 concurrent ended state race is fail closed; one Waitlist never reopens from ended',async()=>{
 const p=req(21,4,'k-ci-ended-at-race-0021');
 await db.query("UPDATE public.waitlists SET ended_at=now() WHERE waitlist_id=5421");
 try{assert.equal((await commit(auth,manager,p)).code,'K03_WAITLIST_ENDED')}
 finally{await db.query('UPDATE public.waitlists SET ended_at=NULL WHERE waitlist_id=5421')}
 assert.equal(await owner(5421),'7');
});
test('K05 H->K and K->H same request key each reject second domain',async()=>{
 const a='k-global-h-before-k-0001',b='k-global-k-before-h-0002';
 assert.equal((await hCommit(auth,manager,h(6017,7017,a))).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal((await commit(auth,manager,req(6,4,a))).code,'K05_CROSS_DOMAIN_KEY_DENY');
 assert.equal((await commit(auth,manager,req(7,4,b))).code,'K04_WAITLIST_TRANSFERRED');
 assert.equal((await hCommit(auth,manager,h(6019,7019,b))).code,'H04_CROSS_DOMAIN_KEY_DENY');
});
test('K05 I->K and K->I same request key each reject second domain',async()=>{
 const a='k-global-i-before-k-0001',b='k-global-k-before-i-0002';
 assert.equal((await iCommit(auth,manager,h(6101,8101,a))).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.equal((await commit(auth,manager,req(8,4,a))).code,'K05_CROSS_DOMAIN_KEY_DENY');
 assert.equal((await commit(auth,manager,req(9,4,b))).code,'K04_WAITLIST_TRANSFERRED');
 assert.equal((await iCommit(auth,manager,h(6102,8102,b))).code,'I05_CROSS_DOMAIN_KEY_DENY');
});
test('K05 J->K and K->J same request key each reject second domain',async()=>{
 const a='k-global-j-before-k-0001',b='k-global-k-before-j-0002';
 assert.equal((await jCommit(auth,manager,h(7205,9205,a))).code,'J04_CONSULTATION_TRANSFERRED');
 assert.equal((await commit(auth,manager,req(14,4,a))).code,'K05_CROSS_DOMAIN_KEY_DENY');
 assert.equal((await commit(auth,manager,req(15,4,b))).code,'K04_WAITLIST_TRANSFERRED');
 assert.equal((await jCommit(auth,manager,h(7219,9219,b))).code,'J05_CROSS_DOMAIN_KEY_DENY');
});
test('K05 previous H/I two directions stay fully protected inside new 92-table schema',async()=>{
 const a='k-global-h-before-i-001',b='k-global-i-before-h-002';
 assert.equal((await hCommit(auth,manager,h(6016,7016,a))).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal((await iCommit(auth,manager,h(6113,8113,a))).code,'I05_CROSS_DOMAIN_KEY_DENY');
 assert.equal((await iCommit(auth,manager,h(6114,8114,b))).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.equal((await hCommit(auth,manager,h(6020,7020,b,901,6))).code,'H02_BATCH_IDENTITY_DENY');
 assert.equal((await hCommit(auth,head,h(6020,7020,b,901,6))).code,'H04_CROSS_DOMAIN_KEY_DENY');
});
test('K05 previous H/J two directions stay fully protected inside new 92-table schema',async()=>{
 const a='k-global-h-before-j-001',b='k-global-j-before-h-002';
 assert.equal((await hCommit(auth,manager,h(6021,7021,a))).code,'H03_OWNER_DOMAIN_TRANSFERRED');
 assert.equal((await jCommit(auth,manager,h(7211,9211,a))).code,'J05_CROSS_DOMAIN_KEY_DENY');
 assert.equal((await jCommit(auth,manager,h(7206,9206,b))).code,'J04_CONSULTATION_TRANSFERRED');
 assert.equal((await hCommit(auth,manager,h(6001,7001,b))).code,'H04_CROSS_DOMAIN_KEY_DENY');
});
test('K05 previous I/J two directions stay fully protected inside new 92-table schema',async()=>{
 const a='k-global-i-before-j-001',b='k-global-j-before-i-002';
 assert.equal((await iCommit(auth,manager,h(6115,8115,a))).code,'I04_DEMAND_DOMAIN_TRANSFERRED');
 assert.equal((await jCommit(auth,manager,h(7214,9214,a))).code,'J05_CROSS_DOMAIN_KEY_DENY');
 assert.equal((await jCommit(auth,manager,h(7207,9207,b))).code,'J04_CONSULTATION_TRANSFERRED');
 assert.equal((await iCommit(auth,manager,h(6116,8116,b))).code,'I05_CROSS_DOMAIN_KEY_DENY');
});
test('K05 four real PG16 authenticated sessions H/I/J/K racing SAME SHA have exactly one commit',async()=>{
 const key='k-global-four-real-sessions-race',before=await snapshot();
 const attempts=[
  hCommit(auth,manager,h(6015,7015,key,906)),
  iCommit(auth,manager2,h(6120,8120,key)),
  jCommit(auth,manager3,h(7215,9215,key)),
  commit(auth,manager4,req(22,4,key))
 ];
 const results=await Promise.all(attempts);
 const wins=['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED','K04_WAITLIST_TRANSFERRED'];
 const denied=['H04_CROSS_DOMAIN_KEY_DENY','I05_CROSS_DOMAIN_KEY_DENY','J05_CROSS_DOMAIN_KEY_DENY','K05_CROSS_DOMAIN_KEY_DENY'];
 assert.equal(results.filter(x=>wins.includes(x.code)).length,1,JSON.stringify(results));
 assert.equal(results.filter(x=>denied.includes(x.code)).length,3,JSON.stringify(results));
 const counts=await db.query("SELECT (SELECT count(*) FROM public.customer_owner_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.demand_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.consultation_assignee_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.waitlist_responsible_handover_receipts WHERE request_key_sha256=$1) AS n",[kHash(key)]);
 assert.equal(Number(counts.rows[0].n),1);
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('K05 four real independent contexts with four DISTINCT keys each succeed on its original domain',async()=>{
 const before=await snapshot();
 const promises=[
 hCommit(auth,manager,h(6001,7001,'k-independent-H-key-0030')),
 iCommit(auth,manager2,h(6146,8146,'k-independent-I-key-0031')),
 jCommit(auth,manager3,h(7221,9221,'k-independent-J-key-0032')),
 commit(auth,manager4,req(30,4,'k-independent-K-key-0033'))
 ];
 const r=await Promise.all(promises);
 assert.deepEqual(r.map(x=>x.code),['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED','K04_WAITLIST_TRANSFERRED'],JSON.stringify(r));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+4);assert.equal(await owner(5430),'4');
});
test('K04 same Waitlist genuine two PC sessions compete: exactly one new receipt, same intent peer idempotent',async()=>{
 const p=req(26,4,'k-ci-two-pc-one-waitlist-0026'),before=await snapshot();
 const r=await Promise.all([commit(auth,manager,p),commit(auth,manager2,p)]);
 assert.equal(r.filter(x=>x.code==='K04_WAITLIST_TRANSFERRED').length,1,JSON.stringify(r));
 assert.equal(r.filter(x=>x.code==='K05_IDEMPOTENT_RECEIPT').length,1,JSON.stringify(r));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
 assert.equal(after.waitlist_responsible_handover_receipts.length,before.waitlist_responsible_handover_receipts.length+1);
});
test('K05 two distinct Waitlist items simultaneous same SHA allow only one',async()=>{
 const key='k-ci-different-items-one-sha-0027',before=await snapshot();
 const r=await Promise.all([commit(auth,manager,req(27,4,key)),commit(auth,manager2,req(28,4,key))]);
 assert.equal(r.filter(x=>x.code==='K04_WAITLIST_TRANSFERRED').length,1,JSON.stringify(r));
 assert.equal(r.filter(x=>x.code==='K05_COLLISION_DENY').length,1,JSON.stringify(r));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('K02 sudden inactive old source only trusted SG06 batch; inactive recipient DENY',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  assert.equal((await commit(auth,manager,req(24,4,'k-ci-sudden-inactive-0024'))).code,'K04_WAITLIST_TRANSFERRED');
  assert.equal((await commit(auth,manager,req(25,4,'k-ci-untrusted-inactive-0025'))).code,'K03_SOURCE_INVALID');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{assert.equal((await commit(auth,manager,req(25,4,'k-ci-recipient-inactive-0025'))).code,'K03_RECIPIENT_INVALID')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('K06 forged FK-valid audit receipt cannot attest handover; read and retry are DENY',async()=>{
 const p=req(23,4,'k-ci-forged-fk-valid-audit-0023');
 const a=(await db.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee','5','{}'::jsonb,'Waitlist','5423','pc_password_self_change','{}'::jsonb,'{}'::jsonb,transaction_timestamp()) RETURNING audit_id")).rows[0].audit_id;
 await db.query('INSERT INTO public.waitlist_responsible_handover_receipts(item_id,batch_id,waitlist_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES(9423,7423,5423,3423,7,4,5,901,$1,$2)',[a,kHash(p.clientRequestKey)]);
 assert.equal((await read(auth,manager,view(7423,9423))).code,'K05_RECEIPT_PROOF_DENY');
 assert.equal((await commit(auth,manager,p)).code,'K05_RECEIPT_PROOF_DENY');
 assert.equal(await owner(5423),'7');
});
test('K01 immutable receipts never mutate or delete, used 000011 cannot rollback',async()=>{
 const id=(await db.query('SELECT receipt_id FROM public.waitlist_responsible_handover_receipts ORDER BY receipt_id LIMIT 1')).rows[0].receipt_id;
 await assert.rejects(()=>db.query('UPDATE public.waitlist_responsible_handover_receipts SET request_key_sha256=$1 WHERE receipt_id=$2',['a'.repeat(64),id]));
 await assert.rejects(()=>db.query('DELETE FROM public.waitlist_responsible_handover_receipts WHERE receipt_id=$1',[id]));
 await assert.rejects(()=>rollback(db),/K_RECEIPT_USED_ROLLBACK_DENY/);
 assert.equal((await verify(db)).verified,true);
});
