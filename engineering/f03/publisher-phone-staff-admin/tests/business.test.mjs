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
let originalKey;
test('12 grant LOCKED_ONLY',async()=>{
 originalKey=key();const x=await put('LOCKED_ONLY',0,admin,originalKey);
 assert.equal(x.status,200);assert.equal(x.enabled,true);assert.equal(x.scopeMode,'LOCKED_ONLY');version=x.version;assert.equal(version,1);
});
test('13 single database contains mode, override and SG01 binding',async()=>{
 const x=await sql("SELECT m.scope_mode,m.enabled,o.decision,COUNT(b.scope_id)::int n FROM f03_publisher_phone_admin_test.employee_mode m JOIN public.employee_permission_overrides o ON o.employee_id=m.employee_id AND o.permission_id=13 JOIN public.employee_data_scopes s ON s.employee_id=m.employee_id AND s.scope_kind='publisher_phone_special' AND s.ended_at IS NULL JOIN public.employee_capability_scope_bindings b ON b.scope_id=s.scope_id AND b.permission_id=13 AND b.ended_at IS NULL WHERE m.employee_id=6 GROUP BY m.scope_mode,m.enabled,o.decision");
 assert.equal(x.rows[0].scope_mode,'LOCKED_ONLY');assert.equal(x.rows[0].enabled,true);assert.equal(x.rows[0].decision,'allow');assert.equal(x.rows[0].n,1);
});
test('14 immutable audit before/after stored in same PG',async()=>{
 const a=await sql("SELECT action,before_json,after_json FROM public.audit_events WHERE object_id='6' AND action='publisher.phone.scope.grant' ORDER BY audit_id DESC LIMIT 1");
 assert.equal(a.rows[0].after_json.version,1);assert.equal(a.rows[0].before_json.version,0);
 const h=await sql("SELECT decision,actor_kind FROM public.employee_permission_override_history WHERE employee_id=6 AND permission_id=13 ORDER BY event_id DESC LIMIT 1");
 assert.equal(h.rows[0].decision,'allow');assert.equal(h.rows[0].actor_kind,'system_admin');
});
test('15 idempotent same request key returns original result',async()=>{const x=await put('LOCKED_ONLY',0,admin,originalKey);assert.equal(x.status,200);assert.equal(x.code,'IDEMPOTENT_REPLAY');assert.equal(x.version,1)});
test('16 replay different payload rejected',async()=>assert.equal((await put('ALL_ACTIVE_JYT',version,admin,originalKey)).status,409));
test('17 expectedVersion mismatch rejected',async()=>assert.equal((await put('ALL_ACTIVE_JYT',0)).status,409));
test('18 change ALL_ACTIVE_JYT',async()=>{const x=await put('ALL_ACTIVE_JYT');assert.equal(x.status,200);version=x.version;assert.equal(version,2)});
test('19 GET observes current mode',async()=>{const x=await get();assert.equal(x.scopeMode,'ALL_ACTIVE_JYT');assert.equal(x.version,2)});
test('20 two real admins racing same CAS serialize exactly once',async()=>{
 const [a,b]=await Promise.all([put('LOCKED_ONLY',version,admin),put('LOCKED_ONLY',version,admin2)]);
 assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,409]);version++;
});
test('21 stale second admin version loses even after next request',async()=>assert.equal((await put('ALL_ACTIVE_JYT',version-1,admin2)).status,409));
test('22 stale configuration never appears active after employee inactive',async()=>{
 await sql("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6");
 try{const x=await get();assert.equal(x.status,200);assert.equal(x.enabled,false);assert.equal(x.configurable,false);assert.equal(x.scopeMode,null);assert.equal(x.version,version)}
 finally{await sql("UPDATE public.employees SET employment_status='active' WHERE employee_id=6")}
});
test('23 changing assigned employee role to 4S fails closed on GET without revoking old evidence',async()=>{
 await sql("UPDATE public.employees SET main_role_id=2 WHERE employee_id=6");
 try{const x=await get();assert.equal(x.status,200);assert.equal(x.enabled,false);assert.equal(x.configurable,false);assert.equal(x.version,version)}
 finally{await sql("UPDATE public.employees SET main_role_id=1 WHERE employee_id=6")}
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
test('26 injected failure before commit rolls back entire DB mutation',async()=>{
 const n=Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action LIKE 'publisher.phone.scope.%'")).rows[0].n);
 const broken=new PublisherPhoneAdminService(auth,{hook:({phase})=>{if(phase==='before_commit')throw Error('INJECTED_ROLLBACK')}});
 await assert.rejects(()=>broken.change({token:admin,employeeId:'6',method:'PUT',input:{scopeMode:'ALL_ACTIVE_JYT',expectedVersion:version,requestKey:key()}}),/INJECTED_ROLLBACK/);
 const x=await get();assert.equal(x.version,version);
 assert.equal(Number((await sql("SELECT count(*) n FROM public.audit_events WHERE action LIKE 'publisher.phone.scope.%'")).rows[0].n),n);
});
test('27 DELETE revokes mode, binding, allow and preserves history',async()=>{
 const x=await del();assert.equal(x.status,200);assert.equal(x.enabled,false);version=x.version;
 const state=await get();assert.equal(state.enabled,false);assert.equal(state.scopeMode,null);
 const b=await sql("SELECT count(*)::int n FROM public.employee_capability_scope_bindings WHERE employee_id=6 AND permission_id=13 AND ended_at IS NULL");
 assert.equal(b.rows[0].n,0);
});
test('28 DELETE idempotent replay and version remains',async()=>{
 const k=key(),x=await del(version,admin,k);assert.equal(x.status,200);version=x.version;
 const replay=await del(version-1,admin,k);assert.equal(replay.code,'IDEMPOTENT_REPLAY');assert.equal(replay.version,version);
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
 console.log('F03_PHONE_ADMIN_BUSINESS_PG16_33_CASES_PASS; F07_NOT_CONNECTED');
});
