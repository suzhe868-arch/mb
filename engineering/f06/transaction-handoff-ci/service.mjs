// F06-4B: isolated synthetic responsible handoff on signed F06-3B Transaction only.
import {createHash} from 'node:crypto';
import {gate,verify} from './migration.mjs';
const yes=(code,extra={})=>({allowed:true,code,...extra}),no=(code,extra={})=>({allowed:false,code,...extra});
const one=async(c,sql,values=[])=> (await c.query(sql,values)).rows[0];
const sha=s=>createHash('sha256').update(s).digest('hex');
const id=x=>Number.isSafeInteger(x)&&x>0;
const key=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{16,120}$/.test(x);
const reason=x=>typeof x==='string'&&x.trim().length>=6&&x.trim().length<=240;
export function productionHandoffDeny(){return no('F06_4B_PRODUCTION_TRANSACTION_HANDOFF_ISSUER_GAP')}
export function productionCancelDeny(){return no('F06_4B_PRODUCTION_TRANSACTION_CANCEL_ISSUER_GAP')}
export function realMoneyDeny(){return no('F06_4B_REAL_MONEY_NEVER_AUTHORIZED')}
export function completedDeny(){return no('F06_4B_COMPLETED_TRANSACTION_NEVER_AUTHORIZED')}
// Business transfer is strictly independent of role label: actual signed permission + actual team/store scope.
async function managerPermission(c,a,oldId,newId,customerId){
 if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||a.credential_state!=='enabled'||
 a.subject_status!=='active'||a.force_password_change!==false||!['manager','store_head'].includes(a.role_code))return no('F06_4B_MANAGER_SESSION_DENIED');
 const row=await one(c,"SELECT t.team_id,t.store_id,r.role_code FROM public.employees mgr "+
 "JOIN public.roles r ON r.role_id=mgr.main_role_id "+
 "JOIN public.employees old ON old.employee_id=$2 "+
 "JOIN public.employees recv ON recv.employee_id=$3 "+
 "JOIN public.roles recv_role ON recv_role.role_id=recv.main_role_id "+
 "JOIN public.permissions p ON p.permission_code='transaction.responsible.transfer' "+
 "JOIN public.employee_permission_overrides perm ON perm.employee_id=mgr.employee_id AND perm.permission_id=p.permission_id AND perm.decision='allow' "+
 "JOIN public.employee_capability_scope_bindings b ON b.employee_id=mgr.employee_id AND b.permission_id=p.permission_id "+
 "JOIN public.employee_data_scopes scope ON scope.scope_id=b.scope_id AND scope.employee_id=mgr.employee_id "+
 "JOIN public.employee_team_memberships old_m ON old_m.employee_id=old.employee_id "+
 "JOIN public.employee_team_memberships recv_m ON recv_m.employee_id=recv.employee_id AND recv_m.team_id=old_m.team_id "+
 "JOIN public.teams t ON t.team_id=old_m.team_id JOIN public.stores st ON st.store_id=t.store_id "+
 "JOIN public.employee_team_memberships mgr_m ON mgr_m.employee_id=mgr.employee_id AND mgr_m.team_id=t.team_id "+
 "JOIN public.customers cust ON cust.customer_id=$4 "+
 "WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND r.role_code IN('manager','store_head') "+
 "AND recv.employment_status='active' AND recv_role.role_code IN('sales','manager','store_head') "+
 "AND t.team_status='active' AND st.status='active' AND cust.account_status='active' "+
 "AND old_m.valid_from<=clock_timestamp() AND (old_m.ended_at IS NULL OR old_m.ended_at>clock_timestamp()) "+
 "AND recv_m.valid_from<=clock_timestamp() AND (recv_m.ended_at IS NULL OR recv_m.ended_at>clock_timestamp()) "+
 "AND mgr_m.valid_from<=clock_timestamp() AND (mgr_m.ended_at IS NULL OR mgr_m.ended_at>clock_timestamp()) "+
 "AND b.granted_at<=clock_timestamp() AND (b.ended_at IS NULL OR b.ended_at>clock_timestamp()) "+
 "AND (scope.ended_at IS NULL OR scope.ended_at>clock_timestamp()) "+
 "AND ((scope.scope_kind='team' AND scope.scope_reference_id=t.team_id) OR "+
 "(scope.scope_kind='store' AND scope.scope_reference_id=t.store_id AND r.role_code='store_head')) "+
 "AND (r.role_code<>'store_head' OR mgr.store_id=t.store_id) "+
 "LIMIT 1 FOR SHARE OF mgr,r,old,recv,recv_role,p,perm,b,scope,old_m,recv_m,t,st,mgr_m,cust",
 [a.employee_id,oldId,newId,customerId]);
 if(!row||row.role_code!==a.role_code)return no('F06_4B_EXPLICIT_PERMISSION_SCOPE_DENIED');
 return yes('F06_4B_SIGNED_TRANSFER_SCOPE',{teamId:Number(row.team_id),storeId:Number(row.store_id)});
}
async function originProof(c,t){
 const origin=await one(c,"SELECT * FROM f06_3b_ci.transaction_origins WHERE transaction_id=$1 FOR SHARE",[t.transaction_id]);
 if(!origin||origin.status!=='in_progress'||origin.public_carrier_status!=='in_progress'||
 Number(origin.source_lock_id)!==Number(t.source_lock_id)||Number(origin.customer_id)!==Number(t.customer_id)||
 Number(origin.vehicle_id)!==Number(t.vehicle_id)||Number(origin.listing_cycle_id)!==Number(t.listing_cycle_id))
 return no('F06_4B_UNSIGNED_ORIGIN_DENY');
 const lock=await one(c,"SELECT * FROM public.locks WHERE lock_id=$1 FOR UPDATE",[origin.source_lock_id]);
 const snap=await one(c,"SELECT * FROM f06_1_lock_ci.lock_snapshots WHERE lock_id=$1 FOR SHARE",[origin.source_lock_id]);
 if(!lock||!snap||lock.lock_status!=='released'||lock.end_reason!=='converted_to_transaction'||
 Number(lock.customer_id)!==Number(t.customer_id)||Number(lock.vehicle_id)!==Number(t.vehicle_id)||
 Number(lock.listing_cycle_id)!==Number(t.listing_cycle_id)||
 Number(snap.responsible_employee_id)!==Number(origin.original_responsible_employee_id)||
 Number(lock.responsible_employee_id)!==Number(origin.original_responsible_employee_id))
 return no('F06_4B_LOCK_CONVERSION_ORIGINAL_SOURCE_GAP');
 const cy=await one(c,"SELECT listing_cycle_id,ended_at FROM public.vehicle_listing_cycles WHERE listing_cycle_id=$1 AND vehicle_id=$2 FOR SHARE",[t.listing_cycle_id,t.vehicle_id]);
 const v=await one(c,"SELECT source_sale_status,archived_at FROM public.vehicles WHERE vehicle_id=$1",[t.vehicle_id]);
 if(!cy||cy.ended_at||!v||v.archived_at||!['available','active'].includes(v.source_sale_status))return no('F06_4B_LISTING_NOT_CURRENT');
 const counts=await one(c,"SELECT "+
 "(SELECT count(*)::int FROM public.deposit_receipts WHERE lock_id=$1) raw,"+
 "(SELECT count(*)::int FROM f06_3a_ci.receipt_provenance WHERE lock_id=$1) signed,"+
 "(SELECT count(*)::int FROM public.refund_cases WHERE lock_id=$1 OR transaction_id=$2) refunds,"+
 "(SELECT count(*)::int FROM public.refund_payments rp JOIN public.refund_cases rc USING(refund_id) WHERE rc.lock_id=$1 OR rc.transaction_id=$2) paid",
 [origin.source_lock_id,t.transaction_id]);
 if(counts.raw!==counts.signed||counts.refunds!==0||counts.paid!==0)return no('F06_4B_FINANCE_OR_REFUND_SOURCE_GAP');
 const provenance=(await c.query("SELECT d.customer_id,d.amount_cents,p.customer_id signed_customer,p.original_amount_cents FROM public.deposit_receipts d JOIN f06_3a_ci.receipt_provenance p USING(deposit_id) WHERE d.lock_id=$1 FOR SHARE OF d,p",[origin.source_lock_id])).rows;
 if(provenance.some(x=>Number(x.customer_id)!==Number(t.customer_id)||Number(x.signed_customer)!==Number(t.customer_id)||
 Number(x.amount_cents)!==Number(x.original_amount_cents)))return no('F06_4B_DEPOSIT_PROVENANCE_DRIFT');
 // F03-2M requires its own true handover batch/item/receipt. Do not manufacture one from role alone.
 const mReceipts=await one(c,"SELECT count(*)::int n FROM public.transaction_responsible_handover_receipts WHERE transaction_id=$1",[t.transaction_id]);
 if(mReceipts.n!==0)return no('F06_4B_F03_M_SIGNED_RECEIPT_BRIDGE_NOT_PROVEN');
 return yes('F06_4B_SIGNED_ORIGINAL_IN_PROGRESS',{origin,lock,depositCount:counts.raw});
}
async function projection(c,t,o){
 const p=await one(c,"SELECT * FROM f06_4b_ci.responsible_projection WHERE transaction_id=$1 FOR UPDATE",[t.transaction_id]);
 if(!p)return Number(t.responsible_employee_id)===Number(o.original_responsible_employee_id)?
  yes('F06_4B_FIRST_ORIGINAL',{oldId:Number(t.responsible_employee_id),priorEvent:null,eventCount:0}):no('F06_4B_UNSIGNED_RESPONSIBLE_CHANGE');
 if(Number(p.current_responsible_employee_id)!==Number(t.responsible_employee_id)||
 Number(p.original_responsible_employee_id)!==Number(o.original_responsible_employee_id)||
 Number(p.source_lock_id)!==Number(o.source_lock_id)||Number(p.vehicle_id)!==Number(o.vehicle_id)||
 Number(p.customer_id)!==Number(o.customer_id)||Number(p.listing_cycle_id)!==Number(o.listing_cycle_id))
  return no('F06_4B_CURRENT_PROJECTION_DRIFT');
 const events=(await c.query("SELECT event_id,old_responsible_employee_id,new_responsible_employee_id,prior_event_id FROM f06_4b_ci.handoff_events WHERE transaction_id=$1 ORDER BY event_id FOR SHARE",[t.transaction_id])).rows;
 if(!events.length||events.length!==p.event_count)return no('F06_4B_EVENT_CHAIN_MISSING');
 let old=Number(o.original_responsible_employee_id),previous=null;
 for(const e of events){
  if(Number(e.old_responsible_employee_id)!==old||
   (previous===null?e.prior_event_id!==null:Number(e.prior_event_id)!==previous))return no('F06_4B_EVENT_CHAIN_INVALID');
  old=Number(e.new_responsible_employee_id);previous=Number(e.event_id);
 }
 if(old!==Number(t.responsible_employee_id)||previous!==Number(p.last_event_id))return no('F06_4B_PROJECTION_EVENT_MISMATCH');
 return yes('F06_4B_SIGNED_CURRENT',{oldId:old,priorEvent:previous,eventCount:events.length});
}
export async function handoffSyntheticTransactionCI(auth,token,p={}){
 gate();
 if(!id(p.transactionId)||!id(p.newResponsibleId)||!reason(p.reason)||!key(p.eventKey))
 return no('F06_4B_INVALID_REQUEST');
 try{
 const result=await auth.withSession(token,async(c,a)=>{
  await verify(c);await c.query("SET LOCAL lock_timeout='1500ms'");
  if(!a||a.principal_kind!=='employee'||a.system_admin_id!==null||!['manager','store_head'].includes(a.role_code))
   return no('F06_4B_MANAGER_SESSION_DENIED');
  const found=await one(c,'SELECT vehicle_id FROM public.transactions WHERE transaction_id=$1',[p.transactionId]);
  if(!found)return no('F06_4B_TRANSACTION_NOT_FOUND');
  await c.query('SELECT vehicle_id FROM public.vehicles WHERE vehicle_id=$1 FOR UPDATE',[found.vehicle_id]);
  const t=await one(c,"SELECT * FROM public.transactions WHERE transaction_id=$1 FOR UPDATE",[p.transactionId]);
  if(!t||t.status!=='in_progress'||t.completed_at!==null)return no('F06_4B_NOT_IN_PROGRESS');
  const signed=await originProof(c,t);if(!signed.allowed)return signed;
  const proj=await projection(c,t,signed.origin);if(!proj.allowed)return proj;
  const k=sha('f06-4b:'+a.employee_id+':'+p.eventKey);
  const payload=sha(JSON.stringify({transactionId:p.transactionId,newResponsibleId:p.newResponsibleId,reason:p.reason.trim(),action:'handoff'}));
  const existing=await one(c,"SELECT * FROM f06_4b_ci.request_keys WHERE event_key_sha256=$1",[k]);
  if(existing)return Number(existing.transaction_id)===p.transactionId&&existing.payload_sha256===payload?
   yes('F06_4B_IDEMPOTENT_HANDOFF',{transactionId:p.transactionId,eventId:Number(existing.result_event_id)}):
   no('F06_4B_IDEMPOTENCY_KEY_CONFLICT');
  if(proj.oldId===p.newResponsibleId)return no('F06_4B_SELF_TRANSFER_DENIED');
  const scope=await managerPermission(c,a,proj.oldId,p.newResponsibleId,t.customer_id);if(!scope.allowed)return scope;
  if(p.testCheckpoint==='BEFORE_CHANGE_THROW')throw Error('F06_4B_INJECTED_BEFORE_CHANGE_ROLLBACK');
  const changed=await one(c,"UPDATE public.transactions SET responsible_employee_id=$2 WHERE transaction_id=$1 AND responsible_employee_id=$3 AND status='in_progress' RETURNING transaction_id",[p.transactionId,p.newResponsibleId,proj.oldId]);
  if(!changed)throw Error('F06_4B_ATOMIC_CAS_LOST');
  if(p.testCheckpoint==='AFTER_CHANGE_THROW')throw Error('F06_4B_INJECTED_CHANGE_ROLLBACK');
  if(proj.priorEvent===null){
   await c.query("INSERT INTO f06_4b_ci.responsible_projection(transaction_id,source_lock_id,customer_id,vehicle_id,listing_cycle_id,original_responsible_employee_id,current_responsible_employee_id,event_count) VALUES($1,$2,$3,$4,$5,$6,$7,0)",
   [t.transaction_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,signed.origin.original_responsible_employee_id,proj.oldId]);
  }
  const event=await one(c,"INSERT INTO f06_4b_ci.handoff_events(transaction_id,old_responsible_employee_id,new_responsible_employee_id,actor_employee_id,reason,event_key_sha256,prior_event_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING event_id",
   [t.transaction_id,proj.oldId,p.newResponsibleId,a.employee_id,p.reason.trim(),k,proj.priorEvent]);
  if(p.testCheckpoint==='AFTER_EVENT_THROW')throw Error('F06_4B_INJECTED_EVENT_ROLLBACK');
  await c.query("UPDATE f06_4b_ci.responsible_projection SET current_responsible_employee_id=$2,last_event_id=$3,event_count=event_count+1,last_changed_at=clock_timestamp() WHERE transaction_id=$1",[p.transactionId,p.newResponsibleId,event.event_id]);
  await c.query("INSERT INTO f06_4b_ci.request_keys(event_key_sha256,transaction_id,actor_employee_id,payload_sha256,result_event_id) VALUES($1,$2,$3,$4,$5)",[k,t.transaction_id,a.employee_id,payload,event.event_id]);
  await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,'Transaction',$2,'f06_4b_ci_responsible_handoff',$3::jsonb,$4::jsonb,clock_timestamp())",
   [String(a.employee_id),String(t.transaction_id),JSON.stringify({responsible:proj.oldId}),JSON.stringify({responsible:p.newResponsibleId,eventId:Number(event.event_id),source:'F06_4B_SYNTHETIC_CI'})]);
  if(p.testCheckpoint==='AFTER_AUDIT_THROW')throw Error('F06_4B_INJECTED_AUDIT_ROLLBACK');
  const fresh=await managerPermission(c,a,proj.oldId,p.newResponsibleId,t.customer_id);
  const final=await one(c,"SELECT status,completed_at,responsible_employee_id,source_lock_id FROM public.transactions WHERE transaction_id=$1",[p.transactionId]);
  if(!fresh.allowed||!final||final.status!=='in_progress'||final.completed_at!==null||
   Number(final.responsible_employee_id)!==p.newResponsibleId||Number(final.source_lock_id)!==Number(signed.origin.source_lock_id))
   throw Error('F06_4B_PRECOMMIT_SOURCE_CHANGED_ROLLBACK');
  if(p.testCheckpoint==='BEFORE_COMMIT_THROW')throw Error('F06_4B_INJECTED_PRECOMMIT_ROLLBACK');
  return yes('F06_4B_ATOMIC_HANDOFF_CI',{transactionId:p.transactionId,oldResponsibleId:proj.oldId,newResponsibleId:p.newResponsibleId,eventId:Number(event.event_id),teamId:scope.teamId,backendPid:(await one(c,'SELECT pg_backend_pid() pid')).pid});
 },{normalOnly:true});
 return result||no('F06_4B_SIGNED_SESSION_DENIED');
 }catch(e){if(['55P03','40P01','40001','23505'].includes(e.code))return no('F06_4B_PG_CONTENTION_ATOMIC_DENY',{sqlstate:e.code});throw e}
}
export async function currentSignedResponsibleCI(c,transactionId){
 gate();await verify(c);if(!id(transactionId))return no('F06_4B_INVALID_ID');
 const t=await one(c,'SELECT * FROM public.transactions WHERE transaction_id=$1',[transactionId]);
 if(!t||t.status!=='in_progress')return no('F06_4B_NON_CURRENT_TRANSACTION');
 const origin=await originProof(c,t);if(!origin.allowed)return origin;
 const cur=await projection(c,t,origin.origin);if(!cur.allowed)return cur;
 return yes('F06_4B_SIGNED_RESPONSIBLE_CI',{currentResponsibleId:cur.oldId,originalResponsibleId:Number(origin.origin.original_responsible_employee_id),hasHandoff:cur.eventCount>0});
}
// CRITICAL: parent F06-4A immutable origin requires original responsible; it is NOT safe to pretend
// original responsible equals transferred responsible. This cross-batch adapter fails closed until
// a separately signed cancellation carrier and current-token permission proof exists.
export async function postHandoffCancelGuardCI(c,transactionId,actorEmployeeId){
 const cur=await currentSignedResponsibleCI(c,transactionId);
 if(!cur.allowed)return cur;
 if(cur.hasHandoff)return no('PARENT_CANCEL_POST_HANDOFF_SOURCE_GAP',{currentResponsibleId:cur.currentResponsibleId,actorIsCurrent:cur.currentResponsibleId===actorEmployeeId});
 return no('F06_4B_CANCEL_ISSUER_NOT_PROVIDED_USE_SIGNED_PARENT_GUARDS');
}
export async function publicPoolHandoffGuardCI(c,customerId){
 gate();await verify(c);if(!id(customerId))return no('F06_4B_INVALID_CUSTOMER');
 const x=await one(c,"SELECT (SELECT count(*)::int FROM public.transactions WHERE customer_id=$1 AND status='in_progress') ongoing,(SELECT count(*)::int FROM public.refund_cases WHERE customer_id=$1 AND status='pending') pending",[customerId]);
 return x.ongoing||x.pending?no('F06_4B_ACTIVE_BUSINESS_PREVENTS_PUBLIC_POOL'):yes('F06_4B_OTHER_PUBLIC_POOL_GUARDS_STILL_APPLY');
}
