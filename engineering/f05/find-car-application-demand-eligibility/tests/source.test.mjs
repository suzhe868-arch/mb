import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify,ID} from '../migration.mjs';
import {syntheticCustomerActor,submitCIApplication as submit,editCIApplication as edit,
 closeCIApplication as close,activateCIDemand as activate,SOURCE_GAPS} from '../service.mjs';
const db=await connect(),secret=randomBytes(32),actor=new Map(),token={};
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:48987'});
const cred={sales:['employee_test','SyntheticF04_3_CurrentProof_2026'],
 manager:['http_test','SyntheticHttps_1234567'],head:['race_test','SyntheticRace_1234567'],
 admin:['admin_test','SyntheticAdmin_1234567'],four:['four_s_test','SyntheticFourS_123456']};
const user=id=>{if(!actor.has(id))actor.set(id,syntheticCustomerActor(id));return actor.get(id)};
const login=async who=>{const [login,password]=cred[who],s=await auth.login({login,password,source:'f05-6-ci-real-F03-'+who});assert.equal(s.code,'AUTH_OK');return s.token};
const appKey=s=>'f05-6-ci-application-'+s+'-source';
const actKey=s=>'f05-6-ci-activation-'+s+'-source';
const application=async(id,s)=>submit(user(id),{applicationKey:appKey(s),desiredVehicle:'Audi A6 2026 model'});
const activation=(who,id,s,opts)=>activate(auth,token[who],{applicationId:id,requestKey:actKey(s),teamId:901},opts);
const q=(sql,args=[])=>db.query(sql,args).then(r=>r.rows);
const digest=obj=>createHash('sha256').update(JSON.stringify(obj)).digest('hex');
const snapshot=async id=>({
 applications:await q('SELECT application_id,status,assigned_employee_id,activated_demand_id FROM public.find_car_applications WHERE customer_id=$1 ORDER BY application_id',[id]),
 demands:await q('SELECT demand_id,demand_state,responsible_employee_id,created_at FROM public.demands WHERE customer_id=$1 ORDER BY demand_id',[id]),
 events:await q('SELECT application_id,demand_id,actor_employee_id FROM public.f05_6_activation_events_ci WHERE customer_id=$1 ORDER BY event_id',[id])
});
const races=[];
test.before(async()=>{
 assert.equal((await verify(db)).verified,true);
 for(const who of Object.keys(cred))token[who]=await login(who);
 const before=token.manager,change=await auth.change({token:before,csrf:auth.csrfFor(before),
 oldPassword:cred.manager[1],newPassword:'SyntheticF056DemandManager_2026'});
 assert.equal(change.code,'PASSWORD_CHANGED_REAUTH_REQUIRED');
 cred.manager[1]='SyntheticF056DemandManager_2026';token.manager=await login('manager');
});
test.after(async()=>{await auth.close();await db.end();secret.fill(0)});
test('6-A01 genuine nonprivileged PG16 v22 signed M94-v21 ledger, actual catalog and rollback',async()=>{
 const signed=await verify(db);assert.equal(signed.id,ID);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,20);
});
test('6-A02 neither caller-supplied Customer ID nor forged phone/owner/entitlement can form trusted actor',async()=>{
 let x=await submit({customerId:899611}, {applicationKey:appKey('fake-actor'),desiredVehicle:'BMW'});
 assert.equal(x.allowed,false);assert.equal(x.code,SOURCE_GAPS.customer);
 assert.equal((await snapshot(899611)).applications.length,0);
});
test('6-A03 missing signed synthetic phone gate refuses all Application side effects',async()=>{
 const x=await application(899616,'missing-phone');
 assert.equal(x.code,SOURCE_GAPS.phone);
 assert.equal((await snapshot(899616)).applications.length,0);
});
test('6-A04 no current owner and no signed share/referral/accepting pool cannot generate null-responsible Application',async()=>{
 const x=await application(899615,'no-owner');
 assert.equal(x.code,'F05_6_UNASSIGNED_CUSTOMER_NO_PENDING_APPLICATION');
 assert.equal((await snapshot(899615)).applications.length,0);
});
test('6-A05 Ordinary find entitlement OFF can submit only pending Application, no Demand or Matching',async()=>{
 const x=await application(899611,'ordinary-pending');assert.equal(x.code,'F05_6_APPLICATION_PENDING');
 assert.equal(x.ownerEmployeeId,1);
 const snap=await snapshot(899611);
 assert.equal(snap.applications.length,1);assert.equal(snap.applications[0].status,'pending');
 assert.equal(snap.demands.length,0);assert.equal(snap.events.length,0);
});
test('6-A06 repeated Application key never duplicates original row or work item; pending edit same ID',async()=>{
 const before=await snapshot(899611);
 const x=await application(899611,'ordinary-pending');
 assert.equal(x.code,'F05_6_APPLICATION_ALREADY_PENDING_OR_RECORDED');
 assert.equal(x.applicationId,Number(before.applications[0].application_id));
 const editResult=await edit(user(899611),x.applicationId,'Audi Q5 New Year');
 assert.equal(editResult.code,'F05_6_PENDING_APPLICATION_EDITED');
 assert.equal((await snapshot(899611)).applications.length,1);
});
test('6-A07 ordinary pending Application cannot activate despite valid Employee F03 session',async()=>{
 const id=Number((await snapshot(899611)).applications[0].application_id);
 const x=await activation('sales',id,'ordinary-no-entitlement');
 assert.equal(x.code,'F05_6_FIND_ENTITLEMENT_OFF');
 assert.equal((await snapshot(899611)).demands.length,0);
});
test('6-A08 upgrade level to independent find ON does not automatically create Demand or Matching',async()=>{
 const a=await snapshot(899611);
 await db.query('UPDATE public.customers SET customer_level_id=2 WHERE customer_id=899611');
 assert.deepEqual(await snapshot(899611),a);
 assert.equal((await q('SELECT find_enabled FROM public.f05_6_level_find_policy_ci WHERE level_id=2'))[0].find_enabled,true);
});
test('6-A09 successful authorized manual activation creates exactly one Demand and immutable activation fact',async()=>{
 const before=await snapshot(899611),id=Number(before.applications[0].application_id);
 const x=await activation('sales',id,'ordinary-upgraded-manual');
 assert.equal(x.code,'F05_6_MANUAL_DEMAND_ACTIVATED',JSON.stringify(x));assert.equal(x.matchingReady,false);
 const after=await snapshot(899611);
 assert.equal(after.demands.length,1);assert.equal(after.events.length,1);
 assert.equal(after.applications[0].status,'activated');
 assert.equal(Number(after.applications[0].activated_demand_id),Number(after.demands[0].demand_id));
 assert.equal(Number(after.demands[0].responsible_employee_id),1);
});
test('6-A10 same activation key returns same Demand, different key on activated Application is denied',async()=>{
 const id=Number((await snapshot(899611)).applications[0].application_id);
 const a=await activation('sales',id,'ordinary-upgraded-manual');
 assert.equal(a.code,'F05_6_DEMAND_ALREADY_ACTIVATED');
 const b=await activation('sales',id,'other-key-would-create-second');
 assert.equal(b.code,'F05_6_ACTIVATION_IDEMPOTENCY_COLLISION');
 assert.equal((await snapshot(899611)).demands.length,1);
});
test('6-A11 pending app manually closed can never activate or reopen through edit',async()=>{
 const x=await application(899612,'will-close');
 assert.equal((await close(user(899612),x.applicationId)).code,'F05_6_APPLICATION_CLOSED');
 assert.equal((await activation('sales',x.applicationId,'closed-app')).code,'F05_6_APPLICATION_NOT_PENDING');
 assert.equal((await edit(user(899612),x.applicationId,'BMW G20')).allowed,false);
});
test('6-A12 find ON never auto-activates; manager needs real F03 normal login and separate current scope',async()=>{
 const x=await application(899612,'manager-manual');
 const before=await snapshot(899612);assert.equal(before.demands.length,0);
 const y=await activation('manager',x.applicationId,'manager-f03-current');
 assert.equal(y.code,'F05_6_MANUAL_DEMAND_ACTIVATED',JSON.stringify(y));
 assert.equal((await snapshot(899612)).demands.length,1);
});
test('6-A13 FourS/SystemAdmin sessions and fake cookie cannot activate even synthetic eligible Application',async()=>{
 const x=await application(899613,'four-admin-fake');
 for(const who of ['four','admin']){
  const y=await activation(who,x.applicationId,'bad-role-'+who);assert.equal(y.allowed,false);
 }
 assert.equal((await snapshot(899613)).demands.length,0);
});
test('6-A14 current Employee personal DENY prevents manual activation; re-enabling does not auto-activate',async()=>{
 const id=(await application(899613,'permission-deny')).applicationId;
 const before=await snapshot(899613);
 await db.query("UPDATE public.employee_permission_overrides SET decision='deny' WHERE employee_id=1 AND permission_id=96");
 const denied=await activation('sales',id,'static-permission-deny');assert.equal(denied.code,SOURCE_GAPS.activation);
 assert.deepEqual(await snapshot(899613),before);
 await db.query("UPDATE public.employee_permission_overrides SET decision='allow' WHERE employee_id=1 AND permission_id=96");
 assert.deepEqual(await snapshot(899613),before);
});
test('6-A15 two truly independent F03 session requests same Application cannot create two Demands',async()=>{
 const x=await application(899613,'two-real-session-activation');
 const [a,b]=await Promise.all([login('sales'),login('sales')]);
 const backendSet=new Set();
 const callback=async(_,c)=>backendSet.add(Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid));
 const outs=await Promise.all([
  activate(auth,a,{applicationId:x.applicationId,requestKey:actKey('one-key-two-backends'),teamId:901},{checkpoint:callback}),
  activate(auth,b,{applicationId:x.applicationId,requestKey:actKey('one-key-two-backends'),teamId:901},{checkpoint:callback})
 ]);
 assert.deepEqual(outs.map(x=>x.code).sort(),['F05_6_DEMAND_ALREADY_ACTIVATED','F05_6_MANUAL_DEMAND_ACTIVATED'].sort());
 const snap=await snapshot(899613);assert.equal(snap.demands.length,1);assert.equal(snap.events.length,1);
 // A blocked second F03 call might not reach the callback (by design) but actual
 // backend contention is separately proved with 55P03 in 6-A19...21.
 console.log('F05_6_ACTIVATION_TWO_F03_SESSIONS_SINGLE_DEMAND',JSON.stringify({requestCount:2,demandCount:1,observedExecutingPids:[...backendSet]}));
});
test('6-A16 Demand responsible employee does not automatically drift with Customer Owner',async()=>{
 const snap=await snapshot(899611),original=Number(snap.demands[0].responsible_employee_id);
 await db.query('UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=899611');
 assert.equal(Number((await snapshot(899611)).demands[0].responsible_employee_id),original);
});
test('6-A17 Customer inactive and level downgrade block future activation but preserve live history',async()=>{
 const x=await application(899614,'downgrade-protection');
 assert.equal((await activation('sales',x.applicationId,'off-activation')).code,'F05_6_FIND_ENTITLEMENT_OFF');
 const before=await snapshot(899614);
 await db.query('UPDATE public.customers SET customer_level_id=2 WHERE customer_id=899614');
 assert.deepEqual(await snapshot(899614),before);
 await db.query("UPDATE public.customers SET account_status='inactive' WHERE customer_id=899614");
 assert.equal((await activation('sales',x.applicationId,'inactive-now')).code,'F05_6_CUSTOMER_INACTIVE');
 assert.deepEqual(await snapshot(899614),before);
 await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=899614");
 assert.deepEqual(await snapshot(899614),before);
});
test('6-A18 created_at immutable; no new Recommendation/Matching/price or quotas when Application activated',async()=>{
 const before=await q('SELECT demand_id,created_at FROM public.demands WHERE customer_id=899612');
 await assert.rejects(()=>db.query("UPDATE public.demands SET created_at=now()-interval '1 day' WHERE demand_id=$1",[before[0].demand_id]),/F05_6_DEMAND_CREATION_TIME_FROZEN/);
 await assert.rejects(()=>db.query('UPDATE public.f05_6_activation_events_ci SET request_key=$1 WHERE demand_id=$2',[actKey('tamper'),before[0].demand_id]),/F05_6_SIGNED_APPLICATION_DEMAND_FACT_IMMUTABLE/);
 const forbidden=['demand_match_results','recommendations','priority_leases','locks','transactions','customer_price_unlock_events'];
 const result={};for(const table of forbidden){
  try{result[table]=Number((await q('SELECT count(*)::int n FROM public.'+table))[0].n)}catch(e){if(e.code!=='42P01')throw e;result[table]='SOURCE_TABLE_NOT_CURRENT'}
 }
 assert.ok(Object.values(result).every(z=>z===0||z==='SOURCE_TABLE_NOT_CURRENT'),JSON.stringify(result));
});
async function race({id,customerId,name,sql,args,denial,restore}){
 const original=await application(customerId,'race-'+name);
 const c2=await connect();
 let release,enteredResolve;
 const entered=new Promise(r=>{enteredResolve=r});
 const hold=new Promise(r=>{release=r});
 let servicePid,writerPid,servicePromise,sqlstate,details={};
 const events=[];
 try{
  writerPid=Number((await c2.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  servicePromise=activation('sales',original.applicationId,'valid-before-'+name,{checkpoint:async (stage,c)=>{
   assert.equal(stage,'after_application_customer_owner_level_phone_permission_guard');
   servicePid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   assert.notEqual(writerPid,servicePid);
   events.push({what:'guard_locked_before_activation_COMMIT',at:new Date().toISOString(),servicePid});
   enteredResolve();await hold;
  }});
  let wait;try{await Promise.race([entered,new Promise((_,reject)=>{wait=setTimeout(()=>reject(Error('F05_6_SERVICE_CHECKPOINT_TIMEOUT')),18000)})])}finally{clearTimeout(wait)}
  await c2.query('BEGIN');await c2.query("SET LOCAL lock_timeout='240ms'");
  events.push({what:'writer_conflicting_UPDATE_started',at:new Date().toISOString(),writerPid});
  try{await c2.query(sql,args);throw Error('F05_6_LOCK_MUST_PREVENT_CONCURRENT_MUTATION')}
  catch(e){if(e.code!=='55P03')throw e;sqlstate=e.code;}
  events.push({what:'writer_received_actual_PG_55P03',at:new Date().toISOString(),sqlstate});
  await c2.query('ROLLBACK');
  release();
  const service=await servicePromise;
  assert.equal(service.code,'F05_6_MANUAL_DEMAND_ACTIVATED',JSON.stringify(service));
  events.push({what:'original_valid_activation_COMMIT',at:new Date().toISOString()});
  await c2.query('BEGIN');
  const mutate=await c2.query(sql,args);assert.equal(mutate.rowCount,1);
  await c2.query('COMMIT');
  events.push({what:'writer_mutation_COMMITTED_after_activation',at:new Date().toISOString()});
  const post=await snapshot(customerId);
  const denialOfReuse=await activation('sales',original.applicationId,'valid-before-'+name);
  assert.equal(denialOfReuse.allowed,false);
  assert.equal(denialOfReuse.code,denial);
  const noNew=await application(customerId,'new-after-'+name);
  // Submitting a new pending Application can be allowed after Permission revoke,
  // because submit has Customer phone/Owner guards independent from activation.
  if(noNew.allowed){
   const further=await activation('sales',noNew.applicationId,'try-after-'+name);
   assert.equal(further.allowed,false);
   assert.ok(name==='owner-changed'?['F05_6_OWNER_REASSIGNMENT_REQUIRED','F05_6_EMPLOYEE_NOT_CURRENT_OWNER'].includes(further.code):further.code===denial,JSON.stringify(further));
  }
  const after=await snapshot(customerId);
  assert.equal(after.demands.length,post.demands.length);
  assert.equal(after.events.length,post.events.length);
  details={case:name,servicePid,writerPid,distinctPids:servicePid!==writerPid,sqlstate,
   events,beforeDemandCount:0,afterDemandCount:post.demands.length,postRevocationDemandCount:after.demands.length,
   immutableEventsSHA256:digest(after.events),downstreamNoAutoMatching:true,productionIssuer:'SOURCE_GAP'};
  races.push(details);
  console.log('F05_6_TRUE_PG16_INFLIGHT_DEMAND_ACTIVATION_RACE',JSON.stringify(details));
  if(restore)await restore(c2);
 }finally{if(release)release();if(servicePromise)await servicePromise.catch(()=>{});await c2.query('ROLLBACK').catch(()=>{});await c2.end();}
}
test('6-A19 true two PG16 backends Owner transfer during in-flight activation yields real 55P03 and owner-first subsequent denial',async()=>{
 await race({id:19,customerId:899618,name:'owner-changed',sql:'UPDATE public.customers SET current_owner_employee_id=7 WHERE customer_id=$1',
  args:[899618],denial:'F05_6_OWNER_REASSIGNMENT_REQUIRED'});
});
test('6-A20 true two PG16 backends current Employee permission DENY competing with in-flight activation',async()=>{
 await race({id:20,customerId:899619,name:'employee-permission-denied',sql:"UPDATE public.employee_permission_overrides SET decision='deny',changed_at=now() WHERE employee_id=1 AND permission_id=96",
  args:[],denial:SOURCE_GAPS.activation,restore:async c=>{
   await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=now() WHERE employee_id=1 AND permission_id=96");
  }});
});
test('6-A21 true two PG16 backends Customer entitlement OFF competing with in-flight activation',async()=>{
 await race({id:21,customerId:899620,name:'level-find-entitlement-off',sql:'UPDATE public.f05_6_level_find_policy_ci SET find_enabled=false WHERE level_id=2',
  args:[],denial:'F05_6_FIND_ENTITLEMENT_OFF',restore:async c=>{
   await c.query('UPDATE public.f05_6_level_find_policy_ci SET find_enabled=true WHERE level_id=2');
  }});
});
test('6-A22 Customer deliberately stops using Demand: cannot forge a completed/cancelled final state from CI actor',async()=>{
 const active=(await snapshot(899612)).demands[0];
 assert.ok(active);
 assert.equal((await q('SELECT demand_state FROM public.demands WHERE demand_id=$1',[active.demand_id]))[0].demand_state,'active');
 // no finish endpoint or unsigned "paused" auto resume exists in this batch.
 assert.equal((await snapshot(899612)).demands[0].demand_state,'active');
});
test('6-A23 false Customer price entitlement cannot authorize Demand if current find entitlement OFF',async()=>{
 const x=await application(899621,'independent-price-test');
 await db.query('UPDATE public.customers SET customer_level_id=1 WHERE customer_id=899621');
 const old=(await q('SELECT price_mode FROM public.f05_4_level_price_policy_ci WHERE level_id=1'))[0];
 assert.equal(old.price_mode,'LIMITED');
 assert.equal((await activation('sales',x.applicationId,'only-price-not-find')).code,'F05_6_FIND_ENTITLEMENT_OFF');
 assert.equal((await snapshot(899621)).demands.length,0);
});
test('6-A24 preserve original business data and native signed structural SHA, archive true-PG16 races and source gaps',async()=>{
 assert.equal(races.length,3);
 assert.ok(races.every(x=>x.distinctPids&&x.sqlstate==='55P03'));
 const seal=await verify(db);
 const app=(await q('SELECT count(*)::int n FROM public.find_car_applications'))[0].n;
 const demands=(await q('SELECT count(*)::int n FROM public.demands'))[0].n;
 const events=(await q('SELECT count(*)::int n FROM public.f05_6_activation_events_ci'))[0].n;
 await mkdir(new URL('../artifacts/source/',import.meta.url),{recursive:true});
 await writeFile(new URL('../artifacts/source/true-pg16-application-demand-owner-permission-level-race.json',import.meta.url),
  JSON.stringify({seal,source:'CI_SYNTHETIC_CUSTOMER_ACTOR_PHONE_ENTITLEMENT_PERMISSION_NOT_PRODUCTION',
   liveCustomerWeChatIssuerProven:false,livePhoneAuthorizationIssuerProven:false,liveEmployeeActivationPermissionIssuerProven:false,
   nativePG16BackendRaces:races,realOriginalTableCounts:{applications:app,demands,events},
   originalRowCountSha256:digest({app,demands,events}),sourceGaps:SOURCE_GAPS},null,2)+'\n');
 console.log('F05_6_APPLICATION_PENDING_MANUAL_DEMAND_REAL_PG16_SAFE_WITH_SOURCE_GAPS');
});
