// F03-2-2L: disposable PG16 real integration tests, never production.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,rollback} from '../migration.mjs';
import {commitCustomerOwnerHandover as hCommit} from '../../runtime-customer-owner-handover/service.mjs';
import {commitDemandResponsibleHandover as iCommit} from '../../runtime-demand-responsible-handover/service.mjs';
import {commitConsultationAssigneeHandover as jCommit} from '../../runtime-consultation-assignee-handover/service.mjs';
import {commitWaitlistResponsibleHandover as kCommit} from '../../runtime-waitlist-responsible-handover/service.mjs';
import {prepareLockResponsibleHandover as prepare,commitLockResponsibleHandover as commit,retryLockResponsibleHandover as retry,readLockResponsibleHandoverReceipt as read} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const creds={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [username,password]=creds[type];const r=await auth.login({login:username,password,source:'l_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
const req=(n=1,to=4,key='l-ci-lock-request-0001')=>({batchId:8400+n,itemId:10400+n,fromEmployeeId:7,recipientEmployeeId:to,teamId:901,clientRequestKey:key});
const owner=async n=>String((await db.query('SELECT responsible_employee_id FROM public.locks WHERE lock_id=$1',[18000+n])).rows[0].responsible_employee_id);
let manager,head,ordinary,four,admin,restricted;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const first=await login('manager');assert.equal(first.restricted,true);restricted=first.token;
 assert.equal((await auth.change({token:first.token,csrf:first.csrf,oldPassword:creds.manager[1],newPassword:'Synthetic2L_Lock_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='Synthetic2L_Lock_2026';
 manager=(await login('manager')).token;head=(await login('head')).token;ordinary=(await login('ordinary')).token;four=(await login('four')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('L01 new exact 93-table isolated PG16 catalog',async()=>{assert.equal((await verify(db)).verified,true);assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,93)});
test('L02 independent manager privilege blocks ordinary, 4S, admin and restricted',async()=>{
 for(const token of [ordinary,four,admin,restricted,null])assert.notEqual((await commit(auth,token,req())).code,'L04_LOCK_TRANSFERRED');
});
test('L03 expired without Deposit and with Deposit never auto release or reassign',async()=>{
 assert.equal((await commit(auth,manager,req(4,4,'l-expired-no-deposit-0004'))).code,'L03_EXPIRED_WITHOUT_DEPOSIT_DEFER_DENY');
 assert.equal((await commit(auth,manager,req(5,4,'l-expired-with-deposit-0005'))).code,'L03_EXPIRED_WITH_DEPOSIT_DEFER_DENY');
 assert.equal(await owner(4),'7');assert.equal(await owner(5),'7');
});
test('L04 single Lock CAS, exact request retry and immutable real auditor receipt',async()=>{
 const p=req(1,4,'l-real-lock-transfer-0001');
 assert.equal((await prepare(auth,manager,p)).code,'L01_PREPARED_READ_ONLY');
 assert.equal((await commit(auth,manager,p)).code,'L04_LOCK_TRANSFERRED');
 assert.equal(await owner(1),'4');
 assert.equal((await retry(auth,manager,p)).code,'L05_IDEMPOTENT_RECEIPT');
 assert.equal((await read(auth,manager,{batchId:p.batchId,itemId:p.itemId,teamId:901})).code,'L05_RECEIPT_READ_ONLY');
});
const other=(batch,item,key,team=901,to=4)=>({batchId:batch,itemId:item,fromEmployeeId:7,recipientEmployeeId:to,teamId:team,clientRequestKey:key});
const digest=k=>createHash('sha256').update(k,'utf8').digest('hex');
const tracked=['customers','customer_owner_history','customer_owner_handover_receipts','demands','demand_responsible_handover_receipts','consultations','consultation_assignee_handover_receipts','priority_leases','demand_match_results','recommendations','vehicle_visibility_grants','waitlists','waitlist_responsible_handover_receipts','locks','lock_requests','deposit_receipts','refund_cases','refund_payments','transactions','handover_batches','handover_items','audit_events','employees','vehicle_listing_cycles','vehicles','lock_responsible_handover_receipts'];
const snapshot=async()=>{const result={};for(const tab of tracked)result[tab]=(await db.query('SELECT to_jsonb(t)::text x FROM public.'+tab+' t ORDER BY to_jsonb(t)::text')).rows.map(r=>r.x);return result};
test('L03 genuine approved LockRequest identity with forged approval/result denied and no database change',async()=>{
 const p=req(9,4,'l-approved-source-request-0009'),before=await snapshot();
 assert.equal((await prepare(auth,manager,p)).code,'L01_PREPARED_READ_ONLY');
 await db.query("UPDATE public.lock_requests SET status='rejected' WHERE lock_request_id=19909");
 try{assert.equal((await commit(auth,manager,p)).code,'L03_SOURCE_LOCK_REQUEST_INVALID')}finally{await db.query("UPDATE public.lock_requests SET status='approved' WHERE lock_request_id=19909")}
 await db.query("UPDATE public.lock_requests SET resulting_lock_id=NULL WHERE lock_request_id=19909");
 try{assert.equal((await commit(auth,manager,p)).code,'L03_SOURCE_LOCK_REQUEST_INVALID')}finally{await db.query("UPDATE public.lock_requests SET resulting_lock_id=18009 WHERE lock_request_id=19909")}
 assert.deepEqual(await snapshot(),before);
});
test('L03 terminated Lock, inactive customer, ended listing cycle and unavailable vehicle reject',async()=>{
 const p=req(8,4,'l-listing-scope-0008'),before=await snapshot();
 assert.equal((await commit(auth,manager,req(3,4,'l-ended-lock-0003'))).code,'L03_LOCK_NOT_ACTIVE');
 const edits=[
 ["UPDATE public.customers SET account_status='inactive' WHERE customer_id=14308","UPDATE public.customers SET account_status='active' WHERE customer_id=14308",'L03_CUSTOMER_INVALID'],
 ["UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=99008","UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=99008",'L03_VEHICLE_LISTING_INVALID'],
 ["UPDATE public.vehicles SET source_sale_status='unavailable' WHERE vehicle_id=98008","UPDATE public.vehicles SET source_sale_status='available' WHERE vehicle_id=98008",'L03_VEHICLE_LISTING_INVALID']
 ];
 for(const [bad,restore,expected] of edits){await db.query(bad);try{assert.equal((await commit(auth,manager,p)).code,expected)}finally{await db.query(restore)}}
 assert.deepEqual(await snapshot(),before);
});
test('L02 independent current manager permission deny, team/capability revoke and suspended manager',async()=>{
 const p=req(19,4,'l-current-permission-0019');
 const edits=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=19","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=19"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=19 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=19 AND scope_id=201"],
 ["UPDATE public.employee_team_memberships SET ended_at=now() WHERE employee_id=5 AND team_id=901","UPDATE public.employee_team_memberships SET ended_at=NULL WHERE employee_id=5 AND team_id=901"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"]
 ];
 for(const [bad,restore] of edits){await db.query(bad);try{assert.notEqual((await commit(auth,manager,p)).code,'L04_LOCK_TRANSFERRED')}finally{await db.query(restore)}}
 assert.equal(await owner(19),'7');
});
test('L02 paused manager retains authorized management and explicit foreign Team, not store_head cross-store',async()=>{
 const p={...req(2,4,'l-foreign-team-0002'),teamId:906},before=await snapshot();
 assert.equal((await prepare(auth,manager,p)).code,'L01_PREPARED_READ_ONLY');
 assert.notEqual((await commit(auth,head,p)).code,'L04_LOCK_TRANSFERRED');
 await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 try{assert.equal((await commit(auth,manager,p)).code,'L04_LOCK_TRANSFERRED')}finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=5")}
 const after=await snapshot();
 for(const tab of tracked.filter(x=>!['locks','lock_responsible_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[tab],before[tab],tab);
 assert.equal(await owner(2),'4');
});
test('L04 five fault injection points rollback all Lock/Deposit/Refund/audit/receipt changes',async()=>{
 for(const [i,point] of ['before_update','after_update','after_audit','after_receipt','before_commit'].entries()){
  const n=20+i,before=await snapshot();
  await assert.rejects(()=>commit(auth,manager,req(n,4,'l-fault-'+i+'-true-transaction'),{testCheckpoint:async s=>{if(s===point)throw Error('L_INJECT_'+point)}}),/L_INJECT_/);
  assert.equal(await owner(n),'7');assert.deepEqual(await snapshot(),before,point);
 }
});
test('L05 all 20 directed five-domain keys (H/I/J/K/L) in real PG16, each with first valid receipt',async()=>{
 const execute=async(d,n,key)=>{
  if(d==='H'){
   const headBatch=[6002,6005,6018,6020,6022].includes(n);
   const item=n===6005?7006:n+1000;
   const recipient=[6002,6005,6020].includes(n)?6:4;
   return hCommit(auth,headBatch?head:manager,other(n,item,key,901,recipient));
  }
  if(d==='I')return iCommit(auth,manager,other(n,n+2000,key));
  if(d==='J')return jCommit(auth,manager,other(n,n+2000,key));
  if(d==='K')return kCommit(auth,manager,other(n,n+2000,key));
  return commit(auth,manager,req(n,4,key));
 };
 const wins={H:'H03_OWNER_DOMAIN_TRANSFERRED',I:'I04_DEMAND_DOMAIN_TRANSFERRED',J:'J04_CONSULTATION_TRANSFERRED',K:'K04_WAITLIST_TRANSFERRED',L:'L04_LOCK_TRANSFERRED'};
 const deny={H:'H04_CROSS_DOMAIN_KEY_DENY',I:'I05_CROSS_DOMAIN_KEY_DENY',J:'J05_CROSS_DOMAIN_KEY_DENY',K:'K05_CROSS_DOMAIN_KEY_DENY',L:'L05_CROSS_DOMAIN_KEY_DENY'};
 const cases=[
 ['H',6016,'I',6113],['I',6114,'H',6002],['H',6021,'J',7211],['J',7206,'H',6001],
 ['I',6115,'J',7214],['J',7207,'I',6116],['H',6017,'K',7406],['K',7407,'H',6019],
 ['I',6101,'K',7408],['K',7409,'I',6102],['J',7205,'K',7414],['K',7415,'J',7219],
 ['H',6019,'L',10],['L',11,'H',6003],['I',6110,'L',12],['L',13,'I',6111],
 ['J',7208,'L',14],['L',15,'J',7209],['K',7410,'L',16],['L',17,'K',7411]
 ];
 for(const [index,[a,ai,b,bi]] of cases.entries()){
  const key='l-ordered-shared-key-'+String(index).padStart(3,'0')+'-once';
  const first=await execute(a,ai,key);
  assert.equal(first.code,wins[a],a+' -> '+b+' FIRST '+JSON.stringify(first));
  const second=await execute(b,bi,key);
  assert.equal(second.code,deny[b],a+' -> '+b+' SECOND '+JSON.stringify(second));
  const cnt=(await db.query("SELECT (SELECT count(*) FROM public.customer_owner_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.demand_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.consultation_assignee_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.waitlist_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.lock_responsible_handover_receipts WHERE request_key_sha256=$1) AS n",[digest(key)])).rows[0].n;
  assert.equal(Number(cnt),1,a+' -> '+b);
 }
});
test('L05 five authenticated real PG16 sessions SAME key racing H/I/J/K/L: exactly one commit',async()=>{
 const sessions=await Promise.all(Array.from({length:5},()=>login('manager').then(x=>x.token)));
 const key='l-five-current-sessions-shared-key',before=await snapshot();
 const outcomes=await Promise.all([
  hCommit(auth,sessions[0],other(6015,7015,key,906)),
  iCommit(auth,sessions[1],other(6120,8120,key)),
  jCommit(auth,sessions[2],other(7215,9215,key)),
  kCommit(auth,sessions[3],other(7422,9422,key)),
  commit(auth,sessions[4],req(18,4,key))
 ]);
 const wins=['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED','K04_WAITLIST_TRANSFERRED','L04_LOCK_TRANSFERRED'];
 const deny=['H04_CROSS_DOMAIN_KEY_DENY','I05_CROSS_DOMAIN_KEY_DENY','J05_CROSS_DOMAIN_KEY_DENY','K05_CROSS_DOMAIN_KEY_DENY','L05_CROSS_DOMAIN_KEY_DENY'];
 assert.equal(outcomes.filter(x=>wins.includes(x.code)).length,1,JSON.stringify(outcomes));
 assert.equal(outcomes.filter(x=>deny.includes(x.code)).length,4,JSON.stringify(outcomes));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('L05 five distinct domain keys can each succeed independently on five PC sessions',async()=>{
 const sessions=await Promise.all(Array.from({length:5},()=>login('manager').then(x=>x.token)));
 const before=await snapshot();
 const results=await Promise.all([
  hCommit(auth,manager,other(6004,7004,'l-distinct-H-0005')),
  iCommit(auth,sessions[1],other(6146,8146,'l-distinct-I-0046')),
  jCommit(auth,sessions[2],other(7221,9221,'l-distinct-J-0021')),
  kCommit(auth,sessions[3],other(7430,9430,'l-distinct-K-0030')),
  commit(auth,sessions[4],req(27,4,'l-distinct-L-0027'))
 ]);
 assert.deepEqual(results.map(x=>x.code),['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED','K04_WAITLIST_TRANSFERRED','L04_LOCK_TRANSFERRED'],JSON.stringify(results));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+5);
});
test('L04 two real PC sessions on same Lock serialize and second returns immutable idempotent receipt',async()=>{
 const p=req(28,4,'l-concurrent-same-lock-0028'),a=(await login('manager')).token,b=(await login('manager')).token;
 const before=await snapshot(),results=await Promise.all([commit(auth,a,p),commit(auth,b,p)]);
 assert.equal(results.filter(x=>x.code==='L04_LOCK_TRANSFERRED').length,1,JSON.stringify(results));
 assert.equal(results.filter(x=>x.code==='L05_IDEMPOTENT_RECEIPT').length,1,JSON.stringify(results));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('L05 two different Lock items same request SHA only one commits and writes receipt',async()=>{
 const key='l-different-items-same-sha-0025',before=await snapshot();
 const results=await Promise.all([commit(auth,manager,req(25,4,key)),commit(auth,(await login('manager')).token,req(30,4,key))]);
 assert.equal(results.filter(x=>x.code==='L04_LOCK_TRANSFERRED').length,1,JSON.stringify(results));
 assert.equal(results.filter(x=>x.code==='L05_COLLISION_DENY').length,1,JSON.stringify(results));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('L06 genuine successive Lock transfer preserves older receipt and detects unaudited drift',async()=>{
 const next={batchId:8460,itemId:10460,fromEmployeeId:4,recipientEmployeeId:5,teamId:901,clientRequestKey:'l-real-second-transfer-0060'};
 const first=await read(auth,manager,{batchId:8401,itemId:10401,teamId:901});assert.equal(first.code,'L05_RECEIPT_READ_ONLY');
 assert.equal((await commit(auth,manager,next)).code,'L04_LOCK_TRANSFERRED');
 assert.equal(await owner(1),'5');
 assert.deepEqual((await read(auth,manager,{batchId:8401,itemId:10401,teamId:901})).receipt,first.receipt);
 await db.query('UPDATE public.locks SET responsible_employee_id=6 WHERE lock_id=18001');
 try{assert.equal((await read(auth,manager,{batchId:8401,itemId:10401,teamId:901})).code,'L05_RECEIPT_PROOF_DENY')}
 finally{await db.query('UPDATE public.locks SET responsible_employee_id=5 WHERE lock_id=18001')}
});
test('L06 historical Lock receipt stays auditable after original responsible employee becomes inactive',async()=>{
 const baseline=await snapshot();
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  const original=await read(auth,manager,{batchId:8401,itemId:10401,teamId:901});
  const subsequent=await read(auth,manager,{batchId:8460,itemId:10460,teamId:901});
  assert.equal(original.code,'L05_RECEIPT_READ_ONLY');
  assert.equal(subsequent.code,'L05_RECEIPT_READ_ONLY');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 assert.deepEqual(await snapshot(),baseline);
});
test('L06 revoked current auditor personal permission and team capability deny historic receipt access',async()=>{
 const p={batchId:8401,itemId:10401,teamId:901};
 assert.equal((await read(auth,manager,p)).code,'L05_RECEIPT_READ_ONLY');
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=19");
 try{assert.equal((await read(auth,manager,p)).code,'L02_LOCK_PERMISSION_SCOPE_DENY')}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=19")}
 await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=19 AND scope_id=201");
 try{assert.equal((await read(auth,manager,p)).code,'L02_LOCK_PERMISSION_SCOPE_DENY')}
 finally{await db.query("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=19 AND scope_id=201")}
 assert.equal((await read(auth,manager,p)).code,'L05_RECEIPT_READ_ONLY');
});
test('L03 refundable financial case requires independent authority; Lock transfer does not touch funds or refund facts',async()=>{
 const before=await snapshot(),p=req(8,4,'l-existing-refund-deny-0008');
 await db.query("INSERT INTO public.refund_cases(refund_id,customer_id,lock_id,status,created_at) VALUES(98981,14308,18008,'pending',now())");
 try{
  assert.equal((await commit(auth,manager,p)).code,'L03_REFUND_FINANCIAL_SCOPE_DEFER_DENY');
  assert.equal(await owner(8),'7');
 }finally{await db.query('DELETE FROM public.refund_cases WHERE refund_id=98981')}
 assert.deepEqual(await snapshot(),before);
});

test('L02 inactive source with trusted SG06 batch differs from unexpected inactive source and recipient',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  assert.equal((await commit(auth,manager,req(24,4,'l-inactive-source-approved-0024'))).code,'L04_LOCK_TRANSFERRED');
  assert.equal((await commit(auth,manager,req(19,4,'l-inactive-source-denied-0019'))).code,'L03_SOURCE_INVALID');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{assert.equal((await commit(auth,manager,req(19,4,'l-inactive-recipient-0019'))).code,'L03_RECIPIENT_INVALID')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('L06 forged FK-valid immutable receipt cannot substitute for exact auditor transaction proof',async()=>{
 const p=req(7,4,'l-fake-audit-receipt-0007');
 const event=(await db.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee','5','{}'::jsonb,'Lock','18007','pc_password_self_change','{}'::jsonb,'{}'::jsonb,transaction_timestamp()) RETURNING audit_id")).rows[0].audit_id;
 await db.query('INSERT INTO public.lock_responsible_handover_receipts(item_id,batch_id,lock_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES(10407,8407,18007,14307,7,4,5,901,$1,$2)',[event,digest(p.clientRequestKey)]);
 assert.equal((await read(auth,manager,{batchId:8407,itemId:10407,teamId:901})).code,'L05_RECEIPT_PROOF_DENY');
 assert.equal((await retry(auth,manager,p)).code,'L05_RECEIPT_PROOF_DENY');
 assert.equal(await owner(7),'7');
});

test('L06 append-only record refuses mutation and migration rollback after use',async()=>{
 await assert.rejects(()=>db.query("DELETE FROM public.lock_responsible_handover_receipts WHERE item_id=10401"));
 await assert.rejects(()=>rollback(db),/L_RECEIPT_USED_ROLLBACK_DENY/);
});
