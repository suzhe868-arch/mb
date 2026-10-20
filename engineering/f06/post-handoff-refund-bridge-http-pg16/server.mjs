// Disposable CI loopback only. No production routing, payments or issuer.
import assert from 'node:assert/strict';
import {execFileSync,fork} from 'node:child_process';
import {createServer} from 'node:http';
const branch='feat/f06-signed-post-handoff-refund-bridge-01';
const ref='feat/f06-3c1-refund-pending-close-ci';
const root='/__ci__/f06-post-handoff-refund-bridge/';
const denied=(code)=>({allowed:false,code});
export function assertEntry(){
 for(const [k,v] of Object.entries({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',
  CI:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_REF:'refs/heads/'+ref,GITHUB_REF_NAME:ref,
  F06_BRIDGE_ENTRY_BRANCH:branch,F06_BRIDGE_ENTRY_REF:'refs/heads/'+branch,
  F06_BRIDGE_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_SIGNED_REFUND_BRIDGE_ONLY',
  F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
 }))assert.equal(process.env[k],v,'F06_BRIDGE_ENTRY_DENIED_'+k);
 assert.equal(process.env.F06_BRIDGE_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_BRIDGE_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
}
const status=r=>r.allowed?(/IDEMPOTENT/.test(r.code)?200:201):
 /INVALID/.test(r.code)?400:/SESSION/.test(r.code)?401:
 /PERMISSION|SCOPE/.test(r.code)?403:/NOT_FOUND|MISSING/.test(r.code)?404:409;
const respond=(res,code,result)=>{
 res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'});
 res.end(JSON.stringify(result));
};
export function childCall(operation,token,params={},onReady){
 assertEntry();
 return new Promise((resolve,reject)=>{
  const child=fork(new URL('./worker.mjs',import.meta.url),[],{
   cwd:process.cwd(),execArgv:[],stdio:['ignore','ignore','pipe','ipc'],
   env:{...process.env,GITHUB_REF:'refs/heads/'+ref,GITHUB_REF_NAME:ref}});
  let settled=false,err='';
  child.stderr.on('data',chunk=>err=(err+chunk.toString()).slice(-1300));
  const fail=e=>{if(!settled){settled=true;child.kill();reject(e)}};
  child.on('error',fail);
  child.on('exit',code=>{if(!settled)fail(Error('F06_BRIDGE_WORKER_EXIT_'+code+' '+err))});
  child.on('message',m=>{
   if(m.type==='ready'){
    try{onReady?.();child.send({operation,token,params})}catch(e){fail(e)}
   }else if(m.type==='result'&&!settled){settled=true;resolve(m.result)}
  });
 });
}
export function createHttpServer(){
 assertEntry();
 return createServer(async(req,res)=>{
  try{
   if(!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.localAddress))
    return respond(res,404,denied('NOT_FOUND'));
   const operation=({'POST '+root+'request':'request','POST '+root+'close':'close'})[req.method+' '+req.url];
   if(!operation)return respond(res,404,denied('NOT_FOUND'));
   const token=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.authorization||'')?.[1];
   if(!token)return respond(res,401,denied('F06_BRIDGE_SESSION_DENIED'));
   if(!String(req.headers['content-type']||'').startsWith('application/json'))
    return respond(res,415,denied('F06_BRIDGE_UNSUPPORTED_MEDIA'));
   let data='',bytes=0;
   for await(const b of req){bytes+=b.length;if(bytes>8192)return respond(res,413,denied('F06_BRIDGE_BODY_TOO_LARGE'));data+=b}
   let p;try{p=JSON.parse(data);if(!p||Array.isArray(p)||typeof p!=='object')throw Error()}catch{return respond(res,400,denied('F06_BRIDGE_INVALID_JSON'))}
   const params=operation==='request'?{transactionId:p.transactionId,amountCents:p.amountCents,reason:p.reason,eventKey:p.eventKey,testCheckpoint:p.testCheckpoint}:
    {refundId:p.refundId,closeReason:p.closeReason,eventKey:p.eventKey,testCheckpoint:p.testCheckpoint};
   const r=await childCall(operation,token,params);
   const safe=r.allowed?{allowed:true,code:r.code,refundId:r.refundId,backendPid:r.backendPid}:
    {allowed:false,code:r.code,backendPid:r.backendPid};
   return respond(res,status(r),safe);
  }catch{return respond(res,503,denied('F06_BRIDGE_SAFE_UNAVAILABLE'))}
 });
}
