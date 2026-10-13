// Synthetic CI-only pool entry and explicitly scoped authorization sources; not production PDM17 issuer.
import {connect,verify} from './migration.mjs';
const c=await connect();
try{
 await verify(c);await c.query('BEGIN');
 try{
  const manager=(await c.query("SELECT role_id FROM public.roles WHERE role_code='manager' ORDER BY role_id LIMIT 1")).rows[0];
  if(!manager)throw Error('D1_MANAGER_SIGNED_ROLE_MISSING');
  await c.query('UPDATE public.employees SET main_role_id=$1,receiving_status=$2 WHERE employee_id=1',[manager.role_id,'receiving']);
  await c.query("UPDATE public.employees SET receiving_status='receiving' WHERE employee_id=7");
  // Current F03 signed team membership must exist. Never create a fake production team.
  const m=(await c.query("SELECT t.team_id,t.store_id FROM public.teams t JOIN public.employee_team_memberships m ON m.team_id=t.team_id WHERE m.employee_id=7 AND t.team_id=901 AND m.ended_at IS NULL")).rows[0];
  if(!m)throw Error('D1_SIGNED_F03_TEAM_901_MEMBER_7_MISSING');
  const ad=(await c.query('SELECT system_admin_id FROM public.system_admins ORDER BY system_admin_id LIMIT 1')).rows[0];
  if(!ad)throw Error('D1_SIGNED_SYSTEM_ADMIN_GOVERNANCE_SOURCE_MISSING');
  await c.query("INSERT INTO public.employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id) VALUES"+
   " (1,true,1,clock_timestamp(),$1),(7,true,1,clock_timestamp(),$1)"+
   " ON CONFLICT(employee_id) DO UPDATE SET eligible=true,version=public.employee_receiving_eligibility.version+1,decided_at=clock_timestamp()",[ad.system_admin_id]);
  await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES"+
   "(1098,'public_pool.claim.ci.synthetic'),(1099,'public_pool.assign.ci.synthetic')");
  await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES"+
   "(7,1098,'allow',now()),(1,1099,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()");
  await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES"+
   "(398101,7,'team',901),(398102,1,'team',901)");
  await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES"+
   "(7,1098,398101,now()-interval '1 minute'),(1,1099,398102,now()-interval '1 minute')");
  const level=(await c.query('SELECT level_id FROM public.customer_levels ORDER BY level_id LIMIT 1')).rows[0];
  if(!level)throw Error('D1_SIGNED_CUSTOMER_LEVEL_MISSING');
  const customerIds=[989201,989202,989203,989204,989205,989206,989207,989208,989209,989210,989211,989212];
  for(const id of customerIds){
   await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES($1,'active',$2,'unassigned')",[id,level.level_id]);
   await c.query("INSERT INTO d1_owner_ci.pool_cycles(customer_id,team_id,state,synthetic_source,original_source_json,source_event_key) "+
    "VALUES($1,901,'in_pool','CI_SYNTHETIC_PDM17_POOL_ENTRY_NOT_PRODUCTION',$2::jsonb,$3)",
    [id,JSON.stringify({reason:'CI_SYNTHETIC_POOL_ENTRY_FROM_SEPARATE_PENDING_GOVERNANCE_NOT_PRODUCTION',
      originalOwner:null,customerId:id,teamId:901,version:1}), 'ci-pdm17-pool-entry-'+id]);
  }
  await c.query('INSERT INTO d1_owner_ci.config(scope_team_id,max_claims_per_day,cooldown_seconds,version) VALUES(901,99,0,1)');
  await c.query('COMMIT');
  console.log('D1_SYNTHETIC_PDM17_POOL_EXPLICIT_SOURCE',JSON.stringify({customerIds,teamId:901,storeId:Number(m.store_id),
   claimPermissionId:1098,assignPermissionId:1099,source:'CI_SYNTHETIC_AUTHORITY_ONLY / PRODUCTION_ISSUER_GAP'}));
 }catch(e){await c.query('ROLLBACK');throw e}
}finally{await c.end()}
