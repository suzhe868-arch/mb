import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withF063B} from '../migration.mjs';
import {requestSyntheticRefundCI,closeSyntheticRefundCI,pendingCustomerPublicPoolGuardCI,
 pendingVehicleOccupancyGuardCI,syntheticTerminalTransactionRefundDenyCI,productionIssuerDeny,refundedDeny} from '../service.mjs';
import {withF063A} from '../../lock-transaction-ci/migration.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {recordSyntheticDepositCI,correctSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {openSyntheticTransactionCI} from '../../lock-transaction-ci/service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect(),q=(s,a=[])=>db.query(s,a).then(x=>x.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const second=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const k=s=>'f06-3c1-pg16-'+s+'-'+process.env.GITHUB_RUN_ID;
const customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF063B(()=>withF063A(()=>withF062(()=>withParentBranch(fn))));
let token,locks={},r1,deposit1,beforeMoney,baselineRefundCases,baselineInProgressTransactions,baselineTransactionOrigins;
const request=(lockId,name,extra={})=>requestSyntheticRefundCI(auth,token,{subjectKind:'lock',lockId,amountCents:5000,reason:'合成测试客户申请退款原因',eventKey:k(name),...extra});
const close=(refundId,name,extra={})=>closeSyntheticRefundCI(auth,token,{refundId,closeReason:'客户确认决定不进行退款',eventKey:k(name),...extra});
const count=s=>q(s).then(x=>x[0].n);
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const sales=(await q("SELECT role_id FROM public.roles WHERE role_code='sales' LIMIT 1"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sales.role_id]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await q("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];assert.ok(scope);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(963101,'deposit.ci.record'),(963102,'refund.ci.request'),(963103,'transaction.ci.open')");
 for(const perm of [963101,963103]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[perm]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scope.scope_id]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-3c1-real-pg'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 for(let n=1;n<=4;n++){
  const r=await old(()=>intakeCI(db,{customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),
   requestKey:k('intake-'+n),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(r.code,'F06_1_PENDING_CREATED',JSON.stringify(r));
  const a=await old(()=>decisionCI(auth,token,{requestId:r.requestId,requestKey:k('approve-'+n),action:'approve'}));
  assert.equal(a.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(a));locks[n]=a.lockId;
 }
 const d=await withF063B(()=>withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId:locks[1],amountCents:8000,currency:'CNY',
  paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit-1')})));
 assert.equal(d.allowed,true,JSON.stringify(d));deposit1=d.depositId;
 const d2=await withF063B(()=>withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId:locks[1],amountCents:2000,currency:'CNY',
  paymentMethod:'pos',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit-2')})));
 assert.equal(d2.allowed,true,JSON.stringify(d2));
 const d4=await withF063B(()=>withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId:locks[4],amountCents:6000,currency:'CNY',
  paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit-4')})));
 assert.equal(d4.allowed,true,JSON.stringify(d4));
 beforeMoney=await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id');
 // Signed inherited F06-3B scenarios leave synthetic rows. Prove deltas without asserting an empty parent database.
 baselineRefundCases=await count('SELECT count(*)::int n FROM public.refund_cases');
 baselineInProgressTransactions=await count("SELECT count(*)::int n FROM public.transactions WHERE status='in_progress'");
 baselineTransactionOrigins=await count('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins');
});
test.after(async()=>{await db.end();await auth.close();await second.close()});
test('3C1-S01 3B签字与PG只读载体',async()=>assert.equal((await verify(db)).verified,true));
test('3C1-S02 PostgreSQL16实际非超级账号',async()=>{
 const x=(await q("SELECT current_user u,current_database() db,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,current_setting('server_version_num')::int v"))[0];
 assert.equal(x.u,'f03_ci');assert.equal(x.db,'f03_auth_test');assert.equal(x.su,false);assert.ok(x.v>=160000&&x.v<170000);
});
test('3C1-S03 公签Refund的pending/closed载体真实存在',async()=>{
 const cols=await q("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_cases'");
 for(const z of ['status','close_reason','closed_at','expected_amount_cents','transaction_id','lock_id'])assert.ok(cols.some(x=>x.column_name===z));
});
test('3C1-S04 未开放生产退款Issuer',()=>assert.equal(productionIssuerDeny().allowed,false));
test('3C1-S05 未授权refunded真实性动作',()=>assert.equal(refundedDeny().allowed,false));
test('3C1-S06 零金额拒绝',async()=>assert.equal((await request(locks[1],'zero',{amountCents:0})).code,'F06_3C1_INVALID_REQUEST'));
test('3C1-S07 超范围金额拒绝',async()=>assert.equal((await request(locks[1],'unsafe',{amountCents:1e14})).code,'F06_3C1_INVALID_REQUEST'));
test('3C1-S08 空原因拒绝',async()=>assert.equal((await request(locks[1],'blank',{reason:' ' })).code,'F06_3C1_INVALID_REQUEST'));
test('3C1-S09 简短key拒绝',async()=>assert.equal((await request(locks[1],'short',{eventKey:'abc'})).code,'F06_3C1_INVALID_REQUEST'));
test('3C1-S10 非Lock subject不伪造Transaction',async()=>assert.equal((await request(locks[1],'txkind',{subjectKind:'transaction'})).code,'F06_3C1_INVALID_REQUEST'));
test('3C1-S11 伪造Session不可申请',async()=>assert.equal((await requestSyntheticRefundCI(auth,'forged',{subjectKind:'lock',lockId:locks[1],amountCents:200,reason:'伪造令牌失败测试',eventKey:k('fake')})).allowed,false));
test('3C1-S12 未授权permission拒绝',async()=>assert.equal((await request(locks[1],'before-grant')).code,'F06_3C1_REQUEST_PERMISSION_SCOPE_DENIED'));
test('3C1-S13 独立显式scope+allow授予',async()=>{
 const team=(await q("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,963102,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,963102,$1,clock_timestamp()-interval '2 minutes')",[scope.scope_id]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=963102 AND decision='allow'"),1);
});
test('3C1-S14 双签Deposit来自原Lock且物理不可改',async()=>{
 assert.equal((await q('SELECT amount_cents FROM public.deposit_receipts WHERE deposit_id=$1',[deposit1]))[0].amount_cents,'8000');
 assert.equal((await q('SELECT count(*)::int n FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1',[locks[1]]))[0].n,2);
});
test('3C1-S15 无Deposit的Lock拒绝',async()=>assert.equal((await request(locks[2],'no-deposit')).code,'F06_3C1_UNVERIFIED_OR_ABSENT_MONEY'));
test('3C1-S16 上限超可退余额拒绝',async()=>assert.equal((await request(locks[1],'overbalance',{amountCents:10001})).code,'F06_3C1_OVER_REFUNDABLE_BALANCE'));
test('3C1-S17 当前3B在途交易不得退款',async()=>{
 const t=await withF063B(()=>openSyntheticTransactionCI(auth,token,{lockId:locks[3],eventKey:k('open-tx3')}));
 assert.equal(t.code,'F06_3B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(t));
 assert.equal((await syntheticTerminalTransactionRefundDenyCI(db,t.transactionId)).code,'F06_3C1_IN_PROGRESS_NOT_REFUNDABLE');
 assert.equal((await request(locks[3],'converted')).code,'F06_3C1_OWNING_TRANSACTION_REQUIRES_SIGNED_TERMINAL');
});
test('3C1-S18 注入pending后回滚',async()=>{
 await assert.rejects(()=>request(locks[1],'inject-pending',{testCheckpoint:'AFTER_PENDING_THROW'}),/F06_3C1_INJECTED_PENDING_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_3c1_ci.refund_origins'),0);
});
test('3C1-S19 注入事件后回滚',async()=>{
 await assert.rejects(()=>request(locks[1],'inject-event',{testCheckpoint:'AFTER_EVENT_THROW'}),/F06_3C1_INJECTED_EVENT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_3c1_ci.status_events'),0);
});
test('3C1-S20 注入审计后回滚',async()=>{
 await assert.rejects(()=>request(locks[1],'inject-audit',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_3C1_INJECTED_AUDIT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_3c1_ci.request_keys'),0);
});
test('3C1-S21 回滚无新增public Refund且保全前批数据',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases'),baselineRefundCases);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases WHERE lock_id='+Number(locks[1])),0);
});
test('3C1-S22 合法申请pending原子提交',async()=>{
 const a=await request(locks[1],'valid');assert.equal(a.code,'F06_3C1_PENDING_NO_PAYMENT',JSON.stringify(a));r1=a.refundId;
});
test('3C1-S23 public仅pending无退款支付',async()=>{
 assert.equal((await q('SELECT status,expected_amount_cents,transaction_id FROM public.refund_cases WHERE refund_id=$1',[r1]))[0].status,'pending');
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('3C1-S24 侧表关联客户车辆及周期不可丢',async()=>{
 const x=(await q('SELECT customer_id,vehicle_id,listing_cycle_id,amount_cents FROM f06_3c1_ci.refund_origins WHERE refund_id=$1',[r1]))[0];
 assert.equal(Number(x.customer_id),customer);assert.equal(Number(x.vehicle_id),vehicle(1));assert.equal(Number(x.listing_cycle_id),cycle(1));assert.equal(Number(x.amount_cents),5000);
});
test('3C1-S25 幂等重试不多建退款',async()=>{
 const x=await request(locks[1],'valid');assert.equal(x.code,'F06_3C1_IDEMPOTENT_REQUEST');assert.equal(x.refundId,r1);
});
test('3C1-S26 同key修改金额拒绝',async()=>assert.equal((await request(locks[1],'valid',{amountCents:3000})).code,'F06_3C1_IDEMPOTENCY_CONFLICT'));
test('3C1-S27 同一Subject已pending不得第二笔',async()=>assert.equal((await request(locks[1],'another')).code,'F06_3C1_EXISTING_PENDING_OR_REFUNDED_CONFLICT'));
test('3C1-S28 公海Guard真实读pending',async()=>assert.equal((await pendingCustomerPublicPoolGuardCI(db,customer)).code,'F06_3C1_PENDING_REFUND_PREVENTS_PUBLIC_POOL'));
test('3C1-S29 pending不占车辆',async()=>assert.equal((await pendingVehicleOccupancyGuardCI(db,vehicle(1))).code,'F06_3C1_REFUND_DOES_NOT_OCCUPY_VEHICLE'));
test('3C1-S30 空close reason拒绝',async()=>assert.equal((await close(r1,'invalid',{closeReason:' '})).code,'F06_3C1_INVALID_CLOSE'));
test('3C1-S31 关闭前注入回滚保持pending',async()=>{
 await assert.rejects(()=>close(r1,'failure',{testCheckpoint:'AFTER_CLOSE_THROW'}),/F06_3C1_INJECTED_CLOSE_ROLLBACK/);
 assert.equal((await q('SELECT status FROM public.refund_cases WHERE refund_id=$1',[r1]))[0].status,'pending');
});
test('3C1-S32 close的已撤权员工旧token拒绝',async()=>{
 const peer=await connect();
 try{
  assert.notEqual((await q('SELECT pg_backend_pid() pid'))[0].pid,(await peer.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await peer.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=963102");
  assert.equal((await close(r1,'revoked')).code,'F06_3C1_CLOSE_CURRENT_PERMISSION_SCOPE_DENIED');
 }finally{
  await peer.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=963102");
  await peer.end();
 }
});
test('3C1-S33 非实际退款close合法原子提交',async()=>{
 const x=await close(r1,'valid-close');assert.equal(x.code,'F06_3C1_CLOSED_WITHOUT_PAYMENT',JSON.stringify(x));
});
test('3C1-S34 closed必须有原因时间',async()=>{
 const x=(await q('SELECT status,close_reason,closed_at FROM public.refund_cases WHERE refund_id=$1',[r1]))[0];
 assert.equal(x.status,'closed');assert.ok(x.close_reason);assert.ok(x.closed_at);
});
test('3C1-S35 closed不生成payment',async()=>assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0));
test('3C1-S36 closed无复活',async()=>assert.equal((await close(r1,'again')).code,'F06_3C1_NOT_PENDING'));
test('3C1-S37 close幂等仍返回历史',async()=>assert.equal((await close(r1,'valid-close')).code,'F06_3C1_IDEMPOTENT_CLOSE'));
test('3C1-S38 close已解本退款的公海保护但保留其它资格Guard',async()=>assert.equal((await pendingCustomerPublicPoolGuardCI(db,customer)).code,'F06_3C1_NO_PENDING_REFUND_ONLY_OTHER_GUARDS_STILL_APPLY'));
test('3C1-S39 旧资金收款不可变',async()=>assert.deepEqual(await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id'),beforeMoney));
test('3C1-S40 immutable不能覆盖历史事件',async()=>{
 await assert.rejects(()=>q("UPDATE f06_3c1_ci.status_events SET resulting_status='refunded' WHERE refund_id=$1",[r1]),/F06_3C1_APPEND_ONLY_HISTORY/);
 await assert.rejects(()=>q('DELETE FROM f06_3c1_ci.refund_origins WHERE refund_id=$1',[r1]),/F06_3C1_APPEND_ONLY_HISTORY/);
});
test('3C1-S41 旧closed之后可重新合法申请',async()=>{
 const x=await request(locks[1],'reapply',{amountCents:2000});assert.equal(x.code,'F06_3C1_PENDING_NO_PAYMENT',JSON.stringify(x));
});
test('3C1-S42 同一车两个真实PG后端并发仅一个pending',async()=>{
 const jobs=await Promise.allSettled([
  request(locks[4],'racing-a',{amountCents:4000}),
  requestSyntheticRefundCI(second,token,{subjectKind:'lock',lockId:locks[4],amountCents:4000,reason:'第二个PG实际后端并发请求',eventKey:k('racing-b')})
 ]);
 const wins=jobs.filter(z=>z.status==='fulfilled'&&z.value.code==='F06_3C1_PENDING_NO_PAYMENT');
 assert.equal(wins.length,1,JSON.stringify(jobs));
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_cases WHERE lock_id=$1 AND status=\'pending\'',[locks[4]]))[0].n,1);
});
test('3C1-S43 真实transaction、Lock与财务原事实均不因pending改变',async()=>{
 assert.equal((await q("SELECT count(*)::int n FROM public.transactions WHERE status='in_progress'"))[0].n,baselineInProgressTransactions+1);
 assert.equal((await q("SELECT count(*)::int n FROM f06_3b_ci.transaction_origins"))[0].n,baselineTransactionOrigins+1);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
