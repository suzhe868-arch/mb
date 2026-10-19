// F05-8 bounded physical PG16 expiry reconciliation. It is a callable test-only
// runOnce worker, not a deployed scheduler nor an independent Priority issuer.
import {candidatesSQL,firstStillQualifiedCandidate} from './f05-priority-service.mjs';

export function createIsolatedPriorityTtlSweepWorker({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function' || env.APP_ENV!=='test'||
  env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
  env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('PRIORITY_TTL_WORKER_FORMAL_SOURCE_NOT_SIGNED');

 async function sweepOne(priorityId,vehicleId){
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    // Keep the same lock order as the Employee arbitration transaction.
    // No pre-lock on priority_leases, and no trust in stale scan candidates.
    await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_PRIORITY_VEHICLE'),hashtext($1))",[vehicleId]);
    const v=(await db.query("SELECT vehicle_id,source_type,source_sale_status,archived_at "+
      "FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE",[vehicleId])).rows[0];
    if(!v){await db.query('ROLLBACK');return 'skipped'}
    const active=(await db.query("SELECT priority_id,vehicle_id,customer_id,listing_cycle_id,source_match_result_id "+
      "FROM public.priority_leases WHERE priority_id=$1 AND vehicle_id=$2 AND status='active' "+
      "AND expires_at<=statement_timestamp() FOR UPDATE",[priorityId,vehicleId])).rows[0];
    if(!active){await db.query('ROLLBACK');return 'skipped'}
    const cycle=(await db.query("SELECT listing_cycle_id FROM public.vehicle_listing_cycles "+
      "WHERE vehicle_id=$1 AND ended_at IS NULL FOR SHARE",[vehicleId])).rows[0];
    // End the original lease first, then persist a customer/cycle suppression
    // barrier for every old Match version. A later genuinely recomputed
    // result is a fresh opportunity; the expired trigger itself is not.
    const cutoff=(await db.query("SELECT COALESCE(MAX(mr.result_id),$4::bigint) AS highest "+
       "FROM public.demand_match_results mr JOIN public.demands d ON d.demand_id=mr.demand_id "+
       "WHERE d.customer_id=$1 AND mr.vehicle_id=$2 AND mr.listing_cycle_id=$3",
       [String(active.customer_id),vehicleId,String(active.listing_cycle_id),
        String(active.source_match_result_id)])).rows[0];
    await db.query("UPDATE public.priority_leases SET status='ended',ended_at=statement_timestamp() "+
      "WHERE priority_id=$1",[priorityId]);
    await db.query("INSERT INTO public.f05_priority_suppression_test "+
      "(customer_id,vehicle_id,listing_cycle_id,source_match_result_id,reason) "+
      "VALUES($1,$2,$3,$4,'ttl_expired') ON CONFLICT DO NOTHING",
      [String(active.customer_id),vehicleId,String(active.listing_cycle_id),String(cutoff.highest)]);
    let next=null;
    const saleable=v.archived_at===null&&
      ((v.source_type==='wholesale'&&v.source_sale_status==='active')||
       (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
    if(saleable&&cycle){
     const cyid=String(cycle.listing_cycle_id);
     const occupied=(await db.query("SELECT "+
      "EXISTS(SELECT 1 FROM public.locks WHERE vehicle_id=$1 AND lock_status='active' "+
      "AND expires_at>statement_timestamp()) AS locked,"+
      "EXISTS(SELECT 1 FROM public.transactions WHERE vehicle_id=$1 AND status='in_progress') AS transacting",
      [vehicleId])).rows[0];
     if(!occupied.locked&&!occupied.transacting){
      const best=await firstStillQualifiedCandidate(db,(await db.query(candidatesSQL,[vehicleId,cyid])).rows);
      if(best){
       const conf=(await db.query("SELECT ttl_seconds FROM public.f05_priority_config_test "+
        "WHERE singleton=true FOR SHARE")).rows[0];
       if(!conf)throw Error('F05_PRIORITY_TTL_CONFIG_NOT_READY');
       next=(await db.query("INSERT INTO public.priority_leases "+
        "(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
        "VALUES($1,$2,$3,'active',statement_timestamp()+$4::integer*interval '1 second',$5,$6) "+
        "RETURNING priority_id",
        [vehicleId,String(best.customer_id),String(best.demand_id),conf.ttl_seconds,
         cyid,String(best.result_id)])).rows[0]?.priority_id??null;
      }
     }
    }
    await db.query("INSERT INTO public.f05_priority_sweep_events_test "+
      "(priority_id,vehicle_id,old_customer_id,next_priority_id,disposition) "+
      "VALUES($1,$2,$3,$4,$5)",
      [priorityId,vehicleId,String(active.customer_id),next,
       next===null?'ENDED':'REARBITRATED']);
    await db.query('COMMIT');
    return next===null?'ended':'rearbitrated';
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }
 return Object.freeze({
 async runPriority({priorityId,vehicleId}={}){
  if(typeof priorityId!=='string'||!/^[1-9][0-9]{0,18}$/.test(priorityId)||
     typeof vehicleId!=='string'||!/^[1-9][0-9]{0,18}$/.test(vehicleId))
   throw Error('F05_PRIORITY_TTL_TARGET_INVALID');
  return sweepOne(priorityId,vehicleId);
 },
 async runOnce({limit=25}={}){
  if(!Number.isInteger(limit)||limit<1||limit>25)throw Error('F05_PRIORITY_TTL_SWEEP_BATCH_LIMIT');
  // Discovery is bounded and read-only; each item is rechecked only after
  // taking the same locks as interactive arbitration.
  const candidates=(await pool.query("SELECT priority_id,vehicle_id FROM public.priority_leases "+
    "WHERE status='active' AND expires_at<=statement_timestamp() "+
    "ORDER BY expires_at,priority_id LIMIT $1",[limit])).rows;
  const result={examined:candidates.length,ended:0,rearbitrated:0,skipped:0,
    worker:'DISPOSABLE_TEST_ONLY',productionReady:false};
  for(const p of candidates){
   const state=await sweepOne(String(p.priority_id),String(p.vehicle_id));
   if(state==='ended')result.ended++;
   else if(state==='rearbitrated')result.rearbitrated++;
   else result.skipped++;
  }
  const more=(await pool.query("SELECT 1 FROM public.priority_leases "+
   "WHERE status='active' AND expires_at<=statement_timestamp() LIMIT 1")).rows.length>0;
  result.hasMore=more;
  return result;
 }});
}
