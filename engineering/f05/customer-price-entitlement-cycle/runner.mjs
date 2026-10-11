import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F05_4_RUNNER_ARGS');
const c=await connect();
try{
 if(mode==='--apply')console.log('F05_4_MIGRATED',JSON.stringify(await apply(c)));
 else if(mode==='--verify')console.log('F05_4_VERIFIED',JSON.stringify(await verify(c)));
 else{
  const before=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  try{await apply(c,{inject:true});throw Error('F05_4_INJECTION_SHOULD_FAIL');}
  catch(e){if(!String(e.message).includes('F05_4_INJECTED_ATOMIC_ROLLBACK'))throw e;}
  const after=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  if(after!==before)throw Error('F05_4_FAILED_MIGRATION_NOT_ATOMIC');
  console.log('F05_4_INJECTED_ROLLBACK_CONFIRMED');
 }
}finally{await c.end();}
