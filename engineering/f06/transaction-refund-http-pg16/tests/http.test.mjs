import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../service.mjs';
import {assertEntry,createHttpServer,childCall,productionRefundIssuerDeny} from '../server.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {recordSyntheticDepositCI,correctSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {requestSyntheticRefundCI,closeSyntheticRefundCI} from '../../refund-pending-ci/service.mjs';
const secret=Buffer.alloc(32,61),customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const signed='feat/f06-3c1-refund-pending-close-ci',depositBranch='feat/f06-3a-deposit-ledger-ci';
const route='/__ci__/f06-real-transaction-refund/';
const old=fn=>withF062(()=>withParentBranch(fn));
let db,auth,server,base,token,scopeId,managerRole,fourSRole,locks={},deposits={},transactions={},refunds={};
const q=(sql,args=[])=>db.query(sql,args);
const rows=async(sql,args=[]) => (await q(sql,args)).rows;
const count=async(sql,args=[]) => Number((await rows(sql,args))[0].n);
const key=n=>'f06-tx-refund-'+n+'-'+process.env.GITHUB_RUN_ID;
const requestPayload=(n,tx=transactions[1],amount=6000,extra={})=>({transactionId:tx,amountCents:amount,reason:'Synthetic Transaction refund request '+n,eventKey:key(n),...extra});
const closePayload=(n,id=refunds[1],extra={})=>({refundId:id,closeReason:'Synthetic no-payment Transaction refund closure '+n,eventKey:key(n),...extra});
async function call(path,body={},actor=token,method='POST',headers={}){
 const h={'content-type':'application/json',...headers};if(actor)h.authorization='Bearer '+actor;
 const r=await fetch(base+path,{method,headers:h,body:method==='GET'?undefined:JSON.stringify(body)});
 return {status:r.status,body:await r.json(),headers:r.headers};
}
const requestCall=(n,tx=transactions[1],amount=6000,extra={})=>call(route+'request',requestPayload(n,tx,amount,extra));
const closeCall=(n,id=refunds[1],extra={})=>call(route+'close',closePayload(n,id,extra));
async function underRef(ref,fn){const oldRef=process.env.GITHUB_REF,oldName=process.env.GITHUB_REF_NAME;
 process.env.GITHUB_REF='refs/heads/'+ref;process.env.GITHUB_REF_NAME=ref;
 try{return await fn()}finally{process.env.GITHUB_REF=oldRef;process.env.GITHUB_REF_NAME=oldName}}
async function openTransaction(n){
 const r=await childCall('open',token,{lockId:locks[n],eventKey:key('open-'+n)});
 assert.equal(r.allowed,true,JSON.stringify(r));assert.equal(r.code,'F06_TX_ATOMIC_SYNTHETIC_IN_PROGRESS');
 transactions[n]=Number(r.transactionId);assert.ok(transactions[n]>0);return transactions[n];
}
async function cancelTransaction(n){
 const r=await childCall('cancel',token,{transactionId:transactions[n],reason:'Synthetic cancel before Transaction Refund '+n,eventKey:key('cancel-'+n)});
 assert.equal(r.allowed,true,JSON.stringify(r));assert.equal(r.code,'F06_CANCEL_CANCELLED_NO_PAYMENT');return r;
}
async function facts(txId){
 return (await rows("SELECT t.status tx_status,t.completed_at,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,t.responsible_employee_id,"+
  "(SELECT count(*)::int FROM public.refund_cases r WHERE r.transaction_id=t.transaction_id) public_cases,"+
  "(SELECT count(*)::int FROM f06_real_tx_refund_ci.origins o WHERE o.transaction_id=t.transaction_id) origins,"+
  "(SELECT count(*)::int FROM f06_real_tx_refund_ci.events e WHERE e.transaction_id=t.transaction_id) events,"+
  "(SELECT count(*)::int FROM f06_real_tx_refund_ci.request_keys k WHERE k.transaction_id=t.transaction_id) keys,"+
  "(SELECT count(*)::int FROM public.audit_events a WHERE a.object_kind='Refund' AND a.object_id IN "+
   "(SELECT r.refund_id::text FROM public.refund_cases r WHERE r.transaction_id=t.transaction_id) AND a.action IN('f06_real_tx_refund_ci_pending','f06_real_tx_refund_ci_closed')) audits,"+
  "(SELECT count(*)::int FROM public.refund_payments p JOIN public.refund_cases r USING(refund_id) WHERE r.transaction_id=t.transaction_id) payments "+
  "FROM public.transactions t WHERE t.transaction_id=$1",[txId]))[0];
}
async function caseFacts(refundId){
 return (await rows("SELECT r.refund_id,r.lock_id,r.transaction_id,r.status,r.expected_amount_cents,r.close_reason,r.closed_at,"+
  "(SELECT count(*)::int FROM f06_real_tx_refund_ci.origins o WHERE o.refund_id=r.refund_id) origins,"+
  "(SELECT count(*)::int FROM f06_real_tx_refund_ci.events e WHERE e.refund_id=r.refund_id) events,"+
  "(SELECT count(*)::int FROM f06_real_tx_refund_ci.request_keys k WHERE k.refund_id=r.refund_id) keys,"+
  "(SELECT count(*)::int FROM public.refund_payments p WHERE p.refund_id=r.refund_id) payments "+
  "FROM public.refund_cases r WHERE r.refund_id=$1",[refundId]))[0];
}
async function insertSyntheticPayment(refundId){
 const cols=await rows("SELECT column_name,is_nullable,column_default,data_type,is_identity FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_payments' ORDER BY ordinal_position");
 const values={refund_id:refundId,amount_cents:1,paid_at:new Date(),created_at:new Date(),recorded_at:new Date(),
  payment_method:'bank_transfer',currency:'CNY',payment_reference:'CI_SYNTHETIC_NOT_REAL_MONEY',note:'Synthetic payment blocker',
  issuer_kind:'CI_SYNTHETIC_NOT_REAL_MONEY',recorded_by:1,actor_employee_id:1,source:'CI_SYNTHETIC_NOT_REAL_MONEY'};
 const use=[],args=[];
 for(const c of cols){
  if(c.is_identity==='ALWAYS'||c.column_name==='payment_id')continue;
  if(Object.prototype.hasOwnProperty.call(values,c.column_name)){use.push(c.column_name);args.push(values[c.column_name]);continue}
  if(c.column_default!==null)continue;
  if(c.is_nullable==='YES'){continue}
  if(c.data_type==='boolean'){use.push(c.column_name);args.push(false)}
  else if(c.data_type==='json'||c.data_type==='jsonb'){use.push(c.column_name);args.push('{}')}
  else if(c.data_type.includes('timestamp')||c.data_type==='date'){use.push(c.column_name);args.push(new Date())}
  else if(['smallint','integer','bigint','numeric','real','double precision'].includes(c.data_type)){use.push(c.column_name);args.push(1)}
  else if(c.data_type==='text'||c.data_type.includes('character')){use.push(c.column_name);args.push('CI_SYNTHETIC_NOT_REAL_MONEY')}
  else throw Error('TEST_FIXTURE_UNKNOWN_REQUIRED_PAYMENT_COLUMN_'+c.column_name+'_'+c.data_type);
 }
 const sql='INSERT INTO public.refund_payments('+use.join(',')+') VALUES('+args.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING payment_id';
 return Number((await q(sql,args)).rows[0].payment_id);
}
before(async()=>{
 assertEntry();db=await connect();assert.equal((await verify(db)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 const roles=await rows("SELECT role_id,role_code FROM public.roles WHERE role_code IN('manager','four_s')");
 managerRole=Number(roles.find(x=>x.role_code==='manager')?.role_id);
 fourSRole=Number(roles.find(x=>x.role_code==='four_s')?.role_id);
 assert.ok(managerRole>0&&fourSRole>0);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[managerRole]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await rows('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];assert.ok(team?.team_id);
 const scope=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 assert.ok(scope?.scope_id);scopeId=Number(scope.scope_id);
 const permissions=[
  [986001,'transaction.ci.open'],[986002,'transaction.ci.cancel'],[986003,'deposit.ci.record'],
  [986004,'deposit.ci.correct'],[986005,'refund.ci.request'],
  [986006,'transaction.refund.ci.request'],[986007,'transaction.refund.ci.close']
 ];
 for(const [permissionId,code] of permissions){
  await q('INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2)',[permissionId,code]);
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[permissionId]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[permissionId,scopeId]);
 }
 token=(await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-tx-refund-current'})).token;assert.ok(token);
 for(let n=1;n<=11;n++){
  const intake=await old(()=>intakeCI(db,{requestKey:key('intake-'+n),customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),
   syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(intake.allowed,true,JSON.stringify(intake));
  const d=await old(()=>decisionCI(auth,token,{requestId:intake.requestId,requestKey:key('approve-'+n),action:'approve'}));
  assert.equal(d.allowed,true,JSON.stringify(d));locks[n]=Number(d.lockId);
 }
 for(let n=1;n<=11;n++){
  const dep=await underRef(depositBranch,()=>recordSyntheticDepositCI(auth,token,{lockId:locks[n],amountCents:12000,currency:'CNY',
   paymentMethod:'bank_transfer',eventKey:key('deposit-'+n),receivedAt:new Date(Date.now()-3600000).toISOString(),
   syntheticVoucher:'CI-TX-REFUND-'+n,note:'Synthetic Transaction refund balance'}));
  assert.equal(dep.allowed,true,JSON.stringify(dep));deposits[n]=Number(dep.depositId);
 }
 // Signed corrections exercise both positive and negative net balances.
 const c2=await underRef(depositBranch,()=>correctSyntheticDepositCI(auth,token,{lockId:locks[2],depositId:deposits[2],
  action:'correction',deltaCents:-3000,currency:'CNY',eventKey:key('correction-minus'),reason:'Synthetic signed correction minus three thousand'}));
 assert.equal(c2.allowed,true,JSON.stringify(c2));
 const c9=await underRef(depositBranch,()=>correctSyntheticDepositCI(auth,token,{lockId:locks[9],depositId:deposits[9],
  action:'correction',deltaCents:2000,currency:'CNY',eventKey:key('correction-plus'),reason:'Synthetic signed correction plus two thousand'}));
 assert.equal(c9.allowed,true,JSON.stringify(c9));
 // Build one fully signed, no-payment Lock-side closed case before its Tx exists.
 const lockPending=await requestSyntheticRefundCI(auth,token,{lockId:locks[10],amountCents:1000,reason:'Synthetic historical Lock-side request',
  eventKey:key('lock-refund-request'),subjectKind:'lock'});
 assert.equal(lockPending.allowed,true,JSON.stringify(lockPending));const oldLockRefund=Number(lockPending.refundId);
 const lockClosed=await closeSyntheticRefundCI(auth,token,{refundId:oldLockRefund,closeReason:'Synthetic historical Lock-side no-payment close',eventKey:key('lock-refund-close')});
 assert.equal(lockClosed.allowed,true,JSON.stringify(lockClosed));
 for(let n=1;n<=10;n++){await openTransaction(n);await cancelTransaction(n)}
 await openTransaction(11); // intentionally remains in_progress as a negative case
 server=createHttpServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{
 if(server?.listening)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
 if(auth)await auth.close();if(db)await db.end();secret.fill(0);
});
test('01 当前Run、HEAD与隔离父签名入口精确绑定',()=>assertEntry());
test('02 生产Transaction退款Issuer未接入',()=>assert.equal(productionRefundIssuerDeny().allowed,false));
test('03 refunded/实际退款功能明确拒绝',async()=>{
 const {refundedDeny}=await import('../service.mjs');assert.equal(refundedDeny().allowed,false);
});
test('04 正式Refund REST不存在',async()=>assert.equal((await call('/api/v1/refunds')).status,404));
test('05 正式refund_payments REST不存在',async()=>assert.equal((await call('/api/v1/refund_payments')).status,404));
test('06 正式Transaction退款路由不存在',async()=>assert.equal((await call('/api/v1/transactions/1/refund')).status,404));
test('07 正式Transaction取消路由不存在',async()=>assert.equal((await call('/api/v1/transactions/1/cancel')).status,404));
test('08 GET request拒绝',async()=>assert.equal((await call(route+'request',{},token,'GET')).status,404));
test('09 无Bearer立即拒绝',async()=>assert.equal((await call(route+'request',requestPayload('no-token'),null)).status,401));
test('10 伪造Bearer拒绝',async()=>assert.equal((await call(route+'request',requestPayload('forged'),'0'.repeat(43))).status,401));
test('11 不支持媒体类型拒绝',async()=>assert.equal((await call(route+'request',{},token,'POST',{'content-type':'text/plain'})).status,415));
test('12 非法Transaction与金额参数拒绝',async()=>{
 const a=await requestCall('invalid-tx',-1,1000);assert.equal(a.status,400);
 const b=await requestCall('invalid-money',transactions[1],0);assert.equal(b.status,400);
});
test('13 未取消in_progress Transaction不可申请Refund',async()=>{
 const r=await requestCall('in-progress-deny',transactions[11],1000);assert.equal(r.body.code,'F06_TX_REFUND_ONLY_CANCELLED_TRANSACTION');
});
test('14 合法PR139+PR146签名cancelled Transaction真实HTTP发起pending',async()=>{
 const r=await requestCall('pending-first',transactions[1],6000);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.code,'F06_TX_REFUND_PENDING_NO_PAYMENT');
 assert.ok(r.body.refundId>0&&r.body.backendPid>0);refunds[1]=Number(r.body.refundId);
 console.log('F06_TX_REFUND_HTTP_PG_BACKEND_REQUEST',r.body.backendPid);
});
test('15 public subject严格为transaction_id非空且lock_id为空',async()=>{
 const x=await caseFacts(refunds[1]);assert.equal(x.lock_id,null);assert.equal(Number(x.transaction_id),transactions[1]);
 assert.equal(x.status,'pending');assert.equal(Number(x.expected_amount_cents),6000);
});
test('16 新Refund原件绑定PR139与PR146签名源、Deposit净额和原Lock',async()=>{
 const x=(await rows('SELECT * FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1',[refunds[1]]))[0];
 assert.equal(Number(x.transaction_id),transactions[1]);assert.equal(Number(x.source_lock_id),locks[1]);
 assert.equal(Number(x.net_deposit_cents),12000);assert.equal(Number(x.available_balance_cents),12000);
 assert.match(x.source_tx_digest,/^[a-f0-9]{64}$/);assert.match(x.source_cancel_digest,/^[a-f0-9]{64}$/);
 assert.match(x.source_deposit_digest,/^[a-f0-9]{64}$/);assert.match(x.source_lock_refund_digest,/^[a-f0-9]{64}$/);
});
test('17 同Actor同Key同Payload重放幂等不新增行',async()=>{
 const oldFacts=await caseFacts(refunds[1]);const r=await requestCall('pending-first',transactions[1],6000);
 assert.equal(r.status,200);assert.equal(r.body.code,'F06_TX_REFUND_IDEMPOTENT_REQUEST');
 assert.deepEqual(await caseFacts(refunds[1]),oldFacts);
});
test('18 同Key篡改金额或理由冲突',async()=>{
 const r=await requestCall('pending-first',transactions[1],5000,{reason:'Different payload using the same idempotency key'});
 assert.equal(r.body.code,'F06_TX_REFUND_IDEMPOTENCY_CONFLICT');
});
test('19 同Key跨Transaction subject冲突',async()=>{
 const r=await requestCall('pending-first',transactions[2],1000);
 assert.equal(r.body.code,'F06_TX_REFUND_IDEMPOTENCY_CONFLICT');
});
test('20 已存在同Transaction Refund不可再建第二笔',async()=>{
 const r=await requestCall('second-refund-same-tx',transactions[1],1000);
 assert.equal(r.body.code,'F06_TX_REFUND_ALREADY_EXISTS');
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases WHERE transaction_id=$1',[transactions[1]]),1);
});
test('21 签名Correction扣减后的净余额9000，超额9001严格拒绝',async()=>{
 const over=await requestCall('over-net-correction',transactions[2],9001);
 assert.equal(over.body.code,'F06_TX_REFUND_EXCEEDS_AVAILABLE_BALANCE');
});
test('22 签名Correction扣减后的合法余额9000可以申请',async()=>{
 const r=await requestCall('net-minus-correction',transactions[2],9000);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.code,'F06_TX_REFUND_PENDING_NO_PAYMENT');refunds[2]=Number(r.body.refundId);
 const o=(await rows('SELECT net_deposit_cents,available_balance_cents FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1',[refunds[2]]))[0];
 assert.deepEqual([Number(o.net_deposit_cents),Number(o.available_balance_cents)],[9000,9000]);
});
test('23 真实源车变不可售、ListingCycle结束后仍可无付款closed',async()=>{
 await q("UPDATE public.vehicles SET source_sale_status='unavailable' WHERE vehicle_id=$1",[vehicle(1)]);
 await q('UPDATE public.vehicle_listing_cycles SET ended_at=clock_timestamp() WHERE listing_cycle_id=$1 AND ended_at IS NULL',[cycle(1)]);
 const r=await closeCall('close-after-supply-change',refunds[1]);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.code,'F06_TX_REFUND_CLOSED_WITHOUT_PAYMENT');
 assert.ok(r.body.backendPid>0);console.log('F06_TX_REFUND_HTTP_PG_BACKEND_CLOSE',r.body.backendPid);
});
test('24 closed只更新Refund主体，不复活Lock/Transaction/车辆/周期',async()=>{
 const x=await caseFacts(refunds[1]);assert.equal(x.status,'closed');assert.equal(x.lock_id,null);
 assert.equal(Number(x.transaction_id),transactions[1]);assert.ok(x.closed_at);assert.equal(x.payments,0);
 const lock=(await rows('SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]))[0];
 assert.deepEqual([lock.lock_status,lock.end_reason],['released','converted_to_transaction']);
 const tx=(await rows('SELECT status,completed_at FROM public.transactions WHERE transaction_id=$1',[transactions[1]]))[0];
 assert.deepEqual([tx.status,tx.completed_at],['cancelled',null]);
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vehicle(1)]),1);
 assert.equal((await rows('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[vehicle(1)]))[0].source_sale_status,'unavailable');
});
test('25 同Close Key同Payload幂等',async()=>{
 const r=await closeCall('close-after-supply-change',refunds[1]);
 assert.equal(r.status,200);assert.equal(r.body.code,'F06_TX_REFUND_IDEMPOTENT_CLOSE');
});
test('26 同Close Key篡改理由冲突',async()=>{
 const r=await closeCall('close-after-supply-change',refunds[1],{closeReason:'A different close reason reusing the same key'});
 assert.equal(r.body.code,'F06_TX_REFUND_IDEMPOTENCY_CONFLICT');
});
test('27 closed终态不可重开或再关闭',async()=>{
 const r=await closeCall('close-terminal-again',refunds[1]);assert.equal(r.body.code,'F06_TX_REFUND_ALREADY_TERMINAL');
});
test('28 独立Close Permission撤销后不得关闭pending Refund',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=986007");
 try{const r=await closeCall('close-permission-revoked',refunds[2]);assert.equal(r.body.code,'F06_TX_REFUND_CLOSE_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=986007")}
});
test('29 真实/伪造Payment事实存在时绝不无付款closed',async()=>{
 const payment=await insertSyntheticPayment(refunds[2]);
 try{const r=await closeCall('deny-payment-fact',refunds[2]);assert.equal(r.body.code,'F06_TX_REFUND_REAL_PAYMENT_SOURCE_GAP')}
 finally{await q('DELETE FROM public.refund_payments WHERE payment_id=$1',[payment])}
 assert.equal((await caseFacts(refunds[2])).status,'pending');
});
test('30 AFTER_CLOSE_THROW真实PG16事务Rollback',async()=>{
 const before=await caseFacts(refunds[2]);const f=await facts(transactions[2]);
 const r=await closeCall('close-rollback-status',refunds[2],{testCheckpoint:'AFTER_CLOSE_THROW'});
 assert.equal(r.body.code,'F06_TX_REFUND_ATOMIC_ROLLED_BACK');assert.deepEqual(await caseFacts(refunds[2]),before);
 assert.deepEqual(await facts(transactions[2]),f);
});
test('31 AFTER_EVENT_THROW真实PG16事务Rollback',async()=>{
 const before=await caseFacts(refunds[2]);
 const r=await closeCall('close-rollback-event',refunds[2],{testCheckpoint:'AFTER_EVENT_THROW'});
 assert.equal(r.body.code,'F06_TX_REFUND_ATOMIC_ROLLED_BACK');assert.deepEqual(await caseFacts(refunds[2]),before);
});
test('32 AFTER_AUDIT_THROW真实PG16事务Rollback',async()=>{
 const before=await caseFacts(refunds[2]);
 const r=await closeCall('close-rollback-audit',refunds[2],{testCheckpoint:'AFTER_AUDIT_THROW'});
 assert.equal(r.body.code,'F06_TX_REFUND_ATOMIC_ROLLED_BACK');assert.deepEqual(await caseFacts(refunds[2]),before);
});
test('33 关闭注错后public status/Event/Key/Audit没有半写',async()=>{
 const x=await caseFacts(refunds[2]);assert.equal(x.status,'pending');
 assert.deepEqual([x.origins,x.events,x.keys,x.audits,x.payments],[1,1,1,1,0]);
});
test('34 正常无付款closed可在Rollback后重试',async()=>{
 const r=await closeCall('close-after-rollback',refunds[2]);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.code,'F06_TX_REFUND_CLOSED_WITHOUT_PAYMENT');
});
test('35 AFTER_PENDING_THROW真实PG16事务Rollback',async()=>{
 const before=await facts(transactions[8]);
 const r=await requestCall('request-rollback-pending',transactions[8],4000,{testCheckpoint:'AFTER_PENDING_THROW'});
 assert.equal(r.body.code,'F06_TX_REFUND_ATOMIC_ROLLED_BACK');assert.deepEqual(await facts(transactions[8]),before);
});
test('36 AFTER_EVENT_THROW申请真实PG16事务Rollback',async()=>{
 const before=await facts(transactions[8]);
 const r=await requestCall('request-rollback-event',transactions[8],4000,{testCheckpoint:'AFTER_EVENT_THROW'});
 assert.equal(r.body.code,'F06_TX_REFUND_ATOMIC_ROLLED_BACK');assert.deepEqual(await facts(transactions[8]),before);
});
test('37 AFTER_AUDIT_THROW申请真实PG16事务Rollback',async()=>{
 const before=await facts(transactions[8]);
 const r=await requestCall('request-rollback-audit',transactions[8],4000,{testCheckpoint:'AFTER_AUDIT_THROW'});
 assert.equal(r.body.code,'F06_TX_REFUND_ATOMIC_ROLLED_BACK');assert.deepEqual(await facts(transactions[8]),before);
});
test('38 申请注错后所有公共与侧签记录零残留',async()=>{
 const x=await facts(transactions[8]);assert.deepEqual([x.tx_status,x.public_cases,x.origins,x.events,x.keys,x.audits,x.payments],['cancelled',0,0,0,0,0,0]);
});
test('39 合法余额请求在注错后可以成功',async()=>{
 const r=await requestCall('request-after-rollback',transactions[8],4000);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.code,'F06_TX_REFUND_PENDING_NO_PAYMENT');refunds[8]=Number(r.body.refundId);
});
test('40 双独立PG16业务Backend争抢同一Transaction的Refund只有一笔成功',async()=>{
 const [a,b]=await Promise.all([requestCall('race-a',transactions[3],5000),requestCall('race-b',transactions[3],5000)]);
 assert.equal(Number(a.body.allowed)+Number(b.body.allowed),1,JSON.stringify({a:a.body,b:b.body}));
 const winner=a.body.allowed?a:b;refunds[3]=Number(winner.body.refundId);
 assert.ok(a.body.backendPid&&b.body.backendPid&&a.body.backendPid!==b.body.backendPid);
 console.log('F06_TX_REFUND_TWO_PG_BACKENDS',JSON.stringify({a:a.body.backendPid,b:b.body.backendPid,winnerRefundId:refunds[3]}));
});
test('41 并发败方不留第二Case/Origin/Event/Key/Audit',async()=>{
 const x=await facts(transactions[3]);assert.deepEqual([x.public_cases,x.origins,x.events,x.keys,x.audits],[1,1,1,1,1]);
});
test('42 正向余额+已签Correction得到14000，允许按净余额申请',async()=>{
 const r=await requestCall('net-plus-correction',transactions[9],14000);
 assert.equal(r.status,201,JSON.stringify(r.body));refunds[9]=Number(r.body.refundId);
 const o=(await rows('SELECT net_deposit_cents,available_balance_cents FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1',[refunds[9]]))[0];
 assert.deepEqual([Number(o.net_deposit_cents),Number(o.available_balance_cents)],[14000,14000]);
});
test('43 有效历史Lock-side closed Refund不能换绑成Transaction Refund',async()=>{
 const r=await requestCall('lock-subject-not-rebind',transactions[10],1000);
 assert.equal(r.body.code,'F06_TX_REFUND_LOCK_REFUND_SUBJECT_CONFLICT');
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases WHERE transaction_id=$1',[transactions[10]]),0);
 const old=(await rows('SELECT lock_id,transaction_id,status FROM public.refund_cases WHERE refund_id=$1',[Number((await rows('SELECT refund_id FROM f06_3c1_ci.refund_origins WHERE lock_id=$1',[locks[10]]))[0].refund_id)]))[0];
 assert.equal(Number(old.lock_id),locks[10]);assert.equal(old.transaction_id,null);assert.equal(old.status,'closed');
});
test('44 原Lock历史和新Transaction退款始终是两个不同subject',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases WHERE lock_id=$1 AND transaction_id IS NULL',[locks[10]]),1);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases WHERE transaction_id=$1 AND lock_id IS NULL',[transactions[10]]),0);
});
test('45 未签Deposit即使公共receipt存在也必须FailClosed',async()=>{
 const x=await q("INSERT INTO public.deposit_receipts(customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES($1,$2,100,clock_timestamp(),1) RETURNING deposit_id",[customer,locks[5]]);
 const depositId=Number(x.rows[0].deposit_id);
 try{const r=await requestCall('unsigned-deposit',transactions[5],100);assert.equal(r.body.code,'F06_TX_REFUND_UNKNOWN_DEPOSIT_ORIGIN')}
 finally{await q('DELETE FROM public.deposit_receipts WHERE deposit_id=$1',[depositId])}
});
test('46 同Lock出现未签pending退款冲突时必须FailClosed',async()=>{
 const x=await q("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,$2,NULL,'pending',300) RETURNING refund_id",[customer,locks[6]]);
 const id=Number(x.rows[0].refund_id);
 try{const r=await requestCall('unsigned-lock-pending',transactions[6],100);assert.equal(r.body.code,'F06_TX_REFUND_LOCK_CASE_NOT_SIGNED_CLOSED')}
 finally{await q('DELETE FROM public.refund_cases WHERE refund_id=$1',[id])}
});
test('47 未签refunded公共事实不得冒充已签无付款关闭',async()=>{
 const x=await q("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,$2,NULL,'refunded',300) RETURNING refund_id",[customer,locks[7]]);
 const id=Number(x.rows[0].refund_id);
 try{const r=await requestCall('unsigned-refunded',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_LOCK_CASE_NOT_SIGNED_CLOSED')}
 finally{await q('DELETE FROM public.refund_cases WHERE refund_id=$1',[id])}
});
test('48 取消来源或签名Carrier丢失不得发起退款',async()=>{
 const origin=(await rows('SELECT * FROM f06_real_cancel_ci.origins WHERE transaction_id=$1',[transactions[7]]))[0];assert.ok(origin);
 await assert.rejects(q('UPDATE f06_real_cancel_ci.origins SET reason=reason WHERE transaction_id=$1',[transactions[7]]),/F06_REAL_CANCEL_SIGNED_HISTORY_IMMUTABLE/);
 const r=await requestCall('source-valid-after-rejected-mutation',transactions[7],12001);
 assert.equal(r.body.code,'F06_TX_REFUND_EXCEEDS_AVAILABLE_BALANCE');
});
test('49 当前负责人撤权后不能申请',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=986006");
 try{const r=await requestCall('permission-revoked',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=986006")}
});
test('50 Capability失效后不能申请',async()=>{
 await q('UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=986006');
 try{const r=await requestCall('capability-revoked',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=986006')}
});
test('51 当前Team/Object Scope失效后不能申请',async()=>{
 await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1',[scopeId]);
 try{const r=await requestCall('scope-revoked',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1',[scopeId])}
});
test('52 4S角色即使使用有效Token也不能申请Transaction退款',async()=>{
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[fourSRole]);
 try{const r=await requestCall('four-s-deny',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[managerRole])}
});
test('53 禁用Customer必须FailClosed',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{const r=await requestCall('customer-disabled',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_CUSTOMER_DISABLED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('54 非当前Transaction负责人不得申请',async()=>{
 await q('UPDATE public.transactions SET responsible_employee_id=2 WHERE transaction_id=$1',[transactions[7]]);
 try{const r=await requestCall('not-current-responsible',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.transactions SET responsible_employee_id=1 WHERE transaction_id=$1',[transactions[7]])}
});
test('55 public Transaction不是cancelled时拒绝',async()=>{
 await q("UPDATE public.transactions SET status='in_progress' WHERE transaction_id=$1",[transactions[7]]);
 try{const r=await requestCall('public-state-drift',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_ONLY_CANCELLED_TRANSACTION')}
 finally{await q("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1",[transactions[7]])}
});
test('56 同交易存在无签名public Refund case不得忽略',async()=>{
 const x=await q("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,NULL,$2,'pending',100) RETURNING refund_id",[customer,transactions[7]]);
 const id=Number(x.rows[0].refund_id);
 try{const r=await requestCall('unsigned-tx-refund',transactions[7],100);assert.equal(r.body.code,'F06_TX_REFUND_UNSIGNED_EXISTING_CASE')}
 finally{await q('DELETE FROM public.refund_cases WHERE refund_id=$1',[id])}
});
test('57 signed correction把净额降为零后不得新申请退款',async()=>{
 const c=await underRef(depositBranch,()=>correctSyntheticDepositCI(auth,token,{lockId:locks[5],depositId:deposits[5],
  action:'reversal',deltaCents:-12000,currency:'CNY',eventKey:key('reversal-to-zero'),reason:'Synthetic signed full deposit reversal'}));
 assert.equal(c.allowed,true,JSON.stringify(c));
 const r=await requestCall('zero-net-deny',transactions[5],1);assert.equal(r.body.code,'F06_TX_REFUND_NO_SIGNED_REFUNDABLE_BALANCE');
});
test('58 closed与pending都不写入refund_payments或refunded金额',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
 assert.equal(await count("SELECT count(*)::int n FROM public.refund_cases WHERE status='refunded'"),0);
 assert.equal((await caseFacts(refunds[1])).payments,0);assert.equal((await caseFacts(refunds[2])).payments,0);
});
test('59 历史Deposit/Correction和Lock/Waitlist/Priority来源未被移动或覆盖',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1',[locks[2]]),1);
 assert.equal(await count('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[deposits[2]]),1);
 assert.equal(await count('SELECT count(*)::int n FROM f06_real_tx_ci.origins WHERE transaction_id=$1',[transactions[2]]),1);
 assert.equal(await count('SELECT count(*)::int FROM public.locks WHERE lock_id=$1 AND lock_status=\'released\' AND end_reason=\'converted_to_transaction\'',[locks[2]]),1);
});
test('60 新sidecar append-only来源与事件不可改写',async()=>{
 await assert.rejects(q('UPDATE f06_real_tx_refund_ci.origins SET reason=reason WHERE refund_id=$1',[refunds[1]]),/F06_REAL_TX_REFUND_APPEND_ONLY_IMMUTABLE/);
 await assert.rejects(q('DELETE FROM f06_real_tx_refund_ci.events WHERE refund_id=$1',[refunds[1]]),/F06_REAL_TX_REFUND_APPEND_ONLY_IMMUTABLE/);
});
test('61 对外HTTP不泄露金额、手机号、VIN、Token或签名内容',async()=>{
 const r=await requestCall('public-no-sensitive-data',transactions[8],4000);
 const text=JSON.stringify(r.body);assert.ok(!/amountCents|netCents|availableCents|phone|vin|token|source_deposit_digest|source_tx_digest/i.test(text));
});
test('62 没有合法父签名来源时生产Refund Issuer保持关闭',()=>assert.equal(productionRefundIssuerDeny().allowed,false));
