import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedDemandLifecycleService} from '../src/f05-demand-lifecycle-service.mjs';
import {createIsolatedDemandLifecycleHandler} from '../src/f05-demand-lifecycle-http.mjs';
const conf=validateCatalogEnv(),pool=new pg.Pool({connectionString:conf.connectionString,max:5,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:conf.connectionString,connectionTimeoutMillis:1200});
const secret=()=>randomBytes(32).toString('base64url'),digest=x=>createHash('sha256').update(x).digest('hex');
const customerToken=secret(),otherCustomerToken=secret(),employeeToken=secret(),otherEmployeeToken=secret();
let server,connected=false,error;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES (59680,'demand_lifecycle_entitled')");
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES "+
    "(59680,59001,'active','receiving'),(59681,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES "+
    "(59680,'active',59680,59680,'assigned'),(59681,'active',59001,59681,'assigned')");
  await db.query("INSERT INTO public.f05_find_car_level_entitlement_test(level_id,can_activate_demand,expires_at) VALUES"+
    "(59680,true,statement_timestamp()+interval '25 minutes')");
  for(const [t,id] of [[customerToken,59680],[otherCustomerToken,59681]])
   await db.query("INSERT INTO public.f05_catalog_customer_sessions_test(token_sha256,customer_id,expires_at) "+
    "VALUES($1,$2,statement_timestamp()+interval '25 minutes')",[digest(t),id]);
  for(const [t,id] of [[employeeToken,59680],[otherEmployeeToken,59681]])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) "+
    "VALUES($1,$2,statement_timestamp()+interval '25 minutes')",[digest(t),id]);
  await db.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES"+
    "(59680,59680,59680,'active','{}'::jsonb),(59681,59680,59680,'active','{}'::jsonb)");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 server=createServer(createFoundationHandler({
  demandLifecycleHandler:createIsolatedDemandLifecycleHandler(
   createIsolatedDemandLifecycleService({pool,env:process.env}),process.env)
 }));
 await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok)});
 const root='http://127.0.0.1:'+server.address().port+'/api/v1/catalog/demands/';
 const act=async(action,who=customerToken,demandId='59680',key=secret(),reason=null)=>{
  const r=await fetch(root+demandId+'/actions',{method:'POST',headers:{
   authorization:'Bearer '+who,'x-idempotency-key':key,'content-type':'application/json'},
   body:JSON.stringify(reason===null?{action}:{action,reason})});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 no delegated employee lifecycle permission and no cross-customer authority',async()=>{
  assert.equal((await act('PAUSE',employeeToken)).status,403);
  assert.equal((await act('PAUSE',otherCustomerToken)).status,404);
  assert.equal((await act('PAUSE',otherEmployeeToken)).status,403);
  assert.equal((await act('PAUSE',secret())).status,401);
  assert.equal((await act('COMPLETE',customerToken,'59680',secret(),'客户不能自行关闭正式需求')).status,403);
  await db.query("INSERT INTO public.f05_demand_lifecycle_scope_test(employee_id,customer_id,can_manage_demand,expires_at) "+
   "VALUES(59680,59680,true,statement_timestamp()+interval '25 minutes')");
 });
 await test('PG16 customer pause and employee resume; demand owner stays distinct from Customer Owner',async()=>{
  const key=secret();const paused=await act('PAUSE',customerToken,'59680',key);
  assert.equal(paused.status,200);assert.equal(paused.body.demandState,'paused');
  assert.equal((await act('PAUSE',customerToken,'59680',key)).body.code,'DEMAND_LIFECYCLE_REPLAY');
  await db.query('UPDATE public.customers SET current_owner_employee_id=59681 WHERE customer_id=59680');
  assert.equal((await act('RESUME',employeeToken)).status,200);
  const row=(await db.query('SELECT demand_state,responsible_employee_id,created_at FROM public.demands WHERE demand_id=59680')).rows[0];
  assert.equal(row.demand_state,'active');assert.equal(String(row.responsible_employee_id),'59680');
  assert.ok(row.created_at instanceof Date);
  assert.equal((await act('PAUSE',otherEmployeeToken)).status,403);
 });
 await test('PG16 customer can request end but cannot directly finalize, one pending request only',async()=>{
  const k=secret();const a=await act('END_REQUEST',customerToken,'59680',k);
  assert.equal(a.status,200);assert.equal(a.body.endRequestPending,true);
  assert.equal((await act('END_REQUEST',customerToken,'59680',k)).body.code,'DEMAND_LIFECYCLE_REPLAY');
  assert.equal((await act('END_REQUEST')).status,409);
  assert.equal((await db.query("SELECT demand_state FROM public.demands WHERE demand_id=59680")).rows[0].demand_state,'active');
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_demand_end_requests_test WHERE demand_id=59680 AND status='pending'")).rows[0].n,1);
 });
 await test('PG16 disabled account/entitlement forbids resume, but employee can formally cancel',async()=>{
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59680");
  assert.equal((await act('END_REQUEST')).status,401);
  assert.equal((await act('PAUSE',employeeToken)).status,409);
  assert.equal((await db.query("SELECT demand_state FROM public.demands WHERE demand_id=59680")).rows[0].demand_state,'paused',
   'Account disable has already paused the active Demand atomically');
  assert.equal((await act('RESUME',employeeToken)).status,403);
  await db.query("UPDATE public.customers SET account_status='active',customer_level_id=59001 WHERE customer_id=59680");
  assert.equal((await act('RESUME',employeeToken)).status,403);
  await db.query("UPDATE public.customers SET customer_level_id=59680 WHERE customer_id=59680");
  assert.equal((await act('RESUME',employeeToken)).status,200);
  const completed=await act('CANCEL',employeeToken,'59680',secret(),'客户不再继续找车');
  assert.equal(completed.status,200);assert.equal(completed.body.demandState,'cancelled');
  assert.equal((await act('RESUME',employeeToken)).status,409);
  const end=(await db.query("SELECT status,decision,processed_by_employee_id FROM public.f05_demand_end_requests_test WHERE demand_id=59680")).rows[0];
  assert.equal(end.status,'processed');assert.equal(end.decision,'cancelled');
  assert.equal(String(end.processed_by_employee_id),'59680');
 });
 await test('PG16 forced audit failure rolls back actual Demand state; same key succeeds after recovery',async()=>{
  const key=secret();
  await db.query("CREATE FUNCTION public.f05_demand_audit_fault_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_DEMAND_AUDIT_FAILURE'; END $$");
  await db.query("CREATE TRIGGER f05_demand_audit_fault BEFORE INSERT ON public.f05_demand_lifecycle_events_test FOR EACH ROW EXECUTE FUNCTION public.f05_demand_audit_fault_test()");
  try{
   assert.equal((await act('PAUSE',customerToken,'59681',key)).status,503);
   assert.equal((await db.query("SELECT demand_state FROM public.demands WHERE demand_id=59681")).rows[0].demand_state,'active');
  }finally{
   await db.query("DROP TRIGGER f05_demand_audit_fault ON public.f05_demand_lifecycle_events_test");
   await db.query("DROP FUNCTION public.f05_demand_audit_fault_test()");
  }
  assert.equal((await act('PAUSE',customerToken,'59681',key)).status,200);
  assert.equal((await act('COMPLETE',employeeToken,'59681',secret(),'找车服务目标已真实完成')).status,200);
  assert.equal((await db.query("SELECT demand_state FROM public.demands WHERE demand_id=59681")).rows[0].demand_state,'completed');
 });
 await test('PG16 PDM11 auto-pauses active Demand on customer disable, downgrade or revoked level; never auto-resumes',async()=>{
  const demandId=String((await db.query("INSERT INTO public.demands(customer_id,responsible_employee_id,demand_state,criteria_json) "+
   "VALUES(59680,59680,'active','{}'::jsonb) RETURNING demand_id")).rows[0].demand_id);
  const state=async()=>(await db.query('SELECT demand_state FROM public.demands WHERE demand_id=$1',[demandId])).rows[0].demand_state;
  await db.query("UPDATE public.customers SET customer_level_id=59001 WHERE customer_id=59680");
  assert.equal(await state(),'paused');
  assert.equal((await db.query("SELECT result_code FROM public.f05_demand_lifecycle_events_test "+
   "WHERE demand_id=$1 AND action='AUTO_PAUSE'",[demandId])).rows[0].result_code,
   'DEMAND_AUTO_PAUSED_ENTITLEMENT_DOWNGRADED');
  await db.query("UPDATE public.customers SET customer_level_id=59680 WHERE customer_id=59680");
  assert.equal(await state(),'paused');
  assert.equal((await act('RESUME',customerToken,demandId)).status,200);
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59680");
  assert.equal(await state(),'paused');
  await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59680");
  assert.equal(await state(),'paused');
  assert.equal((await act('RESUME',employeeToken,demandId)).status,200);
  await db.query("UPDATE public.f05_find_car_level_entitlement_test "+
   "SET can_activate_demand=false WHERE level_id=59680");
  assert.equal(await state(),'paused');
  await db.query("UPDATE public.f05_find_car_level_entitlement_test "+
   "SET can_activate_demand=true WHERE level_id=59680");
  assert.equal(await state(),'paused');
  const hist=(await db.query("SELECT result_code FROM public.f05_demand_lifecycle_events_test "+
   "WHERE demand_id=$1 AND action='AUTO_PAUSE' ORDER BY occurred_at",[demandId])).rows;
  assert.equal(hist.length,3);
  assert.ok(hist.some(x=>x.result_code==='DEMAND_AUTO_PAUSED_ACCOUNT_DISABLED'));
  assert.equal((await act('RESUME',employeeToken,demandId)).status,200);
 });
 await test('PG16 concurrent end requests yield single pending record, immutable events and transaction integrity',async()=>{
  const newDemand=(await db.query("INSERT INTO public.demands(customer_id,responsible_employee_id,demand_state,criteria_json) "+
    "VALUES(59680,59680,'active','{}'::jsonb) RETURNING demand_id")).rows[0].demand_id;
  const [a,b]=await Promise.all([act('END_REQUEST',customerToken,String(newDemand)),act('END_REQUEST',customerToken,String(newDemand))]);
  assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,409]);
  const row=(await db.query("SELECT count(*)::int n FROM public.f05_demand_end_requests_test WHERE demand_id=$1 AND status='pending'",[newDemand])).rows[0];
  assert.equal(row.n,1);
  await assert.rejects(db.query("DELETE FROM public.f05_demand_lifecycle_events_test WHERE demand_id=$1",[newDemand]));
  assert.equal((await db.query("SELECT count(*)::int n FROM public.f05_demand_lifecycle_events_test WHERE demand_id=$1",[newDemand])).rows[0].n,1);
 });
}catch(e){error=e}finally{
 if(server)await new Promise(ok=>server.close(ok));
 if(connected)await db.end();
 await pool.end();
}
if(error)throw error;
