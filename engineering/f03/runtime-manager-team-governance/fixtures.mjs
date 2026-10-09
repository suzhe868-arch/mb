// Entirely synthetic additions to F03-2-2E isolated PG16 fixture; no inherited privilege defaults.
import {connect} from '../runtime-handover-ledger/migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('SG04_DISPOSABLE_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.teams(team_id,store_id,team_status) VALUES(904,1,'active'),(905,1,'inactive')");
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) VALUES (903,5,now()-interval '2 minutes',9),(903,7,now()-interval '2 minutes',9),(904,5,now()-interval '2 minutes',9),(904,7,now()-interval '2 minutes',9)");
 await c.query("UPDATE public.teams SET membership_version=2 WHERE team_id IN(903,904)");
 await c.query('COMMIT');
 console.log('SG04_ONLY_EXPLICIT_CURRENT_TEAM_MEMBERS_SYNTHETIC_NO_DEFAULT_MANAGER_PERMISSIONS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}