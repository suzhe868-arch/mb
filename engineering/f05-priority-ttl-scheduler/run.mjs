// Process entry point. Output is aggregate-only and disposable-test-only.
import {
 createPriorityTtlSchedulerRuntime,normalizePriorityTtlErrorCode,
 runPriorityTtlScheduler,validatePriorityTtlSchedulerEnv
} from './scheduler.mjs';

const controller=new AbortController();
const stop=()=>controller.abort();
process.once('SIGINT',stop);
process.once('SIGTERM',stop);
let runtime;
let hardDeadlineTimer;
let deadlineExceeded=false;
try{
 const config=validatePriorityTtlSchedulerEnv(process.env);
 // The independent watchdog includes startup and pool shutdown in the hard process bound.
 hardDeadlineTimer=setTimeout(()=>{
  process.stderr.write(JSON.stringify({
   event:'scheduler_hard_deadline_exit',
   errorCode:'PRIORITY_TTL_TICK_DEADLINE_EXCEEDED',
   mode:'DISPOSABLE_TEST_ONLY'
  })+'\n',()=>process.exit(124));
 },config.maxRuntimeMs+250);
 runtime=await createPriorityTtlSchedulerRuntime(process.env);
 const result=await runPriorityTtlScheduler({
  worker:runtime.worker,config:runtime.config,signal:controller.signal
 });
 deadlineExceeded=result.reason==='tick_deadline_exceeded';
}catch(error){
 process.stderr.write(JSON.stringify({
  event:'scheduler_startup_failed',
  errorCode:normalizePriorityTtlErrorCode(error),
  mode:'DISPOSABLE_TEST_ONLY'
 })+'\n');
 process.exitCode=1;
}finally{
 if(hardDeadlineTimer)clearTimeout(hardDeadlineTimer);
 if(deadlineExceeded){
  // A timed-out worker may still own a DB client. Hard exit releases it;
  // the committed PostgreSQL lease remains the only recovery authority.
  process.stderr.write(JSON.stringify({
   event:'scheduler_deadline_exit',
   errorCode:'PRIORITY_TTL_TICK_DEADLINE_EXCEEDED',
   leaseRecovery:'PERSISTED_POSTGRESQL_LEASE',
   mode:'DISPOSABLE_TEST_ONLY'
  })+'\n',()=>process.exit(124));
 }else if(runtime?.pool){
  await runtime.pool.end().catch(()=>{});
 }
}
