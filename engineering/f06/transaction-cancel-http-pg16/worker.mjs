// Only bounded child process. Real GitHub Run SHA, repository, event and
// disposable PG16 are verified; no production keys or permanent ref updates.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../refund-pending-ci/migration.mjs';
import {cancelSyntheticRealTransactionCI,gate} from './service.mjs';
import {cancelSyntheticTransactionCI} from '../transaction-cancel-ci/service.mjs';
import {openSyntheticTransactionCI} from '../lock-transaction-http-pg16/service.mjs';
const ref3c1='feat/f06-3c1-refund-pending-close-ci',ref3a='feat/f06-3a-deposit-ledger-ci';
gate();
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
assert.equal(typeof process.send,'function','F06_CANCEL_IPC_REQUIRED');
const secret=Buffer.alloc(32,61);
let auth,db;
try{
 db=await connect();
 const parent=await verify(db);assert.equal(parent.verified,true);
 process.send({type:'ready',parentSHA:parent.sourceSHA});
 const msg=await new Promise(resolve=>process.once('message',resolve));
 assert.ok(msg&&['cancel','open','legacy','inspect'].includes(msg.operation));
 auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
 let pid=null;
 const original=auth.withSession.bind(auth);
 auth.withSession=(token,fn,options)=>original(token,async(c,...args)=>{
  pid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  return fn(c,...args);
 },options);
 let result;
 if(msg.operation==='cancel')result=await cancelSyntheticRealTransactionCI(auth,msg.token,msg.params);
 else if(msg.operation==='open'){
  process.env.GITHUB_REF='refs/heads/'+ref3a;
  process.env.GITHUB_REF_NAME=ref3a;
  result=await openSyntheticTransactionCI(auth,msg.token,msg.params);
 }else if(msg.operation==='legacy'){
  const ref4a='feat/f06-4a-transaction-cancel-ci';
  process.env.GITHUB_REF='refs/heads/'+ref4a;
  process.env.GITHUB_REF_NAME=ref4a;
  result=await cancelSyntheticTransactionCI(auth,msg.token,msg.params);
 }else {
  const x=(await db.query("SELECT (SELECT count(*)::int FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1) native_old,(SELECT count(*)::int FROM f06_real_tx_ci.origins WHERE transaction_id=$1) real_signed",(msg.params?.transactionId?[msg.params.transactionId]:[0]))).rows[0];
  result={allowed:true,code:'F06_CANCEL_SOURCE_COMPATIBILITY',old3b:Number(x.native_old),pr139:Number(x.real_signed)};
 }
 process.send({type:'result',result:{...result,backendPid:pid}});
}catch(e){
 const message=String(e.message||'');
 process.send({type:'result',result:{allowed:false,
  code:message.startsWith('F06_CANCEL_INJECTED_')?'F06_CANCEL_ATOMIC_ROLLED_BACK':
    ['55P03','40P01','40001','23505'].includes(e.code)?'F06_CANCEL_PG_CONTENTION_DENY':'F06_CANCEL_TRUSTED_SOURCE_OR_ISOLATION_DENY'}});
}finally{
 if(auth)await auth.close();
 if(db)await db.end();
 secret.fill(0);
}
