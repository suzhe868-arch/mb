// SG02: restricted CI-only trust facts. No HTTP, customer owner or manager write delegation.
import {verify} from './migration.mjs';
const result=(code,allowed=false)=>Object.freeze({code,allowed});
const valid=n=>Number.isSafeInteger(n)&&n>0;
const role=r=>['sales','manager','store_head'].includes(r);
const shape=(p,keys)=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')===keys;
const checkpoint=fn=>fn===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof fn==='function');
async function guard(auth){const c=await auth.pool.connect();try{await verify(c)}finally{c.release()}}
async function actorFacts(c,a){
 return (await c.query("SELECT a.account_id::text id,a.principal_kind,a.employee_id::text employee_id,a.system_admin_id::text admin_id,a.credential_state,a.force_password_change,e.employment_status,r.role_code,sa.account_status admin_status FROM public.pc_login_accounts a LEFT JOIN public.employees e ON e.employee_id=a.employee_id LEFT JOIN public.roles r ON r.role_id=e.main_role_id LEFT JOIN public.system_admins sa ON sa.system_admin_id=a.system_admin_id WHERE a.account_id=$1",[a.account_id])).rows[0];
}
export async function setTeamMembership(auth,token,p,{testCheckpoint}={}){
 if(!shape(p,'action,employeeId,teamId')||!valid(p.employeeId)||!valid(p.teamId)||!['join','end'].includes(p.action)||!checkpoint(testCheckpoint))return result('TEAM_INPUT_DENY');
 for(let retry=0;retry<4;retry++){
  try{
   await guard(auth);
   const out=await auth.withSession(token,async(c,a,s)=>{
    if(s.restricted||a.principal_kind!=='system_admin'||a.employee_id!==null||a.system_admin_id===null)return result('TEAM_ADMIN_SESSION_DENY');
    const self=await actorFacts(c,a);
    if(!self||self.id!==String(a.account_id)||self.principal_kind!=='system_admin'||self.employee_id!==null||self.admin_id!==String(a.system_admin_id)||self.credential_state!=='enabled'||self.force_password_change!==false||self.admin_status!=='active')return result('TEAM_ADMIN_CURRENT_DENY');
    await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
    const team=(await c.query("SELECT team_id,team_status,membership_version FROM public.teams WHERE team_id=$1 FOR UPDATE",[p.teamId])).rows[0];
    if(!team||team.team_status!=='active')return result('TEAM_INACTIVE_OR_MISSING');
    const target=(await c.query("SELECT e.employee_id,e.employment_status,r.role_code FROM public.employees e LEFT JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1 FOR UPDATE OF e",[p.employeeId])).rows[0];
    if(!target||target.employment_status!=='active'||!role(target.role_code))return result('TEAM_TARGET_NOT_EMPLOYEE');
    const history=(await c.query('SELECT membership_id,valid_from,ended_at FROM public.employee_team_memberships WHERE team_id=$1 AND employee_id=$2 ORDER BY valid_from,membership_id FOR UPDATE',[p.teamId,p.employeeId])).rows;
    const now=(await c.query('SELECT transaction_timestamp() AS ts')).rows[0].ts;
    const active=history.filter(x=>x.valid_from<=now&&(x.ended_at===null||x.ended_at>now));
    if(active.length>1)return result('TEAM_OVERLAPPING_MEMBERS_DENY');
    if(p.action==='join'){
      if(active.length===1)return result('TEAM_NOOP');
      if(history.some(x=>x.ended_at===null||x.ended_at>now))return result('TEAM_FUTURE_OVERLAP_DENY');
      await c.query('INSERT INTO public.employee_team_memberships(team_id,employee_id,valid_from,changed_by_system_admin_id) VALUES($1,$2,transaction_timestamp(),$3)',[p.teamId,p.employeeId,a.system_admin_id]);
    }else{
      if(active.length===0)return result('TEAM_NOOP');
      await c.query('UPDATE public.employee_team_memberships SET ended_at=transaction_timestamp() WHERE membership_id=$1',[active[0].membership_id]);
    }
    if(testCheckpoint)await testCheckpoint('after_current',c);
    const rows=(await c.query('SELECT membership_id,valid_from,ended_at FROM public.employee_team_memberships WHERE team_id=$1 AND employee_id=$2 ORDER BY valid_from,membership_id',[p.teamId,p.employeeId])).rows;
    for(let i=1;i<rows.length;i++)if(rows[i-1].ended_at===null||rows[i-1].ended_at>rows[i].valid_from)throw Error('TEAM_INTERVAL_OVERLAP_ABORT');
    const live=rows.filter(x=>x.valid_from<=now&&(x.ended_at===null||x.ended_at>now));
    if(live.length!==(p.action==='join'?1:0))throw Error('TEAM_MEMBERSHIP_COMMIT_DENY');
    if(testCheckpoint)await testCheckpoint('after_check',c);
    const before={team_id:p.teamId,employee_id:p.employeeId,current:active.length===1,version:Number(team.membership_version)};
    const after={team_id:p.teamId,employee_id:p.employeeId,current:p.action==='join',version:Number(team.membership_version)+1};
    await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('system_admin',$1,$2::jsonb,'team_membership',$3,$4,$5::jsonb,$6::jsonb,transaction_timestamp())",[String(a.system_admin_id),JSON.stringify({principal_kind:'system_admin',employee_delegate:false}),String(p.teamId)+':'+String(p.employeeId),'team.membership.'+p.action,JSON.stringify(before),JSON.stringify(after)]);
    if(testCheckpoint)await testCheckpoint('after_audit',c);
    await c.query('UPDATE public.teams SET membership_version=membership_version+1 WHERE team_id=$1',[p.teamId]);
    if(testCheckpoint)await testCheckpoint('before_commit',c);
    return result(p.action==='join'?'TEAM_JOINED':'TEAM_ENDED',true);
   },{normalOnly:true});
   return out??result('TEAM_SESSION_DENY');
  }catch(e){
   if(['40P01','40001'].includes(e.code)&&retry<3)continue;
   if(/^TEAM_INTERVAL_|^TEAM_MEMBERSHIP_COMMIT/.test(e.message))return result(e.message);
   throw e;
  }
 }
 return result('TEAM_RETRY_EXHAUSTED');
}
// Read-only evidence, not a manager write capability; SG07 must revalidate in a later real write.
export async function canManageTargetTeamScope(auth,token,p){
 if(!shape(p,'capability,employeeId,teamId')||!valid(p.employeeId)||!valid(p.teamId)||p.capability!=='employee.manage')return result('TEAM_PROOF_INPUT_DENY');
 await guard(auth);
 const out=await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null)return result('TEAM_MANAGER_SESSION_DENY');
  const self=await actorFacts(c,a);
  if(!self||self.id!==String(a.account_id)||self.principal_kind!=='employee'||self.admin_id!==null||self.employee_id!==String(a.employee_id)||self.credential_state!=='enabled'||self.force_password_change!==false||self.employment_status!=='active'||self.role_code!=='manager')return result('TEAM_MANAGER_CURRENT_DENY');
  const rows=(await c.query("SELECT t.team_status,st.status store_status,e.employment_status target_status,r.role_code target_role,p.permission_id,o.decision personal_decision,d.enabled role_enabled, EXISTS(SELECT 1 FROM public.employee_team_memberships m WHERE m.team_id=t.team_id AND m.employee_id=$1 AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp())) manager_member, EXISTS(SELECT 1 FROM public.employee_team_memberships m WHERE m.team_id=t.team_id AND m.employee_id=$2 AND m.valid_from<=statement_timestamp() AND (m.ended_at IS NULL OR m.ended_at>statement_timestamp())) target_member, EXISTS(SELECT 1 FROM public.employee_data_scopes sc JOIN public.employee_capability_scope_bindings b ON b.scope_id=sc.scope_id AND b.employee_id=sc.employee_id AND b.permission_id=p.permission_id WHERE sc.employee_id=$1 AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND b.granted_at<=statement_timestamp() AND (b.ended_at IS NULL OR b.ended_at>statement_timestamp())) exact_scope FROM public.teams t JOIN public.stores st ON st.store_id=t.store_id JOIN public.employees e ON e.employee_id=$2 JOIN public.roles r ON r.role_id=e.main_role_id LEFT JOIN public.permissions p ON p.permission_code=$3 LEFT JOIN public.employee_permission_overrides o ON o.employee_id=$1 AND o.permission_id=p.permission_id LEFT JOIN public.role_permission_defaults d ON d.role_id=$4 AND d.permission_id=p.permission_id WHERE t.team_id=$5",[a.employee_id,p.employeeId,p.capability,a.main_role_id,p.teamId])).rows;
  if(rows.length!==1)return result('TEAM_TARGET_OR_TEAM_NOT_FOUND');
  const x=rows[0];
  if(x.team_status!=='active'||x.store_status!=='active'||x.target_status!=='active'||!role(x.target_role))return result('TEAM_TARGET_OR_STORE_INACTIVE');
  if(!x.manager_member||!x.target_member)return result('TEAM_MEMBERSHIP_NOT_CURRENT');
  if(x.permission_id==null||x.personal_decision==='deny'||(x.personal_decision!=='allow'&&x.role_enabled!==true))return result('TEAM_MANAGER_CAPABILITY_DENY');
  if(x.exact_scope!==true)return result('TEAM_EXACT_CAPABILITY_SCOPE_DENY');
  return result('TEAM_SCOPE_PROVEN_READ_ONLY',true);
 },{normalOnly:true});
 return out??result('TEAM_SESSION_DENY');
}
