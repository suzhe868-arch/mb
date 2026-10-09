// CI-only second independent System Admin for real concurrent transactions.
import {connect} from '../../f03/runtime-scope/migration.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
if(process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true')throw Error('F03_2_2A_CI_ONLY');
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.system_admins(system_admin_id,account_status,bootstrap_origin,created_by_system_admin_id) VALUES(10,'active','created',9)");
 const hash=await hashPassword('SyntheticGovAdminTwo_2026');
 await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,system_admin_id,password_hash,credential_state,force_password_change) VALUES(9,'gov_admin_two','system_admin',10,$1,'enabled',false)",[hash]);
 await c.query('COMMIT');
 console.log('F03-2-2A second synthetic System Admin fixture PASS, no passwords printed');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
