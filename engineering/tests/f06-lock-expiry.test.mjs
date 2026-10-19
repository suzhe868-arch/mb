// Synthetic SQL-driver contract: not a substitute for native PostgreSQL16 integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createIsolatedF06LockService} from '../src/f06-lock-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 F06_LOCK_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY',
 F06_LOCK_DATABASE_URL:'postgres://f06_lock_ci:synthetic_only@127.0.0.1:5432/f06_lock_test'};
const ready={db:'f06_lock_test',role:'f06_lock_ci',version:160015,superuser:false,createdb:false,
 sessions:true,employees:true,requests:true,locks:true,waitlists:true,
 vehicles:true,public_requests:true,public_locks:true,public_waitlists:true,signed_ledger:true,pc_accounts:true,scoped_capabilities:true,four_s_boundary:true,match_source:true,priority_source:true,priority_events:true,recommendation_source:true,phone_facts:true,price_history:true,visibility_grants:true};
const sha=s=>createHash('sha256').update(s).digest('hex');
test('same-key PENDING replay after max-6h MUST persist expired and its audit event',async()=>{
 const queries=[],customerId='101';
 const client={async query(sql,args=[]){queries.push({sql,args});
  if(sql.includes('current_database()'))return {rows:[ready]};
  if(sql.includes('FROM f06_real_lock_test.customer_sessions'))return {rows:[{customer_id:customerId,current_owner_employee_id:'4',owner_assignment_state:'assigned'}]};
  if(sql.includes('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE'))return {rows:[{vehicle_id:'201'}]};
  if(sql.includes('JOIN public.lock_requests r ON r.lock_request_id=k.request_id'))return {rows:[{
   request_id:'88',customer_id:customerId,status:'pending',payload_sha256:sha(JSON.stringify([customerId,'201','301'])),
   created_at:new Date('2026-10-19T00:00:00Z'),expires_at:new Date('2026-10-19T08:00:00Z')}]};
  if(sql.includes('FROM public.customer_phone_facts'))return {rows:[{phone_fact_id:1}]};
  if(sql.includes('FROM public.employees e JOIN public.roles r'))return {rows:[{employee_id:4,team_id:9,role_code:'sales'}]};
  if(sql.includes("interval '6 hours'")&&sql.includes('AS past'))return {rows:[{past:true}]};
  if(sql.includes('SELECT * FROM public.lock_requests WHERE lock_request_id=$1 FOR UPDATE'))return {rows:[{lock_request_id:'88',status:'pending'}]};
  if(sql.includes('UPDATE public.lock_requests SET status=$2'))return {rows:[{lock_request_id:'88'}]};
  return {rows:[]};
 },release(){}};
 const pool={connect:async()=>client,query:client.query.bind(client)};
 const svc=createIsolatedF06LockService({pool,env});
 const result=await svc.intake({token:'A'.repeat(43),vehicleId:'201',listingCycleId:'301',idempotencyKey:'X'.repeat(24)});
 assert.equal(result.status,200);assert.equal(result.body.state,'expired');
 assert.ok(queries.some(q=>q.sql.includes('UPDATE public.lock_requests SET status=$2')&&q.args[1]==='expired'));
 assert.ok(queries.some(q=>q.sql.includes('INSERT INTO f06_real_lock_test.events')));
 assert.ok(!queries.some(q=>q.sql.includes('INSERT INTO public.lock_requests')));
});
test('new LockRequest uses a single PostgreSQL creation timestamp and all expiry paths cap 6h',async()=>{
 const source=await readFile(new URL('../src/f06-lock-service.mjs',import.meta.url),'utf8');
 assert.match(source,/\$5::timestamptz\+interval '6 hours'/);
 assert.match(source,/const createdAt=\(await first\(db,'SELECT clock_timestamp\(\) AS now'\)\)\.now/);
 assert.ok((source.match(/OR \$2::timestamptz\+interval '6 hours'<=clock_timestamp\(\)/g)||[]).length>=4);
});