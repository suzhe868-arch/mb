// Synthetic business publication facts. CI-only, no real customer or 4S account data.
import {connect,verify} from './migration.mjs';
const c=await connect();
try{
 await verify(c);
 await c.query('BEGIN');
 // Vehicle.read exists in F03-2D. A new local capability only for synthetic authorized
 // publication; NO production permission grant is created by this file.
 const p=(await c.query("SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.read'")).rows[0];
 if(!p)throw Error('F05_2_FROZEN_VEHICLE_READ_PERMISSION_MISSING');
 const readId=Number(p.permission_id);
 await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(399,'vehicle.manage') ON CONFLICT(permission_id) DO NOTHING");
 const manage=(await c.query("SELECT permission_id FROM public.permissions WHERE permission_code='vehicle.manage'")).rows[0];
 if(!manage||Number(manage.permission_id)!==399)throw Error('F05_2_MANAGE_CAPABILITY_CONFLICT');
 await c.query("INSERT INTO public.employee_data_scopes(scope_id,employee_id,scope_kind,scope_reference_id) VALUES (29001,1,'team',901)");
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) SELECT 901,1,now()-interval '10 minutes',9 WHERE NOT EXISTS(SELECT 1 FROM public.employee_team_memberships WHERE team_id=901 AND employee_id=1 AND ended_at IS NULL)");
 await c.query("INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) SELECT 901,5,now()-interval '10 minutes',9 WHERE NOT EXISTS(SELECT 1 FROM public.employee_team_memberships WHERE team_id=901 AND employee_id=5 AND ended_at IS NULL)");
 for(const employee of [1,5])for(const capability of [readId,399]){
  await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,$2,'allow',now()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=now()",[employee,capability]);
  await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,$2,$3,now()-interval '1 minute') ON CONFLICT(scope_id,permission_id) DO NOTHING",[employee,capability,employee===1?29001:201]);
 }
 const fixtures=[[49002,49012,'mingbang','available'],[49004,49014,'four_s','available'],[49006,49016,'wholesale','active']];
 for(const [vehicle,cycle,source,state] of fixtures){
  await c.query("INSERT INTO public.vehicles(vehicle_id,source_type,source_sale_status,platform_visibility,created_by_employee_id,formally_published_at) VALUES($1,$2,$3,'visible',1,now()-interval '1 hour')",[vehicle,source,state]);
  await c.query("INSERT INTO public.vehicle_listing_cycles(listing_cycle_id,vehicle_id,started_at) VALUES($1,$2,now()-interval '1 hour')",[cycle,vehicle]);
 }
 await c.query('COMMIT');
 console.log('F05_2_SYNTHETIC_PUBLICATION_EVENT_SOURCE_3_VEHICLES_TWO_MANUAL_TYPES_ONE_WHOLESALE_DENY');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
