import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify,gate,handoffRealTransactionCI,currentSignedResponsibleCI} from './service.mjs';
import {openSyntheticTransactionCI} from '../lock-transaction-http-pg16/service.mjs';
import {cancelSyntheticRealTransactionCI} from '../transaction-cancel-http-pg16/service.mjs';
import {requestTransactionRefundCI} from '../transaction-refund-http-pg16/service.mjs';
gate();assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
assert.equal(typeof process.send,'function','F06_REAL_HANDOFF_IPC_REQUIRED');
const secret=Buffer.alloc(32,61);
let db,auth;
try{
 db=await connect();await verify(db);
 process.send({type:'ready'});
 const msg=await new Promise(resolve=>process.once('message',resolve));
 assert.ok(['handoff','open','cancel','refund','inspect','legacy','verify'].includes(msg.operation));
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 let pid=null;
 const original=auth.withSession.bind(auth);
 auth.withSession=(token,fn,opts)=>original(token,async(c,...args)=>{
  pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  return fn(c,...args);
 },opts);
 let result;
 if(msg.operation==='handoff')result=await handoffRealTransactionCI(auth,msg.token,msg.params);
 else if(msg.operation==='inspect')result=await currentSignedResponsibleCI(db,msg.params.transactionId);
 else if(msg.operation==='open'){
  process.env.GITHUB_REF='refs/heads/feat/f06-3a-deposit-ledger-ci';
  process.env.GITHUB_REF_NAME='feat/f06-3a-deposit-ledger-ci';
  result=await openSyntheticTransactionCI(auth,msg.token,msg.params);
 }else if(msg.operation==='cancel')result=await cancelSyntheticRealTransactionCI(auth,msg.token,msg.params);
 else if(msg.operation==='refund')result=await requestTransactionRefundCI(auth,msg.token,msg.params);
 else if(msg.operation==='legacy'){
  const o=(await db.query("SELECT (SELECT count(*)::int FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1) old_3b,(SELECT count(*)::int FROM f06_real_tx_ci.origins WHERE transaction_id=$1) signed_pr139",[msg.params.transactionId])).rows[0];
  result={allowed:true,code:'F06_REAL_HANDOFF_OLD_4B_INCOMPATIBLE_WITH_PR139',old3b:Number(o.old_3b),signedPr139:Number(o.signed_pr139)};
 }else result={allowed:true,code:'F06_REAL_HANDOFF_NATIVE_SIGNATURES_VERIFIED'};
 process.send({type:'result',result:{...result,backendPid:pid}});
}catch(e){
 // CI-only IPC diagnostic, never returned by the public HTTP responder.
 const ciFailure={state:String(e?.code||'NO_SQLSTATE').slice(0,20),
  message:String(e?.message||'UNKNOWN').slice(0,220)};
 process.send({type:'result',result:{allowed:false,ciFailure,code:
  /^F06_REAL_HANDOFF_(INJECTED_|FINAL_|SOURCE_SCOPE_CHANGED|PRECOMMIT_)/.test(String(e.message))?'F06_REAL_HANDOFF_ATOMIC_ROLLED_BACK':
  ['55P03','40P01','40001','23505'].includes(e.code)?'F06_REAL_HANDOFF_PG_CONTENTION_DENY':
  'F06_REAL_HANDOFF_TRUSTED_SOURCE_OR_ISOLATION_DENY'}});
}finally{if(auth)await auth.close();if(db)await db.end();secret.fill(0)}
