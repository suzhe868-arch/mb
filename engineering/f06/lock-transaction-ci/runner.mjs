import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];if(!['--inject-rollback','--apply','--verify'].includes(mode))throw Error('F06_3B_USAGE');
const c=await connect();try{
 if(mode==='--inject-rollback'){
  try{await apply(c,{inject:true});throw Error('F06_3B_EXPECTED_ROLLBACK_MISSING')}
  catch(e){if(e.message!=='F06_3B_INJECTED_MIGRATION_ROLLBACK')throw e}
  const row=(await c.query("SELECT to_regnamespace('f06_3b_ci')::text n")).rows[0];
  if(row.n!==null)throw Error('F06_3B_DDL_ROLLBACK_FAILED');
  console.log('F06_3B_NATIVE_PG16_MIGRATION_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('F06_3B_SIDECAR_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_3B_SIGNED_VERIFY_PASS',JSON.stringify(await verify(c)));
}finally{await c.end()}