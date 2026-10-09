// F03-2-2B: CI-only additive 000004; no historical migration modification.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,isolate} from '../../f03-1/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {checksum as previousChecksum,OLD_CHECKSUM as authChecksum,OLD_SHA as authStructure,F02_CHECKSUM,F02_STRUCTURE} from '../runtime-scope/migration.mjs';
export {connect};
export const ID='000004_governance_population_guards';
export const PREVIOUS='229aa6dc167cd3ccb8da89fd9d08076af2588b6b4bd1cfbdc8d779c31dfeffe0';
export const SQL=String.raw\`
CREATE TABLE public.governance_population_guards(
 guard_name TEXT NOT NULL PRIMARY KEY,
 version BIGINT NOT NULL DEFAULT 0,
 bootstrap_claimed_at TIMESTAMPTZ,
 CONSTRAINT f03_2_2b_guard_name_chk CHECK(guard_name='system_admin'),
 CONSTRAINT f03_2_2b_guard_version_chk CHECK(version>=0)
);
INSERT INTO public.governance_population_guards(guard_name,version,bootstrap_claimed_at)
 SELECT 'system_admin',0,CASE WHEN EXISTS(SELECT 1 FROM public.system_admins) THEN transaction_timestamp() ELSE NULL END;
\`;
export const checksum=createHash('sha256').update(SQL).digest('hex');
const config=()=>readFile(new URL('./000004.manifest.json',import.meta.url),'utf8').then(JSON.parse);
export async function verifyIdentity(c){
 const q="SELECT current_database() db,current_user usr,current_setting('server_version_num')::integer ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,(SELECT count(*)::integer FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%') ns";
 const a=(await c.query(q)).rows[0];
 if(a.db!=='f03_auth_test'||a.usr!=='f03_ci'||a.ver<160000||a.ver>=170000||a.su!==false||a.cdb!==false||a.cr!==false||a.ns!==0)throw Error('F03_2B_IDENTITY_OR_NAMESPACE_DENY');
}
async function versions(c,allowOld,m){
 await verifyIdentity(c);
 const seal=(await c.query('SELECT run_id,f02_checksum,f02_structure_sha256,base_structure_sha256 FROM public.f03_isolation_seal')).rows;
 const f02=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations')).rows;
 if(seal.length!==1||seal[0].run_id!==isolate().run||seal[0].f02_checksum!==F02_CHECKSUM||seal[0].f02_structure_sha256!==F02_STRUCTURE||!/^[0-9a-f]{64}$/.test(seal[0].base_structure_sha256)||f02.length!==1||f02[0].migration_id!=='000001_current_initial'||f02[0].checksum!==F02_CHECKSUM||f02[0].structure_sha256!==F02_STRUCTURE)throw Error('F03_2B_F02_SEAL_DRIFT');
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 const expected=[
 ['000002_pc_auth_sessions',authChecksum,authStructure],
 ['000003_employee_capability_scope_bindings',previousChecksum,PREVIOUS]
 ];
 if(rows.length===3)expected.push([ID,checksum,m.structure_sha256]);
 else if(!(allowOld&&rows.length===2))throw Error('F03_2B_MIGRATION_CHAIN_DRIFT');
 for(let i=0;i<expected.length;i++)if(rows[i]?.migration_id!==expected[i][0]||rows[i]?.checksum!==expected[i][1]||rows[i]?.structure_sha256!==expected[i][2])throw Error('F03_2B_MIGRATION_CHAIN_DRIFT');
 return rows.length===3?'new':'old';
}
async function manifest({discovery=false}={}){
 const m=await config();
 if(m.migration_id!==ID||m.previous_structure_sha256!==PREVIOUS)throw Error('F03_2B_MANIFEST_INVALID');
 if(!discovery&&(m.sql_sha256!==checksum||!(/^[a-f0-9]{64}$/.test(m.structure_sha256))||/^0+$/.test(m.structure_sha256)||m.tables!==82||m.columns!==495||m.constraints!==307||m.indexes!==127))throw Error('F03_2B_MANIFEST_NOT_FROZEN');
 return m;
}
const tableCount=async c=>(await c.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
async function tx(c,fn,{readOnly=false}={}){
 await c.query(readOnly?'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY':'BEGIN');
 try{
  if(!readOnly)await c.query('SELECT pg_advisory_xact_lock(20261009,304)');
  const result=await fn();
  await c.query('COMMIT');
  return result;
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function discover(c){
 const m=await manifest({discovery:true});
 return tx(c,async()=>{
  const phase=await versions(c,true,m);
  if(phase!=='old'||await tableCount(c)!==81||(await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('F03_2B_DISCOVERY_WRONG_BASELINE');
  await c.query(SQL);
  const s=await getPublicStructure(c);
  const tables=await tableCount(c);
  // Roll back intentionally; no partially pinned migration is persisted.
  console.log('F03_2B_DISCOVERY '+JSON.stringify({sql_sha256:checksum,structure_sha256:s.sha256,tables}));
  throw Error('F03_2B_DISCOVERY_ROLLBACK_ONLY');
 });
}
export async function apply(c,{inject=false}={}){
 const m=await manifest();
 return tx(c,async()=>{
  const phase=await versions(c,true,m);
  const sha=(await getPublicStructure(c)).sha256;
  if(phase==='new'){
   if(await tableCount(c)!==82||sha!==m.structure_sha256)throw Error('F03_2B_ALREADY_APPLIED_PHYSICAL_DRIFT');
   return {applied:false,sha};
  }
  if(await tableCount(c)!==81||sha!==PREVIOUS)throw Error('F03_2B_OLD_PHYSICAL_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F03_2B_INJECTED_ROLLBACK');
  const out=await getPublicStructure(c);
  if(out.sha256!==m.structure_sha256)throw Error('F03_2B_PHYSICAL_DRIFT_EXPECTED_'+m.structure_sha256+'_ACTUAL_'+out.sha256);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,out.sha256]);
  return {applied:true,sha:out.sha256};
 });
}
export async function verify(c){
 const m=await manifest();
 return tx(c,async()=>{
  if(await versions(c,false,m)!=='new'||await tableCount(c)!==82)throw Error('F03_2B_WRONG_VERSION');
  const snap=await getPublicStructure(c);
  if(snap.sha256!==m.structure_sha256)throw Error('F03_2B_PHYSICAL_DRIFT');
  const rows=(await c.query("SELECT guard_name,version,bootstrap_claimed_at FROM public.governance_population_guards")).rows;
  if(rows.length!==1||rows[0].guard_name!=='system_admin'||Number(rows[0].version)<0)throw Error('F03_2B_GUARD_ROW_DRIFT');
  return {verified:true,sha:snap.sha256,bootstrapClaimed:rows[0].bootstrap_claimed_at!==null};
 },{readOnly:true});
}
export async function rollback(c){
 const m=await manifest();
 return tx(c,async()=>{
  if(await versions(c,false,m)!=='new'||(await getPublicStructure(c)).sha256!==m.structure_sha256)throw Error('F03_2B_ROLLBACK_DRIFT');
  const g=(await c.query("SELECT version,bootstrap_claimed_at FROM public.governance_population_guards WHERE guard_name='system_admin' FOR UPDATE")).rows[0];
  if(!g||Number(g.version)!==0||g.bootstrap_claimed_at!==null)throw Error('F03_2B_ROLLBACK_CLAIM_OR_VERSION_DENIED');
  if((await c.query('SELECT count(*)::integer n FROM public.system_admins')).rows[0].n!==0)throw Error('F03_2B_ROLLBACK_HAS_ADMINS');
  await c.query('DROP TABLE public.governance_population_guards');
  await c.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]);
  if((await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('F03_2B_ROLLBACK_NOT_PREVIOUS');
  return {rolledBack:true};
 });
}
