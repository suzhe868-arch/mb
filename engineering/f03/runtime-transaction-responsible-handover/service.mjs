// F03-2-2M: synthetic PG16 Transaction current-responsible transfer; no production entrypoint or financial mutations.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const valid=x=>Number.isSafeInteger(x)&&x>0;
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===k;
const str=x=>x===undefined||x===null?null:String(x);
const out=(code,more={})=>Object.freeze({code,...more});
// M10: throw after any successful CAS: F03-1 withSession rolls back all owner/audit/receipt writes.

const sha=x=>createHash('sha256').update(x,'utf8').digest('hex');
const hookAllowed=x=>x===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof x==='function');
const request=p=>exact(p,'batchId,clientRequestKey,fromEmployeeId,itemId,recipientEmployeeId,teamId')&&[p.batchId,p.itemId,p.fromEmployeeId,p.recipientEmployeeId,p.teamId].every(valid)&&p.fromEmployeeId!==p.recipientEmployeeId&&typeof p.clientRequestKey==='string'&&/^[A-Za-z0-9._:-]{12,90}$/.test(p.clientRequestKey);
async function scope(c,actor,from,to,team,customer,allowInactive=false){
 const sql="SELECT EXISTS(SELECT 1 FROM public.employees mgr JOIN public.roles mr ON mr.role_id=mgr.main_role_id JOIN public.employees src ON src.employee_id=$2 JOIN public.roles sr ON sr.role_id=src.main_role_id JOIN public.employees dst ON dst.employee_id=$3 JOIN public.roles dr ON dr.role_id=dst.main_role_id JOIN public.permissions p ON p.permission_code='transaction.responsible.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=mgr.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=mgr.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=mgr.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=mgr.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$4 JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships sm ON sm.employee_id=src.employee_id AND sm.team_id=t.team_id JOIN public.employee_team_memberships dm ON dm.employee_id=dst.employee_id AND dm.team_id=t.team_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=mgr.employee_id AND mm.team_id=t.team_id WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND mr.role_code IN ('manager','store_head') AND ($6::boolean OR src.employment_status='active') AND sr.role_code IN('sales','manager','store_head') AND dst.employment_status='active' AND dr.role_code IN('sales','manager','store_head') AND (mr.role_code='manager' OR mgr.store_id=t.store_id) AND st.status='active' AND t.team_status='active' AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp()))))) AND sm.valid_from<=statement_timestamp() AND (sm.ended_at IS NULL OR sm.ended_at>statement_timestamp()) AND dm.valid_from<=statement_timestamp() AND (dm.ended_at IS NULL OR dm.ended_at>statement_timestamp()) AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND EXISTS(SELECT 1 FROM public.customers cx WHERE cx.customer_id=$5 AND cx.account_status='active')) permitted";
 return (await c.query(sql,[actor,from,to,team,customer,allowInactive])).rows[0].permitted===true;
}
async function authTx(auth,token,fn,opts={}){
 if(!hookAllowed(opts.testCheckpoint))return out('M02_TEST_HOOK_DENY');
 const v=await auth.pool.connect();try{await verify(v)}finally{v.release()}
 try{
  return await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||!['manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false)return out('M02_NOT_CURRENT_MANAGER_OR_HEAD');
   await c.query("SET LOCAL lock_timeout='1200ms'");await c.query("SET LOCAL statement_timeout='9000ms'");
   await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
   await c.query('SELECT pg_advisory_xact_lock(20261010,309)');
   await c.query('SELECT pg_advisory_xact_lock(20261010,314)');
   return fn(c,a,opts.testCheckpoint);
  },{normalOnly:true})??out('M02_SESSION_DENY');
 }catch(e){
  if(e.code==='M04_UNSAFE_FINANCIAL_OR_TRANSACTION_STATE_DEFER_DENY'&&e.message==='M_PRECOMMIT_RELATION_CHANGED_ATOMIC_ROLLBACK')return out(e.code,{transactionRolledBack:true});
  if(['55P03','40P01','57014','40001'].includes(e.code))return out('M04_CONTENTION_DEFER_DENY');
  if(e.code==='23505'&&/f03_2_2m_receipt_(request_key_unique|item_unique)/.test(e.constraint||''))return out('M05_COLLISION_DENY');
  throw e;
 }
}
async function facts(c,actor,p,locking=false){
 const suffix=locking?' FOR UPDATE':' FOR SHARE';
 const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1'+suffix,[p.batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||str(b.initiated_by_id)!==str(actor.employee_id)||str(b.source_employee_id)!==str(p.fromEmployeeId)||!['collecting','pending_domain_handover','blocked'].includes(b.status))return {error:'M03_BATCH_IDENTITY_DENY'};
 const i=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 AND item_id=$2'+suffix,[p.batchId,p.itemId])).rows[0];
 if(!i||i.object_kind!=='Transaction'||!['pending','retry_required'].includes(i.status)||str(i.from_employee_id)!==str(p.fromEmployeeId)||str(i.intended_to_employee_id)!==str(p.recipientEmployeeId)||!/^[1-9][0-9]{0,17}$/.test(i.object_id))return {error:'M03_ITEM_SCOPE_DENY'};
 const transactionId=Number(i.object_id);if(!valid(transactionId))return {error:'M03_TRANSACTION_ID_DENY'};
 const tx=(await c.query('SELECT * FROM public.transactions WHERE transaction_id=$1'+suffix,[transactionId])).rows[0];
 if(!tx||tx.status!=='in_progress'||tx.completed_at!==null)return {error:'M03_TRANSACTION_NOT_IN_PROGRESS'};
 const source=(await c.query('SELECT * FROM public.locks WHERE lock_id=$1'+suffix,[tx.source_lock_id])).rows[0];
 if(!source||source.lock_status!=='released'||str(source.customer_id)!==str(tx.customer_id)||str(source.vehicle_id)!==str(tx.vehicle_id)||str(source.listing_cycle_id)!==str(tx.listing_cycle_id))return {error:'M03_SOURCE_LOCK_AUTHORITY_DEFER_DENY'};
 const customer=(await c.query('SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[tx.customer_id])).rows[0];
 if(!customer||customer.account_status!=='active'||customer.owner_assignment_state!=='assigned')return {error:'M03_CUSTOMER_INVALID'};
 const listing=(await c.query('SELECT v.vehicle_id,v.source_sale_status,lc.listing_cycle_id,lc.ended_at FROM public.vehicle_listing_cycles lc JOIN public.vehicles v ON v.vehicle_id=lc.vehicle_id WHERE lc.listing_cycle_id=$1 AND lc.vehicle_id=$2 FOR SHARE OF lc,v',[tx.listing_cycle_id,tx.vehicle_id])).rows[0];
 if(!listing||listing.ended_at!==null||!['available','active'].includes(listing.source_sale_status))return {error:'M03_LISTING_SUPPLY_DEFER_DENY'};
 const occupying=(await c.query("SELECT transaction_id FROM public.transactions WHERE vehicle_id=$1 AND status='in_progress' FOR SHARE",[tx.vehicle_id])).rows;
 if(occupying.length!==1||str(occupying[0].transaction_id)!==str(transactionId))return {error:'M03_ACTIVE_TRANSACTION_CONFLICT'};
 const deposits=(await c.query('SELECT deposit_id,customer_id,lock_id,amount_cents,received_at FROM public.deposit_receipts WHERE lock_id=$1 FOR SHARE',[tx.source_lock_id])).rows;
 for(const d of deposits)if(str(d.customer_id)!==str(tx.customer_id)||str(d.lock_id)!==str(tx.source_lock_id)||Number(d.amount_cents)<=0||d.received_at<source.created_at)return {error:'M03_DEPOSIT_EVIDENCE_DEFER_DENY'};
 const refunds=(await c.query('SELECT refund_id,status,customer_id,lock_id,transaction_id FROM public.refund_cases WHERE transaction_id=$1 OR lock_id=$2 FOR SHARE',[transactionId,tx.source_lock_id])).rows;
 for(const r of refunds)if(str(r.customer_id)!==str(tx.customer_id)||!['pending','refunded','closed'].includes(r.status)||((r.lock_id!==null)===(r.transaction_id!==null)))return {error:'M03_REFUND_AUTHORITY_DEFER_DENY'};
 if(refunds.length)return {error:'M03_REFUND_FINANCIAL_SCOPE_DEFER_DENY'};
 const src=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.fromEmployeeId])).rows[0];
 const dst=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.recipientEmployeeId])).rows[0];
 if(!src||!dst||src.employment_status!=='active'&&!['planned_disable','sudden_inactive'].includes(b.change_kind))return {error:'M03_SOURCE_INVALID'};
 if(dst.employment_status!=='active')return {error:'M03_RECIPIENT_INVALID'};
 if(!await scope(c,actor.employee_id,p.fromEmployeeId,p.recipientEmployeeId,p.teamId,tx.customer_id,src.employment_status!=='active'))return {error:'M02_TRANSACTION_PERMISSION_SCOPE_DENY'};
 return {batch:b,item:i,tx,transactionId,sourceLockId:Number(tx.source_lock_id),customerId:Number(tx.customer_id),depositCount:deposits.length,sourceInactive:src.employment_status!=='active'};
}
const display=r=>({receiptId:Number(r.receipt_id),batchId:Number(r.batch_id),itemId:Number(r.item_id),transactionId:Number(r.transaction_id),customerId:Number(r.customer_id),fromEmployeeId:Number(r.from_employee_id),toEmployeeId:Number(r.to_employee_id),actorEmployeeId:Number(r.actor_employee_id),teamId:Number(r.scope_team_id),auditId:Number(r.audit_id),requestKeySha256:r.request_key_sha256,committedAt:r.committed_at.toISOString(),transactionDomainTransferred:true,transactionLifecycleUnchanged:true,otherDomainsCompleted:false,batchCompleted:false});
async function eventProven(c,r){
 const q=await c.query("SELECT b.source_employee_id bs,b.initiated_by_id ba,i.batch_id ib,i.object_kind ik,i.object_id io,i.from_employee_id iff,i.intended_to_employee_id ito,w.customer_id wc,a.actor_kind ak,a.actor_id aid,a.object_kind aok,a.object_id aoid,a.action act,a.role_context rc,a.before_json bj,a.after_json aj,a.occurred_at ats FROM public.handover_batches b JOIN public.handover_items i ON i.item_id=$2 JOIN public.transactions w ON w.transaction_id=$3 JOIN public.audit_events a ON a.audit_id=$4 WHERE b.batch_id=$1",[r.batch_id,r.item_id,r.transaction_id,r.audit_id]);
 const v=q.rows[0];
 return !!v&&q.rows.length===1&&str(v.bs)===str(r.from_employee_id)&&str(v.ba)===str(r.actor_employee_id)&&str(v.ib)===str(r.batch_id)&&v.ik==='Transaction'&&v.io===str(r.transaction_id)&&str(v.iff)===str(r.from_employee_id)&&str(v.ito)===str(r.to_employee_id)&&str(v.wc)===str(r.customer_id)&&v.ak==='employee'&&v.aid===str(r.actor_employee_id)&&v.aok==='Transaction'&&v.aoid===str(r.transaction_id)&&v.act==='transaction.responsible.handover'&&v.rc?.scope==='SG06_CI_ONLY_TRANSACTION'&&str(v.rc.batchId)===str(r.batch_id)&&str(v.rc.itemId)===str(r.item_id)&&str(v.rc.teamId)===str(r.scope_team_id)&&v.rc.requestKeySha256===r.request_key_sha256&&str(v.bj?.responsible)===str(r.from_employee_id)&&str(v.aj?.responsible)===str(r.to_employee_id)&&v.ats?.getTime()===r.committed_at?.getTime();
}
async function proven(c,r){
 const rows=(await c.query('SELECT * FROM public.transaction_responsible_handover_receipts WHERE transaction_id=$1 ORDER BY committed_at,receipt_id FOR SHARE',[r.transaction_id])).rows;
 if(!rows.length)return false;
 let previous=null,found=false;
 const keys=new Set();
 for(const x of rows){
  if(!await eventProven(c,x))return false;
  if(previous&&(str(previous.to_employee_id)!==str(x.from_employee_id)||x.committed_at.getTime()<previous.committed_at.getTime()||BigInt(x.audit_id)<=BigInt(previous.audit_id)))return false;
  if(keys.has(x.request_key_sha256))return false;
  keys.add(x.request_key_sha256);
  if(str(x.receipt_id)===str(r.receipt_id)){if(found||str(x.item_id)!==str(r.item_id)||str(x.audit_id)!==str(r.audit_id))return false;found=true}
  previous=x;
 }
 const current=(await c.query('SELECT customer_id,responsible_employee_id FROM public.transactions WHERE transaction_id=$1 FOR SHARE',[r.transaction_id])).rows[0];
 return found&&!!current&&str(current.customer_id)===str(previous.customer_id)&&str(current.responsible_employee_id)===str(previous.to_employee_id);
}
async function receiptReadScope(c,actor,team,customer){
 const q=await c.query("SELECT EXISTS(SELECT 1 FROM public.employees m JOIN public.roles mr ON mr.role_id=m.main_role_id JOIN public.permissions p ON p.permission_code='transaction.responsible.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=m.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=m.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=m.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=m.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=m.employee_id AND mm.team_id=t.team_id JOIN public.customers cu ON cu.customer_id=$3 WHERE m.employee_id=$1 AND m.employment_status='active' AND mr.role_code IN('manager','store_head') AND (mr.role_code='manager' OR m.store_id=t.store_id) AND t.team_status='active' AND st.status='active' AND cu.account_status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())))))) allowed",[actor,team,customer]);
 return q.rows[0].allowed===true;
}
export async function prepareTransactionResponsibleHandover(auth,token,p,o){
 if(!request(p))return out('M01_BAD_REQUEST');
 return authTx(auth,token,async(c,actor)=>{
  const f=await facts(c,actor,p);if(f.error)return out(f.error);
  if(str(f.tx.responsible_employee_id)!==str(p.fromEmployeeId))return out('M03_SOURCE_NOT_CURRENT');
  return out('M01_PREPARED_READ_ONLY',{batchId:p.batchId,itemId:p.itemId,transactionId:f.transactionId,customerId:f.customerId,sourceInactive:f.sourceInactive,commitTokenIssued:false,transactionLifecycleUnchanged:true,batchCompleted:false});
 },o);
}
async function transfer(c,actor,p,hook){
 const key=sha(p.clientRequestKey);
 const old=(await c.query('SELECT * FROM public.transaction_responsible_handover_receipts WHERE item_id=$1 FOR SHARE',[p.itemId])).rows[0];
 if(old){
  if(!await receiptReadScope(c,actor.employee_id,p.teamId,old.customer_id))return out('M02_TRANSACTION_PERMISSION_SCOPE_DENY');
  if(str(old.actor_employee_id)!==str(actor.employee_id)||str(old.batch_id)!==str(p.batchId)||str(old.from_employee_id)!==str(p.fromEmployeeId)||str(old.to_employee_id)!==str(p.recipientEmployeeId)||str(old.scope_team_id)!==str(p.teamId)||old.request_key_sha256!==key)return out('M05_COLLISION_DENY');
  if(!await proven(c,old))return out('M05_RECEIPT_PROOF_DENY');
  return out('M05_IDEMPOTENT_RECEIPT',{receipt:display(old),idempotent:true});
 }
 const f=await facts(c,actor,p,true);if(f.error)return out(f.error);
 for(const table of ['customer_owner_handover_receipts','demand_responsible_handover_receipts','consultation_assignee_handover_receipts','waitlist_responsible_handover_receipts','lock_responsible_handover_receipts']){
  if((await c.query('SELECT 1 FROM public.'+table+' WHERE request_key_sha256=$1 FOR SHARE',[key])).rowCount)return out('M05_CROSS_DOMAIN_KEY_DENY');
 }
 const conflict=(await c.query('SELECT item_id FROM public.transaction_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[key])).rows[0];
 if(conflict)return out('M05_COLLISION_DENY');
 if(str(f.tx.responsible_employee_id)!==str(p.fromEmployeeId))return out('M04_CAS_CONFLICT');
 if(hook)await hook('before_update',c);
 // clock_timestamp() is the real PG wall clock, unlike frozen now()/transaction_timestamp().
 const change=await c.query("UPDATE public.transactions SET responsible_employee_id=$1 WHERE transaction_id=$2 AND responsible_employee_id=$3 AND status='in_progress' AND completed_at IS NULL RETURNING transaction_id",[p.recipientEmployeeId,f.transactionId,p.fromEmployeeId]);
 if(change.rowCount!==1)return out('M04_CAS_CONFLICT');
 if(hook)await hook('after_update',c);
 const audit=(await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,'Transaction',$3,'transaction.responsible.handover',$4::jsonb,$5::jsonb,transaction_timestamp()) RETURNING audit_id",[str(actor.employee_id),JSON.stringify({scope:'SG06_CI_ONLY_TRANSACTION',batchId:p.batchId,itemId:p.itemId,teamId:p.teamId,requestKeySha256:key}),str(f.transactionId),JSON.stringify({responsible:p.fromEmployeeId}),JSON.stringify({responsible:p.recipientEmployeeId})])).rows[0].audit_id;
 if(hook)await hook('after_audit',c);
 const receipt=(await c.query('INSERT INTO public.transaction_responsible_handover_receipts(item_id,batch_id,transaction_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[p.itemId,p.batchId,f.transactionId,f.customerId,p.fromEmployeeId,p.recipientEmployeeId,actor.employee_id,p.teamId,audit,key])).rows[0];
 if(hook)await hook('after_receipt',c);
 if(hook)await hook('before_commit',c);
 // M10 precommit proof is fresh business authorization, not merely an owner CAS.
 // Recheck current Team/store/employee permission and customer/listing after late hooks.
 // Any denial after writes is an exception, never a returned error: withSession ROLLBACKs.
 const freshScope=await scope(c,actor.employee_id,p.fromEmployeeId,p.recipientEmployeeId,p.teamId,f.customerId,f.sourceInactive);
 const freshCustomer=(await c.query('SELECT account_status,owner_assignment_state FROM public.customers WHERE customer_id=$1 FOR SHARE',[f.customerId])).rows[0];
 const freshListing=(await c.query('SELECT v.source_sale_status,lc.ended_at FROM public.vehicle_listing_cycles lc JOIN public.vehicles v ON v.vehicle_id=lc.vehicle_id WHERE lc.listing_cycle_id=$1 AND lc.vehicle_id=$2 FOR SHARE OF lc,v',[f.tx.listing_cycle_id,f.tx.vehicle_id])).rows[0];
 const freshBatch=(await c.query('SELECT source_employee_id,initiated_by_kind,initiated_by_id,status FROM public.handover_batches WHERE batch_id=$1 FOR UPDATE',[p.batchId])).rows[0];
 const freshItem=(await c.query('SELECT batch_id,object_kind,object_id,from_employee_id,intended_to_employee_id,status FROM public.handover_items WHERE item_id=$1 FOR UPDATE',[p.itemId])).rows[0];
 if(!freshScope||!freshCustomer||freshCustomer.account_status!=='active'||freshCustomer.owner_assignment_state!=='assigned'||!freshListing||freshListing.ended_at!==null||!['available','active'].includes(freshListing.source_sale_status)||!freshBatch||str(freshBatch.source_employee_id)!==str(p.fromEmployeeId)||freshBatch.initiated_by_kind!=='employee'||str(freshBatch.initiated_by_id)!==str(actor.employee_id)||!['collecting','pending_domain_handover','blocked'].includes(freshBatch.status)||!freshItem||str(freshItem.batch_id)!==str(p.batchId)||freshItem.object_kind!=='Transaction'||str(freshItem.object_id)!==str(f.transactionId)||str(freshItem.from_employee_id)!==str(p.fromEmployeeId)||str(freshItem.intended_to_employee_id)!==str(p.recipientEmployeeId)||!['pending','retry_required'].includes(freshItem.status)){
  throw Object.assign(new Error('M_PRECOMMIT_RELATION_CHANGED_ATOMIC_ROLLBACK'),{code:'M04_UNSAFE_FINANCIAL_OR_TRANSACTION_STATE_DEFER_DENY'});
 }
 // A signed Transaction owner change must remain valid at the last DB statement.
 // Throw on any post-CAS inconsistency so F03-1 withSession actually ROLLBACKs.
 const final=(await c.query("SELECT t.status,t.completed_at,t.responsible_employee_id,t.source_lock_id,t.customer_id,t.vehicle_id,t.listing_cycle_id,l.customer_id AS source_customer_id,l.vehicle_id AS source_vehicle_id,l.listing_cycle_id AS source_cycle_id,l.lock_status,(SELECT count(*)::int FROM public.deposit_receipts d WHERE d.lock_id=l.lock_id) AS deposit_count,(SELECT count(*)::int FROM public.refund_cases r WHERE r.transaction_id=t.transaction_id OR r.lock_id=l.lock_id) AS refund_count FROM public.transactions t JOIN public.locks l ON l.lock_id=t.source_lock_id WHERE t.transaction_id=$1 FOR UPDATE OF t,l",[f.transactionId])).rows[0];
 if(!final||final.status!=='in_progress'||final.completed_at!==null||str(final.responsible_employee_id)!==str(p.recipientEmployeeId)||str(final.source_lock_id)!==str(f.sourceLockId)||str(final.customer_id)!==str(f.customerId)||str(final.customer_id)!==str(final.source_customer_id)||str(final.vehicle_id)!==str(final.source_vehicle_id)||str(final.listing_cycle_id)!==str(final.source_cycle_id)||final.lock_status!=='released'||final.deposit_count!==f.depositCount||final.refund_count!==0){
  throw Object.assign(new Error('M_PRECOMMIT_RELATION_CHANGED_ATOMIC_ROLLBACK'),{code:'M04_UNSAFE_FINANCIAL_OR_TRANSACTION_STATE_DEFER_DENY'});
 }
 return out('M04_TRANSACTION_TRANSFERRED',{receipt:display(receipt),otherDomainsPending:true,transactionLifecycleUnchanged:true,idempotent:false});
}
export const commitTransactionResponsibleHandover=(a,t,p,o)=>!request(p)?Promise.resolve(out('M04_BAD_REQUEST')):authTx(a,t,(c,actor,h)=>transfer(c,actor,p,h),o);
export const retryTransactionResponsibleHandover=(a,t,p,o)=>!request(p)?Promise.resolve(out('M05_BAD_RETRY')):authTx(a,t,(c,actor,h)=>transfer(c,actor,p,h),o);
export async function readTransactionResponsibleHandoverReceipt(auth,token,p,o){
 if(!exact(p,'batchId,itemId,teamId')||![p.batchId,p.itemId,p.teamId].every(valid))return out('M05_BAD_READ');
 return authTx(auth,token,async(c,actor)=>{
  const r=(await c.query('SELECT * FROM public.transaction_responsible_handover_receipts WHERE item_id=$1 AND batch_id=$2 FOR SHARE',[p.itemId,p.batchId])).rows[0];
  if(!r||str(r.scope_team_id)!==str(p.teamId))return out('M05_RECEIPT_ABSENT');
  if(!await receiptReadScope(c,actor.employee_id,p.teamId,r.customer_id))return out('M02_TRANSACTION_PERMISSION_SCOPE_DENY');
  if(!await proven(c,r))return out('M05_RECEIPT_PROOF_DENY');
  return out('M05_RECEIPT_READ_ONLY',{receipt:display(r),transactionLifecycleUnchanged:true,batchCompleted:false});
 },o);
}
