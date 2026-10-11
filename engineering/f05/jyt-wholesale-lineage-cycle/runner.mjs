import {connect,apply,verify} from './migration.mjs';
const cmd=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(cmd))throw Error('F05_3B_RUNNER_ARG');
const c=await connect();
try{
 if(cmd==='--inject-rollback'){
  let caught=false;
  try{await apply(c,{inject:true})}catch(e){if(e.message==='F05_3B_INJECTED_ROLLBACK')caught=true;else throw e}
  if(!caught||(await c.query("SELECT to_regclass('public.f05_3b_sync_lineages') AS relation")).rows[0].relation!==null)
   throw Error('F05_3B_ROLLBACK_NOT_ATOMIC');
  console.log('F05_3B_TRANSACTIONAL_ROLLBACK_TRUE_PG16_PASS');
 }else {
  const x=cmd==='--apply'?await apply(c):await verify(c);
  console.log('F05_3B_SCHEMA_VERIFIED',JSON.stringify(x));
 }
}finally{await c.end()}
