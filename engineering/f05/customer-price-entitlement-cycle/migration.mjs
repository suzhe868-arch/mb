// F05-4 CI-only v20; exact old M94 to v19 signed ledger and catalog enforced.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify as verifyV19,checksum as oldChecksum,ID as oldID,priorLedgerDigest,FROZEN_V18_STRUCTURE_SHA} from '../favorite-physical-carrier/migration.mjs';
import {checksum as v18Checksum} from '../wholesale-to-mingbang-conversion/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export {connect};
export const ID='000020_customer_price_entitlement_ci_only';
export const SQL=await readFile(new URL('./000020_price_entitlement_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const hash=rows=>createHash('sha256').update(JSON.stringify(rows.map(x=>[x.migration_id,x.checksum,x.structure_sha256]))).digest('hex');
function gate(){
 const vars={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
 for(const [k,v] of Object.entries(vars))if(process.env[k]!==v)throw Error('F05_4_CI_ONLY_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
  throw Error('F05_4_WRONG_PG16_DATABASE');
}
async function signed(c,expectV20){
 gate();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(expectV20?18:17)||rows[16]?.migration_id!==oldID||rows[16]?.checksum!==oldChecksum)
  throw Error('F05_4_REQUIRED_SIGNED_V19_HISTORY');
 if(rows[15]?.structure_sha256!==FROZEN_V18_STRUCTURE_SHA||rows[15]?.checksum!==v18Checksum)
  throw Error('F05_4_PREVIOUS_V18_TAMPERED');
 const v19=(await c.query('SELECT seal_key,preceding_records_sha256 FROM public.f05_3g_migration_attestation')).rows;
 if(v19.length!==1||v19[0].seal_key!=='M94_TO_V18_FROZEN_LEDGER'||v19[0].preceding_records_sha256!==priorLedgerDigest(rows.slice(0,16)))
  throw Error('F05_4_PREVIOUS_V19_ATTESTATION_TAMPERED');
 if(expectV20&&(rows[17]?.migration_id!==ID||rows[17]?.checksum!==checksum))
  throw Error('F05_4_V20_CHECKSUM_TAMPERED');
 return rows;
}
export async function verify(c){
 const rows=await signed(c,true);
 const seal=(await c.query('SELECT * FROM public.f05_4_migration_attestation')).rows;
 if(seal.length!==1||seal[0].seal_key!=='M94_TO_V19_SIGNED_LEDGER'||
    seal[0].preceding_records_sha256!==hash(rows.slice(0,17))||
    seal[0].prior_structure_sha256!==rows[16].structure_sha256||
    seal[0].prior_migration_checksum!==oldChecksum)
  throw Error('F05_4_FULL_HISTORY_ATTESTATION_DRIFT');
 const cat=await getPublicStructure(c);
 if(cat.sha256!==rows[17].structure_sha256)throw Error('F05_4_V20_CATALOG_DRIFT');
 for(const name of ['f05_4_level_price_policy_ci','f05_4_current_price_ci','f05_4_migration_attestation'])
  if(!cat.objects.some(o=>o.kind==='relation'&&o.name===name))throw Error('F05_4_MISSING_CI_OBJECT_'+name);
 return {verified:true,id:ID,checksum,oldSha:rows[16].structure_sha256,newSha:cat.sha256,
         precedingRecordsSha256:hash(rows.slice(0,17))};
}
export async function apply(c,{inject=false}={}){
 const rows=await signed(c,false);
 const old=await verifyV19(c);
 if(!old.verified||old.newSha!==rows[16].structure_sha256)throw Error('F05_4_REAL_V19_SEAL_REQUIRED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,420)');
  const prev=await getPublicStructure(c);
  if(prev.sha256!==old.newSha)throw Error('F05_4_PRIOR_CATALOG_DRIFT');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_4_migration_attestation(seal_key,preceding_records_sha256,prior_migration_checksum,prior_structure_sha256) VALUES($1,$2,$3,$4)',
   ['M94_TO_V19_SIGNED_LEDGER',hash(rows),oldChecksum,old.newSha]);
  if(inject)throw Error('F05_4_INJECTED_ATOMIC_ROLLBACK');
  const next=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',
   [ID,checksum,next.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e;}
 return verify(c);
}
