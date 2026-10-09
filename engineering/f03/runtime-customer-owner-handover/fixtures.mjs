// H-only CI-owned permission; never write formal production permission defaults.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('H_FIXTURE_NOT_DISPOSABLE_CI');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(15,'customer.owner.transfer')");
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,15,'allow',now()),(6,15,'allow',now())");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,15,201,now()-interval '1 minute'),(6,15,204,now()-interval '1 minute')");
 // Independent synthetic store-head second login for same exact Team; no production role template changed.
 await c.query('UPDATE public.employees SET main_role_id=32 WHERE employee_id=6');
 await c.query("INSERT INTO public.employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id) VALUES(4,true,1,now(),9),(6,true,1,now(),9) ON CONFLICT(employee_id) DO UPDATE SET eligible=true,version=public.employee_receiving_eligibility.version+1,decided_at=now()");
 await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(6001,7,'planned_transfer','employee',5,'h-ci-batch-6001','synthetic Customer owner transfer'),(6002,7,'planned_transfer','employee',6,'h-ci-batch-6002','synthetic competing store-head batch'),(6003,7,'planned_transfer','employee',5,'h-ci-batch-6003','synthetic second Customer transfer'),(6004,7,'planned_disable','employee',5,'h-ci-batch-6004','synthetic planned source leaving'),(6005,7,'planned_transfer','employee',6,'h-ci-batch-6005','synthetic second competing batch')");
 await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(7001,6001,'Customer','301',7,4),(7002,6002,'Customer','301',7,6),(7003,6003,'Customer','302',7,4),(7004,6004,'Customer','304',7,4),(7005,6001,'Demand','401',7,4),(7006,6005,'Customer','302',7,6)");
 await c.query('COMMIT');
 console.log('H_CI_ONLY_INDEPENDENT_OWNER_PERMISSION_AND_4_SYNTHETIC_BATCHES');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
