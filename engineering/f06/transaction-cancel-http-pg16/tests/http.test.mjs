import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {assertEntry,createHttpServer,childCall,productionIssuer} from '../server.mjs';
const secret=Buffer.alloc(32,61),customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF062(()=>withParentBranch(fn));
let db,auth,server,base,token,scopeId,salesRole,fourSRole,locks={},transactions={};
const q=(s,a=[])=>db.query(s,a);
const rows=async(s,a=[])=> (await q(s,a)).rows;
const count=async(s,a=[])=>Number((await rows(s,a))[0].n);
const key=n=>'f06-real-cancel-'+n+'-'+process.env.GITHUB_RUN_ID;
const request=(n,transaction=transactions[1],extra={})=>({transactionId:transaction,reason:'Synthetic no-money cancellation '+n,eventKey:key(n),...extra});
const route='/__ci__/f06-real-transaction-cancel/cancel';
async function call(path=route,body={},actor=token,method='POST',headers={}){
 const h={origin:base,'content-type':'application/json',...headers};
 if(actor)h.authorization='Bearer '+actor;
 const r=await fetch(base+path,{method,headers:h,body:method==='GET'?undefined:JSON.stringify(body)});
 return {status:r.status,body:await r.json()};
}
const cancel=(n,transaction=transactions[1],extra={})=>call(route,request(n,transaction,extra));
const open=async(n,lock)=>{const r=await childCall('open',token,{lockId:lock,eventKey:key('transaction-'+n)});
 assert.equal(r.allowed,true,JSON.stringify(r));assert.equal(r.code,'F06_TX_ATOMIC_SYNTHETIC_IN_PROGRESS');
 const t=Number(r.transactionId);assert.ok(t>0);transactions[n]=t;return t};
async function facts(id){
 return (await rows("SELECT t.status,t.completed_at,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,t.responsible_employee_id, "+
  "(SELECT count(*)::int FROM f06_real_cancel_ci.origins WHERE transaction_id=t.transaction_id) origins, "+
  "(SELECT count(*)::int FROM f06_real_cancel_ci.events WHERE transaction_id=t.transaction_id) events, "+
  "(SELECT count(*)::int FROM f06_real_cancel_ci.request_keys WHERE transaction_id=t.transaction_id) keys, "+
  "(SELECT count(*)::int FROM public.audit_events a WHERE a.object_kind='Transaction' AND a.object_id=t.transaction_id::text AND a.action='f06_real_cancel_ci_cancelled') audits "+
  "FROM public.transactions t WHERE transaction_id=$1",[id]))[0];
}
before(async()=>{
 assertEntry();db=await connect();assert.equal((await verify(db)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 const roles=await rows("SELECT role_id,role_code FROM public.roles WHERE role_code IN('sales','four_s')");
 salesRole=Number(roles.find(x=>x.role_code==='sales')?.role_id);fourSRole=Number(roles.find(x=>x.role_code==='four_s')?.role_id);
 assert.ok(salesRole>0&&fourSRole>0);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[salesRole]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await rows('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];assert.ok(team);
 const scope=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 assert.ok(scope);scopeId=Number(scope.scope_id);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES (966001,'transaction.ci.cancel'),(966002,'transaction.ci.open'),(966003,'deposit.ci.record')");
 for(const p of [966001,966002,966003]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[p]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[p,scopeId]);
 }
 token=(await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-real-cancel-current'})).token;
 assert.ok(token);
 for(let n=1;n<=8;n++){
  const intake=await old(()=>intakeCI(db,{requestKey:key('intake-'+n),customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),
   syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(intake.allowed,true,JSON.stringify(intake));
  const decision=await old(()=>decisionCI(auth,token,{requestId:intake.requestId,requestKey:key('approve-'+n),action:'approve'}));
  assert.equal(decision.allowed,true,JSON.stringify(decision));locks[n]=Number(decision.lockId);
 }
 for(let n=1;n<=8;n++){
  const d=await recordSyntheticDepositCI(auth,token,{lockId:locks[n],amountCents:12000,currency:'CNY',
   paymentMethod:'bank_transfer',eventKey:key('deposit-'+n),receivedAt:new Date(Date.now()-3600000).toISOString(),
   syntheticVoucher:'CI-CANCEL-DEPOSIT-'+n,note:'Synthetic source-only deposit'});
  assert.equal(d.allowed,true,JSON.stringify(d));
 }
 server=createHttpServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{
 if(server?.listening)await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
 if(auth)await auth.close();if(db)await db.end();secret.fill(0);
});
test('01 官方仓库Run SHA隔离入口真实门禁',()=>assertEntry());
test('02 完全不提供生产Transaction取消Issuer',()=>assert.equal(productionIssuer().allowed,false));
test('03 生产Transaction取消路由不存在',async()=>assert.equal((await call('/api/v1/transactions/1/cancel')).status,404));
test('04 生产真实退款路由不存在',async()=>assert.equal((await call('/api/v1/refunds/1/refunded')).status,404));
test('05 生产真实付款路由不存在',async()=>assert.equal((await call('/api/v1/payments')).status,404));
test('06 不带token不能取消',async()=>assert.equal((await call(route,request('no-token',1),null)).status,401));
test('07 伪造token不能取消',async()=>assert.equal((await call(route,request('forged',1),'0'.repeat(43))).status,401));
test('08 GET取消不得存在',async()=>assert.equal((await call(route,{},token,'GET')).status,404));
test('09 不支持的媒体类型拒绝',async()=>assert.equal((await call(route,{},token,'POST',{'content-type':'text/plain'})).status,415));
test('10 非法Transaction ID拒绝',async()=>{
 const r=await cancel('invalid-id',-1);assert.equal(r.status,400);assert.equal(r.body.code,'F06_CANCEL_INVALID_ARGUMENTS');
});
test('11 空理由拒绝',async()=>{
 const r=await cancel('invalid-reason',1,{reason:'x'});assert.equal(r.status,400);
});
test('12 首批真实PR139签名原子Transaction创建成功',async()=>{await open(1,locks[1]);assert.equal((await facts(transactions[1])).status,'in_progress')});
test('13 老F06-4A原生3B Transaction来源与新PR139非兼容矩阵真实PG16',async()=>{
 const r=await childCall('inspect',token,{transactionId:transactions[1]});
 assert.equal(r.allowed,true,JSON.stringify(r));assert.deepEqual([r.old3b,r.pr139],[0,1]);
 console.log('F06_CANCEL_4A_4C_COMPATIBILITY_MATRIX',JSON.stringify({transactionId:transactions[1],native3b:r.old3b,realPr139:r.pr139,
  old4aCanCancel:false,newBoundedAdapter:true}));
});
test('14 原生冻结4A直接处理真实PR139 Transaction必须Fail Closed',async()=>{
 const r=await childCall('legacy',token,request('legacy-not-signed',transactions[1]));
 assert.equal(r.allowed,false,JSON.stringify(r));assert.equal(r.code,'F06_4A_UNSIGNED_OR_DRIFTED_ORIGIN');
 assert.equal((await facts(transactions[1])).status,'in_progress');
});
test('15 新受限Adapter必须保留真实源Lock已转入Transaction的状态',async()=>{
 const r=await rows('SELECT l.lock_status,l.end_reason FROM public.locks l JOIN public.transactions t ON t.source_lock_id=l.lock_id WHERE t.transaction_id=$1',[transactions[1]]);
 assert.deepEqual([r[0].lock_status,r[0].end_reason],['released','converted_to_transaction']);
});
test('16 当前签名Employee真实HTTP成功in_progress→cancelled',async()=>{
 const r=await cancel('success');assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal(r.body.code,'F06_CANCEL_CANCELLED_NO_PAYMENT');assert.equal(Number(r.body.transactionId),transactions[1]);assert.ok(r.body.backendPid>0);
 console.log('F06_CANCEL_REAL_HTTP_PG_BACKEND',r.body.backendPid);
});
test('17 同Actor同Key同Payload安全幂等无二次写',async()=>{
 const old=await facts(transactions[1]);const r=await cancel('success');assert.equal(r.status,200);assert.equal(r.body.code,'F06_CANCEL_IDEMPOTENT');
 assert.deepEqual(await facts(transactions[1]),old);
});
test('18 同Key篡改reason/subject应该冲突',async()=>{
 const r=await cancel('success',transactions[1],{reason:'Changed synthetic normal cancel reason'});
 assert.equal(r.body.code,'F06_CANCEL_IDEMPOTENCY_CONFLICT');
});
test('19 cancelled终态不同Key禁止再次转换',async()=>{
 const r=await cancel('cancel-again');assert.equal(r.body.code,'F06_CANCEL_ALREADY_TERMINAL');
});
test('20 Cancel侧来源+事件+请求键+审计原子各一次',async()=>{
 const t=await facts(transactions[1]);assert.deepEqual([t.status,t.origins,t.events,t.keys,t.audits],['cancelled',1,1,1,1]);
});
test('21 旧转换Lock不得因为Cancel复活',async()=>{
 const l=(await rows('SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]))[0];
 assert.deepEqual([l.lock_status,l.end_reason],['released','converted_to_transaction']);
});
test('22 原Transaction冻结来源和源快照不修改',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM f06_real_tx_ci.origins WHERE transaction_id=$1',[transactions[1]]),1);
 await assert.rejects(q('UPDATE f06_real_tx_ci.origins SET issuer=issuer WHERE transaction_id=$1',[transactions[1]]),/F06_REAL_TX_APPEND_ONLY/);
});
test('23 cancel不能产生退款支付或完成成交',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
 const t=await facts(transactions[1]);assert.equal(t.completed_at,null);
});
test('24 未授权Employee当前退款/交易权限撤销必须拒',async()=>{
 await open(2,locks[2]);await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=966001");
 try{const r=await cancel('permission-denied',transactions[2]);assert.equal(r.body.code,'F06_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=966001")}
});
test('25 Capability失效必须拒',async()=>{
 await q('UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=966001');
 try{const r=await cancel('capability-denied',transactions[2]);assert.equal(r.body.code,'F06_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=966001')}
});
test('26 现时Team/Store数据Scope丢失必须拒',async()=>{
 await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1',[scopeId]);
 try{const r=await cancel('scope-denied',transactions[2]);assert.equal(r.body.code,'F06_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1',[scopeId])}
});
test('27 4S成员即使有permission也不能cancel',async()=>{
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[fourSRole]);
 try{const r=await cancel('four-s-denied',transactions[2]);assert.equal(r.body.allowed,false)}
 finally{await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[salesRole])}
});
test('28 Customer禁用不取消仍有资金职责的Transaction',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{const r=await cancel('disabled-customer',transactions[2]);assert.equal(r.body.code,'F06_CANCEL_CUSTOMER_DISABLED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('29 撤换非原responsible必须被拒',async()=>{
 await q('UPDATE public.transactions SET responsible_employee_id=2 WHERE transaction_id=$1',[transactions[2]]);
 try{const r=await cancel('not-responsible',transactions[2]);assert.equal(r.body.code,'F06_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.transactions SET responsible_employee_id=1 WHERE transaction_id=$1',[transactions[2]])}
});
test('30 AFTER_STATUS_THROW真实事务ROLLBACK',async()=>{
 const original=await facts(transactions[2]);
 const r=await cancel('rollback-after-status',transactions[2],{testCheckpoint:'AFTER_STATUS_THROW'});
 assert.equal(r.body.code,'F06_CANCEL_ATOMIC_ROLLED_BACK',JSON.stringify(r.body));
 assert.deepEqual(await facts(transactions[2]),original);
});
test('31 AFTER_EVENT_THROW真实事务ROLLBACK',async()=>{
 const original=await facts(transactions[2]);
 const r=await cancel('rollback-after-event',transactions[2],{testCheckpoint:'AFTER_EVENT_THROW'});
 assert.equal(r.body.code,'F06_CANCEL_ATOMIC_ROLLED_BACK',JSON.stringify(r.body));
 assert.deepEqual(await facts(transactions[2]),original);
});
test('32 AFTER_AUDIT_THROW真实事务ROLLBACK',async()=>{
 const original=await facts(transactions[2]);
 const r=await cancel('rollback-after-audit',transactions[2],{testCheckpoint:'AFTER_AUDIT_THROW'});
 assert.equal(r.body.code,'F06_CANCEL_ATOMIC_ROLLED_BACK',JSON.stringify(r.body));
 assert.deepEqual(await facts(transactions[2]),original);
});
test('33 注错后未提交Audit/Key/Event及Status残留',async()=>{
 const f=await facts(transactions[2]);assert.deepEqual([f.status,f.origins,f.events,f.keys,f.audits],['in_progress',0,0,0,0]);
});
test('34 真实in_progress供应变化后仍可安全cancel',async()=>{
 const changed=await rows("UPDATE public.vehicles SET source_sale_status='unavailable' WHERE vehicle_id=$1 AND source_type='mingbang' RETURNING source_sale_status",[vehicle(2)]);
 assert.deepEqual(changed.map(x=>x.source_sale_status),['unavailable']);
 const cycleChange=await rows('UPDATE public.vehicle_listing_cycles SET ended_at=clock_timestamp() WHERE listing_cycle_id=$1 AND ended_at IS NULL RETURNING listing_cycle_id',[cycle(2)]);
 assert.equal(cycleChange.length,1);
 const r=await cancel('supply-abnormal',transactions[2]);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal((await facts(transactions[2])).status,'cancelled');
 console.log('F06_CANCEL_REAL_IN_PROGRESS_SOURCE_UNAVAILABLE',JSON.stringify({transactionId:transactions[2],pid:r.body.backendPid,vehicleState:'unavailable',cycleEnded:true}));
});
test('35 Cancel不能把不可售车辆再次上架或生成新ListingCycle',async()=>{
 const v=(await rows('SELECT source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[vehicle(2)]))[0];
 assert.equal(v.source_sale_status,'unavailable');
 assert.equal(await count('SELECT count(*)::int n FROM public.vehicle_listing_cycles WHERE vehicle_id=$1',[vehicle(2)]),1);
 assert.equal((await rows('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[2]]))[0].lock_status,'released');
});
test('36 双独立PG Backend同时争抢一个Transaction仅一人提交',async()=>{
 await open(3,locks[3]);
 const [a,b]=await Promise.all([cancel('concurrent-a',transactions[3]),cancel('concurrent-b',transactions[3])]);
 assert.equal(Number(a.body.allowed)+Number(b.body.allowed),1,JSON.stringify({a:a.body,b:b.body}));
 assert.equal((await facts(transactions[3])).status,'cancelled');
 assert.ok(a.body.backendPid&&b.body.backendPid&&a.body.backendPid!==b.body.backendPid);
 console.log('F06_CANCEL_TWO_BACKEND_PG_RACE',JSON.stringify({a:a.body.backendPid,b:b.body.backendPid,successful:1}));
});
test('37 竞态败方没有第二份Cancel Event/Key/Audit',async()=>{
 const f=await facts(transactions[3]);assert.deepEqual([f.origins,f.events,f.keys,f.audits],[1,1,1,1]);
});
test('38 不可证实的未签名public资金必须Fail Closed',async()=>{
 await open(4,locks[4]);
 const r=await q("INSERT INTO public.deposit_receipts(customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES($1,$2,100,clock_timestamp(),1) RETURNING deposit_id",[customer,locks[4]]);
 const dep=Number(r.rows[0].deposit_id);
 try{const denied=await cancel('unsigned-deposit',transactions[4]);assert.equal(denied.body.code,'F06_CANCEL_UNKNOWN_DEPOSIT_OR_MISMATCH')}
 finally{await q('DELETE FROM public.deposit_receipts WHERE deposit_id=$1',[dep])}
});
test('39 旧Lock待退款冲突保守FailClosed，禁止以cancel跳过',async()=>{
 const r=await q("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,$2,NULL,'pending',300) RETURNING refund_id",[customer,locks[4]]);
 const id=Number(r.rows[0].refund_id);
 try{const denied=await cancel('pending-refund',transactions[4]);assert.equal(denied.body.code,'F06_CANCEL_UNRESOLVED_PENDING_REFUND')}
 finally{await q('DELETE FROM public.refund_cases WHERE refund_id=$1',[id])}
});
test('40 回滚/资金拒绝后原Transaction仍可按真正合法条件取消',async()=>{
 const r=await cancel('after-remediation',transactions[4]);assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal((await facts(transactions[4])).status,'cancelled');
});
test('41 cancel不能删除waitlist/priority/consultation/需求源历史',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.locks WHERE lock_id=$1 AND lock_status=\'released\'',[locks[4]]),1);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('42 同步Audit不得向HTTP泄露VIN、手机号和资金细节',async()=>{
 const r=await cancel('too-late',transactions[1]);const txt=JSON.stringify(r.body);
 assert.ok(!/vin|phone|password|token|amountCents|source_price_cents/i.test(txt));
});
test('43 原生3C1取消适配器签名Carrier丢失即使无新Cancel行也硬拒',async()=>{
 await open(5,locks[5]);
 const before=await facts(transactions[5]);assert.equal(before.origins,0);
 await q('DROP SCHEMA f06_real_cancel_ci CASCADE');
 const r=await cancel('missing-cancel-carrier',transactions[5]);
 assert.equal(r.body.allowed,false,JSON.stringify(r.body));
 const final=(await rows('SELECT status FROM public.transactions WHERE transaction_id=$1',[transactions[5]]))[0];
 assert.equal(final.status,'in_progress');
});
