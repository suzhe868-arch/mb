// F06-5B: CI-only isolated PG16 signer, never a production migration.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as parentVerify} from '../transaction-refund-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const REF='refs/heads/feat/f06-5b-lock-refund-conversion-guard-ci';
const REQUIRED={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:REF,F03_1_DATABASE_URL:DSN,F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function gate(){for(const [k,v] of Object.entries(REQUIRED))if(process.env[k]!==v)throw Error('F06_5B_ISOLATION_REQUIRED_'+k);if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_5B_UNSIGNED_RUN')}
let sequence=Promise.resolve();
export function withF065A(fn){const job=sequence.then(async()=>{const old=process.env.GITHUB_REF;try{process.env.GITHUB_REF='refs/heads/feat/f06-5a-transaction-refund-pending-ci';return await fn()}finally{process.env.GITHUB_REF=old}});sequence=job.catch(()=>{});return job}
export async function connect(){
 gate();const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:3000,query_timeout:90000});await c.connect();
 try{const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int version,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd")).rows[0];
 if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.su||x.cd||x.version<160000||x.version>=170000)throw Error('F06_5B_NONPRIVILEGED_PG16_REQUIRED');return c}catch(e){await c.end();throw e}
}
async function signed(c){
 gate();const p=await withF065A(()=>parentVerify(c));if(!p.verified||!p.sourceSHA)throw Error('F06_5B_SIGNED_4C_PARENT_REQUIRED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_5B_OLD_LEDGER_REQUIRED');
 const cat=await getPublicStructure(c);
 if(cat.sha256!=='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')throw Error('F06_5B_PUBLIC_CATALOG_DRIFT');
 const cols=(await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='refund_cases'")).rows.map(x=>x.column_name);
 for(const x of ['refund_id','customer_id','lock_id','transaction_id','status','expected_amount_cents','close_reason','closed_at'])if(!cols.includes(x))throw Error('PRODUCTION_TRANSACTION_REFUND_CARRIER_SOURCE_GAP_'+x);
 const checks=(await c.query("SELECT pg_get_constraintdef(oid) def FROM pg_constraint WHERE conrelid='public.refund_cases'::regclass AND contype='c'")).rows.map(x=>x.def).join(' ');
 if(!checks.includes('pending')||!checks.includes('closed')||!checks.includes('lock_id')||!checks.includes('transaction_id'))throw Error('PRODUCTION_TRANSACTION_REFUND_CARRIER_SOURCE_GAP_CHECK');
 return{catalog:cat.sha256,ledger:digest(ledger),parent:p.sourceSHA};
}
export async function verify(c){
 const p=await signed(c),r=(await c.query('SELECT * FROM f06_5b_ci.attestation')).rows;
 if(r.length!==1||r[0].seal_name!=='F06_5B_CI_ONLY'||r[0].source_sha256!==checksum||r[0].public_catalog_sha256!==p.catalog||r[0].old_ledger_sha256!==p.ledger||r[0].parent_f06_5a_sha256!==p.parent)throw Error('F06_5B_ATTESTATION_DRIFT');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_5B_PUBLIC_DDL_DRIFT');
 return{verified:true,sourceSHA:checksum,parentSHA:p.parent,productionRefundIssuer:'SOURCE_GAP',permissionIssuer:'SOURCE_GAP',realPayment:'NOT_AUTHORIZED'};
}
export async function apply(c,{inject=false}={}){
 const p=await signed(c);if((await c.query("SELECT to_regnamespace('f06_5b_ci')::text n")).rows[0].n)throw Error('F06_5B_ALREADY_APPLIED');
 await c.query('BEGIN');try{await c.query('SELECT pg_advisory_xact_lock(20261014,6502)');await c.query(SQL);
 await c.query("INSERT INTO f06_5b_ci.attestation(seal_name,source_sha256,public_catalog_sha256,old_ledger_sha256,parent_f06_4c_sha256) VALUES('F06_5B_CI_ONLY',$1,$2,$3,$4)",[checksum,p.catalog,p.ledger,p.parent]);
 if(inject)throw Error('F06_5B_INJECTED_DDL_ROLLBACK');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_5B_PUBLIC_SCHEMA_MUTATED');
 await c.query('COMMIT')}catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
