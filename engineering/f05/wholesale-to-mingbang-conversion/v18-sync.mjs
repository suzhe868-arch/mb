// Version-specific CI-only forward compatibility adapter for the F05-3B
// three independently enabled source actions. NEVER registered in production.
// Explicitly does NOT use frozen v17 ready/verify after 000018.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const deny=code=>({allowed:false,code}),ok=(code,extra={})=>({allowed:true,code,...extra});
const ev=x=>typeof x==='string'&&/^[a-zA-Z0-9._:-]{20,160}$/.test(x);
const code=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{4,96}$/.test(x);
const num=x=>Number.isSafeInteger(x)&&x>0&&x<=2147483647;
const exact=(o,names)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===names;
const enabled=()=>{for(const [k,v] of Object.entries({
 CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
 F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
 if(process.env[k]!==v)throw Error('F05_3C_V18_ADAPTER_NEVER_PRODUCTION_'+k)};
const key=x=>typeof x==='string'&&/^mbci_[A-Za-z0-9_-]{43}$/.test(x);
const ensure=async(auth,token)=>{
 enabled();if(!auth?.pool||!key(token))return false;
 const seal=await verify(auth.pool);
 return seal.verified===true;
};
async function run(auth,token,action,fn){
 if(!await ensure(auth,token))return deny('F05_3C_V18_UNTRUSTED_CREDENTIAL_OR_VERSION');
 const c=await auth.pool.connect();
 try{
  await c.query('BEGIN');
  // Cross-action secrets never confer Employee rights, publisher phone, or
  // SYSTEM_ADMIN authority. Revocation + individual switch locked until COMMIT.
  const rows=(await c.query(
   "SELECT cr.credential_id FROM public.f05_3b_sync_credentials cr "+
   "JOIN public.f05_3b_api_controls ctrl ON ctrl.action=$2 AND ctrl.enabled=true "+
   "WHERE cr.secret_sha256=$1 AND cr.revoked_at IS NULL FOR SHARE OF cr,ctrl",
   [hash(token),action])).rows;
  if(rows.length!==1){await c.query('ROLLBACK');return deny('F05_3C_V18_KEY_REVOKED_OR_ACTION_DISABLED')}
  const result=await fn(c,Number(rows[0].credential_id));
  await c.query('COMMIT');return result;
 }catch(e){
  await c.query('ROLLBACK').catch(()=>{});
  if(['23505','23503','23514','40001','40P01','55P03'].includes(e?.code))return deny('F05_3C_V18_REAL_DB_CONFLICT');
  throw e;
 }finally{c.release()}
}
async function receipt(c,actor,action,eventKey,payload,outcome,car=null,vehicle=null,count=0){
 await c.query("INSERT INTO public.f05_3b_sync_receipts(event_key,action,credential_id,car_code,vehicle_id,outcome,payload_sha256,count_rows) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
  [eventKey,action,actor,car,vehicle,outcome,hash(JSON.stringify(payload)),count]);
}
async function eventSeen(c,eventKey,action,p){
 const row=(await c.query('SELECT * FROM public.f05_3b_sync_receipts WHERE event_key=$1 FOR SHARE',[eventKey])).rows[0];
 if(!row)return null;
 if(row.action!==action||row.payload_sha256!==hash(JSON.stringify(p)))return deny('F05_3C_V18_EVENT_PAYLOAD_COLLISION');
 if(row.outcome==='CONVERTED_SUPPRESSED')return deny('F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
 if(row.outcome==='IDENTITY_CONFLICT')return deny('F05_3B_CORE_IDENTITY_ANOMALY');
 return ok('F05_3B_EVENT_ALREADY_PROCESSED',
 {vehicleId:row.vehicle_id===null?null:Number(row.vehicle_id),outcome:row.outcome});
}
export async function syncUpsert(auth,token,p){
 if(!exact(p,'brandId,carCode,eventKey,modelId,modelYear,seriesId,state')||
 !ev(p.eventKey)||!code(p.carCode)||![p.brandId,p.seriesId,p.modelId].every(num)||
 !Number.isInteger(p.modelYear)||p.modelYear<1980||p.modelYear>2100||
 !['active','offline'].includes(p.state))return deny('F05_3C_V18_UPSERT_FIELDS');
 return run(auth,token,'upsert',async(c,actor)=>{
  await c.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+p.carCode]);
  const old=await eventSeen(c,p.eventKey,'upsert',p);if(old)return old;
  const lineage=(await c.query("SELECT * FROM public.f05_3b_sync_lineages WHERE source_platform='JYT' AND car_code=$1 FOR UPDATE",[p.carCode])).rows[0];
  if(!lineage){
   // Production provenance for previously unseen v18-model source facts
   // is deliberately not inferred from arbitrary input, even with a valid key.
   return deny('F05_3C_V18_NEW_CAR_SOURCE_MAPPING_GAP');
  }
  const vehicleId=Number(lineage.vehicle_id);
  const v=(await c.query('SELECT * FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[vehicleId])).rows[0];
  if(!v)throw Error('F05_3C_V18_LINEAGE_ORPHAN');
  if(v.source_type!=='wholesale'){
   await receipt(c,actor,'upsert',p.eventKey,p,'CONVERTED_SUPPRESSED',p.carCode,vehicleId);
   return deny('F05_3B_CONVERTED_UPSTREAM_SUPPRESSED');
  }
  if(Number(lineage.brand_id)!==p.brandId||Number(lineage.series_id)!==p.seriesId||
  Number(lineage.model_id)!==p.modelId||Number(lineage.model_year)!==p.modelYear||
  Number(v.model_id)!==p.modelId){
   await receipt(c,actor,'upsert',p.eventKey,p,'IDENTITY_CONFLICT',p.carCode,vehicleId);
   return deny('F05_3B_CORE_IDENTITY_ANOMALY');
  }
  const cy=(await c.query("SELECT * FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR UPDATE",
    [lineage.current_cycle_id,vehicleId])).rows[0];
  if(!cy)throw Error('F05_3C_V18_CURRENT_CYCLE_MISSING');
  let outcome='UPDATED',cycle=Number(lineage.current_cycle_id);
  if(p.state==='offline'&&v.source_sale_status==='active'){
   if(cy.ended_at!==null)throw Error('F05_3C_V18_ACTIVE_WITH_ENDED_CYCLE');
   await c.query("UPDATE public.vehicle_listing_cycles SET ended_at=transaction_timestamp(),end_reason='upstream_offline' WHERE listing_cycle_id=$1",[cycle]);
   await c.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[vehicleId]);outcome='OFFLINED';
  }else if(p.state==='active'&&v.source_sale_status==='offline'){
   if(cy.ended_at===null)throw Error('F05_3C_V18_OFFLINE_WITH_OPEN_CYCLE');
   const newCycle=(await c.query('INSERT INTO public.vehicle_listing_cycles(vehicle_id,started_at) VALUES($1,transaction_timestamp()) RETURNING listing_cycle_id',[vehicleId])).rows[0];
   cycle=Number(newCycle.listing_cycle_id);
   await c.query('UPDATE public.f05_3b_sync_lineages SET current_cycle_id=$1,version=version+1 WHERE lineage_id=$2 AND version=$3',
    [cycle,lineage.lineage_id,lineage.version]);
   await c.query("UPDATE public.vehicles SET source_sale_status='active' WHERE vehicle_id=$1",[vehicleId]);outcome='RELISTED';
  }else if(p.state==='offline')outcome='ALREADY_OFFLINE';
  else if(cy.ended_at!==null)throw Error('F05_3C_V18_CYCLE_INCONSISTENT');
  await receipt(c,actor,'upsert',p.eventKey,p,outcome,p.carCode,vehicleId,1);
  return ok('F05_3B_'+outcome,{vehicleId,listingCycleId:cycle});
 });
}
export async function syncBatchOffline(auth,token,p){
 if(!exact(p,'carCodes,eventKey')||!ev(p.eventKey)||!Array.isArray(p.carCodes)||p.carCodes.length<1||p.carCodes.length>25||
 new Set(p.carCodes).size!==p.carCodes.length||!p.carCodes.every(code))
 return deny('F05_3C_V18_OFFLINE_INPUT');
 return run(auth,token,'offline',async(c,actor)=>{
  // Serialize the entire event before checking receipt and per-car state.
  await c.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT-BATCH-EVENT:'+p.eventKey]);
  const prior=await eventSeen(c,p.eventKey,'offline',p);
  if(prior){
   if(!prior.allowed)return prior;
   // Replays must return the original immutable PG16 receipt count.
   const rows=(await c.query(
    'SELECT count_rows FROM public.f05_3b_sync_receipts WHERE event_key=$1 FOR SHARE',
    [p.eventKey])).rows;
   if(rows.length!==1)throw Error('F05_3C_V18_IMMUTABLE_RECEIPT_MISSING');
   return ok('F05_3B_OFFLINE_BATCH_IDEMPOTENT',{count:Number(rows[0].count_rows)});
  }
  let count=0;
  for(const car of [...p.carCodes].sort()){
   await c.query('SELECT pg_advisory_xact_lock(20261011,hashtext($1))',['JYT:'+car]);
   const r=(await c.query(
    "SELECT l.vehicle_id,l.current_cycle_id,v.source_type,v.source_sale_status FROM public.f05_3b_sync_lineages l "+
    "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id WHERE l.source_platform='JYT' AND l.car_code=$1 FOR UPDATE OF l,v",[car])).rows[0];
   if(!r||r.source_type!=='wholesale'||r.source_sale_status!=='active')continue;
   const end=await c.query("UPDATE public.vehicle_listing_cycles SET ended_at=transaction_timestamp(),end_reason='upstream_offline' WHERE listing_cycle_id=$1 AND vehicle_id=$2 AND ended_at IS NULL",
     [r.current_cycle_id,r.vehicle_id]);
   if(end.rowCount!==1)throw Error('F05_3C_V18_BATCH_CYCLE_INCONSISTENT');
   await c.query("UPDATE public.vehicles SET source_sale_status='offline' WHERE vehicle_id=$1",[r.vehicle_id]);count++;
  }
  await receipt(c,actor,'offline',p.eventKey,p,count?'OFFLINED':'NOT_FOUND',null,null,count);
  return ok('F05_3B_BATCH_OFFLINED',{count});
 });
}
export async function syncCurrent(auth,token,p){
 if(!exact(p,'afterVehicleId,eventKey,limit')||!ev(p.eventKey)||!Number.isSafeInteger(p.afterVehicleId)||
 p.afterVehicleId<0||!Number.isInteger(p.limit)||p.limit<1||p.limit>50)
 return deny('F05_3C_V18_PAGE_INPUT');
 return run(auth,token,'current',async(c,actor)=>{
  const seen=await eventSeen(c,p.eventKey,'current',p);if(seen)return deny('F05_3C_V18_LIST_EVENT_REPLAY');
  const rows=(await c.query(
   "SELECT l.car_code,l.vehicle_id,l.current_cycle_id FROM public.f05_3b_sync_lineages l "+
   "JOIN public.vehicles v ON v.vehicle_id=l.vehicle_id "+
   "JOIN public.vehicle_listing_cycles cy ON cy.listing_cycle_id=l.current_cycle_id AND cy.vehicle_id=l.vehicle_id "+
   "WHERE l.source_platform='JYT' AND v.source_type='wholesale' AND v.source_sale_status='active' "+
   "AND v.archived_at IS NULL AND cy.ended_at IS NULL AND l.vehicle_id>$1 ORDER BY l.vehicle_id LIMIT $2",
   [p.afterVehicleId,p.limit])).rows.map(r=>({carCode:r.car_code,vehicleId:Number(r.vehicle_id),listingCycleId:Number(r.current_cycle_id)}));
  await receipt(c,actor,'current',p.eventKey,p,'LISTED',null,null,rows.length);
  return ok('F05_3B_CURRENT_JYT',{items:rows,nextAfterVehicleId:rows.length?rows.at(-1).vehicleId:p.afterVehicleId});
 });
}
