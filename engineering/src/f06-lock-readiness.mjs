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
  to_regclass('public.waitlists') IS NOT NULL AS public_waitlists`)).rows[0];
 if(!x||x.db!=='f06_lock_test'||x.role!=='f06_lock_ci'||x.superuser!==false||x.createdb!==false||
  x.version<160000||x.version>=170000||
  ['sessions','employees','requests','locks','waitlists','vehicles','public_requests','public_locks','public_waitlists'].some(k=>x[k]!==true))
  throw Error('F06_LOCK_PG16_SHAPE_NOT_VERIFIED');
 return true;
}