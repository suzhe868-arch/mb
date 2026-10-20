import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,productionIssuerDeny,completedDeny,financialDeny} from '../../transaction-handoff-http-pg16/service.mjs';
import {assertEntry,createHttpServer,childCall} from '../../transaction-handoff-http-pg16/server.mjs';
import {assertEntry as assertCancelEntry,createHttpServer as createCancelServer,childCall as cancelWorker} from '../server.mjs';
import {verify as verifyCancel,productionIssuerDeny as cancelProductionIssuerDeny,paymentDeny,completedDeny as cancelCompletedDeny} from '../service.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
const secret=Buffer.alloc(32,61),customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF062(()=>withParentBranch(fn));
const q=(sql,args=[])=>db.query(sql,args),rows=async(s,a=[]) => (await q(s,a)).rows;
const count=async(s,a=[])=>Number((await rows(s,a))[0].n);
const key=s=>'f06-real-handoff-'+s+'-'+process.env.GITHUB_RUN_ID;
const route='/__ci__/f06-real-transaction-handoff/transfer';
let db,auth,server,url,cancelServer,cancelUrl,cancelScope4,cancelScope2,originalToken,managerToken,peerToken,targetToken,roles,teamId,scope1,locks={},tx={},customerOwner;
const reason='Synthetic signed Transaction responsible handoff to employee';
async function call(p={},token=managerToken,path=route,method='POST'){
 const h={'content-type':'application/json'};
 if(token)h.authorization='Bearer '+token;
 const r=await fetch(url+path,{method,headers:h,body:method==='GET'?undefined:JSON.stringify(p)});
 return {status:r.status,body:await r.json()};
}
const payload=(n,transactionId=tx[1],to=4,prev=1,version=0,extra={})=>({transactionId,expectedOldResponsibleId:prev,expectedVersion:version,newResponsibleId:to,reason:reason+' '+n,eventKey:key(n),...extra});
const handoff=(n,txId=tx[1],to=4,prev=1,version=0,extra={},actor=managerToken)=>call(payload(n,txId,to,prev,version,extra),actor);
const inspect=async t=>childCall('inspect',managerToken,{transactionId:t});
const handoffFacts=async (t=tx[1]) =>(await rows("SELECT t.status,t.completed_at,t.responsible_employee_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,"+
 "(SELECT count(*)::int FROM f06_real_handoff_ci.events WHERE transaction_id=t.transaction_id) events,"+
 "(SELECT count(*)::int FROM f06_real_handoff_ci.request_keys WHERE transaction_id=t.transaction_id) keys,"+
 "(SELECT count(*)::int FROM public.audit_events WHERE object_kind='Transaction' AND object_id=t.transaction_id::text AND action='f06_real_handoff_ci_responsible_transfer') audits,"+
 "(SELECT count(*)::int FROM f06_3b_ci.transaction_origins WHERE transaction_id=t.transaction_id) legacy,"+
 "(SELECT count(*)::int FROM f06_real_tx_ci.origins WHERE transaction_id=t.transaction_id) pr139 "+
 "FROM public.transactions t WHERE t.transaction_id=$1",[t]))[0];
const nativeOpen=async(n,token=originalToken)=>{
 const r=await childCall('open',token,{lockId:locks[n],eventKey:key('open-'+n)});
 assert.equal(r.allowed,true,JSON.stringify(r));
 assert.equal(r.code,'F06_TX_ATOMIC_SYNTHETIC_IN_PROGRESS');
 tx[n]=Number(r.transactionId);return tx[n];
};
before(async()=>{
 assertEntry();db=await connect();assert.equal((await verify(db)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 roles=(await rows("SELECT role_id,role_code FROM public.roles WHERE role_code IN('manager','store_head','sales','four_s')"))
  .reduce((a,x)=>({...a,[x.role_code]:Number(x.role_id)}),{});
 assert.ok(roles.manager&&roles.sales&&roles.four_s);
 await q("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1",[roles.sales]);
 customerOwner=Number((await rows("SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1",[customer]))[0].current_owner_employee_id);
 await q('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=$1',[customer]);
 const tm=(await rows('SELECT team_id FROM public.employee_team_memberships WHERE employee_id=1 AND ended_at IS NULL LIMIT 1'))[0];
 assert.ok(tm);teamId=Number(tm.team_id);
 const sc=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[teamId]))[0];
 assert.ok(sc);scope1=Number(sc.scope_id);
 await q("INSERT INTO public.permissions(permission_id,permission_code) VALUES(997001,'transaction.ci.open'),(997002,'transaction.ci.handoff'),(997003,'transaction.ci.cancel')");
 for(const id of [997001,997003]){
  await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[id]);
  await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '3 minutes')",[id,scope1]);
 }
 originalToken=(await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-handoff-original'})).token;assert.ok(originalToken);
 for(let n=1;n<=8;n++){
  const request=await old(()=>intakeCI(db,{customerId:customer,vehicleId:vehicle(n),listingCycleId:cycle(n),
   requestKey:key('intake-'+n),syntheticPhoneConsent:'CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION'}));
  assert.equal(request.allowed,true,JSON.stringify(request));
  const approve=await old(()=>decisionCI(auth,originalToken,{requestId:request.requestId,requestKey:key('approve-'+n),action:'approve'}));
  assert.equal(approve.allowed,true,JSON.stringify(approve));locks[n]=Number(approve.lockId);
 }
 for(let n=1;n<=8;n++)await nativeOpen(n);
 await q("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=1",[roles.manager]);
 managerToken=(await auth.login({login:'employee_test',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-handoff-manager'})).token;assert.ok(managerToken);
 // No role label automatically grants this explicit transaction.handoff CI ability.
 const authSource=(await rows("SELECT * FROM public.pc_login_accounts WHERE normalized_login_key='employee_test'"))[0];
 assert.ok(authSource);
 // A signed Employee may already have its unique PC account. In this
 // disposable fixture REUSE that account instead of forging a duplicate
 // account_id or a second employee principal. Production accounts untouched.
 const createAccount=async(employeeId,login)=>{
  const existing=await rows("SELECT account_id FROM public.pc_login_accounts WHERE principal_kind='employee' AND employee_id=$1",[employeeId]);
  if(existing.length){
   await q("UPDATE public.pc_login_accounts SET normalized_login_key=$1,password_hash=$2,credential_state='enabled',force_password_change=false,credential_epoch=credential_epoch+1,updated_at=clock_timestamp() WHERE account_id=$3",
    [login,authSource.password_hash,existing[0].account_id]);
   return existing[0].account_id;
  }
  const inserted=await q("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change,credential_epoch) VALUES($4,$1,'employee',$2,$3,'enabled',false,1) RETURNING account_id",
   [login,employeeId,authSource.password_hash,997000+employeeId]);
  return inserted.rows[0].account_id;
 };
 await createAccount(4,'f06_handoff_target_4');
 targetToken=(await auth.login({login:'f06_handoff_target_4',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-handoff-target'})).token;
 assert.ok(targetToken);
 // Second actual manager principal and distinct token/account/backend for the
 // competing transfer. Fixture privileges are restricted to this disposable DB.
 await q("UPDATE public.employees SET main_role_id=$1,employment_status='active' WHERE employee_id=2",[roles.manager]);
 const member=(await rows("SELECT 1 FROM public.employee_team_memberships WHERE employee_id=2 AND team_id=$1 AND ended_at IS NULL",[teamId]))[0];
 if(!member){
  const admin=(await rows('SELECT system_admin_id FROM public.system_admins ORDER BY system_admin_id LIMIT 1'))[0];
  assert.ok(admin?.system_admin_id);
  await q("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from,changed_by_system_admin_id) VALUES(2,$1,clock_timestamp()-interval '2 days',$2)",[teamId,admin.system_admin_id]);
 }
 const scope2=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=2 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[teamId]))[0];
 const s2=scope2?Number(scope2.scope_id):Number((await q("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(2,'team',$1) RETURNING scope_id",[teamId])).rows[0].scope_id);
 await createAccount(2,'f06_handoff_manager_2');
 peerToken=(await auth.login({login:'f06_handoff_manager_2',password:'SyntheticF04_3_CurrentProof_2026',source:'f06-handoff-peer-manager'})).token;
 assert.ok(peerToken&&peerToken!==managerToken&&peerToken!==targetToken);
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(2,997002,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(2,997002,$1,clock_timestamp()-interval '3 minutes')",[s2]);
 server=createHttpServer();await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
 url='http://127.0.0.1:'+server.address().port;
 cancelServer=createCancelServer();await new Promise((ok,fail)=>{cancelServer.once('error',fail);cancelServer.listen(0,'127.0.0.1',ok)});
 cancelUrl='http://127.0.0.1:'+cancelServer.address().port;
});
after(async()=>{if(cancelServer?.listening)await new Promise(resolve=>cancelServer.close(resolve));if(server?.listening)await new Promise(resolve=>server.close(resolve));if(auth)await auth.close();if(db)await db.end();secret.fill(0)});
test('01 主线GitHub Push精确SHA门禁',()=>assertEntry());
test('02 签名3A/3B/3C1 PR139/146/150父链真验',async()=>assert.equal((await verify(db)).verified,true));
test('03 生产Handoff Issuer不存在',()=>assert.equal(productionIssuerDeny().allowed,false));
test('04 真实资金与Completed严格禁止',()=>{assert.equal(financialDeny().allowed,false);assert.equal(completedDeny().allowed,false)});
test('05 生产真实交易负责人移交路由404',async()=>assert.equal((await call({},managerToken,'/api/v1/transactions/1/handoff')).status,404));
test('06 生产正式cancel/refund路由404',async()=>assert.equal((await call({},managerToken,'/api/v1/transactions/1/cancel')).status,404));
test('07 非POST无CI交接功能',async()=>assert.equal((await call({},managerToken,route,'GET')).status,404));
test('08 无Token不可变更当前负责人',async()=>assert.equal((await call(payload('no-token'),null)).status,401));
test('09 假Token不可变更',async()=>assert.equal((await call(payload('fake'),'0'.repeat(43))).status,401));
test('10 参数错误拒绝',async()=>assert.equal((await handoff('bad',0)).status,400));
test('11 PR139原签名旧3B/4B不兼容矩阵：旧0新1',async()=>{
 const r=await childCall('legacy',managerToken,{transactionId:tx[1]});
 assert.deepEqual([r.old3b,r.signedPr139],[0,1],JSON.stringify(r));
 console.log('F06_REAL_HANDOFF_4B_SOURCE_MATRIX',{old3b:r.old3b,pr139:r.signedPr139});
});
test('12 未显式授权经理不得转移，即使职位是经理',async()=>{
 const r=await handoff('no-explicit-ability');assert.equal(r.body.code,'F06_REAL_HANDOFF_PERMISSION_SCOPE_DENIED');
 assert.equal(Number((await handoffFacts()).responsible_employee_id),1);
});
test('13 当前经理显式Permission+Capability+Scope合法授予',async()=>{
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,997002,'allow',clock_timestamp())");
 await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,997002,$1,clock_timestamp()-interval '3 minutes')",[scope1]);
 assert.equal(await count("SELECT count(*)::int n FROM public.employee_permission_overrides WHERE employee_id=1 AND permission_id=997002 AND decision='allow'"),1);
});
test('14 独立Target Employee 4真实签名Token+不同principal和会话',async()=>{
 const p=await auth.withSession(targetToken,async(c,a)=>({kind:a.principal_kind,employeeId:Number(a.employee_id)}),{normalOnly:true});
 assert.deepEqual(p,{kind:'employee',employeeId:4});
 assert.notEqual(managerToken,targetToken);
});
test('15 独立Manager 2真实签名Token+不同principal',async()=>{
 const p=await auth.withSession(peerToken,async(c,a)=>Number(a.employee_id),{normalOnly:true});
 assert.equal(p,2);assert.notEqual(peerToken,managerToken);
});
test('16 真HTTP/PG16合法经理正式Handoff old1→new4、Version1',async()=>{
 const r=await handoff('first');
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.code,'F06_REAL_HANDOFF_ATOMIC_SIGNED');
 assert.deepEqual([r.body.oldResponsibleId,r.body.newResponsibleId,r.body.version],[1,4,1]);
 assert.ok(r.body.backendPid>0);console.log('F06_HANDOFF_AUTHENTIC_BACKEND',r.body.backendPid);
});
test('17 公表只改当前负责人、交易还在in_progress且原Lock身份不动',async()=>{
 const x=await handoffFacts();assert.equal(x.status,'in_progress');assert.equal(x.completed_at,null);
 assert.equal(Number(x.responsible_employee_id),4);assert.equal(x.events,1);
 assert.equal(Number(x.source_lock_id),locks[1]);
 const l=(await rows('SELECT lock_status,end_reason,responsible_employee_id FROM public.locks WHERE lock_id=$1',[locks[1]]))[0];
 assert.deepEqual([l.lock_status,l.end_reason,Number(l.responsible_employee_id)],['released','converted_to_transaction',1]);
});
test('18 PR139初建Origin保留原Responsible 1，旧3B origin仍为0',async()=>{
 const o=(await rows('SELECT responsible_employee_id FROM f06_real_tx_ci.origins WHERE transaction_id=$1',[tx[1]]))[0];
 assert.equal(Number(o.responsible_employee_id),1);
 assert.deepEqual([ (await handoffFacts()).legacy,(await handoffFacts()).pr139],[0,1]);
});
test('19 同Actor同Key同Payload重放幂等不新增Event/Audit',async()=>{
 const before=await handoffFacts(),r=await handoff('first');
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.code,'F06_REAL_HANDOFF_IDEMPOTENT');
 assert.deepEqual(await handoffFacts(),before);
});
test('20 同Key更换Target/Reason严格冲突',async()=>{
 const r=await handoff('first',tx[1],2,1,0);assert.equal(r.body.code,'F06_REAL_HANDOFF_IDEMPOTENCY_CONFLICT');
});
test('21 重放同Key不同Actor严格冲突',async()=>{
 const r=await handoff('first',tx[1],4,1,0,{},peerToken);assert.equal(r.body.code,'F06_REAL_HANDOFF_IDEMPOTENCY_CONFLICT');
});
test('22 不同Key但旧版本过期必须CAS拒绝',async()=>{
 const r=await handoff('stale',tx[1],2,1,0);assert.equal(r.body.code,'F06_REAL_HANDOFF_STALE_VERSION_CONFLICT');
});
test('23 当前员工4可签名读取自己的新责任，未强制旧Actor继续有效',async()=>{
 const r=await inspect(tx[1]);assert.equal(r.allowed,true,JSON.stringify(r));
 assert.deepEqual([r.originalId,r.currentId,r.version],[1,4,1]);
});
test('24 旧PR146 Cancel不可暗用交接后的新Responsible',async()=>{
 const r=await childCall('cancel',managerToken,{transactionId:tx[1],reason:'Synthetic cancellation after signed handoff must reject',eventKey:key('cancel-after-handoff')});
 assert.equal(r.allowed,false,JSON.stringify(r));
 assert.equal((await handoffFacts()).status,'in_progress');
});
test('25 旧PR150 Refund不可对尚在途的Handoff Transaction虚假通过',async()=>{
 const r=await childCall('refund',managerToken,{transactionId:tx[1],amountCents:1,reason:'Synthetic no-payment refund wrong state',eventKey:key('refund-after-handoff')});
 assert.equal(r.allowed,false,JSON.stringify(r));assert.equal((await handoffFacts()).status,'in_progress');
});
test('26 新授权Target失效必须立即拒绝',async()=>{
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{const r=await handoff('inactive-new',tx[2]);assert.equal(r.body.code,'F06_REAL_HANDOFF_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('27 Manager权限撤销必须拒绝',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=997002");
 try{const r=await handoff('manager-no-perm',tx[2]);assert.equal(r.body.code,'F06_REAL_HANDOFF_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=997002")}
});
test('28 Scope撤销必须拒绝',async()=>{
 await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1',[scope1]);
 try{const r=await handoff('scope-deny',tx[2]);assert.equal(r.body.code,'F06_REAL_HANDOFF_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1',[scope1])}
});
test('29 原Responsible离职仍允许合法经理代办移交而非要求旧负责人授权',async()=>{
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=1");
 try{
  const r=await handoff('inactive-old',tx[2],4,1,0,{},peerToken);
  assert.equal(r.status,201,JSON.stringify(r.body));
  assert.equal(Number((await handoffFacts(tx[2])).responsible_employee_id),4);
 }finally{await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=1")}
});
test('30 Manager→Target非有效Team成员/4S拒绝',async()=>{
 await q("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=4",[roles.four_s]);
 try{const r=await handoff('four-s-target',tx[3]);assert.equal(r.body.code,'F06_REAL_HANDOFF_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employees SET main_role_id=$1 WHERE employee_id=4",[roles.sales])}
});
test('31 注错AFTER_CHANGE真实Rollback不改变公表或任何版本记录',async()=>{
 const before=await handoffFacts(tx[3]);
 const r=await handoff('after-change',tx[3],4,1,0,{testCheckpoint:'AFTER_CHANGE_THROW'});
 assert.equal(r.body.code,'F06_REAL_HANDOFF_ATOMIC_ROLLED_BACK');
 assert.deepEqual(await handoffFacts(tx[3]),before);
});
test('32 注错AFTER_EVENT真实Rollback无事件、Key、审计残留',async()=>{
 const before=await handoffFacts(tx[3]);
 const r=await handoff('after-event',tx[3],4,1,0,{testCheckpoint:'AFTER_EVENT_THROW'});
 assert.equal(r.body.code,'F06_REAL_HANDOFF_ATOMIC_ROLLED_BACK');
 assert.deepEqual(await handoffFacts(tx[3]),before);
});
test('33 注错AFTER_AUDIT真实Rollback无半写',async()=>{
 const before=await handoffFacts(tx[3]);
 const r=await handoff('after-audit',tx[3],4,1,0,{testCheckpoint:'AFTER_AUDIT_THROW'});
 assert.equal(r.body.code,'F06_REAL_HANDOFF_ATOMIC_ROLLED_BACK');
 assert.deepEqual(await handoffFacts(tx[3]),before);
});
test('34 两个不同Employee独立有效Manager Token/PG后端竞态仅一成功',async()=>{
 const [a,b]=await Promise.all([
  handoff('race-one',tx[3],4,1,0,{},managerToken),
  handoff('race-two',tx[3],4,1,0,{},peerToken)
 ]);
 assert.equal(Number(a.body.allowed)+Number(b.body.allowed),1,JSON.stringify({a:a.body,b:b.body}));
 assert.ok(a.body.backendPid&&b.body.backendPid&&a.body.backendPid!==b.body.backendPid,JSON.stringify({a,b}));
 console.log('F06_REAL_HANDOFF_TWO_EMPLOYEE_TWO_PG_BACKENDS',JSON.stringify({a:a.body.backendPid,b:b.body.backendPid,success:1}));
});
test('35 并发竞争仅单Event/Key/Audit且公表负责人合法',async()=>{
 const r=await handoffFacts(tx[3]);assert.deepEqual([r.responsible_employee_id,r.events,r.keys,r.audits],['4',1,1,1]);
});
test('36 已移交给4的Transaction通过真实版本2连续移交到2',async()=>{
 const r=await handoff('second-version',tx[1],2,4,1);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.version,2);
 const x=await inspect(tx[1]);assert.deepEqual([x.originalId,x.currentId,x.version],[1,2,2]);
});
test('37 旧版本链签名Event和当前责任一致，版本及Actor不可伪造',async()=>{
 const events=await rows('SELECT version,old_responsible_employee_id,new_responsible_employee_id,actor_employee_id,prior_event_id,event_id FROM f06_real_handoff_ci.events WHERE transaction_id=$1 ORDER BY version',[tx[1]]);
 assert.equal(events.length,2);assert.deepEqual(events.map(x=>Number(x.version)),[1,2]);
 assert.equal(Number(events[0].old_responsible_employee_id),1);
 assert.equal(Number(events[1].old_responsible_employee_id),4);
 assert.equal(Number(events[1].prior_event_id),Number(events[0].event_id));
});
test('38 修改Version签封与删除RequestKey均被append-only拒绝',async()=>{
 await assert.rejects(q('UPDATE f06_real_handoff_ci.events SET version=version WHERE transaction_id=$1',[tx[1]]),/F06_REAL_HANDOFF_IMMUTABLE_HISTORY/);
 await assert.rejects(q('DELETE FROM f06_real_handoff_ci.request_keys WHERE transaction_id=$1',[tx[1]]),/F06_REAL_HANDOFF_IMMUTABLE_HISTORY/);
});
test('39 Customer owner 普通变更不影响签名Transaction当前负责人',async()=>{
 await q('UPDATE public.customers SET current_owner_employee_id=4 WHERE customer_id=$1',[customer]);
 try{assert.equal(Number((await handoffFacts(tx[1])).responsible_employee_id),2)}
 finally{await q('UPDATE public.customers SET current_owner_employee_id=$1 WHERE customer_id=$2',[customerOwner,customer])}
});
test('40 前台HTTP绝不回传VIN/Phone/Token或任何真钱金额',async()=>{
 const r=await handoff('self-deny',tx[1],2,2,2);
 assert.ok(!/vin|phone|token|password|amountCents|real_payment/i.test(JSON.stringify(r.body)));
});


const cancelRoute='/__ci__/f06-real-post-handoff-cancel/cancel';
const cancelKey=s=>'f06-post-cancel-'+s+'-'+process.env.GITHUB_RUN_ID;
const cancelBody=(s,id=tx[1],version=2,extras={})=>({transactionId:id,expectedVersion:version,
 reason:'Synthetic signed post-handoff normal cancellation '+s,eventKey:cancelKey(s),...extras});
async function cancelCall(body,actor=peerToken,path=cancelRoute,method='POST',headers={}){
 const h={'content-type':'application/json',...headers};
 if(actor)h.authorization='Bearer '+actor;
 const r=await fetch(cancelUrl+path,{method,headers:h,body:method==='GET'?undefined:JSON.stringify(body)});
 return {status:r.status,body:await r.json()};
}
const cancel=(s,id=tx[1],version=2,extras={},actor=peerToken)=>cancelCall(cancelBody(s,id,version,extras),actor);
async function cancelFacts(id=tx[1]){
 return (await rows("SELECT t.status,t.completed_at,t.responsible_employee_id,t.source_lock_id,"+
 "(SELECT count(*)::int FROM f06_real_post_handoff_cancel_ci.origins WHERE transaction_id=t.transaction_id) origins,"+
 "(SELECT count(*)::int FROM f06_real_post_handoff_cancel_ci.events WHERE transaction_id=t.transaction_id) events,"+
 "(SELECT count(*)::int FROM f06_real_post_handoff_cancel_ci.request_keys WHERE transaction_id=t.transaction_id) keys,"+
 "(SELECT count(*)::int FROM public.audit_events a WHERE a.object_kind='Transaction' AND a.object_id=t.transaction_id::text AND a.action='f06_real_post_handoff_cancel_ci_cancelled') audits"+
 " FROM public.transactions t WHERE transaction_id=$1",[id]))[0];
}
async function grantCancel(id){
 const s=(await rows("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=$1 AND scope_kind='team' AND scope_reference_id=$2 AND ended_at IS NULL LIMIT 1",[id,teamId]))[0];
 const scopeId=s?Number(s.scope_id):Number((await q("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES($1,'team',$2) RETURNING scope_id",[id,teamId])).rows[0].scope_id);
 await q("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,997003,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow'",[id]);
 const n=await count("SELECT count(*)::int n FROM public.employee_capability_scope_bindings WHERE employee_id=$1 AND permission_id=997003 AND scope_id=$2",[id,scopeId]);
 if(!n)await q("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,997003,$2,clock_timestamp()-interval '3 minutes')",[id,scopeId]);
 return scopeId;
}
test('41 新取消自身精确分支与官方SHA门禁',()=>assertCancelEntry());
test('42 新取消PR153父Attestation非特权PG16原签链',async()=>assert.equal((await verifyCancel(db)).verified,true));
test('43 生产取消Issuer硬拒',()=>assert.equal(cancelProductionIssuerDeny().allowed,false));
test('44 真实资金与Completed动作硬拒',()=>{assert.equal(paymentDeny().allowed,false);assert.equal(cancelCompletedDeny().allowed,false)});
test('45 正式生产Transaction取消路由404',async()=>assert.equal((await cancelCall({},peerToken,'/api/v1/transactions/1/cancel')).status,404));
test('46 正式退款和支付路由404',async()=>assert.equal((await cancelCall({},peerToken,'/api/v1/refund_payments')).status,404));
test('47 HTTP GET不修改任何交易',async()=>assert.equal((await cancelCall({},peerToken,cancelRoute,'GET')).status,404));
test('48 无Bearer不能取消交易',async()=>assert.equal((await cancelCall(cancelBody('no-token'),null)).status,401));
test('49 假Bearer不能取消交易',async()=>assert.equal((await cancelCall(cancelBody('fake'),'0'.repeat(43))).status,401));
test('50 非法TransactionId被400拒绝',async()=>assert.equal((await cancel('bad-id',-1)).status,400));
test('51 取消必须签明期望Handoff版本',async()=>assert.equal((await cancelCall(cancelBody('bad-version',tx[1],0))).status,400));
test('52 当前签名链尾身份2与旧初始1、版本2真实一致',async()=>{
 const r=await inspect(tx[1]);assert.deepEqual([r.allowed,r.originalId,r.currentId,r.version],[true,1,2,2]);
});
test('53 冻结PR146旧取消仍不可假复用',async()=>{
 const r=await cancelWorker('oldcancel',peerToken,{transactionId:tx[1],reason:'Synthetic legacy Cancel must fail after Handoff',eventKey:cancelKey('legacy')});
 assert.equal(r.allowed,false,JSON.stringify(r));
});
test('54 新Handoff当前签名负责人未获独立Cancel权限时拒',async()=>{
 const r=await cancel('permission-not-auto');assert.equal(r.body.code,'F06_POST_CANCEL_PERMISSION_SCOPE_DENIED',JSON.stringify(r));
});
test('55 当前Employee2和4各自独立Permission+Capability+Team Scope受控创建',async()=>{
 cancelScope2=await grantCancel(2);cancelScope4=await grantCancel(4);
 assert.ok(cancelScope2>0&&cancelScope4>0);
});
test('56 历史Old Responsible即便是Manager也不得越权取消',async()=>{
 const r=await cancel('old-signer',tx[1],2,{},managerToken);
 assert.equal(r.body.allowed,false,JSON.stringify(r));
});
test('57 移交版本2不能使用过期Version1取消',async()=>{
 const r=await cancel('stale-version',tx[1],1);assert.equal(r.body.code,'F06_POST_CANCEL_STALE_HANDOFF_VERSION');
});
test('58 Version2当前负责人Employee2真HTTP PG16合法取消',async()=>{
 const r=await cancel('success');assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal(r.body.code,'F06_POST_CANCEL_ATOMIC_SIGNED');assert.equal(r.body.version,2);
 assert.ok(r.body.backendPid>0);console.log('F06_POST_CANCEL_REAL_BACKEND',r.body.backendPid);
});
test('59 Transaction变终态cancelled不产生Completed',async()=>{
 const f=await cancelFacts();assert.equal(f.status,'cancelled');assert.equal(f.completed_at,null);assert.equal(Number(f.responsible_employee_id),2);
});
test('60 新Origin+Event+Key+Audit同事务各唯一一行',async()=>{
 const f=await cancelFacts();assert.deepEqual([f.origins,f.events,f.keys,f.audits],[1,1,1,1]);
});
test('61 新签原件包含初始与当前负责、版本和签名链摘要',async()=>{
 const o=(await rows('SELECT * FROM f06_real_post_handoff_cancel_ci.origins WHERE transaction_id=$1',[tx[1]]))[0];
 assert.deepEqual([Number(o.original_responsible_employee_id),Number(o.current_responsible_employee_id),Number(o.handoff_version)],[1,2,2]);
 assert.match(o.handoff_event_digest,/^[a-f0-9]{64}$/);assert.match(o.parent_tx_digest,/^[a-f0-9]{64}$/);
 assert.ok(Number(o.signed_team_id)>0&&Number(o.signed_store_id)>0&&Number(o.signed_scope_id)>0&&Number(o.signed_permission_id)===997003);
});
test('62 同Actor同Key同Payload重放必幂等',async()=>{
 const f=await cancelFacts(),r=await cancel('success');
 assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.code,'F06_POST_CANCEL_IDEMPOTENT');
 assert.deepEqual(await cancelFacts(),f);
});
test('63 相同Key换Reason冲突',async()=>{
 const r=await cancel('success',tx[1],2,{reason:'Synthetic changed post-handoff cancellation request'});
 assert.equal(r.body.code,'F06_POST_CANCEL_IDEMPOTENCY_CONFLICT');
});
test('64 不同Key已cancelled不可重复取消',async()=>{
 const r=await cancel('again');assert.equal(r.body.code,'F06_POST_CANCEL_ONLY_IN_PROGRESS');
});
test('65 真取消后冻结PR150不认新来源仍FailClosed',async()=>{
 const r=await cancelWorker('refund',peerToken,{transactionId:tx[1],amountCents:1,reason:'Old refund must not trust new post-handoff signed cancel',eventKey:cancelKey('no-old-refund')});
 assert.equal(r.allowed,false,JSON.stringify(r));console.log('F06_POST_CANCEL_OLD_REFUND_FAIL_CLOSED',r.code);
});
test('66 Cancel无付款且不可生成资金支付',async()=>{
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
 assert.equal(await count('SELECT count(*)::int n FROM f06_real_cancel_ci.origins WHERE transaction_id=$1',[tx[1]]),0);
});
test('67 新签封Origin/Event/Key物理不可修改删除',async()=>{
 await assert.rejects(q('UPDATE f06_real_post_handoff_cancel_ci.origins SET reason=reason WHERE transaction_id=$1',[tx[1]]),/F06_POST_CANCEL_IMMUTABLE_SIGNED_HISTORY/);
 await assert.rejects(q('DELETE FROM f06_real_post_handoff_cancel_ci.events WHERE transaction_id=$1',[tx[1]]),/F06_POST_CANCEL_IMMUTABLE_SIGNED_HISTORY/);
});
test('68 Version1现负责人4可独立正常取消',async()=>{
 const r=await cancel('version1-success',tx[2],1,{},targetToken);
 assert.equal(r.status,201,JSON.stringify(r.body));assert.equal((await cancelFacts(tx[2])).status,'cancelled');
});
test('69 未授权4S角色取消拒绝',async()=>{
 await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=4',[roles.four_s]);
 try{const r=await cancel('four-s',tx[3],1,{},targetToken);assert.equal(r.body.allowed,false)}
 finally{await q('UPDATE public.employees SET main_role_id=$1 WHERE employee_id=4',[roles.sales])}
});
test('70 Employee禁用取消被拒',async()=>{
 await q("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=4");
 try{const r=await cancel('inactive',tx[3],1,{},targetToken);assert.equal(r.body.allowed,false)}
 finally{await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=4")}
});
test('71 现时Permission撤销不能继续取消',async()=>{
 await q("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=4 AND permission_id=997003");
 try{const r=await cancel('deny-permission',tx[3],1,{},targetToken);assert.equal(r.body.code,'F06_POST_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=4 AND permission_id=997003")}
});
test('72 Capability结束不能继续取消',async()=>{
 await q("UPDATE public.employee_capability_scope_bindings SET ended_at=clock_timestamp() WHERE employee_id=4 AND permission_id=997003");
 try{const r=await cancel('deny-capability',tx[3],1,{},targetToken);assert.equal(r.body.code,'F06_POST_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE employee_id=4 AND permission_id=997003')}
});
test('73 数据Scope失效不能继续取消',async()=>{
 await q('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=$1',[cancelScope4]);
 try{const r=await cancel('deny-scope',tx[3],1,{},targetToken);assert.equal(r.body.code,'F06_POST_CANCEL_PERMISSION_SCOPE_DENIED')}
 finally{await q('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=$1',[cancelScope4])}
});
test('74 Customer停用真实交易不能取消',async()=>{
 await q("UPDATE public.customers SET account_status='disabled' WHERE customer_id=$1",[customer]);
 try{const r=await cancel('customer-disabled',tx[3],1,{},targetToken);assert.equal(r.body.allowed,false)}
 finally{await q("UPDATE public.customers SET account_status='active' WHERE customer_id=$1",[customer])}
});
test('75 AFTER_STATUS注错同真实PG事务Rollback',async()=>{
 const f=await cancelFacts(tx[3]),r=await cancel('throw-status',tx[3],1,{testCheckpoint:'AFTER_STATUS_THROW'},targetToken);
 assert.equal(r.body.code,'F06_POST_CANCEL_ATOMIC_ROLLED_BACK',JSON.stringify(r));
 assert.deepEqual(await cancelFacts(tx[3]),f);
});
test('76 AFTER_EVENT注错Origin Event Key Audit全部Rollback',async()=>{
 const f=await cancelFacts(tx[3]),r=await cancel('throw-event',tx[3],1,{testCheckpoint:'AFTER_EVENT_THROW'},targetToken);
 assert.equal(r.body.code,'F06_POST_CANCEL_ATOMIC_ROLLED_BACK',JSON.stringify(r));
 assert.deepEqual(await cancelFacts(tx[3]),f);
});
test('77 AFTER_AUDIT注错新签封与Public状态全Rollback',async()=>{
 const f=await cancelFacts(tx[3]),r=await cancel('throw-audit',tx[3],1,{testCheckpoint:'AFTER_AUDIT_THROW'},targetToken);
 assert.equal(r.body.code,'F06_POST_CANCEL_ATOMIC_ROLLED_BACK',JSON.stringify(r));
 assert.deepEqual(await cancelFacts(tx[3]),f);
});
test('78 不同Employee Token两个PG backend竞争，只有当前签负责人4成功',async()=>{
 const [a,b]=await Promise.all([cancel('race-current',tx[3],1,{},targetToken),cancel('race-old-manager',tx[3],1,{},peerToken)]);
 assert.equal(Number(a.body.allowed)+Number(b.body.allowed),1,JSON.stringify({a,b}));
 assert.ok(a.body.backendPid&&b.body.backendPid&&a.body.backendPid!==b.body.backendPid,JSON.stringify({a,b}));
 console.log('F06_POST_CANCEL_TWO_EMPLOYEE_PG_BACKENDS',a.body.backendPid,b.body.backendPid);
});
test('79 双Backend竞争后至多一个版本Cancel并且资金零写',async()=>{
 const f=await cancelFacts(tx[3]);assert.deepEqual([f.status,f.origins,f.events,f.keys,f.audits],['cancelled',1,1,1,1]);
 assert.equal(await count('SELECT count(*)::int n FROM public.refund_payments'),0);
});
test('80 签名PR139源Lock永久维持released，旧Priority/Visibility不得恢复',async()=>{
 for(const id of [tx[1],tx[2],tx[3]]){
  const l=(await rows("SELECT l.lock_status,l.end_reason FROM public.locks l JOIN public.transactions t ON t.source_lock_id=l.lock_id WHERE t.transaction_id=$1",[id]))[0];
  assert.deepEqual([l.lock_status,l.end_reason],['released','converted_to_transaction']);
 }
});

test('81 同一Transaction Handoff与Cancel并发竞争仅一方提交且签名版本一致',async()=>{
 const prep=await handoff('handoff-cancel-race-prep',tx[4],4,1,0,{},managerToken);
 assert.equal(prep.status,201,JSON.stringify(prep.body));
 const [h,c]=await Promise.all([
  handoff('handoff-cancel-race-v2',tx[4],2,4,1,{},managerToken),
  cancel('handoff-cancel-race',tx[4],1,{},targetToken)
 ]);
 assert.equal(Number(h.body.allowed)+Number(c.body.allowed),1,JSON.stringify({handoff:h.body,cancel:c.body}));
 assert.ok(h.body.backendPid&&c.body.backendPid&&h.body.backendPid!==c.body.backendPid,
  JSON.stringify({handoff:h.body,cancel:c.body}));
 const cf=await cancelFacts(tx[4]),hf=await handoffFacts(tx[4]);
 if(h.body.allowed){
  assert.equal(c.body.allowed,false);
  assert.equal(cf.status,'in_progress');
  assert.deepEqual([cf.origins,cf.events,cf.keys,cf.audits],[0,0,0,0]);
  assert.deepEqual([Number(hf.responsible_employee_id),hf.events,hf.keys,hf.audits],[2,2,2,2]);
 }else{
  assert.equal(c.body.allowed,true);
  assert.equal(h.body.allowed,false);
  assert.deepEqual([cf.status,cf.origins,cf.events,cf.keys,cf.audits],['cancelled',1,1,1,1]);
  assert.deepEqual([Number(hf.responsible_employee_id),hf.events,hf.keys,hf.audits],[4,1,1,1]);
 }
 console.log('F06_POST_CANCEL_HANDOFF_RACE_SAFE_PASS',JSON.stringify({handoff:h.body,cancel:c.body}));
});
