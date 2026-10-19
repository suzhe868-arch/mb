// Synthetic SQL-driver tests only; native PG16 acceptance stays mandatory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test'};
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160015,superuser:false,createdb:false,
 sessions:true,employees:true,requests:true,locks:true,waitlists:true,vehicles:true,
 public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,signed_ledger_rows:24,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
function driver({phone=true,saleable=true}={}){
 const calls=[];
 const req={lock_request_id:'71',vehicle_id:'201',listing_cycle_id:'301',customer_id:'101',status:'pending',
  created_at:new Date('2026-10-19T10:00:00Z'),expires_at:new Date('2026-10-19T16:00:00Z')};
 const vehicle={vehicle_id:'201',source_type:'mingbang',
  source_sale_status:saleable?'available':'sold',platform_visibility:'hidden',archived_at:null};
 const db={async query(sql,args=[]){calls.push({sql,args});
  if(sql.includes('current_database()'))return {rows:[ready]};
  if(sql.includes('FROM f06_real_lock_test.employee_sessions'))return {rows:[{employee_id:'1',role_code:'sales'}]};
  if(sql.includes('SELECT vehicle_id FROM public.lock_requests'))return {rows:[{vehicle_id:'201'}]};
  if(sql.includes('SELECT * FROM public.vehicles'))return {rows:[vehicle]};
  if(sql.includes('SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR UPDATE'))return {rows:[req]};
  if(sql.includes('FROM f06_real_lock_test.request_keys'))return {rows:[{request_id:'71'}]};
  if(sql.includes('FROM public.customers')&&sql.includes('account_status'))return {rows:[{account_status:'active',current_owner_employee_id:'4',owner_assignment_state:'assigned'}]};
  if(sql.includes('FROM public.employees e JOIN public.roles r'))return {rows:[{employee_id:'4',team_id:'8',store_id:'1',role_code:'sales'}]};
  if(sql.includes('FROM public.employees e\n    JOIN public.roles r'))return {rows:[{employee_id:'1'}]};
  if(sql.includes('FROM f06_real_lock_test.decision_keys'))return {rows:[]};
  if(sql.includes("interval '6 hours'")&&sql.includes(' AS past'))return {rows:[{past:false}]};
  if(sql.includes('FROM public.locks WHERE vehicle_id=$1'))return {rows:[{lock_id:'91'}]};
  if(sql.includes('FROM public.vehicle_listing_cycles'))return {rows:[{listing_cycle_id:'301',ended_at:null}]};
  if(sql.includes('FROM public.customer_phone_facts'))return {rows:phone?[{phone_fact_id:'66'}]:[]};
  if(sql.includes('SELECT customer_id FROM public.locks WHERE lock_id=$1'))return {rows:[{customer_id:'999'}]};
  if(sql.includes('FROM public.waitlists'))return {rows:[{waitlist_id:'88',listing_cycle_id:'301'}]};
  if(sql.includes('UPDATE public.lock_requests SET status=$2'))return {rows:[{lock_request_id:'71'}]};
  return {rows:[]};
 },release(){}};
 return {calls,pool:{connect:async()=>db,query:db.query.bind(db)}};
}
const decision=async fixture=>createIsolatedF06LockService({pool:fixture.pool,env})
 .decide({token:'A'.repeat(43),requestId:'71',decision:'approve',idempotencyKey:'K'.repeat(32)});
test('existing competing PENDING becomes internal Waitlist even if winner has hidden Priority-origin Lock',async()=>{
 const fixture=driver(),r=await decision(fixture);
 assert.equal(r.status,200);assert.equal(r.body.state,'lock_conflict');assert.equal(r.body.waitlistId,'88');
 assert.ok(fixture.calls.some(c=>c.sql.includes('UPDATE public.lock_requests SET status=$2')&&c.args[1]==='lock_conflict'));
 assert.ok(!fixture.calls.some(c=>c.sql.includes('FROM public.vehicle_visibility_grants')));
 assert.ok(!fixture.calls.some(c=>c.sql.includes('FROM public.f05_8_priority_ci\n')));
});
test('internal Waitlist still requires currently valid Customer phone',async()=>{
 const fixture=driver({phone:false}),r=await decision(fixture);
 assert.equal(r.status,200);assert.equal(r.body.state,'closed_not_lockable');
 assert.ok(!fixture.calls.some(c=>c.sql.includes('INSERT INTO public.waitlists')));
});
test('internal Waitlist still refuses non-saleable Vehicle',async()=>{
 const fixture=driver({saleable:false}),r=await decision(fixture);
 assert.equal(r.status,200);assert.equal(r.body.state,'closed_not_lockable');
 assert.ok(!fixture.calls.some(c=>c.sql.includes('INSERT INTO public.waitlists')));
});