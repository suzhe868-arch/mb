// Internal synthetic Customer-origin only in disposable GitHub PostgreSQL16 CI.
// Not an HTTP endpoint; never infer a real WeChat Customer from Employee or DTO.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
export const ACTOR='SYNTHETIC_CUSTOMER_CONTEXT_CI_ONLY';
const positive=n=>Number.isSafeInteger(n)&&n>0&&n<=2147483647;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(x);
const denied=code=>({allowed:false,code});
function isolation(){
 if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true'||
    process.env.APP_ENV!=='test'||process.env.NODE_ENV!=='test'||
    process.env.F05_2_ISOLATION_CONFIRM!=='I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'||
    process.env.GITHUB_REPOSITORY!=='suzhe868-arch/mb')
  throw Error('F05_3G_NOT_SYNTHETIC_DISPOSABLE_GITHUB_CI');
}
export async function syntheticFavoriteChange(db,{customerId,vehicleId,action,eventKey},{checkpoint,injectRollback=false}={}){
 isolation();
 if(!positive(customerId)||!positive(vehicleId)||!['ADD','REMOVE'].includes(action)||!key(eventKey))
  return denied('F05_3G_INVALID_FIELDS');
 if(checkpoint!==undefined&&typeof checkpoint!=='function')throw Error('F05_3G_INVALID_CHECKPOINT');
 const digest=createHash('sha256').update(JSON.stringify([customerId,vehicleId,action])).digest('hex');
 // Verify outside transactional connection: the sealed v19 schema, never old v18
 // verifier after the additive migration.
 await verify(db);
 const c=await db.connect();
 try{
  await c.query('BEGIN');
  // Same Customer+Vehicle operations linearize; different actors cannot reuse an eventKey.
  await c.query('SELECT pg_advisory_xact_lock(20261012,hashtext($1))',[customerId+':'+vehicleId]);
  const user=(await c.query('SELECT customer_id,account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[customerId])).rows[0];
  if(!user||user.account_status!=='active'){await c.query('ROLLBACK');return denied('F05_3G_CUSTOMER_NOT_ACTIVE')}
  const vehicle=(await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR SHARE',[vehicleId])).rows[0];
  if(!vehicle){await c.query('ROLLBACK');return denied('F05_3G_NO_VEHICLE')}
  const recorded=(await c.query('SELECT * FROM public.f05_3g_favorite_events WHERE event_key=$1',[eventKey])).rows[0];
  if(recorded){
   await c.query('ROLLBACK');
   if(recorded.payload_sha256!==digest||Number(recorded.customer_id)!==customerId||Number(recorded.vehicle_id)!==vehicleId||recorded.action!==action)
    return denied('F05_3G_EVENT_KEY_PAYLOAD_COLLISION');
   return {allowed:true,code:'F05_3G_IDEMPOTENT',eventId:Number(recorded.event_id),
    state:recorded.after_state,outcome:recorded.outcome};
  }
  let current=(await c.query(
   'SELECT * FROM public.f05_3g_customer_favorites WHERE customer_id=$1 AND vehicle_id=$2 FOR UPDATE',
   [customerId,vehicleId])).rows[0];
  if(!current&&action==='REMOVE'){await c.query('ROLLBACK');return denied('F05_3G_NOT_YET_FAVORITED')}
  const before=current?.current_state||'absent';
  const next=action==='ADD'?'active':'removed';
  const outcome=before===next?'NOOP':'APPLIED';
  if(!current){
   current=(await c.query(
    "INSERT INTO public.f05_3g_customer_favorites(customer_id,vehicle_id,current_state) VALUES($1,$2,'active') RETURNING *",
    [customerId,vehicleId])).rows[0];
  }else if(outcome==='APPLIED'){
   current=(await c.query(
    'UPDATE public.f05_3g_customer_favorites SET current_state=$3,state_version=state_version+1,changed_at=GREATEST(clock_timestamp(),changed_at) '+
    'WHERE customer_id=$1 AND vehicle_id=$2 RETURNING *',
    [customerId,vehicleId,next])).rows[0];
  }
  if(checkpoint)await checkpoint('favorite_current_row_held',c);
  if(injectRollback)throw Error('F05_3G_INJECTED_BUSINESS_ROLLBACK');
  const audit=(await c.query(
   "INSERT INTO public.f05_3g_favorite_events(favorite_id,customer_id,vehicle_id,event_key,payload_sha256,action,outcome,before_state,after_state,actor_kind,actor_context,transaction_id) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,txid_current()) RETURNING event_id",
   [current.favorite_id,customerId,vehicleId,eventKey,digest,action,outcome,before,next,ACTOR,
    JSON.stringify({purpose:'isolated_pg16_business_semantics_only',source:'F05-3G_CI_SYNTHETIC_CUSTOMER'})])).rows[0];
  await c.query('COMMIT');
  return {allowed:true,code:outcome==='APPLIED'?'F05_3G_APPLIED':'F05_3G_NOOP',
   state:next,outcome,eventId:Number(audit.event_id),favoriteId:Number(current.favorite_id)};
 }catch(e){
  await c.query('ROLLBACK').catch(()=>{});
  if(e?.code==='23505')return denied('F05_3G_EVENT_KEY_COLLISION');
  throw e;
 }finally{c.release()}
}
