// F03-2-1B ADDITIVE DDL only, on CI-run-sealed disposable PG16.
// Do not edit or broaden the frozen F02 000001 / F03-1 000002 migrations.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,isolate,verify as verifyOld} from '../../f03-1/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
export const ID='000003_employee_capability_scope_bindings';
export const SQL=String.raw`
ALTER TABLE public.employee_data_scopes
 ADD CONSTRAINT f03_2_1b_scope_employee_unique UNIQUE (scope_id,employee_id);
CREATE TABLE public.employee_capability_scope_bindings (
 employee_id BIGINT NOT NULL,
 permission_id BIGINT NOT NULL,
 scope_id BIGINT NOT NULL,
 granted_at TIMESTAMPTZ NOT NULL,
 ended_at TIMESTAMPTZ,
 CONSTRAINT f03_2_1b_cap_scope_pk PRIMARY KEY (scope_id,permission_id),
 CONSTRAINT f03_2_1b_cap_permission_fk FOREIGN KEY (permission_id)
  REFERENCES public.permissions(permission_id) ON DELETE NO ACTION,
 CONSTRAINT f03_2_1b_cap_scope_employee_fk FOREIGN KEY (scope_id,employee_id)
  REFERENCES public.employee_data_scopes(scope_id,employee_id) ON DELETE NO ACTION,
 CONSTRAINT f03_2_1b_cap_time_chk CHECK (ended_at IS NULL OR ended_at>=granted_at)
);
CREATE INDEX f03_2_1b_employee_cap_idx
 ON public.employee_capability_scope_bindings(employee_id,permission_id);
`;
export const checksum=createHash('sha256').update(SQL).digest('hex');
const manifestPromise=readFile(new URL('./000003.manifest.json',import.meta.url),'utf8').then(JSON.parse);
export const OLD_SHA='8af70f5f3ca32f2a7b84a4ad69d68dbf7c81bd9b6c97d79ad7481ce3a8c23ee5';
export const OLD_CHECKSUM='3d7f0a539941e4089147a9c7a82ecfdb2ccebd64ba513e01deeb0fcf1d2bd6ab';
export const F02_CHECKSUM='df078212b95701af12144a43ef85a70fc491e5dca9948644df415bd888c5b4e4';
export const F02_STRUCTURE='d5535d72fe17d7981b006bcd1223eb11cb67660b53e7603f1125bfab8dba9cde';
const verifyIdentity=async c=>{
 const a=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::integer ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr")).rows[0];
 if(a.db!=='f03_auth_test'||a.usr!=='f03_ci'||a.ver<160000||a.ver>=170000||a.su!==false||a.cdb!==false||a.cr!==false)throw Error('F03_2_1B_ISOLATION_IDENTITY_DENY');
};
const verifySeal=async(c)=>{
 const run=isolate().run;await verifyIdentity(c);
 const [seal,f02]=(await Promise.all([
   c.query("SELECT run_id,f02_checksum,f02_structure_sha256,base_structure_sha256 FROM public.f03_isolation_seal"),
   c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations")
 ] )).map(x=>x.rows);
 if(seal.length!==1||seal[0].run_id!==run||seal[0].f02_checksum!==F02_CHECKSUM||
   seal[0].f02_structure_sha256!==F02_STRUCTURE||
   !/^[0-9a-f]{64}$/.test(seal[0].base_structure_sha256)||f02.length!==1||
   f02[0].migration_id!=='000001_current_initial'||f02[0].checksum!==F02_CHECKSUM||
   f02[0].structure_sha256!==F02_STRUCTURE)throw Error('F03_2_1B_RUN_SEAL_OR_F02_BASELINE_DENY');
};
const versionRows=async c=>(await c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id")).rows;
const tables=async c=>(await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(x=>x.tablename);
const manifest=async()=>{
 const m=await manifestPromise;
 if(m.migration_id!==ID||m.sql_sha256!==checksum||m.previous_structure_sha256!==OLD_SHA||
   m.old_checksum!==OLD_CHECKSUM||m.f02_checksum!==F02_CHECKSUM||m.approved_physical_added_keys?.length!==23||m.tables!==81||m.columns!==492||m.constraints!==304||m.indexes!==126||
   !/^[0-9a-f]{64}$/.test(m.structure_sha256))throw Error('F03_2_1B_FROZEN_MANIFEST_INVALID');
 return m;
};
export async function verify(c){
 const m=await manifest();
 await c.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
 try{
  await verifySeal(c);
  const v=await versionRows(c);if(v.length!==2||v[0].migration_id!=='000002_pc_auth_sessions'||v[0].checksum!==OLD_CHECKSUM||v[0].structure_sha256!==OLD_SHA||
   v[1].migration_id!==ID||v[1].checksum!==checksum||v[1].structure_sha256!==m.structure_sha256)throw Error('F03_2_1B_VERSION_DRIFT');
  if((await tables(c)).length!==81)throw Error('F03_2_1B_81_TABLES_REQUIRED');
  const physical=await getPublicStructure(c);
  if(physical.sha256!==m.structure_sha256)throw Error('F03_2_1B_FULL_PHYSICAL_DRIFT');
  await c.query('COMMIT');return {verified:true,schemaSha:physical.sha256};
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function apply(c,{inject=false}={}){
 await verifySeal(c);const m=await manifest();
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261009,303)');
  const rows=await versionRows(c);
  if(rows.length===2){
   // Old checksum and full physical fingerprint must match, not just version count.
   const ver=rows[1];if(ver.migration_id!==ID||ver.checksum!==checksum||ver.structure_sha256!==m.structure_sha256||
    (await getPublicStructure(c)).sha256!==m.structure_sha256)throw Error('F03_2_1B_ALREADY_APPLIED_DRIFT');
   await c.query('COMMIT');return {applied:false,schemaSha:m.structure_sha256};
  }
  if(rows.length!==1||rows[0].migration_id!=='000002_pc_auth_sessions'||rows[0].checksum!==OLD_CHECKSUM||rows[0].structure_sha256!==OLD_SHA)throw Error('F03_2_1B_BASELINE_VERSION_DRIFT');
  if((await tables(c)).length!==80||(await getPublicStructure(c)).sha256!==OLD_SHA)throw Error('F03_2_1B_BASELINE_PHYSICAL_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F03_2_1B_INJECTED_POST_DDL_ROLLBACK');
  const physical=await getPublicStructure(c);
  // First CI discovery must reveal the computed hash; never accept it dynamically as the manifest.
  if(physical.sha256!==m.structure_sha256)throw Error('F03_2_1B_FINGERPRINT_EXPECTED_'+m.structure_sha256+'_ACTUAL_'+physical.sha256);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,physical.sha256]);
  await c.query('COMMIT');return {applied:true,schemaSha:physical.sha256};
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function rollback(c){
 await verifySeal(c);const m=await manifest();
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261009,303)');
  const rows=await versionRows(c);
  if(rows.length!==2||rows[1].migration_id!==ID||rows[1].checksum!==checksum||rows[1].structure_sha256!==m.structure_sha256||
    (await getPublicStructure(c)).sha256!==m.structure_sha256)throw Error('F03_2_1B_ROLLBACK_DRIFT_DENY');
  const count=(await c.query('SELECT count(*)::integer AS n FROM public.employee_capability_scope_bindings')).rows[0].n;
  if(count!==0)throw Error('F03_2_1B_ROLLBACK_NONEMPTY_DENY');
  await c.query('DROP TABLE public.employee_capability_scope_bindings');
  await c.query('ALTER TABLE public.employee_data_scopes DROP CONSTRAINT f03_2_1b_scope_employee_unique');
  await c.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]);
  if((await getPublicStructure(c)).sha256!==OLD_SHA)throw Error('F03_2_1B_ROLLBACK_NOT_EXACT_OLD_STRUCTURE');
  await c.query('COMMIT');return {rolledBack:true,oldSha:OLD_SHA};
 }catch(e){await c.query('ROLLBACK');throw e}
}
export {connect,verifyOld};
