import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify,gate,requestTransactionRefundCI,closeTransactionRefundCI} from './service.mjs';
import {cancelSyntheticRealTransactionCI} from '../transaction-cancel-http-pg16/service.mjs';
import {openSyntheticTransactionCI} from '../lock-transaction-http-pg16/service.mjs';
const task='feat/f06-real-transaction-refund-http-pg16-01';
const tx='feat/f06-real-lock-transaction-http-pg16-01';
const deposit='feat/f06-3a-deposit-ledger-ci';
gate();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
assert.equal(typeof process.send,'function','F06_TX_REFUND_IPC_REQUIRED');
const secret=Buffer.alloc(32,61);
let auth,db;
const one=async(c,s,p=[]) => (await c.query(s,p)).rows[0];
try{
 db=await connect();
 const signed=await verify(db);assert.equal(signed.verified,true);
 process.send({type:'ready',sourceSHA:signed.sourceSHA});
 const msg=await new Promise(resolve=>process.once('message',resolve));
 assert.ok(msg&&['request','close','open','cancel','inspect','verify'].includes(msg.operation));
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 let backendPid=null;
 const original=auth.withSession.bind(auth);
 auth.withSession=(token,fn,options)=>original(token,async(c,...args)=>{
  backendPid=Number((await one(c,'SELECT pg_backend_pid() pid')).pid);
  return fn(c,...args);
 },options);
 let result;
 if(msg.operation==='request')result=await requestTransactionRefundCI(auth,msg.token,msg.params);
 else if(msg.operation==='close')result=await closeTransactionRefundCI(auth,msg.token,msg.params);
 else if(msg.operation==='open'){
  process.env.GITHUB_REF='refs/heads/'+deposit;process.env.GITHUB_REF_NAME=deposit;
  process.env.F06_TX_ENTRY_REF='refs/heads/'+tx;process.env.F06_TX_ENTRY_BRANCH=tx;
  process.env.F06_TX_ENTRY_SHA=process.env.GITHUB_SHA;process.env.F06_TX_ENTRY_RUN_ID=process.env.GITHUB_RUN_ID;
  process.env.F06_TX_ENTRY_EVENT='push';process.env.F06_TX_TEST_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY';
  result=await openSyntheticTransactionCI(auth,msg.token,msg.params);
 }else if(msg.operation==='cancel'){
  process.env.GITHUB_REF='refs/heads/feat/f06-3c1-refund-pending-close-ci';
  process.env.GITHUB_REF_NAME='feat/f06-3c1-refund-pending-close-ci';
  result=await cancelSyntheticRealTransactionCI(auth,msg.token,msg.params);
 }else if(msg.operation==='inspect'){
  const x=await one(db,"SELECT t.transaction_id,t.status,t.completed_at,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,t.responsible_employee_id, "+
   "(SELECT count(*)::int FROM f06_real_tx_refund_ci.origins o WHERE o.transaction_id=t.transaction_id) origins, "+
   "(SELECT count(*)::int FROM f06_real_tx_refund_ci.events e WHERE e.transaction_id=t.transaction_id) events, "+
   "(SELECT count(*)::int FROM f06_real_tx_refund_ci.request_keys k WHERE k.transaction_id=t.transaction_id) keys, "+
   "(SELECT count(*)::int FROM public.refund_cases r WHERE r.transaction_id=t.transaction_id) cases "+
   "FROM public.transactions t WHERE t.transaction_id=$1",[msg.params?.transactionId||0]);
  result=x?{allowed:true,code:'F06_TX_REFUND_INSPECT',facts:x}:{allowed:false,code:'F06_TX_REFUND_TRANSACTION_NOT_FOUND'};
 }else result={allowed:true,code:'F06_TX_REFUND_SIGNED_PARENT_VERIFIED',sourceSHA:signed.sourceSHA};
 process.send({type:'result',result:{...result,backendPid}});
}catch(e){
 const message=String(e.message||'');
 process.send({type:'result',result:{allowed:false,code:
  message.startsWith('F06_TX_REFUND_INJECTED_')||message.startsWith('F06_TX_REFUND_PENDING_ROW_LOST')||
  message.startsWith('F06_TX_REFUND_FINAL_')||message.startsWith('F06_TX_REFUND_SOURCE_CHANGED')||
  message.startsWith('F06_TX_REFUND_BALANCE_CHANGED')?'F06_TX_REFUND_ATOMIC_ROLLED_BACK':
  ['55P03','40P01','40001','23505'].includes(e.code)?'F06_TX_REFUND_PG_ATOMIC_CONTENTION_DENY':
  'F06_TX_REFUND_TRUSTED_SOURCE_OR_ISOLATION_DENY'}});
}finally{
 if(auth)await auth.close();
 if(db)await db.end();
 secret.fill(0);
}
