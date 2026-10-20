import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {gate,connect,apply,verify} from './service.mjs';
gate();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
const mode=process.argv[2];if(!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F06_REAL_HANDOFF_CI_USAGE');
const c=await connect();
try{
 if(mode==='--inject-rollback'){
  try{await apply(c,{inject:true});throw Error('F06_REAL_HANDOFF_ROLLBACK_UNDETECTED')}
  catch(e){if(e.message!=='F06_REAL_HANDOFF_INJECTED_MIGRATION_ROLLBACK')throw e}
  const row=(await c.query("SELECT to_regnamespace('f06_real_handoff_ci')::text n")).rows[0];
  if(row.n!==null)throw Error('F06_REAL_HANDOFF_DDL_ROLLBACK_FAILED');
  console.log('F06_REAL_HANDOFF_PG16_DDL_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('F06_REAL_HANDOFF_CI_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_REAL_HANDOFF_CI_VERIFIED',JSON.stringify(await verify(c)));
}finally{await c.end()}
