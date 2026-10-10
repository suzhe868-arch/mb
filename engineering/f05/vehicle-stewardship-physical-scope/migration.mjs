// F05-2 isolated M94 -> 000015 lane. No production database or G14 crossover.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect as oldConnect,verify as oldVerify} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {isolate} from '../../f03-1/migration.mjs';
export const ID='000015_vehicle_current_responsibility_ci_only';
export const PREVIOUS='7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659';
export const SQL=await readFile(new URL('./000015_vehicle_responsibility.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const BASE=JSON.parse(await readFile(new URL('../../f03/runtime-handover-reconciliation/evidence/pg16_full_catalog.json',import.meta.url),'utf8'));
const INVENTORY=JSON.parse(await readFile(new URL('../../f03/runtime-handover-reconciliation/evidence/pg16_inventory.json',import.meta.url),'utf8'));
const ensureEnv=()=>{
  for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
   F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
    if(process.env[k]!==v)throw Error('F05_2_CI_ISOLATION_DENIED_'+k);
  isolate();
};
export async function connect(){ensureEnv();return oldConnect()}
export async function requireDatabaseIdentity(c){
 ensureEnv();
 const q=await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::integer ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr");
 const x=q.rows[0];
 if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su||x.cdb||x.cr)
  throw Error('F05_2_DATABASE_IDENTITY_DENIED');
 const s=(await c.query("SELECT run_id FROM public.f03_isolation_seal")).rows;
 if(s.length!==1||s[0].run_id!==process.env.GITHUB_RUN_ID)throw Error('F05_2_RUN_SEAL_DENIED');
}
function compareCatalog(s){
 if(INVENTORY.structure_sha256!==PREVIOUS||BASE.structure_sha256!==PREVIOUS||BASE.objects.length!==2120)
  throw Error('F05_2_PREVIOUS_SOURCE_SEAL_CHANGED');
 const after=new Map(s.objects.map(x=>[x.kind+'\u0000'+x.name,x]));
 for(const old of BASE.objects){
  const x=after.get(old.kind+'\u0000'+old.name);
  if(!x||JSON.stringify(x)!==JSON.stringify(old))throw Error('F05_2_FROZEN_OBJECT_MUTATED_'+old.name);
 }
 const base=new Set(BASE.objects.map(x=>x.kind+'\u0000'+x.name));
 const added=s.objects.filter(x=>!base.has(x.kind+'\u0000'+x.name));
 const names=new Set(added.filter(x=>x.kind==='relation').map(x=>x.name));
 if(!names.has('vehicle_current_responsibilities')||!names.has('vehicle_responsibility_audit_events')||added.length<12)
  throw Error('F05_2_MISSING_CURRENT_RELATION_OR_AUDIT');
 if(added.some(x=>/4s_organizations|cooperation_scope|merchant_organization/.test(x.name)))
  throw Error('F05_2_FORBIDDEN_4S_ORGANIZATION');
 return added;
}
async function versions(c){
 const rows=(await c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id")).rows;
 if(INVENTORY.versions.length!==13)throw Error('F05_2_PREVIOUS_VERSION_INVENTORY');
 for(let i=0;i<12;i++){
  const x=INVENTORY.versions[i+1];
  if(!rows[i]||rows[i].migration_id!==x.migration_id||rows[i].checksum!==x.checksum||rows[i].structure_sha256!==x.structure_sha256)
   throw Error('F05_2_FROZEN_VERSION_DRIFT_'+i);
 }
 if(rows.length>13||rows[12]&&rows[12].migration_id!==ID)throw Error('F05_2_UNAPPROVED_MIGRATION_CHAIN');
 return rows;
}
export async function verify(c){
 await requireDatabaseIdentity(c);
 const rows=await versions(c);
 if(rows.length!==13||rows[12].checksum!==checksum)throw Error('F05_2_NEW_VERSION_OR_SHA_DENIED');
 const s=await getPublicStructure(c);
 if(s.sha256!==rows[12].structure_sha256)throw Error('F05_2_PHYSICAL_SHA_DENIED');
 const added=compareCatalog(s);
 return {verified:true,oldSha:PREVIOUS,newSha:s.sha256,sqlSha:checksum,objects:s.objects.length,added:added.map(x=>x.kind+'|'+x.name).sort()};
}
export async function apply(c,{inject=false}={}){
 await requireDatabaseIdentity(c);
 const rows=await versions(c);
 if(rows.length===13)return verify(c);
 if(rows.length!==12)throw Error('F05_2_INCORRECT_M94_CHAIN');
 await oldVerify(c);
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261010,315)');
  if((await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('F05_2_M94_BEFORE_NOT_SEALED');
  await c.query(SQL);
  if(inject)throw Error('F05_2_INJECTED_ROLLBACK');
  const snap=await getPublicStructure(c);const added=compareCatalog(snap);
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,snap.sha256]);
  const result={verified:true,oldSha:PREVIOUS,newSha:snap.sha256,sqlSha:checksum,objects:snap.objects.length,added:added.map(x=>x.kind+'|'+x.name).sort()};
  await c.query('COMMIT');return result;
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function rollback(c){
 await verify(c);
 const n=(await c.query("SELECT (SELECT count(*) FROM public.vehicle_current_responsibilities) current_rows,(SELECT count(*) FROM public.vehicle_responsibility_audit_events) audit_rows")).rows[0];
 if(Number(n.current_rows)!==0||Number(n.audit_rows)!==0)throw Error('F05_2_USED_HISTORY_ROLLBACK_DENY');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261010,315)');
  await c.query('DROP TRIGGER f05_2_audit_no_update_delete ON public.vehicle_responsibility_audit_events');
  await c.query('DROP TABLE public.vehicle_responsibility_audit_events');
  await c.query('DROP TABLE public.vehicle_current_responsibilities');
  await c.query('DROP FUNCTION public.f05_2_audit_immutable()');
  await c.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]);
  if((await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('F05_2_ROLLBACK_OLD_SHA_MISMATCH');
  await c.query('COMMIT');return {rolledBack:true};
 }catch(e){await c.query('ROLLBACK');throw e}
}
