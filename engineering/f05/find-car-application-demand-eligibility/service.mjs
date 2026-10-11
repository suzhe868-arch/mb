// PDM-11 CI-only isolation. Live Customer WeChat+phone/Employee permission Issuers are NOT proven.
import {connect,verify} from './migration.mjs';
export const SOURCE_GAPS=Object.freeze({
 customer:'CUSTOMER_WECHAT_SESSION_TO_APPLICATION_ACTOR_SOURCE_GAP',
 phone:'CUSTOMER_PHONE_AUTHORIZATION_ISSUER_SOURCE_GAP',
 owner:'CUSTOMER_OWNER_REFERRED_ASSIGNMENT_POOL_SOURCE_GAP',
 activation:'F05_6_DEMAND_ACTIVATION_PERMISSION_CURRENT_SCOPE_SOURCE_GAP',
 entitlement:'F05_6_PRODUCTION_LEVEL_FIND_ENTITLEMENT_ISSUER_SOURCE_GAP'
});
const objects=new WeakSet();
const deny=(code,extra={})=>({allowed:false,code,...extra});
const allowed=(code,extra={})=>({allowed:true,code,syntheticCIOnly:true,...extra});
const valid=id=>Number.isSafeInteger(id)&&id>0&&id<2147483647;
const requestKey=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{20,160}$/.test(x);
function gate(){
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_6_CI_ONLY_'+k);
 if(process.env.F03_1_DATABASE_URL!=='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test')
  throw Error('F05_6_NO_LIVE_DATABASE');
}
export function syntheticCustomerActor(customerId){
 gate();if(!valid(customerId))throw Error('F05_6_SYNTHETIC_CUSTOMER_INVALID');
 const a=Object.freeze({customerId,source:'CI_SYNTHETIC_CUSTOMER_ACTOR_NOT_PRODUCTION'});
 objects.add(a);return a;
}
const trusted=a=>objects.has(a)&&valid(a.customerId);
const phone=async(c,id)=>!!(await c.query('SELECT 1 FROM public.customer_phone_facts WHERE customer_id=$1 AND valid_from<=statement_timestamp() AND (ended_at IS NULL OR ended_at>statement_timestamp()) LIMIT 1',[id])).rowCount;
const currentCustomer=async(c,id)=> (await c.query('SELECT customer_id,account_status,current_owner_employee_id,customer_level_id,owner_assignment_state FROM public.customers WHERE customer_id=$1 FOR UPDATE',[id])).rows[0];
async function getOwner(c,customer){
 if(!customer||customer.account_status!=='active'||customer.owner_assignment_state!=='assigned'||!customer.current_owner_employee_id)return null;
 const e=(await c.query("SELECT employee_id,store_id,employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE",[customer.current_owner_employee_id])).rows[0];
 return e?.employment_status==='active'&&e.store_id!=null?Number(e.employee_id):null;
}
export async function submitCIApplication(actor,{applicationKey,desiredVehicle}={}){
 gate();if(!trusted(actor))return deny(SOURCE_GAPS.customer);
 if(!requestKey(applicationKey)||typeof desiredVehicle!=='string'||desiredVehicle.trim().length<2||desiredVehicle.length>256)
  return deny('F05_6_DESIRED_VEHICLE_MINIMUM_REQUIRED');
 const c=await connect();
 try{
  await c.query('BEGIN');
  await verify(c);
  const customer=await currentCustomer(c,actor.customerId),owner=await getOwner(c,customer);
  if(!customer||customer.account_status!=='active'){await c.query('ROLLBACK');return deny('F05_6_CUSTOMER_INACTIVE');}
  if(!await phone(c,actor.customerId)){await c.query('ROLLBACK');return deny(SOURCE_GAPS.phone);}
  if(!owner){await c.query('ROLLBACK');return deny('F05_6_UNASSIGNED_CUSTOMER_NO_PENDING_APPLICATION',{reason:SOURCE_GAPS.owner});}
  const old=(await c.query('SELECT application_id,customer_id,assigned_employee_id FROM public.f05_6_application_origin_ci WHERE application_key=$1',[applicationKey])).rows[0];
  if(old){await c.query('COMMIT');return Number(old.customer_id)===actor.customerId?
   allowed('F05_6_APPLICATION_ALREADY_PENDING_OR_RECORDED',{applicationId:Number(old.application_id)}):
   deny('F05_6_APPLICATION_IDEMPOTENCY_COLLISION');}
  const a=(await c.query("INSERT INTO public.find_car_applications(customer_id,status,assigned_employee_id) VALUES($1,'pending',$2) RETURNING application_id",[actor.customerId,owner])).rows[0];
  await c.query("INSERT INTO public.f05_6_application_origin_ci(application_id,customer_id,assigned_employee_id,application_key,desired_vehicle,phone_gate_marker,customer_actor_marker) VALUES($1,$2,$3,$4,$5,'CI_SYNTHETIC_PHONE_GATE_NOT_PRODUCTION','CI_SYNTHETIC_CUSTOMER_ACTOR_NOT_PRODUCTION')",[a.application_id,actor.customerId,owner,applicationKey,desiredVehicle.trim()]);
  await c.query('COMMIT');
  return allowed('F05_6_APPLICATION_PENDING',{applicationId:Number(a.application_id),ownerEmployeeId:owner,demandCreated:false});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{await c.end();}
}
export async function editCIApplication(actor,applicationId,newDesired){
 gate();if(!trusted(actor))return deny(SOURCE_GAPS.customer);
 if(!valid(applicationId)||typeof newDesired!=='string'||newDesired.trim().length<2||newDesired.length>256)return deny('F05_6_INVALID_APPLICATION_EDIT');
 const c=await connect();
 try{
  await c.query('BEGIN');await verify(c);
  const cust=await currentCustomer(c,actor.customerId);
  if(!cust||cust.account_status!=='active'){await c.query('ROLLBACK');return deny('F05_6_CUSTOMER_INACTIVE');}
  const app=(await c.query('SELECT application_id,status,customer_id FROM public.find_car_applications WHERE application_id=$1 FOR UPDATE',[applicationId])).rows[0];
  if(!app||Number(app.customer_id)!==actor.customerId||app.status!=='pending'){await c.query('ROLLBACK');return deny('F05_6_NOT_PENDING_OWN_APPLICATION');}
  await c.query('UPDATE public.f05_6_application_origin_ci SET desired_vehicle=$1,content_revision=content_revision+1 WHERE application_id=$2 AND customer_id=$3',
   [newDesired.trim(),applicationId,actor.customerId]);
  await c.query('COMMIT');return allowed('F05_6_PENDING_APPLICATION_EDITED',{applicationId});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{await c.end()}
}
export async function closeCIApplication(actor,applicationId){
 gate();if(!trusted(actor))return deny(SOURCE_GAPS.customer);
 const c=await connect();
 try{
  await c.query('BEGIN');await verify(c);
  const cust=await currentCustomer(c,actor.customerId);
  const app=(await c.query('SELECT status,customer_id FROM public.find_car_applications WHERE application_id=$1 FOR UPDATE',[applicationId])).rows[0];
  if(!cust||cust.account_status!=='active'||!app||Number(app.customer_id)!==actor.customerId||app.status!=='pending'){
   await c.query('ROLLBACK');return deny('F05_6_CANNOT_CLOSE_NON_PENDING');
  }
  await c.query("UPDATE public.find_car_applications SET status='closed' WHERE application_id=$1",[applicationId]);
  await c.query('COMMIT');return allowed('F05_6_APPLICATION_CLOSED',{applicationId});
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{await c.end()}
}
const scopeSQL="SELECT EXISTS(SELECT 1 FROM public.permissions p "+
 "JOIN public.employee_permission_overrides ov ON ov.employee_id=$1 AND ov.permission_id=p.permission_id "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=$1 AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes sc ON sc.scope_id=b.scope_id AND sc.employee_id=$1 "+
 "JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships member ON member.team_id=t.team_id AND member.employee_id=$1 "+
 "JOIN public.employee_team_memberships ownerMember ON ownerMember.team_id=t.team_id AND ownerMember.employee_id=$3 "+
 "WHERE p.permission_code='demand.activate.ci.synthetic' AND ov.decision='allow' "+
 "AND t.team_status='active' AND st.status='active' AND st.store_id=$4 "+
 "AND member.valid_from<=statement_timestamp() AND (member.ended_at IS NULL OR member.ended_at>statement_timestamp()) "+
 "AND ownerMember.valid_from<=statement_timestamp() AND (ownerMember.ended_at IS NULL OR ownerMember.ended_at>statement_timestamp()) "+
 "AND sc.ended_at IS NULL AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp()) "+
 "AND ((sc.scope_kind='team' AND sc.scope_reference_id=t.team_id) OR "+
 "(sc.scope_kind='store' AND sc.scope_reference_id=st.store_id AND $5 IN ('manager','store_head'))) "+
 "FOR SHARE OF p,ov,b,sc,t,st,member,ownerMember) allowed";
export async function activateCIDemand(auth,token,{applicationId,requestKey:activationKey,teamId}={},{checkpoint}={}){
 gate();
 if(!auth||typeof auth.withSession!=='function')return deny(SOURCE_GAPS.activation);
 if(!valid(applicationId)||!requestKey(activationKey)||!valid(teamId))return deny('F05_6_INVALID_ACTIVATION_REQUEST');
 try{
  return (await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||!valid(Number(a.employee_id))||
     a.subject_status!=='active'||a.credential_state!=='enabled'||a.force_password_change||!['sales','manager','store_head'].includes(a.role_code))
    return deny('F05_6_ACTIVE_MINGBANG_EMPLOYEE_REQUIRED');
   const actor=Number(a.employee_id);
   await verify(c);
   const emp=(await c.query('SELECT e.employee_id,e.store_id,e.employment_status,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR SHARE OF e',[actor])).rows[0];
   if(!emp||emp.employment_status!=='active'||emp.role_code!==a.role_code||emp.store_id==null)
    return deny('F05_6_EMPLOYEE_NOT_CURRENT_ELIGIBLE');
   const app=(await c.query('SELECT application_id,status,customer_id,assigned_employee_id,activated_demand_id FROM public.find_car_applications WHERE application_id=$1 FOR UPDATE',[applicationId])).rows[0];
   if(!app)return deny('F05_6_APPLICATION_NOT_FOUND');
   const customer=await currentCustomer(c,Number(app.customer_id));
   if(!customer||customer.account_status!=='active')return deny('F05_6_CUSTOMER_INACTIVE');
   const owner=await getOwner(c,customer);
   if(!owner||Number(app.assigned_employee_id)!==owner)return deny('F05_6_OWNER_REASSIGNMENT_REQUIRED');
   if(emp.role_code==='sales'&&actor!==owner)return deny('F05_6_EMPLOYEE_NOT_CURRENT_OWNER');
   if(!await phone(c,Number(app.customer_id)))return deny(SOURCE_GAPS.phone);
   const policy=(await c.query("SELECT find_enabled FROM public.f05_6_level_find_policy_ci WHERE level_id=$1 AND source_marker='CI_SYNTHETIC_FIND_CAR_ENTITLEMENT_NOT_PRODUCTION' FOR SHARE",[customer.customer_level_id])).rows[0];
   if(!policy)return deny(SOURCE_GAPS.entitlement);
   if(policy.find_enabled!==true)return deny('F05_6_FIND_ENTITLEMENT_OFF');
   const permission=(await c.query(scopeSQL,[actor,teamId,owner,emp.store_id,emp.role_code])).rows[0];
   if(!permission?.allowed)return deny(SOURCE_GAPS.activation);
   const event=(await c.query('SELECT application_id,demand_id,actor_employee_id,request_key FROM public.f05_6_activation_events_ci WHERE application_id=$1 OR request_key=$2',[applicationId,activationKey])).rows;
   if(event.length){
    const matching=event.length===1&&Number(event[0].application_id)===applicationId&&event[0].request_key===activationKey;
    return matching?allowed('F05_6_DEMAND_ALREADY_ACTIVATED',{demandId:Number(event[0].demand_id),charged:false}):
     deny('F05_6_ACTIVATION_IDEMPOTENCY_COLLISION');
   }
   if(app.status!=='pending'||app.activated_demand_id!==null)return deny('F05_6_APPLICATION_NOT_PENDING');
   const origin=(await c.query('SELECT desired_vehicle,assigned_employee_id,customer_actor_marker,phone_gate_marker FROM public.f05_6_application_origin_ci WHERE application_id=$1 AND customer_id=$2 FOR SHARE',
     [applicationId,app.customer_id])).rows[0];
   if(!origin||origin.customer_actor_marker!=='CI_SYNTHETIC_CUSTOMER_ACTOR_NOT_PRODUCTION'||origin.phone_gate_marker!=='CI_SYNTHETIC_PHONE_GATE_NOT_PRODUCTION')
    return deny(SOURCE_GAPS.customer);
   if(checkpoint)await checkpoint('after_application_customer_owner_level_phone_permission_guard',c);
   const demand=(await c.query("INSERT INTO public.demands(customer_id,responsible_employee_id,demand_state,criteria_json) VALUES($1,$2,'active',$3::jsonb) RETURNING demand_id,created_at",
    [app.customer_id,owner,JSON.stringify({requestedVehicle:origin.desired_vehicle,source:'CI_SYNTHETIC_APPLICATION_NOT_MATCHING_READY'})])).rows[0];
   await c.query("UPDATE public.find_car_applications SET status='activated',activated_demand_id=$1 WHERE application_id=$2 AND status='pending'",
    [demand.demand_id,applicationId]);
   await c.query("INSERT INTO public.f05_6_activation_events_ci(application_id,demand_id,customer_id,actor_employee_id,request_key,demand_created_at,original_application_owner,synthetic_issuer,txid) VALUES($1,$2,$3,$4,$5,$6,$7,'CI_SYNTHETIC_DEMAND_ACTIVATION_PERMISSION_NOT_PRODUCTION',txid_current())",
    [applicationId,demand.demand_id,app.customer_id,actor,activationKey,demand.created_at,owner]);
   return allowed('F05_6_MANUAL_DEMAND_ACTIVATED',{applicationId,demandId:Number(demand.demand_id),responsibleEmployeeId:owner,matchingReady:false});
  },{normalOnly:true}))??deny('F05_6_INVALID_OR_REVOKED_F03_EMPLOYEE_SESSION');
 }catch(e){
  if(['55P03','40001','40P01','23505'].includes(e?.code))return deny('F05_6_CONCURRENT_CHANGE_RETRY');
  throw e;
 }
}
export function productionFindCarReject(){return deny('F05_6_REAL_CUSTOMER_PHONE_PERMISSION_ISSUERS_SOURCE_GAP')}
