// F05-7 disposable-only persistent scheduler; reuses the accepted worker/service.
import {validateCatalogEnv,probeIsolatedCatalog} from '../src/catalog-readiness.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
import {createIsolatedMatchingRetryWorker} from '../src/f05-matching-retry-worker.mjs';

const CONSENT='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY';
const CREDENTIAL=/^[A-Za-z0-9_-]{43}$/;
const TRUTHY=new Set(['1','true','yes','on']);
const CONFLICTING_FLAGS=[
 'F05_MATCHING_RETRY_PRODUCTION',
 'F05_MATCHING_RETRY_EXTERNAL_CALLS',
 'F05_CATALOG_USE_PRODUCTION',
 'ENABLE_PRODUCTION_RUNTIME'
];

function boundedInteger(env,key,fallback,min,max){
 const raw=env[key];
 if(raw===undefined||raw==='')return fallback;
 const value=Number(raw);
 if(!Number.isInteger(value)||value<min||value>max)throw Error(key.toUpperCase()+'_INVALID');
 return value;
}

export function validateMatchingRetrySchedulerEnv(env=process.env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
    env.F05_CATALOG_TEST_CONSENT!==CONSENT)
  throw Error('MATCH_RETRY_SCHEDULER_TEST_ONLY_REQUIRED');
 if(CONFLICTING_FLAGS.some(key=>TRUTHY.has(String(env[key]??'').toLowerCase())))
  throw Error('MATCH_RETRY_RUNTIME_CONFLICTING_FLAG');
 const catalog=validateCatalogEnv(env);
 const credential=env.F05_MATCHING_RETRY_CREDENTIAL;
 if(typeof credential!=='string'||!CREDENTIAL.test(credential))
  throw Error('MATCH_RETRY_EMPLOYEE_CREDENTIAL_REQUIRED');
 const pollIntervalMs=boundedInteger(env,'F05_MATCHING_RETRY_POLL_INTERVAL_MS',1000,100,30000);
 const batchLimit=boundedInteger(env,'F05_MATCHING_RETRY_BATCH_LIMIT',10,1,10);
 const maxRuntimeMs=boundedInteger(env,'F05_MATCHING_RETRY_MAX_RUNTIME_MS',300000,1000,600000);
 const backoffBaseMs=boundedInteger(env,'F05_MATCHING_RETRY_BACKOFF_BASE_MS',1000,100,10000);
 const backoffMaxMs=boundedInteger(env,'F05_MATCHING_RETRY_BACKOFF_MAX_MS',30000,1000,60000);
 if(backoffMaxMs<backoffBaseMs)throw Error('MATCH_RETRY_BACKOFF_RANGE_INVALID');
 return Object.freeze({
  connectionString:catalog.connectionString,credential,pollIntervalMs,batchLimit,
  maxRuntimeMs,backoffBaseMs,backoffMaxMs,maxConcurrentTicks:1
 });
}

export async function createMatchingRetrySchedulerRuntime(env=process.env){
 const config=validateMatchingRetrySchedulerEnv(env);
 const {default:pg}=await import('pg');
 const pool=new pg.Pool({
  connectionString:config.connectionString,max:2,
  connectionTimeoutMillis:900,query_timeout:1800,statement_timeout:1800,
  application_name:'f05_matching_retry_scheduler_disposable_only'
 });
 try{
  if(!await probeIsolatedCatalog(pool))throw Error('MATCH_RETRY_PG16_IDENTITY_OR_SCHEMA_DENIED');
  const matching=createIsolatedMatchingService({pool,env});
  const worker=createIsolatedMatchingRetryWorker({pool,matching,env});
  return Object.freeze({config,pool,worker});
 }catch(error){
  await pool.end().catch(()=>{});
  throw error;
 }
}

export function normalizeMatchingRetryErrorCode(error){
 const message=String(error?.message??'');
 return /^[A-Z][A-Z0-9_]{2,100}$/.test(message)?message:'MATCH_RETRY_DEPENDENCY_FAILED';
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

function defaultLogger(event){
 process.stdout.write(JSON.stringify(event)+'\n');
}

export async function runMatchingRetryScheduler({
 worker,config,signal,logger=defaultLogger,sleep=defaultSleep,now=Date.now
}={}){
 if(!worker||typeof worker.runOnce!=='function')throw Error('MATCH_RETRY_WORKER_REQUIRED');
 if(!config||!Number.isInteger(config.maxRuntimeMs)||!Number.isInteger(config.pollIntervalMs)||
    !Number.isInteger(config.batchLimit)||!Number.isInteger(config.backoffBaseMs)||
    !Number.isInteger(config.backoffMaxMs))throw Error('MATCH_RETRY_SCHEDULER_CONFIG_REQUIRED');
 const startedAt=now();
 let ticks=0,totalClaimed=0,consecutiveErrors=0;
 emit(logger,{event:'scheduler_started',mode:'DISPOSABLE_TEST_ONLY',pollIntervalMs:config.pollIntervalMs,
  batchLimit:config.batchLimit,maxRuntimeMs:config.maxRuntimeMs,maxConcurrentTicks:1});
 while(!signal?.aborted&&now()-startedAt<config.maxRuntimeMs){
  const tickStarted=now();
  let waitMs=config.pollIntervalMs;
  try{
   const result=await worker.runOnce({credential:config.credential,limit:config.batchLimit});
   if(!result||!Number.isInteger(result.claimed)||!Array.isArray(result.outcomes))
    throw Error('MATCH_RETRY_WORKER_RESULT_INVALID');
   const counts={done:0,retryPendingOrFailed:0,superseded:0,other:0};
   for(const item of result.outcomes){
    if(item?.outcome==='done')counts.done++;
    else if(item?.outcome==='retry_pending_or_failed')counts.retryPendingOrFailed++;
    else if(item?.outcome==='superseded')counts.superseded++;
    else counts.other++;
   }
   consecutiveErrors=0;
   totalClaimed+=result.claimed;
   emit(logger,{event:'tick_completed',claimed:result.claimed,outcomes:counts,
    durationMs:Math.max(0,now()-tickStarted)});
  }catch(error){
   consecutiveErrors++;
   waitMs=Math.min(config.backoffMaxMs,config.backoffBaseMs*Math.pow(2,Math.min(8,consecutiveErrors-1)));
   emit(logger,{event:'tick_failed',errorCode:normalizeMatchingRetryErrorCode(error),
    consecutiveErrors,backoffMs:waitMs,durationMs:Math.max(0,now()-tickStarted)});
  }
  ticks++;
  if(signal?.aborted)break;
  const remaining=config.maxRuntimeMs-(now()-startedAt);
  if(remaining<=0)break;
  await sleep(Math.min(waitMs,remaining),signal);
 }
 const reason=signal?.aborted?'signal':'max_runtime';
 emit(logger,{event:'scheduler_stopped',reason,ticks,totalClaimed});
 return Object.freeze({reason,ticks,totalClaimed});
}
