// PDM-10/PDM-20 Customer-safe directory price projection.
// DISPOSABLE_TEST_ONLY; this read model never creates unlocks or charges quota.
import {createHash} from 'node:crypto';
const ID=/^[1-9][0-9]{0,18}$/;
const PG_BIGINT_MAX=9223372036854775807n;
const validId=v=>typeof v==='string'&&ID.test(v)&&BigInt(v)<=PG_BIGINT_MAX;
const bearer=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{43}$/.test(v);
const digest=v=>createHash('sha256').update(v).digest('hex');
const hidden=(state,visibleCurrent=true)=>({includePriceFields:true,price:null,priceCents:null,priceDisplay:null,priceState:state,visibleCurrent});
export function formatCustomerPriceCents(value){
 if(typeof value!=='string'||!/^[1-9][0-9]{0,13}$/.test(value)||BigInt(value)>=100000000000000n)return null;
 const cents=BigInt(value),whole=cents/1000000n;
 const fraction=(cents%1000000n).toString().padStart(6,'0').replace(/0+$/,'');
 return fraction?whole.toString()+'.'+fraction+'万':whole.toString()+'万';
}
export function createIsolatedCatalogCustomerReadService({pool,env=process.env}={}){
 if(!pool||typeof pool.connect!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('CATALOG_CUSTOMER_READ_FORMAL_ISSUER_REQUIRED');
 return Object.freeze({
  async projectRows({token,rows,view='list'}={}){
   if(!Array.isArray(rows)||!['list','detail'].includes(view))throw Error('CATALOG_CUSTOMER_READ_INPUT_INVALID');
   if(token===null||token===undefined)return {status:200,projections:rows.map(()=>null)};
   if(!bearer(token))return {status:401,body:{code:'CUSTOMER_IDENTITY_REQUIRED',productionReady:false}};
   const requested=rows.map(row=>{
    const vehicleId=String(row?.vehicleId??''),cycleId=String(row?.listingCycleId??''),source=String(row?.source??'');
    if(!validId(vehicleId)||!validId(cycleId)||!['wholesale','mingbang','four_s'].includes(source))throw Error('CATALOG_CUSTOMER_READ_ROW_INVALID');
    return {vehicleId,cycleId,source};
   });
   const db=await pool.connect();
   try{
    await db.query('BEGIN');
    try{
     const actor=(await db.query(
      "SELECT c.customer_id::text AS customer_id,c.customer_level_id::text AS level_id "+
      "FROM public.f05_catalog_customer_sessions_test s JOIN public.customers c ON c.customer_id=s.customer_id "+
      "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' AND s.revoked_at IS NULL "+
      "AND s.expires_at>statement_timestamp() AND c.account_status='active' FOR SHARE OF s,c",[digest(token)])).rows[0];
     if(!actor){await db.query('ROLLBACK');return {status:401,body:{code:'CUSTOMER_IDENTITY_REQUIRED',productionReady:false}}}
     const entitlement=(await db.query(
      "SELECT price_access_mode,daily_base_quota FROM public.f05_catalog_price_entitlement_test "+
      "WHERE level_id=$1 AND issuer='DISPOSABLE_TEST_ONLY' AND expires_at>statement_timestamp() FOR SHARE",
      [actor.level_id])).rows[0];
     if(!entitlement){
      await db.query('COMMIT');
      return {status:200,projections:rows.map(()=>hidden('PRICE_ENTITLEMENT_NOT_READY'))};
     }
     if(!requested.length){await db.query('COMMIT');return {status:200,projections:[]}}
     const current=(await db.query(
      "WITH requested AS (SELECT * FROM unnest($2::bigint[],$3::bigint[],$4::text[]) AS r(vehicle_id,listing_cycle_id,source_type)) "+
      "SELECT r.vehicle_id::text AS vehicle_id,r.listing_cycle_id::text AS listing_cycle_id,r.source_type, "+
      "pr.customer_display_cents::text AS price_cents, "+
      "EXISTS(SELECT 1 FROM public.customer_price_cycle_unlocks u WHERE u.customer_id=$1 AND u.vehicle_id=r.vehicle_id AND u.listing_cycle_id=r.listing_cycle_id) AS unlocked, "+
      "GREATEST(0,$5::integer+COALESCE(q.temp_additions,0)-COALESCE(q.consumed_count,0))::integer AS quota_remaining "+
      "FROM requested r JOIN public.vehicles v ON v.vehicle_id=r.vehicle_id AND v.source_type=r.source_type "+
      "AND v.archived_at IS NULL AND v.platform_visibility='visible' "+
      "AND ((v.source_type='wholesale' AND v.source_sale_status='active') OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) "+
      "JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id AND cy.listing_cycle_id=r.listing_cycle_id AND cy.ended_at IS NULL "+
      "AND NOT EXISTS(SELECT 1 FROM public.vehicle_listing_cycles other WHERE other.vehicle_id=v.vehicle_id AND other.listing_cycle_id<>cy.listing_cycle_id AND other.ended_at IS NULL) "+
      "JOIN public.f05_real_catalog_visibility_test vis ON vis.vehicle_id=v.vehicle_id AND vis.listing_cycle_id=cy.listing_cycle_id "+
      "AND vis.source_type=v.source_type AND vis.allow_anonymous=true AND vis.verified_isolation='DISPOSABLE_TEST_PROOF_NOT_SIGNED' AND vis.expires_at>statement_timestamp() "+
      "LEFT JOIN public.f05_catalog_price_display_proof_test pr ON pr.vehicle_id=v.vehicle_id AND pr.listing_cycle_id=cy.listing_cycle_id "+
      "AND pr.source_type=v.source_type AND pr.issuer='DISPOSABLE_TEST_ONLY' AND pr.expires_at>statement_timestamp() "+
      "LEFT JOIN public.customer_day_quota_ledger q ON q.customer_id=$1 AND q.business_day_shanghai=(statement_timestamp() AT TIME ZONE 'Asia/Shanghai')::date "+
      "WHERE NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test p WHERE p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=cy.listing_cycle_id AND p.ended_at IS NULL) "+
      "AND NOT EXISTS(SELECT 1 FROM public.f05_priority_safe_active_test priority WHERE priority.vehicle_id=v.vehicle_id AND priority.listing_cycle_id=cy.listing_cycle_id)",
      [actor.customer_id,requested.map(x=>x.vehicleId),requested.map(x=>x.cycleId),requested.map(x=>x.source),Number(entitlement.daily_base_quota)])).rows;
     const byKey=new Map(current.map(row=>[row.vehicle_id+':'+row.listing_cycle_id,row]));
     const projections=requested.map(item=>{
      const row=byKey.get(item.vehicleId+':'+item.cycleId);
      if(!row||row.source_type!==item.source)return hidden('PRICE_FACT_NOT_CURRENT',false);
      const priceCents=validPriceCents(row.price_cents)?String(row.price_cents):null;
      if(priceCents===null)return hidden('PRICE_CONSULTATION');
      const display=formatCustomerPriceCents(priceCents);
      if(display===null)return hidden('PRICE_CONSULTATION');
      const show=()=>({includePriceFields:true,price:display,priceCents,priceDisplay:display,priceState:'PRICE_DISPLAYABLE',visibleCurrent:true});
      if(entitlement.price_access_mode==='UNLIMITED')return show();
      if(entitlement.price_access_mode!=='LIMITED')return hidden('PRICE_ENTITLEMENT_NOT_READY');
      if(item.source!=='wholesale')return show();
      if(view==='list')return hidden('PRICE_HIDDEN_LIMITED_LIST');
      if(row.unlocked===true)return {...show(),priceState:'PRICE_UNLOCKED'};
      if(Number(row.quota_remaining)<=0)return {...hidden('DAILY_PRICE_QUOTA_EXHAUSTED'),priceDisplay:'--万'};
      return {...hidden('PRICE_DETAIL_ENTRY_REQUIRED'),priceDisplay:'——万'};
     });
     await db.query('COMMIT');
     return {status:200,projections};
    }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}
   }finally{db.release()}
  }
 });
}
function validPriceCents(value){
 return typeof value==='string'&&/^[1-9][0-9]{0,13}$/.test(value)&&BigInt(value)<100000000000000n;
}
