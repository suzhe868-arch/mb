// PDM-15 true human-response SLA fact in disposable non-superuser PG16.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedConsultationResponseService} from '../src/f05-consultation-response-service.mjs';
import {createIsolatedConsultationResponseHandler} from '../src/f05-consultation-response-http.mjs';
const env=validateCatalogEnv(),pool=new pg.Pool({connectionString:env.connectionString,max:6,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:env.connectionString,connectionTimeoutMillis:1200});
const hash=x=>createHash('sha256').update(x).digest('hex'),secret=()=>randomBytes(32).toString('base64url');
const employeeToken=secret(),otherToken=secret(),fourSToken=secret(),event=()=>secret();
let server,connected=false,failure;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES"+
   "(68880,59001,'active','receiving'),(68881,59001,'active','receiving'),(68882,59002,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES"+
   "(68880,'active',59001,68880,'assigned'),(68881,'active',59001,68880,'assigned'),(68882,'active',59001,68880,'assigned')");
  for(const [t,id] of [[employeeToken,68880],[otherToken,68881],[fourSToken,68882]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '25 minutes')",[hash(t),id]);
  for(const customer of [68880,68881,68882])
   await db.query("INSERT INTO public.f05_catalog_employee_consultation_scope_test(employee_id,customer_id,can_start_processing,can_record_human_response,expires_at) "+
    "VALUES(68880,$1,true,true,statement_timestamp()+interval '25 minutes')",[customer]);
  for(const id of [68880,68881,68882]){
   await db.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
    "VALUES($1,$1,59001,59001,68880,'pending','{\"kind\":\"other\",\"entry\":\"vehicle_detail\",\"issuer\":\"DISPOSABLE_TEST_ONLY\"}'::jsonb,statement_timestamp()+interval '15 minutes')",[id]);
   await db.query("INSERT INTO public.f05_catalog_consultation_sla_test(consultation_id,effective_deadline) "+
    "SELECT consultation_id,first_response_deadline FROM public.consultations WHERE consultation_id=$1",[id]);
  }
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedConsultationResponseService({pool,env:process.env});
 server=createServer(createFoundationHandler({consultationResponseHandler:createIsolatedConsultationResponseHandler(service,process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const call=async({id='68880',token=employeeToken,key=event(),channel='message',sourceFactRef='message-provider-fact-001',headers={}}={})=>{
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/consultations/'+id+'/human-responses',{
   method:'POST',headers:{authorization:'Bearer '+token,'x-idempotency-key':key,'content-type':'application/json',...headers},
   body:JSON.stringify({channel,sourceFactRef})});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 human response requires current assignee, Mingbang role and independent live capability',async()=>{
  assert.equal((await call({token:secret()})).status,401);
  assert.equal((await call({token:otherToken})).status,403);
  assert.equal((await call({token:fourSToken})).status,401);
  assert.equal((await call({headers:{'x-employee-id':'68880'}})).status,403);
  await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_record_human_response=false WHERE employee_id=68880 AND customer_id=68880");
  try{assert.equal((await call()).status,403)}
  finally{await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_record_human_response=true WHERE employee_id=68880 AND customer_id=68880")}
  assert.equal((await call({channel:'system'})).status,400);
  assert.equal((await call({sourceFactRef:'short'})).status,400);
 });
 const firstKey=event();
 await test('PG16 first real response completes SLA fact but does not rewrite status, owner, source or deadline',async()=>{
  const before=(await db.query("SELECT c.status,c.source_relation,c.first_response_deadline,cu.current_owner_employee_id "+
   "FROM public.consultations c JOIN public.customers cu ON cu.customer_id=c.customer_id WHERE c.consultation_id=68880")).rows[0];
  const r=await call({key:firstKey});
  assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.firstHumanResponseRecorded,true);
  assert.equal(JSON.stringify(r.body).includes('message-provider-fact-001'),false);
  const after=(await db.query("SELECT c.status,c.source_relation,c.first_response_deadline,cu.current_owner_employee_id,s.first_human_response_at "+
   "FROM public.consultations c JOIN public.customers cu ON cu.customer_id=c.customer_id "+
   "JOIN public.f05_catalog_consultation_sla_test s ON s.consultation_id=c.consultation_id WHERE c.consultation_id=68880")).rows[0];
  assert.equal(after.status,'pending');assert.deepEqual(after.source_relation,before.source_relation);
  assert.equal(after.first_response_deadline.getTime(),before.first_response_deadline.getTime());
  assert.equal(String(after.current_owner_employee_id),String(before.current_owner_employee_id));
  assert.ok(after.first_human_response_at instanceof Date);
  const e=(await db.query("SELECT channel,source_fact_ref,is_first_response,occurred_at FROM public.f05_consultation_human_response_events_test WHERE event_key=$1",[firstKey])).rows[0];
  assert.equal(e.channel,'message');assert.equal(e.source_fact_ref,'message-provider-fact-001');assert.equal(e.is_first_response,true);
  assert.equal(e.occurred_at.getTime(),after.first_human_response_at.getTime());
 });
 await test('PG16 exact replay is idempotent and later real response never moves first-response time',async()=>{
  const before=(await db.query("SELECT first_human_response_at FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=68880")).rows[0].first_human_response_at;
  const replay=await call({key:firstKey});assert.equal(replay.status,200);assert.equal(replay.body.code,'CONSULTATION_RESPONSE_REPLAY');
  const later=await call({channel:'phone',sourceFactRef:'phone-call-fact-002'});
  assert.equal(later.status,200);assert.equal(later.body.firstHumanResponseRecorded,false);
  const after=(await db.query("SELECT first_human_response_at FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=68880")).rows[0].first_human_response_at;
  assert.equal(after.getTime(),before.getTime());
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_consultation_human_response_events_test WHERE consultation_id=68880")).rows[0].n,2);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_consultation_human_response_events_test WHERE consultation_id=68880 AND is_first_response=true")).rows[0].n,1);
 });
 await test('PG16 Customer disable blocks service and restored account keeps explicit hold until formal resume',async()=>{
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=68880");
  assert.equal((await call()).status,403);
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=68880");
  const held=await call();assert.equal(held.status,409);assert.equal(held.body.code,'CONSULTATION_CUSTOMER_DISABLED_HOLD');
 });
 await test('PG16 response audit failure atomically rolls back first-response SLA timestamp and event key',async()=>{
  const k=event();
  await db.query("CREATE FUNCTION public.f05_response_fault_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_RESPONSE_AUDIT_FAIL'; END $$");
  await db.query("CREATE TRIGGER f05_response_fault BEFORE INSERT ON public.f05_consultation_human_response_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_response_fault_test()");
  try{
   const r=await call({id:'68881',key:k,sourceFactRef:'message-provider-fact-rollback'});assert.equal(r.status,503);
   assert.equal((await db.query("SELECT first_human_response_at FROM public.f05_catalog_consultation_sla_test WHERE consultation_id=68881")).rows[0].first_human_response_at,null);
   assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_consultation_human_response_events_test WHERE event_key=$1",[k])).rows[0].n,0);
  }finally{
   await db.query("DROP TRIGGER f05_response_fault ON public.f05_consultation_human_response_events_test");
   await db.query("DROP FUNCTION public.f05_response_fault_test()");
  }
  assert.equal((await call({id:'68881',key:k,sourceFactRef:'message-provider-fact-rollback'})).status,200);
 });
 await test('PG16 concurrent distinct real responses serialize to exactly one first response',async()=>{
  const [a,b]=await Promise.all([
   call({id:'68882',channel:'message',sourceFactRef:'message-provider-fact-a'}),
   call({id:'68882',channel:'offline',sourceFactRef:'offline-service-fact-b'})
  ]);
  assert.deepEqual([a.status,b.status],[200,200]);
  assert.equal([a.body,b.body].filter(x=>x.firstHumanResponseRecorded===true).length,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_consultation_human_response_events_test WHERE consultation_id=68882 AND is_first_response=true")).rows[0].n,1);
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_consultation_human_response_events_test WHERE consultation_id=68882")).rows[0].n,2);
  await assert.rejects(db.query("DELETE FROM public.f05_consultation_human_response_events_test WHERE consultation_id=68882"),e=>e.code==='23514');
 });
 await test('PG16 terminal Consultation cannot receive a later service fact',async()=>{
  await db.query("UPDATE public.consultations SET status='resolved',close_reason='RESOLVED',completed_at=statement_timestamp() WHERE consultation_id=68882");
  const r=await call({id:'68882',sourceFactRef:'message-after-terminal'});
  assert.equal(r.status,409);assert.equal(r.body.code,'CONSULTATION_NOT_OPEN');
 });
}catch(e){failure=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
