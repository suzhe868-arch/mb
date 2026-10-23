import pg from 'pg';
export const BRANCH='refs/heads/feat/f05-crm-followup-append-http-pg16-01';
export const CONSENT='I_AUTHORIZE_F05_CRM_FOLLOWUP_DISPOSABLE_PG16_ONLY';
export function assertEnvironment(env=process.env){
 const expected={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_EVENT_NAME:'push',GITHUB_REF:BRANCH,F05_CRM_FOLLOWUP_CONSENT:CONSENT,F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'};
 for(const [key,value] of Object.entries(expected))if(env[key]!==value)throw Error('CRM_ENV_DENIED_'+key);
 if(!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA||'')||!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('CRM_SHA_RUN_DENIED');
 const u=new URL(env.F03_1_DATABASE_URL||'http://invalid');
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f03_auth_test'||u.username!=='f03_ci'||!u.password||u.search||u.hash)throw Error('CRM_DB_DENIED');
 if(!['pg16-a','pg16-b'].includes(env.F05_CRM_TRACK))throw Error('CRM_TRACK_DENIED');
 return true;
}
export async function connect(){
 assertEnvironment();
 const p=new pg.Pool({connectionString:process.env.F03_1_DATABASE_URL,max:12,connectionTimeoutMillis:4000});
 try{
  const c=await p.connect();
  try{
   const a=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) dbcreator,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) rolecreator")).rows[0];
   if(a.db!=='f03_auth_test'||a.usr!=='f03_ci'||a.ver<160000||a.ver>=170000||a.su||a.dbcreator||a.rolecreator)throw Error('CRM_PG16_IDENTITY_DENIED');
   const seal=(await c.query('SELECT run_id FROM public.f03_isolation_seal')).rows;
   if(seal.length!==1||seal[0].run_id!==process.env.GITHUB_RUN_ID)throw Error('CRM_PARENT_RUN_DENIED');
   if((await c.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n!==81)throw Error('CRM_PUBLIC_SIGNATURE_DENIED');
  }finally{c.release()}
  return p;
 }catch(e){await p.end();throw e}
}
