// Disposable PG16 synthetic state for G03 across independent Customer/Domain facts.
import {connect} from '../runtime-handover-ledger/migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('G03_CI_DISPOSABLE_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id) VALUES (4,true,1,now(),9),(6,true,1,now(),9) ON CONFLICT(employee_id) DO UPDATE SET eligible=EXCLUDED.eligible,version=public.employee_receiving_eligibility.version+1,decided_at=now()");
 await c.query("INSERT INTO public.employee_receiving_eligibility(employee_id,eligible,version,decided_at,decided_by_system_admin_id) VALUES(1,true,1,now(),9) ON CONFLICT(employee_id) DO UPDATE SET eligible=true,version=public.employee_receiving_eligibility.version+1,decided_at=now()");
 await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) VALUES (304,'active',1,'assigned',7),(305,'active',1,'assigned',7)");
 await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility) VALUES (1001,'mingbang','available','visible'),(1002,'mingbang','available','visible')");
 await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES (2001,1001,now()-interval '4 days'),(2002,1002,now()-interval '4 days')");
 await c.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json) VALUES (402,301,7,'paused','{}'::jsonb),(403,301,7,'completed','{}'::jsonb),(404,302,7,'cancelled','{}'::jsonb),(405,305,7,'active','{}'::jsonb)");
 await c.query("INSERT INTO public.demand_match_results(result_id,demand_id,vehicle_id,listing_cycle_id,match_tier,match_explanation,current_state,calculated_at) VALUES(3011,401,1001,2001,'high','{}'::jsonb,'current',now()-interval '1 hour')");
 await c.query("INSERT INTO public.priority_leases(priority_id,vehicle_id,customer_id,trigger_demand_id,status,expires_at,ended_at,listing_cycle_id,source_match_result_id) VALUES (5011,1001,301,401,'active',now()+interval '8 hours',NULL,2001,3011)");
 await c.query("INSERT INTO public.recommendations(recommendation_id,vehicle_id,customer_id,listing_cycle_id,source_demand_id,status,recommender_employee_id) VALUES (5021,1001,301,2001,401,'active',7)");
 await c.query("INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,assignee_employee_id,status,source_relation,listing_cycle_id) VALUES (5031,301,1001,7,'pending','{}'::jsonb,2001),(5032,301,1002,7,'resolved','{}'::jsonb,2002)");
 await c.query("INSERT INTO public.waitlists(waitlist_id,customer_id,vehicle_id,listing_cycle_id,responsible_employee_id,ended_at) VALUES (5041,301,1001,2001,7,NULL),(5042,301,1002,2002,7,now()-interval '1 hour')");
 await c.query("INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES (5051,1001,301,2001,'active',7,now()-interval '1 hour',now()+interval '3 hours'),(5052,1002,301,2002,'expired',7,now()-interval '4 days',now()-interval '1 day')");
 await c.query("INSERT INTO public.transactions(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) VALUES (5061,5051,301,1001,2001,'in_progress',7)");
 await c.query('COMMIT');console.log('F03_2G_DISPOSABLE_MULTIDOMAIN_SYNTHETIC_FIXTURES_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
