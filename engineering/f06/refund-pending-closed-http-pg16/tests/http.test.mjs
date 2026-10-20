import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {createHttpServer,assertRealEntry,childCall,productionRefundIssuer} from '../server.mjs';
const secret=Buffer.alloc(32,61), customer=86180101, vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF062(()=>withParentBranch(fn));
const pendingPath='/__ci__/f06-real-refund/pending',closedPath='/__ci__/f06-real-refund/closed';
let db,auth,server,base,token,scopeId,salesRole,fourSRole,locks={},first,firstClose,refundThree;
const q=(s,p=[])=>db.query(s,p);
const rows=async(s,p=[])=> (await q(s,p)).rows;
const key=n=>'f06-real-refund-http-'+n+'-'+process.env.GITHUB_RUN_ID;
const pending=(n,lock=locks[1],extra={})=>({lockId:lock,amountCents:2000,reason:'Synthetic pending reason '+n,eventKey:key(n),...extra});
const closed=(n,id=first,extra={})=>({refundId:id,closeReason:'Synthetic no-payment closure reason '+n,eventKey:key(n),...extra});
async function call(path=pendingPath,body={},actor=token,method='POST',headers={}){
 const reqHeaders={origin:base,'content-type':'application/json',...headers};
 if(actor)reqHeaders.authorization='Bearer '+actor;
 const r=await fetch(base+path,{method,headers:reqHeaders,body:method==='GET'?undefined:JSON.stringify(body)});
 return {status:r.status,body:await r.json(),headers:r.headers};
}
const pendingCall=(n,lock=locks[1],extra={})=>call(pendingPath,pending(n,lock,extra));
const closeCall=(n,id=first,extra={})=>call(closedPath,closed(n,id,extra));
async function counts(lock){
 return (await rows("SELECT l.lock_status,(SELECT count(*)::int FROM public.refund_cases r WHERE r.lock_id=l.lock_id) refunds, "+
 "(SELECT count(*)::int FROM public.transactions t WHERE t.source_lock_id=l.lock_id) txs, "+
 "(SELECT count(*)::int FROM f06_real_tx_ci.origins o WHERE o.source_lock_id=l.lock_id) tx_origins "+
 "FROM public.locks l WHERE lock_id=$1",[lock]))[0];
}
async function count(s,args=[]){return Number((await rows(s,args))[0].n)}
before(async()=>{
 assertRealEntry();db=await connect();assert.equal((await verify(db)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 const roles=await rows("SELECT role_id,role_code FROM public.roles WHERE role_code IN('sales','four_s')");
 salesRole=Number(roles.find(r=>r.role_code==='sales')?.role_id);
 fourSRole=Number(roles.find(r=>r.role_code==='four_s')?.role_id);
 assert.ok(salesRole>0&&fourSRole>0);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[salesRole]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await rows('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];
 assert.ok(team?.team_id);
 const scope=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 assert.ok(scope?.scope_id);scopeId=Number(scope.scope_id);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES "+
 "(965001,'refund.ci.request'),(965002,'deposit.ci.record'),(965003,'transaction.ci.open')");
 for(const id of [965001,965002,965003]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[id]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[id,scopeId]);
 }
 token=(await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-real-refund-http-current'})).token;
 assert.ok(token);
 for(let n=1;n<=8;n++){
  const intake=await old(()=>intakeCI(db,{requestKey:key('intake-'+n),customerId:customer,
   vehicleId:vehicle(n),listingCycleId:cycle(n),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(intake.allowed,true,JSON.stringify(intake));
  const d=await old(()=>decisionCI(auth,token,{requestId:intake.requestId,requestKey:key('approval-'+n),action:'approve'}));
  assert.equal(d.allowed,true,JSON.stringify(d));locks[n]=Number(d.lockId);
 }
 for(let n=1;n<=7;n++){
  const dep=await recordSyntheticDepositCI(auth,token,{lockId:locks[n],amountCents:12000,currency:'CNY',
   paymentMethod:'bank_transfer',eventKey:key('deposit-'+n),
   receivedAt:new Date(Date.now()-3600000).toISOString(),
   syntheticVoucher:'CI-ONLY-REFUND-'+n,note:'Synthetic refund eligibility'});
  assert.equal(dep.allowed,true,JSON.stringify(dep));
 }
 server=createHttpServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{
 if(server?.listening)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
 if(auth)await auth.close();if(db)await db.end();secret.fill(0);
});
test('01 原生仓库分支Push SHA与回环权限入口',()=>assertRealEntry());
test('02 实际生产Refund issuer没有接入',()=>assert.equal(productionRefundIssuer().allowed,false));
test('03 生产退款REST不存在',async()=>assert.equal((await call('/api/v1/refunds',{})).status,404));
test('04 生产退款支付REST不存在',async()=>assert.equal((await call('/api/v1/refund_payments',{})).status,404));
test('05 不携带Bearer立即拒绝',async()=>assert.equal((await call(pendingPath,pending('no-token'),null)).status,401));
test('06 伪造Bearer拒绝',async()=>assert.equal((await call(pendingPath,pending('bad-token'),'0000000000000000000000000000000000000000000')).status,401));
test('07 非JSON媒体类型拒绝',async()=>assert.equal((await call(pendingPath,pending('media'),token,'POST',{'content-type':'text/plain'})).status,415));
test('08 非JSON对象拒绝',async()=>assert.equal((await call(pendingPath,[])).status,400));
test('09 请求体超限拒绝',async()=>assert.equal((await call(pendingPath,{...pending('oversize'),padding:'x'.repeat(10000)})).status,413));
test('10 零金额不得申请',async()=>{const r=await pendingCall('zero',locks[2],{amountCents:0});assert.equal(r.body.code,'F06_3C1_INVALID_REQUEST')});
test('11 负金额不得申请',async()=>{const r=await pendingCall('negative',locks[2],{amountCents:-1});assert.equal(r.status,400)});
test('12 超过已签可退余额强拒',async()=>{const r=await pendingCall('over',locks[2],{amountCents:16000});assert.equal(r.body.code,'F06_3C1_OVER_REFUNDABLE_BALANCE')});
test('13 缺原因强拒',async()=>{const r=await pendingCall('reason',locks[2],{reason:'x'});assert.equal(r.status,400)});
test('14 签名F06-3C1真实父载体验证',async()=>{
 const r=await childCall('verify',token,{});assert.equal(r.allowed,true,JSON.stringify(r));assert.match(r.sourceSHA,/^[0-9a-f]{64}$/);
 console.log('F06_REFUND_NATIVE_SOURCE',JSON.stringify(r));
});
test('15 真HTTP合法Lock签名Refund pending落同事务',async()=>{
 const r=await pendingCall('first');assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal(r.body.code,'F06_3C1_PENDING_NO_PAYMENT');first=Number(r.body.refundId);assert.ok(first>0);
});
test('16 相同完整请求Key返回同一Refund',async()=>{
 const r=await pendingCall('first');assert.equal(r.status,200,JSON.stringify(r.body));
 assert.equal(Number(r.body.refundId),first);
});
test('17 同Key变更金额指纹冲突',async()=>{
 const r=await pendingCall('first',locks[1],{amountCents:3000});assert.equal(r.body.code,'F06_3C1_IDEMPOTENCY_CONFLICT');
});
test('18 同锁未完成pending不得再次新建',async()=>{
 const r=await pendingCall('second-pending');assert.equal(r.body.code,'F06_3C1_EXISTING_PENDING_OR_REFUNDED_CONFLICT');
});
test('19 原生pending事件和未支付来源链准确',async()=>{
 const r=await rows("SELECT r.status,r.transaction_id,o.issuer_kind,o.amount_cents,e.event_kind,e.resulting_status "+
  "FROM public.refund_cases r JOIN f06_3c1_ci.refund_origins o USING(refund_id) "+
  "JOIN f06_3c1_ci.status_events e USING(refund_id) WHERE r.refund_id=$1",[first]);
 assert.equal(r.length,1);assert.deepEqual([r[0].status,r[0].transaction_id,r[0].issuer_kind,r[0].event_kind],
  ['pending',null,'CI_SYNTHETIC_NO_MONEY','pending_requested']);
});
test('20 pending锁定当前Customer公海资格',async()=>{
 const x=await childCall('guards',token,{customerId:customer,vehicleId:vehicle(1)});
 assert.equal(x.allowed,true);assert.equal(x.customer.allowed,false);
 assert.equal(x.customer.code,'F06_3C1_PENDING_REFUND_PREVENTS_PUBLIC_POOL');
});
test('21 pending不实际占用Vehicle',async()=>{
 const x=await childCall('guards',token,{customerId:customer,vehicleId:vehicle(1)});
 assert.equal(x.vehicle.allowed,true);assert.equal(x.vehicle.pendingCount,1);
 assert.equal((await counts(locks[1])).txs,0);
});
test('22 所有pending始终0条退款付款事实',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('23 关闭pending不允许无原因',async()=>{
 const r=await closeCall('missing-reason',first,{closeReason:'x'});assert.equal(r.status,400);
});
test('24 真HTTP pending→closed带原因无付款',async()=>{
 const r=await closeCall('first-close');assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal(r.body.code,'F06_3C1_CLOSED_WITHOUT_PAYMENT');firstClose=r.body;
});
test('25 相同关闭Key重放保持closed',async()=>{
 const r=await closeCall('first-close');assert.equal(r.status,200);assert.equal(Number(r.body.refundId),first);
});
test('26 相同关闭Key变更原因拒绝',async()=>{
 const r=await closeCall('first-close',first,{closeReason:'Different synthetic closure without payment'});
 assert.equal(r.body.code,'F06_3C1_IDEMPOTENCY_CONFLICT');
});
test('27 已closed不可重复走不同Key',async()=>{
 const r=await closeCall('other-close');assert.equal(r.body.code,'F06_3C1_NOT_PENDING');
});
test('28 原退款来源不可物理UPDATE',async()=>{
 await assert.rejects(q('UPDATE f06_3c1_ci.refund_origins SET reason=reason WHERE refund_id=$1',[first]),/F06_3C1_APPEND_ONLY_HISTORY/);
});
test('29 旧pending/closed事件不可DELETE',async()=>{
 await assert.rejects(q('DELETE FROM f06_3c1_ci.status_events WHERE refund_id=$1',[first]),/F06_3C1_APPEND_ONLY_HISTORY/);
});
test('30 已签幂等键不可物理UPDATE',async()=>{
 await assert.rejects(q('UPDATE f06_3c1_ci.request_keys SET action=action WHERE refund_id=$1',[first]),/F06_3C1_APPEND_ONLY_HISTORY/);
});
test('31 closed后不再因本条pending触发公海保护',async()=>{
 const x=await childCall('guards',token,{customerId:customer,vehicleId:vehicle(1)});
 assert.equal(x.customer.allowed,true);assert.equal(x.vehicle.pendingCount,0);
});
test('32 closed不计退款支付，不回写原金额',async()=>{
 const r=await rows('SELECT status,expected_amount_cents,close_reason,closed_at FROM public.refund_cases WHERE refund_id=$1',[first]);
 assert.equal(r[0].status,'closed');assert.equal(Number(r[0].expected_amount_cents),2000);
 assert.ok(r[0].close_reason&&r[0].closed_at);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('33 原closed后再申请必须新Key、新真实Refund',async()=>{
 const r=await pendingCall('reopen-new-record');assert.equal(r.status,201,JSON.stringify(r.body));
 assert.notEqual(Number(r.body.refundId),first);
 const c=await closeCall('reopen-close',Number(r.body.refundId));assert.equal(c.status,201);
});
test('34 员工权限override撤销拒绝且无写入',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=965001");
 try{const r=await pendingCall('permission-deny',locks[2]);assert.equal(r.body.code,'F06_3C1_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=965001")}
});
test('35 capability到期立即拒旧Token',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965001");
 try{const r=await pendingCall('capability-deny',locks[2]);assert.equal(r.body.code,'F06_3C1_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=965001')}
});
test('36 Team/Object数据Scope结束拒绝',async()=>{
 await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1',[scopeId]);
 try{const r=await pendingCall('scope-deny',locks[2]);assert.equal(r.body.code,'F06_3C1_REQUEST_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1',[scopeId])}
});
test('37 Customer禁用不得新发pending',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{const r=await pendingCall('customer-deny',locks[2]);assert.equal(r.body.code,'F06_3C1_CUSTOMER_OR_CYCLE_UNTRUSTED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('38 4S身份即使伪造权限也不允许',async()=>{
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[fourSRole]);
 try{const r=await pendingCall('4s-deny',locks[2]);assert.equal(r.body.allowed,false)}
 finally{await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[salesRole])}
});
test('39 现时ListingCycle结束拒绝',async()=>{
 await q('UPDATE public.vehicle_listing_cycles SET ended_at=clock_timestamp() WHERE listing_cycle_id=$1',[cycle(2)]);
 try{const r=await pendingCall('ended-cycle',locks[2]);assert.equal(r.body.code,'F06_REFUND_CURRENT_LOCK_REQUIRED')}
 finally{await q('UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=$1',[cycle(2)])}
});
test('40 无已签Deposit可退余额拒绝',async()=>{
 const r=await pendingCall('no-money',locks[8]);assert.equal(r.body.code,'F06_3C1_UNVERIFIED_OR_ABSENT_MONEY');
});
for(const [n,checkpoint] of [[41,'AFTER_PENDING_THROW'],[42,'AFTER_EVENT_THROW'],[43,'AFTER_AUDIT_THROW']]){
 test(n+' 真PG16资金请求注错原子ROLLBACK '+checkpoint,async()=>{
  const r=await pendingCall('rollback-'+n,locks[2],{testCheckpoint:checkpoint});
  assert.equal(r.body.code,'F06_REFUND_ATOMIC_ROLLED_BACK',JSON.stringify(r.body));
  assert.equal((await counts(locks[2])).refunds,0);
 });
}
test('44 任意注错后没有Lock/Transaction/Refund半写',async()=>{
 const st=await counts(locks[2]);assert.deepEqual([st.lock_status,st.refunds,st.txs,st.tx_origins],['active',0,0,0]);
});
test('45 签名pending先COMMIT后Transaction转换硬拒',async()=>{
 const r=await pendingCall('refund-first',locks[3]);assert.equal(r.status,201,JSON.stringify(r.body));
 refundThree=Number(r.body.refundId);
 const tx=await childCall('transaction',token,{lockId:locks[3],eventKey:key('refund-first-tx')});
 assert.equal(tx.allowed,false,JSON.stringify(tx));assert.equal(tx.code,'F06_TX_LOCK_PENDING_REFUND_DENY');
 assert.equal((await counts(locks[3])).txs,0);
 console.log('F06_REFUND_FIRST_BLOCK_TX_PID',JSON.stringify({refund:r.body.backendPid,tx:tx.backendPid}));
});
test('46 真签名无付款closed后允许合法Transaction',async()=>{
 const c=await closeCall('close-before-tx',refundThree);assert.equal(c.status,201,JSON.stringify(c.body));
 const tx=await childCall('transaction',token,{lockId:locks[3],eventKey:key('closed-first-tx')});
 assert.equal(tx.allowed,true,JSON.stringify(tx));
 assert.equal((await counts(locks[3])).txs,1);
});
test('47 Transaction先提交则旧Lock退款申请硬拒',async()=>{
 const tx=await childCall('transaction',token,{lockId:locks[4],eventKey:key('tx-first')});
 assert.equal(tx.allowed,true,JSON.stringify(tx));
 const r=await pendingCall('tx-first-refund',locks[4]);assert.equal(r.body.allowed,false);
 assert.equal((await counts(locks[4])).refunds,0);
 console.log('F06_REFUND_TX_FIRST_BLOCK_REFUND_PIDS',JSON.stringify({tx:tx.backendPid,refund:r.body.backendPid}));
});
test('48 双独立真实PG backend同时申请Refund与Transaction最多成功一方',async()=>{
 const [r,tx]=await Promise.all([
  pendingCall('parallel-refund',locks[5]),
  childCall('transaction',token,{lockId:locks[5],eventKey:key('parallel-tx')})
 ]);
 assert.equal(Number(r.body.allowed)+Number(tx.allowed),1,JSON.stringify({refund:r.body,tx}));
 const st=await counts(locks[5]);
 assert.equal(st.txs+st.refunds,1);
 assert.ok(r.body.backendPid>0&&tx.backendPid>0&&r.body.backendPid!==tx.backendPid);
 console.log('F06_REFUND_TX_PARALLEL_BACKENDS',JSON.stringify({refundPid:r.body.backendPid,txPid:tx.backendPid,
  refund:r.body.code,transaction:tx.code,refunds:st.refunds,txs:st.txs}));
});
test('49 双独立真实PG backend争抢同一Lock退款只能有一个pending',async()=>{
 const [a,b]=await Promise.all([pendingCall('pending-race-a',locks[6]),pendingCall('pending-race-b',locks[6])]);
 assert.equal(Number(a.body.allowed)+Number(b.body.allowed),1,JSON.stringify({a:a.body,b:b.body}));
 assert.equal((await counts(locks[6])).refunds,1);
 assert.ok(a.body.backendPid&&b.body.backendPid&&a.body.backendPid!==b.body.backendPid);
 console.log('F06_REFUND_TWO_BACKEND_PENDING_RACE',JSON.stringify({a:a.body.backendPid,b:b.body.backendPid,one:true}));
});
test('50 多个并发request不能超额退款',async()=>{
 const n=await count("SELECT count(*)::int n FROM public.refund_cases WHERE lock_id=$1 AND status='pending'",[locks[6]]);
 assert.equal(n,1);assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('51 未签名多出来的Deposit历史应Fail Closed',async()=>{
 const inserted=await q("INSERT INTO public.deposit_receipts(customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES($1,$2,100,clock_timestamp(),1) RETURNING deposit_id",[customer,locks[7]]);
 const id=Number(inserted.rows[0].deposit_id);
 try{const r=await pendingCall('unsigned-deposit',locks[7]);assert.equal(r.body.code,'F06_3C1_UNVERIFIED_OR_ABSENT_MONEY')}
 finally{await q('DELETE FROM public.deposit_receipts WHERE deposit_id=$1',[id])}
});
test('52 未签名public pending历史保守拒绝不得发行新款',async()=>{
 const x=await q("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,$2,NULL,'pending',300) RETURNING refund_id",[customer,locks[7]]);
 try{const r=await pendingCall('unsigned-refund',locks[7]);assert.equal(r.body.code,'F06_3C1_EXISTING_PENDING_OR_REFUNDED_CONFLICT')}
 finally{await q('DELETE FROM public.refund_cases WHERE refund_id=$1',[x.rows[0].refund_id])}
});
test('53 未签名Refund关闭目标不得伪造',async()=>{
 const r=await closeCall('fake-source',999999999);assert.equal(r.body.code,'F06_REFUND_UNSIGNED_CLOSE_SOURCE');
});
test('54 所有生成的退款都非refunded且没有一条refund_payments',async()=>{
 const statuses=await rows('SELECT DISTINCT status FROM public.refund_cases');
 assert.equal(statuses.some(x=>x.status==='refunded'),false);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('55 生产敏感资料和金额不出现在拒绝JSON中',async()=>{
 const r=await pendingCall('privacy',locks[8]);const txt=JSON.stringify(r.body);
 assert.ok(!/customerId|phone|vin|netCents|amountCents|token|password/i.test(txt),txt);
});
test('56 退款真实签名Carrier完全缺失时哪怕零行也硬拒',async()=>{
 await q('DROP SCHEMA f06_3c1_ci CASCADE');
 const r=await pendingCall('no-source-zero',locks[7]);
 assert.equal(r.body.code,'F06_REFUND_SIGNED_PARENT_REQUIRED',JSON.stringify(r.body));
 assert.deepEqual([ (await counts(locks[7])).refunds,(await counts(locks[7])).txs],[0,0]);
});
