// CI-only worker: real signed Employee session + native PG16 transaction.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify,requestSignedHandoffRefundCI,closeSignedHandoffRefundCI} from '../transaction-refund-http-pg16/service.mjs';
import {verifyCancelledHandoffProvenance} from './签名来源只读核验.mjs';
const expected='feat/f06-signed-post-handoff-refund-bridge-01';
assert.equal(process.env.F06_BRIDGE_ENTRY_BRANCH,expected);
assert.equal(process.env.F06_BRIDGE_ENTRY_SHA,process.env.GITHUB_SHA);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
assert.equal(typeof process.send,'function');
const secret=Buffer.alloc(32,61);let db,auth,pid=null;
try{
 db=await connect();
 await verify(db);
 process.send({type:'ready'});
 const m=await new Promise(resolve=>process.once('message',resolve));
 assert.ok(['request','close','inspect'].includes(m.operation));
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 const original=auth.withSession.bind(auth);
 auth.withSession=(token,callback,options)=>original(token,async(c,...a)=>{
  pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  return callback(c,...a);
 },options);
 let result;
 if(m.operation==='request')result=await requestSignedHandoffRefundCI(auth,m.token,m.params);
 if(m.operation==='close')result=await closeSignedHandoffRefundCI(auth,m.token,m.params);
 if(m.operation==='inspect'){
  await verifyCancelledHandoffProvenance(db,m.params.transactionId);
  const r=(await db.query("SELECT refund_id,status,transaction_id,lock_id,expected_amount_cents,closed_at FROM public.refund_cases WHERE transaction_id=$1 ORDER BY refund_id",[m.params.transactionId])).rows;
  result={allowed:true,code:'F06_BRIDGE_INSPECT',cases:r};
 }
 process.send({type:'result',result:{...result,backendPid:pid}});
}catch(e){
 process.send({type:'result',result:{allowed:false,
  code:/F06_TX_REFUND_(INJECTED_|ATOMIC_|FINAL_)/.test(String(e.message))?
   'F06_TX_REFUND_ATOMIC_ROLLED_BACK':'F06_BRIDGE_SAFE_UNAVAILABLE',
  ciFailure:{state:String(e.code||'NO_SQLSTATE').slice(0,20),
    message:String(e.message||'UNKNOWN').slice(0,400)}}});
}finally{if(auth)await auth.close();if(db)await db.end();secret.fill(0)}
