// F03-2-2N isolated PG16-only multi-domain ledger; never real business data.
import {connect} from '../runtime-transaction-responsible-handover/migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('N_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(96601,7,'planned_transfer','employee',5,'n-handover-seven-kinds-96601','CI N seven kinds read-only reconciliation'),(96602,7,'planned_transfer','employee',5,'n-partial-failed-96602','CI N partially pending report')");
 const rows=[['Customer','301'],['Demand','401'],['Priority','5011'],['Consultation','5301'],['Waitlist','5401'],['Lock','18001'],['Transaction','39001']];
 for(const [index,[kind,obj]] of rows.entries()){
  await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id,status) VALUES($1,96601,$2,$3,7,4,'pending')",[13601+index,kind,obj]);
 }
 await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id,status) VALUES(13611,96602,'Customer','302',7,4,'pending'),(13612,96602,'Demand','402',7,4,'retry_required'),(13613,96602,'Priority','5011',7,4,'blocked')");
 await c.query('COMMIT');
 console.log('N_SYNTHETIC_SEVEN_KINDS_AND_PARTIAL_PENDING_FIXTURE_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
