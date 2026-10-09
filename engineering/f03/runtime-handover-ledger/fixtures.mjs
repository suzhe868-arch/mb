// Synthetic CI-only handover owner snapshots. No production, no domain adapter.
import {connect} from './migration.mjs';
if(process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true')throw Error('F03_2E_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("UPDATE public.employees SET main_role_id=31 WHERE employee_id=6");
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(6,13,'allow',now()) ON CONFLICT (employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()");
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) VALUES (901,5,now()-interval '2 minutes',9),(901,6,now()-interval '2 minutes',9),(901,7,now()-interval '2 minutes',9),(901,4,now()-interval '2 minutes',9)");
 await c.query("UPDATE public.teams SET membership_version=4 WHERE team_id=901");
 await c.query("UPDATE public.customers SET current_owner_employee_id=7,owner_assignment_state='assigned' WHERE customer_id IN(301,302)");
 await c.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES(401,301,7,'active','{}'::jsonb)");
 await c.query('COMMIT');
 console.log('F03_2E_SYNTHETIC_MATCHED_CUSTOMER_DEMAND_AND_SCOPE_ONLY_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
