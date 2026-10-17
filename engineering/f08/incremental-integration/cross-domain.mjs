// F08 only: real isolated PG16 projection invoking current F05/F06/F07 business rules; NOT production routes.
import {eligibleVehicle,tierFor,failClosed as f05Deny} from '../../f05/deterministic-matching-readiness-four-tier/contract.mjs';
import {productionIssuerDeny as f06Deny} from '../../f06/lockrequest-approval-waitlist-ci/service.mjs';
import {validPublisher,mapSyntheticSyncApi} from '../../f07/trusted-upstream-parent-gate-ci/gate.mjs';
import {requireEvidence} from '../quality-evidence-gate-ci/quality.mjs';
const denied=(code,extra={})=>Object.freeze({allowed:false,production_authorized:false,origin:'CI_PG16_SYNTHETIC_ONLY',code,...extra});
const validId=n=>Number.isSafeInteger(n)&&n>0&&n<2147483647;
const validKey=s=>typeof s==='string'&&/^[a-zA-Z0-9._:-]{12,64}$/.test(s);
const one=async(c,sql,args)=>(await c.query(sql,args)).rows[0];
export async function vehicleRead(c,{employeeId,customerId,vehicleId,priceLimit=90000}={}){
 if(![employeeId,customerId,vehicleId,priceLimit].every(validId))return denied('BAD_IDENTIFIERS');
 const row=await one(c,'SELECT v.*,cu.state customer_state,ow.employee_id current_owner, EXISTS(SELECT 1 FROM bounded_ci.visibility_grants g WHERE g.vehicle_id=v.vehicle_id AND g.customer_id=cu.customer_id AND g.active) has_grant FROM bounded_ci.vehicles v JOIN bounded_ci.customers cu ON cu.customer_id=$1 LEFT JOIN bounded_ci.owner_assignments ow ON ow.customer_id=cu.customer_id AND ow.active WHERE v.vehicle_id=$2',[customerId,vehicleId]);
 if(!row||row.customer_state!=='active'||row.current_owner!==employeeId)return denied('CUSTOMER_OWNER_SCOPE_DENIED');
 if(!eligibleVehicle({source_sale_status:row.sale_status,archived_at:row.archived_at,ended_at:row.ended_at,draft:false,available:true}))return denied('VEHICLE_NOT_SALEABLE');
 if(row.hidden&&!row.has_grant)return denied('HIDDEN_NO_RECOMMENDATION_GRANT');
 const tier=tierFor([{field:'asking_price',mode:'hard',op:'budget',value:priceLimit}],{asking_price:{value:Number(row.asking_price),source:'CI_PG16',kind:'structured'}});
 if(!['high','acceptable'].includes(tier.tier))return denied('MATCH_NOT_ELIGIBLE',{tier:tier.tier});
 return denied('CI_CURRENT_SCOPED_VEHICLE',{tier:tier.tier,vehicleId,ownerId:employeeId});
}
export async function consultation(pool,{employeeId,customerId,vehicleId,eventKey}={}){
 if(!validKey(eventKey))return denied('CONSULTATION_KEY_DENIED');
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  const scope=await vehicleRead(db,{employeeId,customerId,vehicleId});
  if(scope.code!=='CI_CURRENT_SCOPED_VEHICLE'){await db.query('ROLLBACK');return scope}
  const add=await db.query("INSERT INTO bounded_ci.consultations(customer_id,vehicle_id,employee_id,event_key,status) VALUES($1,$2,$3,$4,'pending') ON CONFLICT(event_key) DO NOTHING RETURNING consultation_id",[customerId,vehicleId,employeeId,eventKey]);
  const found=add.rows[0]||await one(db,'SELECT consultation_id,customer_id,vehicle_id,employee_id FROM bounded_ci.consultations WHERE event_key=$1',[eventKey]);
  if(!found||('customer_id' in found&&(found.customer_id!==customerId||found.vehicle_id!==vehicleId||found.employee_id!==employeeId))){await db.query('ROLLBACK');return denied('CONSULTATION_KEY_REBOUND_DENIED')}
  await db.query('COMMIT');
  return denied('CI_CONSULTATION_RECORDED',{consultationId:found.consultation_id,created:add.rowCount===1});
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{db.release()}
}
export async function lockRequest(pool,{employeeId,customerId,vehicleId,eventKey}={}){
 if(!validKey(eventKey))return denied('LOCK_KEY_DENIED');
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  await db.query('SELECT vehicle_id FROM bounded_ci.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vehicleId]);
  const scope=await vehicleRead(db,{employeeId,customerId,vehicleId});
  if(scope.code!=='CI_CURRENT_SCOPED_VEHICLE'){await db.query('ROLLBACK');return scope}
  const contact=await one(db,"SELECT consultation_id FROM bounded_ci.consultations WHERE customer_id=$1 AND vehicle_id=$2 AND employee_id=$3 AND status='pending' FOR SHARE",[customerId,vehicleId,employeeId]);
  if(!contact){await db.query('ROLLBACK');return denied('LOCK_REQUIRES_CURRENT_CONSULTATION')}
  const rival=await one(db,'SELECT customer_id FROM bounded_ci.priority_claims WHERE vehicle_id=$1 AND active FOR SHARE',[vehicleId]);
  if(rival&&rival.customer_id!==customerId){await db.query('ROLLBACK');return denied('RIVAL_PRIORITY_DENIED')}
  const existing=await one(db,"SELECT request_id,customer_id,event_key FROM bounded_ci.lock_requests WHERE vehicle_id=$1 AND status='pending' FOR SHARE",[vehicleId]);
  if(existing){
   await db.query('COMMIT');
   return existing.customer_id===customerId&&existing.event_key===eventKey?denied('CI_LOCK_REQUEST_REPLAY',{requestId:existing.request_id}):denied('LOCK_ALREADY_PENDING_WAITLIST_NOT_AUTOGRANTED');
  }
  const inserted=await one(db,"INSERT INTO bounded_ci.lock_requests(customer_id,vehicle_id,event_key,status) VALUES($1,$2,$3,'pending') RETURNING request_id",[customerId,vehicleId,eventKey]);
  await db.query('COMMIT');
  return denied('CI_LOCK_REQUEST_PENDING_APPROVAL',{requestId:inserted.request_id});
 }catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{db.release()}
}
export function upstreamSourceCheck({source_platform,upstream_publisher_id,vehicle_id,car_code}={}){
 const ctx={source_platform,upstream_publisher_id,vehicle_id};
 if(!validPublisher(ctx))return denied('PUBLISHER_ID_SOURCE_DENIED');
 const result=mapSyntheticSyncApi('UPSERT_VEHICLE',{...ctx,car_code,job_id:'job-1'});
 if(result.code!=='PRODUCTION_SYNC_API_ISSUER_SOURCE_GAP')return denied('UPSTREAM_SOURCE_CONTRACT_DENIED');
 const state=requireEvidence({level:'SOURCE_GAP'},{target:'NONPRODUCTION'});
 return denied('SIGNED_UPSTREAM_PARENT_SOURCE_GAP',{source_gate:state.reason});
}
export function assertProductionIssuersClosed(){
 const a=f05Deny(),b=f06Deny();
 if(a.allowed!==false||b.allowed!==false)throw Error('PRODUCTION_SOURCE_GAP_IMPROPERLY_GRANTED');
 return {f05:a.code,f06:b.code,upstream:'SOURCE_GAP_OPEN',real_external_invocations:0};
}
