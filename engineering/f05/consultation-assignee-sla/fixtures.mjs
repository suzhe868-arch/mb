// Synthetic test-only capability facts. Values are disposable; no production identity issuer.
import {connect,verify} from './migration.mjs';
const db=await connect();
try{
 await verify(db);
 await db.query('BEGIN');
 const o=(await db.query("SELECT t.team_id,t.store_id FROM public.customers c "+
  "JOIN public.employees e ON e.employee_id=c.current_owner_employee_id "+
  "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
  "JOIN public.teams t ON t.team_id=m.team_id AND t.store_id=e.store_id "+
  "WHERE c.customer_id=899612 AND m.ended_at IS NULL ORDER BY t.team_id LIMIT 1")).rows[0];
 if(!o)throw Error('F05_10_SIGNED_F03_CUSTOMER_TEAM_NOT_FOUND');
 for(const [pid,code] of [[9105,'consultation.ci.work'],[9106,'consultation.ci.manage']]){
  await db.query('INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,$2)',[pid,code]);
 }
 for(const eid of [1,4]){
  const role=(await db.query("SELECT r.role_code,e.store_id FROM public.employees e JOIN public.roles r ON e.main_role_id=r.role_id WHERE e.employee_id=$1 AND e.employment_status='active'",[eid])).rows[0];
  if(!role||!['sales','manager','store_head'].includes(role.role_code))throw Error('F05_10_ELIGIBLE_SYNTHETIC_ACTOR_MISSING_'+eid);
  if(eid===4){
   await db.query("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from) "+
    "SELECT $1,$2,now()-interval '3 minutes' WHERE NOT EXISTS(SELECT 1 FROM public.employee_team_memberships "+
    "WHERE employee_id=$1 AND team_id=$2 AND ended_at IS NULL)",[eid,o.team_id]);
  }
  let scope=(await db.query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=$1 AND scope_kind='team' "+
   "AND scope_reference_id=$2 AND ended_at IS NULL LIMIT 1",[eid,o.team_id])).rows[0];
  if(!scope)scope=(await db.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) "+
   "VALUES($1,'team',$2) RETURNING scope_id",[eid,o.team_id])).rows[0];
  await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) "+
   "VALUES($1,9105,'allow',now())",[eid]);
  await db.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) "+
   "VALUES($1,9105,$2,now()-interval '2 minutes')",[eid,scope.scope_id]);
 }
 await db.query('COMMIT');
 console.log('F05_10_SYNTHETIC_CONSULTATION_EMPLOYEE_CAPABILITY_AND_SIGNED_OBJECT_SCOPE',JSON.stringify(o));
}catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
