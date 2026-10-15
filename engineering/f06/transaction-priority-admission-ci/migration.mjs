// 5C 独立只读证明及仅 CI sidecar；不接生产 Priority issuer。
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as parentVerify} from '../lock-refund-conversion-guard-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/feat/f06-5c-transaction-priority-admission-ci';
const PARENT='refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci';
const REQUIRED={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:REF,F03_1_DATABASE_URL:DSN,F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
export function gate(){
 for(const [k,v] of Object.entries(REQUIRED))if(process.env[k]!==v)throw Error('F06_5C_ISOLATION_REQUIRED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_5C_REAL_PUSH_RUN_REQUIRED');
 if(!/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA||''))throw Error('F06_5C_SHA_REQUIRED');
}
let queue=Promise.resolve();
export function withF065B(fn){
 const next=queue.then(async()=>{
  const old=process.env.GITHUB_REF,oldName=process.env.GITHUB_REF_NAME;
  try{process.env.GITHUB_REF=PARENT;process.env.GITHUB_REF_NAME=PARENT.slice(11);return await fn()}
  finally{process.env.GITHUB_REF=old;process.env.GITHUB_REF_NAME=oldName}
 });
 queue=next.catch(()=>{});
 return next;
}
export async function connect(){
 gate();const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:3000,query_timeout:90000});
 await c.connect();
 try{
  const q=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd")).rows[0];
  if(q.db!=='f03_auth_test'||q.u!=='f03_ci'||q.su||q.cd||q.v<160000||q.v>=170000)throw Error('F06_5C_NONPRIVILEGED_PG16_REQUIRED');
  return c;
 }catch(e){await c.end();throw e}
}
async function signed(c){
 gate();const p=await withF065B(()=>parentVerify(c));
 if(!p?.verified||!p.sourceSHA)throw Error('F06_5C_SIGNED_F06_5B_REQUIRED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_5C_24_MIGRATIONS_REQUIRED');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!=='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')throw Error('F06_5C_PUBLIC_CATALOG_DRIFT');
 return {parent:p.sourceSHA,catalog:catalog.sha256,ledger:digest(ledger)};
}
export async function verify(c){
 const p=await signed(c);
 const rows=(await c.query('SELECT * FROM f06_5c_ci.attestation')).rows;
 if(rows.length!==1||rows[0].seal_name!=='F06_5C_CI_ONLY'||rows[0].source_sha256!==checksum||
 rows[0].parent_f06_5b_sha256!==p.parent||rows[0].public_catalog_sha256!==p.catalog||
 rows[0].signed_ledger_sha256!==p.ledger||rows[0].production_priority_issuer!=='UNWIRED')
 throw Error('F06_5C_SIDECAR_ATTESTATION_DRIFT');
 return {verified:true,sourceSHA:checksum,parentSHA:p.parent,catalogSHA:p.catalog,ledgerSHA:p.ledger,
  productionPriorityIssuer:'UPSTREAM_PRIORITY_ADMISSION_ATOMIC_SOURCE_GAP',v1:'NOT_READY'};
}
export async function apply(c,{inject=false}={}){
 const p=await signed(c);
 if((await c.query("SELECT to_regnamespace('f06_5c_ci')::text n")).rows[0].n!==null)throw Error('F06_5C_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261014,6503)');
  await c.query(SQL);
  await c.query("INSERT INTO f06_5c_ci.attestation(seal_name,source_sha256,parent_f06_5b_sha256,public_catalog_sha256,signed_ledger_sha256) VALUES('F06_5C_CI_ONLY',$1,$2,$3,$4)",
   [checksum,p.parent,p.catalog,p.ledger]);
  if(inject)throw Error('F06_5C_INJECTED_DDL_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_5C_PUBLIC_CATALOG_CHANGED');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
