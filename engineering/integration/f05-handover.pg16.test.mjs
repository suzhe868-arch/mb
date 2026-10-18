// F05 consultation handover: real Node HTTP -> frozen consultations PG16, no formal Employee issuer.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import pg from 'pg';
import {createFoundationHandler} from '../src/app.mjs';
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedHandoverService} from '../src/f05-handover-service.mjs';
import {createIsolatedHandoverHandler} from '../src/f05-handover-http.mjs';
const cfg=validateCatalogEnv();
const pool=new pg.Pool({connectionString:cfg.connectionString,max:4,connectionTimeoutMillis:1200});
const db=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:1200});
const token=()=>randomBytes(32).toString('base64url'),key=()=>randomBytes(32).toString('base64url');
const digest=x=>createHash('sha256').update(x).digest('hex');
const ownerToken=token(),targetToken=token(),otherToken=token(),fourSToken=token();
const note='客户业务正常交接目标销售';
let srv,connected=false,failure;
try{
 await db.connect();connected=true;assert.equal(await probeIsolatedCatalog(pool),true);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.employees(employee_id,main_role_id,employment_status,receiving_status) VALUES "+
   "(59100,59001,'active','receiving'),(59101,59001,'active','receiving'),"+
   "(59102,59002,'active','receiving'),(59103,59001,'active','receiving')");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) "+
   "VALUES(59100,'active',59001,'assigned',59100)");
  await db.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
   "VALUES(59100,59100,59001,59001,59100,'pending','{\"kind\":\"other\",\"entry\":\"vehicle_detail\"}'::jsonb,statement_timestamp()+interval '15 minutes'),"+
   "(59101,59100,59002,59002,59100,'processing','{\"kind\":\"other\",\"entry\":\"vehicle_detail\"}'::jsonb,statement_timestamp()+interval '15 minutes')");
  for(const [bearer,id] of [[ownerToken,'59100'],[targetToken,'59101'],[fourSToken,'59102'],[otherToken,'59103']])
   await db.query("INSERT INTO public.f05_catalog_employee_sessions_test(token_sha256,employee_id,expires_at) VALUES($1,$2,statement_timestamp()+interval '20 minutes')",[digest(bearer),id]);
  await db.query("INSERT INTO public.f05_catalog_employee_consultation_scope_test(employee_id,customer_id,can_start_processing,can_reassign,can_receive,expires_at) VALUES "+
   "(59100,59100,true,false,false,statement_timestamp()+interval '20 minutes'),"+
   "(59101,59100,true,false,true,statement_timestamp()+interval '20 minutes'),"+
   "(59102,59100,true,false,true,statement_timestamp()+interval '20 minutes'),"+
   "(59103,59100,true,false,true,statement_timestamp()+interval '20 minutes')");
  await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e}
 const service=createIsolatedHandoverService({pool,env:process.env});
 srv=createServer(createFoundationHandler({handoverHandler:createIsolatedHandoverHandler(service,process.env)}));
 await new Promise((ok,bad)=>{srv.once('error',bad);srv.listen(0,'127.0.0.1',ok)});
 const call=async({id='59100',target='59101',bearer=ownerToken,eventKey=key(),reason=note,body}={})=>{
  const value=body??{targetEmployeeId:target,reason};
  const r=await fetch('http://127.0.0.1:'+srv.address().port+'/api/v1/catalog/consultations/'+id+'/reassign',{
   method:'POST',headers:{authorization:'Bearer '+bearer,'x-idempotency-key':eventKey,'content-type':'application/json'},body:JSON.stringify(value)});
  return {status:r.status,body:await r.json()};
 };
 await test('PG16 denies anonymous, 4S, other-assignee and forged Employee on transfer',async()=>{
  assert.equal((await call({bearer:token()})).status,401);
  assert.equal((await call({bearer:fourSToken})).status,401);
  assert.equal((await call({bearer:targetToken})).status,403);
  assert.equal((await call({id:'99999999'})).status,404);
  assert.equal((await call({body:{targetEmployeeId:'59101',reason:note,employeeId:'59100'}})).status,400);
 });
 await test('PG16 actor reassign authority is independent of start and finalization capability',async()=>{
  const denied=await call();assert.equal(denied.status,403);assert.equal(denied.body.code,'HANDOVER_ACTOR_SCOPE_REQUIRED');
  assert.equal((await db.query('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=59100')).rows[0].assignee_employee_id,'59100');
  await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_reassign=true WHERE employee_id=59100 AND customer_id=59100");
 });
 await test('PG16 target must be active, receiving, qualified and explicitly scoped, never 4S',async()=>{
  assert.equal((await call({target:'59102'})).status,403);
  await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_receive=false WHERE employee_id=59101");
  try{assert.equal((await call()).status,403)}finally{await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_receive=true WHERE employee_id=59101")}
  await db.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=59101");
  try{assert.equal((await call()).status,403)}finally{await db.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=59101")}
  await db.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=59101");
  try{assert.equal((await call()).status,403)}finally{await db.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=59101")}
  assert.equal((await call({target:'59100'})).status,409);
 });
 const handoverKey=key();
 await test('physical PG16 reassign preserves Customer owner, Consultation status, direct source and first SLA deadline',async()=>{
  const before=(await db.query('SELECT status,source_relation,first_response_deadline FROM public.consultations WHERE consultation_id=59100')).rows[0];
  const r=await call({eventKey:handoverKey});
  assert.equal(r.status,200);assert.equal(r.body.code,'CONSULTATION_REASSIGNED');
  assert.equal(r.body.oldAssigneeEmployeeId,'59100');assert.equal(r.body.newAssigneeEmployeeId,'59101');
  assert.equal(r.body.firstHumanResponse,false);assert.equal(r.body.productionReady,false);
  const after=(await db.query('SELECT assignee_employee_id,status,source_relation,first_response_deadline FROM public.consultations WHERE consultation_id=59100')).rows[0];
  assert.equal(String(after.assignee_employee_id),'59101');assert.equal(after.status,before.status);
  assert.deepEqual(after.source_relation,before.source_relation);
  assert.equal(after.first_response_deadline.getTime(),before.first_response_deadline.getTime());
  assert.equal(String((await db.query('SELECT current_owner_employee_id FROM public.customers WHERE customer_id=59100')).rows[0].current_owner_employee_id),'59100');
  const event=(await db.query('SELECT action,actor_employee_id,old_assignee_employee_id,new_assignee_employee_id,handover_reason,occurred_at FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[handoverKey])).rows[0];
  assert.equal(event.action,'REASSIGNED');assert.equal(String(event.actor_employee_id),'59100');
  assert.equal(String(event.old_assignee_employee_id),'59100');assert.equal(String(event.new_assignee_employee_id),'59101');
  assert.equal(event.handover_reason,note);assert.ok(event.occurred_at instanceof Date);
 });
 await test('true PG16 transfer idempotency cannot authorize different target, reason or former assignee',async()=>{
  const replay=await call({eventKey:handoverKey});assert.equal(replay.status,200);
  assert.equal(replay.body.code,'CONSULTATION_HANDOVER_REPLAY');
  assert.equal((await call({eventKey:handoverKey,target:'59103'})).status,409);
  assert.equal((await call({eventKey:handoverKey,reason:'其他转交原因不同'})).status,409);
  assert.equal((await call()).status,403);
  const n=(await db.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=59100 AND action='REASSIGNED'")).rows[0].n;
  assert.equal(n,1);
 });
 await test('disabled Customer permits necessary legal handover without changing Customer status',async()=>{
  await db.query("UPDATE public.customers SET account_status='disabled' WHERE customer_id=59100");
  try{
   const r=await call({id:'59101',target:'59103'});
   assert.equal(r.status,200);assert.equal(r.body.code,'CONSULTATION_REASSIGNED');
   assert.equal((await db.query('SELECT account_status FROM public.customers WHERE customer_id=59100')).rows[0].account_status,'disabled');
  }finally{await db.query("UPDATE public.customers SET account_status='active' WHERE customer_id=59100")}
 });
 await test('terminal consultation cannot be transferred; old assignee session revocation must fail closed',async()=>{
  await db.query("UPDATE public.consultations SET status='resolved',close_reason='RESOLVED',completed_at=statement_timestamp() WHERE consultation_id=59100");
  assert.equal((await call({id:'59100',bearer:targetToken,target:'59103'})).status,403);
  await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_reassign=true WHERE employee_id=59101");
  assert.equal((await call({id:'59100',bearer:targetToken,target:'59103'})).status,409);
  await db.query("UPDATE public.f05_catalog_employee_sessions_test SET revoked_at=statement_timestamp() WHERE token_sha256=$1",[digest(ownerToken)]);
  assert.equal((await call({id:'59101',target:'59101'})).status,401);
 });
 await test('audit insertion failure rolls back physical Consultation assignee and event key',async()=>{
  // Fresh consultation after prior two entries were reassigned or terminal.
  await db.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
    "VALUES(59102,59100,59001,59001,59101,'pending','{\"kind\":\"other\"}'::jsonb,statement_timestamp()+interval '15 minutes')");
  const faultKey=key();
  await db.query("CREATE FUNCTION public.f05_reassign_fail_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'INJECTED_HANDOVER_AUDIT_ERROR'; END $$");
  await db.query("CREATE TRIGGER f05_reassign_inject BEFORE INSERT ON public.f05_catalog_consultation_actions_test FOR EACH ROW EXECUTE FUNCTION public.f05_reassign_fail_test()");
  try{
   const failed=await call({id:'59102',bearer:targetToken,target:'59103',eventKey:faultKey});
   assert.equal(failed.status,503);
   assert.equal(String((await db.query('SELECT assignee_employee_id FROM public.consultations WHERE consultation_id=59102')).rows[0].assignee_employee_id),'59101');
   assert.equal((await db.query('SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[faultKey])).rows[0].n,0);
  }finally{
   await db.query('DROP TRIGGER f05_reassign_inject ON public.f05_catalog_consultation_actions_test');
   await db.query('DROP FUNCTION public.f05_reassign_fail_test()');
  }
  assert.equal((await call({id:'59102',bearer:targetToken,target:'59103',eventKey:faultKey})).status,200);
 });
 await test('competing PG16 transfers on one Consultation commit exactly one original-assignee history',async()=>{
  await db.query("UPDATE public.consultations SET status='resolved',close_reason='RESOLVED',completed_at=statement_timestamp() WHERE consultation_id=59101");
  await db.query("UPDATE public.f05_catalog_employee_consultation_scope_test SET can_receive=true WHERE employee_id=59100 AND customer_id=59100");
  await db.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
    "VALUES(59103,59100,59002,59002,59101,'pending','{\"kind\":\"other\"}'::jsonb,statement_timestamp()+interval '15 minutes')");
  const [a,b]=await Promise.all([call({id:'59103',bearer:targetToken,target:'59100'}),call({id:'59103',bearer:targetToken,target:'59103'})]);
  assert.deepEqual([a.status,b.status].sort((x,y)=>x-y),[200,403]);
  const n=(await db.query("SELECT count(*)::int n FROM public.f05_catalog_consultation_actions_test WHERE consultation_id=59103 AND action='REASSIGNED'")).rows[0].n;
  assert.equal(n,1);
 });
}catch(e){failure=e}finally{
 if(srv)await new Promise((ok,bad)=>srv.close(e=>e?bad(e):ok()));
 if(connected)await db.end();
 await pool.end();
}
if(failure)throw failure;
