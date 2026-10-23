import {createHash,generateKeyPairSync} from 'node:crypto';

export const PROTOCOL_VERSION='F03_F07_PUBLISHER_PHONE_ED25519_V1';
export const ISSUER='f03.publisher-phone.nonprod';
export const AUDIENCE='f07.publisher-phone.scope.nonprod';
export const CAPABILITY='publisher.phone.sensitive';
export const ORIGIN='CI_SYNTHETIC_ONLY';
export const MODES=Object.freeze(['LOCKED_ONLY','ALL_ACTIVE_JYT']);
export const ACTIONS=Object.freeze([
 'vehicle.publisher_phone.read','vehicle.publisher_phone.latest','vehicle.publisher_phone.dial'
]);
export const PAYLOAD_KEYS=Object.freeze([
 'version','issuer','audience','kid','jti','challengeId','nonce','requestId',
 'employeeId','capability','action','vehicleId','listingCycleId','scopeMode',
 'f03FactsSha256','iat','exp','origin','formalSourceSigned','productionReady'
]);
export const CHALLENGE_KEYS=Object.freeze([
 'challengeId','requestId','employeeId','action','vehicleId','listingCycleId',
 'audience','nonce','createdAt','expiresAt','origin'
]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[1-9][0-9]{0,18}$/;
const B64URL=/^[A-Za-z0-9_-]{43}$/;
const HEX24=/^[0-9a-f]{24}$/;
export const isId=value=>typeof value==='string'&&ID.test(value)&&BigInt(value)<=9223372036854775807n;
export const isUuid=value=>typeof value==='string'&&UUID.test(value);
export const exactKeys=(value,keys)=>Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&
 Object.keys(value).sort().join('|')===keys.slice().sort().join('|'));
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export function makeEphemeralKeyPair(){
 const pair=generateKeyPairSync('ed25519');
 const publicDer=pair.publicKey.export({type:'spki',format:'der'});
 return {privateKey:pair.privateKey,publicKey:pair.publicKey,kid:sha256(publicDer).slice(0,24)};
}
export function validateChallenge(challenge){
 if(!exactKeys(challenge,CHALLENGE_KEYS))return false;
 if(!isUuid(challenge.challengeId)||!isUuid(challenge.requestId)||
  !isId(challenge.employeeId)||!ACTIONS.includes(challenge.action)||!isId(challenge.vehicleId)||
  !(challenge.listingCycleId===null||isId(challenge.listingCycleId))||
  challenge.audience!==AUDIENCE||!B64URL.test(challenge.nonce)||challenge.origin!==ORIGIN)return false;
 if(typeof challenge.createdAt!=='string'||typeof challenge.expiresAt!=='string')return false;
 const created=Date.parse(challenge.createdAt),expires=Date.parse(challenge.expiresAt);
 return Number.isFinite(created)&&Number.isFinite(expires)&&expires>created&&expires-created<=15000;
}
export function validatePayload(payload){
 if(!exactKeys(payload,PAYLOAD_KEYS))return false;
 return payload.version===PROTOCOL_VERSION&&payload.issuer===ISSUER&&payload.audience===AUDIENCE&&
  typeof payload.kid==='string'&&HEX24.test(payload.kid)&&isUuid(payload.jti)&&
  isUuid(payload.challengeId)&&B64URL.test(payload.nonce)&&isUuid(payload.requestId)&&
  isId(payload.employeeId)&&payload.capability===CAPABILITY&&ACTIONS.includes(payload.action)&&
  isId(payload.vehicleId)&&(payload.listingCycleId===null||isId(payload.listingCycleId))&&
  MODES.includes(payload.scopeMode)&&typeof payload.f03FactsSha256==='string'&&
  /^[0-9a-f]{64}$/.test(payload.f03FactsSha256)&&Number.isSafeInteger(payload.iat)&&
  Number.isSafeInteger(payload.exp)&&payload.exp>payload.iat&&payload.origin===ORIGIN&&
  payload.formalSourceSigned===false&&payload.productionReady===false;
}
export function canonicalPayload(payload){
 if(!validatePayload(payload))throw Error('ASSERTION_PAYLOAD_INVALID');
 const ordered={};
 for(const key of PAYLOAD_KEYS)ordered[key]=payload[key];
 return Buffer.from(JSON.stringify(ordered),'utf8');
}
export function validateChallengePayloadBinding(challenge,payload){
 return validateChallenge(challenge)&&validatePayload(payload)&&
  payload.challengeId===challenge.challengeId&&payload.nonce===challenge.nonce&&
  payload.requestId===challenge.requestId&&payload.employeeId===challenge.employeeId&&
  payload.action===challenge.action&&payload.vehicleId===challenge.vehicleId&&
  payload.listingCycleId===challenge.listingCycleId&&payload.audience===challenge.audience&&
  payload.origin===challenge.origin;
}
