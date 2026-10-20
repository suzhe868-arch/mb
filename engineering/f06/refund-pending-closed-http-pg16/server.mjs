// Strict loopback HTTP interface for non-production synthetic Lock Refund only.
import assert from 'node:assert/strict';
import {execFileSync,fork} from 'node:child_process';
import {createServer} from 'node:http';
const branch='feat/f06-real-refund-pending-closed-http-pg16-01';
const signed='feat/f06-3a-deposit-ledger-ci';
const legacyRefund='feat/f06-3c1-refund-pending-close-ci';
const TX='feat/f06-real-lock-transaction-http-pg16-01';
const route='/__ci__/f06-real-refund/';
export function assertRealEntry(){
 for(const [k,v] of Object.entries({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',
  CI:'true',APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
  GITHUB_REF:'refs/heads/'+signed,GITHUB_REF_NAME:signed,
  F06_REFUND_ENTRY_REF:'refs/heads/'+branch,F06_REFUND_ENTRY_BRANCH:branch,
  F06_REFUND_ENTRY_EVENT:'push',F06_REFUND_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_REFUND_PENDING_CLOSED_ONLY'
 }))assert.equal(process.env[k],v,'F06_REFUND_ENTRY_GATE_'+k);
 assert.equal(process.env.F06_REFUND_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_REFUND_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[0-9a-f]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
 assert.equal(process.env.F03_1_DATABASE_URL,'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test');
}
const safe=(allowed,code,extra={})=>({allowed,code,...extra});
function status(x){
 if(x.allowed)return /IDEMPOTENT/.test(x.code)?200:201;
 if(/SESSION/.test(x.code))return 401;
 if(/INVALID/.test(x.code))return 400;
 if(/MISSING|NOT_FOUND/.test(x.code))return 404;
 if(/SCOPE|PERMISSION|REQUIRED/.test(x.code))return 403;
 return 409;
}
function respond(res,http,body){
 res.writeHead(http,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'});
 res.end(JSON.stringify(body));
}
async function read(req){
 if(!String(req.headers['content-type']||'').startsWith('application/json')){
  const e=Error('MEDIA');e.status=415;throw e;
 }
 let all='',bytes=0;
 for await(const part of req){bytes+=part.length;if(bytes>8192){const e=Error('TOO_LARGE');e.status=413;throw e}all+=part}
 try{const b=JSON.parse(all);if(!b||Array.isArray(b)||typeof b!=='object')throw Error();return b}
 catch{const e=Error('INVALID');e.status=400;throw e}
}
function extract(req){return /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||'')?.[1]||null}
export function childCall(operation,token,params={},onReady){
 assertRealEntry();
 const isTx=operation==='transaction';
 const ref=legacyRefund;
 return new Promise((resolve,reject)=>{
  const child=fork(new URL('./worker.mjs',import.meta.url),[],{
   cwd:process.cwd(),execArgv:[],stdio:['ignore','ignore','pipe','ipc'],
   env:{...process.env,GITHUB_REF:'refs/heads/'+ref,GITHUB_REF_NAME:ref,
    F06_REFUND_WORKER_MODE:isTx?'transaction':'refund',
    F06_TX_ENTRY_REF:'refs/heads/'+TX,F06_TX_ENTRY_BRANCH:TX,
    F06_TX_ENTRY_EVENT:'push',F06_TX_ENTRY_SHA:process.env.GITHUB_SHA,F06_TX_ENTRY_RUN_ID:process.env.GITHUB_RUN_ID,
    F06_TX_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY'}
  });
  let done=false,stderr='';
  child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-1000)});
  const fail=e=>{if(!done){done=true;child.kill();reject(e)}};
  child.on('error',fail);
  child.on('exit',code=>{if(!done)fail(Error('F06_REFUND_WORKER_EXIT_'+code+' '+stderr))});
  child.on('message',msg=>{
   if(msg.type==='ready'){
    try{if(onReady)onReady()}catch(e){fail(e);return}
    child.send({operation,token,params});
   }else if(msg.type==='result'&&!done){done=true;resolve(msg.result)}
  });
 });
}
export function createHttpServer(){
 assertRealEntry();
 return createServer(async(req,res)=>{
  try{
   if(!req.socket.localAddress||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.localAddress))return respond(res,404,safe(false,'NOT_FOUND'));
   const allow={['POST '+route+'pending']:'request',['POST '+route+'closed']:'close'};
   const action=allow[req.method+' '+req.url];
   if(!action)return respond(res,404,safe(false,'NOT_FOUND'));
   const token=extract(req);if(!token)return respond(res,401,safe(false,'F06_REFUND_SESSION_DENIED'));
   const b=await read(req);
   const params=action==='request'?{lockId:b.lockId,amountCents:b.amountCents,reason:b.reason,eventKey:b.eventKey,testCheckpoint:b.testCheckpoint}:
      {refundId:b.refundId,closeReason:b.closeReason,eventKey:b.eventKey,testCheckpoint:b.testCheckpoint};
   const out=await childCall(action,token,params);
   // No money balance, private identity, token or signed funding proofs in HTTP.
   return respond(res,status(out),out.allowed?
      safe(true,out.code,{refundId:out.refundId,backendPid:out.backendPid}):
      safe(false,out.code,{backendPid:out.backendPid}));
  }catch(e){return respond(res,e.status||503,safe(false,e.status?'F06_REFUND_BAD_REQUEST':'F06_REFUND_SAFE_SERVICE_UNAVAILABLE'))}
 });
}
export const productionRefundIssuer=()=>safe(false,'F06_REFUND_PRODUCTION_ISSUER_NOT_WIRED');
