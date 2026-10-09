// F03-2-2L synthetic PG16-only Lock authority; never real customers or money.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('L_FIXTURE_CI_ONLY');
const db=await connect();
try{
 await db.query('BEGIN');
 await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(19,'lock.responsible.transfer')");
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,19,'allow',now()),(6,19,'allow',now())");
 await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,19,201,now()-interval '2 minutes'),(5,19,206,now()-interval '2 minutes'),(6,19,205,now()-interval '2 minutes'),(6,19,208,now()-interval '2 minutes')");
 for(let n=1;n<=30;n++){
  const lock=18000+n,vehicle=98000+n,cycle=99000+n,customer=14300+n,batch=8400+n,item=10400+n;
  await db.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) VALUES($1,'mingbang','available','visible',7)",[vehicle]);
  await db.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,now()-interval '3 hours')",[cycle,vehicle]);
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',7)",[customer]);
  await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES($1,$2,$3,$4,$5,7,now()-interval '2 hours',CASE WHEN $6 IN (4,5) THEN now()-interval '1 minute' ELSE now()+interval '1 hour' END)",[lock,customer,vehicle,cycle,n===3?'released':'active',n]);
  await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,7,$2,'employee',$3,$4,'Lock CI-only single-domain handover')",[batch,n===24?'sudden_inactive':'planned_transfer',n===29?6:5,'l2-batch-'+batch+'-only']);
  await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES($1,$2,'Lock',$3,7,4)",[item,batch,String(lock)]);
 }
 // These rows exist only in a disposable synthetic database and are NOT payment execution.
 await db.query("INSERT INTO public.deposit_receipts(deposit_id,customer_id,lock_id,amount_cents,received_at,recorded_by) VALUES(18505,14305,18005,30000,now()-interval '25 minutes',5),(18506,14306,18006,30000,now()-interval '25 minutes',5)");
 await db.query("INSERT INTO public.lock_requests(lock_request_id,customer_id,vehicle_id,listing_cycle_id,status,created_at,expires_at,resulting_lock_id,processed_by) VALUES(19909,14309,98009,99009,'approved',now()-interval '2 hours',now()+interval '3 hours',18009,5)");
 await db.query('UPDATE public.locks SET source_lock_request_id=19909 WHERE lock_id=18009');
 await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(8460,4,'planned_transfer','employee',5,'l2-second-chain-8460','CI genuine second Lock handover')");
 await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(10460,8460,'Lock','18001',4,5)");
 await db.query('COMMIT');
 console.log('L_CI_SYNTHETIC_LOCK_30_WITH_REAL_SCHEMA_DEPOSIT_RECEIPT_AND_APPROVED_REQUEST');
}catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
