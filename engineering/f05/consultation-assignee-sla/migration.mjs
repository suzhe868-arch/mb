// F05-10 signed v25 -> disposable v26, never production.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {verify as priorVerify,ID as priorId,checksum as priorChecksum} from '../recommendation-visibility-grants/migration.mjs';
import {connect} from '../pdm17-public-pool-owner-claim/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export {connect}; // D1 schema-safe nonprivileged PG16, never bypass the signed v25/v26 ledger.
export const ID='000026_consultation_ci_only';
export const SQL=await readFile(new URL('./000026_consultation_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const ledgerSha=rows=>createHash('sha256').update(JSON.stringify(rows.map(r=>[r.migration_id,r.checksum,r.structure_sha256]))).digest('hex');
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_10_CI_GATE_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
  throw Error('F05_10_PRODUCTION_DB_DENIED');
}
async function prior(c,done){
 gate();
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(done?24:23)||rows[22]?.migration_id!==priorId||rows[22]?.checksum!==priorChecksum||
  (done&&(rows[23]?.migration_id!==ID||rows[23]?.checksum!==checksum)))
  throw Error('F05_10_SIGNED_M94_TO_V25_LEDGER_REQUIRED');
 return rows;
}
export async function verify(c){
 const rows=await prior(c,true);
 const attest=(await c.query('SELECT * FROM public.f05_10_migration_attestation')).rows[0];
 if(!attest||attest.seal_key!=='M94_TO_V25_SIGNED_LEDGER'||
  attest.preceding_records_sha256!==ledgerSha(rows.slice(0,23))||
  attest.prior_checksum_sha256!==priorChecksum||
  attest.prior_structure_sha256!==rows[22].structure_sha256)
  throw Error('F05_10_PRECEDING_LEDGER_DRIFT');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!==rows[23].structure_sha256)throw Error('F05_10_CATALOG_DRIFT');
 return {verified:true,id:ID,checksum,precedingLedgerSHA:attest.preceding_records_sha256,catalogSHA:catalog.sha256};
}
export async function apply(c,{inject=false}={}){
 const rows=await prior(c,false);
 const old=await priorVerify(c);
 if(!old.verified||old.catalogSHA!==rows[22].structure_sha256)throw Error('F05_10_V25_NOT_SIGNED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261013,1026)');
  const catalog=await getPublicStructure(c);
  if(catalog.sha256!==old.catalogSHA)throw Error('F05_10_PREVIOUS_CATALOG_DRIFT');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_10_migration_attestation VALUES($1,$2,$3,$4)',
   ['M94_TO_V25_SIGNED_LEDGER',ledgerSha(rows),priorChecksum,catalog.sha256]);
  if(inject)throw Error('F05_10_TEST_INJECTED_ROLLBACK');
  const after=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',
   [ID,checksum,after.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
