// Explicit synthetic policy+permission fixture. NEVER claim production Issuer.
import {connect,verify} from './migration.mjs';
const db=await connect();
try{
 await verify(db);
 await db.query('BEGIN');
 try{
  await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(95,'customer.quota.add.ci.synthetic')");
  for(const employeeId of [1,5,6]){
   await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,95,'allow',now())",[employeeId]);
  }
  await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,95,29001,now()-interval '1 minute'),(5,95,201,now()-interval '1 minute'),(6,95,204,now()-interval '1 minute')");
  await db.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(2,'f05-5-unlimited-ci-level')");
  await db.query("INSERT INTO public.f05_4_level_price_policy_ci(level_id,price_mode,daily_base_quota) VALUES(1,'LIMITED',2),(2,'UNLIMITED',0)");
  await db.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,current_owner_employee_id,owner_assignment_state) VALUES (899511,'active',1,1,'assigned'),(899512,'active',1,1,'assigned'),(899513,'active',1,1,'assigned'),(899514,'inactive',1,1,'assigned'),(899515,'active',2,1,'assigned')");
  await db.query('COMMIT');
  console.log('F05_5_CI_SYNTHETIC_ROLE_FIXTURE_NOT_PRODUCTION');
 }catch(e){await db.query('ROLLBACK');throw e}
}finally{await db.end()}