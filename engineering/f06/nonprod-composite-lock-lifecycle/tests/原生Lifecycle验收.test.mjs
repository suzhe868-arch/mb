// Issue171 new genuine PG16 + HTTP lifecycle execution, not mock or production.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash,randomBytes} from 'node:crypto';
import pg from 'pg';
import {createFoundationServer} from '../../../src/app.mjs';
import {hashPassword,newOpaqueToken,sessionDigest} from '../../../src/f03-auth-crypto.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createIsolatedF06CompositeRuntime,verifyCompositeRuntimeDatabase} from '../../../src/f06-nonprod-composite-runtime.mjs';
import {createIsolatedF06LockLifecycleService} from '../../../src/f06-lock-lifecycle-service.mjs';
import {assertCompositeSignedRun} from '../../nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {verifyLifecycleIssuer} from '../可信LifecycleIssuer.mjs';
import {recordSyntheticDepositComposite} from '../../deposit-ledger-ci/service.mjs';
import {openSyntheticTransactionComposite} from '../../lock-transaction-http-pg16/service.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const sha=x=>createHash('sha256').update(x).digest('hex');
function envSetup(){
 Object.assign(process.env,{
  APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',CI:'true',GITHUB_ACTIONS:'true',
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F03_1_DATABASE_URL:DSN,
  F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
  F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY',
  F06_COMPOSITE_SIGNED_ISSUER:'COMPOSITE_NONPROD_SIGNED_V1',
  F06_LOCK_LIFECYCLE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY',
  F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY',
  F06_LOCK_LIFECYCLE_FAULT_INJECTION:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_FAULTS'
 });
 const secret=randomBytes(32);
 process.env.F03_1_HMAC_KEY_BASE64=secret.toString('base64');
 return secret;
}
async function seedEmployeeScope(db,employeeId,teamId,permissionIds){
 const team=await db.query("SELECT 1 FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 AND valid_from<=clock_timestamp() AND (ended_at IS NULL OR ended_at>clock_timestamp())",[employeeId,teamId]);
 if(!team.rowCount)await db.query("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from) VALUES($1,$2,clock_timestamp()-interval '2 minutes')",[employeeId,teamId]);
 let scope=(await db.query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=$1 AND scope_kind='team' AND scope_reference_id=$2 AND ended_at IS NULL ORDER BY scope_id LIMIT 1",[employeeId,teamId])).rows[0];
 if(!scope)scope=(await db.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES($1,'team',$2) RETURNING scope_id",[employeeId,teamId])).rows[0];
 for(const permissionId of permissionIds){
  const ov=(await db.query("SELECT 1 FROM public.employee_permission_overrides WHERE employee_id=$1 AND permission_id=$2",[employeeId,permissionId])).rowCount;
  if(ov)await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=$1 AND permission_id=$2",[employeeId,permissionId]);
  else await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,$2,'allow',clock_timestamp())",[employeeId,permissionId]);
  const binding=(await db.query("SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=$1 AND permission_id=$2 AND scope_id=$3 AND ended_at IS NULL",[employeeId,permissionId,scope.scope_id])).rowCount;
  if(!binding)await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,$2,$3,clock_timestamp()-interval '2 minutes')",[employeeId,permissionId,scope.scope_id]);
 }
}
async function seedAccount(db,employeeId,runId){
 const login=`cmp${employeeId}_${String(runId).slice(-6)}`;
 const password=`CompositePass_${employeeId}_2026!`;
 const passwordHash=await hashPassword(password);
 let a=(await db.query("SELECT account_id FROM public.pc_login_accounts WHERE principal_kind='employee' AND employee_id=$1 AND system_admin_id IS NULL ORDER BY account_id LIMIT 1",[employeeId])).rows[0];
 if(a){
  await db.query("UPDATE public.pc_login_accounts SET normalized_login_key=$2,password_hash=$3,credential_state='enabled',force_password_change=false,credential_epoch=credential_epoch+1,updated_at=clock_timestamp() WHERE account_id=$1",[a.account_id,login,passwordHash]);
  await db.query("UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE account_id=$1",[a.account_id]);
 }else{
  a=(await db.query("INSERT INTO public.pc_login_accounts(principal_kind,employee_id,system_admin_id,normalized_login_key,password_hash,credential_state,force_password_change,credential_epoch,created_at,updated_at) VALUES('employee',$1,NULL,$2,$3,'enabled',false,1,clock_timestamp(),clock_timestamp()) RETURNING account_id",[employeeId,login,passwordHash])).rows[0];
 }
 return {employeeId:Number(employeeId),login,password};
}
async function ensurePermission(db,code){
 let row=(await db.query("SELECT permission_id FROM public.permissions WHERE permission_code=$1",[code])).rows[0];
 if(row)return Number(row.permission_id);
 const id=Number((await db.query("SELECT COALESCE(MAX(permission_id),0)+1 id FROM public.permissions")).rows[0].id);
 row=(await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2) RETURNING permission_id",[id,code])).rows[0];
 return Number(row.permission_id);
}
async function seedScenario(db,runId){
 const employees=(await db.query("SELECT e.employee_id,e.store_id,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employment_status='active' AND r.role_code IN('sales','manager','store_head') ORDER BY e.employee_id")).rows;
 assert.ok(employees.length>=3,'need three active non-4S employees for lock owner, handoff manager and new responsible');
 const initial=employees.find(x=>x.role_code==='sales'&&Number(x.employee_id)===1)||employees.find(x=>x.role_code==='sales')||employees[0];
 assert.ok(initial,'need an active initial responsible employee');
 const team=(await db.query("SELECT t.team_id,t.store_id FROM public.employee_team_memberships m JOIN public.teams t ON t.team_id=m.team_id WHERE m.employee_id=$1 AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) AND t.team_status='active' ORDER BY t.team_id LIMIT 1",[initial.employee_id])).rows[0];
 assert.ok(team,'initial responsible must have an active team');
 const manager=employees.find(x=>Number(x.employee_id)!==Number(initial.employee_id)&&x.role_code==='manager')||
  employees.find(x=>Number(x.employee_id)!==Number(initial.employee_id)&&x.role_code==='store_head'&&Number(x.store_id)===Number(team.store_id));
 assert.ok(manager,'need a separate manager or same-store store_head for signed handoff');
 const target=employees.find(x=>x.role_code==='sales'&&Number(x.employee_id)!==Number(initial.employee_id)&&Number(x.employee_id)!==Number(manager.employee_id))||
  employees.find(x=>Number(x.employee_id)!==Number(initial.employee_id)&&Number(x.employee_id)!==Number(manager.employee_id));
 assert.ok(target,'need a separate current responsible after handoff');
 const codes=['lock.ci.approve','deposit.ci.record','transaction.ci.open','transaction.ci.handoff','transaction.ci.cancel','transaction.refund.ci.request'];
 const permissions={};for(const code of codes)permissions[code]=await ensurePermission(db,code);
 await seedEmployeeScope(db,Number(initial.employee_id),Number(team.team_id),[
  permissions['deposit.ci.record'],permissions['transaction.ci.open'],permissions['transaction.ci.cancel'],permissions['transaction.refund.ci.request']
 ]);
 await seedEmployeeScope(db,Number(manager.employee_id),Number(team.team_id),[
  permissions['lock.ci.approve'],permissions['transaction.ci.handoff']
 ]);
 await seedEmployeeScope(db,Number(target.employee_id),Number(team.team_id),[
  permissions['transaction.ci.cancel'],permissions['transaction.refund.ci.request']
 ]);
 const customerId=87280101,vehicleId=87281101,cycleId=87282101;
 await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',$2) ON CONFLICT(customer_id) DO UPDATE SET account_status='active',customer_level_id=1,owner_assignment_state='assigned',current_owner_employee_id=EXCLUDED.current_owner_employee_id",[customerId,initial.employee_id]);
 const phone=(await db.query("SELECT 1 FROM public.customer_phone_facts WHERE customer_id=$1 AND valid_from<=clock_timestamp() AND ended_at IS NULL LIMIT 1",[customerId])).rowCount;
 if(!phone)await db.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES($1,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 day')",[customerId]);
 await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) VALUES($1,'mingbang','available','visible',$2) ON CONFLICT(vehicle_id) DO NOTHING",[vehicleId,initial.employee_id]);
 await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,clock_timestamp()-interval '1 day') ON CONFLICT(listing_cycle_id) DO NOTHING",[cycleId,vehicleId]);
 const price=(await db.query("SELECT 1 FROM public.vehicle_price_history WHERE vehicle_id=$1 AND price_kind='customer_display' AND amount_cents>0 LIMIT 1",[vehicleId])).rowCount;
 if(!price)await db.query("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES($1,'customer_display',6500000,clock_timestamp()-interval '1 day')",[vehicleId]);
 const customerToken=newOpaqueToken();
 await db.query("INSERT INTO f06_composite_v1.customer_sessions(token_sha256,customer_id,issuer,head_sha,run_id,expires_at) VALUES($1,$2,'COMPOSITE_NONPROD_SIGNED_V1',$3,$4,clock_timestamp()+interval '1 hour') ON CONFLICT(token_sha256) DO NOTHING",
  [sha(customerToken),customerId,process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID]);
 const initialAccount=await seedAccount(db,Number(initial.employee_id),runId);
 const managerAccount=await seedAccount(db,Number(manager.employee_id),runId);
 const targetAccount=await seedAccount(db,Number(target.employee_id),runId);
 return {customerId,vehicleId,cycleId,customerToken,initial,manager,target,initialAccount,managerAccount,targetAccount,teamId:Number(team.team_id)};
}

async function login(auth,account){
 const result=await auth.login({login:account.login,password:account.password,source:'issue171_signed_lifecycle_e2e',ip:'127.0.0.1'});
 assert.equal(result.code,'AUTH_OK','genuine F03 employee auth required');
 assert.equal(result.restricted,false);
 return result.token;
}
async function post(base,path,token,body,headers={}){
 const r=await fetch(base+path,{method:'POST',headers:{
  'content-type':'application/json',authorization:'Bearer '+token,...headers
 },body:JSON.stringify(body)});
 return {status:r.status,body:await r.json()};
}
test('Issue171: Native PG16 Composite ordinary-lock lifecycle & immutable issuer',async t=>{
 const secret=envSetup();let db,auth,runtime,server;
 const seenPids=[];
 try{
  db=new pg.Client({connectionString:DSN});await db.connect();
  const profile=assertCompositeSignedRun();
  await t.test('01 真实GitHub新分支受控profile且签名SHA一致',()=>{
   assert.equal(profile.profile,'ISSUE171_COMPOSITE_LOCK_LIFECYCLE_NONPROD_V2');
   assert.equal(profile.sha,process.env.GITHUB_SHA);
  });
  const native=await verifyLifecycleIssuer(db);
  await t.test('02 原生新生命周期Issuer与旧Composite不可变父源相符',()=>{
   assert.equal(native.verified,true);
   assert.equal(native.sha,process.env.GITHUB_SHA);
   assert.equal(native.runId,process.env.GITHUB_RUN_ID);
  });
  const scenario=await seedScenario(db,process.env.GITHUB_RUN_ID);
  const perm=await ensurePermission(db,'lock.ci.manage');
  await seedEmployeeScope(db,Number(scenario.manager.employee_id),Number(scenario.teamId),[perm]);
  auth=new IsolatedAuth({connectionString:DSN,secret,origin:'https://127.0.0.1:3000'});
  const initialToken=await login(auth,scenario.initialAccount);
  const managerToken=await login(auth,scenario.managerAccount);
  const targetToken=await login(auth,scenario.targetAccount);
  runtime=await createIsolatedF06CompositeRuntime(process.env,{sessionSecret:secret,auth});
  const originalConnect=runtime.pool.connect.bind(runtime.pool);
  runtime.pool.connect=async()=>{const c=await originalConnect();const pid=(await c.query('SELECT pg_backend_pid() pid')).rows[0].pid;seenPids.push(pid);return c};
  server=createFoundationServer({lockHandler:runtime.handler,readinessProbe:runtime.ready});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const base='http://127.0.0.1:'+server.address().port;
  await t.test('03 真PG16单Runtime包含Lifecycle并保持合法readiness',async()=>{
   assert.ok(runtime.lifecycleService);
   assert.equal(await runtime.ready(),true);
   const x=(await db.query("SELECT current_database() db,current_user role,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,pg_backend_pid() pid")).rows[0];
   assert.equal(x.db,'f03_auth_test');assert.equal(x.role,'f03_ci');assert.equal(x.superuser,false);
   t.diagnostic('F06_171_NATIVE_PG16_NON_SUPERUSER '+JSON.stringify(x));
  });
  const createLock=async(i)=>{
   const vehicleId=87281101+i,cycleId=87282101+i;
   if(i!==0){
    await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) VALUES($1,'mingbang','available','visible',$2)",[vehicleId,scenario.initial.employee_id]);
    await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,clock_timestamp()-interval '1 day')",[cycleId,vehicleId]);
    await db.query("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES($1,'customer_display',6500000,clock_timestamp()-interval '1 day')",[vehicleId]);
   }
   const req=await post(base,'/api/v1/lock-requests',scenario.customerToken,{
    vehicleId:String(vehicleId),listingCycleId:String(cycleId),
    idempotencyKey:'issue171_lock_request_'+i+'_'+process.env.GITHUB_RUN_ID
   });
   assert.equal(req.status,201,JSON.stringify(req.body));
   const approved=await post(base,'/api/v1/lock-requests/'+req.body.requestId+'/decision',managerToken,{
    decision:'approve',idempotencyKey:'issue171_lock_approve_'+i+'_'+process.env.GITHUB_RUN_ID
   });
   assert.equal(approved.status,200,JSON.stringify(approved.body));
   assert.equal(approved.body.code,'LOCK_APPROVED');
   return String(approved.body.lockId);
  };
  const lock1=await createLock(0),lock2=await createLock(1),lock3=await createLock(2),lock4=await createLock(3),lock5=await createLock(4),lock6=await createLock(5);
  await t.test('04 六个Lock均由真实LockRequest合法审批且唯一',async()=>{
   assert.equal(new Set([lock1,lock2,lock3,lock4,lock5,lock6]).size,6);
   const rows=(await db.query("SELECT lock_id FROM public.locks WHERE lock_id=ANY($1::bigint[]) AND lock_status='active'",[[lock1,lock2,lock3,lock4,lock5,lock6]])).rows;
   assert.equal(rows.length,6);
  });
  const expiry=(await db.query("SELECT (clock_timestamp()+interval '120 hours')::timestamptz AS value")).rows[0].value.toISOString();
  const extendBody={action:'extend',idempotencyKey:'issue171_extend_'+process.env.GITHUB_RUN_ID,reason:'Native synthetic ordinary extension',newExpiresAt:expiry};
  const extension=await post(base,'/__nonprod__/f06-composite/locks/'+lock1+'/actions',initialToken,extendBody);
  await t.test('05 真实HTTP普通无款Lock延期成功',async()=>{
   assert.equal(extension.status,200,JSON.stringify(extension.body));
   assert.equal(extension.body.code,'LOCK_EXTENDED');
  });
  await t.test('06 新Issuer签名Event及public审计原子写入',async()=>{
   const event=(await db.query("SELECT action,head_sha,run_id,source_parent_sha256 FROM f06_composite_lifecycle_v2.lock_lifecycle_events WHERE lock_id=$1",[lock1])).rows[0];
   assert.equal(event.action,'extend');assert.equal(event.head_sha,process.env.GITHUB_SHA);
   assert.equal(event.run_id,process.env.GITHUB_RUN_ID);
   assert.equal(event.source_parent_sha256,native.sourceSHA);
   const audit=(await db.query("SELECT action FROM public.audit_events WHERE object_kind='Lock' AND object_id=$1",[lock1])).rows;
   assert.ok(audit.some(x=>x.action==='f06_composite_lock_lifecycle_extend'));
  });
  const replay=await post(base,'/__nonprod__/f06-composite/locks/'+lock1+'/actions',initialToken,extendBody);
  await t.test('07 同键延期重放无第二条签名事件',async()=>{
   assert.equal(replay.status,200);assert.equal(replay.body.code,'LOCK_EXTENDED');
   const count=(await db.query("SELECT count(*)::int n FROM f06_composite_lifecycle_v2.lock_lifecycle_events WHERE lock_id=$1",[lock1])).rows[0].n;
   assert.equal(count,1);
  });
  const conflict=await post(base,'/__nonprod__/f06-composite/locks/'+lock1+'/actions',initialToken,{...extendBody,reason:'Different keyed payload'});
  await t.test('08 同键不同请求内容必拒绝',()=>assert.equal(conflict.status,409,JSON.stringify(conflict.body)));
  const wrong=await post(base,'/__nonprod__/f06-composite/locks/'+lock1+'/actions',targetToken,
   {action:'release',idempotencyKey:'issue171_unauthorized_'+process.env.GITHUB_RUN_ID,reason:'Unauthorized'});
  await t.test('09 无对应Lock Permission/Scope非责任销售被拒',()=>assert.equal(wrong.status,403,JSON.stringify(wrong.body)));
  const invalid=await post(base,'/__nonprod__/f06-composite/locks/'+lock1+'/actions','fake',
   {action:'cancel',idempotencyKey:'issue171_fake_'+process.env.GITHUB_RUN_ID,reason:'Bad token'});
  await t.test('10 不可信员工Bearer被拒',()=>assert.equal(invalid.status,401));
  const fakeIssuer=await post(base,'/__nonprod__/f06-composite/locks/'+lock1+'/actions',initialToken,
   {action:'release',idempotencyKey:'issue171_fake_issuer_'+process.env.GITHUB_RUN_ID,reason:'Client issuer spoof',issuer:'PRODUCTION'});
  await t.test('11 客户自报Issuer字段被拒',()=>assert.equal(fakeIssuer.status,400));
  const release=await post(base,'/__nonprod__/f06-composite/locks/'+lock2+'/actions',initialToken,
   {action:'release',idempotencyKey:'issue171_release_'+process.env.GITHUB_RUN_ID,reason:'Synthetic release'});
  await t.test('12 普通无资金Lock人工释放成功',()=>{
   assert.equal(release.status,200,JSON.stringify(release.body));assert.equal(release.body.code,'LOCK_RELEASED');
  });
  const cancel=await post(base,'/__nonprod__/f06-composite/locks/'+lock3+'/actions',initialToken,
   {action:'cancel',idempotencyKey:'issue171_cancel_'+process.env.GITHUB_RUN_ID,reason:'Synthetic cancel'});
  await t.test('13 普通无资金Lock取消成功',()=>{
   assert.equal(cancel.status,200,JSON.stringify(cancel.body));assert.equal(cancel.body.code,'LOCK_CANCELLED');
  });
  const early=await runtime.lifecycleService.expireOrdinary({lockId:lock4});
  await t.test('14 PG数据库时钟未到期必须拒绝自动失效',()=>{
   assert.equal(early.status,409);assert.equal(early.body.code,'LOCK_NOT_EXPIRED_BY_DATABASE_CLOCK');
  });
  await db.query("UPDATE public.locks SET expires_at=clock_timestamp()-interval '1 second' WHERE lock_id=$1",[lock4]);
  const expired=await runtime.lifecycleService.expireOrdinary({lockId:lock4});
  await t.test('15 PG真时钟到期系统自动失效成功',()=>{
   assert.equal(expired.status,200,JSON.stringify(expired.body));assert.equal(expired.body.code,'LOCK_EXPIRED');
  });
  const expireReplay=await runtime.lifecycleService.expireOrdinary({lockId:lock4});
  await t.test('16 系统到期重复执行幂等不改历史',()=>{
   assert.equal(expireReplay.status,200);assert.equal(expireReplay.body.code,'LOCK_EXPIRED');
  });
  const deposit=await recordSyntheticDepositComposite(auth,initialToken,{
   lockId:Number(lock5),amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',
   eventKey:'issue171_deposit_'+process.env.GITHUB_RUN_ID,receivedAt:new Date().toISOString(),note:'No real money'
  });
  await t.test('17 真PG16已签合成意向金记录确实存在',()=>{
   assert.equal(deposit.allowed,true,JSON.stringify(deposit));
  });
  const paid=await runtime.lifecycleService.act({
   token:initialToken,lockId:lock5,action:'release',
   idempotencyKey:'issue171_financial_denial_'+process.env.GITHUB_RUN_ID,reason:'Cannot release paid lock'
  });
  await t.test('18 同库签名资金事实存在，普通释放必须硬拒',()=>{
   assert.equal(paid.status,409,JSON.stringify(paid.body));assert.equal(paid.body.code,'LOCK_FINANCIAL_FACT_PRESENT_DENY');
  });
  const validateOld=await runtime.lifecycleService.act({
   token:initialToken,lockId:lock3,action:'cancel',
   idempotencyKey:'issue171_cancel_replay_distinct_'+process.env.GITHUB_RUN_ID,reason:'Terminal lock'
  });
  await t.test('19 已终态Lock拒二次普通取消',()=>assert.equal(validateOld.status,409));
  const rollback= createIsolatedF06LockLifecycleService({
   pool:runtime.pool,env:process.env,mode:'COMPOSITE_NONPROD_SIGNED_V1',sessionSecret:secret,
   verifyDatabase:async c=>{await verifyCompositeRuntimeDatabase(c);await verifyLifecycleIssuer(c)},
   afterMutationWrite:async()=>{throw Error('F06_171_INTENTIONAL_ROLLBACK')}
  });
  await assert.rejects(()=>rollback.act({
   token:initialToken,lockId:lock6,action:'release',
   idempotencyKey:'issue171_injected_rollback_'+process.env.GITHUB_RUN_ID,reason:'Injected PG transaction rollback'
  }),/F06_171_INTENTIONAL_ROLLBACK/);
  await t.test('20 真实PG故障注错恢复原锁、审计和签名事件均回滚',async()=>{
   const row=(await db.query("SELECT lock_status FROM public.locks WHERE lock_id=$1",[lock6])).rows[0];
   assert.equal(row.lock_status,'active');
   const ev=(await db.query("SELECT count(*)::int n FROM f06_composite_lifecycle_v2.lock_lifecycle_events WHERE lock_id=$1",[lock6])).rows[0].n;
   assert.equal(ev,0);
   const aud=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Lock' AND object_id=$1 AND action='f06_composite_lock_lifecycle_release'",[lock6])).rows[0].n;
   assert.equal(aud,0);
  });
  seenPids.length=0;
  const concurrentBody={action:'release',idempotencyKey:'issue171_concurrent_release_'+process.env.GITHUB_RUN_ID,reason:'Concurrent same key'};
  const [a,b]=await Promise.all([
   post(base,'/__nonprod__/f06-composite/locks/'+lock6+'/actions',initialToken,concurrentBody),
   post(base,'/__nonprod__/f06-composite/locks/'+lock6+'/actions',initialToken,concurrentBody)
  ]);
  await t.test('21 同车并发同键仅一历史事件、双方均同一业务结果',async()=>{
   assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(b.status,200,JSON.stringify(b.body));
   assert.equal(a.body.code,'LOCK_RELEASED');assert.equal(b.body.code,'LOCK_RELEASED');
   assert.notEqual(seenPids[0],seenPids[1],'two backend PIDs required');
   const n=(await db.query("SELECT count(*)::int n FROM f06_composite_lifecycle_v2.lock_lifecycle_events WHERE lock_id=$1",[lock6])).rows[0].n;
   assert.equal(n,1);
  });
  await t.test('22 新Lifecycle不可变事件真实PG禁止更新删除',async()=>{
   await assert.rejects(db.query("UPDATE f06_composite_lifecycle_v2.lock_lifecycle_events SET reason='edited' WHERE lock_id=$1",[lock6]),/IMMUTABLE/);
   await assert.rejects(db.query("DELETE FROM f06_composite_lifecycle_v2.lock_lifecycle_events WHERE lock_id=$1",[lock6]),/IMMUTABLE/);
  });
  await t.test('23 同PG提交后所有业务Lock结果真实可读',async()=>{
   const rows=(await db.query("SELECT lock_id,lock_status FROM public.locks WHERE lock_id=ANY($1::bigint[])",[[lock1,lock2,lock3,lock4,lock5,lock6]])).rows;
   const values=new Map(rows.map(x=>[String(x.lock_id),x.lock_status]));
   assert.equal(values.get(lock1),'active');assert.equal(values.get(lock2),'released');
   assert.equal(values.get(lock3),'cancelled');assert.equal(values.get(lock4),'expired');
   assert.equal(values.get(lock5),'active');assert.equal(values.get(lock6),'released');
  });
  await t.test('24 旧真实F03 session撤权立刻失效',async()=>{
   await db.query("UPDATE public.pc_auth_sessions SET revoked_at=clock_timestamp() WHERE token_digest=$1",[sessionDigest(initialToken,secret)]);
   const result=await runtime.lifecycleService.act({
    token:initialToken,lockId:lock1,action:'cancel',
    idempotencyKey:'issue171_revoked_'+process.env.GITHUB_RUN_ID,reason:'Should not mutate'
   });
   assert.equal(result.status,403);assert.equal(result.body.code,'EMPLOYEE_NOT_AUTHORIZED');
  });
  await t.test('25 原生产支付API保持硬拒绝',async()=>{
   const r=await fetch(base+'/api/v1/transactions/1/complete',{method:'POST'});
   assert.equal(r.status,503);
  });
  await t.test('26 原生产退款API保持硬拒绝',async()=>{
   const r=await fetch(base+'/api/v1/refund-payments',{method:'POST'});
   assert.equal(r.status,503);
  });
  t.diagnostic('F06_171_NATIVE_SIGNED_LOCK_LIFECYCLE_26_CASES_PASS');
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  if(runtime)await runtime.close();
  if(auth)await auth.close();
  if(db)await db.end();
 }
});
