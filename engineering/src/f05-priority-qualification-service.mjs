// PDM-13 single-customer qualification control, test-only PG16, never a formal F03 issuer.
import {createHash} from 'node:crypto';
import {candidatesSQL} from './f05-priority-service.mjs';
const digest=x=>createHash('sha256').update(x).digest('hex');
const pgId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const reply=(status,code,other={})=>({status,body:{code,...other,productionReady:false}});

export function createIsolatedPriorityQualificationService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('PRIORITY_QUALIFICATION_PRODUCTION_ISSUER_REQUIRED');
 return Object.freeze({async mutate({credential,customerId,action,expectedRevision,eventKey}={}){
  if(!token(credential))return reply(401,'PRIORITY_QUAL_EMPLOYEE_REQUIRED');
  if(!pgId(customerId)||!['ENABLE','DISABLE'].includes(action)||!Number.isSafeInteger(expectedRevision)||
   expectedRevision<0||expectedRevision>1000000000||!key(eventKey))
   return reply(400,'PRIORITY_QUAL_INVALID_REQUEST');
  const fingerprint=digest(JSON.stringify([customerId,action,expectedRevision]));
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query(
     "SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test ses "+
     "JOIN public.employees e ON e.employee_id=ses.employee_id "+
     "JOIN public.roles r ON r.role_id=e.main_role_id "+
     "JOIN public.f05_priority_qualification_manage_scope_test scope "+
     "ON scope.employee_id=e.employee_id AND scope.customer_id=$2 "+
     "WHERE ses.token_sha256=$1 AND ses.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND ses.revoked_at IS NULL AND ses.expires_at>statement_timestamp() "+
     "AND e.employment_status='active' AND r.role_code IN('manager','store_head') "+
     "AND scope.can_manage=true AND scope.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND scope.expires_at>statement_timestamp() FOR SHARE OF ses,e,r,scope",
     [digest(credential),customerId])).rows[0];
    if(!actor){await db.query('ROLLBACK');return reply(403,'PRIORITY_QUAL_EXPLICIT_MANAGER_SCOPE_REQUIRED')}
    const employeeId=String(actor.employee_id);
    const cust=(await db.query("SELECT customer_id FROM public.customers "+
     "WHERE customer_id=$1 FOR SHARE",[customerId])).rows[0];
    if(!cust){await db.query('ROLLBACK');return reply(404,'PRIORITY_QUAL_CUSTOMER_NOT_FOUND')}
    await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_QUAL_CUSTOMER'),hashtext($1))",[customerId]);
    const oldEvent=(await db.query("SELECT fingerprint,actor_employee_id,after_json,ended_count,rearbitrated_count "+
     "FROM public.f05_priority_qualification_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(oldEvent){
     await db.query('ROLLBACK');
     if(oldEvent.fingerprint!==fingerprint||String(oldEvent.actor_employee_id)!==employeeId)
      return reply(409,'PRIORITY_QUAL_EVENT_COLLISION');
     return reply(200,'PRIORITY_QUAL_REPLAY',{
      revision:oldEvent.after_json.revision,enabled:oldEvent.after_json.enabled,
      endedCount:oldEvent.ended_count,rearbitratedCount:oldEvent.rearbitrated_count});
    }
    // Bounded all-or-nothing disable; never accept a partial switch leaving
    // some old Priority leases active under the same Customer qualification.
    const currentLeases=action==='DISABLE'?(await db.query(
     "SELECT priority_id,vehicle_id FROM public.priority_leases "+
     "WHERE customer_id=$1 AND status='active' ORDER BY vehicle_id,priority_id LIMIT 26",
     [customerId])).rows:[];
    if(currentLeases.length>25){
     await db.query('ROLLBACK');return reply(409,'PRIORITY_QUAL_TOO_MANY_ACTIVE_LEASES',{limit:25});
    }
    // Match the existing Priority writer's vehicle lock order before taking
    // the qualification row FOR UPDATE, to bound deadlocks on shared facts.
    for(const v of currentLeases){
     await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_PRIORITY_VEHICLE'),hashtext($1))",[String(v.vehicle_id)]);
     await db.query("SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE",[String(v.vehicle_id)]);
    }
    const existing=(await db.query("SELECT enabled,revision FROM public.f05_priority_qualification_test "+
      "WHERE customer_id=$1 FOR UPDATE",[customerId])).rows[0];
    const revision=Number(existing?.revision??0);
    if(revision!==expectedRevision){
     await db.query('ROLLBACK');return reply(409,'PRIORITY_QUAL_STALE_REVISION',{currentRevision:revision});
    }
    const target=action==='ENABLE',changed=!existing||existing.enabled!==target;
    let nextRevision=revision;
    if(changed){
     if(!existing){
      nextRevision=1;
      await db.query("INSERT INTO public.f05_priority_qualification_test "+
       "(customer_id,enabled,expires_at,revision) VALUES($1,$2,statement_timestamp()+interval '20 minutes',1)",
       [customerId,target]);
     }else{
      nextRevision=revision+1;
      await db.query("UPDATE public.f05_priority_qualification_test "+
       "SET enabled=$2,revision=$3 WHERE customer_id=$1",[customerId,target,nextRevision]);
     }
    }
    let ended=0,reranked=0;
    if(action==='DISABLE'){
     const latest=(await db.query("SELECT priority_id,vehicle_id FROM public.priority_leases "+
      "WHERE customer_id=$1 AND status='active' ORDER BY vehicle_id,priority_id",
      [customerId])).rows;
     // Fail rather than silently leave an unscanned Lease from a concurrent writer.
     if(latest.length!==currentLeases.length||latest.some((x,i)=>String(x.priority_id)!==String(currentLeases[i].priority_id)))
      throw Error('PRIORITY_QUAL_ACTIVE_SET_CHANGED_RETRY');
     for(const entry of latest){
      const vehicleId=String(entry.vehicle_id),priorityId=String(entry.priority_id);
      const p=(await db.query("UPDATE public.priority_leases SET status='ended',ended_at=statement_timestamp() "+
       "WHERE priority_id=$1 AND status='active' RETURNING listing_cycle_id",
       [priorityId])).rows[0];
      if(!p)throw Error('PRIORITY_QUAL_LEASE_CHANGED_RETRY');
      ended++;
      const v=(await db.query("SELECT source_type,source_sale_status,archived_at FROM public.vehicles "+
       "WHERE vehicle_id=$1",[vehicleId])).rows[0];
      const cycle=(await db.query("SELECT listing_cycle_id FROM public.vehicle_listing_cycles "+
       "WHERE vehicle_id=$1 AND ended_at IS NULL",[vehicleId])).rows[0];
      const activeLock=(await db.query(
       "SELECT EXISTS(SELECT 1 FROM public.locks WHERE vehicle_id=$1 AND lock_status='active' "+
       "AND expires_at>statement_timestamp()) AS locked,"+
       "EXISTS(SELECT 1 FROM public.transactions WHERE vehicle_id=$1 AND status='in_progress') AS transacting",
       [vehicleId])).rows[0];
      const saleable=v.archived_at===null&&
       ((v.source_type==='wholesale'&&v.source_sale_status==='active')||
        (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
      if(!saleable||!cycle||activeLock.locked||activeLock.transacting)continue;
      const cyid=String(cycle.listing_cycle_id);
      const candidate=(await db.query(candidatesSQL,[vehicleId,cyid])).rows[0];
      if(!candidate)continue;
      const config=(await db.query("SELECT ttl_seconds FROM public.f05_priority_config_test "+
       "WHERE singleton=true FOR SHARE")).rows[0];
      if(!config)throw Error('PRIORITY_QUAL_TTL_CONFIG_MISSING');
      await db.query("INSERT INTO public.priority_leases "+
       "(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
       "VALUES($1,$2,$3,'active',statement_timestamp()+$4::integer*interval '1 second',$5,$6)",
       [vehicleId,String(candidate.customer_id),String(candidate.demand_id),
        config.ttl_seconds,cyid,String(candidate.result_id)]);
      reranked++;
     }
    }
    const after={enabled:target,revision:nextRevision,reason:action==='DISABLE'?'priority_customer_disabled':null};
    await db.query("INSERT INTO public.f05_priority_qualification_events_test "+
     "(event_key,fingerprint,actor_employee_id,customer_id,action,before_json,after_json,ended_count,rearbitrated_count) "+
     "VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)",
     [eventKey,fingerprint,employeeId,customerId,action,
      existing?JSON.stringify({enabled:existing.enabled,revision}):null,JSON.stringify(after),ended,reranked]);
    await db.query('COMMIT');
    return reply(200,changed?'PRIORITY_QUAL_CHANGED':'PRIORITY_QUAL_UNCHANGED',{
     customerId,enabled:target,revision:nextRevision,endedCount:ended,
     rearbitratedCount:reranked,needsMatchReevaluation:action==='ENABLE',
     noDemandMutation:true,noRecommendation:true,noVisibilityGrant:true,noPriceRight:true});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
