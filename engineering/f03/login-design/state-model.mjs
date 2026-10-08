// F03-1-G0: PURE synthetic credential/session state contracts.
// No hashing, login service, persistence, secrets or network I/O.
// The upcoming F03-1 implementation batch must independently approve exact storage and adaptors.
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=x=>Number.isSafeInteger(x)&&x>0;
const reject=reason=>Object.freeze({allowed:false,reason,effects:[]});
const permit=(reason,effects)=>Object.freeze({allowed:true,reason,effects});
const principal=(account)=>{
 if(!obj(account)||!id(account.accountId)||!['employee','system_admin'].includes(account.kind)||!id(account.principalId))return false;
 return account.kind==='employee'?
  !('systemAdminId'in account)&&account.employeeId===account.principalId:
  !('employeeId'in account)&&account.systemAdminId===account.principalId;
};
function eligibility(facts){
 if(!obj(facts)||!principal(facts.account)||!obj(facts.subject))return 'INVALID_PRINCIPAL';
 const {account,subject}=facts;
 if(subject.kind!==account.kind||subject.id!==account.principalId)return 'PRINCIPAL_BINDING_MISMATCH';
 if(!['active','inactive'].includes(subject.status))return 'MISSING_SUBJECT_STATUS';
 if(account.credentialState!=='enabled'||subject.status!=='active')return 'DISABLED_OR_INACTIVE';
 if(account.kind==='employee'){
  if(!['sales','manager','store_manager','four_s'].includes(subject.role))return 'UNKNOWN_EMPLOYEE_ROLE';
  if(subject.role==='four_s'&&subject.pcVehicleAccess!==true)return 'FOUR_S_PC_NOT_GRANTED';
 }
 if(!id(account.credentialEpoch))return 'MISSING_CREDENTIAL_EPOCH';
 if(typeof account.forcePasswordChange!=='boolean')return 'MISSING_FORCE_PASSWORD_CHANGE';
 return null;
}
export const INTENTS=Object.freeze([
 'AUTH_SUCCESS','SELF_CHANGE_PASSWORD','ADMIN_RESET_PASSWORD','DISABLE_CREDENTIAL',
 'ENABLE_CREDENTIAL','SET_INITIAL_PASSWORD','LOGOUT'
]);
export function credentialDecision(intent,facts){
 if(!INTENTS.includes(intent))return reject('UNKNOWN_CREDENTIAL_INTENT');
 const issue=eligibility(facts);
 if(!obj(facts)||!obj(facts.account)||!obj(facts.subject)||!principal(facts.account))return reject('INVALID_PRINCIPAL');
 const {account}=facts;
 // Governance operations require separately verified authority and audit; no
 // simulation may auto-grant account management to an ordinary PC login.
 if(['ADMIN_RESET_PASSWORD','DISABLE_CREDENTIAL','ENABLE_CREDENTIAL','SET_INITIAL_PASSWORD'].includes(intent)){
  if(facts.governanceApproved!==true||facts.governanceActorValid!==true||facts.governanceScopeValid!==true||facts.governanceTargetBound!==true)return reject('GOVERNANCE_AUTHORITY_REQUIRED');
  if(intent==='ENABLE_CREDENTIAL'){
   if(facts.subject.status!=='active')return reject('INACTIVE_PRINCIPAL');
   return permit('GOVERNANCE_ENABLED',[ 'SET_ENABLED','KEEP_FORCE_CHANGE','AUDIT_BEFORE_AFTER_ACTOR_TIME' ]);
  }
  if(intent==='DISABLE_CREDENTIAL')return permit('GOVERNANCE_DISABLED',['SET_DISABLED','INCREMENT_CREDENTIAL_EPOCH','REVOKE_ALL_SESSIONS','AUDIT_BEFORE_AFTER_ACTOR_TIME']);
  if(intent==='SET_INITIAL_PASSWORD'||intent==='ADMIN_RESET_PASSWORD')
   return permit('GOVERNANCE_PASSWORD_SET',['STORE_NEW_HASH_ONLY_IN_PC_LOGIN_ACCOUNTS','FORCE_PASSWORD_CHANGE','INCREMENT_CREDENTIAL_EPOCH','REVOKE_ALL_SESSIONS','AUDIT_BEFORE_AFTER_ACTOR_TIME']);
 }
 if(intent==='LOGOUT')return permit('LOGOUT_ONLY',['REVOKE_THIS_SESSION','AUDIT_LOGOUT_METADATA_ONLY']);
 if(issue)return reject(issue);
 if(intent==='AUTH_SUCCESS'){
  if(facts.passwordProofVerified!==true||facts.rateLimitPassed!==true)return reject('PASSWORD_PROOF_REQUIRED');
  return permit(account.forcePasswordChange?'RESTRICTED_CHANGE_ONLY':'NORMAL_SESSION_ELIGIBLE',[account.forcePasswordChange?'ISSUE_RESTRICTED_SESSION':'ISSUE_SESSION_AFTER_RATE_LIMIT']);
 }
 if(intent==='SELF_CHANGE_PASSWORD'){
  if(facts.reauthenticated!==true||facts.currentPasswordVerified!==true||facts.samePrincipal!==true)return reject('CURRENT_PASSWORD_PROOF_REQUIRED');
  return permit('PASSWORD_CHANGE_ELIGIBLE',['STORE_NEW_HASH_ONLY_IN_PC_LOGIN_ACCOUNTS','CLEAR_FORCE_PASSWORD_CHANGE','INCREMENT_CREDENTIAL_EPOCH','REVOKE_ALL_SESSIONS','AUDIT_BEFORE_AFTER_ACTOR_TIME','REAUTHENTICATE_FOR_NEW_SESSION']);
 }
 return reject('DENY_BY_DEFAULT');
}
export function sessionDecision(action,facts){
 if(!['SELF_CHANGE_PASSWORD','LOGOUT','BUSINESS','CONTROL','READ_SENSITIVE'].includes(action))return reject('UNKNOWN_SESSION_ACTION');
 if(!obj(facts)||!obj(facts.session)||!obj(facts.account)||!obj(facts.subject))return reject('MISSING_CURRENT_FACTS');
 const {session,account}=facts;
 const issue=eligibility(facts);
 if(issue)return reject(issue);
 // ALL checks use current SERVER trusted facts; a client's stale permission snapshot
 // cannot override principal kind, subject status or credential epoch.
 if(!id(session.accountId)||session.accountId!==account.accountId||session.principalKind!==account.kind||session.principalId!==account.principalId)return reject('SESSION_IDENTITY_MISMATCH');
 if(!Number.isSafeInteger(facts.nowMs)||!Number.isSafeInteger(session.expiresAtMs)||!Number.isSafeInteger(session.issuedAtMs)||
  session.expiresAtMs<=session.issuedAtMs||facts.nowMs<session.issuedAtMs||facts.nowMs>=session.expiresAtMs)return reject('SESSION_EXPIRED_OR_INVALID');
 if(session.revoked===true)return reject('REVOKED_SESSION');
 if(session.revoked!==false)return reject('SESSION_REVOCATION_FACT_MISSING');
 if(!id(session.credentialEpoch)||session.credentialEpoch!==account.credentialEpoch)return reject('CREDENTIAL_EPOCH_MISMATCH');
 if(typeof session.restricted!=='boolean')return reject('SESSION_MODE_MISSING');
 if(action==='LOGOUT')return permit('LOGOUT_ONLY',['REVOKE_THIS_SESSION']);
 if(account.forcePasswordChange||session.restricted){
  if(action!=='SELF_CHANGE_PASSWORD')return reject('PASSWORD_CHANGE_REQUIRED');
  return permit('RESTRICTED_PASSWORD_CHANGE_ONLY',['CURRENT_PASSWORD_PROOF_AT_SUBMISSION','ROTATE_ALL_SESSIONS']);
 }
 if(action==='SELF_CHANGE_PASSWORD')return permit('NORMAL_ACCOUNT_SELF_CHANGE',['CURRENT_PASSWORD_PROOF_AT_SUBMISSION','ROTATE_ALL_SESSIONS']);
 if(account.kind==='system_admin'){
  if(action!=='CONTROL')return reject('SYSTEM_ADMIN_NOT_BUSINESS_ACTOR');
 }else{
  if(action==='CONTROL')return reject('EMPLOYEE_NOT_SYSTEM_ADMIN');
 }
 if(facts.currentPermissionVerified!==true||facts.currentScopeVerified!==true||facts.currentObjectStateVerified!==true)return reject('CURRENT_AUTHORIZATION_NOT_VERIFIED');
 return permit('SESSION_GATE_ONLY',['REVALIDATE_WITH_F03_POLICY_AT_SUBMISSION']);
}
