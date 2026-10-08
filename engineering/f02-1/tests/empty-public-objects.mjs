// Non-table public objects must block an otherwise empty disposable F02-1 database.
import assert from 'node:assert/strict';
import pg from 'pg';
import {spawnSync} from 'node:child_process';
import {verifyF021Target} from '../guard.mjs';
const client=new pg.Client({connectionString:verifyF021Target().connectionString,connectionTimeoutMillis:2500});
const invoke=(flag,expected)=>{
 const r=spawnSync(process.execPath,['f02-1/runner.mjs',flag],{cwd:process.cwd(),env:process.env,encoding:'utf8',timeout:30000});
 const output=(r.stderr||'')+'\n'+(r.stdout||'');
 if(expected){assert.equal(r.status,1,output);assert.match(output,new RegExp(expected));}
 else assert.equal(r.status,0,output);
};
const fixtures=[
 ['view','CREATE VIEW public.f02_rogue_view AS SELECT 1 AS id','DROP VIEW IF EXISTS public.f02_rogue_view'],
 ['sequence','CREATE SEQUENCE public.f02_rogue_sequence','DROP SEQUENCE IF EXISTS public.f02_rogue_sequence'],
 ['function',"CREATE FUNCTION public.f02_rogue_function() RETURNS integer LANGUAGE sql AS 'SELECT 1'","DROP FUNCTION IF EXISTS public.f02_rogue_function()"],
 ['enum',"CREATE TYPE public.f02_rogue_enum AS ENUM ('a','b')",'DROP TYPE IF EXISTS public.f02_rogue_enum'],
 ['domain','CREATE DOMAIN public.f02_rogue_domain AS TEXT','DROP DOMAIN IF EXISTS public.f02_rogue_domain']
];
try{
 await client.connect();
 invoke('--verify-empty',null);
 for(const [name,create,drop] of fixtures){
  try{
   await client.query(create);
   invoke('--apply','F02_1_REFUSED_NONEMPTY_PUBLIC_SCHEMA');
   invoke('--verify-empty','F02_1_REFUSED_NONEMPTY_PUBLIC_SCHEMA');
   console.log('F02-1 EMPTY PUBLIC NON-TABLE NEGATIVE PASS: '+name+' blocks apply and verify-empty');
  }finally{await client.query(drop)}
  invoke('--verify-empty',null);
 }
 console.log('F02-1 EMPTY PUBLIC OBJECTS TEST PASS: 5/5; public restored empty');
}catch(e){console.error('F02-1 EMPTY PUBLIC OBJECTS FAIL:',e.message);process.exitCode=1}
finally{try{await client.end()}catch{}}
