// F05-8 disposable-only persistent Priority TTL scheduler.
// Reuses the accepted PG16 queue worker; it does not implement Priority arbitration.
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedPrioritySchedulerWorker} from '../src/f05-priority-scheduler-worker.mjs';

const CONSENT='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY';
const TRUTHY=new Set(['1','true','yes','on']);
const CONFLICTING_FLAGS=[
 'F05_PRIORITY_TTL_PRODUCTION',
 'F05_PRIORITY_TTL_EXTERNAL_CALLS',
 'F05_PRIORITY_SCHEDULER_USE_PRODUCTION',
 'F05_CATALOG_USE_PRODUCTION',
 'ENABLE_PRODUCTION_RUNTIME'
];

function boundedInteger(env,key,fallback,min,max){
 const raw=env[key];
 if(raw===undefined||raw==='')return fallback;
 const value=Number(raw);
 if(!Number.isInteger(value)||value<min||value>max)
  throw Error(key.toUpperCase()+'_INVALID');
 return value;
}

export function validatePriorityTtlSchedulerEnv(env=process.env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
    env.F05_CATALOG_TEST_CONSENT!==CONSENT)
  throw Error('PRIORITY_TTL_SCHEDULER_TEST_ONLY_REQUIRED');
 if(CONFLICTING_FLAGS.some(key=>TRUTHY.has(String(env[key]??'').toLowerCase())))
  throw Error('PRIORITY_TTL_RUNTIME_CONFLICTING_FLAG');
 const catalog=validateCatalogEnv(env);
 const pollIntervalMs=boundedInteger(env,'F05_PRIORITY_TTL_POLL_INTERVAL_MS',1000,100,30000);
 const batchLimit=boundedInteger(env,'F05_PRIORITY_TTL_BATCH_LIMIT',10,1,25);
 const maxRuntimeMs=boundedInteger(env,'F05_PRIORITY_TTL_MAX_RUNTIME_MS',300000,1000,600000);
 const backoffBaseMs=boundedInteger(env,'F05_PRIORITY_TTL_BACKOFF_BASE_MS',1000,100,10000);
 const backoffMaxMs=boundedInteger(env,'F05_PRIORITY_TTL_BACKOFF_MAX_MS',30000,1000,60000);
 if(backoffMaxMs<backoffBaseMs)throw Error('PRIORITY_TTL_BACKOFF_RANGE_INVALID');
 return Object.freeze({
  connectionString:catalog.connectionString,pollIntervalMs,batchLimit,maxRuntimeMs,
  backoffBaseMs,backoffMaxMs,maxConcurrentTicks:1
 });
}

export async function createPriorityTtlSchedulerRuntime(env=process.env){
 const config=validatePriorityTtlSchedulerEnv(env);
 const {default:pg}=await import('pg');
 const pool=new pg.Pool({
  connectionString:config.connectionString,max:4,
  connectionTimeoutMillis:1000,query_timeout:5000,statement_timeout:5000,
  application_name:'f05_priority_ttl_scheduler_disposable_only'
 });
 try{
  if(!await probeIsolatedCatalog(pool))throw Error('PRIORITY_TTL_PG16_IDENTITY_OR_SCHEMA_DENIED');
  await assertNonSuperuserPriorityCatalog(pool);
  const worker=createIsolatedPrioritySchedulerWorker({pool,env});
  return Object.freeze({config,pool,worker});
 }catch(error){
  await pool.end().catch(()=>{});
  throw error;
 }
}

export async function assertNonSuperuserPriorityCatalog(pool){
 const identity=(await pool.query(
  "SELECT current_database() AS db,current_user AS role,"+
  "current_setting('server_version_num')::integer AS version,"+
  "(SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user) AS superuser"
 )).rows[0];
 if(!identity||identity.db!=='f05_catalog_test'||identity.role!=='f05_catalog_ci'||
    Math.floor(Number(identity.version)/10000)!==16)
  throw Error('PRIORITY_TTL_PG16_IDENTITY_OR_SCHEMA_DENIED');
 if(identity.superuser!==false)throw Error('PRIORITY_TTL_DATABASE_SUPERUSER_DENIED');
 return true;
}

export function normalizePriorityTtlErrorCode(error){
 const message=String(error?.message??'');
 return /^[A-Z][A-Z0-9_]{2,100}$/.test(message)?message:'PRIORITY_TTL_DEPENDENCY_FAILED';
}

function emit(logger,event){
 try{logger(Object.freeze({...event,at:new Date().toISOString()}));}catch{}
}

function defaultSleep(ms,signal){
 return new Promise(resolve=>{
  let settled=false;
  const finish=()=>{
   if(settled)return;
   settled=true;
   clearTimeout(timer);
   signal?.removeEventListener('abort',finish);
   resolve();
  };
  const timer=setTimeout(finish,ms);
  if(signal?.aborted)finish();
  else signal?.addEventListener('abort',finish,{once:true});
 });
}

function awaitWithinDeadline(promise,timeoutMs){
 let timer;
 const deadline=new Promise((resolve,reject)=>{
  timer=setTimeout(()=>reject(Error('PRIORITY_TTL_TICK_DEADLINE_EXCEEDED')),Math.max(0,timeoutMs));
 });
 return Promise.race([Promise.resolve(promise),deadline]).finally(()=>clearTimeout(timer));
}

function defaultLogger(event){
 process.stdout.write(JSON.stringify(event)+'\n');
}

export async function runPriorityTtlScheduler({
 worker,config,signal,logger=defaultLogger,sleep=defaultSleep,now=Date.now
}={}){
 if(!worker||typeof worker.runDue!=='function')throw Error('PRIORITY_TTL_WORKER_REQUIRED');
 if(!config||!Number.isInteger(config.maxRuntimeMs)||!Number.isInteger(config.pollIntervalMs)||
    !Number.isInteger(config.batchLimit)||!Number.isInteger(config.backoffBaseMs)||
    !Number.isInteger(config.backoffMaxMs))throw Error('PRIORITY_TTL_SCHEDULER_CONFIG_REQUIRED');
 const startedAt=now();
 let ticks=0,totalClaimed=0,totalDone=0,totalRetried=0,consecutiveErrors=0,deadlineExceeded=false;
 emit(logger,{event:'scheduler_started',mode:'DISPOSABLE_TEST_ONLY',
  pollIntervalMs:config.pollIntervalMs,batchLimit:config.batchLimit,
  maxRuntimeMs:config.maxRuntimeMs,maxConcurrentTicks:1});
 while(!signal?.aborted&&now()-startedAt<config.maxRuntimeMs){
  const tickStarted=now();
  const remainingAtStart=config.maxRuntimeMs-(tickStarted-startedAt);
  let waitMs=config.pollIntervalMs;
  try{
   const result=await awaitWithinDeadline(worker.runDue({limit:config.batchLimit}),remainingAtStart);
   if(!result||!Number.isInteger(result.claimed)||!Number.isInteger(result.done)||
      !Number.isInteger(result.retried)||!Number.isInteger(result.lostLease)||
      typeof result.hasDue!=='boolean')
    throw Error('PRIORITY_TTL_WORKER_RESULT_INVALID');
   consecutiveErrors=0;
   totalClaimed+=result.claimed;
   totalDone+=result.done;
   totalRetried+=result.retried;
   emit(logger,{event:'tick_completed',claimed:result.claimed,done:result.done,
    retried:result.retried,lostLease:result.lostLease,hasDue:result.hasDue,
    durationMs:Math.max(0,now()-tickStarted)});
  }catch(error){
   if(error?.message==='PRIORITY_TTL_TICK_DEADLINE_EXCEEDED'){
    deadlineExceeded=true;
    emit(logger,{event:'tick_deadline_exceeded',errorCode:'PRIORITY_TTL_TICK_DEADLINE_EXCEEDED',
     durationMs:Math.max(0,now()-tickStarted),leaseRecovery:'PERSISTED_POSTGRESQL_LEASE'});
    ticks++;
    break;
   }
   consecutiveErrors++;
   waitMs=Math.min(config.backoffMaxMs,
    config.backoffBaseMs*Math.pow(2,Math.min(8,consecutiveErrors-1)));
   emit(logger,{event:'tick_failed',errorCode:normalizePriorityTtlErrorCode(error),
    consecutiveErrors,backoffMs:waitMs,durationMs:Math.max(0,now()-tickStarted)});
  }
  ticks++;
  if(signal?.aborted)break;
  const remaining=config.maxRuntimeMs-(now()-startedAt);
  if(remaining<=0)break;
  await sleep(Math.min(waitMs,remaining),signal);
 }
 const reason=signal?.aborted?'signal':deadlineExceeded?'tick_deadline_exceeded':'max_runtime';
 emit(logger,{event:'scheduler_stopped',reason,ticks,totalClaimed,totalDone,totalRetried});
 return Object.freeze({reason,ticks,totalClaimed,totalDone,totalRetried});
}
