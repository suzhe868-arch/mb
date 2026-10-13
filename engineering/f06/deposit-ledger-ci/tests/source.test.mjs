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
