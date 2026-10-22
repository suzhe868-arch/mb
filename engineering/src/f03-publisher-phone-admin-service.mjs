// Issue #221: isolated, same-PG16 System Admin control plane.
// Every read/write is executed within the EXISTING F03 withSession transaction.
import {createHash} from 'node:crypto';

const CAP='publisher.phone.sensitive';
const S='f03_publisher_phone_admin_test';
const ROLES=new Set(['sales','manager','store_manager']);
const MODES=new Set(['LOCKED_ONLY','ALL_ACTIVE_JYT']);
const result=(status,code,extra={})=>({status,code,...extra});
const validId=x=>typeof x==='string'&&/^[1-9][0-9]{0,17}$/.test(x)&&Number.isSafeInteger(Number(x));
const validVersion=x=>Number.isSafeInteger(x)&&x>=0;
const asNumber=x=>Number(x);
const adminAllowed=(a,s)=>s&&!s.restricted&&a.principal_kind==='system_admin'&&a.system_admin_id!=null&&a.employee_id==null&&a.credential_state==='enabled'&&a.subject_status==='active'&&a.force_password_change===false;
async function ensureAdminCurrent(c,a,s) {
 if(!adminAllowed(a,s))return false;
 // Lock live system-admin fact in the same F03 transaction. The F03 auth
 // account lock alone does not lock the joined system_admins row.
 const q=await c.query('SELECT account_status FROM public.system_admins WHERE system_admin_id=$1::bigint FOR SHARE',[a.system_admin_id]);
 return q.rowCount===1&&q.rows[0].account_status==='active';
}
function validateInput(method,input){
 const keys=input&&typeof input==='object'&&!Array.isArray(input)?Object.keys(input).sort().join('|'):'';
 const expected=method==='PUT'?'expectedVersion|requestKey|scopeMode':'expectedVersion|requestKey';
 if(keys!==expected||!validVersion(input.expectedVersion)||typeof input.requestKey!=='string'||!/^[A-Za-z0-9_-]{12,80}$/.test(input.requestKey)||(method==='PUT'&&!MODES.has(input.scopeMode)))return false;
 return true;
}
async function targetFacts(c,employeeId) {
 const q=await c.query(
  "SELECT e.employee_id::text AS employee_id,e.employment_status,e.store_id,r.role_code,st.status AS store_status, "+
  "a.credential_state AS account_state,a.force_password_change "+
  "FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
  "LEFT JOIN public.stores st ON st.store_id=e.store_id "+
  "JOIN public.pc_login_accounts a ON a.principal_kind='employee' AND a.employee_id=e.employee_id "+
  "WHERE e.employee_id=$1::bigint ORDER BY a.account_id LIMIT 1 FOR UPDATE OF e,a",
  [employeeId]);
 return q.rows[0]??null;
}
const eligible=t=>t?.employment_status==='active'&&ROLES.has(t.role_code)&&t.role_code!=='four_s'&&t.store_status==='active'&&t.account_state==='enabled'&&t.force_password_change===false;
async function permissionId(c){
 const row=await c.query("SELECT permission_id::text FROM public.permissions WHERE permission_code=$1",[CAP]);
 if(row.rowCount!==1)return null;
 return row.rows[0].permission_id;
}
async function modeRow(c,employeeId) {
 const rows=await c.query(
  'SELECT scope_mode,enabled,version,updated_at,previous_decision,previous_decision_captured FROM '+S+'.employee_mode WHERE employee_id=$1::bigint FOR UPDATE',
  [employeeId]);
 return rows.rows[0]??null;
}
async function state(c,employeeId,permission,mode) {
 const x=await c.query(
  "SELECT (SELECT decision FROM public.employee_permission_overrides "+
  "WHERE employee_id=$1::bigint AND permission_id=$2::bigint) AS decision, "+
  "EXISTS(SELECT 1 FROM public.employee_capability_scope_bindings b "+
  "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=b.employee_id "+
  "WHERE b.employee_id=$1::bigint AND b.permission_id=$2::bigint "+
  "AND s.ended_at IS NULL AND s.scope_kind='publisher_phone_special' "+
  "AND s.scope_reference_id=$1::bigint AND b.granted_at<=transaction_timestamp() "+
  "AND (b.ended_at IS NULL OR b.ended_at>transaction_timestamp())) AS bound",
  [employeeId,permission]);
 const val=x.rows[0];
 return {decision:val.decision,bound:val.bound===true,enabled:mode?.enabled===true&&val.decision==='allow'&&val.bound===true};
}
function publicDto(employeeId,target,mode,permission){
 return {employeeId,active:target.employment_status==='active',role:target.role_code,configurable:eligible(target)&&Boolean(permission),enabled:mode?.enabled===true,scopeMode:mode?.enabled===true?mode.scope_mode:null,version:asNumber(mode?.version??0),updatedAt:mode?.updated_at??null,origin:'CI_ONLY_F03_PERMISSION_CONFIG'};
}
export class PublisherPhoneAdminService {
 constructor(auth,{hook=null}={}){this.auth=auth;this.hook=hook}
 async get({token,employeeId}) {
  if(!validId(employeeId))return result(400,'INVALID_EMPLOYEE_ID');
  const out=await this.auth.withSession(token,async(c,actor,session)=>{
   if(!await ensureAdminCurrent(c,actor,session))return result(403,'SYSTEM_ADMIN_CONTROL_REQUIRED');
   const target=await targetFacts(c,employeeId);
   if(!target)return result(404,'TARGET_NOT_FOUND');
   const permission=await permissionId(c);
   const mode=await modeRow(c,employeeId);
   const grants=permission?await state(c,employeeId,permission,mode):null;
   return result(200,'PHONE_ADMIN_CURRENT',publicDto(employeeId,target,{...mode,enabled:eligible(target)&&grants?.enabled===true},permission));
  },{normalOnly:true});
  return out??result(401,'SESSION_INVALID');
 }
 async change({token,employeeId,method,input}) {
  if(!validId(employeeId))return result(400,'INVALID_EMPLOYEE_ID');
  if(!['PUT','DELETE'].includes(method)||!validateInput(method,input))return result(400,'INVALID_PHONE_ADMIN_REQUEST');
  const digest=createHash('sha256').update(JSON.stringify({employeeId,method,input})).digest('hex');
  const out=await this.auth.withSession(token,async(c,actor,session)=>{
   if(!await ensureAdminCurrent(c,actor,session))return result(403,'SYSTEM_ADMIN_CONTROL_REQUIRED');
   const t=await targetFacts(c,employeeId);
   if(!t)return result(404,'TARGET_NOT_FOUND');
   if(!eligible(t))return result(403,'TARGET_NOT_ELIGIBLE');
   const permission=await permissionId(c);
   if(!permission)return result(403,'CAPABILITY_SOURCE_GAP');
   // Target row FOR UPDATE serializes two independent System Admin sessions.
   // Replay still checks CURRENT facts and never returns an obsolete grant.
   const beforeMode=await modeRow(c,employeeId);
   const oldState=await state(c,employeeId,permission,beforeMode);
   const oldVersion=asNumber(beforeMode?.version??0);
   const previousDecision=beforeMode?.enabled===true&&beforeMode.previous_decision_captured===true
    ? beforeMode.previous_decision : (oldState.decision??null);
   const replay=await c.query('SELECT request_digest,actor_system_admin_id::text actor_id,employee_id::text employee_id,resulting_version,response_json FROM '+S+'.request_replay WHERE request_key=$1 FOR UPDATE',[input.requestKey]);
   if(replay.rowCount){
    const prior=replay.rows[0];
    if(prior.request_digest!==digest||prior.actor_id!==String(actor.system_admin_id)||prior.employee_id!==employeeId)return result(409,'REQUEST_KEY_CONFLICT');
    if(oldVersion!==Number(prior.resulting_version)||(oldState.enabled!==prior.response_json.enabled||(oldState.enabled&&beforeMode?.scope_mode!==prior.response_json.scopeMode)))return result(409,'REPLAY_STALE');
    return result(200,'IDEMPOTENT_REPLAY',prior.response_json);
   }
   if(oldVersion!==input.expectedVersion)return result(409,'VERSION_CONFLICT',{version:oldVersion});
   if(oldState.decision==='deny'&&method==='PUT')return result(403,'CURRENT_PERSONAL_DENY');
   // Do not mutate the old SQL schema. All public modifications are legal DML.
   await c.query("UPDATE public.employee_capability_scope_bindings SET ended_at=transaction_timestamp() WHERE employee_id=$1::bigint AND permission_id=$2::bigint AND ended_at IS NULL AND scope_id IN (SELECT scope_id FROM public.employee_data_scopes WHERE employee_id=$1::bigint AND scope_kind='publisher_phone_special' AND scope_reference_id=$1::bigint AND ended_at IS NULL)",[employeeId,permission]);
   await c.query("UPDATE public.employee_data_scopes SET ended_at=transaction_timestamp() WHERE employee_id=$1::bigint AND scope_kind='publisher_phone_special' AND scope_reference_id=$1::bigint AND ended_at IS NULL",[employeeId]);
   if(method==='PUT'){
    const scope=await c.query("INSERT INTO public.employee_data_scopes(employee_id,scope_kind,scope_reference_id,ended_at) VALUES($1::bigint,'publisher_phone_special',$1::bigint,NULL) RETURNING scope_id::text",[employeeId]);
    await c.query("INSERT INTO public.employee_capability_scope_bindings(employee_id,permission_id,scope_id,granted_at,ended_at) VALUES($1::bigint,$2::bigint,$3::bigint,transaction_timestamp(),NULL)",[employeeId,permission,scope.rows[0].scope_id]);
    if(this.hook)await this.hook({c,employeeId,method,phase:'before_override_write'});
    // Never overwrite a deny that was committed after state() read it. If a
    // concurrent transaction wins the row, the conditional upsert returns no
    // row and this transaction is rolled back by withSession.
    const override=await c.query(
     "INSERT INTO public.employee_permission_overrides AS current_override(employee_id,permission_id,decision,changed_at) VALUES($1::bigint,$2::bigint,'allow',transaction_timestamp()) "+
     "ON CONFLICT(employee_id,permission_id) DO UPDATE SET decision='allow',changed_at=transaction_timestamp() "+
     "WHERE current_override.decision IS DISTINCT FROM 'deny' RETURNING decision",
     [employeeId,permission]);
    if(override.rowCount!==1)throw Error('PERSONAL_DENY_RACE');
   }else if(beforeMode?.enabled===true&&oldState.decision==='allow'){
    // The mode's active grant is ours. Restore its captured baseline only while
    // the current value remains allow; a concurrently committed deny wins.
    if(previousDecision==='allow'){
     await c.query("UPDATE public.employee_permission_overrides SET decision='allow',changed_at=transaction_timestamp() WHERE employee_id=$1::bigint AND permission_id=$2::bigint AND decision='allow'",[employeeId,permission]);
    }else if(previousDecision==='deny'){
     await c.query("UPDATE public.employee_permission_overrides SET decision='deny',changed_at=transaction_timestamp() WHERE employee_id=$1::bigint AND permission_id=$2::bigint AND decision='allow'",[employeeId,permission]);
    }else{
     await c.query("DELETE FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint AND decision='allow'",[employeeId,permission]);
    }
   }
   await c.query("INSERT INTO public.employee_permission_override_history(employee_id,permission_id,decision,actor_kind,actor_id) VALUES($1::bigint,$2::bigint,$3,'system_admin',$4::bigint)",[employeeId,permission,method==='PUT'?'allow':'revoked',actor.system_admin_id]);
   const nextVersion=oldVersion+1;
   await c.query('INSERT INTO '+S+'.employee_mode(employee_id,scope_mode,enabled,previous_decision,previous_decision_captured,version,updated_by_system_admin_id,updated_at) VALUES($1::bigint,$2,$3,$4,true,$5,$6::bigint,transaction_timestamp()) ON CONFLICT(employee_id) DO UPDATE SET scope_mode=EXCLUDED.scope_mode,enabled=EXCLUDED.enabled,previous_decision=EXCLUDED.previous_decision,previous_decision_captured=true,version=EXCLUDED.version,updated_by_system_admin_id=EXCLUDED.updated_by_system_admin_id,updated_at=transaction_timestamp()',[employeeId,method==='PUT'?input.scopeMode:null,method==='PUT',previousDecision,nextVersion,actor.system_admin_id]);
   if(this.hook)await this.hook({c,employeeId,method,phase:'before_audit'});
   const finalDecision=(await c.query("SELECT decision FROM public.employee_permission_overrides WHERE employee_id=$1::bigint AND permission_id=$2::bigint",[employeeId,permission])).rows[0]?.decision??null;
   const before={permissionDecision:oldState.decision,scopeMode:beforeMode?.enabled?beforeMode.scope_mode:null,enabled:oldState.enabled,version:oldVersion};
   const after={permissionDecision:finalDecision,scopeMode:method==='PUT'?input.scopeMode:null,enabled:method==='PUT'&&finalDecision==='allow',version:nextVersion};
   await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('system_admin',$1::text,'employee_permission_override',$2::text,$3,$4::jsonb,$5::jsonb,transaction_timestamp())",[String(actor.system_admin_id),employeeId,method==='PUT'?'publisher.phone.scope.grant':'publisher.phone.scope.revoke',JSON.stringify(before),JSON.stringify(after)]);
   const dto={employeeId,enabled:after.enabled,scopeMode:after.scopeMode,version:nextVersion,origin:'CI_ONLY_F03_PERMISSION_CONFIG'};
   await c.query('INSERT INTO '+S+'.request_replay(request_key,request_digest,actor_system_admin_id,employee_id,resulting_version,response_json) VALUES($1,$2,$3::bigint,$4::bigint,$5,$6::jsonb)',[input.requestKey,digest,actor.system_admin_id,employeeId,nextVersion,JSON.stringify(dto)]);
   if(this.hook)await this.hook({c,employeeId,method,phase:'before_commit'});
   return result(200,'PHONE_ADMIN_UPDATED',dto);
  },{normalOnly:true});
  return out??result(401,'SESSION_INVALID');
 }
}
