// Issue171 affected Legacy-only core regression: fresh, isolated native PG16,
 // authentic CI_LEGACY LockRequest / approval / original synthetic absence proof.
 // No F05 Priority row is fabricated; unrelated historical full-suite fixture
 // requires signing at v24 and cannot be post-inserted into the v26 baseline.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import pg from 'pg';
import {createIsolatedF06LockService} from '../../../src/f06-lock-service.mjs';
import {createIsolatedF06LockLifecycleService} from '../../../src/f06-lock-lifecycle-service.mjs';
import {createDisposableF06FinanceProofAdapter} from '../../../src/f06-lock-lifecycle-finance-test-adapter.mjs';
import {verifyF06TestDatabase} from '../../../src/f06-lock-readiness.mjs';

const DSN='postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test';
const env={
 APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:DSN,
 F06_LOCK_LIFECYCLE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY',
 F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY'
};
const sha=x=>createHash('sha256').update(x).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
const nonce=()=>randomBytes(32).toString('base64url');
const first=async(db,q,args=[]) => (await db.query(q,args)).rows[0];

test('Issue171回归：CI_LEGACY原生非超管PG16普通Lock生命周期保持完整',async t=>{
 const db=new pg.Client({connectionString:DSN,connectionTimeoutMillis:7000});
 const pool=new pg.Pool({connectionString:DSN,connectionTimeoutMillis:7000,max:4});
 try{
  await db.connect();
  assert.equal(await verifyF06TestDatabase(db),true);
  await t.test('01 Legacy真PG16身份、24条正式已签迁移不伪造',async()=>{
   const ident=await first(db,"SELECT current_database() db,current_user role,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,(SELECT count(*)::int FROM public.f03_schema_migrations) migration_count,pg_backend_pid() pid");
   assert.equal(ident.db,'f06_lock_test');assert.equal(ident.role,'f06_lock_ci');
   assert.equal(ident.superuser,false);assert.equal(ident.migration_count,24);
   t.diagnostic('F06_171_LEGACY_NON_SUPERUSER_PG16 '+JSON.stringify(ident));
  });
  const org=await first(db,"SELECT t.team_id FROM public.employee_team_memberships m JOIN public.teams t ON t.team_id=m.team_id WHERE m.employee_id=1 AND t.team_status='active' AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) ORDER BY t.team_id LIMIT 1");
  assert.ok(org,'true signed M94 employee/team baseline required');
  const ids=await db.query("SELECT employee_id FROM public.employees WHERE employee_id IN (6,7) AND employment_status='active'");
  assert.equal(ids.rowCount,2);
  for(const employee of [6,7]){
   const valid=await first(db,"SELECT 1 FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 AND valid_from<=clock_timestamp() AND (ended_at IS NULL OR ended_at>clock_timestamp())",[employee,org.team_id]);
   if(!valid)await db.query("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from) VALUES($1,$2,clock_timestamp()-interval '1 day')",[employee,org.team_id]);
  }
  let approval=await first(db,"SELECT permission_id FROM public.permissions WHERE permission_code='lock.ci.approve'");
  if(!approval)approval=await first(db,"INSERT INTO public.permissions(permission_id,permission_code) VALUES(9961801,'lock.ci.approve') RETURNING permission_id");
  let scope=await first(db,"SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=6 AND scope_kind='team' AND scope_reference_id=$1 AND ended_at IS NULL ORDER BY scope_id LIMIT 1",[org.team_id]);
  if(!scope)scope=await first(db,"INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(6,'team',$1) RETURNING scope_id",[org.team_id]);
  const allow=await first(db,"SELECT 1 FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=$1",[approval.permission_id]);
  if(!allow)await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(6,$1,'allow',clock_timestamp())",[approval.permission_id]);
  else await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=6 AND permission_id=$1",[approval.permission_id]);
  const binding=await first(db,"SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=6 AND permission_id=$1 AND scope_id=$2 AND ended_at IS NULL",[approval.permission_id,scope.scope_id]);
  if(!binding)await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(6,$1,$2,clock_timestamp()-interval '1 minute')",[approval.permission_id,scope.scope_id]);
  const account=async id=>{
   const row=await first(db,"SELECT account_id,credential_epoch FROM public.pc_login_accounts WHERE employee_id=$1 AND principal_kind='employee' AND system_admin_id IS NULL AND credential_state='enabled' AND force_password_change=false ORDER BY account_id LIMIT 1",[id]);
   assert.ok(row,'original actual F03 employee credential required');
   const bearer=token();
   await db.query("INSERT INTO f06_real_lock_test.employee_sessions(token_sha256,employee_id,account_id,credential_epoch,issuer,expires_at) VALUES($1,$2,$3,$4,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '1 hour')",[sha(bearer),id,row.account_id,row.credential_epoch]);
   return bearer;
  };
  const ownerToken=await account(7),approverToken=await account(6);
  const customerId=99280101;
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',7)",[customerId]);
  await db.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES($1,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 day')",[customerId]);
  const customerToken=token();
  await db.query("INSERT INTO f06_real_lock_test.customer_sessions(token_sha256,customer_id,issuer,expires_at) VALUES($1,$2,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '1 hour')",[sha(customerToken),customerId]);
  const locks=createIsolatedF06LockService({pool,env});
  const lifecycle=createIsolatedF06LockLifecycleService({pool,env});
  const proof=createDisposableF06FinanceProofAdapter({pool,env});
  const makeLock=async i=>{
   const vehicleId=99281101+i,cycleId=99282101+i;
   await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) VALUES($1,'mingbang','available','visible',1)",[vehicleId]);
   await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,clock_timestamp()-interval '1 day')",[cycleId,vehicleId]);
   await db.query("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES($1,'customer_display',6500000,clock_timestamp()-interval '1 day')",[vehicleId]);
   const req=await locks.intake({token:customerToken,vehicleId:String(vehicleId),listingCycleId:String(cycleId),idempotencyKey:nonce()});
   assert.equal(req.status,201,JSON.stringify(req));
   const approved=await locks.decide({token:approverToken,requestId:req.body.requestId,decision:'approve',idempotencyKey:nonce()});
   assert.equal(approved.status,200,JSON.stringify(approved));
   assert.equal(approved.body.code,'LOCK_APPROVED');
   return String(approved.body.lockId);
  };
  const created=[];for(let i=0;i<5;i++)created.push(await makeLock(i));
  const [extendLock,releaseLock,cancelLock,expireLock,unverifiedLock]=created;
  // The native old service intentionally has an independent disposable source.
  for(const lockId of [extendLock,releaseLock,cancelLock,expireLock])await proof.issue({lockId,kind:'absent'});
  await t.test('02 旧LockRequest/审批形成五个真实原Lock快照',async()=>{
   const rows=await db.query("SELECT lock_id FROM f06_real_lock_test.lock_snapshots WHERE lock_id=ANY($1::bigint[])",[[extendLock,releaseLock,cancelLock,expireLock,unverifiedLock]]);
   assert.equal(rows.rowCount,5);
  });
  const expiry=new Date(Date.now()+7*86400000).toISOString(),key=nonce();
  const input={token:ownerToken,lockId:extendLock,action:'extend',idempotencyKey:key,reason:'Native Legacy extension regression',newExpiresAt:expiry};
  const extend=await lifecycle.act(input);
  await t.test('03 CI_LEGACY无资金证据下真实延期成功',()=>{
   assert.equal(extend.status,200,JSON.stringify(extend));assert.equal(extend.body.code,'LOCK_EXTENDED');
  });
  const replay=await lifecycle.act(input);
  await t.test('04 CI_LEGACY仍保持原幂等重放且事件不可重复',async()=>{
   assert.equal(replay.status,200);assert.equal(replay.body.code,'LOCK_EXTENDED');
   const count=await first(db,"SELECT count(*)::int n FROM f06_real_lock_test.lock_lifecycle_events WHERE lock_id=$1",[extendLock]);
   assert.equal(count.n,1);
  });
  const collision=await lifecycle.act({...input,reason:'Changed payload'});
  await t.test('05 CI_LEGACY相同Key不同负载强拒',()=>{
   assert.equal(collision.status,409);
   assert.equal(collision.body.code,'LOCK_LIFECYCLE_IDEMPOTENCY_COLLISION');
  });
  const released=await lifecycle.act({token:ownerToken,lockId:releaseLock,action:'release',idempotencyKey:nonce(),reason:'Legacy release'});
  await t.test('06 CI_LEGACY真实人工释放成功',()=>{
   assert.equal(released.status,200,JSON.stringify(released));assert.equal(released.body.code,'LOCK_RELEASED');
  });
  const cancelled=await lifecycle.act({token:ownerToken,lockId:cancelLock,action:'cancel',idempotencyKey:nonce(),reason:'Legacy cancel'});
  await t.test('07 CI_LEGACY真实人工取消成功',()=>{
   assert.equal(cancelled.status,200,JSON.stringify(cancelled));assert.equal(cancelled.body.code,'LOCK_CANCELLED');
  });
  const tooEarly=await lifecycle.expireOrdinary({lockId:expireLock});
  await t.test('08 旧原PG数据库时钟未到期拒绝',()=>{
   assert.equal(tooEarly.status,409);assert.equal(tooEarly.body.code,'LOCK_NOT_EXPIRED_BY_DATABASE_CLOCK');
  });
  await db.query("UPDATE public.locks SET created_at=created_at-interval '4 days',expires_at=expires_at-interval '4 days' WHERE lock_id=$1",[expireLock]);
  const expired=await lifecycle.expireOrdinary({lockId:expireLock});
  await t.test('09 旧无资金Lock按真实PG时钟到期',()=>{
   assert.equal(expired.status,200,JSON.stringify(expired));assert.equal(expired.body.code,'LOCK_EXPIRED');
  });
  const without=await lifecycle.act({token:ownerToken,lockId:unverifiedLock,action:'release',idempotencyKey:nonce(),reason:'No source proof'});
  await t.test('10 CI_LEGACY没有原合成财务缺席证明仍然强拒',()=>{
   assert.equal(without.status,409);assert.equal(without.body.code,'LOCK_FINANCIAL_SOURCE_UNKNOWN_DENY');
  });
  await t.test('11 原CI_LEGACY审计action不变且不混入Composite',async()=>{
   const audit=(await db.query("SELECT action FROM public.audit_events WHERE object_kind='Lock' AND object_id=$1 AND action LIKE 'f06_lock_lifecycle_%'",[extendLock])).rows;
   assert.deepEqual(audit.map(x=>x.action),['f06_lock_lifecycle_extend']);
   const composite=await first(db,"SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Lock' AND object_id=$1 AND action LIKE 'f06_composite_lock_lifecycle_%'",[extendLock]);
   assert.equal(composite.n,0);
  });
  await t.test('12 旧Legacy不可变事件真实PG拒绝修改',async()=>{
   await assert.rejects(db.query("UPDATE f06_real_lock_test.lock_lifecycle_events SET reason='forbidden' WHERE lock_id=$1",[extendLock]),/IMMUTABLE/);
  });
  t.diagnostic('F06_171_AFFECTED_LEGACY_LIFECYCLE_REAL_PG16_PASS');
 }finally{
  await db.end().catch(()=>{});
  await pool.end();
 }
});
