import {connect,apply,verify} from './migration.mjs';
const arg=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(arg))throw Error('F05_5_RUNNER_ARGS');
const c=await connect();
try{
 if(arg==='--apply')console.log('F05_5_MIGRATED',JSON.stringify(await apply(c)));
 if(arg==='--verify')console.log('F05_5_VERIFIED',JSON.stringify(await verify(c)));
 if(arg==='--inject-rollback'){
  const n=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  try{await apply(c,{inject:true});throw Error('F05_5_MUST_ROLLBACK')}catch(e){if(e.message!=='F05_5_INJECTED_ROLLBACK')throw e;}
  if((await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n!==n)throw Error('F05_5_ROLLBACK_NOT_ATOMIC');
  console.log('F05_5_INJECTED_ROLLBACK_CONFIRMED');
 }
}finally{await c.end()}