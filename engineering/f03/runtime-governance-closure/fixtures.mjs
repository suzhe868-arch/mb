// Genuine M94 pre-migration CI synthetic authority rows for G lifecycle.
import {connect} from '../runtime-transaction-responsible-handover/migration.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('G_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 for(const [n,role] of [[76,1],[77,31],[78,1]]){
  await c.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) VALUES($1,1,'active','paused',$2)",[n,role]);
  await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) VALUES(901,$1,clock_timestamp()-interval '5 minutes',9)",[n]);
  const password=await hashPassword('SyntheticG_Disposable_'+n+'_2026');
  await c.query("INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES($1,'employee',$2,$3,'enabled',false)",['synthetic_g_user_'+n,n,password]);
 }
 const kinds=[['planned_disable',97001,17601,37601,76],['planned_downgrade',97002,17602,37602,77],['planned_transfer',97003,17603,37603,78]];
 for(const [kind,batch,item,customer,src] of kinds){
  await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES($1,'active',1,'assigned',$2)",[customer,src]);
  await c.query("INSERT INTO public.handover_batches(batch_id,source_employee_id,change_kind,status,initiated_by_kind,initiated_by_id,client_request_key,reason) VALUES($1,$2,$3,'pending_domain_handover','employee',5,$4,'synthetic G1 provenance transfer')",[batch,src,kind,'g-initial-batch-'+batch+'-ci']);
  await c.query("INSERT INTO public.handover_items(item_id,batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id,status) VALUES($1,$2,'Customer',$3,$4,4,'pending')",[item,batch,String(customer),src]);
 }
 await c.query('COMMIT');
 console.log('G_PRE_MIGRATION_SYNTHETIC_STABLE_CUSTOMER_BATCHES_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
