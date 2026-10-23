import pg from 'pg';
export const BRANCH='refs/heads/feat/f03-f07-publisher-phone-ed25519-nonprod-01';
export const F03_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
export const F07_URL='postgres://f07_runtime_ci:f07_runtime_only@127.0.0.1:5432/f07_runtime_test';
export const CONSENT='I_AUTHORIZE_F03_F07_ED25519_CI_ONLY';
export function assertEnvironment(env=process.env){
 const exact={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,
  F03_1_DATABASE_URL:F03_URL,DATABASE_URL:F07_URL,
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F03_F07_ED25519_CONSENT:CONSENT};
 for(const [key,value] of Object.entries(exact))if(env[key]!==value)throw Error('F03_F07_ENV_DENY_'+key);
 if(!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA||'')||!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('F03_F07_RUN_SEAL_REQUIRED');
 if(!/^[A-Za-z0-9+/]{43}=$/.test(env.F03_1_HMAC_KEY_BASE64||'')||Buffer.from(env.F03_1_HMAC_KEY_BASE64,'base64').length!==32)throw Error('F03_F07_HMAC_SECRET_REQUIRED');
 if(!env.F03_F07_TLS_KEY_PATH||!env.F03_F07_TLS_CERT_PATH)throw Error('F03_F07_TLS_REQUIRED');
 for(const key of ['F06_COMPOSITE_TEST_CONSENT','F06_LOCK_TEST_CONSENT','F05_D1_BUSINESS_TEST_RUNTIME','F05_REAL_CATALOG_ENABLE','F03_1_ENABLE_ISOLATED_AUTH'])
  if(env[key]!==undefined)throw Error('F03_F07_COMBINED_RUNTIME_FORBIDDEN_'+key);
 return true;
}
export async function assertPhysicalPg16(pool,kind){
 assertEnvironment();
 const expected=kind==='F03'?{db:'f03_auth_test',user:'f03_ci'}:kind==='F07'?{db:'f07_runtime_test',user:'f07_runtime_ci'}:null;
 if(!expected)throw Error('F03_F07_DATABASE_KIND_INVALID');
 const q=await pool.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int version,"+
  "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,"+
  "(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb,"+
  "(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) createrole,"+
  "(SELECT oid::text FROM pg_database WHERE datname=current_database()) database_oid");
 const x=q.rows[0];
 if(x.db!==expected.db||x.usr!==expected.user||x.version<160000||x.version>=170000||
  x.superuser!==false||x.createdb!==false||x.createrole!==false)throw Error('F03_F07_PG16_IDENTITY_DENIED_'+kind);
 if(kind==='F03'){
  const seal=await pool.query('SELECT run_id FROM public.f03_isolation_seal');
  const n=await pool.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'");
  if(seal.rowCount!==1||seal.rows[0].run_id!==process.env.GITHUB_RUN_ID||n.rows[0].n!==81)
   throw Error('F03_F07_F03_PARENT_SEAL_DENIED');
 }else{
  const seal=await pool.query("SELECT count(*)::int n FROM pg_namespace WHERE nspname='f07_runtime'");
  if(seal.rows[0].n!==1)throw Error('F03_F07_F07_GUARD_SCHEMA_REQUIRED');
 }
 return {db:x.db,user:x.usr,version:x.version,superuser:x.superuser,createdb:x.createdb,createrole:x.createrole,databaseOid:x.database_oid};
}
export async function connectPools(){
 assertEnvironment();
 const f03=new pg.Pool({connectionString:F03_URL,max:6,connectionTimeoutMillis:2500});
 const f07=new pg.Pool({connectionString:F07_URL,max:6,connectionTimeoutMillis:2500});
 try{const [identityF03,identityF07]=await Promise.all([assertPhysicalPg16(f03,'F03'),assertPhysicalPg16(f07,'F07')]);
  if(identityF03.databaseOid===identityF07.databaseOid)throw Error('F03_F07_DATABASE_ISOLATION_REQUIRED');
  return {f03,f07,identityF03,identityF07};
 }catch(e){await Promise.all([f03.end(),f07.end()]);throw e}
}
