import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {CrmFollowupService} from '../../../src/f05-crm-followup-service.mjs';
import {connect} from '../../crm-followup-ci/environment.mjs';
import {verifyScopeDatabase} from '../../../f03/runtime-scope/readiness.mjs';

let pool,auth,service,owner,manager,storeManager,collaborator,admin,fourS,limited;
const sql=(q,v=[])=>pool.query(q,v);
const list=(token=owner,overrides={})=>service.list({token,customerId:'301',...overrides});
const count=async q=>(await sql(q)).rows[0].n;
const facts=()=>count("SELECT count(*)::int n FROM public.crm_followups");
const audits=()=>count("SELECT count(*)::int n FROM public.audit_events");
const ids=x=>x.items.map(i=>BigInt(i.followupId));
const keyOrder=x=>ids(x).every((n,i,a)=>i===0||a[i-1]>n);
const reset=async()=>{
 await sql("UPDATE public.customers SET account_status='active',owner_assignment_state='assigned',current_owner_employee_id=6 WHERE customer_id=301");
 await sql("UPDATE public.customers SET account_status='active',owner_assignment_state='assigned',current_owner_employee_id=1 WHERE customer_id=302");
 await sql("UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id IN (701,702,703,704)");
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id IN (701,702,703,704)");
 await sql("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id IN (6,7) AND permission_id=61");
 await sql("UPDATE public.role_permission_defaults SET enabled=true WHERE role_id IN (3,4) AND permission_id=61");
 await sql("UPDATE public.customer_collaborations SET ended_at=NULL WHERE collaboration_id=701");
 await sql("UPDATE public.employees SET employment_status='active',store_id=1 WHERE employee_id IN (6,7,10,11)");
 await sql("UPDATE public.pc_login_accounts SET force_password_change=false,credential_state='enabled' WHERE employee_id=6");
};
before(async()=>{
 pool=await connect();
 assert.equal((await verifyScopeDatabase(pool)).verified,true);
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:4401'});
 const accounts=[
  ['race_test','SyntheticRace_1234567'],['manager_account_ci','SyntheticManager_2026!'],
  ['store_manager_account_ci','SyntheticStoreManager_2026!'],
  ['limit_test','SyntheticLimit_1234567'],['admin_test','SyntheticAdmin_1234567'],
  ['four_s_test','SyntheticFourS_123456']
 ];
 const tokens=[];
 for(const [login,password] of accounts){
  const x=await auth.login({login,password,source:'crm-timeline-pg16-'+login});
  assert.equal(x.code,'AUTH_OK');tokens.push(x.token);
 }
 [owner,manager,storeManager,collaborator,admin,fourS]=tokens;
 service=new CrmFollowupService(auth);
 // Independent synthetic historical rows: no public migration and no foreign-domain side effects.
 for(let i=0;i<108;i++){
  await sql("INSERT INTO public.crm_followups(customer_id,responsible_employee_id,actor_employee_id,content,business_demand_id,source_context_json) "+
   "VALUES(301,6,6,$1,$2::bigint,$3::jsonb)",['Synthetic timeline #'+i,i%2?'501':null,JSON.stringify({kind:'manual',reference:'timeline_ci_01'})]);
 }
 await sql("INSERT INTO public.crm_followups(customer_id,responsible_employee_id,actor_employee_id,content,source_context_json) "+
  "VALUES(302,1,1,'Another customer synthetic followup','{\"kind\":\"call\"}'::jsonb)");
 await sql("INSERT INTO public.crm_followups(customer_id,responsible_employee_id,actor_employee_id,content,source_context_json) "+
  "VALUES(301,6,6,'Old invalid JSON source must be masked','{\"kind\":\"manual\",\"reference\":\"malformed secret\",\"token\":\"NEVER_EXPOSE_SECRET_42\"}'::jsonb)");
 await sql("UPDATE public.customers SET current_owner_employee_id=6,owner_assignment_state='assigned' WHERE customer_id=304");
 await sql("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES(804,6,'object',304)");
 await sql("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(6,61,804,now()-interval '2 minutes')");
});
after(async()=>{await reset().catch(()=>{});await auth?.close();await pool?.end()});
test('T01 current PG16 database is non-superuser and SG01 signed',async()=>{
 const x=(await sql("SELECT current_database() db,current_user usr,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su")).rows[0];
 assert.equal(x.db,'f03_auth_test');assert.equal(x.usr,'f03_ci');assert.equal(x.su,false);
});
test('T02 empty active assigned customer has safe empty page',async()=>{
 const x=await list(owner,{customerId:'304'});assert.equal(x.status,200);
 assert.deepEqual(x.items,[]);assert.equal(x.hasMore,false);assert.equal(x.nextBeforeFollowupId,null);
});
test('T03 default first page 20 newest and stable descending',async()=>{
 const x=await list();assert.equal(x.status,200);assert.equal(x.items.length,20);
 assert.equal(x.hasMore,true);assert.ok(keyOrder(x));assert.equal(x.nextBeforeFollowupId,x.items.at(-1).followupId);
});
test('T04 limit 1 pages one item',async()=>{const x=await list(owner,{limit:1});assert.equal(x.items.length,1);assert.equal(x.hasMore,true)});
test('T05 limit 50 enforces maximum with real more rows',async()=>{const x=await list(owner,{limit:50});assert.equal(x.items.length,50);assert.equal(x.hasMore,true);assert.ok(keyOrder(x))});
test('T06 limit 20 explicit equals default page',async()=>{
 const a=await list(),b=await list(owner,{limit:20});assert.deepEqual(a.items,b.items);
});
test('T07 invalid direct service page limits are denied',async()=>{
 for(const limit of [0,-1,51,1.5,NaN,Infinity,'20'])assert.equal((await list(owner,{limit})).status,400);
});
test('T08 invalid cursor rejects overflow/sign/zero/injection',async()=>{
 for(const beforeFollowupId of ['0','-1','01','9223372036854775808','1 OR 1=1',2])assert.equal((await list(owner,{beforeFollowupId})).status,400);
});
test('T09 100-plus historical records paginate without duplicate or loss',async()=>{
 const all=[];let cursor=null;
 for(let n=0;n<15;n++){
  const x=await list(owner,{limit:9,beforeFollowupId:cursor});assert.equal(x.status,200);assert.ok(keyOrder(x));
  all.push(...x.items.map(t=>t.followupId));
  if(!x.hasMore){assert.equal(x.nextBeforeFollowupId,null);break}
  cursor=x.nextBeforeFollowupId;assert.ok(cursor);
 }
 const countRows=Number(await count('SELECT count(*)::int n FROM public.crm_followups WHERE customer_id=301'));
 assert.equal(all.length,countRows);assert.equal(new Set(all).size,countRows);
});
test('T10 final past-end page has no cursor nor count disclosure',async()=>{
 const x=await list(owner,{beforeFollowupId:'1'});assert.equal(x.status,200);
 assert.deepEqual(x.items,[]);assert.equal(x.hasMore,false);assert.equal(x.nextBeforeFollowupId,null);
 assert.equal(Object.hasOwn(x,'total'),false);
});
test('T11 insertion between pages enters first page, no old duplicate',async()=>{
 const first=await list(owner,{limit:5});const old=first.items.map(x=>x.followupId);
 const fresh=(await sql("INSERT INTO public.crm_followups(customer_id,responsible_employee_id,actor_employee_id,content) "+
  "VALUES(301,6,6,'Inserted after the first page') RETURNING followup_id::text id")).rows[0].id;
 const next=await list(owner,{limit:10,beforeFollowupId:first.nextBeforeFollowupId});
 assert.equal(next.status,200);assert.ok(!next.items.some(x=>old.includes(x.followupId)||x.followupId===fresh));
 const now=await list(owner,{limit:1});assert.equal(now.items[0].followupId,fresh);
});
test('T12 same Customer multi-Demand history remains unified',async()=>{
 const x=await list(owner,{limit:50});
 assert.ok(x.items.some(z=>z.businessDemandId==='501'));assert.ok(x.items.some(z=>z.businessDemandId===null));
});
test('T13 different Customer cannot be leaked through customer-scoped query',async()=>{
 const x=await list();assert.equal(x.status,200);assert.ok(x.items.every(i=>i.customerId==='301'));
 await sql("UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=302");
 try{
  const y=await list(owner,{customerId:'302'});assert.equal(y.status,200);
  assert.ok(y.items.every(i=>i.customerId==='302'));assert.equal(y.items.length,1);
 }finally{await sql("UPDATE public.customers SET current_owner_employee_id=1 WHERE customer_id=302")}
});
test('T14 projection is exactly safe fields; old invalid source is scrubbed',async()=>{
 const x=await list(owner,{limit:50});
 const row=x.items.find(i=>i.content==='Old invalid JSON source must be masked');
 assert.ok(row);
 assert.deepEqual(Object.keys(row).sort(),['actorEmployeeId','businessDemandId','content','customerId','followupId','occurredAt','responsibleEmployeeId','source'].sort());
 assert.deepEqual(row.source,{kind:'manual',reference:null});
 assert.equal(JSON.stringify(x).includes('NEVER_EXPOSE_SECRET_42'),false);
});
test('T15 manager/store manager current same-store object Scope allows list',async()=>{
 assert.equal((await list(manager)).status,200);assert.equal((await list(storeManager)).status,200);
});
test('T16 legitimate active Collaboration with current object scope allows read',async()=>{assert.equal((await list(collaborator)).status,200)});
test('T17 4S and System Admin do not inherit business CRM reader access',async()=>{
 assert.equal((await list(fourS)).code,'FOUR_S_HARD_DENY');assert.equal((await list(admin)).code,'EMPLOYEE_BUSINESS_ONLY');
});
test('T18 active Customer but owner_assignment_pending with stale owner denies read',async()=>{
 await sql("UPDATE public.customers SET owner_assignment_state='owner_assignment_pending' WHERE customer_id=301");
 try{assert.equal((await list()).code,'CUSTOMER_OWNER_NOT_ASSIGNED')}
 finally{await sql("UPDATE public.customers SET owner_assignment_state='assigned' WHERE customer_id=301")}
});
test('T19 Customer inactive blocks historic timeline without deleting history',async()=>{
 const n=await facts();await sql("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
 try{assert.equal((await list()).code,'CUSTOMER_INACTIVE');assert.equal(await facts(),n)}
 finally{await sql("UPDATE public.customers SET account_status='active' WHERE customer_id=301")}
});
test('T20 old owner loses historic read after transfer; new scoped owner inherits history',async()=>{
 await sql("UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=301");
 try{
  assert.equal((await list(owner)).code,'CURRENT_OWNER_OR_COLLAB_REQUIRED');
  const x=await list(collaborator);assert.equal(x.status,200);assert.ok(x.items.some(i=>i.responsibleEmployeeId==='6'));
 }finally{await sql("UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=301")}
});
test('T21 explicit personal deny revokes even the current owner',async()=>{
 await sql("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=6 AND permission_id=61");
 try{assert.equal((await list()).code,'PERSONAL_DENY')}
 finally{await sql("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=6 AND permission_id=61")}
});
test('T22 expired object scope and binding deny a timeline page',async()=>{
 await sql("UPDATE public.employee_data_scopes SET ended_at=now()-interval '1 second' WHERE scope_id=701");
 try{assert.equal((await list()).code,'CURRENT_CUSTOMER_SCOPE_DENIED')}
 finally{await sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=701')}
 await sql("UPDATE public.employee_capability_scope_bindings SET ended_at=now()-interval '1 second' WHERE scope_id=701 AND permission_id=61");
 try{assert.equal((await list()).code,'CURRENT_CUSTOMER_SCOPE_DENIED')}
 finally{await sql('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL WHERE scope_id=701 AND permission_id=61')}
});
test('T23 expired Collaboration and lost same-store manager relation deny',async()=>{
 await sql("UPDATE public.customer_collaborations SET ended_at=now()-interval '1 second' WHERE collaboration_id=701");
 try{assert.equal((await list(collaborator)).code,'CURRENT_OWNER_OR_COLLAB_REQUIRED')}
 finally{await sql('UPDATE public.customer_collaborations SET ended_at=NULL WHERE collaboration_id=701')}
 await sql('UPDATE public.employees SET store_id=NULL WHERE employee_id=10');
 try{assert.equal((await list(manager)).code,'CROSS_STORE_DENIED')}
 finally{await sql('UPDATE public.employees SET store_id=1 WHERE employee_id=10')}
});
test('T24 PC force password change and disabled employee fail closed',async()=>{
 await sql('UPDATE public.pc_login_accounts SET force_password_change=true WHERE employee_id=6');
 try{assert.equal((await list()).code,'FORCE_PASSWORD_CHANGE_REQUIRED')}
 finally{await sql('UPDATE public.pc_login_accounts SET force_password_change=false WHERE employee_id=6')}
 await sql("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=6");
 try{assert.equal((await list()).status,401)}
 finally{await sql("UPDATE public.employees SET employment_status='active' WHERE employee_id=6")}
});
test('T25 real dual-connection scope revocation commits before next page',async()=>{
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("UPDATE public.employee_data_scopes SET ended_at=now()-interval '1 second' WHERE scope_id=701");
  const pending=list();await new Promise(r=>setTimeout(r,75));await c.query('COMMIT');
  assert.equal((await pending).code,'CURRENT_CUSTOMER_SCOPE_DENIED');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();await sql('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=701')}
});
test('T26 real dual-connection customer disable commits before page',async()=>{
 const c=await pool.connect();
 try{
  await c.query('BEGIN');await c.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=301");
  const pending=list();await new Promise(r=>setTimeout(r,75));await c.query('COMMIT');
  assert.equal((await pending).code,'CUSTOMER_INACTIVE');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();await sql("UPDATE public.customers SET account_status='active' WHERE customer_id=301")}
});
test('T27 real dual-connection owner transfer commits before page',async()=>{
 const c=await pool.connect();
 try{
  await c.query('BEGIN');await c.query("UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=301");
  const pending=list(owner);await new Promise(r=>setTimeout(r,75));await c.query('COMMIT');
  assert.equal((await pending).code,'CURRENT_OWNER_OR_COLLAB_REQUIRED');
 }finally{await c.query('ROLLBACK').catch(()=>{});c.release();await sql('UPDATE public.customers SET current_owner_employee_id=6 WHERE customer_id=301')}
});
test('T28 timeline is SELECT-only and never creates audit or mutates old facts',async()=>{
 const n=await facts(),a=await audits();
 const old=(await sql('SELECT followup_id,content,actor_employee_id,occurred_at FROM public.crm_followups WHERE customer_id=301 ORDER BY followup_id LIMIT 3')).rows;
 await list();await list(owner,{limit:12});await list(owner,{limit:4,beforeFollowupId:'9223372036854775807'});
 const current=(await sql('SELECT followup_id,content,actor_employee_id,occurred_at FROM public.crm_followups WHERE customer_id=301 ORDER BY followup_id LIMIT 3')).rows;
 assert.equal(await facts(),n);assert.equal(await audits(),a);assert.deepEqual(old,current);
});
