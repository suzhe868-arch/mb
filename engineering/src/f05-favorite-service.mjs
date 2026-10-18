// F05 real HTTP favorite vertical, disposable PostgreSQL16 only.
// DB-backed test session is NOT trusted WeChat/production Customer issuer.
import {createHash} from 'node:crypto';
const validId=s=>typeof s==='string'&&/^[1-9][0-9]{0,18}$/.test(s)&&BigInt(s)<=9223372036854775807n;
const validToken=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{43}$/.test(s);
const validEventKey=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{24,64}$/.test(s);
const hash=s=>createHash('sha256').update(s).digest('hex');
const response=(status,code,additional={})=>({status,body:{code,...additional}});
const hidden=()=>response(401,'FAVORITE_TEST_CUSTOMER_IDENTITY_REQUIRED');
function assertIsolation(env){
 if(env.APP_ENV!=='test'||env.NODE_ENV!=='test'||env.API_HOST!=='127.0.0.1'||
 env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
 throw Error('F05_FAVORITE_TEST_ISOLATION_REQUIRED');
}
export function createIsolatedFavoriteService({pool,env=process.env}={}){
 assertIsolation(env);
 if(!pool||typeof pool.connect!=='function')throw Error('F05_FAVORITE_PG16_POOL_REQUIRED');
 async function identify(c,token){
  if(!validToken(token))return null;
  const q="SELECT s.customer_id,c.account_status FROM public.f05_catalog_customer_sessions_test s "+
    "JOIN public.customers c ON c.customer_id=s.customer_id "+
    "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
    "AND s.expires_at>statement_timestamp() AND s.revoked_at IS NULL FOR SHARE OF s,c";
  const row=(await c.query(q,[hash(token)])).rows[0];
  if(!row||row.account_status!=='active'||!validId(String(row.customer_id)))return null;
  return String(row.customer_id);
 }
 async function inTransaction(action,token,vehicleId,eventKey){
  if(!validId(vehicleId))return response(400,'INVALID_VEHICLE_ID');
  if(action!=='READ'&&!validEventKey(eventKey))return response(400,'INVALID_IDEMPOTENCY_KEY');
  const c=await pool.connect();
  try{
   await c.query('BEGIN');
   try{
    const customerId=await identify(c,token);
    if(!customerId){await c.query('ROLLBACK');return hidden()}
    // All operations on the same Customer+Vehicle linearize across independent HTTP processes.
    await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[customerId,vehicleId]);
    const exists=(await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId])).rows[0];
    if(!exists){await c.query('ROLLBACK');return response(404,'VEHICLE_NOT_FOUND')}
    if(action==='READ'){
     const current=(await c.query('SELECT current_state,state_version FROM public.f05_catalog_favorite_states_test WHERE customer_id=$1 AND vehicle_id=$2',[customerId,vehicleId])).rows[0];
     await c.query('COMMIT');
     return response(200,'FAVORITE_STATE',{active:current?.current_state==='active',version:current?String(current.state_version):null,productionReady:false});
    }
    const payloadHash=hash(JSON.stringify([customerId,vehicleId,action]));
    const previous=(await c.query('SELECT * FROM public.f05_catalog_favorite_events_test WHERE event_key=$1',[eventKey])).rows[0];
    if(previous){
     await c.query('ROLLBACK');
     if(previous.payload_sha256!==payloadHash||String(previous.customer_id)!==customerId||String(previous.vehicle_id)!==vehicleId||previous.action!==action)
       return response(409,'FAVORITE_IDEMPOTENCY_COLLISION');
     return response(200,'FAVORITE_IDEMPOTENT_REPLAY',{active:previous.after_state==='active',version:String(previous.state_version),productionReady:false});
    }
    const current=(await c.query('SELECT current_state,state_version FROM public.f05_catalog_favorite_states_test WHERE customer_id=$1 AND vehicle_id=$2 FOR UPDATE',[customerId,vehicleId])).rows[0];
    if(action==='ADD'){
     // A new favorite requires current safe public state; no caller-provided scope or fake source issuer.
     const allowed=(await c.query("SELECT 1 FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id "+
       "JOIN public.f05_real_catalog_visibility_test p ON p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=cy.listing_cycle_id AND p.source_type=v.source_type "+
       "WHERE v.vehicle_id=$1 AND v.archived_at IS NULL AND v.platform_visibility='visible' "+
       "AND cy.ended_at IS NULL AND p.allow_anonymous=true AND p.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' "+
       "AND p.expires_at>statement_timestamp() "+
       "AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR "+
       "(v.source_type IN ('mingbang','four_s') AND v.source_sale_status='available')) "+
       "AND NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test q "+
       "WHERE q.vehicle_id=v.vehicle_id AND q.listing_cycle_id=cy.listing_cycle_id AND q.ended_at IS NULL) LIMIT 1",[vehicleId])).rows[0];
     if(!allowed){await c.query('ROLLBACK');return response(404,'VEHICLE_NOT_VISIBLE')}
    }
    if(action==='REMOVE'&&!current){await c.query('ROLLBACK');return response(404,'FAVORITE_NOT_FOUND')}
    const next=action==='ADD'?'active':'removed';
    const outcome=current?.current_state===next?'NOOP':'APPLIED';
    let version;
    if(!current){
     const inserted=(await c.query("INSERT INTO public.f05_catalog_favorite_states_test(customer_id,vehicle_id,current_state) "+
       "VALUES($1,$2,'active') RETURNING state_version",[customerId,vehicleId])).rows[0];
     version=String(inserted.state_version);
    }else if(outcome==='APPLIED'){
     const updated=(await c.query('UPDATE public.f05_catalog_favorite_states_test SET current_state=$3,'+
       'state_version=state_version+1,changed_at=statement_timestamp() WHERE customer_id=$1 AND vehicle_id=$2 RETURNING state_version',
       [customerId,vehicleId,next])).rows[0];
     version=String(updated.state_version);
    }else version=String(current.state_version);
    await c.query("INSERT INTO public.f05_catalog_favorite_events_test(customer_id,vehicle_id,event_key,payload_sha256,action,outcome,after_state,state_version) "+
      "VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[customerId,vehicleId,eventKey,payloadHash,action,outcome,next,version]);
    await c.query('COMMIT');
    return response(200,outcome==='APPLIED'?'FAVORITE_APPLIED':'FAVORITE_NOOP',{active:next==='active',version,productionReady:false});
   }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
  }finally{c.release()}
 }
 return Object.freeze({
  read:({token,vehicleId})=>inTransaction('READ',token,vehicleId),
  change:({token,vehicleId,eventKey,action})=>inTransaction(action,token,vehicleId,eventKey)
 });
}
