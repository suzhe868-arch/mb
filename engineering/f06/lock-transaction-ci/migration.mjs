// F06-3B: only signed disposable PG16, never production.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as parentVerify,verifyComposite as parentVerifyComposite} from '../deposit-ledger-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {assertCompositeSignedPG} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const BRANCH='refs/heads/feat/f06-3b-lock-transaction-ci';
const required={GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',
 GITHUB_EVENT_NAME:'push',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,
 F03_1_DATABASE_URL:DSN,
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export function gate(){
 for(const [k,v] of Object.entries(required))if(process.env[k]!==v)throw Error('F06_3B_ISOLATION_REQUIRED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_3B_UNSIGNED_RUN');
}
let parentQueue=Promise.resolve();
export function withF063A(fn){
 const work=parentQueue.then(async()=>{
  const old=process.env.GITHUB_REF;
  try{process.env.GITHUB_REF='refs/heads/feat/f06-3a-deposit-ledger-ci';return await fn()}
  finally{process.env.GITHUB_REF=old}
 });
 parentQueue=work.catch(()=>{});
 return work;
}
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function connect(){
 gate();const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:3000,query_timeout:90000});
 await c.connect();
 try{
 const x=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb")).rows[0];
 if(x.db!=='f03_auth_test'||x.u!=='f03_ci'||x.su||x.cdb||x.ver<160000||x.ver>=170000)throw Error('F06_3B_NONPRIVILEGED_PG16_REQUIRED');
 return c;
 }catch(e){await c.end();throw e}
}
async function signed(c,mode='CI_LEGACY'){
 const p=mode==='COMPOSITE_NONPROD_SIGNED_V1'
  ?(await assertCompositeSignedPG(c),await parentVerifyComposite(c))
  :(gate(),await withF063A(()=>parentVerify(c)));
 if(!p.verified||p.publicCatalogSHA!=='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')throw Error('F06_3B_SIGNED_PARENT_REQUIRED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_3B_OLD_LEDGER_INCOMPLETE');
 const p1=(await c.query('SELECT source_sha256 FROM f06_1_lock_ci.attestation')).rows;
 const p2=(await c.query('SELECT source_sha256 FROM f06_2_ci.attestation')).rows;
 const p3=(await c.query('SELECT sidecar_source_sha256 FROM f06_3a_ci.attestation')).rows;
 if(p1.length!==1||p2.length!==1||p3.length!==1)throw Error('F06_3B_PARENT_ATTESTATION_MISSING');
 return {catalog:p.publicCatalogSHA,ledger:hash(ledger),f1:p1[0].source_sha256,f2:p2[0].source_sha256,f3:p3[0].sidecar_source_sha256};
}
export async function verify(c){
 const p=await signed(c);
 const a=(await c.query('SELECT * FROM f06_3b_ci.attestation')).rows;
 if(a.length!==1||a[0].seal_name!=='F06_3B_CI_ONLY_SIDECAR'||a[0].source_sha256!==checksum||
 a[0].public_catalog_sha256!==p.catalog||a[0].migration_ledger_sha256!==p.ledger||
 a[0].f06_1_sha256!==p.f1||a[0].f06_2_sha256!==p.f2||a[0].f06_3a_sha256!==p.f3)
 throw Error('F06_3B_SIDECAR_DRIFT');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_3B_PUBLIC_CATALOG_CHANGED');
 return {verified:true,nonProduction:true,carrier:'SIGNED_PUBLIC_IN_PROGRESS_CI_ONLY',productionIssuer:'SOURCE_GAP',sourceSHA:checksum,...p};
}
async function applyByMode(c,{inject=false}={},mode){
 const p=await signed(c,mode);
 if((await c.query("SELECT to_regnamespace('f06_3b_ci')::text n")).rows[0].n)throw Error('F06_3B_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
 await c.query('SELECT pg_advisory_xact_lock(20261014,6302)');
 await c.query(SQL);
 await c.query("INSERT INTO f06_3b_ci.attestation(seal_name,source_sha256,public_catalog_sha256,migration_ledger_sha256,f06_1_sha256,f06_2_sha256,f06_3a_sha256) VALUES('F06_3B_CI_ONLY_SIDECAR',$1,$2,$3,$4,$5,$6)",
 [checksum,p.catalog,p.ledger,p.f1,p.f2,p.f3]);
 if(inject)throw Error('F06_3B_INJECTED_MIGRATION_ROLLBACK');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_3B_MIGRATION_PUBLIC_CHANGED');
 await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyByMode(c,mode);
}
export async function verify(c){return verifyByMode(c,'CI_LEGACY')}
export async function apply(c,options={}){return applyByMode(c,options,'CI_LEGACY')}
export async function verifyComposite(c){return verifyByMode(c,'COMPOSITE_NONPROD_SIGNED_V1')}
export async function applyComposite(c,options={}){return applyByMode(c,options,'COMPOSITE_NONPROD_SIGNED_V1')}
