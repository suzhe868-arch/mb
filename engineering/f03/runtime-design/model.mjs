// F03-2-G0 PURE SYNTHETIC DESIGN MODEL. Not a runtime guard. No DB/network/env.
import {ACTIONS} from '../policy.mjs';
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const id=v=>(typeof v==='string'&&/^[1-9]\d*$/.test(v))?v:null; // BIGINT safe strings
const eq=(a,b)=>id(a)!==null&&id(a)===id(b);
const denied=reason=>({allowed:false,reason,simulationOnly:true});
const allowed=(capabilities=[])=>({allowed:true,reason:'SYNTHETIC_ONLY',capabilities,simulationOnly:true});
const one=(rows,predicate)=>{const found=(rows||[]).filter(predicate);return found.length===1?found[0]:null};
const collection=v=>Array.isArray(v)?v:[];
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const statusColumn=Object.freeze({customer:'account_status',vehicle:'platform_visibility',employee:'employment_status',lock:'lock_status',transaction:'status',matching_rule:'status',role:'status',model:'status'});
const unsupportedRequestKeys=new Set(['actor','role','permissions','scopeGrants','systemCapabilities','global','teamId','ownerId','governanceApproved','handoverComplete','eligible']);
// F03-1 established PC admission semantics: a FOUR_S employee needs an
// explicit CURRENT personal allow for pc.four_s.vehicle.manage. Template alone
// cannot authorize PC login, and a historical allow is never a grant.
const currentFourSPcAdmission=(state,employeeId)=>{
 const p=one(state.permissions,x=>x.permission_code==='pc.four_s.vehicle.manage');
 if(!p)return false;
 const matches=collection(state.overrides).filter(x=>eq(x.employee_id,employeeId)&&eq(x.permission_id,p.permission_id));
 return matches.length===1&&matches[0].decision==='allow';
};
export function contextOf(state,sessionRef){
 if(!isObject(state)||state.trustedSyntheticFixture!==true||!id(sessionRef))return null;
 const session=one(state.sessions,z=>eq(z.session_id,sessionRef));
 if(!session||session.revoked===true||session.restricted===true)return null;
 const account=one(state.accounts,z=>eq(z.account_id,session.account_id));
 if(!account||account.credential_state!=='enabled'||account.force_password_change===true||!eq(account.credential_epoch,session.credential_epoch))return null;
 if(account.principal_kind==='employee'&&id(account.employee_id)&&account.system_admin_id==null){
  const employee=one(state.employees,z=>eq(z.employee_id,account.employee_id));
  const role=employee&&one(state.roles,z=>eq(z.role_id,employee.main_role_id));
  if(!employee||employee.employment_status!=='active'||!role||!['sales','manager','store_manager','four_s'].includes(role.role_code))return null;
  if(role.role_code==='four_s'&&!currentFourSPcAdmission(state,employee.employee_id))return null;
  return {kind:'employee',id:employee.employee_id,employee,role:role.role_code};
 }
 if(account.principal_kind==='system_admin'&&id(account.system_admin_id)&&account.employee_id==null){
  const admin=one(state.systemAdmins,z=>eq(z.system_admin_id,account.system_admin_id));
  if(!admin||admin.account_status!=='active')return null;
  return {kind:'system_admin',id:admin.system_admin_id};
 }
 return null;
}
export function scopeProof(state,actor,capability,object,now){
 if(actor.kind!=='employee')return false;
 // F02 scope is independent of permission. This synthetic link requires
 // an explicitly supplied trusted scope-to-capability evidence. In real DB,
 // this link has no approved storage yet: DEFER_DENY until A decides.
 const links=collection(state.capabilityScopeProofs).filter(x=>eq(x.employee_id,actor.id)&&x.permission_code===capability);
 if(links.length===0)return false;
 for(const link of links){
  const scope=one(state.scopes,x=>eq(x.scope_id,link.scope_id)&&eq(x.employee_id,actor.id));
  if(!scope||typeof now!=='string'||!Number.isFinite(Date.parse(now)))continue;
  if(scope.ended_at!=null&&(typeof scope.ended_at!=='string'||!Number.isFinite(Date.parse(scope.ended_at))))continue;
  if(scope.ended_at!=null&&Date.parse(scope.ended_at)<=Date.parse(now))continue;
  if(!collection(state.approvedScopeKinds).includes(scope.scope_kind))continue;
  const reference=scope.scope_reference_id;
  switch(scope.scope_kind){
   case 'self':
    if(reference===null&&object.kind==='employee'&&eq(object.id,actor.id))return true;
    break;
   case 'store':
    if(eq(reference,actor.employee.store_id)&&eq(object.store_id,reference))return true;
    break;
   case 'owner_customer':
    if(object.kind==='customer'&&eq(reference,object.id)&&eq(object.current_owner_employee_id,actor.id))return true;
    break;
   case 'responsible_demand':
   case 'responsible_lock':
   case 'responsible_transaction':
    if(object.kind===scope.scope_kind.slice('responsible_'.length)&&eq(reference,object.id)&&eq(object.responsible_employee_id,actor.id))return true;
    break;
   case 'assignee_consultation':
    if(object.kind==='consultation'&&eq(reference,object.id)&&eq(object.assignee_employee_id,actor.id))return true;
    break;
   case 'four_s_vehicle':
    if(object.kind==='vehicle'&&actor.role==='four_s'&&object.source_type==='four_s'&&
       eq(reference,object.id)&&eq(object.created_by_employee_id,actor.id))return true;
    break;
   case 'global':
    // Never assume any persistent "global" is valid solely because login passed.
    if(reference===null&&state.explicitGlobalScopeMappingApproved===true&&
       collection(state.globalAllowedOperations).includes(link.operation)&&object.kind===link.object_kind)return true;
    break;
  }
 }
 return false;
}
export function evaluate(state,request){
 if(!isObject(request)||[...unsupportedRequestKeys].some(k=>has(request,k)))return denied('UNTRUSTED_REQUEST_FACTS');
 const {operation,sessionRef,objectKind,objectId,now}=request;
 const rule=ACTIONS[operation];
 if(!rule)return denied('UNKNOWN_OR_DEFERRED_OPERATION');
 const actor=contextOf(state,sessionRef);
 if(!actor)return denied('CURRENT_SESSION_OR_ACCOUNT_DENIED');
 const object=one(state.objects,o=>o.kind===objectKind&&eq(o.id,objectId));
 if(!object||object.kind!==rule.resource)return denied('CURRENT_OBJECT_NOT_PROVEN');
 if(!has(statusColumn,object.kind)||!rule.statuses.includes(object[statusColumn[object.kind]]))return denied('CURRENT_OBJECT_STATE_DENIED');
 if(actor.kind==='employee'&&actor.role==='four_s'){
  if(rule.hardDenyFourS||(!rule.onlyFourS&&!rule.allowFourS))return denied('HARD_DENY_FOUR_S');
  if(object.kind!=='vehicle'||object.source_type!=='four_s'||!eq(object.created_by_employee_id,actor.id))return denied('FOUR_S_OWN_VEHICLE_ONLY');
 }else if(rule.onlyFourS)return denied('FOUR_S_ONLY');
 if(actor.kind==='system_admin'&&rule.actor==='employee')return denied('SYSTEM_ADMIN_NO_BUSINESS_RIGHT');
 if(actor.kind==='employee'&&rule.actor==='system_admin')return denied('EMPLOYEE_NO_SYSTEM_CONTROL');
 if(rule.source&&object.source_type!==rule.source)return denied('SOURCE_TYPE_DENIED');
 if(operation.startsWith('vehicle.publisher_phone.')&&
    (!id(object.upstream_publisher_id)||object.source_type!=='wholesale'))return denied('PUBLISHER_CONTEXT_DENIED');
 if(collection(state.hardDeniedOperations).includes(operation))return denied('HARD_DENY_OPERATION');
 const capabilities=actor.kind==='system_admin'?[rule.systemCap]:rule.cap;
 if(!Array.isArray(capabilities)||capabilities.length===0||capabilities.some(x=>!x))return denied('MISSING_CAPABILITY_MAPPING');
 if(state.approvedOperationMappings?.[operation]!==true)return denied('TECH_ALIAS_PENDING_A');
 for(const cap of capabilities){
  if(collection(state.hardDeniedCapabilities).includes(cap))return denied('HARD_DENY_CAPABILITY');
  if(actor.kind==='system_admin'){
   if(!collection(state.controlGrants).some(g=>eq(g.system_admin_id,actor.id)&&g.permission_code===cap&&g.active===true&&g.target_kind===object.kind&&eq(g.target_id,object.id)))return denied('SYSTEM_CONTROL_SCOPE_NOT_PROVEN');
   continue;
  }
  const permission=one(state.permissions,p=>p.permission_code===cap);
  if(!permission)return denied('UNKNOWN_PERSISTED_PERMISSION');
  const current=collection(state.overrides).filter(x=>eq(x.employee_id,actor.id)&&eq(x.permission_id,permission.permission_id));
  if(current.length>1||current.some(x=>!['allow','deny'].includes(x.decision)))return denied('INVALID_CURRENT_OVERRIDE');
  if(current[0]?.decision==='deny')return denied('PERSONAL_DENY');
  const roleDefaults=collection(state.defaults).filter(x=>eq(x.role_id,actor.employee.main_role_id)&&eq(x.permission_id,permission.permission_id));
  if(roleDefaults.length>1)return denied('INVALID_CURRENT_ROLE_TEMPLATE');
  if(current[0]?.decision!=='allow'&&roleDefaults[0]?.enabled!==true)return denied('NO_CURRENT_PERMISSION');
  if(!scopeProof(state,actor,cap,object,now))return denied('CAPABILITY_SCOPE_DEFER_DENY');
 }
 return allowed(capabilities);
}
const clone=v=>structuredClone(v);
const version=(s,kind)=>Number(s.versions?.[kind]||0);
const expectedMatches=(s,command,kind)=>Number.isSafeInteger(command.observedVersion)&&command.observedVersion===version(s,kind);
// Minimal truthful audit projection: only allowlisted governance fields.
// Never dump arbitrary record, password, hash, token, phone, or JSON payload.
const auditState=(s,command)=>{
 const {action,targetId}=command;
 if(action==='admin.create'||action==='admin.disable'||action==='admin.bootstrap'){
  const a=one(s.systemAdmins,x=>eq(x.system_admin_id,targetId));
  return a?{system_admin_id:a.system_admin_id,account_status:a.account_status}:null;
 }
 if(action==='credential.disable'){
  const a=one(s.accounts,x=>x.principal_kind==='system_admin'&&eq(x.system_admin_id,targetId));
  return a?{system_admin_id:a.system_admin_id,credential_state:a.credential_state}:null;
 }
 if(['receiving.off','receiving.on','employee.sudden_inactive','employee.planned_disable','employee.rehire','employee.transfer'].includes(action)){
  const e=one(s.employees,x=>eq(x.employee_id,targetId));
  if(!e)return null;
  return {employee_id:e.employee_id,employment_status:e.employment_status,receiving_status:e.receiving_status,
   store_id:e.store_id,owner_assignment_pending:s.ownerAssignmentPending===true,
   revoked_session_count:collection(s.sessions).filter(t=>t.revoked===true&&
    collection(s.accounts).some(a=>eq(a.account_id,t.account_id)&&eq(a.employee_id,targetId))).length};
 }
 if(action==='template.set'){
  const row=one(s.defaults,x=>eq(x.role_id,command.roleId)&&eq(x.permission_id,command.permissionId));
  return row?{role_id:row.role_id,permission_id:row.permission_id,enabled:row.enabled}:null;
 }
 if(action==='override.set'||action==='override.revoke'){
  const row=one(s.overrides,x=>eq(x.employee_id,targetId)&&eq(x.permission_id,command.permissionId));
  return row?{employee_id:row.employee_id,permission_id:row.permission_id,decision:row.decision}:null;
 }
 if(action==='scope.end'){
  const row=one(s.scopes,x=>eq(x.scope_id,targetId));
  return row?{scope_id:row.scope_id,employee_id:row.employee_id,scope_kind:row.scope_kind,
   scope_reference_id:row.scope_reference_id,ended_at:row.ended_at}:null;
 }
 if(action==='handover.item'){
  const row=one(s.handoverItems,x=>x.object_kind===command.objectKind&&eq(x.object_id,targetId));
  return row?{object_kind:row.object_kind,object_id:row.object_id,state:row.state,trusted:row.trusted===true}:null;
 }
 return null;
};
const audit=(s,a,action,target,oldValue,newValue)=>s.audit.push({
 actor_kind:a.kind,actor_id:a.id,action,target,before:oldValue,after:newValue,
 occurred_at:s.now,role_at_time:a.role??null,store_at_time:a.employee?.store_id??null
});
const commit=(s,actor,command,kind,fn)=>{
 if(!expectedMatches(s,command,kind))return {state:s,result:denied('COMMIT_RECHECK_STALE')};
 const before=auditState(s,command);
 const copy=clone(s);const out=fn(copy);
 if(out!==true)return {state:s,result:denied(out)};
 const after=auditState(copy,command);
 if(after===null)return {state:s,result:denied('AUDIT_AFTER_VALUE_MISSING')};
 if(command.simulateAuditFailure===true)return {state:s,result:denied('ATOMIC_AUDIT_FAILURE')};
 audit(copy,actor,command.action,command.targetId??null,before,after);
 copy.versions[kind]=version(s,kind)+1;
 return {state:copy,result:allowed([])};
};
// A-reviewed PDM-02 §5.2: role template configuration belongs exclusively
// to System Admin; injected manager/store-manager grants never change identity.
const trustedAction=(s,actor,command)=>{
 if(command.action==='template.set'&&actor.kind!=='system_admin')return false;
 if(actor.kind==='system_admin')return collection(s.governanceGrants).some(g=>g.kind==='system_admin'&&eq(g.actor_id,actor.id)&&g.action===command.action&&g.active===true);
 if(actor.role==='four_s')return false;
 if(['receiving.off','receiving.on'].includes(command.action)&&eq(command.targetId,actor.id))return true;
 if(!['manager','store_manager'].includes(actor.role))return false;
 const target=one(s.employees,e=>eq(e.employee_id,command.targetId));
 if(!target||!eq(target.store_id,actor.employee.store_id))return false;
 return collection(s.governanceGrants).some(g=>g.kind==='employee'&&eq(g.actor_id,actor.id)&&g.action===command.action&&g.active===true&&eq(g.store_id,target.store_id)&&
   (actor.role==='store_manager'||(g.team_confirmed===true&&g.team_scope_verified===true)));
};
export function govern(state,command){
 if(!isObject(command)||[...unsupportedRequestKeys].some(k=>has(command,k))||!isObject(state)||state.trustedSyntheticFixture!==true)return {state,result:denied('UNTRUSTED_GOVERNANCE')};
 const actor=contextOf(state,command.sessionRef);
 if(!actor)return {state,result:denied('CURRENT_SESSION_OR_ACCOUNT_DENIED')};
 if(!trustedAction(state,actor,command))return {state,result:denied('GOVERNANCE_SCOPE_DENIED')};
 const {action,targetId}=command;
 if(['admin.disable','admin.create','admin.bootstrap','credential.disable'].includes(action)){
  return commit(state,actor,command,'admin',next=>{
   const admins=collection(next.systemAdmins);
   if(action==='admin.bootstrap'){
    if(actor.kind!=='system_admin'||admins.length!==0||next.bootstrapEver===true)return 'BOOTSTRAP_CLOSED';
    // Bootstrap is modeled separately for first-ever provisioning in bootstrapPlan().
    return 'BOOTSTRAP_REQUIRES_ISOLATED_INITIALIZATION';
   }
   if(actor.kind!=='system_admin')return 'ADMIN_ONLY';
   if(action==='admin.create'){
    if(!admins.some(a=>a.account_status==='active'))return 'ACTIVE_ADMIN_REQUIRED';
    if(!id(targetId)||admins.some(a=>eq(a.system_admin_id,targetId)))return 'TARGET_INVALID';
    admins.push({system_admin_id:targetId,account_status:'active'});return true;
   }
   const target=one(admins,a=>eq(a.system_admin_id,targetId));
   if(!target||target.account_status!=='active')return 'TARGET_NOT_ACTIVE';
   // Identity active vs PC credential enabled are separate; neither may
   // leave zero CURRENT effective administrative actors.
   const accounts=collection(next.accounts);
   const effective=admins.filter(a=>a.account_status==='active'&&accounts.some(c=>c.principal_kind==='system_admin'&&eq(c.system_admin_id,a.system_admin_id)&&c.credential_state==='enabled'));
   if(effective.length<=1)return 'LAST_EFFECTIVE_ADMIN_PROTECTED';
   if(action==='admin.disable'){target.account_status='inactive';return true}
   const cred=one(accounts,c=>c.principal_kind==='system_admin'&&eq(c.system_admin_id,targetId));
   if(!cred||cred.credential_state!=='enabled')return 'CREDENTIAL_NOT_ENABLED';
   cred.credential_state='disabled';return true;
  });
 }
 // Only live Mingbang Employee role + trusted, current eligible proof counts.
// A forged four_s eligibility flag never increments the pool.
const eligibleReceivers=s=>collection(s.employees).filter(e=>{
 if(e.employment_status!=='active'||e.receiving_status!=='accepting')return false;
 const role=one(s.roles,r=>eq(r.role_id,e.main_role_id));
 if(!role||!['sales','manager','store_manager'].includes(role.role_code))return false;
 return collection(s.eligibilityProofs).some(p=>eq(p.employee_id,e.employee_id)&&p.trusted===true&&p.eligible===true);
});
const normalPoolDropWouldEmpty=(before,after)=>eligibleReceivers(before).length>0&&eligibleReceivers(after).length===0;
if(['receiving.off','receiving.on','employee.sudden_inactive','employee.planned_disable','employee.rehire','employee.transfer'].includes(action)){
  return commit(state,actor,command,'receiving',next=>{
   const target=one(next.employees,e=>eq(e.employee_id,targetId));
   if(!target)return 'EMPLOYEE_MISSING';
   if(action==='employee.rehire'){
    if(target.employment_status!=='inactive')return 'NOT_INACTIVE';
    target.employment_status='active';target.receiving_status='paused';
    next.overrides=next.overrides.filter(x=>!eq(x.employee_id,targetId));
    next.capabilityScopeProofs=next.capabilityScopeProofs.filter(x=>!eq(x.employee_id,targetId));
    next.sessions.forEach(session=>{const a=one(next.accounts,x=>eq(x.account_id,session.account_id));if(a&&eq(a.employee_id,targetId))session.revoked=true});
    return true;
   }
   if(action==='employee.sudden_inactive'){
    target.employment_status='inactive';target.receiving_status='paused';next.ownerAssignmentPending=true;
    next.sessions.forEach(session=>{const a=one(next.accounts,x=>eq(x.account_id,session.account_id));if(a&&eq(a.employee_id,targetId))session.revoked=true});
    return true;
   }
   if(target.employment_status!=='active')return 'EMPLOYEE_NOT_ACTIVE';
   if(['employee.planned_disable','employee.transfer'].includes(action)){
    if(!Array.isArray(next.responsibilities))return 'RESPONSIBILITY_FACTS_MISSING';
    const pending=next.responsibilities.filter(x=>eq(x.employee_id,targetId)&&x.active===true);
    if(pending.some(x=>!next.handoverItems.some(item=>item.object_kind===x.object_kind&&eq(item.object_id,x.object_id)&&item.state==='completed'&&item.trusted===true)))return 'HANDOVER_REQUIRED';
    if(action==='employee.planned_disable'){
     target.employment_status='inactive';target.receiving_status='paused';
     if(normalPoolDropWouldEmpty(state,next))return 'LAST_ELIGIBLE_RECEIVER_PROTECTED';
    }
    else if(!id(command.newStoreId))return 'TARGET_STORE_UNPROVEN';
    else target.store_id=command.newStoreId;
    next.sessions.forEach(session=>{const a=one(next.accounts,x=>eq(x.account_id,session.account_id));if(a&&eq(a.employee_id,targetId))session.revoked=true});
    return true;
   }
   if(action==='receiving.on'){
    if(!collection(next.eligibilityProofs).some(x=>eq(x.employee_id,targetId)&&x.eligible===true&&x.trusted===true))return 'ELIGIBILITY_DEFER_DENY';
    const targetRole=one(next.roles,r=>eq(r.role_id,target.main_role_id));
    if(!targetRole||!['sales','manager','store_manager'].includes(targetRole.role_code))return 'INELIGIBLE_FOUR_S_OR_UNKNOWN_ROLE';
    target.receiving_status='accepting';return true;
   }
   if(target.receiving_status!=='accepting')return 'NOT_RECEIVING';
   target.receiving_status='paused';
   if(normalPoolDropWouldEmpty(state,next))return 'LAST_ELIGIBLE_RECEIVER_PROTECTED';
   return true;
  });
 }
 if(['override.set','override.revoke','template.set','scope.end','handover.item'].includes(action)){
  return commit(state,actor,command,'policy',next=>{
   if(actor.kind==='employee'&&eq(targetId,actor.id))return 'SELF_PRIVILEGE_CHANGE_DENIED';
   if(action==='handover.item'){
    const item=one(next.handoverItems,x=>x.object_kind===command.objectKind&&eq(x.object_id,targetId));
    if(!item)return 'HANDOVER_OBJECT_NOT_FOUND';
    if(item.state==='completed')return 'HANDOVER_ALREADY_DONE';
    if(command.syntheticDomainSuccess!==true)return 'DOMAIN_UNIT_FAILED';
    item.state='completed';item.trusted=true;return true;
   }
   if(action==='template.set'){
    if(actor.kind!=='system_admin')return 'SYSTEM_ADMIN_TEMPLATE_ONLY';
    const row=one(next.defaults,x=>eq(x.role_id,command.roleId)&&eq(x.permission_id,command.permissionId));
    if(!row)return 'MISSING_TEMPLATE_ROW';
    if(typeof command.enabled!=='boolean')return 'BAD_TEMPLATE_VALUE';
    row.enabled=command.enabled;
    next.roleDefaultHistory.push({role_id:row.role_id,permission_id:row.permission_id,enabled:row.enabled,actor_kind:actor.kind,actor_id:actor.id,occurred_at:next.now});
    return true;
   }
   if(action==='scope.end'){
    const row=one(next.scopes,x=>eq(x.scope_id,targetId));
    if(!row)return 'SCOPE_NOT_FOUND';
    row.ended_at=next.now;
    return true;
   }
   const row=one(next.overrides,x=>eq(x.employee_id,targetId)&&eq(x.permission_id,command.permissionId));
   if(action==='override.revoke'){
    if(!row)return 'OVERRIDE_NOT_FOUND';
    next.overrides=next.overrides.filter(x=>x!==row);
   }else{
    if(!['allow','deny'].includes(command.decision))return 'INVALID_DECISION';
    if(row)row.decision=command.decision;
    else next.overrides.push({employee_id:targetId,permission_id:command.permissionId,decision:command.decision});
   }
   next.overrideHistory.push({employee_id:targetId,permission_id:command.permissionId,decision:action==='override.revoke'?'revoked':command.decision,actor_kind:actor.kind,actor_id:actor.id,occurred_at:next.now});
   return true;
  });
 }
 return {state,result:denied('UNKNOWN_GOVERNANCE_ACTION')};
}
// A first-ever bootstrap is NOT authorized by an already logged-in admin; it
// is a separate install-time singleton proposal with durable historical claim.
export function bootstrapPlan(state,{observedVersion,syntheticInstallerAuthority}){
 if(!state?.trustedSyntheticFixture||!syntheticInstallerAuthority||state.bootstrapEver===true||state.systemAdmins?.length!==0||observedVersion!==version(state,'admin'))return {state,result:denied('BOOTSTRAP_REFUSED')};
 const s=clone(state);s.bootstrapEver=true;s.versions.admin++;s.systemAdmins.push({system_admin_id:'1',account_status:'active',bootstrap_origin:'first_install'});
 s.audit.push({actor_kind:'system',action:'admin.bootstrap',before:null,after:{system_admin_id:'1',account_status:'active',bootstrap_origin:'first_install'},occurred_at:s.now});return {state:s,result:allowed([])};
}
