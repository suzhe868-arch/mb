import assert from 'node:assert/strict';
import {execFileSync,fork} from 'node:child_process';
import {createServer} from 'node:http';
const branch='feat/f06-real-transaction-cancel-http-pg16-01';
const refund='feat/f06-3c1-refund-pending-close-ci';
const deposit='feat/f06-3a-deposit-ledger-ci';
export function assertEntry(){
 for(const [k,v] of Object.entries({
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',GITHUB_EVENT_NAME:'push',API_HOST:'127.0.0.1',
 GITHUB_REF:'refs/heads/'+deposit,GITHUB_REF_NAME:deposit,F06_CANCEL_ENTRY_REF:'refs/heads/'+branch,
 F06_CANCEL_ENTRY_BRANCH:branch,F06_CANCEL_ENTRY_EVENT:'push',F06_CANCEL_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY',
 F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
 }))assert.equal(process.env[k],v,'F06_CANCEL_SERVER_FORBIDDEN_'+k);
 assert.equal(process.env.F06_CANCEL_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_CANCEL_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
}
const safe=(allowed,code,extra={})=>({allowed,code,...extra});
export const productionIssuer=()=>safe(false,'F06_CANCEL_PRODUCTION_ISSUER_NOT_WIRED');
export function childCall(operation,token,params={},onReady){
 assertEntry();
 return new Promise((resolve,reject)=>{
  const child=fork(new URL('./worker.mjs',import.meta.url),[],{
   cwd:process.cwd(),execArgv:[],stdio:['ignore','ignore','pipe','ipc'],
   env:{...process.env,GITHUB_REF:'refs/heads/'+refund,GITHUB_REF_NAME:refund,
    F06_TX_ENTRY_REF:'refs/heads/feat/f06-real-lock-transaction-http-pg16-01',
    F06_TX_ENTRY_BRANCH:'feat/f06-real-lock-transaction-http-pg16-01',
    F06_TX_ENTRY_SHA:process.env.GITHUB_SHA,
    F06_TX_ENTRY_RUN_ID:process.env.GITHUB_RUN_ID,
    F06_TX_ENTRY_EVENT:'push',
    F06_TX_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY'}
  });
  let done=false,details='';
  child.stderr.on('data',x=>details=(details+x.toString()).slice(-1000));
  function fail(e){if(!done){done=true;child.kill();reject(e)}}
  child.on('error',fail);child.on('exit',code=>{if(!done)fail(Error('F06_CANCEL_CHILD_EXIT_'+code+' '+details))});
  child.on('message',m=>{
   if(m.type==='ready'){
    try{if(onReady)onReady()}catch(e){return fail(e)}
    child.send({operation,token,params});
   }else if(m.type==='result'&&!done){done=true;resolve(m.result)}
  });
 });
}
function status(r){
 if(r.allowed)return r.code==='F06_CANCEL_IDEMPOTENT'?200:201;
 if(/INVALID/.test(r.code))return 400;
 if(/SESSION/.test(r.code))return 401;
 if(/PERMISSION|SCOPE/.test(r.code))return 403;
 if(/NOT_FOUND/.test(r.code))return 404;
 return 409;
}
function respond(res,status,body){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
 res.end(JSON.stringify(body));
}
export function createHttpServer(){
 assertEntry();
 return createServer(async(req,res)=>{
  try{
   if(!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.localAddress))return respond(res,404,safe(false,'NOT_FOUND'));
   if(req.method!=='POST'||req.url!=='/__ci__/f06-real-transaction-cancel/cancel')return respond(res,404,safe(false,'NOT_FOUND'));
   const token=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||'')?.[1];
   if(!token)return respond(res,401,safe(false,'F06_CANCEL_SESSION_DENIED'));
   if(!String(req.headers['content-type']||'').startsWith('application/json'))return respond(res,415,safe(false,'UNSUPPORTED_MEDIA'));
   let input='',size=0;
   for await(const chunk of req){size+=chunk.length;if(size>8192)return respond(res,413,safe(false,'BODY_TOO_LARGE'));input+=chunk}
   let p;
   try{p=JSON.parse(input);if(!p||typeof p!=='object'||Array.isArray(p))throw Error()}
   catch{return respond(res,400,safe(false,'F06_CANCEL_INVALID_JSON'))}
   const r=await childCall('cancel',token,{transactionId:p.transactionId,reason:p.reason,eventKey:p.eventKey,testCheckpoint:p.testCheckpoint});
   return respond(res,status(r),r.allowed?safe(true,r.code,{transactionId:r.transactionId,backendPid:r.backendPid}):safe(false,r.code,{backendPid:r.backendPid}));
  }catch(e){return respond(res,503,safe(false,'F06_CANCEL_SAFE_UNAVAILABLE'))}
 });
}
