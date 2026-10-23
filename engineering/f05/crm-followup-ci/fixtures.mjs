import {connect} from './environment.mjs';
import {verifyScopeDatabase} from '../../f03/runtime-scope/readiness.mjs';
const p=await connect();
try{
 await verifyScopeDatabase(p);
 const c=await p.connect();
 try{
  await c.query('BEGIN');
  try{
   // Synthetic CI-only permission name: NOT a frozen production permission Issuer.
   await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (61,'crm.followup.create')");
   await c.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES "+
    "(1,61,false,now()),(2,61,true,now()),(3,61,true,now()),(4,61,true,now())");
   await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES "+
    "(6,61,'allow',now()),(2,61,'allow',now()),(7,61,'allow',now())");
   await c.query("UPDATE public.customers SET current_owner_employee_id=6,owner_assignment_state='assigned' WHERE customer_id=301");
   await c.query("UPDATE public.customers SET current_owner_employee_id=1,owner_assignment_state='assigned' WHERE customer_id=302");
   await c.query("UPDATE public.customers SET current_owner_employee_id=6,owner_assignment_state='assigned' WHERE customer_id=303");
   await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES "+
    "(701,6,'object',301),(702,10,'object',301),(703,11,'object',301),(704,7,'object',301),"+
    "(705,6,'object',302),(706,2,'object',301),(707,7,'object',302)");
   await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES "+
    "(6,61,701,now()-interval '2 minutes'),(10,61,702,now()-interval '2 minutes'),"+
    "(11,61,703,now()-interval '2 minutes'),(7,61,704,now()-interval '2 minutes'),"+
    "(6,61,705,now()-interval '2 minutes'),(2,61,706,now()-interval '2 minutes'),"+
    "(7,61,707,now()-interval '2 minutes')");
   await c.query("INSERT INTO public.customer_collaborations(collaboration_id,customer_id,employee_id,scope_json) "+
    "VALUES (701,301,7,'{\"crm_followup_write\":true,\"source\":\"CI_ONLY\"}'::jsonb)");
   await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e}
 }finally{c.release()}
 console.log('F05_CRM_SYNTHETIC_SCOPE_PERMISSION_OWNER_FIXTURES_PASS no public DDL, no real Issuer');
}finally{await p.end()}
