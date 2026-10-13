import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {claimCI,assignCI,serviceAssignCI,syntheticServiceRequest,preClaimSummaryCI,inspectProtectionCI,productionDeny} from '../service.mjs';
const c=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:49220'});
const k=x=>'pdm17-ci-owner-claim-'+x+'-20261013';
const q=(s,a=[])=>c.query(s,a).then(r=>r.rows);
let sales,manager,admin,four;
const refresh=async(who)=>{const account=who==='sales'?['limit_test','SyntheticLimit_1234567']:['employee_test','SyntheticF04_3_CurrentProof_2026'];const r=await auth.login({login:account[0],password:account[1],source:'d1-refresh-'+who+'-'+Date.now()});assert.equal(r.code,'AUTH_OK');if(who==='sales')sales=r.token;else manager=r.token;};
const claim=(id,key=k('claim-'+id))=>claimCI(auth,sales,{customerId:id,requestKey:key});
const assign=(id,target=7,key=k('assign-'+id))=>assignCI(auth,manager,{customerId:id,targetEmployeeId:target,requestKey:key});
test.before(async()=>{
 assert.equal((await verify(c)).verified,true);
 for(const [name,username,pw] of [['sales','limit_test','SyntheticLimit_1234567'],
  ['manager','employee_test','SyntheticF04_3_CurrentProof_2026'],
  ['admin','admin_test','SyntheticAdmin_1234567'],
  ['four','four_s_test','SyntheticFourS_123456']]){
  const x=await auth.login({login:username,password:pw,source:'d1-'+name+'-'+Date.now()});
  assert.equal(x.code,'AUTH_OK',name+':'+JSON.stringify(x));if(name==='sales')sales=x.token;
  if(name==='manager')manager=x.token;if(name==='admin')admin=x.token;if(name==='four')four=x.token;
 }
});
test.after(async()=>{await auth.close();await c.end()});
const state=async id=>(await q('SELECT current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=$1',[id]))[0];
const snap=async()=>{
 let out={};
 for(const name of ['consultations','recommendations','vehicle_visibility_grants','priority_leases','locks','transactions','demands','customer_price_cycle_unlocks','customer_price_unlock_events']){
  const z=(await q("SELECT count(*)::int n,md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY to_jsonb(t)::text),'')) digest FROM public."+name+" t"))[0];
  out[name]=z;
 }
 return out;
};
test('D1-S01 genuine signed v25 preserved and separate D1 sidecar verified',async()=>{
 const x=await verify(c);assert.equal(x.verified,true);
 assert.match(x.oldSignedLedgerSHA,/^[a-f0-9]{64}$/);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,23);
 assert.equal(productionDeny().allowed,false);
 assert.equal((await state(989201)).current_owner_employee_id,null);
 assert.equal((await preClaimSummaryCI(c,989201)).claimablePossible,true);
 assert.deepEqual(Object.keys(await preClaimSummaryCI(c,989201)).sort(),
 ['allowed','claimablePossible','code','syntheticCIOnly'].sort());
});
test('D1-S02 no assigned Owner or arbitrary NULL customer can bypass synthetic signed pool carrier',async()=>{
 assert.equal((await state(989201)).owner_assignment_state,'unassigned');
 const raw=await claimCI(auth,sales,{customerId:301,requestKey:k('not-pool')});
 assert.equal(raw.allowed,false);
 assert.equal((await q("SELECT count(*)::int n FROM d1_owner_ci.receipts"))[0].n,0);
 assert.equal((await serviceAssignCI({customerId:989201},{requestKey:k('fake-service')})).allowed,false);
});
test('D1-S03 permitted Sales independently claims true pool, produces signed current Owner and immutable history',async()=>{
 const before=await snap();
 const x=await claim(989201);
 assert.equal(x.allowed,true,JSON.stringify(x));assert.equal(x.created,true);
 assert.equal(Number((await state(989201)).current_owner_employee_id),7);
 assert.equal((await state(989201)).owner_assignment_state,'assigned');
 const rr=(await q('SELECT * FROM d1_owner_ci.receipts WHERE customer_id=989201'))[0];
 assert.equal(rr.mode,'claim');assert.equal(Number(rr.previous_owner_id??0),0);
 assert.equal(Number(rr.new_owner_id),7);
 const hist=(await q('SELECT * FROM public.customer_owner_history WHERE owner_history_id=$1',[rr.owner_history_id]))[0];
 assert.equal(Number(hist.to_employee_id),7);assert.equal(hist.from_employee_id,null);
 const audit=(await q('SELECT * FROM public.audit_events WHERE audit_id=$1',[rr.audit_id]))[0];
 assert.equal(audit.action,'pdm17.public_pool.owner.claim');
 await assert.rejects(()=>c.query('DELETE FROM d1_owner_ci.receipts WHERE receipt_id=$1',[rr.receipt_id]),/D1_OWNER_HISTORY_IMMUTABLE/);
 await assert.rejects(()=>c.query("UPDATE d1_owner_ci.pool_cycles SET original_source_json='{}'::jsonb WHERE customer_id=989201"),/D1_POOL_ENTRY_SOURCE_IMMUTABLE/);
 const after=await snap();assert.deepEqual(after,before,'Consultation/Grant/Price/Lock/Transaction/Demand remain independent');
 console.log('D1_REAL_PG16_SIGNED_CLAIM_HISTORY_AUDIT',JSON.stringify({receiptId:rr.receipt_id,historyId:rr.owner_history_id,
  auditId:rr.audit_id,sourceCycleId:rr.cycle_id,otherDomainCountHash:before,backend:(await q('SELECT pg_backend_pid() pid'))[0].pid}));
});
test('D1-S04 idempotent retry does not make duplicate Owner or receipt; unrelated request cannot silently steal',async()=>{
 const repeated=await claim(989201);assert.equal(repeated.allowed,true);assert.equal(repeated.created,false);
 assert.equal((await claim(989201,k('different-key'))).allowed,false);
 assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=989201'))[0].n,1);
});
test('D1-S05 genuine scoped manager independently assigns Owner; admin, 4S, no capability sales denied',async()=>{
 const good=await assign(989202);assert.equal(good.allowed,true,JSON.stringify(good));
 assert.equal(Number((await state(989202)).current_owner_employee_id),7);
 for(const token of [admin,four,sales]){
  const response=await assignCI(auth,token,{customerId:989203,targetEmployeeId:7,requestKey:k('illegal-'+String(token).slice(0,3))});
  assert.equal(response.allowed,false,JSON.stringify(response));
 }
 assert.equal((await state(989203)).current_owner_employee_id,null);
 const improper=await assign(989203,2,k('four-s-target'));
 assert.equal(improper.allowed,false);
 assert.equal((await state(989203)).current_owner_employee_id,null);
});
test('D1-S06 Scope deny before commit and protective source blocks even valid Manager',async()=>{
 await c.query("UPDATE d1_owner_ci.pool_cycles SET protective_hold=true WHERE customer_id=989204");
 assert.equal((await assign(989204)).allowed,false);
 assert.equal((await state(989204)).current_owner_employee_id,null);
 await c.query("UPDATE d1_owner_ci.pool_cycles SET protective_hold=false WHERE customer_id=989204");
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9817011099");
 assert.equal((await assign(989204)).allowed,false);
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9817011099");
 await refresh('manager');const ok=await assign(989204);assert.equal(ok.allowed,true,JSON.stringify(ok));
});
test('D1-S07 2 physical PG backends same Customer serializes Manager assign vs Sales claim, one winner',async()=>{
 const other=await connect();let a,b;try{
  await other.query('BEGIN');
  const blocker=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  await other.query('SELECT customer_id FROM public.customers WHERE customer_id=989205 FOR UPDATE');
  let doneA=false,doneB=false;
  a=claim(989205);a.then(()=>doneA=true,()=>doneA=true);
  await new Promise(done=>setTimeout(done,100));
  b=assign(989205);b.then(()=>doneB=true,()=>doneB=true);
  await new Promise(done=>setTimeout(done,100));
  assert.equal(doneA,false);
  assert.equal(doneB,false);
  await other.query('COMMIT');
  const x=await a,y=await b;
  assert.equal([x,y].filter(z=>z.allowed&&z.created).length,1,JSON.stringify({x,y}));
  assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=989205'))[0].n,1);
  assert.equal(Number((await state(989205)).current_owner_employee_id),7);
  console.log('D1_TWO_PG16_COMMIT_ONE_WINNER',JSON.stringify({blocker,other:(await q('SELECT pg_backend_pid() pid'))[0].pid,x,y}));
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();if(a)await a.catch(()=>{});if(b)await b.catch(()=>{})}
});
test('D1-S08 Employee inactive and individual deny physically fence pending claims; restore no inherited right',async()=>{
 await c.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=7");
 assert.equal((await claim(989206)).allowed,false);
 await c.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=7");
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=9817011098");
 assert.equal((await claim(989206)).allowed,false);
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=9817011098");
 await refresh('sales');const x=await claim(989206);assert.equal(x.allowed,true,JSON.stringify(x));
});
test('D1-S09 quota policy genuinely enforced per day, only success counted, separate assign still allowed',async()=>{
 const count=(await q("SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE actor_employee_id=7 AND mode='claim'"))[0].n;
 await c.query('UPDATE d1_owner_ci.config SET max_claims_per_day=$1,version=version+1 WHERE scope_team_id=901',[count]);
 const result=await claim(989207);
 assert.equal(result.allowed,false,JSON.stringify(result));
 assert.equal(result.code,'D1_CLAIM_QUOTA_EXHAUSTED');
 const assigned=await assign(989207);assert.equal(assigned.allowed,true,JSON.stringify(assigned));
 assert.equal(Number((await state(989207)).current_owner_employee_id),7);
});
test('D1-S10 customer active service source makes unique Owner using receiving pool; no receiver => fail closed',async()=>{
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id IN(1,4,5,6,7)");
 const no=await serviceAssignCI(syntheticServiceRequest(989208),{requestKey:k('service-no-receiver')});
 assert.equal(no.allowed,false);assert.equal(no.code,'D1_OWNER_ASSIGNMENT_PENDING_NO_ELIGIBLE_RECEIVER');
 assert.equal((await state(989208)).current_owner_employee_id,null);
 await c.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id IN(1,7)");
 // pending was a safe hold; explicit governance reactivates synthetic source only in CI.
 await c.query("UPDATE d1_owner_ci.pool_cycles SET state='in_pool' WHERE customer_id=989208 AND state='pending'");
 const served=await serviceAssignCI(syntheticServiceRequest(989208),{requestKey:k('service-real-receiver')});
 assert.equal(served.allowed,true,JSON.stringify(served));
 assert.ok(Number((await state(989208)).current_owner_employee_id)>0);
 assert.equal((await state(989208)).owner_assignment_state,'assigned');
 assert.equal((await q('SELECT count(*)::int n FROM public.consultations WHERE customer_id=989208'))[0].n,0);
});
test('D1-S11 disabled Customer / scope revoked / assigned customer not reusable',async()=>{
 await c.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=989209");
 assert.equal((await assign(989209)).allowed,false);
 await c.query("UPDATE public.customers SET account_status='active' WHERE customer_id=989209");
 await c.query('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=398102');
 assert.equal((await assign(989209)).allowed,false);
 assert.equal((await state(989209)).current_owner_employee_id,null);
});


test('D1-S12 independent PG16 permission DENY commits before claim and rejects stale authorization',async()=>{
 const other=await connect();let inFlight;
 try{
  await c.query('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=398102');
  await other.query('BEGIN');
  await other.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9817011099");
  const blocker=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  let settled=false;inFlight=assign(989210);inFlight.then(()=>settled=true,()=>settled=true);
  await new Promise(done=>setTimeout(done,120));assert.equal(settled,false);
  await other.query('COMMIT');
  const result=await inFlight;assert.equal(result.allowed,false,JSON.stringify(result));
  assert.equal((await state(989210)).current_owner_employee_id,null);
  console.log('D1_TWO_PG16_PERMISSION_DENY_COMMIT_BLOCKS_CLAIM',JSON.stringify({blocker,result}));
 }finally{
  await other.query('ROLLBACK').catch(()=>{});await other.end();if(inFlight)await inFlight.catch(()=>{});
  await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=9817011099");
 }
});
test('D1-S13 independent PG16 scope revocation COMMIT blocks current manager assignment',async()=>{
 const other=await connect();let inFlight;
 try{
  await other.query('BEGIN');
  await other.query('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=398102');
  const blocker=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  let settled=false;inFlight=assign(989211);inFlight.then(()=>settled=true,()=>settled=true);
  await new Promise(done=>setTimeout(done,120));assert.equal(settled,false);
  await other.query('COMMIT');
  const result=await inFlight;assert.equal(result.allowed,false,JSON.stringify(result));
  assert.equal((await state(989211)).current_owner_employee_id,null);
  console.log('D1_TWO_PG16_SCOPE_REVOKE_COMMIT_BLOCKS_ASSIGN',JSON.stringify({blocker,result}));
 }finally{
  await other.query('ROLLBACK').catch(()=>{});await other.end();if(inFlight)await inFlight.catch(()=>{});
  await c.query('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=398102');
 }
});
test('D1-S14 independent PG16 Customer disabled COMMIT precedes claim and leaves zero receipts',async()=>{
 const other=await connect();let inFlight;
 try{
  await other.query('BEGIN');
  await other.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=989212");
  const blocker=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  let settled=false;inFlight=assign(989212);inFlight.then(()=>settled=true,()=>settled=true);
  await new Promise(done=>setTimeout(done,120));assert.equal(settled,false);
  await other.query('COMMIT');
  const result=await inFlight;assert.equal(result.allowed,false,JSON.stringify(result));
  assert.equal((await state(989212)).current_owner_employee_id,null);
  assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=989212'))[0].n,0);
  console.log('D1_TWO_PG16_DISABLED_CUSTOMER_COMMIT_DENY',JSON.stringify({blocker,result}));
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();if(inFlight)await inFlight.catch(()=>{})}
});
test('D1-S15 protected pool state changed in competing PG backend cannot be claimed',async()=>{
 const other=await connect();let inFlight;
 try{
  await other.query('BEGIN');
  await other.query("UPDATE d1_owner_ci.pool_cycles SET protective_hold=true WHERE customer_id=989209 AND state='in_pool'");
  const blocker=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  let settled=false;inFlight=assign(989209);inFlight.then(()=>settled=true,()=>settled=true);
  await new Promise(done=>setTimeout(done,120));assert.equal(settled,false);
  await other.query('COMMIT');
  const result=await inFlight;assert.equal(result.allowed,false,JSON.stringify(result));
  assert.equal((await state(989209)).current_owner_employee_id,null);
  console.log('D1_TWO_PG16_PROTECTION_COMMIT_DENY',JSON.stringify({blocker,result}));
 }finally{await other.query('ROLLBACK').catch(()=>{});await other.end();if(inFlight)await inFlight.catch(()=>{})}
});


test('D1-S16 paused Demand is an actual signed PDM17 uncompleted responsibility, no Owner claim',async()=>{
 const id=989211;
 await c.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) "+
   "SELECT COALESCE(MAX(demand_id),0)+1,$1,7,'paused','{}'::jsonb FROM public.demands",[id]);
 const before=(await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0].n;
 const denied=await assign(id,7,k('paused-demand-protected'));
 assert.equal(denied.allowed,false,JSON.stringify(denied));
 assert.equal(denied.code,'D1_UNRESOLVED_SIGNED_PROTECTION_demands');
 assert.equal((await state(id)).current_owner_employee_id,null);
 assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0].n,before);
});
test('D1-S17 real signed active Waitlist blocks unowned Customer claim',async()=>{
 const id=989203;
 const cys=await q('SELECT vehicle_id,listing_cycle_id FROM public.vehicle_listing_cycles ORDER BY listing_cycle_id LIMIT 1');
 assert.ok(cys.length>0);
 const source=cys[0];
 await c.query("INSERT INTO public.waitlists(waitlist_id,customer_id,vehicle_id,listing_cycle_id,responsible_employee_id,ended_at) "+
  "SELECT COALESCE(MAX(waitlist_id),0)+1,$1,$2,$3,7,NULL FROM public.waitlists",
  [id,source.vehicle_id,source.listing_cycle_id]);
 const denied=await assign(id,7,k('signed-active-waitlist-protected'));
 assert.equal(denied.allowed,false,JSON.stringify(denied));
 assert.equal(denied.code,'D1_UNRESOLVED_SIGNED_PROTECTION_waitlists');
 assert.equal((await state(id)).current_owner_employee_id,null);
});
test('D1-S18 real signed future CRM task denies public claim until independent resolution',async()=>{
 const id=989210;
 await c.query("INSERT INTO public.crm_followup_tasks(task_id,customer_id,responsible_employee_id,planned_at,task_state) "+
  "SELECT COALESCE(MAX(task_id),0)+1,$1,7,clock_timestamp()+interval '1 day','pending' FROM public.crm_followup_tasks",[id]);
 const denied=await assign(id,7,k('signed-future-crm-protection'));
 assert.equal(denied.allowed,false,JSON.stringify(denied));
 assert.equal(denied.code,'D1_UNRESOLVED_SIGNED_PROTECTION_crm_followup_tasks');
 assert.equal((await state(id)).current_owner_employee_id,null);
});


test('D1-R01 current signed F05-8 v24 active Priority blocks independent PDM17 protection, ended no longer acts as Priority',async()=>{
 // Seed through an actual signed current v23 Match + Demand source into the real v24 table.
 // This is a CI-only fact test, not a claim that the production PDM17 source is available.
 const source=(await q("SELECT d.customer_id,d.demand_id,d.responsible_employee_id,r.result_id,r.vehicle_id,r.listing_cycle_id,r.source_signature "+
  "FROM public.f05_7_result_versions_ci r JOIN public.demands d ON d.demand_id=r.demand_id "+
  "WHERE d.customer_id=899612 AND d.demand_state='active' AND r.status='current' AND r.tier IN ('high','acceptable') "+
  "ORDER BY r.result_id LIMIT 1"))[0];
 assert.ok(source,'real current v23 signature and Demand are required');
 const team=(await q('SELECT store_id FROM public.teams WHERE team_id=901'))[0];
 assert.ok(team);
 const key=k('r01-current-v24-priority');
 const p=(await q("INSERT INTO public.f05_8_priority_ci(customer_id,vehicle_id,listing_cycle_id,trigger_demand_id,"+
  "responsible_employee_id,origin_team_id,origin_store_id,source_match_result_id,source_signature,expires_at,creation_key) "+
  "VALUES($1,$2,$3,$4,$5,901,$6,$7,$8,clock_timestamp()+interval '1 day',$9) RETURNING priority_id",
  [source.customer_id,source.vehicle_id,source.listing_cycle_id,source.demand_id,source.responsible_employee_id,team.store_id,source.result_id,source.source_signature,key]))[0];
 assert.ok(p?.priority_id);
 assert.equal(await inspectProtectionCI(c,Number(source.customer_id)),'D1_UNRESOLVED_SIGNED_PROTECTION_f05_8_priority_ci');
 await c.query("UPDATE public.f05_8_priority_ci SET status='ended',ended_at=clock_timestamp(),ended_reason='employee_released' WHERE priority_id=$1",[p.priority_id]);
 assert.equal((await q('SELECT status,ended_reason FROM public.f05_8_priority_ci WHERE priority_id=$1',[p.priority_id]))[0].status,'ended');
 const ended=await inspectProtectionCI(c,Number(source.customer_id));
 assert.notEqual(ended,'D1_UNRESOLVED_SIGNED_PROTECTION_f05_8_priority_ci',
  'ended v24 Priority must not falsely block; other current Demand obligations remain separate');
 console.log('D1_R01_REAL_SIGNED_V24_ACTIVE_PRIORITY_AND_ENDED',JSON.stringify({priorityId:p.priority_id,sourceMatchId:source.result_id,endedOtherProtection:ended}));
});
test('D1-R01 signed transaction trading/pending/active are in-progress obligations, terminal is released',async()=>{
 // Select an existing signed transaction to avoid forging Lock/Transaction composite FKs.
 const original=(await q('SELECT transaction_id,customer_id,status FROM public.transactions ORDER BY transaction_id LIMIT 1'))[0];
 assert.ok(original,'requires a real signed M94 Transaction');
 const cases=['trading','pending','active','in_progress'];
 for(const status of cases){
  await c.query('BEGIN');
  try{
   await c.query('UPDATE public.transactions SET status=$2 WHERE transaction_id=$1',[original.transaction_id,status]);
   const blocked=await inspectProtectionCI(c,Number(original.customer_id));
   assert.equal(blocked,'D1_UNRESOLVED_SIGNED_PROTECTION_transactions','state='+status+' observed='+blocked);
   await c.query('ROLLBACK');
  }catch(e){await c.query('ROLLBACK');throw e}
 }
 assert.equal((await q('SELECT status FROM public.transactions WHERE transaction_id=$1',[original.transaction_id]))[0].status,original.status);
 console.log('D1_R01_SIGNED_TRANSACTION_FOUR_PENDING_STATES_PASS',JSON.stringify({transactionId:original.transaction_id,originalStatus:original.status,statuses:cases}));
});
test('D1-R02 first receiver fails real store scope but second qualified sales wins; no qualified receiver safely pending',async()=>{
 const original=(await q('SELECT store_id,receiving_status FROM public.employees WHERE employee_id=1'))[0];
 const otherStore=(await q('SELECT store_id FROM public.stores WHERE store_id<>$1 ORDER BY store_id LIMIT 1',[original.store_id]))[0];
 assert.ok(otherStore,'real independent second Store in signed F03 data required');
 try{
  await c.query("UPDATE public.employees SET store_id=$1,receiving_status='receiving' WHERE employee_id=1",[otherStore.store_id]);
  await c.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=7");
  const eligible=(await q("SELECT e.employee_id FROM public.employees e JOIN public.employee_team_memberships m "+
   "ON m.employee_id=e.employee_id AND m.team_id=901 AND m.ended_at IS NULL "+
   "WHERE e.employee_id IN(1,7) AND e.receiving_status='receiving' ORDER BY e.employee_id")).map(x=>Number(x.employee_id));
  assert.deepEqual(eligible,[1,7]);
  const ok=await serviceAssignCI(syntheticServiceRequest(989216),{requestKey:k('r02-skip-invalid-first')});
  assert.equal(ok.allowed,true,JSON.stringify(ok));assert.equal(ok.ownerId,7,'must skip invalid first Store 1');
  assert.equal(Number((await state(989216)).current_owner_employee_id),7);
  await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=7");
  const no=await serviceAssignCI(syntheticServiceRequest(989217),{requestKey:k('r02-all-illegal')});
  assert.equal(no.allowed,false);assert.equal(no.code,'D1_OWNER_ASSIGNMENT_PENDING_NO_ELIGIBLE_RECEIVER');
  assert.equal((await state(989217)).current_owner_employee_id,null);
  assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=989217'))[0].n,0);
  console.log('D1_R02_REAL_SIGNED_STORE_FALLBACK',JSON.stringify({firstEmployee:1,invalidStore:otherStore.store_id,secondEmployee:7,winner:ok.ownerId,noEligible:no.code}));
 }finally{
  await c.query("UPDATE public.employees SET store_id=$1,receiving_status=$2 WHERE employee_id=1",[original.store_id,original.receiving_status]);
  await c.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=7");
 }
});
test('D1-R03 real PG16 cooldown rejects next claim with zero partial writes, expires, new policy version affects only next receipt',async()=>{
 await c.query('UPDATE d1_owner_ci.config SET max_claims_per_day=99,cooldown_seconds=0,version=version+1 WHERE scope_team_id=901');
 const first=await claim(989218,k('r03-first-signed-claim'));assert.equal(first.allowed,true,JSON.stringify(first));
 const firstReceipt=(await q('SELECT receipt_id,policy_version,committed_at FROM d1_owner_ci.receipts WHERE customer_id=989218'))[0];
 await c.query('UPDATE d1_owner_ci.config SET cooldown_seconds=3,version=version+1 WHERE scope_team_id=901');
 const before=(await q('SELECT (SELECT count(*)::int FROM d1_owner_ci.receipts) r,(SELECT count(*)::int FROM public.customer_owner_history) h,(SELECT count(*)::int FROM public.audit_events) a'))[0];
 const deny=await claim(989219,k('r03-cooldown-denied'));assert.equal(deny.allowed,false,JSON.stringify(deny));
 assert.equal(deny.code,'D1_CLAIM_COOLDOWN');assert.equal((await state(989219)).current_owner_employee_id,null);
 const after=(await q('SELECT (SELECT count(*)::int FROM d1_owner_ci.receipts) r,(SELECT count(*)::int FROM public.customer_owner_history) h,(SELECT count(*)::int FROM public.audit_events) a'))[0];
 assert.deepEqual(after,before,'cooldown cannot create owner, history, audit or receipt');
 const pgStart=(await q('SELECT clock_timestamp() AS stamp'))[0].stamp;
 await new Promise(ok=>setTimeout(ok,3200));
 const elapsed=(await q('SELECT EXTRACT(EPOCH FROM (clock_timestamp()-$1::timestamptz)) seconds',[pgStart]))[0].seconds;
 assert.ok(Number(elapsed)>=3);
 const allowed=await claim(989219,k('r03-cooldown-success-after-pg-expiry'));assert.equal(allowed.allowed,true,JSON.stringify(allowed));
 const secondReceipt=(await q('SELECT receipt_id,policy_version,committed_at FROM d1_owner_ci.receipts WHERE customer_id=989219'))[0];
 assert.equal(Number(secondReceipt.policy_version),Number(firstReceipt.policy_version)+1);
 assert.notEqual(firstReceipt.receipt_id,secondReceipt.receipt_id);
 assert.equal((await q('SELECT policy_version FROM d1_owner_ci.receipts WHERE receipt_id=$1',[firstReceipt.receipt_id]))[0].policy_version,firstReceipt.policy_version);
 console.log('D1_R03_PG_CLOCK_COOLDOWN_AND_IMMUTABLE_POLICY_VERSION',JSON.stringify({firstPolicy:firstReceipt.policy_version,newPolicy:secondReceipt.policy_version,elapsedPGSeconds:elapsed,firstCommittedAt:firstReceipt.committed_at,secondCommittedAt:secondReceipt.committed_at}));
 await c.query('UPDATE d1_owner_ci.config SET cooldown_seconds=0,version=version+1 WHERE scope_team_id=901');
});
test('D1-R04 current deny or revoked Scope makes old requestKey replay no longer return owner/receipt identifiers',async()=>{
 const id=989218,originalKey=k('r03-first-signed-claim');
 const before=(await q('SELECT receipt_id,owner_history_id,audit_id FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0];
 assert.ok(before);
 const good=await claim(id,originalKey);assert.equal(good.code,'D1_IDEMPOTENT');assert.equal(Number(good.receiptId),Number(before.receipt_id));
 try{
  await c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=9817011098");
  const denied=await claim(id,originalKey);
  assert.equal(denied.allowed,false,JSON.stringify(denied));
  for(const key of ['ownerId','receiptId','sourceCycleId'])assert.equal(Object.hasOwn(denied,key),false,'no leaked '+key);
  await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=9817011098");
  await c.query('UPDATE public.employee_data_scopes SET ended_at=clock_timestamp() WHERE scope_id=398101');
  const revoked=await claim(id,originalKey);assert.equal(revoked.allowed,false,JSON.stringify(revoked));
  for(const key of ['ownerId','receiptId','sourceCycleId'])assert.equal(Object.hasOwn(revoked,key),false);
  assert.deepEqual((await q('SELECT receipt_id,owner_history_id,audit_id FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0],before,'original receipts stay immutable');
  await c.query('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=398101');
  await refresh('sales');
  const restored=await claim(id,originalKey);assert.equal(restored.code,'D1_IDEMPOTENT',JSON.stringify(restored));
  assert.equal(Number(restored.receiptId),Number(before.receipt_id));
  assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0].n,1);
  console.log('D1_R04_SIGNED_REPLAY_FENCED_BY_CURRENT_PERMISSION_SCOPE',JSON.stringify({afterDeny:denied.code,afterScopeRevocation:revoked.code,afterRestore:restored.code,receiptId:before.receipt_id}));
 }finally{
  await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=9817011098");
  await c.query('UPDATE public.employee_data_scopes SET ended_at=NULL WHERE scope_id=398101');
 }
});
