// PDM12 isolated first-match candidate event; bounded, not automated upstream issuance.
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const bearer=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const out=(status,code,other={})=>({status,body:{code,...other,productionReady:false}});
export function createIsolatedMatchingDiscoveryService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_DISCOVERY_FORMAL_ISSUER_REQUIRED');
 return Object.freeze({async discover({credential,kind,subjectId,eventKey}={}){
  if(!bearer(credential))return out(401,'DISCOVERY_EMPLOYEE_REQUIRED');
  if(!['NEW_DEMAND','NEW_VEHICLE'].includes(kind)||!id(subjectId)||!key(eventKey))
   return out(400,'DISCOVERY_INVALID_REQUEST');
  const db=await pool.connect();
  try{
   await db.query('BEGIN');
   try{
    const actor=(await db.query("SELECT e.employee_id FROM public.f05_catalog_employee_sessions_test s "+
     "JOIN public.employees e ON e.employee_id=s.employee_id JOIN public.roles role ON role.role_id=e.main_role_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
     "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
     "AND e.employment_status='active' AND role.role_code IN ('sales','manager','store_head') "+
     "FOR SHARE OF s,e,role",[sha(credential)])).rows[0];
    if(!actor){await db.query('ROLLBACK');return out(403,'DISCOVERY_EMPLOYEE_SCOPE_REQUIRED')}
    const employeeId=String(actor.employee_id);
    if(kind==='NEW_DEMAND'){
     const authorized=(await db.query("SELECT 1 FROM public.demands d JOIN public.customers c ON c.customer_id=d.customer_id "+
      "JOIN public.f05_matching_employee_scope_test p ON p.customer_id=c.customer_id "+
      "AND p.employee_id=d.responsible_employee_id AND p.can_recompute=true "+
      "AND p.issuer='DISPOSABLE_TEST_ONLY' AND p.expires_at>statement_timestamp() "+
      "WHERE d.demand_id=$1 AND d.responsible_employee_id=$2 AND d.demand_state='active' "+
      "AND c.account_status='active' FOR SHARE OF d,c,p",[subjectId,employeeId])).rows[0];
     if(!authorized){await db.query('ROLLBACK');return out(403,'DISCOVERY_OBJECT_SCOPE_REQUIRED')}
    }
    const payload=sha(JSON.stringify([employeeId,kind,subjectId]));
    await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_DISCOVERY'),hashtext($1))",[eventKey]);
    const replay=(await db.query("SELECT * FROM public.f05_matching_discovery_events_test WHERE event_key=$1",[eventKey])).rows[0];
    if(replay){
     await db.query('ROLLBACK');
     if(replay.payload_sha256!==payload||String(replay.actor_employee_id)!==employeeId)
      return out(409,'DISCOVERY_IDEMPOTENCY_COLLISION');
     return out(200,'DISCOVERY_REPLAY',{queued:replay.queued_count,discoveryOnly:true});
    }
    // Query exactly one demand or exactly one vehicle. No unrestricted cartesian backfill.
    const pairs=(await db.query(`
    SELECT d.demand_id,v.vehicle_id,cy.listing_cycle_id
    FROM public.demands d
    JOIN public.customers c ON c.customer_id=d.customer_id AND c.account_status='active'
    JOIN public.f05_find_car_level_entitlement_test level ON level.level_id=c.customer_level_id
     AND level.can_activate_demand=true AND level.issuer='DISPOSABLE_TEST_ONLY'
     AND level.expires_at>statement_timestamp()
    JOIN public.f05_matching_employee_scope_test scope ON scope.customer_id=c.customer_id
     AND scope.employee_id=d.responsible_employee_id AND scope.can_recompute=true
     AND scope.issuer='DISPOSABLE_TEST_ONLY' AND scope.expires_at>statement_timestamp()
    JOIN public.f05_matching_sales_description_test desc_test ON desc_test.demand_id=d.demand_id
     AND desc_test.written_by_employee_id=d.responsible_employee_id
     AND desc_test.issuer='DISPOSABLE_TEST_ONLY' AND desc_test.expires_at>statement_timestamp()
    JOIN public.vehicles v ON v.archived_at IS NULL
      AND ((v.source_type='wholesale' AND v.source_sale_status='active')
       OR (v.source_type IN ('mingbang','four_s') AND v.source_sale_status='available'))
    JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL
    JOIN public.f05_real_catalog_visibility_test vis ON vis.vehicle_id=v.vehicle_id
     AND vis.listing_cycle_id=cy.listing_cycle_id AND vis.source_type=v.source_type
     AND vis.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED'
     AND vis.expires_at>statement_timestamp()
    JOIN public.f05_matching_vehicle_facts_test facts ON facts.vehicle_id=v.vehicle_id
     AND facts.listing_cycle_id=cy.listing_cycle_id AND facts.issuer='DISPOSABLE_TEST_ONLY'
     AND facts.expires_at>statement_timestamp()
    JOIN public.f05_catalog_price_display_proof_test price ON price.vehicle_id=v.vehicle_id
     AND price.listing_cycle_id=cy.listing_cycle_id AND price.source_type=v.source_type
     AND price.issuer='DISPOSABLE_TEST_ONLY' AND price.expires_at>statement_timestamp()
    WHERE d.responsible_employee_id=$1 AND d.demand_state='active'
     AND (($2='NEW_DEMAND' AND d.demand_id=$3) OR ($2='NEW_VEHICLE' AND v.vehicle_id=$3))
     AND NOT EXISTS (SELECT 1 FROM public.demand_match_results r WHERE r.demand_id=d.demand_id
      AND r.vehicle_id=v.vehicle_id AND r.listing_cycle_id=cy.listing_cycle_id
      AND r.current_state='current')
     AND NOT EXISTS (SELECT 1 FROM public.f05_matching_affected_queue_test q
      WHERE q.demand_id=d.demand_id AND q.vehicle_id=v.vehicle_id
       AND q.state IN ('pending','processing','failed'))
    ORDER BY d.demand_id,v.vehicle_id LIMIT 51`,[employeeId,kind,subjectId])).rows;
    if(pairs.length>50){await db.query('ROLLBACK');return out(409,'DISCOVERY_BATCH_LIMIT_EXCEEDED',{limit:50})}
    let queued=0;
    for(const p of pairs){
     const demandId=String(p.demand_id),vehicleId=String(p.vehicle_id);
     await db.query("SELECT pg_advisory_xact_lock(hashtext('F05_MATCH_PAIR'),hashtext($1))",[demandId+':'+vehicleId]);
     // Concurrent recompute may have completed between selecting and this pair lock.
     const exists=(await db.query("SELECT EXISTS(SELECT 1 FROM public.demand_match_results "+
      "WHERE demand_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND current_state='current') AS yes",
      [demandId,vehicleId,String(p.listing_cycle_id)])).rows[0]?.yes;
     if(exists)continue;
     const pushed=await db.query(`INSERT INTO public.f05_matching_affected_queue_test
      (demand_id,vehicle_id,reason) VALUES($1,$2,$3)
      ON CONFLICT(demand_id,vehicle_id) DO UPDATE SET
       generation=public.f05_matching_affected_queue_test.generation+1,
       reason=excluded.reason,state='pending',attempts=0,lease_until=NULL,
       last_error=NULL,next_attempt_at=statement_timestamp(),modified_at=statement_timestamp()
       WHERE public.f05_matching_affected_queue_test.state='done'
      RETURNING generation`,[demandId,vehicleId,kind]);
     if(pushed.rowCount)queued++;
    }
    await db.query("INSERT INTO public.f05_matching_discovery_events_test "+
     "(event_key,actor_employee_id,trigger_kind,subject_id,payload_sha256,queued_count) "+
     "VALUES($1,$2,$3,$4,$5,$6)",[eventKey,employeeId,kind,subjectId,payload,queued]);
    await db.query('COMMIT');
    return out(200,'DISCOVERY_QUEUED',{queued,discoveryOnly:true,noRecommendation:true,
      noPriority:true,noVisibilityGrant:true});
   }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
  }finally{db.release()}
 }});
}
