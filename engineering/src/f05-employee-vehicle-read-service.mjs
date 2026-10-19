// F05-1: scoped Employee Vehicle projection, PG16 disposable-only Source carrier.
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const id=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
const token=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{43}$/.test(x);
const deny=(status,code)=>({status,body:{code,productionReady:false}});
export function createIsolatedEmployeeVehicleReadService({pool,env=process.env}={}){
 if(!pool||typeof pool.query!=='function'||env.APP_ENV!=='test'||env.NODE_ENV!=='test'||
  env.API_HOST!=='127.0.0.1'||env.F05_CATALOG_TEST_CONSENT!=='I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY')
  throw Error('F05_VEHICLE_READ_FORMAL_SOURCE_NOT_SIGNED');
 return Object.freeze({async get({credential,vehicleId}){
  if(!id(vehicleId))return deny(400,'EMPLOYEE_VEHICLE_INVALID_ID');
  if(!token(credential))return deny(401,'EMPLOYEE_IDENTITY_REQUIRED');
  const result=await pool.query(
   "SELECT v.vehicle_id,cy.listing_cycle_id,v.source_type,v.source_sale_status,v.platform_visibility,cy.started_at "+
   "FROM public.f05_catalog_employee_sessions_test s "+
   "JOIN public.employees e ON e.employee_id=s.employee_id "+
   "JOIN public.roles r ON r.role_id=e.main_role_id "+
   "JOIN public.f05_vehicle_read_scope_test scope ON scope.employee_id=e.employee_id "+
   "JOIN public.vehicles v ON v.vehicle_id=scope.vehicle_id AND v.source_type=scope.source_type "+
   "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=scope.listing_cycle_id "+
     "AND cy.vehicle_id=v.vehicle_id AND cy.ended_at IS NULL "+
   "WHERE s.token_sha256=$1 AND s.issuer='DISPOSABLE_TEST_ONLY' "+
   "AND s.revoked_at IS NULL AND s.expires_at>statement_timestamp() "+
   "AND e.employment_status='active' AND v.vehicle_id=$2 "+
   "AND scope.can_read=true AND scope.issuer='DISPOSABLE_TEST_ONLY' "+
   "AND scope.expires_at>statement_timestamp() "+
   "AND ((r.role_code='four_s' AND v.source_type='four_s') "+
   "OR (r.role_code IN('sales','manager','store_head'))) "+
   "AND v.archived_at IS NULL "+
   "AND ((v.source_type='wholesale' AND v.source_sale_status='active') "+
   "OR (v.source_type IN('mingbang','four_s') AND v.source_sale_status='available')) "+
   "AND NOT EXISTS(SELECT 1 FROM public.vehicle_listing_cycles other "+
    "WHERE other.vehicle_id=v.vehicle_id AND other.listing_cycle_id<>cy.listing_cycle_id AND other.ended_at IS NULL) "+
   "AND NOT EXISTS(SELECT 1 FROM public.priority_leases p "+
    "WHERE p.vehicle_id=v.vehicle_id AND p.listing_cycle_id=cy.listing_cycle_id "+
      "AND p.status='active' AND p.expires_at>statement_timestamp()) "+
   "AND NOT EXISTS(SELECT 1 FROM public.f05_real_catalog_protections_test protected "+
     "WHERE protected.vehicle_id=v.vehicle_id AND protected.listing_cycle_id=cy.listing_cycle_id "+
     "AND protected.ended_at IS NULL) "+
   "ORDER BY cy.listing_cycle_id LIMIT 2 FOR SHARE OF s,e,r,scope,v,cy",
   [hash(credential),vehicleId]);
  if(result.rows.length!==1)return deny(404,'EMPLOYEE_VEHICLE_NOT_IN_CURRENT_SCOPE');
  const row=result.rows[0];
  if(!(row.started_at instanceof Date)||!id(String(row.vehicle_id))||!id(String(row.listing_cycle_id)))
   throw Error('EMPLOYEE_VEHICLE_PHYSICAL_PROJECTION_INVALID');
  return {status:200,body:{code:'EMPLOYEE_VEHICLE_SCOPED',
   vehicle:{vehicleId:String(row.vehicle_id),listingCycleId:String(row.listing_cycle_id),
    sourceType:row.source_type,saleStatus:row.source_sale_status,
    platformVisibility:row.platform_visibility,listingStartedAt:row.started_at.toISOString()},
   sourceProof:'DISPOSABLE_TEST_ONLY',price:null,phone:null,vin:null,productionReady:false}};
 }});
}
