import {connect,apply,verify} from './migration.mjs';
const m=process.argv[2];if(!['--apply','--verify','--inject-rollback'].includes(m))throw Error('F06_5C_USAGE');
const c=await connect();try{
 if(m==='--inject-rollback'){
  try{await apply(c,{inject:true});throw Error('F06_5C_EXPECTED_ROLLBACK_MISSING')}
  catch(e){if(e.message!=='F06_5C_INJECTED_DDL_ROLLBACK')throw e}
  if((await c.query("SELECT to_regnamespace('f06_5c_ci')::text n")).rows[0].n!==null)throw Error('F06_5C_DDL_ROLLBACK_LEAK');
  console.log('F06_5C_NATIVE_PG16_DDL_ROLLBACK_PASS');
 }else if(m==='--apply')console.log('F06_5C_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_5C_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
