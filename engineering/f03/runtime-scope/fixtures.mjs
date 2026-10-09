import {connect} from './migration.mjs';
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES (1,'ordinary')");
 await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES (301,'active',1,'unassigned'),(302,'active',1,'unassigned'),(303,'inactive',1,'unassigned')");
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (11,'customer.phone.manage'),(12,'crm.customer.view')");
 await c.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES (1,11,true,now()),(1,12,true,now()),(2,11,true,now())");
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES (101,1,'object',301),(102,1,'object',302),(103,2,'object',301),(104,1,'store',1),(105,5,'object',301),(106,1,'object',303)");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES (1,11,101,now()-interval '1 minute'),(1,12,102,now()-interval '1 minute'),(2,11,103,now()-interval '1 minute'),(5,11,105,now()-interval '1 minute'),(1,11,106,now()-interval '1 minute')");
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES (2,10,'allow',now())");
 await c.query('COMMIT');
 console.log('F03-2-1B SYNTHETIC CURRENT OBJECT/SCOPE FACTS PASS, no phone column changed');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
