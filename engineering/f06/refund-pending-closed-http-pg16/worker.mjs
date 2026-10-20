// F06-Refund: bounded, isolated child process, immutable F06-3C1 native signature.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {IsolatedAuth} from '../../src/f03-auth-service.mjs';
import {connect,verify} from '../refund-pending-ci/migration.mjs';
import {requestSyntheticRefundCI,closeSyntheticRefundCI,pendingCustomerPublicPoolGuardCI,pendingVehicleOccupancyGuardCI} from '../refund-pending-ci/service.mjs';
import {openSyntheticTransactionCI} from '../lock-transaction-http-pg16/service.mjs';
const actual='feat/f06-real-refund-pending-closed-http-pg16-01';
const refund='feat/f06-3c1-refund-pending-close-ci';
const source='feat/f06-3a-deposit-ledger-ci';
const role=process.env.F06_REFUND_WORKER_MODE;
assert.ok(['refund','transaction'].includes(role));
const old=refund;
for(const [k,v] of Object.entries({
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',CI:'true',
 APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',
 GITHUB_REF:'refs/heads/'+old,GITHUB_REF_NAME:old,
 F06_REFUND_ENTRY_REF:'refs/heads/'+actual,F06_REFUND_ENTRY_BRANCH:actual,
 F06_REFUND_ENTRY_EVENT:'push',
 F06_REFUND_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_REFUND_PENDING_CLOSED_ONLY',
 F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
}))assert.equal(process.env[k],v,'F06_REFUND_WORKER_GATE_'+k);
assert.equal(process.env.F06_REFUND_ENTRY_SHA,process.env.GITHUB_SHA);
assert.equal(process.env.F06_REFUND_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA);
assert.equal(typeof process.send,'function');
if(role==='transaction'){
 assert.equal(process.env.F06_TX_ENTRY_REF,'refs/heads/feat/f06-real-lock-transaction-http-pg16-01');
 assert.equal(process.env.F06_TX_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_TX_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
}
const yes=(code,data={})=>({allowed:true,code,...data});
const no=code=>({allowed:false,code});
const isId=n=>Number.isSafeInteger(n)&&n>0;
const one=async(c,s,p=[])=>(await c.query(s,p)).rows[0];
const secret=Buffer.alloc(32,61);
let auth,db;
try{
 db=await connect();
 const provenance=await verify(db);
 assert.equal(provenance.verified,true,'F06_REFUND_NATIVE_3C1_SIGNATURE_REQUIRED');
 process.send({type:'ready',sourceSHA:provenance.sourceSHA});
 const request=await new Promise(resolve=>process.once('message',resolve));
 assert.ok(request&&typeof request==='object');
 const {operation,params={},token}=request;
 assert.ok(['verify','request','close','transaction','guards'].includes(operation));
 if(operation==='verify'){
  process.send({type:'result',result:yes('F06_REFUND_NATIVE_SIGNED_PARENT',{sourceSHA:provenance.sourceSHA,backendPid:(await one(db,'SELECT pg_backend_pid() pid')).pid})});
 }else if(operation==='guards'){
  const customer=await pendingCustomerPublicPoolGuardCI(db,params.customerId);
  const vehicle=await pendingVehicleOccupancyGuardCI(db,params.vehicleId);
  process.send({type:'result',result:yes('F06_REFUND_SIGNED_GUARD_READ',{customer,vehicle,backendPid:(await one(db,'SELECT pg_backend_pid() pid')).pid})});
 }else{
  auth=new IsolatedAuth({connectionString:process.env.F03_1_DATABASE_URL,secret,origin:'https://127.0.0.1:49026'});
  const original=auth.withSession.bind(auth);
  let backendPid=null;
  auth.withSession=(bearer,fn,opts)=>original(bearer,async(c,a,...other)=>{
   backendPid=Number((await one(c,'SELECT pg_backend_pid() pid')).pid);
   if(operation==='request'||operation==='close'){
    // These checks are in the SAME signed-auth/parent-issuer transaction,
    // before immutable 3C1 processes the refund. Vehicle then Lock row locks
    // are held through native 3C1 append, audit and final COMMIT.
    let lockId=params.lockId;
    if(operation==='close'){
     const ref=isId(params.refundId)?await one(c,'SELECT lock_id FROM f06_3c1_ci.refund_origins WHERE refund_id=$1',[params.refundId]):null;
     if(!ref)return no('F06_REFUND_UNSIGNED_CLOSE_SOURCE');
     lockId=Number(ref.lock_id);
    }
    if(!isId(lockId))return no('F06_REFUND_INVALID_SUBJECT');
    const seed=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[lockId]);
    if(!seed)return no('F06_REFUND_LOCK_NOT_FOUND');
    await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[seed.vehicle_id]);
    const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[lockId]);
    const cyc=await one(c,'SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[l.listing_cycle_id,l.vehicle_id]);
    const v=await one(c,'SELECT source_type,source_sale_status,archived_at FROM public.vehicles WHERE vehicle_id=$1',[l.vehicle_id]);
    const live=v&&!v.archived_at&&((v.source_type==='wholesale'&&v.source_sale_status==='active')||
       (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
    const expired=await one(c,'SELECT clock_timestamp()>=$1::timestamptz expired',[l.expires_at]);
    if(!cyc||cyc.ended_at||!live||l.lock_status!=='active'||expired.expired)
     return no('F06_REFUND_CURRENT_LOCK_REQUIRED');
    if(Number(a?.employee_id)!==Number(l.responsible_employee_id))
     return no('F06_REFUND_OBJECT_SCOPE_DENIED');
   }
   return fn(c,a,...other);
  },opts);
  let result;
  if(operation==='request')result=await requestSyntheticRefundCI(auth,token,{...params,subjectKind:'lock'});
  else if(operation==='close')result=await closeSyntheticRefundCI(auth,token,params);
  else if(operation==='transaction'){
   process.env.GITHUB_REF='refs/heads/'+source; process.env.GITHUB_REF_NAME=source;
   result=await openSyntheticTransactionCI(auth,token,params);
  }
  process.send({type:'result',result:{...result,backendPid}});
 }
}catch(e){
 const message=String(e.message||'');
 const rolled=message.startsWith('F06_3C1_INJECTED_');
 const sqlstate=['55P03','40P01','40001','23505'].includes(e.code);
 process.send({type:'result',result:no(rolled?'F06_REFUND_ATOMIC_ROLLED_BACK':sqlstate?'F06_REFUND_PG_CONTENTION_DENY':'F06_REFUND_SIGNED_PARENT_REQUIRED')});
}finally{
 if(auth)await auth.close();
 if(db)await db.end();
 secret.fill(0);
}
