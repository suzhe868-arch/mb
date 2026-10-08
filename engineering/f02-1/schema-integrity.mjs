// Physical PostgreSQL 16 structure inventory: identity + definitions, not aggregate counts.
// All catalog reads are scoped to the disposable test database's public schema.
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
export async function requireEmptyPublicStructure(client){
  const actual=await getPublicStructure(client);
  if(actual.objectCount!==0)throw Error('F02_1_REFUSED_NONEMPTY_PUBLIC_SCHEMA: '+actual.objects.slice(0,5).map(o=>o.kind+':'+o.name).join(','));
  return actual;
}
export async function requireSamePublicStructure(client,expected){
  if(!/^[0-9a-f]{64}$/.test(expected||''))throw Error('F02_1_MISSING_STRUCTURE_BASELINE');
  const actual=await getPublicStructure(client);
  if(actual.sha256!==expected)throw Error('F02_1_PHYSICAL_OBJECT_OR_DEFINITION_DRIFT: '+actual.sha256);
  return actual;
}
