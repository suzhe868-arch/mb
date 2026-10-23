import {verify} from 'node:crypto';
import {authorizePublisherPhone} from '../../f07/publisher-phone-scope-runtime/guard.mjs';
import {checkCurrentF03Authorization} from './issuer.mjs';
import {ORIGIN,canonicalPayload,validateChallengePayloadBinding} from './protocol.mjs';
const result=(ok,code,extra={})=>({ok,allowed:ok,code,origin:ORIGIN,...extra});
const SIGNATURE=/^[A-Za-z0-9_-]{86}$/;
export async function verifyAndAuthorize({auth,pool,challengeStore,token,challenge,assertion,publicKey,expectedKid,now=Date.now(),guard=authorizePublisherPhone}){
 const payload=assertion?.payload;
 if(!assertion||Object.keys(assertion).sort().join('|')!=='payload|signature'||
  typeof assertion.signature!=='string'||!SIGNATURE.test(assertion.signature)||
  !validateChallengePayloadBinding(challenge,payload))
  return result(false,'ASSERTION_OR_BINDING_INVALID');
 if(payload.kid!==expectedKid)return result(false,'ASSERTION_KID_MISMATCH');
 const nowMs=typeof now==='number'?now:now instanceof Date?now.getTime():NaN;
 if(!Number.isFinite(nowMs))return result(false,'ASSERTION_CLOCK_INVALID');
 const nowSec=Math.floor(nowMs/1000),challengeExp=Math.floor(Date.parse(challenge.expiresAt)/1000);
 if(payload.iat>nowSec+2||payload.exp<=nowSec-2||payload.exp-payload.iat>15||
  payload.exp>challengeExp||payload.iat<Math.floor(Date.parse(challenge.createdAt)/1000)-2)
  return result(false,'ASSERTION_TIME_INVALID');
 let signatureValid=false;
 try{signatureValid=verify(null,canonicalPayload(payload),publicKey,Buffer.from(assertion.signature,'base64url'))}catch{}
 if(!signatureValid)return result(false,'ASSERTION_SIGNATURE_INVALID');
 let consumed=false;
 try{consumed=await challengeStore.consume(challenge,payload)}catch{return result(false,'CHALLENGE_STORE_UNAVAILABLE')}
 if(!consumed)return result(false,'CHALLENGE_REPLAYED_OR_EXPIRED');
 let authorization;
 try{authorization=await guard({auth,pool,token,vehicleId:payload.vehicleId,action:payload.action})}
 catch{return result(false,'F07_CURRENT_GUARD_UNAVAILABLE')}
 if(!authorization||authorization.allowed!==true||authorization.ok!==true){
  const code=typeof authorization?.code==='string'&&/^[A-Z0-9_]{2,80}$/.test(authorization.code)?authorization.code:'F07_CURRENT_GUARD_DENIED';
  return result(false,code,{stage:'F07_GUARD'});
 }
 if(String(authorization.employeeId)!==payload.employeeId||
  String(authorization.vehicleId)!==payload.vehicleId||
  String(authorization.listingCycleId??'')!==String(payload.listingCycleId??'')||
  authorization.scopeMode!==payload.scopeMode)
  return result(false,'SIGNED_CONTEXT_CHANGED',{stage:'F07_GUARD'});
 // The existing Guard is mandatory, then the F03 issuer snapshot is independently re-read.
 // This closes the gap where role/store/scope could change after signing while still fitting a broad Guard role.
 let currentF03;
 try{currentF03=await checkCurrentF03Authorization({auth,token,challenge})}
 catch{return result(false,'F03_CURRENT_FACTS_UNAVAILABLE',{stage:'F03_RECHECK'})}
 if(!currentF03||currentF03.ok!==true)return result(false,currentF03?.code||'F03_CURRENT_FACTS_UNAVAILABLE',{stage:'F03_RECHECK'});
 if(currentF03.scopeMode!==payload.scopeMode||currentF03.factsSha256!==payload.f03FactsSha256)
  return result(false,'F03_FACTS_CHANGED_AFTER_SIGNATURE',{stage:'F03_RECHECK'});
 return result(true,'PUBLISHER_PHONE_ALLOWED',{
  employeeId:payload.employeeId,vehicleId:payload.vehicleId,listingCycleId:payload.listingCycleId,
  action:payload.action,scopeMode:payload.scopeMode,stage:'F07_GUARD'
 });
}
