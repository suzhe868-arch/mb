// F05-7 isolated signed v23. Not a production migration.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,verify as verifyV22,ID as previousID,checksum as previousChecksum} from '../find-car-application-demand-eligibility/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export {connect};
export const ID='000023_deterministic_matching_ci_only';
export const SQL=await readFile(new URL('./000023_matching_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=rows=>createHash('sha256').update(JSON.stringify(rows.map(x=>[x.migration_id,x.checksum,x.structure_sha256]))).digest('hex');
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_7_CI_ONLY_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
  throw Error('F05_7_NON_DISPOSABLE_DATABASE_DENIED');
}
async function previous(c,complete){
 gate();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(complete?21:20)||rows[19]?.migration_id!==previousID||rows[19]?.checksum!==previousChecksum)
  throw Error('F05_7_SIGNED_V22_LEDGER_REQUIRED');
 const a=(await c.query('SELECT * FROM public.f05_6_migration_attestation')).rows[0];
 if(!a||a.seal_key!=='M94_TO_V21_SIGNED_LEDGER'||a.preceding_records_sha256!==digest(rows.slice(0,19)))
  throw Error('F05_7_SIGNED_PREVIOUS_ATTESTATION_TAMPERED');
 if(complete&&(rows[20]?.migration_id!==ID||rows[20]?.checksum!==checksum))throw Error('F05_7_V23_SQL_DRIFT');
 return rows;
}
export async function verify(c){
 const rows=await previous(c,true);
 const a=(await c.query('SELECT * FROM public.f05_7_migration_attestation')).rows[0];
 if(!a||a.seal_key!=='M94_TO_V22_SIGNED_LEDGER'||a.preceding_records_sha256!==digest(rows.slice(0,20))||
   a.prior_checksum_sha256!==previousChecksum||a.prior_structure_sha256!==rows[19].structure_sha256)
  throw Error('F05_7_ORIGINAL_20_SIGNED_MIGRATIONS_MUTATED');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!==rows[20].structure_sha256)throw Error('F05_7_SIGNED_CATALOG_DRIFT');
 return {verified:true,id:ID,checksum,priorSHA:digest(rows.slice(0,20)),catalogSHA:catalog.sha256};
}
export async function apply(c,{inject=false}={}){
 const rows=await previous(c,false),old=await verifyV22(c);
 if(!old.verified||old.currentCatalogSha!==rows[19].structure_sha256)throw Error('F05_7_PREVIOUS_CATALOG_NOT_SIGNED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,723)');
  const before=await getPublicStructure(c);
  if(before.sha256!==old.currentCatalogSha)throw Error('F05_7_SNAPSHOT_DRIFT');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_7_migration_attestation(seal_key,preceding_records_sha256,prior_checksum_sha256,prior_structure_sha256) VALUES($1,$2,$3,$4)',
   ['M94_TO_V22_SIGNED_LEDGER',digest(rows),previousChecksum,old.currentCatalogSha]);
  if(inject)throw Error('F05_7_INJECTED_MIGRATION_ROLLBACK');
  const after=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,after.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
