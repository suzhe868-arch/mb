// PDM-10: real F02 frozen customer-day ledger, per-cycle unlock and limited charge.
// Current entitlement & customer display price are DISPOSABLE_TEST_ONLY, NEVER formal issuer.
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const pgId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const bearer=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(x);
const result=(status,code,rest={})=>({status,body:{code,...rest,productionReady:false}});
export function createIsolatedPriceUnlockService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
 env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('PRICE_UNLOCK_FORMAL_ISSUER_NOT_READY');
 return Object.freeze({async openDetail({token,vehicleId,eventKey}){
  if(!pgId(vehicleId)||!key(eventKey))return result(400,'INVALID_CUSTOMER_DETAIL_REQUEST');
  if(!bearer(token))return result(401,'CUSTOMER_IDENTITY_REQUIRED');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const actor=(await c.query(
     "SELECT c.customer_id,c.account_status,c.customer_level_id FROM public.f05_catalog_customer_sessions_test s "+
     "JOIN public.customers c ON c.customer_id=s.customer_id "+
     "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
     "AND s.expires_at>statement_timestamp() FOR SHARE OF s,c",[hash(token)])).rows[0];
    if(!actor||actor.account_status!=='active'){await c.query('ROLLBACK');return result(401,'CUSTOMER_IDENTITY_REQUIRED')}
    const customerId=String(actor.customer_id);
    // Global operation key first, then Customer's serial quota writer, independent of vehicle.
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_PRICE_KEY',eventKey]);
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',['F05_PRICE_CUSTOMER',customerId]);
    const scope=(await c.query(
      "SELECT v.source_type,cy.listing_cycle_id,pr.customer_display_cents,pe.price_access_mode,pe.daily_base_quota "+
      "FROM public.vehicles v "+
      "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL "+
      "JOIN public.f05_real_catalog_visibility_test vis ON vis.vehicle_id=v.vehicle_id AND vis.listing_cycle_id=cy.listing_cycle_id "+
      "AND vis.source_type=v.source_type AND vis.allow_anonymous=true "+
      "AND vis.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' AND vis.expires_at>statement_timestamp() "+
      "JOIN public.f05_catalog_price_entitlement_test pe ON pe.level_id=$2 AND pe.issuer='DISPOSABLE_TEST_ONLY' AND pe.expires_at>statement_timestamp() "+
      "JOIN public.f05_catalog_price_display_proof_test pr ON pr.vehicle_id=v.vehicle_id "+
      "AND pr.listing_cycle_id=cy.listing_cycle_id AND pr.source_type=v.source_type "+
      "AND pr.issuer='DISPOSABLE_TEST_ONLY' AND pr.expires_at>statement_timestamp() "+
      "WHERE v.vehicle_id=$1 AND v.archived_at IS NULL "+
      "AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR "+
      "(v.source_type IN ('mingbang','four_s') AND v.source_sale_status='available')) "+
      "AND ((v.platform_visibility='visible' AND NOT EXISTS "+
      "(SELECT 1 FROM public.f05_priority_safe_active_test priority "+
      "WHERE priority.vehicle_id=v.vehicle_id AND priority.listing_cycle_id=cy.listing_cycle_id) "+
      "AND NOT EXISTS (SELECT 1 FROM public.f05_real_catalog_protections_test p "+
      "WHERE p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=cy.listing_cycle_id AND p.ended_at IS NULL)) "+
      "OR EXISTS (SELECT 1 FROM public.f05_recommendation_safe_customer_test recommendation "+
      "WHERE recommendation.customer_id=$3 AND recommendation.vehicle_id=v.vehicle_id "+
      "AND recommendation.listing_cycle_id=cy.listing_cycle_id)) "+
      "LIMIT 1 FOR SHARE OF v,cy,vis,pe",[vehicleId,String(actor.customer_level_id),customerId])).rows[0];
    if(!scope){await c.query('ROLLBACK');return result(404,'CUSTOMER_VEHICLE_OR_PRICE_ENTITLEMENT_NOT_READY')}
    const cycleId=String(scope.listing_cycle_id);
    const prior=(await c.query("SELECT customer_id,vehicle_id,listing_cycle_id,event_kind "+
      "FROM public.customer_price_unlock_events WHERE idempotency_key=$1",[eventKey])).rows[0];
    if(prior&&(String(prior.customer_id)!==customerId||String(prior.vehicle_id)!==vehicleId||
      String(prior.listing_cycle_id)!==cycleId||prior.event_kind!=='successful_limited_charge')){
     await c.query('ROLLBACK');return result(409,'PRICE_IDEMPOTENCY_COLLISION');
    }
    const price=scope.customer_display_cents===null?null:String(scope.customer_display_cents);
    // No legal digital customer display price: no unlock, no quota, no internal fallback.
    if(price===null){await c.query('COMMIT');return result(200,'PRICE_CONSULTATION',{priceCents:null,charged:false})}
    // Artificial sources are never transmitted: only explicit test customer display price.
    if(!/^[1-9][0-9]{0,13}$/.test(price)){throw Error('INVALID_CUSTOMER_DISPLAY_PRICE')}
    if(scope.source_type!=='wholesale'){
      await c.query('COMMIT');
      return result(200,'CUSTOMER_DISPLAY_PRICE',{priceCents:price,charged:false,quotaRemaining:null});
    }
    if(scope.price_access_mode==='UNLIMITED'){
     await c.query('COMMIT');
     return result(200,'UNLIMITED_DISPLAY_PRICE',{priceCents:price,charged:false,quotaRemaining:null});
    }
    if(scope.price_access_mode!=='LIMITED')throw Error('UNKNOWN_PRICE_ENTITLEMENT');
    const existing=(await c.query(
     "SELECT grant_origin FROM public.customer_price_cycle_unlocks "+
     "WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3",
     [customerId,vehicleId,cycleId])).rows[0];
    if(existing){
     await c.query('COMMIT');
     return result(200,'PRICE_ALREADY_UNLOCKED',{priceCents:price,charged:false,quotaRemaining:null});
    }
    const quota=(await c.query(
      "INSERT INTO public.customer_day_quota_ledger "+
      "(customer_id,business_day_shanghai,base_quota,temp_additions,consumed_count,updated_at) "+
      "VALUES($1,(statement_timestamp() AT TIME ZONE 'Asia/Shanghai')::date,$2,0,0,statement_timestamp()) "+
      "ON CONFLICT (customer_id,business_day_shanghai) DO UPDATE "+
      "SET base_quota=excluded.base_quota,updated_at=statement_timestamp() "+
      "RETURNING base_quota,temp_additions,consumed_count,business_day_shanghai",
      [customerId,Number(scope.daily_base_quota)])).rows[0];
    const remaining=Number(quota.base_quota)+Number(quota.temp_additions)-Number(quota.consumed_count);
    if(remaining<=0){
     await c.query('COMMIT');
     return result(200,'DAILY_PRICE_QUOTA_EXHAUSTED',{priceCents:null,priceDisplay:'--万',charged:false,quotaRemaining:0});
    }
    // Frozen ledger + frozen cycle right + frozen successful charge event: all one PG16 transaction.
    await c.query("INSERT INTO public.customer_price_cycle_unlocks "+
     "(unlock_id,customer_id,vehicle_id,listing_cycle_id,grant_origin,granted_at) "+
     "VALUES(nextval('public.f05_catalog_price_unlock_id_seq'),$1,$2,$3,'limited_quota',statement_timestamp())",
     [customerId,vehicleId,cycleId]);
    await c.query("INSERT INTO public.customer_price_unlock_events "+
     "(unlock_event_id,idempotency_key,customer_id,vehicle_id,listing_cycle_id,business_day_shanghai,event_kind,occurred_at) "+
     "VALUES(nextval('public.f05_catalog_price_event_id_seq'),$1,$2,$3,$4,$5,'successful_limited_charge',statement_timestamp())",
     [eventKey,customerId,vehicleId,cycleId,quota.business_day_shanghai]);
    await c.query("UPDATE public.customer_day_quota_ledger SET consumed_count=consumed_count+1,updated_at=statement_timestamp() "+
     "WHERE customer_id=$1 AND business_day_shanghai=$2",[customerId,quota.business_day_shanghai]);
    await c.query('COMMIT');
    return result(200,'PRICE_UNLOCKED',{priceCents:price,charged:true,quotaRemaining:remaining-1});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }});
}
