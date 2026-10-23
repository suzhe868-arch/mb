import {createHash,randomUUID,sign} from 'node:crypto';
import {CAPABILITY,MODES,ORIGIN,PROTOCOL_VERSION,ISSUER,AUDIENCE,canonicalPayload,validateChallenge} from './protocol.mjs';

const EMPLOYEE_ROLES=new Set(['sales','manager','store_manager']);
const result=(ok,code,extra={})=>({ok,code,...extra});
const hashFacts=facts=>createHash('sha256').update(JSON.stringify(facts),'utf8').digest('hex');

async function readCurrentFacts(c,actor,session,challenge){
 if(!session||session.restricted||actor.principal_kind!=='employee'||
  actor.credential_state!=='enabled'||actor.subject_status!=='active'||
  actor.force_password_change!==false||actor.employee_id==null||actor.system_admin_id!=null)
  return result(false,'CURRENT_EMPLOYEE_SESSION_REQUIRED');
 if(String(actor.employee_id)!==challenge.employeeId)return result(false,'CHALLENGE_EMPLOYEE_MISMATCH');
 const q=await c.query(
  "SELECT e.employee_id::text employee_id,e.employment_status,e.store_id::text store_id,"+
  "e.main_role_id::text main_role_id,r.role_code,a.account_id::text account_id,"+
  "a.credential_state,a.force_password_change,p.permission_id::text permission_id,"+
  "o.decision personal_decision "+
  "FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id "+
  "JOIN public.pc_login_accounts a ON a.account_id=$2::bigint AND a.employee_id=e.employee_id "+
  "LEFT JOIN public.permissions p ON p.permission_code=$3 "+
  "LEFT JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id "+
  "WHERE e.employee_id=$1::bigint FOR SHARE OF e,a",
  [challenge.employeeId,actor.account_id,CAPABILITY]);
 if(q.rowCount!==1)return result(false,'CURRENT_EMPLOYEE_NOT_FOUND');
 const row=q.rows[0];
 if(row.employment_status!=='active'||row.credential_state!=='enabled'||row.force_password_change!==false)
  return result(false,'CURRENT_EMPLOYEE_NOT_ACTIVE');
 if(!EMPLOYEE_ROLES.has(row.role_code))return result(false,row.role_code==='four_s'?'FOUR_S_HARD_DENY':'EMPLOYEE_ROLE_DENIED');
 if(!row.store_id)return result(false,'CURRENT_STORE_REQUIRED');
 const store=await c.query('SELECT status FROM public.stores WHERE store_id=$1::bigint FOR SHARE',[row.store_id]);
 if(store.rowCount!==1||store.rows[0].status!=='active')return result(false,'CURRENT_STORE_NOT_ACTIVE');
 if(!row.permission_id)return result(false,'CAPABILITY_SOURCE_GAP');
 if(row.personal_decision==='deny')return result(false,'CURRENT_PERSONAL_DENY');
 if(row.personal_decision!=='allow')return result(false,'CURRENT_CAPABILITY_NOT_GRANTED');
 const bound=await c.query(
  "SELECT count(*)::int n FROM public.employee_capability_scope_bindings b "+
  "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=b.employee_id "+
  "WHERE b.employee_id=$1::bigint AND b.permission_id=$2::bigint "+
  "AND s.scope_kind='publisher_phone_special' AND s.scope_reference_id=$1::bigint "+
  "AND s.ended_at IS NULL AND b.granted_at<=transaction_timestamp() "+
  "AND (b.ended_at IS NULL OR b.ended_at>transaction_timestamp())",
  [challenge.employeeId,row.permission_id]);
 if(bound.rows[0]?.n!==1)return result(false,'CURRENT_SCOPE_BINDING_REQUIRED');
 const modeQ=await c.query(
  "SELECT scope_mode,enabled,origin,version::text version,lifecycle_audit_watermark::text watermark,"+
  "granted_employment_status,granted_role_code,granted_main_role_id::text granted_main_role_id,"+
  "granted_store_id::text granted_store_id,lifecycle_invalidated_at,lifecycle_invalidated_audit_id,"+
  "lifecycle_invalidated_action,lifecycle_invalidated_reason "+
  "FROM f03_publisher_phone_admin_test.employee_mode WHERE employee_id=$1::bigint FOR SHARE",
  [challenge.employeeId]);
 if(modeQ.rowCount!==1)return result(false,'CURRENT_PHONE_PERMISSION_CONFIG_MISSING');
 const mode=modeQ.rows[0];
 if(mode.origin!=='CI_ONLY_F03_PERMISSION_CONFIG'||mode.enabled!==true||!MODES.includes(mode.scope_mode))
  return result(false,'CURRENT_PHONE_PERMISSION_CONFIG_NOT_ENABLED');
 if(mode.lifecycle_invalidated_at!==null||mode.lifecycle_invalidated_audit_id!==null||
  mode.lifecycle_invalidated_action!==null||mode.lifecycle_invalidated_reason!==null)
  return result(false,'CURRENT_PHONE_PERMISSION_LIFECYCLE_INVALIDATED');
 if(mode.granted_employment_status!=='active'||mode.granted_role_code!==row.role_code||
  mode.granted_main_role_id!==row.main_role_id||mode.granted_store_id!==row.store_id)
  return result(false,'CURRENT_EMPLOYEE_FACTS_CHANGED');
 if(!/^(0|[1-9][0-9]*)$/.test(mode.watermark||''))return result(false,'CURRENT_LIFECYCLE_WATERMARK_MISSING');
 const audit=await c.query(
  "SELECT EXISTS(SELECT 1 FROM public.audit_events WHERE object_kind='employee' "+
  "AND object_id=$1::text AND audit_id>$2::bigint) changed",
  [challenge.employeeId,mode.watermark]);
 if(audit.rows[0]?.changed===true)return result(false,'CURRENT_EMPLOYEE_LIFECYCLE_CHANGED');
 const facts={
  employeeId:row.employee_id,employmentStatus:row.employment_status,roleCode:row.role_code,
  mainRoleId:row.main_role_id,storeId:row.store_id,storeStatus:store.rows[0].status,
  permissionId:row.permission_id,personalDecision:row.personal_decision,
  scopeBindingCount:bound.rows[0].n,scopeMode:mode.scope_mode,scopeEnabled:mode.enabled,
  modeVersion:mode.version,lifecycleWatermark:mode.watermark
 };
 return result(true,'CURRENT_PHONE_PERMISSION_CONFIRMED',{scopeMode:mode.scope_mode,factsSha256:hashFacts(facts)});
}

export async function issueAssertion({auth,token,challenge,privateKey,kid,now=Date.now()}){
 if(!auth||!privateKey||typeof kid!=='string'||!/^[0-9a-f]{24}$/.test(kid)||!validateChallenge(challenge))
  return result(false,'ASSERTION_INPUT_INVALID');
 let current;
 try{current=await auth.withSession(token,async(c,actor,session)=>{
  return readCurrentFacts(c,actor,session,challenge);
 },{normalOnly:true})}catch{return result(false,'F03_CURRENT_FACTS_UNAVAILABLE')}
 if(!current)return result(false,'SESSION_OR_PC_ADMISSION_DENIED');
 if(current.ok!==true)return current;
 const nowMs=typeof now==='number'?now:now instanceof Date?now.getTime():NaN;
 if(!Number.isFinite(nowMs))return result(false,'ASSERTION_CLOCK_INVALID');
 const created=Date.parse(challenge.createdAt),expires=Date.parse(challenge.expiresAt);
 if(created>nowMs+2000||expires<=nowMs)return result(false,'CHALLENGE_EXPIRED_OR_NOT_YET_VALID');
 const iat=Math.floor(nowMs/1000);
 const exp=Math.min(iat+10,Math.floor(expires/1000));
 if(exp<=iat)return result(false,'CHALLENGE_TTL_TOO_SHORT');
 const payload={
  version:PROTOCOL_VERSION,issuer:ISSUER,audience:AUDIENCE,kid,jti:randomUUID(),
  challengeId:challenge.challengeId,nonce:challenge.nonce,requestId:challenge.requestId,
  employeeId:challenge.employeeId,capability:CAPABILITY,action:challenge.action,
  vehicleId:challenge.vehicleId,listingCycleId:challenge.listingCycleId,
  scopeMode:current.scopeMode,f03FactsSha256:current.factsSha256,iat,exp,
  origin:ORIGIN,formalSourceSigned:false,productionReady:false
 };
 try{
  const signature=sign(null,canonicalPayload(payload),privateKey).toString('base64url');
  return result(true,'ASSERTION_ISSUED',{assertion:{payload,signature}});
 }catch{return result(false,'ASSERTION_SIGNING_FAILED')}
}
