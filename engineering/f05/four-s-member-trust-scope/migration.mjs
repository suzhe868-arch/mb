// F05-3A CI-only additive M94->000015->000016 trust source migration.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect as prevConnect,verify as verifyPrevious,requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const ID='000016_four_s_member_trust_ci_only';
export const SQL=await readFile(new URL('./000016_four_s_member_trust.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
function ensure(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3A_CI_ONLY_'+k);
}
export async function connect(){ensure();return prevConnect()}
async function chain(c){
 ensure();await requireDatabaseIdentity(c);
 const rows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(rows.length<13||rows.length>14||rows[12].migration_id!=='000015_vehicle_current_responsibility_ci_only')
  throw Error('F05_3A_REQUIRED_F05_2_CHAIN');
 if(rows.length===14&&(rows[13].migration_id!==ID||rows[13].checksum!==checksum))
  throw Error('F05_3A_VERSION_MISMATCH');
 return rows;
}
export async function apply(c,{inject=false}={}){
 const rows=await chain(c);
 if(rows.length===14)return verify(c);
 const previous=await verifyPrevious(c);
 if(previous.verified!==true)throw Error('F05_3A_F05_2_NOT_ACCEPTED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261011,316)');
  const original=await getPublicStructure(c);
  if(original.sha256!==previous.newSha)throw Error('F05_3A_PREVIOUS_PHYSICAL_DRIFT');
  await c.query(SQL);
  if(inject)throw Error('F05_3A_INJECTED_ROLLBACK');
  const next=await getPublicStructure(c);
  for(const x of ['f05_3a_member_create_licenses','f05_3a_member_publications','f05_3a_member_trust_audit'])
   if(!next.objects.some(o=>o.kind==='relation'&&o.name===x))throw Error('F05_3A_MISSING_PHYSICAL_'+x);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,next.sha256]);
  await c.query('COMMIT');
  return {verified:true,priorSha:original.sha256,newSha:next.sha256,sqlSha:checksum};
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function verify(c){
 const rows=await chain(c);
 if(rows.length!==14)throw Error('F05_3A_NOT_APPLIED');
 const current=await getPublicStructure(c);
 if(current.sha256!==rows[13].structure_sha256)throw Error('F05_3A_SCHEMA_DRIFT');
 const n=(await c.query("SELECT COUNT(*)::int n FROM public.f05_3a_member_trust_audit")).rows[0].n;
 return {verified:true,newSha:current.sha256,priorSha:rows[12].structure_sha256,sqlSha:checksum,auditEvents:n};
}
