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
    SELECT q.demand_id,q.vehicle_id
    FROM public.f05_matching_affected_queue_test q
    JOIN public.demands d ON d.demand_id=q.demand_id AND d.demand_state='active'
    JOIN public.customers c ON c.customer_id=d.customer_id AND c.account_status='active'
     AND c.owner_assignment_state='assigned'
     AND c.current_owner_employee_id=d.responsible_employee_id
    JOIN public.f05_catalog_employee_sessions_test s ON s.employee_id=d.responsible_employee_id
     AND s.token_sha256=$2 AND s.issuer='DISPOSABLE_TEST_ONLY'
     AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp()
    JOIN public.employees e ON e.employee_id=s.employee_id AND e.employment_status='active'
    JOIN public.roles role ON role.role_id=e.main_role_id
     AND role.role_code IN ('sales','manager','store_head')
    JOIN public.f05_matching_employee_scope_test scope ON scope.employee_id=e.employee_id
     AND scope.customer_id=c.customer_id AND scope.can_recompute=true
     AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp()
    WHERE ((q.state='pending' AND q.next_attempt_at<=statement_timestamp())
       OR (q.state='processing' AND q.lease_until<statement_timestamp()))
    ORDER BY q.next_attempt_at,q.demand_id,q.vehicle_id
    LIMIT $1 FOR UPDATE OF q SKIP LOCKED
   )
   UPDATE public.f05_matching_affected_queue_test q
    SET state='processing',lease_until=statement_timestamp()+interval '60 seconds',
        modified_at=statement_timestamp()
    FROM selected s WHERE q.demand_id=s.demand_id AND q.vehicle_id=s.vehicle_id
   RETURNING q.demand_id,q.vehicle_id,q.generation,q.attempts,
     q.lease_until::text AS claim_stamp`,[limit,createHash('sha256').update(credential).digest('hex')])).rows;
  const outcomes=[];
  for(const job of jobs){
   const demandId=String(job.demand_id),vehicleId=String(job.vehicle_id);
   if(!ID.test(demandId)||!ID.test(vehicleId))throw Error('MATCH_RETRY_DB_ID_CORRUPT');
   const generation=String(job.generation),claimStamp=job.claim_stamp;
   if(typeof claimStamp!=='string'||!claimStamp)throw Error('MATCH_RETRY_MISSING_LEASE_STAMP');
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
       AND lease_until::text=$4
     RETURNING generation`,[demandId,vehicleId,generation,claimStamp]);
   }else{
    // Matching.recompute commits its own transaction and sets queue state='done'
    // BEFORE this worker verifies read-time evidence. A newly expired scope or
    // source can invalidate the result without writing a matching row/queue
    // trigger. Reopen that SAME generation instead of silently losing the job.
    // Never revive an unrelated/newer generation: generation is still CAS.
    const error=success&&!valid?'MATCH_RETRY_EVIDENCE_NOT_CURRENT':
     String(result?.body?.code??'MATCH_RETRY_UNKNOWN').slice(0,120);
    changed=await pool.query(`
     UPDATE public.f05_matching_affected_queue_test
      SET attempts=LEAST(5,attempts+1),
          state=CASE WHEN attempts+1>=5 THEN 'failed' ELSE 'pending' END,
          next_attempt_at=statement_timestamp()+make_interval(secs=>LEAST(300,2^(attempts+1))::integer),
          lease_until=NULL,last_error=$4,modified_at=statement_timestamp()
     WHERE demand_id=$1 AND vehicle_id=$2 AND generation=$3 AND state IN ('processing','done')
       AND lease_until::text=$5
     RETURNING generation`,[demandId,vehicleId,generation,error,claimStamp]);
   }
   outcomes.push({demandId,vehicleId,
      outcome:changed.rowCount===0?'superseded':valid?'done':'retry_pending_or_failed'});
  }
  return Object.freeze({claimed:jobs.length,outcomes});
 }});
}
