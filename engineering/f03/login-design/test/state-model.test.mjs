import {test} from 'node:test';
import assert from 'node:assert/strict';
import {credentialDecision,sessionDecision,INTENTS} from '../state-model.mjs';
const employee=(over={})=>({
 account:{accountId:17,kind:'employee',principalId:11,employeeId:11,credentialState:'enabled',forcePasswordChange:false,credentialEpoch:3},
 subject:{id:11,kind:'employee',status:'active',role:'sales'},...over
});
const admin=(over={})=>({
 account:{accountId:20,kind:'system_admin',principalId:19,systemAdminId:19,credentialState:'enabled',forcePasswordChange:false,credentialEpoch:8},
 subject:{id:19,kind:'system_admin',status:'active'},...over
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
 for(const intent of ['ADMIN_RESET_PASSWORD','DISABLE_CREDENTIAL','SET_INITIAL_PASSWORD']){
  const result=credentialDecision(intent,allowed);
  assert.equal(result.allowed,true,intent);
  assert.ok(result.effects.includes('INCREMENT_CREDENTIAL_EPOCH'));
  assert.ok(result.effects.includes('REVOKE_ALL_SESSIONS'));
  assert.ok(result.effects.includes('AUDIT_BEFORE_AFTER_ACTOR_TIME'));
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
