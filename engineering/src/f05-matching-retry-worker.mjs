// PDM-12 test-only bounded affected-pair retry. Never manufactures an Employee issuer.
import {createHash} from 'node:crypto';
const ID=/^[1-9][0-9]{0,18}$/;
export function createIsolatedMatchingRetryWorker({pool,matching,env=process.env}={}){
 if(!pool||typeof pool.query!=='function'||!matching||typeof matching.recompute!=='function'||
    env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
    env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('MATCH_RETRY_TEST_ONLY_ISSUER_REQUIRED');
 return Object.freeze({async runOnce({credential,limit=10}={}){
  if(typeof credential!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(credential))
   throw Error('MATCH_RETRY_EMPLOYEE_CREDENTIAL_REQUIRED');
  if(!Number.isInteger(limit)||limit<1||limit>50)throw Error('MATCH_RETRY_BATCH_LIMIT_INVALID');
  // Single statement lease, SKIP LOCKED: two workers cannot claim the same generation.
  const jobs=(await pool.query(`
   WITH selected AS (
    SELECT demand_id,vehicle_id FROM public.f05_matching_affected_queue_test
    WHERE (state='pending' AND next_attempt_at<=statement_timestamp())
       OR (state='processing' AND lease_until<statement_timestamp())
    ORDER BY next_attempt_at,demand_id,vehicle_id
    FOR UPDATE SKIP LOCKED LIMIT $1
   )
   UPDATE public.f05_matching_affected_queue_test q
    SET state='processing',lease_until=statement_timestamp()+interval '60 seconds',
        modified_at=statement_timestamp()
    FROM selected s WHERE q.demand_id=s.demand_id AND q.vehicle_id=s.vehicle_id
   RETURNING q.demand_id,q.vehicle_id,q.generation,q.attempts`,[limit])).rows;
  const outcomes=[];
  for(const job of jobs){
   const demandId=String(job.demand_id),vehicleId=String(job.vehicle_id);
   if(!ID.test(demandId)||!ID.test(vehicleId))throw Error('MATCH_RETRY_DB_ID_CORRUPT');
   const generation=String(job.generation);
   // A pair+generation has one stable key across failed retries; no random false success.
   const eventKey=createHash('sha256').update(['F05_AFFECTED_TEST_V1',demandId,vehicleId,generation].join(':')).digest('base64url');
   let result;
   try{result=await matching.recompute({credential,demandId,vehicleId,eventKey})}
   catch{result={status:503,body:{code:'MATCH_RETRY_DEPENDENCY_FAILED'}}}
   const success=result?.status===200&&
      ['MATCH_RESULT_RECOMPUTED','MATCH_RECOMPUTE_REPLAY'].includes(result?.body?.code);
   // A successful old replay only counts if a fresh safe current result really exists.
   const valid=success&&(await pool.query(`
    SELECT EXISTS(SELECT 1 FROM public.f05_matching_safe_current_test
      WHERE demand_id=$1 AND vehicle_id=$2) AS yes`,[demandId,vehicleId])).rows[0]?.yes===true;
   let changed;
   if(valid){
    changed=await pool.query(`
     UPDATE public.f05_matching_affected_queue_test SET state='done',lease_until=NULL,
      last_error=NULL,modified_at=statement_timestamp()
     WHERE demand_id=$1 AND vehicle_id=$2 AND generation=$3 AND state IN ('processing','done')
     RETURNING generation`,[demandId,vehicleId,generation]);
   }else{
    const error=String(result?.body?.code??'MATCH_RETRY_UNKNOWN').slice(0,120);
    changed=await pool.query(`
     UPDATE public.f05_matching_affected_queue_test
      SET attempts=LEAST(5,attempts+1),
          state=CASE WHEN attempts+1>=5 THEN 'failed' ELSE 'pending' END,
          next_attempt_at=statement_timestamp()+make_interval(secs=>LEAST(300,2^(attempts+1))::integer),
          lease_until=NULL,last_error=$4,modified_at=statement_timestamp()
     WHERE demand_id=$1 AND vehicle_id=$2 AND generation=$3 AND state='processing'
     RETURNING generation`,[demandId,vehicleId,generation,error]);
   }
   outcomes.push({demandId,vehicleId,
      outcome:changed.rowCount===0?'superseded':valid?'done':'retry_pending_or_failed'});
  }
  return Object.freeze({claimed:jobs.length,outcomes});
 }});
}
