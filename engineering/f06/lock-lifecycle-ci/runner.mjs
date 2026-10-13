import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];if(!['--inject-rollback','--apply','--verify'].includes(mode))throw Error('F06_2_USAGE');
const c=await connect();try{
 if(mode==='--inject-rollback'){
  try{await apply(c,{inject:true});throw Error('F06_2_INJECTION_NOT_ROLLED_BACK')}catch(e){
   if(e.message!=='F06_2_TEST_INJECTED_ROLLBACK')throw e;
  }
  const x=(await c.query("SELECT to_regnamespace('f06_2_ci')::text name")).rows[0];
  if(x.name!==null)throw Error('F06_2_SIDECAR_BAD_ROLLBACK');
  console.log('F06_2_V28_INJECTED_ROLLBACK_PRESERVED_SIGNED_V26');
 }else if(mode==='--apply')console.log('F06_2_V28_SIDECAR_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_2_V28_SIDECAR_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
