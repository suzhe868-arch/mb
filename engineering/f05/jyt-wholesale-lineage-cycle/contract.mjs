// F05-3B: CI-only JYT wholesale sync. No production route, no JYT network calls.
// API credential is issued by a real authenticated SYSTEM ADMIN governance session,
// distinct from employee/4S/Customer sessions, JYT login or upstream phone tokens.
import {randomBytes,createHash} from 'node:crypto';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
import {verify,ID,checksum} from './migration.mjs';

export const GAP='F05_3B_TRUSTED_SOURCE_GAP';
const deny=(code=GAP)=>({allowed:false,code});
const ok=(code,props={})=>({allowed:true,code,...props});
const once=new WeakSet();
const isInt=v=>Number.isSafeInteger(v)&&v>0&&v<=2147483647;
const event=v=>typeof v==='string'&&/^[a-zA-Z0-9._:-]{20,160}$/.test(v);
const car=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{4,96}$/.test(v);
const secret=v=>typeof v==='string'&&/^mbci_[a-zA-Z0-9_-]{43}$/.test(v);
const hash=v=>createHash('sha256').update(v).digest('hex');
const shape=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys;
const names=['upsert','offline','current'];
const isolate=()=>{for(const [k,v] of Object.entries({
 CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
 if(process.env[k]!==v)throw Error('F05_3B_NOT_CI_ONLY_'+k)};
async function ready(auth) {
 isolate();
 if(!auth?.pool||typeof auth.withSession!=='function')throw Error('F05_3B_REAL_SESSION_REQUIRED');
 await requireDatabaseIdentity(auth.pool);
 if(!once.has(auth)){
  const v=await verify(auth.pool);
  if(!v.verified)throw Error('F05_3B_SCHEMA_NOT_VERIFIED');
  once.add(auth);
 }else{
  const last=(await auth.pool.query('SELECT checksum FROM public.f03_schema_migrations WHERE migration_id=$1',[ID])).rows[0];
  if(last?.checksum!==checksum)throw Error('F05_3B_MIGRATION_CHANGED');
 }
}
async function admin(auth,token,fn){
 await ready(auth);
 return (await auth.withSession(token,async(c,a,s)=>{
  const n=Number(a?.system_admin_id);
  if(s?.restricted||a?.principal_kind!=='system_admin'||a?.employee_id!==null||
     a?.subject_status!=='active'||a?.credential_state!=='enabled'||
     a?.force_password_change!==false||!isInt(n))return deny('F05_3B_NOT_ADMIN_CONTROL_PLANE');
  const x=(await c.query("SELECT system_admin_id FROM public.system_admins WHERE system_admin_id=$1 AND account_status='active' FOR SHARE",[n])).rows;
  if(x.length!==1)return deny('F05_3B_GOVERNANCE_REVOKED');
  return fn(c,n);
 },{normalOnly:true}))??deny('F05_3B_ADMIN_SESSION_REQUIRED');
}
export async function issueCredential(auth,adminToken,request){
 if(!shape(request,'eventKey')||!event(request.eventKey))return deny('F05_3B_GRANT_INPUT');
 return admin(auth,adminToken,async(c,actor)=>{
  const token='mbci_'+randomBytes(32).toString('base64url');
  const sql="INSERT INTO public.f05_3b_sync_credentials(secret_sha256,issue_event_key,issued_by_system_admin_id) VALUES($1,$2,$3) RETURNING credential_id";
  const rec=(await c.query(sql,[hash(token),request.eventKey,actor])).rows[0];
  await c.query("INSERT INTO public.f05_3b_control_audit(action,actor_system_admin_id,credential_id,event_key) VALUES('ISSUE_CREDENTIAL',$1,$2,$3)",
   [actor,rec.credential_id,'control:'+request.eventKey]);
  return ok('F05_3B_TEST_CREDENTIAL_ISSUED',{credentialId:Number(rec.credential_id),token});
 });
}
export async function setApiEnabled(auth,adminToken,request){
 if(!shape(request,'action,enabled,eventKey')||!names.includes(request.action)||
  typeof request.enabled!=='boolean'||!event(request.eventKey))return deny('F05_3B_CONTROL_INPUT');
 return admin(auth,adminToken,async(c,actor)=>{
  const q=await c.query('UPDATE public.f05_3b_api_controls SET enabled=$1,version=version+1,configured_by_system_admin_id=$2,configured_at=transaction_timestamp() WHERE action=$3 RETURNING version',[request.enabled,actor,request.action]);
  if(q.rowCount!==1)return deny('F05_3B_UNKNOWN_ACTION');
  await c.query("INSERT INTO public.f05_3b_control_audit(action,actor_system_admin_id,api_action,event_key) VALUES($1,$2,$3,$4)",
   [request.enabled?'ENABLE_API':'DISABLE_API',actor,request.action,request.eventKey]);
  return ok('F05_3B_API_CONTROL_UPDATED',{version:Number(q.rows[0].version)});
 });
}
export async function revokeCredential(auth,adminToken,request){
 if(!shape(request,'credentialId,eventKey,version')||![request.credentialId,request.version].every(isInt)||!event(request.eventKey))
  return deny('F05_3B_REVOKE_INPUT');
 return admin(auth,adminToken,async(c,actor)=>{
  const x=await c.query('UPDATE public.f05_3b_sync_credentials SET revoked_at=transaction_timestamp(),version=version+1 WHERE credential_id=$1 AND version=$2 AND revoked_at IS NULL RETURNING credential_id',
   [request.credentialId,request.version]);
  if(x.rowCount!==1)return deny('F05_3B_CREDENTIAL_REVOKED_OR_STALE');
  await c.query("INSERT INTO public.f05_3b_control_audit(action,actor_system_admin_id,credential_id,event_key) VALUES('REVOKE_CREDENTIAL',$1,$2,$3)",[actor,request.credentialId,request.eventKey]);
  return ok('F05_3B_CREDENTIAL_REVOKED');
 });
}
async function authorized(c,token,action) {
 if(!secret(token)||!names.includes(action))return null;
 const match=(await c.query("SELECT c.credential_id FROM public.f05_3b_sync_credentials c JOIN public.f05_3b_api_controls s ON s.action=$2 AND s.enabled=true WHERE c.secret_sha256=$1 AND c.revoked_at IS NULL FOR SHARE OF c,s",
 [hash(token),action])).rows;
 return match.length===1?Number(match[0].credential_id):null;
}
function upsertInput(p){
 return shape(p,'brandId,carCode,eventKey,modelId,modelYear,seriesId,state')&&event(p.eventKey)&&car(p.carCode)&&
 [p.brandId,p.seriesId,p.modelId].every(isInt)&&
 Number.isInteger(p.modelYear)&&p.modelYear>=1980&&p.modelYear<=2100&&['active','offline'].includes(p.state);
}
async function modelVerified(c,p){
 const rows=(await c.query('SELECT m.model_id FROM public.vehicle_models m JOIN public.vehicle_series s ON s.series_id=m.series_id AND s.brand_id=m.brand_id JOIN public.vehicle_brands b ON b.brand_id=m.brand_id WHERE m.model_id=$1 AND m.brand_id=$2 AND m.series_id=$3 AND m.model_year=$4 AND m.profile_status=$5 AND b.status=$6 AND s.status=$6 FOR SHARE OF m,b,s',
 [p.modelId,p.brandId,p.seriesId,p.modelYear,'complete','active'])).rows;
 return rows.length===1;
}
const identityMatches=(x,p)=>Number(x.model_id)===p.modelId&&Number(x.brand_id)===p.brandId&&
 Number(x.series_id)===p.seriesId&&Number(x.model_year)===p.modelYear;
const serialize=p=>hash(JSON.stringify(p));
async function receipt(c,{eventKey,action,credentialId,carCode=null,vehicleId=null,outcome,payload,count=0}){
 await c.query("INSERT INTO public.f05_3b_sync_receipts(event_key,action,credential_id,car_code,vehicle_id,outcome,payload_sha256,count_rows) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
 [eventKey,action,credentialId,carCode,vehicleId,outcome,serialize(payload),count]);
}
async function transactional(auth,token,action,fn){
 await ready(auth);
 const c=await auth.pool.connect();
 try{
  await c.query('BEGIN');
  const credentialId=await authorized(c,token,action);
  if(credentialId===null){await c.query('ROLLBACK');return deny('F05_3B_CREDENTIAL_OR_API_DISABLED')}
  const result=await fn(c,credentialId);
  await c.query('COMMIT');
  return result;
 }catch(e){
  await c.query('ROLLBACK').catch(()=>{});
  if(['23505','23503','23514','40001','40P01','55P03'].includes(e?.code))
   return deny('F05_3B_DATABASE_CONFLICT_OR_STALE');
  throw e;
 }finally{c.release()}
}
export async function syncUpsert(auth,token,p,{checkpoint}={}){
 if(!upsertInput(p))return deny('F05_3B_UNTRUSTED_IDENTITY_INPUT');
 if(checkpoint!==undefined&&(process.env.CI!=='true'||typeof checkpoint!=='function'))
  return deny('F05_3B_TEST_CHECKPOINT_DENIED');
 return transactional(auth,token,'upsert',async(c,credentialId)=>{
  await c.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+p.carCode]);
  const prev=(await c.query('SELECT * FROM public.f05_3b_sync_receipts WHERE event_key=$1 FOR SHARE',[p.eventKey])).rows[0];
  if(prev){
   if(prev.payload_sha256!==serialize(p)||prev.action!=='upsert')
    return deny('F05_3B_EVENT_KEY_PAYLOAD_COLLISION');
   // Idempotence must preserve a prior denial; an anomaly replay may never
   // turn the original unsafe source event into an apparent success.
   if(prev.outcome==='IDENTITY_CONFLICT')return deny('F05_3B_CORE_IDENTITY_ANOMALY');
   if(prev.outcome==='CONVERTED_SUPPRESSED')return deny('F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
   return ok('F05_3B_EVENT_ALREADY_PROCESSED',
    {vehicleId:prev.vehicle_id===null?null:Number(prev.vehicle_id),outcome:prev.outcome});
  }
  const line=(await c.query("SELECT * FROM public.f05_3b_sync_lineages WHERE source_platform='JYT' AND car_code=$1 FOR UPDATE",[p.carCode])).rows[0];
  if(checkpoint)await checkpoint('source_locked',c);
  if(line){
   // PDM-04 §4.3 takes priority over ordinary conflict: a converted historical
   // JYT car_code never becomes an operator-reviewable, reactivated wholesale car.
   const live=(await c.query('SELECT source_type FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[line.vehicle_id])).rows[0];
   if(!live)throw Error('F05_3B_LINEAGE_ORPHANED');
   if(live.source_type!=='wholesale'){
    await receipt(c,{eventKey:p.eventKey,action:'upsert',credentialId,carCode:p.carCode,
     vehicleId:Number(line.vehicle_id),outcome:'CONVERTED_SUPPRESSED',payload:p});
    return deny('F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
   }
  }
  if(line&&!identityMatches(line,p)){
   await receipt(c,{eventKey:p.eventKey,action:'upsert',credentialId,carCode:p.carCode,
    vehicleId:Number(line.vehicle_id),outcome:'IDENTITY_CONFLICT',payload:p});
   return deny('F05_3B_CORE_IDENTITY_ANOMALY');
  }
  if(!await modelVerified(c,p))return deny('F05_3B_MODEL_MAPPING_SOURCE_GAP');
  if(!line){
   // No trust source is established by merely knowing a JYT publisher or car_code;
   // only this separately authenticated backend credential may create source facts.
   if(p.state!=='active')return deny('F05_3B_NO_EXISTING_ACTIVE_VEHICLE');
   const v=(await c.query("INSERT INTO public.vehicles(source_type,source_sale_status,platform_visibility,model_id) VALUES('wholesale','active','visible',$1) RETURNING vehicle_id",[p.modelId])).rows[0];
   const vid=Number(v.vehicle_id);
   const cy=(await c.query('INSERT INTO public.vehicle_listing_cycles(vehicle_id,started_at) VALUES($1,transaction_timestamp()) RETURNING listing_cycle_id',[vid])).rows[0];
   const cycle=Number(cy.listing_cycle_id);
   await c.query("INSERT INTO public.f05_3b_sync_lineages(source_platform,car_code,vehicle_id,brand_id,series_id,model_id,model_year,current_cycle_id) VALUES('JYT',$1,$2,$3,$4,$5,$6,$7)",
    [p.carCode,vid,p.brandId,p.seriesId,p.modelId,p.modelYear,cycle]);
   await receipt(c,{eventKey:p.eventKey,action:'upsert',credentialId,carCode:p.carCode,vehicleId:vid,outcome:'IMPORTED',payload:p,count:1});
   return ok('F05_3B_IMPORTED',{vehicleId:vid,listingCycleId:cycle});
  }
  const vid=Number(line.vehicle_id);
  const v=(await c.query('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vid])).rows[0];
  if(!v)throw Error('F05_3B_LINEAGE_ORPHANED');
  // Converted car_code always stays tied to the original vehicle; NEVER become a second wholesale.
  if(v.source_type!=='wholesale'){
   await receipt(c,{eventKey:p.eventKey,action:'upsert',credentialId,carCode:p.carCode,vehicleId:vid,outcome:'CONVERTED_SUPPRESSED',payload:p});
   return deny('F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
  }
  if(!identityMatches(line,p)||Number(v.model_id)!==p.modelId){
   await receipt(c,{eventKey:p.eventKey,action:'upsert',credentialId,carCode:p.carCode,vehicleId:vid,outcome:'IDENTITY_CONFLICT',payload:p});
   return deny('F05_3B_CORE_IDENTITY_ANOMALY');
  }
  let cycle=Number(line.current_cycle_id),outcome='UPDATED';
  const cy=(await c.query('SELECT * FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR UPDATE',[cycle,vid])).rows[0];
  if(!cy)throw Error('F05_3B_CYCLE_LINK_MISSING');
  if(p.state==='offline'&&v.source_sale_status==='active'){
   await c.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[vid]);
   await c.query("UPDATE public.vehicle_listing_cycles SET ended_at=transaction_timestamp(),end_reason='upstream_offline' WHERE listing_cycle_id=$1 AND ended_at IS NULL",[cycle]);
   outcome='OFFLINED';
  }else if(p.state==='active'&&v.source_sale_status==='offline'){
   if(cy.ended_at===null)return deny('F05_3B_OFFLINE_WITH_OPEN_CYCLE');
   const next=(await c.query('INSERT INTO public.vehicle_listing_cycles(vehicle_id,started_at) VALUES($1,transaction_timestamp()) RETURNING listing_cycle_id',[vid])).rows[0];
   cycle=Number(next.listing_cycle_id);
   await c.query("UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=$1",[vid]);
   await c.query('UPDATE public.f05_3b_sync_lineages SET current_cycle_id=$1,version=version+1 WHERE lineage_id=$2 AND version=$3',
    [cycle,line.lineage_id,line.version]);
   outcome='RELISTED';
  }else if(p.state==='offline')outcome='ALREADY_OFFLINE';
  else if(cy.ended_at!==null)return deny('F05_3B_ACTIVE_WITH_ENDED_CYCLE');
  await receipt(c,{eventKey:p.eventKey,action:'upsert',credentialId,carCode:p.carCode,vehicleId:vid,outcome,payload:p,count:1});
  return ok('F05_3B_'+outcome,{vehicleId:vid,listingCycleId:cycle});
 });
}
export async function syncBatchOffline(auth,token,p){
 if(!shape(p,'carCodes,eventKey')||!event(p.eventKey)||!Array.isArray(p.carCodes)||
 p.carCodes.length<1||p.carCodes.length>25||new Set(p.carCodes).size!==p.carCodes.length||!p.carCodes.every(car))
 return deny('F05_3B_OFFLINE_BATCH_INPUT');
 // One request is atomic: every matched current JYT identity is checked before COMMIT.
 return transactional(auth,token,'offline',async(c,credentialId)=>{
  const existing=(await c.query('SELECT * FROM public.f05_3b_sync_receipts WHERE event_key=$1',[p.eventKey])).rows[0];
  if(existing)return existing.payload_sha256===serialize(p)&&existing.action==='offline'
   ?ok('F05_3B_OFFLINE_BATCH_IDEMPOTENT',{count:existing.count_rows}):deny('F05_3B_EVENT_KEY_PAYLOAD_COLLISION');
  let count=0;
  for(const code of [...p.carCodes].sort()){
   await c.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+code]);
   const row=(await c.query("SELECT l.vehicle_id,l.current_cycle_id,v.source_type,v.source_sale_status FROM public.f05_3b_sync_lineages l JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id WHERE l.source_platform='JYT' AND l.car_code=$1 FOR UPDATE OF l,v",[code])).rows[0];
   if(!row||row.source_type!=='wholesale')continue;
   if(row.source_sale_status==='active'){
    await c.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[row.vehicle_id]);
    const result=await c.query("UPDATE public.vehicle_listing_cycles SET ended_at=transaction_timestamp(),end_reason='upstream_offline' WHERE listing_cycle_id=$1 AND vehicle_id=$2 AND ended_at IS NULL",[row.current_cycle_id,row.vehicle_id]);
    if(result.rowCount!==1)throw Error('F05_3B_INCONSISTENT_CYCLE_ON_OFFLINE');
    count++;
   }
  }
  await receipt(c,{eventKey:p.eventKey,action:'offline',credentialId,outcome:count?'OFFLINED':'NOT_FOUND',payload:p,count});
  return ok('F05_3B_BATCH_OFFLINED',{count});
 });
}
export async function syncCurrent(auth,token,p){
 if(!shape(p,'afterVehicleId,eventKey,limit')||!event(p.eventKey)||!Number.isSafeInteger(p.afterVehicleId)||p.afterVehicleId<0||
 !Number.isSafeInteger(p.limit)||p.limit<1||p.limit>50)return deny('F05_3B_PAGINATION_BOUNDARY');
 return transactional(auth,token,'current',async(c,credentialId)=>{
  const previous=(await c.query('SELECT 1 FROM public.f05_3b_sync_receipts WHERE event_key=$1',[p.eventKey])).rows;
  if(previous.length)return deny('F05_3B_LIST_EVENT_REPLAY');
  const rows=(await c.query("SELECT l.car_code,l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id AND cy.vehicle_id=l.vehicle_id WHERE l.source_platform='JYT' AND v.source_type='wholesale' AND v.source_sale_status='active' AND v.archived_at IS NULL AND cy.ended_at IS NULL AND l.vehicle_id>$1 ORDER BY l.vehicle_id ASC LIMIT $2",
   [p.afterVehicleId,p.limit])).rows.map(x=>({carCode:x.car_code,vehicleId:Number(x.vehicle_id),listingCycleId:Number(x.current_cycle_id)}));
  await receipt(c,{eventKey:p.eventKey,action:'current',credentialId,outcome:'LISTED',payload:p,count:rows.length});
  return ok('F05_3B_CURRENT_JYT',{items:rows,nextAfterVehicleId:rows.length?rows.at(-1).vehicleId:p.afterVehicleId});
 });
}
