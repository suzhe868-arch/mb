import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(mode))
 throw Error('F05_9_RUNNER_MODE_DENIED');
const c=await connect();
try{
 if(mode==='--inject-rollback'){
  const before=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  try{await apply(c,{inject:true});throw Error('F05_9_INJECTION_NOT_REJECTED')}
  catch(e){if(e.message!=='F05_9_TEST_INJECTED_ROLLBACK')throw e}
  if((await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n!==before)
   throw Error('F05_9_ROLLBACK_LEDGER_DRIFT');
  console.log('F05_9_V25_NATIVE_PG16_INJECTION_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('F05_9_V25_MIGRATED',JSON.stringify(await apply(c)));
 else console.log('F05_9_V25_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
