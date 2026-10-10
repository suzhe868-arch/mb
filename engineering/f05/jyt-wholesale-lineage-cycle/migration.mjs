// Only disposable, version-sealed, non-superuser PostgreSQL16.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect as oldConnect,verify as priorVerify} from '../four-s-member-trust-scope/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const ID='000017_jyt_wholesale_source_ci_only';
export const SQL=await readFile(new URL('./000017_jyt_wholesale_ci.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const ensure=()=>{for(const [k,v] of Object.entries({
 CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'
}))if(process.env[k]!==v)throw Error('F05_3B_CI_ISOLATION_DENIED_'+k)};
export async function connect(){ensure();return oldConnect()}
async function rows(c) {
 ensure();await requireDatabaseIdentity(c);
 const r=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(r.length<14||r.length>15||r[13].migration_id!=='000016_four_s_member_trust_ci_only')throw Error('F05_3B_FROZEN_000016_REQUIRED');
 if(r.length===15&&(r[14].migration_id!==ID||r[14].checksum!==checksum))throw Error('F05_3B_CHAIN_MISMATCH');
 return r;
}
export async function verify(c){
 const r=await rows(c);
 if(r.length!==15)throw Error('F05_3B_NOT_APPLIED');
 const cat=await getPublicStructure(c);
 if(cat.sha256!==r[14].structure_sha256)throw Error('F05_3B_PHYSICAL_DRIFT');
 for(const t of ['f05_3b_sync_credentials','f05_3b_api_controls','f05_3b_sync_lineages','f05_3b_control_audit','f05_3b_sync_receipts'])
  if(!cat.objects.some(x=>x.kind==='relation'&&x.name===t))throw Error('F05_3B_TABLE_MISSING_'+t);
 return {verified:true,priorSha:r[13].structure_sha256,newSha:cat.sha256,checksum,objects:cat.objects.length};
}
export async function apply(c,{inject=false}={}){
 const r=await rows(c);
 if(r.length===15)return verify(c);
 const p=await priorVerify(c);
 if(!p.verified||p.newSha!==r[13].structure_sha256)throw Error('F05_3B_FROZEN_SOURCE_NOT_TRUSTED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261011,317)');
  const before=await getPublicStructure(c);
  if(before.sha256!==p.newSha)throw Error('F05_3B_PREVIOUS_PHYSICAL_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F05_3B_INJECTED_ROLLBACK');
  const after=await getPublicStructure(c);
  if(after.sha256===before.sha256)throw Error('F05_3B_MISSING_DELTA');
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,after.sha256]);
  await c.query('COMMIT');
  return verify(c);
 }catch(e){await c.query('ROLLBACK');throw e}
}
