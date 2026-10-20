// F06 Lock→Transaction 真HTTP/PG16安全侧车；只能用于隔离合成事实。
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const yes=(code,data={})=>({allowed:true,code,...data});
const no=code=>({allowed:false,code});
const sha=x=>createHash('sha256').update(x).digest('hex');
const one=async(c,sql,p=[])=> (await c.query(sql,p)).rows[0];
const validId=x=>Number.isSafeInteger(x)&&x>0;
const validKey=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
export const PRODUCTION_TRANSACTION_ISSUER='F06_REAL_TX_PRODUCTION_ISSUER_NOT_WIRED';
export function productionIssuerDeny(){return no(PRODUCTION_TRANSACTION_ISSUER)}
async function parent(c){
 const x=await one(c,"SELECT current_database() db,current_user u,current_setting('server_version_num')::int ver,(SELECT rolsuper FROM pg_roles WHERE rolname=current_user) su,(SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user) dbcreate,to_regnamespace('f06_1_lock_ci') IS NOT NULL lock_parent,to_regnamespace('f06_2_ci') IS NOT NULL lifecycle,to_regnamespace('f06_3a_ci') IS NOT NULL deposit,to_regnamespace('f06_real_tx_ci') IS NOT NULL sidecar");
 assert.equal(x.db,'f03_auth_test');assert.equal(x.u,'f03_ci');
 assert.equal(x.su,false);assert.equal(x.dbcreate,false);
 assert.ok(x.ver>=160000&&x.ver<170000&&x.lock_parent&&x.lifecycle&&x.deposit&&x.sidecar);
 const m=await one(c,'SELECT count(*)::int n FROM public.f03_schema_migrations');
 assert.equal(m.n,24,'signed migration chain must remain complete');
 return x;
}
async function capability(c,a,l,permission){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||
 !['sales','manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||
 a.subject_status!=='active'||a.force_password_change!==false)return false;
 if(Number(a.employee_id)!==Number(l.responsible_employee_id))return false;
 const x=await one(c,"SELECT r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code=$2 "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id "+
 "JOIN public.stores st ON st.store_id=t.store_id "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND t.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN ('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st",[a.employee_id,permission]);
 return !!x && x.role_code===a.role_code;
}
async function refunds(c,l){
 // 同车+周期的旧Lock/Transaction关联退款都要看到；先锁签名退款载体的物理行。
 const cases=(await c.query("SELECT r.* FROM public.refund_cases r "+
 "LEFT JOIN public.locks lk ON lk.lock_id=r.lock_id "+
 "LEFT JOIN public.transactions tx ON tx.transaction_id=r.transaction_id "+
 "WHERE (lk.vehicle_id=$1 AND lk.listing_cycle_id=$2) "+
 "OR (tx.vehicle_id=$1 AND tx.listing_cycle_id=$2) "+
 "ORDER BY r.refund_id FOR UPDATE OF r",[l.vehicle_id,l.listing_cycle_id])).rows;
 const facts=[];
 for(const r of cases){
  const paid=await one(c,'SELECT count(*)::int n FROM public.refund_payments WHERE refund_id=$1',[r.refund_id]);
  if(paid.n>0)return no('F06_TX_REFUND_PAYMENT_ORIGIN_DENY');
  if(r.status==='pending')return no('F06_TX_LOCK_PENDING_REFUND_DENY');
  if(r.status==='refunded')return no('F06_TX_REFUNDED_DENY');
  // 无签名Close来源绝不能仅凭一个public.closed字样推定资金责任消失。
  if(r.status!=='closed'||!r.close_reason||!r.closed_at)return no('F06_TX_UNKNOWN_REFUND_SOURCE_DENY');
  if((await one(c,"SELECT to_regclass('f06_3c1_ci.refund_origins') IS NOT NULL ok")).ok!==true)
   return no('F06_TX_UNSIGNED_CLOSED_REFUND_DENY');
  const source=await one(c,'SELECT refund_id,lock_id,customer_id,vehicle_id,listing_cycle_id FROM f06_3c1_ci.refund_origins WHERE refund_id=$1 FOR SHARE',[r.refund_id]);
  if(!source||Number(source.lock_id)!==Number(r.lock_id)||Number(source.vehicle_id)!==Number(l.vehicle_id)||
   Number(source.listing_cycle_id)!==Number(l.listing_cycle_id)||Number(source.customer_id)!==Number(r.customer_id))
   return no('F06_TX_REFUND_PROVENANCE_DRIFT');
  const events=(await c.query("SELECT event_kind,resulting_status FROM f06_3c1_ci.status_events WHERE refund_id=$1 ORDER BY event_id FOR SHARE",[r.refund_id])).rows;
  if(!events.some(e=>e.event_kind==='closed_without_payment'&&e.resulting_status==='closed'))
   return no('F06_TX_REFUND_CLOSE_UNSIGNED');
  facts.push([r.refund_id,r.status,r.close_reason]);
 }
 return yes('F06_TX_REFUND_EXCLUSION_SIGNED',{refundDigest:sha(JSON.stringify(facts))});
}
async function deposits(c,l){
 const originals=(await c.query('SELECT * FROM public.deposit_receipts WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[l.lock_id])).rows;
 const provenances=(await c.query('SELECT * FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1 ORDER BY deposit_id FOR SHARE',[l.lock_id])).rows;
 if(originals.length!==provenances.length)return no('F06_TX_DEPOSIT_UNKNOWN_ISSUER_DENY');
 for(let i=0;i<originals.length;i++){
  const p=provenances[i],d=originals[i];
  if(Number(p.deposit_id)!==Number(d.deposit_id)||Number(p.customer_id)!==Number(l.customer_id)||
   Number(p.vehicle_id)!==Number(l.vehicle_id)||Number(p.listing_cycle_id)!==Number(l.listing_cycle_id)||
   Number(p.original_amount_cents)!==Number(d.amount_cents)||p.issuer_kind!=='CI_SYNTHETIC_NOT_REAL_MONEY')
   return no('F06_TX_DEPOSIT_PROVENANCE_DRIFT');
  const change=await one(c,'SELECT COALESCE(sum(delta_cents),0)::bigint balance FROM f06_3a_ci.adjustments WHERE deposit_id=$1',[d.deposit_id]);
  if(Number(change.balance)+Number(d.amount_cents)<0)return no('F06_TX_NEGATIVE_SIGNED_DEPOSIT_DENY');
 }
 return yes('F06_TX_DEPOSIT_SIGNED_READ_ONLY',{depositCount:originals.length});
}
export async function openSyntheticTransactionCI(auth,token,p={}){
 if(!validId(p.lockId)||!validKey(p.eventKey))return no('F06_TX_INVALID_ARGUMENTS');
 try{
  const result=await auth.withSession(token,async(c,a)=>{
   await parent(c);
   await c.query("SET LOCAL lock_timeout='1500ms'");
   const known=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[p.lockId]);
   if(!known)return no('F06_TX_LOCK_NOT_FOUND');
   await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[known.vehicle_id]);
   const l=await one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[p.lockId]);
   if(!l)return no('F06_TX_LOCK_NOT_FOUND');
   if(!await capability(c,a,l,'transaction.ci.open'))return no('F06_TX_PERMISSION_SCOPE_DENIED');
   const k=sha('F06_REAL_TX:'+a.employee_id+':'+p.eventKey);
   const fingerprint=sha(JSON.stringify({actor:a.employee_id,lockId:p.lockId,action:'open',customerId:l.customer_id,vehicleId:l.vehicle_id,listingCycleId:l.listing_cycle_id}));
   const old=await one(c,'SELECT * FROM f06_real_tx_ci.request_keys WHERE key_sha256=$1 FOR SHARE',[k]);
   if(old)return old.fingerprint_sha256===fingerprint&&Number(old.source_lock_id)===p.lockId?
    yes('F06_TX_IDEMPOTENT',{transactionId:Number(old.transaction_id)}):no('F06_TX_IDEMPOTENCY_KEY_CONFLICT');
   const time=await one(c,'SELECT $1::timestamptz<=clock_timestamp() AS expired',[l.expires_at]);
   if(l.lock_status!=='active'||time.expired)return no('F06_TX_INACTIVE_LOCK_DENY');
   const s=await one(c,'SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE',[l.lock_id]);
   if(!s||Number(s.customer_id)!==Number(l.customer_id)||Number(s.responsible_employee_id)!==Number(l.responsible_employee_id)||
    !Number.isSafeInteger(Number(s.initial_hours))||Number(s.initial_hours)<=0)return no('F06_TX_UNSIGNED_LOCK_DENY');
   const cust=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[l.customer_id]);
   const cyc=await one(c,'SELECT ended_at,vehicle_id FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[l.listing_cycle_id,l.vehicle_id]);
   const v=await one(c,'SELECT source_type,source_sale_status,archived_at FROM public.vehicles WHERE vehicle_id=$1',[l.vehicle_id]);
   const sale=v&&!v.archived_at&&((v.source_type==='wholesale'&&v.source_sale_status==='active')||
    (['mingbang','four_s'].includes(v.source_type)&&v.source_sale_status==='available'));
   if(!cust||cust.account_status!=='active'||!cyc||cyc.ended_at||!sale)return no('F06_TX_CUSTOMER_VEHICLE_CYCLE_DENY');
   const occupied=await one(c,'SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 LIMIT 1 FOR SHARE',[l.vehicle_id]);
   const byLock=await one(c,'SELECT transaction_id FROM public.transactions WHERE source_lock_id=$1 LIMIT 1 FOR SHARE',[l.lock_id]);
   if(occupied||byLock)return no('F06_TX_UNIQUE_VEHICLE_OCCUPIED');
   const origin=await one(c,'SELECT transaction_id FROM f06_real_tx_ci.origins WHERE vehicle_id=$1 LIMIT 1 FOR SHARE',[l.vehicle_id]);
   if(origin)return no('F06_TX_SIDECAR_OCCUPANCY_DENY');
   const refund=await refunds(c,l);if(!refund.allowed)return refund;
   const funds=await deposits(c,l);if(!funds.allowed)return funds;
   if(p.testCheckpoint==='BEFORE_WRITE_THROW')throw Error('F06_TX_INJECTED_BEFORE_WRITE');
   const tx=await one(c,"INSERT INTO public.transactions(source_lock_id,customer_id,vehicle_id,listing_cycle_id,status,responsible_employee_id) VALUES($1,$2,$3,$4,'in_progress',$5) RETURNING transaction_id",[l.lock_id,l.customer_id,l.vehicle_id,l.listing_cycle_id,l.responsible_employee_id]);
   if(p.testCheckpoint==='AFTER_TRANSACTION_THROW')throw Error('F06_TX_INJECTED_AFTER_TRANSACTION');
   const change=await c.query("UPDATE public.locks SET lock_status='released',end_reason='converted_to_transaction' WHERE lock_id=$1 AND lock_status='active'",[l.lock_id]);
   if(change.rowCount!==1)throw Error('F06_TX_LOST_ACTIVE_LOCK');
   if(p.testCheckpoint==='AFTER_LOCK_THROW')throw Error('F06_TX_INJECTED_AFTER_LOCK');
   await c.query("INSERT INTO f06_real_tx_ci.origins(transaction_id,source_lock_id,vehicle_id,listing_cycle_id,customer_id,responsible_employee_id,actor_employee_id,state,carrier,issuer,source_price_kind,source_price_cents,priority_origin_id,original_deposit_count,source_refund_digest) VALUES($1,$2,$3,$4,$5,$6,$7,'in_progress','in_progress','CI_SYNTHETIC_NOT_REAL_MONEY',$8,$9,$10,$11,$12)",[tx.transaction_id,l.lock_id,l.vehicle_id,l.listing_cycle_id,l.customer_id,l.responsible_employee_id,a.employee_id,s.price_kind,s.price_cents,s.priority_origin_id,funds.depositCount,refund.refundDigest]);
   if(p.testCheckpoint==='AFTER_ORIGIN_THROW')throw Error('F06_TX_INJECTED_AFTER_ORIGIN');
   await c.query('INSERT INTO f06_real_tx_ci.request_keys(key_sha256,fingerprint_sha256,employee_id,source_lock_id,transaction_id) VALUES($1,$2,$3,$4,$5)',[k,fingerprint,a.employee_id,l.lock_id,tx.transaction_id]);
   await c.query("INSERT INTO f06_real_tx_ci.events(transaction_id,source_lock_id,actor_employee_id,event_kind,source_status,final_status) VALUES($1,$2,$3,'lock_to_transaction','active','released')",[tx.transaction_id,l.lock_id,a.employee_id]);
   const audit=await one(c,"INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_real_tx_ci_atomic_open',$3::jsonb,$4::jsonb,clock_timestamp()) RETURNING event_id",[String(a.employee_id),String(tx.transaction_id),JSON.stringify({lockStatus:'active',lockId:l.lock_id}),JSON.stringify({lockStatus:'released',status:'in_progress',issuer:'CI_SYNTHETIC_NOT_REAL_MONEY'})]);
   if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_TX_INJECTED_AFTER_AUDIT');
   const finalRefund=await refunds(c,l);
   if(!finalRefund.allowed||finalRefund.refundDigest!==refund.refundDigest)throw Error('F06_TX_REFUND_GUARD_CHANGED_BEFORE_COMMIT');
   const final=await one(c,"SELECT t.status tx_status,l.lock_status,l.end_reason FROM public.transactions t JOIN public.locks l ON l.lock_id=t.source_lock_id WHERE t.transaction_id=$1",[tx.transaction_id]);
   if(final.tx_status!=='in_progress'||final.lock_status!=='released'||final.end_reason!=='converted_to_transaction')throw Error('F06_TX_FINAL_COMMIT_CONSISTENCY');
   return yes('F06_TX_ATOMIC_SYNTHETIC_IN_PROGRESS',{transactionId:Number(tx.transaction_id),sourceLockId:p.lockId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
  },{normalOnly:true});
  return result||no('F06_TX_SIGNED_SESSION_DENIED');
 }catch(e){
  if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_TX_PG_ATOMIC_CONTENTION_DENY');
  if(String(e.message||'').startsWith('F06_TX_INJECTED_'))return no('F06_TX_ROLLED_BACK');
  throw e;
 }
}
