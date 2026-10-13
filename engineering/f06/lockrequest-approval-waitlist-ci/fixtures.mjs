// F06-1 synthetic and disposable native PG16 seed only. No real person, phone or issuer.
import {connect,verify} from './migration.mjs';
const c=await connect();
const customers=[86180101,86180102,86180103,86180104,86180105,86180106,86180107,86180108,86180109,86180110,86180111];
const vehicles=[86181101,86181102,86181103,86181104,86181105,86181106,86181107,86181108];
try{
 await verify(c);
 await c.query('BEGIN');
 const origin=(await c.query("SELECT t.team_id,t.store_id FROM public.employee_team_memberships m "+
  "JOIN public.teams t ON t.team_id=m.team_id WHERE m.employee_id=1 "+
  "AND m.ended_at IS NULL AND t.team_status='active' ORDER BY t.team_id LIMIT 1")).rows[0];
 if(!origin)throw Error('F06_1_MISSING_SIGNED_TEAM_CONTEXT');
 const act=(await c.query("SELECT role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE employee_id=1 AND employment_status='active'")).rows[0];
 const own=(await c.query("SELECT role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE employee_id=4 AND employment_status='active'")).rows[0];
 if(!act||!own||!['sales','manager','store_head'].includes(act.role_code)||!['sales','manager','store_head'].includes(own.role_code))
  throw Error('F06_1_INVALID_REAL_SIGNED_EMPLOYEE_OWNER');
 const permission=961801;
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES($1,'lock.ci.approve')",[permission]);
 let sc=(await c.query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' "+
  "AND scope_reference_id=$1 AND ended_at IS NULL LIMIT 1",[origin.team_id])).rows[0];
 if(!sc)sc=(await c.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id) VALUES(1,'team',$1) RETURNING scope_id",[origin.team_id])).rows[0];
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(1,$1,'allow',clock_timestamp())",[permission]);
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,clock_timestamp()-interval '2 minutes')",[permission,sc.scope_id]);
 const mem=(await c.query("SELECT 1 FROM public.employee_team_memberships WHERE employee_id=4 AND team_id=$1 AND valid_from<=clock_timestamp() AND (ended_at IS NULL OR ended_at>clock_timestamp())",[origin.team_id])).rows[0];
 if(!mem)await c.query("INSERT INTO public.employee_team_memberships(employee_id,team_id,valid_from) VALUES(4,$1,clock_timestamp()-interval '2 minutes')",[origin.team_id]);
 for(const id of customers){
  await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state,current_owner_employee_id) "+
    "VALUES($1,'active',1,'assigned',4)",[id]);
  await c.query("INSERT INTO public.customer_phone_facts(customer_id,phone_ciphertext,valid_from) VALUES($1,decode(repeat('ab',16),'hex'),clock_timestamp()-interval '1 day')",[id]);
 }
 for(let i=0;i<vehicles.length;i++){
  const vid=vehicles[i],cy=86182101+i;
  await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id) "+
   "VALUES($1,'mingbang','available','visible',1)",[vid]);
  await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,clock_timestamp()-interval '1 day')",[cy,vid]);
 }
 await c.query("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES($1,'customer_display',6500000,clock_timestamp()-interval '1 day')",[vehicles[0]]);
 await c.query('COMMIT');
 console.log('F06_1_CI_SYNTHETIC_ONLY_SIGNED_EMPLOYEE_CAR_CUSTOMER_PHONE_FACTS',{team:Number(origin.team_id),customers:customers.length,vehicles:vehicles.length});
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
