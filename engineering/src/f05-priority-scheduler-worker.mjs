// PDM-13 durable TTL scheduler consumer for isolated PG16.
// Persists claims/retries/recovery; production scheduler daemon is not installed here.
import {randomBytes} from 'node:crypto';
import {createIsolatedPriorityTtlSweepWorker} from './f05-priority-ttl-sweep-worker.mjs';
const token=()=>randomBytes(24).toString('base64url');
export function createIsolatedPrioritySchedulerWorker({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('PRIORITY_SCHEDULER_FORMAL_RUNTIME_UNAVAILABLE');
 const ttl=createIsolatedPriorityTtlSweepWorker({pool,env});
 async function claimOne(){
  const c=await pool.connect(),lease=token();
  try{
   await c.query('BEGIN');
   try{
    const row=(await c.query(
     "WITH picked AS (SELECT job_id,state FROM public.f05_priority_schedule_jobs_test "+
     "WHERE ((state='pending' AND next_attempt_at<=statement_timestamp()) "+
     "OR (state='claimed' AND lease_until<=statement_timestamp())) "+
     "ORDER BY due_at,job_id FOR UPDATE SKIP LOCKED LIMIT 1) "+
     "UPDATE public.f05_priority_schedule_jobs_test j SET state='claimed',lease_token=$1,"+
     "lease_until=statement_timestamp()+interval '30 seconds',attempts=j.attempts+1 "+
     "FROM picked WHERE j.job_id=picked.job_id "+
     "RETURNING j.job_id,j.priority_id,j.vehicle_id,j.attempts,picked.state AS previous_state",
     [lease])).rows[0];
    if(!row){await c.query('ROLLBACK');return null}
    await c.query("INSERT INTO public.f05_priority_schedule_events_test "+
     "(job_id,priority_id,action,attempt,disposition) VALUES($1,$2,$3,$4,$5)",
     [String(row.job_id),String(row.priority_id),row.previous_state==='claimed'?'RECOVERED':'CLAIMED',
      row.attempts,row.previous_state==='claimed'?'LEASE_EXPIRED':'DUE']);
    await c.query('COMMIT');
    return {jobId:String(row.job_id),priorityId:String(row.priority_id),vehicleId:String(row.vehicle_id),
      attempt:Number(row.attempts),lease};
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }
 async function finish(job,disposition){
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const changed=(await c.query("UPDATE public.f05_priority_schedule_jobs_test SET state='done',"+
     "lease_token=NULL,lease_until=NULL,completed_at=statement_timestamp(),last_error_code=NULL "+
     "WHERE job_id=$1 AND state='claimed' AND lease_token=$2 RETURNING priority_id",
     [job.jobId,job.lease])).rows[0];
    if(!changed){await c.query('ROLLBACK');return false}
    await c.query("INSERT INTO public.f05_priority_schedule_events_test "+
     "(job_id,priority_id,action,attempt,disposition) VALUES($1,$2,'DONE',$3,$4)",
     [job.jobId,job.priorityId,job.attempt,disposition]);
    await c.query('COMMIT');return true;
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }
 async function retry(job){
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const seconds=Math.min(60,Math.max(1,2**Math.min(job.attempt,5)));
    const changed=(await c.query("UPDATE public.f05_priority_schedule_jobs_test SET state='pending',"+
     "lease_token=NULL,lease_until=NULL,next_attempt_at=statement_timestamp()+$3::integer*interval '1 second',"+
     "last_error_code='TTL_SWEEP_RETRYABLE' WHERE job_id=$1 AND state='claimed' AND lease_token=$2 RETURNING priority_id",
     [job.jobId,job.lease,seconds])).rows[0];
    if(!changed){await c.query('ROLLBACK');return false}
    await c.query("INSERT INTO public.f05_priority_schedule_events_test "+
     "(job_id,priority_id,action,attempt,disposition) VALUES($1,$2,'RETRY',$3,'TTL_SWEEP_RETRYABLE')",
     [job.jobId,job.priorityId,job.attempt]);
    await c.query('COMMIT');return true;
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }
 return Object.freeze({async runDue({limit=25}={}){
  if(!Number.isInteger(limit)||limit<1||limit>25)throw Error('F05_PRIORITY_SCHEDULER_BATCH_LIMIT');
  const out={claimed:0,done:0,retried:0,lostLease:0,productionReady:false,worker:'DISPOSABLE_TEST_ONLY'};
  for(let i=0;i<limit;i++){
   const job=await claimOne();if(!job)break;out.claimed++;
   try{
    const disposition=await ttl.runPriority({priorityId:job.priorityId,vehicleId:job.vehicleId});
    if(await finish(job,disposition))out.done++;else out.lostLease++;
   }catch{
    if(await retry(job))out.retried++;else out.lostLease++;
   }
  }
  out.hasDue=(await pool.query("SELECT 1 FROM public.f05_priority_schedule_jobs_test WHERE "+
    "(state='pending' AND next_attempt_at<=statement_timestamp()) OR "+
    "(state='claimed' AND lease_until<=statement_timestamp()) LIMIT 1")).rows.length>0;
  return out;
 }});
}
