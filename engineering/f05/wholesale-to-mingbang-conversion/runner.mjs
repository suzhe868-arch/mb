import {connect,apply,verify} from './migration.mjs';
const action=process.argv[2];
if(process.argv.length!==3||!['--apply','--verify','--inject-rollback'].includes(action))
 throw Error('F05_3C_UNKNOWN_RUNNER');
const c=await connect();try{
 if(action==='--inject-rollback'){
  let thrown=false;
  try{await apply(c,{inject:true})}catch(e){if(e.message==='F05_3C_INJECTED_REAL_ROLLBACK')thrown=true;else throw e}
  if(!thrown||(await c.query("SELECT to_regclass('public.f05_3c_wholesale_conversions') t")).rows[0].t!==null)
   throw Error('F05_3C_ROLLBACK_INCOMPLETE');
  console.log('F05_3C_REAL_PG16_ATOMIC_ROLLBACK_PASS');
 }else console.log('F05_3C_MIGRATION',JSON.stringify(action==='--apply'?await apply(c):await verify(c)));
}finally{await c.end()}
