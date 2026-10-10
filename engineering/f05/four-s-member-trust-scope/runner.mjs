// CI-only entrypoint, no production DDL.
import {connect,apply,verify} from './migration.mjs';
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(process.argv[2]))throw Error('F05_3A_RUNNER_BAD_ARGUMENT');
const c=await connect();try{
 if(process.argv[2]==='--inject-rollback'){
  let aborted=false;
  try{await apply(c,{inject:true})}catch(e){if(e.message==='F05_3A_INJECTED_ROLLBACK')aborted=true;else throw e}
  if(!aborted)throw Error('F05_3A_ROLLBACK_INJECTION_DID_NOT_ABORT');
  const absent=(await c.query("SELECT to_regclass('public.f05_3a_member_create_licenses') AS t")).rows[0].t;
  if(absent!==null)throw Error('F05_3A_MIGRATION_PARTIALLY_APPLIED');
  console.log('F05_3A_ROLLBACK_INJECTION_REAL_PG16_PASS');
 }else{
  const out=process.argv[2]==='--apply'?await apply(c):await verify(c);
  if(out.verified!==true)throw Error('F05_3A_NOT_VERIFIED');
  console.log('F05_3A_MIGRATION',process.argv[2],JSON.stringify(out));
 }
}finally{await c.end()}
