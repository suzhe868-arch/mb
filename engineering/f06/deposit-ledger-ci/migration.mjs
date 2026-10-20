// F06-3A synthetic PG16 only: signed F06-2 and unchanged M94->v26 chain are mandatory.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as verifyF062,verifyComposite as verifyCompositeF062} from '../lock-lifecycle-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {assertCompositeSignedPG} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
const DATABASE_URL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const BRANCH='refs/heads/feat/f06-3a-deposit-ledger-ci';
const required={GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,F03_1_DATABASE_URL:DATABASE_URL,
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export function gate(){for(const [k,v] of Object.entries(required))if(process.env[k]!==v)throw Error('F06_3A_NOT_ISOLATED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_3A_UNSIGNED_RUN_DENIED')}
let queue=Promise.resolve();
export function withF062(fn){
 const work=queue.then(async()=>{
  const old=process.env.GITHUB_REF;
  try{process.env.GITHUB_REF='refs/heads/feat/f06-2-lock-lifecycle-ci';return await fn()}
  finally{process.env.GITHUB_REF=old}
 });
 queue=work.catch(()=>{});return work;
}
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export async function connect(){
 gate();const c=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:3000,query_timeout:90000});
 await c.connect();
 try{
  const v=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb")).rows[0];
  if(v.db!=='f03_auth_test'||v.u!=='f03_ci'||v.su||v.cdb||v.ver<160000||v.ver>=170000)throw Error('F06_3A_NONPRIVILEGED_PG16_REQUIRED');return c;
 }catch(e){await c.end();throw e}
}
async function signed(c,mode='CI_LEGACY'){
 const old=mode==='COMPOSITE_NONPROD_SIGNED_V1'
  ?(await assertCompositeSignedPG(c),await verifyCompositeF062(c))
  :(gate(),await withF062(()=>verifyF062(c)));
 if(!old.verified||old.originalCatalogSHA!=='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')
  throw Error('F06_3A_SIGNED_PARENT_REQUIRED');
 const ledger=(await c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id")).rows;
 if(ledger.length!==24)throw Error('F06_3A_OLD_LEDGER_COUNT');
 const p1=(await c.query("SELECT source_sha256 FROM f06_1_lock_ci.attestation")).rows;
 const p2=(await c.query("SELECT source_sha256 FROM f06_2_ci.attestation")).rows;
 // F06-2 attestation actual field may be source_sha256, verify exact signed schema.
 if(p1.length!==1||p2.length!==1)throw Error('F06_3A_PARENT_SIDECARS_MISSING');
 return {catalog:old.originalCatalogSHA,ledger:hash(ledger),f061:p1[0].source_sha256,f062:p2[0].source_sha256};
}
async function verifyByMode(c,mode){
 const src=await signed(c,mode);
 const rows=(await c.query('SELECT * FROM f06_3a_ci.attestation')).rows;
 if(rows.length!==1||rows[0].seal_name!=='F06_3A_CI_ONLY_SIDECAR'||rows[0].sidecar_source_sha256!==checksum||
 rows[0].old_public_catalog_sha256!==src.catalog||rows[0].old_ledger_sha256!==src.ledger||
 rows[0].f06_1_source_sha256!==src.f061||rows[0].f06_2_source_sha256!==src.f062)
  throw Error('F06_3A_SIGNED_SIDECAR_DRIFT');
 if((await getPublicStructure(c)).sha256!==src.catalog)throw Error('F06_3A_PUBLIC_SCHEMA_MUTATED');
 return {verified:true,nonProduction:true,sourceSHA:checksum,parentF061:src.f061,parentF062:src.f062,ledgerSHA:src.ledger,
  publicCatalogSHA:src.catalog,financeIssuer:'SOURCE_GAP',productionCarrier:'PRODUCTION_FINANCIAL_CARRIER_GAP'};
}
async function applyByMode(c,{inject=false}={},mode){
 const src=await signed(c,mode);
 if((await c.query("SELECT to_regnamespace('f06_3a_ci')::text n")).rows[0].n)throw Error('F06_3A_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261014,6301)');
  await c.query(SQL);
  await c.query("INSERT INTO f06_3a_ci.attestation(seal_name,sidecar_source_sha256,old_public_catalog_sha256,old_ledger_sha256,f06_1_source_sha256,f06_2_source_sha256) VALUES('F06_3A_CI_ONLY_SIDECAR',$1,$2,$3,$4,$5)",[checksum,src.catalog,src.ledger,src.f061,src.f062]);
  if(inject)throw Error('F06_3A_INJECTED_MIGRATION_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==src.catalog)throw Error('F06_3A_MIGRATION_TOUCHED_PUBLIC');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyByMode(c,mode);
}
export async function verify(c){return verifyByMode(c,'CI_LEGACY')}
export async function apply(c,options={}){return applyByMode(c,options,'CI_LEGACY')}
export async function verifyComposite(c){return verifyByMode(c,'COMPOSITE_NONPROD_SIGNED_V1')}
export async function applyComposite(c,options={}){return applyByMode(c,options,'COMPOSITE_NONPROD_SIGNED_V1')}
