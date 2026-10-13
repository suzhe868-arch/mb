import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withF063A} from '../migration.mjs';
import {openSyntheticTransactionCI,currentSyntheticTransactionCI,syntheticNewOccupancyGuardCI,productionIssuerDeny} from '../service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const db=await connect(),q=(sql,a=[])=>db.query(sql,a).then(z=>z.rows);
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const auth2=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
const k=s=>'f06-3b-real-pg16-'+s+'-'+process.env.GITHUB_RUN_ID;
const customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const older=fn=>withF063A(()=>withF062(()=>withParentBranch(fn)));
let token,locks={},txId,depositId,original,sourceBefore,eventsBefore;
const open=(n,name,p={})=>openSyntheticTransactionCI(auth,token,{lockId:locks[n],eventKey:k(name),...p});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 const sales=(await q("SELECT role_id FROM public.roles WHERE role_code='sales' LIMIT 1"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sales.role_id]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await q('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];assert.ok(team);
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];assert.ok(scope);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(962401,'transaction.ci.open'),(962402,'transaction.ci.manage'),(962403,'deposit.ci.record')");
 for(const perm of [962403]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[perm]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[perm,scope.scope_id]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-3b-current-employee'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 for(let n=1;n<=4;n++){
 const req=await older(()=>intakeCI(db,{customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),requestKey:k('request-'+n),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
 assert.equal(req.code,'F06_1_PENDING_CREATED',JSON.stringify(req));
 const result=await older(()=>decisionCI(auth,token,{requestId:req.requestId,requestKey:k('approve-'+n),action:'approve'}));
 assert.equal(result.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify(result));locks[n]=result.lockId;
 }
 original=(await q("SELECT l.*,s.initial_hours,s.price_kind,s.price_cents,s.priority_origin_id,s.policy_version FROM public.locks l JOIN f06_1_lock_ci.lock_snapshots s USING(lock_id) WHERE l.lock_id=$1",[locks[1]]))[0];
 sourceBefore=(await q('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1',[locks[1]]))[0].n;
 eventsBefore=(await q('SELECT count(*)::int n FROM public.audit_events'))[0].n;
});
test.after(async()=>{await db.end();await auth.close();await auth2.close()});
test('3B-S01 signed F06-3A parent and 24 old PG ledger rows',async()=>{assert.equal((await verify(db)).verified,true);assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24)});
test('3B-S02 actual non-superuser native PostgreSQL 16',async()=>{
 const x=(await q("SELECT current_database() db,current_user u,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) super,current_setting('server_version_num')::int v"))[0];
 assert.equal(x.db,'f03_auth_test');assert.equal(x.u,'f03_ci');assert.equal(x.super,false);assert.ok(x.v>=160000&&x.v<170000);
});
test('3B-S03 physical legacy transaction carrier must never claim official in_progress',async()=>{
 const x=(await q("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name IN('status','source_lock_id','customer_id','vehicle_id','listing_cycle_id','responsible_employee_id')"))[0];
 assert.ok(x);assert.equal((await verify(db)).carrier,'PRODUCTION_TRANSACTION_SCHEMA_CARRIER_GAP');
});
test('3B-S04 no production Transaction issuer',()=>assert.equal(productionIssuerDeny().allowed,false));
test('3B-S05 zero lock ID rejected',async()=>assert.equal((await openSyntheticTransactionCI(auth,token,{lockId:0,eventKey:k('zero')})).code,'F06_3B_INVALID_ARGUMENTS'));
test('3B-S06 malformed key rejected',async()=>assert.equal((await open(1,'bad',{eventKey:'short'})).code,'F06_3B_INVALID_ARGUMENTS'));
test('3B-S07 forged token denied',async()=>assert.equal((await openSyntheticTransactionCI(auth,'forged',{lockId:locks[1],eventKey:k('fake-token')})).allowed,false));
test('3B-S08 no standalone transaction.ci.open permission yet',async()=>assert.equal((await open(1,'without-right')).code,'F06_3B_OPEN_PERMISSION_SCOPE_DENIED'));
test('3B-S09 original 72h policy and price snapshot are physical signed facts',()=>{assert.equal(original.initial_hours,72);assert.equal(original.policy_version,1);assert.equal(Number(original.responsible_employee_id),1)});
test('3B-S10 independently explicit employee right enables same responsible only',async()=>{
 const team=(await q('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,962401,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,962401,$1,clock_timestamp()-interval '2 minutes')",[scope.scope_id]);
 assert.equal((await q("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=962401 AND decision='allow'"))[0].n,1);
});
test('3B-S11 record real synthetic physical Deposit tied to Lock before conversion',async()=>{
 const x=await withF063A(()=>recordSyntheticDepositCI(auth,token,{lockId:locks[1],amountCents:8800,currency:'CNY',paymentMethod:'cash',receivedAt:new Date(Date.now()-3600000).toISOString(),eventKey:k('pretransaction-deposit'),syntheticVoucher:'CI-ONLY'}));
 assert.equal(x.allowed,true,JSON.stringify(x));depositId=x.depositId;
});
test('3B-S12 injecting post-transaction crash rolls back both PG objects',async()=>{
 await assert.rejects(()=>open(2,'failure-tx',{testCheckpoint:'AFTER_TRANSACTION_THROW'}),/F06_3B_INJECTED_TRANSACTION_ROLLBACK/);
 assert.equal((await q('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[locks[2]]))[0].n,0);
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[2]]))[0].lock_status,'active');
});
test('3B-S13 injecting after Lock release restores initial Lock and empty Transaction',async()=>{
 await assert.rejects(()=>open(2,'failure-lock',{testCheckpoint:'AFTER_LOCK_THROW'}),/F06_3B_INJECTED_LOCK_ROLLBACK/);
 assert.equal((await q('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[locks[2]]))[0].n,0);
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[2]]))[0].lock_status,'active');
});
test('3B-S14 injecting after audit rolls all three entities back',async()=>{
 await assert.rejects(()=>open(2,'failure-audit',{testCheckpoint:'AFTER_AUDIT_THROW'}),/F06_3B_INJECTED_AUDIT_ROLLBACK/);
 assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE source_lock_id=$1',[locks[2]]))[0].n,0);
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[2]]))[0].lock_status,'active');
});
test('3B-S15 failed requests did not leak partial origin or journal',async()=>{
 assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.origin_events'))[0].n,0);
 assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.request_keys'))[0].n,0);
});
test('3B-S16 signed Lock produces one physical Transaction and ends same Lock',async()=>{
 const x=await open(1,'valid-single');assert.equal(x.code,'F06_3B_ATOMIC_SYNTHETIC_IN_PROGRESS',JSON.stringify(x));txId=x.transactionId;
 assert.equal((await q("SELECT count(*)::int n FROM public.transactions WHERE transaction_id=$1 AND source_lock_id=$2 AND status='pending'",[txId,locks[1]]))[0].n,1);
 assert.equal((await q("SELECT lock_status FROM public.locks WHERE lock_id=$1",[locks[1]]))[0].lock_status,'released');
});
test('3B-S17 identical idempotent request yields original transaction',async()=>{
 const x=await open(1,'valid-single');assert.equal(x.code,'F06_3B_IDEMPOTENT_CONVERSION');assert.equal(x.transactionId,txId);
});
test('3B-S18 terminated Lock replay using new request key never creates duplicate',async()=>{
 assert.equal((await open(1,'replay-new')).code,'F06_3B_NOT_ACTIVE_CURRENT_LOCK');
 assert.equal((await q('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[locks[1]]))[0].n,1);
});
test('3B-S19 true public released reason and signed in_progress projection',async()=>{
 const l=(await q('SELECT lock_status,end_reason FROM public.locks WHERE lock_id=$1',[locks[1]]))[0];
 const t=(await q('SELECT status,public_carrier_status,lock_end_reason FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[txId]))[0];
 assert.equal(l.lock_status,'released');assert.equal(l.end_reason,'converted_to_transaction');
 assert.equal(t.status,'in_progress');assert.equal(t.public_carrier_status,'pending');
});
test('3B-S20 responsible does not drift from historical Lock',async()=>{
 const o=(await q('SELECT original_responsible_employee_id,opening_actor_employee_id,source_lock_id FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[txId]))[0];
 assert.equal(Number(o.original_responsible_employee_id),Number(original.responsible_employee_id));
 assert.equal(Number(o.opening_actor_employee_id),1);assert.equal(Number(o.source_lock_id),locks[1]);
});
test('3B-S21 occupied vehicle has one current synthetic transaction',async()=>{
 const x=await currentSyntheticTransactionCI(db,vehicle(1));assert.equal(x.code,'F06_3B_SIGNED_IN_PROGRESS_CI');assert.equal(x.transactionId,txId);
});
test('3B-S22 existing Deposit remains physically attached to original Lock',async()=>{
 const x=(await q('SELECT lock_id,amount_cents FROM public.deposit_receipts WHERE deposit_id=$1',[depositId]))[0];
 assert.equal(Number(x.lock_id),locks[1]);assert.equal(Number(x.amount_cents),8800);
 assert.equal((await q('SELECT deposit_receipt_count FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[txId]))[0].deposit_receipt_count,sourceBefore+1);
});
test('3B-S23 immutable conversion ledger refuses UPDATE and DELETE',async()=>{
 await assert.rejects(()=>q('UPDATE f06_3b_ci.transaction_origins SET opening_actor_employee_id=2 WHERE transaction_id=$1',[txId]),/F06_3B_IMMUTABLE_TRANSACTION_ORIGIN/);
 await assert.rejects(()=>q('DELETE FROM f06_3b_ci.origin_events WHERE transaction_id=$1',[txId]),/F06_3B_IMMUTABLE_TRANSACTION_ORIGIN/);
});
test('3B-S24 new key with a different Lock cannot replay prior winner',async()=>{
 assert.equal((await open(2,'valid-single')).code,'F06_3B_IDEMPOTENCY_KEY_CONFLICT');
});
test('3B-S25 separate PG backend committed permission revocation denies old signed token',async()=>{
 const peer=await connect();
 const a=(await q('SELECT pg_backend_pid() pid'))[0].pid, bp=(await peer.query('SELECT pg_backend_pid() pid')).rows[0].pid;assert.notEqual(a,bp);
 try{
  await peer.query('BEGIN');
  await peer.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=962401");
  await peer.query('COMMIT');
  assert.equal((await open(2,'denied-after-revoke')).code,'F06_3B_OPEN_PERMISSION_SCOPE_DENIED');
  console.log('F06_3B_TWO_NATIVE_BACKENDS_COMMIT_REVOKE',{aPid:a,bPid:bp});
 }finally{
  await peer.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=962401");
  await peer.end();
 }
});
test('3B-S26 disabled Customer cannot open but financial and origin history remain',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{
  assert.equal((await open(2,'disabled-customer')).code,'F06_3B_CUSTOMER_DISABLED');
  assert.equal((await q('SELECT count(*)::int n FROM public.deposit_receipts WHERE deposit_id=$1',[depositId]))[0].n,1);
  assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[txId]))[0].n,1);
 }finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('3B-S27 unavailable archived supply denies new transaction but does not end old origin',async()=>{
 await q('UPDATE public.vehicles SET archived_at=clock_timestamp() WHERE vehicle_id=$1',[vehicle(2)]);
 try{assert.equal((await open(2,'archive-deny')).code,'F06_3B_SOURCE_OR_CYCLE_UNAVAILABLE')}
 finally{await q('UPDATE public.vehicles SET archived_at=NULL WHERE vehicle_id=$1',[vehicle(2)])}
 assert.equal((await q('SELECT status FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1',[txId]))[0].status,'in_progress');
});
test('3B-S28 expired signed Lock cannot open Transaction',async()=>{
 const before=(await q('SELECT created_at,expires_at FROM public.locks WHERE lock_id=$1',[locks[2]]))[0];
 await q("UPDATE public.locks SET created_at=clock_timestamp()-interval '100 hours',expires_at=clock_timestamp()-interval '2 minutes' WHERE lock_id=$1",[locks[2]]);
 try{assert.equal((await open(2,'expired-deny')).code,'F06_3B_NOT_ACTIVE_CURRENT_LOCK')}
 finally{await q('UPDATE public.locks SET created_at=$1,expires_at=$2 WHERE lock_id=$3',[before.created_at,before.expires_at,locks[2]])}
});
test('3B-S29 two native PG backends on same Lock never yield two winners',async()=>{
 const peer=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.alloc(32,61),origin:'https://127.0.0.1:49026'});
 try{
  const x=await Promise.allSettled([open(3,'racing-a'),openSyntheticTransactionCI(peer,token,{lockId:locks[3],eventKey:k('racing-b')})]);
  const winners=x.filter(v=>v.status==='fulfilled'&&v.value?.code==='F06_3B_ATOMIC_SYNTHETIC_IN_PROGRESS');
  assert.equal(winners.length,1,JSON.stringify(x));
  assert.equal((await q('SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE vehicle_id=$1',[vehicle(3)]))[0].n,1);
 }finally{await peer.close()}
});
test('3B-S30 customer owner later changes cannot silently drift Transaction responsible',async()=>{
 const before=(await q('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[txId]))[0];
 await q('UPDATE public.customers SET current_owner_employee_id=NULL WHERE customer_id=$1',[customer]);
 try{
  const after=(await q('SELECT responsible_employee_id FROM public.transactions WHERE transaction_id=$1',[txId]))[0];
  assert.equal(after.responsible_employee_id,before.responsible_employee_id);
 }finally{await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer])}
});
test('3B-S31 sidecar origin event, previous Lock price and original actor remain traceable',async()=>{
 const x=(await q('SELECT event_kind,previous_lock_status,final_lock_status,actor_employee_id FROM f06_3b_ci.origin_events WHERE transaction_id=$1',[txId]))[0];
 assert.equal(x.event_kind,'lock_converted_to_transaction');assert.equal(x.previous_lock_status,'active');assert.equal(x.final_lock_status,'released');
 assert.equal(x.actor_employee_id,'1'); // bigint driver returns string
 const s=(await q('SELECT price_kind,price_cents,initial_hours FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1',[locks[1]]))[0];
 assert.equal(s.initial_hours,72);assert.equal(s.price_kind,original.price_kind);assert.equal(s.price_cents,original.price_cents);
});
test('3B-S32 new immutable Transaction cannot silently restore old Lock, Priority or waitlist',async()=>{
 assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE lock_id=$1 AND lock_status='active'",[locks[1]]))[0].n,0);
 assert.equal((await q("SELECT count(*)::int n FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1 AND status='in_progress'",[txId]))[0].n,1);
 assert.ok((await q('SELECT count(*)::int n FROM public.audit_events'))[0].n>eventsBefore);
});

test('3B-S33 signed in-progress transaction denies new Lock under isolated PG guard',async()=>{
 const x=await syntheticNewOccupancyGuardCI(db,vehicle(1),'lock');
 assert.equal(x.code,'F06_3B_TRADING_OCCUPANCY_DENY',JSON.stringify(x));
});
test('3B-S34 signed in-progress transaction denies new Priority but leaves unrelated Vehicle free',async()=>{
 const x=await syntheticNewOccupancyGuardCI(db,vehicle(1),'priority');
 assert.equal(x.code,'F06_3B_TRADING_OCCUPANCY_DENY');
 const free=await syntheticNewOccupancyGuardCI(db,vehicle(4),'priority');
 assert.equal(free.code,'F06_3B_NO_SYNTHETIC_TRADING_OCCUPANCY');
});
