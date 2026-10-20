// F06 Issue164: explicitly isolated, opt-in single Node runtime for already accepted
// Lock HTTP contracts. NOT a signer, payment issuer or production adapter.
// The historical PR139/153/156/162 services require a distinct GitHub parent
// branch identity and F03 test database. Do not spoof those parent gates.
import {createIsolatedF06LockRuntime} from './f06-lock-runtime.mjs';

export const F06_COMPOSITE_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_COMPOSITE_ONLY';
const F06_LOCK_CONSENT='I_AUTHORIZE_DISPOSABLE_F06_LOCK_PG16_ONLY';
const FORBIDDEN=/^(?:\/api\/v1\/(?:transactions|refund_cases|refund-payments|payments|bank|wechat)|\/__ci__\/f06-(?:real-|post-|transaction-))/;
const NONPROD_ROUTES=new Set([
 '/__nonprod__/f06-composite/transaction/open',
 '/__nonprod__/f06-composite/transaction/handoff',
 '/__nonprod__/f06-composite/transaction/cancel',
 '/__nonprod__/f06-composite/refund/request',
 '/__nonprod__/f06-composite/refund/close',
 '/__nonprod__/f06-composite/deposit/record'
]);
const send=(res,status,code)=>{
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
 res.end(JSON.stringify({allowed:false,code,productionReady:false}));
};
function must(x,code){if(!x)throw Error(code)}
export function verifyCompositeEnvironment(env=process.env){
 must(env.F06_COMPOSITE_TEST_CONSENT===F06_COMPOSITE_CONSENT,'F06_COMPOSITE_EXPLICIT_CONSENT_REQUIRED');
 must(env.F06_LOCK_TEST_CONSENT===F06_LOCK_CONSENT,'F06_COMPOSITE_ORIGINAL_LOCK_CONSENT_REQUIRED');
 must(env.APP_ENV==='test'&&env.NODE_ENV==='test'&&env.API_HOST==='127.0.0.1',
  'F06_COMPOSITE_NONPRODUCTION_LOOPBACK_REQUIRED');
 must(!env.F03_1_ENABLE_ISOLATED_AUTH&&!env.F05_REAL_CATALOG_ENABLE&&!env.F05_D1_BUSINESS_TEST_RUNTIME,
  'F06_COMPOSITE_OTHER_RUNTIME_COMBINATION_DENIED');
 must(typeof env.F06_LOCK_DATABASE_URL==='string'&&
  env.F06_LOCK_DATABASE_URL.startsWith('postgres://f06_lock_ci:')||
  typeof env.F06_LOCK_DATABASE_URL==='string'&&
  env.F06_LOCK_DATABASE_URL.startsWith('postgresql://f06_lock_ci:'),
  'F06_COMPOSITE_EXPLICIT_DISPOSABLE_LOCK_DB_REQUIRED');
 const url=new URL(env.F06_LOCK_DATABASE_URL);
 must(url.hostname==='127.0.0.1'&&url.port==='5432'&&url.pathname==='/f06_lock_test'&&
  !url.search&&!url.hash&&!url.username.includes('%'), 'F06_COMPOSITE_DISPOSABLE_LOCK_DB_REQUIRED');
 // Unlike the frozen historical workers, this opt-in assembly NEVER assigns
 // or rewrites GITHUB_REF, ACTIONS, SHA, RUN_ID, or service issuer markers.
 return Object.freeze({status:'LOCK_RUNTIME_ONLY_SIGNED_FINANCE_SOURCE_GAP',productionReady:false});
}
export const getCompositeSourceMatrix=()=>Object.freeze([
 {step:'lock_request_lock',source:'F06_LOCK_ISOLATED_PG16',state:'RUNTIME_WIRED'},
 {step:'synthetic_deposit',source:'PR3A_CI_HISTORIC_ISSUER',state:'SIGNED_SOURCE_GAP'},
 {step:'transaction_open',source:'PR139_CI_HISTORIC_ISSUER',state:'SIGNED_SOURCE_GAP'},
 {step:'responsible_handoff',source:'PR153_CI_HISTORIC_ISSUER',state:'SIGNED_SOURCE_GAP'},
 {step:'signed_cancel',source:'PR156_CI_HISTORIC_ISSUER',state:'SIGNED_SOURCE_GAP'},
 {step:'refund_pending_closed',source:'PR162_CI_HISTORIC_ISSUER',state:'SIGNED_SOURCE_GAP'}
]);
export function createCompositeDenyHandler(){
 return async(req,res)=>{
  const pathname=String(req.url||'/').split('?')[0];
  // Explicitly refuse sealed historical CI routes and all production money/tx.
  if(FORBIDDEN.test(pathname)||NONPROD_ROUTES.has(pathname)){
   if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress)||
      typeof req.headers?.host!=='string'||
      req.headers.host!=='127.0.0.1:'+req.socket?.localPort){
    send(res,403,'F06_COMPOSITE_LOOPBACK_ONLY');return true;
   }
   send(res,503,'F06_COMPOSITE_SIGNED_SOURCE_GAP');return true;
  }
  return false;
 };
}
export async function createIsolatedF06CompositeRuntime(env=process.env,{createLockRuntime=createIsolatedF06LockRuntime}={}){
 verifyCompositeEnvironment(env);
 must(createLockRuntime===createIsolatedF06LockRuntime,'F06_COMPOSITE_TRUSTED_LOCK_FACTORY_ONLY');
 // Original frozen lock runtime independently confirms non-superuser PG16 and
 // all 24 source migrations. Nothing in this wrapper weakens that verification.
 const lock=await createLockRuntime(env);
 const deny=createCompositeDenyHandler();
 let closed=false;
 return Object.freeze({
  mode:'LOCK_ONLY_SIGNED_FINANCE_SOURCE_GAP',
  handler:async(req,res)=>{
   if(await deny(req,res))return true;
   return lock.handler(req,res);
  },
  ready:async()=>!closed&&await lock.ready(),
  close:async()=>{if(!closed){closed=true;await lock.close()}},
  wired:Object.freeze({lock:true,deposit:false,transaction:false,handoff:false,cancel:false,refund:false})
 });
}
