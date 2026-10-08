// F03-G0: pure, fail-closed server-side policy decisions over explicitly supplied
// synthetic/current fact snapshots. NO DATABASE, login, token, I/O or HTTP calls.
// Technical action/capability aliases are mappings for A review, not product grants.
const own=(obj,k)=>Object.prototype.hasOwnProperty.call(obj,k);
const O={
 'customer.phone.manage':{actor:'employee',cap:['customer.phone.manage'],resource:'customer',statuses:['active'],hardDenyFourS:true},
 'customer.account.disable':{actor:'employee_or_admin',cap:['customer.account.disable'],systemCap:'customer.account.disable',resource:'customer',statuses:['active','inactive'],hardDenyFourS:true},
 'customer.crm.read':{actor:'employee',cap:['crm.customer.view'],resource:'customer',statuses:['active','inactive'],hardDenyFourS:true},
 'customer.history.read':{actor:'employee',cap:['crm.customer.view'],resource:'customer',statuses:['active','inactive'],hardDenyFourS:true},
 'vehicle.read':{actor:'employee',cap:['vehicle.read'],resource:'vehicle',statuses:['visible','hidden'],allowFourS:true},
 'vehicle.edit':{actor:'employee',cap:['vehicle.manage'],resource:'vehicle',statuses:['visible','hidden'],allowFourS:true},
 'vehicle.customer_list_price.edit':{actor:'employee',cap:['vehicle.manage'],resource:'vehicle',statuses:['visible','hidden'],allowFourS:true},
 'vehicle.internal_wholesale_price.read':{actor:'employee',cap:['internal.price.view'],resource:'vehicle',statuses:['visible','hidden'],hardDenyFourS:true},
 'vehicle.internal_wholesale_price.edit':{actor:'employee',cap:['vehicle.manage','internal.price.view'],resource:'vehicle',statuses:['visible','hidden'],hardDenyFourS:true},
 'vehicle.display_price.override':{actor:'employee',cap:['customer.display_price.override'],resource:'vehicle',statuses:['visible','hidden'],hardDenyFourS:true},
 'vehicle.publisher_phone.read':{actor:'employee',cap:['publisher.phone.sensitive'],resource:'vehicle',statuses:['visible','hidden'],source:'wholesale',hardDenyFourS:true},
 'vehicle.publisher_phone.latest':{actor:'employee',cap:['publisher.phone.sensitive'],resource:'vehicle',statuses:['visible','hidden'],source:'wholesale',hardDenyFourS:true},
 'vehicle.publisher_phone.dial':{actor:'employee',cap:['publisher.phone.sensitive'],resource:'vehicle',statuses:['visible','hidden'],source:'wholesale',hardDenyFourS:true},
 'vehicle.convert_to_mingbang':{actor:'employee',cap:['vehicle.manage'],resource:'vehicle',statuses:['visible','hidden'],source:'wholesale',hardDenyFourS:true},
 'vehicle.pc_manage_4s':{actor:'employee',cap:['pc.four_s.vehicle.manage'],resource:'vehicle',statuses:['visible','hidden'],source:'four_s',onlyFourS:true},
 'matching.rule.manage':{actor:'employee',cap:['matching.rule.manage'],resource:'matching_rule',statuses:['enabled','disabled','retired'],hardDenyFourS:true},
 'lock.manage':{actor:'employee',cap:['lock.manage'],resource:'lock',statuses:['pending','active','ended'],hardDenyFourS:true},
 'transaction.manage':{actor:'employee',cap:['transaction.manage'],resource:'transaction',statuses:['pending','in_progress','completed','closed'],hardDenyFourS:true},
 'employee.receiving.manage':{actor:'employee',cap:['employee.receiving.manage'],resource:'employee',statuses:['active'],hardDenyFourS:true},
 'system.employee.manage':{actor:'system_admin',systemCap:'system.employee.manage',resource:'employee',statuses:['active','inactive']},
 'system.four_s_account.manage':{actor:'system_admin',systemCap:'system.four_s_account.manage',resource:'employee',statuses:['active','inactive']},
 'system.role_template.manage':{actor:'system_admin',systemCap:'system.role_template.manage',resource:'role',statuses:['active','disabled']},
 'system.vehicle_model.manage':{actor:'system_admin',systemCap:'vehicle.model.manage',resource:'model',statuses:['active','pending','missing','disabled']}
};
export const ACTIONS=Object.freeze(Object.fromEntries(Object.entries(O).map(([id,v])=>[id,Object.freeze({...v,cap:Object.freeze(v.cap||[]),statuses:Object.freeze(v.statuses)})])));
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>(typeof x==='string'&&x.length>0)||(Number.isSafeInteger(x)&&x>0);
const deny=(reason)=>({allowed:false,reason,capabilities:[]});
const allow=(capabilities)=>({allowed:true,reason:'ALLOWED_CURRENT_FACTS',capabilities:[...capabilities]});
const relationKinds=new Set(['global','owner','responsible','assignee','store','team','four_s_vehicle','self']);
function scopeMatches({actor,resource,grant,capability}){
 if(!isObj(grant)||grant.actorId!==actor.id||grant.resourceKind!==resource.kind||grant.resourceId!==resource.id||grant.capability!==capability||grant.active!==true||!relationKinds.has(grant.relation))return false;
 switch(grant.relation){
  case 'global':return true; // requires an explicit current per-object grant from trusted scope resolver
  case 'owner':return resource.ownerEmployeeId===actor.id;
  case 'responsible':return resource.responsibleEmployeeId===actor.id;
  case 'assignee':return resource.assigneeEmployeeId===actor.id;
  case 'store':return validId(actor.storeId)&&actor.storeId===resource.storeId;
  case 'team':return validId(actor.teamId)&&actor.teamId===resource.teamId;
  case 'four_s_vehicle':return actor.role==='four_s'&&resource.sourceType==='four_s'&&resource.fourSEmployeeId===actor.id;
  case 'self':return resource.kind==='employee'&&resource.id===actor.id;
  default:return false;
 }
}
function capabilityGranted(actor,capability,facts){
 if(actor.kind==='system_admin'){
  return Array.isArray(facts.systemCapabilities)&&facts.systemCapabilities.includes(capability);
 }
 const decisions=facts.personalDecisions;
 if(!isObj(decisions)||!Array.isArray(facts.roleDefaults))return false;
 if(own(decisions,capability)&&!['allow','deny'].includes(decisions[capability]))return false;
 if(decisions[capability]==='deny')return false;
 return decisions[capability]==='allow'||facts.roleDefaults.includes(capability);
}
function requiredCaps(rule,actor){
 return actor.kind==='system_admin'?[rule.systemCap]:rule.cap;
}
export function authorize(operation,context){
 const rule=ACTIONS[operation];
 if(!rule)return deny('UNKNOWN_OR_RETIRED_ACTION');
 if(!isObj(context)||!isObj(context.actor)||!isObj(context.facts)||!isObj(context.resource))return deny('MISSING_CURRENT_FACTS');
 const {actor,facts,resource}=context;
 if(!validId(actor.id)||!['employee','system_admin'].includes(actor.kind)||actor.status!=='active')return deny('INVALID_OR_INACTIVE_ACTOR');
 if(actor.kind==='employee'&&!['sales','manager','store_manager','four_s'].includes(actor.role))return deny('UNKNOWN_EMPLOYEE_ROLE');
 if(actor.kind==='system_admin'&&own(actor,'role'))return deny('MIXED_PRINCIPAL_IDENTITY');
 // PRODUCT hard DENY is deliberately above personal/role allow.
 if(actor.role==='four_s'&&rule.hardDenyFourS)return deny('HARD_DENY_FOUR_S');
 if(rule.onlyFourS&&actor.role!=='four_s')return deny('FOUR_S_ONLY_ACTION');
 if(actor.kind==='system_admin'&&!['system_admin','employee_or_admin'].includes(rule.actor))return deny('SYSTEM_ADMIN_IS_NOT_EMPLOYEE');
 if(actor.kind==='employee'&&rule.actor==='system_admin')return deny('EMPLOYEE_IS_NOT_SYSTEM_ADMIN');
 if(actor.role==='four_s'&&rule.allowFourS!==true&&rule.onlyFourS!==true)return deny('HARD_DENY_FOUR_S');
 if(actor.role==='four_s'&&resource.sourceType!=='four_s')return deny('FOUR_S_SOURCE_BOUNDARY');
 if(actor.role==='four_s'&&resource.fourSEmployeeId!==actor.id)return deny('FOUR_S_OWN_VEHICLE_ONLY');
 if(!validId(resource.id)||resource.kind!==rule.resource||typeof resource.state!=='string')return deny('INVALID_OBJECT_FACTS');
 if(operation==='system.four_s_account.manage'&&resource.role!=='four_s')return deny('FOUR_S_ACCOUNT_TARGET_REQUIRED');
 if(!rule.statuses.includes(resource.state))return deny('OBJECT_STATE_DENIED');
 if(rule.source&&resource.sourceType!==rule.source)return deny('SOURCE_TYPE_DENIED');
 if(['vehicle.publisher_phone.read','vehicle.publisher_phone.latest','vehicle.publisher_phone.dial'].includes(operation)&&(!validId(resource.upstreamPublisherId)||resource.sourceType!=='wholesale'))return deny('PUBLISHER_CONTEXT_MISSING');
 // No historical role, old session, Internal Mode, UI button or cached entitlement is accepted.
 const capabilities=requiredCaps(rule,actor);
 if(!capabilities?.length||capabilities.some(c=>typeof c!=='string'||!c))return deny('CAPABILITY_UNMAPPED');
 if(!Array.isArray(facts.hardDenies)||!Array.isArray(facts.scopeGrants))return deny('MISSING_POLICY_FACTS');
 if(capabilities.some(c=>facts.hardDenies.includes(c)))return deny('HARD_DENY_POLICY');
 if(capabilities.some(c=>!capabilityGranted(actor,c,facts)))return deny('PERMISSION_DENIED');
 if(capabilities.some(c=>!facts.scopeGrants.some(grant=>scopeMatches({actor,resource,grant,capability:c}))))return deny('SCOPE_DENIED');
 if(resource.accountStatus==='inactive'&&!['customer.account.disable','customer.history.read','customer.crm.read'].includes(operation))return deny('RESOURCE_ACCOUNT_INACTIVE');
 // Governance cannot change its own privilege through this generic policy; later
 // F03-2 enforces full grantor/target escalation and transactional audit.
 if(resource.kind==='system_admin'&&resource.id===actor.id&&operation.startsWith('system.'))return deny('SELF_GOVERNANCE_DENIED');
 return allow(capabilities);
}
const SAFE_VEHICLE=['vehicle_id','source_type','source_sale_status','platform_visibility','display_price','photos'];
const SAFE_CUSTOMER=['customer_id','account_status','customer_level','contact_name'];
const INTERNAL_PRICE=['internal_wholesale_price','upstream_wholesale_price','base_wholesale_price'];
const PUBLISHER_PHONE=['publisher_phone'];
export function projectRecord(operation,record,context){
 const base=authorize(operation,context);
 if(!base.allowed)return {allowed:false,reason:base.reason,fields:{}};
 if(!isObj(record))return {allowed:false,reason:'INVALID_RECORD',fields:{}};
 const recordIdField=operation==='vehicle.read'?'vehicle_id':operation.startsWith('customer.')?'customer_id':null;
 if(recordIdField&&own(record,recordIdField)&&record[recordIdField]!==context.resource.id)return {allowed:false,reason:'RECORD_RESOURCE_ID_MISMATCH',fields:{}};
 const safe=operation==='vehicle.read'?SAFE_VEHICLE:
  ['customer.history.read','customer.crm.read'].includes(operation)?SAFE_CUSTOMER:null;
 if(!safe)return {allowed:false,reason:'PROJECTION_NOT_CONTRACTED',fields:{}};
 const fields={};
 for(const key of safe)if(own(record,key))fields[key]=record[key];
 if(operation==='vehicle.read'){
  // Internal Mode is presentation context, never an authorization grant.
  if(context.internalMode===true){
   const price=authorize('vehicle.internal_wholesale_price.read',context);
   if(price.allowed)for(const key of INTERNAL_PRICE)if(own(record,key))fields[key]=record[key];
   const phone=authorize('vehicle.publisher_phone.read',context);
   if(phone.allowed)for(const key of PUBLISHER_PHONE)if(own(record,key))fields[key]=record[key];
  }
 }else if(operation==='customer.history.read'){
  // At-time actor/role/store remain immutable history, yet content is projected
  // using current authorization and a whitelist instead of returning DB rows.
  for(const key of ['history_event','occurred_at','actor_id','actor_role_at_time','actor_store_at_time'])if(own(record,key))fields[key]=record[key];
 }
 return {allowed:true,reason:'CURRENT_SCOPE_PROJECTED',fields};
}
