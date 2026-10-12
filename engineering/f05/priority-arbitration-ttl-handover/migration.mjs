// F05-8: signed v23 -> isolated CI-only v24; no production migration.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,verify as verifyV23,ID as previousID,checksum as previousChecksum} from '../deterministic-matching-readiness-four-tier/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export {connect};
export const ID='000024_priority_arbitration_ci_only';
export const SQL=await readFile(new URL('./000024_priority_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=rows=>createHash('sha256').update(JSON.stringify(rows.map(x=>[x.migration_id,x.checksum,x.structure_sha256]))).digest('hex');
const gate=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'})){
  if(process.env[k]!==v)throw Error('F05_8_CI_GATE_'+k);
 }
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')throw Error('F05_8_PRODUCTION_DATABASE_DENIED');
};
async function prior(c,complete){
 gate();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(complete?22:21)||rows[20]?.migration_id!==previousID||rows[20]?.checksum!==previousChecksum)
  throw Error('F05_8_SIGNED_V23_CHAIN_REQUIRED');
 const att=(await c.query('SELECT * FROM public.f05_7_migration_attestation')).rows[0];
 if(!att||att.seal_key!=='M94_TO_V22_SIGNED_LEDGER'||att.preceding_records_sha256!==digest(rows.slice(0,20)))
  throw Error('F05_8_SIGNED_V23_ATTESTATION_DRIFT');
 if(complete&&(rows[21]?.migration_id!==ID||rows[21]?.checksum!==checksum))
  throw Error('F05_8_SIGNED_V24_SQL_DRIFT');
 return rows;
}
export async function verify(c){
 const rows=await prior(c,true);
 const att=(await c.query('SELECT * FROM public.f05_8_migration_attestation')).rows[0];
 if(!att||att.seal_key!=='M94_TO_V23_SIGNED_LEDGER'||att.preceding_records_sha256!==digest(rows.slice(0,21))||
    att.prior_checksum_sha256!==previousChecksum||att.prior_structure_sha256!==rows[20].structure_sha256)
  throw Error('F05_8_SIGNED_PRECEDING_LEDGER_DRIFT');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!==rows[21].structure_sha256)throw Error('F05_8_V24_CATALOG_DRIFT');
 return {verified:true,id:ID,checksum,previousLedgerSHA:digest(rows.slice(0,21)),catalogSHA:catalog.sha256};
}
export async function apply(c,{inject=false}={}){
 const rows=await prior(c,false),previous=await verifyV23(c);
 if(!previous.verified||previous.catalogSHA!==rows[20].structure_sha256)throw Error('F05_8_PRECEDING_V23_NOT_SIGNED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,824)');
  const pre=await getPublicStructure(c);
  if(pre.sha256!==previous.catalogSHA)throw Error('F05_8_BEFORE_SNAPSHOT_DRIFT');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_8_migration_attestation(seal_key,preceding_records_sha256,prior_checksum_sha256,prior_structure_sha256) VALUES($1,$2,$3,$4)',
   ['M94_TO_V23_SIGNED_LEDGER',digest(rows),previousChecksum,pre.sha256]);
  if(inject)throw Error('F05_8_TEST_INJECTED_TRANSACTION_ROLLBACK');
  const post=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',
   [ID,checksum,post.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
