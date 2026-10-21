// F06 Transaction-side Refund: signed cancelled PR139+PR146 synthetic Transaction only.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verify as verifyNativeRefund,verifyComposite as verifyNativeRefundComposite,checksum as refundParentSHA,connect as connectNativeRefund} from '../refund-pending-ci/migration.mjs';
import {cancelSourceSHA,verifyCompositeCancelSidecar} from '../transaction-cancel-http-pg16/service.mjs';
import {assertCompositeSignedRun} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
import {getPublicStructure} from '../../f02-1/schema-integrity.mjs';
const sql=readFileSync(new URL('./sidecar.sql',import.meta.url),'utf8');
export const sourceSHA=createHash('sha256').update(sql).digest('hex');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const yes=(code,data={})=>({allowed:true,code,...data});
const no=(code,data={})=>({allowed:false,code,data});
const one=async(c,s,p=[]) => (await c.query(s,p)).rows[0];
const id=x=>Number.isSafeInteger(x)&&x>0;
const money=x=>id(x)&&x<=100000000000;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
const taskBranch='feat/f06-real-transaction-refund-http-pg16-01';
const cancelBranch='feat/f06-real-transaction-cancel-http-pg16-01';
const refundParentBranch='feat/f06-3c1-refund-pending-close-ci';
const databaseURL='postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test';
export function gate(){
 const expected={
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'push',
  CI:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_REF:'refs/heads/'+refundParentBranch,
  F06_TXREFUND_ENTRY_REF:'refs/heads/'+taskBranch,F06_TXREFUND_ENTRY_BRANCH:taskBranch,
  F06_TXREFUND_ENTRY_EVENT:'push',
  F06_TXREFUND_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_REFUND_ONLY',
  F06_CANCEL_ENTRY_REF:'refs/heads/'+cancelBranch,F06_CANCEL_ENTRY_BRANCH:cancelBranch,
  F06_CANCEL_ENTRY_EVENT:'push',
  F06_CANCEL_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY',
  F03_1_DATABASE_URL:databaseURL
 };
 for(const [k,v] of Object.entries(expected))assert.equal(process.env[k],v,'F06_TX_REFUND_FORBIDDEN_'+k);
 assert.equal(process.env.F06_TXREFUND_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_TXREFUND_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.equal(process.env.F06_CANCEL_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_CANCEL_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
}
export async function connect(){gate();return connectNativeRefund()}
async function signedParents(c,mode='CI_LEGACY'){
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')assertCompositeSignedRun();else gate();
 const parent=await (mode==='COMPOSITE_NONPROD_SIGNED_V1'?verifyNativeRefundComposite(c):verifyNativeRefund(c));
 if(!parent.verified||parent.sourceSHA!==refundParentSHA)throw Error('F06_TX_REFUND_NATIVE_3C1_PARENT_INVALID');
 const meta=await one(c,"SELECT current_database() db,current_user u,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) cdb");
 if(meta.db!=='f03_auth_test'||meta.u!=='f03_ci'||meta.su||meta.cdb||meta.ver<160000||meta.ver>=170000)
  throw Error('F06_TX_REFUND_NONPRIVILEGED_PG16_REQUIRED');
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 if(ledger.length!==24)throw Error('F06_TX_REFUND_24_LEDGER_REQUIRED');
 const catalog=await getPublicStructure(c);
 if(catalog.sha256!==parent.publicCatalogSHA)throw Error('F06_TX_REFUND_PUBLIC_CATALOG_DRIFT');
 const schemas=await one(c,"SELECT to_regnamespace('f06_real_tx_ci') tx,to_regnamespace('f06_real_cancel_ci') ca,to_regnamespace('f06_real_tx_refund_ci') tr");
 if(!schemas?.tx||!schemas.ca)throw Error('F06_TX_REFUND_SIGNED_TRANSACTION_CANCEL_PARENTS_MISSING');
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')await verifyCompositeCancelSidecar(c);
 const cancelAtt=await one(c,'SELECT * FROM f06_real_cancel_ci.attestation FOR SHARE');
 if(!cancelAtt||cancelAtt.seal_name!=='F06_REAL_CANCEL_CI_ONLY'||
  cancelAtt.source_sha256!==cancelSourceSHA||cancelAtt.f06_3c1_parent_sha256!==parent.sourceSHA||
  cancelAtt.public_catalog_sha256!==parent.publicCatalogSHA||
  cancelAtt.ledger_sha256!==sha(ledger))
  throw Error('F06_TX_REFUND_CANCEL_PARENT_SIGNATURE_DRIFT');
 return {parent,ledger:sha(ledger),catalog:parent.publicCatalogSHA};
}
async function verifyByMode(c,mode='CI_LEGACY'){
 const p=await signedParents(c,mode);
 const exists=await one(c,"SELECT to_regnamespace('f06_real_tx_refund_ci')::text n");
 if(!exists?.n)throw Error('F06_TX_REFUND_SIDECAR_MISSING');
 const a=await one(c,'SELECT * FROM f06_real_tx_refund_ci.attestation FOR SHARE');
 if(!a||a.seal_name!=='F06_REAL_TX_REFUND_CI_ONLY'||a.source_sha256!==sourceSHA||
  a.cancel_source_sha256!==cancelSourceSHA||a.f06_3c1_parent_sha256!==p.parent.sourceSHA||
  a.public_catalog_sha256!==p.catalog||a.ledger_sha256!==p.ledger)
  throw Error('F06_TX_REFUND_SIDECAR_SIGNATURE_DRIFT');
 return {verified:true,sourceSHA,cancelSourceSHA,parentRefundSHA:p.parent.sourceSHA,
  publicCatalogSHA:p.catalog,ledgerSHA:p.ledger,productionRefundIssuer:'SOURCE_GAP',actualPayment:'BLOCKED'};
}
export async function verify(c){return verifyByMode(c,'CI_LEGACY')}
export async function verifyComposite(c){return verifyByMode(c,'COMPOSITE_NONPROD_SIGNED_V1')}
async function applyByMode(c,{inject=false}={},mode='CI_LEGACY'){
 const p=await signedParents(c,mode);
 if((await one(c,"SELECT to_regnamespace('f06_real_tx_refund_ci')::text n")).n)throw Error('F06_TX_REFUND_SIDECAR_ALREADY_APPLIED');
 await c.query('BEGIN');
 try{
  await c.query('SELECT pg_advisory_xact_lock(20261020,6407)');
  await c.query(sql);
  await c.query("INSERT INTO f06_real_tx_refund_ci.attestation(seal_name,source_sha256,cancel_source_sha256,f06_3c1_parent_sha256,public_catalog_sha256,ledger_sha256) VALUES('F06_REAL_TX_REFUND_CI_ONLY',$1,$2,$3,$4,$5)",
   [sourceSHA,cancelSourceSHA,p.parent.sourceSHA,p.catalog,p.ledger]);
  if(inject)throw Error('F06_TX_REFUND_INJECTED_MIGRATION_ROLLBACK');
  if((await getPublicStructure(c)).sha256!==p.catalog)throw Error('F06_TX_REFUND_PUBLIC_DDL_FORBIDDEN');
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e}
 return verifyByMode(c,mode);
}
export async function apply(c,options={}){return applyByMode(c,options,'CI_LEGACY')}
export async function applyComposite(c,options={}){return applyByMode(c,options,'COMPOSITE_NONPROD_SIGNED_V1')}
async function currentPermission(c,a,t,permissionCode){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||
  !['sales','manager','store_head'].includes(a.role_code)||a.force_password_change!==false||
  a.credential_state!=='enabled'||a.subject_status!=='active'||
  Number(a.employee_id)!==Number(t.responsible_employee_id))return false;
 const x=await one(c,"SELECT r.role_code FROM public.employees e "+
  "JOIN public.roles r ON r.role_id=e.main_role_id "+
  "JOIN public.permissions p ON p.permission_code=$2 "+
  "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
  "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
  "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
  "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
  "JOIN public.teams tm ON tm.team_id=m.team_id JOIN public.stores st ON st.store_id=tm.store_id "+
  "JOIN public.employee_team_memberships rm ON rm.employee_id=$3 AND rm.team_id=tm.team_id "+
  "JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active' "+
  "WHERE e.employee_id=$1 AND e.employment_status='active' AND tm.team_status='active' AND st.status='active' "+
  "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
  "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
  "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
  "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
  "AND ((s.scope_kind='team' AND s.scope_reference_id=tm.team_id) OR "+
  "(s.scope_kind='store' AND s.scope_reference_id=tm.store_id AND r.role_code IN('manager','store_head'))) "+
  "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,tm,st,rm",[a.employee_id,permissionCode,t.responsible_employee_id]);
 return !!x&&x.role_code===a.role_code;
}
async function signedLockRefund(c,r,source){
 if(!r||!r.lock_id||r.transaction_id!==null||r.status!=='closed'||!r.close_reason||!r.closed_at)
  return no('F06_TX_REFUND_LOCK_CASE_NOT_SIGNED_CLOSED');
 const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR SHARE',[r.lock_id]);
 const o=await one(c,'SELECT * FROM f06_3c1_ci.refund_origins WHERE refund_id=$1 FOR SHARE',[r.refund_id]);
 if(!l||!o||Number(o.lock_id)!==Number(r.lock_id)||Number(o.customer_id)!==Number(r.customer_id)||
  Number(o.vehicle_id)!==Number(l.vehicle_id)||Number(o.listing_cycle_id)!==Number(l.listing_cycle_id)||
  Number(r.expected_amount_cents)!==Number(o.amount_cents)||o.issuer_kind!=='CI_SYNTHETIC_NO_MONEY'||
  Number(l.vehicle_id)!==Number(source.vehicle_id)||Number(l.listing_cycle_id)!==Number(source.listing_cycle_id))
  return no('F06_TX_REFUND_LOCK_CASE_PROVENANCE_DRIFT');
 const snap=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[l.lock_id]);
 if(!snap||Number(snap.customer_id)!==Number(l.customer_id)||Number(snap.responsible_employee_id)!==Number(l.responsible_employee_id))
  return no('F06_TX_REFUND_LOCK_CASE_SNAPSHOT_DRIFT');
 const events=(await c.query('SELECT * FROM f06_3c1_ci.status_events WHERE refund_id=$1 ORDER BY event_id FOR SHARE',[r.refund_id])).rows;
 const keys=(await c.query('SELECT * FROM f06_3c1_ci.request_keys WHERE refund_id=$1 FOR SHARE',[r.refund_id])).rows;
 if(events.length!==2||keys.length!==2||
  events[0].event_kind!=='pending_requested'||events[0].previous_status!==null||events[0].resulting_status!=='pending'||
  events[1].event_kind!=='closed_without_payment'||events[1].previous_status!=='pending'||events[1].resulting_status!=='closed'||
  events[0].reason!==o.reason||events[1].reason!==r.close_reason)
  return no('F06_TX_REFUND_LOCK_CASE_EVENT_DRIFT');
 const rq=keys.find(k=>k.action==='request'),cl=keys.find(k=>k.action==='close');
 if(!rq||!cl||rq.event_key_sha256!==events[0].event_key_sha256||cl.event_key_sha256!==events[1].event_key_sha256||
  Number(rq.actor_employee_id)!==Number(events[0].actor_employee_id)||Number(cl.actor_employee_id)!==Number(events[1].actor_employee_id))
  return no('F06_TX_REFUND_LOCK_CASE_KEY_DRIFT');
 const audits=await one(c,"SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Refund' AND object_id=$1 AND action IN('f06_3c1_ci_request','f06_3c1_ci_close')",[String(r.refund_id)]);
 if(Number(audits.n)!==2)return no('F06_TX_REFUND_LOCK_CASE_AUDIT_DRIFT');
 const pay=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[r.refund_id]);
 if(Number(pay.n)!==0)return no('F06_TX_REFUND_PAYMENT_SOURCE_GAP');
 return yes('F06_TX_REFUND_SIGNED_LOCK_CASE',{fact:[r.refund_id,r.status,r.close_reason,o.amount_cents]});
}
async function depositLedger(c,source){
 const receipts=(await c.query('SELECT * FROM public.deposit_receipts WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[source.lock.lock_id])).rows;
 const prov=(await c.query('SELECT * FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[source.lock.lock_id])).rows;
 const adjustments=(await c.query('SELECT * FROM f06_3a_ci.adjustments WHERE lock_id=$1 ORDER BY deposit_id,adjustment_id FOR SHARE',[source.lock.lock_id])).rows;
 if(receipts.length!==prov.length||receipts.length!==Number(source.txOrigin.original_deposit_count))
  return no('F06_TX_REFUND_UNKNOWN_DEPOSIT_ORIGIN');
 const map=new Map();
 for(let i=0;i<receipts.length;i++){
  const d=receipts[i],p=prov[i];
  if(Number(d.deposit_id)!==Number(p.deposit_id)||Number(d.lock_id)!==Number(source.lock.lock_id)||
   Number(d.customer_id)!==Number(source.tx.customer_id)||Number(p.lock_id)!==Number(source.lock.lock_id)||
   Number(p.customer_id)!==Number(source.tx.customer_id)||Number(p.vehicle_id)!==Number(source.tx.vehicle_id)||
   Number(p.listing_cycle_id)!==Number(source.tx.listing_cycle_id)||Number(d.amount_cents)!==Number(p.original_amount_cents)||
   Number(d.recorded_by)!==Number(p.operator_employee_id)||new Date(d.received_at).getTime()!==new Date(p.received_at).getTime()||
   p.currency!=='CNY'||p.issuer_kind!=='CI_SYNTHETIC_NOT_REAL_MONEY')
   return no('F06_TX_REFUND_DEPOSIT_PROVENANCE_DRIFT');
  map.set(Number(d.deposit_id),{receipt:d,provenance:p,net:Number(d.amount_cents)});
 }
 const adjustmentFacts=[];
 for(const a of adjustments){
  const item=map.get(Number(a.deposit_id));
  if(!item||Number(a.lock_id)!==Number(source.lock.lock_id)||a.currency!=='CNY'||
   !['correction','reversal'].includes(a.event_kind)||!Number.isSafeInteger(Number(a.delta_cents))||
   Number(a.delta_cents)===0||(a.event_kind==='reversal'&&Number(a.delta_cents)>0))
   return no('F06_TX_REFUND_CORRECTION_SOURCE_DRIFT');
  const k=await one(c,'SELECT * FROM f06_3a_ci.request_keys WHERE resulting_adjustment_id=$1 FOR SHARE',[a.adjustment_id]);
  if(!k||k.key_sha256!==a.event_key_sha256||k.action!==a.event_kind||
   Number(k.lock_id)!==Number(source.lock.lock_id)||Number(k.deposit_id)!==Number(a.deposit_id)||
   Number(k.amount_cents)!==Number(a.delta_cents)||Number(k.actor_employee_id)!==Number(a.actor_employee_id))
   return no('F06_TX_REFUND_UNSIGNED_CORRECTION');
  item.net+=Number(a.delta_cents);
  adjustmentFacts.push({adjustment:a,requestKey:k});
 }
 let net=0;
 for(const item of map.values()){
  if(!Number.isSafeInteger(item.net)||item.net<0||item.net>100000000000)
   return no('F06_TX_REFUND_INVALID_NET_DEPOSIT');
  net+=item.net;
 }
 if(!Number.isSafeInteger(net)||net>100000000000)
  return no('F06_TX_REFUND_NET_DEPOSIT_OVERFLOW');
 const digest=sha({receipts,provenance:prov,adjustments:adjustmentFacts});
 return yes('F06_TX_REFUND_SIGNED_DEPOSIT_BALANCE',{netCents:net,depositCount:receipts.length,depositDigest:digest,
  depositSnapshot:{receipts,provenance:prov,adjustments:adjustmentFacts}});
}
async function verifyTransactionSource(c,t){
 if(!t||t.status!=='cancelled'||t.completed_at!==null)
  return no(!t?'F06_TX_REFUND_TRANSACTION_NOT_FOUND':'F06_TX_REFUND_ONLY_CANCELLED_TRANSACTION');
 const txOrigin=await one(c,'SELECT * FROM f06_real_tx_ci.origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const txEvent=await one(c,'SELECT * FROM f06_real_tx_ci.events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const txKey=await one(c,'SELECT * FROM f06_real_tx_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(!txOrigin||!txEvent||!txKey||txOrigin.state!=='in_progress'||txOrigin.carrier!=='in_progress'||
  txOrigin.issuer!=='CI_SYNTHETIC_NOT_REAL_MONEY'||txEvent.event_kind!=='lock_to_transaction'||
  txEvent.source_status!=='active'||txEvent.final_status!=='released'||
  Number(t.source_lock_id)!==Number(txOrigin.source_lock_id)||Number(txEvent.source_lock_id)!==Number(t.source_lock_id)||
  Number(txKey.source_lock_id)!==Number(t.source_lock_id)||Number(t.customer_id)!==Number(txOrigin.customer_id)||
  Number(t.vehicle_id)!==Number(txOrigin.vehicle_id)||Number(t.listing_cycle_id)!==Number(txOrigin.listing_cycle_id)||
  Number(t.responsible_employee_id)!==Number(txOrigin.responsible_employee_id))
  return no('F06_TX_REFUND_UNSIGNED_TRANSACTION_SOURCE');
 const cancelOrigin=await one(c,'SELECT * FROM f06_real_cancel_ci.origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const cancelEvent=await one(c,'SELECT * FROM f06_real_cancel_ci.events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const cancelKey=await one(c,'SELECT * FROM f06_real_cancel_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(!cancelOrigin||!cancelEvent||!cancelKey||cancelOrigin.previous_status!=='in_progress'||
  cancelOrigin.resulting_status!=='cancelled'||cancelOrigin.issuer!=='CI_SYNTHETIC_NOT_REAL_MONEY'||
  cancelEvent.event_kind!=='cancelled_without_payment'||cancelEvent.previous_status!=='in_progress'||
  cancelEvent.resulting_status!=='cancelled'||cancelEvent.event_key_sha256!==cancelKey.event_key_sha256||
  Number(cancelKey.employee_id)!==Number(cancelOrigin.actor_employee_id)||
  Number(cancelEvent.actor_employee_id)!==Number(cancelOrigin.actor_employee_id)||
  Number(cancelOrigin.source_lock_id)!==Number(t.source_lock_id)||Number(cancelOrigin.customer_id)!==Number(t.customer_id)||
  Number(cancelOrigin.vehicle_id)!==Number(t.vehicle_id)||Number(cancelOrigin.listing_cycle_id)!==Number(t.listing_cycle_id)||
  Number(cancelOrigin.original_responsible_employee_id)!==Number(txOrigin.responsible_employee_id)||
  Number(cancelOrigin.acting_responsible_employee_id)!==Number(t.responsible_employee_id)||
  Number(cancelOrigin.actor_employee_id)!==Number(cancelEvent.actor_employee_id)||
  cancelOrigin.parent_tx_digest!==sha([txOrigin,txEvent,txKey]))
  return no('F06_TX_REFUND_UNSIGNED_CANCEL_SOURCE');
 const cancelAudit=await one(c,"SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Transaction' AND object_id=$1 AND action='f06_real_cancel_ci_cancelled'",[String(t.transaction_id)]);
 if(Number(cancelAudit.n)!==1)return no('F06_TX_REFUND_CANCEL_AUDIT_GAP');
 return finishSignedTransactionSource(c,t,txOrigin,txEvent,txKey,cancelOrigin,cancelEvent,cancelKey,{
  transactionDigest:sha([txOrigin,txEvent,txKey,cancelOrigin,cancelEvent,cancelKey]),
  cancelDigest:sha([cancelOrigin,cancelEvent,cancelKey])});
}
// Shared signed-funds read path: identical ledger, signed Lock Refund checks and snapshots
// for both original PR146 Cancel and versioned PR153/PR156 Cancel.
async function finishSignedTransactionSource(c,t,txOrigin,txEvent,txKey,cancelOrigin,cancelEvent,cancelKey,digests){
 const lock=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[txOrigin.source_lock_id]);
 const snap=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[txOrigin.source_lock_id]);
 if(!lock||!snap||lock.lock_status!=='released'||lock.end_reason!=='converted_to_transaction'||
  Number(lock.vehicle_id)!==Number(t.vehicle_id)||Number(lock.customer_id)!==Number(t.customer_id)||
  Number(lock.listing_cycle_id)!==Number(t.listing_cycle_id)||
  Number(snap.customer_id)!==Number(lock.customer_id)||
  Number(snap.responsible_employee_id)!==Number(txOrigin.responsible_employee_id))
  return no('F06_TX_REFUND_LOCK_OR_SNAPSHOT_DRIFT');
 const customer=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[t.customer_id]);
 const cycle=await one(c,'SELECT vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[t.listing_cycle_id,t.vehicle_id]);
 if(!customer||customer.account_status!=='active')return no('F06_TX_REFUND_CUSTOMER_DISABLED');
 if(!cycle)return no('F06_TX_REFUND_CYCLE_IDENTITY_DRIFT');
 const deposits=await depositLedger(c,{tx:t,txOrigin,lock});
 if(!deposits.allowed)return deposits;
 const lockCases=(await c.query('SELECT r.* FROM public.refund_cases r JOIN public.locks lk ON lk.lock_id=r.lock_id WHERE lk.vehicle_id=$1 AND lk.listing_cycle_id=$2 ORDER BY r.refund_id FOR UPDATE OF r',[t.vehicle_id,t.listing_cycle_id])).rows;
 const facts=[];
 for(const r of lockCases){
  const signed=await signedLockRefund(c,r,{vehicle_id:t.vehicle_id,listing_cycle_id:t.listing_cycle_id});
  if(!signed.allowed)return signed;
  facts.push(signed.fact);
 }
 const lockRefundDigest=sha(facts);
 if(lockRefundDigest!==txOrigin.source_refund_digest)return no('F06_TX_REFUND_LOCK_REFUND_SNAPSHOT_DRIFT');
 const {transactionDigest,cancelDigest}=digests;
 return yes('F06_TX_REFUND_SIGNED_CANCELLED_TRANSACTION',{tx:t,txOrigin,txEvent,txKey,cancelOrigin,cancelEvent,cancelKey,
  lock,customer,cycle,netCents:deposits.netCents,depositCount:deposits.depositCount,depositDigest:deposits.depositDigest,
  transactionDigest,cancelDigest,lockRefundDigest,depositSnapshot:deposits.depositSnapshot});
}
// Only the strictly named bridge entry can use this verifier. No caller-supplied source
// or magic boolean is accepted: native PR156 parent and full PR153 version chain must pass.
async function verifyTransactionSourcePostHandoff(c,t,mode='CI_LEGACY'){
 if(!t||t.status!=='cancelled'||t.completed_at!==null)
  return no('F06_BRIDGE_ONLY_CANCELLED_TRANSACTION');
 const bridge=await import('../post-handoff-refund-bridge-http-pg16/签名来源只读核验.mjs');
 const signed=mode==='COMPOSITE_NONPROD_SIGNED_V1'?
  await bridge.verifyCancelledHandoffProvenanceComposite(c,Number(t.transaction_id)):
  await bridge.verifyCancelledHandoffProvenance(c,Number(t.transaction_id));
 if(!signed.allowed)return signed;
 const txOrigin=await one(c,'SELECT * FROM f06_real_tx_ci.origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const txEvent=await one(c,'SELECT * FROM f06_real_tx_ci.events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const txKey=await one(c,'SELECT * FROM f06_real_tx_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const cancelOrigin=await one(c,'SELECT * FROM f06_real_post_handoff_cancel_ci.origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const cancelEvent=await one(c,'SELECT * FROM f06_real_post_handoff_cancel_ci.events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const cancelKey=await one(c,'SELECT * FROM f06_real_post_handoff_cancel_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(!txOrigin||!txEvent||!txKey||!cancelOrigin||!cancelEvent||!cancelKey||
    Number(txOrigin.responsible_employee_id)!==signed.originalResponsibleId||
    Number(t.responsible_employee_id)!==signed.currentResponsibleId||
    Number(cancelOrigin.handoff_version)!==signed.handoffVersion)
  return no('F06_BRIDGE_SIGNED_SOURCES_DRIFT');
 // Explicit domain/version separation from PR146; it is NOT a legacy
 // f06_real_cancel_ci signature, and the original verifier remains fail-closed.
 const src=await finishSignedTransactionSource(c,t,txOrigin,txEvent,txKey,
  cancelOrigin,cancelEvent,cancelKey,{
   transactionDigest:sha(['PR153_156_V1',txOrigin,txEvent,txKey,cancelOrigin,cancelEvent,cancelKey]),
   cancelDigest:sha(['PR156_SIGNED_CANCEL_V1',cancelOrigin,cancelEvent,cancelKey])});
 if(!src.allowed)return src;
 return yes('F06_BRIDGE_SIGNED_FUNDS_SOURCE',{...src,sourceKind:'PR153_PR156_POST_HANDOFF',handoffVersion:signed.handoffVersion});
}
// A R1 correction: retain an immutable signed *request-time* 3A ledger prefix,
// and verify every later 3A addition against native append-only origin/Key,
// without demanding that the CURRENT net/balance equal the historical request.
async function verifyDepositHistory(c,src,origin){
 const snap=await one(c,'SELECT * FROM f06_real_tx_refund_ci.deposit_snapshots WHERE refund_id=$1 FOR SHARE',[origin.refund_id]);
 if(!snap)return no('F06_TX_REFUND_HISTORICAL_DEPOSIT_SNAPSHOT_MISSING');
 let original;
 try{original=JSON.parse(snap.snapshot_payload)}catch{return no('F06_TX_REFUND_HISTORICAL_DEPOSIT_SNAPSHOT_INVALID')}
 if(!original||!Array.isArray(original.receipts)||!Array.isArray(original.provenance)||!Array.isArray(original.adjustments)||
    sha(original)!==snap.snapshot_sha256||sha(original)!==origin.source_deposit_digest||
    Number(snap.net_deposit_cents)!==Number(origin.net_deposit_cents)||
    Number(snap.refund_id)!==Number(origin.refund_id)||
    Number(snap.transaction_id)!==Number(origin.transaction_id)||
    Number(snap.source_lock_id)!==Number(origin.source_lock_id))
  return no('F06_TX_REFUND_HISTORICAL_DEPOSIT_SNAPSHOT_DRIFT');
 const live=src.depositSnapshot;
 if(!live||JSON.stringify(live.receipts)!==JSON.stringify(original.receipts)||
    JSON.stringify(live.provenance)!==JSON.stringify(original.provenance))
  return no('F06_TX_REFUND_DEPOSIT_HISTORY_SOURCE_DRIFT');
 const watermark=Number(snap.adjustment_watermark);
 const originalIds=new Set();
 let maxHistorical=0;
 for(const x of original.adjustments){
  const id=Number(x?.adjustment?.adjustment_id);
  if(!Number.isSafeInteger(id)||id<=0||originalIds.has(id))return no('F06_TX_REFUND_SNAPSHOT_ADJUSTMENT_DRIFT');
  originalIds.add(id);maxHistorical=Math.max(maxHistorical,id);
 }
 if(maxHistorical!==watermark)return no('F06_TX_REFUND_SNAPSHOT_WATERMARK_DRIFT');
 const current=new Map();
 for(const x of live.adjustments){
  const id=Number(x?.adjustment?.adjustment_id);
  if(!Number.isSafeInteger(id)||id<=0||current.has(id))return no('F06_TX_REFUND_CURRENT_ADJUSTMENT_DRIFT');
  current.set(id,x);
 }
 for(const x of original.adjustments){
  const y=current.get(Number(x.adjustment.adjustment_id));
  if(!y||JSON.stringify(y)!==JSON.stringify(x))return no('F06_TX_REFUND_HISTORICAL_SIGNED_ADJUSTMENT_DRIFT');
 }
 // The native depositLedger has already verified every original and appended
 // 3A adjustment against its immutable 3A request key, actor, deposit, Lock
 // and amount. Watermark + signed time prove all other events are POST-request.
 for(const x of live.adjustments){
  const id=Number(x.adjustment.adjustment_id);
  if(originalIds.has(id))continue;
  if(id<=watermark||!x.requestKey||
     new Date(x.adjustment.created_at).getTime()<=new Date(snap.recorded_at).getTime()||
     new Date(x.requestKey.created_at).getTime()<=new Date(snap.recorded_at).getTime())
    return no('F06_TX_REFUND_UNSIGNED_OR_OUT_OF_ORDER_APPEND');
 }
 return yes('F06_TX_REFUND_SIGNED_HISTORICAL_PREFIX_PLUS_LIVE_APPEND',{
  initialCount:original.adjustments.length,currentCount:live.adjustments.length,
  appendedCount:live.adjustments.length-original.adjustments.length});
}
async function refundCaseSource(c,src,r,origin){
 if(!r||!origin||r.lock_id!==null||Number(r.transaction_id)!==Number(src.tx.transaction_id)||
  Number(r.customer_id)!==Number(src.tx.customer_id)||!['pending','closed'].includes(r.status)||
  Number(r.expected_amount_cents)!==Number(origin.amount_cents)||
  Number(origin.transaction_id)!==Number(src.tx.transaction_id)||Number(origin.source_lock_id)!==Number(src.lock.lock_id)||
  Number(origin.customer_id)!==Number(src.tx.customer_id)||Number(origin.vehicle_id)!==Number(src.tx.vehicle_id)||
  Number(origin.listing_cycle_id)!==Number(src.tx.listing_cycle_id)||origin.issuer_kind!=='CI_SYNTHETIC_NO_MONEY'||
  origin.source_tx_digest!==src.transactionDigest||origin.source_cancel_digest!==src.cancelDigest||
  origin.source_lock_refund_digest!==src.lockRefundDigest)
  return no('F06_TX_REFUND_CASE_SOURCE_DRIFT');
 const history=await verifyDepositHistory(c,src,origin);
 if(!history.allowed)return history;
 const events=(await c.query('SELECT * FROM f06_real_tx_refund_ci.events WHERE refund_id=$1 ORDER BY event_id FOR SHARE',[r.refund_id])).rows;
 const keys=(await c.query('SELECT * FROM f06_real_tx_refund_ci.request_keys WHERE refund_id=$1 ORDER BY created_at FOR SHARE',[r.refund_id])).rows;
 const reqEvent=events.find(e=>e.event_kind==='pending_requested');
 const closeEvent=events.find(e=>e.event_kind==='closed_without_payment');
 const reqKey=keys.find(k=>k.action==='request'),closeKey=keys.find(k=>k.action==='close');
 if(!reqEvent||!reqKey||reqKey.event_key_sha256!==reqEvent.event_key_sha256||
  Number(reqKey.actor_employee_id)!==Number(reqEvent.actor_employee_id)||Number(reqKey.transaction_id)!==Number(src.tx.transaction_id)||
  Number(reqKey.refund_id)!==Number(r.refund_id)||reqEvent.previous_status!==null||reqEvent.resulting_status!=='pending'||
  reqEvent.reason!==origin.reason||!['pending','closed'].includes(r.status))
  return no('F06_TX_REFUND_CASE_REQUEST_EVENT_DRIFT');
 if(r.status==='pending'&&(events.length!==1||keys.length!==1||closeEvent||closeKey||r.closed_at!==null||r.close_reason!==null))
  return no('F06_TX_REFUND_PENDING_TERMINAL_DRIFT');
 if(r.status==='closed'&&(!closeEvent||!closeKey||events.length!==2||keys.length!==2||
  closeEvent.previous_status!=='pending'||closeEvent.resulting_status!=='closed'||
  closeEvent.reason!==r.close_reason||!r.close_reason||!r.closed_at||
  closeKey.event_key_sha256!==closeEvent.event_key_sha256||
  Number(closeKey.actor_employee_id)!==Number(closeEvent.actor_employee_id)||
  Number(closeKey.transaction_id)!==Number(src.tx.transaction_id)||Number(closeKey.refund_id)!==Number(r.refund_id)))
  return no('F06_TX_REFUND_CLOSED_EVENT_DRIFT');
 const pay=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[r.refund_id]);
 if(Number(pay.n)!==0)return no('F06_TX_REFUND_REAL_PAYMENT_SOURCE_GAP');
 const audit=await one(c,"SELECT count(*)::int n FROM public.audit_events WHERE object_kind='Refund' AND object_id=$1 AND action IN('f06_real_tx_refund_ci_pending','f06_real_tx_refund_ci_closed')",[String(r.refund_id)]);
 if(Number(audit.n)!==(r.status==='pending'?1:2))return no('F06_TX_REFUND_AUDIT_DRIFT');
 return yes('F06_TX_REFUND_SIGNED_CASE',{refundId:Number(r.refund_id),status:r.status,amountCents:Number(origin.amount_cents)});
}
async function balancePool(c,src,{ignoreRefundId=null}={}){
 const cases=(await c.query("SELECT r.*,lk.vehicle_id lock_vehicle,lk.listing_cycle_id lock_cycle,tx.vehicle_id tx_vehicle,tx.listing_cycle_id tx_cycle "+
  "FROM public.refund_cases r LEFT JOIN public.locks lk ON lk.lock_id=r.lock_id "+
  "LEFT JOIN public.transactions tx ON tx.transaction_id=r.transaction_id "+
  "WHERE (lk.vehicle_id=$1 AND lk.listing_cycle_id=$2) OR (tx.vehicle_id=$1 AND tx.listing_cycle_id=$2) "+
  "ORDER BY r.refund_id FOR UPDATE OF r",[src.tx.vehicle_id,src.tx.listing_cycle_id])).rows;
 let pendingCents=0,refundedCents=0;
 for(const r of cases){
  const paid=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[r.refund_id]);
  if(Number(paid.n)>0)return no('F06_TX_REFUND_REAL_PAYMENT_SOURCE_GAP');
  if(ignoreRefundId!==null&&Number(r.refund_id)===Number(ignoreRefundId))continue;
  if(r.lock_id!==null&&r.transaction_id===null){
   if(r.status==='pending')return no('F06_TX_REFUND_LOCK_PENDING_CONFLICT');
   if(r.status==='refunded')return no('F06_TX_REFUND_ACTUAL_REFUND_NOT_AUTHORIZED');
   if(r.status!=='closed')return no('F06_TX_REFUND_UNKNOWN_LOCK_REFUND_SOURCE');
   // verifyTransactionSource has already checked every signed Lock-side case and
   // the exact PR139 source_refund_digest, including this one.
   continue;
  }
  if(r.lock_id===null&&r.transaction_id!==null){
   if(Number(r.transaction_id)!==Number(src.tx.transaction_id))return no('F06_TX_REFUND_OTHER_TRANSACTION_SUBJECT_CONFLICT');
   const origin=await one(c,'SELECT * FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1 FOR SHARE',[r.refund_id]);
   if(!origin)return no('F06_TX_REFUND_UNSIGNED_EXISTING_CASE');
   const trusted=await refundCaseSource(c,src,r,origin);
   if(!trusted.allowed)return trusted;
   if(r.status==='pending')pendingCents+=Number(trusted.amountCents);
   else if(r.status!=='closed')return no('F06_TX_REFUND_UNKNOWN_TRANSACTION_REFUND_STATUS');
   continue;
  }
  return no('F06_TX_REFUND_INVALID_PUBLIC_SUBJECT');
 }
 const available=src.netCents-pendingCents-refundedCents;
 if(!Number.isSafeInteger(available)||available<0||available>100000000000)
  return no('F06_TX_REFUND_UNTRUSTED_AVAILABLE_BALANCE');
 return yes('F06_TX_REFUND_SIGNED_AVAILABLE_BALANCE',{netCents:src.netCents,pendingCents,refundedCents,availableCents:available});
}
async function audit(c,actor,refundId,action,before,after){
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) "+
  "VALUES('employee',$1,'Refund',$2,$3,$4::jsonb,$5::jsonb,clock_timestamp())",
  [String(actor),String(refundId),'f06_real_tx_refund_ci_'+action,JSON.stringify(before),JSON.stringify(after)]);
}
const eventHash=p=>sha(['F06_TX_REFUND_KEY',p.eventKey]);
const fingerprint=p=>sha(p);
function keyConflict(known,{actorId,action,transactionId,payloadSha}){
 return Number(known.actor_employee_id)!==Number(actorId)||known.action!==action||
  Number(known.transaction_id)!==Number(transactionId)||known.payload_sha256!==payloadSha;
}
async function existingKey(c,eventKey,{actorId,action,transactionId,payloadSha}){
 const h=eventHash({eventKey});
 const row=await one(c,'SELECT * FROM f06_real_tx_refund_ci.request_keys WHERE event_key_sha256=$1 FOR SHARE',[h]);
 return row?{row,conflict:keyConflict(row,{actorId,action,transactionId,payloadSha})}:null;
}
async function requestTransactionRefundCore(auth,token,p={},sourceVerifier,mode='CI_LEGACY'){
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')assertCompositeSignedRun();else gate();
 if(!id(p.transactionId)||!money(p.amountCents)||!reason(p.reason)||!key(p.eventKey))
  return no('F06_TX_REFUND_INVALID_REQUEST');
 try{
  const result=await auth.withSession(token,async(c,a)=>{
   await (mode==='COMPOSITE_NONPROD_SIGNED_V1'?verifyComposite(c):verify(c));await c.query("SET LOCAL lock_timeout='1800ms'");
   const seed=await one(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
   if(!seed)return no('F06_TX_REFUND_TRANSACTION_NOT_FOUND');
   await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[seed.vehicle_id]);
   const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[p.transactionId]);
   if(!t)return no('F06_TX_REFUND_TRANSACTION_NOT_FOUND');
   const fp=fingerprint({action:'request',transactionId:p.transactionId,amountCents:p.amountCents,reason:p.reason.trim()});
   const old=await existingKey(c,p.eventKey,{actorId:a?.employee_id,action:'request',transactionId:p.transactionId,payloadSha:fp});
   if(old?.conflict)return no('F06_TX_REFUND_IDEMPOTENCY_CONFLICT');
   if(!await currentPermission(c,a,t,'transaction.refund.ci.request'))
    return no('F06_TX_REFUND_REQUEST_PERMISSION_SCOPE_DENIED');
   const src=await sourceVerifier(c,t);if(!src.allowed)return src;
   if(old){
    const r=await one(c,'SELECT * FROM public.refund_cases WHERE refund_id=$1 FOR SHARE',[old.row.refund_id]);
    const o=await one(c,'SELECT * FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1 FOR SHARE',[old.row.refund_id]);
    const signed=await refundCaseSource(c,src,r,o);
    if(!signed.allowed)return signed;
    return yes('F06_TX_REFUND_IDEMPOTENT_REQUEST',{refundId:Number(old.row.refund_id),backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
   }
   const existing=(await c.query('SELECT * FROM public.refund_cases WHERE transaction_id=$1 ORDER BY refund_id FOR UPDATE',[t.transaction_id])).rows;
   for(const prior of existing){
    const o=await one(c,'SELECT * FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1 FOR SHARE',[prior.refund_id]);
    if(!o)return no('F06_TX_REFUND_UNSIGNED_EXISTING_CASE');
    if(prior.status==='pending')return no('F06_TX_REFUND_ALREADY_PENDING');
    if(prior.status!=='closed')return no('F06_TX_REFUND_UNKNOWN_TRANSACTION_REFUND_STATUS');
   }
   const pool=await balancePool(c,src);if(!pool.allowed)return pool;
   if(pool.availableCents<=0)return no('F06_TX_REFUND_NO_SIGNED_REFUNDABLE_BALANCE');
   if(p.amountCents>pool.availableCents)return no('F06_TX_REFUND_EXCEEDS_AVAILABLE_BALANCE');
   const row=await one(c,"INSERT INTO public.refund_cases(customer_id,lock_id,transaction_id,status,expected_amount_cents) "+
    "VALUES($1,NULL,$2,'pending',$3) RETURNING refund_id",
    [t.customer_id,t.transaction_id,p.amountCents]);
   if(p.testCheckpoint==='AFTER_PENDING_THROW')throw Error('F06_TX_REFUND_INJECTED_PENDING_ROLLBACK');
   const origin=await one(c,"INSERT INTO f06_real_tx_refund_ci.origins(refund_id,transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,amount_cents,net_deposit_cents,pending_commitment_cents,available_balance_cents,source_tx_digest,source_cancel_digest,source_deposit_digest,source_lock_refund_digest,actor_employee_id,issuer_kind,reason) "+
    "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'CI_SYNTHETIC_NO_MONEY',$16) RETURNING refund_id",
    [row.refund_id,t.transaction_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,p.amountCents,pool.netCents,pool.pendingCents,pool.availableCents,src.transactionDigest,src.cancelDigest,src.depositDigest,src.lockRefundDigest,a.employee_id,p.reason.trim()]);
   const historical=src.depositSnapshot;
   const adjustmentWatermark=historical.adjustments.reduce((max,x)=>Math.max(max,Number(x.adjustment.adjustment_id)),0);
   await c.query('INSERT INTO f06_real_tx_refund_ci.deposit_snapshots(refund_id,transaction_id,source_lock_id,net_deposit_cents,snapshot_payload,snapshot_sha256,adjustment_watermark) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [row.refund_id,t.transaction_id,t.source_lock_id,pool.netCents,JSON.stringify(historical),src.depositDigest,adjustmentWatermark]);
   const h=eventHash(p);
   await c.query("INSERT INTO f06_real_tx_refund_ci.events(refund_id,transaction_id,actor_employee_id,event_kind,previous_status,resulting_status,reason,event_key_sha256) "+
    "VALUES($1,$2,$3,'pending_requested',NULL,'pending',$4,$5)",[row.refund_id,t.transaction_id,a.employee_id,p.reason.trim(),h]);
   if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_TX_REFUND_INJECTED_EVENT_ROLLBACK');
   await c.query("INSERT INTO f06_real_tx_refund_ci.request_keys(event_key_sha256,actor_employee_id,action,transaction_id,refund_id,payload_sha256) "+
    "VALUES($1,$2,'request',$3,$4,$5)",[h,a.employee_id,t.transaction_id,row.refund_id,fp]);
   await audit(c,a.employee_id,row.refund_id,'pending',{}, {status:'pending',issuer:'CI_SYNTHETIC_NO_MONEY'});
   if(mode==='COMPOSITE_NONPROD_SIGNED_V1'){
    const att=await one(c,"SELECT source_sha256,head_sha,run_id FROM f06_real_tx_refund_ci.attestation FOR SHARE");
    if(!att)throw Error('F06_COMPOSITE_REFUND_PENDING_PARENT_GAP');
    const payload={refundId:Number(row.refund_id),transactionId:Number(t.transaction_id),lockId:Number(t.source_lock_id),
     customerId:Number(t.customer_id),vehicleId:Number(t.vehicle_id),amountCents:p.amountCents,sourceDigest:src.transactionDigest};
    await c.query("INSERT INTO f06_composite_v1.issued_events(event_key_sha256,event_kind,parent_object_id,actor_kind,actor_id,source_parent_sha256,head_sha,run_id,payload_sha256) VALUES($1,'signed_refund_pending',$2,'employee',$3,$4,$5,$6,$7)",
     [sha(['F06_COMPOSITE_REFUND_PENDING',payload]),row.refund_id,a.employee_id,att.source_sha256,att.head_sha,att.run_id,sha(payload)]);
   }
   if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_TX_REFUND_INJECTED_AUDIT_ROLLBACK');
   const finalSource=await sourceVerifier(c,t);
   if(!finalSource.allowed||finalSource.transactionDigest!==src.transactionDigest||
    finalSource.depositDigest!==src.depositDigest||finalSource.lockRefundDigest!==src.lockRefundDigest)
    throw Error('F06_TX_REFUND_SOURCE_CHANGED_BEFORE_COMMIT');
   const finalPool=await balancePool(c,src,{ignoreRefundId:Number(row.refund_id)});
   if(!finalPool.allowed||p.amountCents>finalPool.availableCents)
    throw Error('F06_TX_REFUND_BALANCE_CHANGED_BEFORE_COMMIT');
   return yes('F06_TX_REFUND_PENDING_NO_PAYMENT',{refundId:Number(row.refund_id),backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
  },{normalOnly:true});
  return result||no('F06_TX_REFUND_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_TX_REFUND_PG_ATOMIC_CONTENTION_DENY');
  if(String(e.message||'').startsWith('F06_TX_REFUND_INJECTED_')||String(e.message||'').startsWith('F06_TX_REFUND_SOURCE_CHANGED')||
   String(e.message||'').startsWith('F06_TX_REFUND_BALANCE_CHANGED'))return no('F06_TX_REFUND_ATOMIC_ROLLED_BACK');
  throw e;
 }
}
async function closeTransactionRefundCore(auth,token,p={},sourceVerifier,mode='CI_LEGACY'){
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')assertCompositeSignedRun();else gate();
 if(!id(p.refundId)||!reason(p.closeReason)||!key(p.eventKey))return no('F06_TX_REFUND_INVALID_CLOSE');
 try{
  const result=await auth.withSession(token,async(c,a)=>{
   await verify(c);await c.query("SET LOCAL lock_timeout='1800ms'");
   const seed=await one(c,'SELECT transaction_id,source_lock_id,vehicle_id FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1',[p.refundId]);
   if(!seed)return no('F06_TX_REFUND_UNSIGNED_CLOSE_SOURCE');
   const txSeed=await one(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[seed.transaction_id]);
   if(!txSeed||Number(txSeed.vehicle_id)!==Number(seed.vehicle_id))return no('F06_TX_REFUND_TRANSACTION_SOURCE_GAP');
   await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[txSeed.vehicle_id]);
   const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[seed.transaction_id]);
   if(!t)return no('F06_TX_REFUND_TRANSACTION_NOT_FOUND');
   const fp=fingerprint({action:'close',refundId:p.refundId,transactionId:t.transaction_id,closeReason:p.closeReason.trim()});
   const old=await existingKey(c,p.eventKey,{actorId:a?.employee_id,action:'close',transactionId:t.transaction_id,payloadSha:fp});
   if(old?.conflict)return no('F06_TX_REFUND_IDEMPOTENCY_CONFLICT');
   if(!await currentPermission(c,a,t,'transaction.refund.ci.request'))
    return no('F06_TX_REFUND_CLOSE_PERMISSION_SCOPE_DENIED');
   const src=await sourceVerifier(c,t);if(!src.allowed)return src;
   const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[seed.source_lock_id]);
   if(!l||Number(l.lock_id)!==Number(t.source_lock_id))return no('F06_TX_REFUND_SOURCE_LOCK_GAP');
   const r=await one(c,'SELECT * FROM public.refund_cases WHERE refund_id=$1 FOR UPDATE',[p.refundId]);
   const o=await one(c,'SELECT * FROM f06_real_tx_refund_ci.origins WHERE refund_id=$1 FOR SHARE',[p.refundId]);
   const signed=await refundCaseSource(c,src,r,o);if(!signed.allowed)return signed;
   if(old){
    if(r.status==='closed')return yes('F06_TX_REFUND_IDEMPOTENT_CLOSE',{refundId:p.refundId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
    return no('F06_TX_REFUND_IDEMPOTENCY_STATE_DRIFT');
   }
   if(r.status!=='pending')return no('F06_TX_REFUND_ALREADY_TERMINAL');
   const pool=await balancePool(c,src,{ignoreRefundId:p.refundId});if(!pool.allowed)return pool;
   const paid=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[p.refundId]);
   if(Number(paid.n)!==0)return no('F06_TX_REFUND_REAL_PAYMENT_NEVER_CLOSE');
   if(p.testCheckpoint==='BEFORE_CLOSE_THROW')throw Error('F06_TX_REFUND_INJECTED_BEFORE_CLOSE');
   const changed=await one(c,"UPDATE public.refund_cases SET status='closed',close_reason=$2,closed_at=clock_timestamp() WHERE refund_id=$1 AND transaction_id=$3 AND lock_id IS NULL AND status='pending' RETURNING refund_id",
    [p.refundId,p.closeReason.trim(),t.transaction_id]);
   if(!changed)throw Error('F06_TX_REFUND_PENDING_ROW_LOST');
   if(p.testCheckpoint==='AFTER_CLOSE_THROW')throw Error('F06_TX_REFUND_INJECTED_CLOSE_ROLLBACK');
   const h=eventHash(p);
   await c.query("INSERT INTO f06_real_tx_refund_ci.events(refund_id,transaction_id,actor_employee_id,event_kind,previous_status,resulting_status,reason,event_key_sha256) "+
    "VALUES($1,$2,$3,'closed_without_payment','pending','closed',$4,$5)",[p.refundId,t.transaction_id,a.employee_id,p.closeReason.trim(),h]);
   if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_TX_REFUND_INJECTED_CLOSE_EVENT_ROLLBACK');
   await c.query("INSERT INTO f06_real_tx_refund_ci.request_keys(event_key_sha256,actor_employee_id,action,transaction_id,refund_id,payload_sha256) "+
    "VALUES($1,$2,'close',$3,$4,$5)",[h,a.employee_id,t.transaction_id,p.refundId,fp]);
   await audit(c,a.employee_id,p.refundId,'closed',{status:'pending'},{status:'closed',closeReason:p.closeReason.trim(),realPayment:false});
   if(mode==='COMPOSITE_NONPROD_SIGNED_V1'){
    const att=await one(c,"SELECT source_sha256,head_sha,run_id FROM f06_real_tx_refund_ci.attestation FOR SHARE");
    if(!att)throw Error('F06_COMPOSITE_REFUND_CLOSE_PARENT_GAP');
    const payload={refundId:Number(p.refundId),transactionId:Number(t.transaction_id),lockId:Number(t.source_lock_id),
     customerId:Number(t.customer_id),vehicleId:Number(t.vehicle_id),closeReason:p.closeReason.trim(),noPayment:true};
    await c.query("INSERT INTO f06_composite_v1.issued_events(event_key_sha256,event_kind,parent_object_id,actor_kind,actor_id,source_parent_sha256,head_sha,run_id,payload_sha256) VALUES($1,'signed_refund_closed',$2,'employee',$3,$4,$5,$6,$7)",
     [sha(['F06_COMPOSITE_REFUND_CLOSED',payload]),p.refundId,a.employee_id,att.source_sha256,att.head_sha,att.run_id,sha(payload)]);
   }
   if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_TX_REFUND_INJECTED_CLOSE_AUDIT_ROLLBACK');
   const final=await one(c,'SELECT status,lock_id,transaction_id,closed_at,close_reason FROM public.refund_cases WHERE refund_id=$1',[p.refundId]);
   if(final.status!=='closed'||final.lock_id!==null||Number(final.transaction_id)!==Number(t.transaction_id)||!final.closed_at||final.close_reason!==p.closeReason.trim())
    throw Error('F06_TX_REFUND_FINAL_CLOSED_STATE_DRIFT');
   const finalPay=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[p.refundId]);
   if(Number(finalPay.n)!==0)throw Error('F06_TX_REFUND_FINAL_PAYMENT_SOURCE_GAP');
   return yes('F06_TX_REFUND_CLOSED_WITHOUT_PAYMENT',{refundId:p.refundId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
  },{normalOnly:true});
  return result||no('F06_TX_REFUND_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_TX_REFUND_PG_ATOMIC_CONTENTION_DENY');
  if(String(e.message||'').startsWith('F06_TX_REFUND_INJECTED_')||String(e.message||'').startsWith('F06_TX_REFUND_PENDING_ROW_LOST')||
   String(e.message||'').startsWith('F06_TX_REFUND_FINAL_'))return no('F06_TX_REFUND_ATOMIC_ROLLED_BACK');
  throw e;
 }
}

// Public APIs bind exact signed provenance validators, never an arbitrary verifier
// or caller-submitted trust flag. The old PR150 API remains PR146-only.
export async function requestTransactionRefundCI(auth,token,p={}){
 return requestTransactionRefundCore(auth,token,p,verifyTransactionSource,'CI_LEGACY');
}
export async function closeTransactionRefundCI(auth,token,p={}){
 return closeTransactionRefundCore(auth,token,p,verifyTransactionSource,'CI_LEGACY');
}
export async function requestSignedHandoffRefundCI(auth,token,p={}){
 return requestTransactionRefundCore(auth,token,p,(c,t)=>verifyTransactionSourcePostHandoff(c,t,'CI_LEGACY'),'CI_LEGACY');
}
export async function closeSignedHandoffRefundCI(auth,token,p={}){
 return closeTransactionRefundCore(auth,token,p,(c,t)=>verifyTransactionSourcePostHandoff(c,t,'CI_LEGACY'),'CI_LEGACY');
}
export async function requestSignedHandoffRefundComposite(auth,token,p={}){
 return requestTransactionRefundCore(auth,token,p,(c,t)=>verifyTransactionSourcePostHandoff(c,t,'COMPOSITE_NONPROD_SIGNED_V1'),'COMPOSITE_NONPROD_SIGNED_V1');
}
export async function closeSignedHandoffRefundComposite(auth,token,p={}){
 return closeTransactionRefundCore(auth,token,p,(c,t)=>verifyTransactionSourcePostHandoff(c,t,'COMPOSITE_NONPROD_SIGNED_V1'),'COMPOSITE_NONPROD_SIGNED_V1');
}
export const productionRefundIssuerDeny=()=>no('F06_TX_REFUND_PRODUCTION_ISSUER_NOT_WIRED');
export const refundedDeny=()=>no('F06_TX_REFUND_ACTUAL_REFUND_PAYMENT_NOT_AUTHORIZED');
