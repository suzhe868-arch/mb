// CI-owned only, separate from frozen F03-1 fixture. No production identity or implicit eligibility seed.
import {connect} from './migration.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('F03_2C_DISPOSABLE_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 // manager and store_head physical role values are synthetic only and never assigned in base product migration.
 await c.query("INSERT INTO public.roles(role_id,role_code) VALUES(31,'manager'),(32,'store_head')");
 await c.query("UPDATE public.employees SET main_role_id=31 WHERE employee_id=5");
 await c.query("UPDATE public.employees SET main_role_id=32 WHERE employee_id=6");
 // Reuse F03-1's existing genuine normal employee7 account; no duplicate identity.
 await c.query('COMMIT');console.log('F03_2C_SYNTHETIC_ROLES_AND_SECOND_EMPLOYEE_PASS_NO_ELIGIBILITY');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
