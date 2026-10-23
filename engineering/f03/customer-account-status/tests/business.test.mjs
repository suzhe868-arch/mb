import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CustomerAccountStatusService} from '../../../src/f03-customer-account-status-service.mjs';
import {connect} from '../environment.mjs';
import {verifyScopeDatabase} from '../../runtime-scope/readiness.mjs';

let auth,pool,service,admin,manager,storeManager,sales,fourS,limited,managerPassword='SyntheticManager_2026!';
const key=()=>randomUUID().replaceAll('-','');
const reason='CI synthetic account governance only';
const sql=(s,v=[])=>pool.query(s,v);
const status=async()=> (await sql('SELECT account_status FROM public.customers WHERE customer_id=301')).rows[0].account_status;
const demands=async()=> (await sql('SELECT demand_id::text AS id,demand_state FROM public.demands WHERE customer_id=301 ORDER BY demand_id')).rows;
const cnt=async query=>Number((await sql(query)).rows[0].n);
const run=(token,action='disable',customerId='301',requestKey=key(),why=reason)=>service[action]({token,customerId,requestKey,reason:why});
const reset=async()=>{
 await sql("UPDATE public.customers SET account_status='active' WHERE customer_id=301");
 await sql("UPDATE public.demands SET demand_state='active' WHERE demand_id IN (501,502)");
 await sql("UPDATE public.demands SET demand_state='paused' WHERE demand_id=503");
 await sql("UPDATE public.demands SET demand_state='completed' WHERE demand_id=504");
 await sql("UPDATE public.demands SET demand_state='cancelled' WHERE demand_id=505");
};
before(async()=>{
 pool=await connect();await verifyScopeDatabase(pool);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:4391'});
 const creds=[
  ['admin_test','SyntheticAdmin_1234567'],
  ['manager_account_ci',managerPassword],
  ['store_manager_account_ci','SyntheticStoreManager_2026!'],
  ['race_test','SyntheticRace_1234567'],
  ['four_s_test','SyntheticFourS_123456'],
  ['limit_test','SyntheticLimit_1234567']
 ];
 const tokens=[];
 for(const [login,password] of creds){const x=await auth.login({login,password,source:'f03-account-status-business-'+login});assert.equal(x.code,'AUTH_OK');assert.equal(x.restricted,false);tokens.push(x.token)}
 [admin,manager,storeManager,sales,fourS,limited]=tokens;
 service=new CustomerAccountStatusService(auth);
});
after(async()=>{await auth?.close();await pool?.end()});
test('01 isolated SG01 PG16/one-current-SHA private attestation is valid',async()=>{
 assert.equal((await verifyScopeDatabase(pool)).verified,true);
 const row=(await sql("SELECT current_user,current_setting('server_version_num')::int AS ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS super")).rows[0];
 assert.equal(row.current_user,'f03_ci');assert.equal(row.super,false);assert.ok(row.ver>=160000&&row.ver<170000);
});
test('02 System Admin can read current customer state but no CRM fields',async()=>{
 const x=await service.read({token:admin,customerId:'301'});assert.equal(x.status,200);
 assert.equal(x.accountStatus,'active');assert.equal(x.demandCounts.active,2);
 assert.equal(JSON.stringify(x).includes('phone'),false);
});
test('03 manager and store manager valid object-scope reads',async()=>{
 assert.equal((await service.read({token:manager,customerId:'301'})).status,200);
 assert.equal((await service.read({token:storeManager,customerId:'301'})).status,200);
});
test('04 invalid, unknown and unsupported Customer reject',async()=>{
 assert.equal((await service.read({token:admin,customerId:'0'})).status,400);
 assert.equal((await service.read({token:admin,customerId:'999999'})).status,404);
 assert.equal((await service.read({token:admin,customerId:'-1'})).status,400);
});
test('05 4S hard deny despite role default and explicit object grant',async()=>{
 const x=await run(fourS);assert.equal(x.status,403);assert.equal(x.code,'FOUR_S_HARD_DENY');assert.equal(await status(),'active');
});
test('06 ordinary sales without explicit allow and scope cannot govern',async()=>{assert.equal((await run(limited)).status,403)});
test('07 manager without Customer object scope cannot govern different customer',async()=>{
 assert.equal((await run(manager,'disable','302')).code,'CUSTOMER_OBJECT_SCOPE_DENIED');
 assert.equal((await sql('SELECT account_status FROM public.customers WHERE customer_id=302')).rows[0].account_status,'active');
});
let initialKey,initialResult;
test('08 System Admin disables account and atomically pauses all active Demands',async()=>{
 await reset();initialKey=key();initialResult=await run(admin,'disable','301',initialKey);
 assert.equal(initialResult.status,200);assert.equal(initialResult.pausedDemandCount,2);assert.deepEqual(initialResult.pausedDemandIds,['501','502']);
 assert.equal(await status(),'inactive');
 assert.deepEqual((await demands()).map(r=>r.demand_state),['paused','paused','paused','completed','cancelled']);
});
test('09 immutable customer and per-Demand audit evidence exists',async()=>{
 const x=(await sql("SELECT actor_kind,actor_id,role_context,before_json,after_json FROM public.audit_events WHERE action='customer.account.disable' AND role_context->>'requestKeySha256' IS NOT NULL ORDER BY audit_id DESC LIMIT 1")).rows[0];
 assert.equal(x.actor_kind,'system_admin');assert.equal(x.actor_id,'9');
 assert.equal(x.after_json.pausedDemandCount,2);assert.deepEqual(x.after_json.pausedDemandIds,['501','502']);
 assert.equal(await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable.demand_pause' AND object_id IN ('501','502')"),2);
});
test('10 same request key same payload does not duplicate audit or business events',async()=>{
 const beforeCount=await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable'");
 assert.deepEqual(await run(admin,'disable','301',initialKey),initialResult);
 assert.equal(await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable'"),beforeCount);
});
test('11 same key with changed payload returns conflict',async()=>{
 assert.equal((await run(admin,'disable','301',initialKey,'Another synthetic reason')).status,409);
});
test('12 restoration opens account but never reactivates paused/completed/cancelled Demands',async()=>{
 const x=await run(admin,'restore');assert.equal(x.status,200);assert.equal(x.pausedDemandCount,0);assert.equal(await status(),'active');
 assert.deepEqual((await demands()).map(r=>r.demand_state),['paused','paused','paused','completed','cancelled']);
});
test('13 no-op restoration leaves audit unchanged',async()=>{
 const n=await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.restore'");
 assert.equal((await run(admin,'restore')).code,'NO_CHANGE');
 assert.equal(await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.restore'"),n);
});
test('14 manager with current role default and object binding can disable',async()=>{
 await reset();assert.equal((await run(manager)).status,200);assert.equal(await status(),'inactive');
});
test('15 store_manager can restore only account status',async()=>{
 assert.equal((await run(storeManager,'restore')).status,200);
 assert.deepEqual((await demands()).slice(0,2).map(x=>x.demand_state),['paused','paused']);
});
test('16 personal deny precedes role default allow',async()=>{
 await reset();
 await sql("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(10,31,'deny',now())");
 const x=await run(manager);assert.equal(x.status,403);assert.equal(x.code,'PERSONAL_DENY');
 assert.equal(await status(),'active');
 await sql('DELETE FROM public.employee_permission_overrides WHERE employee_id=10 AND permission_id=31');
});
test('17 explicitly authorized sales can perform both actions',async()=>{
 await reset();assert.equal((await run(sales)).status,200);assert.equal((await run(sales,'restore')).status,200);
});
test('18 employee lifecycle inactive invalidates previously issued session',async()=>{
 await sql("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=10");
 assert.equal((await run(manager)).status,401);
 await sql("UPDATE public.employees SET employment_status='active' WHERE employee_id=10");
});
test('19 disabled PC credentials invalidate existing session',async()=>{
 await sql("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE employee_id=10");
 assert.equal((await run(manager)).status,401);
 await sql("UPDATE public.pc_login_accounts SET credential_state='enabled' WHERE employee_id=10");
});
test('20 forced-password-change session cannot mutate',async()=>{
 await sql("UPDATE public.pc_login_accounts SET force_password_change=true WHERE employee_id=10");
 assert.equal((await run(manager)).code,'FORCE_PASSWORD_CHANGE_REQUIRED');
 await sql("UPDATE public.pc_login_accounts SET force_password_change=false WHERE employee_id=10");
});
test('21 ended object Scope denies mutation',async()=>{
 await sql("UPDATE public.employee_data_scopes SET ended_at=now()-interval '1 second' WHERE scope_id=201");
 assert.equal((await run(manager)).code,'CUSTOMER_OBJECT_SCOPE_DENIED');
 await sql("UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=201");
});
test('22 ended capability Binding denies mutation',async()=>{
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=now()-interval '1 second' WHERE scope_id=201 AND permission_id=31");
 assert.equal((await run(manager)).code,'CUSTOMER_OBJECT_SCOPE_DENIED');
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=201 AND permission_id=31");
});
test('23 role default revocation denies manager immediately',async()=>{
 await sql("UPDATE public.role_permission_defaults SET enabled=false WHERE role_id=3 AND permission_id=31");
 assert.equal((await run(manager)).code,'CAPABILITY_DENIED');
 await sql("UPDATE public.role_permission_defaults SET enabled=true WHERE role_id=3 AND permission_id=31");
});
test('24 invalid token/request key/reason fail without side effects',async()=>{
 assert.equal((await run('bad')).status,401);
 assert.equal((await run(manager,'disable','301','short')).status,400);
 assert.equal((await run(manager,'disable','301',key(),'x')).status,400);
});
test('25 injected audit failure rolls back Customer and all Demand updates',async()=>{
 await reset();const beforeAudit=await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable'");
 const broken=new CustomerAccountStatusService(auth,{beforeAuditInsert:async()=>{throw Error('CI_INJECTED_FAILURE')}});
 const x=await broken.disable({token:manager,customerId:'301',requestKey:key(),reason});assert.equal(x.status,503);
 assert.equal(await status(),'active');
 assert.equal((await demands()).filter(d=>d.demand_state==='active').length,2);
 assert.equal(await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable'"),beforeAudit);
});
test('26 concurrent same-key requests serialize into one status change and audit',async()=>{
 await reset();const k=key(),n=await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable'");
 const results=await Promise.all([run(manager,'disable','301',k),run(manager,'disable','301',k)]);
 assert.equal(results[0].status,200);assert.deepEqual(results[0],results[1]);
 assert.equal(await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.disable'"),n+1);
});
test('27 inactive customer and new active Demand inconsistent state fails closed',async()=>{
 await sql("UPDATE public.demands SET demand_state='active' WHERE demand_id=501");
 assert.equal((await run(admin,'disable')).code,'INACTIVE_CUSTOMER_HAS_ACTIVE_DEMAND');
 await sql("UPDATE public.demands SET demand_state='paused' WHERE demand_id=501");
});
test('28 disable and restore concurrently serialize, preserve paused history',async()=>{
 await reset();
 const results=await Promise.all([run(manager,'disable'),run(admin,'restore')]);
 assert.ok(results.every(x=>x.status===200));
 const state=await status();
 assert.ok(['active','inactive'].includes(state));
 assert.equal((await demands()).filter(x=>x.demand_state==='active').length,0);
});
test('29 permission deny commits before management attempt and leaves no audit',async()=>{
 await reset();
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=6 AND permission_id=31");
  const pending=run(sales);
  await new Promise(r=>setTimeout(r,70));
  await c.query('COMMIT');
  const x=await pending;assert.equal(x.code,'PERSONAL_DENY');
  assert.equal(await status(),'active');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();
  await sql("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=6 AND permission_id=31")}
});
test('30 paused Demand never reactivates on second restore',async()=>{
 await reset();await run(admin,'disable');await run(admin,'restore');
 assert.equal((await run(admin,'restore')).code,'NO_CHANGE');
 assert.equal((await demands()).filter(x=>x.demand_state==='active').length,0);
});
test('31 database still has original public SG01 structure',async()=>{assert.equal((await verifyScopeDatabase(pool)).verified,true)});

test('32 first no-op request has one durable key proof; replay does not duplicate audit',async()=>{
 await reset();const k=key();const before=await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.no_change'");
 const a=await run(admin,'restore','301',k);
 assert.equal(a.code,'NO_CHANGE');assert.deepEqual(await run(admin,'restore','301',k),a);
 assert.equal(await cnt("SELECT count(*)::int n FROM public.audit_events WHERE action='customer.account.no_change'"),before+1);
 assert.equal((await run(admin,'restore','301',k,'Changed payload for key')).code,'IDEMPOTENCY_KEY_CONFLICT');
});
test('33 activation transaction wins Customer row lock; subsequently disabling pauses its new Demand',async()=>{
 await reset();const c=await pool.connect();let pending;
 try{
  await c.query('BEGIN');
  const row=(await c.query('SELECT account_status FROM public.customers WHERE customer_id=301 FOR UPDATE')).rows[0];
  assert.equal(row.account_status,'active');
  await c.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(601,301,1,'active','{}'::jsonb)");
  pending=run(admin,'disable');await new Promise(r=>setTimeout(r,70));
  await c.query('COMMIT');
  const a=await pending;assert.equal(a.status,200);assert.ok(a.pausedDemandIds.includes('601'));
  assert.equal((await sql('SELECT demand_state FROM public.demands WHERE demand_id=601')).rows[0].demand_state,'paused');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();if(pending)await pending.catch(()=>{})}
 assert.equal((await run(admin,'restore')).status,200);
});
test('34 disable wins Customer row lock; competing activation must read inactive and abort',async()=>{
 await reset();let release;let entered;
 const gate=new Promise(r=>{release=r}),reached=new Promise(r=>{entered=r});
 const gated=new CustomerAccountStatusService(auth,{beforeAuditInsert:async()=>{entered();await gate}});
 const pending=gated.disable({token:admin,customerId:'301',reason,requestKey:key()});
 await reached;
 const c=await pool.connect();let activating;
 try{
  await c.query('BEGIN');
  activating=c.query('SELECT account_status FROM public.customers WHERE customer_id=301 FOR UPDATE');
  await new Promise(r=>setTimeout(r,70));release();
  assert.equal((await pending).status,200);
  const state=(await activating).rows[0].account_status;
  assert.equal(state,'inactive');
  await c.query('ROLLBACK');
 }finally{release();await c.query('ROLLBACK').catch(()=>{});c.release();if(activating)await activating.catch(()=>{});await pending.catch(()=>{})}
 assert.equal((await sql('SELECT count(*)::int n FROM public.demands WHERE demand_id=602')).rows[0].n,0);
 assert.equal((await run(admin,'restore')).status,200);
});
test('35 concurrent Customer Scope revocation commits before attempted disable',async()=>{
 await reset();const c=await pool.connect();let pending;
 try{
  await c.query('BEGIN');
  await c.query("UPDATE public.employee_data_scopes SET ended_at=transaction_timestamp() WHERE scope_id=201");
  pending=run(manager);await new Promise(r=>setTimeout(r,70));
  await c.query('COMMIT');
  const a=await pending;assert.equal(a.code,'CUSTOMER_OBJECT_SCOPE_DENIED');assert.equal(await status(),'active');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();if(pending)await pending.catch(()=>{});
  await sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=201')}
});
