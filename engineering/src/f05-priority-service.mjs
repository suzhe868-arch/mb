// PDM-13 F05-8: real PG16 scoped arbitration over the ONE PDM-12 safe Match view.
// No Priority-created Recommendation, grant, Customer price right, Lock or Owner reassignment.
import {createHash} from 'node:crypto';
const sha=s=>createHash('sha256').update(s).digest('hex');
const validId=s=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
const validBearer=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
const validKey=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(s);
const response=(status,code,more={})=>({status,body:{code,...more,productionReady:false}});
const lockText="SELECT pg_advisory_xact_lock(hashtext('F05_PRIORITY_VEHICLE'),hashtext($1))";
export const candidatesSQL=`
 SELECT ranked.result_id,ranked.demand_id,ranked.customer_id,ranked.responsible_employee_id,
 ranked.match_tier,ranked.created_at
 FROM (
  SELECT match.result_id,match.demand_id,d.customer_id,d.responsible_employee_id,
    match.match_tier,d.created_at,
    row_number() OVER (PARTITION BY d.customer_id
     ORDER BY CASE match.match_tier WHEN 'high' THEN 0 ELSE 1 END,
      d.created_at,d.demand_id) AS customer_rank
  FROM public.f05_matching_safe_current_test match
  JOIN public.demands d ON d.demand_id=match.demand_id
  JOIN public.customers cust ON cust.customer_id=d.customer_id
   AND cust.account_status='active'
   AND cust.current_owner_employee_id=d.responsible_employee_id
  JOIN public.employees employee ON employee.employee_id=d.responsible_employee_id
   AND employee.employment_status='active'
  JOIN public.roles employee_role ON employee_role.role_id=employee.main_role_id
   AND employee_role.role_code IN('sales','manager','store_head')
  JOIN public.f05_priority_qualification_test qualified ON qualified.customer_id=d.customer_id
   AND qualified.enabled=true AND qualified.issuer='DISPOSABLE_TEST_ONLY'
   AND qualified.expires_at>statement_timestamp()
  JOIN public.f05_priority_employee_scope_test scope ON scope.customer_id=d.customer_id
   AND scope.employee_id=d.responsible_employee_id AND scope.can_manage=true
   AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp()
  WHERE match.vehicle_id=$1 AND match.listing_cycle_id=$2
   AND match.match_tier IN('high','acceptable')
   AND NOT EXISTS(SELECT 1 FROM public.f05_priority_suppression_test sup
    WHERE sup.customer_id=d.customer_id AND sup.vehicle_id=$1 AND sup.listing_cycle_id=$2
     AND sup.source_match_result_id>=match.result_id)
 ) ranked
 WHERE ranked.customer_rank=1
 ORDER BY CASE ranked.match_tier WHEN 'high' THEN 0 ELSE 1 END,
 ranked.created_at,ranked.demand_id LIMIT 100
`;
// Serialize issuance with an administrator's qualification DISABLE transaction.
 // Candidate discovery alone is a READ COMMITTED snapshot; without the final row
 // lock a new Lease could commit from a stale enabled qualification.
export async function firstStillQualifiedCandidate(db,candidates){
 for(const candidate of candidates){
  const current=(await db.query(
   "SELECT 1 FROM public.f05_priority_qualification_test q "+
   "WHERE q.customer_id=$1 AND q.enabled=true AND q.issuer='DISPOSABLE_TEST_ONLY' "+
   "AND q.expires_at>statement_timestamp() FOR SHARE OF q",
   [String(candidate.customer_id)])).rows[0];
  if(current)return candidate;
 }
 return null;
}

export function createIsolatedPriorityService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('PRIORITY_TRUSTED_ISSUER_REQUIRED');
 return Object.freeze({async act({credential,action,vehicleId,eventKey}={}){
  if(!validBearer(credential))return response(401,'PRIORITY_EMPLOYEE_REQUIRED');
  if(!['RECONCILE','RELEASE'].includes(action)||!validId(vehicleId)||!validKey(eventKey))
   return response(400,'PRIORITY_INVALID_REQUEST');
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query("SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles r ON r.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
     "AND s.expires_at>statement_timestamp() AND e.employment_status='active' "+
     "AND r.role_code IN('sales','manager','store_head') FOR SHARE OF s,e,r",[sha(credential)])).rows[0];
    if(!actor){await db.query('ROLLBACK');return response(403,'PRIORITY_ACTIVE_EMPLOYEE_SCOPE_REQUIRED')}
    const eid=String(actor.employee_id);
    await db.query(lockText,[vehicleId]);
    const v=(await db.query("SELECT vehicle_id,source_type,source_sale_status,archived_at "+
     "FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE",[vehicleId])).rows[0];
    if(!v){await db.query('ROLLBACK');return response(404,'PRIORITY_VEHICLE_NOT_FOUND')}
    const cycle=(await db.query("SELECT listing_cycle_id FROM public.vehicle_listing_cycles "+
     "WHERE vehicle_id=$1 AND ended_at IS NULL FOR SHARE",[vehicleId])).rows[0];
    const active=(await db.query("SELECT p.priority_id,p.customer_id,p.trigger_demand_id,p.source_match_result_id,p.listing_cycle_id,p.expires_at,"+
     "d.responsible_employee_id FROM public.priority_leases p "+
     "LEFT JOIN public.demands d ON d.demand_id=p.trigger_demand_id "+
     "WHERE p.vehicle_id=$1 AND p.status='active' FOR UPDATE OF p",[vehicleId])).rows[0];
    // Permission is actor's current per-Customer business responsibility, never historical creator.
    let authorized=false;
    if(active&&String(active.responsible_employee_id)===eid){
     authorized=!!(await db.query("SELECT 1 FROM public.f05_priority_employee_scope_test "+
      "WHERE employee_id=$1 AND customer_id=$2 AND can_manage=true "+
      "AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
      [eid,String(active.customer_id)])).rows[0];
    }
    if(!authorized&&cycle){
     authorized=!!(await db.query("SELECT 1 FROM public.demands d "+
      "JOIN public.f05_priority_employee_scope_test scope ON scope.customer_id=d.customer_id "+
      "AND scope.employee_id=$1 AND scope.can_manage=true "+
      "AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp() "+
      "WHERE d.responsible_employee_id=$1 AND d.demand_state='active' AND "+
      "EXISTS(SELECT 1 FROM public.f05_matching_safe_current_test m WHERE m.demand_id=d.demand_id "+
      "AND m.vehicle_id=$2 AND m.listing_cycle_id=$3 AND m.match_tier IN('high','acceptable')) "+
      "FOR SHARE OF d,scope LIMIT 1",[eid,vehicleId,String(cycle.listing_cycle_id)])).rows[0];
    }
    if(!authorized){await db.query('ROLLBACK');return response(403,'PRIORITY_CURRENT_RESPONSIBLE_SCOPE_REQUIRED')}
    if(action==='RELEASE'&&(!active||String(active.responsible_employee_id)!==eid)){
     await db.query('ROLLBACK');return response(403,'PRIORITY_RELEASE_TRIGGER_RESPONSIBLE_REQUIRED');
    }
    const digest=sha(JSON.stringify([eid,action,vehicleId]));
    await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_PRIORITY_EVENT'),hashtext($1))",[eventKey]);
    const previous=(await db.query("SELECT actor_employee_id,payload_sha256,source_priority_id,outcome "+
     "FROM public.f05_priority_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(previous){
     await db.query('ROLLBACK');
     if(String(previous.actor_employee_id)!==eid||previous.payload_sha256!==digest)
      return response(409,'PRIORITY_IDEMPOTENCY_COLLISION');
     return response(200,'PRIORITY_EVENT_REPLAY',{outcome:previous.outcome,changed:false});
    }
    if(!cycle){await db.query('ROLLBACK');return response(409,'PRIORITY_NO_CURRENT_LISTING_CYCLE')}
    const cyid=String(cycle.listing_cycle_id);
    const occupied=(await db.query("SELECT "+
     "EXISTS(SELECT 1 FROM public.locks WHERE vehicle_id=$1 AND lock_status='active' "+
     "AND expires_at>statement_timestamp()) AS locked,"+
     "EXISTS(SELECT 1 FROM public.transactions WHERE vehicle_id=$1 AND status='in_progress') AS transacting",
     [vehicleId])).rows[0];
    const saleable=v.archived_at===null&&
     ((v.source_type==='wholesale'&&v.source_sale_status==='active')||
      (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
    const legalCandidates=(!saleable||occupied.locked||occupied.transacting)?[]:
      (await db.query(candidatesSQL,[vehicleId,cyid])).rows;
    const activeSame=active&&String(active.listing_cycle_id)===cyid;
    const forExisting=legalCandidates.filter(c=>String(c.customer_id)===String(active?.customer_id));
    const bestSame=forExisting[0]??null;
    const expired=active&&new Date(active.expires_at).getTime()<=Date.now();
    let after=null,outcome='NO_CANDIDATE',changed=false;
    const close=async(reason)=>{
     await db.query("UPDATE public.priority_leases SET status='ended',ended_at=statement_timestamp() "+
      "WHERE priority_id=$1 AND status='active'",[String(active.priority_id)]);
     if(['employee_released','ttl_expired'].includes(reason)){
      // Suppress ALL old Result versions for this Customer in this cycle, not
      // just the trigger Demand; otherwise a second old Demand could steal
      // Priority back without a genuine new matching fact.
      const maximum=(await db.query("SELECT COALESCE(MAX(result_id),$4::bigint) AS highest "+
       "FROM public.demand_match_results mr JOIN public.demands d ON d.demand_id=mr.demand_id "+
       "WHERE d.customer_id=$1 AND mr.vehicle_id=$2 AND mr.listing_cycle_id=$3",
       [String(active.customer_id),vehicleId,String(active.listing_cycle_id),
        String(active.source_match_result_id)])).rows[0];
      await db.query("INSERT INTO public.f05_priority_suppression_test "+
       "(customer_id,vehicle_id,listing_cycle_id,source_match_result_id,reason) "+
       "VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
       [String(active.customer_id),vehicleId,String(active.listing_cycle_id),
        String(maximum.highest),reason]);
     }
     changed=true;
    };
    if(active){
     if(action==='RELEASE')await close('employee_released');
     else if(expired)await close('ttl_expired');
     else if(!activeSame||!saleable||occupied.locked||occupied.transacting||!bestSame)
      await close('match_invalidated');
     else{
      // Same Customer's improved/remaining trigger Demand does not renew the TTL.
      if(String(bestSame.demand_id)!==String(active.trigger_demand_id)||
         String(bestSame.result_id)!==String(active.source_match_result_id)){
       await db.query("UPDATE public.priority_leases SET trigger_demand_id=$2,source_match_result_id=$3 "+
        "WHERE priority_id=$1",[String(active.priority_id),String(bestSame.demand_id),
         String(bestSame.result_id)]);changed=true;
      }
      after=String(active.priority_id);outcome='UNCHANGED';
     }
    }
    if(!after&&saleable&&!occupied.locked&&!occupied.transacting){
     // Suppression is written by RELEASE/TTL in this transaction: rescan AFTER
     // closure so the same old Match cannot regain the lease immediately.
     const winners=active?(await db.query(candidatesSQL,[vehicleId,cyid])).rows:legalCandidates;
     let first=await firstStillQualifiedCandidate(db,winners);
     // If same Customer had multiple candidate Results, suppression applies to
     // exact released Result only. Do not reinstate same old Match in this cycle.
     if(first){
      const ttl=(await db.query("SELECT ttl_seconds FROM public.f05_priority_config_test "+
       "WHERE singleton=true FOR SHARE")).rows[0];
      if(!ttl){await db.query('ROLLBACK');return response(503,'PRIORITY_TTL_CONFIG_NOT_SIGNED')}
      const created=(await db.query("INSERT INTO public.priority_leases "+
       "(vehicle_id,customer_id,trigger_demand_id,status,expires_at,listing_cycle_id,source_match_result_id) "+
       "VALUES($1,$2,$3,'active',statement_timestamp()+$4::integer * interval '1 second',$5,$6) "+
       "RETURNING priority_id",[vehicleId,String(first.customer_id),String(first.demand_id),
        ttl.ttl_seconds,cyid,String(first.result_id)])).rows[0];
      after=String(created.priority_id);changed=true;
      outcome=active?'REARBITRATED':'NEW';
     }
    }
    if(active&&!after)outcome='ENDED';
    await db.query("INSERT INTO public.f05_priority_events_test "+
     "(event_key,actor_employee_id,payload_sha256,vehicle_id,action,source_priority_id,outcome) "+
     "VALUES($1,$2,$3,$4,$5,$6,$7)",[eventKey,eid,digest,vehicleId,action,after,outcome]);
    await db.query('COMMIT');
    return response(200,'PRIORITY_RECONCILED',{changed,outcome,protected:after!==null,
     noRecommendation:true,noVisibilityGrant:true,noPriceRight:true,noLockPriority:true});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
