import pg from 'pg';
export const BRANCH='refs/heads/feat/f03-customer-account-disable-restore-demand-pause-pg16-01';
export const CONSENT='I_AUTHORIZE_F03_CUSTOMER_ACCOUNT_STATUS_DISPOSABLE_PG16_ONLY';
export function assertEnvironment(env=process.env){
 const expected={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_EVENT_NAME:'push',GITHUB_REF:BRANCH,F03_CUSTOMER_ACCOUNT_STATUS_CONSENT:CONSENT,F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'};
 for(const [key,value] of Object.entries(expected))if(env[key]!==value)throw Error('F03_ACCOUNT_STATUS_ENV_DENIED_'+key);
 if(!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA||'')||!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('F03_ACCOUNT_STATUS_SHA_RUN_REQUIRED');
 const u=new URL(env.F03_1_DATABASE_URL||'http://invalid');
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f03_auth_test'||u.username!=='f03_ci'||!u.password||u.search||u.hash)throw Error('F03_ACCOUNT_STATUS_DATABASE_DENIED');
 return true;
}
export async function connect(){
 assertEnvironment();
 const pool=new pg.Pool({connectionString:process.env.F03_1_DATABASE_URL,max:8,connectionTimeoutMillis:3000});
 try{
  const c=await pool.connect();
  try{
   const row=(await c.query("SELECT current_database() AS db,current_user AS usr,current_setting('server_version_num')::int AS ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) AS cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) AS cr")).rows[0];
   if(row.db!=='f03_auth_test'||row.usr!=='f03_ci'||row.ver<160000||row.ver>=170000||row.su||row.cdb||row.cr)throw Error('F03_ACCOUNT_STATUS_PG16_IDENTITY_DENIED');
   const seal=(await c.query('SELECT run_id FROM public.f03_isolation_seal')).rows;
   if(seal.length!==1||seal[0].run_id!==process.env.GITHUB_RUN_ID)throw Error('F03_ACCOUNT_STATUS_PARENT_RUN_DENIED');
   if((await c.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n!==81)throw Error('F03_ACCOUNT_STATUS_FROZEN_PUBLIC_SCHEMA_REQUIRED');
  }finally{c.release()}
  return pool;
 }catch(e){await pool.end();throw e}
}
