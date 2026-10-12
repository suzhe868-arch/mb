import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['--inject-rollback','--apply','--verify'].includes(mode))
 throw Error('F05_10_RUNNER_MODE_DENIED');
const c=await connect();
try{
 if(mode==='--inject-rollback'){
  const before=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  try{await apply(c,{inject:true});throw Error('F05_10_INJECTION_NOT_REJECTED')}
  catch(e){if(e.message!=='F05_10_TEST_INJECTED_ROLLBACK')throw e}
  const after=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  if(after!==before||(await c.query("SELECT to_regclass('public.f05_10_consultation_meta_ci') obj")).rows[0].obj)
   throw Error('F05_10_BAD_MIGRATION_NOT_ROLLED_BACK');
  console.log('F05_10_V26_NATIVE_PG16_INJECTION_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('F05_10_V26_MIGRATED',JSON.stringify(await apply(c)));
 else console.log('F05_10_V26_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
