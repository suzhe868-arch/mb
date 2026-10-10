// F03-G2/G3 isolated synthetic PG16 governance; no production routes.
import {verify} from './migration.mjs';
const out=(code,ok=false,extra={})=>Object.freeze({code,ok,...extra,productionAuthorized:false});
const valid=x=>Number.isSafeInteger(x)&&x>0;
const ci=()=>{if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('G_CI_ONLY')};
async function guard(c,a,team,employee){
 const target=(await c.query('SELECT r.role_code FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id WHERE e.employee_id=$1',[employee])).rows[0];
 if(!target||!['sales','manager','store_head'].includes(target.role_code)||a.role_code==='store_head'&&target.role_code!=='sales')return false;
 const q=await c.query("SELECT EXISTS(SELECT 1 FROM public.employees mgr JOIN public.roles role ON role.role_id=mgr.main_role_id JOIN public.permissions p ON p.permission_code='employee.manage' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=mgr.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=mgr.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=mgr.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=mgr.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships me ON me.team_id=t.team_id AND me.employee_id=$3 JOIN public.employee_team_memberships mm ON mm.team_id=t.team_id AND mm.employee_id=mgr.employee_id WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND role.role_code IN('manager','store_head') AND (role.role_code='manager' OR mgr.store_id=t.store_id) AND t.team_status='active' AND st.status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>clock_timestamp()) AND (cb.ended_at IS NULL OR cb.ended_at>clock_timestamp()) AND cb.granted_at<=clock_timestamp() AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=clock_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>clock_timestamp()) AND me.valid_from<=clock_timestamp() AND (me.ended_at IS NULL OR me.ended_at>clock_timestamp())) ok",[a.employee_id,team,employee]);
 return q.rows[0]?.ok===true;
}
async function unowned(c,emp){
 const entries=[
 ['customers','current_owner_employee_id',"account_status='active'"],
 ['demands','responsible_employee_id',"demand_state IN ('active','paused')"],
 ['consultations','assignee_employee_id',"status IN ('pending','processing')"],
 ['waitlists','responsible_employee_id','ended_at IS NULL'],
 ['locks','responsible_employee_id',"lock_status='active' AND expires_at>clock_timestamp()"],
 ['transactions','responsible_employee_id',"status='in_progress'"]
 ];
 for(const [t,col,filter] of entries){const n=(await c.query('SELECT count(*)::int n FROM public.'+t+' WHERE '+col+'=$1 AND '+filter,[emp])).rows[0].n;if(n>0)return false}
 const pending=(await c.query("SELECT count(*)::int n FROM public.refund_cases WHERE status='pending' AND customer_id IN(SELECT customer_id FROM public.customers WHERE current_owner_employee_id=$1)",[emp])).rows[0].n;
 return pending===0;
}
async function audit(c,a,emp,action,before,after,reason){
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES($1,$2,$3::jsonb,'employee',$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp())",[a.principal_kind==='system_admin'?'system_admin':'employee',String(a.principal_kind==='system_admin'?a.system_admin_id:a.employee_id),JSON.stringify({scope:'F03_G_CI_ONLY',reason}),String(emp),action,JSON.stringify(before),JSON.stringify(after)]);
}
async function withUser(auth,token,fn){
 ci();const probe=await auth.pool.connect();try{await verify(probe)}finally{probe.release()}
 try{return await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.credential_state!=='enabled'||a.force_password_change!==false||a.subject_status!=='active')return out('G_GOV_SESSION_DENY');
  await c.query("SET LOCAL lock_timeout='1200ms'");
  await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
  await c.query('SELECT pg_advisory_xact_lock(20261010,309)');
  return fn(c,a);
 },{normalOnly:true})??out('G_GOV_SESSION_DENY')}
 catch(e){if(['55P03','40P01','40001','57014'].includes(e.code)||e.message==='G_GOV_FINAL_ROLLBACK')return out('G_GOV_RETRY_DENY');throw e}
}
async function revokeAll(c,emp){
 // Stop live sessions before personnel actions become externally observable.
 const x=await c.query("SELECT account_id FROM public.pc_login_accounts WHERE principal_kind='employee' AND employee_id=$1 FOR UPDATE",[emp]);
 for(const a of x.rows){
  await c.query("UPDATE public.pc_login_accounts SET credential_state='disabled',credential_epoch=credential_epoch+1,updated_at=transaction_timestamp() WHERE account_id=$1",[a.account_id]);
  await c.query("UPDATE public.pc_auth_sessions SET revoked_at=COALESCE(revoked_at,transaction_timestamp()) WHERE account_id=$1",[a.account_id]);
 }
 await c.query("UPDATE public.employee_data_scopes SET ended_at=COALESCE(ended_at,transaction_timestamp()) WHERE employee_id=$1 AND (ended_at IS NULL OR ended_at>transaction_timestamp())",[emp]);
 await c.query("UPDATE public.employee_capability_scope_bindings SET ended_at=GREATEST(granted_at,LEAST(COALESCE(ended_at,transaction_timestamp()),transaction_timestamp())) WHERE employee_id=$1 AND (ended_at IS NULL OR ended_at>transaction_timestamp())",[emp]);
 await c.query("UPDATE public.employee_team_memberships SET ended_at=GREATEST(valid_from+interval '1 microsecond',transaction_timestamp()) WHERE employee_id=$1 AND (ended_at IS NULL OR ended_at>transaction_timestamp())",[emp]);
}
async function lastReceiver(c,emp){
 const n=(await c.query("SELECT count(*)::int n FROM public.employees e JOIN public.employee_receiving_eligibility x ON x.employee_id=e.employee_id WHERE e.employee_id<>$1 AND e.employment_status='active' AND e.receiving_status='receiving' AND x.eligible=true",[emp])).rows[0].n;
 return n>0;
}
// Planned governance can change employee only after SG06 batch was truly
// committed; simple receipt existence or passed-in flag never suffices.
export async function commitPlannedGovernance(auth,token,p,opts={}){
 if(!p||Object.keys(p).sort().join(',')!=='action,batchId,employeeId,teamId'||!['planned_disable','planned_downgrade','planned_transfer'].includes(p.action)||![p.batchId,p.employeeId,p.teamId].every(valid)||Object.keys(opts).some(k=>k!=='testCheckpoint')||opts.testCheckpoint!==undefined&&!(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof opts.testCheckpoint==='function'))return out('G_GOV_INPUT_DENY');
 return withUser(auth,token,async(c,a)=>{
  if(a.principal_kind!=='employee'||a.system_admin_id!==null||a.employee_id===p.employeeId)return out('G_GOV_ROLE_DENY');
  const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1 FOR UPDATE',[p.batchId])).rows[0];
  const e=(await c.query('SELECT * FROM public.employees WHERE employee_id=$1 FOR UPDATE',[p.employeeId])).rows[0];
  if(!b||!e||b.status!=='completed'||b.change_kind!==p.action||String(b.source_employee_id)!==String(p.employeeId)||e.employment_status!=='active'||!await guard(c,a,p.teamId,p.employeeId)||!await unowned(c,p.employeeId))return out('G_PLANNED_NOT_CERTIFIED');
  const pending=(await c.query("SELECT count(*)::int n FROM public.handover_items WHERE batch_id=$1 AND status<>'completed'",[p.batchId])).rows[0].n;
  if(pending>0)return out('G_PLANNED_PENDING_ITEM');
  if(p.action==='planned_transfer')return out('G_PLANNED_TRANSFER_REQUIRES_APPROVED_MEMBERSHIP_ACTOR');
  if(e.receiving_status==='receiving'&&!await lastReceiver(c,p.employeeId))return out('G_LAST_RECEIVER_DENY');
  if(opts.testCheckpoint)await opts.testCheckpoint('before_revoke',c);
  await revokeAll(c,p.employeeId);
  await c.query("UPDATE public.employees SET receiving_status='paused' WHERE employee_id=$1",[p.employeeId]);
  if(p.action==='planned_disable')await c.query("UPDATE public.employees SET employment_status='inactive' WHERE employee_id=$1",[p.employeeId]);
  else{
   const sales=(await c.query("SELECT role_id FROM public.roles WHERE role_code='sales'")).rows[0];
   if(!sales)throw Error('G_GOV_FINAL_ROLLBACK');
   await c.query("UPDATE public.employees SET main_role_id=$2 WHERE employee_id=$1",[p.employeeId,sales.role_id]);
  }
  await audit(c,a,p.employeeId,'sg06.governance.'+p.action,{employment:e.employment_status,roleId:e.main_role_id,receiving:e.receiving_status},{employment:p.action==='planned_disable'?'inactive':'active',receiving:'paused'},'SG06_FINISHED_SCOPE_CHECK');
  if(opts.testCheckpoint)await opts.testCheckpoint('before_commit',c);
  if(!await unowned(c,p.employeeId))throw Error('G_GOV_FINAL_ROLLBACK');
  return out('G_PLANNED_APPLIED',true,{employeeId:p.employeeId,oldSessionsRevoked:true});
 });
}
// Emergency deactivation must revoke authority even if SG06 still has pending
// items and active financial liabilities; those liabilities remain pending.
export async function deactivateSuddenInactive(auth,token,p,opts={}){
 if(!p||Object.keys(p).sort().join(',')!=='employeeId,reason,teamId'||![p.employeeId,p.teamId].every(valid)||typeof p.reason!=='string'||p.reason.length<8||p.reason.length>160||Object.keys(opts).some(k=>k!=='testCheckpoint')||opts.testCheckpoint!==undefined&&!(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof opts.testCheckpoint==='function'))return out('G_SUDDEN_INPUT_DENY');
 return withUser(auth,token,async(c,a)=>{
  if(a.principal_kind!=='employee'||a.system_admin_id!==null||a.employee_id===p.employeeId||!await guard(c,a,p.teamId,p.employeeId))return out('G_SUDDEN_SCOPE_DENY');
  const e=(await c.query('SELECT * FROM public.employees WHERE employee_id=$1 FOR UPDATE',[p.employeeId])).rows[0];
  if(!e||e.employment_status!=='active')return out('G_SUDDEN_NOT_ACTIVE');
  await revokeAll(c,p.employeeId);
  await c.query("UPDATE public.employees SET employment_status='inactive',receiving_status='paused' WHERE employee_id=$1",[p.employeeId]);
  if(opts.testCheckpoint)await opts.testCheckpoint('after_disable',c);
  await audit(c,a,p.employeeId,'sg06.sudden.inactive',{employment:'active',receiving:e.receiving_status},{employment:'inactive',receiving:'paused'},p.reason);
  if(opts.testCheckpoint)await opts.testCheckpoint('before_commit',c);
  return out('G_SUDDEN_DISABLED',true,{pendingHandoverUnchanged:true,previousSessionsPermanentlyRevoked:true});
 });
}
export async function restoreEmployeeSafely(auth,token,p){
 if(!p||Object.keys(p).sort().join(',')!=='employeeId,reason'||!valid(p.employeeId)||typeof p.reason!=='string'||p.reason.length<8)return out('G_RESTORE_INPUT_DENY');
 return withUser(auth,token,async(c,a)=>{
  if(a.principal_kind!=='system_admin'||a.employee_id!==null||!valid(a.system_admin_id))return out('G_RESTORE_CONTROL_PLANE_DENY');
  const admin=(await c.query('SELECT account_status FROM public.system_admins WHERE system_admin_id=$1 FOR SHARE',[a.system_admin_id])).rows[0];
  if(!admin||admin.account_status!=='active')return out('G_RESTORE_ADMIN_INVALID');
  const e=(await c.query('SELECT * FROM public.employees WHERE employee_id=$1 FOR UPDATE',[p.employeeId])).rows[0];
  if(!e||e.employment_status!=='inactive'||e.receiving_status!=='paused')return out('G_RESTORE_INVALID_TARGET');
  const accounts=(await c.query("SELECT account_id,credential_state FROM public.pc_login_accounts WHERE principal_kind='employee' AND employee_id=$1 FOR UPDATE",[p.employeeId])).rows;
  if(accounts.some(x=>x.credential_state!=='disabled'))return out('G_RESTORE_CREDS_NOT_REVOKED');
  const active=(await c.query("SELECT count(*)::int n FROM public.pc_auth_sessions s JOIN public.pc_login_accounts a ON a.account_id=s.account_id WHERE a.employee_id=$1 AND s.revoked_at IS NULL",[p.employeeId])).rows[0].n;
  if(active!==0)return out('G_RESTORE_SESSION_NOT_REVOKED');
  await c.query("UPDATE public.employees SET employment_status='active' WHERE employee_id=$1",[p.employeeId]);
  await audit(c,a,p.employeeId,'sg06.restore.active',{employment:'inactive'},{employment:'active',credentialsRemainDisabled:true,receivingRemainsPaused:true,permissionsNotRegranted:true},p.reason);
  return out('G_RESTORE_ONLY',true,{sessionsRestored:false,permissionsRestored:false,receivingRestored:false});
 });
}
