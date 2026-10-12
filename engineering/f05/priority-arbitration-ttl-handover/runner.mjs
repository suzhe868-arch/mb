import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F05_8_MODE_INVALID');
const c=await connect();
try{
 if(mode==='--apply')console.log('F05_8_V24_MIGRATED',JSON.stringify(await apply(c)));
 if(mode==='--verify')console.log('F05_8_V24_VERIFIED',JSON.stringify(await verify(c)));
 if(mode==='--inject-rollback'){
  const before=Number((await c.query('SELECT count(*) AS n FROM public.f03_schema_migrations')).rows[0].n);
  try{await apply(c,{inject:true});throw Error('F05_8_INJECTION_NOT_REJECTED')}catch(e){
   if(e.message!=='F05_8_TEST_INJECTED_TRANSACTION_ROLLBACK')throw e;
  }
  const after=Number((await c.query('SELECT count(*) AS n FROM public.f03_schema_migrations')).rows[0].n);
  if(after!==before)throw Error('F05_8_INJECTION_ROLLBACK_FAILED');
  console.log('F05_8_V24_REAL_PG16_INJECTION_ROLLBACK_PASS');
 }
}finally{await c.end()}
