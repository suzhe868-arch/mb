import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withF062} from '../migration.mjs';
import {recordSyntheticDepositCI,correctSyntheticDepositCI,receiptNetCI,productionIssuerDeny} from '../service.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {expireOrdinaryCI,CI_SYSTEM_PROOF} from '../../lock-lifecycle-ci/service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const c=await connect(),q=(sql,a=[])=>c.query(sql,a).then(x=>x.rows);
const dsn=process.env.F03_1_DATABASE_URL,secret=Buffer.alloc(32,61);
const auth=new IsolatedAuth({connectionString:dsn,secret,origin:'https://127.0.0.1:49026'});
const authM=new IsolatedAuth({connectionString:dsn,secret,origin:'https://127.0.0.1:49026'});
const k=s=>'f06-3a-real-pg16-'+s+'-'+process.env.GITHUB_RUN_ID;
const cp='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
let token,managerToken,locks={},deposit1,deposit2,firstSnapshot;
const older=fn=>withF062(()=>withParentBranch(fn));
const record=(lock,amount,name,p={})=>recordSyntheticDepositCI(auth,token,{lockId:lock,amountCents:amount,
 currency:'CNY',paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),
 eventKey:k(name),syntheticVoucher:'CI-ONLY',...p});
const correct=(lock,deposit,action,delta,name,p={})=>correctSyntheticDepositCI(authM,managerToken,{
 lockId:lock,depositId:deposit,action,deltaCents:delta,currency:'CNY',
 reason:'synthetic correction '+name,eventKey:k(name),...p});
test.before(async()=>{
 assert.equal((await verify(c)).verified,true);
 const sales=(await q("SELECT role_id FROM public.roles WHERE role_code='sales' LIMIT 1"))[0];
 assert.ok(sales);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sales.role_id]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await q('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];assert.ok(team);
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL",[team.team_id]))[0];assert.ok(scope);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(962301,'deposit.ci.record'),(962302,'deposit.ci.correct')");
 for(const perm of [962301,962302]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[perm]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scope.scope_id]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-3a-record'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 for(let n=1;n<=3;n++){
  const request=await older(()=>intakeCI(c,{customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),requestKey:k('intake-'+n),syntheticPhoneConsent:cp}));
  assert.equal(request.code,'F06_1_PENDING_CREATED',JSON.stringify(request));
  const result=await older(()=>decisionCI(auth,token,{requestId:request.requestId,requestKey:k('approve-'+n),action:'approve'}));
  assert.equal(result.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(result));locks[n]=result.lockId;
 }
 firstSnapshot=(await q('SELECT l.*,s.* FROM public.locks l JOIN f06_1_lock_ci.lock_snapshots s USING(lock_id) WHERE l.lock_id=$1',[locks[1]]))[0];
});
test.after(async()=>{await c.end();await auth.close();await authM.close()});
test('63A-S01 original 24 signed migrations and F06-2 sidecar verify',async()=>{
 const v=await verify(c);assert.equal(v.verified,true);assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24);
});
test('63A-S02 nonprivileged real PostgreSQL16',async()=>{
 const x=(await q("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su"))[0];
 assert.equal(x.db,'f03_auth_test');assert.equal(x.usr,'f03_ci');assert.equal(x.su,false);assert.ok(x.ver>=160000&&x.ver<170000);
});
test('63A-S03 signed Lock initial price/policy preserved',async()=>{assert.equal(firstSnapshot.initial_hours,72);assert.equal(Number(firstSnapshot.responsible_employee_id),1);assert.equal(firstSnapshot.policy_version,1)});
test('63A-S04 production issuer denied',()=>assert.equal(productionIssuerDeny().allowed,false));
test('63A-S05 amount zero invalid',async()=>assert.equal((await record(locks[1],0,'zero')).code,'F06_3A_INVALID_RECEIPT_ARGUMENTS'));
test('63A-S06 negative amount invalid',async()=>assert.equal((await record(locks[1],-1,'negative')).allowed,false));
test('63A-S07 currency strict CNY',async()=>assert.equal((await record(locks[1],500,'currency',{currency:'USD'})).allowed,false));
test('63A-S08 payment method strict fixture only',async()=>assert.equal((await record(locks[1],500,'method',{paymentMethod:'fake'})).allowed,false));
test('63A-S09 PG clock rejects synthetic future received_at',async()=>assert.equal((await record(locks[1],500,'future',{receivedAt:'2099-01-01T00:00:00Z'})).code,'F06_3A_RECEIVED_TIME_OUT_OF_RANGE'));
test('63A-S10 forged token cannot record',async()=>assert.equal((await recordSyntheticDepositCI(auth,'forged',{lockId:locks[1],amountCents:100,currency:'CNY',paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('forged')})).allowed,false));
test('63A-S11 valid signed responsible records physical synthetic Deposit',async()=>{
 const v=await record(locks[1],12000,'deposit-one');assert.equal(v.code,'F06_3A_SYNTHETIC_RECEIPT_RECORDED',JSON.stringify(v));deposit1=v.depositId;
 const x=(await q('SELECT d.amount_cents,d.recorded_by,m.issuer_kind,m.payment_method FROM public.deposit_receipts d JOIN f06_3a_ci.receipt_provenance m USING(deposit_id) WHERE d.deposit_id=$1',[deposit1]))[0];
 assert.equal(Number(x.amount_cents),12000);assert.equal(Number(x.recorded_by),1);assert.equal(x.issuer_kind,'CI_SYNTHETIC_NOT_REAL_MONEY');
});
test('63A-S12 same Lock supports second independent Deposit',async()=>{
 const v=await record(locks[1],5000,'deposit-two',{paymentMethod:'bank_transfer'});assert.equal(v.allowed,true,JSON.stringify(v));deposit2=v.depositId;
 assert.notEqual(deposit1,deposit2);
});


test('63A-S13 identical idempotency key never duplicates receipt',async()=>{
 const r=await record(locks[1],12000,'deposit-one');assert.equal(r.code,'F06_3A_IDEMPOTENT_RECEIPT');assert.equal(r.depositId,deposit1);
 assert.equal((await q('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1',[locks[1]]))[0].n,2);
});
test('63A-S14 reused key with another Lock or sum rejected',async()=>{
 assert.equal((await record(locks[1],12345,'deposit-one')).code,'F06_3A_IDEMPOTENCY_KEY_CONFLICT');
 assert.equal((await record(locks[2],12000,'deposit-one')).code,'F06_3A_IDEMPOTENCY_KEY_CONFLICT');
});
test('63A-S15 unknown funds never treated as zero for PG expiration',async()=>{
 const r=await withF062(()=>expireOrdinaryCI(c,{lockId:locks[2],ciSystemProof:CI_SYSTEM_PROOF}));
 assert.equal(r.code,'F06_2_DEPOSIT_ISSUER_SOURCE_GAP_UNKNOWN_DENY',JSON.stringify(r));
});
test('63A-S16 physical receipt protects Lock from expiry even with synthetic absence hint',async()=>{
 await q("INSERT INTO f06_2_ci.finance_proofs(lock_id,proof_kind) VALUES($1,'synthetic_absence_confirmed')",[locks[1]]);
 await q("UPDATE public.locks SET created_at=clock_timestamp()-interval '100 hours',expires_at=clock_timestamp()-interval '1 minute' WHERE lock_id=$1",[locks[1]]);
 const v=await withF062(()=>expireOrdinaryCI(c,{lockId:locks[1],ciSystemProof:CI_SYSTEM_PROOF}));
 assert.equal(v.code,'F06_2_EXISTING_SIGNED_MONEY_OR_TRANSACTION_DENY',JSON.stringify(v));
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[1]]))[0].lock_status,'active');
});
test('63A-S17 sales employee cannot use independent correction permission',async()=>{
 const v=await correctSyntheticDepositCI(auth,token,{lockId:locks[1],depositId:deposit1,action:'correction',deltaCents:-2000,currency:'CNY',reason:'sales denied correction',eventKey:k('sales-deny')});
 assert.equal(v.code,'F06_3A_CORRECTION_PERMISSION_SCOPE_DENIED',JSON.stringify(v));
});
test('63A-S18 manager role requires fresh signed identity',async()=>{
 const manager=(await q("SELECT role_id FROM public.roles WHERE role_code='manager' LIMIT 1"))[0];assert.ok(manager);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[manager.role_id]);
 const s=await authM.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-3a-current-manager'});
 assert.equal(s.code,'AUTH_OK',JSON.stringify(s));managerToken=s.token;
});
test('63A-S19 manager authorized correction appends immutable event',async()=>{
 const r=await correct(locks[1],deposit1,'correction',-2000,'first-correction');
 assert.equal(r.code,'F06_3A_APPEND_ONLY_CORRECTION',JSON.stringify(r));assert.equal(r.netCents,10000);
});
test('63A-S20 effective net is derived, original receipt stays intact',async()=>{
 const z=await receiptNetCI(c,deposit1);assert.equal(z.netCents,10000);
 const x=(await q('SELECT amount_cents FROM public.deposit_receipts WHERE deposit_id=$1',[deposit1]))[0];assert.equal(Number(x.amount_cents),12000);
});
test('63A-S21 correction without reason or exceeding net is rejected',async()=>{
 assert.equal((await correct(locks[1],deposit1,'correction',-1,'no-reason',{reason:''})).code,'F06_3A_INVALID_CORRECTION_ARGUMENTS');
 assert.equal((await correct(locks[1],deposit1,'correction',-20000,'excess')).code,'F06_3A_OVER_REVERSAL_OR_INVALID_NET_DENIED');
});
test('63A-S22 manager reversal appends complete remaining net without rewriting receipt',async()=>{
 const r=await correct(locks[1],deposit1,'reversal',-10000,'full-reversal');
 assert.equal(r.code,'F06_3A_APPEND_ONLY_REVERSAL',JSON.stringify(r));assert.equal(r.netCents,0);
 assert.equal((await receiptNetCI(c,deposit1)).netCents,0);
});
test('63A-S23 reversal to zero cannot auto-release ordinary Lock',async()=>{
 const r=await withF062(()=>expireOrdinaryCI(c,{lockId:locks[1],ciSystemProof:CI_SYSTEM_PROOF}));
 assert.equal(r.code,'F06_2_EXISTING_SIGNED_MONEY_OR_TRANSACTION_DENY',JSON.stringify(r));
});
test('63A-S24 audit events and metadata append-only enforcement',async()=>{
 const v=(await q('SELECT adjustment_id FROM f06_3a_ci.adjustments WHERE deposit_id=$1 ORDER BY adjustment_id LIMIT 1',[deposit1]))[0];
 await assert.rejects(()=>q("UPDATE f06_3a_ci.adjustments SET reason='forbidden' WHERE adjustment_id=$1",[v.adjustment_id]),/F06_3A_IMMUTABLE_FINANCIAL_LEDGER/);
 await assert.rejects(()=>q('DELETE FROM f06_3a_ci.receipt_provenance WHERE deposit_id=$1',[deposit1]),/F06_3A_IMMUTABLE_FINANCIAL_LEDGER/);
});
test('63A-S25 correction injection rolls back net and append-only event',async()=>{
 const before=(await q('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[deposit2]))[0].n;
 await assert.rejects(()=>correct(locks[1],deposit2,'correction',-500,'fault-injection',{testCheckpoint:'AFTER_CORRECTION_THROW'}),/F06_3A_INJECTED_CORRECTION_ROLLBACK/);
 assert.equal((await q('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[deposit2]))[0].n,before);
});
test('63A-S26 second native PG Backend committed permission revocation denies stale manager session',async()=>{
 const b=await connect(),aPid=(await q('SELECT pg_backend_pid() pid'))[0].pid,bPid=(await b.query('SELECT pg_backend_pid() pid')).rows[0].pid;
 assert.notEqual(aPid,bPid);
 try{
  await b.query('BEGIN');await b.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=962302");await b.query('COMMIT');
  const r=await correct(locks[1],deposit2,'correction',-100,'revoked-rights');
  assert.equal(r.code,'F06_3A_CORRECTION_PERMISSION_SCOPE_DENIED',JSON.stringify(r));
  console.log('F06_3A_NATIVE_PG16_PERMISSION_REVOKED_TWO_BACKENDS',{aPid,bPid});
 }finally{await b.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=962302");await b.end()}
});
test('63A-S27 two PG Backends cannot partially commit while Vehicle mutex held',async()=>{
 const b=await connect(),before=(await q('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[deposit2]))[0].n;
 try{
  await b.query('BEGIN');await b.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vehicle(1)]);
  const r=await correct(locks[1],deposit2,'correction',-100,'mutex-competition').then(v=>({v}),e=>({e}));
  assert.ok(r.e || r.v?.allowed===false,JSON.stringify(r));if(r.e)assert.ok(['55P03','40P01','40001'].includes(r.e.code),String(r.e));
  await b.query('COMMIT');
  assert.equal((await q('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[deposit2]))[0].n,before);
 }finally{await b.query('ROLLBACK');await b.end()}
});
test('63A-S28 disabled Customer preserves signed Deposit, Waitlist and price history',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{
  assert.equal((await q('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1',[locks[1]]))[0].n,2);
  assert.equal((await q('SELECT count(*)::int n FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[deposit1]))[0].n,2);
  const now=(await q('SELECT initial_hours,policy_version FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1',[locks[1]]))[0];
  assert.equal(now.initial_hours,72);assert.equal(now.policy_version,1);
 }finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
