// F03-2-2M | synthetic ONLY, independent PG16; no real payment.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('M_FIXTURES_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(20,'transaction.responsible.transfer')");
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,20,'allow',now()),(6,20,'allow',now())");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,20,201,now()-interval '2 minutes'),(5,20,206,now()-interval '2 minutes'),(6,20,205,now()-interval '2 minutes'),(6,20,208,now()-interval '2 minutes')");
 for(let n=1;n<=60;n++){
  const lock=29000+n,tx=39000+n,vehicle=32000+n,cycle=33000+n,customer=25000+n,batch=9500+n,item=12500+n;
  const state=n===3?'completed':n===4?'cancelled':'in_progress';
  await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) VALUES($1,'mingbang','available','visible',7)",[vehicle]);
  await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,now()-interval '4 hours')",[cycle,vehicle]);
  await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',7)",[customer]);
  await c.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES($1,$2,$3,$4,'released',7,now()-interval '3 hours',now()-interval '1 hour')",[lock,customer,vehicle,cycle]);
  await c.query("INSERT INTO public.transactions(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id,completed_at) VALUES($1,$2,$3,$4,$5,$6,7,$7)",[tx,lock,customer,vehicle,cycle,state,n===3?new Date():null]);
  await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,7,$2,'employee',$3,$4,'Synthetic Transaction handover PG16 only')",[batch,n===54?'sudden_inactive':'planned_transfer',n===59?6:5,'m2-batch-'+batch+'-only']);
  await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES($1,$2,'Transaction',$3,7,4)",[item,batch,String(tx)]);
 }
 // Real FK-backed synthetic Deposit receipt against an original Lock, never payment execution.
 await c.query("INSERT INTO public.deposit_receipts(deposit_id,customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES(28505,25005,29005,30000,now()-interval '2 hours',5),(28551,25051,29051,12000,now()-interval '2 hours',5),(28552,25051,29051,18000,now()-interval '90 minutes',5)");
 await c.query("INSERT INTO public.refund_cases(refund_id,customer_id,transaction_id,status,created_at) VALUES(28906,25006,39006,'pending',now()-interval '10 minutes')");
 await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(9561,4,'planned_transfer','employee',5,'m2-next-chain-9561','Second Transaction responsible handover')");
 await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(12561,9561,'Transaction','39001',4,5)");
 await c.query('COMMIT');
 console.log('M_DISPOSABLE_60_REAL_SCHEMA_TRANSACTION_SOURCE_LOCK_MULTIPLE_DEPOSITS_AND_REFUND');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
