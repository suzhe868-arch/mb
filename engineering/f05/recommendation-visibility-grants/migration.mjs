// F05-9 CI-only v25; signed M94..v24 required, never production.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,verify as verifyV24,ID as priorId,checksum as priorChecksum} from '../priority-arbitration-ttl-handover/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export {connect};
export const ID='000025_recommendation_visibility_ci_only';
export const SQL=await readFile(new URL('./000025_recommendation_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const sha=x=>createHash('sha256').update(JSON.stringify(x.map(r=>[r.migration_id,r.checksum,r.structure_sha256]))).digest('hex');
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))if(process.env[k]!==v)throw Error('F05_9_CI_GATE_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
  throw Error('F05_9_PRODUCTION_DATABASE_DENIED');
}
async function prior(c,done){
 gate();
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length!==(done?23:22)||rows[21]?.migration_id!==priorId||rows[21]?.checksum!==priorChecksum||
    (done&&(rows[22]?.migration_id!==ID||rows[22]?.checksum!==checksum)))
  throw Error('F05_9_SIGNED_V24_LEDGER_REQUIRED');
 return rows;
}
export async function verify(c){
 const rows=await prior(c,true);
 const att=(await c.query('SELECT * FROM public.f05_9_migration_attestation')).rows[0];
 if(!att||att.seal_key!=='M94_TO_V24_SIGNED_LEDGER'||att.preceding_records_sha256!==sha(rows.slice(0,22))||
 att.prior_checksum_sha256!==priorChecksum||att.prior_structure_sha256!==rows[21].structure_sha256)
  throw Error('F05_9_SIGNED_PRECEDING_LEDGER_DRIFT');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!==rows[22].structure_sha256)throw Error('F05_9_CATALOG_DRIFT');
 return {verified:true,checksum,id:ID,precedingLedgerSHA:att.preceding_records_sha256,catalogSHA:catalog.sha256};
}
export async function apply(c,{inject=false}={}){
 const rows=await prior(c,false);
 const old=await verifyV24(c);
 if(!old.verified||old.catalogSHA!==rows[21].structure_sha256)throw Error('F05_9_PREVIOUS_V24_NOT_SIGNED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,925)');
  const before=await getPublicStructure(c);
  if(before.sha256!==old.catalogSHA)throw Error('F05_9_OLD_PHYSICAL_SCHEMA_DRIFT');
  await c.query(SQL);
  await c.query('INSERT INTO public.f05_9_migration_attestation(seal_key,preceding_records_sha256,prior_checksum_sha256,prior_structure_sha256) VALUES($1,$2,$3,$4)',
    ['M94_TO_V24_SIGNED_LEDGER',sha(rows),priorChecksum,before.sha256]);
  if(inject)throw Error('F05_9_TEST_INJECTED_ROLLBACK');
  const after=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',
    [ID,checksum,after.sha256]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
