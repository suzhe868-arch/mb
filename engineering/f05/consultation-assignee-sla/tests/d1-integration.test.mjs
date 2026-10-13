// PR49 final integration: genuine accepted D1 owner service ran at v25, and these
// tests exercise the *unchanged* F05-10 consultation service after v26 in SAME PG16.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {connect,verify} from '../migration.mjs';
import {createConsultationCI,safeCustomerProjectionCI} from '../service.mjs';
const c=await connect();
const q=(sql,args=[])=>c.query(sql,args).then(x=>x.rows);
const proof='CI_SYNTHETIC_PHONE_CONSENT_NOT_PRODUCTION';
const key=x=>'f05-10-d1-cross-domain-real-'+x+'-20261013';
let v;
const consult=(c,customerId,suffix='search',extra={})=>createConsultationCI(c,{
 customerId,vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),
 intent:'consult',directSource:suffix,syntheticPhoneConsent:proof,eventKey:key(customerId+'-'+suffix+'-'+Math.random()),...extra});
const domains=['recommendations','f05_9_recommendation_facts_ci','vehicle_visibility_grants','f05_9_price_right_ci',
 'f05_8_priority_ci','locks','transactions','demands','customers','customer_owner_history','audit_events','d1_owner_ci.receipts'];
async function snapshot(){
 const out={};
 for(const t of domains){
  const table=t.startsWith('d1_owner_ci.')?t:'public.'+t;
  out[t]=(await q("SELECT count(*)::int n,md5(COALESCE(string_agg(to_jsonb(x)::text,'|' ORDER BY to_jsonb(x)::text),'')) digest FROM "+table+" x"))[0];
 }
 return out;
}
test.before(async()=>{
 assert.equal((await verify(c)).verified,true);
 assert.equal((await q('SELECT count(*)::int n FROM public.f03_schema_migrations'))[0].n,24);
 // Scope comes from formally accepted D1 fixtures; grant only the existing
 // synthetic Consultation capability on the existing signed Employee7 object.
 const scope=(await q("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=7 AND scope_kind='team' "+
  "AND scope_reference_id=901 AND ended_at IS NULL ORDER BY scope_id LIMIT 1"))[0];
 assert.ok(scope,'D1 real signed current Employee7 Team scope required');
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) "+
  "VALUES(7,9105,'allow',clock_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=clock_timestamp()");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) "+
  "SELECT 7,9105,$1,clock_timestamp()-interval '1 minute' WHERE NOT EXISTS "+
  "(SELECT 1 FROM public.employee_capability_scope_bindings WHERE employee_id=7 AND permission_id=9105 AND scope_id=$1 AND ended_at IS NULL)",[scope.scope_id]);
 await c.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id IN (1,7)");
 const rows=await q("SELECT v.vehicle_id,lc.listing_cycle_id FROM public.vehicles v "+
  "JOIN public.vehicle_listing_cycles lc ON lc.vehicle_id=v.vehicle_id AND lc.ended_at IS NULL "+
  "WHERE v.archived_at IS NULL AND v.platform_visibility='visible' AND "+
  "((v.source_type='wholesale' AND v.source_sale_status='active') OR "+
  "(v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) AND "+
  "NOT EXISTS(SELECT 1 FROM public.f05_8_priority_ci p WHERE p.vehicle_id=v.vehicle_id "+
  "AND p.listing_cycle_id=lc.listing_cycle_id AND p.status='active' "+
  "AND p.expires_at>statement_timestamp() AND p.customer_id NOT BETWEEN 989201 AND 989209) "+
  "ORDER BY v.vehicle_id LIMIT 1");
 assert.ok(rows.length,'genuine signed available M94 Vehicle required');
 v=rows[0];
 console.log('F05_10_PR49_SAME_PG_V26_D1_SIGNED_OWNERS',JSON.stringify({vehicleId:v.vehicle_id,cycleId:v.listing_cycle_id,
  pid:(await q('SELECT pg_backend_pid() pid'))[0].pid}));
});
test.after(async()=>{await c.end()});
test('10-D1-01 pending public pool, protected/disabled, SystemAdmin/4S D1 denial remain fail closed after v26',async()=>{
 for(const customerId of [989204,989207,989208,989209]){
  const before=(await q('SELECT current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=$1',[customerId]))[0];
  assert.equal(before.current_owner_employee_id,null);
  const rec=(await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[customerId]))[0].n;
  assert.equal(rec,0);
  const result=await consult(c,customerId,'ordinary_share');
  assert.equal(result.allowed,false,JSON.stringify({customerId,result}));
  assert.equal((await q('SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1',[customerId]))[0].n,0);
 }
 assert.equal((await q('SELECT state FROM d1_owner_ci.pool_cycles WHERE customer_id=989204'))[0].state,'pending');
 assert.equal((await q("SELECT count(*)::int n FROM public.consultations WHERE customer_id BETWEEN 989201 AND 989209"))[0].n,0);
 console.log('F05_10_REAL_D1_PENDING_AND_UNAUTHORIZED_NO_CONSULTATION');
});
test('10-D1-02 real Sales D1 claim receipt and unique current Owner drive Consultation create/reuse without changing other domains',async()=>{
 const id=989201;
 const receipt=(await q("SELECT * FROM d1_owner_ci.receipts WHERE customer_id=$1",[id]))[0];
 assert.ok(receipt);assert.equal(receipt.mode,'claim');assert.equal(Number(receipt.new_owner_id),7);
 const owner=(await q('SELECT current_owner_employee_id,owner_assignment_state FROM public.customers WHERE customer_id=$1',[id]))[0];
 assert.equal(owner.owner_assignment_state,'assigned');assert.equal(Number(owner.current_owner_employee_id),7);
 const hist=(await q('SELECT * FROM public.customer_owner_history WHERE owner_history_id=$1',[receipt.owner_history_id]))[0];
 assert.equal(Number(hist.to_employee_id),7);assert.equal(hist.from_employee_id,null);
 assert.ok((await q('SELECT audit_id FROM public.audit_events WHERE audit_id=$1',[receipt.audit_id])).length);
 const before=await snapshot();
 const a=await consult(c,id);assert.equal(a.allowed,true,JSON.stringify(a));assert.equal(a.created,true);
 assert.equal(a.assignee,7,'current signed D1 owner must be actual PDM15 assignee');
 assert.equal((await q('SELECT status FROM public.consultations WHERE consultation_id=$1',[a.consultationId]))[0].status,'pending');
 assert.deepEqual(await snapshot(),before,'Consultation create must not rewrite D1 Owner/receipt or other domains');
 const repeat=await consult(c,id,'favorite');assert.equal(repeat.allowed,true);assert.equal(repeat.created,false);
 assert.equal(repeat.consultationId,a.consultationId);assert.deepEqual(await snapshot(),before);
 const safe=await safeCustomerProjectionCI(c,{consultationId:a.consultationId,customerId:id,syntheticPhoneConsent:proof});
 assert.equal(safe.allowed,true);
 console.log('F05_10_REAL_D1_CLAIM_TO_PDM15_CONSULTATION',JSON.stringify({id,receipt:receipt.receipt_id,owner:owner.current_owner_employee_id,
  history:receipt.owner_history_id,audit:receipt.audit_id,consultation:a.consultationId,assignee:a.assignee}));
});
test('10-D1-03 legally scoped Manager D1 assignment creates Owner first then PDM15 real Consultation',async()=>{
 const id=989202,receipt=(await q('SELECT * FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0];
 assert.equal(receipt.mode,'assign');assert.equal(Number(receipt.actor_employee_id),1);
 assert.equal(Number(receipt.new_owner_id),7);
 const before=await snapshot();const a=await consult(c,id,'search');
 assert.equal(a.allowed,true,JSON.stringify(a));assert.equal(a.assignee,7);
 assert.deepEqual(await snapshot(),before);
 assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0].n,1);
 console.log('F05_10_REAL_D1_MANAGER_ASSIGN_TO_PDM15_CONSULTATION',JSON.stringify({id,receipt:receipt.receipt_id,consultation:a.consultationId}));
});
test('10-D1-04 synthetic customer service D1 receiver -> unique Owner -> true Consultation',async()=>{
 const id=989203,receipt=(await q('SELECT * FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0];
 assert.equal(receipt.mode,'service');assert.equal(Number(receipt.new_owner_id),1);
 const before=await snapshot();
 const a=await consult(c,id,'search');assert.equal(a.allowed,true,JSON.stringify(a));
 assert.equal(Number(a.assignee),1);assert.deepEqual(await snapshot(),before);
 const newReceipt=(await q('SELECT receipt_id,owner_history_id,audit_id FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0];
 assert.deepEqual(newReceipt,{receipt_id:receipt.receipt_id,owner_history_id:receipt.owner_history_id,audit_id:receipt.audit_id});
 console.log('F05_10_REAL_D1_ACTIVE_SERVICE_OWNER_TO_CONSULTATION',JSON.stringify({id,receipt:receipt.receipt_id,consultation:a.consultationId}));
});
test('10-D1-05 two independent PG16 backends after D1 claim/manager race: one live Consultation, no duplicate Owner',async()=>{
 const id=989205,owner=(await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[id]))[0];
 assert.equal(Number(owner.current_owner_employee_id),7);
 assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0].n,1);
 const p=await connect(),z=await connect();
 try{
  const aPid=Number((await p.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  const bPid=Number((await z.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  assert.notEqual(aPid,bPid);
  const results=await Promise.all([consult(p,id,'search'),consult(z,id,'favorite')]);
  assert.equal(results.filter(x=>x.allowed&&x.created).length,1,JSON.stringify(results));
  assert.equal((await q("SELECT count(*)::int n FROM public.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND status IN('pending','processing')",[id,v.vehicle_id,v.listing_cycle_id]))[0].n,1);
  assert.equal((await q('SELECT count(*)::int n FROM d1_owner_ci.receipts WHERE customer_id=$1',[id]))[0].n,1);
  assert.equal(Number((await q('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=$1',[id]))[0].current_owner_employee_id),7);
  console.log('F05_10_D1_TWO_PG_SAME_CUSTOMER_OWNER_AND_CONSULTATION',JSON.stringify({id,pidA:aPid,pidB:bPid,results}));
 }finally{await p.end();await z.end()}
});
