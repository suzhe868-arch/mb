import {connect,apply,verify} from './migration.mjs';
const mode=process.argv[2];if(!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F06_5A_USAGE');
const c=await connect();try{
 if(mode==='--inject-rollback'){try{await apply(c,{inject:true});throw Error('F06_5A_EXPECTED_ROLLBACK_MISSING')}
 catch(e){if(e.message!=='F06_5A_INJECTED_DDL_ROLLBACK')throw e}
 if((await c.query("SELECT to_regnamespace('f06_5a_ci')::text n")).rows[0].n!==null)throw Error('F06_5A_DDL_ROLLBACK_LEAK');console.log('F06_5A_NATIVE_DDL_ROLLBACK_PASS')}
 else if(mode==='--apply')console.log('F06_5A_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_5A_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
