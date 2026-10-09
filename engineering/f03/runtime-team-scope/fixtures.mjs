// Synthetic team permissions only in disposable CI. No manager default grant or real accounts.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('F03_2D_DISPOSABLE_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.teams(team_id,store_id,team_status) VALUES(901,1,'active'),(902,1,'inactive'),(903,1,'active')");
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(13,'employee.manage'),(14,'vehicle.read')");
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,13,'allow',now())");
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES(201,5,'team',901),(202,5,'team',903),(203,5,'store',1),(204,6,'team',901)");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,13,201,now()-interval '1 minute'),(5,14,202,now()-interval '1 minute'),(5,13,203,now()-interval '1 minute'),(6,13,204,now()-interval '1 minute')");
 await c.query('COMMIT');
 console.log('F03_2D_SYNTHETIC_EXPLICIT_TEAM_SCOPE_FIXTURES_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}