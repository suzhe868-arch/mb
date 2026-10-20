import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {fork} from 'node:child_process';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
import {recordSyntheticDepositCI} from '../../deposit-ledger-ci/service.mjs';
import {createHttpServer,assertRealEntry,productionIssuer} from '../server.mjs';
const consent='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const secret=Buffer.alloc(32,61),customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF062(()=>withParentBranch(fn));
const endpoint='/__ci__/f06-real-lock-transaction/open';
let db,auth,server,base,token,role,scopeId,locks={},recorded,txId,firstKey;
const sessionBackendPids=[];
const q=(sql,args=[])=>db.query(sql,args);
const rows=async(s,a=[])=> (await q(s,a)).rows;
async function call(path=endpoint,body={},actor=token,method='POST',headers={}){
 const h={origin:base,'content-type':'application/json',...headers};
 if(actor)h.authorization='Bearer '+actor;
 const r=await fetch(base+path,{method,headers:h,body:method==='GET'?undefined:JSON.stringify(body)});
 return {status:r.status,body:await r.json(),headers:r.headers};
}
const body=(n,lock=locks[1],more={})=>({lockId:lock,eventKey:'f06-real-transaction-'+n+'-'+process.env.GITHUB_RUN_ID,...more});

function signedRefund(operation,params={},onReady=null){
 return new Promise((resolve,reject)=>{
  const signed='feat/f06-3c1-refund-pending-close-ci';
  const child=fork(new URL('../refund-bridge.mjs',import.meta.url),[],{
   cwd:process.cwd(),execArgv:[],env:{...process.env,GITHUB_REF:'refs/heads/'+signed,GITHUB_REF_NAME:signed},
   stdio:['ignore','pipe','pipe','ipc']
  });
  let settled=false,stderr='',started=false;
  child.stderr.on('data',b=>{stderr+=b.toString().slice(0,2000)});
  const fail=e=>{if(!settled){settled=true;child.kill();reject(e)}};
  child.on('error',fail);
  child.on('exit',(code)=>{if(!settled)fail(Error('F06_TX_REFUND_BRIDGE_EXIT_'+code+' '+stderr))});
  child.on('message',m=>{
   if(m.type==='ready'&&!started){
    started=true;
    if(!m.nativeSigned)return fail(Error('F06_TX_UNVERIFIED_REFUND_PARENT'));
    try{if(onReady)onReady()}catch(e){return fail(e)}
    child.send({operation,token,params});
   }else if(m.type==='result'&&!settled){
    settled=true;resolve(m.result);
   }
  });
 });
}
const signedRefundParams=(n,lockId)=>({
 lockId,amountCents:2000,reason:'Synthetic signed refund request '+n,
 eventKey:'f06-tx-3c1-signed-'+n+'-'+process.env.GITHUB_RUN_ID,subjectKind:'lock'
});

async function close(s){if(s?.listening)await new Promise((resolve,reject)=>s.close(e=>e?reject(e):resolve()))}
async function invariant(lockId){
 return (await q("SELECT l.lock_status,l.end_reason,(SELECT count(*)::int FROM public.transactions t WHERE t.source_lock_id=l.lock_id) txs,(SELECT count(*)::int FROM f06_real_tx_ci.origins o WHERE o.source_lock_id=l.lock_id) origins,(SELECT count(*)::int FROM f06_real_tx_ci.events e WHERE e.source_lock_id=l.lock_id) events FROM public.locks l WHERE l.lock_id=$1",[lockId])).rows[0];
}
before(async()=>{
 assertRealEntry();
 db=await connect();
 assert.equal((await verify(db)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 const originalSession=auth.withSession.bind(auth);
 auth.withSession=(bearer,fn,opts)=>originalSession(bearer,async(c,...args)=>{
  sessionBackendPids.push(Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid));
  return fn(c,...args);
 },opts);
 const roleRows=await rows("SELECT role_id,role_code FROM public.roles WHERE role_code IN ('sales','manager')");
 const sales=Number(roleRows.find(r=>r.role_code==='sales')?.role_id);
 assert.ok(sales>0);
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1',[sales]);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const team=(await rows("SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1"))[0];
 assert.ok(team?.team_id);
 const scope=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[team.team_id]))[0];
 assert.ok(scope?.scope_id);scopeId=Number(scope.scope_id);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES (963401,'transaction.ci.open'),(963402,'deposit.ci.record'),(963403,'refund.ci.request')");
 for(const p of [963401,963402,963403]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[p]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[p,scopeId]);
 }
 const login=await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-real-tx-current-session'});
 token=login.token;assert.ok(token);
 for(let n=1;n<=8;n++){
  const intake=await old(()=>intakeCI(db,{requestKey:'f06-real-tx-lock-intake-'+n+'-'+process.env.GITHUB_RUN_ID,
   customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),syntheticPhoneConsent:consent}));
  assert.equal(intake.allowed,true,JSON.stringify(intake));
  const decision=await old(()=>decisionCI(auth,token,{requestId:intake.requestId,
   requestKey:'f06-real-tx-lock-approve-'+n+'-'+process.env.GITHUB_RUN_ID,action:'approve'}));
  assert.equal(decision.allowed,true,JSON.stringify(decision));locks[n]=Number(decision.lockId);
 }
 // Distinct signed deposits supply the authentic refund balance on locks 4-8.
 for(let n=4;n<=8;n++){
  const d=await recordSyntheticDepositCI(auth,token,{
   lockId:locks[n],amountCents:12000,currency:'CNY',paymentMethod:'bank_transfer',
   eventKey:'f06-tx-3c1-refund-balance-'+n+'-'+process.env.GITHUB_RUN_ID,
   receivedAt:new Date(Date.now()-3600000).toISOString(),
   syntheticVoucher:'CI-ONLY-SIGNED-REFUND-'+n,note:'Signed synthetic refund eligibility'
  });
  assert.equal(d.allowed,true,JSON.stringify(d));
 }
 server=createHttpServer({auth});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 base='http://127.0.0.1:'+server.address().port;
});
after(async()=>{await close(server);if(auth)await auth.close();if(db)await db.end();secret.fill(0)});
test('01 真正单分支+Push+SHA与环境隔离门禁',()=>{assertRealEntry()});
test('02 生产交易路由没有注册',async()=>{const r=await call('/api/v1/transactions',{});assert.equal(r.status,404)});
test('03 真实生产退款路由硬拒',async()=>{const r=await call('/api/v1/refunds',{});assert.equal(r.status,404)});
test('04 真实锁车释放生产路由硬拒',async()=>{const r=await call('/api/v1/locks/1/release',{});assert.equal(r.status,404)});
test('05 缺少签名Session拒绝',async()=>{const r=await call(endpoint,body('no-auth'),null);assert.equal(r.status,401)});
test('06 伪造Bearer拒绝',async()=>{const r=await call(endpoint,body('fake-auth'),'forged-token-that-is-unsigned');assert.equal(r.status,401)});
test('07 非JSON媒体类型拒绝',async()=>{const r=await call(endpoint,body('bad-type'),token,'POST',{'content-type':'text/plain'});assert.equal(r.status,415)});
test('08 不是JSON对象拒绝',async()=>{const r=await call(endpoint,[]);assert.equal(r.status,400)});
test('09 缺少锁ID拒绝',async()=>{const r=await call(endpoint,{eventKey:'valid-long-missing-lock'});assert.equal(r.status,400)});
test('10 非法幂等键拒绝',async()=>{const r=await call(endpoint,{lockId:locks[1],eventKey:'tiny'});assert.equal(r.status,400)});
test('11 合法编号但无来源Lock硬拒',async()=>{const r=await call(endpoint,body('missing-lock',999999998));assert.equal(r.status,404)});
test('12 生产Issuer永远不可用',()=>{assert.equal(productionIssuer().allowed,false)});
test('13 真实初始Lock仍为active',async()=>{const r=await invariant(locks[1]);assert.equal(r.lock_status,'active');assert.equal(r.txs,0)});
test('14 经F06-3A合法签名服务生成合成Deposit',async()=>{
 const r=await recordSyntheticDepositCI(auth,token,{lockId:locks[1],amountCents:15000,currency:'CNY',
  paymentMethod:'bank_transfer',eventKey:'f06-tx-deposit-signed-'+process.env.GITHUB_RUN_ID,
  receivedAt:new Date(Date.now()-3600000).toISOString(),
  syntheticVoucher:'CI-ONLY-TRANSACTION-TEST',note:'synthetic transaction source'});
 assert.equal(r.allowed,true,JSON.stringify(r));recorded=Number(r.depositId);
});
test('15 合成收款原件与来源签名匹配',async()=>{
 const r=await rows('SELECT p.issuer_kind,d.amount_cents,p.original_amount_cents FROM f06_3a_ci.receipt_provenance p JOIN public.deposit_receipts d ON d.deposit_id=p.deposit_id WHERE p.deposit_id=$1',[recorded]);
 assert.equal(r.length,1);assert.equal(r[0].issuer_kind,'CI_SYNTHETIC_NOT_REAL_MONEY');assert.equal(Number(r[0].amount_cents),15000);
});
test('36 撤销交易权限override须拒绝且不新增资金交易',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=963401");
 try{const r=await call(endpoint,body('permission-revoked',locks[2]));assert.equal(r.status,403);assert.equal(r.body.code,'F06_TX_PERMISSION_SCOPE_DENIED');assert.equal((await invariant(locks[2])).txs,0)}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=963401")}
});
test('37 交易capability范围授权到期须硬拒',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=1 AND permission_id=963401");
 try{const r=await call(endpoint,body('capability-expired',locks[2]));assert.equal(r.status,403);assert.equal(r.body.code,'F06_TX_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=1 AND permission_id=963401")}
});
test('38 当前Employee数据scope撤销须硬拒',async()=>{
 await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1',[scopeId]);
 try{const r=await call(endpoint,body('scope-revoked',locks[2]));assert.equal(r.status,403);assert.equal(r.body.code,'F06_TX_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1',[scopeId])}
});
test('39 当前Customer禁用须拒绝',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{const r=await call(endpoint,body('customer-disabled',locks[2]));assert.equal(r.status,403);assert.equal(r.body.code,'F06_TX_CUSTOMER_VEHICLE_CYCLE_DENY')}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('40 Listing Cycle已结束须拒绝',async()=>{
 await q('UPDATE public.vehicle_listing_cycles SET ended_at=clock_timestamp() WHERE listing_cycle_id=$1',[cycle(2)]);
 try{const r=await call(endpoint,body('cycle-ended',locks[2]));assert.equal(r.status,403);assert.equal(r.body.code,'F06_TX_CUSTOMER_VEHICLE_CYCLE_DENY')}
 finally{await q('UPDATE public.vehicle_listing_cycles SET ended_at=NULL WHERE listing_cycle_id=$1',[cycle(2)])}
});
test('41 过期Session即使Bearer格式正确仍被拒绝',async()=>{
 const saved=auth.clock;auth.clock=()=>new Date(Date.now()+13*3600000);
 try{const r=await call(endpoint,body('expired-session',locks[2]));assert.equal(r.status,401);assert.equal(r.body.code,'F06_TX_SIGNED_SESSION_DENIED')}
 finally{auth.clock=saved}
});
test('42 不可绕过父M94约束伪造过期Lock，原Lock及交易事实不变',async()=>{
 const before=(await rows('SELECT expires_at FROM public.locks WHERE lock_id=$1',[locks[2]]))[0].expires_at;
 await assert.rejects(q("UPDATE public.locks SET expires_at=clock_timestamp()-interval '1 minute' WHERE lock_id=$1",[locks[2]]),
  /violates check constraint/);
 const current=(await rows('SELECT expires_at FROM public.locks WHERE lock_id=$1',[locks[2]]))[0].expires_at;
 assert.equal(new Date(current).getTime(),new Date(before).getTime());
 const st=await invariant(locks[2]);
 assert.equal(st.lock_status,'active');assert.equal(st.txs,0);assert.equal(st.origins,0);
});
test('43 伪造的SystemAdmin身份Headers不产生隐式放行',async()=>{
 const r=await call(endpoint,body('fake-admin',999999998),token,'POST',{'x-principal-kind':'system_admin','x-role':'manager','x-employee-id':'1'});
 assert.equal(r.status,404);assert.equal(r.body.code,'F06_TX_LOCK_NOT_FOUND');
});

for(const [n,checkpoint] of [[16,'BEFORE_WRITE_THROW'],[17,'AFTER_TRANSACTION_THROW'],[18,'AFTER_LOCK_THROW'],[19,'AFTER_ORIGIN_THROW'],[20,'AFTER_AUDIT_THROW']]){
 test(String(n)+' 原生PG16 SQL故障注入 '+checkpoint+' 完整回滚',async()=>{
  const r=await call(endpoint,body('rollback-'+n,locks[2],{testCheckpoint:checkpoint}));
  assert.equal(r.status,409,JSON.stringify(r.body));assert.equal(r.body.code,'F06_TX_ROLLED_BACK');
  const state=await invariant(locks[2]);assert.equal(state.lock_status,'active');assert.equal(state.txs,0);assert.equal(state.origins,0);assert.equal(state.events,0);
 });
}
test('21 注错后所有原始Lock与Transaction事实未半写',async()=>{
 const r=await invariant(locks[2]);assert.deepEqual([r.lock_status,r.txs,r.origins,r.events],['active',0,0,0]);
});
test('22 两个真实HTTP竞争同车仅一个成功',async()=>{
 const pair=await Promise.all([call(endpoint,body('winner-first')),call(endpoint,body('winner-second'))]);
 const ok=pair.filter(x=>x.status===201),denied=pair.filter(x=>x.status!==201);
 assert.equal(ok.length,1,JSON.stringify(pair));assert.equal(denied.length,1,JSON.stringify(pair));
 txId=Number(ok[0].body.transactionId);assert.ok(txId>0);
 firstKey=ok[0]===pair[0]?'winner-first':'winner-second';
});
test('23 单车唯一物理in_progress',async()=>{
 const r=await rows("SELECT count(*)::int n FROM public.transactions WHERE vehicle_id=$1 AND status='in_progress'",[vehicle(1)]);
 assert.equal(r[0].n,1);
});
test('24 同一真实幂等键重复返回唯一Transaction',async()=>{
 const r=await call(endpoint,body(firstKey));assert.equal(r.status,200,JSON.stringify(r.body));
 assert.equal(Number(r.body.transactionId),txId);
});
test('25 同键改Lock触发指纹冲突',async()=>{
 const r=await call(endpoint,body(firstKey,locks[2]));assert.equal(r.body.code,'F06_TX_IDEMPOTENCY_KEY_CONFLICT');
});
test('26 转换后旧Lock被明确以可信终态结束',async()=>{
 const r=await invariant(locks[1]);assert.equal(r.lock_status,'released');assert.equal(r.end_reason,'converted_to_transaction');assert.equal(r.txs,1);
});
test('27 合成签名Deposit事实没有丢失或被改写',async()=>{
 const r=await rows('SELECT d.amount_cents,p.original_amount_cents FROM public.deposit_receipts d JOIN f06_3a_ci.receipt_provenance p ON p.deposit_id=d.deposit_id WHERE d.deposit_id=$1',[recorded]);
 assert.equal(r.length,1);assert.equal(Number(r[0].amount_cents),15000);assert.equal(Number(r[0].original_amount_cents),15000);
});
test('28 原子转换侧表来源不可UPDATE',async()=>{
 await assert.rejects(q("UPDATE f06_real_tx_ci.origins SET state='in_progress' WHERE transaction_id=$1",[txId]),/F06_REAL_TX_APPEND_ONLY/);
});
test('29 原子转换事件不可DELETE',async()=>{
 await assert.rejects(q("DELETE FROM f06_real_tx_ci.events WHERE transaction_id=$1",[txId]),/F06_REAL_TX_APPEND_ONLY/);
});
test('30 幂等证据不可UPDATE',async()=>{
 await assert.rejects(q('UPDATE f06_real_tx_ci.request_keys SET employee_id=employee_id WHERE transaction_id=$1',[txId]),/F06_REAL_TX_APPEND_ONLY/);
});
test('31 第二辆车独立有效Lock转换',async()=>{
 const r=await call(endpoint,body('second-vehicle',locks[2]));assert.equal(r.status,201,JSON.stringify(r.body));
 const st=await invariant(locks[2]);assert.equal(st.lock_status,'released');assert.equal(st.txs,1);
});
test('32 第三辆车引入未签资金来源后Fail Closed',async()=>{
 const r=await q('INSERT INTO public.deposit_receipts(customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES($1,$2,100,clock_timestamp(),1) RETURNING deposit_id',[customer,locks[3]]);
 const fake=Number(r.rows[0].deposit_id);
 try{const denied=await call(endpoint,body('unknown-funds',locks[3]));assert.equal(denied.body.code,'F06_TX_DEPOSIT_UNKNOWN_ISSUER_DENY');assert.equal((await invariant(locks[3])).txs,0)}
 finally{await q('DELETE FROM public.deposit_receipts WHERE deposit_id=$1',[fake])}
});
test('33 第三辆车合法物理pending Refund即使来源未签也硬拒',async()=>{
 await q("INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) VALUES($1,$2,NULL,'pending',100)",[customer,locks[3]]);
 const r=await call(endpoint,body('pending-refund',locks[3]));assert.equal(r.body.code,'F06_TX_LOCK_PENDING_REFUND_DENY');
});
test('34 旧Lock pending Refund拒绝后0半条写入',async()=>{
 const st=await invariant(locks[3]);assert.equal(st.lock_status,'active');assert.equal(st.txs,0);assert.equal(st.origins,0);assert.equal(st.events,0);
});
test('35 全部新增Transaction仍只为合成在途且生产Issuer未接线',async()=>{
 const r=await rows("SELECT p.status,o.issuer,o.carrier FROM f06_real_tx_ci.origins o JOIN public.transactions p ON p.transaction_id=o.transaction_id ORDER BY p.transaction_id");
 assert.equal(r.length,2);for(const x of r){assert.equal(x.status,'in_progress');assert.equal(x.issuer,'CI_SYNTHETIC_NOT_REAL_MONEY');assert.equal(x.carrier,'in_progress')}
});

test('44 原生F06-3C1父签名及退款Carrier在独立进程验签',async()=>{
 const r=await signedRefund('verify');
 assert.equal(r.allowed,true,JSON.stringify(r));
 assert.equal(r.code,'F06_TX_NATIVE_SIGNED_3C1_VERIFIED');
 assert.match(r.sourceSHA,/^[a-f0-9]{64}$/);
 assert.ok(r.pid>0);
 console.log('SIGNED_REFUND_PARENT_NATIVE_3C1',JSON.stringify(r));
});
let pendingSignedRefund=null;
test('45 受限3C1服务生成合法pending与原生退款来源事件',async()=>{
 const r=await signedRefund('request',signedRefundParams('refund-first',locks[4]));
 assert.equal(r.allowed,true,JSON.stringify(r));
 assert.equal(r.code,'F06_3C1_PENDING_NO_PAYMENT');pendingSignedRefund=r.refundId;
 assert.ok(r.backendPid>0);
 const proof=await rows("SELECT rc.status,o.issuer_kind,o.amount_cents,e.event_kind FROM public.refund_cases rc "+
  "JOIN f06_3c1_ci.refund_origins o USING(refund_id) JOIN f06_3c1_ci.status_events e USING(refund_id) WHERE rc.refund_id=$1",[pendingSignedRefund]);
 assert.equal(proof.length,1);assert.equal(proof[0].status,'pending');
 assert.equal(proof[0].issuer_kind,'CI_SYNTHETIC_NO_MONEY');
 assert.equal(proof[0].event_kind,'pending_requested');
 console.log('F06_TX_SIGNED_REFUND_FIRST_PID',r.backendPid);
});
test('46 真签名Refund先COMMIT，Transaction必须拒绝且零半写',async()=>{
 const r=await call(endpoint,body('signed-refund-first',locks[4]));
 assert.equal(r.status,409,JSON.stringify(r.body));
 assert.equal(r.body.code,'F06_TX_LOCK_PENDING_REFUND_DENY');
 assert.deepEqual((({lock_status,txs,origins,events})=>[lock_status,txs,origins,events])(await invariant(locks[4])),['active',0,0,0]);
 assert.equal(Number((await rows('SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[pendingSignedRefund]))[0].n),0);
});
test('47 相同原生退款请求Key幂等且仅一份来源事件',async()=>{
 const r=await signedRefund('request',signedRefundParams('refund-first',locks[4]));
 assert.equal(r.allowed,true,JSON.stringify(r));
 assert.equal(r.code,'F06_3C1_IDEMPOTENT_REQUEST');
 assert.equal(r.refundId,pendingSignedRefund);
 const e=await rows('SELECT count(*)::int n FROM f06_3c1_ci.status_events WHERE refund_id=$1',[pendingSignedRefund]);
 assert.equal(e[0].n,1);
});
test('48 Transaction先COMMIT：同车同周期唯一真实占用',async()=>{
 const r=await call(endpoint,body('transaction-first',locks[5]));
 assert.equal(r.status,201,JSON.stringify(r.body));
 const state=await invariant(locks[5]);assert.deepEqual([state.lock_status,state.txs,state.origins,state.events],['released',1,1,1]);
});
test('49 Transaction先提交后，受信3C1请求对旧Lock拒绝，零pending',async()=>{
 const r=await signedRefund('request',signedRefundParams('transaction-first',locks[5]));
 assert.equal(r.allowed,false,JSON.stringify(r));
 assert.equal(r.code,'F06_3C1_OWNING_TRANSACTION_REQUIRES_SIGNED_TERMINAL');
 const n=(await rows('SELECT count(*)::int n FROM public.refund_cases WHERE lock_id=$1',[locks[5]]))[0].n;
 assert.equal(n,0);assert.equal((await invariant(locks[5])).txs,1);
 console.log('F06_TX_TRANSACTION_FIRST_REFUND_DENY_PID',r.backendPid);
});
test('50 两独立PG Backend同时竞争同车：最多一个COMMIT、零半写',async()=>{
 let txPromise;const before=sessionBackendPids.length;
 const refundPromise=signedRefund('request',signedRefundParams('concurrent',locks[6]),()=>{
  txPromise=call(endpoint,body('concurrent',locks[6]));
 });
 const refund=await refundPromise;
 const tx=await txPromise;
 assert.ok(tx&&refund,JSON.stringify({tx,refund}));
 const committed=Number(tx.status===201)+Number(refund.allowed===true);
 assert.equal(committed,1,JSON.stringify({tx:tx.body,refund}));
 const st=await invariant(locks[6]);
 assert.equal(st.txs+(await rows('SELECT count(*)::int n FROM public.refund_cases WHERE lock_id=$1 AND status=\'pending\'',[locks[6]]))[0].n,1);
 if(tx.status===201)assert.deepEqual([st.lock_status,st.origins,st.events],['released',1,1]);
 else assert.deepEqual([st.lock_status,st.txs,st.origins,st.events],['active',0,0,0]);
 const txPid=sessionBackendPids.slice(before)[0];
 assert.ok(txPid>0&&refund.backendPid>0&&txPid!==refund.backendPid,JSON.stringify({txPid,refundPid:refund.backendPid}));
 console.log('F06_TX_REFUND_TRUE_TWO_PG_BACKEND_RACE',JSON.stringify({
  txPid,refundPid:refund.backendPid,txStatus:tx.status,txResult:tx.body.code,
  refundAllowed:refund.allowed,refundResult:refund.code,lock:st.lock_status,
  transactions:st.txs,refunds:committed-st.txs
 }));
});
test('51 3C1签名pending→closed_without_payment并记录双事件后允许安全转换',async()=>{
 const req=await signedRefund('request',signedRefundParams('closed',locks[7]));
 assert.equal(req.allowed,true,JSON.stringify(req));
 const closed=await signedRefund('close',{
  refundId:req.refundId,closeReason:'Synthetic refund withdrawn without payment',
  eventKey:'f06-tx-3c1-close-'+process.env.GITHUB_RUN_ID
 });
 assert.equal(closed.allowed,true,JSON.stringify(closed));
 assert.equal(closed.code,'F06_3C1_CLOSED_WITHOUT_PAYMENT');
 const r=await call(endpoint,body('signed-closed',locks[7]));
 assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal((await invariant(locks[7])).txs,1);
 console.log('F06_TX_REFUND_CLOSED_SIGNED_TWO_EVENTS',JSON.stringify({requestPid:req.backendPid,closePid:closed.backendPid,transactionPid:r.body.backendPid}));
});
test('52 退款父Carrier真实缺失，即使没有退款行也Fail Closed',async()=>{
 await q('DROP SCHEMA f06_3c1_ci CASCADE');
 const r=await call(endpoint,body('missing-signed-carrier',locks[8]));
 assert.equal(r.status,409,JSON.stringify(r.body));
 assert.equal(r.body.code,'F06_TX_TRUSTED_REFUND_PARENT_MISSING');
 const state=await invariant(locks[8]);
 assert.deepEqual([state.lock_status,state.txs,state.origins,state.events],['active',0,0,0]);
 console.log('F06_TX_REFUND_PARENT_ABSENT_ZERO_ROWS_FAIL_CLOSED_PASS');
});
