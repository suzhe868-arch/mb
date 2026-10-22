// Disposable test-only phone capability: already-known catalog code, never a new permission.
import {connect,bootstrap} from './migration.mjs';
const pool=await connect();
try {
 await bootstrap({pool});
 const c=await pool.connect();
 try {
  await c.query('BEGIN');
  await c.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES(13,'publisher.phone.sensitive')");
  await c.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) SELECT role_id,13,false,now() FROM public.roles");
  await c.query("SELECT setval(pg_get_serial_sequence('public.employee_data_scopes','scope_id'),GREATEST(COALESCE((SELECT max(scope_id) FROM public.employee_data_scopes),1),1),true)");
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
 console.log('PHONE_ADMIN_CI_ONLY_CAPABILITY_FACTS_READY');
}finally{await pool.end()}
