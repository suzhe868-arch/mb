// F03-2-2J: fresh non-production PG16 synthetic Consultation SLA and SG06 batches.
import {connect} from './migration.mjs';
if(process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true')throw Error('J_FIXTURE_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(17,'consultation.assignee.transfer')");
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,17,'allow',now()),(6,17,'allow',now())");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,17,201,now()-interval '2 minutes'),(5,17,206,now()-interval '2 minutes'),(6,17,205,now()-interval '2 minutes'),(6,17,208,now()-interval '2 minutes')");
 const customers=[302,304,305,306,315,316,317,318,319,320,321,322,301,302,304,305,306,315,316,317,318,319,320,321,322];
 for(let i=1;i<=25;i++){
  const id=5300+i,second=i>=13;
  const status=i===3?'resolved':i===4?'invalid':i===2?'processing':'pending';
  const vehicle=second?1002:1001,cycle=second?2002:2001;
  await c.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline,completed_at,close_reason) VALUES($1,$2,$3,$4,7,$5,$6::jsonb,now()+interval '15 minutes',CASE WHEN $5 IN ('resolved','invalid') THEN now() ELSE NULL END,CASE WHEN $5 IN ('resolved','invalid') THEN 'CI closed' ELSE NULL END)",[id,customers[i-1],vehicle,cycle,status,JSON.stringify({originalChannel:'ci_customer_direct',consultationId:id})]);
  const batch=7200+i,item=9200+i;
  await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,7,$2,'employee',$3,$4,'synthetic Consultation responsibility / untouched first response SLA')",[batch,i===24?'sudden_inactive':'planned_transfer',i===12?6:5,'j2-batch-'+batch+'-ci']);
  await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES($1,$2,'Consultation',$3,7,4)",[item,batch,String(id)]);
 }
 await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(7260,4,'planned_transfer','employee',5,'j2-second-chain-7260','two real sequential Consultation transfers')");
 await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(9260,7260,'Consultation','5301',4,5)");
 await c.query('COMMIT');console.log('J_CI_25_CONSULTATIONS_WITH_15_MINUTE_DEADLINES_AND_SG06_ITEMS_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
