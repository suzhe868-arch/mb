// 真实 Node/PG16 服务只能运行在明确的、可销毁的本地测试环境。
const fail=(x)=>{throw Error(x)};
export function assertF06TestEnvironment(env=process.env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
  env.F06_LOCK_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY')fail('F06_LOCK_TEST_ENV_REQUIRED');
 const raw=env.F06_LOCK_DATABASE_URL;
 if(typeof raw!=='string')fail('F06_LOCK_DATABASE_REQUIRED');
 let url;try{url=new URL(raw)}catch{fail('F06_LOCK_INVALID_DATABASE_URL')}
 if(!['postgresql:','postgres:'].includes(url.protocol)||url.hostname!=='127.0.0.1'||
  url.port!=='5432'||url.pathname!=='/f06_lock_test'||url.username!=='f06_lock_ci'||
  !url.password||url.search||url.hash)fail('F06_LOCK_DISPOSABLE_DATABASE_REQUIRED');
 return Object.freeze({connectionString:raw});
}
export async function verifyF06TestDatabase(pool){
 if(typeof pool?.query!=='function')throw Error('F06_LOCK_PG_POOL_REQUIRED');
 const x=(await pool.query(`SELECT current_database() AS db,current_user AS role,
  current_setting('server_version_num')::integer AS version,
  (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser,
  (SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS createdb,
  to_regclass('f06_real_lock_test.customer_sessions') IS NOT NULL AS sessions,
  to_regclass('f06_real_lock_test.employee_sessions') IS NOT NULL AS employees,
  to_regclass('f06_real_lock_test.request_keys') IS NOT NULL AS requests,
  to_regclass('f06_real_lock_test.lock_snapshots') IS NOT NULL AS locks,
  to_regclass('f06_real_lock_test.waitlist_sources') IS NOT NULL AS waitlists,
  to_regclass('public.vehicles') IS NOT NULL AS vehicles,
  to_regclass('public.lock_requests') IS NOT NULL AS public_requests,
  to_regclass('public.locks') IS NOT NULL AS public_locks,
  to_regclass('public.waitlists') IS NOT NULL AS public_waitlists,
  to_regclass('public.f03_schema_migrations') IS NOT NULL AS signed_ledger,
  to_regclass('public.pc_login_accounts') IS NOT NULL AS pc_accounts,
  to_regclass('public.employee_capability_scope_bindings') IS NOT NULL AS scoped_capabilities,
  to_regclass('public.f05_3a_member_create_licenses') IS NOT NULL AS four_s_boundary,
  to_regclass('public.f05_7_result_versions_ci') IS NOT NULL AS match_source,
  to_regclass('public.f05_8_priority_ci') IS NOT NULL AS priority_source,
  to_regclass('public.f05_8_events_ci') IS NOT NULL AS priority_events,
  to_regclass('public.f05_9_recommendation_facts_ci') IS NOT NULL AS recommendation_source,
  to_regclass('public.customer_phone_facts') IS NOT NULL AS phone_facts,
  to_regclass('public.vehicle_price_history') IS NOT NULL AS price_history,
  to_regclass('public.vehicle_visibility_grants') IS NOT NULL AS visibility_grants`)).rows[0];
 if(!x||x.db!=='f06_lock_test'||x.role!=='f06_lock_ci'||x.superuser!==false||x.createdb!==false||
  x.version<160000||x.version>=170000||
  ['sessions','employees','requests','locks','waitlists','vehicles','public_requests','public_locks','public_waitlists','signed_ledger','pc_accounts','scoped_capabilities','four_s_boundary','match_source','priority_source','priority_events','recommendation_source','phone_facts','price_history','visibility_grants'].some(k=>x[k]!==true))
  throw Error('F06_LOCK_PG16_SHAPE_NOT_VERIFIED');
 return true;
}