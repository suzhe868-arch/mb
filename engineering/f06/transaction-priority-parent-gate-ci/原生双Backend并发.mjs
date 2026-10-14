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
  await c.query('SELECT pg_sleep(0.2)');
  // 取消必须在本真实锁释放之后完成。SQL自身执行相同Vehicle锁序。
  await blocker.query('COMMIT');holding=false;
  const out=await work;
  assert.equal(out.allowed,true,'PG1_REAL_NATIVE_RACE_CANCEL_NOT_SUCCESS '+JSON.stringify(out));
  assert.ok(Number.isInteger(out.backendPid)&&out.backendPid>0);
  assert.match(String(out.pgTransactionId),/^[0-9]+$/);
  assert.notEqual(out.backendPid,a.pid);
  assert.notEqual(out.pgTransactionId,a.tid);
  assert.notEqual(out.backendPid,b.pid);
  return{result:out,proof:{blockerBackendPid:a.pid,blockerTxid:a.tid,
   otherVehicleBackendPid:b.pid,otherVehicleTxid:b.tid,
   cancelBackendPid:out.backendPid,cancelTxid:out.pgTransactionId,
   sameVehicleLockReleasedBeforeCancel:true,otherVehicleIndependent:true}};
 }finally{
  if(otherHolding)await other.query('ROLLBACK').catch(()=>{});
  if(holding)await blocker.query('ROLLBACK').catch(()=>{});
  if(work)await work.catch(()=>{});
  await Promise.all([blocker.end().catch(()=>{}),other.end().catch(()=>{})]);
 }
}
