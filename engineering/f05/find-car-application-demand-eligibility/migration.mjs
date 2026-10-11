import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,verify as verifyV21,ID as oldID,checksum as oldChecksum} from '../employee-price-quota-adjustment/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export {connect};
export const ID='000022_find_car_application_demand_ci_only';
export const SQL=await readFile(new URL('./000022_find_car_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const sha=rows=>createHash('sha256').update(JSON.stringify(rows.map(x=>[x.migration_id,x.checksum,x.structure_sha256]))).digest('hex');
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',NODE_ENV:'test',APP_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_6_CI_ONLY_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')throw Error('F05_6_DATABASE_IS_NOT_DISPOSABLE');
}
async function preceding(c,complete){
 gate();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(complete?20:19)||rows[18]?.migration_id!==oldID||rows[18]?.checksum!==oldChecksum)throw Error('F05_6_SIGNED_V21_REQUIRED');
 const att=(await c.query('SELECT * FROM public.f05_5_migration_attestation')).rows[0];
 if(!att||att.seal_key!=='M94_TO_V20_SIGNED_LEDGER'||att.preceding_records_sha256!==sha(rows.slice(0,18)))
  throw Error('F05_6_SIGNED_V21_PREDECESSOR_TAMPERED');
 if(complete&&(rows[19]?.migration_id!==ID||rows[19]?.checksum!==checksum))throw Error('F05_6_NEW_VERSION_CHECKSUM_DRIFT');
 return rows;
}
export async function verify(c){
 const rows=await preceding(c,true),att=(await c.query('SELECT * FROM public.f05_6_migration_attestation')).rows[0];
 if(!att||att.seal_key!=='M94_TO_V21_SIGNED_LEDGER'||att.preceding_records_sha256!==sha(rows.slice(0,19))||
  att.prior_checksum_sha256!==oldChecksum||att.prior_structure_sha256!==rows[18].structure_sha256)throw Error('F05_6_19_ORIGINAL_MIGRATION_LEDGER_TAMPERED');
 const cat=await getPublicStructure(c);
 if(cat.sha256!==rows[19].structure_sha256)throw Error('F05_6_CURRENT_SIGNED_PG_CATALOG_DRIFT');
 return {verified:true,id:ID,checksum,currentCatalogSha:cat.sha256,precedingRecordsSHA256:sha(rows.slice(0,19))};
}
export async function apply(c,{inject=false}={}){
 const rows=await preceding(c,false),old=await verifyV21(c);
 if(!old.verified||old.newSha!==rows[18].structure_sha256)throw Error('F05_6_OLD_V21_CATALOG_NOT_SIGNED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,622)');
  const before=await getPublicStructure(c);if(before.sha256!==old.newSha)throw Error('F05_6_OLD_CATALOG_CHANGED');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_6_migration_attestation(seal_key,preceding_records_sha256,prior_checksum_sha256,prior_structure_sha256) VALUES($1,$2,$3,$4)',
   ['M94_TO_V21_SIGNED_LEDGER',sha(rows),oldChecksum,old.newSha]);
  if(inject)throw Error('F05_6_INJECTED_MIGRATION_ROLLBACK');
  const after=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,after.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}