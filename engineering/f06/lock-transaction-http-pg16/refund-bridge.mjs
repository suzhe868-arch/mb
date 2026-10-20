// Independent-process bridge into the frozen SIGNED F06-3C1 refund service.
// Never changes the real GitHub ref; only this verified CI child receives
// the historical parent ref needed by the immutable source gate.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../refund-pending-ci/migration.mjs';
import {requestSyntheticRefundCI,closeSyntheticRefundCI} from '../refund-pending-ci/service.mjs';

const branch='feat/f06-real-lock-transaction-http-pg16-01';
const signed='feat/f06-3c1-refund-pending-close-ci';
for(const [k,v] of Object.entries({
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',
 GITHUB_EVENT_NAME:'push',CI:'true',APP_ENV:'test',NODE_ENV:'test',
 API_HOST:'127.0.0.1',GITHUB_REF:'refs/heads/'+signed,
 GITHUB_REF_NAME:signed,F06_TX_ENTRY_REF:'refs/heads/'+branch,
 F06_TX_ENTRY_BRANCH:branch,F06_TX_ENTRY_EVENT:'push',
 F06_TX_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY',
 F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
}))assert.equal(process.env[k],v,'F06_TX_REFUND_CHILD_GATE_'+k);
assert.equal(process.env.F06_TX_ENTRY_SHA,process.env.GITHUB_SHA);
assert.equal(process.env.F06_TX_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);

assert.equal(typeof process.send,'function','F06_TX_REFUND_BRIDGE_IPC_REQUIRED');
const db=await connect(),secret=Buffer.alloc(32,61);
let auth;
try{
 const parent=await verify(db);assert.equal(parent.verified,true);
 process.send({type:'ready',nativeSigned:true,sourceSHA:parent.sourceSHA});
 const request=await new Promise(resolve=>process.once('message',resolve));
 assert.ok(request&&['verify','request','close'].includes(request.operation),'F06_TX_REFUND_BRIDGE_OP');
 if(request.operation==='verify'){
  const pid=Number((await db.query('SELECT pg_backend_pid() pid')).rows[0].pid);
  process.send({type:'result',result:{allowed:true,code:'F06_TX_NATIVE_SIGNED_3C1_VERIFIED',pid,sourceSHA:parent.sourceSHA,carrier:parent.carrier}});
 }else{
  auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
  let backendPid=null;
  const original=auth.withSession.bind(auth);
  auth.withSession=(token,fn,options)=>original(token,async(c,...args)=>{
   backendPid=Number((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
   return fn(c,...args);
  },options);
  const result=request.operation==='request'
   ?await requestSyntheticRefundCI(auth,request.token,request.params)
   :await closeSyntheticRefundCI(auth,request.token,request.params);
  process.send({type:'result',result:{...result,backendPid}});
 }
}finally{
 if(auth)await auth.close();
 await db.end();
 secret.fill(0);
}
