// Issue #159: read-only, fail-closed provenance validation for a cancelled PR139/153/156 transaction.
// This is NOT a payment/refund issuer and deliberately cannot mutate public rows.
import {createHash} from 'node:crypto';
import {verify as verifyCancelParent} from '../post-handoff-cancel-http-pg16/service.mjs';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const one = async (c, sql, args=[]) => (await c.query(sql,args)).rows[0];
const deny = code => ({allowed:false,code});
const ok = (code,extra={}) => ({allowed:true,code,...extra});
const same = (a,b) => Number(a) === Number(b);
const identity = (row,t) => !!row &&
  same(row.transaction_id,t.transaction_id) &&
  same(row.source_lock_id,t.source_lock_id) &&
  same(row.customer_id,t.customer_id) &&
  same(row.vehicle_id,t.vehicle_id) &&
  same(row.listing_cycle_id,t.listing_cycle_id);

/**
 * Must be invoked inside the caller's already-open nonprivileged SQL
 * transaction AFTER locking Vehicle -> Transaction in that order.
 * Does not validate funding/authorization; it returns provenance only.
 * All parent signed schema and public catalog attestations are checked first.
 */
export async function verifyCancelledHandoffProvenance(c,transactionId) {
  if(!Number.isSafeInteger(transactionId)||transactionId<=0)
    return deny('F06_BRIDGE_INVALID_TRANSACTION_ID');
  await verifyCancelParent(c);
  const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR SHARE',[transactionId]);
  if(!t||t.status!=='cancelled'||t.completed_at!==null)
    return deny('F06_BRIDGE_NOT_SIGNED_CANCELLED_TRANSACTION');

  const [origin,event,key]=await Promise.all([
    one(c,'SELECT * FROM f06_real_tx_ci.origins WHERE transaction_id=$1 FOR SHARE',[transactionId]),
    one(c,'SELECT * FROM f06_real_tx_ci.events WHERE transaction_id=$1 FOR SHARE',[transactionId]),
    one(c,'SELECT * FROM f06_real_tx_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[transactionId])
  ]);
  if(!identity(origin,t)||!event||!key||origin.issuer!=='CI_SYNTHETIC_NOT_REAL_MONEY'||
     origin.state!=='in_progress'||origin.carrier!=='in_progress'||
     event.event_kind!=='lock_to_transaction'||event.source_status!=='active'||
     event.final_status!=='released'||!same(event.source_lock_id,t.source_lock_id)||
     !same(key.source_lock_id,t.source_lock_id)||
     !same(event.actor_employee_id,origin.actor_employee_id)||
     !same(key.employee_id,origin.actor_employee_id))
    return deny('F06_BRIDGE_PR139_PARENT_SOURCE_INVALID');

  // Original immutable source and historical actor must never be rewritten to
  // match the current owner after a valid handoff.
  const lock=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR SHARE',[t.source_lock_id]);
  const snap=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[t.source_lock_id]);
  if(!lock||!snap||lock.lock_status!=='released'||lock.end_reason!=='converted_to_transaction'||
     !same(lock.vehicle_id,t.vehicle_id)||!same(lock.customer_id,t.customer_id)||
     !same(lock.listing_cycle_id,t.listing_cycle_id)||
     !same(snap.responsible_employee_id,origin.responsible_employee_id)||
     !same(lock.responsible_employee_id,origin.responsible_employee_id))
    return deny('F06_BRIDGE_ORIGINAL_SIGNED_LOCK_INVALID');
  const opened=await one(c,"SELECT count(*)::int AS n FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_tx_ci_atomic_open'",[String(transactionId)]);
  if(opened?.n!==1)return deny('F06_BRIDGE_PR139_OPEN_AUDIT_GAP');
  const otherCancel=await one(c,'SELECT count(*)::int AS n FROM f06_real_cancel_ci.origins WHERE transaction_id=$1',[transactionId]);
  if(otherCancel?.n!==0)return deny('F06_BRIDGE_MIXED_PR146_CANCEL_DENY');

  const events=(await c.query('SELECT * FROM f06_real_handoff_ci.events WHERE transaction_id=$1 ORDER BY version,event_id FOR SHARE',[transactionId])).rows;
  const keys=(await c.query('SELECT * FROM f06_real_handoff_ci.request_keys WHERE transaction_id=$1 ORDER BY event_id FOR SHARE',[transactionId])).rows;
  if(events.length<1||events.length!==keys.length)
    return deny('F06_BRIDGE_HANDOFF_EVENT_KEY_COUNT_INVALID');
  const handoffAudits=await one(c,"SELECT count(*)::int AS n FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_handoff_ci_responsible_transfer'",[String(transactionId)]);
  if(Number(handoffAudits?.n)!==events.length)
    return deny('F06_BRIDGE_HANDOFF_AUDIT_COUNT_INVALID');

  const txDigest=digest([origin,event,key]);
  let responsible=Number(origin.responsible_employee_id);
  let prevEventId=null;
  for(let i=0;i<events.length;i++){
    const h=events[i];
    const matching=keys.filter(k=>k.event_key_sha256===h.event_key_sha256&&same(k.event_id,h.event_id));
    if(h.version!==i+1||matching.length!==1||
       !identity(h,t)||!same(h.original_responsible_employee_id,origin.responsible_employee_id)||
       !same(h.old_responsible_employee_id,responsible)||
       !same(h.actor_employee_id,matching[0].actor_employee_id)||
       !same(matching[0].transaction_id,transactionId)||
       (i===0?h.prior_event_id!==null:!same(h.prior_event_id,prevEventId))||
       h.source_tx_digest!==txDigest||
       same(h.old_responsible_employee_id,h.new_responsible_employee_id))
      return deny('F06_BRIDGE_HANDOFF_VERSION_OR_SOURCE_INVALID');
    const audit=await one(c,"SELECT * FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_handoff_ci_responsible_transfer' AND after_json->>'eventId'=$2",[String(transactionId),String(h.event_id)]);
    if(!audit||!same(audit.actor_id,h.actor_employee_id)||
       !same(audit.before_json?.responsible,responsible)||
       !same(audit.after_json?.responsible,h.new_responsible_employee_id)||
       !same(audit.after_json?.version,h.version))
      return deny('F06_BRIDGE_HANDOFF_AUDIT_OR_ACTOR_INVALID');
    prevEventId=Number(h.event_id);
    responsible=Number(h.new_responsible_employee_id);
  }
  if(!same(responsible,t.responsible_employee_id))
    return deny('F06_BRIDGE_CURRENT_RESPONSIBLE_NOT_SIGNED');

  const [cancel,eventCancel,keyCancel]=await Promise.all([
    one(c,'SELECT * FROM f06_real_post_handoff_cancel_ci.origins WHERE transaction_id=$1 FOR SHARE',[transactionId]),
    one(c,'SELECT * FROM f06_real_post_handoff_cancel_ci.events WHERE transaction_id=$1 FOR SHARE',[transactionId]),
    one(c,'SELECT * FROM f06_real_post_handoff_cancel_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[transactionId])
  ]);
  if(!identity(cancel,t)||!eventCancel||!keyCancel||
     cancel.issuer!=='CI_SYNTHETIC_NOT_REAL_MONEY'||
     !same(cancel.original_responsible_employee_id,origin.responsible_employee_id)||
     !same(cancel.current_responsible_employee_id,responsible)||
     !same(cancel.actor_employee_id,responsible)||
     cancel.handoff_version!==events.length||
     cancel.parent_tx_digest!==txDigest||
     cancel.handoff_event_digest!==digest([events,keys])||
     eventCancel.event_kind!=='post_handoff_cancelled_without_payment'||
     !same(eventCancel.handoff_version,events.length)||
     !same(eventCancel.actor_employee_id,responsible)||
     !same(keyCancel.transaction_id,transactionId)||
     !same(keyCancel.actor_employee_id,responsible)||
     !same(keyCancel.event_id,eventCancel.event_id)||
     keyCancel.event_key_sha256!==eventCancel.event_key_sha256||
     eventCancel.reason!==cancel.reason)
    return deny('F06_BRIDGE_SIGNED_POST_HANDOFF_CANCEL_INVALID');
  const audits=await one(c,"SELECT count(*)::int AS n FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_post_handoff_cancel_ci_cancelled'",[String(transactionId)]);
  const cancelAudit=await one(c,"SELECT * FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_post_handoff_cancel_ci_cancelled' AND after_json->>'eventId'=$2",[String(transactionId),String(eventCancel.event_id)]);
  if(Number(audits?.n)!==1||!cancelAudit||!same(cancelAudit.actor_id,responsible)||
     cancelAudit.before_json?.status!=='in_progress'||
     cancelAudit.after_json?.status!=='cancelled'||
     !same(cancelAudit.after_json?.version,events.length)||
     !same(cancelAudit.before_json?.responsible,responsible))
    return deny('F06_BRIDGE_POST_CANCEL_AUDIT_INVALID');

  return ok('F06_BRIDGE_SIGNED_PROVENANCE_ONLY',{
    transactionId,
    originalResponsibleId:Number(origin.responsible_employee_id),
    currentResponsibleId:responsible,
    handoffVersion:events.length,
    sourceLockId:Number(t.source_lock_id),
    customerId:Number(t.customer_id),
    vehicleId:Number(t.vehicle_id),
    listingCycleId:Number(t.listing_cycle_id),
    txDigest,
    handoffDigest:digest([events,keys]),
    cancelDigest:digest([cancel,eventCancel,keyCancel]),
    // IMPORTANT: no monetary balance or permission claim is returned here.
    refundAuthorized:false
  });
}
