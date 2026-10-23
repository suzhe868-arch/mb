import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {hashPassword} from '../../src/f03-auth-crypto.mjs';
import {assertEnvironment,assertPhysicalPg16,F03_URL,F07_URL} from './environment.mjs';

assertEnvironment();
const f03=new pg.Pool({connectionString:F03_URL,max:4});
const f07=new pg.Pool({connectionString:F07_URL,max:4});
try{
 await assertPhysicalPg16(f03,'F03');
 await f03.query(await readFile(new URL('../../f03/publisher-phone-staff-admin/schema.sql',import.meta.url),'utf8'));
 await f07.query(await readFile(new URL('../../f07/publisher-phone-scope-runtime/schema.sql',import.meta.url),'utf8'));
 await f07.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
 await assertPhysicalPg16(f07,'F07');
 await f03.query('BEGIN');
 try{
  await f03.query("INSERT INTO public.roles(role_id,role_code) VALUES (3,'manager'),(4,'store_manager') ON CONFLICT(role_id) DO NOTHING");
  await f03.query("INSERT INTO public.employees(employee_id,store_id,employment_status,receiving_status,main_role_id) VALUES (8,1,'active','receiving',3),(9,1,'active','receiving',4) ON CONFLICT(employee_id) DO NOTHING");
  const managerHash=await hashPassword('SyntheticManager_123456');
  const storeManagerHash=await hashPassword('SyntheticStoreManager_123456');
  await f03.query("INSERT INTO public.pc_login_accounts(account_id,normalized_login_key,principal_kind,employee_id,system_admin_id,password_hash,credential_state,force_password_change) "+
   "VALUES (9,'manager_test','employee',8,NULL,$1,'enabled',false),(10,'store_manager_test','employee',9,NULL,$2,'enabled',false) ON CONFLICT(account_id) DO NOTHING",
   [managerHash,storeManagerHash]);
  await f03.query("INSERT INTO public.permissions(permission_id,permission_code) VALUES (13,'publisher.phone.sensitive') ON CONFLICT(permission_id) DO NOTHING");
  await f03.query("INSERT INTO public.role_permission_defaults(role_id,permission_id,enabled,changed_at) "+
   "SELECT role_id,13,false,transaction_timestamp() FROM public.roles WHERE role_id IN (1,2,3,4) "+
   "ON CONFLICT(role_id,permission_id) DO UPDATE SET enabled=false,changed_at=transaction_timestamp()");
  await f03.query("SELECT setval(pg_get_serial_sequence('public.employee_data_scopes','scope_id'),GREATEST(COALESCE((SELECT max(scope_id) FROM public.employee_data_scopes),1),1),true)");
  await f03.query('COMMIT');
 }catch(e){await f03.query('ROLLBACK');throw e}
 await f07.query('BEGIN');
 try{
  await f07.query("INSERT INTO f07_runtime.publisher_phone_vehicles(vehicle_id,listing_cycle_id,source_platform,upstream_publisher_id,source_type,listing_status,is_current_cycle,origin) VALUES "+
   "(101,1001,'JYT','pub-locked','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(102,1002,'JYT','pub-active','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(103,1003,'JYT','pub-requested','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(104,1004,'JYT','pub-cancelled','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(105,1005,'JYT','pub-expired','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(106,1006,'JYT','pub-old-cycle','wholesale','active',false,'CI_SYNTHETIC_ONLY'),"+
   "(106,1007,'JYT','pub-current-no-lock','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(107,1008,'JYT','pub-delisted','wholesale','inactive',true,'CI_SYNTHETIC_ONLY'),"+
   "(108,1009,'JYT','pub-mingbang','mingbang','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(109,1010,'JYT','pub-four-s','four_s','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(110,1011,'OTHER','pub-other','wholesale','active',true,'CI_SYNTHETIC_ONLY'),"+
   "(111,1012,'JYT',NULL,'wholesale','active',true,'CI_SYNTHETIC_ONLY') "+
   "ON CONFLICT(vehicle_id,listing_cycle_id) DO UPDATE SET source_platform=EXCLUDED.source_platform,"+
   "upstream_publisher_id=EXCLUDED.upstream_publisher_id,source_type=EXCLUDED.source_type,"+
   "listing_status=EXCLUDED.listing_status,is_current_cycle=EXCLUDED.is_current_cycle,origin=EXCLUDED.origin");
  await f07.query("INSERT INTO f07_runtime.publisher_phone_locks(lock_id,vehicle_id,listing_cycle_id,status,expires_at,origin) VALUES "+
   "('lock-101',101,1001,'active',clock_timestamp()+interval '1 hour','CI_SYNTHETIC_ONLY'),"+
   "('lock-103',103,1003,'requested',clock_timestamp()+interval '1 hour','CI_SYNTHETIC_ONLY'),"+
   "('lock-104',104,1004,'cancelled',clock_timestamp()+interval '1 hour','CI_SYNTHETIC_ONLY'),"+
   "('lock-105',105,1005,'active',clock_timestamp()-interval '1 second','CI_SYNTHETIC_ONLY'),"+
   "('lock-106-old',106,1006,'active',clock_timestamp()+interval '1 hour','CI_SYNTHETIC_ONLY') "+
   "ON CONFLICT(lock_id) DO UPDATE SET status=EXCLUDED.status,expires_at=EXCLUDED.expires_at");
  await f07.query('COMMIT');
 }catch(e){await f07.query('ROLLBACK');throw e}
 console.log('F03_F07_ED25519_SYNTHETIC_FIXTURES_READY');
}finally{await Promise.all([f03.end(),f07.end()])}
