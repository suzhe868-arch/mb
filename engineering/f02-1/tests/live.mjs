import assert from 'node:assert/strict';
import pg from 'pg';
import {verifyF021Target} from '../guard.mjs';
const client=new pg.Client({connectionString:verifyF021Target().connectionString,application_name:'mb_f02_1_fixtures',connectionTimeoutMillis:2500});
let checks=0;
const pass=label=>{checks++;console.log('F02-1 LIVE PASS: '+label)};
async function reject(label,sql,code){
 await client.query('SAVEPOINT f02_neg');
 try{await client.query(sql);throw Error('NEGATIVE_UNEXPECTED_SUCCESS_'+label)}
 catch(e){if(e.message.startsWith('NEGATIVE_UNEXPECTED_SUCCESS_'))throw e;assert.equal(e.code,code,label);checks++;console.log('F02-1 LIVE NEGATIVE PASS: '+label+' SQLSTATE='+e.code)}
 finally{await client.query('ROLLBACK TO SAVEPOINT f02_neg')}
}
try{
 await client.connect();await client.query('BEGIN');
 await client.query("INSERT INTO public.roles(role_id,role_code) VALUES (1,'sales')");
 await client.query("INSERT INTO public.stores(store_id,store_name,status) VALUES (1,'Fixture','active')");
 await client.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id,created_at) VALUES (1,1,'active','receiving',1,now()),(2,NULL,'active','receiving',1,now())");
 await client.query("INSERT INTO public.system_admins(system_admin_id,account_status,created_at,bootstrap_origin) VALUES (1,'active',now(),'bootstrap')");
 await client.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,system_admin_id,password_hash,credential_state,force_password_change,created_at,updated_at) VALUES (1,'employee_a','employee',1,NULL,'sample_hash_a','enabled',TRUE,now(),now()),(2,'admin_a','system_admin',NULL,1,'sample_hash_b','enabled',TRUE,now(),now())");
 pass('Employee and System Admin separate identities, unified credential table');
 await reject('cross identity duplicated login',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES ('admin_a','employee',2,'hash','enabled',true)",'23505');
 await reject('duplicate admin credentials',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,system_admin_id,password_hash,credential_state,force_password_change) VALUES ('admin_b','system_admin',1,'hash','enabled',true)",'23505');
 await reject('XOR two identities',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,system_admin_id,password_hash,credential_state,force_password_change) VALUES ('bad_a','employee',2,1,'hash','enabled',true)",'23514');
 await reject('XOR no identity',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,password_hash,credential_state,force_password_change) VALUES ('bad_b','employee','hash','enabled',true)",'23514');
 await reject('principal kind mismatch',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES ('bad_c','system_admin',2,'hash','enabled',true)",'23514');
 await reject('4S cannot become third principal kind',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES ('bad_d','four_s',2,'hash','enabled',true)",'23514');
 await reject('unnormalized login disallowed',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES ('UpperCase','employee',2,'hash','enabled',true)",'23514');
 await reject('invalid employee FK',"INSERT INTO public.pc_login_accounts(normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES ('ghost','employee',9999,'hash','enabled',true)",'23503');
 await client.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES (1,'ordinary')");
 await client.query("INSERT INTO public.customers(customer_id,account_status,current_owner_employee_id,customer_level_id,created_at,owner_assignment_state) VALUES (1,'active',1,1,now(),'assigned')");
 await reject('refund XOR must have subject',"INSERT INTO public.refund_cases(refund_id,customer_id,status,created_at) VALUES (1,1,'pending',now())",'23514');
 await reject('refund statuses three-valued',"INSERT INTO public.refund_cases(refund_id,customer_id,status,created_at) VALUES (2,1,'rejected',now())",'23514');
 await client.query("INSERT INTO public.manual_vehicle_drafts(draft_id,created_by_employee_id,draft_source_type,draft_payload) VALUES (1,1,'mingbang','{}'::jsonb),(2,1,'mingbang','{}'::jsonb)");
 pass('multiple simultaneous Employee drafts supported');
 await client.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES (1,'mingbang','available','visible',now()),(2,'mingbang','available','visible',now())");
 await client.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES (1,1,now()),(2,2,now())");
 await reject('wholesale cannot receive manual-only availability',"INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES (3,'wholesale','available','visible',now())",'23514');
 await reject('hidden is not an invented platform status',"INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_at) VALUES (4,'mingbang','available','offline',now())",'23514');
 await reject('single active listing cycle',"INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES (3,1,now())",'23505');
 await reject('cross vehicle cycle mismatch',"INSERT INTO public.consultations(consultation_id,customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation) VALUES (1,1,2,1,1,'pending','{}'::jsonb)",'23503');
 await client.query("INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES (1,1,1,1,'active',1,now(),now()+interval '3 days')");
 await reject('single active lock per vehicle',"INSERT INTO public.locks(lock_id,vehicle_id,customer_id,listing_cycle_id,lock_status,responsible_employee_id,created_at,expires_at) VALUES (2,1,1,1,'active',1,now(),now()+interval '3 days')",'23505');
 await reject('closed refund needs reason',"INSERT INTO public.refund_cases(refund_id,customer_id,lock_id,status,created_at) VALUES (3,1,1,'closed',now())",'23514');
 await client.query("INSERT INTO public.refund_cases(refund_id,customer_id,lock_id,status,created_at) VALUES (4,1,1,'pending',now())");
 pass('pending refund with real Lock and same customer');
 await client.query("INSERT INTO public.demands(demand_id,customer_id,responsible_employee_id,demand_state,criteria_json,created_at) VALUES (1,1,1,'active','{}'::jsonb,now())");
 await client.query("INSERT INTO public.demand_match_results(result_id,demand_id,vehicle_id,listing_cycle_id,match_tier,match_explanation,current_state,calculated_at) VALUES (1,1,1,1,'high','{}','current',now())");
 await reject('match result cannot use invented tier',"INSERT INTO public.demand_match_results(result_id,demand_id,vehicle_id,listing_cycle_id,match_tier,match_explanation,current_state,calculated_at) VALUES (2,1,2,2,'nearest','{}','current',now())",'23514');
 await reject('one current match per demand vehicle cycle',"INSERT INTO public.demand_match_results(result_id,demand_id,vehicle_id,listing_cycle_id,match_tier,match_explanation,current_state,calculated_at) VALUES (3,1,1,1,'high','{}','current',now())",'23505');
 const u=(await client.query("SELECT COUNT(*)::integer AS n FROM pg_indexes WHERE schemaname='public' AND indexdef ILIKE '%unique%'")).rows[0].n;
 assert.ok(u>=20);pass('unique indexes exist: '+u);
 await client.query('ROLLBACK');
 console.log('F02-1 LIVE PHYSICAL TESTS PASS: '+checks+' fixture checks; rolled back all user data');
}catch(e){try{await client.query('ROLLBACK')}catch{}console.error('F02-1 LIVE FAIL:',e.message);process.exitCode=1}finally{try{await client.end()}catch{}}
