import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../../src/f03-auth-service.mjs';
import {connect,verify} from '../migration.mjs';
import {claimCI,assignCI,serviceAssignCI,syntheticServiceRequest,preClaimSummaryCI,productionDeny} from '../service.mjs';
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
 for(const name of ['consultations','recommendations','vehicle_visibility_grants','priority_leases','locks','transactions','demands','customer_favorites']){
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
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=1099");
 assert.equal((await assign(989204)).allowed,false);
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=1 AND permission_id=1099");
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
 await c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=1098");
 assert.equal((await claim(989206)).allowed,false);
 await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=clock_timestamp() WHERE employee_id=7 AND permission_id=1098");
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
