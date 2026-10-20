import assert from 'node:assert/strict';
import {execFileSync,fork} from 'node:child_process';
import {createServer} from 'node:http';
const branch='feat/f06-real-transaction-handoff-http-pg16-01';
const ref3c1='feat/f06-3c1-refund-pending-close-ci';
const path='/__ci__/f06-real-transaction-handoff/transfer';
const no=(code)=>({allowed:false,code});
export function assertEntry(){
 for(const [k,v] of Object.entries({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',CI:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/'+ref3c1,GITHUB_REF_NAME:ref3c1,
  F06_HANDOFF_ENTRY_REF:'refs/heads/'+branch,F06_HANDOFF_ENTRY_BRANCH:branch,F06_HANDOFF_ENTRY_EVENT:'push',
  F06_HANDOFF_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_HANDOFF_ONLY',
  F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
 }))assert.equal(process.env[k],v,'F06_HANDOFF_ENTRY_DENIED_'+k);
 assert.equal(process.env.F06_HANDOFF_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_HANDOFF_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
}
export function childCall(operation,token,params={},readyHook){
 assertEntry();
 return new Promise((resolve,reject)=>{
  const child=fork(new URL('./worker.mjs',import.meta.url),[],{
   cwd:process.cwd(),execArgv:[],stdio:['ignore','ignore','pipe','ipc'],env:{...process.env,
   GITHUB_REF:'refs/heads/'+ref3c1,GITHUB_REF_NAME:ref3c1}
  });
  let done=false,stderr='';
  child.stderr.on('data',x=>stderr=(stderr+x.toString()).slice(-1500));
  const fail=e=>{if(!done){done=true;child.kill();reject(e)}};
  child.on('error',fail);child.on('exit',code=>{if(!done)fail(Error('F06_HANDOFF_WORKER_EXIT_'+code+' '+stderr))});
  child.on('message',m=>{
   if(m.type==='ready'){try{readyHook?.()}catch(e){return fail(e)}child.send({operation,token,params})}
   else if(m.type==='result'&&!done){
    if(m.result?.ciFailure&&process.env.F06_HANDOFF_TEST_CONSENT==='I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_HANDOFF_ONLY')
     console.error('F06_HANDOFF_DISPOSABLE_INTERNAL_SQL_DIAG',JSON.stringify(m.result.ciFailure));
    done=true;resolve(m.result);
   }
  });
 });
}
function respond(res,status,body){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'});
 res.end(JSON.stringify(body));
}
function status(r){
 if(r.allowed)return r.code==='F06_REAL_HANDOFF_IDEMPOTENT'?200:201;
 if(/INVALID/.test(r.code))return 400;
 if(/SESSION/.test(r.code))return 401;
 if(/PERMISSION|SCOPE/.test(r.code))return 403;
 if(/NOT_FOUND/.test(r.code))return 404;
 return 409;
}
export function createHttpServer(){
 assertEntry();
 return createServer(async(req,res)=>{
  try{
   if(!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.localAddress))
    return respond(res,404,no('NOT_FOUND'));
   if(req.url!==path||req.method!=='POST')return respond(res,404,no('NOT_FOUND'));
   const token=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||'')?.[1];
   if(!token)return respond(res,401,no('F06_REAL_HANDOFF_SIGNED_SESSION_DENIED'));
   if(!String(req.headers['content-type']||'').startsWith('application/json'))return respond(res,415,no('UNSUPPORTED_MEDIA'));
   let body='',size=0;
   for await(const part of req){size+=part.length;if(size>8192)return respond(res,413,no('BODY_TOO_LARGE'));body+=part}
   let p;try{p=JSON.parse(body);if(!p||Array.isArray(p)||typeof p!=='object')throw Error()}catch{return respond(res,400,no('F06_REAL_HANDOFF_INVALID_JSON'))}
   const result=await childCall('handoff',token,{transactionId:p.transactionId,expectedOldResponsibleId:p.expectedOldResponsibleId,
    expectedVersion:p.expectedVersion,newResponsibleId:p.newResponsibleId,reason:p.reason,eventKey:p.eventKey,testCheckpoint:p.testCheckpoint});
   const safe=result.allowed?{allowed:true,code:result.code,version:result.version,oldResponsibleId:result.oldResponsibleId,newResponsibleId:result.newResponsibleId,eventId:result.eventId,backendPid:result.backendPid}:
    {allowed:false,code:result.code,backendPid:result.backendPid};
   return respond(res,status(result),safe);
  }catch{return respond(res,503,no('F06_REAL_HANDOFF_SAFE_UNAVAILABLE'))}
 });
}
export const productionIssuerDeny=()=>no('F06_REAL_HANDOFF_PRODUCTION_ISSUER_NOT_WIRED');
