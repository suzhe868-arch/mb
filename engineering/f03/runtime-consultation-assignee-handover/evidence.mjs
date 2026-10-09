// PG16 structural evidence: full catalog definitions, exact pinned delta, real raw bytes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {connect,verify} from './migration.mjs';
import {verify as verify90} from '../runtime-demand-responsible-handover/migration.mjs';
const PREVIOUS='1532f5b34379e5ec207d9a2b909a11322d0eb6755cc23d6dfc7a419ea6d13eb0';

import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const root=new URL('./artifacts/',import.meta.url);
const file=name=>new URL(name,root);
const data=async name=>readFile(file(name));
const sha=x=>createHash('sha256').update(x).digest('hex');
const m=JSON.parse(await readFile(new URL('./000010.manifest.json',import.meta.url),'utf8'));
const approved=new Set(m.approved_physical_added_keys);
const key=o=>o.kind+'\0'+o.name;
async function counts(c){
 const sql=[
 "SELECT count(*)::integer n FROM pg_tables WHERE schemaname='public'",
 "SELECT count(*)::integer n FROM pg_attribute a JOIN pg_class cl ON cl.oid=a.attrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace WHERE ns.nspname='public' AND cl.relkind='r' AND a.attnum>0 AND NOT a.attisdropped",
 "SELECT count(*)::integer n FROM pg_constraint co JOIN pg_namespace ns ON ns.oid=co.connamespace WHERE ns.nspname='public'",
 "SELECT count(*)::integer n FROM pg_index i JOIN pg_class cl ON cl.oid=i.indrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace WHERE ns.nspname='public'"
 ];
 const n=[];
 for(const q of sql)n.push((await c.query(q)).rows[0].n);
 return {tables:n[0],columns:n[1],constraints:n[2],indexes:n[3]};
}
function compare(old,now){
 assert.equal(old.structure_sha256,PREVIOUS);
 assert.equal(now.structure_sha256,m.structure_sha256);
 const a=new Map(old.objects.map(o=>[key(o),o]));
 const b=new Map(now.objects.map(o=>[key(o),o]));
 for(const [name,def] of a)assert.deepEqual(b.get(name),def,'OLD_OBJECT_REMOVED_OR_CHANGED_'+name);
 const added=[...b.keys()].filter(x=>!a.has(x)).sort();
 assert.deepEqual(added,[...approved].sort(),'UNAPPROVED_CATALOG_DELTA');
 return added;
}
async function snapshots(mode){
 await mkdir(root,{recursive:true});
 const c=await connect();
 try{
  if(mode==='--old')await verify90(c);
  else await verify(c);
  const s=await getPublicStructure(c);
  const name=mode==='--old'?'old-structure.json':'new-structure.json';
  await writeFile(file(name),JSON.stringify({structure_sha256:s.sha256,objects:s.objects},null,2)+'\n');
  if(mode==='--old'){
   assert.equal(s.sha256,PREVIOUS);
   console.log('F03_2J_OLD_STRUCTURE '+s.sha256+' objects='+s.objectCount);
   return;
  }
  assert.equal(s.sha256,m.structure_sha256);
  const old=JSON.parse(await data('old-structure.json'));
  const now=JSON.parse(await data('new-structure.json'));
  const delta=compare(old,now);
  if(delta.length!==m.approved_physical_added_keys.length)throw Error('F03_2J_APPROVED_ONE_TABLE_DELTA_MISMATCH');
  const measured=await counts(c);
  for(const name of ['tables','columns','constraints','indexes'])assert.equal(measured[name],m[name],name+'_FROZEN_COUNT_DRIFT');
  const versionRows=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations UNION ALL SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
  assert.deepEqual(versionRows.map(x=>x.migration_id),['000001_current_initial','000002_pc_auth_sessions','000003_employee_capability_scope_bindings','000004_governance_population_guards','000005_employee_receiving_pool_eligibility','000006_explicit_team_memberships','000007_handover_batch_item_ledger','000008_customer_owner_handover_receipts','000009_demand_responsible_handover_receipts','000010_consultation_assignee_handover_receipts']);
  await writeFile(file('pg16_inventory.json'),JSON.stringify({...measured,structure_sha256:s.sha256,added_catalog_keys:delta,versions:versionRows},null,2)+'\n');
  console.log('F03_2J_EVIDENCE_FULL_CATALOG_PASS '+JSON.stringify({measured,delta:delta.length,sha:s.sha256}));
 }finally{await c.end()}
}
const normalized=x=>{
 const txt=x.toString('utf8');
 const r=[...txt.matchAll(/^\\restrict ([A-Za-z0-9]{32,128})\r?$/gm)];
 const u=[...txt.matchAll(/^\\unrestrict ([A-Za-z0-9]{32,128})\r?$/gm)];
 assert.equal(r.length,1);assert.equal(u.length,1);assert.equal(r[0][1],u[0][1]);
 return txt.replace(/^\\restrict [A-Za-z0-9]{32,128}\r?$/gm,'\\restrict __KEY__').replace(/^\\unrestrict [A-Za-z0-9]{32,128}\r?$/gm,'\\unrestrict __KEY__');
};
async function rawManifest(dir){
 const txt=await readFile(new URL('sha256sums.txt',dir),'utf8');
 const lines=txt.trim().split('\n');
 assert.equal(lines.length,2);
 const entries={};
 for(const line of lines){
  const q=/^([a-f0-9]{64})  f03\/runtime-consultation-assignee-handover\/artifacts\/(pg16_schema_only\.sql|pg16_inventory\.json)$/.exec(line);
  assert.ok(q,'BAD_SHA256_MANIFEST');
  assert.ok(!entries[q[2]]);
  const actual=sha(await readFile(new URL(q[2],dir)));
  assert.equal(q[1],actual,'BAD_RAW_SHA_'+q[2]);
  entries[q[2]]=actual;
 }
 assert.equal(Object.keys(entries).length,2);
 return entries;
}
export async function archiveCheck(){
 const source=new URL('./evidence/',import.meta.url);
 const manifest=await rawManifest(source);
 const current=await rawManifest(root);
 for(const name of ['old-structure.json','new-structure.json','pg16_inventory.json']){
  const a=await readFile(new URL(name,source)),b=await data(name);
  assert.ok(a.equals(b),'CROSS_RUN_STRUCTURAL_BYTES_DIFFER_'+name);
 }
 assert.equal(normalized(await readFile(new URL('pg16_schema_only.sql',source))),normalized(await data('pg16_schema_only.sql')),'UNEXPECTED_SQL_DIFF');
 const old=JSON.parse(await data('old-structure.json')),now=JSON.parse(await data('new-structure.json'));
 assert.equal(compare(old,now).length,approved.size);
 const origin=await readFile(new URL('SOURCE.md',source),'utf8');
 assert.match(origin,/source_run_id:\s*[0-9]{6,20}/);
 assert.match(origin,/source_commit_sha:\s*[a-f0-9]{40}/);
 console.log('F03_2J_ARCHIVE_EXACT_REAL_RAW_BYTES_PASS '+JSON.stringify({source:manifest,current}));
}
const mode=process.argv[2];
if(mode==='--old'||mode==='--new')await snapshots(mode);
else if(mode==='--archive-check')await archiveCheck();
else if(mode!==undefined)throw Error('F03_2J_EVIDENCE_UNKNOWN_MODE');
