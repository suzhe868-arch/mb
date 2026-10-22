// Strictly disposable nonproduction PG16; never changes frozen public DDL.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {isolate as assertDisposable} from '../../f03-1/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {verify as verifyFourS} from '../four-s-member-trust-scope/migration.mjs';
export const SQL=await readFile(new URL('./000001_edit_sidecar.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const BRANCH='refs/heads/feat/f05-published-manual-vehicle-staged-edit-pg16-01';
export function assertIsolated(env=process.env){
 for(const [key,val] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F03_1_ISOLATION_CONFIRM:'I_AUTHORIZE_F03_1_NEW_EMPTY_PG16_AUTH_ONLY',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
  F05_PUBLISHED_EDIT_CONSENT:'I_AUTHORIZE_F05_PUBLISHED_EDIT_DISPOSABLE_PG16_ONLY'}))
  if(env[key]!==val)throw Error('F05_EDIT_ISOLATION_DENIED_'+key);
 if(env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||env.GITHUB_REF!==BRANCH||env.GITHUB_EVENT_NAME!=='push'||!env.GITHUB_RUN_ID||!env.GITHUB_SHA)
  throw Error('F05_EDIT_GITHUB_SCOPE_DENIED');
}
export async function connect(){
 assertIsolated();
 const target=assertDisposable();
 const c=new pg.Client({connectionString:target.url,connectionTimeoutMillis:1500,query_timeout:15000,statement_timeout:15000,application_name:'f05_216_edit_pg16'});
 await c.connect();
 try{await requireDatabaseIdentity(c);return c}catch(e){await c.end();throw e}
}
export async function verify(c){
 assertIsolated();await requireDatabaseIdentity(c);await verifyFourS(c);
 const objs=(await c.query("SELECT relname FROM pg_class JOIN pg_namespace ON pg_namespace.oid=pg_class.relnamespace WHERE nspname='f05_published_edit_test' AND relkind='r' ORDER BY relname")).rows.map(x=>x.relname);
 if(objs.join(',')!=='edit_audit,impact_outbox,schema_state,staged_changes,vehicle_edit_state')throw Error('F05_EDIT_PRIVATE_OBJECT_DRIFT');
 const row=(await c.query('SELECT run_id,ddl_sha256 FROM f05_published_edit_test.schema_state')).rows;
 if(row.length!==1||row[0].run_id!==process.env.GITHUB_RUN_ID||row[0].ddl_sha256!==checksum)throw Error('F05_EDIT_DDL_SEAL_INVALID');
 const trig=(await c.query("SELECT tgname FROM pg_trigger JOIN pg_class ON pg_class.oid=tgrelid JOIN pg_namespace ON pg_namespace.oid=relnamespace WHERE nspname='f05_published_edit_test' AND NOT tgisinternal ORDER BY tgname")).rows.map(x=>x.tgname);
 if(trig.join(',')!=='edit_audit_immutable,impact_outbox_immutable')throw Error('F05_EDIT_IMMUTABLE_TRIGGER_MISSING');
 return {verified:true,privateSchema:'f05_published_edit_test',ddlSha256:checksum,runId:process.env.GITHUB_RUN_ID,objects:objs,publicSchemaChanged:false};
}
export async function apply(c,{inject=false}={}){
 assertIsolated();await requireDatabaseIdentity(c);await verifyFourS(c);
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261022,216)');
  if((await c.query("SELECT to_regnamespace('f05_published_edit_test') AS n")).rows[0]?.n)throw Error('F05_EDIT_ALREADY_APPLIED');
  await c.query(SQL);
  if(inject)throw Error('F05_EDIT_INJECTED_DDL_ROLLBACK');
  await c.query('INSERT INTO f05_published_edit_test.schema_state(run_id,ddl_sha256) VALUES($1,$2)',[process.env.GITHUB_RUN_ID,checksum]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verify(c);
}
