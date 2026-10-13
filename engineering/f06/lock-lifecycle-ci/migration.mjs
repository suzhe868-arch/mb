// F06-2 PG16 synthetic lock lifecycle; never a production issuer or v27 signed migration.
import pg from 'pg';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {verify as parentVerify} from '../lockrequest-approval-waitlist-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const EXACT={
 GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
 GITHUB_EVENT_NAME:'push',
 GITHUB_REF:'refs/heads/feat/f06-2-lock-lifecycle-ci',
 GITHUB_REPOSITORY:'suzhe868-arch/mb',
 F03_1_DATABASE_URL:URL
};
export function gate(){
 for(const [k,v] of Object.entries(EXACT)) if(process.env[k]!==v) throw Error('F06_2_NOT_ISOLATED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_2_UNSIGNED_RUN_DENIED');
}
let parentQueue=Promise.resolve();
export function withParentBranch(fn){
 // Serialize temporary compatibility ref overrides: concurrent PG16 backends
 // must never race over process.env in the same Node test process.
 const work=parentQueue.then(async()=>{
  const previous=process.env.GITHUB_REF;
  try{
   process.env.GITHUB_REF='refs/heads/feat/f06-1-lockrequest-approval-waitlist-ci';
   return await fn();
  }finally{process.env.GITHUB_REF=previous}
 });
 parentQueue=work.catch(()=>{});
 return work;
}
async function parent(c){gate();return withParentBranch(()=>parentVerify(c))}
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
export async function connect(){
 gate();const c=new pg.Client({connectionString:URL,connectionTimeoutMillis:3000,query_timeout:90000});await c.connect();
 try{
  const r=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb")).rows[0];
  if(r.db!=='f03_auth_test'||r.u!=='f03_ci'||r.su||r.cdb||r.v<160000||r.v>=170000) throw Error('F06_2_NATIVE_NONPRIVILEGED_PG16_REQUIRED');
  return c;
 }catch(e){await c.end();throw e}
}
export async function verify(c){
 const old=await parent(c);
 const rows=(await c.query("SELECT * FROM f06_2_ci.attestation")).rows;
 if(rows.length!==1||rows[0].seal_name!=='F06_2_CI_ONLY_V28_SIDECAR'||
 rows[0].source_sha256!==checksum||rows[0].signed_catalog_sha256!==old.publicCatalogSha256||
 rows[0].parent_sidecar_sha256!==old.sourceSHA||rows[0].original_ledger_sha256!==old.signedLedgerSha256)
 throw Error('F06_2_ATTESTATION_DRIFT');
 if((await getPublicStructure(c)).sha256!==old.publicCatalogSha256)throw Error('F06_2_SIGNED_CATALOG_DRIFT');
 return {verified:true,nonProduction:true,sidecarSHA:checksum,originalCatalogSHA:old.publicCatalogSha256,
  signedParentSidecarSHA:old.sourceSHA,originalLedgerSHA:old.signedLedgerSha256,
  financeIssuer:'PRODUCTION_DEPOSIT_ISSUER_SOURCE_GAP'};
}
export async function apply(c,{inject=false}={}){
 const old=await parent(c);
 if((await c.query("SELECT to_regnamespace('f06_2_ci')::text n")).rows[0].n)throw Error('F06_2_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261013,6102)');
  await c.query(SQL);
  await c.query("INSERT INTO f06_2_ci.attestation(seal_name,source_sha256,signed_catalog_sha256,parent_sidecar_sha256,original_ledger_sha256) VALUES('F06_2_CI_ONLY_V28_SIDECAR',$1,$2,$3,$4)",
  [checksum,old.publicCatalogSha256,old.sourceSHA,old.signedLedgerSha256]);
  if(inject)throw Error('F06_2_INJECTED_DDL_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==old.publicCatalogSha256)throw Error('F06_2_PUBLIC_CATALOG_CHANGED');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
