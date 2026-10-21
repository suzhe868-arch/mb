// Issue171：在一次性PG16副本上，用正式F05签发路径构造真实Priority来源Lock。
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash,randomBytes} from 'node:crypto';
import pg from 'pg';
import {createFoundationServer} from '../../../src/app.mjs';
import {hashPassword,newOpaqueToken} from '../../../src/f03-auth-crypto.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {createIsolatedF06CompositeRuntime} from '../../../src/f06-nonprod-composite-runtime.mjs';
import {assertCompositeSignedRun} from '../../nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {verifyLifecycleIssuer} from '../可信LifecycleIssuer.mjs';
const DSN=process.env.F03_1_DATABASE_URL,sha=x=>createHash('sha256').update(x).digest('hex');
function envSetup(){
 Object.assign(process.env,{APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',CI:'true',GITHUB_ACTIONS:'true',
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F03_1_DATABASE_URL:DSN,F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
  F06_COMPOSITE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY',F06_COMPOSITE_SIGNED_ISSUER:'COMPOSITE_NONPROD_SIGNED_V1',
  F06_LOCK_LIFECYCLE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_ONLY',
  F06_LOCK_LIFECYCLE_EXPIRY_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_EXPIRY_ONLY',
  F06_LOCK_LIFECYCLE_FAULT_INJECTION:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_LIFECYCLE_FAULTS'});
 const secret=randomBytes(32);process.env.F03_1_HMAC_KEY_BASE64=secret.toString('base64');return secret;
}
async function ensurePermission(db,code){
 const row=(await db.query('SELECT permission_id FROM public.permissions WHERE permission_code=$1',[code])).rows[0];
 if(row)return Number(row.permission_id);
 const id=Number((await db.query('SELECT COALESCE(MAX(permission_id),0)+1 id FROM public.permissions')).rows[0].id);
 return Number((await db.query('INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2) RETURNING permission_id',[id,code])).rows[0].permission_id);
}
async function grant(db,eid,teamId,permissions){
 let m=(await db.query('SELECT 1 FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 AND valid_from<=clock_timestamp() AND (ended_at IS NULL OR ended_at>clock_timestamp())',[eid,teamId])).rowCount;
 if(!m)await db.query("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from) VALUES($1,$2,clock_timestamp()-interval '2 minutes')",[eid,teamId]);
 let s=(await db.query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=$1 AND scope_kind='team' AND scope_reference_id=$2 AND ended_at IS NULL ORDER BY scope_id LIMIT 1",[eid])).rows[0];
 if(!s)s=(await db.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES($1,'team',$2) RETURNING scope_id",[eid,teamId])).rows[0];
 for(const pid of permissions){
  if((await db.query('SELECT 1 FROM public.employee_permission_overrides WHERE employee_id=$1 AND permission_id=$2',[eid,pid])).rowCount)
   await db.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=$1 AND permission_id=$2",[eid,pid]);
  else await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,$2,'allow',clock_timestamp())",[eid,pid]);
  if(!(await db.query('SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=$1 AND permission_id=$2 AND scope_id=$3 AND ended_at IS NULL',[eid,pid,s.scope_id])).rowCount)
   await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,$2,$3,clock_timestamp()-interval '2 minutes')",[eid,pid,s.scope_id]);
 }
}
async function account(db,eid,run){
 const login='cmp'+eid+'_'+String(run).slice(-6),password='PriorityPass_'+eid+'_2026!',hash=await hashPassword(password);
 let a=(await db.query("SELECT account_id FROM public.pc_login_accounts WHERE principal_kind='employee' AND employee_id=$1 AND system_admin_id IS NULL ORDER BY account_id LIMIT 1",[eid])).rows[0];
 if(a){
  await db.query("UPDATE public.pc_login_accounts SET normalized_login_key=$2,password_hash=$3,credential_state='enabled',force_password_change=false,credential_epoch=credential_epoch+1,updated_at=clock_timestamp() WHERE account_id=$1",[a.account_id,login,hash]);
  await db.query('UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,clock_timestamp()) WHERE account_id=$1',[a.account_id]);
 }else await db.query("INSERT INTO public.pc_login_accounts(principal_kind,employee_id,system_admin_id,normalized_login_key,password_hash,credential_state,force_password_change,credential_epoch,created_at,updated_at) VALUES('employee',$1,NULL,$2,$3,'enabled',false,1,clock_timestamp(),clock_timestamp())",[eid,login,hash]);
 return {login,password};
}
async function login(auth,a){const x=await auth.login({login:a.login,password:a.password,source:'issue171_real_priority_origin'});assert.equal(x.code,'AUTH_OK',JSON.stringify(x));assert.equal(x.restricted,false);return x.token;}
async function post(base,path,token,body){const r=await fetch(base+path,{method:'POST',signal:AbortSignal.timeout(25000),headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
test('Issue171真实PG16签名Priority来源锁生命周期拒绝矩阵',async t=>{
 assert.ok(DSN,'isolated PG16 database URL is required');
 const secret=envSetup();let db,auth,runtime,server;
 try{
  db=new pg.Client({connectionString:DSN,connectionTimeoutMillis:5000});await db.connect();
  const run=assertCompositeSignedRun();
  const identity=(await db.query("SELECT current_database() db,current_user role,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,(SELECT oid::text FROM pg_database WHERE datname=current_database()) oid")).rows[0];
  await t.test('01 当前真实Push绑定非超管PG16独立副本',async()=>{
   assert.equal(run.profile,'ISSUE171_COMPOSITE_LOCK_LIFECYCLE_NONPROD_V2');assert.equal(identity.db,'f03_auth_test');
   assert.equal(identity.role,'f03_ci');assert.equal(identity.superuser,false);
   const signed=await verifyLifecycleIssuer(db);assert.equal(signed.verified,true);assert.equal(signed.sha,process.env.GITHUB_SHA);assert.equal(signed.runId,process.env.GITHUB_RUN_ID);
   t.diagnostic('F06_171_PRIORITY_ISOLATED_PG16 '+JSON.stringify(identity));
  });
  const seedState=(await db.query(
   "SELECT (SELECT count(*)::int FROM public.f05_8_qualification_ci WHERE enabled=true) qualified,"+
   "(SELECT count(*)::int FROM public.f05_8_priority_ci p JOIN public.f05_7_result_versions_ci r "+
   "ON r.result_id=p.source_match_result_id AND r.source_signature=p.source_signature "+
   "WHERE p.status='active' AND p.expires_at>clock_timestamp()) priorities"
  )).rows[0];
  assert.equal(Number(seedState.qualified),1,'exactly one Customer must be qualified by the official signed v24 preseed');
  assert.ok(Number(seedState.priorities)>0,'official signed v24 Priority rows must pre-exist the v26 test clone');
  // F05-7's official matcher ran while this disposable database still had its
  // signed v23 ledger, before F05-8/v24 was applied. Never invoke the frozen
  // exact-v23 service against the later v24 Priority-test clone.
  const seeded=(await db.query(
   "SELECT count(*)::int n FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id "+
   "WHERE d.customer_id IN(899612,899613,899618,899619,899620) AND r.status='current' AND r.tier IN('high','acceptable')"
  )).rows[0].n;
  assert.ok(Number(seeded)>0,'signed v23 F05-7 current Match results must pre-exist the v24 Priority test clone');

  const c=(await db.query(
   "SELECT d.customer_id::text customer_id,d.responsible_employee_id::text responsible_employee_id,cs.current_owner_employee_id::text owner_id,"+
   "v.vehicle_id::text vehicle_id,r.listing_cycle_id::text cycle_id,"+
   "(SELECT m.team_id::text FROM public.employee_team_memberships m JOIN public.teams tm ON tm.team_id=m.team_id "+
   "JOIN public.employees e ON e.employee_id=m.employee_id AND tm.store_id=e.store_id "+
   "WHERE m.employee_id=cs.current_owner_employee_id AND m.team_id=901 AND m.valid_from<=statement_timestamp() "+
   "AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()) AND tm.team_status='active' LIMIT 1) team_id "+
   "FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id AND d.demand_state='active' "+
   "JOIN public.customers cs ON cs.customer_id=d.customer_id AND cs.account_status='active' AND cs.owner_assignment_state='assigned' "+
   "JOIN public.f05_6_level_find_policy_ci fp ON fp.level_id=cs.customer_level_id AND fp.find_enabled=true "+
   "JOIN public.f05_7_sales_condition_ci sc ON sc.demand_id=d.demand_id "+
   "JOIN public.f05_7_vehicle_facts_ci vf ON vf.vehicle_id=r.vehicle_id AND vf.listing_cycle_id=r.listing_cycle_id AND vf.available=true "+
   "JOIN public.vehicles v ON v.vehicle_id=r.vehicle_id AND v.source_type='wholesale' AND v.source_sale_status='active' AND v.archived_at IS NULL "+
   "JOIN public.vehicle_listing_cycles cyc ON cyc.listing_cycle_id=r.listing_cycle_id AND cyc.vehicle_id=v.vehicle_id AND cyc.ended_at IS NULL "+
   "WHERE d.customer_id IN(899612,899613,899618,899619,899620) "+
   "AND d.demand_id=(SELECT d0.demand_id FROM public.demands d0 WHERE d0.customer_id=d.customer_id AND d0.demand_state='active' ORDER BY d0.demand_id LIMIT 1) "+
   "AND d.responsible_employee_id=cs.current_owner_employee_id AND r.status='current' AND r.tier IN('high','acceptable') "+
   "AND EXISTS(SELECT 1 FROM public.customer_phone_facts ph WHERE ph.customer_id=cs.customer_id AND ph.valid_from<=clock_timestamp() AND ph.ended_at IS NULL) "+
   "AND NOT EXISTS(SELECT 1 FROM public.locks l WHERE l.vehicle_id=v.vehicle_id AND l.lock_status='active') "+
   "AND NOT EXISTS(SELECT 1 FROM public.lock_requests lr WHERE lr.customer_id=cs.customer_id AND lr.vehicle_id=v.vehicle_id AND lr.listing_cycle_id=r.listing_cycle_id AND lr.status='pending') "+
   "AND NOT EXISTS(SELECT 1 FROM public.transactions tx WHERE tx.vehicle_id=v.vehicle_id AND tx.listing_cycle_id=r.listing_cycle_id AND tx.status IN('trading','in_progress','pending','active')) "+
   "AND EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.customer_id=cs.customer_id AND p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=r.listing_cycle_id AND p.status='active' AND p.expires_at>clock_timestamp()) "+
   "ORDER BY v.vehicle_id,d.customer_id LIMIT 1")).rows[0];
  assert.ok(c,'no eligible pre-signed F05 Priority fixture candidate');assert.equal(Number(c.team_id),901);
  const customerId=Number(c.customer_id),ownerId=Number(c.owner_id),teamId=Number(c.team_id);
  assert.equal(Number(c.responsible_employee_id),ownerId);
  const store=(await db.query('SELECT store_id FROM public.employees WHERE employee_id=$1',[ownerId])).rows[0].store_id;
  const mgr=(await db.query("SELECT e.employee_id::text id FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employment_status='active' AND e.employee_id<>$1 AND e.store_id=$2 AND r.role_code IN('manager','store_head') ORDER BY CASE WHEN r.role_code='manager' THEN 0 ELSE 1 END,e.employee_id LIMIT 1",[ownerId,store])).rows[0];
  assert.ok(mgr,'same-store manager/store-head required');
  const p1=await ensurePermission(db,'matching.rule.manage.ci.synthetic'),p2=await ensurePermission(db,'priority.qualification.manage.ci.synthetic');
  const p3=await ensurePermission(db,'lock.ci.manage'),p4=await ensurePermission(db,'lock.ci.approve');
  await grant(db,ownerId,teamId,[p1,p2,p3]);await grant(db,Number(mgr.id),teamId,[p4]);
  const ownerAccount=await account(db,ownerId,process.env.GITHUB_RUN_ID),managerAccount=await account(db,Number(mgr.id),process.env.GITHUB_RUN_ID);
  const ownerToken=await login(auth,ownerAccount),managerToken=await login(auth,managerAccount);
  const priority=(await db.query("SELECT p.priority_id::text id,p.customer_id::text customer_id,p.vehicle_id::text vehicle_id,p.listing_cycle_id::text cycle_id,p.status,p.ended_reason,p.source_signature,r.source_signature match_signature FROM public.f05_8_priority_ci p JOIN public.f05_7_result_versions_ci r ON r.result_id=p.source_match_result_id AND r.demand_id=p.trigger_demand_id AND r.vehicle_id=p.vehicle_id AND r.listing_cycle_id=p.listing_cycle_id AND r.source_signature=p.source_signature WHERE p.customer_id=$1 AND p.vehicle_id=$2 AND p.listing_cycle_id=$3 AND p.status='active' AND p.expires_at>clock_timestamp() LIMIT 1",[customerId,c.vehicle_id,c.cycle_id])).rows[0];
  assert.ok(priority,'official F05 qualification did not create the signed Priority row');assert.equal(priority.source_signature,priority.match_signature);
  const customerToken=newOpaqueToken();
  await db.query("INSERT INTO f06_composite_v1.customer_sessions(token_sha256,customer_id,issuer,head_sha,run_id,expires_at) VALUES($1,$2,'COMPOSITE_NONPROD_SIGNED_V1',$3,$4,clock_timestamp()+interval '1 hour')",[sha(customerToken),customerId,process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID]);
  runtime=await createIsolatedF06CompositeRuntime(process.env,{sessionSecret:secret,auth});assert.equal(await runtime.ready(),true);
  server=createFoundationServer({lockHandler:runtime.handler,readinessProbe:runtime.ready});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const base='http://127.0.0.1:'+server.address().port;
  const req=await post(base,'/api/v1/lock-requests',customerToken,{vehicleId:String(priority.vehicle_id),listingCycleId:String(priority.cycle_id),idempotencyKey:'issue171-priority-request-'+process.env.GITHUB_RUN_ID});
  assert.equal(req.status,201,JSON.stringify(req.body));
  const approved=await post(base,'/api/v1/lock-requests/'+req.body.requestId+'/decision',managerToken,{decision:'approve',idempotencyKey:'issue171-priority-approve-'+process.env.GITHUB_RUN_ID});
  assert.equal(approved.status,200,JSON.stringify(approved.body));assert.equal(approved.body.code,'LOCK_APPROVED');
  const lockId=String(approved.body.lockId);
  const origin=(await db.query("SELECT s.priority_origin_id::text id,s.priority_origin_customer_id::text origin_customer,p.customer_id::text customer_id,p.vehicle_id::text vehicle_id,p.listing_cycle_id::text cycle_id,p.status,p.ended_reason,p.source_signature,r.source_signature match_signature,ev.event_key FROM f06_composite_v1.lock_snapshots s JOIN public.f05_8_priority_ci p ON p.priority_id=s.priority_origin_id JOIN public.f05_7_result_versions_ci r ON r.result_id=p.source_match_result_id AND r.demand_id=p.trigger_demand_id AND r.vehicle_id=p.vehicle_id AND r.listing_cycle_id=p.listing_cycle_id AND r.source_signature=p.source_signature JOIN public.f05_8_events_ci ev ON ev.priority_id=p.priority_id AND ev.event_kind='ended' AND ev.event_key='f06-1-priority-to-lock:'||p.priority_id||':'||s.lock_id WHERE s.lock_id=$1",[lockId])).rows[0];
  await t.test('02 真F05签名Priority经LockRequest原子转换并绑定Lock快照',async()=>{
   assert.ok(origin);assert.equal(origin.origin_customer,String(customerId));assert.equal(origin.customer_id,String(customerId));
   assert.equal(origin.vehicle_id,String(priority.vehicle_id));assert.equal(origin.cycle_id,String(priority.cycle_id));
   assert.equal(origin.status,'ended');assert.equal(origin.ended_reason,'converted_to_lock');assert.equal(origin.source_signature,origin.match_signature);
   assert.equal(origin.event_key,'f06-1-priority-to-lock:'+String(origin.id)+':'+lockId);
  });
  const facts=async()=>{
   const l=(await db.query('SELECT lock_status,expires_at FROM public.locks WHERE lock_id=$1',[lockId])).rows[0];
   const ev=(await db.query('SELECT count(*)::int n FROM f06_composite_lifecycle_v2.lock_lifecycle_events WHERE lock_id=$1',[lockId])).rows[0].n;
   const au=(await db.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Lock' AND object_id=$1",[lockId])).rows[0].n;
   const p=(await db.query('SELECT status,ended_reason,ended_at,source_signature FROM public.f05_8_priority_ci WHERE priority_id=$1',[origin.id])).rows[0];
   const pe=(await db.query('SELECT count(*)::int n FROM public.f05_8_events_ci WHERE priority_id=$1',[origin.id])).rows[0].n;
   return {status:l.lock_status,expires:new Date(l.expires_at).toISOString(),events:ev,audits:au,priority:{status:p.status,reason:p.ended_reason,ended:p.ended_at?new Date(p.ended_at).toISOString():null,signature:p.source_signature},priorityEvents:pe};
  };
  const expiry=(await db.query("SELECT (clock_timestamp()+interval '120 hours')::timestamptz value")).rows[0].value.toISOString();
  for(const a of [
   {action:'extend',code:'PRIORITY_ORIGIN_ORDINARY_EXTENSION_DENIED'},
   {action:'release',code:'PRIORITY_ORIGIN_ORDINARY_RELEASE_DENIED'},
   {action:'cancel',code:'PRIORITY_ORIGIN_ORDINARY_CANCEL_DENIED'}
  ]){
   const before=await facts(),body={action:a.action,idempotencyKey:'issue171-priority-'+a.action+'-'+process.env.GITHUB_RUN_ID,reason:'Priority-origin Lock remains exclusive'};
   if(a.action==='extend')body.newExpiresAt=expiry;
   const result=await post(base,'/__nonprod__/f06-composite/locks/'+lockId+'/actions',ownerToken,body);
   await t.test('03 '+a.action+'真实HTTP拒绝且Lock/签名事件/审计/Priority无变化',async()=>{
    assert.equal(result.status,409,JSON.stringify(result.body));assert.equal(result.body.code,a.code);assert.deepEqual(await facts(),before);
   });
  }
  await db.query("UPDATE public.locks SET expires_at=clock_timestamp()-interval '1 second' WHERE lock_id=$1",[lockId]);
  const beforeExpire=await facts(),expired=await runtime.lifecycleService.expireOrdinary({lockId});
  await t.test('06 expire真实PG16数据库时钟到期拒绝且无副作用',async()=>{
   assert.equal(expired.status,409,JSON.stringify(expired.body));assert.equal(expired.body.code,'PRIORITY_ORIGIN_ORDINARY_EXPIRY_DENIED');assert.deepEqual(await facts(),beforeExpire);
  });
  t.diagnostic('F06_171_PRIORITY_ORIGIN_REAL_PG16_FOUR_ACTIONS_PASS');
 }finally{
  if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  if(runtime)await runtime.close();if(auth)await auth.close();if(db)await db.end();secret.fill(0);
 }
});
