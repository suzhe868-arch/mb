// F05-5 CI-only signed M94-v20 to additive 000021 history and PG catalog seal.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,verify as verifyV20,ID as priorID,checksum as priorChecksum} from '../customer-price-entitlement-cycle/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export {connect};
export const ID='000021_employee_quota_addition_ci_only';
export const SQL=await readFile(new URL('./000021_ci_employee_quota.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=rs=>createHash('sha256').update(JSON.stringify(rs.map(x=>[x.migration_id,x.checksum,x.structure_sha256]))).digest('hex');
const gated=()=>{
 const keys={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
 for(const [k,v] of Object.entries(keys))if(process.env[k]!==v)throw Error('F05_5_ISOLATED_CI_ONLY_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')throw Error('F05_5_UNTRUSTED_DATABASE');
};
async function chain(c,full){
 gated();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(full?19:18)||rows[17]?.migration_id!==priorID||rows[17]?.checksum!==priorChecksum)
  throw Error('F05_5_FULL_SIGNED_V20_REQUIRED');
 const att=(await c.query('SELECT * FROM public.f05_4_migration_attestation')).rows;
 if(att.length!==1||att[0].seal_key!=='M94_TO_V19_SIGNED_LEDGER'||att[0].preceding_records_sha256!==digest(rows.slice(0,17)))
  throw Error('F05_5_V20_PRIOR_LEDGER_TAMPERED');
 if(full&&(rows[18]?.migration_id!==ID||rows[18]?.checksum!==checksum))
  throw Error('F05_5_VERSION_CHECKSUM_CHANGED');
 return rows;
}
export async function verify(c){
 const rows=await chain(c,true);
 const att=(await c.query('SELECT * FROM public.f05_5_migration_attestation')).rows;
 if(att.length!==1||att[0].seal_key!=='M94_TO_V20_SIGNED_LEDGER'||
  att[0].preceding_records_sha256!==digest(rows.slice(0,18))||
  att[0].prior_checksum_sha256!==priorChecksum||
  att[0].prior_structure_sha256!==rows[17].structure_sha256)
  throw Error('F05_5_PRIOR_18_VERSIONS_ATTESTATION_TAMPERED');
 const cat=await getPublicStructure(c);
 if(cat.sha256!==rows[18].structure_sha256)throw Error('F05_5_CURRENT_CATALOG_TAMPERED');
 return {verified:true,id:ID,checksum,previousSha:rows[17].structure_sha256,newSha:cat.sha256,fullPriorHistorySha256:digest(rows.slice(0,18))};
}
export async function apply(c,{inject=false}={}){
 const rows=await chain(c,false);
 const old=await verifyV20(c);
 if(!old.verified||old.newSha!==rows[17].structure_sha256)throw Error('F05_5_V20_CATALOG_NOT_SIGNED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,521)');
  const cat=await getPublicStructure(c);
  if(cat.sha256!==old.newSha)throw Error('F05_5_V20_CHANGED_DURING_MIGRATION');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_5_migration_attestation(seal_key,preceding_records_sha256,prior_checksum_sha256,prior_structure_sha256) VALUES($1,$2,$3,$4)',
   ['M94_TO_V20_SIGNED_LEDGER',digest(rows),priorChecksum,old.newSha]);
  if(inject)throw Error('F05_5_INJECTED_ROLLBACK');
  const next=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',
   [ID,checksum,next.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}