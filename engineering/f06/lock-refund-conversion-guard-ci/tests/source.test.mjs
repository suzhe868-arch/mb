import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify} from '../migration.mjs';
import {openGuardedSyntheticTransactionCI,productionIssuerDeny} from '../service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {requestSyntheticRefundCI,closeSyntheticRefundCI} from '../../refund-pending-ci/service.mjs';
import {withF063A} from '../../lock-transaction-ci/migration.mjs';
import {withF063C1} from '../../transaction-cancel-ci/migration.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect(),query=(s,a=[])=>db.query(s,a).then(r=>r.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const peer=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const k=s=>'f06-5b-pg16-'+s+'-'+process.env.GITHUB_RUN_ID;
const old=fn=>withF063A(()=>withF062(()=>withParentBranch(fn)));
let token,lockId,refundId,transactionId,scopeId;
const open=(key,more={})=>openGuardedSyntheticTransactionCI(auth,token,{lockId,eventKey:k(key),...more});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const role=(await query("SELECT role_id FROM public.roles WHERE role_code='sales'"))[0];
 await query('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[role.role_id]);
 await query('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=86180101');
 const team=(await query('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];
 const scope=(await query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];scopeId=scope.scope_id;
 await query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(967001,'transaction.ci.open'),(967002,'refund.ci.request'),(967003,'deposit.ci.record')");
 for(const perm of [967001,967002,967003]){
  await query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[perm]);
  await query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scopeId]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-5b-ci-source'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 const req=await old(()=>intakeCI(db,{customerId:86180101,vehicleId:86181104,listingCycleId:86182104,requestKey:k('intake'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(req.code,'F06_1_PENDING_CREATED',JSON.stringify(req));
 const app=await old(()=>decisionCI(auth,token,{requestId:req.requestId,requestKey:k('approve'),action:'approve'}));
 assert.equal(app.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(app));lockId=app.lockId;
});
test.after(async()=>{await auth.close();await peer.close();await db.end()});
test('5B-S01 新版及父签同时验真',async()=>assert.equal((await verify(db)).verified,true));
test('5B-S02 PostgreSQL16非特权账户',async()=>{
 const x=(await query("SELECT current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su"))[0];
 assert.equal(x.u,'f03_ci');assert.equal(x.su,false);assert.ok(x.v>=160000&&x.v<170000);
});
test('5B-S03 禁用生产Transaction Issuer',()=>assert.equal(productionIssuerDeny().allowed,false));
test('5B-S04 真实3A签名Deposit',async()=>{
 const d=await withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId,amountCents:6600,currency:'CNY',paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit')}));
 assert.equal(d.code,'F06_3A_SYNTHETIC_RECEIPT_RECORDED',JSON.stringify(d));
});
test('5B-S05 真3C1待退款生成pending来源',async()=>{
 const x=await withF063C1(()=>requestSyntheticRefundCI(auth,token,{subjectKind:'lock',lockId,amountCents:2000,reason:'旧Lock已签资金申请退款且未有交易',eventKey:k('refund')}));
 assert.equal(x.code,'F06_3C1_PENDING_NO_PAYMENT',JSON.stringify(x));refundId=x.refundId;
});
test('5B-S06 旧Lock pending签名双表一致',async()=>{
 const r=(await query("SELECT r.status,r.lock_id,o.lock_id signed_lock FROM public.refund_cases r JOIN f06_3c1_ci.refund_origins o USING(refund_id) WHERE r.refund_id=$1",[refundId]))[0];
 assert.equal(r.status,'pending');assert.equal(Number(r.lock_id),lockId);assert.equal(Number(r.signed_lock),lockId);
});
test('5B-S07 同PG事务禁止旧Lock pending转Transaction',async()=>{
 const x=await open('pending');assert.equal(x.code,'F06_5B_LOCK_PENDING_REFUND_CONVERSION_DENY',JSON.stringify(x));
});
test('5B-S08 拒绝后没有公共Transaction半写',async()=>assert.equal((await query('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[lockId]))[0].n,0));
test('5B-S09 拒绝后保留active Lock且GuardEvent零条',async()=>{
 assert.equal((await query('SELECT lock_status FROM public.locks WHERE lock_id=$1',[lockId]))[0].lock_status,'active');
 assert.equal((await query('SELECT count(*)::int n FROM f06_5b_ci.guard_events WHERE source_lock_id=$1',[lockId]))[0].n,0);
});
test('5B-S10 待退款换Key不可绕行',async()=>assert.equal((await open('pending-second')).code,'F06_5B_LOCK_PENDING_REFUND_CONVERSION_DENY'));
test('5B-S11 旧退款已closed且无付款',async()=>{
 const x=await withF063C1(()=>closeSyntheticRefundCI(auth,token,{refundId,closeReason:'客户明确撤回待退申请并确认没有付款发生',eventKey:k('close')}));
 assert.equal(x.code,'F06_3C1_CLOSED_WITHOUT_PAYMENT',JSON.stringify(x));
});
test('5B-S12 closed不冒充refunded',async()=>{
 assert.equal((await query('SELECT status FROM public.refund_cases WHERE refund_id=$1',[refundId]))[0].status,'closed');
 assert.equal((await query('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
});
test('5B-S13 签名closed后可安全原子转换',async()=>{
 const x=await open('after-close');assert.equal(x.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(x));transactionId=x.transactionId;
});
test('5B-S14 安全转换新旧两套签名一致',async()=>{
 const e=(await query('SELECT * FROM f06_5b_ci.guard_events WHERE transaction_id=$1',[transactionId]))[0];assert.equal(Number(e.source_lock_id),lockId);assert.equal(e.checked_refunds,1);
 assert.equal((await query('SELECT status FROM public.transactions WHERE transaction_id=$1',[transactionId]))[0].status,'in_progress');
});
test('5B-S15 幂等同key无重复账',async()=>{
 const x=await open('after-close');assert.equal(x.code,'F06_5B_IDEMPOTENT_CONVERSION',JSON.stringify(x));
 assert.equal((await query('SELECT count(*)::int n FROM f06_5b_ci.guard_events WHERE source_lock_id=$1',[lockId]))[0].n,1);
});
test('5B-S16 另一key不可创建第二笔Transaction',async()=>assert.equal((await open('new-key-after')).code,'F06_5B_NOT_ACTIVE_CURRENT_LOCK'));
test('5B-S17 未授权伪造Token拒绝',async()=>assert.equal((await openGuardedSyntheticTransactionCI(auth,'forged',{lockId,eventKey:k('forged')})).allowed,false));

test('5B-S18 原Refund closed不冒充paid',async()=>{
 const x=(await query('SELECT status,transaction_id FROM public.refund_cases WHERE refund_id=$1',[refundId]))[0];
 assert.equal(x.status,'closed');assert.equal(x.transaction_id,null);
});
test('5B-S19 已转换Lock不得自动恢复',async()=>{
 const x=(await query('SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1',[lockId]))[0];
 assert.equal(x.lock_status,'released');assert.equal(x.end_reason,'converted_to_transaction');
});
test('5B-S20 原退款事件保留pending与closed两条',async()=>{
 assert.equal((await query('SELECT count(*)::int n FROM f06_3c1_ci.status_events WHERE refund_id=$1',[refundId]))[0].n,2);
});
test('5B-S21 真实退款支付仍为零',async()=>{
 assert.equal((await query('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
});
test('5B-S22 公开Transaction状态仅in_progress',async()=>{
 const x=(await query('SELECT status FROM public.transactions WHERE transaction_id=$1',[transactionId]))[0];
 assert.equal(x.status,'in_progress');
});

test('5B-S23 Sidecar审计事件不可UPDATE',async()=>{
 await assert.rejects(()=>query('UPDATE f06_5b_ci.guard_events SET checked_refunds=0 WHERE transaction_id=$1',[transactionId]),/F06_5B_APPEND_ONLY_HISTORY/);
});
test('5B-S24 Sidecar审计事件不可DELETE',async()=>{
 await assert.rejects(()=>query('DELETE FROM f06_5b_ci.guard_events WHERE transaction_id=$1',[transactionId]),/F06_5B_APPEND_ONLY_HISTORY/);
});
test('5B-S25 attestation封印不可UPDATE',async()=>{
 await assert.rejects(()=>query("UPDATE f06_5b_ci.attestation SET seal_name='bad'"),/F06_5B_APPEND_ONLY_HISTORY/);
});
test('5B-S26 父3B来源唯一',async()=>{
 assert.equal((await query('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE source_lock_id=$1',[lockId]))[0].n,1);
});
test('5B-S27 父3B转换历史唯一',async()=>{
 assert.equal((await query('SELECT count(*)::int n FROM f06_3b_ci.origin_events WHERE transaction_id=$1',[transactionId]))[0].n,1);
});
test('5B-S28 已签Deposit金额不漂移',async()=>{
 assert.equal(Number((await query('SELECT amount_cents FROM public.deposit_receipts WHERE lock_id=$1',[lockId]))[0].amount_cents),6600);
});

let secondLock;
test('5B-S29 新Lock在另一Vehicle真实签名',async()=>{
 const req=await old(()=>intakeCI(db,{customerId:86180101,vehicleId:86181105,listingCycleId:86182105,requestKey:k('second-intake'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(req.code,'F06_1_PENDING_CREATED',JSON.stringify(req));
 const x=await old(()=>decisionCI(auth,token,{requestId:req.requestId,requestKey:k('second-approve'),action:'approve'}));
 assert.equal(x.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(x));secondLock=x.lockId;
});
test('5B-S30 转换插入后异常，Transaction回滚',async()=>{
 await assert.rejects(()=>open('injected-tx',{lockId:secondLock,testCheckpoint:'AFTER_TRANSACTION_THROW'}),/F06_5B_INJECTED_TRANSACTION_ROLLBACK/);
 assert.equal((await query('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[secondLock]))[0].n,0);
});
test('5B-S31 Lock release后异常仍为active',async()=>{
 await assert.rejects(()=>open('injected-lock',{lockId:secondLock,testCheckpoint:'AFTER_LOCK_THROW'}),/F06_5B_INJECTED_LOCK_ROLLBACK/);
 assert.equal((await query('SELECT lock_status FROM public.locks WHERE lock_id=$1',[secondLock]))[0].lock_status,'active');
});
test('5B-S32 GuardEvent审计写入后异常全部回滚',async()=>{
 await assert.rejects(()=>open('injected-audit',{lockId:secondLock,testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_5B_INJECTED_AUDIT_ROLLBACK/);
 assert.equal((await query('SELECT count(*)::int n FROM f06_5b_ci.guard_events WHERE source_lock_id=$1',[secondLock]))[0].n,0);
});
test('5B-S33 三轮注错未污染原3B来源',async()=>{
 assert.equal((await query('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE source_lock_id=$1',[secondLock]))[0].n,0);
});
test('5B-S34 三轮注错未污染原3B幂等Key',async()=>{
 assert.equal((await query('SELECT count(*)::int n FROM f06_3b_ci.request_keys WHERE source_lock_id=$1',[secondLock]))[0].n,0);
});
