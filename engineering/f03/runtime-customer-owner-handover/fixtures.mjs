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
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES(205,6,'store',1)");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(6,15,205,now()-interval '1 minute')");
 await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(306,'active',1,'assigned',7)");
 await c.query("INSERT INTO public.employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id) VALUES(4,true,1,now(),9),(6,true,1,now(),9) ON CONFLICT(employee_id) DO UPDATE SET eligible=true,version=public.employee_receiving_eligibility.version+1,decided_at=now()");
 await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(6001,7,'planned_transfer','employee',5,'h-ci-batch-6001','synthetic Customer owner transfer'),(6002,7,'planned_transfer','employee',6,'h-ci-batch-6002','synthetic competing store-head batch'),(6003,7,'planned_transfer','employee',5,'h-ci-batch-6003','synthetic second Customer transfer'),(6004,7,'planned_disable','employee',5,'h-ci-batch-6004','synthetic planned source leaving'),(6005,7,'planned_transfer','employee',6,'h-ci-batch-6005','synthetic second competing batch'),(6007,7,'sudden_inactive','employee',5,'h-ci-batch-6007','synthetic sudden invalid source'),(6008,7,'planned_transfer','employee',6,'h-ci-batch-6008','synthetic store scope head')");
 await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(7001,6001,'Customer','301',7,4),(7002,6002,'Customer','301',7,6),(7003,6003,'Customer','302',7,4),(7004,6004,'Customer','304',7,4),(7005,6001,'Demand','401',7,4),(7006,6005,'Customer','302',7,6),(7008,6007,'Customer','305',7,4),(7009,6008,'Customer','306',7,4)");
 // H-01/H-02/H-03: synthetic-only scoped cross-store and distinct-key race fixtures.
 await c.query("INSERT INTO public.stores(store_id,store_name,status) VALUES(2,'CI foreign store only','active')");
 await c.query("INSERT INTO public.teams(team_id,store_id,team_status) VALUES (906,2,'active'),(907,1,'active')");
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) VALUES (906,5,now()-interval '2 minutes',9),(906,6,now()-interval '2 minutes',9),(906,7,now()-interval '2 minutes',9),(906,4,now()-interval '2 minutes',9),(907,5,now()-interval '2 minutes',9),(907,7,now()-interval '2 minutes',9),(907,4,now()-interval '2 minutes',9)");
 await c.query("UPDATE public.teams SET membership_version=4 WHERE team_id=906");
 await c.query("UPDATE public.teams SET membership_version=3 WHERE team_id=907");
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES (206,5,'team',906),(207,5,'team',907)");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES (5,15,206,now()-interval '1 minute')");
 await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES(315,'active',1,'assigned',7),(316,'active',1,'assigned',7),(317,'active',1,'assigned',7),(318,'active',1,'assigned',7),(319,'active',1,'assigned',7),(320,'active',1,'assigned',7),(321,'active',1,'assigned',7)");
 await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES(6015,7,'planned_transfer','employee',5,'h-ci-scope-6015','cross-store scoped manager'),(6016,7,'planned_transfer','employee',5,'h-ci-scope-6016','same-store unbound scope'),(6017,7,'planned_transfer','employee',5,'h-ci-paused-6017','paused actor manager'),(6018,7,'planned_transfer','employee',6,'h-ci-paused-6018','paused actor store head'),(6019,7,'planned_transfer','employee',5,'h-ci-collision-6019','concurrent global duplicate key A'),(6020,7,'planned_transfer','employee',6,'h-ci-collision-6020','concurrent global duplicate key B'),(6021,7,'planned_transfer','employee',5,'h-ci-rollback-6021','reusable key only after rollback')");
 await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id) VALUES(7015,6015,'Customer','315',7,4),(7016,6016,'Customer','316',7,4),(7017,6017,'Customer','317',7,4),(7018,6018,'Customer','318',7,4),(7019,6019,'Customer','319',7,4),(7020,6020,'Customer','320',7,6),(7021,6021,'Customer','321',7,4)");
 await c.query('COMMIT');
 console.log('H_CI_ONLY_INDEPENDENT_OWNER_PERMISSION_AND_4_SYNTHETIC_BATCHES');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
