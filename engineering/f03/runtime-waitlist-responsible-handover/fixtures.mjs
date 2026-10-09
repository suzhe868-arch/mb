// F03-2-2K disposable PG16 CI-only synthetic Waitlist facts, never production candidates.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('K_FIXTURE_CI_ONLY');
const db=await connect();
try{
 await db.query('BEGIN');
 await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(18,'waitlist.responsible.transfer')");
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,18,'allow',now()),(6,18,'allow',now())");
 await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,18,201,now()-interval '2 minutes'),(5,18,206,now()-interval '2 minutes'),(6,18,205,now()-interval '2 minutes'),(6,18,208,now()-interval '2 minutes')");
 for(let i=1;i<=30;i++){
  const customer=3400+i,w=5400+i,vehicle=i%2?1001:1002,cycle=i%2?2001:2002;
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',7)",[customer]);
  await db.query("INSERT INTO public.waitlists(waitlist_id,customer_id,vehicle_id,listing_cycle_id,responsible_employee_id,ended_at,active_lock_id) VALUES($1,$2,$3,$4,7,CASE WHEN $5=3 THEN now() ELSE NULL END,CASE WHEN $5=11 THEN 5051 ELSE NULL END)",[w,customer,vehicle,cycle,i]);
  const batch=7400+i,item=9400+i;
  await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,7,$2,'employee',$3,$4,'Waitlist synthetic CI-only single domain handover')",[batch,i===24?'sudden_inactive':'planned_transfer',i===12?6:5,'k2-batch-'+batch+'-only']);
  await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES($1,$2,'Waitlist',$3,7,4)",[item,batch,String(w)]);
 }
 await db.query("INSERT INTO public.lock_requests(lock_request_id,customer_id,vehicle_id,listing_cycle_id,status,created_at,expires_at,resulting_waitlist_id) VALUES(9909,3409,1001,2001,'lock_conflict',now()-interval '1 hour',now()+interval '1 hour',5409)");
 await db.query("UPDATE public.waitlists SET source_lock_request_id=9909 WHERE waitlist_id=5409");
 // A synthetic customer already owns an actual active Lock => their Waitlist cannot be reallocated.
 await db.query("INSERT INTO public.locks(lock_id,customer_id,vehicle_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES(9961,3404,1002,2002,'active',7,now()-interval '1 hour',now()+interval '2 hours')");
 // A second genuine SG06 batch proves immutable history across 7 -> 4 -> 5.
 await db.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(7460,4,'planned_transfer','employee',5,'k2-second-chain-7460','CI genuine second Waitlist handover')");
 await db.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(9460,7460,'Waitlist','5401',4,5)");
 await db.query('COMMIT');
 console.log('K_CI_SYNTHETIC_30_WAITLISTS_WITH_REAL_LOCKREQUEST_LOCK_AND_SG06_PASS');
}catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
