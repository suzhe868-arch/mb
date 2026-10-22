import {readFile} from 'node:fs/promises';
import pg from 'pg';

export const BRANCH='refs/heads/feat/f03-f04-publisher-phone-staff-admin-http-pg16-01';
const permitted={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,GITHUB_EVENT_NAME:'push'};
export function assertEnvironment(env=process.env) {
  for(const [k,v] of Object.entries(permitted))if(env[k]!==v)throw Error('PHONE_ADMIN_ENV_DENY_'+k);
  if(!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA||'')||!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('PHONE_ADMIN_RUN_SEAL_REQUIRED');
  if(env.F03_PUBLISHER_PHONE_ADMIN_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F03_PHONE_ADMIN_ONLY')throw Error('PHONE_ADMIN_CONSENT_REQUIRED');
  const u=new URL(env.F03_1_DATABASE_URL||'');
  if(u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f03_auth_test'||u.username!=='f03_ci'||!u.password||u.search||u.hash)throw Error('PHONE_ADMIN_DB_REFUSED');
  return true;
}
async function identity(c) {
  const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr")).rows[0];
  if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su!==false||x.cdb!==false||x.cr!==false)throw Error('PHONE_ADMIN_PG16_IDENTITY_REFUSED');
  const n=(await c.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
  if(n!==81)throw Error('PHONE_ADMIN_F03_SG01_81_TABLES_REQUIRED');
  const s=(await c.query('SELECT run_id FROM public.f03_isolation_seal')).rows;
  if(s.length!==1||s[0].run_id!==process.env.GITHUB_RUN_ID)throw Error('PHONE_ADMIN_PARENT_RUN_SEAL_DENY');
}
export async function bootstrap({pool}) {
  assertEnvironment();
  const c=await pool.connect();
  try {
    await c.query('BEGIN');
    await identity(c);
    const old=(await c.query("SELECT count(*)::int n FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%'")).rows[0].n;
    if(old!==0)throw Error('PHONE_ADMIN_PRIVATE_SCHEMA_MUST_START_EMPTY');
    await c.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
    await c.query('COMMIT');
    return true;
  }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}
export async function connect() {
  assertEnvironment();
  const pool=new pg.Pool({connectionString:process.env.F03_1_DATABASE_URL,max:6,connectionTimeoutMillis:3000});
  try{const c=await pool.connect();try{await identity(c)}finally{c.release()}return pool}catch(e){await pool.end();throw e}
}
