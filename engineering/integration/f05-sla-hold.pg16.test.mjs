// F05 PDM15 true PG16 disable-triggered hold, verified remaining SLA, explicit Employee resume.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedSlaHoldService} from '../src/f05-sla-hold-service.mjs';
import {createIsolatedSlaHoldHandler} from '../src/f05-sla-hold-http.mjs';
import {createIsolatedEmployeeStartService} from '../src/f05-employee-start-service.mjs';
import {createIsolatedEmployeeStartHandler} from '../src/f05-employee-start-http.mjs';
import {createIsolatedConsultationService} from '../src/f05-consultation-service.mjs';
import {createIsolatedConsultationHandler} from '../src/f05-consultation-http.mjs';
const cfg=validateCatalogEnv();
const pool=new pg.Pool({connectionString:cfg.connectionString,max:4,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1200});
const digest=x=>createHash('sha256').update(x).digest('hex');
const token=()=>randomBytes(32).toString('base64url'),key=()=>randomBytes(32).toString('base64url');
const bearer=token(),otherBearer=token(),customerBearer=token();
let srv,connected=false,failure;
try{
 await db.connect();connected=true;
 assert.equal(await probeIsolatedCatalog(pool),true,'all frozen and disposable shape constraints must pass');
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(59200,59001,'active','receiving'),(59201,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES "+
   "(59200,'active',59001,59200,'assigned'),(59201,'active',59001,59200,'assigned')");
  await db.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) VALUES "+
   "(59200,59200,59001,59001,59200,'pending','{\"kind\":\"other\",\"entry\":\"vehicle_detail\"}'::jsonb,statement_timestamp()+interval '15 minutes'),"+
   "(59201,59200,59002,59002,59200,'processing','{\"kind\":\"other\",\"entry\":\"vehicle_detail\"}'::jsonb,statement_timestamp()+interval '15 minutes'),"+
   "(59202,59201,59001,59001,59200,'pending','{\"kind\":\"other\",\"entry\":\"vehicle_detail\"}'::jsonb,statement_timestamp()+interval '15 minutes')");
  await db.query("INSERT INTO public.f05_catalog_consultation_sla_test(consultation_id,effective_deadline,first_human_response_at) VALUES "+
   "(59200,statement_timestamp()+interval '15 minutes',NULL),"+
   "(59201,statement_timestamp()+interval '15 minutes',statement_timestamp())");
  await db.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) VALUES($1,59200,statement_timestamp()+interval '20 minutes')",[digest(customerBearer)]);
  for(const [credential,id] of [[bearer,'59200'],[otherBearer,'59201']])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[digest(credential),id]);
  await db.query("INSERT INTO public.f05_catalog_employee_consultation_scope_test(employee_id,customer_id,can_start_processing,can_resume_hold,expires_at) VALUES "+
   "(59200,59200,true,false,statement_timestamp()+interval '20 minutes'),"+
   "(59200,59201,true,false,statement_timestamp()+interval '20 minutes'),"+
   "(59201,59200,true,true,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedSlaHoldService({pool,env:process.env});
 const start=createIsolatedEmployeeStartService({pool,env:process.env});
 const consultation=createIsolatedConsultationService({pool,env:process.env});
 srv=createServer(createFoundationHandler({slaHoldHandler:createIsolatedSlaHoldHandler(service,process.env),employeeStartHandler:createIsolatedEmployeeStartHandler(start,process.env),consultationHandler:createIsolatedConsultationHandler(consultation,process.env)}));
 await new Promise((ok,bad)=>{srv.once('error',bad);srv.listen(0,'127.0.0.1',ok)});
 const post=async(id='59200',credential=bearer,eventKey=key(),action='resume-from-hold')=>{
  const r=await fetch('http://127.0.0.1:'+srv.address().port+'/api/v1/catalog/consultations/'+id+'/'+action,
  {method:'POST',headers:{authorization:'Bearer '+credential,'x-idempotency-key':eventKey}});
  return {status:r.status,body:await r.json()};
 };
 const customerCall=async(path)=>{
  const r=await fetch('http://127.0.0.1:'+srv.address().port+path,{
   method:'POST',headers:{authorization:'Bearer '+customerBearer,'x-idempotency-key':key()}});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 cannot resume absent Customer-disabled hold or use forged Employee',async()=>{
  assert.equal((await post()).status,403,'explicit scope is absent');
  await db.query('UPDATE public.f05_catalog_employee_consultation_scope_test SET can_resume_hold=true WHERE employee_id=59200 AND customer_id=59200');
  assert.equal((await post()).status,409,'Customer has never been disabled');
  assert.equal((await post('59200',token())).status,401);
  assert.equal((await post('59200',otherBearer)).status,403);
 });
 await test('actual Customer disable event atomically creates independent Guard for both open Consultations',async()=>{
  const original=(await db.query('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=59200')).rows[0].first_response_deadline;
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59200");
  const a=(await db.query('SELECT * FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59200')).rows[0];
  const b=(await db.query('SELECT * FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59201')).rows[0];
  assert.equal(a.active,true);assert.equal(b.active,true);
  assert.equal(String(a.version),'1');assert.equal(String(b.version),'1');
  assert.ok(Number(a.remaining_ms)>13*60*1000&&Number(a.remaining_ms)<=15*60*1000);
  assert.equal(b.remaining_ms,null,'verified first human response means no SLA countdown to pause');
  assert.equal((await db.query('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=59200')).rows[0].first_response_deadline.getTime(),original.getTime());
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_hold_events_test WHERE action='HOLD_STARTED' AND consultation_id IN (59200,59201)")).rows[0].n,2);
  assert.equal((await post()).status,409,'cannot resume while Customer remains disabled');
 });
 await test('account recovery alone never removes hold, nor permits start-processing',async()=>{
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59200");
  assert.equal((await db.query('SELECT active FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59200')).rows[0].active,true);
  const start=await post('59200',bearer,key(),'start-processing');
  assert.equal(start.status,409);assert.equal(start.body.code,'CONSULTATION_CUSTOMER_DISABLED_HOLD');
  const newConsult=await customerCall('/api/v1/catalog/vehicles/59001/consultations');
  assert.equal(newConsult.status,409);assert.equal(newConsult.body.code,'CONSULTATION_CUSTOMER_DISABLED_HOLD');
  const withdrawal=await customerCall('/api/v1/catalog/consultations/59200/withdraw');
  assert.equal(withdrawal.status,409);assert.equal(withdrawal.body.code,'CONSULTATION_CUSTOMER_DISABLED_HOLD');
 });
 const resumeKey=key();
 await test('explicit scoped Employee resume preserves original deadline but restarts effective SLA from frozen remainder',async()=>{
  const before=(await db.query('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=59200')).rows[0].first_response_deadline;
  const first=await post('59200',bearer,resumeKey);
  assert.equal(first.status,200);assert.equal(first.body.code,'CONSULTATION_HOLD_RESUMED');
  assert.equal(first.body.firstResponseSlaRemainingVerified,true);
  const g=(await db.query('SELECT active,resumed_at,resumed_by_employee_id,remaining_ms FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59200')).rows[0];
  assert.equal(g.active,false);assert.equal(String(g.resumed_by_employee_id),'59200');assert.ok(g.resumed_at instanceof Date);
  const sla=(await db.query('SELECT effective_deadline FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=59200')).rows[0];
  assert.ok(Math.abs(sla.effective_deadline.getTime()-(g.resumed_at.getTime()+Number(g.remaining_ms)))<1800);
  assert.equal((await db.query('SELECT first_response_deadline FROM public.consultations WHERE consultation_id=59200')).rows[0].first_response_deadline.getTime(),before.getTime());
  const events=(await db.query("SELECT action,actor_employee_id FROM public.f05_catalog_consultation_hold_events_test WHERE consultation_id=59200 ORDER BY event_id")).rows;
  assert.deepEqual(events.map(x=>x.action),['HOLD_STARTED','HOLD_RESUMED']);
  assert.equal(String(events[1].actor_employee_id),'59200');
 });
 await test('same resume key is idempotent, new key is rejected and first-response-complete SLA never restarts',async()=>{
  assert.equal((await post('59200',bearer,resumeKey)).body.code,'CONSULTATION_HOLD_RESUME_REPLAY');
  assert.equal((await post()).status,409);
  const prev=(await db.query('SELECT effective_deadline,first_human_response_at FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=59201')).rows[0];
  const completed=await post('59201');assert.equal(completed.status,200);
  assert.equal(completed.body.firstResponseSlaRemainingVerified,false);
  const after=(await db.query('SELECT effective_deadline,first_human_response_at FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=59201')).rows[0];
  assert.deepEqual(after,prev);
 });
 await test('after explicit resume, authenticated Customer may terminate own preexisting Consultation',async()=>{
  const r=await customerCall('/api/v1/catalog/consultations/59201/withdraw');
  assert.equal(r.status,200);assert.equal(r.body.code,'CONSULTATION_WITHDRAWN');
  assert.equal((await db.query('SELECT close_reason FROM public.consultations WHERE consultation_id=59201')).rows[0].close_reason,'CUSTOMER_WITHDRAWN');
 });
 await test('no authoritative first-response facts still holds open Consultation without manufacturing SLA remaining',async()=>{
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59201");
  const g=(await db.query('SELECT active,remaining_ms FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59202')).rows[0];
  assert.equal(g.active,true);assert.equal(g.remaining_ms,null);
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59201");
  await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_resume_hold=true WHERE employee_id=59200 AND customer_id=59201");
  const response=await post('59202');assert.equal(response.status,200);
  assert.equal(response.body.firstResponseSlaRemainingVerified,false);
 });
 await test('failed hold event INSERT rolls back Customer disable, Guard and SLA status together',async()=>{
  await db.query("CREATE FUNCTION public.f05_hold_start_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='HOLD_STARTED' THEN RAISE EXCEPTION 'INJECTED_HOLD_START_FAIL'; END IF; RETURN NEW; END $$");
  await db.query('CREATE TRIGGER f05_hold_start_inject BEFORE INSERT ON public.f05_catalog_consultation_hold_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_hold_start_fail_test()');
  try{
   await assert.rejects(db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59200"),/INJECTED_HOLD_START_FAIL/);
   assert.equal((await db.query('SELECT account_status FROM public.customers WHERE customer_id=59200')).rows[0].account_status,'active');
   assert.equal((await db.query('SELECT active FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59200')).rows[0].active,false);
  }finally{
   await db.query('DROP TRIGGER f05_hold_start_inject ON public.f05_catalog_consultation_hold_events_test');
   await db.query('DROP FUNCTION public.f05_hold_start_fail_test()');
  }
 });
 await test('second disable freezes current remaining instead of giving a fresh 15 minutes, and old key cannot replay',async()=>{
  await db.query("UPDATE public.f05_catalog_consultation_sla_test SET effective_deadline=statement_timestamp()+interval '4 minutes' WHERE consultation_id=59200");
  assert.equal((await db.query('SELECT status FROM public.consultations WHERE consultation_id=59201')).rows[0].status,'resolved');
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59200");
  const g=(await db.query('SELECT active,version,remaining_ms FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59200')).rows[0];
  assert.equal(g.active,true);assert.equal(String(g.version),'2');
  assert.ok(Number(g.remaining_ms)>3*60*1000&&Number(g.remaining_ms)<=4*60*1000);
  assert.equal((await db.query('SELECT active,version FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59201')).rows[0].active,false);
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59200");
  assert.equal((await post('59200',bearer,resumeKey)).status,409,'old version must not replay into second hold');
 });
 await test('PG16 resumed-history error rolls back effective SLA adjustment and Guard, original key can retry',async()=>{
  const before=(await db.query('SELECT effective_deadline FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=59200')).rows[0].effective_deadline;
  await db.query("CREATE FUNCTION public.f05_resume_audit_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='HOLD_RESUMED' THEN RAISE EXCEPTION 'INJECTED_RESUME_AUDIT_FAIL'; END IF; RETURN NEW; END $$");
  await db.query('CREATE TRIGGER f05_resume_audit_inject BEFORE INSERT ON public.f05_catalog_consultation_hold_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_resume_audit_fail_test()');
  const eventKey=key();
  try{
   const failed=await post('59200',bearer,eventKey);assert.equal(failed.status,503);
   assert.equal((await db.query('SELECT active FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=59200')).rows[0].active,true);
   assert.equal((await db.query('SELECT effective_deadline FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=59200')).rows[0].effective_deadline.getTime(),before.getTime());
   assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[eventKey])).rows[0].n,0);
  }finally{
   await db.query('DROP TRIGGER f05_resume_audit_inject ON public.f05_catalog_consultation_hold_events_test');
   await db.query('DROP FUNCTION public.f05_resume_audit_fail_test()');
  }
  assert.equal((await post('59200',bearer,eventKey)).status,200);
  const effective=(await db.query('SELECT effective_deadline FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=59200')).rows[0].effective_deadline;
  assert.ok(effective.getTime()-Date.now()<=4*60*1000+2500);
 });
 await test('append-only hold history refuses UPDATE and DELETE; revoked employee cannot resume',async()=>{
  await assert.rejects(db.query("UPDATE public.f05_catalog_consultation_hold_events_test SET action='HOLD_STARTED' WHERE consultation_id=59200"),e=>e.code==='23514');
  await assert.rejects(db.query('DELETE FROM public.f05_catalog_consultation_hold_events_test WHERE consultation_id=59200'),e=>e.code==='23514');
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59200");
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59200");
  await db.query('UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1',[digest(bearer)]);
  assert.equal((await post()).status,401);
 });
}catch(e){failure=e}finally{
 if(srv)await new Promise((ok,bad)=>srv.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
