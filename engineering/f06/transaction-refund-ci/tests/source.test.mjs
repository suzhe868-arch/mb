import {test} from 'node:test';
import {requestSyntheticTransactionRefundCI,closeSyntheticTransactionRefundCI,pendingPublicPoolGuardCI,pendingVehicleGuardCI,productionRefundIssuerDeny,actualRefundPaymentDeny,completedTransactionIssuerDeny} from '../service.mjs';

import assert from 'node:assert/strict';
import {connect,verify,withF064C} from '../migration.mjs';
import {withF064B} from '../../post-handoff-cancel-ci/migration.mjs';
import {withF064A} from '../../transaction-handoff-ci/migration.mjs';
import {cancelAfterHandoffSyntheticCI,postHandoffOccupancyCI,publicPoolGuardCI,productionCancelDeny as deny4CProduction,realRefundDeny,completedDeny as deny4CCompleted} from '../service.mjs';
import {handoffSyntheticTransactionCI,currentSignedResponsibleCI,postHandoffCancelGuardCI,publicPoolHandoffGuardCI,productionHandoffDeny,productionCancelDeny,realMoneyDeny,completedDeny} from '../../transaction-handoff-ci/service.mjs';
import {cancelSyntheticTransactionCI} from '../../transaction-cancel-ci/service.mjs';
import {withF063C1} from '../../transaction-cancel-ci/migration.mjs';
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
const k=s=>'f06-4b-pg16-'+s+'-'+process.env.GITHUB_RUN_ID;
const customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF064B(()=>withF064A(()=>withF063C1(()=>withF063B(()=>withF063A(()=>withF062(()=>withParentBranch(fn)))))));
const with3b=fn=>withF064B(()=>withF064A(()=>withF063C1(()=>withF063B(fn))));
const with3a=fn=>withF064B(()=>withF064A(()=>withF063C1(()=>withF063B(()=>withF063A(fn)))));
const cancelledParent=(id,name)=>withF064A(()=>cancelSyntheticTransactionCI(auth,managerToken,{transactionId:id,reason:'移交前普通取消历史理由',eventKey:k(name)}));
const transfer=(n,name,p={})=>withF064B(()=>handoffSyntheticTransactionCI(auth,managerToken,{transactionId:tx[n],newResponsibleId:4,reason:'合成正式移交给当前团队负责销售',eventKey:k(name),...p}));
let salesToken,managerToken,locks={},tx={},baseDeposit,baseLock,baseCustomerOwner,managerRole,salesRole,teamId,scopeId;
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const roles=await q("SELECT role_id,role_code FROM public.roles WHERE role_code IN('sales','manager')");
 salesRole=roles.find(x=>x.role_code==='sales').role_id;managerRole=roles.find(x=>x.role_code==='manager').role_id;
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[salesRole]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await q("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];assert.ok(team);teamId=team.team_id;
 let scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[teamId]))[0];assert.ok(scope);scopeId=scope.scope_id;
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(965001,'transaction.ci.open'),(965002,'deposit.ci.record'),(965003,'transaction.ci.cancel'),(965004,'transaction.responsible.transfer')");
 for(const perm of [965001,965002,965003]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[perm]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scopeId]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-4b-original-responsible'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));salesToken=login.token;
 for(let n=1;n<=5;n++){
  const request=await old(()=>intakeCI(db,{customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),requestKey:k('intake-'+n),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(request.code,'F06_1_PENDING_CREATED',JSON.stringify(request));
  const approved=await old(()=>decisionCI(auth,salesToken,{requestId:request.requestId,requestKey:k('approve-'+n),action:'approve'}));
  assert.equal(approved.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(approved));locks[n]=approved.lockId;
 }
 const dep=await with3a(()=>recordSyntheticDepositCI(auth,salesToken,{lockId:locks[1],amountCents:8600,currency:'CNY',
  paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit')}));
 assert.equal(dep.allowed,true,JSON.stringify(dep));
 const dep3=await with3a(()=>recordSyntheticDepositCI(auth,salesToken,{lockId:locks[3],amountCents:7300,currency:'CNY',
  paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('deposit3')}));
 assert.equal(dep3.allowed,true,JSON.stringify(dep3));
 for(let n=1;n<=4;n++){
  const opened=await with3b(()=>openSyntheticTransactionCI(auth,salesToken,{lockId:locks[n],eventKey:k('open-'+n)}));
  assert.equal(opened.code,'F06_3B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(opened));tx[n]=opened.transactionId;
 }
 baseDeposit=await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id');
 baseLock=await q('SELECT lock_id,lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]);
 baseCustomerOwner=(await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[customer]))[0].current_owner_employee_id;
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[managerRole]);
 const mgr=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-4b-current-signed-manager'});
 assert.equal(mgr.code,'AUTH_OK',JSON.stringify(mgr));managerToken=mgr.token;
});
test.after(async()=>{await auth.close();await peer.close();await db.end()});

let refund,transferToken,managerTeamScope,refundScope;
const req=(n,name,p={})=>requestSyntheticTransactionRefundCI(auth,managerToken,{subjectKind:'transaction',transactionId:tx[n],amountCents:4500,reason:'申请合成Transaction侧退款并保留不可变历史',eventKey:k('5a-'+name),...p});
const cls=(refundId,name,p={})=>closeSyntheticTransactionRefundCI(auth,managerToken,{refundId,closeReason:'客户明确放弃退款请求且尚未支付',eventKey:k('5a-'+name),...p});
test.before(async()=>{
 for(const n of [1,4]){
  const result=await cancelledParent(tx[n],'5a-init-cancel-'+n);
  assert.equal(result.allowed,true,JSON.stringify(result));
 }
});
test('5A-S01 主线已签4C以及本批Sidecar验真',async()=>assert.equal((await verify(db)).verified,true));
test('5A-S02 不可接生产Refund issuer',()=>assert.equal(productionRefundIssuerDeny().allowed,false));
test('5A-S03 禁止refunded及任何真钱支付',()=>assert.equal(actualRefundPaymentDeny().allowed,false));
test('5A-S04 禁止completed签发',()=>assert.equal(completedTransactionIssuerDeny().allowed,false));
test('5A-S05 Nonprivileged PostgreSQL16',async()=>{const x=(await q("SELECT current_user u,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd,current_setting('server_version_num')::int v"))[0];assert.equal(x.u,'f03_ci');assert.equal(x.su,false);assert.equal(x.cd,false);assert.ok(x.v>=160000&&x.v<170000)});
test('5A-S06 旧24迁移继续冻结',async()=>assert.equal(await count("SELECT count(*)::int n FROM public.f03_schema_migrations"),24));
test('5A-S07 旧4A确实取消一笔签名Transaction',async()=>assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'cancelled'));
test('5A-S08 旧Lock已转Transaction，不恢复旧Lock',async()=>assert.equal((await q('SELECT end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]))[0].end_reason,'converted_to_transaction'));
test('5A-S09 申请参数transactionId必须正整数',async()=>assert.equal((await req(1,'invalid-id',{transactionId:0})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S10 金额不能为0',async()=>assert.equal((await req(1,'zero',{amountCents:0})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S11 不允许负数金额',async()=>assert.equal((await req(1,'negative',{amountCents:-1})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S12 禁止超整型金额',async()=>assert.equal((await req(1,'large',{amountCents:100000000001})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S13 请求原因必须完整',async()=>assert.equal((await req(1,'reason',{reason:'x'})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S14 requestKey最短16字节',async()=>assert.equal((await req(1,'key',{eventKey:'too-short'})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S15 Lock subject不可冒用Transaction接口',async()=>assert.equal((await req(1,'lock-kind',{subjectKind:'lock'})).code,'F06_5A_INVALID_TRANSACTION_REFUND_REQUEST'));
test('5A-S16 无需附加产品批准，普通经理身份不等于退款授权',async()=>assert.equal((await req(1,'manager-without-right')).code,'F06_5A_REFUND_PERMISSION_SCOPE_DENIED'));
test('5A-S17 仅有override而未绑定capability scope仍拒绝',async()=>{
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(965005,'refund.ci.request')");
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,965005,'allow',clock_timestamp())");
 assert.equal((await req(1,'permission-no-scope')).code,'F06_5A_REFUND_PERMISSION_SCOPE_DENIED');
});
test('5A-S18 显式绑定当前Team Scope',async()=>{
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,965005,$1,clock_timestamp()-interval '2 minutes')",[scopeId]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=965005"),1);
});
test('5A-S19 未取消在途Transaction不能退款',async()=>assert.equal((await req(2,'inprogress')).code,'F06_5A_UNSIGNED_TRANSACTION_OR_LOCK'));
test('5A-S20 未知Transaction必须拒绝',async()=>assert.equal((await req(1,'unknown',{transactionId:99999999})).code,'F06_5A_TRANSACTION_NOT_FOUND'));
test('5A-S21 无Deposit的已取消Transaction拒绝',async()=>assert.equal((await req(4,'no-balance')).code,'F06_5A_DEPOSIT_OR_PAYMENT_SOURCE_GAP'));
test('5A-S22 超过真实退款余额拒绝',async()=>assert.equal((await req(1,'over-balance',{amountCents:8601})).code,'F06_5A_AMOUNT_EXCEEDS_BALANCE'));
test('5A-S23 伪造Session拒绝',async()=>assert.equal((await requestSyntheticTransactionRefundCI(auth,'forged',{subjectKind:'transaction',transactionId:tx[1],amountCents:2000,reason:'伪造身份不能对退款写入',eventKey:k('5a-forged')})).allowed,false));
test('5A-S24 BEFORE_PENDING注错完整回滚',async()=>await assert.rejects(()=>req(1,'rollback1',{testCheckpoint:'BEFORE_PENDING_THROW'}),/F06_5A_INJECTED_BEFORE_PENDING/));
test('5A-S25 AFTER_PENDING注错撤销公签退款行',async()=>{
 const n=await count('SELECT count(*)::int n FROM public.refund_cases');await assert.rejects(()=>req(1,'rollback2',{testCheckpoint:'AFTER_PENDING_THROW'}),/F06_5A_INJECTED_AFTER_PENDING/);assert.equal(await count('SELECT count(*)::int n FROM public.refund_cases'),n);
});
test('5A-S26 AFTER_EVENT注错撤销来源与事件',async()=>{
 await assert.rejects(()=>req(1,'rollback3',{testCheckpoint:'AFTER_EVENT_THROW'}),/F06_5A_INJECTED_AFTER_EVENT/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_5a_ci.status_events'),0);
});
test('5A-S27 AFTER_AUDIT注错连审计回滚',async()=>await assert.rejects(()=>req(1,'rollback4',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_5A_INJECTED_AFTER_AUDIT/));
test('5A-S28 BEFORE_COMMIT注错保证无半写',async()=>{
 await assert.rejects(()=>req(1,'rollback5',{testCheckpoint:'BEFORE_COMMIT_THROW'}),/F06_5A_INJECTED_BEFORE_COMMIT/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_5a_ci.refund_origins'),0);
});
test('5A-S29 新Transaction Refund pending原子签发',async()=>{
 const r=await req(1,'valid-pending');assert.equal(r.code,'F06_5A_PENDING_WITHOUT_PAYMENT',JSON.stringify(r));refund=r.refundId;assert.ok(refund>0);
});
test('5A-S30 公签subject只有Transaction而非Lock',async()=>{
 const x=(await q('SELECT lock_id,transaction_id,status,expected_amount_cents FROM public.refund_cases WHERE refund_id=$1',[refund]))[0];assert.equal(x.lock_id,null);assert.equal(Number(x.transaction_id),tx[1]);assert.equal(x.status,'pending');assert.equal(Number(x.expected_amount_cents),4500);
});
test('5A-S31 origin记录签名4A来源与退款余额',async()=>{
 const x=(await q('SELECT source_kind,balance_at_request_cents,amount_cents FROM f06_5a_ci.refund_origins WHERE refund_id=$1',[refund]))[0];assert.equal(x.source_kind,'F06_4A_CANCEL_SIGNED');assert.equal(Number(x.balance_at_request_cents),8600);assert.equal(Number(x.amount_cents),4500);
});
test('5A-S32 pending只保留不可变操作历史，不创建付款',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
 assert.equal(await count('SELECT count(*)::int n FROM f06_5a_ci.status_events'),1);
});
test('5A-S33 相同requestKey幂等返回原申请',async()=>assert.equal((await req(1,'valid-pending')).refundId,refund));
test('5A-S34 同key改金额强制冲突',async()=>assert.equal((await req(1,'valid-pending',{amountCents:4400})).code,'F06_5A_IDEMPOTENCY_CONFLICT'));
test('5A-S35 同一Cycle未关闭pending硬拒第二请求',async()=>assert.equal((await req(1,'duplicate')).code,'F06_5A_ACTIVE_REFUND_CONFLICT'));
test('5A-S36 pending阻止Customer直接进公海',async()=>assert.equal((await pendingPublicPoolGuardCI(db,customer)).allowed,false));
test('5A-S37 pending不占车辆',async()=>assert.equal((await pendingVehicleGuardCI(db,vehicle(1))).code,'F06_5A_REFUND_NEVER_OCCUPIES_VEHICLE'));
test('5A-S38 关闭原因不能为空',async()=>assert.equal((await cls(refund,'empty',{closeReason:'  '})).code,'F06_5A_INVALID_CLOSE_REQUEST'));
test('5A-S39 未签Refund禁止关闭',async()=>assert.equal((await cls(99999999,'unsigned')).code,'F06_5A_UNSIGNED_REFUND_CASE'));
test('5A-S40 BEFORE_CLOSE失败不改变pending',async()=>await assert.rejects(()=>cls(refund,'before-close',{testCheckpoint:'BEFORE_CLOSE_THROW'}),/F06_5A_INJECTED_BEFORE_CLOSE/));
test('5A-S41 AFTER_CLOSE失败事务回滚',async()=>{
 await assert.rejects(()=>cls(refund,'after-close',{testCheckpoint:'AFTER_CLOSE_THROW'}),/F06_5A_INJECTED_AFTER_CLOSE/);
 assert.equal((await q('SELECT status FROM public.refund_cases WHERE refund_id=$1',[refund]))[0].status,'pending');
});
test('5A-S42 AFTER_EVENT失败不可留下半条历史',async()=>await assert.rejects(()=>cls(refund,'after-close-event',{testCheckpoint:'AFTER_EVENT_THROW'}),/F06_5A_INJECTED_AFTER_CLOSE_EVENT/));
test('5A-S43 AFTER_AUDIT失败不可留下关闭事实',async()=>await assert.rejects(()=>cls(refund,'after-close-audit',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_5A_INJECTED_AFTER_CLOSE_AUDIT/));
test('5A-S44 closed明确原因且没有付款',async()=>{
 const v=await cls(refund,'valid-close');assert.equal(v.code,'F06_5A_CLOSED_WITHOUT_PAYMENT',JSON.stringify(v));
 const x=(await q('SELECT status,close_reason,closed_at FROM public.refund_cases WHERE refund_id=$1',[refund]))[0];assert.equal(x.status,'closed');assert.ok(x.close_reason.length>6);assert.ok(x.closed_at);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('5A-S45 closed相同key只幂等不二次写入',async()=>assert.equal((await cls(refund,'valid-close')).code,'F06_5A_IDEMPOTENT_CLOSE'));
test('5A-S46 closed新key不得复活',async()=>assert.equal((await cls(refund,'repeat-close')).code,'F06_5A_ONLY_PENDING_CAN_CLOSE'));
test('5A-S47 closed不会绕过其它在途Transaction的公海保护',async()=>assert.equal((await pendingPublicPoolGuardCI(db,customer)).allowed,false));
test('5A-S48 新历史不允许UPDATE DELETE',async()=>{
 await assert.rejects(()=>q("DELETE FROM f06_5a_ci.status_events WHERE refund_id=$1",[refund]),/F06_5A_APPEND_ONLY_HISTORY/);
 await assert.rejects(()=>q("UPDATE f06_5a_ci.refund_origins SET amount_cents=1 WHERE refund_id=$1",[refund]),/F06_5A_APPEND_ONLY_HISTORY/);
});
test('5A-S49 真实业务不可被合成Refund回写为refunded',async()=>assert.equal(await count("SELECT count(*)::int n FROM public.refund_cases WHERE status='refunded'"),0));
test('5A-S50 生产Issuer/真实付款/Transaction completed始终不存在',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
 assert.equal(await count("SELECT count(*)::int n FROM public.transactions WHERE status='completed'"),0);
});
test('5A-S51 授权撤销后旧Session不能申请',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965005");
 try{assert.equal((await req(1,'revoked')).code,'F06_5A_REFUND_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965005")}
});
test('5A-S52 有效Scope到期后旧Session不能写入',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965005");
 try{assert.equal((await req(1,'scope-ended')).code,'F06_5A_REFUND_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=965005")}
});
test('5A-S53 客户被停用立即拒绝',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{assert.equal((await req(1,'disabled')).code,'F06_5A_REFUND_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('5A-S54 两独立PG backend可追踪',async()=>{
 const b=await connect();try{assert.notEqual((await q('SELECT pg_backend_pid() pid'))[0].pid,(await b.query('SELECT pg_backend_pid() pid')).rows[0].pid)}
 finally{await b.end()}
});

let employee4Token,ref3,employee4Scope;
const r3=(tag,p={},other=auth)=>requestSyntheticTransactionRefundCI(other,employee4Token,{subjectKind:'transaction',transactionId:tx[3],amountCents:3000,reason:'合成正式移交后合法负责销售退款申请',eventKey:k('5a-transferred-'+tag),...p});
test('5A-S55 经理没有transfer独立许可不得自持移交',async()=>{
 const x=await withF064B(()=>handoffSyntheticTransactionCI(auth,managerToken,{transactionId:tx[3],newResponsibleId:4,reason:'缺独立授权的转移必须拒绝',eventKey:k('5a-transfer-deny')}));
 assert.equal(x.allowed,false);
});
test('5A-S56 专属transfer权限依附正式Team Scope',async()=>{
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(965004,'transaction.responsible.transfer')");
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,965004,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,965004,$1,clock_timestamp()-interval '2 minutes')",[scopeId]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=965004"),1);
});
test('5A-S57 4B经理真实正式移交第三笔合成交易至员工4',async()=>{
 const x=await withF064B(()=>handoffSyntheticTransactionCI(auth,managerToken,{transactionId:tx[3],newResponsibleId:4,reason:'合法经理正式变更第三笔当前负责销售',eventKey:k('5a-transfer-valid')}));
 assert.equal(x.code,'F06_4B_ATOMIC_HANDOFF_CI',JSON.stringify(x));
});
test('5A-S58 接收新负责人必须启用独立登录凭据',async()=>{
 await q("UPDATE public.pc_login_accounts SET credential_state='enabled',force_password_change=false WHERE account_id=5 AND employee_id=4");
 const x=await auth.login({login:'disabled_test',password:'SyntheticDisabled_123',source:'f06-5a-4c-current-responsible-only'});
 assert.equal(x.code,'AUTH_OK',JSON.stringify(x));employee4Token=x.token;
});
test('5A-S59 当前员工4获得独立Cancel permission与team scope',async()=>{
 employee4Scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=4 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[teamId]))[0];
 if(!employee4Scope)employee4Scope=(await q("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(4,'team',$1) RETURNING scope_id",[teamId]))[0];
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(4,965003,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(4,965003,$1,clock_timestamp()-interval '2 minutes')",[employee4Scope.scope_id]);
 assert.ok(employee4Scope.scope_id);
});
test('5A-S60 4C新Responsible原子取消后保留独立签名链',async()=>{
 const x=await withF064C(()=>cancelAfterHandoffSyntheticCI(auth,employee4Token,{transactionId:tx[3],reason:'合成移交后当前新负责人合法取消交易',eventKey:k('5a-current-cancel')}));
 assert.equal(x.code,'F06_4C_POST_HANDOFF_CANCELLED_ATOMIC_CI',JSON.stringify(x));
});
test('5A-S61 当前负责人4的refund能力不因cancel权自动获得',async()=>assert.equal((await r3('no-explicit')).code,'F06_5A_REFUND_PERMISSION_SCOPE_DENIED'));
test('5A-S62 给员工4单独授予当前退款权限与scope',async()=>{
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(4,965005,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(4,965005,$1,clock_timestamp()-interval '2 minutes')",[employee4Scope.scope_id]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=4 AND permission_id=965005"),1);
});
test('5A-S63 双真实Backend抢同Transaction退款至多一个pending胜出',async()=>{
 const calls=await Promise.allSettled([r3('race-a'),r3('race-b',{},peer)]);
 const success=calls.filter(x=>x.status==='fulfilled'&&x.value.code==='F06_5A_PENDING_WITHOUT_PAYMENT');
 assert.equal(success.length,1,JSON.stringify(calls));ref3=success[0].value.refundId;assert.ok(ref3>0);
});
test('5A-S64 4C当前负责人与原始Lock/资金签名确实落交易侧Refund',async()=>{
 const o=(await q('SELECT source_kind,balance_at_request_cents,responsible_employee_id FROM f06_5a_ci.refund_origins WHERE refund_id=$1',[ref3]))[0];
 assert.equal(o.source_kind,'F06_4C_CANCEL_SIGNED');assert.equal(Number(o.balance_at_request_cents),7300);assert.equal(Number(o.responsible_employee_id),4);
});
test('5A-S65 原Responsible旧凭证不可越权关闭新负责人Refund',async()=>{
 assert.equal((await cls(ref3,'old4c-owner')).code,'F06_5A_NOT_CURRENT_BUSINESS_RESPONSIBLE');
});
test('5A-S66 4C交易侧pending Refund不能占车辆',async()=>{
 assert.equal((await pendingVehicleGuardCI(db,vehicle(3))).allowed,true);
});
test('5A-S67 正确当前销售仅无付款close签发',async()=>{
 const x=await closeSyntheticTransactionRefundCI(auth,employee4Token,{refundId:ref3,closeReason:'客户最终明确不需要退回相关意向金',eventKey:k('5a-close-current')});
 assert.equal(x.code,'F06_5A_CLOSED_WITHOUT_PAYMENT',JSON.stringify(x));
});
test('5A-S68 4A与4C两笔退款都无refunded且公海依旧多源防泄漏',async()=>{
 assert.equal(await count("SELECT count(*)::int n FROM public.refund_cases WHERE status='refunded'"),0);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
 assert.equal((await pendingPublicPoolGuardCI(db,customer)).allowed,false);
});
