// F03-P: restricted synthetic PG16 field contract, no HTTP and no production access.
import {verify} from '../runtime-transaction-responsible-handover/migration.mjs';
const safe=(code,fields={})=>Object.freeze({code,...fields,canWrite:false,mayDeploy:false});
const valid=x=>Number.isSafeInteger(x)&&x>0;
const id=x=>x==null?null:String(x);
const allowedModes=new Set(['LIMITED','UNLIMITED']);
export const OUTPUT_FIELDS=Object.freeze(['vehicleId','listingCycleId','sourceType','price','priceState','customerId','visibility']);
function syntheticOnly(){if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('P_CONTRACT_CI_ONLY');}
const statusPrice=(amount,kind)=>amount==null?{price:null,priceState:'PRICE_CONSULT'}:{price:amount,priceState:kind};
async function currentFacts(c,vehicleId){
 const v=(await c.query("SELECT v.vehicle_id,v.source_type,v.source_sale_status,v.platform_visibility,v.archived_at,cy.listing_cycle_id,cy.ended_at FROM public.vehicles v JOIN public.vehicle_listing_cycles cy ON cy.vehicle_id=v.vehicle_id WHERE v.vehicle_id=$1 AND cy.ended_at IS NULL ORDER BY cy.started_at DESC,cy.listing_cycle_id DESC LIMIT 1",[vehicleId])).rows[0];
 if(!v||v.archived_at!==null||!((v.source_type==='wholesale'&&v.source_sale_status==='active')||(v.source_type!=='wholesale'&&v.source_sale_status==='available')))return null;
 const price=(await c.query("SELECT amount_cents FROM public.vehicle_price_history WHERE vehicle_id=$1 AND price_kind='customer_display' AND valid_from<=clock_timestamp() ORDER BY valid_from DESC,price_event_id DESC LIMIT 1",[vehicleId])).rows[0]?.amount_cents??null;
 return {v,price:price==null?null:Number(price)};
}
async function vehicleVisible(c,v,customerId){
 if(v.platform_visibility!=='visible'){
  if(!customerId)return false;
  const grant=(await c.query("SELECT 1 FROM public.vehicle_visibility_grants g JOIN public.recommendations r ON r.recommendation_id=g.source_recommendation_id AND r.vehicle_id=g.vehicle_id AND r.customer_id=g.customer_id WHERE g.vehicle_id=$1 AND g.customer_id=$2 AND g.revoked_at IS NULL AND r.status='active' LIMIT 1",[v.vehicle_id,customerId])).rowCount>0;
  if(!grant)return false;
 }
 const x=(await c.query("SELECT customer_id FROM public.priority_leases WHERE vehicle_id=$1 AND listing_cycle_id=$2 AND status='active' AND ended_at IS NULL AND expires_at>clock_timestamp() LIMIT 2",[v.vehicle_id,v.listing_cycle_id])).rows;
 return !x.length||(customerId!==null&&x.length===1&&id(x[0].customer_id)===id(customerId));
}
// Synthetic *authenticated context* adapter: customer ID comes from controlled CI
// harness, never from an untrusted HTTP request, claim or level string.
export async function projectCustomerVehicle(auth,context,request){
 syntheticOnly();
 if(!context||context.kind!=='trusted-synthetic-customer'||!valid(context.customerId)||!allowedModes.has(context.entitlementMode)||!request||!valid(request.vehicleId)||!['list','detail'].includes(request.view))return safe('P_CUSTOMER_CONTEXT_DENY');
 const c=await auth.pool.connect();
 try{
  await verify(c);
  await c.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
  try{
   const cust=(await c.query("SELECT c.account_status,l.level_code FROM public.customers c JOIN public.customer_levels l ON l.level_id=c.customer_level_id WHERE c.customer_id=$1",[context.customerId])).rows[0];
   // An external signed entitlement service must bind current level to MODE;
   // this synthetic adapter never derives UNLIMITED solely from a user label.
   if(!cust||cust.account_status!=='active'||context.entitlementAttested!==true)return safe('P_ENTITLEMENT_NOT_ATTESTED');
   const fact=await currentFacts(c,request.vehicleId);
   if(!fact||!await vehicleVisible(c,fact.v,context.customerId))return safe('P_VEHICLE_NOT_VISIBLE');
   const {v,price}=fact;
   const present={vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),sourceType:v.source_type,customerId:context.customerId};
   if(v.source_type!=='wholesale')return safe('P_CUSTOMER_SAFE_PROJECTION',{fields:{...present,...statusPrice(price,'PRICE_VISIBLE')}});
   if(context.entitlementMode==='UNLIMITED')return safe('P_CUSTOMER_SAFE_PROJECTION',{fields:{...present,...statusPrice(price,'PRICE_VISIBLE')},charged:false});
   if(request.view==='list')return safe('P_CUSTOMER_SAFE_PROJECTION',{fields:{...present,price:null,priceState:'LIST_PRICE_HIDDEN'},charged:false});
   const unlock=(await c.query("SELECT 1 FROM public.customer_price_cycle_unlocks WHERE customer_id=$1 AND vehicle_id=$2 AND listing_cycle_id=$3 LIMIT 1",[context.customerId,v.vehicle_id,v.listing_cycle_id])).rowCount>0;
   if(unlock)return safe('P_CUSTOMER_SAFE_PROJECTION',{fields:{...present,...statusPrice(price,'PRICE_ALREADY_UNLOCKED')},charged:false});
   if(price===null)return safe('P_CUSTOMER_SAFE_PROJECTION',{fields:{...present,price:null,priceState:'PRICE_CONSULT'},charged:false});
   return safe('P_NEEDS_F05_ATOMIC_UNLOCK',{fields:{...present,price:null,priceState:'--万'},charged:false,requiresAtomicUnlock:true});
  }finally{await c.query('ROLLBACK')}
 }finally{c.release()}
}
async function employeeAllowed(c,a,team,permission){
 const r=(await c.query("SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.roles ro ON ro.role_id=e.main_role_id JOIN public.permissions p ON p.permission_code=$3 LEFT JOIN public.role_permission_defaults d ON d.role_id=e.main_role_id AND d.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes s ON s.employee_id=e.employee_id JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id AND b.scope_id=s.scope_id JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id LEFT JOIN public.employee_team_memberships em ON em.team_id=t.team_id AND em.employee_id=e.employee_id WHERE e.employee_id=$1 AND e.employment_status='active' AND st.status='active' AND t.team_status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND d.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (s.ended_at IS NULL OR s.ended_at>statement_timestamp()) AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR (s.scope_kind='store' AND s.scope_reference_id=t.store_id)) AND em.valid_from<=statement_timestamp() AND (em.ended_at IS NULL OR em.ended_at>statement_timestamp())) ok",[a.employee_id,team,permission])).rows[0];
 return r?.ok===true;
}
// Strict current business-vehicle attribution contract (A-P-01).
// This frozen M94 schema does NOT bind wholesale, Mingbang and 4S vehicle
// ownership to an authoritative current Team/employee/merchant data scope.
// The client's teamId, public visibility and the customer's CRM permission
// are NOT admissible evidence. No synthetic client claim or former account
// role may substitute for a signed F04/F07 source+ownership contract.
// Each business outlet is denied rather than inferred from created_by.
// A future, formally approved implementation must revalidate the actual
// vehicle-to-Team/4S merchant owner, the current employee data scope,
// separate per-outlet capability, personal deny, revocation and history.
async function currentVehicleObjectScope(c,actor,teamId,v,view){
 const q=await c.query("SELECT source_type,created_by_employee_id FROM public.vehicles WHERE vehicle_id=$1",[v.vehicle_id]);
 if(q.rows.length!==1||q.rows[0].source_type!==v.source_type)return {proven:false,reason:'VEHICLE_FACT_DRIFT'};
 // No authoritative relation exists for any of the three types in M94.
 // Deliberately do NOT permit a staff upload, Team membership, upstream
 // publisher ID, source_type or an old cache token to grant vehicle access.
 // All outlets, even customer-display-price-only details, need object scope.
 return {proven:false,reason:'MISSING_AUTHORITY_VEHICLE_TEAM_MERCHANT'};
}
// Every export, cached response and history read re-enters this current-session
// gate. No 'previously permitted' raw object is accepted as authorization.
export async function projectEmployeeVehicle(auth,sessionToken,request){
 syntheticOnly();
 if(!request||!valid(request.vehicleId)||!valid(request.teamId)||!['detail','list','export','cache','history','copy','print'].includes(request.view)||Object.keys(request).sort().join(',')!=='teamId,vehicleId,view')return safe('P_EMPLOYEE_INPUT_DENY');
 const probe=await auth.pool.connect();try{await verify(probe)}finally{probe.release()}
 const result=await auth.withSession(sessionToken,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||a.subject_status!=='active'||a.credential_state!=='enabled'||a.force_password_change!==false)return safe('P_EMPLOYEE_SESSION_DENY');
  if(!await employeeAllowed(c,a,request.teamId,'crm.customer.view'))return safe('P_EMPLOYEE_SCOPE_DENY');
  const fact=await currentFacts(c,request.vehicleId);
  if(!fact)return safe('P_VEHICLE_MISSING');
  const {v,price}=fact;
  if(v.platform_visibility!=='visible')return safe('P_HIDDEN_DEFER');
  // CRM customer viewing is only an identity/scope precondition, not
  // independent Vehicle object scope nor export/history capability.
  const ownership=await currentVehicleObjectScope(c,a,request.teamId,v,request.view);
  if(!ownership.proven)return safe('P_VEHICLE_SCOPE_UNPROVEN',{deferredTo:'F04_F07_SIGNED_OBJECT_OWNERSHIP'});
  // Future allowed outlets must additionally check their OWN explicit
  // current capabilities; a CRM read permission never grants business export.
  if(['export','history','cache','copy','print'].includes(request.view))
    return safe('P_OUTLET_CAPABILITY_UNPROVEN',{deferredTo:'F04_FORMAL_EXPORT_HISTORY_PERMISSION'});
  // A Priority-exclusive car is not a generic employee/CRM listing.
  const priority=(await c.query("SELECT p.customer_id,d.responsible_employee_id FROM public.priority_leases p JOIN public.demands d ON d.demand_id=p.trigger_demand_id WHERE p.vehicle_id=$1 AND p.listing_cycle_id=$2 AND p.status='active' AND p.ended_at IS NULL AND p.expires_at>clock_timestamp()",[v.vehicle_id,v.listing_cycle_id])).rows;
  if(priority.length>0&&(priority.length!==1||id(priority[0].responsible_employee_id)!==id(a.employee_id)))return safe('P_PRIORITY_EXCLUSIVE_DENY');
  const payload={vehicleId:Number(v.vehicle_id),listingCycleId:Number(v.listing_cycle_id),sourceType:v.source_type,price:price??null,priceState:price===null?'PRICE_CONSULT':'PRICE_VISIBLE'};
  // Internal price and upstream publisher phone are intentionally absent:
  // no signed current independent capability+source contract is present.
  // F04-F07 must supply authoritative vehicle scope, four-S ownership,
  // current internal permission and audited publisher lookup before enabling.
  return safe('P_EMPLOYEE_REDACTED',{fields:payload,internalPrice:null,publisherPhone:null,vin:null});
 },{normalOnly:true});
 return result??safe('P_EMPLOYEE_SESSION_DENY');
}
export const projectCustomerVehicleList=(auth,ctx,vehicleId)=>projectCustomerVehicle(auth,ctx,{vehicleId,view:'list'});
export const projectCustomerVehicleDetail=(auth,ctx,vehicleId)=>projectCustomerVehicle(auth,ctx,{vehicleId,view:'detail'});
export const projectEmployeeExport=(auth,token,vehicleId,teamId)=>projectEmployeeVehicle(auth,token,{vehicleId,teamId,view:'export'});
