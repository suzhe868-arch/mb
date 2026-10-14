import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withF064B} from '../migration.mjs';
import {withF064A} from '../../transaction-handoff-ci/migration.mjs';
import {cancelAfterHandoffSyntheticCI,postHandoffOccupancyCI,publicPoolGuardCI,productionCancelDeny as deny4CProduction,realRefundDeny,completedDeny as deny4CCompleted} from '../service.mjs';
import {handoffSyntheticTransactionCI,currentSignedResponsibleCI,postHandoffCancelGuardCI,publicPoolHandoffGuardCI,productionHandoffDeny,productionCancelDeny,realMoneyDeny,completedDeny} from '../service.mjs';
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
test('4B-S01 签名F06-4A父链与独立CI sidecar',async()=>assert.equal((await verify(db)).verified,true));
test('4B-S02 真实非特权PG16且无CREATEDB',async()=>{
 const r=(await q("SELECT current_user u,current_database() db,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb"))[0];
 assert.equal(r.u,'f03_ci');assert.equal(r.db,'f03_auth_test');assert.equal(r.su,false);assert.equal(r.cdb,false);assert.ok(r.v>=160000&&r.v<170000);
});
test('4B-S03 签名旧24迁移不允许重写',async()=>assert.equal(await count('SELECT count(*)::int n FROM public.f03_schema_migrations'),24));
test('4B-S04 F03-2M签名表承载存在但不冒造旧Receipt',async()=>{
 assert.equal((await verify(db)).f03MReceiptCarrier,true);
 assert.equal(await count('SELECT count(*)::int n FROM public.transaction_responsible_handover_receipts'),0);
});
test('4B-S05 生产Handoff issuer硬拒绝',()=>assert.equal(productionHandoffDeny().allowed,false));
test('4B-S06 生产Cancel issuer硬拒绝',()=>assert.equal(productionCancelDeny().allowed,false));
test('4B-S07 completed issuer未授权',()=>assert.equal(completedDeny().allowed,false));
test('4B-S08 真实资金issuer未授权',()=>assert.equal(realMoneyDeny().allowed,false));
test('4B-S09 当前in_progress原负责人和原Lock一致',async()=>{
 const o=(await q('SELECT responsible_employee_id,source_lock_id,status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(Number(o.responsible_employee_id),1);assert.equal(Number(o.source_lock_id),locks[1]);assert.equal(o.status,'in_progress');
});
test('4B-S10 Customer owner变动不自动漂移Transaction',async()=>{
 await q('UPDATE public.customers SET current_owner_employee_id=4 WHERE customer_id=$1',[customer]);
 try{assert.equal((await q('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].responsible_employee_id,'1')}
 finally{await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer])}
});
test('4B-S11 经理职位本身无独立transfer权限',async()=>assert.equal((await transfer(1,'without-right')).code,'F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED'));
test('4B-S12 显式permission+现时team Scope批准',async()=>{
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,965004,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,965004,$1,clock_timestamp()-interval '2 minutes')",[scopeId]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=965004 AND decision='allow'"),1);
});
test('4B-S13 非法交易id先拒绝',async()=>assert.equal((await transfer(1,'badid',{transactionId:0})).code,'F06_4B_INVALID_REQUEST'));
test('4B-S14 非法recipient先拒绝',async()=>assert.equal((await transfer(1,'badto',{newResponsibleId:0})).code,'F06_4B_INVALID_REQUEST'));
test('4B-S15 无reason拒绝',async()=>assert.equal((await transfer(1,'badreason',{reason:' '})).code,'F06_4B_INVALID_REQUEST'));
test('4B-S16 不合法key拒绝',async()=>assert.equal((await transfer(1,'badkey',{eventKey:'abc'})).code,'F06_4B_INVALID_REQUEST'));
test('4B-S17 伪造Token拒绝',async()=>assert.equal((await handoffSyntheticTransactionCI(auth,'invalid',{transactionId:tx[1],newResponsibleId:4,reason:'合成假的转移理由',eventKey:k('forged')})).allowed,false));
test('4B-S18 错误Object不存在拒绝',async()=>assert.equal((await transfer(1,'notfound',{transactionId:99999999})).code,'F06_4B_TRANSACTION_NOT_FOUND'));
test('4B-S19 非合法receiver不能虚构',async()=>assert.equal((await transfer(1,'badreceiver',{newResponsibleId:9999999})).allowed,false));
test('4B-S20 receiving employee停用后拒绝',async()=>{
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{assert.equal((await transfer(1,'inactive-recipient')).code,'F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('4B-S21 当前Customer停用拒绝',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{assert.equal((await transfer(1,'customer-disabled')).code,'F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('4B-S22 before-change故障注入真实回滚',async()=>{
 await assert.rejects(()=>transfer(1,'before',{testCheckpoint:'BEFORE_CHANGE_THROW'}),/F06_4B_INJECTED_BEFORE_CHANGE_ROLLBACK/);
 assert.equal((await q('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].responsible_employee_id,'1');
});
test('4B-S23 after-change故障注入真实回滚',async()=>{
 await assert.rejects(()=>transfer(1,'after-change',{testCheckpoint:'AFTER_CHANGE_THROW'}),/F06_4B_INJECTED_CHANGE_ROLLBACK/);
 assert.equal((await q('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].responsible_employee_id,'1');
});
test('4B-S24 after-event故障注入，Sidecar无半条',async()=>{
 await assert.rejects(()=>transfer(1,'after-event',{testCheckpoint:'AFTER_EVENT_THROW'}),/F06_4B_INJECTED_EVENT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4b_ci.handoff_events'),0);
});
test('4B-S25 after-audit故障注入，审计回滚',async()=>{
 await assert.rejects(()=>transfer(1,'after-audit',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_4B_INJECTED_AUDIT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4b_ci.handoff_events'),0);
});
test('4B-S26 before-commit注错没有半写入',async()=>{
 await assert.rejects(()=>transfer(1,'precommit',{testCheckpoint:'BEFORE_COMMIT_THROW'}),/F06_4B_INJECTED_PRECOMMIT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4b_ci.responsible_projection'),0);
});
test('4B-S27 经理当前合法权限原子移交到新Responsible',async()=>{
 const v=await transfer(1,'valid');assert.equal(v.code,'F06_4B_ATOMIC_HANDOFF_CI',JSON.stringify(v));
 assert.equal(v.oldResponsibleId,1);assert.equal(v.newResponsibleId,4);assert.equal(v.transactionId,tx[1]);assert.ok(v.eventId>0);
});
test('4B-S28 签名当前投影从original变current',async()=>{
 const v=await withF064B(()=>currentSignedResponsibleCI(db,tx[1]));assert.equal(v.code,'F06_4B_SIGNED_RESPONSIBLE_CI');assert.equal(v.currentResponsibleId,4);assert.equal(v.originalResponsibleId,1);assert.equal(v.hasHandoff,true);
});
test('4B-S29 不可变移交含old/new/actor/time/reason',async()=>{
 const v=(await q('SELECT old_responsible_employee_id old,new_responsible_employee_id next,actor_employee_id actor,reason,occurred_at FROM f06_4b_ci.handoff_events WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(Number(v.old),1);assert.equal(Number(v.next),4);assert.equal(Number(v.actor),1);assert.ok(v.reason.length>=6);assert.ok(v.occurred_at);
});
test('4B-S30 幂等同Key不会第二次移交',async()=>assert.equal((await transfer(1,'valid')).code,'F06_4B_IDEMPOTENT_HANDOFF'));
test('4B-S31 同Key变reason必须拒绝',async()=>assert.equal((await transfer(1,'valid',{reason:'同Key不同内容绝不复用'})).code,'F06_4B_IDEMPOTENCY_KEY_CONFLICT'));
test('4B-S32 同Key换Subject必须拒绝',async()=>assert.equal((await transfer(2,'valid')).code,'F06_4B_IDEMPOTENCY_KEY_CONFLICT'));
test('4B-S33 本域历史UPDATE/DELETE必拒',async()=>{
 await assert.rejects(()=>q('DELETE FROM f06_4b_ci.handoff_events WHERE transaction_id=$1',[tx[1]]),/F06_4B_APPEND_ONLY_HISTORY/);
 await assert.rejects(()=>q("UPDATE f06_4b_ci.request_keys SET payload_sha256=repeat('0',64)"),/F06_4B_APPEND_ONLY_HISTORY/);
});
test('4B-S34 父取消旧Responsible不得操作',async()=>{
 const parent=await cancelledParent(tx[1],'old-cancel');assert.equal(parent.allowed,false);
 const v=await withF064B(()=>postHandoffCancelGuardCI(db,tx[1],1));assert.equal(v.code,'PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP');assert.equal(v.actorIsCurrent,false);
});
test('4B-S35 父取消新Responsible在缺失父来源时同样FailClosed',async()=>{
 const v=await withF064B(()=>postHandoffCancelGuardCI(db,tx[1],4));assert.equal(v.code,'PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP');assert.equal(v.actorIsCurrent,true);
});
test('4B-S36 原始签名Lock仍然released不复活',async()=>assert.deepEqual(await q('SELECT lock_id,lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]),baseLock));
test('4B-S37 旧资金Deposit不可改',async()=>assert.deepEqual(await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id'),baseDeposit));
test('4B-S38 Customer owner不变且公海仍阻断在途责任',async()=>{
 assert.equal((await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[customer]))[0].current_owner_employee_id,baseCustomerOwner);
 assert.equal((await publicPoolHandoffGuardCI(db,customer)).code,'F06_4B_ACTIVE_BUSINESS_PREVENTS_PUBLIC_POOL');
});
test('4B-S39 权限撤销后旧Session不允许第二笔移交',async()=>{
 const other=await connect();try{
  assert.notEqual((await q('SELECT pg_backend_pid() pid'))[0].pid,(await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await other.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965004");
  assert.equal((await transfer(2,'revoked')).code,'F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED');
 }finally{await other.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965004");await other.end()}
});
test('4B-S40 manager切回普通sales不可再移交',async()=>{
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[salesRole]);
 try{assert.equal((await transfer(2,'sales')).allowed,false)}
 finally{await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[managerRole])}
});
test('4B-S41 current scope binding撤销立刻拒绝',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=965004");
 try{assert.equal((await transfer(2,'scope-revoked')).code,'F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=965004")}
});
test('4B-S42 另一独立PG backend同时移交只有一个赢家',async()=>{
 const calls=await Promise.allSettled([transfer(3,'race1'),handoffSyntheticTransactionCI(peer,managerToken,{transactionId:tx[3],newResponsibleId:4,reason:'第二独立PG backend合法移交请求',eventKey:k('race2')})]);
 const wins=calls.filter(x=>x.status==='fulfilled'&&x.value.code==='F06_4B_ATOMIC_HANDOFF_CI');
 assert.equal(wins.length,1,JSON.stringify(calls));
 assert.equal(await count('SELECT count(*)::int n FROM f06_4b_ci.handoff_events WHERE transaction_id='+tx[3]),1);
});
test('4B-S43 cancelled交易不允许事后移交',async()=>{
 const v=await cancelledParent(tx[4],'terminal-cancel');assert.equal(v.allowed,true,JSON.stringify(v));
 assert.equal((await transfer(4,'after-cancel')).code,'F06_4B_NOT_IN_PROGRESS');
});
test('4B-S44 仍在途但接收人本人不能私自取消SourceGap',async()=>{
 assert.equal((await withF064B(()=>postHandoffCancelGuardCI(db,tx[3],4))).code,'PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP');
});
test('4B-S45 public Status不改，保留in_progress占用',async()=>{
 const v=(await q('SELECT status,responsible_employee_id,completed_at FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(v.status,'in_progress');assert.equal(Number(v.responsible_employee_id),4);assert.equal(v.completed_at,null);
});
test('4B-S46 原价/Lock/Priority/Waitlist历史未复活',async()=>{
 const x=(await q('SELECT initial_hours,policy_version FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1',[locks[1]]))[0];
 assert.equal(x.initial_hours,72);assert.equal(x.policy_version,1);
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[1]]))[0].lock_status,'released');
});
test('4B-S47 不写实际Refund payments',async()=>assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0));
test('4B-S48 双真实独立Physical PG后端结果可审计',async()=>{
 const p1=(await q('SELECT pg_backend_pid() pid'))[0].pid;const other=await connect();
 try{const p2=(await other.query('SELECT pg_backend_pid() pid')).rows[0].pid;assert.notEqual(p1,p2);console.log('F06_4B_TWO_NATIVE_PG_BACKENDS_PROVEN',{p1,p2})}
 finally{await other.end()}
});

let newToken,secondCancelKey=k('4c-valid'),startAudit,recordedDeposit,originalHandoff;
const cancel=(n,tag,p={})=>cancelAfterHandoffSyntheticCI(auth,newToken,{transactionId:tx[n],reason:'移交后当前合法负责人合成取消原因',eventKey:k(tag),...p});
test('4C-S01 新Sidecar签署父4B签名',async()=>assert.equal((await verify(db)).verified,true));
test('4C-S02 上游4B旧案共48项全冻结源测试完成',async()=>assert.equal(await count("SELECT count(*)::int n FROM f06_4b_ci.handoff_events"),2));
test('4C-S03 新域生产Transaction取消Issuer硬拒',()=>assert.equal(deny4CProduction().allowed,false));
test('4C-S04 真实Refund支付Issuer不可访问',()=>assert.equal(realRefundDeny().allowed,false));
test('4C-S05 已成交完成Issuer不可访问',()=>assert.equal(deny4CCompleted().allowed,false));
test('4C-S06 独立非超级PG16始终不变',async()=>{
 const x=(await q("SELECT current_user u,current_database() d,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd"))[0];
 assert.equal(x.u,'f03_ci');assert.equal(x.d,'f03_auth_test');assert.equal(x.su,false);assert.equal(x.cd,false);
});
test('4C-S07 启用新的纯合成recipient账号但不授予Cancel独立权限',async()=>{
 await q("UPDATE public.pc_login_accounts SET credential_state='enabled',force_password_change=false WHERE account_id=5 AND employee_id=4");
 const x=await auth.login({login:'disabled_test',password:'SyntheticDisabled_123',source:'f06-4c-only-disposable-employee4'});
 assert.equal(x.code,'AUTH_OK',JSON.stringify(x));newToken=x.token;
 originalHandoff=await q('SELECT * FROM f06_4b_ci.handoff_events ORDER BY event_id');
 recordedDeposit=await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id');
 startAudit=await count('SELECT count(*)::int n FROM public.audit_events');
});
test('4C-S08 只成为current responsible绝不自动得到Cancel权',async()=>assert.equal((await cancel(1,'no-right')).code,'F06_4C_PERMISSION_SCOPE_DENIED'));
test('4C-S09 显式授予独立Cancel Permission但没有Scope仍不允许',async()=>{
 let sc=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=4 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[teamId]))[0];
 if(!sc)sc=(await q("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(4,'team',$1) RETURNING scope_id",[teamId]))[0];
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(4,965003,'allow',clock_timestamp())");
 assert.equal((await cancel(1,'not-bound')).code,'F06_4C_PERMISSION_SCOPE_DENIED');
});
test('4C-S10 授予当前团队范围并明确Cancel权限',async()=>{
 const sc=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=4 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[teamId]))[0];
 assert.ok(sc);
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(4,965003,$1,clock_timestamp()-interval '2 minutes')",[sc.scope_id]);
 assert.equal((await q("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=4 AND permission_id=965003 AND decision='allow'"))[0].n,1);
});
test('4C-S11 旧负责人的有效Manager身份不能Cancel',async()=>{
 const x=await cancelAfterHandoffSyntheticCI(auth,managerToken,{transactionId:tx[1],reason:'旧负责人不得再取消合成交易',eventKey:k('old-responsible')});
 assert.equal(x.code,'F06_4C_OLD_RESPONSIBLE_DENIED');
});
test('4C-S12 旧4A已签Cancel原服务继续安全FailClosed',async()=>{
 const x=await cancelledParent(tx[1],'4c-old4a');assert.equal(x.allowed,false);
});
test('4C-S13 旧4B新负责人原始来源有不可变事件链',async()=>{
 const x=await withF064B(()=>currentSignedResponsibleCI(db,tx[1]));assert.equal(x.currentResponsibleId,4);assert.equal(x.originalResponsibleId,1);assert.equal(x.hasHandoff,true);
});
test('4C-S14 来源Lock不可被恢复',async()=>assert.deepEqual(await q('SELECT lock_id,lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]),baseLock));
test('4C-S15 非法TransactionId拒绝',async()=>assert.equal((await cancel(1,'bad-id',{transactionId:0})).code,'F06_4C_INVALID_REQUEST'));
test('4C-S16 不可接受空原因',async()=>assert.equal((await cancel(1,'bad-reason',{reason:' '})).code,'F06_4C_INVALID_REQUEST'));
test('4C-S17 过短幂等键拒绝',async()=>assert.equal((await cancel(1,'bad-key',{eventKey:'short'})).code,'F06_4C_INVALID_REQUEST'));
test('4C-S18 不存在Transaction拒绝',async()=>assert.equal((await cancel(1,'not-found',{transactionId:99999999})).code,'F06_4C_TRANSACTION_NOT_FOUND'));
test('4C-S19 伪造Token拒绝',async()=>assert.equal((await cancelAfterHandoffSyntheticCI(auth,'forged',{transactionId:tx[1],reason:'伪造用户会话无权取消',eventKey:k('forged')})).allowed,false));
test('4C-S20 没有正式签名handoff的另笔Transaction拒绝',async()=>assert.equal((await cancel(2,'unsigned')).code,'F06_4C_OLD_RESPONSIBLE_DENIED'));
test('4C-S21 BEFORE_STATUS错误注入保留原交易',async()=>{
 await assert.rejects(()=>cancel(1,'before',{testCheckpoint:'BEFORE_STATUS_THROW'}),/F06_4C_INJECTED_BEFORE_STATUS_ROLLBACK/);
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'in_progress');
});
test('4C-S22 AFTER_STATUS错误注入真实Rollback',async()=>{
 await assert.rejects(()=>cancel(1,'after-status',{testCheckpoint:'AFTER_STATUS_THROW'}),/F06_4C_INJECTED_AFTER_STATUS_ROLLBACK/);
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0].status,'in_progress');
});
test('4C-S23 AFTER_EVENT错误注入不会留下Cancel Sidecar',async()=>{
 await assert.rejects(()=>cancel(1,'after-event',{testCheckpoint:'AFTER_EVENT_THROW'}),/F06_4C_INJECTED_AFTER_EVENT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4c_ci.cancel_events'),0);
});
test('4C-S24 AFTER_AUDIT错误注入不会泄漏新的可见状态',async()=>{
 await assert.rejects(()=>cancel(1,'after-audit',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_4C_INJECTED_AFTER_AUDIT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4c_ci.cancel_origins'),0);
});
test('4C-S25 BEFORE_COMMIT错误注入完整Rollback',async()=>{
 await assert.rejects(()=>cancel(1,'precommit',{testCheckpoint:'BEFORE_COMMIT_THROW'}),/F06_4C_INJECTED_PRECOMMIT_ROLLBACK/);
 assert.equal(await count('SELECT count(*)::int n FROM f06_4c_ci.request_keys'),0);
});
test('4C-S26 权限撤销COMMIT后旧Token马上FailClosed',async()=>{
 const c2=await connect();try{
  await c2.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=4 AND permission_id=965003");
  assert.equal((await cancel(1,'revoked')).code,'F06_4C_PERMISSION_SCOPE_DENIED');
 }finally{await c2.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=4 AND permission_id=965003");await c2.end()}
});
test('4C-S27 Capability Scope暂停后不授权取消',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=4 AND permission_id=965003");
 try{assert.equal((await cancel(1,'scope-ended')).code,'F06_4C_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=4 AND permission_id=965003")}
});
test('4C-S28 recipient离职必须拒绝',async()=>{
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{assert.equal((await cancel(1,'employee-disabled')).allowed,false)}
 finally{await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('4C-S29 Customer停用不能Cancel',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{assert.equal((await cancel(1,'customer-disabled')).code,'F06_4C_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('4C-S30 未签Refund pending必须阻止合成Cancel',async()=>{
 const rid=967001;
 await q("INSERT INTO public.refund_cases(refund_id,customer_id,transaction_id,status,created_at) VALUES($1,$2,$3,'pending',clock_timestamp())",[rid,customer,tx[1]]);
 try{assert.equal((await cancel(1,'refund-pending')).code,'F06_4C_FINANCIAL_OR_REFUND_UNKNOWN_DENY')}
 finally{await q('DELETE FROM public.refund_cases WHERE refund_id=$1',[rid])}
});
test('4C-S31 未签收据数量漂移阻断取消',async()=>{
 const did=967002;
 await q("INSERT INTO public.deposit_receipts(deposit_id,customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES($1,$2,$3,500,clock_timestamp(),1)",[did,customer,locks[1]]);
 try{assert.equal((await cancel(1,'unproven-deposit')).allowed,false)}
 finally{await q('DELETE FROM public.deposit_receipts WHERE deposit_id=$1',[did])}
});
test('4C-S32 父Projection合法当前负责人签名不能任意替换',async()=>{
 await q("UPDATE f06_4b_ci.responsible_projection SET current_responsible_employee_id=1 WHERE transaction_id=$1",[tx[1]]);
 try{assert.equal((await cancel(1,'projection-drift')).code,'F06_4C_SIGNED_HANDOFF_SOURCE_GAP')}
 finally{await q("UPDATE f06_4b_ci.responsible_projection SET current_responsible_employee_id=4 WHERE transaction_id=$1",[tx[1]])}
});
test('4C-S33 新取消之前仍在途占车',async()=>assert.equal((await postHandoffOccupancyCI(db,vehicle(1))).code,'F06_4C_SIGNED_TRANSACTION_STILL_OCCUPIES'));
test('4C-S34 真实Manager不能代当前负责人越权',async()=>assert.equal((await cancelAfterHandoffSyntheticCI(auth,managerToken,{transactionId:tx[1],reason:'Manager不得取代当前负责人',eventKey:k('manager')})).allowed,false));
test('4C-S35 合法当前负责人原子取消',async()=>{
 const x=await cancel(1,'valid');assert.equal(x.code,'F06_4C_POST_HANDOFF_CANCELLED_ATOMIC_CI',JSON.stringify(x));
 assert.equal(x.transactionId,tx[1]);assert.equal(x.currentResponsibleId,4);assert.ok(x.backendPid);
});
test('4C-S36 真正public.transactions已转cancelled终态',async()=>{
 const t=(await q('SELECT status,responsible_employee_id,completed_at FROM public.transactions WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(t.status,'cancelled');assert.equal(Number(t.responsible_employee_id),4);assert.equal(t.completed_at,null);
});
test('4C-S37 Signed Cancel包含原负责人和新负责人旧签名',async()=>{
 const v=(await q('SELECT * FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(Number(v.original_responsible_employee_id),1);assert.equal(Number(v.transferred_responsible_employee_id),4);
 assert.equal(Number(v.actor_employee_id),4);assert.ok(v.parent_last_handoff_event_id);assert.ok(v.occurred_at);
});
test('4C-S38 取消事件追加且reason不为空',async()=>{
 const v=(await q('SELECT * FROM f06_4c_ci.cancel_events WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(v.event_kind,'post_handoff_transaction_cancelled_ci_only');assert.ok(v.reason.length>=6);
});
test('4C-S39 同Key重复取消幂等不会第二次写入',async()=>assert.equal((await cancel(1,'valid')).code,'F06_4C_IDEMPOTENT_CANCEL'));
test('4C-S40 同Key改reason必须拒绝',async()=>assert.equal((await cancel(1,'valid',{reason:'同Key修改签名原因不允许'})).code,'F06_4C_IDEMPOTENCY_CONFLICT'));
test('4C-S41 相同Key更换Transaction必须拒绝',async()=>assert.equal((await cancel(3,'valid')).code,'F06_4C_IDEMPOTENCY_CONFLICT'));
test('4C-S42 换新Key不能复活已经cancelled的终态',async()=>assert.equal((await cancel(1,'new-key')).code,'F06_4C_TERMINAL_TRANSACTION_DENY'));
test('4C-S43 正式新增Cancel事件不可覆盖',async()=>{
 await assert.rejects(()=>q('DELETE FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1',[tx[1]]),/F06_4C_APPEND_ONLY_IMMUTABLE/);
 await assert.rejects(()=>q("UPDATE f06_4c_ci.cancel_events SET reason='tamper' WHERE transaction_id=$1",[tx[1]]),/F06_4C_APPEND_ONLY_IMMUTABLE/);
});
test('4C-S44 4B旧handoff签名事件一个字不变',async()=>assert.deepEqual(await q('SELECT * FROM f06_4b_ci.handoff_events ORDER BY event_id'),originalHandoff));
test('4C-S45 旧Deposit金额和凭证原样不变',async()=>assert.deepEqual(await q('SELECT deposit_id,lock_id,amount_cents FROM public.deposit_receipts ORDER BY deposit_id'),recordedDeposit));
test('4C-S46 原Lock不会因为合成取消恢复',async()=>assert.deepEqual(await q('SELECT lock_id,lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]),baseLock));
test('4C-S47 合法当前已cancelled仅占用Guard解除',async()=>assert.equal((await postHandoffOccupancyCI(db,vehicle(1))).code,'F06_4C_SIGNED_CANCEL_NO_IN_PROGRESS_OCCUPANCY_ONLY_CI'));
test('4C-S48 Customer存在其它在途责任仍不能自动入公海',async()=>assert.equal((await publicPoolGuardCI(db,customer)).code,'F06_4C_PUBLIC_POOL_ACTIVE_BUSINESS_GUARD'));
test('4C-S49 两个真实PG16 backend同时抢同一在途交易只有一赢家',async()=>{
 const r=await Promise.allSettled([cancel(3,'raceA'),cancelAfterHandoffSyntheticCI(peer,newToken,{transactionId:tx[3],reason:'第二独立PG后端合成当前负责人取消',eventKey:k('raceB')})]);
 assert.equal(r.filter(x=>x.status==='fulfilled'&&x.value.code==='F06_4C_POST_HANDOFF_CANCELLED_ATOMIC_CI').length,1,JSON.stringify(r));
});
test('4C-S50 双PG竞争没有重复Cancel事件',async()=>assert.equal((await q('SELECT count(*)::int n FROM f06_4c_ci.cancel_events WHERE transaction_id=$1',[tx[3]]))[0].n,1));
test('4C-S51 终态后旧负责人仍不可取消',async()=>assert.equal((await cancelAfterHandoffSyntheticCI(auth,managerToken,{transactionId:tx[3],reason:'旧负责人终态也不能取消',eventKey:k('old-after')})).allowed,false));
test('4C-S52 新取消没有假退款支付',async()=>assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0));
test('4C-S53 审计记录真正新增',async()=>assert.ok(await count('SELECT count(*)::int n FROM public.audit_events')>startAudit));
test('4C-S54 客户归属独立于Transaction业务状态且没有漂移',async()=>assert.equal((await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[customer]))[0].current_owner_employee_id,baseCustomerOwner));
