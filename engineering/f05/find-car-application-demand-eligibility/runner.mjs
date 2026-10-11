import {connect,verify,apply} from './migration.mjs';
const mode=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F05_6_INVALID_RUNNER_MODE');
const c=await connect();
try{
 if(mode==='--verify')console.log('F05_6_VERIFIED',JSON.stringify(await verify(c)));
 if(mode==='--apply')console.log('F05_6_MIGRATED',JSON.stringify(await apply(c)));
 if(mode==='--inject-rollback'){
  const old=(await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n;
  try{await apply(c,{inject:true});throw Error('F05_6_EXPECTED_ROLLBACK')}catch(e){if(e.message!=='F05_6_INJECTED_MIGRATION_ROLLBACK')throw e}
  if((await c.query('SELECT count(*)::int n FROM public.f03_schema_migrations')).rows[0].n!==old)
   throw Error('F05_6_NOT_ATOMIC');
  console.log('F05_6_REAL_PG16_INJECTED_ROLLBACK_CONFIRMED');
 }
}finally{await c.end()}