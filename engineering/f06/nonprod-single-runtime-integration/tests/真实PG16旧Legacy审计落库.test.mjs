import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import pg from 'pg';
import {createIsolatedF06LockService} from '../../../src/f06-lock-service.mjs';
import {verifyF06TestDatabase} from '../../../src/f06-lock-readiness.mjs';

const url='postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test';
const env={
 APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:url
};
const sha=value=>createHash('sha256').update(value).digest('hex');

test('A整改：旧CI_LEGACY模式仍向真实PG16 public.audit_events 写入原始f06_real_test_created',async()=>{
 const db=new pg.Client({connectionString:url,connectionTimeoutMillis:5000});
 const pool=new pg.Pool({connectionString:url,max:2,connectionTimeoutMillis:5000});
 try{
  await db.connect();
  assert.equal(await verifyF06TestDatabase(db),true);
  const id=(await db.query("SELECT current_database() database,current_user role,pg_backend_pid() pid,"+
   "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser")).rows[0];
  assert.equal(id.database,'f06_lock_test');
  assert.equal(id.role,'f06_lock_ci');
  assert.equal(id.superuser,false);

  const owner=(await db.query("SELECT e.employee_id FROM public.employees e "+
   "JOIN public.roles r ON r.role_id=e.main_role_id "+
   "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
   "JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=e.store_id "+
   "JOIN public.stores s ON s.store_id=t.store_id "+
   "WHERE e.employment_status='active' AND r.role_code IN('sales','manager','store_head') "+
   "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
   "AND t.team_status='active' AND s.status='active' "+
   "AND NOT EXISTS(SELECT 1 FROM public.f05_3a_member_create_licenses f "+
   " WHERE f.employee_id=e.employee_id AND f.revoked_at IS NULL) "+
   "ORDER BY e.employee_id LIMIT 1")).rows[0];
  assert.ok(owner,'verified signed parent must include an eligible existing owner');
  const customerId=97280101,vehicleId=97281101,cycleId=97282101;
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) "+
   "VALUES($1,'active',1,'assigned',$2)",[customerId,owner.employee_id]);
  await db.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) "+
   "VALUES($1,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 day')",[customerId]);
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) "+
   "VALUES($1,'mingbang','available','visible',$2)",[vehicleId,owner.employee_id]);
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) "+
   "VALUES($1,$2,clock_timestamp()-interval '1 day')",[cycleId,vehicleId]);
  const token=randomBytes(32).toString('base64url');
  await db.query("INSERT INTO f06_real_lock_test.customer_sessions(token_sha256,customer_id,issuer,expires_at) "+
   "VALUES($1,$2,'DISPOSABLE_TEST_ONLY',clock_timestamp()+interval '1 hour')",[sha(token),customerId]);
  const service=createIsolatedF06LockService({pool,env});
  const result=await service.intake({
   token,vehicleId:String(vehicleId),listingCycleId:String(cycleId),
   idempotencyKey:'legacy_audit_issue164_'+process.env.GITHUB_RUN_ID
  });
  assert.equal(result.status,201,JSON.stringify(result));
  assert.equal(result.body.code,'LOCK_REQUEST_PENDING');
  const requestId=String(result.body.requestId);
  const audit=(await db.query("SELECT action FROM public.audit_events "+
   "WHERE object_kind='LockRequest' AND object_id=$1 ORDER BY action",[requestId])).rows;
  assert.deepEqual(audit.map(x=>x.action),['f06_real_test_created']);
  const event=(await db.query("SELECT event_type FROM f06_real_lock_test.events "+
   "WHERE request_id=$1",[requestId])).rows;
  assert.deepEqual(event.map(x=>x.event_type),['created']);
  const compositeCount=(await db.query("SELECT count(*)::int n FROM public.audit_events "+
   "WHERE object_kind='LockRequest' AND object_id=$1 AND action LIKE 'f06_composite_%'",[requestId])).rows[0].n;
  assert.equal(compositeCount,0,'CI_LEGACY cannot silently change the historical action namespace');
  const trustedSource=(await db.query("SELECT issuer FROM f06_real_lock_test.request_keys WHERE request_id=$1",[requestId])).rows[0];
  assert.equal(trustedSource.issuer,'DISPOSABLE_TEST_ONLY');
  console.log('F06_164_LEGACY_AUDIT_DB_PASS '+JSON.stringify({
   sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,
   pgBackendPid:id.pid,requestId,legacyAction:audit[0].action,
   legacyEvent:event[0].event_type,productionReady:false
  }));
 }finally{
  await db.end().catch(()=>{});
  await pool.end();
 }
});
