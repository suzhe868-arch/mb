import {connect,verify,apply} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F05_7_RUNNER_MODE_INVALID');
const c=await connect();
try{
 if(mode==='--verify')console.log('F05_7_VERIFIED',JSON.stringify(await verify(c)));
 if(mode==='--apply')console.log('F05_7_MIGRATED',JSON.stringify(await apply(c)));
 if(mode==='--inject-rollback'){
  const before=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  try{await apply(c,{inject:true});throw Error('F05_7_EXPECTED_ROLLBACK')}catch(e){if(e.message!=='F05_7_INJECTED_MIGRATION_ROLLBACK')throw e}
  if((await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n!==before)throw Error('F05_7_ROLLBACK_FAILED');
  console.log('F05_7_TRUE_PG16_INJECTED_ROLLBACK_CONFIRMED');
 }
}finally{await c.end()}
