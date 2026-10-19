// Synthetic SQL-driver checks: not a PostgreSQL16 acceptance claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic@127.0.0.1:5432/f06_lock_test'};
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160014,superuser:false,createdb:false,
 sessions:true,employees:true,requests:true,locks:true,waitlists:true,vehicles:true,
 public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
function fake({hidden=false,trusted=false}={}){
 const calls=[],client={async query(sql,args=[]){calls.push(sql);
  if(sql.includes('current_database()'))return {rows:[ready]};
  if(sql.includes('FROM f06_real_lock_test.customer_sessions s'))return {rows:[{customer_id:'11',owner_assignment_state:'assigned',current_owner_employee_id:'4'}]};
  if(sql.includes('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE'))return {rows:[{vehicle_id:'21',source_type:'mingbang',source_sale_status:'available',platform_visibility:'visible'}]};
  if(sql.includes('JOIN f06_real_lock_test.lock_snapshots s ON s.lock_id=l.lock_id'))return {rows:hidden?[{present:1}]:[]};
  if(sql.includes('FROM public.vehicle_listing_cycles'))return {rows:[{listing_cycle_id:'31',ended_at:null}]};
  if(sql.includes('FROM public.customers WHERE customer_id=$1 FOR SHARE'))return {rows:[{account_status:'active',owner_assignment_state:'assigned',current_owner_employee_id:'4'}]};
  if(sql.includes('FROM public.customer_phone_facts'))return {rows:[{phone_fact_id:1}]};
  if(sql.includes('FROM public.employees e JOIN public.roles r'))return {rows:[{employee_id:'4',team_id:'8',store_id:'1',role_code:'sales'}]};
  if(sql.includes('FROM public.f05_8_priority_ci'))return {rows:[]};
  if(sql.includes('FROM public.lock_requests r')&&sql.includes('trusted_request_id'))return {rows:[{lock_request_id:'99',status:'pending',trusted_request_id:trusted?'99':null,
   created_at:new Date(),expires_at:new Date(Date.now()+3600000)}]};
  if(sql.includes("interval '6 hours'")&&sql.includes('AS past'))return {rows:[{past:false}]};
  return {rows:[]};
 },release(){}};
 return {calls,svc:createIsolatedF06LockService({pool:{connect:async()=>client,query:client.query.bind(client)},env})};
}
const request={token:'a'.repeat(43),vehicleId:'21',listingCycleId:'31',idempotencyKey:'b'.repeat(32)};
test('Priority-origin Lock denies old exact-key inquiry before any idempotency lookup',async()=>{
 const f=fake({hidden:true}),r=await f.svc.intake(request);
 assert.deepEqual([r.status,r.body.code],[404,'LOCK_REQUEST_NOT_VISIBLE']);
 assert.equal(f.calls.some(s=>s.includes('k.key_sha256=$1')),false);
});
test('untrusted public M94 PENDING request cannot be reused, expired or overwritten',async()=>{
 const f=fake({trusted:false}),r=await f.svc.intake(request);
 assert.deepEqual([r.status,r.body.code],[403,'UNTRUSTED_PENDING_REQUEST_ISSUER']);
 assert.ok(f.calls.some(s=>s.includes('FOR UPDATE OF r')));
 assert.equal(f.calls.some(s=>s.includes('UPDATE public.lock_requests')),false);
 assert.equal(f.calls.some(s=>s.includes('INSERT INTO public.lock_requests')),false);
});
test('trusted disposable PENDING can be reused without generating another LockRequest',async()=>{
 const f=fake({trusted:true}),r=await f.svc.intake(request);
 assert.deepEqual([r.status,r.body.code,r.body.requestId],[200,'CURRENT_PENDING_REUSED','99']);
 assert.equal(f.calls.some(s=>s.includes('INSERT INTO public.lock_requests')),false);
});
