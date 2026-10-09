// F03-2-2H: CI-isolated Customer owner only. No employee.manage substitution.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const valid=x=>Number.isSafeInteger(x)&&x>0;
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===k;
const digest=x=>createHash('sha256').update(x,'utf8').digest('hex');
const okKey=x=>typeof x==='string'&&/^[a-zA-Z0-9._:-]{12,90}$/.test(x);
const out=(code,extra={})=>Object.freeze({code,...extra});
const str=x=>x===undefined||x===null?null:String(x);
const permitCheckpoint=x=>x===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof x==='function');
const input=p=>exact(p,'batchId,clientRequestKey,fromEmployeeId,itemId,recipientEmployeeId,teamId')&&[p.batchId,p.itemId,p.fromEmployeeId,p.recipientEmployeeId,p.teamId].every(valid)&&p.fromEmployeeId!==p.recipientEmployeeId&&okKey(p.clientRequestKey);
async function currentScope(c,actor,from,to,team,customer,allowInactive){
 const sql="SELECT EXISTS(SELECT 1 FROM public.employees mgr JOIN public.roles mr ON mr.role_id=mgr.main_role_id JOIN public.employees src ON src.employee_id=$2 JOIN public.roles sr ON sr.role_id=src.main_role_id JOIN public.employees dst ON dst.employee_id=$3 JOIN public.roles dr ON dr.role_id=dst.main_role_id JOIN public.permissions p ON p.permission_code='customer.owner.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=mgr.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=mgr.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=mgr.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=mgr.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$4 JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships sm ON sm.employee_id=src.employee_id AND sm.team_id=t.team_id JOIN public.employee_team_memberships dm ON dm.employee_id=dst.employee_id AND dm.team_id=t.team_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=mgr.employee_id AND mm.team_id=t.team_id WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND mr.role_code IN ('manager','store_head') AND ($6::boolean OR src.employment_status='active') AND sr.role_code IN('sales','manager','store_head') AND dst.employment_status='active' AND dst.receiving_status='receiving' AND dr.role_code IN('sales','manager','store_head') AND (mr.role_code='manager' OR mgr.store_id=t.store_id) AND st.status='active' AND t.team_status='active' AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp()))))) AND sm.valid_from<=statement_timestamp() AND (sm.ended_at IS NULL OR sm.ended_at>statement_timestamp()) AND dm.valid_from<=statement_timestamp() AND (dm.ended_at IS NULL OR dm.ended_at>statement_timestamp()) AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND EXISTS(SELECT 1 FROM public.customers cx WHERE cx.customer_id=$5 AND cx.account_status='active')) permitted";
 return (await c.query(sql,[actor,from,to,team,customer,allowInactive])).rows[0].permitted===true;
}
async function facts(c,a,p,lock=false){
 const suffix=lock?' FOR UPDATE':' FOR SHARE';
 const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1'+suffix,[p.batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||str(b.initiated_by_id)!==str(a.employee_id)||str(b.source_employee_id)!==str(p.fromEmployeeId)||!['collecting','pending_domain_handover','blocked'].includes(b.status))return {error:'H02_BATCH_IDENTITY_DENY'};
 const i=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 AND item_id=$2'+suffix,[p.batchId,p.itemId])).rows[0];
 if(!i||i.object_kind!=='Customer'||!['pending','retry_required'].includes(i.status)||str(i.from_employee_id)!==str(p.fromEmployeeId)||str(i.intended_to_employee_id)!==str(p.recipientEmployeeId)||!/^[1-9][0-9]{0,17}$/.test(i.object_id))return {error:'H02_ITEM_SCOPE_DENY'};
 const customerId=Number(i.object_id);
 if(!valid(customerId))return {error:'H02_CUSTOMER_ID_DENY'};
 const customer=(await c.query('SELECT * FROM public.customers WHERE customer_id=$1'+suffix,[customerId])).rows[0];
 if(!customer||customer.account_status!=='active'||customer.owner_assignment_state!=='assigned')return {error:'H02_CUSTOMER_STATE_DENY'};
 const src=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.fromEmployeeId])).rows[0];
 const dst=(await c.query('SELECT employment_status,receiving_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.recipientEmployeeId])).rows[0];
 if(!src||!dst||src.employment_status!=='active'&&!['planned_disable','sudden_inactive'].includes(b.change_kind))return {error:'H02_SOURCE_INACTIVE_DENY'};
 if(dst.employment_status!=='active'||dst.receiving_status!=='receiving'||(await c.query('SELECT eligible FROM public.employee_receiving_eligibility WHERE employee_id=$1 FOR SHARE',[p.recipientEmployeeId])).rows[0]?.eligible!==true)return {error:'H02_RECIPIENT_DENY'};
 if(!await currentScope(c,a.employee_id,p.fromEmployeeId,p.recipientEmployeeId,p.teamId,customerId,src.employment_status!=='active'))return {error:'H02_CUSTOMER_OWNER_PERMISSION_DENY'};
 return {batch:b,item:i,customer,customerId,sourceInactive:src.employment_status!=='active'};
}
async function authenticated(auth,token,fn,options={}){
 if(!permitCheckpoint(options.testCheckpoint))return out('H_TEST_HOOK_DENY');
 const sealed=await auth.pool.connect();try{
  // Existing 89-table verifier stays strict. Only H commit/retry may use the
  // separately sealed 90-table I verifier when its actual migration exists.
  if(options.crossDomainRequestKeyCommit===true){
   const l=(await sealed.query("SELECT to_regclass('public.lock_responsible_handover_receipts')::text AS tbl")).rows[0]?.tbl;
   if(l==='lock_responsible_handover_receipts'){
    const {verify:verifyL}=await import('../runtime-lock-responsible-handover/migration.mjs');
    await verifyL(sealed);
   }else{
   const exists=(await sealed.query("SELECT to_regclass('public.demand_responsible_handover_receipts')::text AS receipt_table")).rows[0]?.receipt_table;
   if(exists==='demand_responsible_handover_receipts'){
    const {verify:verifyI}=await import('../runtime-demand-responsible-handover/migration.mjs');
    const j=(await sealed.query("SELECT to_regclass('public.consultation_assignee_handover_receipts')::text AS tbl")).rows[0]?.tbl;
    if(j==='consultation_assignee_handover_receipts'){
     const {verify:verifyJ}=await import('../runtime-consultation-assignee-handover/migration.mjs');
     const k=(await sealed.query("SELECT to_regclass('public.waitlist_responsible_handover_receipts')::text AS tbl")).rows[0]?.tbl;
     if(k==='waitlist_responsible_handover_receipts'){
      const {verify:verifyK}=await import('../runtime-waitlist-responsible-handover/migration.mjs');
      await verifyK(sealed);
     }else await verifyJ(sealed);
    }else await verifyI(sealed);
   }else await verify(sealed);
   }
  }else await verify(sealed);
 }finally{sealed.release()}
 try{return await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||!['manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false)return out('H02_NOT_CURRENT_MANAGER_OR_HEAD');
  await c.query("SET LOCAL lock_timeout='1200ms'");
  await c.query("SET LOCAL statement_timeout='9000ms'");
  await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
  await c.query('SELECT pg_advisory_xact_lock(20261010,309)');
  return fn(c,a,options.testCheckpoint);
 },{normalOnly:true})??out('H02_SESSION_DENY')}catch(e){if(['55P03','40P01','57014','40001'].includes(e.code))return out('H04_CONTENTION_DEFER_DENY');throw e}
}
const display=r=>({receiptId:Number(r.receipt_id),batchId:Number(r.batch_id),itemId:Number(r.item_id),customerId:Number(r.customer_id),fromEmployeeId:Number(r.from_employee_id),toEmployeeId:Number(r.to_employee_id),actorEmployeeId:Number(r.actor_employee_id),teamId:Number(r.scope_team_id),ownerHistoryId:Number(r.owner_history_id),auditId:Number(r.audit_id),requestKeySha256:r.request_key_sha256,committedAt:r.committed_at.toISOString(),customerOwnerDomainTransferred:true,otherDomainsCompleted:false,batchCompleted:false,noSourceDowngradePermission:true});
async function receiptProven(c,r){
 // An FK-valid forged receipt alone proves nothing. Verify the exact linked
 // frozen pending Customer item, immutable owner history and matching actor audit.
 const q=await c.query("SELECT h.customer_id hc,h.from_employee_id hf,h.to_employee_id ht,h.changed_at ht_at,b.source_employee_id bs,b.initiated_by_id ba,i.batch_id ib,i.object_kind ik,i.object_id io,i.from_employee_id ifrom,i.intended_to_employee_id ito,a.actor_kind ak,a.actor_id aid,a.object_kind aok,a.object_id aoid,a.action act,a.role_context rc,a.before_json bj,a.after_json aj,a.occurred_at at FROM public.customer_owner_history h JOIN public.handover_batches b ON b.batch_id=$2 JOIN public.handover_items i ON i.item_id=$3 JOIN public.audit_events a ON a.audit_id=$4 WHERE h.owner_history_id=$1",[r.owner_history_id,r.batch_id,r.item_id,r.audit_id]);
 const v=q.rows[0];
 if(!v||q.rows.length!==1)return false;
 return str(v.hc)===str(r.customer_id)&&str(v.hf)===str(r.from_employee_id)&&str(v.ht)===str(r.to_employee_id)&&
  str(v.bs)===str(r.from_employee_id)&&str(v.ba)===str(r.actor_employee_id)&&
  str(v.ib)===str(r.batch_id)&&v.ik==='Customer'&&v.io===str(r.customer_id)&&
  str(v.ifrom)===str(r.from_employee_id)&&str(v.ito)===str(r.to_employee_id)&&
  v.ak==='employee'&&v.aid===str(r.actor_employee_id)&&v.aok==='Customer'&&v.aoid===str(r.customer_id)&&v.act==='customer.owner.handover'&&
  v.rc?.scope==='SG06_CI_ONLY_CUSTOMER_OWNER'&&str(v.rc?.batchId)===str(r.batch_id)&&str(v.rc?.itemId)===str(r.item_id)&&str(v.rc?.teamId)===str(r.scope_team_id)&&v.rc?.requestKeySha256===r.request_key_sha256&&
  str(v.bj?.owner)===str(r.from_employee_id)&&str(v.aj?.owner)===str(r.to_employee_id)&&str(v.aj?.historyId)===str(r.owner_history_id)&&
  v.ht_at?.getTime()===r.committed_at?.getTime()&&v.at?.getTime()===r.committed_at?.getTime();
}
export async function prepareCustomerOwnerHandover(auth,token,p,opt){
 if(!input(p))return out('H01_BAD_REQUEST');
 return authenticated(auth,token,async(c,a)=>{
  const f=await facts(c,a,p);if(f.error)return out(f.error);
  if(str(f.customer.current_owner_employee_id)!==str(p.fromEmployeeId))return out('H01_OWNER_NOT_SOURCE');
  return out('H01_PREPARED_READ_ONLY',{batchId:p.batchId,itemId:p.itemId,customerId:f.customerId,sourceInactive:f.sourceInactive,reusableCommitToken:false,otherDomainsPending:true});
 },opt);
}
async function transfer(c,a,p,hook){
 const f=await facts(c,a,p,true);if(f.error)return out(f.error);
 const sha=digest(p.clientRequestKey);
 // A-I-01: shared transaction locks (306/309) serialize both domains, while
 // this real-table guard provides the missing reverse cross-Domain Key denial.
 // Missing I table is legitimate ONLY on the original sealed 89-table H CI.
 const iTable=(await c.query("SELECT to_regclass('public.demand_responsible_handover_receipts')::text AS receipt_table")).rows[0]?.receipt_table;
 if(iTable==='demand_responsible_handover_receipts'){
  if((await c.query('SELECT 1 FROM public.demand_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[sha])).rowCount)return out('H04_CROSS_DOMAIN_KEY_DENY');
 }
 const j=(await c.query("SELECT to_regclass('public.consultation_assignee_handover_receipts')::text AS tbl")).rows[0]?.tbl;
 if(j==='consultation_assignee_handover_receipts'&&(await c.query('SELECT 1 FROM public.consultation_assignee_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[sha])).rowCount)return out('H04_CROSS_DOMAIN_KEY_DENY');
 const k=(await c.query("SELECT to_regclass('public.waitlist_responsible_handover_receipts')::text AS tbl")).rows[0]?.tbl;
 if(k==='waitlist_responsible_handover_receipts'&&(await c.query('SELECT 1 FROM public.waitlist_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[sha])).rowCount)return out('H04_CROSS_DOMAIN_KEY_DENY');
  const lTable=(await c.query("SELECT to_regclass('public.lock_responsible_handover_receipts')::text AS tbl")).rows[0]?.tbl;
 if(lTable==='lock_responsible_handover_receipts'&&(await c.query('SELECT 1 FROM public.lock_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[sha])).rowCount)return out('H04_CROSS_DOMAIN_KEY_DENY');
 // H-01: the SHA256 request key identifies ONE intent across every Customer,
 // batch and item; DB UNIQUE is authoritative for concurrent writers.
 const keyed=(await c.query('SELECT receipt_id,item_id FROM public.customer_owner_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[sha])).rows[0];
 if(keyed&&str(keyed.item_id)!==str(p.itemId))return out('H04_COLLISION_DENY');
 const old=(await c.query('SELECT * FROM public.customer_owner_handover_receipts WHERE item_id=$1 FOR SHARE',[p.itemId])).rows[0];
 if(old){
  if(!await receiptProven(c,old))return out('H04_RECEIPT_PROOF_DENY');
  if(str(old.batch_id)!==str(p.batchId)||str(old.from_employee_id)!==str(p.fromEmployeeId)||str(old.to_employee_id)!==str(p.recipientEmployeeId)||str(old.customer_id)!==str(f.customerId)||old.request_key_sha256!==sha)return out('H04_COLLISION_DENY');
  if(str(f.customer.current_owner_employee_id)!==str(p.recipientEmployeeId))return out('H04_RECEIPT_OWNER_TAMPER_DENY');
  return out('H04_IDEMPOTENT_RECEIPT',{receipt:display(old),idempotent:true});
 }
 if(str(f.customer.current_owner_employee_id)!==str(p.fromEmployeeId))return out('H03_NO_RECEIPT_OWNER_CONFLICT');
 if(hook)await hook('before_owner_update',c);
 const updated=await c.query("UPDATE public.customers SET current_owner_employee_id=$1 WHERE customer_id=$2 AND current_owner_employee_id=$3 AND owner_assignment_state='assigned' AND account_status='active' RETURNING customer_id",[p.recipientEmployeeId,f.customerId,p.fromEmployeeId]);
 if(updated.rowCount!==1)return out('H03_OWNER_CAS_CONFLICT');
 if(hook)await hook('after_owner_update',c);
 const historyId=(await c.query('SELECT COALESCE(MAX(owner_history_id),0)::bigint+1 next FROM public.customer_owner_history')).rows[0].next;
 await c.query('INSERT INTO public.customer_owner_history(owner_history_id,customer_id,from_employee_id,to_employee_id,changed_at,change_reason) VALUES($1,$2,$3,$4,transaction_timestamp(),$5)',[historyId,f.customerId,p.fromEmployeeId,p.recipientEmployeeId,'SG06 CI Customer item '+p.itemId+' '+f.batch.reason.slice(0,120)]);
 if(hook)await hook('after_history',c);
 const audit=(await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,'Customer',$3,'customer.owner.handover',$4::jsonb,$5::jsonb,transaction_timestamp()) RETURNING audit_id",[str(a.employee_id),JSON.stringify({scope:'SG06_CI_ONLY_CUSTOMER_OWNER',batchId:p.batchId,itemId:p.itemId,teamId:p.teamId,requestKeySha256:sha}),str(f.customerId),JSON.stringify({owner:p.fromEmployeeId}),JSON.stringify({owner:p.recipientEmployeeId,historyId:str(historyId)})])).rows[0].audit_id;
 // A duplicate digest is a hard error under the UNIQUE constraint; fail the
 // complete transaction, including already attempted Customer/history/audit.
 const receipt=(await c.query('INSERT INTO public.customer_owner_handover_receipts(item_id,batch_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,owner_history_id,audit_id,request_key_sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',[p.itemId,p.batchId,f.customerId,p.fromEmployeeId,p.recipientEmployeeId,a.employee_id,p.teamId,historyId,audit,sha])).rows[0];
 if(hook)await hook('after_receipt',c);
 if(hook)await hook('after_audit',c);
 if(hook)await hook('before_commit',c);
 return out('H03_OWNER_DOMAIN_TRANSFERRED',{receipt:display(receipt),otherDomainsPending:true,idempotent:false});
}
export const commitCustomerOwnerHandover=(a,t,p,o)=>!input(p)?Promise.resolve(out('H03_BAD_REQUEST')):authenticated(a,t,(c,actor,h)=>transfer(c,actor,p,h),{...o,crossDomainRequestKeyCommit:true});
export const retryCustomerOwnerHandover=(a,t,p,o)=>!input(p)?Promise.resolve(out('H04_BAD_RETRY')):authenticated(a,t,(c,actor,h)=>transfer(c,actor,p,h),{...o,crossDomainRequestKeyCommit:true});
export async function readCustomerOwnerHandoverReceipt(auth,token,p,opt){
 if(!exact(p,'batchId,itemId,teamId')||![p.batchId,p.itemId,p.teamId].every(valid))return out('H04_BAD_RECEIPT_READ');
 return authenticated(auth,token,async(c,a)=>{
  const r=(await c.query('SELECT * FROM public.customer_owner_handover_receipts WHERE batch_id=$1 AND item_id=$2 FOR SHARE',[p.batchId,p.itemId])).rows[0];
  if(!r||str(r.scope_team_id)!==str(p.teamId))return out('H04_RECEIPT_ABSENT');
  if(!await receiptProven(c,r))return out('H04_RECEIPT_PROOF_DENY');
  const f=await facts(c,a,{...p,fromEmployeeId:Number(r.from_employee_id),recipientEmployeeId:Number(r.to_employee_id)});
  if(f.error)return out(f.error);
  return out('H04_RECEIPT_READ_ONLY',{receipt:display(r),otherDomainsCompleted:false});
 },opt);
}
