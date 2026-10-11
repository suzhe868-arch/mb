// F05-3G independent CI-only v19 migration. Historical v18 strictly immutable.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect as oldConnect,verify as oldVerify} from '../wholesale-to-mingbang-conversion/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const ID='000019_favorite_carrier_ci_only';
export const SQL=await readFile(new URL('./000019_favorite_carrier_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
export const connect=oldConnect;
const gate=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3G_CI_ONLY_'+k);
};
async function chain(c){
 gate();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(![16,17].includes(rows.length)||rows[15]?.migration_id!=='000018_wholesale_mingbang_conversion_ci_only')
  throw Error('F05_3G_000018_PRIOR_REQUIRED');
 if(rows.length===17&&(rows[16]?.migration_id!==ID||rows[16]?.checksum!==checksum))
  throw Error('F05_3G_UNAUTHORIZED_VERSION');
 return rows;
}
export async function verify(c){
 const rows=await chain(c);
 if(rows.length!==17)throw Error('F05_3G_000019_REQUIRED');
 const cat=await getPublicStructure(c);
 if(cat.sha256!==rows[16].structure_sha256)throw Error('F05_3G_STRUCTURE_DRIFT');
 for(const name of ['f05_3g_customer_favorites','f05_3g_favorite_events'])
  if(!cat.objects.some(o=>o.kind==='relation'&&o.name===name))throw Error('F05_3G_MISSING_'+name);
 return {verified:true,oldSha:rows[15].structure_sha256,newSha:cat.sha256,checksum,version:ID};
}
export async function apply(c,{inject=false}={}){
 const rows=await chain(c);
 if(rows.length===17)return verify(c);
 const old=await oldVerify(c);
 if(!old.verified||old.newSha!==rows[15].structure_sha256)
  throw Error('F05_3G_V18_SEAL_REQUIRED_BEFORE_UPGRADE');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261012,319)');
  const prior=await getPublicStructure(c);
  if(prior.sha256!==old.newSha)throw Error('F05_3G_PRIOR_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F05_3G_INJECTED_ATOMIC_ROLLBACK');
  const after=await getPublicStructure(c);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,after.sha256]);
  await c.query('COMMIT');
  return verify(c);
 }catch(e){await c.query('ROLLBACK');throw e}
}
