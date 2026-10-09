import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {connect,verify,verifyOld,checksum,ID} from './migration.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const mode=process.argv[2];
const root=new URL('./artifacts/',import.meta.url);
if(!['--old','--new','--check'].includes(mode))throw Error('F03_2_1B_BAD_EVIDENCE_MODE');
const c=await connect();
try{
 if(mode==='--old'||mode==='--new'){
  if(mode==='--old')await verifyOld(c);else await verify(c);
  const p=await getPublicStructure(c);
  const obj={stage:mode.slice(2),structure_sha256:p.sha256,objects:p.objects};
  await writeFile(new URL(mode.slice(2)+'-structure.json',root),JSON.stringify(obj,null,2)+'\n');
  if(mode==='--new'){
   const [cols,con,idx,tab,ver]=await Promise.all([
    c.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position"),
    c.query("SELECT conrelid::regclass::text table_name,conname,contype,pg_get_constraintdef(oid) definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY conrelid::regclass::text,conname"),
    c.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname"),
    c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"),
    c.query("SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations UNION ALL SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id")
   ]);
   const artifact={kind:'F03_2_1B_NEW_81_TABLES',tables:tab.rows.length,columns:cols.rows.length,constraints:con.rows.length,indexes:idx.rows.length,versionChain:ver.rows,columnsDetail:cols.rows,constraintDetail:con.rows,indexDetail:idx.rows};
   await writeFile(new URL('pg16_inventory.json',root),JSON.stringify(artifact,null,2)+'\n');
  }
 }else{
  const [old,newer,inv,sql,manifestText]=await Promise.all(['old-structure.json','new-structure.json','pg16_inventory.json','pg16_schema_only.sql','sha256sums.txt'].map(n=>readFile(new URL(n,root))));
  const o=JSON.parse(old),n=JSON.parse(newer),i=JSON.parse(inv);
  const manifest=JSON.parse(await readFile(new URL('000003.manifest.json',import.meta.url),'utf8'));
  assert.equal(o.structure_sha256,manifest.previous_structure_sha256);
  assert.equal(n.structure_sha256,manifest.structure_sha256);
  assert.deepEqual([i.tables,i.columns,i.constraints,i.indexes],[81,492,304,126]);
  assert.equal(i.versionChain.length,3);
  assert.deepEqual(i.versionChain.map(x=>x.migration_id),['000001_current_initial','000002_pc_auth_sessions',ID]);
  assert.equal(i.versionChain[2].checksum,checksum);
  assert.equal(i.versionChain[2].structure_sha256,manifest.structure_sha256);
  const oldMap=new Map(o.objects.map(x=>[x.kind+'\0'+x.name,x]));
  const newMap=new Map(n.objects.map(x=>[x.kind+'\0'+x.name,x]));
  const removed=[...oldMap.keys()].filter(x=>!newMap.has(x));
  const changed=[...oldMap.keys()].filter(x=>newMap.has(x)&&JSON.stringify(oldMap.get(x))!==JSON.stringify(newMap.get(x)));
  assert.deepEqual(removed,[]);assert.deepEqual(changed,[],'OLD_FULL_OBJECTS_MUST_REMAIN_BYTE_SAME');
  const adds=[...newMap.keys()].filter(x=>!oldMap.has(x)).sort();
  const expected=[
   ['relation','employee_capability_scope_bindings'],['relation','f03_2_1b_cap_scope_pk'],['relation','f03_2_1b_scope_employee_unique'],['relation','f03_2_1b_employee_cap_idx'],
   ...['employee_id','permission_id','scope_id','granted_at','ended_at'].map(n=>['column','employee_capability_scope_bindings.'+n]),
   ...['scope_id','permission_id'].map(n=>['column','f03_2_1b_cap_scope_pk.'+n]),
   ...['employee_id','permission_id'].map(n=>['column','f03_2_1b_employee_cap_idx.'+n]),
   ...['scope_id','employee_id'].map(n=>['column','f03_2_1b_scope_employee_unique.'+n]),
   ...['f03_2_1b_scope_employee_unique','f03_2_1b_cap_scope_pk','f03_2_1b_cap_permission_fk','f03_2_1b_cap_scope_employee_fk','f03_2_1b_cap_time_chk'].map(n=>['constraint',n==='f03_2_1b_scope_employee_unique'?'employee_data_scopes.'+n:'employee_capability_scope_bindings.'+n]),
   ...['f03_2_1b_cap_scope_pk','f03_2_1b_scope_employee_unique','f03_2_1b_employee_cap_idx'].map(n=>['index',n])
  ].map(x=>x.join('\0')).sort();
  assert.deepEqual(manifest.approved_physical_added_keys,expected,'FROZEN_MANIFEST_DELTA_KEYS_MISMATCH');
  assert.deepEqual(adds,manifest.approved_physical_added_keys,'UNAPPROVED_FULL_PHYSICAL_DELTA');
  const pg=sql.toString();assert.equal([...pg.matchAll(/^CREATE TABLE public\./gm)].length,81);
  assert.match(pg,/CREATE TABLE public\.employee_capability_scope_bindings/);
  const sum=new Map(manifestText.toString().trim().split(/\r?\n/).map(x=>{const m=/^([0-9a-f]{64})  f03\/runtime-scope\/artifacts\/(pg16_schema_only\.sql|pg16_inventory\.json)$/.exec(x);assert.ok(m);return[m[2],m[1]]}));
  assert.equal(sum.size,2);
  assert.equal(sum.get('pg16_schema_only.sql'),createHash('sha256').update(sql).digest('hex'));
  assert.equal(sum.get('pg16_inventory.json'),createHash('sha256').update(inv).digest('hex'));
  console.log('F03-2-1B EVIDENCE PASS exact approved 23-object catalog diff (5 table fields plus 6 physical-index attribute entries), 81 tables, 492 columns, 304 constraints, 126 indexes; real SHA256');
 }
}catch(e){console.error('F03-2-1B EVIDENCE FAILURE '+e.message);process.exitCode=1}
finally{await c.end()}
