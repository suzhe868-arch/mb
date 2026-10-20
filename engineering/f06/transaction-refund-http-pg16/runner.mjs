import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {connect,apply,verify,gate} from './service.mjs';
gate();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
const mode=process.argv[2];
if(!['--apply','--verify','--inject-rollback'].includes(mode))throw Error('F06_TX_REFUND_RUNNER_USAGE');
const c=await connect();
try{
 if(mode==='--inject-rollback'){
  try{await apply(c,{inject:true});throw Error('F06_TX_REFUND_EXPECTED_ROLLBACK_MISSING')}
  catch(e){if(e.message!=='F06_TX_REFUND_INJECTED_MIGRATION_ROLLBACK')throw e}
  const x=await c.query("SELECT to_regnamespace('f06_real_tx_refund_ci')::text n");
  if(x.rows[0].n!==null)throw Error('F06_TX_REFUND_MIGRATION_ROLLBACK_FAILED');
  console.log('F06_TX_REFUND_NATIVE_PG16_MIGRATION_ROLLBACK_PASS');
 }else if(mode==='--apply')console.log('F06_TX_REFUND_SIDECAR_APPLIED',JSON.stringify(await apply(c)));
 else console.log('F06_TX_REFUND_SIGNED_VERIFY_PASS',JSON.stringify(await verify(c)));
}finally{await c.end()}
