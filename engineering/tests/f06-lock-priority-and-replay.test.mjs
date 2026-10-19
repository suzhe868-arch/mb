// Contract-only synthetic driver checks: these do NOT establish PG16 integration success.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test'};
const hash=s=>createHash('sha256').update(s).digest('hex');
const token='a'.repeat(43),key='z'.repeat(32);
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160014,superuser:false,createdb:false,
 sessions:true,employees:true,requests:true,locks:true,waitlists:true,vehicles:true,public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,signed_ledger_rows:24,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
function driver(handler){
 const sqls=[];const c={async query(sql,args=[]){sqls.push(sql);
  if(sql.includes('current_database()'))return {rows:[ready]};
  return {rows:await handler(sql,args)};
 },release(){sqls.push('RELEASE')}};
 return {sqls,connect:async()=>c,query:c.query.bind(c)};
}
test('other Customer cannot learn Priority-origin occupied Vehicle through LockRequest intake',async()=>{
 const pool=driver(async s=>{
  if(s.includes('FROM f06_real_lock_test.customer_sessions s'))return [{customer_id:'101',owner_assignment_state:'assigned',current_owner_employee_id:'4'}];
  if(s.includes('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE'))return [{vehicle_id:'201',source_type:'mingbang',source_sale_status:'available',platform_visibility:'visible'}];
  if(s.includes('JOIN f06_real_lock_test.lock_snapshots s ON s.lock_id=l.lock_id'))return [{exists:1}];
  return [];
 });
 const svc=createIsolatedF06LockService({pool,env});
 const r=await svc.intake({token,vehicleId:'201',listingCycleId:'301',idempotencyKey:key});
 assert.deepEqual([r.status,r.body.code],[404,'LOCK_REQUEST_NOT_VISIBLE']);
 assert.ok(!pool.sqls.some(s=>s.includes('INSERT INTO public.lock_requests')));
});
test('an exact Employee decision replay retains the original public JSON response',async()=>{
 const original={code:'LOCK_APPROVED',requestId:'71',state:'approved',lockId:'91',productionReady:false};
 const payload=hash(JSON.stringify(['1','71','approve']));
 const pool=driver(async s=>{
  if(s.includes('FROM f06_real_lock_test.employee_sessions s'))return [{employee_id:'1',role_code:'sales'}];
  if(s.includes('SELECT vehicle_id FROM public.lock_requests'))return [{vehicle_id:'201'}];
  if(s.includes('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE'))return [{vehicle_id:'201'}];
  if(s.includes('SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR UPDATE'))return [{lock_request_id:'71',vehicle_id:'201',customer_id:'101',status:'approved'}];
  if(s.includes('FROM f06_real_lock_test.request_keys'))return [{request_id:'71'}];
  if(s.includes('SELECT current_owner_employee_id,owner_assignment_state FROM public.customers'))return [{current_owner_employee_id:'4',owner_assignment_state:'assigned'}];
  if(s.includes('FROM public.employees e JOIN public.roles r'))return [{employee_id:'4',team_id:'8',store_id:'9',role_code:'sales'}];
  if(s.includes('FROM public.employees e\n    JOIN public.roles r'))return [{employee_id:'1'}];
  if(s.includes('FROM f06_real_lock_test.decision_keys'))return [{payload_sha256:payload,result_json:original}];
  return [];
 });
 const svc=createIsolatedF06LockService({pool,env});
 const r=await svc.decide({token,requestId:'71',decision:'approve',idempotencyKey:key});
 assert.equal(r.status,200);
 assert.deepEqual(r.body,original);
 assert.ok(!pool.sqls.some(s=>s.includes('INSERT INTO public.locks')));
});
test('Waitlist source keeps original LockRequest createdAt and stable requestId ordering',async()=>{
 const sql=await readFile(new URL('../sql/f06-lock-disposable-only.sql',import.meta.url),'utf8');
 assert.match(sql,/queue_created_at TIMESTAMPTZ NOT NULL/);
 assert.match(sql,/queue_request_id BIGINT NOT NULL REFERENCES public\.lock_requests/);
});