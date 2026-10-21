// F06-1 only, never a public M94/v25/v26 schema or production issuer change.
import pg from 'pg';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {verify as verifyV26} from '../../f05/consultation-assignee-sla/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {assertCompositeSignedPG} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
const DATABASE_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REQUIRED={CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
 GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/feat/f06-1-lockrequest-approval-waitlist-ci'};
export function gate(){
 for(const [k,v] of Object.entries(REQUIRED))if(process.env[k]!==v)throw Error('F06_1_NOT_ISOLATED_'+k);
 if(process.env.F03_1_DATABASE_URL!==DATABASE_URL||process.env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||
 !/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_1_PRODUCTION_OR_UNSIGNED_JOB_DENIED');
}
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
export async function connect(){gate();const c=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:3000,query_timeout:90000});await c.connect();try{const x=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb")).rows[0];if(x.db!=='f03_auth_test'||x.u!=='f03_ci'||x.su||x.cdb||x.ver<160000||x.ver>=170000)throw Error('F06_1_NON_PRIVILEGED_PG16_REQUIRED');return c}catch(e){await c.end();throw e}}
async function signed(c,mode='CI_LEGACY'){
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')await assertCompositeSignedPG(c);else gate();const v=await verifyV26(c);if(!v.verified)throw Error('F06_1_OLD_SIGNED_V26_REQUIRED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_1_OLD_24_LEDGER_REQUIRED');
 const d1=(await c.query('SELECT seal_name,sidecar_source_sha256,prior_ledger_sha256,old_public_catalog_sha256 FROM d1_owner_ci.attestation')).rows;
 if(d1.length!==1||d1[0].seal_name!=='D1_INDEPENDENT_FROM_SIGNED_V25'||d1[0].old_public_catalog_sha256!==ledger[22].structure_sha256)throw Error('F06_1_D1_SIGNATURE_REQUIRED');
 return {catalog:v.catalogSHA,ledgerSha:hash(ledger),d1Sha:hash(d1),priorChecksum:v.checksum};
}
async function verifyByMode(c,mode){
 const prior=await signed(c,mode);
 const att=(await c.query("SELECT seal_name,source_sha256,signed_public_catalog_sha256,signed_ledger_sha256,d1_attestation_sha256 FROM f06_1_lock_ci.attestation")).rows;
 if(att.length!==1||att[0].seal_name!=='F06_1_CI_ONLY_V27_SIDECAR'||att[0].source_sha256!==checksum||
 att[0].signed_public_catalog_sha256!==prior.catalog||att[0].signed_ledger_sha256!==prior.ledgerSha||
 att[0].d1_attestation_sha256!==prior.d1Sha)throw Error('F06_1_SIDECAR_SIGNED_BASELINE_DRIFT');
 if((await getPublicStructure(c)).sha256!==prior.catalog)throw Error('F06_1_PUBLIC_CATALOG_MUTATED');
 return {verified:true,sourceSHA:checksum,publicCatalogSha256:prior.catalog,signedLedgerSha256:prior.ledgerSha,d1AttestationSha256:prior.d1Sha,physicalCarrier:'PUBLIC_M94_WITH_CI_ONLY_SIDECAR',nonProduction:true};
}
async function applyByMode(c,{inject=false}={},mode){
 const old=await signed(c,mode);
 const existing=(await c.query("SELECT to_regnamespace('f06_1_lock_ci')::text name")).rows[0].name;
 if(existing)throw Error('F06_1_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261013,6101)');
  await c.query(SQL);
  await c.query("INSERT INTO f06_1_lock_ci.attestation(seal_name,source_sha256,signed_public_catalog_sha256,signed_ledger_sha256,d1_attestation_sha256) VALUES('F06_1_CI_ONLY_V27_SIDECAR',$1,$2,$3,$4)",[checksum,old.catalog,old.ledgerSha,old.d1Sha]);
  if(inject)throw Error('F06_1_TEST_INJECTED_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==old.catalog)throw Error('F06_1_PUBLIC_CHANGED');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyByMode(c,mode);
}
export async function verify(c){return verifyByMode(c,'CI_LEGACY')}
export async function apply(c,options={}){return applyByMode(c,options,'CI_LEGACY')}
export async function verifyComposite(c){return verifyByMode(c,'COMPOSITE_NONPROD_SIGNED_V1')}
export async function applyComposite(c,options={}){return applyByMode(c,options,'COMPOSITE_NONPROD_SIGNED_V1')}
