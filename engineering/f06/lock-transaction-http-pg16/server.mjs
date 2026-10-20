import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {openSyntheticTransactionCI,productionIssuerDeny} from './service.mjs';
const target='feat/f06-real-lock-transaction-http-pg16-01';
const parent='feat/f06-3a-deposit-ledger-ci';
export function assertRealEntry(){
 for(const [k,v] of Object.entries({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',
  CI:'true',APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
  F06_TX_ENTRY_REF:'refs/heads/'+target,F06_TX_ENTRY_BRANCH:target,
  F06_TX_ENTRY_EVENT:'push',GITHUB_REF:'refs/heads/'+parent,GITHUB_REF_NAME:parent,
  F06_TX_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_LOCK_TRANSACTION_ONLY'
 })) assert.equal(process.env[k],v,'F06_TX_ENTRY_'+k);
 assert.equal(process.env.F06_TX_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_TX_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
 assert.equal(process.env.F03_1_DATABASE_URL,'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test');
}
const payload=(allowed,code,extra={})=>({allowed,code,...extra});
function send(res,status,body){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer','x-frame-options':'DENY'});
 res.end(JSON.stringify(body));
}
function token(req){
 const header=req.headers.authorization||'';
 return /^Bearer ([A-Za-z0-9._~-]{16,512})$/.exec(header)?.[1]||null;
}
async function readBody(req){
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')){
  const e=new Error('JSON_REQUIRED');e.code='F06_TX_JSON_REQUIRED';e.status=415;throw e;
 }
 let bytes=0,chunks=[];
 for await (const b of req){bytes+=b.length;if(bytes>16384){
  const e=new Error('BODY_TOO_LARGE');e.code='F06_TX_BODY_TOO_LARGE';e.status=413;throw e;
 }chunks.push(b);}
 if(bytes===0){const e=new Error('EMPTY_JSON');e.code='F06_TX_INVALID_JSON';e.status=400;throw e;}
 let result;try{result=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{
  const e=new Error('INVALID_JSON');e.code='F06_TX_INVALID_JSON';e.status=400;throw e;
 }
 if(!result||typeof result!=='object'||Array.isArray(result)){
  const e=new Error('OBJECT_REQUIRED');e.code='F06_TX_INVALID_JSON';e.status=400;throw e;
 }
 return result;
}
function status(result){
 if(result.allowed){
  return result.code==='F06_TX_IDEMPOTENT'?200:201;
 }
 const c=result.code||'';
 if(c.includes('SESSION'))return 401;
 if(c.includes('NOT_FOUND'))return 404;
 if(c.includes('INVALID')||c.includes('JSON'))return 400;
 if(c.includes('CONFLICT')||c.includes('INACTIVE')||c.includes('OCCUPIED')||c.includes('REFUND')||c.includes('ROLLED_BACK')||c.includes('CONTENTION'))return 409;
 return 403;
}
export function createHttpServer({auth}){
 assertRealEntry();
 return createServer(async(req,res)=>{
  try{
   if(req.url!=='/__ci__/f06-real-lock-transaction/open'||req.method!=='POST'){
    return send(res,404,payload(false,'NOT_FOUND'));
   }
   if(!req.socket.localAddress||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.localAddress))
    return send(res,404,payload(false,'NOT_FOUND'));
   const bearer=token(req);
   if(!bearer)return send(res,401,payload(false,'F06_TX_SIGNED_SESSION_DENIED'));
   const params=await readBody(req);
   const result=await openSyntheticTransactionCI(auth,bearer,{
    lockId:params.lockId,eventKey:params.eventKey,
    testCheckpoint:params.testCheckpoint
   });
   const safe=result.allowed?{allowed:true,code:result.code,
    transactionId:result.transactionId,sourceLockId:result.sourceLockId,backendPid:result.backendPid}:
    payload(false,result.code||'F06_TX_DENIED');
   return send(res,status(result),safe);
  }catch(e){
   if(e.status)return send(res,e.status,payload(false,e.code||'F06_TX_BAD_REQUEST'));
   return send(res,500,payload(false,'F06_TX_SAFE_SERVER_ERROR'));
  }
 });
}
export function productionDenyHandler(){
 assertRealEntry();
 return (_req,res)=>send(res,404,payload(false,'NOT_FOUND'));
}
export function productionIssuer(){return productionIssuerDeny()}
