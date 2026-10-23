import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,assertEnvironment} from './environment.mjs';
import {verifyScopeDatabase} from '../runtime-scope/readiness.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export const SQL=String.raw`
CREATE SCHEMA f03_account_status_ci;
CREATE TABLE f03_account_status_ci.attestation(
 seal_name text PRIMARY KEY CHECK(seal_name='F03_ACCOUNT_STATUS_CI_ONLY'),
 source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[a-f0-9]{64}$'),
 github_ref text NOT NULL,
 head_sha text NOT NULL CHECK(head_sha ~ '^[a-f0-9]{40}$'),
 run_id text NOT NULL,
 db_oid oid NOT NULL,
 public_schema_sha256 text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
CREATE TABLE f03_account_status_ci.request_keys(
 request_key_sha256 text PRIMARY KEY CHECK(request_key_sha256 ~ '^[a-f0-9]{64}$'),
 payload_sha256 text NOT NULL CHECK(payload_sha256 ~ '^[a-f0-9]{64}$'),
 customer_id bigint NOT NULL REFERENCES public.customers(customer_id),
 actor_kind text NOT NULL CHECK(actor_kind IN ('employee','system_admin')),
 actor_id text NOT NULL,
 action text NOT NULL CHECK(action IN ('disable','restore')),
 result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT transaction_timestamp()
);
REVOKE ALL ON SCHEMA f03_account_status_ci FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA f03_account_status_ci FROM PUBLIC;
`;
export const sha=x=>createHash('sha256').update(x).digest('hex');
export async function schemaSource(){return sha(SQL)}
export async function prepare(){
 assertEnvironment();
 const p=await connect();
 try{
  await verifyScopeDatabase(p);
  const c=await p.connect();
  try{
   const oid=(await c.query('SELECT oid FROM pg_database WHERE datname=current_database()')).rows[0].oid;
   const structure=(await getPublicStructure(c)).sha256;
   await c.query('BEGIN');
   try{
    if((await c.query("SELECT to_regnamespace('f03_account_status_ci')::text AS ns")).rows[0].ns!==null)throw Error('F03_ACCOUNT_STATUS_SCHEMA_NOT_EMPTY');
    await c.query(SQL);
    await c.query("INSERT INTO f03_account_status_ci.attestation(seal_name,source_sha256,github_ref,head_sha,run_id,db_oid,public_schema_sha256) VALUES('F03_ACCOUNT_STATUS_CI_ONLY',$1,$2,$3,$4,$5,$6)",[await schemaSource(),process.env.GITHUB_REF,process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID,oid,structure]);
    await c.query('COMMIT');
   }catch(e){await c.query('ROLLBACK');throw e}
  }finally{c.release()}
  await verify(p);
 }finally{await p.end()}
}
export async function verify(pool){
 assertEnvironment();
 await verifyScopeDatabase(pool);
 const c=await pool.connect();
 try{
  const rows=(await c.query("SELECT * FROM f03_account_status_ci.attestation WHERE seal_name='F03_ACCOUNT_STATUS_CI_ONLY'")).rows;
  const oid=(await c.query('SELECT oid FROM pg_database WHERE datname=current_database()')).rows[0].oid;
  const current=(await getPublicStructure(c)).sha256;
  if(rows.length!==1||rows[0].source_sha256!==await schemaSource()||
    rows[0].github_ref!==process.env.GITHUB_REF||rows[0].head_sha!==process.env.GITHUB_SHA||
    rows[0].run_id!==process.env.GITHUB_RUN_ID||String(rows[0].db_oid)!==String(oid)||
    rows[0].public_schema_sha256!==current)throw Error('F03_ACCOUNT_STATUS_SCHEMA_SIGNATURE_DRIFT');
  return {verified:true,dbOid:String(oid),publicSha256:current,sourceSha256:await schemaSource()};
 }finally{c.release()}
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 if(process.argv[2]==='--apply')await prepare();
 else if(process.argv[2]==='--verify'){const p=await connect();try{console.log(JSON.stringify(await verify(p)))}finally{await p.end()}}
 else throw Error('F03_ACCOUNT_STATUS_COMMAND_REQUIRED');
}
