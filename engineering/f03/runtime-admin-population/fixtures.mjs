// Third synthetic independent Admin, CI sealed disposable PG16 only.
import {connect} from './migration.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('F03_2B_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.system_admins(system_admin_id,account_status,bootstrap_origin,created_by_system_admin_id) VALUES (11,'active','created',9)");
 const hash=await hashPassword('SyntheticThirdAdmin_2026');
 await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,system_admin_id,password_hash,credential_state,force_password_change) VALUES(10,'sg05_third_admin','system_admin',11,$1,'enabled',false)",[hash]);
 await c.query('COMMIT');
 console.log('F03-2-2B third synthetic independent Admin fixture PASS');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}