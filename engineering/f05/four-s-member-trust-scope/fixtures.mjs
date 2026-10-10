// CI-only synthetic vehicle model/catalog. DOES NOT grant 4S license, permission or owner.
import {connect} from './migration.mjs';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
const c=await connect();try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.vehicle_brands(brand_id,brand_name,status) VALUES(97001,'Synthetic 4S Brand','active')");
 await c.query("INSERT INTO public.vehicle_series(series_id,brand_id,series_name,status) VALUES(97002,97001,'Synthetic Verified Series','active')");
 await c.query("INSERT INTO public.vehicle_models(model_id,brand_id,series_id,model_name,model_year,profile_status) VALUES(97003,97001,97002,'Synthetic Verified 2026 Model',2026,'complete')");
 await c.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) VALUES(8,NULL,'active','receiving',2)");
 const hash=await hashPassword('SyntheticOtherFourS_123456');
 await c.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,password_hash,credential_state,force_password_change) VALUES(10,'other_four_s_test','employee',8,$1,'enabled',false)",[hash]);
 await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES(8,10,'allow',now())");
 await c.query('COMMIT');console.log('F05_3A_ONLY_SYNTHETIC_MODEL_FK_EXISTS_NO_ADMIN_OR_MEMBER_LICENSE_SEEDED');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
