// Allowed only in disposable PG16 16.x, nonprivileged f03_ci CI database.
import {connect,apply,verify,PREVIOUS} from './migration.mjs';
import {verify as verifyM94} from '../../f03/runtime-transaction-responsible-handover/migration.mjs';
const flag=process.argv.slice(2);
if(flag.length!==1||!['--inject-rollback','--apply','--verify'].includes(flag[0]))throw Error('F05_2_RUNNER_INVALID_ARGUMENT');
const c=await connect();
try{
 if(flag[0]==='--inject-rollback'){
  await verifyM94(c);
  try{await apply(c,{inject:true});throw Error('F05_2_INJECTION_NOT_RAISED')}catch(e){
   if(e.message!=='F05_2_INJECTED_ROLLBACK')throw e;
  }
  const r=await verifyM94(c);if(r.sha!==PREVIOUS)throw Error('F05_2_ROLLBACK_M94_DRIFT');
  console.log('F05_2_INJECTED_AT_DDL_TRANSACTION_ROLLBACK_REAL_PG16_PASS');
 }else if(flag[0]==='--apply'){
  const x=await apply(c);console.log('F05_2_ADD_MIGRATION_SUCCESS '+JSON.stringify(x));
 }else {
  const x=await verify(c);console.log('F05_2_FULL_SCHEMA_VERSION_DIFF_SEAL_PASS '+JSON.stringify(x));
 }
}catch(e){console.error('F05_2_REAL_PG16_FAIL:',e.message);process.exitCode=1}
finally{await c.end()}
