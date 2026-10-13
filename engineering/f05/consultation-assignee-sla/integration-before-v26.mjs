// Accepted D1 Owner service exercised against the same physical v25 PostgreSQL16
// database that F05-10 upgrades to v26 immediately afterward. CI-only, no issuer.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../pdm17-public-pool-owner-claim/migration.mjs';
import {claimCI,assignCI,serviceAssignCI,syntheticServiceRequest} from '../pdm17-public-pool-owner-claim/service.mjs';
const c=await connect();
const auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret:randomBytes(32),origin:'https://127.0.0.1:48993'});
const key=x=>'f05-10-final-real-d1-'+x+'-20261013';
const q=(sql,a=[])=>c.query(sql,a).then(x=>x.rows);
const login=async(user,password)=>{
 const x=await auth.login({login:user,password,source:'f05-10-d1-real-owner-before-v26'});
 assert.equal(x.code,'AUTH_OK',JSON.stringify(x));return x.token;
};
try{
 assert.equal((await verify(c)).verified,true);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,23);
 const sales=await login('limit_test','SyntheticLimit_1234567');
 const manager=await login('employee_test','SyntheticF04_3_CurrentProof_2026');
 const admin=await login('admin_test','SyntheticAdmin_1234567');
 const four=await login('four_s_test','SyntheticFourS_123456');
 const before=(await q("SELECT current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=989201"))[0];
 assert.equal(before.current_owner_employee_id,null);
 const badAdmin=await assignCI(auth,admin,{customerId:989207,targetEmployeeId:7,requestKey:key('admin-denied')});
 const badFour=await claimCI(auth,four,{customerId:989207,requestKey:key('four-denied')});
 assert.equal(badAdmin.allowed,false);assert.equal(badFour.allowed,false);
 await c.query("UPDATE d1_owner_ci.pool_cycles SET protective_hold=true WHERE customer_id=989208");
 const blocked=await assignCI(auth,manager,{customerId:989208,targetEmployeeId:7,requestKey:key('protected-denied')});
 assert.equal(blocked.allowed,false);assert.equal(blocked.code,'D1_PROTECTED_SOURCE');
 await c.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=989209");
 const disabled=await claimCI(auth,sales,{customerId:989209,requestKey:key('disabled-denied')});
 assert.equal(disabled.allowed,false);
 const sale=await claimCI(auth,sales,{customerId:989201,requestKey:key('signed-sales-claim')});
 assert.equal(sale.allowed,true,JSON.stringify(sale));assert.equal(sale.created,true);
 const repeat=await claimCI(auth,sales,{customerId:989201,requestKey:key('signed-sales-claim')});
 assert.equal(repeat.code,'D1_IDEMPOTENT');assert.equal(repeat.created,false);
 const managerResult=await assignCI(auth,manager,{customerId:989202,targetEmployeeId:7,requestKey:key('manager-target-seven')});
 assert.equal(managerResult.allowed,true,JSON.stringify(managerResult));
 const assigned=await serviceAssignCI(syntheticServiceRequest(989203),{requestKey:key('valid-service-receiver')});
 assert.equal(assigned.allowed,true,JSON.stringify(assigned));
 // Save every inherited signed receiving state. A negative D1 scenario must
 // not silently poison previously accepted F05-10 v26 regression fixtures.
 const savedReceiving=await q("SELECT employee_id,receiving_status FROM public.employees WHERE employee_id IN(1,4,5,6,7)");
 assert.equal(savedReceiving.length,5);
 await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id IN(1,4,5,6,7)");
 const pending=await serviceAssignCI(syntheticServiceRequest(989204),{requestKey:key('all-receivers-paused')});
 assert.equal(pending.allowed,false);assert.equal(pending.code,'D1_OWNER_ASSIGNMENT_PENDING_NO_ELIGIBLE_RECEIVER');
 assert.equal((await q('SELECT state FROM d1_owner_ci.pool_cycles WHERE customer_id=989204'))[0].state,'pending');
 for(const e of savedReceiving)await c.query("UPDATE public.employees SET receiving_status=$2 WHERE employee_id=$1",[e.employee_id,e.receiving_status]);
 assert.equal((await q("SELECT receiving_status FROM public.employees WHERE employee_id=4"))[0].receiving_status,
  savedReceiving.find(z=>Number(z.employee_id)===4).receiving_status,'old signed Employee4 receiving facts restored');

 // The lock is held by a real second PG16 connection, not an artificial JS-only mock.
 const other=await connect();let one,two;
 try{
  const apid=Number((await q('SELECT pg_backend_pid() pid'))[0].pid);
  const bpid=Number((await other.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  assert.notEqual(apid,bpid);
  await other.query('BEGIN');
  await other.query('SELECT customer_id FROM public.customers WHERE customer_id=989205 FOR UPDATE');
  one=claimCI(auth,sales,{customerId:989205,requestKey:key('race-sales-claim')});
  await new Promise(done=>setTimeout(done,95));
  two=assignCI(auth,manager,{customerId:989205,targetEmployeeId:7,requestKey:key('race-manager-assign')});
  await new Promise(done=>setTimeout(done,95));
  await other.query('COMMIT');
  const results=await Promise.all([one,two]);
  assert.equal(results.filter(x=>x.allowed&&x.created).length,1,JSON.stringify(results));
  assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=989205'))[0].n,1);
  console.log('F05_10_REAL_TWO_PHYSICAL_PG_D1_CAS',JSON.stringify({aPid:apid,bPid:bpid,results}));
 }finally{
  await other.query('ROLLBACK').catch(()=>{});await other.end();
  if(one)await one.catch(()=>{});if(two)await two.catch(()=>{});
 }
 const identity=(await q("SELECT c.customer_id,c.current_owner_employee_id,c.owner_assignment_state,p.state pool_state,r.mode,r.receipt_id,r.owner_history_id,r.audit_id,r.policy_version "+
  "FROM public.customers c JOIN d1_owner_ci.pool_cycles p ON p.customer_id=c.customer_id "+
  "LEFT JOIN d1_owner_ci.receipts r ON r.customer_id=c.customer_id "+
  "WHERE c.customer_id BETWEEN 989201 AND 989209 ORDER BY c.customer_id")).map(x=>({
   customer:Number(x.customer_id),owner:x.current_owner_employee_id===null?null:Number(x.current_owner_employee_id),
   ownerState:x.owner_assignment_state,poolState:x.pool_state,receipt:x.receipt_id===null?null:Number(x.receipt_id),
   mode:x.mode,history:x.owner_history_id===null?null:Number(x.owner_history_id),audit:x.audit_id===null?null:Number(x.audit_id),
   version:x.policy_version===null?null:Number(x.policy_version)}));
 for(const id of [989201,989202,989203,989205]){
  const row=identity.find(x=>x.customer===id);assert.equal(row.ownerState,'assigned');assert.ok(row.receipt>0);
 }
 for(const id of [989204,989207,989208,989209]){
  const row=identity.find(x=>x.customer===id);assert.equal(row.owner,null);assert.equal(row.receipt,null);
 }
 assert.equal((await q('SELECT count(*)::int n FROM public.consultations WHERE customer_id BETWEEN 989201 AND 989209'))[0].n,0);
 console.log('F05_10_REAL_D1_SAME_DATABASE_V25_OWNER_RECEIPTS',JSON.stringify(identity));
 console.log('F05_10_BEFORE_V26_SIGNED_D1_PASS',JSON.stringify({before,claim:sale.code,assign:managerResult.code,service:assigned.code,pending:pending.code,
   adminDenied:badAdmin.code,fourDenied:badFour.code,protectedDenied:blocked.code,disabledDenied:disabled.code,v25SourceSeal:(await verify(c)).sourceSHA}));
}finally{await auth.close();await c.end()}
