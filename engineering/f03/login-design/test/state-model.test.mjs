import {test} from 'node:test';
import assert from 'node:assert/strict';
import {credentialDecision,sessionDecision,INTENTS} from '../state-model.mjs';
const employee=(over={})=>({
 account:{accountId:17,kind:'employee',principalId:11,employeeId:11,credentialState:'enabled',forcePasswordChange:false,credentialEpoch:3},
 subject:{id:11,kind:'employee',status:'active',role:'sales'},passwordProofVerified:true,rateLimitPassed:true,...over
});
const admin=(over={})=>({
 account:{accountId:20,kind:'system_admin',principalId:19,systemAdminId:19,credentialState:'enabled',forcePasswordChange:false,credentialEpoch:8},
 subject:{id:19,kind:'system_admin',status:'active'},passwordProofVerified:true,rateLimitPassed:true,...over
});
const fourS=()=>employee({subject:{id:11,kind:'employee',status:'active',role:'four_s',pcVehicleAccess:false}});
const session=(f=employee(),over={})=>({
 ...f,nowMs:1000,session:{accountId:f.account.accountId,principalKind:f.account.kind,principalId:f.account.principalId,credentialEpoch:f.account.credentialEpoch,issuedAtMs:500,expiresAtMs:1600,revoked:false,restricted:false,...over},
 currentPermissionVerified:true,currentScopeVerified:true,currentObjectStateVerified:true
});
const deny=(result,reason)=>assert.deepEqual([result.allowed,result.reason],[false,reason]);
test('explicit intentions, no invented login role or password privilege',()=>{
 assert.equal(INTENTS.includes('GRANT_VEHICLE_PERMISSION'),false);
 deny(credentialDecision('GRANT_VEHICLE_PERMISSION',employee()),'UNKNOWN_CREDENTIAL_INTENT');
 deny(credentialDecision('AUTH_SUCCESS',employee({account:{...employee().account,employeeId:undefined}})),'INVALID_PRINCIPAL');
 deny(credentialDecision('AUTH_SUCCESS',employee({subject:{...employee().subject,id:99}})),'PRINCIPAL_BINDING_MISMATCH');
});
test('synthetic authenticated event rejects missing password proof or rate-limit check',()=>{
 const f=employee();
 deny(credentialDecision('AUTH_SUCCESS',{...f,passwordProofVerified:false}),'PASSWORD_PROOF_REQUIRED');
 deny(credentialDecision('AUTH_SUCCESS',{...f,rateLimitPassed:false}),'PASSWORD_PROOF_REQUIRED');
 deny(credentialDecision('AUTH_SUCCESS',{...f,passwordProofVerified:undefined}),'PASSWORD_PROOF_REQUIRED');
 assert.equal(credentialDecision('AUTH_SUCCESS',f).allowed,true);
});
test('first successful proof is only restricted change, other session actions denied',()=>{
 const f=employee({account:{...employee().account,forcePasswordChange:true}});
 assert.equal(credentialDecision('AUTH_SUCCESS',f).reason,'RESTRICTED_CHANGE_ONLY');
 const s=session(f,{restricted:true});
 assert.equal(sessionDecision('SELF_CHANGE_PASSWORD',s).allowed,true);
 for(const action of ['BUSINESS','CONTROL','READ_SENSITIVE'])deny(sessionDecision(action,s),'PASSWORD_CHANGE_REQUIRED');
 assert.equal(credentialDecision('LOGOUT',f).allowed,true);
});
test('self password changes require fresh proof and revoke every prior session',()=>{
 const f=employee({account:{...employee().account,forcePasswordChange:true}});
 for(const missing of [{reauthenticated:false,currentPasswordVerified:true,samePrincipal:true},{reauthenticated:true,currentPasswordVerified:false,samePrincipal:true},{reauthenticated:true,currentPasswordVerified:true,samePrincipal:false}]){
  deny(credentialDecision('SELF_CHANGE_PASSWORD',{...f,...missing}),'CURRENT_PASSWORD_PROOF_REQUIRED');
 }
 const allow=credentialDecision('SELF_CHANGE_PASSWORD',{...f,reauthenticated:true,currentPasswordVerified:true,samePrincipal:true});
 assert.equal(allow.allowed,true);
 for(const effect of ['STORE_NEW_HASH_ONLY_IN_PC_LOGIN_ACCOUNTS','CLEAR_FORCE_PASSWORD_CHANGE','INCREMENT_CREDENTIAL_EPOCH','REVOKE_ALL_SESSIONS','REAUTHENTICATE_FOR_NEW_SESSION'])assert.ok(allow.effects.includes(effect));
 const old=session(f,{restricted:true});
 const after={...old,account:{...f.account,forcePasswordChange:false,credentialEpoch:4}};
 deny(sessionDecision('BUSINESS',after),'CREDENTIAL_EPOCH_MISMATCH');
});
test('governance must be independently authorized and audited, never implicit from login',()=>{
 const f=employee();
 for(const intent of ['ADMIN_RESET_PASSWORD','DISABLE_CREDENTIAL','ENABLE_CREDENTIAL','SET_INITIAL_PASSWORD']){
  deny(credentialDecision(intent,f),'GOVERNANCE_AUTHORITY_REQUIRED');
  deny(credentialDecision(intent,{...f,governanceApproved:true,governanceActorValid:false,governanceScopeValid:true,governanceTargetBound:true}),'GOVERNANCE_AUTHORITY_REQUIRED');
 }
 const allowed={...f,governanceApproved:true,governanceActorValid:true,governanceScopeValid:true,governanceTargetBound:true};
 for(const intent of ['ADMIN_RESET_PASSWORD','DISABLE_CREDENTIAL']){
  const result=credentialDecision(intent,allowed);
  assert.equal(result.allowed,true,intent);
  assert.ok(result.effects.includes('INCREMENT_CREDENTIAL_EPOCH'));
  assert.ok(result.effects.includes('REVOKE_ALL_SESSIONS'));
  assert.ok(result.effects.includes('AUDIT_BEFORE_AFTER_ACTOR_TIME'));
 }
 const initial=credentialDecision('SET_INITIAL_PASSWORD',{...allowed,account:{...f.account,forcePasswordChange:true},initialProvisioning:true});
 assert.equal(initial.allowed,true);
 assert.ok(initial.effects.includes('FORCE_PASSWORD_CHANGE'));
 const enabled=credentialDecision('ENABLE_CREDENTIAL',{...allowed,account:{...f.account,credentialState:'disabled',forcePasswordChange:true}});
 assert.equal(enabled.allowed,true,'a disabled but still active legitimate account is re-enableable');
 assert.equal(enabled.reason,'GOVERNANCE_ENABLED');
 for(const effect of ['SET_ENABLED','KEEP_FORCE_CHANGE','INCREMENT_CREDENTIAL_EPOCH','REVOKE_ALL_SESSIONS','AUDIT_BEFORE_AFTER_ACTOR_TIME'])
  assert.ok(enabled.effects.includes(effect));
});
test('A复核：所有四类治理操作即使 targetBound=true 也必须校验真实 account/subject kind 和 ID',()=>{
 const approvals={governanceApproved:true,governanceActorValid:true,governanceScopeValid:true,governanceTargetBound:true,initialProvisioning:true};
 for(const base of [employee(),admin()]){
  for(const intent of ['ADMIN_RESET_PASSWORD','DISABLE_CREDENTIAL','ENABLE_CREDENTIAL','SET_INITIAL_PASSWORD']){
   const acct={...base.account,credentialState:intent==='ENABLE_CREDENTIAL'?'disabled':'enabled',forcePasswordChange:intent==='SET_INITIAL_PASSWORD'};
   const normal={...base,account:acct,...approvals};
   const wrongKind={...normal,subject:{...normal.subject,kind:normal.subject.kind==='employee'?'system_admin':'employee'}};
   const wrongId={...normal,subject:{...normal.subject,id:normal.subject.id+10}};
   deny(credentialDecision(intent,wrongKind),'PRINCIPAL_BINDING_MISMATCH');
   deny(credentialDecision(intent,wrongId),'PRINCIPAL_BINDING_MISMATCH');
   deny(credentialDecision(intent,{...normal,account:{...acct,principalId:acct.principalId+10}}),'INVALID_PRINCIPAL');
  }
 }
});
test('A复核：按操作独立检查当前 credential/subject 状态；停用时不得重置，disabled active 可以启用',()=>{
 const approvals={governanceApproved:true,governanceActorValid:true,governanceScopeValid:true,governanceTargetBound:true};
 for(const base of [employee(),admin()]){
  const inactive={...base,subject:{...base.subject,status:'inactive'},...approvals};
  deny(credentialDecision('ADMIN_RESET_PASSWORD',inactive),'INACTIVE_PRINCIPAL');
  deny(credentialDecision('SET_INITIAL_PASSWORD',{...inactive,initialProvisioning:true,account:{...base.account,forcePasswordChange:true}}),'INACTIVE_PRINCIPAL');
  deny(credentialDecision('ENABLE_CREDENTIAL',{...inactive,account:{...base.account,credentialState:'disabled'}}),'INACTIVE_PRINCIPAL');
  const disabled={...base,account:{...base.account,credentialState:'disabled'},...approvals};
  deny(credentialDecision('ADMIN_RESET_PASSWORD',disabled),'CREDENTIAL_STATE_DENIED');
  deny(credentialDecision('SET_INITIAL_PASSWORD',{...disabled,initialProvisioning:true}),'CREDENTIAL_STATE_DENIED');
  deny(credentialDecision('DISABLE_CREDENTIAL',disabled),'CREDENTIAL_STATE_DENIED');
  const enabled={...base,...approvals};
  deny(credentialDecision('ENABLE_CREDENTIAL',enabled),'CREDENTIAL_STATE_DENIED');
  deny(credentialDecision('SET_INITIAL_PASSWORD',enabled),'INITIAL_PROVISIONING_REQUIRED');
  deny(credentialDecision('SET_INITIAL_PASSWORD',{...enabled,initialProvisioning:true,account:{...base.account,forcePasswordChange:false}}),'INITIAL_PROVISIONING_REQUIRED');
  const legalEnable=credentialDecision('ENABLE_CREDENTIAL',disabled);
  assert.equal(legalEnable.allowed,true,'disabled+active must be a legal re-enable state');
  // Already inactive principals still permit authorized explicit revocation of a
  // currently enabled credential, but never issuing a usable session.
  const revoke=credentialDecision('DISABLE_CREDENTIAL',inactive);
  assert.equal(revoke.allowed,true);
  assert.ok(revoke.effects.includes('REVOKE_ALL_SESSIONS'));
 }
});
test('A复核：治理源事实不完整时默认拒绝，而不是把真假 targetBound 视为授权',()=>{
 const f=employee(),approve={governanceApproved:true,governanceActorValid:true,governanceScopeValid:true,governanceTargetBound:true};
 for(const change of [
  {account:{...f.account,credentialEpoch:undefined}},
  {account:{...f.account,forcePasswordChange:undefined}},
  {account:{...f.account,credentialState:'unknown'}},
  {subject:{...f.subject,status:'unknown'}}
 ]){
  const result=credentialDecision('ADMIN_RESET_PASSWORD',{...f,...approve,...change});
  assert.equal(result.allowed,false);
  assert.deepEqual(result.effects,[]);
 }
});
test('disabled/inactive/rehire remains denied until fresh verification and new session generation',()=>{
 const f=employee();
 deny(sessionDecision('BUSINESS',session({...f,subject:{...f.subject,status:'inactive'}})),'DISABLED_OR_INACTIVE');
 deny(sessionDecision('BUSINESS',session({...f,account:{...f.account,credentialState:'disabled'}})),'DISABLED_OR_INACTIVE');
 const old=session(f);
 deny(sessionDecision('BUSINESS',{...old,account:{...f.account,credentialEpoch:4}}),'CREDENTIAL_EPOCH_MISMATCH');
 assert.equal(sessionDecision('BUSINESS',session(f)).allowed,true);
});
test('4S PC requires explicit current eligibility; admin and employee cannot cross principals',()=>{
 const four=fourS();
 deny(credentialDecision('AUTH_SUCCESS',four),'FOUR_S_PC_NOT_GRANTED');
 deny(sessionDecision('BUSINESS',session(four)),'FOUR_S_PC_NOT_GRANTED');
 const granted={...four,subject:{...four.subject,pcVehicleAccess:true}};
 assert.equal(credentialDecision('AUTH_SUCCESS',granted).allowed,true);
 assert.equal(sessionDecision('BUSINESS',session(granted)).allowed,true); // only session gate, no F03 business policy
 deny(sessionDecision('BUSINESS',session(admin())),'SYSTEM_ADMIN_NOT_BUSINESS_ACTOR');
 assert.equal(sessionDecision('CONTROL',session(admin())).allowed,true);
 deny(sessionDecision('CONTROL',session(employee())),'EMPLOYEE_NOT_SYSTEM_ADMIN');
});
test('wrong principal type, mixed identities and tampered session binding fail closed',()=>{
 const f=employee();
 deny(credentialDecision('AUTH_SUCCESS',{...f,account:{...f.account,systemAdminId:19}}),'INVALID_PRINCIPAL');
 deny(sessionDecision('BUSINESS',session(f,{accountId:999})),'SESSION_IDENTITY_MISMATCH');
 deny(sessionDecision('BUSINESS',session(f,{principalKind:'system_admin'})),'SESSION_IDENTITY_MISMATCH');
 deny(sessionDecision('BUSINESS',session(f,{principalId:19})),'SESSION_IDENTITY_MISMATCH');
 const other={...f,subject:{...f.subject,kind:'system_admin'}};
 deny(sessionDecision('BUSINESS',session(other)),'PRINCIPAL_BINDING_MISMATCH');
});
test('all expiration, revocation, epoch, missing facts deny; logout not business',()=>{
 const f=employee();
 deny(sessionDecision('BUSINESS',session(f,{expiresAtMs:1000})),'SESSION_EXPIRED_OR_INVALID');
 deny(sessionDecision('BUSINESS',session(f,{issuedAtMs:1100})),'SESSION_EXPIRED_OR_INVALID');
 deny(sessionDecision('BUSINESS',session(f,{issuedAtMs:1600,expiresAtMs:1200})),'SESSION_EXPIRED_OR_INVALID');
 deny(sessionDecision('BUSINESS',session(f,{revoked:true})),'REVOKED_SESSION');
 deny(sessionDecision('BUSINESS',session(f,{revoked:undefined})),'SESSION_REVOCATION_FACT_MISSING');
 deny(sessionDecision('BUSINESS',session(f,{credentialEpoch:2})),'CREDENTIAL_EPOCH_MISMATCH');
 deny(sessionDecision('BUSINESS',session(f,{restricted:undefined})),'SESSION_MODE_MISSING');
 deny(sessionDecision('BUSINESS',{}),'MISSING_CURRENT_FACTS');
 deny(sessionDecision('ANY_OTHER',session(f)),'UNKNOWN_SESSION_ACTION');
 assert.equal(sessionDecision('LOGOUT',session(f)).allowed,true);
});
test('role/scope/object current facts required, no historical session capability cache grants',()=>{
 const f=session(employee());
 for(const x of ['currentPermissionVerified','currentScopeVerified','currentObjectStateVerified']){
  deny(sessionDecision('BUSINESS',{...f,[x]:false}),'CURRENT_AUTHORIZATION_NOT_VERIFIED');
  const copy={...f};delete copy[x];
  deny(sessionDecision('BUSINESS',copy),'CURRENT_AUTHORIZATION_NOT_VERIFIED');
 }
 assert.equal(sessionDecision('BUSINESS',{...f,oldSessionPermissionSnapshot:['all'],currentScopeVerified:false}).allowed,false);
 assert.ok(sessionDecision('BUSINESS',f).effects.includes('REVALIDATE_WITH_F03_POLICY_AT_SUBMISSION'));
});
test('no output of account secrets, password hashes or tokens from modeled effects',()=>{
 const s=JSON.stringify(credentialDecision('ADMIN_RESET_PASSWORD',{...employee(),governanceApproved:true,governanceActorValid:true,governanceScopeValid:true,governanceTargetBound:true,syntheticPassword:'VERY_PRIVATE_VALUE'}));
 assert.ok(!s.includes('VERY_PRIVATE_VALUE'));assert.ok(!s.includes('token_digest'));
});
