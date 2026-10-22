import {connect,apply,verify} from './migration.mjs';
const c=await connect();
try{
 if(process.argv.includes('--inject-rollback')){
  try{await apply(c,{inject:true});throw Error('F05_EDIT_ROLLBACK_SHOULD_FAIL')}catch(e){
   if(e.message!=='F05_EDIT_INJECTED_DDL_ROLLBACK')throw e;
   if((await c.query("SELECT to_regnamespace('f05_published_edit_test') AS n")).rows[0].n!==null)throw Error('F05_EDIT_ROLLBACK_LEAK');
   console.log('F05_EDIT_PRIVATE_DDL_REAL_ROLLBACK_PASS');
  }
 }else if(process.argv.includes('--apply'))console.log(JSON.stringify(await apply(c)));
 else if(process.argv.includes('--verify'))console.log(JSON.stringify(await verify(c)));
 else throw Error('F05_EDIT_RUNNER_MODE_REQUIRED');
}finally{await c.end()}
