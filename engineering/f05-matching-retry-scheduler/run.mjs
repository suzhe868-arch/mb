// Process entry point. Logs contain only aggregate counters and stable error codes.
import {createMatchingRetrySchedulerRuntime,runMatchingRetryScheduler,normalizeMatchingRetryErrorCode}
 from './scheduler.mjs';

const controller=new AbortController();
const stop=()=>controller.abort();
process.once('SIGINT',stop);
process.once('SIGTERM',stop);
let runtime;
let hardDeadlineTimer;
let deadlineExceeded=false;
try{
 runtime=await createMatchingRetrySchedulerRuntime(process.env);
 // A separate process watchdog prevents pool shutdown from extending a timed-out tick indefinitely.
 hardDeadlineTimer=setTimeout(()=>{
  process.stderr.write(JSON.stringify({
   event:'scheduler_hard_deadline_exit',
   errorCode:'MATCH_RETRY_TICK_DEADLINE_EXCEEDED',
   mode:'DISPOSABLE_TEST_ONLY'
  })+'\n',()=>process.exit(124));
 },runtime.config.maxRuntimeMs+250);
 const result=await runMatchingRetryScheduler({
  worker:runtime.worker,config:runtime.config,signal:controller.signal
 });
 deadlineExceeded=result.reason==='tick_deadline_exceeded';
}catch(error){
 process.stderr.write(JSON.stringify({
  event:'scheduler_startup_failed',
  errorCode:normalizeMatchingRetryErrorCode(error),
  mode:'DISPOSABLE_TEST_ONLY'
 })+'\n');
 process.exitCode=1;
}finally{
 if(hardDeadlineTimer)clearTimeout(hardDeadlineTimer);
 if(deadlineExceeded){
  // A timed-out worker may still hold a DB client. Hard exit drops it; the durable lease
  // remains in PostgreSQL and becomes reclaimable when lease_until expires.
  process.stderr.write(JSON.stringify({
   event:'scheduler_deadline_exit',
   errorCode:'MATCH_RETRY_TICK_DEADLINE_EXCEEDED',
   leaseRecovery:'PERSISTED_POSTGRESQL_LEASE',
   mode:'DISPOSABLE_TEST_ONLY'
  })+'\n',()=>process.exit(124));
 }else if(runtime?.pool){
  await runtime.pool.end().catch(()=>{});
 }
}
