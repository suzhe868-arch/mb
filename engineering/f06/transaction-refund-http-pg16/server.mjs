import assert from 'node:assert/strict';
import {execFileSync,fork} from 'node:child_process';
import {createServer} from 'node:http';
const branch='feat/f06-real-transaction-refund-http-pg16-01';
const signed='feat/f06-3c1-refund-pending-close-ci';
const cancel='feat/f06-real-transaction-cancel-http-pg16-01';
const tx='feat/f06-real-lock-transaction-http-pg16-01';
const base='/__ci__/f06-real-transaction-refund/';
export function assertEntry(){
 for(const [k,v] of Object.entries({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',
  CI:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_REF:'refs/heads/'+signed,GITHUB_REF_NAME:signed,
  F06_TXREFUND_ENTRY_REF:'refs/heads/'+branch,F06_TXREFUND_ENTRY_BRANCH:branch,
  F06_TXREFUND_ENTRY_EVENT:'push',
  F06_TXREFUND_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_REFUND_ONLY',
  F06_CANCEL_ENTRY_REF:'refs/heads/'+cancel,F06_CANCEL_ENTRY_BRANCH:cancel,
  F06_CANCEL_ENTRY_EVENT:'push',F06_CANCEL_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY',
  F06_TX_ENTRY_REF:'refs/heads/'+tx,F06_TX_ENTRY_BRANCH:tx,
  F06_TX_ENTRY_EVENT:'push',F06_TX_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY',
  F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
 }))assert.equal(process.env[k],v,'F06_TX_REFUND_HTTP_ENTRY_FORBIDDEN_'+k);
 for(const k of ['F06_TXREFUND_ENTRY_SHA','F06_CANCEL_ENTRY_SHA','F06_TX_ENTRY_SHA'])
  assert.equal(process.env[k],process.env.GITHUB_SHA);
 for(const k of ['F06_TXREFUND_ENTRY_RUN_ID','F06_CANCEL_ENTRY_RUN_ID','F06_TX_ENTRY_RUN_ID'])
  assert.equal(process.env[k],process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
}
const safe=(allowed,code,extra={})=>({allowed,code,...extra});
function status(x){
 if(x.allowed)return /IDEMPOTENT/.test(x.code)?200:201;
 if(/SESSION/.test(x.code))return 401;
 if(/INVALID/.test(x.code))return 400;
 if(/PERMISSION|SCOPE/.test(x.code))return 403;
 if(/NOT_FOUND|MISSING/.test(x.code))return 404;
 return 409;
}
function respond(res,http,body){
 res.writeHead(http,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'});
 res.end(JSON.stringify(body));
}
async function read(req){
 if(!String(req.headers['content-type']||'').startsWith('application/json')){const e=Error('MEDIA');e.status=415;throw e}
 let body='',size=0;
 for await(const part of req){size+=part.length;if(size>8192){const e=Error('TOO_LARGE');e.status=413;throw e}body+=part}
 try{const b=JSON.parse(body);if(!b||Array.isArray(b)||typeof b!=='object')throw Error();return b}
 catch{const e=Error('INVALID');e.status=400;throw e}
}
function bearer(req){return /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||'')?.[1]||null}
export function childCall(operation,token,params={},onReady){
 assertEntry();
 return new Promise((resolve,reject)=>{
  const child=fork(new URL('./worker.mjs',import.meta.url),[],{
   cwd:process.cwd(),execArgv:[],stdio:['ignore','ignore','pipe','ipc'],
   env:{...process.env,GITHUB_REF:'refs/heads/'+signed,GITHUB_REF_NAME:signed,
    F06_TXREFUND_ENTRY_REF:'refs/heads/'+branch,F06_TXREFUND_ENTRY_BRANCH:branch,
    F06_TXREFUND_ENTRY_EVENT:'push',F06_TXREFUND_ENTRY_SHA:process.env.GITHUB_SHA,
    F06_TXREFUND_ENTRY_RUN_ID:process.env.GITHUB_RUN_ID,
    F06_TXREFUND_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_REFUND_ONLY',
    F06_CANCEL_ENTRY_REF:'refs/heads/'+cancel,F06_CANCEL_ENTRY_BRANCH:cancel,
    F06_CANCEL_ENTRY_EVENT:'push',F06_CANCEL_ENTRY_SHA:process.env.GITHUB_SHA,
    F06_CANCEL_ENTRY_RUN_ID:process.env.GITHUB_RUN_ID,
    F06_CANCEL_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY',
    F06_TX_ENTRY_REF:'refs/heads/'+tx,F06_TX_ENTRY_BRANCH:tx,F06_TX_ENTRY_EVENT:'push',
    F06_TX_ENTRY_SHA:process.env.GITHUB_SHA,F06_TX_ENTRY_RUN_ID:process.env.GITHUB_RUN_ID,
    F06_TX_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY'}
  });
  let done=false,stderr='';
  child.stderr.on('data',b=>stderr=(stderr+b.toString()).slice(-1200));
  const fail=e=>{if(!done){done=true;child.kill();reject(e)}};
  child.on('error',fail);
  child.on('exit',code=>{if(!done)fail(Error('F06_TX_REFUND_WORKER_EXIT_'+code+' '+stderr))});
  child.on('message',msg=>{
   if(msg.type==='ready'){
    try{if(onReady)onReady()}catch(e){fail(e);return}
    child.send({operation,token,params});
   }else if(msg.type==='result'&&!done){done=true;resolve(msg.result)}
  });
 });
}
export function createHttpServer(){
 assertEntry();
 return createServer(async(req,res)=>{
  try{
   if(!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.localAddress))
    return respond(res,404,safe(false,'NOT_FOUND'));
   const routes={['POST '+base+'request']:'request',['POST '+base+'close']:'close'};
   const action=routes[req.method+' '+req.url];
   if(!action)return respond(res,404,safe(false,'NOT_FOUND'));
   const token=bearer(req);if(!token)return respond(res,401,safe(false,'F06_TX_REFUND_SESSION_DENIED'));
   const b=await read(req);
   const params=action==='request'?{transactionId:b.transactionId,amountCents:b.amountCents,reason:b.reason,eventKey:b.eventKey,testCheckpoint:b.testCheckpoint}:
    {refundId:b.refundId,closeReason:b.closeReason,eventKey:b.eventKey,testCheckpoint:b.testCheckpoint};
   const out=await childCall(action,token,params);
   return respond(res,status(out),out.allowed?
    safe(true,out.code,{refundId:out.refundId,transactionId:out.transactionId,backendPid:out.backendPid}):
    safe(false,out.code,{backendPid:out.backendPid}));
  }catch(e){return respond(res,e.status||503,safe(false,e.status?'F06_TX_REFUND_BAD_REQUEST':'F06_TX_REFUND_SAFE_UNAVAILABLE'))}
 });
}
export const productionRefundIssuerDeny=()=>safe(false,'F06_TX_REFUND_PRODUCTION_ISSUER_NOT_WIRED');
