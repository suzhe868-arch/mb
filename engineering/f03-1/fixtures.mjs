// Disposable synthetic identities only; never emit passwords or hash values.
import {connect} from './migration.mjs';
import {hashPassword} from '../src/f03-auth-crypto.mjs';
const c=await connect();
const employees=[
 [1,1,'active','receiving',1],
 [2,null,'active','receiving',2],
 [3,1,'inactive','paused',1],
 [4,1,'active','receiving',1],
 [5,1,'active','receiving',1],
 [6,1,'active','receiving',1],
 [7,1,'active','receiving',1]
];
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.roles(role_id,role_code) VALUES (1,'sales'),(2,'four_s')");
 await c.query("INSERT INTO public.stores(store_id,store_name,status) VALUES (1,'CI synthetic store','active')");
 for(const [employee_id,store_id,employment_status,receiving_status,main_role_id] of employees)
  await c.query('INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) VALUES($1,$2,$3,$4,$5)',
    [employee_id,store_id,employment_status,receiving_status,main_role_id]);
 await c.query("INSERT INTO public.system_admins(system_admin_id,account_status,bootstrap_origin) VALUES(9,'active','bootstrap')");
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(10,'pc.four_s.vehicle.manage')");
 const values=[
  [1,'employee_test','employee',1,null,'SyntheticPassword_12345','enabled',true],
  [2,'admin_test','system_admin',null,9,'SyntheticAdmin_1234567','enabled',false],
  [3,'four_s_test','employee',2,null,'SyntheticFourS_123456','enabled',false],
  [4,'inactive_test','employee',3,null,'SyntheticInactive_123','enabled',false],
  [5,'disabled_test','employee',4,null,'SyntheticDisabled_123','disabled',true],
  [6,'http_test','employee',5,null,'SyntheticHttps_1234567','enabled',true],
  [7,'race_test','employee',6,null,'SyntheticRace_1234567','enabled',false],
  [8,'limit_test','employee',7,null,'SyntheticLimit_1234567','enabled',false]
 ];
 for(const [account_id,key,kind,employee_id,system_admin_id,pwd,state,force] of values){
  const hash=await hashPassword(pwd);
  await c.query('INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,system_admin_id,password_hash,credential_state,force_password_change) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
   [account_id,key,kind,employee_id,system_admin_id,hash,state,force]);
 }
 await c.query('COMMIT');
 console.log('F03-1 FIXTURE PASS: 8 synthetic PC identities, no credential payload output');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
