// F06-3C-1: CI-only M94-v26 refund-carrier verification; no production tables altered.
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verify as parentVerify,verifyComposite as parentVerifyComposite} from '../lock-transaction-ci/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {assertCompositeSignedPG} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const BRANCH='refs/heads/feat/f06-3c1-refund-pending-close-ci';
const required={GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_REF:BRANCH,F03_1_DATABASE_URL:DSN,
 F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'};
export const SQL=await readFile(new URL('./sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function gate(){
 for(const [k,v] of Object.entries(required))if(process.env[k]!==v)throw Error('F06_3C1_ISOLATION_REQUIRED_'+k);
 if(!/^[0-9]{6,20}$/.test(process.env.GITHUB_RUN_ID||''))throw Error('F06_3C1_UNSIGNED_RUN');
}
let queue=Promise.resolve();
export function withF063B(fn){
 const work=queue.then(async()=>{const old=process.env.GITHUB_REF;try{
  process.env.GITHUB_REF='refs/heads/feat/f06-3b-lock-transaction-ci';return await fn();
 }finally{process.env.GITHUB_REF=old}});
 queue=work.catch(()=>{});return work;
}
export async function connect(){
 gate();const c=new pg.Client({connectionString:DSN,connectionTimeoutMillis:3000,query_timeout:90000});
 await c.connect();
 try{
  const x=(await c.query("SELECT current_database() db,current_user u,current_setting('server_version_num')::int v,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cd")).rows[0];
  if(x.db!=='f03_auth_test'||x.u!=='f03_ci'||x.su||x.cd||x.v<160000||x.v>=170000)throw Error('F06_3C1_REQUIRES_NONPRIVILEGED_PG16');
  return c;
 }catch(e){await c.end();throw e}
}
async function carrier(c){
 const x=(await c.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN('refund_cases','refund_payments','transactions','deposit_receipts')")).rows;
 const expected={refund_cases:['refund_id','customer_id','lock_id','transaction_id','status','close_reason','expected_amount_cents','closed_at'],
 refund_payments:['payment_id','refund_id','amount_cents','paid_at'],transactions:['transaction_id','source_lock_id','status','listing_cycle_id'],
 deposit_receipts:['deposit_id','customer_id','lock_id','amount_cents']};
 for(const [table,cols] of Object.entries(expected))for(const col of cols)
  if(!x.some(r=>r.table_name===table&&r.column_name===col))throw Error('PRODUCTION_REFUND_CARRIER_GAP_'+table+'_'+col);
 const checks=(await c.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid='public.refund_cases'::regclass AND contype='c'")).rows.map(z=>z.def).join(' ');
 if(!/closed/.test(checks)||!/pending/.test(checks)||!/lock_id/.test(checks)||!/transaction_id/.test(checks))throw Error('PRODUCTION_REFUND_CARRIER_GAP_CHECKS');
 return 'M94_V26_PUBLIC_PENDING_CLOSED_CARRIER_CI_ONLY';
}
async function signed(c,mode='CI_LEGACY'){
 const prior=mode==='COMPOSITE_NONPROD_SIGNED_V1'
  ?(await assertCompositeSignedPG(c),await parentVerifyComposite(c))
  :(gate(),await withF063B(()=>parentVerify(c)));
 if(!prior.verified||prior.catalog!=='5495c6d6ccecc628e1b27c5bfe4f3664a76b4c38a1fa732b6e2baa4ebb5e99f4')
  throw Error('F06_3C1_PARENT_SIGNATURE_FAILED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_3C1_24_LEDGER_REQUIRED');
 const origin=(await c.query('SELECT source_sha256 FROM f06_3b_ci.attestation')).rows;
 if(origin.length!==1)throw Error('F06_3C1_PARENT_ORIGIN_MISSING');
 const kind=await carrier(c);
 return {catalog:prior.catalog,ledger:hash(ledger),f3b:origin[0].source_sha256,kind};
}
async function verifyByMode(c,mode){
 const p=await signed(c,mode),x=(await c.query('SELECT * FROM f06_3c1_ci.attestation')).rows;
 if(x.length!==1||x[0].seal_name!=='F06_3C1_CI_ONLY'||
  x[0].source_sha256!==checksum||x[0].public_catalog_sha256!==p.catalog||
  x[0].old_ledger_sha256!==p.ledger||x[0].f06_3b_sha256!==p.f3b)
  throw Error('F06_3C1_SIDECAR_SIGNATURE_DRIFT');
 if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_3C1_PUBLIC_STRUCTURE_MUTATION');
 return {verified:true,carrier:p.kind,sourceSHA:checksum,publicCatalogSHA:p.catalog,productionRefundIssuer:'SOURCE_GAP',actualPayment:'BLOCKED'};
}
async function applyByMode(c,{inject=false}={},mode){
 const p=await signed(c,mode);
 if((await c.query("SELECT to_regnamespace('f06_3c1_ci')::text n")).rows[0].n)throw Error('F06_3C1_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261014,6303)');
  await c.query(SQL);
  await c.query("INSERT INTO f06_3c1_ci.attestation(seal_name,source_sha256,public_catalog_sha256,old_ledger_sha256,f06_3b_sha256) VALUES('F06_3C1_CI_ONLY',$1,$2,$3,$4)",[checksum,p.catalog,p.ledger,p.f3b]);
  if(inject)throw Error('F06_3C1_INJECTED_MIGRATION_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_3C1_PUBLIC_MIGRATION_FORBIDDEN');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyByMode(c,mode);
}
export async function verify(c){return verifyByMode(c,'CI_LEGACY')}
export async function apply(c,options={}){return applyByMode(c,options,'CI_LEGACY')}
export async function verifyComposite(c){return verifyByMode(c,'COMPOSITE_NONPROD_SIGNED_V1')}
export async function applyComposite(c,options={}){return applyByMode(c,options,'COMPOSITE_NONPROD_SIGNED_V1')}
