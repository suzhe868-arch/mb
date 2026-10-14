import {test} from 'node:test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {connect,verify,checksum,gate} from '../migration.mjs';
import {requestSyntheticNewPriorityCI,productionIssuerDeny,UPSTREAM_GAP,signedFrozenParentSessionAdapterCI} from '../service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {withF065B} from '../migration.mjs';
import {expireOrdinaryCI,CI_SYSTEM_PROOF} from '../../lock-lifecycle-ci/service.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {openGuardedSyntheticTransactionCI} from '../../lock-refund-conversion-guard-ci/service.mjs';
import {openSyntheticTransactionCI as legacyOpenSyntheticTransactionCI} from '../../lock-transaction-ci/service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {requestSyntheticRefundCI} from '../../refund-pending-ci/service.mjs';
import {withF063B} from '../../refund-pending-ci/migration.mjs';
import {withF063C1} from '../../transaction-cancel-ci/migration.mjs';
import {withF063A} from '../../lock-transaction-ci/migration.mjs';
import {withF064A} from '../../transaction-handoff-ci/migration.mjs';
import {cancelSyntheticTransactionCI} from '../../transaction-cancel-ci/service.mjs';
import {verifySignedTransactionVacancyCI} from '../signed-transaction-state.mjs';
import {handoffSyntheticTransactionCI} from '../../transaction-handoff-ci/service.mjs';
import {cancelAfterHandoffSyntheticCI} from '../../post-handoff-cancel-ci/service.mjs';

import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {setQualificationCI} from '../../../f05/priority-arbitration-ttl-handover/service.mjs';
import {saveSalesDescriptionCI,calculateCI} from '../../../f05/deterministic-matching-readiness-four-tier/service.mjs';
const db=await connect(),q=(sql,args=[])=>db.query(sql,args).then(r=>r.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const peer=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const mk=x=>'f06-5c-pg16-'+x+'-'+process.env.GITHUB_RUN_ID;
let token;
const args={vehicleId:86181104,listingCycleId:86182104,customerId:86180101,teamId:901,eventKey:mk('base')};
const attempt=(v={},a=auth,t='forged')=>requestSyntheticNewPriorityCI(a,t,{...args,...v});
let realTxId,legacyTxId,positive,positiveLockId;
let parentCrossDomainProbes={}; // 真实PG同事务Savepoint负例观察，绝不修改冻结父或签发生产事实
const f06Signed=fn=>withF063A(()=>withF062(()=>withParentBranch(fn)));
async function makeSignedLock(n,label){
 const x=await f06Signed(()=>intakeCI(db,{customerId:86180101,vehicleId:86181100+n,
  listingCycleId:86182100+n,requestKey:mk('intake-'+label),
  syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(x.code,'F06_1_PENDING_CREATED',JSON.stringify(x));
 const y=await f06Signed(()=>decisionCI(auth,token,{requestId:x.requestId,requestKey:mk('approve-'+label),action:'approve'}));
 assert.equal(y.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(y));
 return y.lockId;
}
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const sale=(await q("SELECT role_id FROM public.roles WHERE role_code='sales'"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sale.role_id]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=86180101');
 const member=(await q("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[member.team_id]))[0];
 assert.ok(scope);
 const perms=[['transaction.ci.open',969101],['deposit.ci.record',969102],['refund.ci.request',969103],['transaction.ci.cancel',969104]];
 for(const [name,defaultId] of perms){
  const existing=(await q('SELECT permission_id FROM public.permissions WHERE permission_code=$1',[name]))[0];
  const permission=existing?.permission_id??defaultId;
  if(!existing)await q('INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2)',[permission,name]);
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow'",[permission]);
  const bound=(await q('SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL',[permission,scope.scope_id]))[0];
  if(!bound)await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[permission,scope.scope_id]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-5c-signed-source'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 const validLock=await makeSignedLock(4,'valid-tx');
 const deposit=await withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId:validLock,
  amountCents:6600,currency:'CNY',paymentMethod:'cash',
  receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:mk('valid-deposit')}));
 assert.equal(deposit.code,'F06_3A_SYNTHETIC_RECEIPT_RECORDED',JSON.stringify(deposit));
 const valid=await withF065B(()=>openGuardedSyntheticTransactionCI(auth,token,{lockId:validLock,eventKey:mk('valid-5b-tx')}));
 assert.equal(valid.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(valid));
 realTxId=valid.transactionId;
 const legacyLock=await makeSignedLock(8,'unsafe-legacy');
 const legacyDeposit=await withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId:legacyLock,
  amountCents:4800,currency:'CNY',paymentMethod:'cash',
  receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:mk('legacy-deposit')}));
 assert.equal(legacyDeposit.code,'F06_3A_SYNTHETIC_RECEIPT_RECORDED',JSON.stringify(legacyDeposit));
 const refund=await withF063C1(()=>requestSyntheticRefundCI(auth,token,{subjectKind:'lock',lockId:legacyLock,
  amountCents:1600,reason:'真实旧Lock待退来源与旧交易转换漏洞样本',eventKey:mk('legacy-refund')}));
 assert.equal(refund.code,'F06_3C1_PENDING_NO_PAYMENT',JSON.stringify(refund));
 const legacy=await withF063B(()=>legacyOpenSyntheticTransactionCI(auth,token,{lockId:legacyLock,eventKey:mk('legacy-unsafe-tx')}));
 assert.equal(legacy.allowed,true,JSON.stringify(legacy));legacyTxId=legacy.transactionId;
 // 真实F05-7新Vehicle事实来自已签JYT同步血缘；签名Match由原F05-7 API发行。
 // F05-8资格由原服务开启，而非直写Priority或Match结果。
 const fresh=(await q("SELECT l.vehicle_id,l.current_cycle_id,l.model_year FROM public.f05_3b_sync_lineages l "+
  "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
  "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id "+
  "LEFT JOIN public.f05_7_vehicle_facts_ci f ON f.vehicle_id=l.vehicle_id AND f.listing_cycle_id=l.current_cycle_id "+
  "WHERE v.source_type='wholesale' AND v.source_sale_status='active' AND cy.ended_at IS NULL "+
  "AND f.vehicle_id IS NULL "+
  "AND NOT EXISTS(SELECT 1 FROM public.locks k WHERE k.vehicle_id=l.vehicle_id AND k.lock_status='active') "+
  "AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=l.vehicle_id AND p.status='active') "+
  "ORDER BY l.vehicle_id LIMIT 1"))[0];
 assert.ok(fresh,'F06_5C_NEW_SIGNED_JYT_VEHICLE_FACT_SOURCE_REQUIRED');
 positive={vehicleId:Number(fresh.vehicle_id),listingCycleId:Number(fresh.current_cycle_id),customerId:899621,teamId:901};
 // 真实有Lock的Vehicle仍允许内部合法F05-7匹配，但禁止当场新建Priority。
 // 经原F06-2签名结束占用后，才允许5C在同一Vehicle事务里调用父5-8新签发。
 const requested=await f06Signed(()=>intakeCI(db,{
  customerId:86180101,vehicleId:positive.vehicleId,listingCycleId:positive.listingCycleId,
  requestKey:mk('positive-lock-pending'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'
 }));
 assert.equal(requested.code,'F06_1_PENDING_CREATED',JSON.stringify(requested));
 const accepted=await f06Signed(()=>decisionCI(auth,token,{
  requestId:requested.requestId,requestKey:mk('positive-lock-approve'),action:'approve'
 }));
 assert.equal(accepted.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(accepted));
 positiveLockId=accepted.lockId;
 // 真PG锁状态变更会吊销旧Match；故先在有效Lock下生成F05-7签名来源，
 // 然后只让PG实时时钟自然跨越expires_at，期间不触碰Lock与Match行。
 // 时间模拟仅发生在隔离合成DB，真实签发仍保留原父签名服务。
 await q("UPDATE public.locks SET created_at=clock_timestamp()-interval '100 hours',expires_at=clock_timestamp()+interval '45 seconds' WHERE lock_id=$1 AND lock_status='active'",[positiveLockId]);
 const modelYear=Number(fresh.model_year);
 await q("INSERT INTO public.f05_7_vehicle_facts_ci(vehicle_id,listing_cycle_id,facts_json) VALUES($1,$2,$3::jsonb)",
 [positive.vehicleId,positive.listingCycleId,JSON.stringify({
  model_year:{value:modelYear,source:'CI_JYT_SIGNED_SOURCE_STRUCTURED_NOT_PRODUCTION'},
  mileage_km:{value:42000,source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
  exterior_color:{value:'black',source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
  interior_color:{value:'beige',source:'CI_SYNTHETIC_INSPECTION_NOT_PRODUCTION'},
  budget_cents:{value:10000000,source:'CI_SYNTHETIC_DISPLAY_ONLY_NOT_PRODUCTION'}
 })]);
 const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[positive.customerId]))[0];
 assert.ok(demand);
 const qualify=await setQualificationCI(signedFrozenParentSessionAdapterCI(auth,22),token,{teamId:901,customerId:positive.customerId,enabled:true,eventKey:mk('signed-qualification')});
 assert.equal(qualify.allowed,true,JSON.stringify(qualify));
 const d=await saveSalesDescriptionCI(signedFrozenParentSessionAdapterCI(auth,21),token,{demandId:Number(demand.demand_id),teamId:901,
  description:'奥迪A6 2026款 5万公里以内 黑色外观 米色内饰 预算10万'});
 assert.equal(d.allowed,true,JSON.stringify(d));
 const matching=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),token,{demandId:Number(demand.demand_id),vehicleId:positive.vehicleId,
  listingCycleId:positive.listingCycleId,teamId:901,runKey:mk('signed-match')});
 assert.equal(matching.allowed,true,JSON.stringify(matching));
 assert.ok(['high','acceptable'].includes(matching.tier),'F06_5C_SIGNED_F05_7_HIGH_OR_ACCEPTABLE_REQUIRED');
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[positive.vehicleId]))[0].n,0,
  '原F05-8在真Lock占用时不得自动发行Priority');
 // 原F05-7锁源签名在PG时钟自然到期前保持current；不得先调用F06-2
 // 状态UPDATE使其失效，再企图用stale Match获得Priority。
 assert.equal((await q('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1',[positiveLockId]))[0].n,0);
 assert.equal((await q('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[positiveLockId]))[0].n,0);
 await q("INSERT INTO f06_2_ci.finance_proofs(lock_id,proof_kind) VALUES($1,'synthetic_absence_confirmed')",[positiveLockId]);
 const remaining=(await q("SELECT GREATEST(EXTRACT(EPOCH FROM expires_at-clock_timestamp()),0)::float8 wait_seconds FROM public.locks WHERE lock_id=$1",[positiveLockId]))[0];
 assert.ok(remaining.wait_seconds>=0&&remaining.wait_seconds<=46,'F06_5C_PG_LOCK_DEADLINE_OUT_OF_BOUNDS');
 // 实际PG16 server clock真实流逝，不SET会话clock，不修改旧Match或冻结触发器。
 await db.query('SELECT pg_sleep($1::float8)',[remaining.wait_seconds+0.4]);
 const natural=(await q("SELECT lock_status,expires_at<=clock_timestamp() pg_clock_expired FROM public.locks WHERE lock_id=$1",[positiveLockId]))[0];
 assert.equal(natural.lock_status,'active');
 assert.equal(natural.pg_clock_expired,true,'F06_5C_NATIVE_PG_CLOCK_MUST_HAVE_EXPIRED');
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[positive.vehicleId]))[0].n,0,
  '没有任何状态UPDATE或父签名仲裁前不得凭超时自动创建Priority');
});
test.after(async()=>{await auth.close();await peer.close();await db.end()});
test('5C-S01 新旧Sidecar父签认证',async()=>assert.equal((await verify(db)).verified,true));
test('5C-S02 sha256封印',()=>assert.match(checksum,/^[0-9a-f]{64}$/));
test('5C-S03 真Push环境门禁',()=>assert.doesNotThrow(gate));
test('5C-S04 PG16非特权账户',async()=>assert.equal((await q('SELECT current_user u'))[0].u,'f03_ci'));
test('5C-S05 PG16版本',async()=>{const x=(await q("SELECT current_setting('server_version_num')::int v"))[0];assert.ok(x.v>=160000&&x.v<170000)});
test('5C-S06 非superuser',async()=>assert.equal((await q("SELECT rolsuper r FROM pg_roles WHERE rolname=current_user"))[0].r,false));
test('5C-S07 非createdb',async()=>assert.equal((await q("SELECT rolcreatedb r FROM pg_roles WHERE rolname=current_user"))[0].r,false));
test('5C-S08 签名目录完整',async()=>{const x=await verify(db);assert.match(x.catalogSHA,/^[0-9a-f]{64}$/);assert.ok(x.parentSHA)});
test('5C-S09 24原迁移',async()=>assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24));
test('5C-S10 5B安全来源存在',async()=>assert.equal((await q("SELECT to_regclass('f06_5b_ci.guard_events')::text n"))[0].n,'f06_5b_ci.guard_events'));
test('5C-S11 3B交易来源存在',async()=>assert.equal((await q("SELECT to_regclass('f06_3b_ci.transaction_origins')::text n"))[0].n,'f06_3b_ci.transaction_origins'));
test('5C-S12 独立签名唯一',async()=>assert.equal((await q('SELECT count(*)::int n FROM f06_5c_ci.attestation'))[0].n,1));
test('5C-S13 生产签发不存在',()=>assert.equal(productionIssuerDeny().allowed,false));
test('5C-S14 父Priority只读可见',async()=>assert.ok((await q("SELECT to_regclass('public.f05_8_priority_ci')::text n"))[0].n));
test('5C-S15 签名不可UPDATE',async()=>await assert.rejects(q("UPDATE f06_5c_ci.attestation SET production_priority_issuer='UNWIRED'"),/F06_5C_APPEND_ONLY_HISTORY/));
test('5C-S16 签名不可DELETE',async()=>await assert.rejects(q('DELETE FROM f06_5c_ci.attestation'),/F06_5C_APPEND_ONLY_HISTORY/));
const invalid=[
 ['vehicle零',{vehicleId:0}],['vehicle负数',{vehicleId:-1}],['vehicle非整数',{vehicleId:1.1}],
 ['listing_cycle零',{listingCycleId:0}],['customer零',{customerId:0}],['team零',{teamId:0}],
 ['Key过短',{eventKey:'a'}],['Key SQL注入',{eventKey:"' OR 1=1; --"}],['Key超长',{eventKey:'a'.repeat(161)}]
];
invalid.forEach(([name,p],i)=>test('5C-S'+String(i+17).padStart(2,'0')+' '+name+'拒绝',async()=>assert.equal((await attempt(p)).code,'F06_5C_INVALID_ARGUMENTS')));
test('5C-S26 缺少会话对象',async()=>assert.equal((await attempt({},null)).code,'F06_5C_SIGNED_SESSION_REQUIRED'));
test('5C-S27 假Token拒绝',async()=>assert.equal((await attempt()).allowed,false));
test('5C-S28 第二PG后端假Token拒绝',async()=>assert.equal((await attempt({},peer)).allowed,false));
test('5C-S29 两个不同PG真实进程',async()=>{
 const a=(await db.query('SELECT pg_backend_pid() pid')).rows[0].pid;
 const b=(await peer.pool.query('SELECT pg_backend_pid() pid')).rows[0].pid;assert.notEqual(a,b);
});
test('5C-S30 真实退款表保留',async()=>assert.ok((await q("SELECT to_regclass('public.refund_payments')::text n"))[0].n));
test('5C-S31 生产Issuer状态UNWIRED',async()=>assert.equal((await q('SELECT production_priority_issuer FROM f06_5c_ci.attestation'))[0].production_priority_issuer,'UNWIRED'));
test('5C-S32 两独立PG后端全部拒绝无权限新建',async()=>{const r=await Promise.all([attempt({eventKey:mk('race-a')}),attempt({eventKey:mk('race-b')},peer)]);assert.equal(r.filter(x=>x.allowed).length,0)});
test('5C-S33 拒绝不新增Priority',async()=>{const n=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;await attempt({eventKey:mk('no-write')});assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,n)});
test('5C-S34 拒绝不新增Transaction',async()=>{const n=(await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins'))[0].n;await attempt({eventKey:mk('no-tx')});assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins'))[0].n,n)});
test('5C-S35 拒绝不新增Guard事实',async()=>{const n=(await q('SELECT count(*)::int n FROM f06_5b_ci.guard_events'))[0].n;await attempt({eventKey:mk('no-guard')});assert.equal((await q('SELECT count(*)::int n FROM f06_5b_ci.guard_events'))[0].n,n)});
test('5C-S36 上游不可原子签发明确FailClosed',async()=>{assert.equal(UPSTREAM_GAP,'UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP');assert.equal((await attempt({eventKey:mk('gap')})).allowed,false)});

test('5C-S37 真F03员工Session令牌签发（非伪造）',()=>assert.match(token,/^[A-Za-z0-9_-]{43}$/));
test('5C-S38 5B父安全转换留下真实in_progress交易',async()=>{
 const x=(await q("SELECT t.transaction_id FROM public.transactions t JOIN f06_5b_ci.guard_events g ON g.transaction_id=t.transaction_id WHERE t.vehicle_id=$1 AND t.status='in_progress'",[args.vehicleId]));
 assert.ok(x.length>=1,'原5B测试必须真实提交交易及其签名');
});
test('5C-S39 真Session在已成交占用车不得创建新Priority',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;
 const out=await attempt({eventKey:mk('real-transaction-deny')},auth,token);
 assert.equal(out.allowed,false,JSON.stringify(out));
 assert.equal(out.code,'F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS',JSON.stringify(out));
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
});
test('5C-S40 父5B真实交易与旧3B Source绑定',async()=>{
 const rows=await q("SELECT t.transaction_id, t.source_lock_id,o.source_lock_id old_lock,g.source_lock_id guarded_lock FROM public.transactions t JOIN f06_3b_ci.transaction_origins o USING(transaction_id) JOIN f06_5b_ci.guard_events g USING(transaction_id) WHERE t.vehicle_id=$1 AND t.status='in_progress'",[args.vehicleId]);
 assert.ok(rows.length>0);for(const x of rows)assert.equal(Number(x.old_lock),Number(x.guarded_lock));
});
test('5C-S41 真员工Session不允许过期listing cycle重放',async()=>{
 const x=await attempt({listingCycleId:999999991,eventKey:mk('real-stale-cycle')},auth,token);
 assert.equal(x.allowed,false,JSON.stringify(x));
});
test('5C-S42 同一签名员工跨独立Backend重复争用不得产生两个Priority',async()=>{
 const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;
 const results=await Promise.all([attempt({eventKey:mk('real-race-1')},auth,token),attempt({eventKey:mk('real-race-2')},peer,token)]);
 assert.ok(results.every(x=>x.code==='F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS'),JSON.stringify(results));
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
});
test('5C-S43 真实会话源受到员工当前状态撤销约束',async()=>{
 const original=(await q("SELECT employment_status FROM public.employees WHERE employee_id=1"))[0].employment_status;
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 try{const r=await attempt({eventKey:mk('employment-revoked')},auth,token);assert.equal(r.allowed,false,JSON.stringify(r))}
 finally{await q('UPDATE public.employees SET employment_status=$1 WHERE employee_id=1',[original])}
});
test('5C-S44 真实客户失活后不可签Priority',async()=>{
 const original=(await q('SELECT account_status FROM public.customers WHERE customer_id=$1',[args.customerId]))[0].account_status;
 await q("UPDATE public.customers SET account_status='inactive' WHERE customer_id=$1",[args.customerId]);
 try{const r=await attempt({eventKey:mk('customer-inactive')},auth,token);assert.equal(r.allowed,false,JSON.stringify(r))}
 finally{await q('UPDATE public.customers SET account_status=$2 WHERE customer_id=$1',[args.customerId,original])}
});
test('5C-S45 真PG16已签交易阻断后保留原Lock历史',async()=>{
 const x=await q('SELECT lock_status,end_reason FROM public.locks WHERE vehicle_id=$1 ORDER BY lock_id DESC LIMIT 1',[args.vehicleId]);
 assert.ok(x.length);assert.equal(x[0].lock_status,'released');assert.equal(x[0].end_reason,'converted_to_transaction');
});
test('5C-S46 对同Vehicle真实行锁争用，失败无半写',async()=>{
 const lock=await connect();
 try{
  await lock.query('BEGIN');
  await lock.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[args.vehicleId]);
  const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n;
  const x=await attempt({eventKey:mk('lock-timeout')},peer,token);
  assert.equal(x.allowed,false,JSON.stringify(x));
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci'))[0].n,before);
 }finally{await lock.query('ROLLBACK');await lock.end()}
});
test('5C-S47 真实旧3B不安全Transaction不能伪装为5B安全发行',async()=>{
 const x=await q("SELECT t.transaction_id FROM public.transactions t JOIN f06_3b_ci.transaction_origins o USING(transaction_id) LEFT JOIN f06_5b_ci.guard_events g USING(transaction_id) WHERE t.vehicle_id=86181108 AND g.transaction_id IS NULL");
 assert.ok(x.length>0,'旧3B漏洞S53-54必须保留');
 const r=await attempt({vehicleId:86181108,listingCycleId:86182108,eventKey:mk('legacy-unsafe')},auth,token);
 assert.equal(r.allowed,false,JSON.stringify(r));
});
test('5C-S48 并发失败未产生实际付款记录',async()=>assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0));

test('5C-S49 真F06-5B安全来源交易在本独立PG中发行',async()=>{
 const x=(await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[realTxId]))[0];
 assert.equal(x.status,'in_progress');
});
test('5C-S50 旧3B不安全资金冲突来源与真实签名仍未漂白',async()=>{
 assert.ok(legacyTxId);
 const x=(await q('SELECT transaction_id FROM f06_5b_ci.guard_events WHERE transaction_id=$1',[legacyTxId]));
 assert.equal(x.length,0);
 const pending=(await q("SELECT count(*)::int n FROM public.refund_cases WHERE lock_id=(SELECT source_lock_id FROM public.transactions WHERE transaction_id=$1) AND status='pending'",[legacyTxId]))[0];
 assert.equal(pending.n,1);
});
test('5C-S51 合法原F05-7签名当前Match和原F05-8资格可回读',async()=>{
 const x=await q("SELECT r.result_id FROM public.f05_7_result_versions_ci r JOIN public.demands d USING(demand_id) "+
  "JOIN public.f05_8_qualification_ci q ON q.customer_id=d.customer_id AND q.enabled=true "+
  "WHERE d.customer_id=$1 AND r.vehicle_id=$2 AND r.listing_cycle_id=$3 "+
  "AND r.status='current' AND r.tier IN('high','acceptable')",[positive.customerId,positive.vehicleId,positive.listingCycleId]);
 assert.ok(x.length>=1);
});

test('5C-S51A 真实个人权限deny不能对未占用车辆签发Priority',async()=>{
 const permission=(await q("SELECT permission_id FROM public.permissions WHERE permission_code='matching.rule.manage.ci.synthetic'"))[0];assert.ok(permission);
 const saved=(await q('SELECT decision FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=$1',[permission.permission_id]))[0];assert.ok(saved);
 await q("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=$1",[permission.permission_id]);
 try{
  const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1',[positive.vehicleId]))[0].n;
  const response=await requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('real-deny-eligible')});
  assert.equal(response.allowed,false,JSON.stringify(response));
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1',[positive.vehicleId]))[0].n,before);
 }finally{await q('UPDATE public.employee_permission_overrides SET decision=$2,changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=$1',[permission.permission_id,saved.decision])}
});
test('5C-S51B 真实Scope binding撤销后优先推荐准入拒绝且恢复无半写',async()=>{
 const permission=(await q("SELECT permission_id FROM public.permissions WHERE permission_code='matching.rule.manage.ci.synthetic'"))[0];assert.ok(permission);
 const active=await q("SELECT scope_id,ended_at FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND ended_at IS NULL",[permission.permission_id]);
 assert.ok(active.length>0);
 const changed=await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=$1 AND ended_at IS NULL RETURNING ctid::text AS row_pointer",[permission.permission_id]);
 assert.equal(changed.length,active.length);
 try{
  const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1',[positive.vehicleId]))[0].n;
  const response=await requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('real-scope-revoked')});
  assert.equal(response.allowed,false,JSON.stringify(response));
  assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1',[positive.vehicleId]))[0].n,before);
 }finally{
  for(const row of changed)await q('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE ctid::text=$1',[row.row_pointer]);
 }
});
test('5C-S52 真实原Priority仲裁在同一Session及Vehicle锁下正向发行',async()=>{
 const created=await requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('positive-parent-arbitrate')});
 assert.equal(created.code,'F06_5C_PARENT_SIGNED_PRIORITY_CREATED',JSON.stringify(created));
 assert.ok(created.pgBackendPid>0);assert.match(created.pgTransactionId,/^[0-9]+$/);
 positive.priorityId=created.priorityId;
});
test('5C-S53 正向Priority只能有父签名Created事件与唯一存活者',async()=>{
 const x=await q("SELECT p.priority_id,e.event_key FROM public.f05_8_priority_ci p "+
 "JOIN public.f05_8_events_ci e ON e.priority_id=p.priority_id AND e.event_kind='created' "+
 "WHERE p.vehicle_id=$1 AND p.listing_cycle_id=$2 AND p.status='active'",[positive.vehicleId,positive.listingCycleId]);
 assert.equal(x.length,1);assert.equal(Number(x[0].priority_id),positive.priorityId);
});
test('5C-S54 已签活动Priority不允许改Key二次新建',async()=>{
 const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n;
 const r=await requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('positive-duplicate')});
 assert.equal(r.allowed,false,JSON.stringify(r));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n,before);
});
test('5C-S55 当前无交易也不得把别的Customer强指定原Priority胜者',async()=>{
 const oldCount=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n;
 const r=await requestSyntheticNewPriorityCI(auth,token,{...positive,customerId:899622,eventKey:mk('wrong-customer')});
 assert.equal(r.allowed,false,JSON.stringify(r));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n,oldCount);
});
test('5C-S56 真PG已过期Lock最后由原F06-2系统签发终结，原Priority无复活及真实付款',async()=>{
 const originalCount=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n;
 const expired=await withF062(()=>expireOrdinaryCI(db,{lockId:positiveLockId,ciSystemProof:CI_SYSTEM_PROOF}));
 assert.equal(expired.code,'F06_2_PG_CLOCK_EXPIRED',JSON.stringify(expired));
 const ended=(await q('SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1',[positiveLockId]))[0];
 assert.equal(ended.lock_status,'expired');
 assert.equal(ended.end_reason,'f06_2_ci_pg_clock_expiry');
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n,originalCount,'f06_2 expiry must not create or resurrect Priority history');
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
});

test('5C-S57 真4A不可变取消签名释放5B占用且保留3B原始in_progress',async()=>{
 const before=(await q('SELECT status FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[realTxId]))[0];
 assert.equal(before.status,'in_progress');
 const cancel=await withF064A(()=>cancelSyntheticTransactionCI(auth,token,{
  transactionId:realTxId,eventKey:mk('legitimate-4a-cancel'),reason:'合法取消后的原子资格重新仲裁证明'
 }));
 assert.equal(cancel.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(cancel));
 const tx=(await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[realTxId]))[0];
 assert.equal(tx.status,'cancelled');
 assert.equal((await q('SELECT status FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[realTxId]))[0].status,'in_progress');
 // 名邦available没有F05-7批发current Match；不得用排除错误码伪装为正向签发。
 const result=await attempt({eventKey:mk('postcancel-recheck')},auth,token);
 assert.equal(result.allowed,false,JSON.stringify(result));
 assert.equal(result.code,'F06_5C_CURRENT_MATCH_AND_QUALIFICATION_REQUIRED',JSON.stringify(result));
});
test('5C-S58 无5B Guard的旧3B即使假取消也不得释放',async()=>{
 const before=(await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[legacyTxId]))[0];
 assert.equal(before.status,'in_progress');
 await q("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1",[legacyTxId]);
 try{
  const r=await attempt({vehicleId:86181108,listingCycleId:86182108,eventKey:mk('unsigned-public-cancel')},auth,token);
  assert.equal(r.allowed,false,JSON.stringify(r));
  assert.ok(!['F06_5C_PARENT_SIGNED_PRIORITY_CREATED','F06_5C_PRECHECK_VALIDATED'].includes(r.code));
 }finally{await q('UPDATE public.transactions SET status=$2 WHERE transaction_id=$1',[legacyTxId,before.status])}
});
test('5C-S59 取消后旧3B源与4A当前真实终态均保持独立不可变',async()=>{
 const x=await q('SELECT t.status public_status,o.status origin_status,a.resulting_status signed_cancel '+
  'FROM public.transactions t JOIN f06_3b_ci.transaction_origins o USING(transaction_id) '+
  'JOIN f06_4a_ci.cancel_origins a USING(transaction_id) WHERE t.transaction_id=$1',[realTxId]);
 assert.equal(x.length,1);assert.deepEqual([x[0].public_status,x[0].origin_status,x[0].signed_cancel],
 ['cancelled','in_progress','cancelled']);
});

test('5C-S60 取消后两真实父签名能通过单Vehicle锁的只读终态核验',async()=>{
 const proof=await auth.withSession(token,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[args.vehicleId]);
  return verifySignedTransactionVacancyCI(c,args.vehicleId);
 },{normalOnly:true});
 assert.equal(proof.allowed,true,JSON.stringify(proof));
 assert.equal(proof.code,'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL');
});
test('5C-S61 真5B交易仅伪造public取消无4A/4C签名严格拒绝并回滚',async()=>{
 const lockId=await makeSignedLock(6,'unsigned-healthy');
 const tx=await withF065B(()=>openGuardedSyntheticTransactionCI(auth,token,{lockId,eventKey:mk('unsigned-healthy-open')}));
 assert.equal(tx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(tx));
 const result=await auth.withSession(token,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=86181106 FOR UPDATE');
  await c.query('SAVEPOINT unsigned_public_status_probe');
  try{
   await c.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1",[tx.transactionId]);
   return await verifySignedTransactionVacancyCI(c,86181106);
  }finally{await c.query('ROLLBACK TO SAVEPOINT unsigned_public_status_probe')}
 },{normalOnly:true});
 assert.equal(result.code,'F06_5C_TERMINAL_CANCEL_SIGNATURE_MISSING_OR_CONFLICT',JSON.stringify(result));
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[tx.transactionId]))[0].status,'in_progress');
});
test('5C-S62 真实未签财务申请不可洗白已签4A合法取消',async()=>{
 const result=await auth.withSession(token,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[args.vehicleId]);
  await c.query('SAVEPOINT refund_not_authorized_probe');
  try{
   await c.query("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,NULL,$2,'pending',100)",[args.customerId,realTxId]);
   return await verifySignedTransactionVacancyCI(c,args.vehicleId);
  }finally{await c.query('ROLLBACK TO SAVEPOINT refund_not_authorized_probe')}
 },{normalOnly:true});
 assert.equal(result.code,'F06_5C_PENDING_OR_UNKNOWN_FINANCE_DENIED',JSON.stringify(result));
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_cases WHERE transaction_id=$1',[realTxId]))[0].n,0);
});
test('5C-S63 合法4A取消不把名邦available伪装为F05-7批发active匹配',async()=>{
 // 旧F06-1合成车辆是真名邦available；冻结F05-7仅接受active。
 // 合法取消可以释放已签占用，但不豁免正式Match的车型/在售资格来源。
 const v=(await q("SELECT source_type,source_sale_status FROM public.vehicles WHERE vehicle_id=$1",[args.vehicleId]))[0];
 assert.deepEqual([v.source_type,v.source_sale_status],['mingbang','available']);
 const tx=(await q("SELECT status FROM public.transactions WHERE transaction_id=$1",[realTxId]))[0];
 assert.equal(tx.status,'cancelled');
 const verified=await auth.withSession(token,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[args.vehicleId]);
  return verifySignedTransactionVacancyCI(c,args.vehicleId);
 },{normalOnly:true});
 assert.equal(verified.code,'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL',JSON.stringify(verified));
 const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[positive.customerId]))[0];
 assert.ok(demand);
 const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[args.vehicleId]))[0].n;
 const result=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),token,{
  demandId:Number(demand.demand_id),vehicleId:args.vehicleId,listingCycleId:args.listingCycleId,
  teamId:args.teamId,runKey:mk('cancelled-but-mingbang-not-f05-7-wholesale')
 });
 assert.equal(result.code,'F05_7_VEHICLE_NOT_SALEABLE_ACTIVE_CYCLE',JSON.stringify(result));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[args.vehicleId]))[0].n,before);
});
test('5C-S64 过期Lock关闭后，重新以真实Match和父Priority签发，再由F06-1原子变成Lock',async()=>{
 // S56 的原Lock到期处理可经冻结F05-7/F05-8级联终结旧Priority；
 // 不能使用原已终结priorityId冒充active。必须从原签名API重新仲裁。
 const originalPriority=positive.priorityId;
 const old=(await q("SELECT status,ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1",[originalPriority]))[0];
 assert.ok(old);
 let active=(await q("SELECT priority_id,customer_id,expires_at FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>clock_timestamp() ORDER BY priority_id DESC LIMIT 1",[positive.vehicleId,positive.listingCycleId]))[0];
 if(!active){
  const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[positive.customerId]))[0];
  assert.ok(demand);
  // 如果已由F05-7源变化触发器完成合法签发，优先采用其真实父签发ID；
  // 否则仅通过5C原父arbitrateCI签发，绝不直接INSERT Priority。
  const fresh=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),token,{
   demandId:Number(demand.demand_id),vehicleId:positive.vehicleId,
   listingCycleId:positive.listingCycleId,teamId:positive.teamId,runKey:mk('renew-after-expired-lock')
  });
  assert.equal(fresh.allowed,true,JSON.stringify(fresh));
  active=(await q("SELECT priority_id,customer_id,expires_at FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND expires_at>clock_timestamp() ORDER BY priority_id DESC LIMIT 1",[positive.vehicleId,positive.listingCycleId]))[0];
  if(!active){
   const issued=await requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('renew-priority-after-lock-expiry')});
   assert.equal(issued.code,'F06_5C_PARENT_SIGNED_PRIORITY_CREATED',JSON.stringify(issued));
   active=(await q("SELECT priority_id,customer_id,expires_at FROM public.f05_8_priority_ci WHERE priority_id=$1 AND status='active'",[issued.priorityId]))[0];
  }
 }
 assert.ok(active,'F06_5C_ORIGINAL_SIGNED_ACTIVE_PRIORITY_REQUIRED');
 assert.equal(Number(active.customer_id),positive.customerId);
 positive.priorityId=Number(active.priority_id);
 const phoneFact=(await q("SELECT phone_fact_id FROM public.customer_phone_facts WHERE customer_id=$1 AND ended_at IS NULL",[positive.customerId]))[0];
 if(!phoneFact)await q("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES($1,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 day')",[positive.customerId]);
 const request=await f06Signed(()=>intakeCI(db,{
  customerId:positive.customerId,vehicleId:positive.vehicleId,listingCycleId:positive.listingCycleId,
  requestKey:mk('real-priority-to-lock-intake'),
  syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'
 }));
 assert.equal(request.code,'F06_1_PENDING_CREATED',JSON.stringify(request));
 const approved=await f06Signed(()=>decisionCI(auth,token,{
  requestId:request.requestId,requestKey:mk('real-priority-to-lock-approve'),action:'approve'
 }));
 assert.equal(approved.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(approved));
 assert.equal(approved.priorityOrigin,true,JSON.stringify({approved,active,old}));
 assert.equal(approved.priorityOriginId,positive.priorityId);
 const ended=(await q('SELECT status,ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1',[positive.priorityId]))[0];
 assert.deepEqual([ended.status,ended.ended_reason],['ended','converted_to_lock']);
 const history=await q("SELECT event_key FROM public.f05_8_events_ci WHERE priority_id=$1 AND event_kind='ended' AND event_key=$2",[
  positive.priorityId,'f06-1-priority-to-lock:'+positive.priorityId+':'+approved.lockId
 ]);
 assert.equal(history.length,1);
 const lock=(await q('SELECT priority_origin_id,priority_origin_customer_id FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1',[approved.lockId]))[0];
 assert.equal(Number(lock.priority_origin_id),positive.priorityId);
 assert.equal(Number(lock.priority_origin_customer_id),positive.customerId);
 positive.newSignedLockId=approved.lockId;
 console.log('F06_5C_REAL_F05_8_TO_F06_1_LOCK',{
  originalPriority,convertedPriority:positive.priorityId,lockId:approved.lockId,
  source:'SIGNED_F05_7_F05_8_AND_F06_1_PARENT_SERVICES'});
});
test('5C-S65 批发车原Priority到Lock到5B交易，4A取消后双Backend仅一新签发，旧Priority不复活',async()=>{
 assert.ok(positive.newSignedLockId);
 // 真正两个独立PG16进程：旧5B在隔离子进程使用自身合法GITHUB_REF，
 // 当前5C在本进程使用原F03签名会话；两个父门禁环境永不互相覆盖。
 const worker=spawn(process.execPath,[
  'f06/transaction-priority-admission-ci/tests/transaction-race-worker.mjs',
  String(positive.newSignedLockId),mk('valid-priority-lock-to-5b')
 ],{
  cwd:process.cwd(),
  env:{...process.env,
   GITHUB_REF:'refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci',
   GITHUB_REF_NAME:'feat/f06-5b-lock-refund-conversion-guard-ci',
   F06_5C_SYNTHETIC_TEST_TOKEN:token},
  stdio:['pipe','pipe','pipe']
 });
 let workerOut='',workerErr='',readySeen=false,resolveReady,rejectReady;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject});
 const closed=new Promise((resolve,reject)=>{
  worker.once('error',reject);
  worker.once('close',code=>resolve(code));
 });
 worker.stdout.on('data',b=>{
  workerOut+=b.toString();
  if(!readySeen&&workerOut.includes('F06_5C_CHILD_READY')){readySeen=true;resolveReady();}
 });
 worker.stderr.on('data',b=>{workerErr+=b.toString()});
 closed.then(code=>{if(!readySeen)rejectReady(Error('F06_5C_CHILD_NOT_READY_EXIT_'+code+' '+workerErr))}).catch(rejectReady);
 await ready;
 // 第三物理Backend短暂持有Vehicle行锁，确保两条互斥请求实际并发到达，
 // 在5C 1500ms lock_timeout前释放；不使用Sleep来替代PG的真实锁及事务。
 const blocker=await connect();
 let held,converted;
 try{
  await blocker.query('BEGIN');
  await blocker.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[positive.vehicleId]);
  const competing=requestSyntheticNewPriorityCI(peer,token,{...positive,eventKey:mk('new-priority-while-signed-5b-active')});
  worker.stdin.end('START\n');
  await db.query('SELECT pg_sleep(0.2)');
  await blocker.query('COMMIT');
  const [candidate,exit]=await Promise.all([competing,closed]);
  assert.equal(exit,0,'F06_5C_CHILD_PROCESS_OR_PARENT_SIGNED_TRANSACTION_FAILED '+workerErr+' '+workerOut);
  const proof=workerOut.split('\n').find(z=>z.startsWith('F06_5C_CHILD_RESULT '));
  assert.ok(proof,'F06_5C_CHILD_SIGNED_ORIGIN_REQUIRED '+workerErr+' '+workerOut);
  converted=JSON.parse(proof.slice('F06_5C_CHILD_RESULT '.length));
  held=candidate;
 }finally{
  await blocker.query('ROLLBACK').catch(()=>{});
  await blocker.end();
  if(worker.exitCode===null)worker.kill();
 }
 assert.equal(converted.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(converted));
 assert.ok(Number.isInteger(converted.pgBackendPid)&&converted.pgBackendPid>0&&/^[0-9]+$/.test(converted.pgTransactionId),JSON.stringify(converted));
 assert.equal(held.allowed,false,JSON.stringify(held));
 assert.ok(['F06_5C_ACTIVE_LOCK_PREVENTS_NEW_PRIORITY','F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS'].includes(held.code),
  '真实竞争必须保留实际失败原因，不得把ACTIVE_LOCK报告为Transaction守卫: '+JSON.stringify(held));
 assert.ok(Number.isInteger(held.pgBackendPid)&&held.pgBackendPid>0&&/^[0-9]+$/.test(held.pgTransactionId),JSON.stringify(held));
 assert.notEqual(converted.pgBackendPid,held.pgBackendPid,'F06_5C_REAL_TRANSACTION_PRIORITY_DIFFERENT_PG_BACKENDS_REQUIRED');
 console.log('F06_5C_REAL_TWO_BACKEND_LOCK_TO_TRANSACTION_VS_PRIORITY_RACE',{
  winner:converted.code,loser:held.code,transactionBackendPid:converted.pgBackendPid,
  transactionTxid:converted.pgTransactionId,priorityBackendPid:held.pgBackendPid,
  priorityTxid:held.pgTransactionId});
 const txid=converted.transactionId;
 const guarded=(await q("SELECT g.transaction_id,g.source_lock_id,t.status FROM f06_5b_ci.guard_events g JOIN public.transactions t USING(transaction_id) WHERE g.transaction_id=$1",[txid]))[0];
 assert.equal(Number(guarded.source_lock_id),positive.newSignedLockId);assert.equal(guarded.status,'in_progress');
 // 5B真实COMMIT后另起一轮5C，单独核验签名Transaction排他而非ACTIVE_LOCK。
 const postCommit=await requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('post-commit-5b-signed-deny')});
 assert.equal(postCommit.code,'F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS',JSON.stringify(postCommit));
 assert.notEqual(postCommit.pgBackendPid,converted.pgBackendPid);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[positive.vehicleId]))[0].n,0);
 console.log('F06_5C_POST_5B_COMMIT_SIGNED_TRANSACTION_DENY',{transactionId:txid,
  transactionBackendPid:converted.pgBackendPid,priorityBackendPid:postCommit.pgBackendPid,
  transactionTxid:converted.pgTransactionId,priorityTxid:postCommit.pgTransactionId,
  actualDenyCode:postCommit.code});
 assert.equal((await q('SELECT status FROM public.f05_8_priority_ci WHERE priority_id=$1',[positive.priorityId]))[0].status,'ended');
 // 在交易仍占用车时由原F05-7签新的当前Match；旧原生优先仲裁不得借此偷发。
 // 冻结5B转换曾让Lock事件使Match变stale，必须完成合法复算，不能手工改Match status。
 const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[positive.customerId]))[0];
 assert.ok(demand);
 const match=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),token,{
  demandId:Number(demand.demand_id),vehicleId:positive.vehicleId,listingCycleId:positive.listingCycleId,
  teamId:positive.teamId,runKey:mk('wholesale-signed-match-while-5b-occupied')
 });
 assert.equal(match.allowed,true,JSON.stringify(match));
 assert.ok(['high','acceptable'].includes(match.tier));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[positive.vehicleId,positive.listingCycleId]))[0].n,0);
 // C02/C03：真批发current Match + 原5B在途交易；观察比5C更早的冻结父触发器。
 // 所有探测只存在F03真实隔离PG物理事务的SAVEPOINT内，最终必ROLLBACK；不能称为真实4A签发。
 const unsignedParentProbe=async(withUnknownRefund)=>auth.withSession(token,async c=>{
  const physical=(await c.query('SELECT pg_backend_pid()::int pid,txid_current()::text txid')).rows[0];
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[positive.vehicleId]);
  const baseline=(await c.query("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",
   [positive.vehicleId,positive.listingCycleId])).rows[0].n;
  assert.equal(baseline,0,'PROBE_REQUIRES_UNOCCUPIED_SIGNED_PRIORITY');
  await c.query('SAVEPOINT f06_5c_unsigned_parent_probe');
  let result={...physical,withUnknownRefund,baseline,pgBlocked:null,created:[]};
  try{
   if(withUnknownRefund){
    // 只构造synthetic未知财务申请；不写refund_payments，不确认退款，不调用生产Issuer。
    await c.query("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,NULL,$2,'pending',100)",
     [positive.customerId,txid]);
   }
   // 没有4A/4C cancel_origins/cancel_events，唯独public投影伪造取消。
   await c.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1",[txid]);
   result.created=(await c.query("SELECT p.priority_id,p.customer_id,p.creation_key,e.event_key "+
    "FROM public.f05_8_priority_ci p JOIN public.f05_8_events_ci e ON e.priority_id=p.priority_id AND e.event_kind='created' "+
    "WHERE p.vehicle_id=$1 AND p.listing_cycle_id=$2 AND p.status='active'",
    [positive.vehicleId,positive.listingCycleId])).rows;
  }catch(e){
   result.pgBlocked={sqlstate:e.code||null,message:String(e.message).slice(0,240)};
  }finally{
   await c.query('ROLLBACK TO SAVEPOINT f06_5c_unsigned_parent_probe');
  }
  return result;
 },{normalOnly:true});
 parentCrossDomainProbes.c02=await unsignedParentProbe(false);
 parentCrossDomainProbes.c03=await unsignedParentProbe(true);
 for(const [label,result] of Object.entries(parentCrossDomainProbes))
  console.log('F06_5C_PARENT_CROSS_DOMAIN_PROBE_'+label.toUpperCase(),JSON.stringify(result));
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[txid]))[0].status,'in_progress');
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[positive.vehicleId]))[0].n,0);
 const cancel=await withF064A(()=>cancelSyntheticTransactionCI(auth,token,{
  transactionId:txid,eventKey:mk('real-wholesale-transaction-cancel'),reason:'批发真实签名交易取消后新优先推荐竞争验证'
 }));
 assert.equal(cancel.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(cancel));
 const terminal=(await q("SELECT t.status current_status,o.status origin_status FROM public.transactions t JOIN f06_3b_ci.transaction_origins o USING(transaction_id) WHERE t.transaction_id=$1",[txid]))[0];
 assert.deepEqual([terminal.current_status,terminal.origin_status],['cancelled','in_progress']);
 // 冻结F05-8的transaction状态触发器在4A真正COMMIT时可能直接依据已签
 // current Match创建唯一新Priority。此时5C必须拒绝双Backend重入，而不能谎称由5C再签第二次。
 const auto=await q("SELECT p.priority_id,p.customer_id,p.creation_key,e.event_key FROM public.f05_8_priority_ci p "+
  "JOIN public.f05_8_events_ci e ON e.priority_id=p.priority_id AND e.event_kind='created' "+
  "WHERE p.vehicle_id=$1 AND p.listing_cycle_id=$2 AND p.status='active'",[positive.vehicleId,positive.listingCycleId]);
 assert.equal(auto.length,1,'F06_5C_SIGNED_F05_8_POSTCANCEL_SINGLE_SUCCESSOR_REQUIRED');
 assert.equal(Number(auto[0].customer_id),positive.customerId);
 assert.notEqual(Number(auto[0].priority_id),positive.priorityId,'F06_5C_OLD_TERMINATED_PRIORITY_MUST_NOT_REVIVE');
 assert.match(auto[0].creation_key,/^source-create:/,'F06_5C_PARENT_PG_SOURCE_EVENT_REQUIRED');
 assert.match(auto[0].event_key,/^source-created:/,'F06_5C_PARENT_SIGNED_CREATED_EVENT_REQUIRED');
 const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n;
 const attempts=await Promise.all([
  requestSyntheticNewPriorityCI(auth,token,{...positive,eventKey:mk('wholesale-postcancel-race-A')}),
  requestSyntheticNewPriorityCI(peer,token,{...positive,eventKey:mk('wholesale-postcancel-race-B')})
 ]);
 assert.ok(attempts.every(x=>x.code==='F06_5C_EXISTING_ACTIVE_PRIORITY'),JSON.stringify(attempts));
 assert.ok(attempts.every(x=>Number.isInteger(x.pgBackendPid)&&x.pgBackendPid>0&&/^[0-9]+$/.test(x.pgTransactionId)),JSON.stringify(attempts));
 assert.notEqual(attempts[0].pgBackendPid,attempts[1].pgBackendPid,'F06_5C_TWO_DISTINCT_PHYSICAL_BACKENDS_REQUIRED');
 const current=await q("SELECT priority_id,customer_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active'",[positive.vehicleId,positive.listingCycleId]);
 assert.equal(current.length,1);assert.equal(Number(current[0].priority_id),Number(auto[0].priority_id));
 assert.equal(Number(current[0].customer_id),positive.customerId);
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n,before,'reentry must not add another Priority');
 const winner={priorityId:Number(auto[0].priority_id),code:'F05_8_PARENT_SOURCE_TRIGGER_CREATED'};

 assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
 console.log('F06_5C_SIGNED_WHOLESALE_PRIORITY_LOCK_TRANSACTION_CANCEL_NEW_PRIORITY_RACE',{
  transactionId:txid,oldPriorityId:positive.priorityId,newPriorityId:winner.priorityId,
  backendPids:attempts.map(x=>x.pgBackendPid),txids:attempts.map(x=>x.pgTransactionId),
  resultCodes:attempts.map(x=>x.code),parentSourceCreation: auto[0].event_key,zeroActualPayments:true});
});

test('5C-S66 原F06-1真候补即使5B交易及4A取消后仍防止新Priority插队',async()=>{
 // 在全新CI-only名邦Vehicle上以冻结F06-1两个真实Customer签Lock和候补。
 // 冻结F06-1规定：已有active Lock后 intake 必须拒绝，不允许后来插入申请。
 // 两位合成客户先各自建立合法pending，第一位获批时第二位由原decisionCI
 // 在同Vehicle事务内自动变Waitlist，保存真实源Request与候补签名。
 const first=await f06Signed(()=>intakeCI(db,{
  customerId:86180101,vehicleId:86181107,listingCycleId:86182107,
  requestKey:mk('waitlist-first-pending'),
  syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'
 }));
 assert.equal(first.code,'F06_1_PENDING_CREATED',JSON.stringify(first));
 const request=await f06Signed(()=>intakeCI(db,{
  customerId:86180102,vehicleId:86181107,listingCycleId:86182107,
  requestKey:mk('waitlist-rival-pending'),
  syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'
 }));
 assert.equal(request.code,'F06_1_PENDING_CREATED',JSON.stringify(request));
 const awarded=await f06Signed(()=>decisionCI(auth,token,{
  requestId:first.requestId,requestKey:mk('waitlist-first-approved'),action:'approve'
 }));
 assert.equal(awarded.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(awarded));
 const l=awarded.lockId;
 const queued=(await q('SELECT status,resulting_waitlist_id FROM public.lock_requests WHERE lock_request_id=$1',[request.requestId]))[0];
 assert.equal(queued.status,'lock_conflict',JSON.stringify(queued));
 assert.ok(queued.resulting_waitlist_id,'F06_5C_F06_1_PARENT_WAITLIST_SIGNED_ORIGIN_REQUIRED');
 const waitlist=await q('SELECT waitlist_id,active_lock_id FROM public.waitlists WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND ended_at IS NULL',
  [86180102,86181107,86182107]);
 assert.equal(waitlist.length,1,'F06_5C_REAL_F06_1_SIGNED_WAITLIST_REQUIRED');
 assert.equal(Number(waitlist[0].active_lock_id),l);
 const source=await q('SELECT source_request_id FROM f06_1_lock_ci.waitlist_sources WHERE waitlist_id=$1',[waitlist[0].waitlist_id]);
 assert.equal(source.length,1);assert.equal(Number(source[0].source_request_id),request.requestId);
 const converted=await withF065B(()=>openGuardedSyntheticTransactionCI(auth,token,{
  lockId:l,eventKey:mk('waitlist-5b-converted')
 }));
 assert.equal(converted.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(converted));
 const cancel=await withF064A(()=>cancelSyntheticTransactionCI(auth,token,{
  transactionId:converted.transactionId,eventKey:mk('waitlist-4a-cancelled'),
  reason:'合成真实候补保护在交易取消后仍不得抢先新Priority'
 }));
 assert.equal(cancel.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(cancel));
 const proof=await auth.withSession(token,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=86181107 FOR UPDATE');
  return verifySignedTransactionVacancyCI(c,86181107);
 },{normalOnly:true});
 assert.equal(proof.code,'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL',JSON.stringify(proof));
 const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=86181107"))[0].n;
 const r=await requestSyntheticNewPriorityCI(auth,token,{
  vehicleId:86181107,listingCycleId:86182107,teamId:901,
  customerId:positive.customerId,eventKey:mk('signed-waitlist-must-not-skip')
 });
 assert.equal(r.code,'F06_5C_ACTIVE_SIGNED_WAITLIST_PREVENTS_NEW_PRIORITY',JSON.stringify(r));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=86181107"))[0].n,before);
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
});


// R03: 使用原F06-4B/F06-4C原生Service，杜绝测试自身INSERT冒充父签名。
// 此批仅在非特权、可销毁PG16运行；不会连接任何生产交易/资金Issuer。
const withSignedParentRef=async(name,callback)=>{
 const old=process.env.GITHUB_REF,oldName=process.env.GITHUB_REF_NAME;
 try{
  process.env.GITHUB_REF='refs/heads/'+name;
  process.env.GITHUB_REF_NAME=name;
  return await callback();
 }finally{process.env.GITHUB_REF=old;process.env.GITHUB_REF_NAME=oldName}
};
let r03={};
test('5C-S67 原F06-1签Lock经真实5B Guard转换为4B可移交的在途Transaction',async()=>{
 const lockId=await makeSignedLock(3,'r03-handoff-positive');
 const tx=await withF065B(()=>openGuardedSyntheticTransactionCI(auth,token,{
  lockId,eventKey:mk('r03-real-5b-open')
 }));
 assert.equal(tx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(tx));
 const secondLock=await makeSignedLock(5,'r03-unsigned-post-handoff');
 const secondTx=await withF065B(()=>openGuardedSyntheticTransactionCI(auth,token,{
  lockId:secondLock,eventKey:mk('r03-second-5b-signed-origin')
 }));
 assert.equal(secondTx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(secondTx));
 const original=(await q('SELECT status,responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[tx.transactionId]))[0];
 assert.equal(original.status,'in_progress');assert.equal(Number(original.responsible_employee_id),1);
 r03={txId:tx.transactionId,lockId,secondLockId:secondLock,secondTransactionId:secondTx.transactionId,vehicleId:86181103,listingCycleId:86182103,
  customerId:86180101,originalOwner:(await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=86180101'))[0].current_owner_employee_id};
 const managerRole=(await q("SELECT role_id FROM public.roles WHERE role_code='manager'"))[0];
 assert.ok(managerRole);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[managerRole.role_id]);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-5c-native-4b-manager'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));r03.managerToken=login.token;
});
test('5C-S68 Manager身份本身不能越过原4B独立Transfer Permission',async()=>{
 const out=await withSignedParentRef('feat/f06-4b-transaction-handoff-ci',()=>handoffSyntheticTransactionCI(auth,r03.managerToken,{
  transactionId:r03.txId,newResponsibleId:4,reason:'无独立移交权限必拒',eventKey:mk('r03-transfer-no-permission')
 }));
 assert.equal(out.code,'F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED',JSON.stringify(out));
 assert.equal((await q('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[r03.txId]))[0].responsible_employee_id,'1');
});
test('5C-S69 原4B真实经理有权限与Scope时签发不可变负责人移交',async()=>{
 const p=(await q("SELECT permission_id FROM public.permissions WHERE permission_code='transaction.responsible.transfer'"))[0];
 const permissionId=p?.permission_id??969105;
 if(!p)await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,'transaction.responsible.transfer')",[permissionId]);
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=901 AND ended_at IS NULL LIMIT 1"))[0];
 assert.ok(scope);
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()",[permissionId]);
 const current=(await q("SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=1 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[permissionId,scope.scope_id]))[0];
 if(!current)await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[permissionId,scope.scope_id]);
 const result=await withSignedParentRef('feat/f06-4b-transaction-handoff-ci',()=>handoffSyntheticTransactionCI(auth,r03.managerToken,{
  transactionId:r03.txId,newResponsibleId:4,reason:'原生跨负责人签名移交',eventKey:mk('r03-signed-4b-handoff')
 }));
 assert.equal(result.code,'F06_4B_ATOMIC_HANDOFF_CI',JSON.stringify(result));
 assert.equal(result.oldResponsibleId,1);assert.equal(result.newResponsibleId,4);
 r03.handoffEventId=result.eventId;
 assert.ok(r03.handoffEventId>0);
 const event=(await q("SELECT old_responsible_employee_id old,new_responsible_employee_id next,actor_employee_id actor,reason FROM f06_4b_ci.handoff_events WHERE transaction_id=$1",[r03.txId]))[0];
 assert.deepEqual([Number(event.old),Number(event.next),Number(event.actor)],[1,4,1]);
 assert.ok(event.reason.length>=6);
});
test('5C-S70 已移交但未取消的交易仍凭签名真实占用，禁止新Priority',async()=>{
 const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[r03.vehicleId]))[0].n;
 const candidate=await requestSyntheticNewPriorityCI(auth,r03.managerToken,{
  vehicleId:r03.vehicleId,listingCycleId:r03.listingCycleId,customerId:r03.customerId,teamId:901,eventKey:mk('r03-4b-occupancy')
 });
 assert.equal(candidate.code,'F06_5C_TRANSACTION_OCCUPIED_OR_UNSUPPORTED_STATUS',JSON.stringify(candidate));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[r03.vehicleId]))[0].n,before);
});
test('5C-S71 原4C必须拒绝原负责人试图取消已移交Transaction',async()=>{
 const denied=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.managerToken,{
  transactionId:r03.txId,reason:'旧Manager不能取代新负责人取消',eventKey:mk('r03-old-owner-cancel-denied')
 }));
 assert.equal(denied.code,'F06_4C_OLD_RESPONSIBLE_DENIED',JSON.stringify(denied));
 assert.equal((await q("SELECT count(*)::int n FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1",[r03.txId]))[0].n,0);
});
test('5C-S72 新负责人不因被移交而自动拥有独立4C取消Permission',async()=>{
 await q("UPDATE public.pc_login_accounts SET credential_state='enabled',force_password_change=false WHERE account_id=5 AND employee_id=4");
 const receiver=await auth.login({login:'disabled_test',password:'SyntheticDisabled_123',source:'f06-5c-native-4c-new-owner'});
 assert.equal(receiver.code,'AUTH_OK',JSON.stringify(receiver));
 r03.receiverToken=receiver.token;
 const denied=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.receiverToken,{
  transactionId:r03.txId,reason:'没有独立取消权限',eventKey:mk('r03-receiver-no-permission')
 }));
 assert.equal(denied.code,'F06_4C_PERMISSION_SCOPE_DENIED',JSON.stringify(denied));
});
test('5C-S73 新负责人仅有4C权限但无Capability Scope仍必须拒绝',async()=>{
 const perm=(await q("SELECT permission_id FROM public.permissions WHERE permission_code='transaction.ci.cancel'"))[0];
 assert.ok(perm);
 r03.cancelPermissionId=perm.permission_id;
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(4,$1,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()",[perm.permission_id]);
 const denied=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.receiverToken,{
  transactionId:r03.txId,reason:'新负责人未绑定Scope仍拒绝',eventKey:mk('r03-receiver-no-scope')
 }));
 assert.equal(denied.code,'F06_4C_PERMISSION_SCOPE_DENIED',JSON.stringify(denied));
});
test('5C-S74 新负责人独立Permission与真实team Scope生效后仍测试个人Deny立即拒绝',async()=>{
 let scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=4 AND scope_kind='team' AND scope_reference_id=901 AND ended_at IS NULL LIMIT 1"))[0];
 if(!scope)scope=(await q("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(4,'team',901) RETURNING scope_id"))[0];
 const bound=(await q("SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=4 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[r03.cancelPermissionId,scope.scope_id]))[0];
 if(!bound)await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(4,$1,$2,clock_timestamp()-interval '2 minutes')",[r03.cancelPermissionId,scope.scope_id]);
 await q("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=4 AND permission_id=$1",[r03.cancelPermissionId]);
 try{
  const denied=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.receiverToken,{
   transactionId:r03.txId,reason:'个人拒绝高于角色默认允许',eventKey:mk('r03-receiver-personal-deny')
  }));
  assert.equal(denied.code,'F06_4C_PERMISSION_SCOPE_DENIED',JSON.stringify(denied));
 }finally{
  await q("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=4 AND permission_id=$1",[r03.cancelPermissionId]);
 }
});
test('5C-S75 新负责人Scope撤销必须在原4C提交时实时拒绝',async()=>{
 const updated=await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=4 AND permission_id=$1 AND ended_at IS NULL RETURNING ctid::text pointer",[r03.cancelPermissionId]);
 assert.ok(updated.length>0);
 try{
  const denied=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.receiverToken,{
   transactionId:r03.txId,reason:'Scope失效旧Session无资格取消',eventKey:mk('r03-receiver-revoked-scope')
  }));
  assert.equal(denied.code,'F06_4C_PERMISSION_SCOPE_DENIED',JSON.stringify(denied));
 }finally{
  for(const x of updated)await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE ctid::text=$1",[x.pointer]);
 }
});
test('5C-S76 原4C由新负责人真正原子签发取消并留下不可变请求链',async()=>{
 const cancel=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.receiverToken,{
  transactionId:r03.txId,reason:'移交后当前真实合成负责人合法取消',eventKey:mk('r03-native-post-handoff-cancel')
 }));
 assert.equal(cancel.code,'F06_4C_POST_HANDOFF_CANCELLED_ATOMIC_CI',JSON.stringify(cancel));
 r03.cancelEventId=cancel.eventId;
 const proof=(await q("SELECT o.original_responsible_employee_id original,o.transferred_responsible_employee_id current,e.event_id,k.event_id signed_event FROM f06_4c_ci.cancel_origins o JOIN f06_4c_ci.cancel_events e USING(transaction_id) JOIN f06_4c_ci.request_keys k USING(transaction_id) WHERE o.transaction_id=$1",[r03.txId]))[0];
 assert.ok(proof);
 assert.equal(Number(proof.original),1);assert.equal(Number(proof.current),4);
 assert.equal(Number(proof.event_id),Number(r03.cancelEventId));assert.equal(Number(proof.signed_event),Number(r03.cancelEventId));
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[r03.txId]))[0].status,'cancelled');
 assert.equal((await q('SELECT status FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[r03.txId]))[0].status,'in_progress');
});
test('5C-S77 5C在原4B/4C签发后真正验证旧3B原始来源、5B Guard与4C终态',async()=>{
 const done=await auth.withSession(r03.managerToken,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[r03.vehicleId]);
  return verifySignedTransactionVacancyCI(c,r03.vehicleId);
 },{normalOnly:true});
 assert.equal(done.code,'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL',JSON.stringify(done));
 assert.equal((await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=86180101'))[0].current_owner_employee_id,r03.originalOwner);
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
 console.log('F06_5C_R03_NATIVE_PARENT_HANDOFF_CANCEL_TERMINAL',{
  transactionId:r03.txId,originalResponsible:1,currentResponsible:4,
  handoffEventId:r03.handoffEventId,cancelEventId:r03.cancelEventId,result:done.code
 });
});
test('5C-S78 5C签终态不豁免真实Match：未匹配名邦车不得伪装正向发行',async()=>{
 const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[r03.vehicleId]))[0].n;
 const denied=await requestSyntheticNewPriorityCI(auth,r03.managerToken,{
  vehicleId:r03.vehicleId,listingCycleId:r03.listingCycleId,customerId:r03.customerId,teamId:901,eventKey:mk('r03-no-true-match')
 });
 assert.equal(denied.code,'F06_5C_CURRENT_MATCH_AND_QUALIFICATION_REQUIRED',JSON.stringify(denied));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[r03.vehicleId]))[0].n,before);
});
test('5C-S79 原生4C事件不可DELETE且5C终态继续有效',async()=>{
 await assert.rejects(q('DELETE FROM f06_4c_ci.cancel_events WHERE transaction_id=$1',[r03.txId]),/F06_4C_APPEND_ONLY_IMMUTABLE/);
 const done=await auth.withSession(r03.managerToken,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[r03.vehicleId]);
  return verifySignedTransactionVacancyCI(c,r03.vehicleId);
 },{normalOnly:true});
 assert.equal(done.code,'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL',JSON.stringify(done));
});

test('5C-S80 4C已签终态但4B负责人投影漂移必拒并在SAVEPOINT后完整复原',async()=>{
 const result=await auth.withSession(r03.managerToken,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[r03.vehicleId]);
  await c.query('SAVEPOINT f06_5c_r03_projection_drift_probe');
  try{
   await c.query('UPDATE f06_4b_ci.responsible_projection SET current_responsible_employee_id=1 WHERE transaction_id=$1',[r03.txId]);
   return await verifySignedTransactionVacancyCI(c,r03.vehicleId);
  }finally{await c.query('ROLLBACK TO SAVEPOINT f06_5c_r03_projection_drift_probe')}
 },{normalOnly:true});
 assert.equal(result.code,'F06_5C_4C_HANDOFF_PROJECTION_UNSIGNED',JSON.stringify(result));
 const restored=await auth.withSession(r03.managerToken,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[r03.vehicleId]);
  return verifySignedTransactionVacancyCI(c,r03.vehicleId);
 },{normalOnly:true});
 assert.equal(restored.code,'F06_5C_ALL_SIGNED_TRANSACTIONS_TERMINAL',JSON.stringify(restored));
});
test('5C-S81 原4B有效移交后仅伪造public取消而无4C原生事件必FailClosed并零半写',async()=>{
 const handed=await withSignedParentRef('feat/f06-4b-transaction-handoff-ci',()=>handoffSyntheticTransactionCI(auth,r03.managerToken,{
  transactionId:r03.secondTransactionId,newResponsibleId:4,reason:'第二车原生handoff后验证假取消',eventKey:mk('r03-second-real-handoff')
 }));
 assert.equal(handed.code,'F06_4B_ATOMIC_HANDOFF_CI',JSON.stringify(handed));
 const probed=await auth.withSession(r03.managerToken,async c=>{
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=86181105 FOR UPDATE');
  await c.query('SAVEPOINT f06_5c_unsigned_4c_status_probe');
  try{
   await c.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1",[r03.secondTransactionId]);
   return verifySignedTransactionVacancyCI(c,86181105);
  }finally{await c.query('ROLLBACK TO SAVEPOINT f06_5c_unsigned_4c_status_probe')}
 },{normalOnly:true});
 assert.equal(probed.code,'F06_5C_TERMINAL_CANCEL_SIGNATURE_MISSING_OR_CONFLICT',JSON.stringify(probed));
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[r03.secondTransactionId]))[0].status,'in_progress');
 assert.equal((await q('SELECT count(*)::int n FROM f06_4c_ci.cancel_origins WHERE transaction_id=$1',[r03.secondTransactionId]))[0].n,0);
});
test('5C-S82 已签4C合法终态禁止第二次取消及不同Key再签事件',async()=>{
 const before=(await q('SELECT count(*)::int n FROM f06_4c_ci.cancel_events WHERE transaction_id=$1',[r03.txId]))[0].n;
 const second=await withSignedParentRef('feat/f06-4c-post-handoff-cancel-ci',()=>cancelAfterHandoffSyntheticCI(auth,r03.receiverToken,{
  transactionId:r03.txId,reason:'不同Key不许二次签取消事件',eventKey:mk('r03-double-cancel-deny')
 }));
 assert.equal(second.code,'F06_4C_TERMINAL_TRANSACTION_DENY',JSON.stringify(second));
 const oldParent=await withF064A(()=>cancelSyntheticTransactionCI(auth,r03.managerToken,{
  transactionId:r03.txId,reason:'经理不得调用旧4A取消已移交终态',eventKey:mk('r03-old-parent-second-cancel')
 }));
 assert.equal(oldParent.allowed,false,JSON.stringify(oldParent));
 assert.equal((await q('SELECT count(*)::int n FROM f06_4c_ci.cancel_events WHERE transaction_id=$1',[r03.txId]))[0].n,before);
});
test('5C-S83 不同Vehicle双真实PG Backend并行互不因对方持锁误阻',async()=>{
 // 第一个真Backend保持车3的FOR UPDATE，第二个5C仍必须能独立读车positive并完成其本车精确业务拒绝。
 const blocker=await connect();
 try{
  await blocker.query('BEGIN');
  const left=(await blocker.query('SELECT pg_backend_pid()::int pid,txid_current()::text txid')).rows[0];
  await blocker.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[r03.vehicleId]);
  const before=(await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n;
  const out=await requestSyntheticNewPriorityCI(peer,r03.managerToken,{
   vehicleId:positive.vehicleId,listingCycleId:positive.listingCycleId,customerId:positive.customerId,
   teamId:positive.teamId,eventKey:mk('r03-other-vehicle-unblocked')
  });
  assert.equal(out.code,'F06_5C_EXISTING_ACTIVE_PRIORITY',JSON.stringify(out));
  assert.notEqual(out.pgBackendPid,left.pid,'必须是真正不同PG Backend');
  assert.notEqual(out.pgTransactionId,left.txid,'必须是不同真实PG事务');
  assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1",[positive.vehicleId]))[0].n,before);
  console.log('F06_5C_NATIVE_DIFFERENT_VEHICLE_NO_FALSE_CONTENTION',{
   blockerVehicle:r03.vehicleId,competingVehicle:positive.vehicleId,
   blockerPid:left.pid,competingPid:out.pgBackendPid,blockerTxid:left.txid,competingTxid:out.pgTransactionId,
   actualBusinessCode:out.code
  });
 }finally{await blocker.query('ROLLBACK');await blocker.end()}
});


test('5C-S84 C01 真JYT当前Match、原F06-1候补、5B交易和4A取消不得使父Priority插队',async()=>{
 // 必须是独立的JYT同步血缘和原F05-7签名，不复用S66名邦无Match假负例。
 const fresh=(await q("SELECT l.vehicle_id,l.current_cycle_id,l.model_year FROM public.f05_3b_sync_lineages l "+
  "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
  "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id "+
  "LEFT JOIN public.f05_7_vehicle_facts_ci f ON f.vehicle_id=l.vehicle_id AND f.listing_cycle_id=l.current_cycle_id "+
  "WHERE v.source_type='wholesale' AND v.source_sale_status='active' AND cy.ended_at IS NULL AND f.vehicle_id IS NULL "+
  "AND NOT EXISTS(SELECT 1 FROM public.locks k WHERE k.vehicle_id=l.vehicle_id AND k.lock_status='active') "+
  "AND NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=l.vehicle_id AND p.status='active') "+
  "ORDER BY l.vehicle_id LIMIT 1"))[0];
 assert.ok(fresh,'C01_TRUE_SIGNED_JYT_FIXTURE_UNAVAILABLE_BLOCKED');
 const vehicleId=Number(fresh.vehicle_id),listingCycleId=Number(fresh.current_cycle_id);
 const first=await f06Signed(()=>intakeCI(db,{customerId:positive.customerId,vehicleId,listingCycleId,
  requestKey:mk('c01-first-before-match'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(first.code,'F06_1_PENDING_CREATED',JSON.stringify(first));
 const rival=await f06Signed(()=>intakeCI(db,{customerId:86180102,vehicleId,listingCycleId,
  requestKey:mk('c01-rival-before-match'),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(rival.code,'F06_1_PENDING_CREATED',JSON.stringify(rival));
 const year=Number(fresh.model_year);
 await q("INSERT INTO public.f05_7_vehicle_facts_ci(vehicle_id,listing_cycle_id,facts_json) VALUES($1,$2,$3::jsonb)",
  [vehicleId,listingCycleId,JSON.stringify({
   model_year:{value:year,source:'CI_JYT_SIGNED_SOURCE_STRUCTURED_NOT_PRODUCTION'},
   mileage_km:{value:42000,source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
   exterior_color:{value:'black',source:'CI_SYNTHETIC_STRUCTURED_NOT_PRODUCTION'},
   interior_color:{value:'beige',source:'CI_SYNTHETIC_INSPECTION_NOT_PRODUCTION'},
   budget_cents:{value:10000000,source:'CI_SYNTHETIC_DISPLAY_ONLY_NOT_PRODUCTION'}
  })]);
 const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",
  [positive.customerId]))[0];assert.ok(demand);
 const match=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),r03.managerToken,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId,teamId:901,runKey:mk('c01-truly-signed-match')});
 assert.equal(match.allowed,true,JSON.stringify(match));
 assert.ok(['high','acceptable'].includes(match.tier),'C01_REAL_QUALIFIED_MATCH_REQUIRED');
 const firstPriority=await q("SELECT priority_id,customer_id FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[vehicleId]);
 assert.equal(firstPriority.length,1,'C01_FROZEN_PARENT_SOURCE_PRIORITY_REQUIRED');
 assert.equal(Number(firstPriority[0].customer_id),positive.customerId);
 const awarded=await f06Signed(()=>decisionCI(auth,r03.managerToken,{
  requestId:first.requestId,requestKey:mk('c01-approve-first'),action:'approve'}));
 assert.equal(awarded.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(awarded));
 const queued=(await q("SELECT status,resulting_waitlist_id FROM public.lock_requests WHERE lock_request_id=$1",[rival.requestId]))[0];
 assert.equal(queued.status,'lock_conflict');
 const waiting=await q("SELECT w.waitlist_id,s.source_request_id FROM public.waitlists w "+
  "JOIN f06_1_lock_ci.waitlist_sources s ON s.waitlist_id=w.waitlist_id "+
  "WHERE w.vehicle_id=$1 AND w.listing_cycle_id=$2 AND w.ended_at IS NULL",[vehicleId,listingCycleId]);
 assert.equal(waiting.length,1,'C01_SIGNED_WAITLIST_MUST_REMAIN_ACTIVE');
 assert.equal(Number(waiting[0].source_request_id),rival.requestId);
 const tx=await withF065B(()=>openGuardedSyntheticTransactionCI(auth,r03.managerToken,{
  lockId:awarded.lockId,eventKey:mk('c01-signed-5b-convert')}));
 assert.equal(tx.code,'F06_5B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(tx));
 const refreshed=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),r03.managerToken,{
  demandId:Number(demand.demand_id),vehicleId,listingCycleId,teamId:901,runKey:mk('c01-match-while-tx-active')});
 assert.equal(refreshed.allowed,true,JSON.stringify(refreshed));
 assert.equal((await q("SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1 AND status='active'",[vehicleId]))[0].n,0);
 const cancelled=await withF064A(()=>cancelSyntheticTransactionCI(auth,r03.managerToken,{
  transactionId:tx.transactionId,eventKey:mk('c01-genuine-4a-cancel'),reason:'C01真实候补保护与父自动签发跨域验收'}));
 assert.equal(cancelled.code,'F06_4A_CANCELLED_ATOMIC_NO_PAYMENT',JSON.stringify(cancelled));
 const after=await q("SELECT p.priority_id,p.creation_key,e.event_key FROM public.f05_8_priority_ci p "+
  "JOIN public.f05_8_events_ci e ON e.priority_id=p.priority_id AND e.event_kind='created' "+
  "WHERE p.vehicle_id=$1 AND p.status='active'",[vehicleId]);
 const backend=(await q('SELECT pg_backend_pid()::int pid,txid_current()::text txid'))[0];
 console.log('F06_5C_C01_TRUE_SIGNED_WAITLIST_MATCH_CANCEL_PARENT_AUTO',JSON.stringify({
  vehicleId,transactionId:tx.transactionId,waitlistId:waiting[0].waitlist_id,
  actualOriginalMatchTier:refreshed.tier,backend,autoPriority:after}));
 assert.equal((await q("SELECT count(*)::int n FROM public.waitlists WHERE vehicle_id=$1 AND ended_at IS NULL",[vehicleId]))[0].n,1);
 assert.equal(after.length,0,'UPSTREAM_F05_8_PARENT_AUTO_ISSUER_BYPASSES_SIGNED_WAITLIST_C01');
 assert.equal((await q('SELECT count(*)::int n FROM public.refund_payments'))[0].n,0);
});
test('5C-S85 C02 真Match+未签4A/4C伪public取消不得提前触发父Priority',()=>{
 assert.ok(parentCrossDomainProbes.c02,'C02_NATIVE_PG_SIGNED_SOURCE_PROBE_MISSING');
 const p=parentCrossDomainProbes.c02;
 assert.equal(p.withUnknownRefund,false);
 assert.equal(p.baseline,0);
 assert.equal(p.created.length,0,'UPSTREAM_F05_8_PARENT_AUTO_ISSUER_UNSIGNED_PUBLIC_CANCEL_C02 '+JSON.stringify(p));
});
test('5C-S86 C03 5B之后未知pending退款与伪取消组合不得触发父签Priority',()=>{
 assert.ok(parentCrossDomainProbes.c03,'C03_NATIVE_PG_UNKNOWN_FINANCE_PROBE_MISSING');
 const p=parentCrossDomainProbes.c03;
 assert.equal(p.withUnknownRefund,true);
 assert.equal(p.baseline,0);
 assert.equal(p.created.length,0,'UPSTREAM_F05_8_PARENT_AUTO_ISSUER_UNKNOWN_FINANCE_CANCEL_C03 '+JSON.stringify(p));
 assert.equal((p.pgBlocked===null)||typeof p.pgBlocked.sqlstate==='string',true);
});
