// F06-4A: isolated synthetic Transaction cancellation; public M94 structure is frozen.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as parentVerify} from '../refund-pending-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const BRANCH='refs/heads/feat/f06-4a-transaction-cancel-ci';
const REQUIRED={GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,F03_1_DATABASE_URL:DSN,
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function gate(){
 for(const [k,v] of Object.entries(REQUIRED))if(process.env[k]!==v)throw Error('F06_4A_ISOLATION_REQUIRED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_4A_UNSIGNED_RUN');
}
let queue=Promise.resolve();
export function withF063C1(fn){
 const work=queue.then(async()=>{const old=process.env.GITHUB_REF;try{
  process.env.GITHUB_REF='refs/heads/feat/f06-3c1-refund-pending-close-ci';return await fn();
 }finally{process.env.GITHUB_REF=old}});
 queue=work.catch(()=>{});return work;
}
export async function connect(){
 gate();const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:3000,query_timeout:90000});
 await c.connect();try{
 const x=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd")).rows[0];
 if(x.db!=='f03_auth_test'||x.u!=='f03_ci'||x.su||x.cd||x.v<160000||x.v>=170000)throw Error('F06_4A_NONPRIVILEGED_PG16_REQUIRED');
 return c;
 }catch(e){await c.end();throw e}
}
async function signed(c){
 gate();
 const parent=await withF063C1(()=>parentVerify(c));
 if(!parent.verified||parent.publicCatalogSHA!=='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')throw Error('F06_4A_PARENT_SEAL_DRIFT');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_4A_24_SIGNED_LEDGER_REQUIRED');
 const ps=(await c.query('SELECT source_sha256 FROM f06_3c1_ci.attestation')).rows;
 if(ps.length!==1)throw Error('F06_4A_REFUND_PARENT_MISSING');
 const schema=(await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions'")).rows.map(x=>x.column_name);
 for(const field of ['transaction_id','source_lock_id','vehicle_id','customer_id','listing_cycle_id','status','responsible_employee_id','completed_at'])if(!schema.includes(field))throw Error('F06_4A_TRANSACTION_CARRIER_GAP_'+field);
 // Public M94 has a text status but no signed CHECK for terminal transitions or cancellation reason.
 // Do not invent production-grade status authority; cancellation is CI-only with an immutable Sidecar.
 const constraint=(await c.query("SELECT pg_get_constraintdef(oid) def FROM pg_constraint WHERE conrelid='public.transactions'::regclass AND contype='c'")).rows.map(x=>x.def).join(' ');
 const carrier=constraint.includes('cancelled')&&constraint.includes('in_progress')?
  'M94_PUBLIC_CANCELLED_REASON_SIDECAR_CI_ONLY':'TRANSACTION_CANCEL_CARRIER_SOURCE_GAP_CI_ONLY';
 return {catalog:parent.publicCatalogSHA,ledger:digest(ledger),parentSha:ps[0].source_sha256,carrier};
}
export async function verify(c){
 const p=await signed(c);
 const a=(await c.query('SELECT * FROM f06_4a_ci.attestation')).rows;
 if(a.length!==1||a[0].seal_name!=='F06_4A_CI_ONLY'||a[0].source_sha256!==checksum||
 a[0].public_catalog_sha256!==p.catalog||a[0].old_ledger_sha256!==p.ledger||
 a[0].parent_f06_3c1_sha256!==p.parentSha)throw Error('F06_4A_SIDECAR_SIGNATURE_DRIFT');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_4A_PUBLIC_STRUCTURE_DRIFT');
 return {verified:true,carrier:p.carrier,productionIssuer:'SOURCE_GAP',permissionIssuer:'SOURCE_GAP',parent:p.parentSha,sourceSHA:checksum};
}
export async function apply(c,{inject=false}={}){
 const p=await signed(c);
 if((await c.query("SELECT to_regnamespace('f06_4a_ci')::text n")).rows[0].n)throw Error('F06_4A_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261014,6401)');
  await c.query(SQL);
  await c.query("INSERT INTO f06_4a_ci.attestation(seal_name,source_sha256,public_catalog_sha256,old_ledger_sha256,parent_f06_3c1_sha256) VALUES('F06_4A_CI_ONLY',$1,$2,$3,$4)",[checksum,p.catalog,p.ledger,p.parentSha]);
  if(inject)throw Error('F06_4A_INJECTED_MIGRATION_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_4A_PUBLIC_DDL_FORBIDDEN');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
