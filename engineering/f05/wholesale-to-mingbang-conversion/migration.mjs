// CI-only sealed additive M94->000015->000016->000017->000018.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect as previousConnect,verify as previousVerify} from '../jyt-wholesale-lineage-cycle/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const ID='000018_wholesale_mingbang_conversion_ci_only';
export const SQL=await readFile(new URL('./000018_wholesale_conversion_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
export async function connect(){return previousConnect()}
async function chain(c) {
 await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length<15||rows.length>16||rows[14]?.migration_id!=='000017_jyt_wholesale_source_ci_only')
  throw Error('F05_3C_REQUIRED_PRIOR_MIGRATIONS');
 if(rows.length===16&&(rows[15].migration_id!==ID||rows[15].checksum!==checksum))
  throw Error('F05_3C_UNAUTHORIZED_MIGRATION');
 return rows;
}
export async function verify(c) {
 const rows=await chain(c);
 if(rows.length!==16)throw Error('F05_3C_MIGRATION_NOT_APPLIED');
 const cat=await getPublicStructure(c);
 if(cat.sha256!==rows[15].structure_sha256)throw Error('F05_3C_STRUCTURE_DRIFT');
 for(const name of ['f05_3c_wholesale_conversions','f05_3c_conversion_audit'])
  if(!cat.objects.some(o=>o.kind==='relation'&&o.name===name))throw Error('F05_3C_RELATION_MISSING_'+name);
 return {verified:true,priorSha:rows[14].structure_sha256,newSha:cat.sha256,checksum};
}
export async function apply(c,{inject=false}={}){
 const rows=await chain(c);
 if(rows.length===16)return verify(c);
 const old=await previousVerify(c);
 if(!old.verified||old.newSha!==rows[14].structure_sha256)throw Error('F05_3C_PREVIOUS_SOURCE_NOT_SEALED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261011,318)');
  const before=await getPublicStructure(c);
  if(before.sha256!==old.newSha)throw Error('F05_3C_PRIOR_CATALOG_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F05_3C_INJECTED_REAL_ROLLBACK');
  const after=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,after.sha256]);
  await c.query('COMMIT');
  return verify(c);
 }catch(e){await c.query('ROLLBACK');throw e}
}
