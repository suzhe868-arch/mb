// Synthetic permission facts, no production grants; existing normative internal.price.view only.
import {connect} from './migration.mjs';
const db=await connect();
try{
 await db.query('BEGIN');
 const old=(await db.query("SELECT permission_id FROM public.permissions WHERE permission_code='internal.price.view'")).rows[0];
 if(!old){
  await db.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(398,'internal.price.view')");
 }
 const perm=(await db.query("SELECT permission_id FROM public.permissions WHERE permission_code='internal.price.view'")).rows[0];
 // Grant only current synthetic Mingbang employee/team; independent of vehicle.manage.
 await db.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision) VALUES(1,$1,'allow') ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow'",[perm.permission_id]);
 const scope=(await db.query("SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=1 AND scope_kind='team' AND scope_reference_id=901 AND ended_at IS NULL")).rows[0];
 if(!scope)throw Error('F05_EDIT_SYNTHETIC_SCOPE_MISSING');
 await db.query('INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES(1,$1,$2,now()-interval \'1 minute\') ON CONFLICT(scope_id,permission_id) DO NOTHING',
 [perm.permission_id,scope.scope_id]);
 await db.query('COMMIT');
 console.log('F05_EDIT_EXISTING_NORMATIVE_INTERNAL_PRICE_VIEW_SYNTHETIC_PERMISSION_READY');
}catch(e){await db.query('ROLLBACK');throw e}finally{await db.end()}
