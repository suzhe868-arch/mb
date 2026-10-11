// F05-4 isolated synthetic Customer-only entitlements. NO production Customer issuer.
import {connect,verify} from './migration.mjs';
const objects=new WeakSet();
const out=(code,extra={})=>({code,...extra});
const valid=x=>Number.isSafeInteger(x)&&x>0&&x<=2147483647;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(x);
function isolated(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_4_SYNTHETIC_CONTEXT_NOT_ALLOWED_'+k);
}
export function syntheticCustomerContext(customerId,entry){
 isolated();
 if(!valid(customerId)||!['DETAIL','LIST','PREFETCH','CACHE','BACKGROUND'].includes(entry))
  throw Error('F05_4_INVALID_SYNTHETIC_CONTEXT');
 const context=Object.freeze({customerId,entry,actor:'SYNTHETIC_CI_CUSTOMER_ONLY'});
 objects.add(context);return context;
}
const businessDay=at=>{
 const now=new Date(at);
 if(!Number.isFinite(now.getTime())||typeof at!=='string'||!(/Z$|[+-][0-9]{2}:[0-9]{2}$/.test(at)))
  throw Error('F05_4_INVALID_CI_CLOCK');
 return new Date(now.getTime()+8*60*60*1000).toISOString().slice(0,10);
};
function request(p){
 if(!p||Object.keys(p).sort().join(',')!=='idempotencyKey,listingCycleId,nowIso,vehicleId'||
    !valid(p.vehicleId)||!valid(p.listingCycleId)||!key(p.idempotencyKey))
  return false;
 return true;
}
export async function syntheticCustomerPrice(pool,context,p){
 isolated();if(!objects.has(context))return out('CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP');
 if(!request(p))return out('F05_4_INVALID_PRICE_REQUEST');
 const day=businessDay(p.nowIso),c=await connect();
 try{
  await c.query('BEGIN');
  // Serialize all price, status, quota and privilege decisions by the same current
  // Customer row. Two distinct PostgreSQL backend connections compete on this lock.
  const customer=(await c.query('SELECT customer_id,account_status,customer_level_id FROM public.customers WHERE customer_id=$1 FOR UPDATE',
   [context.customerId])).rows[0];
  if(!customer||customer.account_status!=='active'){await c.query('ROLLBACK');return out('F05_4_CUSTOMER_INACTIVE_OR_UNKNOWN');}
  await verify(c);
  const policy=(await c.query("SELECT price_mode,daily_base_quota FROM public.f05_4_level_price_policy_ci WHERE level_id=$1 AND source_marker='SYNTHETIC_CI_POLICY_ONLY'",
   [customer.customer_level_id])).rows[0];
  if(!policy){await c.query('ROLLBACK');return out('F05_4_SIGNED_LEVEL_PRICE_POLICY_SOURCE_GAP');}
  const vehicle=(await c.query('SELECT v.source_type,v.source_sale_status,v.archived_at,cy.ended_at FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id WHERE v.vehicle_id=$1 AND cy.listing_cycle_id=$2',
   [p.vehicleId,p.listingCycleId])).rows[0];
  if(!vehicle||vehicle.ended_at!==null||vehicle.archived_at!==null||vehicle.source_sale_status!=='active'||vehicle.source_type!=='wholesale'){
   await c.query('ROLLBACK');return out('F05_4_CURRENT_WHOLESALE_CYCLE_NOT_PROVEN');
  }
  const fact=(await c.query("SELECT customer_display_cents FROM public.f05_4_current_price_ci WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND source_marker='SYNTHETIC_CI_CUSTOMER_DISPLAY_ONLY'",
   [p.vehicleId,p.listingCycleId])).rows[0];
  if(!fact||fact.customer_display_cents===null){await c.query('COMMIT');return out('PRICE_CONSULTATION');}
  const cents=Number(fact.customer_display_cents);
  if(!Number.isSafeInteger(cents)||cents<=0)throw Error('F05_4_UNTRUSTED_SYNTHETIC_DIGITAL_PRICE');
  if(policy.price_mode==='UNLIMITED'){
   await c.query('COMMIT');return out('DIGITAL_PRICE',{customerDisplayCents:cents,source:'SYNTHETIC_CI_ONLY',charged:false,mode:'UNLIMITED'});
  }
  if(policy.price_mode!=='LIMITED')throw Error('F05_4_UNKNOWN_PRICE_MODE');
  if(context.entry==='LIST'){await c.query('COMMIT');return out('LIMITED_LIST_PRICE_HIDDEN');}
  if(context.entry!=='DETAIL'){await c.query('COMMIT');return out('F05_4_NON_INTERACTIVE_DETAIL_NO_UNLOCK');}
  // A given caller request cannot be reused for another triple.
  const priorEvent=(await c.query('SELECT customer_id,vehicle_id,listing_cycle_id FROM public.customer_price_unlock_events WHERE idempotency_key=$1',[p.idempotencyKey])).rows[0];
  if(priorEvent&&(Number(priorEvent.customer_id)!==context.customerId||Number(priorEvent.vehicle_id)!==p.vehicleId||Number(priorEvent.listing_cycle_id)!==p.listingCycleId)){
   await c.query('ROLLBACK');return out('F05_4_IDEMPOTENCY_KEY_COLLISION');
  }
  const existing=(await c.query('SELECT unlock_id,grant_origin,source_recommendation_id FROM public.customer_price_cycle_unlocks WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3',
   [context.customerId,p.vehicleId,p.listingCycleId])).rows[0];
  if(existing){
   if(existing.source_recommendation_id!==null){
    // The frozen physical FK proves object identity, not the original Recommendation issuer.
    // Fail closed until issuer is signed; never trust request.isFree or source recommendation ID.
    await c.query('ROLLBACK');return out('F05_4_RECOMMENDATION_GRANT_ISSUER_SOURCE_GAP');
   }
   if(existing.grant_origin!=='f05-4-ci-limited-detail'){
    await c.query('ROLLBACK');return out('F05_4_HISTORICAL_UNLOCK_ISSUER_SOURCE_GAP');
   }
   const charged=(await c.query("SELECT 1 FROM public.customer_price_unlock_events WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 AND event_kind='successful_limited_charge'",
    [context.customerId,p.vehicleId,p.listingCycleId])).rowCount===1;
   if(!charged)throw Error('F05_4_UNPAIRED_CI_UNLOCK');
   await c.query('COMMIT');return out('DIGITAL_PRICE',{customerDisplayCents:cents,source:'SYNTHETIC_CI_ONLY',charged:false,mode:'LIMITED'});
  }
  await c.query('INSERT INTO public.customer_day_quota_ledger(customer_id,business_day_shanghai,base_quota,temp_additions,consumed_count,updated_at) VALUES($1,$2,$3,0,0,now()) ON CONFLICT(customer_id,business_day_shanghai) DO NOTHING',
   [context.customerId,day,policy.daily_base_quota]);
  await c.query('UPDATE public.customer_day_quota_ledger SET base_quota=$3,updated_at=now() WHERE customer_id=$1 AND business_day_shanghai=$2',
   [context.customerId,day,policy.daily_base_quota]);
  const ledger=(await c.query('SELECT base_quota,temp_additions,consumed_count FROM public.customer_day_quota_ledger WHERE customer_id=$1 AND business_day_shanghai=$2 FOR UPDATE',
   [context.customerId,day])).rows[0];
  if(ledger.base_quota+ledger.temp_additions<=ledger.consumed_count){
   await c.query('COMMIT');return out('DAILY_PRICE_QUOTA_EXHAUSTED',{display:'--万'});
  }
  // Exactly one successful LIMITED event and one cycle unlock in a single atomic tx.
  await c.query("INSERT INTO public.customer_price_cycle_unlocks(customer_id,vehicle_id,listing_cycle_id,grant_origin) VALUES($1,$2,$3,'f05-4-ci-limited-detail')",
   [context.customerId,p.vehicleId,p.listingCycleId]);
  await c.query("INSERT INTO public.customer_price_unlock_events(idempotency_key,customer_id,vehicle_id,listing_cycle_id,business_day_shanghai,event_kind) VALUES($1,$2,$3,$4,$5,'successful_limited_charge')",
   [p.idempotencyKey,context.customerId,p.vehicleId,p.listingCycleId,day]);
  const increment=await c.query('UPDATE public.customer_day_quota_ledger SET consumed_count=consumed_count+1,updated_at=now() WHERE customer_id=$1 AND business_day_shanghai=$2 AND consumed_count<base_quota+temp_additions',
   [context.customerId,day]);
  if(increment.rowCount!==1)throw Error('F05_4_ATOMIC_DAILY_QUOTA_EXHAUSTION');
  await c.query('COMMIT');return out('DIGITAL_PRICE',{customerDisplayCents:cents,source:'SYNTHETIC_CI_ONLY',charged:true,mode:'LIMITED'});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}
}
export async function employeeTemporaryAddAttempt(_auth,_employeeToken,_payload){
 // No accepted F03 current Customer scope+permission issuer chain for price additions.
 // Producing a success here would be a security bypass.
 isolated();return out('F05_4_EMPLOYEE_QUOTA_ADDITION_CURRENT_SCOPE_SOURCE_GAP');
}
export function noRealCustomerSessionHttp(){
 return (_req,res)=>{res.writeHead(403,{'content-type':'application/json','cache-control':'private, no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify({code:'CUSTOMER_WECHAT_SESSION_TO_FAVORITE_ACTOR_SOURCE_GAP'}));};
}
