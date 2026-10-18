// Separate F05 employee-identity boundary; disposable PG16 F02 frozen consultations actual mutations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedEmployeeStartService} from '../src/f05-employee-start-service.mjs';
import {createIsolatedEmployeeStartHandler} from '../src/f05-employee-start-http.mjs';
const db=validateCatalogEnv();
const pool=new pg.Pool({connectionString:db.connectionString,max:4,connectionTimeoutMillis:1200});
const writer=new pg.Client({connectionString:db.connectionString,connectionTimeoutMillis:1200});
const hash=v=>createHash('sha256').update(v).digest('hex');
const token=randomBytes(32).toString('base64url');
const otherToken=randomBytes(32).toString('base64url');
const wrongRoleToken=randomBytes(32).toString('base64url');
const key=()=>randomBytes(32).toString('base64url');
let server,connected=false,fail;
try{
 await writer.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await writer.query('BEGIN');
 try{
  await writer.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES(59020,59001,'active','receiving'),(59021,59001,'active','receiving'),(59022,59002,'active','receiving')");
  await writer.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(59020,'active',59001,'assigned',59020)");
  await writer.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
   "VALUES(59020,59020,59001,59001,59020,'pending','{\"kind\":\"other\",\"entry\":\"vehicle_detail\",\"issuer\":\"DISPOSABLE_TEST_ONLY\"}'::jsonb,statement_timestamp()+interval '15 minutes'),"+
   "(59021,59020,59002,59002,59020,'pending','{\"kind\":\"other\",\"entry\":\"vehicle_detail\",\"issuer\":\"DISPOSABLE_TEST_ONLY\"}'::jsonb,statement_timestamp()+interval '15 minutes')");
  for(const [bearer,id] of [[token,'59020'],[otherToken,'59021'],[wrongRoleToken,'59022']])
   await writer.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[hash(bearer),id]);
  await writer.query("INSERT INTO public.f05_catalog_employee_consultation_scope_test(employee_id,customer_id,can_start_processing,expires_at) VALUES(59020,59020,true,statement_timestamp()+interval '20 minutes'),(59021,59020,true,statement_timestamp()+interval '20 minutes')");
  await writer.query('COMMIT');
 }catch(e){await writer.query('ROLLBACK');throw e}
 const svc=createIsolatedEmployeeStartService({pool,env:process.env});
 server=createServer(createFoundationHandler({employeeStartHandler:createIsolatedEmployeeStartHandler(svc,process.env)}));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const call=async(id='59020',bearer=token,eventKey=key(),headers={})=>{
  const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/catalog/consultations/'+id+'/start-processing',
    {method:'POST',headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey,...headers}});
  return {status:response.status,body:await response.json()};
 };
 await test('PG16 rejects employee masquerade, other assignee, 4S role and unknown bearer',async()=>{
  assert.equal((await call('59020',randomBytes(32).toString('base64url'))).status,401);
  assert.equal((await call('59020',otherToken)).status,403);
  assert.equal((await call('59020',wrongRoleToken)).status,401);
  assert.equal((await call('59020',token,key(),{'x-employee-id':'59020'})).status,403);
  assert.equal((await call('99999999')).status,404);
 });
 await test('PG16 requires active employee, customer account and live explicit test scope on every mutation',async()=>{
  await writer.query("DELETE FROM public.f05_catalog_employee_consultation_scope_test WHERE employee_id=59020");
  try{assert.equal((await call()).status,403)}
  finally{await writer.query("INSERT INTO public.f05_catalog_employee_consultation_scope_test(employee_id,customer_id,can_start_processing,expires_at) VALUES(59020,59020,true,statement_timestamp()+interval '20 minutes')")}
  await writer.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=59020");
  try{assert.equal((await call()).status,401)}
  finally{await writer.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=59020")}
  await writer.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59020");
  try{assert.equal((await call()).status,403)}
  finally{await writer.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59020")}
 });
 const startKey=key();
 await test('real PG16 pending to processing never changes assignee, source, first-response deadline or owner',async()=>{
  const previous=(await writer.query('SELECT assignee_employee_id,source_relation,first_response_deadline FROM public.consultations WHERE consultation_id=59020')).rows[0];
  const owner=(await writer.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=59020')).rows[0];
  const result=await call('59020',token,startKey);
  assert.equal(result.status,200);assert.equal(result.body.code,'CONSULTATION_PROCESSING_STARTED');
  assert.equal(result.body.firstHumanResponse,false);assert.equal(result.body.productionReady,false);
  const after=(await writer.query('SELECT status,assignee_employee_id,source_relation,first_response_deadline FROM public.consultations WHERE consultation_id=59020')).rows[0];
  assert.equal(after.status,'processing');
  assert.equal(String(after.assignee_employee_id),String(previous.assignee_employee_id));
  assert.deepEqual(after.source_relation,previous.source_relation);
  assert.equal(after.first_response_deadline.getTime(),previous.first_response_deadline.getTime());
  assert.equal(String((await writer.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=59020')).rows[0].current_owner_employee_id),String(owner.current_owner_employee_id));
  const audit=(await writer.query("SELECT action,actor_employee_id FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1",[startKey])).rows[0];
  assert.equal(audit.action,'STARTED_PROCESSING');assert.equal(String(audit.actor_employee_id),'59020');
 });
 await test('same key replays but different key never repeats processing transition',async()=>{
  const replay=await call('59020',token,startKey);
  assert.equal(replay.status,200);assert.equal(replay.body.code,'CONSULTATION_PROCESSING_REPLAY');
  assert.equal((await call()).status,409);
  const cross=await call('59021',token,startKey);
  assert.equal(cross.status,409);assert.equal(cross.body.code,'CONSULTATION_IDEMPOTENCY_COLLISION');
  const n=(await writer.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=59020 AND action='STARTED_PROCESSING'")).rows[0].n;
  assert.equal(n,1);
 });
 await test('PG16 audit failure rolls back pending-to-processing and idempotency key',async()=>{
  await writer.query("CREATE FUNCTION public.f05_processing_inject_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_START_FAILURE'; END $$");
  await writer.query("CREATE TRIGGER f05_processing_inject_failure BEFORE INSERT ON public.f05_catalog_consultation_actions_test FOR EACH ROW EXECUTE FUNCTION public.f05_processing_inject_fail_test()");
  const k=key();
  try{
   const result=await call('59021',token,k);
   assert.equal(result.status,503);
   assert.equal((await writer.query('SELECT status FROM public.consultations WHERE consultation_id=59021')).rows[0].status,'pending');
   assert.equal((await writer.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[k])).rows[0].n,0);
  }finally{
   await writer.query('DROP TRIGGER f05_processing_inject_failure ON public.f05_catalog_consultation_actions_test');
   await writer.query('DROP FUNCTION public.f05_processing_inject_fail_test()');
  }
  const ok=await call('59021',token,k);
  assert.equal(ok.status,200);
 });
 await test('PG16 terminal Consultation cannot start processing again or use old key replay',async()=>{
  await writer.query("UPDATE public.consultations SET status='resolved',close_reason='RESOLVED',completed_at=statement_timestamp() WHERE consultation_id=59020");
  assert.equal((await call('59020',token)).status,409);
  assert.equal((await call('59020',token,startKey)).status,409);
 });
 await test('PG16 revoked Employee credential immediately fails closed',async()=>{
  await writer.query("UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1",[hash(token)]);
  assert.equal((await call('59021',token)).status,401);
 });
}catch(e){fail=e}finally{
 if(server)await new Promise((ok,bad)=>server.close(e=>e?bad(e):ok()));
 if(connected)await writer.end();
 await pool.end();
}
if(fail)throw fail;
