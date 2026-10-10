// CI-only non-production price projection fixtures.
import {connect} from '../runtime-transaction-responsible-handover/migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('P_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.customer_levels(level_id,level_code) VALUES(32001,'synthetic_fan'),(32002,'synthetic_vip')");
 await c.query("INSERT INTO public.customers(customer_id,account_status,customer_level_id,owner_assignment_state) VALUES(33001,'active',1,'unassigned'),(33002,'active',32001,'unassigned'),(33003,'active',32002,'unassigned')");
 await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,vin) VALUES (39001,'wholesale','active','visible','PRIVATE_VIN_NOT_TO_RETURN'),(39002,'mingbang','available','visible','NEVER_PUBLIC'),(39003,'wholesale','active','hidden','HIDDEN_VIN'),(39004,'wholesale','active','visible','NO_PRICE'),(39005,'four_s','available','visible','FOUR_S_SECRET')");
 await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES (49001,39001,now()-interval '1 hour'),(49002,39002,now()-interval '1 hour'),(49003,39003,now()-interval '1 hour'),(49004,39004,now()-interval '1 hour'),(49005,39005,now()-interval '1 hour')");
 await c.query("INSERT INTO public.vehicle_price_history(vehicle_id,price_kind,amount_cents,valid_from) VALUES (39001,'customer_display',9880000,now()-interval '1 hour'),(39001,'wholesale_internal',9100000,now()-interval '1 hour'),(39002,'customer_display',12880000,now()-interval '1 hour'),(39003,'customer_display',7800000,now()-interval '1 hour'),(39005,'customer_display',10200000,now()-interval '1 hour')");
 // Only the disposable CI manager may read generic CRM results.
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(5,12,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()");
 await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(5,12,201,now()-interval '2 minute')");
 await c.query('COMMIT');console.log('P_ISOLATED_PG16_SYNTHETIC_FIXTURE_PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
