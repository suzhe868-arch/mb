import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withF063C1} from '../migration.mjs';
import {cancelSyntheticTransactionCI,syntheticOccupancyProjectionCI,syntheticCustomerPublicPoolGuardCI,productionIssuerDeny,completedIssuerDeny,paymentIssuerDeny} from '../service.mjs';
import {withF063B} from '../../refund-pending-ci/migration.mjs';
import {withF063A} from '../../lock-transaction-ci/migration.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {openSyntheticTransactionCI} from '../../lock-transaction-ci/service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect(),q=(s,a=[])=>db.query(s,a).then(x=>x.rows),count=s=>q(s).then(x=>x[0].n);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const peer=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const k=s=>'f06-4a-pg16-'+s+'-'+process.env.GITHUB_RUN_ID;
const customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF063C1(()=>withF063B(()=>withF063A(()=>withF062(()=>withParentBranch(fn)))));
const f3b=fn=>withF063C1(()=>withF063B(fn));
const f3a=fn=>withF063C1(()=>withF063B(()=>withF063A(fn)));
const cancel=(n,name,p={})=>cancelSyntheticTransactionCI(auth,token,{transactionId:tx[n],reason:'合成取消交易原因，客户已确认',eventKey:k(name),...p});
let token,locks={},tx={},depositId,beforeDeposit,beforeLock,beforeOwner,baselineAudit,baselineCancelled;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const sales=(await q("SELECT role_id FROM public.roles WHERE role_code='sales' LIMIT 1"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sales.role_id]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await q('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 assert.ok(scope);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(964001,'transaction.ci.open'),(964002,'transaction.ci.cancel'),(964003,'deposit.ci.record')");
 for(const perm of [964001,964003]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[perm]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scope.scope_id]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-4a-signed-native-pg16'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 for(let n=1;n<=5;n++){
  const r=await old(()=>intakeCI(db,{customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),
    requestKey:k('intake-'+n),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(r.code,'F06_1_PENDING_CREATED',JSON.stringify(r));
  const a=await old(()=>decisionCI(auth,token,{requestId:r.requestId,requestKey:k('approve-'+n),action:'approve'}));
  assert.equal(a.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(a));locks[n]=a.lockId;
 }
 const dep=await f3a(()=>recordSyntheticDepositCI(auth,token,{lockId:locks[1],amountCents:8600,currency:'CNY',
  paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit-original')}));
 assert.equal(dep.allowed,true,JSON.stringify(dep));depositId=dep.depositId;
 for(let n=1;n<=3;n++){
  const a=await f3b(()=>openSyntheticTransactionCI(auth,token,{lockId:locks[n],eventKey:k('open-'+n)}));
  assert.equal(a.code,'F06_3B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(a));tx[n]=a.transactionId;
 }
 beforeDeposit=await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id');
 beforeLock=await q('SELECT lock_id,lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]);
 beforeOwner=(await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[customer]))[0].current_owner_employee_id;
 baselineAudit=await count('SELECT count(*)::int n FROM public.audit_events');
 baselineCancelled=await count("SELECT count(*)::int n FROM public.transactions WHERE status='cancelled'");
});
test.after(async()=>{await db.end();await auth.close();await peer.close()});
test('4A-S01 当前公签父签名与Sidecar校验',async()=>assert.equal((await verify(db)).verified,true));
test('4A-S02 真正非超级用户PG16且不可建库',async()=>{
 const a=(await q("SELECT current_user u,current_database() db,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd"))[0];
 assert.equal(a.u,'f03_ci');assert.equal(a.db,'f03_auth_test');assert.equal(a.su,false);assert.equal(a.cd,false);assert.ok(a.v>=160000&&a.v<170000);
});
test('4A-S03 旧公表承载in_progress/cancelled但无取消原因',async()=>{
 const cols=await q("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions'");
 assert.ok(cols.some(x=>x.column_name==='status'));assert.ok(!cols.some(x=>x.column_name==='cancel_reason'));
 assert.equal((await verify(db)).carrier,'TRANSACTION_CANCEL_CARRIER_SOURCE_GAP_CI_ONLY');
});
test('4A-S04 生产Transaction取消Issuer必须拒绝',()=>assert.equal(productionIssuerDeny().allowed,false));
test('4A-S05 completed成交永不获准',()=>assert.equal(completedIssuerDeny().allowed,false));
test('4A-S06 真实资金Issuer绝不开放',()=>assert.equal(paymentIssuerDeny().allowed,false));
test('4A-S07 公签旧24条迁移Ledger不允许补录',async()=>assert.equal(await count('SELECT count(*)::int n FROM public.f03_schema_migrations'),24));
test('4A-S08 三笔转换均有真实signed 3B原始来源',async()=>assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE transaction_id=ANY($1)',[Object.values(tx)]))[0].n,3));
test('4A-S09 未授权独立cancel能力拒绝',async()=>assert.equal((await cancel(1,'ungranted')).code,'F06_4A_PERMISSION_SCOPE_DENIED'));
test('4A-S10 仅签独立cancel allow和现时team scope',async()=>{
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND ended_at IS NULL LIMIT 1"))[0];
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,964002,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,964002,$1,clock_timestamp()-interval '2 minutes')",[scope.scope_id]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=964002 AND decision='allow'"),1);
});
test('4A-S11 无效transactionId拒绝',async()=>assert.equal((await cancel(1,'bad-id',{transactionId:0})).code,'F06_4A_INVALID_CANCEL_ARGUMENTS'));
test('4A-S12 空取消理由拒绝',async()=>assert.equal((await cancel(1,'blank',{reason:' '})).code,'F06_4A_INVALID_CANCEL_ARGUMENTS'));
test('4A-S13 过短事件键拒绝',async()=>assert.equal((await cancel(1,'short',{eventKey:'a'})).code,'F06_4A_INVALID_CANCEL_ARGUMENTS'));
test('4A-S14 伪造Token无法交易取消',async()=>assert.equal((await cancelSyntheticTransactionCI(auth,'forged',{transactionId:tx[1],reason:'伪造会话取消交易原因',eventKey:k('forged')})).allowed,false));
test('4A-S15 不存在交易不可创取消事实',async()=>assert.equal((await cancel(1,'missing',{transactionId:999999999})).code,'F06_4A_TRANSACTION_NOT_FOUND'));
test('4A-S16 取消前第一笔合成交易在途占车',async()=>assert.equal((await syntheticOccupancyProjectionCI(db,vehicle(1))).code,'F06_4A_SIGNED_TRANSACTION_OCCUPIES_VEHICLE'));
test('4A-S17 未签来源的实体in_progress绝不算可操作',async()=>{
 const raw=(await q("INSERT INTO public.transactions(source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) VALUES($1,$2,$3,$4,'in_progress',1) RETURNING transaction_id",[locks[5],customer,vehicle(5),cycle(5)]))[0];
 try{
  assert.equal((await cancel(1,'unsigned',{transactionId:Number(raw.transaction_id)})).code,'F06_4A_UNSIGNED_OR_DRIFTED_ORIGIN');
  assert.equal((await syntheticOccupancyProjectionCI(db,vehicle(5))).code,'F06_4A_UNTRUSTED_OCCUPANCY_SOURCE_GAP');
 }finally{await q('DELETE FROM public.transactions WHERE transaction_id=$1',[raw.transaction_id])}
});
test('4A-S18 BEFORE_STATUS注错整个事务回滚',async()=>{
 await assert.rejects(()=>cancel(1,'before-status',{testCheckpoint:'BEFORE_STATUS_THROW'}),/F06_4A_INJECTED_BEFORE_STATUS_ROLLBACK/);
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'in_progress');
});
test('4A-S19 AFTER_STATUS注错Rollback恢复真公签状态',async()=>{
 await assert.rejects(()=>cancel(1,'after-status',{testCheckpoint:'AFTER_STATUS_THROW'}),/F06_4A_INJECTED_STATUS_ROLLBACK/);
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'in_progress');
});
test('4A-S20 AFTER_EVENT注错不留侧表事件',async()=>{
 await assert.rejects(()=>cancel(1,'after-event',{testCheckpoint:'AFTER_EVENT_THROW'}),/F06_4A_INJECTED_EVENT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4a_ci.cancel_events'),0);
});
test('4A-S21 AFTER_AUDIT注错不漏不可变记录',async()=>{
 await assert.rejects(()=>cancel(1,'after-audit',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_4A_INJECTED_AUDIT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4a_ci.cancel_origins'),0);
});
test('4A-S22 失败取消不改变原历史和public交易',async()=>{
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'in_progress');
 assert.equal(await count("SELECT count(*)::int n FROM public.transactions WHERE status='cancelled'"),baselineCancelled);
});
test('4A-S23 当前Responsible取消原子提交',async()=>{
 const a=await cancel(1,'valid');assert.equal(a.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(a));
 assert.equal(a.transactionId,tx[1]);assert.ok(Number.isSafeInteger(a.backendPid));
});
test('4A-S24 真实Public状态已经cancelled',async()=>assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'cancelled'));
test('4A-S25 Cancel后不造completed_at',async()=>assert.equal((await q('SELECT completed_at FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].completed_at,null));
test('4A-S26 取消理由、actor和时间不可变侧表来源',async()=>{
 const x=(await q('SELECT reason,actor_employee_id,created_at,previous_status,resulting_status FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1',[tx[1]]))[0];
 assert.ok(x.reason);assert.equal(Number(x.actor_employee_id),1);assert.ok(x.created_at);assert.equal(x.previous_status,'in_progress');assert.equal(x.resulting_status,'cancelled');
});
test('4A-S27 原子事件仅一条且status真实记录',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM f06_4a_ci.cancel_events WHERE transaction_id=$1',[tx[1]]))[0].n,1);
 assert.equal((await q('SELECT resulting_status FROM f06_4a_ci.cancel_events WHERE transaction_id=$1',[tx[1]]))[0].resulting_status,'cancelled');
});
test('4A-S28 幂等同Key安全重放',async()=>assert.equal((await cancel(1,'valid')).code,'F06_4A_IDEMPOTENT_CANCEL'));
test('4A-S29 同Key改原因拒绝',async()=>assert.equal((await cancel(1,'valid',{reason:'同一个Key但不同签名理由拒绝'})).code,'F06_4A_IDEMPOTENCY_CONFLICT'));
test('4A-S30 同Key换Subject也拒绝',async()=>assert.equal((await cancel(2,'valid')).code,'F06_4A_IDEMPOTENCY_CONFLICT'));
test('4A-S31 新Key无法二次cancel终态',async()=>assert.equal((await cancel(1,'new-key')).code,'F06_4A_ALREADY_TERMINAL_NO_REVIVE'));
test('4A-S32 Cancelled释放CI当前占车投影',async()=>{
 const a=await syntheticOccupancyProjectionCI(db,vehicle(1));assert.equal(a.code,'F06_4A_NO_SIGNED_IN_PROGRESS_OCCUPANCY_ONLY_CI');assert.equal(a.hasCancelled,true);
});
test('4A-S33 仍在途第二笔Transaction占车',async()=>assert.equal((await syntheticOccupancyProjectionCI(db,vehicle(2))).code,'F06_4A_SIGNED_TRANSACTION_OCCUPIES_VEHICLE'));
test('4A-S34 原始Lock仍released不得重启',async()=>{
 assert.deepEqual(await q('SELECT lock_id,lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]),beforeLock);
 assert.equal(beforeLock[0].end_reason,'converted_to_transaction');
});
test('4A-S35 无删除签名Transaction Origin',async()=>assert.equal((await q("SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1 AND status='in_progress'",[tx[1]]))[0].n,1));
test('4A-S36 收款凭证不可变化',async()=>assert.deepEqual(await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id'),beforeDeposit));
test('4A-S37 signed原价72小时源历史仍固定',async()=>{
 const x=(await q('SELECT initial_hours,policy_version,price_cents FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1',[locks[1]]))[0];assert.equal(x.initial_hours,72);assert.equal(x.policy_version,1);
});
test('4A-S38 原Customer owner仍固定',async()=>assert.equal((await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[customer]))[0].current_owner_employee_id,beforeOwner));
test('4A-S39 原不可变Cancel事件拒绝UPDATE/DELETE',async()=>{
 await assert.rejects(()=>q("UPDATE f06_4a_ci.cancel_events SET reason='unauthorized' WHERE transaction_id=$1",[tx[1]]),/F06_4A_APPEND_ONLY_IMMUTABLE/);
 await assert.rejects(()=>q("DELETE FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1",[tx[1]]),/F06_4A_APPEND_ONLY_IMMUTABLE/);
});
test('4A-S40 不得自动解除客户其它在途责任而入公海',async()=>assert.equal((await syntheticCustomerPublicPoolGuardCI(db,customer)).code,'F06_4A_OTHER_OPEN_RESPONSIBILITY_PREVENTS_PUBLIC_POOL'));
test('4A-S41 撤权经第二PG后端COMMIT，旧会话也拒绝',async()=>{
 const second=await connect();
 try{
  assert.notEqual((await q('SELECT pg_backend_pid() pid'))[0].pid,(await second.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await second.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=964002");
  assert.equal((await cancel(2,'after-revoke')).code,'F06_4A_PERMISSION_SCOPE_DENIED');
 }finally{await second.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=964002");await second.end()}
});
test('4A-S42 Customer停用也禁止取消新Transaction',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{assert.equal((await cancel(2,'disabled')).code,'F06_4A_CUSTOMER_DISABLED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('4A-S43 负责人临时离职后不能取消',async()=>{
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 try{assert.equal((await cancel(2,'inactive')).allowed,false)}
 finally{await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=1")}
});
test('4A-S44 Scope显式撤销后拒绝',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=964002");
 try{assert.equal((await cancel(2,'scope-revoked')).code,'F06_4A_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=964002")}
});
test('4A-S45 双独立PG后端并发同一Transaction仅一个成功',async()=>{
 const results=await Promise.allSettled([cancel(3,'racing-a'),
  cancelSyntheticTransactionCI(peer,token,{transactionId:tx[3],reason:'第二独立PG后端并发取消',eventKey:k('racing-b')})]);
 const wins=results.filter(x=>x.status==='fulfilled'&&x.value.code==='F06_4A_CANCELLED_ATOMIC_NO_PAYMENT');
 assert.equal(wins.length,1,JSON.stringify(results));assert.equal((await q('SELECT count(*)::int n FROM f06_4a_ci.cancel_origins WHERE transaction_id=$1',[tx[3]]))[0].n,1);
});
test('4A-S46 完成后没有生成任何实际退款付款',async()=>assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0));
test('4A-S47 取消审计日志真实递增',async()=>assert.ok(await count('SELECT count(*)::int n FROM public.audit_events')>baselineAudit));
test('4A-S48 所有已cancelled均有Signed取消Sidecar',async()=>{
 for(const n of [1,3])assert.equal((await q("SELECT status FROM public.transactions WHERE transaction_id=$1",[tx[n]]))[0].status,'cancelled');
 assert.equal(await count('SELECT count(*)::int n FROM f06_4a_ci.cancel_origins'),2);
});
