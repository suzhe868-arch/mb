// F05 manual vehicle draft/publish: disposable PostgreSQL 16, private schema only.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect as connectF052,requireDatabaseIdentity,verify as verifyF052} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {verify as verifyF053} from '../four-s-member-trust-scope/migration.mjs';
export const ID='f05_manual_vehicle_draft_publish_private_v1';
export const SQL=await readFile(new URL('./000001_manual_vehicle_drafts.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const envExact={
 CI:'true',
 GITHUB_ACTIONS:'true',
 APP_ENV:'test',
 NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY',
 F05_MANUAL_VEHICLE_DRAFT_PUBLISH_CONSENT:'I_AUTHORIZE_F05_MANUAL_VEHICLE_DRAFT_PUBLISH_PG16_ONLY'
};
function isolated(){
 for(const [k,v] of Object.entries(envExact))if(process.env[k]!==v)throw Error('F05_MANUAL_DRAFT_ENV_DENIED_'+k);
 if(process.env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||!process.env.GITHUB_RUN_ID||!process.env.GITHUB_SHA||
    process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REF!=='refs/heads/feat/f05-manual-vehicle-draft-publish-pg16-01')
  throw Error('F05_MANUAL_DRAFT_GITHUB_SCOPE_DENIED');
}
export async function connect(){isolated();return connectF052()}
async function currentSource(c){
 await requireDatabaseIdentity(c);
 const versions=(await c.query('SELECT migration_id FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length===13&&versions[12].migration_id==='000015_vehicle_current_responsibility_ci_only'){
  await verifyF052(c);
  return 'F05_2_000015';
 }
 if(versions.length===14&&versions[12].migration_id==='000015_vehicle_current_responsibility_ci_only'&&
    versions[13].migration_id==='000016_four_s_member_trust_ci_only'){
  await verifyF053(c);
  return 'F05_3A_000016';
 }
 throw Error('F05_MANUAL_DRAFT_APPROVED_SOURCE_CHAIN_REQUIRED');
}
async function privateSchemaState(c){
 const exists=(await c.query("SELECT to_regnamespace('f05_manual_vehicle_test') AS n")).rows[0]?.n;
 if(!exists)throw Error('F05_MANUAL_DRAFT_PRIVATE_SCHEMA_MISSING');
 const objects=(await c.query("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='f05_manual_vehicle_test' AND c.relkind='r' ORDER BY c.relname")).rows.map(x=>x.relname);
 if(objects.join(',')!=='draft_events,drafts,published_vehicle_facts,schema_state')throw Error('F05_MANUAL_DRAFT_PRIVATE_OBJECT_DRIFT');
 const trigger=(await c.query("SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='f05_manual_vehicle_test' AND c.relname='draft_events' AND t.tgname='f05_manual_draft_events_immutable' AND NOT t.tgisinternal")).rowCount;
 if(trigger!==1)throw Error('F05_MANUAL_DRAFT_AUDIT_TRIGGER_MISSING');
 const rows=(await c.query('SELECT singleton,version,run_id,ddl_sha256 FROM f05_manual_vehicle_test.schema_state')).rows;
 if(rows.length!==1||rows[0].singleton!==true||Number(rows[0].version)!==1||
    rows[0].run_id!==process.env.GITHUB_RUN_ID||rows[0].ddl_sha256!==checksum)
  throw Error('F05_MANUAL_DRAFT_SCHEMA_SEAL_DENIED');
 return {objects,source:null};
}
export async function verify(c){
 isolated();
 const source=await currentSource(c);
 const state=await privateSchemaState(c);
 return {verified:true,id:ID,source,runId:process.env.GITHUB_RUN_ID,ddlSha256:checksum,
  database:'f03_auth_test',role:'f03_ci',serverMajor:16,privateSchema:'f05_manual_vehicle_test',
  publicSchemaUnchanged:true,objects:state.objects};
}
export async function apply(c,{inject=false}={}){
 isolated();
 await currentSource(c);
 const exists=(await c.query("SELECT to_regnamespace('f05_manual_vehicle_test') AS n")).rows[0]?.n;
 if(exists)return verify(c);
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261022,517)');
  const again=(await c.query("SELECT to_regnamespace('f05_manual_vehicle_test') AS n")).rows[0]?.n;
  if(again)throw Error('F05_MANUAL_DRAFT_PRIVATE_SCHEMA_RACE');
  await c.query(SQL);
  if(inject)throw Error('F05_MANUAL_DRAFT_INJECTED_ROLLBACK');
  await c.query('INSERT INTO f05_manual_vehicle_test.schema_state(singleton,version,run_id,ddl_sha256) VALUES(TRUE,1,$1,$2)',
   [process.env.GITHUB_RUN_ID,checksum]);
  await currentSource(c);
  await c.query('COMMIT');
  return verify(c);
 }catch(e){
  await c.query('ROLLBACK');
  throw e;
 }
}
