import {test} from 'node:test';
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
 const perms=[['transaction.ci.open',969101],['deposit.ci.record',969102],['refund.ci.request',969103]];
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
 assert.notEqual(out.code,'F06_5C_SIGNED_SESSION_DENIED');
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
 assert.ok(results.every(x=>x.allowed===false),JSON.stringify(results));
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
 const result=await attempt({eventKey:mk('postcancel-recheck')},auth,token);
 assert.notEqual(result.code,'F06_5C_PUBLIC_PARENT_TRANSACTION_STATE_DRIFT',JSON.stringify(result));
 assert.notEqual(result.code,'F06_5C_TERMINAL_CANCEL_SIGNATURE_MISSING_OR_CONFLICT',JSON.stringify(result));
 assert.notEqual(result.code,'F06_5C_5B_GUARD_MISSING_OR_DRIFT',JSON.stringify(result));
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
test('5C-S63 4A取消后新F05-7原签名Match与原F05-8二Backend真正竞态只签一个胜者',async()=>{
 const previous=(await q('SELECT facts_json FROM public.f05_7_vehicle_facts_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2',[positive.vehicleId,positive.listingCycleId]))[0];
 assert.ok(previous?.facts_json);
 await q("INSERT INTO public.f05_7_vehicle_facts_ci(vehicle_id,listing_cycle_id,facts_json) VALUES($1,$2,$3::jsonb) "+
 "ON CONFLICT(vehicle_id,listing_cycle_id) DO UPDATE SET facts_json=excluded.facts_json",
 [args.vehicleId,args.listingCycleId,JSON.stringify(previous.facts_json)]);
 const demand=(await q("SELECT demand_id FROM public.demands WHERE customer_id=$1 AND demand_state='active' ORDER BY demand_id LIMIT 1",[positive.customerId]))[0];
 assert.ok(demand);
 const match=await calculateCI(signedFrozenParentSessionAdapterCI(auth,21),token,{
  demandId:Number(demand.demand_id),vehicleId:args.vehicleId,listingCycleId:args.listingCycleId,
  teamId:args.teamId,runKey:mk('post-4a-real-match')
 });
 assert.equal(match.allowed,true,JSON.stringify(match));
 assert.ok(['high','acceptable'].includes(match.tier),JSON.stringify(match));
 const before=(await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1',[args.vehicleId]))[0].n;
 const candidate={...args,customerId:positive.customerId};
 const results=await Promise.all([
  requestSyntheticNewPriorityCI(auth,token,{...candidate,eventKey:mk('signed-cancel-race-A')}),
  requestSyntheticNewPriorityCI(peer,token,{...candidate,eventKey:mk('signed-cancel-race-B')})
 ]);
 assert.equal(results.filter(x=>x.code==='F06_5C_PARENT_SIGNED_PRIORITY_CREATED').length,1,JSON.stringify(results));
 const after=await q("SELECT p.priority_id,p.customer_id,e.event_key FROM public.f05_8_priority_ci p "+
  "JOIN public.f05_8_events_ci e ON e.priority_id=p.priority_id AND e.event_kind='created' "+
  "WHERE p.vehicle_id=$1 AND p.listing_cycle_id=$2 AND p.status='active'",[args.vehicleId,args.listingCycleId]);
 assert.equal(after.length,1);assert.equal(Number(after[0].customer_id),positive.customerId);
 assert.equal((await q('SELECT count(*)::int n FROM public.f05_8_priority_ci WHERE vehicle_id=$1',[args.vehicleId]))[0].n,before+1);
});
