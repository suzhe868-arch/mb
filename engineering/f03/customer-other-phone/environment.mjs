import pg from 'pg';

export const BRANCH='refs/heads/feat/f03-customer-other-phone-manage-http-pg16-01';
export const CONSENT='I_AUTHORIZE_DISPOSABLE_F03_CUSTOMER_PHONE_ONLY';

export function assertEnvironment(env=process.env){
 const exact={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,GITHUB_EVENT_NAME:'push',F03_CUSTOMER_PHONE_CONSENT:CONSENT};
 for(const [k,v] of Object.entries(exact))if(env[k]!==v)throw Error('CUSTOMER_PHONE_ENV_DENY_'+k);
 if(!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA||'')||!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('CUSTOMER_PHONE_RUN_SEAL_REQUIRED');
 let u;try{u=new URL(env.F03_1_DATABASE_URL||'')}catch{throw Error('CUSTOMER_PHONE_DATABASE_URL_REQUIRED')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f03_auth_test'||decodeURIComponent(u.username)!=='f03_ci'||!u.password||u.search||u.hash)throw Error('CUSTOMER_PHONE_DATABASE_TARGET_DENIED');
 return true;
}
export async function connect(){
 assertEnvironment();
 const pool=new pg.Pool({connectionString:process.env.F03_1_DATABASE_URL,max:8,connectionTimeoutMillis:3000});
 try{
  const c=await pool.connect();
  try{
   const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr")).rows[0];
   if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su!==false||x.cdb!==false||x.cr!==false)throw Error('CUSTOMER_PHONE_PG16_IDENTITY_DENIED');
   const n=(await c.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
   if(n!==81)throw Error('CUSTOMER_PHONE_SG01_81_TABLES_REQUIRED');
   const seal=(await c.query('SELECT run_id FROM public.f03_isolation_seal')).rows;
   if(seal.length!==1||seal[0].run_id!==process.env.GITHUB_RUN_ID)throw Error('CUSTOMER_PHONE_PARENT_RUN_SEAL_DENIED');
   const namespaces=(await c.query("SELECT count(*)::int n FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%'")).rows[0].n;
   if(namespaces!==0)throw Error('CUSTOMER_PHONE_NONPUBLIC_SCHEMA_DENIED');
  }finally{c.release()}
  return pool;
 }catch(e){await pool.end();throw e}
}
