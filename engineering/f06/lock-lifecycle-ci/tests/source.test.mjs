import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify,withParentBranch} from '../migration.mjs';
import {employeeLifecycleCI,expireOrdinaryCI,CI_SYSTEM_PROOF,productionIssuerDeny,customerProjectionCI} from '../service.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
const url=process.env.F03_1_DATABASE_URL,secret=Buffer.alloc(32,61);
const db=await connect(),q=(sql,args=[])=>db.query(sql,args).then(r=>r.rows);
const auth=new IsolatedAuth({connectionString:url,secret,origin:'https://127.0.0.1:49026'});
const proof='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const key=tag=>'f06-2-native-pg16-'+tag+'-'+process.env.GITHUB_RUN_ID;
const customer=n=>86180100+n,vehicle=n=>86181100+n,cycle=n=>86182100+n;
let token,locks={},waitBefore,initial;
const actor=(lockId,action,tag,extra={})=>employeeLifecycleCI(auth,token,{lockId,action,eventKey:key(tag),reason:'synthetic documented '+tag,...extra});
const system=lockId=>expireOrdinaryCI(db,{lockId,ciSystemProof:CI_SYSTEM_PROOF});
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 let manager=(await q("SELECT role_id FROM public.roles WHERE role_code='manager' LIMIT 1"))[0];
 if(!manager)manager=(await q("INSERT INTO public.roles(role_id,role_code) VALUES(961802,'manager') RETURNING role_id"))[0];
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[manager.role_id]);
 const team=(await q("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
 assert.ok(team,'signed Employee current team');
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 assert.ok(scope,'signed Employee current scope');
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(961803,'lock.ci.manage')");
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,961803,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,961803,$1,clock_timestamp()-interval '2 minutes')",[scope.scope_id]);
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-2-isolated-only'});
 assert.equal(login.code,'AUTH_OK',JSON.stringify(login));token=login.token;
 for(let n=1;n<=8;n++){
  const r=await withParentBranch(()=>intakeCI(db,{customerId:customer(1),vehicleId:vehicle(n),listingCycleId:cycle(n),requestKey:key('make-'+n),syntheticPhoneConsent:proof}));
  assert.equal(r.code,'F06_1_PENDING_CREATED',JSON.stringify({n,r}));
  if(n===5){
   const rival=await withParentBranch(()=>intakeCI(db,{customerId:customer(2),vehicleId:vehicle(n),listingCycleId:cycle(n),requestKey:key('rival5'),syntheticPhoneConsent:proof}));
   assert.equal(rival.code,'F06_1_PENDING_CREATED',JSON.stringify(rival));
  }
  const a=await withParentBranch(()=>decisionCI(auth,token,{requestId:r.requestId,requestKey:key('approve-'+n),action:'approve'}));
  assert.equal(a.code,'F06_1_APPROVED_ATOMIC_LOCK',JSON.stringify({n,a}));locks[n]=a.lockId;
 }
 for(const n of [1,2,3,4,5,6,7])await q("INSERT INTO f06_2_ci.finance_proofs(lock_id,proof_kind) VALUES($1,'synthetic_absence_confirmed')",[locks[n]]);
 initial=(await q("SELECT l.*,s.* FROM public.locks l JOIN f06_1_lock_ci.lock_snapshots s USING(lock_id) WHERE l.lock_id=$1",[locks[1]]))[0];
 waitBefore=await q('SELECT waitlist_id,responsible_employee_id FROM public.waitlists WHERE vehicle_id=$1 AND ended_at IS NULL ORDER BY waitlist_id',[vehicle(5)]);
 assert.equal(waitBefore.length,1,'existing Waitlist from atomic approval');
});
test.after(async()=>{await db.end();await auth.close()});
test('62-S01 signed v26 and v27 parent unchanged',async()=>{
 const r=await verify(db);assert.equal(r.verified,true);assert.equal(r.nonProduction,true);
 assert.equal(r.originalCatalogSHA,'5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')
});
test('62-S02 true nonprivileged PG16 and 24 signed Ledger',async()=>{
 const r=(await q("SELECT current_database() db,current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su"))[0];
 assert.equal(r.db,'f03_auth_test');assert.equal(r.u,'f03_ci');assert.equal(r.su,false);assert.ok(r.v>=160000&&r.v<170000);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24)
});
test('62-S03 real signed Lock price and 72h ownership snapshot',async()=>{
 assert.equal(Number(initial.responsible_employee_id),4);
 assert.equal(Number(initial.approver_employee_id),1);
 assert.equal(initial.price_kind,'numeric');assert.equal(Number(initial.price_cents),6500000);
 assert.equal(initial.initial_hours,72);assert.equal(initial.policy_version,1)
});
test('62-S04 live production Lock, Employee and money issuers deny',()=>{
 assert.deepEqual(productionIssuerDeny(),{allowed:false,code:'F06_2_PRODUCTION_LOCK_AND_MONEY_ISSUERS_NOT_WIRED'})
});
test('62-S05 absent synthetic Deposit proof is not no money',async()=>{
 const r=await actor(locks[8],'extend','missing8',{extendHours:2});
 assert.equal(r.code,'F06_2_DEPOSIT_ISSUER_SOURCE_GAP_UNKNOWN_DENY',JSON.stringify(r))
});
test('62-S06 explicit unknown money status cannot permit extension',async()=>{
 await q("UPDATE f06_2_ci.finance_proofs SET proof_kind='unknown' WHERE lock_id=$1",[locks[7]]);
 const r=await actor(locks[7],'extend','unknown7',{extendHours:2});
 assert.equal(r.code,'F06_2_DEPOSIT_ISSUER_SOURCE_GAP_UNKNOWN_DENY',JSON.stringify(r))
});
test('62-S07 known present funds cannot release by ordinary service',async()=>{
 await q("UPDATE f06_2_ci.finance_proofs SET proof_kind='present' WHERE lock_id=$1",[locks[7]]);
 const r=await actor(locks[7],'release','present7');
 assert.equal(r.code,'F06_2_EXISTING_DEPOSIT_DENY',JSON.stringify(r));
 assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[7]]))[0].lock_status,'active')
});
test('62-S08 physical signed Deposit receipt overrides synthetic no-funds',async()=>{
 await q('INSERT INTO public.deposit_receipts(customer_id,lock_id,amount_cents,recorded_by) VALUES($1,$2,16000,1)',[customer(1),locks[6]]);
 const r=await actor(locks[6],'extend','receipt6',{extendHours:2});
 assert.equal(r.code,'F06_2_EXISTING_SIGNED_MONEY_OR_TRANSACTION_DENY',JSON.stringify(r));
 assert.equal((await system(locks[6])).code,'F06_2_EXISTING_SIGNED_MONEY_OR_TRANSACTION_DENY')
});
test('62-S09 real PG lifecycle update',async()=>{const r=await actor(locks[1],'extend','extend1',{extendHours:6});assert.equal(r.code,'F06_2_EXTEND_COMMITTED',JSON.stringify(r));});
test('62-S10 initial price policy and responsible snapshot are preserved',async()=>{const z=(await q('SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1',[locks[1]]))[0];assert.equal(z.initial_hours,72);assert.equal(z.policy_version,1);assert.equal(Number(z.price_cents),6500000);assert.equal(Number(z.responsible_employee_id),4);const e=(await q('SELECT old_expires_at,new_expires_at,event_kind FROM f06_2_ci.lifecycle_events WHERE lock_id=$1',[locks[1]]))[0];assert.equal(e.event_kind,'extend');assert.equal(e.new_expires_at.getTime()-e.old_expires_at.getTime(),21600000)});
test('62-S11 duplicate event key is idempotent',async()=>{const r=await actor(locks[1],'extend','extend1',{extendHours:6});assert.equal(r.code,'F06_2_IDEMPOTENT_REPLAY',JSON.stringify(r));assert.equal((await q('SELECT count(*)::int n FROM f06_2_ci.lifecycle_events WHERE lock_id=$1',[locks[1]]))[0].n,1)});
test('62-S12 replay key cannot affect a second Lock',async()=>{const r=await actor(locks[2],'extend','extend1',{extendHours:2});assert.equal(r.code,'F06_2_KEY_REUSED_FOR_DIFFERENT_ACTION_OR_LOCK',JSON.stringify(r))});
test('62-S13 missing reason rejected',async()=>{const x=await employeeLifecycleCI(auth,token,{lockId:locks[2],action:'release',eventKey:key('no-reason'),reason:'x'});assert.equal(x.code,'F06_2_BAD_EMPLOYEE_MUTATION')});
test('62-S14 unsigned signed-session denial',async()=>{const r=await employeeLifecycleCI(auth,'untrusted-session',{lockId:locks[2],action:'release',eventKey:key('untrusted'),reason:'invalid actor source'});assert.equal(r.allowed,false)});
test('62-S15 native PG clock refuses early automatic release',async()=>{const r=await system(locks[2]);assert.equal(r.code,'F06_2_PG_CLOCK_NOT_EXPIRED',JSON.stringify(r))});
test('62-S16 source has one active Lock before expiry',async()=>{assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[vehicle(2)]))[0].n,1)});
test('62-S17 PG clock elapsed ordinary Lock can expire',async()=>{await q("UPDATE public.locks SET created_at=clock_timestamp()-interval '100 hours',expires_at=clock_timestamp()-interval '1 minute' WHERE lock_id=$1",[locks[2]]);const r=await system(locks[2]);assert.equal(r.code,'F06_2_PG_CLOCK_EXPIRED',JSON.stringify(r));console.log('F06_2_NATIVE_PG_CLOCK_EXPIRY',{pid:r.backendPid})});
test('62-S18 second system expiry cannot revive terminal Lock',async()=>{const r=await system(locks[2]);assert.equal(r.code,'F06_2_SYSTEM_TERMINAL_REPLAY',JSON.stringify(r));assert.equal((await q("SELECT count(*)::int n FROM f06_2_ci.lifecycle_events WHERE lock_id=$1 AND event_kind='expire'",[locks[2]]))[0].n,1)});
test('62-S19 signed manager release has original status and actor event',async()=>{const r=await actor(locks[5],'release','release5');assert.equal(r.code,'F06_2_RELEASE_COMMITTED',JSON.stringify(r));const e=(await q('SELECT * FROM f06_2_ci.lifecycle_events WHERE lock_id=$1',[locks[5]]))[0];assert.equal(e.old_status,'active');assert.equal(e.new_status,'released');assert.equal(Number(e.actor_employee_id),1)});
test('62-S20 existing Waitlist remains after release, never new Lock',async()=>{const w=await q('SELECT waitlist_id,responsible_employee_id FROM public.waitlists WHERE vehicle_id=$1 AND ended_at IS NULL ORDER BY waitlist_id',[vehicle(5)]);assert.deepEqual(w,waitBefore);assert.equal((await q("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[vehicle(5)]))[0].n,0)});
test('62-S21 Customer disabled cannot trigger manual cancellation',async()=>{await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer(1)]);try{const r=await actor(locks[3],'cancel','disabled3');assert.equal(r.code,'F06_2_CUSTOMER_DISABLED_MANUAL_DENY',JSON.stringify(r));assert.equal((await q('SELECT lock_status FROM public.locks WHERE lock_id=$1',[locks[3]]))[0].lock_status,'active')}finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer(1)])}});
