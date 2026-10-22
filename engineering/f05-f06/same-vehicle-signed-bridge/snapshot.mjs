import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function rows(db,sql,args=[]){return (await db.query(sql,args)).rows.map(x=>x.row)}
async function one(db,sql,args=[]){return (await db.query(sql,args)).rows[0]||null}
export async function captureSnapshot(db,ids){
 const v=String(ids.vehicleId),cy=String(ids.listingCycleId),rq=String(ids.requestId),lk=String(ids.lockId),dp=String(ids.depositId),tx=String(ids.transactionId),pe=String(ids.priceEventId);
 const snapshot={
  vehicle:await (async()=>{
   const x=await one(db,"SELECT vehicle_id::text,source_type,model_id::text,source_sale_status,platform_visibility,formally_published_at,archived_at FROM public.vehicles WHERE vehicle_id=$1::bigint",[v]);
   const vin=(await one(db,'SELECT vin FROM public.vehicles WHERE vehicle_id=$1::bigint',[v]));
   return x?{row:{...x,vinSha256:sha256(vin?.vin||'')}}:null;
  })(),
  cycle:await one(db,'SELECT to_jsonb(x) AS row FROM public.vehicle_listing_cycles x WHERE vehicle_id=$1::bigint AND listing_cycle_id=$2::bigint',[v,cy]),
  responsibilities:await (async()=>{
   const result=(await db.query('SELECT responsibility_id::text,responsible_employee_id::text,team_id::text,source_snapshot,provenance_kind,revoked_at,listing_cycle_id::text,vehicle_id::text,trusted_event_key FROM public.vehicle_current_responsibilities WHERE vehicle_id=$1::bigint AND listing_cycle_id=$2::bigint ORDER BY responsibility_id',[v,cy])).rows;
   return result.map(x=>{const key=x.trusted_event_key||'';delete x.trusted_event_key;return {row:{...x,trustedEventKeySha256:sha256(key)}}});
  })(),
  priceHistory:await rows(db,'SELECT to_jsonb(x) AS row FROM public.vehicle_price_history x WHERE vehicle_id=$1::bigint ORDER BY price_event_id',[v]),
  projectedPriceEvent:await one(db,'SELECT to_jsonb(x) AS row FROM public.vehicle_price_history x WHERE price_event_id=$1::bigint',[pe]),
  lockRequest:await one(db,'SELECT to_jsonb(x) AS row FROM public.lock_requests x WHERE lock_request_id=$1::bigint',[rq]),
  lock:await one(db,'SELECT to_jsonb(x) AS row FROM public.locks x WHERE lock_id=$1::bigint',[lk]),
  lockSnapshot:await one(db,'SELECT to_jsonb(x) AS row FROM f06_composite_v1.lock_snapshots x WHERE lock_id=$1::bigint',[lk]),
  requestKeys:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_composite_v1.request_keys x WHERE request_id=$1::bigint ORDER BY request_id',[rq]),
  decisionKeys:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_composite_v1.decision_keys x WHERE request_id=$1::bigint ORDER BY key_sha256',[rq]),
  lockEvents:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_composite_v1.events x WHERE request_id=$1::bigint ORDER BY event_id',[rq]),
  signedEvents:await rows(db,
   "SELECT to_jsonb(x) AS row FROM f06_composite_v1.issued_events x WHERE "+
   "((event_kind IN ('lock_request_created','lock_request_approved') AND parent_object_id=$1::bigint) OR "+
   "(event_kind='signed_lock' AND parent_object_id=$2::bigint) OR "+
   "(event_kind='signed_deposit' AND parent_object_id=$3::bigint) OR "+
   "(event_kind='signed_tx' AND parent_object_id=$4::bigint)) ORDER BY event_id",[rq,lk,dp,tx]),
  depositReceipt:await rows(db,'SELECT to_jsonb(x) AS row FROM public.deposit_receipts x WHERE lock_id=$1::bigint ORDER BY deposit_id',[lk]),
  depositProvenance:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_3a_ci.receipt_provenance x WHERE lock_id=$1::bigint ORDER BY deposit_id',[lk]),
  depositKeys:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_3a_ci.request_keys x WHERE lock_id=$1::bigint ORDER BY key_sha256',[lk]),
  transaction:await one(db,'SELECT to_jsonb(x) AS row FROM public.transactions x WHERE transaction_id=$1::bigint',[tx]),
  transactionOrigin:await one(db,'SELECT to_jsonb(x) AS row FROM f06_real_tx_ci.origins x WHERE transaction_id=$1::bigint',[tx]),
  transactionKeys:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_real_tx_ci.request_keys x WHERE transaction_id=$1::bigint ORDER BY key_sha256',[tx]),
  transactionEvents:await rows(db,'SELECT to_jsonb(x) AS row FROM f06_real_tx_ci.events x WHERE transaction_id=$1::bigint ORDER BY event_id',[tx]),
  audit:await rows(db,
   "SELECT to_jsonb(x) AS row FROM public.audit_events x WHERE "+
   "(object_kind='LockRequest' AND object_id=$1) OR "+
   "(object_kind='Lock' AND object_id=$2) OR "+
   "(object_kind='Deposit' AND object_id=$2) OR "+
   "(object_kind='Transaction' AND object_id=$3) ORDER BY audit_id",[rq,lk,tx]),
  bridgeAttestation:await one(db,'SELECT to_jsonb(x) AS row FROM f05_f06_bridge_v1.attestation x WHERE vehicle_id=$1::bigint',[v])
 };
 return snapshot;
}
export function snapshotSha(snapshot){return sha(snapshot)}
export function sha256(value){return createHash('sha256').update(value).digest('hex')}
