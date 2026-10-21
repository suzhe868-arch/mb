import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createFoundationServer} from '../../../src/app.mjs';
import pg from 'pg';
import {hashPassword,newOpaqueToken} from '../../../src/f03-auth-crypto.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createIsolatedF06CompositeRuntime} from '../../../src/f06-nonprod-composite-runtime.mjs';
import {recordSyntheticDepositComposite} from '../../deposit-ledger-ci/service.mjs';
import {openSyntheticTransactionComposite} from '../../lock-transaction-http-pg16/service.mjs';
import {handoffRealTransactionComposite} from '../../transaction-handoff-http-pg16/service.mjs';
import {cancelSyntheticRealTransactionCI} from '../../transaction-cancel-http-pg16/service.mjs';

const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const sha=x=>createHash('sha256').update(x).digest('hex');
const isAllowed=x=>x&&x.allowed===true;
function envSetup(){
 Object.assign(process.env,{
  APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',CI:'true',GITHUB_ACTIONS:'true',
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F03_1_DATABASE_URL:DSN,
  F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
  F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY',F06_COMPOSITE_DEBUG_ERRORS:'1',
  F06_COMPOSITE_SIGNED_ISSUER:'COMPOSITE_NONPROD_SIGNED_V1'
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
 const customerId=86280101,vehicleId=86281101,cycleId=86282101;
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
 const result=await auth.login({login:account.login,password:account.password,source:'issue164_composite_e2e',ip:'127.0.0.1'});
 assert.equal(result.code,'AUTH_OK',`F03 login failed for employee ${account.employeeId}: ${result.code}`);
 assert.equal(result.restricted,false,'Composite business operations require an unrestricted native F03 session');
 return result.token;
}
async function post(base,path,token,body){
 const response=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${token}`},body:JSON.stringify(body)});
 const data=await response.json();
 return {status:response.status,data};
}
async function raw(base,path,{method='POST',headers={},body}={}){
 const options={method,headers:{...headers}};
 if(body!==undefined)options.body=body;
 const response=await fetch(base+path,options);
 const text=await response.text();let data;
 try{data=JSON.parse(text)}catch{data={raw:text}}
 return {status:response.status,data,headers:response.headers};
}
test('F06 Issue164：单PG16真实F03 Session贯通Lock→Deposit→Transaction→Handoff→Cancel→Refund Pending/Closed',async t=>{
 let db,auth,runtime,server;
 const observedBackendPids=[];
 const secret=envSetup();
 try{
  db=new pg.Client({connectionString:DSN});await db.connect();
  const scenario=await seedScenario(db,process.env.GITHUB_RUN_ID);
  auth=new IsolatedAuth({connectionString:DSN,secret,origin:'https://127.0.0.1:3000'});
  const originalWithSession=auth.withSession.bind(auth);
  auth.withSession=(token,fn,options)=>originalWithSession(token,async(c,...args)=>{
   const pid=(await c.query('SELECT pg_backend_pid() pid')).rows[0].pid;
   observedBackendPids.push(Number(pid));
   return fn(c,...args);
  },options);
  const initialToken=await login(auth,scenario.initialAccount);
  const managerToken=await login(auth,scenario.managerAccount);
  const targetToken=await login(auth,scenario.targetAccount);
  runtime=await createIsolatedF06CompositeRuntime(process.env,{sessionSecret:secret,auth});
  assert.equal(runtime.mode,'COMPOSITE_NONPROD_SIGNED_V1');
  assert.equal(await runtime.ready(),true);
  server=createFoundationServer({lockHandler:runtime.handler,readinessProbe:runtime.ready});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const port=server.address().port,base=`http://127.0.0.1:${port}`;
  const req=await post(base,'/api/v1/lock-requests',scenario.customerToken,{
   vehicleId:String(scenario.vehicleId),listingCycleId:String(scenario.cycleId),idempotencyKey:`lock_request_create_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(req.status,201,JSON.stringify(req.data));
  assert.equal(req.data.code,'LOCK_REQUEST_PENDING');
  const requestId=Number(req.data.requestId);
  t.diagnostic('F06_COMPOSITE_LOCK_REQUEST_CREATED requestId='+requestId);

  const approved=await post(base,`/api/v1/lock-requests/${requestId}/decision`,managerToken,{
   decision:'approve',idempotencyKey:`lock_decision_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(approved.status,200,JSON.stringify(approved.data));
  assert.equal(approved.data.code,'LOCK_APPROVED');
  const lockId=Number(approved.data.lockId);
  assert.ok(lockId>0);
  t.diagnostic('F06_COMPOSITE_SIGNED_LOCK_CREATED lockId='+lockId);
  await t.test('真实PG16：Composite LockRequest审计action和签名Event真实落库',async()=>{
   const audit=await db.query("SELECT action FROM public.audit_events WHERE object_kind='LockRequest' AND object_id=$1 ORDER BY action",[String(requestId)]);
   assert.deepEqual(audit.rows.map(x=>x.action),['f06_composite_approved','f06_composite_created']);
   const signed=await db.query("SELECT event_kind FROM f06_composite_v1.issued_events WHERE parent_object_id=$1 AND event_kind IN('lock_request_created','lock_request_approved') ORDER BY event_kind",[requestId]);
   assert.deepEqual(signed.rows.map(x=>x.event_kind),['lock_request_approved','lock_request_created']);
   t.diagnostic('F06_COMPOSITE_LOCK_AUDIT_DATABASE_ACTION_PASS');
  });

  await assert.rejects(()=>recordSyntheticDepositComposite(auth,initialToken,{
   lockId,amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',
   eventKey:`deposit_rollback_${process.env.GITHUB_RUN_ID}`,receivedAt:new Date().toISOString(),
   note:'Synthetic rollback checkpoint',testCheckpoint:'AFTER_RECEIPT_THROW'
  }),/F06_3A_INJECTED_RECEIPT_ROLLBACK/);
  const rollbackDeposit=await db.query('SELECT count(*)::int n FROM public.deposit_receipts WHERE lock_id=$1',[lockId]);
  assert.equal(rollbackDeposit.rows[0].n,0,'receipt write and provenance must roll back together');
  t.diagnostic('F06_COMPOSITE_DEPOSIT_ROLLBACK_ATOMIC_PASS');

  const deposit=await post(base,'/__nonprod__/f06-composite/deposit/record',initialToken,{
   lockId,amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',
   eventKey:`deposit_record_${process.env.GITHUB_RUN_ID}`,receivedAt:new Date().toISOString(),
   note:'Synthetic test receipt only'
  });
  assert.equal(deposit.status,201,JSON.stringify(deposit.data));
  assert.equal(deposit.data.code,'F06_3A_SYNTHETIC_RECEIPT_RECORDED');
  const depositId=Number(deposit.data.depositId);
  t.diagnostic('F06_COMPOSITE_SIGNED_DEPOSIT_CREATED depositId='+depositId);
  await t.test('真实PG16：意向金同键重放只返回既有收据',async()=>{
   const replay=await post(base,'/__nonprod__/f06-composite/deposit/record',initialToken,{
    lockId,amountCents:500000,currency:'CNY',paymentMethod:'bank_transfer',
    eventKey:'deposit_record_'+process.env.GITHUB_RUN_ID,receivedAt:new Date().toISOString(),note:'Synthetic replay'
   });
   assert.equal(replay.status,200,JSON.stringify(replay.data));
   assert.equal(replay.data.code,'F06_3A_IDEMPOTENT_RECEIPT');
   assert.equal(Number(replay.data.depositId),depositId);
  });

  const failedOpen=await openSyntheticTransactionComposite(auth,initialToken,{
   lockId,eventKey:`tx_rollback_${process.env.GITHUB_RUN_ID}`,testCheckpoint:'AFTER_TRANSACTION_THROW'
  });
  assert.equal(failedOpen.allowed,false);
  assert.equal(failedOpen.code,'F06_TX_ROLLED_BACK');
  const rolled=await db.query("SELECT (SELECT count(*)::int FROM public.transactions WHERE source_lock_id=$1) tx_count,(SELECT lock_status FROM public.locks WHERE lock_id=$1) lock_status",[lockId]);
  assert.equal(rolled.rows[0].tx_count,0);
  assert.equal(rolled.rows[0].lock_status,'active');
  t.diagnostic('F06_COMPOSITE_TRANSACTION_ROLLBACK_ATOMIC_PASS');

  const opened=await post(base,'/__nonprod__/f06-composite/transaction/open',initialToken,{
   lockId,eventKey:`tx_open_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(opened.status,200,JSON.stringify(opened.data));
  assert.equal(opened.data.code,'F06_TX_ATOMIC_SYNTHETIC_IN_PROGRESS');
  const transactionId=Number(opened.data.transactionId);
  assert.ok(transactionId>0);
  t.diagnostic('F06_COMPOSITE_TRANSACTION_CREATED transactionId='+transactionId);
  await t.test('真实PG16双Backend：交易同键并发重放只创建一个Transaction',async()=>{
   observedBackendPids.length=0;
   const body={lockId,eventKey:'tx_open_'+process.env.GITHUB_RUN_ID};
   const [left,right]=await Promise.all([
    post(base,'/__nonprod__/f06-composite/transaction/open',initialToken,body),
    post(base,'/__nonprod__/f06-composite/transaction/open',initialToken,body)
   ]);
   for(const replay of [left,right]){
    assert.equal(replay.status,200,JSON.stringify(replay.data));
    assert.equal(replay.data.code,'F06_TX_IDEMPOTENT');
    assert.equal(Number(replay.data.transactionId),transactionId);
   }
   assert.equal(observedBackendPids.length,2,'both requests must enter two F03-authenticated PG backends');
   assert.notEqual(observedBackendPids[0],observedBackendPids[1],'same-vehicle race must use distinct PostgreSQL backends');
   const count=await db.query('SELECT count(*)::int n FROM public.transactions WHERE source_lock_id=$1',[lockId]);
   assert.equal(count.rows[0].n,1,'concurrent duplicate open must not create a second Transaction');
   t.diagnostic('F06_COMPOSITE_TX_DOUBLE_BACKEND_IDEMPOTENCY_PASS');
  });


  await t.test('真实PG16：Handoff变更后注错必须完整回滚',async()=>{
   const failed=await handoffRealTransactionComposite(auth,managerToken,{
    transactionId,expectedOldResponsibleId:Number(scenario.initial.employee_id),expectedVersion:0,
    newResponsibleId:Number(scenario.target.employee_id),reason:'Issue164 synthetic handoff rollback',
    eventKey:'handoff_rollback_'+process.env.GITHUB_RUN_ID,testCheckpoint:'AFTER_CHANGE_THROW'
   });
   assert.equal(failed.allowed,false,JSON.stringify(failed));
   assert.equal(failed.code,'F06_REAL_HANDOFF_ATOMIC_ROLLED_BACK');
   const tx=(await db.query('SELECT responsible_employee_id,status,completed_at FROM public.transactions WHERE transaction_id=$1',[transactionId])).rows[0];
   assert.equal(Number(tx.responsible_employee_id),Number(scenario.initial.employee_id));
   assert.equal(tx.status,'in_progress');assert.equal(tx.completed_at,null);
   const counts=(await db.query("SELECT "+
    "(SELECT count(*)::int FROM f06_real_handoff_ci.events WHERE transaction_id=$1) events,"+
    "(SELECT count(*)::int FROM f06_real_handoff_ci.request_keys WHERE transaction_id=$1) keys,"+
    "(SELECT count(*)::int FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1::text AND action='f06_real_handoff_ci_responsible_transfer') audits,"+
    "(SELECT count(*)::int FROM f06_composite_v1.issued_events WHERE event_kind='signed_handoff' AND parent_object_id=$1) signed",[transactionId])).rows[0];
   for(const value of Object.values(counts))assert.equal(value,0);
   t.diagnostic('F06_COMPOSITE_HANDOFF_ROLLBACK_ATOMIC_PASS');
  });
  const handoff=await post(base,'/__nonprod__/f06-composite/transaction/handoff',managerToken,{
   transactionId,expectedOldResponsibleId:Number(scenario.initial.employee_id),expectedVersion:0,
   newResponsibleId:Number(scenario.target.employee_id),reason:'Issue164 synthetic responsibility handoff',
   eventKey:`handoff_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(handoff.status,200,JSON.stringify(handoff.data));
  assert.equal(handoff.data.code,'F06_REAL_HANDOFF_ATOMIC_SIGNED');
  t.diagnostic('F06_COMPOSITE_HANDOFF_SIGNED');

  const cancelled=await post(base,'/__nonprod__/f06-composite/transaction/cancel',targetToken,{
   transactionId,expectedVersion:1,reason:'Issue164 synthetic post-handoff cancel',
   eventKey:`post_cancel_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(cancelled.status,200,JSON.stringify(cancelled.data));
  assert.equal(cancelled.data.code,'F06_POST_CANCEL_ATOMIC_SIGNED');
  t.diagnostic('F06_COMPOSITE_POST_HANDOFF_CANCEL_SIGNED');

  await assert.rejects(()=>cancelSyntheticRealTransactionCI(auth,targetToken,{
   transactionId,eventKey:`legacy_pr146_${process.env.GITHUB_RUN_ID}`,reason:'legacy must stay denied'
  }));
  t.diagnostic('F06_COMPOSITE_LEGACY_PR146_ENTRY_STILL_REJECTS');

  const refund=await post(base,'/__nonprod__/f06-composite/refund/request',targetToken,{
   transactionId,amountCents:100000,reason:'Synthetic refund pending test',
   eventKey:`refund_pending_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(refund.status,201,JSON.stringify(refund.data));
  assert.equal(refund.data.code,'F06_TX_REFUND_PENDING_NO_PAYMENT');
  const refundId=Number(refund.data.refundId);
  assert.ok(refundId>0);
  t.diagnostic('F06_COMPOSITE_REFUND_PENDING_SIGNED refundId='+refundId);
  await t.test('真实PG16双Backend：同资金退款键并发重放不重复建案',async()=>{
   observedBackendPids.length=0;
   const body={transactionId,amountCents:100000,reason:'Synthetic refund pending test',
    eventKey:'refund_pending_'+process.env.GITHUB_RUN_ID};
   const [left,right]=await Promise.all([
    post(base,'/__nonprod__/f06-composite/refund/request',targetToken,body),
    post(base,'/__nonprod__/f06-composite/refund/request',targetToken,body)
   ]);
   for(const replay of [left,right]){
    assert.equal(replay.status,200,JSON.stringify(replay.data));
    assert.equal(replay.data.code,'F06_TX_REFUND_IDEMPOTENT_REQUEST');
    assert.equal(Number(replay.data.refundId),refundId);
   }
   assert.equal(observedBackendPids.length,2,'both refund replays must use distinct PostgreSQL backends');
   assert.notEqual(observedBackendPids[0],observedBackendPids[1],'same-funds replay must contend across PG backends');
   const count=await db.query('SELECT count(*)::int n FROM public.refund_cases WHERE transaction_id=$1',[transactionId]);
   assert.equal(count.rows[0].n,1,'same-key refund replay must not create a second case');
   t.diagnostic('F06_COMPOSITE_REFUND_DOUBLE_BACKEND_IDEMPOTENCY_PASS');
  });
  await t.test('真实PG16双Backend：不同退款键竞争同一资金余额不得双建案',async()=>{
   observedBackendPids.length=0;
   const [left,right]=await Promise.all([
    post(base,'/__nonprod__/f06-composite/refund/request',targetToken,{
     transactionId,amountCents:100000,reason:'Synthetic competing refund A',
     eventKey:'refund_compete_a_'+process.env.GITHUB_RUN_ID
    }),
    post(base,'/__nonprod__/f06-composite/refund/request',targetToken,{
     transactionId,amountCents:100000,reason:'Synthetic competing refund B',
     eventKey:'refund_compete_b_'+process.env.GITHUB_RUN_ID
    })
   ]);
   for(const denied of [left,right]){
    assert.equal(denied.status,403,JSON.stringify(denied.data));
    assert.equal(denied.data.code,'F06_TX_REFUND_ALREADY_PENDING');
   }
   assert.equal(observedBackendPids.length,2,'both competing requests must use separate PostgreSQL backends');
   assert.notEqual(observedBackendPids[0],observedBackendPids[1],'same-funds competition must span two PG backends');
   const count=await db.query('SELECT count(*)::int n FROM public.refund_cases WHERE transaction_id=$1',[transactionId]);
   assert.equal(count.rows[0].n,1,'different keys cannot create a second pending refund for the same transaction');
   t.diagnostic('F06_COMPOSITE_REFUND_DOUBLE_BACKEND_COMPETITION_PASS');
  });


  const closed=await post(base,'/__nonprod__/f06-composite/refund/close',targetToken,{
   refundId,closeReason:'Synthetic no-payment close',
   eventKey:`refund_close_${process.env.GITHUB_RUN_ID}`
  });
  assert.equal(closed.status,200,JSON.stringify(closed.data));
  assert.equal(closed.data.code,'F06_TX_REFUND_CLOSED_WITHOUT_PAYMENT');
  t.diagnostic('F06_COMPOSITE_REFUND_CLOSED_WITHOUT_PAYMENT_SIGNED');
  await t.test('真实PG16：无付款关闭同键重放保持关闭状态',async()=>{
   const replay=await post(base,'/__nonprod__/f06-composite/refund/close',targetToken,{
    refundId,closeReason:'Synthetic no-payment close',
    eventKey:'refund_close_'+process.env.GITHUB_RUN_ID
   });
   assert.equal(replay.status,200,JSON.stringify(replay.data));
   assert.equal(replay.data.code,'F06_TX_REFUND_IDEMPOTENT_CLOSE');
   assert.equal(Number(replay.data.refundId),refundId);
  });
  const securityCases=[
   ['未登录Deposit拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/deposit/record');assert.equal(r.status,401);assert.equal(r.data.code,'F06_COMPOSITE_SIGNED_SESSION_REQUIRED')}],
   ['畸形Bearer拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/open',{headers:{authorization:'Bearer short'}});assert.equal(r.status,401)}],
   ['客户端自报角色拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/close',{headers:{authorization:'Bearer '+targetToken,'x-role':'admin'}});assert.equal(r.status,403)}],
   ['客户端自报Issuer拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/open',{headers:{authorization:'Bearer '+initialToken,'x-issuer':'PR139'}});assert.equal(r.status,403)}],
   ['转发来源头拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/cancel',{headers:{authorization:'Bearer '+targetToken,'x-forwarded-for':'127.0.0.1'}});assert.equal(r.status,403)}],
   ['Cookie会话混用拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/deposit/record',{headers:{authorization:'Bearer '+initialToken,cookie:'session=spoof'}});assert.equal(r.status,403)}],
   ['伪造客户身份头拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/deposit/record',{headers:{authorization:'Bearer '+initialToken,'x-customer-id':String(scenario.customerId)}});assert.equal(r.status,403)}],
   ['伪造系统管理员头拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/close',{headers:{authorization:'Bearer '+targetToken,'x-system-admin':'true'}});assert.equal(r.status,403)}],
   ['GET不得执行Deposit',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/deposit/record',{method:'GET',headers:{authorization:'Bearer '+initialToken}});assert.equal(r.status,405)}],
   ['PUT不得执行Refund关闭',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/close',{method:'PUT',headers:{authorization:'Bearer '+targetToken}});assert.equal(r.status,405)}],
   ['业务体额外Issuer字段拒绝且不回显',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/request',{headers:{authorization:'Bearer '+targetToken,'content-type':'application/json'},body:JSON.stringify({transactionId,amountCents:1000,reason:'Synthetic security case',eventKey:'unexpected_body_field_0001',issuer:'PR139'})});assert.equal(r.status,400);assert.ok(!JSON.stringify(r.data).includes('PR139'))}],
   ['错误Content-Type拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/request',{headers:{authorization:'Bearer '+targetToken,'content-type':'text/plain'},body:'{}'});assert.equal(r.status,400)}],
   ['非法JSON拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/open',{headers:{authorization:'Bearer '+initialToken,'content-type':'application/json'},body:'{'});assert.equal(r.status,400)}],
   ['JSON数组拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/open',{headers:{authorization:'Bearer '+initialToken,'content-type':'application/json'},body:'[]'});assert.equal(r.status,400)}],
   ['空请求体拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/request',{headers:{authorization:'Bearer '+targetToken}});assert.equal(r.status,400)}],
   ['超大请求体拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/refund/request',{headers:{authorization:'Bearer '+targetToken,'content-type':'application/json'},body:'x'.repeat(5000)});assert.equal(r.status,400)}],
   ['非法LockId拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/transaction/open',initialToken,{lockId:0,eventKey:'invalid_lock_case_000001'});assert.equal(r.status,400);assert.equal(r.data.code,'F06_TX_INVALID_ARGUMENTS')}],
   ['零意向金金额拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/deposit/record',initialToken,{lockId,amountCents:0,currency:'CNY',paymentMethod:'bank_transfer',eventKey:'invalid_deposit_amount_0001',receivedAt:new Date().toISOString()});assert.equal(r.status,400)}],
   ['缺少Transaction幂等键拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/transaction/open',initialToken,{lockId});assert.equal(r.status,400)}],
   ['负Handoff版本拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/transaction/handoff',managerToken,{transactionId,expectedOldResponsibleId:Number(scenario.target.employee_id),expectedVersion:-1,newResponsibleId:Number(scenario.initial.employee_id),reason:'Invalid version security case',eventKey:'negative_handoff_version_0001'});assert.equal(r.status,400)}],
   ['短Cancel原因拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/transaction/cancel',targetToken,{transactionId,expectedVersion:1,reason:'bad',eventKey:'short_cancel_reason_000001'});assert.equal(r.status,400)}],
   ['零退款金额拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/refund/request',targetToken,{transactionId,amountCents:0,reason:'Invalid zero refund test',eventKey:'zero_refund_amount_000001'});assert.equal(r.status,400)}],
   ['零RefundId关闭拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/refund/close',targetToken,{refundId:0,closeReason:'Invalid close id test',eventKey:'zero_refund_id_close_0001'});assert.equal(r.status,400)}],
   ['已取消Transaction不得再次Handoff',async()=>{const r=await post(base,'/__nonprod__/f06-composite/transaction/handoff',managerToken,{transactionId,expectedOldResponsibleId:Number(scenario.target.employee_id),expectedVersion:1,newResponsibleId:Number(scenario.initial.employee_id),reason:'Canceled transaction handoff attempt',eventKey:'cancelled_tx_handoff_0001'});assert.equal(r.status,403);assert.equal(r.data.code,'F06_REAL_HANDOFF_NOT_IN_PROGRESS')}],
   ['非当前责任人不得申请Refund',async()=>{const r=await post(base,'/__nonprod__/f06-composite/refund/request',managerToken,{transactionId,amountCents:1000,reason:'Wrong employee refund request',eventKey:'wrong_employee_refund_0001'});assert.equal(r.status,403);assert.equal(r.data.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED')}],
   ['未知Composite路由返回404',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/unknown',{headers:{authorization:'Bearer '+targetToken}});assert.equal(r.status,404);assert.equal(r.data.code,'NOT_IMPLEMENTED')}],
   ['无效币种意向金拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/deposit/record',initialToken,{lockId,amountCents:1000,currency:'USD',paymentMethod:'bank_transfer',eventKey:'invalid_currency_deposit_0001',receivedAt:new Date().toISOString()});assert.equal(r.status,400)}],
   ['短Refund关闭原因拒绝',async()=>{const r=await post(base,'/__nonprod__/f06-composite/refund/close',targetToken,{refundId,closeReason:'bad',eventKey:'short_refund_close_0001'});assert.equal(r.status,400)}],
   ['Transaction完成入口硬拒绝',async()=>{const r=await raw(base,`/api/v1/transactions/${transactionId}/complete`,{headers:{authorization:'Bearer '+targetToken,'content-type':'application/json'},body:'{}'});assert.equal(r.status,503);assert.equal(r.data.code,'F06_COMPOSITE_SIGNED_SOURCE_GAP')}],
   ['Refund变更为refunded入口硬拒绝',async()=>{const r=await raw(base,`/api/v1/refund_cases/${refundId}/mark-refunded`,{headers:{authorization:'Bearer '+targetToken,'content-type':'application/json'},body:'{}'});assert.equal(r.status,503);assert.equal(r.data.code,'F06_COMPOSITE_SIGNED_SOURCE_GAP')}],
   ['真实退款支付入口硬拒绝',async()=>{const r=await raw(base,`/api/v1/refund-payments/${refundId}/pay`,{headers:{authorization:'Bearer '+targetToken,'content-type':'application/json'},body:'{}'});assert.equal(r.status,503);assert.equal(r.data.code,'F06_COMPOSITE_SIGNED_SOURCE_GAP')}],
   ['未登录Handoff拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/handoff');assert.equal(r.status,401)}],
   ['未登录Cancel拒绝',async()=>{const r=await raw(base,'/__nonprod__/f06-composite/transaction/cancel');assert.equal(r.status,401)}]
  ];
  for(const [name,runCase] of securityCases)await t.test(name,runCase);
  t.diagnostic('F06_COMPOSITE_PRODUCTION_PAYMENT_COMPLETION_HARD_DENY');
  await t.test('真实PG16：当前权限撤权与Session撤销即时拒绝',async()=>{
   const permission=(await db.query("SELECT permission_id FROM public.permissions WHERE permission_code='transaction.refund.ci.request'")).rows[0];
   assert.ok(permission);
   await db.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=$1 AND permission_id=$2",
    [scenario.target.employee_id,permission.permission_id]);
   const permissionDenied=await post(base,'/__nonprod__/f06-composite/refund/request',targetToken,{
    transactionId,amountCents:1000,reason:'Revoked permission must deny',eventKey:'permission_revoked_'+process.env.GITHUB_RUN_ID
   });
   assert.equal(permissionDenied.status,403,JSON.stringify(permissionDenied.data));
   assert.equal(permissionDenied.data.code,'F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED');
   await auth.logout(targetToken);
   const sessionDenied=await post(base,'/__nonprod__/f06-composite/refund/close',targetToken,{
    refundId,closeReason:'Revoked session must deny',eventKey:'session_revoked_'+process.env.GITHUB_RUN_ID
   });
   assert.equal(sessionDenied.status,403,JSON.stringify(sessionDenied.data));
   assert.equal(sessionDenied.data.code,'F06_TX_REFUND_SIGNED_SESSION_DENIED');
   t.diagnostic('F06_COMPOSITE_PERMISSION_AND_SESSION_REVOCATION_DENY');
  });

  const issuer=(await db.query("SELECT head_sha,run_id,database_oid,source_sha256 FROM f06_composite_v1.attestation")).rows[0];
  assert.equal(issuer.head_sha,process.env.GITHUB_SHA);
  assert.equal(issuer.run_id,process.env.GITHUB_RUN_ID);
  const events=(await db.query("SELECT event_kind,head_sha,run_id FROM f06_composite_v1.issued_events WHERE (event_kind IN('lock_request_created','lock_request_approved') AND parent_object_id=$1) OR (event_kind='signed_lock' AND parent_object_id=$2) OR (event_kind='signed_deposit' AND parent_object_id=$3) OR (event_kind IN('signed_tx','signed_handoff','signed_cancel') AND parent_object_id=$4) OR (event_kind IN('signed_refund_pending','signed_refund_closed') AND parent_object_id=$5) ORDER BY event_id",
   [requestId,lockId,depositId,transactionId,refundId])).rows;
  const expected=['lock_request_created','lock_request_approved','signed_lock','signed_deposit','signed_tx','signed_handoff','signed_cancel','signed_refund_pending','signed_refund_closed'];
  assert.deepEqual(events.map(x=>x.event_kind),expected);
  assert.ok(events.every(x=>x.head_sha===process.env.GITHUB_SHA&&x.run_id===process.env.GITHUB_RUN_ID));
  const dbFacts=(await db.query("SELECT current_database() db,current_user role,current_setting('server_version_num')::int version,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb,(SELECT count(*)::int FROM public.refund_payments WHERE refund_id=$1) payments,(SELECT count(*)::int FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$2) legacy_lock_snapshots,(SELECT count(*)::int FROM f06_composite_v1.lock_snapshots WHERE lock_id=$2) composite_lock_snapshots",
   [refundId,lockId])).rows[0];
  assert.equal(dbFacts.db,'f03_auth_test');assert.equal(dbFacts.role,'f03_ci');
  assert.ok(dbFacts.version>=160000&&dbFacts.version<170000);assert.equal(dbFacts.superuser,false);assert.equal(dbFacts.createdb,false);
  assert.equal(dbFacts.payments,0,'no actual refund payment is authorized');
  assert.equal(dbFacts.legacy_lock_snapshots,0,'must not forge a legacy F06-1 Lock snapshot');
  assert.equal(dbFacts.composite_lock_snapshots,1);
  const finalTx=(await db.query('SELECT status,completed_at FROM public.transactions WHERE transaction_id=$1',[transactionId])).rows[0];
  assert.equal(finalTx.status,'cancelled');assert.equal(finalTx.completed_at,null,'completed transaction state is not authorized');
  const finalRefund=(await db.query('SELECT status,lock_id,transaction_id FROM public.refund_cases WHERE refund_id=$1',[refundId])).rows[0];
  assert.equal(finalRefund.status,'closed');assert.equal(finalRefund.lock_id,null);
  assert.equal(Number(finalRefund.transaction_id),transactionId);
  assert.equal(String(issuer.database_oid),String((await db.query("SELECT oid FROM pg_database WHERE datname=current_database()")).rows[0].oid));
  assert.equal(await runtime.ready(),true);
  t.diagnostic('F06_164_SINGLE_PG16_CURRENT_RUN_ISSUER_AND_ALL_NINE_BUSINESS_EVENTS_VERIFIED');
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  if(runtime)await runtime.close();
  if(auth)await auth.close();
  if(db)await db.end();
 }
});
