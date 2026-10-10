// F03-G1 PG16-only migration: two authorized CHECK changes, no other DDL.
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
import {connect,verify as verify94,checksum as checksum13} from '../runtime-transaction-responsible-handover/migration.mjs';
export {connect};
export const ID='000014_sg06_completed_checks';
export const PREVIOUS='7cd90248f51555fff26eb475320b9a10c6f52880263234a31e22210657a2c659';
export const SQL=await readFile(new URL('./000014.sql',import.meta.url),'utf8');
export const checksum=createHash('sha256').update(SQL).digest('hex');
const prior=JSON.parse(await readFile(new URL('../runtime-handover-reconciliation/evidence/pg16_full_catalog.json',import.meta.url),'utf8'));
const inventory=JSON.parse(await readFile(new URL('../runtime-handover-reconciliation/evidence/pg16_inventory.json',import.meta.url),'utf8'));
const permitted=['handover_batches.handover_batches_status_check','handover_items.handover_items_status_check'].sort();
const oldCodes={handover_batches:['collecting','pending_domain_handover','blocked'],handover_items:['pending','retry_required','blocked']};
async function sealed(c){const x=await c.query("SELECT current_database() db,current_user usr,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su");const a=x.rows[0];if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||a.db!=='f03_auth_test'||a.usr!=='f03_ci'||a.su||a.ver<160000||a.ver>=170000)throw Error('G_NOT_ISOLATED_GENUINE_PG16');}
async function manifest(){const j=JSON.parse(await readFile(new URL('./000014.manifest.json',import.meta.url),'utf8'));if(j.migration_id!==ID||j.previous_structure_sha256!==PREVIOUS||j.sql_sha256!==checksum||!/^([0-9a-f]{64})$/.test(j.structure_sha256))throw Error('G_MANIFEST_TAMPER');return j}
function exactDelta(s){
 if(s.objects.length!==2120||prior.objects.length!==2120)throw Error('G_CATALOG_SIZE_DRIFT');
 const old=new Map(prior.objects.map(x=>[x.kind+'|'+x.name,x]));
 const current=new Map(s.objects.map(x=>[x.kind+'|'+x.name,x]));
 if(old.size!==current.size)throw Error('G_CATALOG_KEYS_NOT_UNIQUE');
 const changed=[];
 for(const [key,x] of old){
  const y=current.get(key);
  if(!y)throw Error('G_CATALOG_MISSING_'+key);
  if(JSON.stringify(x)!==JSON.stringify(y))changed.push(y.name);
 }
 if(JSON.stringify(changed.sort())!==JSON.stringify(permitted))throw Error('G_ONLY_TWO_CHECKS_ALLOWED_'+JSON.stringify(changed));
 for(const name of permitted){
  const rec=current.get('constraint|'+name),oldrec=old.get('constraint|'+name);
  if(!rec||!oldrec||rec.kind!=='constraint'||rec.definition===oldrec.definition||!rec.definition.includes('completed')||!rec.definition.includes('pending'))throw Error('G_STATUS_CHECK_MALFORMED_'+name);
 }
 return changed;
}
const counts=async c=>({
 tables:Number((await c.query("SELECT count(*) n FROM pg_tables WHERE schemaname='public'")).rows[0].n),
 columns:Number((await c.query("SELECT count(*) n FROM pg_attribute a JOIN pg_class cl ON cl.oid=a.attrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace WHERE ns.nspname='public' AND cl.relkind='r' AND a.attnum>0 AND NOT a.attisdropped")).rows[0].n),
 constraints:Number((await c.query("SELECT count(*) n FROM pg_constraint c JOIN pg_namespace ns ON ns.oid=c.connamespace WHERE ns.nspname='public'")).rows[0].n),
 indexes:Number((await c.query("SELECT count(*) n FROM pg_index i JOIN pg_class cl ON cl.oid=i.indrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace WHERE ns.nspname='public'")).rows[0].n)
});
const requireCounts=async c=>{const n=await counts(c);if(JSON.stringify(n)!==JSON.stringify({tables:94,columns:608,constraints:435,indexes:163}))throw Error('G_PHYSICAL_COUNT_DRIFT_'+JSON.stringify(n));return n};
export async function discovery(c){
 await sealed(c);await verify94(c);await c.query('BEGIN');
 try{
  await c.query(SQL);
  const s=await getPublicStructure(c);
  const changed=exactDelta(s),n=await requireCounts(c);
  console.log('G_000014_REAL_PG16_DISCOVERY '+JSON.stringify({migration_id:ID,previous_structure_sha256:PREVIOUS,sql_sha256:checksum,structure_sha256:s.sha256,changed,counts:n}));
 }finally{await c.query('ROLLBACK')}
}
export async function verify(c){
 await sealed(c);const m=await manifest();
 const s=await getPublicStructure(c);
 if(s.sha256!==m.structure_sha256)throw Error('G_PHYSICAL_SHA_DRIFT');
 exactDelta(s);await requireCounts(c);
 const versions=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(versions.length!==inventory.versions.length||versions.at(-1)?.migration_id!==ID||versions.at(-1).checksum!==checksum||versions.at(-1).structure_sha256!==s.sha256)throw Error('G_VERSION_CHAIN');
 const priorVersions=inventory.versions.slice(1);
 for(let i=0;i<priorVersions.length;i++){const a=versions[i],b=priorVersions[i];if(a?.migration_id!==b.migration_id||a.checksum!==b.checksum||a.structure_sha256!==b.structure_sha256)throw Error('G_FROZEN_MIGRATION_SOURCE_CHANGED')}
 return {verified:true,sha:s.sha256,objects:s.objects.length};
}
export async function apply(c,{inject=false}={}){
 await sealed(c);await verify94(c);const m=await manifest();
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261010,312)');
  await c.query(SQL);
  const s=await getPublicStructure(c);exactDelta(s);await requireCounts(c);
  if(s.sha256!==m.structure_sha256||inject)throw Error('G_UNPINNED_000014_ROLLBACK');
  await c.query('INSERT INTO public.f03_schema_migrations(migration_id,checksum,structure_sha256) VALUES($1,$2,$3)',[ID,checksum,s.sha256]);
  await verify(c);
  await c.query('COMMIT');return {applied:true,sha:s.sha256};
 }catch(e){await c.query('ROLLBACK');throw e}
}
export async function rollbackUnused(c){
 await verify(c);
 const items=(await c.query("SELECT count(*)::int n FROM public.handover_items WHERE status='completed'")).rows[0].n;
 const batches=(await c.query("SELECT count(*)::int n FROM public.handover_batches WHERE status='completed'")).rows[0].n;
 if(items||batches)throw Error('G_USED_MIGRATION_NOT_REVERSIBLE');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261010,312)');
  for(const [table,values] of Object.entries(oldCodes)){
   await c.query('ALTER TABLE public.'+table+' DROP CONSTRAINT '+table+'_status_check');
   await c.query("ALTER TABLE public."+table+" ADD CONSTRAINT "+table+"_status_check CHECK (status IN ("+values.map(x=>"'"+x+"'").join(',')+"))");
  }
  await c.query('DELETE FROM public.f03_schema_migrations WHERE migration_id=$1',[ID]);
  const s=await getPublicStructure(c);
  if(s.sha256!==PREVIOUS)throw Error('G_UNUSED_ROLLBACK_NOT_BYTE_EXACT');
  await c.query('COMMIT');
  return {rollback:true};
 }catch(e){await c.query('ROLLBACK');throw e}
}
