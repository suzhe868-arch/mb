// SG04 narrow CI-only System Admin governance: no DDL, no manager business writes.
import {verify} from '../runtime-handover-ledger/migration.mjs';

const result=(code,changed=false)=>Object.freeze({code,changed});
const valid=n=>Number.isSafeInteger(n)&&n>0;
const exact=(p,fields)=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')===fields;
const checkpoint=f=>f===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof f==='function');
async function seal(auth){const c=await auth.pool.connect();try{await verify(c)}finally{c.release()}}
async function administrator(c,a){
 if(a.principal_kind!=='system_admin'||a.employee_id!==null||a.system_admin_id==null)return false;
 const q=await c.query("SELECT l.account_id::text aid,l.system_admin_id::text sid,l.principal_kind,l.employee_id,l.credential_state,l.force_password_change,s.account_status FROM public.pc_login_accounts l JOIN public.system_admins s ON s.system_admin_id=l.system_admin_id WHERE l.account_id=$1",[a.account_id]);
 const s=q.rows[0];return !!s&&s.aid===String(a.account_id)&&s.sid===String(a.system_admin_id)&&s.principal_kind==='system_admin'&&s.employee_id===null&&s.credential_state==='enabled'&&s.force_password_change===false&&s.account_status==='active';
}
async function target(c,id){
 const q=await c.query("SELECT e.employee_id,e.employment_status,e.store_id,r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR UPDATE OF e",[id]);
 const x=q.rows[0];return x&&x.employment_status==='active'&&x.role_code==='manager'?x:null;
}
async function permission(c){
 const q=await c.query("SELECT permission_id FROM public.permissions WHERE permission_code='employee.manage' FOR SHARE");
 return q.rows.length===1?q.rows[0].permission_id:null;
}
async function audit(c,a,object,id,action,prior,after){
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('system_admin',$1,$2::jsonb,$3,$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp())",
 [String(a.system_admin_id),JSON.stringify({principal_kind:'system_admin',scope:'SG04_CI_ONLY',employee_delegate:false}),object,String(id),action,JSON.stringify(prior),JSON.stringify(after)]);
}
async function unfinished(c,managerId,teamId=null){
 // Ledger never records actual domain success. No potentially last lawful handler downgrade.
 const q=await c.query("SELECT 1 FROM public.handover_batches b WHERE b.initiated_by_kind='employee' AND b.initiated_by_id=$1 AND b.status IN ('collecting','pending_domain_handover','blocked') AND ($2::bigint IS NULL OR EXISTS(SELECT 1 FROM public.employee_team_memberships m WHERE m.employee_id=b.source_employee_id AND m.team_id=$2 AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp()))) LIMIT 1",[managerId,teamId]);
 return q.rowCount>0;
}
async function operate(auth,token,p,shapeFields,fn,opts={}){
 if(!exact(p,shapeFields)||!valid(p.managerEmployeeId)||!checkpoint(opts.testCheckpoint))return result('SG04_INPUT_DENY');
 await seal(auth);
 const r=await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||!await administrator(c,a))return result('SG04_ADMIN_IDENTITY_DENY');
  // Existing SG02 team transactions share this global advisory lock; account/session locked first.
  await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
  const manager=await target(c,p.managerEmployeeId);
  if(!manager)return result('SG04_TARGET_MANAGER_DENY');
  const permissionId=await permission(c);
  if(permissionId===null)return result('SG04_PERMISSION_NOT_FOUND');
  return fn(c,a,manager,permissionId,opts.testCheckpoint);
 },{normalOnly:true});
 return r??result('SG04_SESSION_DENY');
}
const fixtureOnly=process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true';
export async function setManagerPersonalEmployeeManageDecision(auth,token,p,opts){
 if(!exact(p,'decision,managerEmployeeId')||!['allow','deny','revoke'].includes(p.decision))return result('SG04_DECISION_INPUT_DENY');
 return operate(auth,token,p,'decision,managerEmployeeId',async(c,a,manager,permissionId,hook)=>{
  const old=(await c.query('SELECT decision,changed_at FROM public.employee_permission_overrides WHERE employee_id=$1 AND permission_id=$2 FOR UPDATE',[p.managerEmployeeId,permissionId])).rows[0];
  if((p.decision==='revoke'&&!old)||(old?.decision===p.decision))return result('SG04_PERSONAL_NOOP');
  if((p.decision==='deny'||p.decision==='revoke')&&await unfinished(c,p.managerEmployeeId))return result('SG04_HANDOVER_PENDING_DEFER_DENY');
  const before={decision:old?.decision??null,employee_id:p.managerEmployeeId,permission_id:permissionId};
  const after={...before,decision:p.decision==='revoke'?null:p.decision};
  if(p.decision==='revoke')await c.query('DELETE FROM public.employee_permission_overrides WHERE employee_id=$1 AND permission_id=$2',[p.managerEmployeeId,permissionId]);
  else await c.query("INSERT INTO public.employee_permission_overrides(employee_id,permission_id,decision,changed_at) VALUES($1,$2,$3,transaction_timestamp()) ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision=EXCLUDED.decision,changed_at=EXCLUDED.changed_at",[p.managerEmployeeId,permissionId,p.decision]);
  if(hook)await hook('after_current',c);
  await c.query("INSERT INTO public.employee_permission_override_history(employee_id,permission_id,decision,actor_kind,actor_id,occurred_at) VALUES($1,$2,$3,'system_admin',$4,transaction_timestamp())",[p.managerEmployeeId,permissionId,p.decision==='revoke'?'revoked':p.decision,a.system_admin_id]);
  if(hook)await hook('after_history',c);
  await audit(c,a,'employee_permission_override',p.managerEmployeeId,'sg04.employee.manage.personal.'+p.decision,before,after);
  if(hook)await hook('after_audit',c);
  if(hook)await hook('before_commit',c);
  return result('SG04_PERSONAL_UPDATED',true);
 },opts);
}
async function teamFacts(c,employeeId,teamId){
 const team=(await c.query("SELECT t.team_id,t.team_status,t.store_id,s.status store_status FROM public.teams t JOIN public.stores s ON s.store_id=t.store_id WHERE t.team_id=$1 FOR SHARE OF t,s",[teamId])).rows[0];
 if(!team||team.team_status!=='active'||team.store_status!=='active')return false;
 const q=await c.query("SELECT COUNT(DISTINCT team_id)::int n FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 AND valid_from<=statement_timestamp() AND (ended_at IS NULL OR ended_at>statement_timestamp())",[employeeId,teamId]);
 // Also reject duplicate concurrent current rows rather than relying on COUNT DISTINCT.
 const actual=await c.query("SELECT count(*)::int n FROM public.employee_team_memberships WHERE employee_id=$1 AND team_id=$2 AND valid_from<=statement_timestamp() AND (ended_at IS NULL OR ended_at>statement_timestamp())",[employeeId,teamId]);
 return q.rows[0].n===1&&actual.rows[0].n===1;
}
async function currentScopes(c,managerId,teamId){
 return (await c.query("SELECT scope_id,ended_at FROM public.employee_data_scopes WHERE employee_id=$1 AND scope_kind='team' AND scope_reference_id=$2 ORDER BY scope_id FOR UPDATE",[managerId,teamId])).rows;
}
async function activeBinding(c,employeeId,permissionId,scopeId){
 return (await c.query("SELECT granted_at,ended_at FROM public.employee_capability_scope_bindings WHERE employee_id=$1 AND permission_id=$2 AND scope_id=$3 FOR UPDATE",[employeeId,permissionId,scopeId])).rows[0];
}
export async function grantManagerTeamCapabilityScope(auth,token,p,opts){
 if(!exact(p,'managerEmployeeId,teamId')||!valid(p.teamId))return result('SG04_TEAM_INPUT_DENY');
 return operate(auth,token,p,'managerEmployeeId,teamId',async(c,a,manager,permissionId,hook)=>{
  if(!await teamFacts(c,p.managerEmployeeId,p.teamId))return result('SG04_TEAM_MEMBER_DENY');
  const rows=await currentScopes(c,p.managerEmployeeId,p.teamId);
  let active=rows.filter(x=>x.ended_at===null||x.ended_at>new Date());
  if(active.length>1)return result('SG04_DUPLICATE_SCOPE_DENY');
  let scopeId,created=false;
  if(active.length){scopeId=active[0].scope_id;}
  else{
   const r=await c.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id,ended_at) VALUES($1,'team',$2,NULL) RETURNING scope_id",[p.managerEmployeeId,p.teamId]);
   scopeId=r.rows[0].scope_id;created=true;
  }
  const binding=await activeBinding(c,p.managerEmployeeId,permissionId,scopeId);
  if(binding&&(binding.ended_at===null||binding.ended_at>new Date()))return result('SG04_TEAM_GRANT_NOOP');
  if(binding)await c.query('UPDATE public.employee_capability_scope_bindings SET ended_at=NULL,granted_at=transaction_timestamp() WHERE employee_id=$1 AND permission_id=$2 AND scope_id=$3',[p.managerEmployeeId,permissionId,scopeId]);
  else await c.query('INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at) VALUES($1,$2,$3,transaction_timestamp())',[p.managerEmployeeId,permissionId,scopeId]);
  if(hook)await hook('after_current',c);
  const prior={manager_employee_id:p.managerEmployeeId,team_id:p.teamId,permission_id:permissionId,active:false};
  const after={...prior,active:true,scope_id:scopeId,scope_created:created};
  await audit(c,a,'employee_team_capability_scope',p.managerEmployeeId,'sg04.employee.manage.team.grant',prior,after);
  if(hook)await hook('after_audit',c);
  if(hook)await hook('before_commit',c);
  return result('SG04_TEAM_GRANTED',true);
 },opts);
}
export async function endManagerTeamCapabilityScope(auth,token,p,opts){
 if(!exact(p,'managerEmployeeId,teamId')||!valid(p.teamId))return result('SG04_TEAM_INPUT_DENY');
 return operate(auth,token,p,'managerEmployeeId,teamId',async(c,a,manager,permissionId,hook)=>{
  if(!await teamFacts(c,p.managerEmployeeId,p.teamId))return result('SG04_TEAM_MEMBER_DENY');
  const scopes=await currentScopes(c,p.managerEmployeeId,p.teamId);
  const active=scopes.filter(x=>x.ended_at===null||x.ended_at>new Date());
  if(active.length>1)return result('SG04_DUPLICATE_SCOPE_DENY');
  if(active.length===0)return result('SG04_TEAM_END_NOOP');
  const scopeId=active[0].scope_id;
  const binding=await activeBinding(c,p.managerEmployeeId,permissionId,scopeId);
  if(!binding||binding.ended_at!==null&&binding.ended_at<=new Date())return result('SG04_TEAM_END_NOOP');
  if(await unfinished(c,p.managerEmployeeId,p.teamId))return result('SG04_HANDOVER_PENDING_DEFER_DENY');
  await c.query('UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() WHERE employee_id=$1 AND permission_id=$2 AND scope_id=$3',[p.managerEmployeeId,permissionId,scopeId]);
  if(hook)await hook('after_current',c);
  const others=(await c.query("SELECT count(*)::int n FROM public.employee_capability_scope_bindings WHERE scope_id=$1 AND permission_id<>$2 AND (ended_at IS NULL OR ended_at>statement_timestamp())",[scopeId,permissionId])).rows[0].n;
  if(others===0)await c.query('UPDATE public.employee_data_scopes SET ended_at=transaction_timestamp() WHERE scope_id=$1',[scopeId]);
  if(hook)await hook('after_history',c);
  const prior={manager_employee_id:p.managerEmployeeId,team_id:p.teamId,permission_id:permissionId,active:true,scope_id:scopeId};
  const after={...prior,active:false,retained_for_other_capability:others>0};
  await audit(c,a,'employee_team_capability_scope',p.managerEmployeeId,'sg04.employee.manage.team.end',prior,after);
  if(hook)await hook('after_audit',c);
  if(hook)await hook('before_commit',c);
  return result('SG04_TEAM_ENDED',true);
 },opts);
}
const proofResult=(code,allowed=false)=>Object.freeze({code,allowed});
const role=x=>['sales','manager','store_head'].includes(x);
async function actorFacts(c,a){
 return (await c.query("SELECT a.account_id::text id,a.principal_kind,a.employee_id::text employee_id,a.system_admin_id::text admin_id,a.credential_state,a.force_password_change,e.employment_status,e.main_role_id,r.role_code FROM public.pc_login_accounts a LEFT JOIN public.employees e ON e.employee_id=a.employee_id LEFT JOIN public.roles r ON r.role_id=e.main_role_id WHERE a.account_id=$1",[a.account_id])).rows[0];
}
export async function readManagerTeamGovernanceProof(auth,token,p){
 if(!exact(p,'employeeId,managerEmployeeId,teamId')||!valid(p.employeeId)||!valid(p.managerEmployeeId)||!valid(p.teamId))return Object.freeze({code:'SG04_PROOF_INPUT_DENY',allowed:false});
 await seal(auth);
 const out=await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||String(a.employee_id)!==String(p.managerEmployeeId))return proofResult('TEAM_MANAGER_SESSION_DENY');
  const self=await actorFacts(c,a);
  if(!self||self.id!==String(a.account_id)||self.principal_kind!=='employee'||self.admin_id!==null||self.employee_id!==String(a.employee_id)||self.credential_state!=='enabled'||self.force_password_change!==false||self.employment_status!=='active'||self.role_code!=='manager')return proofResult('TEAM_MANAGER_CURRENT_DENY');
  const rows=(await c.query("SELECT t.team_status,st.status store_status,e.employment_status target_status,r.role_code target_role,p.permission_id,o.decision personal_decision,d.enabled role_enabled, EXISTS(SELECT 1 FROM public.employee_team_memberships m WHERE m.team_id=t.team_id AND m.employee_id=$1 AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp())) manager_member, EXISTS(SELECT 1 FROM public.employee_team_memberships m WHERE m.team_id=t.team_id AND m.employee_id=$2 AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp())) target_member, EXISTS(SELECT 1 FROM public.employee_data_scopes sc JOIN public.employee_capability_scope_bindings b ON b.scope_id=sc.scope_id AND b.employee_id=sc.employee_id AND b.permission_id=p.permission_id WHERE sc.employee_id=$1 AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp())) exact_scope FROM public.teams t JOIN public.stores st ON st.store_id=t.store_id JOIN public.employees e ON e.employee_id=$2 JOIN public.roles r ON r.role_id=e.main_role_id LEFT JOIN public.permissions p ON p.permission_code=$3 LEFT JOIN public.employee_permission_overrides o ON o.employee_id=$1 AND o.permission_id=p.permission_id LEFT JOIN public.role_permission_defaults d ON d.role_id=$4 AND d.permission_id=p.permission_id WHERE t.team_id=$5",[a.employee_id,p.employeeId,'employee.manage',self.main_role_id,p.teamId])).rows;
  if(rows.length!==1)return proofResult('TEAM_TARGET_OR_TEAM_NOT_FOUND');
  const x=rows[0];
  if(x.team_status!=='active'||x.store_status!=='active'||x.target_status!=='active'||!role(x.target_role))return proofResult('TEAM_TARGET_OR_STORE_INACTIVE');
  if(!x.manager_member||!x.target_member)return proofResult('TEAM_MEMBERSHIP_NOT_CURRENT');
  if(x.permission_id==null||x.personal_decision==='deny'||(x.personal_decision!=='allow'&&x.role_enabled!==true))return proofResult('TEAM_MANAGER_CAPABILITY_DENY');
  if(x.exact_scope!==true)return proofResult('TEAM_EXACT_CAPABILITY_SCOPE_DENY');
  return proofResult('TEAM_SCOPE_PROVEN_READ_ONLY',true);
 },{normalOnly:true});
 return out??result('TEAM_SESSION_DENY');
}
