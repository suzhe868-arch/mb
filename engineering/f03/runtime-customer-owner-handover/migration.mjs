import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify as verify88} from '../runtime-handover-ledger/migration.mjs';
import {isolate} from '../../f03-1/migration.mjs';
import {checksum as oldChecksum} from '../runtime-handover-ledger/migration.mjs';
export {connect};
export const ID='000008_customer_owner_handover_receipts';
export const PREVIOUS='96328994b19e1fef7261ae41bd890575bd196210e85baec685d0192676aff0dd';
export const SQL=await readFile(new URL('./000008.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const manifest=async()=>JSON.parse(await readFile(new URL('./000008.manifest.json',import.meta.url),'utf8'));
const counts=async c=>{
 const q=[
 "SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'",
 "SELECT count(*)::int n FROM pg_attribute a JOIN pg_class cl ON cl.oid=a.attrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace WHERE ns.nspname='public' AND cl.relkind='r' AND a.attnum>0 AND NOT a.attisdropped",
 "SELECT count(*)::int n FROM pg_constraint co JOIN pg_namespace ns ON ns.oid=co.connamespace WHERE ns.nspname='public'",
 "SELECT count(*)::int n FROM pg_index i JOIN pg_class cl ON cl.oid=i.indrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace WHERE ns.nspname='public'"
 ];
 return {tables:(await c.query(q[0])).rows[0].n,columns:(await c.query(q[1])).rows[0].n,constraints:(await c.query(q[2])).rows[0].n,indexes:(await c.query(q[3])).rows[0].n};
};
export async function discovery(c){
 await verify88(c); // exact sealed old 88 BEFORE new 000008.
 await c.query('BEGIN');
 try{
  await c.query(SQL);
  const s=await getPublicStructure(c),num=await counts(c);
  const old=JSON.parse(await readFile(new URL('../runtime-handover-preflight/evidence/new-structure.json',import.meta.url),'utf8'));
  const o=new Set(old.objects.map(x=>x.kind+'\0'+x.name));
  for(const x of old.objects){const n=s.objects.find(y=>y.kind===x.kind&&y.name===x.name);if(JSON.stringify(x)!==JSON.stringify(n))throw Error('H_DISCOVERY_OLD_OBJECT_CHANGED')}
  const added=s.objects.filter(x=>!o.has(x.kind+'\0'+x.name)).map(x=>x.kind+'\0'+x.name).sort();
  const proposal={migration_id:ID,previous_structure_sha256:PREVIOUS,sql_sha256:checksum,structure_sha256:s.sha256,...num,approved_physical_added_keys:added};
  console.log('F03_2H_DISCOVERY_CANDIDATE '+JSON.stringify(proposal));
  throw Error('F03_2H_DISCOVERY_ROLLBACK_ONLY');
 }finally{await c.query('ROLLBACK')}
}
async function identity(c){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('H_CI_ONLY');
 const x=(await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb,(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) cr,(SELECT count(*)::int FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema','public') AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%') ns")).rows[0];
 if(x.db!=='f03_auth_test'||x.usr!=='f03_ci'||x.ver<160000||x.ver>=170000||x.su||x.cdb||x.cr||x.ns!==0)throw Error('H_ISOLATION_DENY');
 const seal=(await c.query('SELECT run_id FROM public.f03_isolation_seal')).rows;
 if(seal.length!==1||seal[0].run_id!==isolate().run)throw Error('H_SEAL_IDENTITY_DENY');
}
async function check(c,m,phase){
 await identity(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==(phase==='new'?7:6)||versions[5]?.migration_id!=='000007_handover_batch_item_ledger'||versions[5]?.checksum!==oldChecksum||versions[5]?.structure_sha256!==PREVIOUS)throw Error('H_CHAIN_DENY');
 const old=versions.slice(0,6),baseline=JSON.parse(await readFile(new URL('../runtime-handover-preflight/evidence/pg16_inventory.json',import.meta.url),'utf8'));
 for(let i=0;i<6;i++){if(old[i].migration_id!==baseline.versions[i+1].migration_id||old[i].checksum!==baseline.versions[i+1].checksum||old[i].structure_sha256!==baseline.versions[i+1].structure_sha256)throw Error('H_FROZEN_CHAIN_TAMPER')}
 if(phase==='new'&&(versions[6].migration_id!==ID||versions[6].checksum!==checksum||versions[6].structure_sha256!==m.structure_sha256))throw Error('H_000008_VERSION_TAMPER');
 const s=await getPublicStructure(c);
 if(s.sha256!==(phase==='new'?m.structure_sha256:PREVIOUS))throw Error('H_SCHEMA_TAMPER');
 if(phase==='new'){
  const baselineObjects=JSON.parse(await readFile(new URL('../runtime-handover-preflight/evidence/new-structure.json',import.meta.url),'utf8')).objects;
  const oldMap=new Map(baselineObjects.map(x=>[x.kind+'\0'+x.name,x]));
  for(const x of s.objects)if(oldMap.has(x.kind+'\0'+x.name)&&JSON.stringify(x)!==JSON.stringify(oldMap.get(x.kind+'\0'+x.name)))throw Error('H_OLD_CATALOG_TAMPER');
  const added=s.objects.filter(x=>!oldMap.has(x.kind+'\0'+x.name)).map(x=>x.kind+'\0'+x.name).sort();
  if(JSON.stringify(added)!==JSON.stringify(m.approved_physical_added_keys))throw Error('H_ADDED_OBJECTS_TAMPER');
  const n=await counts(c);
  for(const key of ['tables','columns','constraints','indexes'])if(n[key]!==m[key])throw Error('H_COUNT_TAMPER_'+key);
 }
 return {verified:true,sha:s.sha256,objects:s.objects.length};
}
export async function verify(c){
 const m=await manifest();
 if(m.migration_id!==ID||m.previous_structure_sha256!==PREVIOUS||m.sql_sha256!==checksum)throw Error('H_MANIFEST_TAMPER');
 return check(c,m,'new');
}
export async function apply(c,{inject=false}={}){
 const m=await manifest();
 await verify88(c); // cannot turn old guard into a permissive 89-table verifier.
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261010,308)');
  await identity(c);
  await c.query(SQL);
  if(inject)throw Error('H_INJECT_ROLLBACK');
  const s=await getPublicStructure(c);
  if(s.sha256!==m.structure_sha256)throw Error('H_UNPINNED_MIGRATION');
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,s.sha256]);
  await check(c,m,'new');
  await c.query('COMMIT');return {applied:true,sha:s.sha256};
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function rollback(c){
 const m=await manifest();await check(c,m,'new');
 const r=(await c.query('SELECT count(*)::int n FROM public.customer_owner_handover_receipts')).rows[0].n;
 if(r!==0)throw Error('H_RECEIPT_USED_ROLLBACK_DENY');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261010,308)');
  await c.query('DROP TABLE public.customer_owner_handover_receipts');
  await c.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]);
  if((await getPublicStructure(c)).sha256!==PREVIOUS)throw Error('H_ROLLBACK_INEXACT');
  await c.query('COMMIT');return {rolledBack:true};
 }catch(e){await c.query('ROLLBACK');throw e}
}
