// F06-4B signed sidecar, real disposable f03_ci PostgreSQL16 only.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as parentVerify} from '../transaction-cancel-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/feat/f06-4b-transaction-handoff-ci';
const required={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',CI:'true',APP_ENV:'test',NODE_ENV:'test',
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:REF,F03_1_DATABASE_URL:DSN,
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function gate(){for(const [k,v] of Object.entries(required))if(process.env[k]!==v)throw Error('F06_4B_ISOLATION_REQUIRED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_4B_UNSIGNED_RUN');}
let queue=Promise.resolve();
export function withF064A(fn){
 const work=queue.then(async()=>{const prev=process.env.GITHUB_REF;try{
 process.env.GITHUB_REF='refs/heads/feat/f06-4a-transaction-cancel-ci';return await fn();
 }finally{process.env.GITHUB_REF=prev}});
 queue=work.catch(()=>{});return work;
}
export async function connect(){
 gate();const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:3000,query_timeout:90000});
 await c.connect();try{
 const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) super,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb")).rows[0];
 if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.super||x.cdb||x.v<160000||x.v>=170000)throw Error('F06_4B_NATIVE_NONPRIVILEGED_PG16_REQUIRED');return c;
 }catch(e){await c.end();throw e}
}
async function signed(c){
 const p=await withF064A(()=>parentVerify(c));
 if(!p.verified||p.sourceSHA===null)throw Error('F06_4B_PARENT_F06_4A_REQUIRED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_4B_LEDGER_24_REQUIRED');
 const p3=(await c.query('SELECT source_sha256 FROM f06_3b_ci.attestation')).rows;
 if(p3.length!==1)throw Error('F06_4B_3B_ORIGIN_SIGNATURE_MISSING');
 const cols=(await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions'")).rows.map(x=>x.column_name);
 for(const col of ['transaction_id','vehicle_id','source_lock_id','customer_id','listing_cycle_id','status','responsible_employee_id'])if(!cols.includes(col))throw Error('F06_4B_PUBLIC_CARRIER_GAP_'+col);
 const signedF03M=(await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='transaction_responsible_handover_receipts'")).rows.map(x=>x.column_name);
 return {catalog:'5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4',ledger:digest(ledger),
  parentSha:p.sourceSHA,originSha:p3[0].source_sha256,f03MReceiptCarrier:signedF03M.length>0};
}
export async function verify(c){
 gate();const p=await signed(c);
 const a=(await c.query("SELECT * FROM f06_4b_ci.attestation")).rows;
 if(a.length!==1||a[0].seal_name!=='F06_4B_CI_ONLY'||a[0].source_sha256!==checksum||
 a[0].public_catalog_sha256!==p.catalog||a[0].old_ledger_sha256!==p.ledger||
 a[0].parent_f06_4a_sha256!==p.parentSha||a[0].parent_f06_3b_sha256!==p.originSha)
 throw Error('F06_4B_SIDECAR_SIGNATURE_DRIFT');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_4B_PUBLIC_CATALOG_DRIFT');
 return {verified:true,sourceSHA:checksum,parentSha:p.parentSha,f03MReceiptCarrier:p.f03MReceiptCarrier,
  productionHandoffIssuer:'SOURCE_GAP',parentCancelAdapter:'FAIL_CLOSED'};
}
export async function apply(c,{inject=false}={}){
 gate();const p=await signed(c);
 if((await c.query("SELECT to_regnamespace('f06_4b_ci')::text n")).rows[0].n)throw Error('F06_4B_ALREADY_APPLIED');
 await c.query('BEGIN');try{
 await c.query('SELECT pg_advisory_xact_lock(20261014,6402)');
 await c.query(SQL);
 await c.query("INSERT INTO f06_4b_ci.attestation(seal_name,source_sha256,public_catalog_sha256,old_ledger_sha256,parent_f06_4a_sha256,parent_f06_3b_sha256) VALUES('F06_4B_CI_ONLY',$1,$2,$3,$4,$5)",
 [checksum,p.catalog,p.ledger,p.parentSha,p.originSha]);
 if(inject)throw Error('F06_4B_INJECTED_DDL_ROLLBACK');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_4B_PUBLIC_DDL_FORBIDDEN');
 await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
