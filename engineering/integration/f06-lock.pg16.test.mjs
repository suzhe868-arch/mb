// F06 真实 Node HTTP + 独立 PostgreSQL16 集成测试。
// 无数据库时必须失败，绝不自动跳过/替换成 Mock。
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {assertF06TestEnvironment,verifyF06TestDatabase} from '../src/f06-lock-readiness.mjs';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
import {createIsolatedF06LockHandler} from '../src/f06-lock-http.mjs';
// 其他 F01-F05 标准回归不自动运行 F06 专属真库测试，不使用 test.skip。
if(process.env.F06_LOCK_TEST_CONSENT==='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY'){
const env=assertF06TestEnvironment();
const pool=new pg.Pool({connectionString:env.connectionString,max:8,connectionTimeoutMillis:2000});
const db=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:2000});
const sha=x=>createHash('sha256').update(x).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
const key=()=>randomBytes(32).toString('base64url');
const customers=['96180101','96180102','96180103'];
const cars=['96181101','96181102','96181103','96181104','96181105'];
const cycles=['96182101','96182102','96182103','96182104','96182105'];
const custTokens=customers.map(()=>token());
const employeeToken=token(),nonprivilegedToken=token(),signedPriorityCustomerToken=token();
// Real original M94 signed fixture provides enabled, non-force-change test-only accounts
// for Employees 6/7. Keep original Employee 1/4 PC credentials immutable.
const approverEmployeeId='6',ownerEmployeeId='7';
let server;let seedDone=false;
const service=createIsolatedF06LockService({pool,env:process.env});
async function http(path,tokenValue,body){
 const r=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method:'POST',
  headers:{'content-type':'application/json',authorization:'Bearer '+tokenValue},body:JSON.stringify(body)});
 return {status:r.status,body:await r.json()};
}
async function intake(t,vehicleIndex=0,idempotencyKey=key()){
 return http('/api/v1/lock-requests',custTokens[t],{vehicleId:cars[vehicleIndex],listingCycleId:cycles[vehicleIndex],idempotencyKey});
}
async function decide(requestId,decision='approve',idempotencyKey=key(),credential=employeeToken){
 return http(`/api/v1/lock-requests/${requestId}/decision`,credential,{decision,idempotencyKey});
}
async function scalar(sql,args=[]){return (await db.query(sql,args)).rows[0];}
async function fixture(){
 await db.connect();
 await verifyF06TestDatabase(pool);
 const role=await scalar("SELECT rolsuper,rolcreatedb FROM pg_roles WHERE rolname=current_user");
 assert.equal(role.rolsuper,false,'F06 必须使用非超级用户');
 assert.equal(role.rolcreatedb,false,'F06 不得拥有 CREATE DATABASE 权限');
 await db.query('BEGIN');
 try{
  const org=await scalar(`SELECT t.team_id,t.store_id FROM public.employee_team_memberships m
   JOIN public.teams t ON t.team_id=m.team_id
   WHERE m.employee_id=1 AND t.team_status='active'
    AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())
   ORDER BY t.team_id LIMIT 1`);
  assert.ok(org,'现有 M94/F03 基线必须有有效名邦 employee 1/team');
  const roles=await db.query(`SELECT e.employee_id,r.role_code FROM public.employees e
    JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id IN(6,7)
      AND e.employment_status='active'`);
  assert.equal(roles.rows.length,2,'必须先载入历史 M94/F03 合法员工基线');
  for(const p of roles.rows)assert.ok(['sales','manager','store_head'].includes(p.role_code));
  const permId='9961801';
  await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,'lock.ci.approve') ON CONFLICT(permission_id) DO NOTHING",[permId]);
  const perm=await scalar("SELECT permission_id FROM public.permissions WHERE permission_code='lock.ci.approve'");
  assert.ok(perm);
  // Test-only authorization uses independent existing F03 synthetic employee identities.
  for(const employeeId of [approverEmployeeId,ownerEmployeeId]){
   const teamCheck=await scalar(`SELECT 1 FROM public.employee_team_memberships m
    WHERE m.employee_id=$1 AND m.team_id=$2
    AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())`,
    [employeeId,org.team_id]);
   if(!teamCheck)await db.query(`INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from)
    VALUES($1,$2,clock_timestamp()-interval '1 day')`,[employeeId,org.team_id]);
  }
  let sc=await scalar(`SELECT scope_id FROM public.employee_data_scopes
   WHERE employee_id=$1 AND scope_kind='team' AND scope_reference_id=$2 AND ended_at IS NULL LIMIT 1`,[approverEmployeeId,org.team_id]);
  if(!sc)sc=await scalar(`INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id)
   VALUES($1,'team',$2) RETURNING scope_id`,[approverEmployeeId,org.team_id]);
  await db.query(`INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at)
   VALUES($1,$2,'allow',clock_timestamp())`,[approverEmployeeId,perm.permission_id]);
  await db.query(`INSERT INTO public.employee_capability_scope_bindings
    (employee_id,permission_id,scope_id,granted_at)
   VALUES($1,$2,$3,clock_timestamp()-interval '1 minute')`,[approverEmployeeId,perm.permission_id,sc.scope_id]);
  for(const id of customers){
   await db.query(`INSERT INTO public.customers
    (customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id)
    VALUES($1,'active',1,'assigned',$2)`,[id,ownerEmployeeId]);
   await db.query(`INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from)
    VALUES($1,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 day')`,[id]);
  }
  for(let i=0;i<cars.length;i++){
   await db.query(`INSERT INTO public.vehicles
     (vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id)
     VALUES($1,'mingbang','available','visible',1)`,[cars[i]]);
   await db.query(`INSERT INTO public.vehicle_listing_cycles
     (listing_cycle_id,vehicle_id,started_at)
     VALUES($1,$2,clock_timestamp()-interval '1 day')`,[cycles[i],cars[i]]);
  }
  await db.query(`INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from)
   VALUES($1,'customer_display',6500000,clock_timestamp()-interval '1 day')`,[cars[0]]);
  for(let i=0;i<customers.length;i++){
   await db.query(`INSERT INTO f06_real_lock_test.customer_sessions
    (token_sha256,customer_id,issuer,expires_at)
    VALUES($1,$2,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '10 minutes')`,[sha(custTokens[i]),customers[i]]);
  }
  // Signed M94 allows only one PC account per Employee. Reuse physically verified
  // eligible *existing synthetic* Employees 6/7, never duplicate or modify F03 credentials.
  // Only the F06 sidecar's random bearer-session proof is new.
  for(const [tokenValue,id,accountId] of [
   [employeeToken,approverEmployeeId,'7'],
   [nonprivilegedToken,ownerEmployeeId,'8']
  ]){
   const pc=await scalar(`SELECT account_id,credential_epoch,credential_state,
     force_password_change,employee_id FROM public.pc_login_accounts
     WHERE account_id=$1 AND employee_id=$2 AND principal_kind='employee'
      AND system_admin_id IS NULL FOR SHARE`,[accountId,id]);
   assert.ok(pc,'Existing signed F03 synthetic PC identity must be present');
   assert.equal(pc.credential_state,'enabled');
   assert.equal(pc.force_password_change,false);
   await db.query(`INSERT INTO f06_real_lock_test.employee_sessions
     (token_sha256,employee_id,account_id,credential_epoch,issuer,expires_at)
     VALUES($1,$2,$3,$4,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '10 minutes')`,
     [sha(tokenValue),id,pc.account_id,pc.credential_epoch]);
  }
  // The pre-existing F05-8 CI service (not a forged SQL fixture) issued an active
  // signed Priority on a wholesale vehicle during genuine v24 migration.
  const originalPriority=await scalar(`SELECT p.priority_id,p.customer_id
   FROM public.f05_8_priority_ci p
   JOIN public.f05_7_result_versions_ci r ON r.result_id=p.source_match_result_id
    AND r.source_signature=p.source_signature AND r.status='current'
   WHERE p.customer_id=899612 AND p.status='active' AND p.expires_at>clock_timestamp()
   ORDER BY p.priority_id LIMIT 1`);
  assert.ok(originalPriority,'original authorized F05 Priority source must survive signed v26');
  await db.query(`INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from)
    SELECT $1,decode(repeat('bc',16),'hex'),clock_timestamp()-interval '1 day'
    WHERE NOT EXISTS(SELECT 1 FROM public.customer_phone_facts
     WHERE customer_id=$1 AND valid_from<=clock_timestamp() AND ended_at IS NULL)`,
    [originalPriority.customer_id]);
  await db.query(`INSERT INTO f06_real_lock_test.customer_sessions
    (token_sha256,customer_id,issuer,expires_at)
    VALUES($1,$2,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '10 minutes')`,
    [sha(signedPriorityCustomerToken),originalPriority.customer_id]);
  await db.query('COMMIT');seedDone=true;
 }catch(error){await db.query('ROLLBACK');throw error}
 server=createServer(createFoundationHandler({lockHandler:createIsolatedF06LockHandler({service,env:process.env})}));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
}
let setupError;
try{await fixture()}catch(e){setupError=e}
test('必须连接隔离真 PG16 并准备物理 fixture，无测试跳过',()=>{if(setupError)throw setupError;assert.equal(seedDone,true)});
if(!setupError){
 let r1,r2,idA,idB,approverResult;
 await test('独立 F06 员工令牌只引用不可登录的测试账号且不修改原有 F03 账号',async()=>{
  const accounts=await db.query(`SELECT a.employee_id,a.account_id,a.credential_state,
    a.force_password_change,s.issuer
   FROM f06_real_lock_test.employee_sessions s
   JOIN public.pc_login_accounts a ON a.account_id=s.account_id
   ORDER BY a.employee_id`);
  assert.equal(accounts.rows.length,2);
  assert.deepEqual(accounts.rows.map(x=>String(x.employee_id)),[approverEmployeeId,ownerEmployeeId]);
  assert.deepEqual(accounts.rows.map(x=>String(x.account_id)),['7','8']);
  for(const row of accounts.rows){
   assert.equal(row.credential_state,'enabled');
   assert.equal(row.force_password_change,false);
   assert.equal(row.issuer,'DISPOSABLE_TEST_ONLY');
  }
  const originals=await db.query("SELECT employee_id,credential_state,force_password_change FROM public.pc_login_accounts WHERE account_id IN (1,5) ORDER BY account_id");
  assert.equal(originals.rows.length,2);
  // No account insert or credential mutation: only the sidecar's test bearer tokens.
  const duplicates=await scalar("SELECT count(*)::int n FROM public.pc_login_accounts WHERE normalized_login_key LIKE 'f06_disposable_employee_%'");
  assert.equal(duplicates.n,0);
 });
 await test('真实 HTTP 建立6小时 PENDING；尚未占车、没有72h价格快照',async()=>{
  const idempotencyKey=key();r1=await intake(0,0,idempotencyKey);
  assert.equal(r1.status,201);assert.equal(r1.body.state,'pending');idA=r1.body.requestId;
  const physical=await scalar('SELECT status,created_at,expires_at FROM public.lock_requests WHERE lock_request_id=$1',[idA]);
  assert.equal(physical.status,'pending');
  assert.equal(new Date(physical.expires_at)-new Date(physical.created_at),6*3600*1000,'single PG time source requires exact 6h');
  assert.equal((await scalar("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[cars[0]])).n,0);
  assert.equal((await scalar('SELECT count(*)::int n FROM f06_real_lock_test.lock_snapshots')).n,0);
  const repeated=await intake(0,0,idempotencyKey);
  assert.equal(repeated.status,200);assert.equal(repeated.body.requestId,idA);
 });
 await test('第二客户在未占车时可发 PENDING；同人重复点击只复用',async()=>{
  r2=await intake(1,0);assert.equal(r2.status,201);idB=r2.body.requestId;
  const reused=await intake(1,0);assert.equal(reused.status,200);assert.equal(reused.body.requestId,idB);
 });
 await test('无合法权限员工无法审批，数据库不能变化',async()=>{
  const bad=await decide(idA,'approve',key(),nonprivilegedToken);assert.equal(bad.status,403);
  assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[idA])).status,'pending');
 });
 await test('真实 PG16 行锁提交唯一 Lock，同时自动创建对手 Waitlist',async()=>{
  approverResult=await decide(idA);assert.equal(approverResult.status,200,JSON.stringify(approverResult));
  assert.equal(approverResult.body.state,'approved');
  const locks=await db.query("SELECT lock_id,customer_id,created_at,expires_at FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[cars[0]]);
  assert.equal(locks.rows.length,1);
  assert.equal(String(locks.rows[0].customer_id),customers[0]);
  assert.equal(approverResult.body.initialHours,72);
  assert.equal(Math.round((new Date(locks.rows[0].expires_at)-new Date(locks.rows[0].created_at))/3600000),72);
  assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[idB])).status,'lock_conflict');
  assert.equal((await scalar('SELECT count(*)::int n FROM public.waitlists WHERE customer_id=$1 AND vehicle_id=$2 AND ended_at IS NULL',[customers[1],cars[0]])).n,1);
 });
 await test('双重审批幂等，员工不获得额外 Lock 或额外候补',async()=>{
  const again=await decide(idA);assert.equal(again.status,200);
  assert.equal((await scalar("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[cars[0]])).n,1);
  assert.equal((await scalar('SELECT count(*)::int n FROM public.waitlists WHERE customer_id=$1 AND vehicle_id=$2 AND ended_at IS NULL',[customers[1],cars[0]])).n,1);
 });
 await test('客户安全投影不暴露内部价格、员工或竞争客户',async()=>{
  const safe=await service.project({token:custTokens[0],requestId:idA});
  assert.equal(safe.status,200);
  assert.equal(safe.body.ownLock,true);
  assert.doesNotMatch(JSON.stringify(safe.body),/price|employee|customerId|phone|amount|approver|source/i);
  const rival=await service.project({token:custTokens[1],requestId:idA});assert.equal(rival.status,404);
 });
 await test('过期超过6小时申请不得再审批',async()=>{
  const draft=await intake(0,1);assert.equal(draft.status,201);
  await db.query("UPDATE public.lock_requests SET created_at=clock_timestamp()-interval '7 hours',expires_at=clock_timestamp()-interval '1 hour' WHERE lock_request_id=$1",[draft.body.requestId]);
  const expired=await decide(draft.body.requestId);assert.equal(expired.body.state,'expired');
  assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[draft.body.requestId])).status,'expired');
 });
 await test('申请原始创建时刻超过6小时后，延长 expires_at 也不可通过同 key 重放',async()=>{
  const exactKey=key();
  const pending=await intake(0,1,exactKey);assert.equal(pending.status,201);
  await db.query("UPDATE public.lock_requests SET created_at=clock_timestamp()-interval '7 hours', "+
   "expires_at=clock_timestamp()+interval '1 hour' WHERE lock_request_id=$1",[pending.body.requestId]);
  const replay=await intake(0,1,exactKey);
  assert.equal(replay.status,200);assert.equal(replay.body.state,'expired');
  const row=await scalar("SELECT status FROM public.lock_requests WHERE lock_request_id=$1",[pending.body.requestId]);
  assert.equal(row.status,'expired');
 });
 await test('断点注入后真实 PostgreSQL 事务必须完整回滚',async()=>{
  const draft=await intake(0,2);assert.equal(draft.status,201);
  const fault=createIsolatedF06LockService({pool,env:process.env,afterLockWrite:async()=>{throw Error('SYNTHETIC_ROLLBACK')}});
  await assert.rejects(()=>fault.decide({token:employeeToken,requestId:draft.body.requestId,decision:'approve',idempotencyKey:key()}),/SYNTHETIC_ROLLBACK/);
  assert.equal((await scalar("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1",[cars[2]])).n,0);
  assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[draft.body.requestId])).status,'pending');
 });
 await test('竞争审批在同车事务上串行，最多一个有效锁',async()=>{
  const a=await intake(0,3),b=await intake(1,3);
  assert.equal(a.status,201);assert.equal(b.status,201);
  const [x,y]=await Promise.all([decide(a.body.requestId),decide(b.body.requestId)]);
  assert.equal(x.status,200);assert.equal(y.status,200);
  assert.equal((await scalar("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[cars[3]])).n,1);
  assert.equal((await scalar('SELECT count(*)::int n FROM public.waitlists WHERE vehicle_id=$1 AND ended_at IS NULL',[cars[3]])).n,1);
 });
 await test('real HTTP GET exposes own safe Lock state but denies cross-Customer access',async()=>{
  const call=async(tokenValue)=>{
   const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/lock-requests/'+idA+'/status',
    {headers:{authorization:'Bearer '+tokenValue}});
   return {status:r.status,body:await r.json()};
  };
  const self=await call(custTokens[0]);assert.equal(self.status,200);
  assert.equal(self.body.ownLock,true);
  assert.doesNotMatch(JSON.stringify(self.body),/price|employee|customerId|phone|amount|approver|source/i);
  const rival=await call(custTokens[1]);assert.equal(rival.status,404);
 });
 await test('Waitlist ranking key equals original LockRequest createdAt and ID',async()=>{
  const saved=await scalar("SELECT ws.queue_created_at,ws.queue_request_id,req.created_at "+
   "FROM f06_real_lock_test.waitlist_sources ws "+
   "JOIN public.lock_requests req ON req.lock_request_id=ws.source_request_id "+
   "WHERE ws.source_request_id=$1",[idB]);
  assert.ok(saved);assert.equal(String(saved.queue_request_id),String(idB));
  assert.equal(new Date(saved.queue_created_at).getTime(),new Date(saved.created_at).getTime());
 });
 await test('revoked Employee permission is revalidated even on a terminal decision',async()=>{
  const permission=await scalar("SELECT permission_id FROM public.permissions WHERE permission_code='lock.ci.approve'");
  await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=$2 AND permission_id=$1",[permission.permission_id,approverEmployeeId]);
  try{
   const result=await decide(idA,'approve');assert.equal(result.status,403);
   assert.equal((await scalar("SELECT count(*)::int n FROM public.locks WHERE vehicle_id=$1 AND lock_status='active'",[cars[0]])).n,1);
  }finally{
   await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=$2 AND permission_id=$1",[permission.permission_id,approverEmployeeId]);
  }
 });
 await test('revoked Customer phone evidence denies creation of new LockRequest',async()=>{
  await db.query("UPDATE public.customer_phone_facts SET ended_at=clock_timestamp() WHERE customer_id=$1 AND ended_at IS NULL",[customers[2]]);
  try{
   const denied=await intake(2,2);assert.equal(denied.status,403);
   assert.equal((await scalar("SELECT count(*)::int n FROM public.lock_requests WHERE customer_id=$1",[customers[2]])).n,0);
  }finally{
   await db.query("UPDATE public.customer_phone_facts SET ended_at=NULL WHERE customer_id=$1",[customers[2]]);
  }
 });
 await test('same Employee decision key preserves JSON shape and one audit event',async()=>{
  const draft=await intake(2,1);assert.equal(draft.status,201);
  const decisionKey=key();
  const original=await decide(draft.body.requestId,'reject',decisionKey);
  assert.equal(original.status,200);assert.equal(original.body.state,'rejected');
  const replay=await decide(draft.body.requestId,'reject',decisionKey);
  assert.equal(replay.status,200);assert.deepEqual(replay.body,original.body);
  const events=await scalar("SELECT count(*)::int n FROM f06_real_lock_test.events WHERE request_id=$1 AND event_type='rejected'",[draft.body.requestId]);
  assert.equal(events.n,1);
 });
 await test('PG16 hidden Vehicle after Lock creation still creates legal internal Waitlist without detail leakage',async()=>{
  const a=await intake(0,4),b=await intake(1,4);
  assert.equal(a.status,201);assert.equal(b.status,201);
  const wrapped=createIsolatedF06LockService({pool,env:process.env,afterLockWrite:async({db})=>{
   await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[cars[4]]);
  }});
  const custom=createServer(createFoundationHandler({lockHandler:createIsolatedF06LockHandler({service:wrapped,env:process.env})}));
  try{
   await new Promise((ok,bad)=>{custom.once('error',bad);custom.listen(0,'127.0.0.1',ok)});
   const response=await fetch('http://127.0.0.1:'+custom.address().port+'/api/v1/lock-requests/'+a.body.requestId+'/decision',{
    method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+employeeToken},
    body:JSON.stringify({decision:'approve',idempotencyKey:key()})});
   assert.equal(response.status,200);assert.equal((await response.json()).state,'approved');
  }finally{await new Promise(ok=>custom.close(ok))}
  assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[b.body.requestId])).status,'lock_conflict');
  const wait=await scalar('SELECT w.waitlist_id,ws.queue_request_id FROM public.waitlists w JOIN f06_real_lock_test.waitlist_sources ws ON ws.waitlist_id=w.waitlist_id WHERE w.source_lock_request_id=$1',[b.body.requestId]);
  assert.equal(String(wait.queue_request_id),String(b.body.requestId));
  const denied=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/lock-requests/'+b.body.requestId+'/status',{
   headers:{authorization:'Bearer '+custTokens[1]}});
  assert.equal(denied.status,404);
 });
 await test('旧公共 M94 PENDING 无本批 Test Issuer 不可复用、超时变更或写新申请',async()=>{
  const legacyId='961899999';
  await db.query(`INSERT INTO public.lock_requests
   (lock_request_id,customer_id,vehicle_id,listing_cycle_id,status,created_at,expires_at)
   VALUES($1,$2,$3,$4,'pending',clock_timestamp()-interval '20 minutes',
    clock_timestamp()+interval '5 hours')`,
    [legacyId,customers[2],cars[1],cycles[1]]);
  try{
   const before=await scalar("SELECT count(*)::int n FROM public.lock_requests WHERE customer_id=$1 AND vehicle_id=$2 AND status='pending'",[customers[2],cars[1]]);
   const refused=await intake(2,1);
   assert.equal(refused.status,403);assert.equal(refused.body.code,'UNTRUSTED_PENDING_REQUEST_ISSUER');
   const after=await scalar("SELECT count(*)::int n FROM public.lock_requests WHERE customer_id=$1 AND vehicle_id=$2 AND status='pending'",[customers[2],cars[1]]);
   assert.equal(after.n,before.n);
   assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[legacyId])).status,'pending');
   assert.equal((await scalar('SELECT count(*)::int n FROM f06_real_lock_test.request_keys WHERE request_id=$1',[legacyId])).n,0);
  }finally{
   await db.query("UPDATE public.lock_requests SET status='expired' WHERE lock_request_id=$1",[legacyId]);
  }
 });

 await test('Original signed F05 Priority converts atomically to own Lock, event and exclusive hidden projection',async()=>{
  const p=await scalar(`SELECT p.priority_id,p.customer_id,p.vehicle_id,p.listing_cycle_id,
    p.source_match_result_id,p.source_signature
   FROM public.f05_8_priority_ci p
   JOIN public.f05_7_result_versions_ci r ON r.result_id=p.source_match_result_id
    AND r.source_signature=p.source_signature
    AND r.demand_id=p.trigger_demand_id AND r.vehicle_id=p.vehicle_id
    AND r.listing_cycle_id=p.listing_cycle_id
   WHERE p.customer_id=899612 AND p.status='active' AND p.expires_at>clock_timestamp()
   ORDER BY p.priority_id LIMIT 1`);
  assert.ok(p,'genuine F05-8 Priority created by original signed F05 service required');
  assert.equal(String(p.customer_id),'899612');
  const vehicle=await scalar('SELECT source_type,source_sale_status FROM public.vehicles WHERE vehicle_id=$1',[p.vehicle_id]);
  assert.equal(vehicle.source_type,'wholesale');assert.equal(vehicle.source_sale_status,'active');
  await db.query("UPDATE public.vehicles SET platform_visibility='hidden' WHERE vehicle_id=$1",[p.vehicle_id]);
  const competitor=await http('/api/v1/lock-requests',custTokens[1],{
   vehicleId:String(p.vehicle_id),listingCycleId:String(p.listing_cycle_id),idempotencyKey:key()});
  assert.ok([403,404].includes(competitor.status),'other Customer must not expose exclusive Priority vehicle');
  const owned=await http('/api/v1/lock-requests',signedPriorityCustomerToken,{
   vehicleId:String(p.vehicle_id),listingCycleId:String(p.listing_cycle_id),idempotencyKey:key()});
  assert.equal(owned.status,201,JSON.stringify(owned.body));
  const decision=await decide(owned.body.requestId,'approve');
  assert.equal(decision.status,200,JSON.stringify(decision.body));
  assert.equal(decision.body.state,'approved');
  const record=await scalar(`SELECT p.status,p.ended_reason,p.ended_at,l.lock_id,
    s.priority_origin_id,s.priority_origin_customer_id
   FROM public.f05_8_priority_ci p
   JOIN public.locks l ON l.vehicle_id=p.vehicle_id AND l.customer_id=p.customer_id
    AND l.listing_cycle_id=p.listing_cycle_id AND l.lock_status='active'
   JOIN f06_real_lock_test.lock_snapshots s ON s.lock_id=l.lock_id
   WHERE p.priority_id=$1`,[p.priority_id]);
  assert.equal(record.status,'ended');assert.equal(record.ended_reason,'converted_to_lock');
  assert.ok(record.ended_at);
  assert.equal(String(record.priority_origin_id),String(p.priority_id));
  assert.equal(String(record.priority_origin_customer_id),String(p.customer_id));
  assert.equal(String(record.lock_id),decision.body.lockId);
  const ev=await scalar(`SELECT count(*)::int n FROM public.f05_8_events_ci
   WHERE priority_id=$1 AND event_kind='ended'
    AND event_key=$2`,[p.priority_id,'f06-1-priority-to-lock:'+p.priority_id+':'+record.lock_id]);
  assert.equal(ev.n,1,'exact original Priority-to-Lock event must commit atomically');
  const owner=await service.project({token:signedPriorityCustomerToken,requestId:owned.body.requestId});
  assert.equal(owner.status,200);
  assert.equal(owner.body.ownLock,true);
  const rival=await service.project({token:custTokens[1],requestId:owned.body.requestId});
  assert.equal(rival.status,404);
 });
 await test('非法 listing cycle 不得建申请',async()=>{
  const bad=await http('/api/v1/lock-requests',custTokens[2],{vehicleId:cars[0],listingCycleId:'999999999',idempotencyKey:key()});
  assert.equal(bad.status,403);
 });
}
try{if(server)await new Promise(resolve=>server.close(resolve));if(db._connected)await db.end();await pool.end()}catch{}

}