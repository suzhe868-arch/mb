import {connect} from './environment.mjs';
import {verifyScopeDatabase} from '../runtime-scope/readiness.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
const p=await connect();
try{
 await verifyScopeDatabase(p);
 const c=await p.connect();
 try{
  await c.query('BEGIN');
  try{
   await c.query("INSERT INTO public.roles(role_id,role_code) VALUES (3,'manager'),(4,'store_manager')");
   await c.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) VALUES (10,1,'active','receiving',3),(11,1,'active','receiving',4)");
   const accounts=[['manager_account_ci',10,'manager','SyntheticManager_2026!'],['store_manager_account_ci',11,'store_manager','SyntheticStoreManager_2026!']];
   let n=30;
   for(const [key,employeeId,role,password] of accounts){
    const pw=await hashPassword(password);
    await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES($1,$2,'employee',$3,$4,'enabled',false)",[n++,key,employeeId,pw]);
   }
   await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (31,'customer.account.disable')");
   await c.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) VALUES (1,31,false,now()),(2,31,true,now()),(3,31,true,now()),(4,31,true,now())");
   await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES (6,31,'allow',now()),(2,31,'allow',now())");
   await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES (304,'active',1,'unassigned')");
   await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES (201,10,'object',301),(202,11,'object',301),(203,6,'object',301),(204,2,'object',301)");
   await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES (10,31,201,now()-interval '1 minute'),(11,31,202,now()-interval '1 minute'),(6,31,203,now()-interval '1 minute'),(2,31,204,now()-interval '1 minute')");
   for(const [did,cid,state] of [[501,301,'active'],[502,301,'active'],[503,301,'paused'],[504,301,'completed'],[505,301,'cancelled'],[506,302,'active'],[507,303,'paused'],[508,304,'active']]){
    await c.query('INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$2,1,$3,$4::jsonb)',[did,cid,state,JSON.stringify({brand:'CI_SYNTHETIC'})]);
   }
   await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e}
 }finally{c.release()}
 console.log('F03_ACCOUNT_STATUS_DISPOSABLE_PG16_FIXTURES_READY: active/inactive Customer, manager/store_manager/sales/4S, explicit object scopes, mixed Demand states');
}finally{await p.end()}
