import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../../f02-1/schema-integrity.mjs';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {hashPassword} from '../../../src/f03-auth-crypto.mjs';
import {PublisherPhoneAdminService} from '../../../src/f03-publisher-phone-admin-service.mjs';
import {assertEnvironment} from '../migration.mjs';

const origin='https://127.0.0.1:4319';
let auth,service,admin,admin2,employee,version=0;
const key=()=>randomUUID().replaceAll('-','');
const put=(mode,v=version,token=admin,k=key())=>service.change({token,employeeId:'6',method:'PUT',input:{scopeMode:mode,expectedVersion:v,requestKey:k}});
const del=(v=version,token=admin,k=key())=>service.change({token,employeeId:'6',method:'DELETE',input:{expectedVersion:v,requestKey:k}});
const get=(id='6',token=admin)=>service.get({token,employeeId:id});
const sql=(s,p=[])=>auth.pool.query(s,p);
async function lifecycleChange({employeeId='6',statement,params=[],action,before,after,actorKind='system_admin',actorId='9'}){
 const client=await auth.pool.connect();
 try{
  await client.query('BEGIN');
  await client.query(statement,params);
  const event=await client.query(
   "INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) "+
   "VALUES($1,$2,$3::jsonb,'employee',$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp()) RETURNING audit_id::text audit_id",
   [actorKind,actorId,JSON.stringify({scope:'F03_G_CI_ONLY',reason:'synthetic lifecycle transition in disposable PG16'}),employeeId,action,JSON.stringify(before),JSON.stringify(after)]);
  await client.query('COMMIT');
  return event.rows[0].audit_id;
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}

before(async()=>{
 assertEnvironment();
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),origin});
 admin=(await auth.login({login:'admin_test',password:'SyntheticAdmin_1234567'})).token;
 employee=(await auth.login({login:'race_test',password:'SyntheticRace_1234567'})).token;
 assert.match(admin,/^[A-Za-z0-9_-]{43}$/);
 assert.match(employee,/^[A-Za-z0-9_-]{43}$/);
 const pass='Synthetic_'+randomBytes(20).toString('hex')+'Aa1';
 await sql("INSERT INTO public.system_admins(system_admin_id,account_status,bootstrap_origin) VALUES(10,'active','bootstrap')");
 await sql("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,system_admin_id,password_hash,credential_state,force_password_change) VALUES(11,'phone_admin_second','system_admin',10,$1,'enabled',false)",[await hashPassword(pass)]);
 admin2=(await auth.login({login:'phone_admin_second',password:pass})).token;
 assert.match(admin2,/^[A-Za-z0-9_-]{43}$/);
 service=new PublisherPhoneAdminService(auth);
});
after(async()=>{await auth?.close()});

test('01 two real System Admin F03 sessions distinct',()=>assert.notEqual(admin,admin2));
test('02 physical PG16 not superuser',async()=>{
 const x=(await sql("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(x.db,'f03_auth_test');assert.equal(x.usr,'f03_ci');assert.equal(x.su,false);assert.ok(x.ver>=160000&&x.ver<170000);
});
test('03 all accepted public tables remain present',async()=>assert.equal(Number((await sql("SELECT count(*) n FROM pg_tables WHERE schemaname='public'")).rows[0].n),81));
test('04 initial GET safe and no number',async()=>{
 const x=await get();assert.equal(x.status,200);assert.equal(x.enabled,false);assert.equal(x.version,0);assert.equal(x.configurable,true);assert.ok(!/phoneNumber|upstream_publisher_id|TEST-/.test(JSON.stringify(x)));
});
test('05 employee self reads denied',async()=>assert.equal((await get('6',employee)).status,403));
test('06 invalid employee id denied',async()=>assert.equal((await get('0')).status,400));
test('07 invalid mode denied',async()=>assert.equal((await put('UNLIMITED')).status,400));
test('08 extra body fields denied',async()=>assert.equal((await service.change({token:admin,employeeId:'6',method:'PUT',input:{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key(),phone:'leak'}})).status,400));
test('09 unknown target fails',async()=>assert.equal((await get('900001')).status,404));
test('10 4S target forbidden',async()=>assert.equal((await service.change({token:admin,employeeId:'2',method:'PUT',input:{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key()}})).status,403));
test('11 inactive target forbidden',async()=>assert.equal((await service.change({token:admin,employeeId:'3',method:'PUT',input:{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key()}})).status,403));
test('11A revoke restores a pre-existing independent allow instead of deleting it',async()=>{
 await sql("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(7,13,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()");
 const grant=await service.change({token:admin,employeeId:'7',method:'PUT',input:{scopeMode:'LOCKED_ONLY',expectedVersion:0,requestKey:key()}});
 assert.equal(grant.status,200);assert.equal(grant.enabled,true);
 const revoke=await service.change({token:admin,employeeId:'7',method:'DELETE',input:{expectedVersion:grant.version,requestKey:key()}});
 assert.equal(revoke.status,200);assert.equal(revoke.enabled,false);
 const override=await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
 assert.equal(override.rows[0].decision,'allow');
 const bound=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings WHERE employee_id=7 AND permission_id=13 AND ended_at IS NULL");
 assert.equal(bound.rows[0].n,0);
 assert.equal((await get('7')).enabled,false);
 await sql("DELETE FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
});
let originalKey;
test('12 grant LOCKED_ONLY',async()=>{
 originalKey=key();const x=await put('LOCKED_ONLY',0,admin,originalKey);
 assert.equal(x.status,200);assert.equal(x.enabled,true);assert.equal(x.scopeMode,'LOCKED_ONLY');version=x.version;assert.equal(version,1);
});
test('13 single database contains mode, override, SG01 binding and lifecycle baseline',async()=>{
 const x=await sql("SELECT m.scope_mode,m.enabled,o.decision,COUNT(b.scope_id)::int n,m.lifecycle_audit_watermark::text watermark,m.granted_employment_status,m.granted_role_code,m.granted_main_role_id::text role_id,m.granted_store_id::text store_id FROM f03_publisher_phone_admin_test.employee_mode m JOIN public.employee_permission_overrides o ON o.employee_id=m.employee_id AND o.permission_id=13 JOIN public.employee_data_scopes s ON s.employee_id=m.employee_id AND s.scope_kind='publisher_phone_special' AND s.ended_at IS NULL JOIN public.employee_capability_scope_bindings b ON b.scope_id=s.scope_id AND b.permission_id=13 AND b.ended_at IS NULL WHERE m.employee_id=6 GROUP BY m.scope_mode,m.enabled,o.decision,m.lifecycle_audit_watermark,m.granted_employment_status,m.granted_role_code,m.granted_main_role_id,m.granted_store_id");
 assert.equal(x.rows[0].scope_mode,'LOCKED_ONLY');assert.equal(x.rows[0].enabled,true);assert.equal(x.rows[0].decision,'allow');assert.equal(x.rows[0].n,1);
 assert.ok(BigInt(x.rows[0].watermark)>=0n);assert.equal(x.rows[0].granted_employment_status,'active');assert.equal(x.rows[0].granted_role_code,'sales');assert.equal(x.rows[0].role_id,'1');assert.equal(x.rows[0].store_id,'1');
});
test('14 immutable audit before/after stored in same PG',async()=>{
 const a=await sql("SELECT action,before_json,after_json FROM public.audit_events WHERE object_id='6' AND action='publisher.phone.scope.grant' ORDER BY audit_id DESC LIMIT 1");
 assert.equal(a.rows[0].after_json.version,1);assert.equal(a.rows[0].before_json.version,0);
 const h=await sql("SELECT decision,actor_kind FROM public.employee_permission_override_history WHERE employee_id=6 AND permission_id=13 ORDER BY event_id DESC LIMIT 1");
 assert.equal(h.rows[0].decision,'allow');assert.equal(h.rows[0].actor_kind,'system_admin');
});
test('14A future-dated SG01 binding is not considered effective',async()=>{
 const q=await sql("SELECT b.scope_id::text id FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.ended_at IS NULL");
 assert.equal(q.rowCount,1);
 await sql("UPDATE public.employee_capability_scope_bindings SET granted_at=transaction_timestamp()+interval '1 hour' WHERE scope_id=$1::bigint",[q.rows[0].id]);
 try {
  const x=await get();assert.equal(x.status,200);assert.equal(x.enabled,false);assert.equal(x.configurable,true);assert.equal(x.scopeMode,null);assert.equal(x.version,version);
 } finally {
  await sql("UPDATE public.employee_capability_scope_bindings SET granted_at=transaction_timestamp()-interval '1 minute' WHERE scope_id=$1::bigint",[q.rows[0].id]);
 }
 assert.equal((await get()).enabled,true);
});
test('15 idempotent same request key returns original result',async()=>{const x=await put('LOCKED_ONLY',0,admin,originalKey);assert.equal(x.status,200);assert.equal(x.code,'IDEMPOTENT_REPLAY');assert.equal(x.version,1)});
test('16 replay different payload rejected',async()=>assert.equal((await put('ALL_ACTIVE_JYT',version,admin,originalKey)).status,409));
test('17 expectedVersion mismatch rejected',async()=>assert.equal((await put('ALL_ACTIVE_JYT',0)).status,409));
test('18 change ALL_ACTIVE_JYT',async()=>{const x=await put('ALL_ACTIVE_JYT');assert.equal(x.status,200);version=x.version;assert.equal(version,2)});
test('18A unrelated object-scope fixture is distinct from the phone-special scope',async()=>{
 const scope=await sql("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id,ended_at) VALUES(6,'object',301,NULL) RETURNING scope_id::text id");
 await sql("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at,ended_at) VALUES(6,13,$1::bigint,transaction_timestamp()-interval '1 minute',NULL)",[scope.rows[0].id]);
 const unrelated=await sql("SELECT b.ended_at FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND s.scope_kind='object' AND s.scope_reference_id=301");
 assert.equal(unrelated.rowCount,1);assert.equal(unrelated.rows[0].ended_at,null);
});
test('19 GET observes current mode',async()=>{const x=await get();assert.equal(x.scopeMode,'ALL_ACTIVE_JYT');assert.equal(x.version,2)});
test('20 two real admins racing same CAS serialize exactly once and preserve unrelated scope',async()=>{
 const [a,b]=await Promise.all([put('LOCKED_ONLY',version,admin),put('LOCKED_ONLY',version,admin2)]);
 assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,409]);version++;
 const unrelated=await sql("SELECT b.ended_at FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND s.scope_kind='object' AND s.scope_reference_id=301");
 assert.equal(unrelated.rowCount,1);assert.equal(unrelated.rows[0].ended_at,null);
});
test('21 stale second admin version loses even after next request',async()=>assert.equal((await put('ALL_ACTIVE_JYT',version-1,admin2)).status,409));
test('22 inactive then active without phone API persistently invalidates old grant until explicit System Admin regrant',async()=>{
 const before=await get();assert.equal(before.enabled,true);assert.equal(before.version,version);
 const inactiveAudit=await lifecycleChange({statement:"UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6",action:'sg06.sudden.inactive',before:{employment:'active',receiving:'paused'},after:{employment:'inactive',receiving:'paused'},actorKind:'employee',actorId:'4'});
 const restoreAudit=await lifecycleChange({statement:"UPDATE public.employees SET employment_status='active' WHERE employee_id=6",action:'sg06.restore.active',before:{employment:'inactive'},after:{employment:'active',credentialsRemainDisabled:true,permissionsNotRegranted:true,receivingRestored:false},actorKind:'system_admin',actorId:'9'});
 assert.ok(BigInt(restoreAudit)>BigInt(inactiveAudit));
 // No phone-admin GET/PUT/DELETE occurs between the inactive and active transitions.
 const x=await get();assert.equal(x.status,200);assert.equal(x.enabled,false);assert.equal(x.scopeMode,null);assert.equal(x.version,version+1);version=x.version;
 const mode=await sql("SELECT enabled,scope_mode,version,lifecycle_invalidated_action,lifecycle_invalidated_audit_id::text audit_id,lifecycle_invalidated_reason FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=6");
 assert.equal(mode.rows[0].enabled,false);assert.equal(mode.rows[0].scope_mode,null);assert.equal(mode.rows[0].lifecycle_invalidated_action,'sg06.restore.active');assert.equal(mode.rows[0].audit_id,restoreAudit);assert.equal(mode.rows[0].lifecycle_invalidated_reason,'EMPLOYEE_AUDIT_AFTER_GRANT');
 const activeBinding=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND s.scope_kind='publisher_phone_special' AND (b.ended_at IS NULL OR b.ended_at>now()) AND (s.ended_at IS NULL OR s.ended_at>now())");
 assert.equal(activeBinding.rows[0].n,0);
 const overrideAfterLifecycle=await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=13");
 assert.equal(overrideAfterLifecycle.rowCount,0,"NULL pre-grant baseline must be restored on lifecycle invalidation");
 const audit=await sql("SELECT after_json FROM public.audit_events WHERE object_id='6' AND action='publisher.phone.scope.lifecycle_revoke' ORDER BY audit_id DESC LIMIT 1");
 assert.equal(audit.rows[0].after_json.enabled,false);assert.equal(audit.rows[0].after_json.permissionDecision,null);
 const grant=await put('LOCKED_ONLY',version);assert.equal(grant.status,200);assert.equal(grant.enabled,true);version=grant.version;
 assert.equal((await get()).enabled,true);
 const revoked=await del(version);assert.equal(revoked.status,200);assert.equal(revoked.enabled,false);version=revoked.version;
 assert.equal((await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=13")).rowCount,0,"regrant after lifecycle invalidation must not capture stale API allow as baseline");
 assert.equal((await get()).enabled,false);
 const regrant=await put('LOCKED_ONLY',version);assert.equal(regrant.status,200);assert.equal(regrant.enabled,true);version=regrant.version;
});
test('22A lifecycle invalidation restores an independent pre-existing allow across regrant and DELETE',async()=>{
 await sql("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(7,13,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()");
 const start=Number((await sql("SELECT version FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=7")).rows[0].version);
 const grant=await service.change({token:admin,employeeId:'7',method:'PUT',input:{scopeMode:'LOCKED_ONLY',expectedVersion:start,requestKey:key()}});
 assert.equal(grant.status,200);assert.equal(grant.enabled,true);
 const inactive=await lifecycleChange({employeeId:'7',statement:"UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7",action:'sg06.sudden.inactive',before:{employment:'active'},after:{employment:'inactive'},actorKind:'employee',actorId:'4'});
 const restored=await lifecycleChange({employeeId:'7',statement:"UPDATE public.employees SET employment_status='active' WHERE employee_id=7",action:'sg06.restore.active',before:{employment:'inactive'},after:{employment:'active',permissionsNotRegranted:true},actorKind:'system_admin',actorId:'9'});
 assert.ok(BigInt(restored)>BigInt(inactive));
 const invalidated=await get('7');assert.equal(invalidated.status,200);assert.equal(invalidated.enabled,false);
 const baseline=await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
 assert.equal(baseline.rowCount,1);assert.equal(baseline.rows[0].decision,'allow');
 const audit=await sql("SELECT after_json FROM public.audit_events WHERE object_id='7' AND action='publisher.phone.scope.lifecycle_revoke' ORDER BY audit_id DESC LIMIT 1");
 assert.equal(audit.rows[0].after_json.permissionDecision,'allow');
 let v=invalidated.version;
 const regrant=await service.change({token:admin,employeeId:'7',method:'PUT',input:{scopeMode:'LOCKED_ONLY',expectedVersion:v,requestKey:key()}});
 assert.equal(regrant.status,200);assert.equal(regrant.enabled,true);v=regrant.version;
 const revoke=await service.change({token:admin,employeeId:'7',method:'DELETE',input:{expectedVersion:v,requestKey:key()}});
 assert.equal(revoke.status,200);assert.equal(revoke.enabled,false);
 const final=await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
 assert.equal(final.rowCount,1);assert.equal(final.rows[0].decision,'allow',"the independent pre-grant allow must survive lifecycle invalidation, regrant and DELETE");
 await sql("DELETE FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
});
test('22B a committed deny during lifecycle invalidation survives subsequent DELETE and audit',async()=>{
 await sql("DELETE FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
 const start=Number((await sql("SELECT version FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=7")).rows[0].version);
 const grant=await service.change({token:admin,employeeId:'7',method:'PUT',input:{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:start,requestKey:key()}});
 assert.equal(grant.status,200);assert.equal(grant.enabled,true);
 await lifecycleChange({employeeId:'7',statement:"UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7",action:'sg06.sudden.inactive',before:{employment:'active'},after:{employment:'inactive'},actorKind:'employee',actorId:'4'});
 await lifecycleChange({employeeId:'7',statement:"UPDATE public.employees SET employment_status='active' WHERE employee_id=7",action:'sg06.restore.active',before:{employment:'inactive'},after:{employment:'active'},actorKind:'system_admin',actorId:'9'});
 let entered,release;
 const enteredPromise=new Promise(r=>entered=r),releasePromise=new Promise(r=>release=r);
 const racing=new PublisherPhoneAdminService(auth,{hook:async({method,phase})=>{
  if(method==='LIFECYCLE_INVALIDATE'&&phase==='before_baseline_restore'){entered();await releasePromise}
 }});
 const pending=racing.get({token:admin,employeeId:'7'});
 await enteredPromise;
 await sql("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=7 AND permission_id=13");
 release();
 const invalidated=await pending;assert.equal(invalidated.status,200);assert.equal(invalidated.enabled,false);
 const revoke=await service.change({token:admin,employeeId:'7',method:'DELETE',input:{expectedVersion:invalidated.version,requestKey:key()}});
 assert.equal(revoke.status,200);assert.equal(revoke.enabled,false);
 const final=await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
 assert.equal(final.rowCount,1);assert.equal(final.rows[0].decision,'deny');
 const audit=await sql("SELECT after_json FROM public.audit_events WHERE object_id='7' AND action='publisher.phone.scope.lifecycle_revoke' ORDER BY audit_id DESC LIMIT 1");
 assert.equal(audit.rows[0].after_json.permissionDecision,'deny',"lifecycle audit must record the committed final deny");
 await sql("DELETE FROM public.employee_permission_overrides WHERE employee_id=7 AND permission_id=13");
});
test('23 ineligible role then eligible role again does not resurrect the old phone grant',async()=>{
 const before=await get();assert.equal(before.enabled,true);assert.equal(before.version,version);
 const roleAudit=await lifecycleChange({statement:"UPDATE public.employees SET main_role_id=2 WHERE employee_id=6",action:'sg06.governance.planned_downgrade',before:{employment:'active',roleId:'1',receiving:'paused'},after:{employment:'active',roleId:'2',receiving:'paused'},actorKind:'employee',actorId:'4'});
 await sql("UPDATE public.employees SET main_role_id=1 WHERE employee_id=6");
 const x=await get();assert.equal(x.status,200);assert.equal(x.role,'sales');assert.equal(x.configurable,true);assert.equal(x.enabled,false);assert.equal(x.scopeMode,null);assert.equal(x.version,version+1);version=x.version;
 const mode=await sql("SELECT enabled,lifecycle_invalidated_audit_id::text audit_id,lifecycle_invalidated_action,lifecycle_invalidated_reason FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=6");
 assert.equal(mode.rows[0].enabled,false);assert.equal(mode.rows[0].audit_id,roleAudit);assert.equal(mode.rows[0].lifecycle_invalidated_action,'sg06.governance.planned_downgrade');assert.equal(mode.rows[0].lifecycle_invalidated_reason,'EMPLOYEE_AUDIT_AFTER_GRANT');
 assert.equal((await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND s.scope_kind='publisher_phone_special' AND (b.ended_at IS NULL OR b.ended_at>now()) AND (s.ended_at IS NULL OR s.ended_at>now())")).rows[0].n,0);
});
test('23B missing grant-time lifecycle baseline fails closed and persists revocation',async()=>{
 const grant=await put('LOCKED_ONLY',version);assert.equal(grant.status,200);assert.equal(grant.enabled,true);version=grant.version;
 await sql("UPDATE f03_publisher_phone_admin_test.employee_mode SET granted_role_code=NULL WHERE employee_id=6");
 const x=await get();assert.equal(x.status,200);assert.equal(x.enabled,false);assert.equal(x.scopeMode,null);assert.equal(x.version,version+1);version=x.version;
 const mode=await sql("SELECT enabled,version,lifecycle_invalidated_reason FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=6");
 assert.equal(mode.rows[0].enabled,false);assert.equal(Number(mode.rows[0].version),version);assert.equal(mode.rows[0].lifecycle_invalidated_reason,'LIFECYCLE_BASELINE_MISSING');
});
test('23A unrecognized legacy store_head role is denied by the formal allowlist',async()=>{
 await sql("UPDATE public.roles SET role_code='store_head' WHERE role_id=1");
 try {
  const x=await get();assert.equal(x.status,200);assert.equal(x.role,'store_head');assert.equal(x.configurable,false);assert.equal(x.enabled,false);
  assert.equal((await put('LOCKED_ONLY')).code,'TARGET_NOT_ELIGIBLE');
 } finally {
  await sql("UPDATE public.roles SET role_code='sales' WHERE role_id=1");
 }
});
test('24 concurrent employee departure cannot commit across pending phone permission configuration lock',async()=>{
 let entered,release;
 const enteredPromise=new Promise(r=>entered=r),releasePromise=new Promise(r=>release=r);
 const pendingService=new PublisherPhoneAdminService(auth,{hook:async({phase})=>{
  if(phase==='before_commit'){entered();await releasePromise}
 }});
 const pending=pendingService.change({token:admin,employeeId:'6',method:'PUT',input:{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:version,requestKey:key()}});
 await enteredPromise;
 const c=await auth.pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("SET LOCAL lock_timeout='250ms'");
  await assert.rejects(c.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6"),e=>e.code==='55P03');
  await c.query('ROLLBACK');
 }finally{c.release();release()}
 const granted=await pending;
 assert.equal(granted.status,200);
 version=granted.version;
 assert.equal((await get()).scopeMode,'ALL_ACTIVE_JYT');
});
test('25 explicit personal deny prevents config grant',async()=>{
 await sql("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=6 AND permission_id=13");
 assert.equal((await put('ALL_ACTIVE_JYT')).code,'CURRENT_PERSONAL_DENY');
 await sql("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=6 AND permission_id=13");
});
test('25A concurrent deny committed after precheck is never overwritten; grant transaction rolls back',async()=>{
 const bindingCount=async()=>Number((await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.ended_at IS NULL")).rows[0].n);
 const beforeBindings=await bindingCount(),beforeVersion=version;
 let entered,release;
 const enteredPromise=new Promise(r=>entered=r),releasePromise=new Promise(r=>release=r);
 const racing=new PublisherPhoneAdminService(auth,{hook:async({phase})=>{if(phase==='before_override_write'){entered();await releasePromise}}});
 const pending=racing.change({token:admin,employeeId:'6',method:'PUT',input:{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:version,requestKey:key()}});
 await enteredPromise;
 await sql("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=6 AND permission_id=13");
 release();
 await assert.rejects(pending,/PERSONAL_DENY_RACE/);
 assert.equal((await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=13")).rows[0].decision,'deny');
 assert.equal(Number((await sql("SELECT version FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=6")).rows[0].version),beforeVersion);
 assert.equal(await bindingCount(),beforeBindings);
 await sql("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=6 AND permission_id=13");
});
test('25B uncommitted deny row lock wins against concurrent conditional upsert',async()=>{
 const bindingCount=async()=>Number((await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.ended_at IS NULL")).rows[0].n);
 const beforeBindings=await bindingCount(),beforeVersion=version;
 const denyTx=await auth.pool.connect();
 let transactionOpen=true,entered;
 const enteredPromise=new Promise(r=>entered=r);
 try {
  await denyTx.query('BEGIN');
  await denyTx.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=6 AND permission_id=13");
  const racing=new PublisherPhoneAdminService(auth,{hook:async({c,phase})=>{if(phase==='before_override_write'){await c.query('SELECT pg_backend_pid()');entered()} }});
  const pending=racing.change({token:admin,employeeId:'6',method:'PUT',input:{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:version,requestKey:key()}});
  await enteredPromise;
  await denyTx.query('COMMIT');transactionOpen=false;
  await assert.rejects(pending,/PERSONAL_DENY_RACE/);
  assert.equal((await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=13")).rows[0].decision,'deny');
  assert.equal(Number((await sql("SELECT version FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=6")).rows[0].version),beforeVersion);
  assert.equal(await bindingCount(),beforeBindings);
 } finally {
  if(transactionOpen)await denyTx.query('ROLLBACK').catch(()=>{});
  denyTx.release();
 }
 await sql("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=6 AND permission_id=13");
});
test('26 injected failure before commit rolls back entire DB mutation',async()=>{
 const n=Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action LIKE 'publisher.phone.scope.%'")).rows[0].n);
 const broken=new PublisherPhoneAdminService(auth,{hook:({phase})=>{if(phase==='before_commit')throw Error('INJECTED_ROLLBACK')}});
 await assert.rejects(()=>broken.change({token:admin,employeeId:'6',method:'PUT',input:{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:version,requestKey:key()}}),/INJECTED_ROLLBACK/);
 const x=await get();assert.equal(x.version,version);
 assert.equal(Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action LIKE 'publisher.phone.scope.%'")).rows[0].n),n);
});
test('27 DELETE revokes only this API binding, leaves unrelated scopes and preserves history',async()=>{
 const x=await del();assert.equal(x.status,200);assert.equal(x.enabled,false);version=x.version;
 const state=await get();assert.equal(state.enabled,false);assert.equal(state.scopeMode,null);
 const b=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.scope_kind='publisher_phone_special'");
 assert.equal(b.rows[0].n,0);
 const unrelated=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.scope_kind='object' AND s.scope_reference_id=301");
 assert.equal(unrelated.rows[0].n,1);
});
test('28 DELETE idempotent replay and version remains',async()=>{
 const k=key(),x=await del(version,admin,k);assert.equal(x.status,200);version=x.version;
 const replay=await del(version-1,admin,k);assert.equal(replay.code,'IDEMPOTENT_REPLAY');assert.equal(replay.version,version);
});
test('28A DELETE preserves an explicit deny and audit records the actual final decision',async()=>{
 const grant=await put('LOCKED_ONLY',version);assert.equal(grant.status,200);version=grant.version;
 await sql("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=6 AND permission_id=13");
 const revoked=await del(version);assert.equal(revoked.status,200);assert.equal(revoked.enabled,false);version=revoked.version;
 const override=await sql("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=6 AND permission_id=13");
 assert.equal(override.rows[0].decision,'deny');
 const mode=await sql("SELECT enabled,scope_mode,version FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=6");
 assert.equal(mode.rows[0].enabled,false);assert.equal(mode.rows[0].scope_mode,null);assert.equal(Number(mode.rows[0].version),version);
 const bindings=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.scope_kind='publisher_phone_special'");
 assert.equal(bindings.rows[0].n,0);
 const unrelated=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings b JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id WHERE b.employee_id=6 AND b.permission_id=13 AND b.ended_at IS NULL AND s.scope_kind='object' AND s.scope_reference_id=301");
 assert.equal(unrelated.rows[0].n,1);
 const audit=await sql("SELECT after_json FROM public.audit_events WHERE object_id='6' AND action='publisher.phone.scope.revoke' ORDER BY audit_id DESC LIMIT 1");
 assert.equal(audit.rows[0].after_json.permissionDecision,'deny');
 const current=await get();assert.equal(current.enabled,false);assert.equal(current.version,version);
});
test('29 target departing before grant denied',async()=>{
 await sql("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6");
 assert.equal((await put('LOCKED_ONLY')).code,'TARGET_NOT_ELIGIBLE');
 await sql("UPDATE public.employees SET employment_status='active' WHERE employee_id=6");
});
test('30 revoked System Admin cannot reauthorize',async()=>{
 await sql("UPDATE public.system_admins SET account_status='inactive' WHERE system_admin_id=10");
 assert.equal((await put('LOCKED_ONLY',version,admin2)).status,401);
});
test('31 restart a new real F03 session client retains committed revocation and CAS version',async()=>{
 const fresh=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:Buffer.from(process.env.F03_1_HMAC_KEY_BASE64,'base64'),origin});
 try{
  const observed=await new PublisherPhoneAdminService(fresh).get({token:admin,employeeId:'6'});
  assert.equal(observed.status,200);assert.equal(observed.version,version);assert.equal(observed.enabled,false);
 }finally{await fresh.close()}
});
test('32 public SG01 physical schema fingerprint unchanged',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../../runtime-scope/000003.manifest.json',import.meta.url),'utf8'));
 const c=await auth.pool.connect();
 try{const physical=await getPublicStructure(c);assert.equal(physical.sha256,manifest.structure_sha256)}
 finally{c.release()}
});
test('33 capability scope is non-public and F07 remains disconnected',async()=>{
 const s=await sql("SELECT nspname FROM pg_namespace WHERE nspname='f03_publisher_phone_admin_test'");
 assert.equal(s.rowCount,1);assert.notEqual(s.rows[0].nspname,'public');
 console.log('F03_PHONE_ADMIN_BUSINESS_PG16_43_CASES_PASS; F07_NOT_CONNECTED');
});
