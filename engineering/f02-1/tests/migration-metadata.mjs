// Real CI PG16 negative migration metadata and exact 464-column physical projection.
import pg from 'pg';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {verifyF021Target} from '../guard.mjs';
const cfg=verifyF021Target(),client=new pg.Client({connectionString:cfg.connectionString,connectionTimeoutMillis:2500});
const run=(expected)=>{
 const r=spawnSync(process.execPath,['f02-1/runner.mjs','--verify'],{cwd:process.cwd(),env:process.env,encoding:'utf8',timeout:30000});
 if(expected){assert.equal(r.status,1,expected);assert.match((r.stderr||'')+(r.stdout||''),new RegExp(expected));console.log('F02-1 REAL MIGRATION NEGATIVE PASS: '+expected);}
 else{assert.equal(r.status,0,(r.stderr||'')+(r.stdout||''));console.log('F02-1 REAL MIGRATION VERIFY PASS');}
};
try{
 await client.connect();
 const original=(await client.query("SELECT checksum FROM public.f02_schema_migrations WHERE migration_id='000001_current_initial'")).rows[0]?.checksum;
 assert.match(original,/^[a-f0-9]{64}$/);
 let mode='';
 try{
  await client.query("INSERT INTO public.f02_schema_migrations (migration_id,checksum) VALUES ('999999_unknown_test','fixture')");
  mode='unknown';
  run('F02_1_UNKNOWN_MIGRATION_VERSION');
 }finally{if(mode==='unknown')await client.query("DELETE FROM public.f02_schema_migrations WHERE migration_id='999999_unknown_test'")}
 mode='';
 try{
  await client.query("UPDATE public.f02_schema_migrations SET checksum='not_the_frozen_checksum' WHERE migration_id='000001_current_initial'");
  mode='checksum';
  run('F02_1_MIGRATION_CHECKSUM_DRIFT');
 }finally{if(mode==='checksum')await client.query('UPDATE public.f02_schema_migrations SET checksum=$1 WHERE migration_id=$2',[original,'000001_current_initial'])}
 mode='';
 try{
  await client.query('CREATE TABLE public.f02_1_rogue_fixture (id bigint)');
  mode='rogue';
  run('F02_1_REFUSED_UNKNOWN_TABLES_OR_MISSING_TABLES');
 }finally{if(mode==='rogue')await client.query('DROP TABLE public.f02_1_rogue_fixture')}
 run(null);
 const [m,f]=await Promise.all(['field-matrix.tsv','field-freeze-candidates.tsv'].map(name=>readFile(new URL('../../f02-g0/'+name,import.meta.url),'utf8')));
 const matrix=m.trimEnd().split(/\r?\n/).slice(1).map(x=>x.split('\t'));
 const freeze=new Map(f.trimEnd().split(/\r?\n/).slice(1).map(x=>x.split('\t')).map(x=>[x[0],x[4]]));
 const expected=new Set(matrix.filter(x=>freeze.get(x[0])?.startsWith('INCLUDE_')).map(x=>x[1]+'.'+x[2]));
 const actual=(await client.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name<>'f02_schema_migrations'")).rows;
 assert.equal(expected.size,464);
 assert.equal(actual.length,464);
 for(const r of actual)assert.ok(expected.has(r.table_name+'.'+r.column_name),'UNEXPECTED_COLUMN_'+r.table_name+'.'+r.column_name);
 console.log('F02-1 PHYSICAL FIELD PROJECTION PASS: exact 464 of 464, zero deferred/forbidden columns');
 const metadata=(await client.query('SELECT migration_id,checksum FROM public.f02_schema_migrations')).rows;
 assert.equal(metadata.length,1);assert.equal(metadata[0].checksum,original);
 console.log('F02-1 MIGRATION RECOVERY + REGISTRY CHECKSUM PASS; one committed version');
}catch(e){console.error('F02-1 METADATA TEST FAIL:',e.message);process.exitCode=1}
finally{try{await client.end()}catch{}}
