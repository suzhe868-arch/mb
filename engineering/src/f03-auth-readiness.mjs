// Runtime-only clone of frozen F02 physical fingerprint algorithm: dist-safe.
import {createHash} from 'node:crypto';
const queries=[
  ["relation",`SELECT c.relname AS name, c.relkind::text || '|' || CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid,true) ELSE '' END AS definition
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'`],
  ["column",`SELECT c.relname || '.' || a.attname AS name,
        format_type(a.atttypid,a.atttypmod) || '|notnull=' || a.attnotnull::text ||
        '|identity=' || a.attidentity::text || '|generated=' || a.attgenerated::text ||
        '|collation=' || a.attcollation::text || '|default=' || COALESCE(pg_get_expr(d.adbin,d.adrelid),'') AS definition
      FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
      JOIN pg_namespace n ON n.oid=c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE n.nspname='public' AND a.attnum>0 AND NOT a.attisdropped`],
  ["constraint",`SELECT COALESCE(NULLIF(c.conrelid,0)::regclass::text,'DOMAIN') || '.' || c.conname AS name,
        c.contype::text || '|deferrable=' || c.condeferrable::text || '|deferred=' || c.condeferred::text ||
        '|validated=' || c.convalidated::text || '|' || pg_get_constraintdef(c.oid,true) AS definition
      FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public'`],
  ["index",`SELECT i.indexrelid::regclass::text AS name, pg_get_indexdef(i.indexrelid) ||
        '|unique=' || i.indisunique::text || '|valid=' || i.indisvalid::text ||
        '|ready=' || i.indisready::text AS definition
      FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public'`],
  ["function",`SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS name,
        pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'`],
  ["trigger",`SELECT c.relname || '.' || t.tgname AS name, pg_get_triggerdef(t.oid,true) || '|enabled=' || t.tgenabled::text AS definition
      FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND NOT t.tgisinternal`],
  ["type",`SELECT t.typname AS name, t.typtype::text || '|base=' || format_type(t.typbasetype,t.typtypmod) ||
        '|notnull=' || t.typnotnull::text || '|enum=' ||
        COALESCE((SELECT string_agg(e.enumlabel,',' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid),'') AS definition
      FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
      WHERE n.nspname='public' AND t.typtype IN ('e','d','r','m')`],
  ["sequence",`SELECT s.schemaname || '.' || s.sequencename AS name,
        s.data_type || '|start=' || s.start_value::text || '|min=' || s.min_value::text ||
        '|max=' || s.max_value::text || '|increment=' || s.increment_by::text ||
        '|cycle=' || s.cycle::text || '|cache=' || s.cache_size::text AS definition
      FROM pg_sequences s WHERE s.schemaname='public'`],
  ["policy",`SELECT c.relname || '.' || p.polname AS name,
        p.polcmd::text || '|permissive=' || p.polpermissive::text || '|roles=' || p.polroles::text ||
        '|using=' || COALESCE(pg_get_expr(p.polqual,p.polrelid),'') ||
        '|check=' || COALESCE(pg_get_expr(p.polwithcheck,p.polrelid),'') AS definition
      FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public'`],
  ["rule",`SELECT c.relname || '.' || r.rulename AS name, pg_get_ruledef(r.oid,true) AS definition
      FROM pg_rules x JOIN pg_class c ON c.relname=x.tablename
      JOIN pg_namespace n ON n.oid=c.relnamespace
      JOIN pg_rewrite r ON r.ev_class=c.oid AND r.rulename=x.rulename
      WHERE n.nspname='public' AND x.schemaname='public'`],
  ["extension",`SELECT e.extname AS name, e.extversion AS definition
      FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE n.nspname='public'`],
  ["operator",`SELECT o.oprname || '(' || format_type(o.oprleft,NULL) || ',' || format_type(o.oprright,NULL) || ')' AS name,
        o.oprcode::regproc::text AS definition
      FROM pg_operator o JOIN pg_namespace n ON n.oid=o.oprnamespace WHERE n.nspname='public'`],
  ["collation",`SELECT c.collname AS name, c.collprovider::text || '|deterministic=' || c.collisdeterministic::text AS definition
      FROM pg_collation c JOIN pg_namespace n ON n.oid=c.collnamespace WHERE n.nspname='public'`],
  ["conversion",`SELECT c.conname AS name, c.conproc::regproc::text AS definition
      FROM pg_conversion c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public'`],
  ["opclass",`SELECT c.opcname AS name, c.opcmethod::text || '|type=' || c.opcintype::text AS definition
      FROM pg_opclass c JOIN pg_namespace n ON n.oid=c.opcnamespace WHERE n.nspname='public'`],
  ["opfamily",`SELECT f.opfname AS name, f.opfmethod::text AS definition
      FROM pg_opfamily f JOIN pg_namespace n ON n.oid=f.opfnamespace WHERE n.nspname='public'`],
  ["tsconfig",`SELECT c.cfgname AS name, c.cfgparser::text AS definition
      FROM pg_ts_config c JOIN pg_namespace n ON n.oid=c.cfgnamespace WHERE n.nspname='public'`],
  ["tsdict",`SELECT d.dictname AS name, d.dicttemplate::text || '|' || COALESCE(d.dictinitoption,'') AS definition
      FROM pg_ts_dict d JOIN pg_namespace n ON n.oid=d.dictnamespace WHERE n.nspname='public'`],
  ["tsparser",`SELECT p.prsname AS name, p.prsstart::text AS definition
      FROM pg_ts_parser p JOIN pg_namespace n ON n.oid=p.prsnamespace WHERE n.nspname='public'`],
  ["tstemplate",`SELECT t.tmplname AS name, t.tmpllexize::text AS definition
      FROM pg_ts_template t JOIN pg_namespace n ON n.oid=t.tmplnamespace WHERE n.nspname='public'`]
];
export async function getPublicStructure(client){
  const objects=[];
  for(const [kind,sql] of queries){
    const res=await client.query(sql);
    for(const row of res.rows)objects.push({kind,name:row.name,definition:row.definition??''});
  }
  objects.sort((a,b)=>[a.kind,a.name,a.definition].join('\0').localeCompare([b.kind,b.name,b.definition].join('\0'),'en'));
  const sha256=createHash('sha256').update(JSON.stringify(objects)).digest('hex');
  return {sha256,objectCount:objects.length,objects};
}

const F02_SUM='df078212b95701af12144a43ef85a70fc491e5dca9948644df415bd888c5b4e4';
const F02_STRUCTURE='d5535d72fe17d7981b006bcd1223eb11cb67660b53e7603f1125bfab8dba9cde';
const F03_SUM='3d7f0a539941e4089147a9c7a82ecfdb2ccebd64ba513e01deeb0fcf1d2bd6ab';
export async function verifyAuthDatabase(pool,{env=process.env,connectionString=env.F03_1_DATABASE_URL}={}){
 const exact={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY'};
 for(const [k,v] of Object.entries(exact))if(env[k]!==v)throw Error('F03_AUTH_GUARD_ENV_'+k);
 if(!/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''))throw Error('F03_AUTH_GUARD_RUN_ID');
 let u;try{u=new URL(connectionString)}catch{throw Error('F03_AUTH_GUARD_URL')}
 if(!['postgres:','postgresql:'].includes(u.protocol)||u.hostname!=='127.0.0.1'||u.port!=='5432'||u.pathname!=='/f03_auth_test'||decodeURIComponent(u.username)!=='f03_ci'||!u.password||u.search||u.hash)throw Error('F03_AUTH_GUARD_TARGET');
 const c=await pool.connect();let begun=false;
 try{
  await c.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');begun=true;
  const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,(SELECT count(*)::int FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%') ns")).rows[0];
  if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su!==false||x.cdb!==false||x.cr!==false||x.ns!==0)throw Error('F03_AUTH_GUARD_DB_IDENTITY');
  const names=(await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public'")).rows.map(z=>z.tablename);
  if(names.length!==80||!['f02_schema_migrations','f03_schema_migrations','f03_isolation_seal','pc_auth_sessions','pc_login_accounts'].every(z=>names.includes(z)))throw Error('F03_AUTH_GUARD_TABLES');
  const f02=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations')).rows;
  const f03=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations')).rows;
  const seal=(await c.query('SELECT run_id,f02_checksum,f02_structure_sha256,base_structure_sha256 FROM public.f03_isolation_seal')).rows;
  if(f02.length!==1||f02[0].migration_id!=='000001_current_initial'||f02[0].checksum!==F02_SUM||f02[0].structure_sha256!==F02_STRUCTURE||
     f03.length!==1||f03[0].migration_id!=='000002_pc_auth_sessions'||f03[0].checksum!==F03_SUM||!/^[0-9a-f]{64}$/.test(f03[0].structure_sha256)||
     seal.length!==1||seal[0].run_id!==env.GITHUB_RUN_ID||seal[0].f02_checksum!==F02_SUM||seal[0].f02_structure_sha256!==F02_STRUCTURE||
     !/^[0-9a-f]{64}$/.test(seal[0].base_structure_sha256))throw Error('F03_AUTH_GUARD_VERSION_OR_SEAL');
  const s=await getPublicStructure(c);
  if(s.sha256!==f03[0].structure_sha256)throw Error('F03_AUTH_GUARD_PHYSICAL_DRIFT');
  await c.query('COMMIT');begun=false;return true;
 }catch(e){if(begun)await c.query('ROLLBACK');throw e}finally{c.release()}
}
