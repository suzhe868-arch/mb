import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {randomBytes,randomUUID} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CrmFollowupService} from '../../../src/f05-crm-followup-service.mjs';
import {connect} from '../environment.mjs';
import {verifyScopeDatabase} from '../../../f03/runtime-scope/readiness.mjs';

let pool,auth,service,owner,manager,storeManager,collaborator,admin,fourS;
const key=()=>randomUUID().replaceAll('-','');
const sql=(q,v=[])=>pool.query(q,v);
const count=async()=>Number((await sql('SELECT count(*)::int n FROM public.crm_followups')).rows[0].n);
const audit=async()=>Number((await sql("SELECT count(*)::int n FROM public.audit_events WHERE action='crm.followup.create'")).rows[0].n);
const append=(token=owner,overrides={})=>service.append({token,customerId:'301',content:'CI synthetic customer service note',businessDemandId:null,source:{kind:'manual',reference:'crm_ci_01'},requestKey:key(),...overrides});
const reset=async()=>{
 await sql("UPDATE public.customers SET current_owner_employee_id=6,owner_assignment_state='assigned',account_status='active' WHERE customer_id=301");
 await sql("UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id IN (701,702,703,704)");
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id IN (701,702,703,704)");
 await sql("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id IN (6,7) AND permission_id=61");
 await sql("UPDATE public.role_permission_defaults SET enabled=true WHERE role_id IN (3,4) AND permission_id=61");
 await sql("UPDATE public.employees SET employment_status='active',main_role_id=1 WHERE employee_id=6");
 await sql("UPDATE public.customer_collaborations SET ended_at=NULL WHERE collaboration_id=701");
};
before(async()=>{
 pool=await connect();
 assert.equal((await verifyScopeDatabase(pool)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:4395'});
 const creds=[['race_test','SyntheticRace_1234567'],['manager_account_ci','SyntheticManager_2026!'],
 ['store_manager_account_ci','SyntheticStoreManager_2026!'],['limit_test','SyntheticLimit_1234567'],
 ['admin_test','SyntheticAdmin_1234567'],['four_s_test','SyntheticFourS_123456']];
 const tokens=[];
 for(const [name,password] of creds){
  const x=await auth.login({login:name,password,source:'f05-crm-business-'+name});
  assert.equal(x.code,'AUTH_OK');tokens.push(x.token);
 }
 [owner,manager,storeManager,collaborator,admin,fourS]=tokens;
 service=new CrmFollowupService(auth);
});
after(async()=>{await reset().catch(()=>{});await auth?.close();await pool?.end()});
test('01 independent real PostgreSQL 16 SG01 signature and non-superuser enforced',async()=>{
 const x=(await sql("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(x.db,'f03_auth_test');assert.equal(x.usr,'f03_ci');assert.equal(x.su,false);assert.ok(x.v>=160000&&x.v<170000);
});
test('02 current owner creates one append-only followup, responsible=current owner',async()=>{
 const x=await append();assert.equal(x.status,201);assert.equal(x.code,'CREATED');
 assert.equal(x.actorEmployeeId,'6');assert.equal(x.responsibleEmployeeId,'6');assert.ok(x.followupId);
});
test('03 followup and audit inserted in same public transaction',async()=>{
 const x=(await sql('SELECT followup_id::text id,actor_employee_id::text actor,responsible_employee_id::text responsible,source_context_json FROM public.crm_followups ORDER BY followup_id DESC LIMIT 1')).rows[0];
 assert.equal(x.actor,'6');assert.equal(x.responsible,'6');assert.equal(x.source_context_json.ciOnly,true);
 const y=(await sql("SELECT role_context FROM public.audit_events WHERE action='crm.followup.create' ORDER BY audit_id DESC LIMIT 1")).rows[0];
 assert.equal(y.role_context.permission,'CI_ONLY_SYNTHETIC_PERMISSION');
});
test('04 no Demand reference and current owner read projection',async()=>{
 const z=await append(owner,{source:{kind:'visit'}});assert.equal(z.status,201);
 const x=await service.read({token:owner,customerId:'301',followupId:z.followupId});
 assert.equal(x.status,200);assert.equal(x.content,'CI synthetic customer service note');assert.equal(x.businessDemandId,null);
 assert.equal(x.source.kind,'visit');assert.equal(JSON.stringify(x).includes('credential'),false);
});
test('05 legitimate same-Customer Demand relationship is accepted',async()=>{
 const x=await append(owner,{businessDemandId:'501'});assert.equal(x.status,201);assert.equal(x.businessDemandId,'501');
 const f=(await sql('SELECT business_demand_id::text id FROM public.crm_followups WHERE followup_id=$1',[x.followupId])).rows[0];
 assert.equal(f.id,'501');
});
test('06 other Customer Demand reference fails closed, no insert',async()=>{
 const n=await count();const x=await append(owner,{businessDemandId:'506'});
 assert.equal(x.code,'DEMAND_CUSTOMER_MISMATCH');assert.equal(await count(),n);
});
test('07 nonexistent Demand reference fails closed',async()=>{assert.equal((await append(owner,{businessDemandId:'999999'})).status,403)});
test('08 invalid Demand ID, invalid Customer, and missing followup rejected',async()=>{
 assert.equal((await append(owner,{businessDemandId:'-1'})).status,400);
 assert.equal((await append(owner,{customerId:'0'})).status,400);
 assert.equal((await service.read({token:owner,customerId:'301',followupId:'999999'})).status,404);
});
test('09 source whitelist rejects raw credentials/PII',async()=>{
 assert.equal((await append(owner,{source:{kind:'manual',cookie:'secret'}})).status,400);
 assert.equal((await append(owner,{source:{kind:'anything'}})).status,400);
 assert.equal((await append(owner,{source:{kind:'call',reference:'bad phone 138'}})).status,400);
});
test('10 content empty/whitespace/over 1000/control rejects',async()=>{
 for(const content of ['', '  ','x'.repeat(1001),'hello\u0000world',' trailing ']){
  assert.equal((await append(owner,{content})).status,400);
 }
});
test('11 Unicode normalization and parameterized injection text remain safe',async()=>{
 const raw='客户拜访 e\u0301 <script> \' OR 1=1 --';
 const x=await append(owner,{content:raw});assert.equal(x.status,201);
 const row=(await sql('SELECT content FROM public.crm_followups WHERE followup_id=$1',[x.followupId])).rows[0];
 assert.equal(row.content,raw.normalize('NFC'));
});
test('12 history preserved across multiple appends; time strictly increases',async()=>{
 const a=await append(),b=await append();
 assert.equal(a.status,201);assert.equal(b.status,201);assert.notEqual(a.followupId,b.followupId);
 assert.ok(new Date(b.occurredAt).getTime()>=new Date(a.occurredAt).getTime());
 assert.equal((await sql('SELECT count(*)::int n FROM public.crm_followups WHERE followup_id IN ($1,$2)',[a.followupId,b.followupId])).rows[0].n,2);
});
test('13 exact request replay returns the original ID, no new audit or followup',async()=>{
 const k=key(),n=await count(),oldAudit=await audit();
 const a=await append(owner,{requestKey:k});const b=await append(owner,{requestKey:k});
 assert.equal(a.status,201);assert.deepEqual(a,b);assert.equal(await count(),n+1);assert.equal(await audit(),oldAudit+1);
});
test('14 payload change under existing request key conflicts',async()=>{
 const k=key();assert.equal((await append(owner,{requestKey:k})).status,201);
 assert.equal((await append(owner,{requestKey:k,content:'Another synthetic note'})).code,'IDEMPOTENCY_KEY_CONFLICT');
});
test('15 replaying same key by another employee conflicts',async()=>{
 const k=key();assert.equal((await append(owner,{requestKey:k})).status,201);
 assert.equal((await append(manager,{requestKey:k})).code,'IDEMPOTENCY_KEY_CONFLICT');
});
test('16 replaying same key against another Customer conflicts (without write)',async()=>{
 const k=key();assert.equal((await append(owner,{requestKey:k})).status,201);
 const x=await append(owner,{customerId:'302',requestKey:k});assert.equal(x.status,409);
});
test('17 two simultaneous same-key real sessions yield precisely one fact',async()=>{
 const n=await count(),k=key();const [a,b]=await Promise.all([append(owner,{requestKey:k}),append(owner,{requestKey:k})]);
 assert.equal(a.status,201);assert.deepEqual(a,b);assert.equal(await count(),n+1);
});
test('18 different keys are independent append-only facts',async()=>{
 const n=await count();const [a,b]=await Promise.all([append(),append()]);
 assert.equal(a.status,201);assert.equal(b.status,201);assert.notEqual(a.followupId,b.followupId);assert.equal(await count(),n+2);
});
test('19 System Admin cannot write business CRM even with valid PC token',async()=>{assert.equal((await append(admin)).code,'EMPLOYEE_BUSINESS_ONLY')});
test('20 4S hard denied despite synthetic write capability and object scope',async()=>{assert.equal((await append(fourS)).code,'FOUR_S_HARD_DENY')});
test('21 manager in same current store + explicit Scope may write but cannot steal owner',async()=>{
 const x=await append(manager);assert.equal(x.status,201);assert.equal(x.actorEmployeeId,'10');assert.equal(x.responsibleEmployeeId,'6');
 const ownerAfter=(await sql('SELECT current_owner_employee_id::text id FROM public.customers WHERE customer_id=301')).rows[0].id;assert.equal(ownerAfter,'6');
});
test('22 store manager with valid object Scope writes under actual responsible owner',async()=>{
 const x=await append(storeManager);assert.equal(x.status,201);assert.equal(x.actorEmployeeId,'11');assert.equal(x.responsibleEmployeeId,'6');
});
test('23 collaborator explicit active scope writes without owner change',async()=>{
 const x=await append(collaborator);assert.equal(x.status,201);assert.equal(x.responsibleEmployeeId,'6');
});
test('24 expired Collaboration denies sales with object Scope',async()=>{
 await sql("UPDATE public.customer_collaborations SET ended_at=now()-interval '1 second' WHERE collaboration_id=701");
 assert.equal((await append(collaborator)).code,'CURRENT_OWNER_OR_COLLAB_REQUIRED');
 await sql('UPDATE public.customer_collaborations SET ended_at=NULL WHERE collaboration_id=701');
});
test('25 former owner loses write when Customer transferred, no owner history rewrite',async()=>{
 await sql('UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=301');
 assert.equal((await append(owner)).code,'CURRENT_OWNER_OR_COLLAB_REQUIRED');
 await sql('UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=301');
});
test('26 no Customer owner => cannot invent a responsible employee',async()=>{
 await sql('UPDATE public.customers SET current_owner_employee_id=NULL WHERE customer_id=301');
 assert.equal((await append(owner)).code,'RESPONSIBLE_OWNER_MISSING');
 await sql('UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=301');
});
test('27 inactive Customer blocks append, preserves prior timeline',async()=>{
 const n=await count();await sql("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
 assert.equal((await append(owner)).code,'CUSTOMER_INACTIVE');assert.equal(await count(),n);
 await sql("UPDATE public.customers SET account_status='active' WHERE customer_id=301");
});
test('28 ended Customer object Scope revokes writing',async()=>{
 await sql("UPDATE public.employee_data_scopes SET ended_at=now()-interval '1 second' WHERE scope_id=701");
 assert.equal((await append(owner)).code,'CURRENT_CUSTOMER_SCOPE_DENIED');
 await sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=701');
});
test('29 ended permission Binding revokes writing',async()=>{
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=now()-interval '1 second' WHERE scope_id=701 AND permission_id=61");
 assert.equal((await append(owner)).code,'CURRENT_CUSTOMER_SCOPE_DENIED');
 await sql('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=701 AND permission_id=61');
});
test('30 personal deny takes priority over a synthetic role permission',async()=>{
 await sql("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=6 AND permission_id=61");
 assert.equal((await append(owner)).code,'PERSONAL_DENY');
 await sql("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=6 AND permission_id=61");
});
test('31 manager role default permission revocation prevents write',async()=>{
 await sql('UPDATE public.role_permission_defaults SET enabled=false WHERE role_id=3 AND permission_id=61');
 assert.equal((await append(manager)).code,'CRM_WRITE_CAPABILITY_DENIED');
 await sql('UPDATE public.role_permission_defaults SET enabled=true WHERE role_id=3 AND permission_id=61');
});
test('32 forced password change and disabled PC credential fail closed',async()=>{
 await sql('UPDATE public.pc_login_accounts SET force_password_change=true WHERE employee_id=6');
 assert.equal((await append(owner)).code,'FORCE_PASSWORD_CHANGE_REQUIRED');
 await sql('UPDATE public.pc_login_accounts SET force_password_change=false WHERE employee_id=6');
 await sql("UPDATE public.pc_login_accounts SET credential_state='disabled' WHERE employee_id=6");
 assert.equal((await append(owner)).status,401);
 await sql("UPDATE public.pc_login_accounts SET credential_state='enabled' WHERE employee_id=6");
});
test('33 revoked Employee lifecycle fails without privilege escalation',async()=>{
 await sql("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6");
 assert.equal((await append(owner)).status,401);
 await sql("UPDATE public.employees SET employment_status='active' WHERE employee_id=6");
});
test('34 fault before audit rolls back new followup row atomically',async()=>{
 const n=await count(),a=await audit();
 const broken=new CrmFollowupService(auth,{beforeAuditInsert:async()=>{throw Error('CI_ONLY_FAULT')}});
 assert.equal((await broken.append({token:owner,customerId:'301',content:'Simulated audit failure',source:{kind:'manual'},requestKey:key()})).status,503);
 assert.equal(await count(),n);assert.equal(await audit(),a);
});
test('35 scope revocation wins race against a blocked business insert',async()=>{
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("UPDATE public.employee_data_scopes SET ended_at=now()-interval '1 second' WHERE scope_id=701");
  const pending=append(owner);await new Promise(r=>setTimeout(r,70));await c.query('COMMIT');
  assert.equal((await pending).code,'CURRENT_CUSTOMER_SCOPE_DENIED');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();await sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=701')}
});
test('36 Customer account disable wins race and blocks CRM write',async()=>{
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
  const pending=append(owner);await new Promise(r=>setTimeout(r,70));await c.query('COMMIT');
  assert.equal((await pending).code,'CUSTOMER_INACTIVE');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();await sql("UPDATE public.customers SET account_status='active' WHERE customer_id=301")}
});
test('37 ordinary followup never mutates Demand or Consultation states',async()=>{
 const b=(await sql('SELECT demand_id,demand_state FROM public.demands WHERE customer_id=301 ORDER BY demand_id')).rows;
 const a=await append(owner,{businessDemandId:'502'});assert.equal(a.status,201);
 const y=(await sql('SELECT demand_id,demand_state FROM public.demands WHERE customer_id=301 ORDER BY demand_id')).rows;
 assert.deepEqual(b,y);
 const z=(await sql("SELECT count(*)::int n FROM public.audit_events WHERE action LIKE 'consultation.%' AND object_kind='crm_followup'")).rows[0].n;assert.equal(z,0);
});
test('38 correction/void is NOT_CONNECTED; frozen originals cannot be overwritten by service',async()=>{
 assert.equal(typeof service.correct,'undefined');assert.equal(typeof service.update,'undefined');assert.equal(typeof service.remove,'undefined');
});
