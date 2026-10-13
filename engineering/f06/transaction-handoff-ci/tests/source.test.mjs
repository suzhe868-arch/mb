import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withF064A} from '../migration.mjs';
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
const old=fn=>withF064A(()=>withF063C1(()=>withF063B(()=>withF063A(()=>withF062(()=>withParentBranch(fn))))));
const with3b=fn=>withF064A(()=>withF063C1(()=>withF063B(fn)));
const with3a=fn=>withF064A(()=>withF063C1(()=>withF063B(()=>withF063A(fn))));
const cancelledParent=(id,name)=>withF064A(()=>cancelSyntheticTransactionCI(auth,managerToken,{transactionId:id,reason:'移交前普通取消历史理由',eventKey:k(name)}));
const transfer=(n,name,p={})=>handoffSyntheticTransactionCI(auth,managerToken,{transactionId:tx[n],newResponsibleId:4,reason:'合成正式移交给当前团队负责销售',eventKey:k(name),...p});
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
 const v=await currentSignedResponsibleCI(db,tx[1]);assert.equal(v.code,'F06_4B_SIGNED_RESPONSIBLE_CI');assert.equal(v.currentResponsibleId,4);assert.equal(v.originalResponsibleId,1);assert.equal(v.hasHandoff,true);
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
 const v=await postHandoffCancelGuardCI(db,tx[1],1);assert.equal(v.code,'PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP');assert.equal(v.actorIsCurrent,false);
});
test('4B-S35 父取消新Responsible在缺失父来源时同样FailClosed',async()=>{
 const v=await postHandoffCancelGuardCI(db,tx[1],4);assert.equal(v.code,'PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP');assert.equal(v.actorIsCurrent,true);
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
 assert.equal((await postHandoffCancelGuardCI(db,tx[3],4)).code,'PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP');
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
