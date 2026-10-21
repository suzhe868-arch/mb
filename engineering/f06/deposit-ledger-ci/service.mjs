// F06-3A exclusively disposable PG16 synthetic receipt and append-only correction proof.
import {createHash} from 'node:crypto';
import {gate,verify,verifyComposite} from './migration.mjs';
import {assertCompositeSignedRun} from '../nonprod-single-runtime-integration/可信Composite签名根.mjs';
const deny=(code,extra={})=>({allowed:false,code,...extra});
const yes=(code,extra={})=>({allowed:true,code,...extra});
const one=async(c,sql,params=[])=> (await c.query(sql,params)).rows[0];
const integer=n=>Number.isSafeInteger(n)&&n>0;
const money=n=>integer(n)&&n<=100000000000;
const key=s=>typeof s==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(s);
const reason=s=>typeof s==='string'&&s.trim().length>=6&&s.trim().length<=240;
const hash=s=>createHash('sha256').update(s).digest('hex');
const methods=new Set(['cash','bank_transfer','pos']);
export const PRODUCTION_FINANCIAL_ISSUER='F06_3A_PRODUCTION_FINANCIAL_ISSUER_NOT_WIRED';
export function productionIssuerDeny(){return deny(PRODUCTION_FINANCIAL_ISSUER)}
async function employeeScope(c,a,lock,permission,isCorrection){
 if(a?.principal_kind!=='employee'||a.system_admin_id!==null||
 !['sales','manager','store_head'].includes(a.role_code)||
 a.force_password_change!==false||a.credential_state!=='enabled'||a.subject_status!=='active')return false;
 if(isCorrection&&!['manager','store_head'].includes(a.role_code))return false;
 if(!isCorrection&&Number(a.employee_id)!==Number(lock.responsible_employee_id))return false;
 const who=await one(c,"SELECT e.employee_id,r.role_code FROM public.employees e "+
 "JOIN public.roles r ON r.role_id=e.main_role_id "+
 "JOIN public.permissions p ON p.permission_code=$2 "+
 "JOIN public.employee_permission_overrides o ON o.employee_id=e.employee_id AND o.permission_id=p.permission_id AND o.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=e.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes s ON s.scope_id=b.scope_id AND s.employee_id=e.employee_id "+
 "JOIN public.employee_team_memberships m ON m.employee_id=e.employee_id "+
 "JOIN public.teams t ON t.team_id=m.team_id "+
 "JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships rm ON rm.employee_id=$3 AND rm.team_id=t.team_id "+
 "JOIN public.employees responsible ON responsible.employee_id=rm.employee_id AND responsible.employment_status='active' "+
 "WHERE e.employee_id=$1 AND e.employment_status='active' AND t.team_status='active' AND st.status='active' "+
 "AND m.valid_from<=clock_timestamp() AND (m.ended_at IS NULL OR m.ended_at>clock_timestamp()) "+
 "AND rm.valid_from<=clock_timestamp() AND (rm.ended_at IS NULL OR rm.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (s.ended_at IS NULL OR s.ended_at>clock_timestamp()) "+
 "AND ((s.scope_kind='team' AND s.scope_reference_id=t.team_id) OR "+
 "(s.scope_kind='store' AND s.scope_reference_id=t.store_id AND r.role_code IN ('manager','store_head'))) "+
 "LIMIT 1 FOR SHARE OF e,r,p,o,b,s,m,t,st,rm",
 [a.employee_id,permission,lock.responsible_employee_id]);
 return !!who && who.role_code===a.role_code;
}
async function current(c,lockId){
 const x=await one(c,'SELECT vehicle_id FROM public.locks WHERE lock_id=$1',[lockId]);
 if(!x)return null;
 await one(c,'SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[x.vehicle_id]);
 return one(c,'SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE',[lockId]);
}
async function signedLock(c,l,forRecord){
 if(!l)return deny('F06_3A_LOCK_NOT_FOUND');
 const source=await one(c,"SELECT customer_id,responsible_employee_id,initial_hours,policy_version,price_kind,priority_origin_id FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE",[l.lock_id]);
 if(!source||Number(source.customer_id)!==Number(l.customer_id)||Number(source.responsible_employee_id)!==Number(l.responsible_employee_id))
 return deny('F06_3A_SIGNED_LOCK_SNAPSHOT_REQUIRED');
 const customer=await one(c,'SELECT account_status FROM public.customers WHERE customer_id=$1 FOR SHARE',[l.customer_id]);
 const cy=await one(c,'SELECT ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE',[l.listing_cycle_id,l.vehicle_id]);
 if(!customer||!cy)return deny('F06_3A_INVALID_CUSTOMER_OR_CYCLE');
 if(forRecord&&(l.lock_status!=='active'||customer.account_status!=='active'||!!cy.ended_at))
 return deny('F06_3A_NON_CURRENT_LOCK_DENIED');
 return yes('F06_3A_SIGNED_LOCK',{snapshot:source,customer,cycle:cy});
}
async function audit(c,actor,lock,action,before,after,reasonText=''){
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) "+
 "VALUES('employee',$1,'Deposit',$2,$3,$4::jsonb,$5::jsonb,clock_timestamp())",
 [String(actor),String(lock),'f06_3a_ci_'+action,JSON.stringify(before),JSON.stringify({...after,reason:reasonText})]);
}
const idem=async(c,a,p)=>one(c,"SELECT * FROM f06_3a_ci.request_keys WHERE key_sha256=$1",
 [hash('f06-3a:'+a.employee_id+':'+p.eventKey)]);
async function recordCore(auth,token,p={},mode='CI_LEGACY'){
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')assertCompositeSignedRun();else gate();
 if(!integer(p.lockId)||!money(p.amountCents)||p.currency!=='CNY'||!methods.has(p.paymentMethod)||
 !key(p.eventKey)||!/^20\d{2}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(p.receivedAt||'')||
 (p.syntheticVoucher!==undefined&&(typeof p.syntheticVoucher!=='string'||p.syntheticVoucher.length>120)))
 return deny('F06_3A_INVALID_RECEIPT_ARGUMENTS');
 const result=await auth.withSession(token,async(c,a)=>{
  await (mode==='COMPOSITE_NONPROD_SIGNED_V1'?verifyComposite:verify)(c);await c.query("SET LOCAL lock_timeout='1600ms'");
  const l=await current(c,p.lockId);if(!l)return deny('F06_3A_LOCK_NOT_FOUND');
  if(!await employeeScope(c,a,l,'deposit.ci.record',false))return deny('F06_3A_RECORD_PERMISSION_SCOPE_DENIED');
  const keyHash=hash('f06-3a:'+a.employee_id+':'+p.eventKey);
  const old=await idem(c,a,p);
  if(old)return old.action==='record'&&Number(old.lock_id)===p.lockId&&Number(old.amount_cents)===p.amountCents?
   yes('F06_3A_IDEMPOTENT_RECEIPT',{depositId:Number(old.resulting_deposit_id)}):deny('F06_3A_IDEMPOTENCY_KEY_CONFLICT');
  const guard=await signedLock(c,l,true);if(!guard.allowed)return guard;
  const m=await one(c,"SELECT clock_timestamp() now,$1::timestamptz received",[p.receivedAt]);
  if(!m.received||m.received>m.now||m.received<new Date(m.now.getTime()-30*86400000))
   return deny('F06_3A_RECEIVED_TIME_OUT_OF_RANGE');
  const r=await one(c,"INSERT INTO public.deposit_receipts(customer_id,lock_id,amount_cents,received_at,recorded_by) "+
   "VALUES($1,$2,$3,$4,$5) RETURNING deposit_id",[l.customer_id,l.lock_id,p.amountCents,m.received,a.employee_id]);
  await c.query("INSERT INTO f06_3a_ci.receipt_provenance(deposit_id,lock_id,customer_id,vehicle_id,listing_cycle_id,original_amount_cents,currency,payment_method,operator_employee_id,received_at,note,synthetic_voucher_ref,issuer_kind) "+
   "VALUES($1,$2,$3,$4,$5,$6,'CNY',$7,$8,$9,$10,$11,'CI_SYNTHETIC_NOT_REAL_MONEY')",
   [r.deposit_id,l.lock_id,l.customer_id,l.vehicle_id,l.listing_cycle_id,p.amountCents,p.paymentMethod,a.employee_id,m.received,p.note||null,p.syntheticVoucher||null]);
  await c.query("INSERT INTO f06_3a_ci.request_keys(key_sha256,actor_employee_id,action,lock_id,amount_cents,resulting_deposit_id) VALUES($1,$2,'record',$3,$4,$5)",
   [keyHash,a.employee_id,l.lock_id,p.amountCents,r.deposit_id]);
  await audit(c,a.employee_id,l.lock_id,'record',{}, {depositId:r.deposit_id,amountCents:p.amountCents});
  if(p.testCheckpoint==='AFTER_RECEIPT_THROW')throw Error('F06_3A_INJECTED_RECEIPT_ROLLBACK');
  if(mode==='COMPOSITE_NONPROD_SIGNED_V1'){
   const m=await one(c,'SELECT sidecar_source_sha256 FROM f06_3a_ci.attestation FOR SHARE');
   if(!m||!/^[a-f0-9]{64}$/.test(m.sidecar_source_sha256))throw Error('F06_COMPOSITE_3A_SIGNED_SOURCE_MISSING');
   await c.query("INSERT INTO f06_composite_v1.issued_events(event_key_sha256,event_kind,parent_object_id,employee_id,source_parent_sha256,head_sha,run_id,payload_sha256) VALUES($1,'signed_deposit',$2,$3,$4,$5,$6,$7)",
    [hash('F06_COMPOSITE_DEPOSIT:'+a.employee_id+':'+p.eventKey),r.deposit_id,a.employee_id,m.sidecar_source_sha256,process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID,
    hash(JSON.stringify(['record',p.lockId,p.amountCents,r.deposit_id]))]);
  }
  return yes('F06_3A_SYNTHETIC_RECEIPT_RECORDED',{depositId:Number(r.deposit_id),lockId:p.lockId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||deny('F06_3A_SIGNED_SESSION_DENIED');
}
async function correctCore(auth,token,p={},mode='CI_LEGACY'){
 if(mode==='COMPOSITE_NONPROD_SIGNED_V1')assertCompositeSignedRun();else gate();
 if(!integer(p.lockId)||!integer(p.depositId)||!key(p.eventKey)||!reason(p.reason)||
 !['correction','reversal'].includes(p.action)||p.currency!=='CNY'||
 !Number.isSafeInteger(p.deltaCents)||p.deltaCents===0||Math.abs(p.deltaCents)>100000000000||
 (p.action==='reversal'&&p.deltaCents>0))
 return deny('F06_3A_INVALID_CORRECTION_ARGUMENTS');
 const result=await auth.withSession(token,async(c,a)=>{
  await (mode==='COMPOSITE_NONPROD_SIGNED_V1'?verifyComposite:verify)(c);await c.query("SET LOCAL lock_timeout='1600ms'");
  const l=await current(c,p.lockId);if(!l)return deny('F06_3A_LOCK_NOT_FOUND');
  if(!await employeeScope(c,a,l,'deposit.ci.correct',true))return deny('F06_3A_CORRECTION_PERMISSION_SCOPE_DENIED');
  const keyHash=hash('f06-3a:'+a.employee_id+':'+p.eventKey);
  const old=await idem(c,a,p);
  if(old)return old.action===p.action&&Number(old.lock_id)===p.lockId&&Number(old.deposit_id)===p.depositId&&Number(old.amount_cents)===p.deltaCents?
   yes('F06_3A_IDEMPOTENT_CORRECTION',{adjustmentId:Number(old.resulting_adjustment_id)}):deny('F06_3A_IDEMPOTENCY_KEY_CONFLICT');
  const signed=await signedLock(c,l,false);if(!signed.allowed)return signed;
  const fact=await one(c,"SELECT m.*,d.amount_cents,d.customer_id AS receipt_customer,d.lock_id AS receipt_lock FROM f06_3a_ci.receipt_provenance m "+
   "JOIN public.deposit_receipts d ON d.deposit_id=m.deposit_id WHERE m.deposit_id=$1 FOR UPDATE OF m",[p.depositId]);
  if(!fact||Number(fact.lock_id)!==p.lockId||Number(fact.receipt_lock)!==p.lockId||
   Number(fact.receipt_customer)!==Number(l.customer_id)||Number(fact.customer_id)!==Number(l.customer_id)||
   Number(fact.vehicle_id)!==Number(l.vehicle_id)||Number(fact.listing_cycle_id)!==Number(l.listing_cycle_id)||
   Number(fact.amount_cents)!==Number(fact.original_amount_cents))
    return deny('F06_3A_CROSS_LOCK_OR_UNSIGNED_FACT_DENIED');
  const sum=await one(c,"SELECT COALESCE(sum(delta_cents),0)::bigint delta FROM f06_3a_ci.adjustments WHERE deposit_id=$1",[p.depositId]);
  const net=Number(fact.original_amount_cents)+Number(sum.delta);
  const after=net+p.deltaCents;
  if(!Number.isSafeInteger(after)||after<0||after>100000000000||
    (p.action==='reversal'&&p.deltaCents!==-net))
    return deny('F06_3A_OVER_REVERSAL_OR_INVALID_NET_DENIED',{currentNetCents:net});
  const e=await one(c,"INSERT INTO f06_3a_ci.adjustments(deposit_id,lock_id,event_kind,delta_cents,currency,actor_employee_id,reason,event_key_sha256) "+
    "VALUES($1,$2,$3,$4,'CNY',$5,$6,$7) RETURNING adjustment_id",
    [p.depositId,p.lockId,p.action,p.deltaCents,a.employee_id,p.reason.trim(),keyHash]);
  await c.query("INSERT INTO f06_3a_ci.request_keys(key_sha256,actor_employee_id,action,lock_id,deposit_id,amount_cents,resulting_adjustment_id) "+
   "VALUES($1,$2,$3,$4,$5,$6,$7)",[keyHash,a.employee_id,p.action,p.lockId,p.depositId,p.deltaCents,e.adjustment_id]);
  await audit(c,a.employee_id,l.lock_id,p.action,{netCents:net},{netCents:after,depositId:p.depositId},p.reason.trim());
  if(p.testCheckpoint==='AFTER_CORRECTION_THROW')throw Error('F06_3A_INJECTED_CORRECTION_ROLLBACK');
  if(mode==='COMPOSITE_NONPROD_SIGNED_V1'){
   const m=await one(c,'SELECT sidecar_source_sha256 FROM f06_3a_ci.attestation FOR SHARE');
   if(!m||!/^[a-f0-9]{64}$/.test(m.sidecar_source_sha256))throw Error('F06_COMPOSITE_3A_SIGNED_SOURCE_MISSING');
   await c.query("INSERT INTO f06_composite_v1.issued_events(event_key_sha256,event_kind,parent_object_id,employee_id,source_parent_sha256,head_sha,run_id,payload_sha256) VALUES($1,'signed_deposit',$2,$3,$4,$5,$6,$7)",
    [hash('F06_COMPOSITE_3A_CORRECTION:'+a.employee_id+':'+p.eventKey),p.depositId,a.employee_id,m.sidecar_source_sha256,process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID,
    hash(JSON.stringify([p.action,p.lockId,p.depositId,p.deltaCents,e.adjustment_id]))]);
  }
  return yes('F06_3A_APPEND_ONLY_'+p.action.toUpperCase(),{adjustmentId:Number(e.adjustment_id),depositId:p.depositId,netCents:after,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||deny('F06_3A_SIGNED_SESSION_DENIED');
}
export async function recordSyntheticDepositCI(auth,token,p={}){return recordCore(auth,token,p,'CI_LEGACY')}
export async function recordSyntheticDepositComposite(auth,token,p={}){return recordCore(auth,token,p,'COMPOSITE_NONPROD_SIGNED_V1')}
export async function correctSyntheticDepositCI(auth,token,p={}){return correctCore(auth,token,p,'CI_LEGACY')}
export async function correctSyntheticDepositComposite(auth,token,p={}){return correctCore(auth,token,p,'COMPOSITE_NONPROD_SIGNED_V1')}
export async function receiptNetCI(c,depositId){
 gate();if(!integer(depositId))return deny('F06_3A_INVALID_DEPOSIT');
 await verify(c);
 const x=await one(c,"SELECT m.original_amount_cents,COALESCE(sum(e.delta_cents),0)::bigint delta "+
  "FROM f06_3a_ci.receipt_provenance m LEFT JOIN f06_3a_ci.adjustments e ON e.deposit_id=m.deposit_id "+
  "WHERE m.deposit_id=$1 GROUP BY m.original_amount_cents",[depositId]);
 return x?yes('F06_3A_CI_NET_READ_ONLY',{netCents:Number(x.original_amount_cents)+Number(x.delta)}):
 deny('F06_3A_DEPOSIT_NOT_FOUND');
}
