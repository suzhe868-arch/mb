import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];
if(!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F06_4B_USAGE');
const c=await connect();
try{
 if(mode==='--inject-rollback'){
  try{await apply(c,{inject:true});throw Error('F06_4B_EXPECTED_ROLLBACK_MISSING')}
  catch(e){if(e.message!=='F06_4B_INJECTED_DDL_ROLLBACK')throw e}
  const x=(await c.query("SELECT to_regnamespace('f06_4b_ci')::text n")).rows[0];
  if(x.n!==null)throw Error('F06_4B_DDL_ROLLBACK_LEAK');
  console.log('F06_4B_NATIVE_PG16_DDL_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('F06_4B_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_4B_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
