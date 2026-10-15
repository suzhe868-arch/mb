// PG1 补证：两个独立真实PG16物理后端；同车Vehicle FOR UPDATE串行，另一车不因本车行锁误阻。
// sleep只用于协调已存在的真实行锁，不被当作并发/原子性的证明。
import assert from 'node:assert/strict';
import pg from 'pg';
import {gate} from './catalog-delta-verifier.mjs';
const DSN='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
const physical=async c=>(await c.query("SELECT pg_backend_pid()::int pid,txid_current()::text tid")).rows[0];
export async function signedCancelUnderNativeVehicleRace(c,{occupiedVehicleId,independentVehicleId},action){
 gate();
 assert.notEqual(occupiedVehicleId,independentVehicleId,'PG1_NATIVE_TWO_DISTINCT_VEHICLES_REQUIRED');
 if(typeof action!=='function')throw Error('PG1_NATIVE_RACE_ACTION_REQUIRED');
 const blocker=new pg.Client({connectionString:DSN,connectionTimeoutMillis:4000,query_timeout:90000});
 const other=new pg.Client({connectionString:DSN,connectionTimeoutMillis:4000,query_timeout:90000});
 await blocker.connect();await other.connect();
 let holding=false,otherHolding=false,work;
 try{
  await blocker.query('BEGIN');holding=true;
  const a=await physical(blocker);
  await blocker.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[occupiedVehicleId]);
  await other.query('BEGIN');otherHolding=true;
  const b=await physical(other);
  assert.notEqual(a.pid,b.pid);assert.notEqual(a.tid,b.tid);
  await other.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[independentVehicleId]);
  await other.query('COMMIT');otherHolding=false;
  work=Promise.resolve().then(action);
  // 并发调用可在行锁释放前失败：立即注册拒绝观察者，避免异步未处理异常吞掉真实安全红证。
  work.catch(()=>{});
  // 必须在PG原生等待图中观察到取消方确实被本次Vehicle行锁阻塞；
  // 仅以多个PID、sleep或调用时序猜测竞争均不算真实并发证据。
  let observed=null;
  for(let attempt=0;attempt<100;attempt++){
   const waiting=(await c.query(
    "SELECT pid,wait_event_type,wait_event,pg_blocking_pids(pid) blockers "+
    "FROM pg_stat_activity "+
    "WHERE datname=current_database() AND pid<>$1 AND pid<>$2 "+
    "AND $1=ANY(pg_blocking_pids(pid)) ORDER BY pid LIMIT 1",
    [a.pid,b.pid])).rows[0];
   if(waiting){observed=waiting;break;}
   await c.query('SELECT pg_sleep(0.05)');
  }
  assert.ok(observed,'PG1_NATIVE_ROW_LOCK_BLOCKING_NOT_OBSERVED');
  assert.equal(observed.wait_event_type,'Lock','PG1_NATIVE_POSTGRES_LOCK_WAIT_EVENT_REQUIRED');
  assert.ok(observed.blockers.includes(a.pid),'PG1_NATIVE_BLOCKING_PID_IS_NOT_SOURCE_VEHICLE_BACKEND');
  // 真实阻塞已经被PG锁管理器证实，释放同车锁后重新竞争提交。
  await blocker.query('COMMIT');holding=false;
  const out=await work;
  assert.equal(out.backendPid,observed.pid,'PG1_NATIVE_OBSERVED_WAITER_IS_SIGNED_CANCEL_BACKEND');
  assert.equal(out.allowed,true,'PG1_REAL_NATIVE_RACE_CANCEL_NOT_SUCCESS '+JSON.stringify(out));
  assert.ok(Number.isInteger(out.backendPid)&&out.backendPid>0);
  assert.match(String(out.pgTransactionId),/^[0-9]+$/);
  assert.notEqual(out.backendPid,a.pid);
  assert.notEqual(out.pgTransactionId,a.tid);
  assert.notEqual(out.backendPid,b.pid);
  return{result:out,proof:{blockerBackendPid:a.pid,blockerTxid:a.tid,
   otherVehicleBackendPid:b.pid,otherVehicleTxid:b.tid,
   cancelBackendPid:out.backendPid,cancelTxid:out.pgTransactionId,
   observedLockWaitPid:observed.pid,observedWaitEvent:observed.wait_event,
   observedBlockingPids:observed.blockers,
   nativePgBlockingPidsObserved:true,
   sameVehicleLockReleasedBeforeCancel:true,otherVehicleIndependent:true}};
 }finally{
  if(otherHolding)await other.query('ROLLBACK').catch(()=>{});
  if(holding)await blocker.query('ROLLBACK').catch(()=>{});
  if(work)await work.catch(()=>{});
  await Promise.all([blocker.end().catch(()=>{}),other.end().catch(()=>{})]);
 }
}
