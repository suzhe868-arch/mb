import {connect} from './environment.mjs';
import {verifyScopeDatabase} from '../../f03/runtime-scope/readiness.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
const p=await connect();
try{
 await verifyScopeDatabase(p);
 const c=await p.connect();
 try{
  await c.query('BEGIN');
  try{
   // Own independent CI-only facts. Do NOT execute the prior Issue #235 fixture,
   // whose environment is deliberately signed to another branch.
   await c.query("INSERT INTO public.roles(role_id,role_code) VALUES (3,'manager'),(4,'store_manager')");
   await c.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) "+
    "VALUES (10,1,'active','receiving',3),(11,1,'active','receiving',4)");
   const accounts=[['manager_account_ci',10,'SyntheticManager_2026!'],['store_manager_account_ci',11,'SyntheticStoreManager_2026!']];
   let accountId=30;
   for(const [login,employeeId,password] of accounts){
    const hash=await hashPassword(password);
    await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) "+
     "VALUES($1,$2,'employee',$3,$4,'enabled',false)",[accountId++,login,employeeId,hash]);
   }
   await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES(304,'active',1,'unassigned')");
   for(const [did,cid,state] of [[501,301,'active'],[502,301,'active'],[503,301,'paused'],[504,301,'completed'],[505,301,'cancelled'],[506,302,'active'],[507,303,'paused'],[508,304,'active']]){
    await c.query('INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$2,1,$3,$4::jsonb)',
      [did,cid,state,JSON.stringify({synthetic:true})]);
   }
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
