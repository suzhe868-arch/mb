// Process entry point. Logs contain only aggregate counters and stable error codes.
import {createMatchingRetrySchedulerRuntime,runMatchingRetryScheduler,normalizeMatchingRetryErrorCode}
 from './scheduler.mjs';

const controller=new AbortController();
const stop=()=>controller.abort();
process.once('SIGINT',stop);
process.once('SIGTERM',stop);
let runtime;
try{
 runtime=await createMatchingRetrySchedulerRuntime(process.env);
 await runMatchingRetryScheduler({
  worker:runtime.worker,config:runtime.config,signal:controller.signal
 });
}catch(error){
 process.stderr.write(JSON.stringify({
  event:'scheduler_startup_failed',
  errorCode:normalizeMatchingRetryErrorCode(error),
  mode:'DISPOSABLE_TEST_ONLY'
 })+'\n');
 process.exitCode=1;
}finally{
 if(runtime?.pool)await runtime.pool.end().catch(()=>{});
}
