// F06 normal cancellation for the PR139 origin, isolated PG16 and synthetic only.
// Old signed F06-4A/4C expects f06_3b_ci.transaction_origins. We neither write
// nor impersonate those rows: only the PR139 immutable f06_real_tx_ci origin
// can sign a cancellation through this new versioned disposable adapter.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verify as verifyNativeRefund,checksum as refundSHA} from '../refund-pending-ci/migration.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const sql=readFileSync(new URL('./sidecar.sql',import.meta.url),'utf8');
export const cancelSourceSHA=sha(sql);
const yes=(code,extra={})=>({allowed:true,code,...extra});
const no=code=>({allowed:false,code});
const one=async(c,s,args=[])=>(await c.query(s,args)).rows[0];
const integer=x=>Number.isSafeInteger(x)&&x>0;
const validReason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const originalRef='refs/heads/feat/f06-real-transaction-cancel-http-pg16-01';
export function gate(){
 for(const [k,v] of Object.entries({
  GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_ACTIONS:'true',
  GITHUB_EVENT_NAME:'push',CI:'true',APP_ENV:'test',NODE_ENV:'test',
  GITHUB_REF:'refs/heads/feat/f06-3c1-refund-pending-close-ci',
  F06_CANCEL_ENTRY_REF:originalRef,F06_CANCEL_ENTRY_EVENT:'push',
  F06_CANCEL_ENTRY_BRANCH:'feat/f06-real-transaction-cancel-http-pg16-01',
  F06_CANCEL_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F06_TRANSACTION_CANCEL_ONLY',
  F03_1_DATABASE_URL:'postgres://f03_ci:f03_ci_synthetic_only@127.0.0.1:5432/f03_auth_test'
 }))assert.equal(process.env[k],v,'F06_CANCEL_FORBIDDEN_'+k);
 assert.equal(process.env.F06_CANCEL_ENTRY_SHA,process.env.GITHUB_SHA);
 assert.equal(process.env.F06_CANCEL_ENTRY_RUN_ID,process.env.GITHUB_RUN_ID);
 assert.match(process.env.GITHUB_SHA||'',/^[a-f0-9]{40}$/);
 assert.match(process.env.GITHUB_RUN_ID||'',/^[0-9]{6,20}$/);
}
const ledgerHash=rows=>sha(JSON.stringify(rows));
async function native(c){
 gate();
 const parent=await verifyNativeRefund(c);
 assert.equal(parent.verified,true,'F06_CANCEL_NATIVE_F06_3C1_PARENT_REQUIRED');
 assert.equal(parent.sourceSHA,refundSHA,'F06_CANCEL_PARENT_REFUND_SHA_DRIFT');
 const meta=await one(c,"SELECT current_database() db,current_user u,current_setting('server_version_num')::int version,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) createdb");
 assert.equal(meta.db,'f03_auth_test');assert.equal(meta.u,'f03_ci');
 assert.ok(meta.version>=160000&&meta.version<170000&&!meta.su&&!meta.createdb);
 const ledger=(await c.query('SELECT migration_id,checksum,structure_sha256 FROM public.f03_schema_migrations ORDER BY migration_id')).rows;
 assert.equal(ledger.length,24);
 return {parent,ledger:ledgerHash(ledger)};
}
export async function attest(c){
 const p=await native(c);
 const exist=await one(c,"SELECT to_regclass('f06_real_cancel_ci.attestation') reg");
 if(!exist?.reg)throw Error('F06_CANCEL_SIDECAR_NOT_INSTALLED');
 await c.query("INSERT INTO f06_real_cancel_ci.attestation(seal_name,source_sha256,f06_3c1_parent_sha256,public_catalog_sha256,ledger_sha256) VALUES('F06_REAL_CANCEL_CI_ONLY',$1,$2,$3,$4)",[cancelSourceSHA,p.parent.sourceSHA,p.parent.publicCatalogSHA,p.ledger]);
 return verified(c);
}
async function verified(c){
 const p=await native(c);
 const exists=await one(c,"SELECT to_regclass('f06_real_tx_ci.origins') tx,to_regclass('f06_real_cancel_ci.attestation') cancel");
 if(!exists?.tx||!exists.cancel)throw Error('F06_CANCEL_TRUSTED_SIGNED_SOURCE_MISSING');
 const signed=await one(c,'SELECT * FROM f06_real_cancel_ci.attestation FOR SHARE');
 if(!signed||signed.seal_name!=='F06_REAL_CANCEL_CI_ONLY'||signed.source_sha256!==cancelSourceSHA||
   signed.f06_3c1_parent_sha256!==p.parent.sourceSHA||signed.public_catalog_sha256!==p.parent.publicCatalogSHA||
   signed.ledger_sha256!==p.ledger)throw Error('F06_CANCEL_SOURCE_ATTESTATION_DRIFT');
 return p;
}

async function currentPermission(c,a,responsible){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||
 !['sales','manager','store_head'].includes(a.role_code)||a.force_password_change!==false||
 a.credential_state!=='enabled'||a.subject_status!=='active'||Number(a.employee_id)!==Number(responsible))return false;
 const x=await one(c,"SELECT r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='transaction.ci.cancel' "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships rm ON rm.employee_id=$2 AND rm.team_id=t.team_id "+
 "JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active' "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND t.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,rm",[a.employee_id,responsible]);
 return !!x&&x.role_code===a.role_code;
}

async function trustedTransaction(c,t){
 const o=await one(c,'SELECT * FROM f06_real_tx_ci.origins WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(!o||o.state!=='in_progress'||o.carrier!=='in_progress'||o.issuer!=='CI_SYNTHETIC_NOT_REAL_MONEY'||
  Number(t.source_lock_id)!==Number(o.source_lock_id)||
  Number(t.customer_id)!==Number(o.customer_id)||Number(t.vehicle_id)!==Number(o.vehicle_id)||
  Number(t.listing_cycle_id)!==Number(o.listing_cycle_id))
  return no('F06_CANCEL_UNSIGNED_REAL_TRANSACTION_OR_DRIFT');
 const event=await one(c,'SELECT * FROM f06_real_tx_ci.events WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 const key=await one(c,'SELECT * FROM f06_real_tx_ci.request_keys WHERE transaction_id=$1 FOR SHARE',[t.transaction_id]);
 if(!event||!key||event.event_kind!=='lock_to_transaction'||
  Number(event.source_lock_id)!==Number(o.source_lock_id)||event.source_status!=='active'||event.final_status!=='released'||
  Number(key.source_lock_id)!==Number(o.source_lock_id))
  return no('F06_CANCEL_UNSIGNED_TRANSACTION_EVENT');
 const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[o.source_lock_id]);
 const snap=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[o.source_lock_id]);
 if(!l||!snap||l.lock_status!=='released'||l.end_reason!=='converted_to_transaction'||
  Number(l.vehicle_id)!==Number(o.vehicle_id)||Number(l.customer_id)!==Number(o.customer_id)||
  Number(l.listing_cycle_id)!==Number(o.listing_cycle_id)||
  Number(snap.customer_id)!==Number(l.customer_id)||Number(snap.responsible_employee_id)!==Number(l.responsible_employee_id)||
  Number(o.responsible_employee_id)!==Number(l.responsible_employee_id))
  return no('F06_CANCEL_SIGNED_LOCK_OR_SNAPSHOT_GAP');
 const cy=await one(c,'SELECT vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[l.listing_cycle_id,l.vehicle_id]);
 if(!cy)return no('F06_CANCEL_CYCLE_IDENTITY_GAP');
 const customer=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[t.customer_id]);
 if(!customer||customer.account_status!=='active')return no('F06_CANCEL_CUSTOMER_DISABLED');
 // Native PR139 signed deposit accounting: every public receipt must have
 // precisely its immutable F06-3A provenance; corrections cannot go negative.
 const receipt=(await c.query('SELECT * FROM public.deposit_receipts WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[l.lock_id])).rows;
 const signed=(await c.query('SELECT * FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[l.lock_id])).rows;
 if(receipt.length!==signed.length||receipt.length!==Number(o.original_deposit_count))
  return no('F06_CANCEL_UNKNOWN_DEPOSIT_OR_MISMATCH');
 for(let i=0;i<receipt.length;i++){
  const d=receipt[i],s=signed[i];
  if(Number(d.deposit_id)!==Number(s.deposit_id)||Number(d.customer_id)!==Number(t.customer_id)||
   Number(s.customer_id)!==Number(t.customer_id)||Number(s.vehicle_id)!==Number(t.vehicle_id)||
   Number(s.listing_cycle_id)!==Number(t.listing_cycle_id)||Number(d.amount_cents)!==Number(s.original_amount_cents)||
   s.issuer_kind!=='CI_SYNTHETIC_NOT_REAL_MONEY')return no('F06_CANCEL_DEPOSIT_DRIFT');
  const corr=await one(c,'SELECT COALESCE(sum(delta_cents),0)::bigint delta FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[d.deposit_id]);
  if(Number(d.amount_cents)+Number(corr.delta)<0)return no('F06_CANCEL_UNTRUSTED_ADJUSTMENT');
 }
 // Same transaction and vehicle lock as public Transaction state transition.
 // Unknown, pending and refunded must NEVER be silently cleared by Cancel.
 const refunds=(await c.query('SELECT * FROM public.refund_cases WHERE (lock_id=$1 OR transaction_id=$2) ORDER BY refund_id FOR SHARE',[l.lock_id,t.transaction_id])).rows;
 const closed=[];
 for(const r of refunds){
  if(r.status==='pending')return no('F06_CANCEL_UNRESOLVED_PENDING_REFUND');
  if(r.status==='refunded')return no('F06_CANCEL_REAL_REFUND_PAYMENT_DENY');
  if(r.status!=='closed'||!r.close_reason||!r.closed_at||r.transaction_id!==null)
   return no('F06_CANCEL_UNKNOWN_REFUND_SOURCE');
  const origin=await one(c,'SELECT * FROM f06_3c1_ci.refund_origins WHERE refund_id=$1 FOR SHARE',[r.refund_id]);
  const events=(await c.query('SELECT * FROM f06_3c1_ci.status_events WHERE refund_id=$1 ORDER BY event_id FOR SHARE',[r.refund_id])).rows;
  if(!origin||Number(origin.lock_id)!==Number(l.lock_id)||Number(origin.customer_id)!==Number(t.customer_id)||
   Number(origin.vehicle_id)!==Number(t.vehicle_id)||Number(origin.listing_cycle_id)!==Number(t.listing_cycle_id)||
   Number(origin.amount_cents)!==Number(r.expected_amount_cents)||origin.issuer_kind!=='CI_SYNTHETIC_NO_MONEY'||
   events.length!==2||events[0].event_kind!=='pending_requested'||events[1].event_kind!=='closed_without_payment'||
   events[1].resulting_status!=='closed'||events[1].reason!==r.close_reason)
   return no('F06_CANCEL_REFUND_ORIGIN_DRIFT');
  closed.push([r.refund_id,r.status,r.close_reason,origin.amount_cents]);
 }
 const paid=await one(c,'SELECT count(*)::int n FROM public.refund_payments p JOIN public.refund_cases r USING(refund_id) WHERE r.lock_id=$1 OR r.transaction_id=$2',[l.lock_id,t.transaction_id]);
 if(paid.n!==0)return no('F06_CANCEL_PAYMENT_SOURCE_GAP');
 if(sha(JSON.stringify(closed))!==o.source_refund_digest)return no('F06_CANCEL_SIGNED_REFUND_SNAPSHOT_DRIFT');
 return yes('F06_CANCEL_SIGNED_PR139_SOURCE',{source:o,lock:l,checksum:sha(JSON.stringify([o,event,key]))});
}
export const productionCancelIssuer=()=>no('F06_CANCEL_PRODUCTION_ISSUER_NOT_WIRED');
export async function cancelSyntheticRealTransactionCI(auth,token,p={}){
 gate();
 if(!integer(p.transactionId)||!validReason(p.reason)||!validKey(p.eventKey))
  return no('F06_CANCEL_INVALID_ARGUMENTS');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verified(c);
  await c.query("SET LOCAL lock_timeout='1500ms'");
  const seed=await one(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
  if(!seed)return no('F06_CANCEL_TRANSACTION_NOT_FOUND');
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[seed.vehicle_id]);
  const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE',[p.transactionId]);
  if(!t)return no('F06_CANCEL_TRANSACTION_NOT_FOUND');
  if(!await currentPermission(c,a,t.responsible_employee_id))return no('F06_CANCEL_PERMISSION_SCOPE_DENIED');
  const h=sha('F06_REAL_CANCEL:'+a.employee_id+':'+p.eventKey);
  const fingerprint=sha(JSON.stringify({actor:a.employee_id,transactionId:p.transactionId,reason:p.reason.trim(),action:'cancel'}));
  const known=await one(c,'SELECT * FROM f06_real_cancel_ci.request_keys WHERE event_key_sha256=$1 FOR SHARE',[h]);
  if(known)return Number(known.transaction_id)===p.transactionId&&known.payload_sha256===fingerprint?
   yes('F06_CANCEL_IDEMPOTENT',{transactionId:p.transactionId}):no('F06_CANCEL_IDEMPOTENCY_CONFLICT');
  if(t.status==='cancelled')return no('F06_CANCEL_ALREADY_TERMINAL');
  if(t.status!=='in_progress')return no('F06_CANCEL_ONLY_IN_PROGRESS');
  const prior=await one(c,'SELECT transaction_id FROM f06_real_cancel_ci.origins WHERE transaction_id=$1',[p.transactionId]);
  if(prior)return no('F06_CANCEL_ALREADY_TERMINAL');
  const src=await trustedTransaction(c,t);
  if(!src.allowed)return src;
  if(p.testCheckpoint==='BEFORE_STATUS_THROW')throw Error('F06_CANCEL_INJECTED_BEFORE_STATUS');
  const change=await c.query("UPDATE public.transactions SET status='cancelled' WHERE transaction_id=$1 AND status='in_progress'",[t.transaction_id]);
  if(change.rowCount!==1)throw Error('F06_CANCEL_STATUS_LOST');
  if(p.testCheckpoint==='AFTER_STATUS_THROW')throw Error('F06_CANCEL_INJECTED_AFTER_STATUS');
  await c.query("INSERT INTO f06_real_cancel_ci.origins(transaction_id,source_lock_id,vehicle_id,listing_cycle_id,customer_id,original_responsible_employee_id,acting_responsible_employee_id,actor_employee_id,previous_status,resulting_status,issuer,reason,parent_tx_digest) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'in_progress','cancelled','CI_SYNTHETIC_NOT_REAL_MONEY',$9,$10)",
    [t.transaction_id,src.source.source_lock_id,t.vehicle_id,t.listing_cycle_id,t.customer_id,src.source.responsible_employee_id,t.responsible_employee_id,a.employee_id,p.reason.trim(),src.checksum]);
  await c.query("INSERT INTO f06_real_cancel_ci.events(transaction_id,actor_employee_id,event_kind,previous_status,resulting_status,reason,event_key_sha256) VALUES($1,$2,'cancelled_without_payment','in_progress','cancelled',$3,$4)",[t.transaction_id,a.employee_id,p.reason.trim(),h]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_CANCEL_INJECTED_AFTER_EVENT');
  await c.query('INSERT INTO f06_real_cancel_ci.request_keys(event_key_sha256,employee_id,transaction_id,payload_sha256) VALUES($1,$2,$3,$4)',[h,a.employee_id,t.transaction_id,fingerprint]);
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_real_cancel_ci_cancelled',$3::jsonb,$4::jsonb,clock_timestamp())",
   [String(a.employee_id),String(t.transaction_id),JSON.stringify({status:'in_progress'}),JSON.stringify({status:'cancelled',reason:p.reason.trim(),issuer:'CI_SYNTHETIC_NOT_REAL_MONEY'})]);
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_CANCEL_INJECTED_AFTER_AUDIT');
  const final=await one(c,'SELECT status,completed_at FROM public.transactions WHERE transaction_id=$1',[t.transaction_id]);
  if(final.status!=='cancelled'||final.completed_at!==null)throw Error('F06_CANCEL_NO_TERMINAL');
  return yes('F06_CANCEL_CANCELLED_NO_PAYMENT',{transactionId:p.transactionId,sourceLockId:Number(t.source_lock_id),backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||no('F06_CANCEL_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_CANCEL_PG_CONTENTION_DENY');
  if(String(e.message||'').startsWith('F06_CANCEL_INJECTED_'))return no('F06_CANCEL_ATOMIC_ROLLED_BACK');
  throw e;
 }
}
