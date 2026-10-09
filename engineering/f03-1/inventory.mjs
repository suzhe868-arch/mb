import {connect,checksum} from './migration.mjs';
const c=await connect();
try{
 const [{rows:columns},{rows:constraints},{rows:indexes},{rows:versions},{rows:tables},{rows:identity}]=await Promise.all([
  c.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position"),
  c.query("SELECT conrelid::regclass::text AS table_name,conname,contype,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conrelid::regclass::text,conname"),
  c.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname"),
  c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations UNION ALL SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id"),
  c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"),
  c.query("SELECT current_database() AS database_name,current_user AS db_user,current_setting('server_version_num')::integer AS version_num")
 ]);
 console.log(JSON.stringify({kind:'F03_1_PG16_SCHEMA_ONLY',identity:identity[0],tables:tables.length,columns:columns.length,constraints:constraints.length,indexes:indexes.length,additionChecksum:checksum,versionChain:versions,columnsDetail:columns,constraintDetail:constraints,indexDetail:indexes},null,2));
}finally{await c.end()}
