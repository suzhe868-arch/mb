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
const cars=['96181101','96181102','96181103','96181104'];
const cycles=['96182101','96182102','96182103','96182104'];
const custTokens=customers.map(()=>token());
const employeeToken=token(),nonprivilegedToken=token();
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
    JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id IN(1,4)
      AND e.employment_status='active'`);
  assert.equal(roles.rows.length,2,'必须先载入历史 M94/F03 合法员工基线');
  for(const p of roles.rows)assert.ok(['sales','manager','store_head'].includes(p.role_code));
  const permId='9961801';
  await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,'lock.ci.approve') ON CONFLICT(permission_id) DO NOTHING",[permId]);
  const perm=await scalar("SELECT permission_id FROM public.permissions WHERE permission_code='lock.ci.approve'");
  assert.ok(perm);
  const teamCheck=await scalar(`SELECT 1 FROM public.employee_team_memberships m WHERE m.employee_id=4 AND m.team_id=$1
   AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp())`,[org.team_id]);
  if(!teamCheck)await db.query(`INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from)
   VALUES(4,$1,clock_timestamp()-interval '1 day')`,[org.team_id]);
  let sc=await scalar(`SELECT scope_id FROM public.employee_data_scopes
   WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1`,[org.team_id]);
  if(!sc)sc=await scalar(`INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id)
   VALUES(1,'team',$1) RETURNING scope_id`,[org.team_id]);
  await db.query(`INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at)
   VALUES(1,$1,'allow',clock_timestamp())`,[perm.permission_id]);
  await db.query(`INSERT INTO public.employee_capability_scope_bindings
    (employee_id,permission_id,scope_id,granted_at)
   VALUES(1,$1,$2,clock_timestamp()-interval '1 minute')`,[perm.permission_id,sc.scope_id]);
  for(const id of customers){
   await db.query(`INSERT INTO public.customers
    (customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id)
    VALUES($1,'active',1,'assigned',4)`,[id]);
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
  for(const [tokenValue,id] of [[employeeToken,1],[nonprivilegedToken,4]])
   await db.query(`INSERT INTO f06_real_lock_test.employee_sessions
    (token_sha256,employee_id,issuer,expires_at)
    VALUES($1,$2,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '10 minutes')`,[sha(tokenValue),id]);
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
 await test('真实 HTTP 建立6小时 PENDING；尚未占车、没有72h价格快照',async()=>{
  const idempotencyKey=key();r1=await intake(0,0,idempotencyKey);
  assert.equal(r1.status,201);assert.equal(r1.body.state,'pending');idA=r1.body.requestId;
  const physical=await scalar('SELECT status,created_at,expires_at FROM public.lock_requests WHERE lock_request_id=$1',[idA]);
  assert.equal(physical.status,'pending');
  assert.ok(new Date(physical.expires_at)-new Date(physical.created_at)<=6*3600*1000+2000);
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
  await db.query("UPDATE public.lock_requests SET expires_at=clock_timestamp()-interval '1 second' WHERE lock_request_id=$1",[draft.body.requestId]);
  const expired=await decide(draft.body.requestId);assert.equal(expired.body.state,'expired');
  assert.equal((await scalar('SELECT status FROM public.lock_requests WHERE lock_request_id=$1',[draft.body.requestId])).status,'expired');
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
 await test('非法 listing cycle 不得建申请',async()=>{
  const bad=await http('/api/v1/lock-requests',custTokens[2],{vehicleId:cars[0],listingCycleId:'999999999',idempotencyKey:key()});
  assert.equal(bad.status,403);
 });
}
try{if(server)await new Promise(resolve=>server.close(resolve));if(db._connected)await db.end();await pool.end()}catch{}

}