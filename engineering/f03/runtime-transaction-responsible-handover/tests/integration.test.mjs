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
import {commitLockResponsibleHandover as lCommit} from '../../runtime-lock-responsible-handover/service.mjs';
import {prepareTransactionResponsibleHandover as prepare,commitTransactionResponsibleHandover as commit,retryTransactionResponsibleHandover as retry,readTransactionResponsibleHandoverReceipt as read} from '../service.mjs';
const db=await connect(),secret=randomBytes(32);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48981'});
const creds={manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],four:['four_s_test','SyntheticFourS_123456'],ordinary:['limit_test','SyntheticLimit_1234567'],admin:['admin_test','SyntheticAdmin_1234567']};
const login=async type=>{const [username,password]=creds[type];const r=await auth.login({login:username,password,source:'l_'+type+'_'+Math.random()});assert.equal(r.code,'AUTH_OK');return r};
const req=(n=1,to=4,key='m-ci-transaction-request-0001')=>({batchId:9500+n,itemId:12500+n,fromEmployeeId:7,recipientEmployeeId:to,teamId:901,clientRequestKey:key});
const owner=async n=>String((await db.query('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[39000+n])).rows[0].responsible_employee_id);
let manager,head,ordinary,four,admin,restricted;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const first=await login('manager');assert.equal(first.restricted,true);restricted=first.token;
 assert.equal((await auth.change({token:first.token,csrf:first.csrf,oldPassword:creds.manager[1],newPassword:'Synthetic2L_Lock_2026'})).code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 creds.manager[1]='Synthetic2L_Lock_2026';
 manager=(await login('manager')).token;head=(await login('head')).token;ordinary=(await login('ordinary')).token;four=(await login('four')).token;admin=(await login('admin')).token;
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
const other=(batch,item,key,team=901,to=4)=>({batchId:batch,itemId:item,fromEmployeeId:7,recipientEmployeeId:to,teamId:team,clientRequestKey:key});
const digest=k=>createHash('sha256').update(k,'utf8').digest('hex');
const tracked=['customers','customer_owner_history','customer_owner_handover_receipts','demands','demand_responsible_handover_receipts','consultations','consultation_assignee_handover_receipts','priority_leases','recommendations','vehicle_visibility_grants','waitlists','waitlist_responsible_handover_receipts','locks','lock_requests','deposit_receipts','refund_cases','refund_payments','transactions','handover_batches','handover_items','audit_events','employees','vehicle_listing_cycles','vehicles','lock_responsible_handover_receipts','transaction_responsible_handover_receipts'];
const snapshot=async()=>{const result={};for(const tab of tracked)result[tab]=(await db.query('SELECT to_jsonb(t)::text x FROM public.'+tab+' t ORDER BY to_jsonb(t)::text')).rows.map(r=>r.x);return result};
test('M01 one new append-only Transaction receipt; strict sealed 94-table real PG16',async()=>{
 assert.equal((await verify(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,94);
});
test('M02 genuine F03-1 manager authorization: ordinary sales, 4S, admin, restricted, no session denied',async()=>{
 for(const token of [ordinary,four,admin,restricted,null])assert.notEqual((await commit(auth,token,req())).code,'M04_TRANSACTION_TRANSFERRED');
});
test('M03 completed/cancelled Transaction terminal, pending refund and real multi-Deposit guarded',async()=>{
 const before=await snapshot();
 for(const n of [3,4])assert.equal((await commit(auth,manager,req(n,4,'m-terminal-state-'+n))).code,'M03_TRANSACTION_NOT_IN_PROGRESS');
 assert.equal((await commit(auth,manager,req(6,4,'m-pending-refund-0006'))).code,'M03_REFUND_FINANCIAL_SCOPE_DEFER_DENY');
 assert.equal((await prepare(auth,manager,req(51,4,'m-two-real-deposits-0051'))).code,'M01_PREPARED_READ_ONLY');
 assert.equal(await owner(3),'7');assert.equal(await owner(4),'7');assert.equal(await owner(6),'7');
 assert.deepEqual(await snapshot(),before);
});
test('M04 current Transaction only-column CAS and same-transaction auditor receipt',async()=>{
 const p=req(1,4,'m-transaction-real-commit-0001'),before=await snapshot();
 assert.equal((await prepare(auth,manager,p)).code,'M01_PREPARED_READ_ONLY');
 const r=await commit(auth,manager,p);assert.equal(r.code,'M04_TRANSACTION_TRANSFERRED',JSON.stringify(r));
 assert.equal(await owner(1),'4');
 assert.equal((await retry(auth,manager,p)).code,'M05_IDEMPOTENT_RECEIPT');
 assert.equal((await read(auth,manager,{batchId:p.batchId,itemId:p.itemId,teamId:901})).code,'M05_RECEIPT_READ_ONLY');
 const after=await snapshot();
 for(const tab of tracked.filter(x=>!['transactions','transaction_responsible_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[tab],before[tab],tab);
 assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('M04 five true PostgreSQL fault injection transaction rollback checkpoints',async()=>{
 for(const [i,point] of ['before_update','after_update','after_audit','after_receipt','before_commit'].entries()){
  const n=20+i,before=await snapshot();
  await assert.rejects(()=>commit(auth,manager,req(n,4,'m-fault-'+i+'-real-transaction'),{testCheckpoint:async step=>{if(step===point)throw Error('M_INJECT_'+point)}}),/M_INJECT_/);
  assert.equal(await owner(n),'7');assert.deepEqual(await snapshot(),before,point);
 }
});
test('M10 real in-flight Transaction completes at checkpoint: all owner/audit/receipt writes ROLLBACK',async()=>{
 const p=req(25,4,'m-precommit-terminal-0025'),before=await snapshot();
 const r=await commit(auth,manager,p,{testCheckpoint:async (stage,c)=>{
  if(stage==='before_commit')await c.query("UPDATE public.transactions SET status='completed',completed_at=clock_timestamp() WHERE transaction_id=39025");
 }});
 assert.equal(r.code,'M04_UNSAFE_FINANCIAL_OR_TRANSACTION_STATE_DEFER_DENY');
 assert.equal(r.transactionRolledBack,true);
 assert.equal(await owner(25),'7');
 assert.deepEqual(await snapshot(),before);
});
test('M02 current personal-deny, binding expiry and manager suspension deny new transfer',async()=>{
 const p=req(19,4,'m-personal-current-deny-0019');
 const edits=[
 ["UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=20","UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=20"],
 ["UPDATE public.employee_capability_scope_bindings SET ended_at=now() WHERE employee_id=5 AND permission_id=20 AND scope_id=201","UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=5 AND permission_id=20 AND scope_id=201"],
 ["UPDATE public.employees SET employment_status='inactive' WHERE employee_id=5","UPDATE public.employees SET employment_status='active' WHERE employee_id=5"]];
 for(const [bad,restore] of edits){await db.query(bad);try{assert.notEqual((await commit(auth,manager,p)).code,'M04_TRANSACTION_TRANSFERRED')}finally{await db.query(restore)}}
 assert.equal(await owner(19),'7');
});
test('M02 paused manager can authorize with current Team; foreign store-head cannot',async()=>{
 const p={...req(2,4,'m-foreign-team-manager-0002'),teamId:906},before=await snapshot();
 assert.notEqual((await commit(auth,head,p)).code,'M04_TRANSACTION_TRANSFERRED');
 await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=5");
 try{assert.equal((await commit(auth,manager,p)).code,'M04_TRANSACTION_TRANSFERRED')}finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=5")}
 const after=await snapshot();for(const tab of tracked.filter(x=>!['transactions','transaction_responsible_handover_receipts','audit_events'].includes(x)))assert.deepEqual(after[tab],before[tab],tab);
});
test('M03 original Lock and Transaction identity must match real customer/vehicle/listing cycle',async()=>{
 const p=req(8,4,'m-trusted-source-lock-0008'),before=await snapshot();
 // Existing sealed F02 identity FK explicitly disallows fabricating a source Lock.
 await assert.rejects(()=>db.query("UPDATE public.transactions SET source_lock_id=29009 WHERE transaction_id=39008"),e=>e.code==='23503');
 assert.equal((await prepare(auth,manager,p)).code,'M01_PREPARED_READ_ONLY');
 assert.equal(await owner(8),'7');assert.deepEqual(await snapshot(),before);
});
test('M03 current customer inactive, inactive listing and anomalous supply fail closed',async()=>{
 const p=req(8,4,'m-source-status-0008'),before=await snapshot();
 const edits=[
 ["UPDATE public.customers SET account_status='inactive' WHERE customer_id=25008","UPDATE public.customers SET account_status='active' WHERE customer_id=25008",'M03_CUSTOMER_INVALID'],
 ["UPDATE public.vehicle_listing_cycles SET ended_at=now() WHERE listing_cycle_id=33008","UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=33008",'M03_LISTING_SUPPLY_DEFER_DENY'],
 ["UPDATE public.vehicles SET source_sale_status='unavailable' WHERE vehicle_id=32008","UPDATE public.vehicles SET source_sale_status='available' WHERE vehicle_id=32008",'M03_LISTING_SUPPLY_DEFER_DENY']];
 for(const [bad,restore,expected] of edits){await db.query(bad);try{assert.equal((await commit(auth,manager,p)).code,expected)}finally{await db.query(restore)}}
 assert.deepEqual(await snapshot(),before);
});
test('M02 source sudden-inactive must be trusted batch; inactive destination never permitted',async()=>{
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{
  assert.equal((await commit(auth,manager,req(54,4,'m-trusted-source-inactive-0054'))).code,'M04_TRANSACTION_TRANSFERRED');
  assert.equal((await commit(auth,manager,req(19,4,'m-untrusted-source-inactive-0019'))).code,'M03_SOURCE_INVALID');
 }finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{assert.equal((await commit(auth,manager,req(19,4,'m-inactive-destination-0019'))).code,'M03_RECIPIENT_INVALID')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('M05 all 30 directed H/I/J/K/L/M true cross-domain real PG16 duplicate request keys',async()=>{
 const execute=async(d,n,key)=>{
  if(d==='H'){const headBatch=[6002,6005,6018,6020,6022].includes(n);return hCommit(auth,headBatch?head:manager,other(n,n===6005?7006:n+1000,key,901,[6002,6005,6020].includes(n)?6:4));}
  if(d==='I')return iCommit(auth,manager,other(n,n+2000,key));
  if(d==='J')return jCommit(auth,manager,other(n,n+2000,key));
  if(d==='K')return kCommit(auth,manager,other(n,n+2000,key));
  if(d==='L')return lCommit(auth,manager,{batchId:8400+n,itemId:10400+n,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:key});
  return commit(auth,manager,req(n,4,key));
 };
 const wins={H:'H03_OWNER_DOMAIN_TRANSFERRED',I:'I04_DEMAND_DOMAIN_TRANSFERRED',J:'J04_CONSULTATION_TRANSFERRED',K:'K04_WAITLIST_TRANSFERRED',L:'L04_LOCK_TRANSFERRED',M:'M04_TRANSACTION_TRANSFERRED'};
 const deny={H:'H04_CROSS_DOMAIN_KEY_DENY',I:'I05_CROSS_DOMAIN_KEY_DENY',J:'J05_CROSS_DOMAIN_KEY_DENY',K:'K05_CROSS_DOMAIN_KEY_DENY',L:'L05_CROSS_DOMAIN_KEY_DENY',M:'M05_CROSS_DOMAIN_KEY_DENY'};
 const cases=[
 ['H',6016,'I',6113],['I',6114,'H',6002],['H',6021,'J',7211],['J',7206,'H',6001],
 ['I',6115,'J',7214],['J',7207,'I',6116],['H',6017,'K',7406],['K',7407,'H',6019],
 ['I',6101,'K',7408],['K',7409,'I',6102],['J',7205,'K',7414],['K',7415,'J',7219],
 ['H',6019,'L',10],['L',11,'H',6003],['I',6110,'L',12],['L',13,'I',6111],
 ['J',7208,'L',14],['L',15,'J',7209],['K',7410,'L',16],['L',17,'K',7411],
 ['H',6018,'M',10],['M',11,'H',6003],['I',6103,'M',12],['M',13,'I',6104],
 ['J',7212,'M',14],['M',15,'J',7213],['K',7412,'M',16],['M',17,'K',7413],
 ['L',18,'M',18],['M',19,'L',19]];
 for(const [index,[a,ai,b,bi]] of cases.entries()){
  const key='m-ordered-shared-key-'+String(index).padStart(3,'0')+'-once';
  const first=await execute(a,ai,key);assert.equal(first.code,wins[a],JSON.stringify({a,ai,b,bi,first}));
  const second=await execute(b,bi,key);assert.equal(second.code,deny[b],JSON.stringify({a,ai,b,bi,second}));
  const count=(await db.query("SELECT (SELECT count(*) FROM public.customer_owner_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.demand_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.consultation_assignee_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.waitlist_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.lock_responsible_handover_receipts WHERE request_key_sha256=$1)+(SELECT count(*) FROM public.transaction_responsible_handover_receipts WHERE request_key_sha256=$1) AS n",[digest(key)])).rows[0].n;
  assert.equal(Number(count),1,'six-domain globally exactly one receipt');
 }
});
test('M05 six genuine current PC employee sessions same Key: exactly one domain commits',async()=>{
 const sessions=await Promise.all(Array.from({length:6},()=>login('manager').then(x=>x.token)));
 const key='m-six-real-concurrent-same-sha',before=await snapshot();
 const outcomes=await Promise.all([
 hCommit(auth,sessions[0],other(6015,7015,key,906)),
 iCommit(auth,sessions[1],other(6120,8120,key)),
 jCommit(auth,sessions[2],other(7215,9215,key)),
 kCommit(auth,sessions[3],other(7422,9422,key)),
 lCommit(auth,sessions[4],{batchId:8428,itemId:10428,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:key}),
 commit(auth,sessions[5],req(29,4,key))
 ]);
 const wins=['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED','K04_WAITLIST_TRANSFERRED','L04_LOCK_TRANSFERRED','M04_TRANSACTION_TRANSFERRED'];
 const deny=['H04_CROSS_DOMAIN_KEY_DENY','I05_CROSS_DOMAIN_KEY_DENY','J05_CROSS_DOMAIN_KEY_DENY','K05_CROSS_DOMAIN_KEY_DENY','L05_CROSS_DOMAIN_KEY_DENY','M05_CROSS_DOMAIN_KEY_DENY'];
 assert.equal(outcomes.filter(x=>wins.includes(x.code)).length,1,JSON.stringify(outcomes));
 assert.equal(outcomes.filter(x=>deny.includes(x.code)).length,5,JSON.stringify(outcomes));
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+1);
});
test('M05 six distinct globally unique keys six independent PC sessions all commit',async()=>{
 const sess=await Promise.all(Array.from({length:6},()=>login('manager').then(x=>x.token))),before=await snapshot();
 const r=await Promise.all([
 hCommit(auth,sess[0],other(6004,7004,'m-distinct-six-H')),
 iCommit(auth,sess[1],other(6146,8146,'m-distinct-six-I')),
 jCommit(auth,sess[2],other(7221,9221,'m-distinct-six-J')),
 kCommit(auth,sess[3],other(7430,9430,'m-distinct-six-K')),
 lCommit(auth,sess[4],{batchId:8427,itemId:10427,fromEmployeeId:7,recipientEmployeeId:4,teamId:901,clientRequestKey:'m-distinct-six-L'}),
 commit(auth,sess[5],req(30,4,'m-distinct-six-M'))]);
 assert.deepEqual(r.map(x=>x.code),['H03_OWNER_DOMAIN_TRANSFERRED','I04_DEMAND_DOMAIN_TRANSFERRED','J04_CONSULTATION_TRANSFERRED','K04_WAITLIST_TRANSFERRED','L04_LOCK_TRANSFERRED','M04_TRANSACTION_TRANSFERRED']);
 const after=await snapshot();assert.equal(after.audit_events.length,before.audit_events.length+6);
});
test('M04 same current Transaction two PostgreSQL sessions serialize to 1 win + 1 immutable retry',async()=>{
 const p=req(31,4,'m-transaction-concurrent-same-0031'),a=(await login('manager')).token,b=(await login('manager')).token;
 const before=await snapshot(),results=await Promise.all([commit(auth,a,p),commit(auth,b,p)]);
 assert.equal(results.filter(x=>x.code==='M04_TRANSACTION_TRANSFERRED').length,1,JSON.stringify(results));
 assert.equal(results.filter(x=>x.code==='M05_IDEMPOTENT_RECEIPT').length,1,JSON.stringify(results));
 assert.equal((await snapshot()).audit_events.length,before.audit_events.length+1);
});
test('M05 different Transaction items same request SHA must never both win',async()=>{
 const key='m-different-items-same-key',before=await snapshot();
 const results=await Promise.all([commit(auth,manager,req(32,4,key)),commit(auth,(await login('manager')).token,req(33,4,key))]);
 assert.equal(results.filter(x=>x.code==='M04_TRANSACTION_TRANSFERRED').length,1);
 assert.equal(results.filter(x=>x.code==='M05_COLLISION_DENY').length,1,JSON.stringify(results));
 assert.equal((await snapshot()).audit_events.length,before.audit_events.length+1);
});
test('M06 two consecutive legal Transaction moves keep both authentic earlier and later receipts readable',async()=>{
 const p={batchId:9561,itemId:12561,fromEmployeeId:4,recipientEmployeeId:5,teamId:901,clientRequestKey:'m-two-real-successive-0051'};
 const first=await read(auth,manager,{batchId:9501,itemId:12501,teamId:901});assert.equal(first.code,'M05_RECEIPT_READ_ONLY');
 assert.equal((await commit(auth,manager,p)).code,'M04_TRANSACTION_TRANSFERRED');
 assert.equal(await owner(1),'5');
 assert.deepEqual((await read(auth,manager,{batchId:9501,itemId:12501,teamId:901})).receipt,first.receipt);
 const baseline=await snapshot();
 await db.query('UPDATE public.transactions SET responsible_employee_id=6 WHERE transaction_id=39001');
 try{assert.equal((await read(auth,manager,{batchId:9501,itemId:12501,teamId:901})).code,'M05_RECEIPT_PROOF_DENY')}
 finally{await db.query('UPDATE public.transactions SET responsible_employee_id=5 WHERE transaction_id=39001')}
 assert.deepEqual(await snapshot(),baseline);
});
test('M06 audit remains available after historical source inactive; current reader personal deny blocks access',async()=>{
 const before=await snapshot();
 await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 try{assert.equal((await read(auth,manager,{batchId:9501,itemId:12501,teamId:901})).code,'M05_RECEIPT_READ_ONLY')}
 finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7")}
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=5 AND permission_id=20");
 try{assert.equal((await read(auth,manager,{batchId:9501,itemId:12501,teamId:901})).code,'M02_TRANSACTION_PERMISSION_SCOPE_DENY')}
 finally{await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=5 AND permission_id=20")}
 assert.deepEqual(await snapshot(),before);
});
test('M06 FK-valid false audit receipt fails strict Transaction-specific proof',async()=>{
 const p=req(7,4,'m-forged-history-0007');
 const audit=(await db.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee','5','{}'::jsonb,'Transaction','39007','pc_password_self_change','{}'::jsonb,'{}'::jsonb,transaction_timestamp()) RETURNING audit_id")).rows[0].audit_id;
 await db.query("INSERT INTO public.transaction_responsible_handover_receipts(item_id,batch_id,transaction_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES(12507,9507,39007,25007,7,4,5,901,$1,$2)",[audit,digest(p.clientRequestKey)]);
 assert.equal((await read(auth,manager,{batchId:9507,itemId:12507,teamId:901})).code,'M05_RECEIPT_PROOF_DENY');
 assert.equal((await retry(auth,manager,p)).code,'M05_RECEIPT_PROOF_DENY');
 assert.equal(await owner(7),'7');
});
test('M10 new PG16 financial refund record cannot slip after locked Transaction before CAS',async()=>{
 const p=req(36,4,'m-concurrent-refund-0036'),before=await snapshot(),observed=[];
 const r=await commit(auth,manager,p,{testCheckpoint:async stage=>{
  if(stage!=='before_update')return;
  const other=await connect();
  try{
   await other.query('BEGIN');await other.query("SET LOCAL lock_timeout='150ms'");
   await assert.rejects(()=>other.query("INSERT INTO public.refund_cases(refund_id,customer_id,transaction_id,status,created_at) VALUES(29936,25036,39036,'pending',clock_timestamp())"),e=>{observed.push(e.code);return e.code==='55P03'});
   await other.query('ROLLBACK');
  }finally{await other.end()}
 }});
 assert.equal(r.code,'M04_TRANSACTION_TRANSFERRED',JSON.stringify(r));
 assert.deepEqual(observed,['55P03']);
 assert.deepEqual((await snapshot()).refund_cases,before.refund_cases);
});
test('M06 immutable Transaction receipts refuse DELETE; migration used-history rollback forbidden',async()=>{
 await assert.rejects(()=>db.query('DELETE FROM public.transaction_responsible_handover_receipts WHERE item_id=12501'));
 await assert.rejects(()=>rollback(db),/M_RECEIPT_USED_ROLLBACK_DENY/);
});
