// F06 Issue164: one Node runtime and one disposable, non-superuser PG16 database.
// CI_LEGACY remains in its original isolated runtime; Composite is a separately selected
// service-side mode whose trust comes from a native signed issuer and F03 employee sessions.
import pg from 'pg';
import {createIsolatedF06LockService} from './f06-lock-service.mjs';
import {createIsolatedF06LockHandler} from './f06-lock-http.mjs';
import {assertCompositeSignedRun} from '../f06/nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {verifyCompositeAttestation} from '../f06/nonprod-single-runtime-integration/composite-issuer.mjs';
import {verifyComposite as verifyLockRequest} from '../f06/lockrequest-approval-waitlist-ci/migration.mjs';
import {verifyComposite as verifyLockLifecycle} from '../f06/lock-lifecycle-ci/migration.mjs';
import {verifyComposite as verifyDeposit} from '../f06/deposit-ledger-ci/migration.mjs';
import {verifyComposite as verifyTransaction} from '../f06/lock-transaction-ci/migration.mjs';
import {verifyComposite as verifyRefundPending} from '../f06/refund-pending-ci/migration.mjs';
import {verifyCompositeTransactionSidecar} from '../f06/lock-transaction-http-pg16/service.mjs';
import {verifyCompositeCancelSidecar} from '../f06/transaction-cancel-http-pg16/service.mjs';
import {verifyComposite as verifyTransactionRefund} from '../f06/transaction-refund-http-pg16/service.mjs';
import {verifyComposite as verifyTransactionHandoff} from '../f06/transaction-handoff-http-pg16/service.mjs';
import {verifyComposite as verifyPostHandoffCancel} from '../f06/post-handoff-cancel-http-pg16/service.mjs';
import {recordSyntheticDepositComposite} from '../f06/deposit-ledger-ci/service.mjs';
import {openSyntheticTransactionComposite} from '../f06/lock-transaction-http-pg16/service.mjs';
import {handoffRealTransactionComposite} from '../f06/transaction-handoff-http-pg16/service.mjs';
import {cancelAfterSignedHandoffComposite} from '../f06/post-handoff-cancel-http-pg16/service.mjs';
import {requestSignedHandoffRefundComposite,closeSignedHandoffRefundComposite} from '../f06/transaction-refund-http-pg16/service.mjs';

export const F06_COMPOSITE_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY';
const F06_LOCK_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY';
const send=(res,status,code)=>{
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
 res.end(JSON.stringify({allowed:false,code,productionReady:false}));
};
function must(x,code){if(!x)throw Error(code)}
export function verifyCompositeEnvironment(env=process.env){
 must(env.F06_COMPOSITE_TEST_CONSENT===F06_COMPOSITE_CONSENT,'F06_COMPOSITE_EXPLICIT_CONSENT_REQUIRED');
 must(env.F06_LOCK_TEST_CONSENT===F06_LOCK_CONSENT,'F06_COMPOSITE_LOCK_HTTP_CONSENT_REQUIRED');
 must(env.APP_ENV==='test'&&env.NODE_ENV==='test'&&env.API_HOST==='127.0.0.1'&&env.CI==='true'&&env.GITHUB_ACTIONS==='true',
  'F06_COMPOSITE_NONPRODUCTION_LOOPBACK_REQUIRED');
 must(env.GITHUB_EVENT_NAME==='push'&&env.GITHUB_REF==='refs/heads/feat/f06-nonprod-single-runtime-trusted-source-01',
  'F06_COMPOSITE_REAL_PUSH_REF_REQUIRED');
 must(!env.F03_1_ENABLE_ISOLATED_AUTH&&!env.F05_REAL_CATALOG_ENABLE&&!env.F05_D1_BUSINESS_TEST_RUNTIME,
  'F06_COMPOSITE_OTHER_RUNTIME_COMBINATION_DENIED');
 must(!env.F06_LOCK_DATABASE_URL,'F06_COMPOSITE_SECOND_DATABASE_FORBIDDEN');
 must(typeof env.F03_1_DATABASE_URL==='string','F06_COMPOSITE_SINGLE_SIGNED_PG16_DATABASE_REQUIRED');
 const url=new URL(env.F03_1_DATABASE_URL);
 must(['postgres:','postgresql:'].includes(url.protocol)&&url.hostname==='127.0.0.1'&&url.port==='5432'&&
  url.pathname==='/f03_auth_test'&&url.username==='f03_ci'&&!!url.password&&!url.search&&!url.hash,
  'F06_COMPOSITE_SINGLE_SIGNED_PG16_DATABASE_REQUIRED');
 const key=Buffer.from(env.F03_1_HMAC_KEY_BASE64||'','base64');
 must(key.length===32,'F06_COMPOSITE_F03_SESSION_HMAC_REQUIRED');
 must(/^[0-9a-f]{40}$/.test(env.GITHUB_SHA||'')&&/^[0-9]{6,20}$/.test(env.GITHUB_RUN_ID||''),
  'F06_COMPOSITE_REAL_RUN_IDENTITY_REQUIRED');
 return Object.freeze({database:'f03_auth_test',role:'f03_ci',issuer:'COMPOSITE_NONPROD_SIGNED_V1',
  githubRef:env.GITHUB_REF,sha:env.GITHUB_SHA,runId:env.GITHUB_RUN_ID});
}
export async function verifyCompositeRuntimeDatabase(c,env=process.env){
 assertCompositeSignedRun(env);
 const identity=(await c.query("SELECT current_database() db,current_user role,current_setting('server_version_num')::int version,"+
  "(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) superuser,"+
  "(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb,"+
  "(SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user) createrole,pg_backend_pid() pid")).rows[0];
 if(!identity||identity.db!=='f03_auth_test'||identity.role!=='f03_ci'||identity.version<160000||identity.version>=170000||
  identity.superuser!==false||identity.createdb!==false||identity.createrole!==false)
  throw Error('F06_COMPOSITE_SINGLE_NONPRIVILEGED_PG16_REQUIRED');
 const issuer=await verifyCompositeAttestation(c);
 if(!issuer.verified||issuer.headSHA!==env.GITHUB_SHA||issuer.runId!==env.GITHUB_RUN_ID)
  throw Error('F06_COMPOSITE_NATIVE_ISSUER_REQUIRED');
 const parents=[];
 for(const [name,verify] of [
  ['F06_1',verifyLockRequest],['F06_2',verifyLockLifecycle],['F06_3A',verifyDeposit],
  ['F06_3B',verifyTransaction],['F06_3C1',verifyRefundPending]]){
   const result=await verify(c);
   if(!result?.verified)throw Error('F06_COMPOSITE_PARENT_SIGNATURE_REQUIRED_'+name);
   parents.push(name);
 }
 const serviceParents=[];
 for(const [name,verify] of [
  ['PR139_TRANSACTION',verifyCompositeTransactionSidecar],
  ['PR146_CANCEL_PARENT_ONLY',verifyCompositeCancelSidecar],
  ['PR150_REFUND_CORE',verifyTransactionRefund],
  ['PR153_HANDOFF',verifyTransactionHandoff],
  ['PR156_POST_HANDOFF_CANCEL',verifyPostHandoffCancel]]){
   const result=await verify(c);
   if(!result?.verified)throw Error('F06_COMPOSITE_SIGNED_SERVICE_PARENT_REQUIRED_'+name);
   serviceParents.push(name);
 }
 const shape=(await c.query("SELECT to_regclass('f06_composite_v1.customer_sessions') IS NOT NULL customers,"+
  "to_regclass('f06_composite_v1.request_keys') IS NOT NULL request_keys,"+
  "to_regclass('f06_composite_v1.decision_keys') IS NOT NULL decision_keys,"+
  "to_regclass('f06_composite_v1.lock_snapshots') IS NOT NULL lock_snapshots,"+
  "to_regclass('f06_composite_v1.issued_events') IS NOT NULL issued_events")).rows[0];
 if(!shape||Object.values(shape).some(v=>v!==true))throw Error('F06_COMPOSITE_LOCK_SIDE_CAR_REQUIRED');
 return Object.freeze({verified:true,nonProduction:true,databaseOid:issuer.databaseOid,
  backendPid:identity.pid,issuer:issuer.issuer,parents,serviceParents});
}
export const getCompositeSourceMatrix=()=>Object.freeze([
 {step:'lock_request_lock',source:'COMPOSITE_NONPROD_SIGNED_V1 + F03 employee session',state:'RUNTIME_WIRED'},
 {step:'synthetic_deposit',source:'native F06-3A signed core + composite event',state:'RUNTIME_WIRED'},
 {step:'transaction_open',source:'PR139 native transaction core + composite event',state:'IMPLEMENTING'},
 {step:'responsible_handoff',source:'PR153 native handoff core + composite event',state:'IMPLEMENTING'},
 {step:'signed_cancel',source:'PR156 native cancel core + composite event',state:'IMPLEMENTING'},
 {step:'refund_pending_closed',source:'PR162 native refund core + composite event',state:'IMPLEMENTING'}
]);
function isLoopback(req){
 return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)&&
  typeof req.headers?.host==='string'&&req.headers.host===`127.0.0.1:${req.socket?.localPort}`;
}
export function createCompositeDenyHandler(){
 return async(req,res)=>{
  const path=String(req.url||'/').split('?')[0];
  if(path.startsWith('/__ci__/f06-')||/^\/api\/v1\/(?:transactions|refund_cases|refund-payments|payments|bank|wechat)(?:\/|$)/.test(path)){
   if(!isLoopback(req)){send(res,403,'F06_COMPOSITE_LOOPBACK_ONLY');return true}
   send(res,503,'F06_COMPOSITE_SIGNED_SOURCE_GAP');return true;
  }
  return false;
 };
}
const COMPOSITE_ROUTES=new Map([
 ['/__nonprod__/f06-composite/deposit/record',{keys:['lockId','amountCents','currency','paymentMethod','eventKey','receivedAt','note','syntheticVoucher'],run:(auth,token,b)=>recordSyntheticDepositComposite(auth,token,b)}],
 ['/__nonprod__/f06-composite/transaction/open',{keys:['lockId','eventKey'],run:(auth,token,b)=>openSyntheticTransactionComposite(auth,token,b)}],
 ['/__nonprod__/f06-composite/transaction/handoff',{keys:['transactionId','expectedOldResponsibleId','expectedVersion','newResponsibleId','reason','eventKey'],run:(auth,token,b)=>handoffRealTransactionComposite(auth,token,b)}],
 ['/__nonprod__/f06-composite/transaction/cancel',{keys:['transactionId','expectedVersion','reason','eventKey'],run:(auth,token,b)=>cancelAfterSignedHandoffComposite(auth,token,b)}],
 ['/__nonprod__/f06-composite/refund/request',{keys:['transactionId','amountCents','reason','eventKey'],run:(auth,token,b)=>requestSignedHandoffRefundComposite(auth,token,b)}],
 ['/__nonprod__/f06-composite/refund/close',{keys:['refundId','closeReason','eventKey'],run:(auth,token,b)=>closeSignedHandoffRefundComposite(auth,token,b)}]
]);
async function compositeBody(req){
 if(req.headers['content-type']!=='application/json'||req.headers['transfer-encoding'])return {error:'INVALID_HTTP_BODY'};
 const len=req.headers['content-length'];
 if(!/^[1-9][0-9]{0,3}$/.test(len||'')||Number(len)>4096)return {error:'INVALID_HTTP_LENGTH'};
 let bytes=0;const chunks=[];
 for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)return {error:'HTTP_BODY_TOO_LARGE'};chunks.push(chunk)}
 if(bytes!==Number(len))return {error:'HTTP_LENGTH_MISMATCH'};
 try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(!value||typeof value!=='object'||Array.isArray(value))return {error:'INVALID_JSON_OBJECT'};
  return {value};
 }catch{return {error:'INVALID_JSON'}}
}
function writeComposite(res,status,body){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
 res.end(JSON.stringify(body));
}
export function createCompositeBusinessHandler(auth,env){
 return async(req,res)=>{
  const path=String(req.url||'/').split('?')[0],route=COMPOSITE_ROUTES.get(path);
  if(!route)return false;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
    req.headers.host!==`127.0.0.1:${req.socket?.localPort}`||
    req.headers.cookie||req.headers['transfer-encoding']||
    Object.keys(req.headers).some(k=>/^(?:forwarded|x-forwarded-|x-customer-|x-employee-|x-role|x-scope|x-system-admin|x-issuer|x-trusted)/.test(k))){
   writeComposite(res,403,{allowed:false,code:'F06_COMPOSITE_UNTRUSTED_REQUEST',productionReady:false});return true;
  }
  if(req.method!=='POST'){writeComposite(res,405,{allowed:false,code:'METHOD_NOT_ALLOWED',productionReady:false});return true}
  if(typeof req.headers.authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(req.headers.authorization)){
   writeComposite(res,401,{allowed:false,code:'F06_COMPOSITE_SIGNED_SESSION_REQUIRED',productionReady:false});return true;
  }
  const parsed=await compositeBody(req);
  if(parsed.error){writeComposite(res,400,{allowed:false,code:parsed.error,productionReady:false});return true}
  const body=parsed.value;
  if(Object.keys(body).some(k=>!route.keys.includes(k))){
   writeComposite(res,400,{allowed:false,code:'F06_COMPOSITE_UNEXPECTED_INPUT_FIELD',productionReady:false});return true;
  }
  try{
   const result=await route.run(auth,req.headers.authorization.slice(7),body);
   if(!result||typeof result.allowed!=='boolean'||typeof result.code!=='string')
    throw Error('F06_COMPOSITE_INVALID_SERVICE_RESULT');
   const status=result.allowed?(/PENDING|RECORDED|CREATED/.test(result.code)?201:200):
    (/NOT_FOUND/.test(result.code)?404:/INVALID_|ARGUMENTS/.test(result.code)?400:/CONFLICT|OCCUPIED|CONTENTION/.test(result.code)?409:403);
   writeComposite(res,status,{...result,productionReady:false});
  }catch{
   writeComposite(res,503,{allowed:false,code:'F06_COMPOSITE_SIGNED_SOURCE_GAP',productionReady:false});
  }
  return true;
 };
}
export async function createIsolatedF06CompositeRuntime(env=process.env,{sessionSecret=null,auth=null}={}){
 verifyCompositeEnvironment(env);
 const secret=sessionSecret??Buffer.from(env.F03_1_HMAC_KEY_BASE64,'base64');
 must(auth&&typeof auth.withSession==='function','F06_COMPOSITE_F03_AUTH_SERVICE_REQUIRED');
 const pool=new pg.Pool({connectionString:env.F03_1_DATABASE_URL,max:5,connectionTimeoutMillis:2500,idleTimeoutMillis:2000});
 let closed=false;
 try{
  await verifyCompositeRuntimeDatabase(pool,env);
  const lockService=createIsolatedF06LockService({pool,env,mode:'COMPOSITE_NONPROD_SIGNED_V1',
   sessionSecret:secret,verifyDatabase:c=>verifyCompositeRuntimeDatabase(c,env)});
  const lockHandler=createIsolatedF06LockHandler({service:lockService,env});
  const deny=createCompositeDenyHandler();
  const businessHandler=createCompositeBusinessHandler(auth,env);
  return Object.freeze({
   mode:'COMPOSITE_NONPROD_SIGNED_V1',pool,lockService,auth,
   handler:async(req,res)=>{
    if(await deny(req,res))return true;
    if(await businessHandler(req,res))return true;
    return lockHandler(req,res);
   },
   ready:async()=>{try{if(closed)return false;await verifyCompositeRuntimeDatabase(pool,env);return true}catch{return false}},
   close:async()=>{if(!closed){closed=true;await pool.end()}}
  });
 }catch(e){await pool.end();throw e}
}
