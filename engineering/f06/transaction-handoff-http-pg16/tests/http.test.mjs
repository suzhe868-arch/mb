import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,productionIssuerDeny,completedDeny,financialDeny} from '../service.mjs';
import {assertEntry,createHttpServer,childCall} from '../server.mjs';
import {withF062} from '../../deposit-ledger-ci/migration.mjs';
import {withParentBranch} from '../../lock-lifecycle-ci/migration.mjs';
import {intakeCI,decisionCI} from '../../lockrequest-approval-waitlist-ci/service.mjs';
const secret=Buffer.alloc(32,61),customer=86180101,vehicle=n=>86181100+n,cycle=n=>86182100+n;
const old=fn=>withF062(()=>withParentBranch(fn));
const q=(sql,args=[])=>db.query(sql,args),rows=async(s,a=[]) => (await q(s,a)).rows;
const count=async(s,a=[])=>Number((await rows(s,a))[0].n);
const key=s=>'f06-real-handoff-'+s+'-'+process.env.GITHUB_RUN_ID;
const route='/__ci__/f06-real-transaction-handoff/transfer';
let db,auth,server,url,originalToken,managerToken,peerToken,targetToken,roles,teamId,scope1,locks={},tx={},customerOwner;
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
 const createAccount=async(employeeId,login)=>q(
  "INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change,credential_epoch) "+
  "VALUES($1,'employee',$2,$3,'enabled',false,1) RETURNING account_id",
  [login,employeeId,authSource.password_hash]);
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
});
after(async()=>{if(server?.listening)await new Promise(resolve=>server.close(resolve));if(auth)await auth.close();if(db)await db.end();secret.fill(0)});
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
 const r=await handoff('inactive-old',tx[2],4,1,0,{},peerToken);
 assert.equal(r.status,201,JSON.stringify(r.body));
 assert.equal(Number((await handoffFacts(tx[2])).responsible_employee_id),4);
 await q("UPDATE public.employees SET employment_status='active' WHERE employee_id=1");
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
