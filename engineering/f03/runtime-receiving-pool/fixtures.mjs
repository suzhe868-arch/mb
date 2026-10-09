// CI-owned only, separate from frozen F03-1 fixture. No production identity or implicit eligibility seed.
import {connect} from './migration.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('F03_2C_DISPOSABLE_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 // manager and store_head physical role values are synthetic only and never assigned in base product migration.
 await c.query("INSERT INTO public.roles(role_id,role_code) VALUES(31,'manager'),(32,'store_head')");
 await c.query("UPDATE public.employees SET main_role_id=31 WHERE employee_id=5");
 await c.query("UPDATE public.employees SET main_role_id=32 WHERE employee_id=6");
 // Separate genuine normal-credential Employee used for independent pool concurrency.
 const hash=await hashPassword('SyntheticReceivingSecond_2026');
 await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES(19,'receiving_second','employee',7,$1,'enabled',false)",[hash]);
 await c.query('COMMIT');console.log('F03_2C_SYNTHETIC_ROLES_AND_SECOND_EMPLOYEE_PASS_NO_ELIGIBILITY');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
