import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {connect,isolate} from '../../f03-1/migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {checksum as old4,PREVIOUS as old3} from '../runtime-admin-population/migration.mjs';
import {checksum as oldScope,OLD_CHECKSUM as oldAuth,OLD_SHA as oldAuthSha,F02_CHECKSUM,F02_STRUCTURE} from '../runtime-scope/migration.mjs';
export {connect};
export const ID='000005_employee_receiving_pool_eligibility';
export const PREVIOUS='555ddc5bffa745014e68eab79fa83312c9b18ed06f484434fc5d76e2064336ea';
export const SQL=String.raw`
CREATE TABLE public.employee_receiving_eligibility (
 employee_id BIGINT NOT NULL,
 eligible BOOLEAN NOT NULL,
 version BIGINT NOT NULL,
 decided_at TIMESTAMPTZ NOT NULL,
 decided_by_system_admin_id BIGINT NOT NULL,
 CONSTRAINT f03_2_2c_eligible_pk PRIMARY KEY(employee_id),
 CONSTRAINT f03_2_2c_employee_fk FOREIGN KEY(employee_id) REFERENCES public.employees(employee_id) ON DELETE NO ACTION,
 CONSTRAINT f03_2_2c_admin_fk FOREIGN KEY(decided_by_system_admin_id) REFERENCES public.system_admins(system_admin_id) ON DELETE NO ACTION,
 CONSTRAINT f03_2_2c_eligible_version_chk CHECK(version>0)
);
CREATE TABLE public.receiving_pool_guards (
 guard_name TEXT NOT NULL,
 version BIGINT NOT NULL DEFAULT 0,
 CONSTRAINT f03_2_2c_pool_pk PRIMARY KEY(guard_name),
 CONSTRAINT f03_2_2c_guard_name_chk CHECK(guard_name='receiving_pool'),
 CONSTRAINT f03_2_2c_guard_version_chk CHECK(version>=0)
);
INSERT INTO public.receiving_pool_guards(guard_name,version) VALUES ('receiving_pool',0);
`;
export const checksum=createHash('sha256').update(SQL).digest('hex');
const manifest=()=>readFile(new URL('./000005.manifest.json',import.meta.url),'utf8').then(JSON.parse);
async function chain(c,m,old=false){
 const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,(SELECT count(*)::int FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%') ns")).rows[0];
 if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su!==false||x.cdb!==false||x.cr!==false||x.ns!==0)throw Error('F03_2C_ISOLATION_DENY');
 const [seal,f02,r]=await Promise.all([c.query('SELECT run_id,f02_checksum,f02_structure_sha256,base_structure_sha256 FROM public.f03_isolation_seal'),c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations'),c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')]);
 const s=seal.rows,base=f02.rows,rows=r.rows;
 if(s.length!==1||s[0].run_id!==isolate().run||s[0].f02_checksum!==F02_CHECKSUM||s[0].f02_structure_sha256!==F02_STRUCTURE||!/^[a-f0-9]{64}$/.test(s[0].base_structure_sha256)||base.length!==1||base[0].migration_id!=='000001_current_initial'||base[0].checksum!==F02_CHECKSUM||base[0].structure_sha256!==F02_STRUCTURE)throw Error('F03_2C_F02_SEAL_DENY');
 const expected=[['000002_pc_auth_sessions',oldAuth,oldAuthSha],['000003_employee_capability_scope_bindings',oldScope,old3],['000004_governance_population_guards',old4,PREVIOUS]];
 if(rows.length===4)expected.push([ID,checksum,m.structure_sha256]);
 else if(!(old&&rows.length===3))throw Error('F03_2C_VERSION_DRIFT');
 for(let i=0;i<expected.length;i++)if(rows[i]?.migration_id!==expected[i][0]||rows[i]?.checksum!==expected[i][1]||rows[i]?.structure_sha256!==expected[i][2])throw Error('F03_2C_VERSION_DRIFT');
 return rows.length===4?'new':'old';
}
async function config(discovery=false){
 const m=await manifest();
 if(m.migration_id!==ID||m.previous_structure_sha256!==PREVIOUS)throw Error('F03_2C_MANIFEST_DENY');
 if(!discovery&&(m.sql_sha256!==checksum||!/^[a-f0-9]{64}$/.test(m.structure_sha256)||m.tables!==84||m.columns!==502||m.constraints!==314||m.indexes!==129))throw Error('F03_2C_MANIFEST_UNPINNED');
 return m;
}
const tables=async c=>(await c.query("SELECT count(*)::integer n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
async function tx(c,fn,readOnly=false){
 await c.query(readOnly?'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY':'BEGIN');
 try{if(!readOnly)await c.query('SELECT pg_advisory_xact_lock(20261010,305)');const result=await fn();await c.query('COMMIT');return result}catch(e){await c.query('ROLLBACK');throw e}
}
export async function discover(c){
 const m=await config(true);
 return tx(c,async()=>{
  if(await chain(c,m,true)!=='old'||await tables(c)!==82||(await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('F03_2C_DISCOVERY_BASELINE_DENY');
  await c.query(SQL);
  const s=await getPublicStructure(c);
  console.log('F03_2C_DISCOVERY '+JSON.stringify({sql_sha256:checksum,structure_sha256:s.sha256,tables:await tables(c),objects:s.objectCount}));
  throw Error('F03_2C_DISCOVERY_ROLLBACK_ONLY');
 });
}
export async function apply(c,{inject=false}={}){
 const m=await config();
 return tx(c,async()=>{
  const phase=await chain(c,m,true),s=await getPublicStructure(c);
  if(phase==='new'){
   if(s.sha256!==m.structure_sha256||await tables(c)!==84)throw Error('F03_2C_APPLIED_DRIFT');
   return {applied:false,sha:s.sha256};
  }
  if(s.sha256!==PREVIOUS||await tables(c)!==82)throw Error('F03_2C_BASELINE_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F03_2C_TEST_INJECT_ROLLBACK');
  const next=await getPublicStructure(c);
  if(next.sha256!==m.structure_sha256)throw Error('F03_2C_EXPECTED_'+m.structure_sha256+'_ACTUAL_'+next.sha256);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,next.sha256]);
  return {applied:true,sha:next.sha256};
 });
}
export async function verify(c){
 const m=await config();
 return tx(c,async()=>{
  if(await chain(c,m,false)!=='new'||await tables(c)!==84||(await getPublicStructure(c)).sha256!==m.structure_sha256)throw Error('F03_2C_SCHEMA_DENY');
  const rows=(await c.query('SELECT guard_name,version FROM public.receiving_pool_guards')).rows;
  if(rows.length!==1||rows[0].guard_name!=='receiving_pool'||Number(rows[0].version)<0)throw Error('F03_2C_GUARD_DENY');
  return {verified:true,sha:m.structure_sha256};
 },true);
}
export async function rollback(c){
 const m=await config();
 return tx(c,async()=>{
  if(await chain(c,m,false)!=='new'||(await getPublicStructure(c)).sha256!==m.structure_sha256)throw Error('F03_2C_ROLLBACK_DRIFT');
  const rows=(await c.query("SELECT version FROM public.receiving_pool_guards WHERE guard_name='receiving_pool' FOR UPDATE")).rows;
  if(rows.length!==1||Number(rows[0].version)!==0||(await c.query('SELECT count(*)::int n FROM public.employee_receiving_eligibility')).rows[0].n!==0)throw Error('F03_2C_ROLLBACK_USED_DENY');
  await c.query('DROP TABLE public.employee_receiving_eligibility');
  await c.query('DROP TABLE public.receiving_pool_guards');
  await c.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]);
  if((await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('F03_2C_INEXACT_ROLLBACK');
  return {rolledBack:true};
 });
}
