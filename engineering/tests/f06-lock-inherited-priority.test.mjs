// Non-PG synthetic query driver; acceptance still requires the isolated real PG16 suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:test@127.0.0.1:5432/f06_lock_test'};
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160015,superuser:false,createdb:false,
 sessions:true,employees:true,requests:true,locks:true,waitlists:true,
 vehicles:true,public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,signed_ledger_rows:24,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
const token='A'.repeat(43);
function driver({proven=true,owner='101'}={}){
 const sqls=[];
 const client={async query(sql,args=[]){
  sqls.push(sql);
  if(sql.includes('current_database()'))return {rows:[ready]};
  if(sql.includes('FROM f06_real_lock_test.customer_sessions s'))return {rows:[{customer_id:owner,current_owner_employee_id:4,owner_assignment_state:'assigned'}]};
  if(sql.includes('FROM public.lock_requests WHERE lock_request_id=$1 AND customer_id=$2'))
   return {rows:owner==='101'?[{lock_request_id:7,vehicle_id:201,listing_cycle_id:301,status:'approved'}]:[]};
  if(sql.includes('SELECT * FROM public.vehicles'))return {rows:[{vehicle_id:201,platform_visibility:'hidden',source_type:'mingbang',source_sale_status:'available'}]};
  if(sql.includes('FROM public.vehicle_listing_cycles'))return {rows:[{listing_cycle_id:301,ended_at:null}]};
  if(sql.includes('FROM public.customers WHERE customer_id'))return {rows:[{current_owner_employee_id:4,account_status:'active',owner_assignment_state:'assigned'}]};
  if(sql.includes('FROM public.customer_phone_facts'))return {rows:[{phone_fact_id:1}]};
  if(sql.includes('FROM public.employees e JOIN public.roles r'))return {rows:[{employee_id:4,team_id:8,store_id:1,role_code:'sales'}]};
  if(sql.includes('FROM public.f05_8_priority_ci\n'))return {rows:[]};
  if(sql.includes('FROM public.locks l JOIN f06_real_lock_test.lock_snapshots snap'))
   return {rows:proven&&owner==='101'?[{'?column?':1}]:[]};
  if(sql.includes('FROM public.vehicle_visibility_grants'))return {rows:[]};
  if(sql.includes('FROM public.locks l LEFT JOIN f06_real_lock_test.lock_snapshots'))
   return {rows:[{lock_id:5,customer_id:101,priority_origin_id:99}]};
  return {rows:[]};
 },release(){}};
 return {pool:{connect:async()=>client,query:client.query.bind(client)},sqls};
}
test('verified Priority-origin Lock owner may view formerly hidden Vehicle',async()=>{
 const f=driver();const svc=createIsolatedF06LockService({pool:f.pool,env});
 const out=await svc.project({token,requestId:'7'});
 assert.equal(out.status,200);assert.equal(out.body.ownLock,true);
 assert.ok(f.sqls.some(x=>x.includes("ev.event_key=concat('f06-1-priority-to-lock:'")));
});
test('unverified Priority-to-Lock event must not grant hidden Vehicle visibility',async()=>{
 const f=driver({proven:false});const svc=createIsolatedF06LockService({pool:f.pool,env});
 const out=await svc.project({token,requestId:'7'});
 assert.equal(out.status,404);assert.equal(out.body.code,'LOCK_REQUEST_NOT_VISIBLE');
});
test('another Customer cannot read Priority-owner LockRequest',async()=>{
 const f=driver({owner:'102'});const svc=createIsolatedF06LockService({pool:f.pool,env});
 const out=await svc.project({token,requestId:'7'});
 assert.equal(out.status,404);assert.equal(out.body.code,'LOCK_REQUEST_NOT_FOUND');
});