import assert from 'node:assert/strict';
import {connect,apply} from '../migration.mjs';
const c=await connect();
async function rejects(label,action){
 try{await action();throw Error('NEGATIVE_UNEXPECTED_PASS_'+label)}
 catch(e){if(e.message.startsWith('NEGATIVE_UNEXPECTED_PASS_'))throw e;console.log('F03-1 MIGRATION NEGATIVE PASS '+label+' reason='+e.message.split(/[ \n]/)[0])}
}
try{
 const original=(await c.query("SELECT checksum FROM public.f03_schema_migrations WHERE migration_id='000002_pc_auth_sessions'")).rows[0].checksum;
 await c.query("UPDATE public.f03_schema_migrations SET checksum='invalid-checksum' WHERE migration_id='000002_pc_auth_sessions'");
 try{await rejects('checksum drift',()=>apply(c))}finally{await c.query('UPDATE public.f03_schema_migrations SET checksum=$1 WHERE migration_id=$2',[original,'000002_pc_auth_sessions'])}
 await c.query("UPDATE public.f03_schema_migrations SET migration_id='000999_unknown'");
 try{await rejects('unknown migration version',()=>apply(c))}finally{await c.query("UPDATE public.f03_schema_migrations SET migration_id='000002_pc_auth_sessions'")}
 await c.query('CREATE VIEW public.f03_rogue_view AS SELECT 1 AS probe');
 try{await rejects('rogue public view',()=>apply(c))}finally{await c.query('DROP VIEW public.f03_rogue_view')}
 assert.equal((await apply(c)).applied,false);
 const f02=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f02_schema_migrations')).rows;
 assert.equal(f02.length,1);assert.equal(f02[0].migration_id,'000001_current_initial');
 console.log('F03-1 LIVE MIGRATION METADATA/SCHEMA DRIFT PASS');
}finally{await c.end()}
