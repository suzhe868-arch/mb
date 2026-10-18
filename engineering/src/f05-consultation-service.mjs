// Non-production PDM-15 Consultation HTTP transaction against true F02-1 consultations.
import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(x).digest('hex');
const validId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const validToken=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const validEvent=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const answer=(status,code,extra={})=>({status,body:{code,...extra}});
export function createIsolatedConsultationService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')throw Error('CONSULTATION_REAL_ISSUER_UNAVAILABLE');
 return Object.freeze({async withdraw({token,consultationId,eventKey}){
  if(!validId(consultationId)||!validEvent(eventKey))return answer(400,'CONSULTATION_INVALID_REQUEST');
  if(!validToken(token))return answer(401,'CONSULTATION_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const customer=(await c.query("SELECT s.customer_id FROM public.f05_catalog_customer_sessions_test s "+
      "JOIN public.customers c ON c.customer_id=s.customer_id "+
      "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
      "AND s.expires_at>statement_timestamp() AND s.revoked_at IS NULL AND c.account_status='active' "+
      "FOR SHARE OF s,c",[digest(token)])).rows[0];
    if(!customer){await c.query('ROLLBACK');return answer(401,'CONSULTATION_IDENTITY_REQUIRED')}
    const customerId=String(customer.customer_id);
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_CONSULTATION_EVENT',eventKey]);
    const source=(await c.query('SELECT vehicle_id,customer_id FROM public.consultations WHERE consultation_id=$1',[consultationId])).rows[0];
    if(!source||String(source.customer_id)!==customerId){await c.query('ROLLBACK');return answer(404,'CONSULTATION_NOT_FOUND')}
    const vehicleId=String(source.vehicle_id);
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[customerId,vehicleId]);
    const row=(await c.query("SELECT consultation_id,customer_id,vehicle_id,listing_cycle_id,status "+
      "FROM public.consultations WHERE consultation_id=$1 FOR UPDATE",[consultationId])).rows[0];
    if(!row||String(row.customer_id)!==customerId||String(row.vehicle_id)!==vehicleId){await c.query('ROLLBACK');return answer(404,'CONSULTATION_NOT_FOUND')}
    const hold=(await c.query("SELECT 1 FROM public.f05_catalog_consultation_hold_test WHERE consultation_id=$1 AND active=true",[consultationId])).rows[0];
    if(hold){await c.query('ROLLBACK');return answer(409,'CONSULTATION_CUSTOMER_DISABLED_HOLD')}
    const payload=digest(JSON.stringify([customerId,consultationId,'CUSTOMER_WITHDRAWN']));
    const old=(await c.query('SELECT * FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[eventKey])).rows[0];
    if(old){
     await c.query('ROLLBACK');
     if(old.action!=='WITHDRAWN'||old.payload_sha256!==payload||String(old.customer_id)!==customerId||
       String(old.consultation_id)!==consultationId)return answer(409,'CONSULTATION_IDEMPOTENCY_COLLISION');
     return answer(200,'CONSULTATION_WITHDRAWAL_REPLAY',{consultationId,status:'resolved',closeReason:'CUSTOMER_WITHDRAWN',productionReady:false});
    }
    if(!['pending','processing'].includes(row.status)){await c.query('ROLLBACK');return answer(409,'CONSULTATION_NOT_OPEN')}
    const updated=(await c.query("UPDATE public.consultations SET status='resolved',close_reason='CUSTOMER_WITHDRAWN',"+
      "completed_at=statement_timestamp() WHERE consultation_id=$1 AND customer_id=$2 "+
      "AND status IN ('pending','processing') RETURNING consultation_id",[consultationId,customerId])).rows[0];
    if(!updated){await c.query('ROLLBACK');return answer(409,'CONSULTATION_NOT_OPEN')}
    await c.query("INSERT INTO public.f05_catalog_consultation_actions_test "+
      "(event_key,payload_sha256,customer_id,vehicle_id,listing_cycle_id,consultation_id,action) "+
      "VALUES($1,$2,$3,$4,$5,$6,'WITHDRAWN')",
      [eventKey,payload,customerId,vehicleId,String(row.listing_cycle_id),consultationId]);
    await c.query('COMMIT');
    return answer(200,'CONSULTATION_WITHDRAWN',{consultationId,status:'resolved',closeReason:'CUSTOMER_WITHDRAWN',productionReady:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 },async create({token,vehicleId,eventKey}){
  if(!validId(vehicleId)||!validEvent(eventKey))return answer(400,'CONSULTATION_INVALID_REQUEST');
  if(!validToken(token))return answer(401,'CONSULTATION_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const a=(await c.query("SELECT s.customer_id,c.account_status,c.current_owner_employee_id,c.owner_assignment_state "+
      "FROM public.f05_catalog_customer_sessions_test s JOIN public.customers c ON c.customer_id=s.customer_id "+
      "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
      "AND s.expires_at>statement_timestamp() AND s.revoked_at IS NULL FOR SHARE OF s,c",[digest(token)])).rows[0];
    if(!a||a.account_status!=='active'){await c.query('ROLLBACK');return answer(401,'CONSULTATION_IDENTITY_REQUIRED')}
    const customerId=String(a.customer_id);
    // Customer account restoration does not automatically release a held Consultation.
    // An active listing cycle with an open held Consultation cannot be touched/replayed.
    const held=(await c.query("SELECT 1 FROM public.consultations co "+
      "JOIN public.f05_catalog_consultation_hold_test h ON h.consultation_id=co.consultation_id AND h.active=true "+
      "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=co.listing_cycle_id "+
      "AND cy.vehicle_id=co.vehicle_id AND cy.ended_at IS NULL "+
      "WHERE co.customer_id=$1 AND co.vehicle_id=$2 AND co.status IN ('pending','processing') LIMIT 1",
      [customerId,vehicleId])).rows[0];
    if(held){await c.query('ROLLBACK');return answer(409,'CONSULTATION_CUSTOMER_DISABLED_HOLD')}
    // Same Customer+Vehicle serializes and the source idempotency key is global across Customers.
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_CONSULTATION_EVENT',eventKey]);
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[customerId,vehicleId]);
    if(a.owner_assignment_state!=='assigned'||!validId(String(a.current_owner_employee_id))){await c.query('ROLLBACK');return answer(409,'CONSULTATION_OWNER_NOT_READY')}
    const scope=(await c.query("SELECT p.assignee_employee_id FROM public.f05_catalog_consultation_actor_proof_test p "+
      "JOIN public.employees e ON e.employee_id=p.assignee_employee_id "+
      "JOIN public.roles r ON r.role_id=e.main_role_id "+
      "JOIN public.customer_phone_facts ph ON ph.customer_id=p.customer_id AND ph.ended_at IS NULL "+
      "WHERE p.customer_id=$1 AND p.assignee_employee_id=$2 "+
      "AND p.issuer='DISPOSABLE_TEST_ONLY' AND p.phone_consent_test=true AND p.worker_scope_test=true "+
      "AND p.expires_at>statement_timestamp() AND e.employment_status='active' "+
      "AND r.role_code IN ('sales','manager','store_head') LIMIT 1 FOR SHARE OF p,e,r,ph",
      [customerId,String(a.current_owner_employee_id)])).rows[0];
    if(!scope){await c.query('ROLLBACK');return answer(403,'CONSULTATION_PHONE_OR_ASSIGNEE_NOT_VERIFIED')}
    const cycle=(await c.query("SELECT cy.listing_cycle_id FROM public.vehicles v "+
      "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL "+
      "JOIN public.f05_real_catalog_visibility_test vis ON vis.vehicle_id=v.vehicle_id AND vis.listing_cycle_id=cy.listing_cycle_id AND vis.source_type=v.source_type "+
      "WHERE v.vehicle_id=$1 AND v.archived_at IS NULL AND v.platform_visibility='visible' "+
      "AND vis.allow_anonymous=true AND vis.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' "+
      "AND vis.expires_at>statement_timestamp() "+
      "AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR "+
      "(v.source_type IN ('mingbang','four_s') AND v.source_sale_status='available')) "+
      "AND NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test pr "+
      "WHERE pr.vehicle_id=v.vehicle_id AND pr.listing_cycle_id=cy.listing_cycle_id AND pr.ended_at IS NULL) "+
      "LIMIT 1 FOR SHARE OF v,cy,vis",[vehicleId])).rows[0];
    if(!cycle){await c.query('ROLLBACK');return answer(404,'CONSULTATION_VEHICLE_NOT_VISIBLE')}
    const cycleId=String(cycle.listing_cycle_id);
    // An old-cycle request key must never return or mutate a Consultation in a new cycle.
    const payload=digest(JSON.stringify([customerId,vehicleId,cycleId,'DIRECT_VEHICLE_DETAIL']));
    const prior=(await c.query('SELECT * FROM public.f05_catalog_consultation_actions_test WHERE event_key=$1',[eventKey])).rows[0];
    if(prior){
     await c.query('ROLLBACK');
     if(prior.payload_sha256!==payload||String(prior.customer_id)!==customerId||
       String(prior.vehicle_id)!==vehicleId||String(prior.listing_cycle_id)!==cycleId)
       return answer(409,'CONSULTATION_IDEMPOTENCY_COLLISION');
     return answer(200,'CONSULTATION_IDEMPOTENT_REPLAY',{consultationId:String(prior.consultation_id),created:prior.action==='CREATED',productionReady:false});
    }
    let current=(await c.query("SELECT consultation_id FROM public.consultations "+
      "WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 "+
      "AND status IN ('pending','processing') FOR UPDATE",[customerId,vehicleId,cycleId])).rows[0];
    const created=!current;
    if(!current){
     // Deadline is frozen to PDM-15 default 15 minutes. No real configured override in test.
     current=(await c.query("INSERT INTO public.consultations "+
      "(customer_id,vehicle_id,listing_cycle_id,assignee_employee_id,status,source_relation,first_response_deadline) "+
      "VALUES($1,$2,$3,$4,'pending',$5::jsonb,statement_timestamp()+interval '15 minutes') "+
      "RETURNING consultation_id",[customerId,vehicleId,cycleId,String(a.current_owner_employee_id),
      JSON.stringify({kind:'other',entry:'vehicle_detail',issuer:'DISPOSABLE_TEST_ONLY'})])).rows[0];
    }
    const id=String(current.consultation_id);
    await c.query("INSERT INTO public.f05_catalog_consultation_actions_test "+
      "(event_key,payload_sha256,customer_id,vehicle_id,listing_cycle_id,consultation_id,action) "+
      "VALUES($1,$2,$3,$4,$5,$6,$7)",[eventKey,payload,customerId,vehicleId,cycleId,id,created?'CREATED':'TOUCHED']);
    await c.query('COMMIT');
    return answer(200,created?'CONSULTATION_CREATED':'CONSULTATION_REUSED',{consultationId:id,created,productionReady:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }});
}
