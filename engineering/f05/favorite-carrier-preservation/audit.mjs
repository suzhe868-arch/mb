// F05-3F: read-only true-PG16 Favorite carrier inventory; no production routes.
// The signed M94->000018 database has not established a Favorite/collect ledger.
// No Recommendation or customer price entitlement may be relabelled "Favorite".
import {createHash} from 'node:crypto';
import {verify} from '../wholesale-to-mingbang-conversion/migration.mjs';
import {requireDatabaseIdentity} from '../vehicle-stewardship-physical-scope/migration.mjs';
export const GAP='FAVORITE_PHYSICAL_CARRIER_SOURCE_GAP';
const deny=code=>({allowed:false,code});
const positive=x=>Number.isSafeInteger(x)&&x>0&&x<=2147483647;
const gate=()=>{
 for(const [k,v] of Object.entries({CI:'true',GITHUB_ACTIONS:'true',APP_ENV:'test',NODE_ENV:'test',
  F05_2_ISOLATION_CONFIRM:'I_AUTHORIZE_F05_2_DISPOSABLE_PG16_ONLY'}))
  if(process.env[k]!==v)throw Error('F05_3F_CI_ONLY_'+k);
};
export const preservedTables=Object.freeze([
 'locks','transactions','recommendations','customer_price_cycle_unlocks',
 'customer_price_unlock_events','vehicle_images','vehicle_price_history','vehicle_visibility_grants']);
const reasonPattern=/(^|_)(favou?rites?|collections?|bookmarks?|saved_vehicles?)(_|$)/i;
export async function auditFavoriteCarrier(c){
 gate();await requireDatabaseIdentity(c);await verify(c);
 const rows=(await c.query(
  "SELECT n.nspname AS schema,c.relname AS name,c.relkind AS kind FROM pg_class c "+
  "JOIN pg_namespace n ON n.oid=c.relnamespace "+
  "WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m') ORDER BY c.relname")).rows;
 const candidates=rows.filter(x=>reasonPattern.test(x.name));
 // No arbitrary table is automatically trusted; any new plausible physical
 // candidate must go to A for distinct source/FK/permission scrutiny.
 if(candidates.length)throw Error('F05_3F_UNREVIEWED_FAVORITE_CARRIER_'+candidates.map(x=>x.name).join(','));
 const tables=new Set(rows.map(x=>x.name));
 for(const x of [...preservedTables,'vehicles','vehicle_listing_cycles',
  'f05_3b_sync_lineages','f05_3c_wholesale_conversions','f05_3c_conversion_audit','customers'])
  if(!tables.has(x))throw Error('F05_3F_SIGNED_PHYSICAL_CARRIER_DRIFT_'+x);
 const cols=(await c.query(
  "SELECT table_name,column_name FROM information_schema.columns "+
  "WHERE table_schema='public' AND table_name=ANY($1)",[preservedTables])).rows;
 if(!cols.some(x=>x.table_name==='recommendations'&&x.column_name==='customer_id')||
    !cols.some(x=>x.table_name==='customer_price_cycle_unlocks'&&x.column_name==='listing_cycle_id'))
  throw Error('F05_3F_SIGNED_RELATIONSHIP_FIELDS_MISSING');
 const candidateEvents=(await c.query(
  "SELECT table_name FROM information_schema.tables "+
  "WHERE table_schema='public' AND table_name ~* '(favorite|favourite|bookmark|collection)'")).rows;
 if(candidateEvents.length)throw Error('F05_3F_UNREVIEWED_FAVORITE_EVENT_SOURCE');
 return {allowed:false,code:GAP,physicalFavoritePresent:false,
  checkedRelations:rows.length,verifiedPreservedTables:[...preservedTables],
  signedCustomerVehicleCycleRelationPresent:true,
  auditOnly:true};
}
const sqlTarget=(x)=>'public.'+x;
// Derive SHA over actual PG16 rows. Do not use caller snapshots as truth.
export async function snapshotCurrentRelations(c,vehicleId,cycleId,customerId){
 if(![vehicleId,cycleId,customerId].every(positive))throw Error('F05_3F_SNAPSHOT_IDS');
 const result={};
 for(const name of preservedTables){
  const byVehicle=['vehicle_visibility_grants','vehicle_images','vehicle_price_history'].includes(name);
  const query='SELECT row_to_json(t) AS record FROM '+sqlTarget(name)+' t WHERE vehicle_id=$1'+
   (byVehicle?'':' AND listing_cycle_id=$2')+' ORDER BY to_jsonb(t)::text';
  result[name]=(await c.query(query,byVehicle?[vehicleId]:[vehicleId,cycleId])).rows.map(x=>x.record);
 }
 result.customer=(await c.query(
  "SELECT row_to_json(c) AS record FROM public.customers c WHERE customer_id=$1",[customerId])).rows.map(x=>x.record);
 result.lineage=(await c.query(
  "SELECT row_to_json(l) AS record FROM public.f05_3b_sync_lineages l WHERE vehicle_id=$1",[vehicleId])).rows.map(x=>x.record);
 result.cycle=(await c.query(
  "SELECT row_to_json(c) AS record FROM public.vehicle_listing_cycles c WHERE listing_cycle_id=$1 AND vehicle_id=$2",
  [cycleId,vehicleId])).rows.map(x=>x.record);
 return {data:result,sha256:createHash('sha256').update(JSON.stringify(result)).digest('hex')};
}
// Cannot expose Favorite without a signed Customer+Vehicle carrier or action
// contract. No fallback to customer price unlock, recommendation or Lock.
export async function projectFavorite(auth,token,request){
 gate();
 if(!request||typeof request!=='object'||Array.isArray(request)||
  Object.keys(request).sort().join(',')!=='vehicleId'||!positive(request.vehicleId))
  return deny('F05_3F_FIELDS');
 if(!auth?.pool||typeof auth.withSession!=='function')
  throw Error('F05_3F_CURRENT_SESSION_REQUIRED');
 const source=await auditFavoriteCarrier(auth.pool);
 if(source.physicalFavoritePresent)throw Error('F05_3F_UNREVIEWED_FAVORITE_SOURCE');
 return deny(GAP);
}
