import type { Queryable } from "../../core/db-types.js";
import { decideCustomerVisibility, decideStaffPriorityVisibility } from "./visibility.js";
import { idString, intValue, iso, optionalIso } from "../../core/db-types.js";
import type {
  VehicleCardCustomerDTO, VehicleCustomerDetailDTO, StaffVehicleSafeDTO, StaffVehicleInternalDTO,
  AdminVehicleDTO, VehicleStatusDTO, ListingCycleDTO, SupplyAnomalyDTO, PriceDisplayDTO,
  VehicleConditionDTO, CustomerVisibleDocumentDTO
} from "@mingbang/contracts/types";

export interface VehicleImageUrlResolver {
  resolve(input:{sourceType:string; upstreamUrl?:string; localObjectKey?:string}): string | undefined;
}
export interface VehicleInternalFieldAccess { internalPrice:boolean; upstreamPhone:boolean; }

type BaseRow=Record<string,any>;

async function getBaseRow(db:Queryable,vehicleId:string):Promise<BaseRow|null>{
  const {rows}=await db.query({
    text:`SELECT v.*,w.car_code,w.upstream_list_price_cents,w.upstream_wholesale_price_cents,w.base_wholesale_price_cents,
                 w.upstream_publisher_id,w.first_seen_at,w.upstream_name,
                 lc.listing_cycle_id,lc.cycle_no,lc.started_at AS listing_started_at,lc.ended_at AS listing_ended_at,lc.start_reason,lc.end_reason,
                 o.amount_cents AS override_cents,pr.markup_cents,
                 ppc.current_phone AS cached_upstream_phone
          FROM vehicles v
          LEFT JOIN wholesale_vehicle_source w ON w.vehicle_id=v.vehicle_id
          LEFT JOIN LATERAL (SELECT * FROM vehicle_listing_cycles x WHERE x.vehicle_id=v.vehicle_id ORDER BY x.cycle_no DESC LIMIT 1) lc ON true
          LEFT JOIN LATERAL (SELECT amount_cents FROM vehicle_price_overrides x WHERE x.vehicle_id=v.vehicle_id AND x.starts_at<=now() AND x.revoked_at IS NULL ORDER BY x.starts_at DESC LIMIT 1) o ON true
          LEFT JOIN LATERAL (
            SELECT r.markup_cents FROM pricing_ladder_sets s JOIN pricing_ladder_rules r ON r.pricing_set_id=s.pricing_set_id
            WHERE s.status='active' AND w.base_wholesale_price_cents IS NOT NULL
              AND w.base_wholesale_price_cents>=r.lower_bound_cents AND w.base_wholesale_price_cents<r.upper_bound_cents
            ORDER BY s.activated_at DESC NULLS LAST,r.sort_order LIMIT 1
          ) pr ON true
          LEFT JOIN publisher_phone_cache ppc ON ppc.source_platform=w.source_platform AND ppc.publisher_id=w.upstream_publisher_id
          WHERE v.vehicle_id=$1`,values:[vehicleId]
  }); return rows[0]??null;
}
function price(row:BaseRow):PriceDisplayDTO{
  let amount:number|undefined;
  if(row.source_type==='wholesale'){
    if(row.override_cents!=null) amount=intValue(row.override_cents);
    else if(row.base_wholesale_price_cents!=null && row.markup_cents!=null) amount=intValue(row.base_wholesale_price_cents)+intValue(row.markup_cents);
  } else if(row.customer_list_price_cents!=null) amount=intValue(row.customer_list_price_cents);
  if(row.biz_status==='locked') return {display_type:'locked',...(amount!=null?{amount_cents:amount}:{})};
  return amount!=null?{display_type:'amount',amount_cents:amount}:{display_type:'consultation'};
}
function status(row:BaseRow):VehicleStatusDTO{return {source_status:row.source_status,platform_visibility:row.platform_visibility,biz_status:row.biz_status};}
function cycle(row:BaseRow):ListingCycleDTO|undefined{
  if(row.listing_cycle_id==null) return undefined;
  return {id:idString(row.listing_cycle_id),vehicle_id:idString(row.vehicle_id),cycle_no:intValue(row.cycle_no),started_at:iso(row.listing_started_at),start_reason:String(row.start_reason),...(optionalIso(row.listing_ended_at)?{ended_at:optionalIso(row.listing_ended_at)!}:{}),...(row.end_reason?{end_reason:String(row.end_reason)}:{})};
}
async function firstImage(db:Queryable,row:BaseRow,resolver:VehicleImageUrlResolver):Promise<string|undefined>{
 const {rows}=await db.query({text:`SELECT upstream_url,local_object_key FROM vehicle_images WHERE vehicle_id=$1 ORDER BY sort_order,image_id LIMIT 1`,values:[row.vehicle_id]});
 const x=rows[0]; if(!x)return undefined; return resolver.resolve({sourceType:row.source_type,...(x.upstream_url?{upstreamUrl:String(x.upstream_url)}:{}),...(x.local_object_key?{localObjectKey:String(x.local_object_key)}:{})});
}
async function card(db:Queryable,row:BaseRow,resolver:VehicleImageUrlResolver):Promise<VehicleCardCustomerDTO>{
 const imageUrl=await firstImage(db,row,resolver);
 const matchStatus = row.model_match_status === 'matched' || row.model_match_status === 'conflict' ? row.model_match_status : 'pending';
 const snapshot = row.vehicle_name_snapshot ? String(row.vehicle_name_snapshot) : row.upstream_name ? String(row.upstream_name) : [row.brand,row.series,row.model_config].filter((x:any)=>x!=null&&String(x).trim()).map(String).join(' ') || null;
 return {id:idString(row.vehicle_id),source_type:row.source_type,model_match_status:matchStatus,vehicle_model_id:row.vehicle_model_id==null?null:intValue(row.vehicle_model_id),vehicle_name_snapshot:snapshot,plate_date:row.plate_date?String(row.plate_date).slice(0,10):null,exterior_color:row.exterior_color==null?null:String(row.exterior_color),interior_color:row.interior_color==null?null:String(row.interior_color),brand:row.brand==null?null:String(row.brand),series:row.series==null?null:String(row.series),model_config:row.model_config==null?null:String(row.model_config),model_year:row.model_year==null?null:intValue(row.model_year),mileage_km:row.mileage_km==null?null:intValue(row.mileage_km),city:row.city==null?null:String(row.city),price:price(row),...(row.updated_at?{updated_at:iso(row.updated_at)}:{}),...(imageUrl?{image_url:imageUrl}:{}),...(row.condition_summary?{condition_summary:String(row.condition_summary)}:{})};
}
async function images(db:Queryable,row:BaseRow,resolver:VehicleImageUrlResolver):Promise<string[]>{
 const {rows}=await db.query({text:`SELECT upstream_url,local_object_key FROM vehicle_images WHERE vehicle_id=$1 ORDER BY sort_order,image_id`,values:[row.vehicle_id]});
 return rows.map((x:any)=>resolver.resolve({sourceType:row.source_type,...(x.upstream_url?{upstreamUrl:String(x.upstream_url)}:{}),...(x.local_object_key?{localObjectKey:String(x.local_object_key)}:{})})).filter((x:any):x is string=>Boolean(x));
}
async function documents(db:Queryable,vehicleId:string):Promise<CustomerVisibleDocumentDTO[]>{
 const {rows}=await db.query({text:`SELECT document_type,resource_ref FROM vehicle_documents WHERE vehicle_id=$1 AND customer_visible=true ORDER BY is_primary DESC,document_id`,values:[vehicleId]});
 return rows.map((x:any)=>({document_type:String(x.document_type),display_label:String(x.document_type),url:String(x.resource_ref)}));
}
async function condition(db:Queryable,row:BaseRow):Promise<VehicleConditionDTO>{
 const {rows}=await db.query({text:`SELECT raw_description,facts_json FROM vehicle_condition_facts WHERE vehicle_id=$1`,values:[row.vehicle_id]}); const x=rows[0];
 const actual=x?.facts_json?.actual_inspection_summary; return {actual_inspection_present:Boolean(actual),...(row.condition_summary?{summary:String(row.condition_summary)}:{}),...(x?.raw_description?{source_description:String(x.raw_description)}:{}),...(actual?{actual_inspection_summary:String(actual)}:{})};
}
async function datesEnabled(db:Queryable):Promise<boolean>{
 const {rows}=await db.query(`SELECT value_json FROM runtime_config_versions WHERE config_key='vehicle_detail.show_listing_dates' AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now()) ORDER BY effective_from DESC LIMIT 1`);
 const v=rows[0]?.value_json; return v===true || v?.enabled===true || v?.value===true;
}

async function customerVisibilityContext(db:Queryable,vehicleId:string,customerId:string|undefined,row:BaseRow){
 const priority=await db.query({text:`SELECT p.customer_id,p.recommendation_id,
        (r.recommendation_id IS NOT NULL AND r.status='active') AS has_active_recommendation
      FROM demand_priority_leases p
      LEFT JOIN recommendations r ON r.recommendation_id=p.recommendation_id
      WHERE p.vehicle_id=$1 AND p.status='active' AND p.expires_at>now()
      ORDER BY p.created_at DESC LIMIT 1`,values:[vehicleId]});
 const pr=priority.rows[0];
 let hasCustomerGrant=false;
 let hasBusinessAccess=false;
 if(customerId){
   const grant=await db.query({text:`SELECT 1
      FROM vehicle_visibility_grants g
      JOIN recommendations r ON r.recommendation_id=g.source_recommendation_id
      WHERE g.vehicle_id=$1 AND g.customer_id=$2 AND g.ended_at IS NULL
        AND r.status='active' AND r.listing_cycle_id=$3
      LIMIT 1`,values:[vehicleId,customerId,row.listing_cycle_id]});
   hasCustomerGrant=(grant.rowCount??0)>0;
   const business=await db.query({text:`SELECT 1 WHERE
      EXISTS (SELECT 1 FROM locks l WHERE l.vehicle_id=$1 AND l.customer_id=$2 AND l.ended_at IS NULL)
      OR EXISTS (SELECT 1 FROM transactions t WHERE t.vehicle_id=$1 AND t.customer_id=$2 AND t.status IN ('in_progress','completed'))`,values:[vehicleId,customerId]});
   hasBusinessAccess=(business.rowCount??0)>0;
 }
 return decideCustomerVisibility({
   sourceStatus:row.source_status,bizStatus:row.biz_status,platformVisibility:row.platform_visibility,
   hasCustomerGrant,hasBusinessAccess,
   customerId:customerId?BigInt(customerId):null,
   activePriorityCustomerId:pr?.customer_id!=null?BigInt(pr.customer_id):null,
   hasActiveRecommendationForPriorityCustomer:Boolean(pr?.has_active_recommendation),
 });
}

export async function canStaffReadPriorityProtectedVehicle(db:Queryable,vehicleId:string,employeeId:string,hasPriorityView:boolean):Promise<boolean>{
 const {rows}=await db.query({text:`SELECT p.customer_id,c.owner_employee_id
      FROM demand_priority_leases p
      JOIN customers c ON c.customer_id=p.customer_id
      WHERE p.vehicle_id=$1 AND p.status='active' AND p.expires_at>now()
      ORDER BY p.created_at DESC LIMIT 1`,values:[vehicleId]});
 const pr=rows[0];
 const decision=decideStaffPriorityVisibility({
   activePriorityCustomerId:pr?.customer_id!=null?BigInt(pr.customer_id):null,
   priorityCustomerResponsibleEmployeeId:pr?.owner_employee_id!=null?BigInt(pr.owner_employee_id):null,
   employeeId:BigInt(employeeId),hasPriorityView,
 });
 return decision.visible;
}

async function buildCustomerSafeDetail(db:Queryable,row:BaseRow,resolver:VehicleImageUrlResolver,customerId?:string):Promise<VehicleCustomerDetailDTO>{
 const vehicleId=idString(row.vehicle_id);
 const [v,imgs,docs,cond,showDates]=await Promise.all([card(db,row,resolver),images(db,row,resolver),documents(db,vehicleId),condition(db,row),datesEnabled(db)]);
 let favorite:boolean|undefined; if(customerId){const r=await db.query({text:`SELECT 1 FROM favorites WHERE customer_id=$1 AND vehicle_id=$2`,values:[customerId,vehicleId]});favorite=(r.rowCount ?? 0)>0;}
 const c=cycle(row); const sourceAt=row.source_type==='wholesale'?row.first_seen_at:row.created_at;
 return {vehicle:v,images:imgs,customer_visible_documents:docs,condition:cond,share_allowed:row.source_status==='active'&&row.platform_visibility==='visible',...(favorite!==undefined?{favorite}:{}),...(showDates&&c&&sourceAt?{detail_dates:{listing_started_at:c.started_at,source_recorded_at:iso(sourceAt),source_recorded_kind:row.source_type==='wholesale'?'platform_first_seen_at':'manual_uploaded_at'}}:{})};
}
export async function getCustomerVehicleDetail(db:Queryable,vehicleId:string,resolver:VehicleImageUrlResolver,customerId?:string):Promise<VehicleCustomerDetailDTO|null>{
 const row=await getBaseRow(db,vehicleId); if(!row)return null;
 const visibility=await customerVisibilityContext(db,vehicleId,customerId,row);
 if(!visibility.visible)return null;
 return buildCustomerSafeDetail(db,row,resolver,customerId);
}
async function currentAnomaly(db:Queryable,vehicleId:string):Promise<SupplyAnomalyDTO|undefined>{
 const {rows}=await db.query({text:`SELECT anomaly_id,vehicle_id,anomaly_type,detected_at,is_current,resolved_at,resolution_basis FROM vehicle_supply_anomalies WHERE vehicle_id=$1 AND is_current=true ORDER BY detected_at DESC LIMIT 1`,values:[vehicleId]}); const x=rows[0]; if(!x)return undefined;
 return {id:idString(x.anomaly_id),vehicle_id:idString(x.vehicle_id),anomaly_type:String(x.anomaly_type),detected_at:iso(x.detected_at),is_current:Boolean(x.is_current),...(optionalIso(x.resolved_at)?{resolved_at:optionalIso(x.resolved_at)!}:{}),...(x.resolution_basis?{resolution_basis:String(x.resolution_basis)}:{})};
}
export async function getStaffVehicleSafe(db:Queryable,vehicleId:string,resolver:VehicleImageUrlResolver):Promise<StaffVehicleSafeDTO|null>{
 const row=await getBaseRow(db,vehicleId); if(!row)return null; const customerSafe=await buildCustomerSafeDetail(db,row,resolver); const anomaly=await currentAnomaly(db,vehicleId); const lc=cycle(row);
 return {customer_safe:customerSafe,status:status(row),version:intValue(row.version),...(anomaly?{supply_anomaly:anomaly}:{}),...(lc?{listing_cycle:lc}:{})};
}
export async function getStaffVehicleInternal(db:Queryable,vehicleId:string,resolver:VehicleImageUrlResolver,access:VehicleInternalFieldAccess):Promise<StaffVehicleInternalDTO|null>{
 const row=await getBaseRow(db,vehicleId); if(!row)return null; const customerSafe=await buildCustomerSafeDetail(db,row,resolver);
 const internal:any={...(row.upstream_list_price_cents!=null?{upstream_list_price_cents:intValue(row.upstream_list_price_cents)}:{}),...(row.upstream_wholesale_price_cents!=null?{upstream_wholesale_price_cents:intValue(row.upstream_wholesale_price_cents)}:{}),...(row.base_wholesale_price_cents!=null?{base_wholesale_price_cents:intValue(row.base_wholesale_price_cents)}:{}),...(row.base_wholesale_price_cents!=null&&row.markup_cents!=null?{customer_rule_price_cents:intValue(row.base_wholesale_price_cents)+intValue(row.markup_cents)}:{}),...(row.override_cents!=null?{customer_override_price_cents:intValue(row.override_cents)}:{}),...(access.internalPrice&&row.internal_wholesale_price_cents!=null?{internal_wholesale_price_cents:intValue(row.internal_wholesale_price_cents)}:{}),...(access.upstreamPhone&&row.cached_upstream_phone?{upstream_phone:String(row.cached_upstream_phone)}:{}),version:intValue(row.version),...(row.vin?{vin:String(row.vin)}:{}),...(row.car_code?{car_code:String(row.car_code)}:{}),...(row.upstream_publisher_id?{publisher_id:String(row.upstream_publisher_id)}:{})};
 return {customer_safe:customerSafe,internal,...(access.internalPrice&&row.internal_wholesale_price_cents!=null?{wholesale_price:intValue(row.internal_wholesale_price_cents)}:{})};
}
export async function getAdminVehicle(db:Queryable,vehicleId:string,resolver:VehicleImageUrlResolver,access:VehicleInternalFieldAccess):Promise<AdminVehicleDTO|null>{
 const row=await getBaseRow(db,vehicleId); if(!row)return null; const safe=await buildCustomerSafeDetail(db,row,resolver); const internal=await getStaffVehicleInternal(db,vehicleId,resolver,access); if(!internal)return null; const anomaly=await currentAnomaly(db,vehicleId); const lc=cycle(row);
 return {safe,internal,status:status(row),...(lc?{listing_cycle:lc}:{}),...(anomaly?{supply_anomaly:anomaly}:{}),...(row.vin?{vin:String(row.vin)}:{})};
}
