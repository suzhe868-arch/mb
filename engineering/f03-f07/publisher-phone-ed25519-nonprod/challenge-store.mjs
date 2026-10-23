import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {ACTIONS,AUDIENCE,ORIGIN,validateChallenge} from './protocol.mjs';
const digest=nonce=>createHash('sha256').update(nonce,'utf8').digest();
const validId=x=>typeof x==='string'&&/^[1-9][0-9]{0,18}$/.test(x)&&BigInt(x)<=9223372036854775807n;
export class ChallengeStore{
 constructor(pool){if(!pool)throw Error('CHALLENGE_POOL_REQUIRED');this.pool=pool}
 async create({employeeId,action,vehicleId,requestId=randomUUID()}){
  if(!validId(employeeId)||!validId(vehicleId)||!ACTIONS.includes(action)||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))
   throw Error('CHALLENGE_INPUT_INVALID');
  const client=await this.pool.connect();
  const challengeId=randomUUID(),nonce=randomBytes(32).toString('base64url');
  try{
   await client.query('BEGIN');
   const vehicle=await client.query(
    "SELECT listing_cycle_id::text AS listing_cycle_id FROM f07_runtime.publisher_phone_vehicles "+
    "WHERE vehicle_id=$1::bigint AND is_current_cycle=true FOR SHARE",[vehicleId]);
   if(vehicle.rowCount>1)throw Error('CHALLENGE_CURRENT_CYCLE_AMBIGUOUS');
   const cycle=vehicle.rows[0]?.listing_cycle_id??null;
   const row=await client.query(
    "INSERT INTO f03_f07_phone_ed25519_nonprod.challenges "+
    "(challenge_id,request_id,employee_id,action,vehicle_id,listing_cycle_id,audience,nonce_sha256,created_at,expires_at,origin) "+
    "VALUES($1::uuid,$2::uuid,$3::bigint,$4,$5::bigint,$6::bigint,$7,$8,clock_timestamp(),clock_timestamp()+interval '15 seconds',$9) "+
    "RETURNING created_at,expires_at",
    [challengeId,requestId,employeeId,action,vehicleId,cycle,AUDIENCE,digest(nonce),ORIGIN]);
   await client.query('COMMIT');
   const challenge={challengeId,requestId,employeeId,action,vehicleId,listingCycleId:cycle,audience:AUDIENCE,
    nonce,createdAt:row.rows[0].created_at.toISOString(),expiresAt:row.rows[0].expires_at.toISOString(),origin:ORIGIN};
   if(!validateChallenge(challenge))throw Error('CHALLENGE_CREATED_INVALID');
   return challenge;
  }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
  finally{client.release()}
 }
 async consume(challenge,payload){
  if(!challenge||!payload||typeof challenge.nonce!=='string')return false;
  try{
   const q=await this.pool.query(
    "UPDATE f03_f07_phone_ed25519_nonprod.challenges SET consumed_at=clock_timestamp() "+
    "WHERE challenge_id=$1::uuid AND request_id=$2::uuid AND employee_id=$3::bigint AND action=$4 "+
    "AND vehicle_id=$5::bigint AND listing_cycle_id IS NOT DISTINCT FROM $6::bigint AND audience=$7 "+
    "AND nonce_sha256=$8::bytea AND origin=$9 AND consumed_at IS NULL "+
    "AND created_at<=clock_timestamp() AND expires_at>clock_timestamp() "+
    "RETURNING challenge_id",
    [challenge.challengeId,challenge.requestId,challenge.employeeId,challenge.action,challenge.vehicleId,
     challenge.listingCycleId,challenge.audience,digest(challenge.nonce),ORIGIN]);
   return q.rowCount===1&&payload.challengeId===challenge.challengeId;
  }catch{throw Error('CHALLENGE_STORE_UNAVAILABLE')}
 }
 async cancel(challenge){
  if(!challenge||typeof challenge.challengeId!=='string')return false;
  try{
   const q=await this.pool.query(
    "UPDATE f03_f07_phone_ed25519_nonprod.challenges SET consumed_at=clock_timestamp() "+
    "WHERE challenge_id=$1::uuid AND consumed_at IS NULL AND expires_at>clock_timestamp() RETURNING challenge_id",
    [challenge.challengeId]);
   return q.rowCount===1;
  }catch{throw Error('CHALLENGE_STORE_UNAVAILABLE')}
 }
 async record({requestId,challengeId=null,employeeId=null,action=null,vehicleId=null,stage,decisionCode,allowed=false}){
  if(!/^[0-9a-f-]{36}$/i.test(requestId)||!/^[A-Z0-9_]{2,80}$/.test(decisionCode)||
   !['F03_ISSUER','F07_VERIFIER','F07_GUARD','HTTP_INPUT'].includes(stage))throw Error('AUDIT_INPUT_INVALID');
  try{
   const q=await this.pool.query(
    "INSERT INTO f03_f07_phone_ed25519_nonprod.decision_audit "+
    "(request_id,challenge_id,employee_id,action,vehicle_id,stage,decision_code,allowed,origin) "+
    "VALUES($1::uuid,$2::uuid,$3::bigint,$4,$5::bigint,$6,$7,$8,$9) RETURNING audit_id::text",
    [requestId,challengeId,employeeId,action,vehicleId,stage,decisionCode,allowed===true,ORIGIN]);
   return q.rows[0].audit_id;
  }catch{throw Error('DECISION_AUDIT_UNAVAILABLE')}
 }
}
