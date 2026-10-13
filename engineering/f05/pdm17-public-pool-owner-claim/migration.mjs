// D1 sidecar: never inserts into signed migration ledger, never changes public catalog.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {verify as verifyV25} from '../recommendation-visibility-grants/migration.mjs';
import pg from 'pg';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
// F03 signed connect strictly requires no non-public schemas. D1 only permits its own sidecar.
export async function connect(){
 gate();
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('D1_RUN_SEAL_REQUIRED');
 const c=new pg.Client({connectionString:ENV.F03_1_DATABASE_URL,connectionTimeoutMillis:3000,query_timeout:90000,statement_timeout:90000});
 await c.connect();
 try{
  const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,"+
  "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,"+
  "(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr")).rows[0];
  if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su!==false||x.cdb!==false||x.cr!==false)
   throw Error('D1_NONPRIVILEGED_PG16_REQUIRED');
  const ns=(await c.query("SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') "+
   "AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%' ORDER BY nspname")).rows.map(r=>r.nspname);
  if(ns.length>1||(ns.length===1&&ns[0]!=='d1_owner_ci'))throw Error('D1_UNAPPROVED_SCHEMA');
  return c;
 }catch(e){await c.end();throw e}
}
export const SQL=await readFile(new URL('./d1侧表.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
export const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const ENV=Object.freeze({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
 F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'});
export function gate(){for(const [k,v] of Object.entries(ENV))if(process.env[k]!==v)throw Error('D1_DISPOSABLE_GATE_'+k);}
export async function signed(c){
 gate();
 const id=(await c.query("SELECT current_database() db,current_user who,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) privileged")).rows[0];
 if(id.db!=='f03_auth_test'||id.who!=='f03_ci'||id.ver<160000||id.ver>=170000||id.privileged!==false)
  throw Error('D1_NONPRIVILEGED_PG16_REQUIRED');
 const original=await verifyV25(c);
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==23||ledger[22]?.migration_id!=='000025_recommendation_visibility_ci_only')throw Error('D1_SIGNED_V25_REQUIRED');
 return {catalog:original.catalogSHA,ledger:sha(ledger),records:ledger};
}
export async function apply(c,{inject=false}={}){
 const old=await signed(c);
 if((await c.query("SELECT 1 FROM pg_namespace WHERE nspname='d1_owner_ci'")).rowCount)throw Error('D1_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261013,1701)');
  await c.query(SQL);
  await c.query('INSERT INTO d1_owner_ci.attestation(seal_name,sidecar_source_sha256,prior_ledger_sha256,old_public_catalog_sha256) VALUES($1,$2,$3,$4)',
   ['D1_INDEPENDENT_FROM_SIGNED_V25',checksum,old.ledger,old.catalog]);
  if(inject)throw Error('D1_INJECTED_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==old.catalog)throw Error('D1_SIGNED_PUBLIC_CATALOG_CHANGED');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
export async function verify(c){
 const old=await signed(c);
 const a=(await c.query('SELECT * FROM d1_owner_ci.attestation')).rows[0];
 if(!a||a.sidecar_source_sha256!==checksum||a.prior_ledger_sha256!==old.ledger||
   a.old_public_catalog_sha256!==old.catalog)throw Error('D1_SIDECAR_SEAL_INVALID');
 const cols=(await c.query("SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='d1_owner_ci' ORDER BY table_name,column_name")).rows;
 for(const name of ['attestation','config','pool_cycles','receipts'])
  if(!cols.find(x=>x.table_name===name))throw Error('D1_SIDECAR_CATALOG_MISSING_'+name);
 return {verified:true,sourceSHA:checksum,oldPublicCatalogSHA:old.catalog,oldSignedLedgerSHA:old.ledger,
  schemaColumnSHA:sha(cols),columns:cols.length,nonPrivilegedPG16:true};
}
