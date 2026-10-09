// F03-2-2I: isolated CI PostgreSQL16 Demand-only sensitive domain transaction.
// Priority is derived at READ time; do not write Priority / Recommendation / Customer owner.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const valid=x=>Number.isSafeInteger(x)&&x>0;
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===k;
const str=x=>x===undefined||x===null?null:String(x);
const out=(code,more={})=>Object.freeze({code,...more});
const sha=x=>createHash('sha256').update(x,'utf8').digest('hex');
const hookAllowed=x=>x===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof x==='function');
const request=p=>exact(p,'batchId,clientRequestKey,fromEmployeeId,itemId,recipientEmployeeId,teamId')&&[p.batchId,p.itemId,p.fromEmployeeId,p.recipientEmployeeId,p.teamId].every(valid)&&p.fromEmployeeId!==p.recipientEmployeeId&&typeof p.clientRequestKey==='string'&&/^[A-Za-z0-9._:-]{12,90}$/.test(p.clientRequestKey);
async function scope(c,actor,from,to,team,customer,allowInactive=false){
 const sql="SELECT EXISTS(SELECT 1 FROM public.employees mgr JOIN public.roles mr ON mr.role_id=mgr.main_role_id JOIN public.employees src ON src.employee_id=$2 JOIN public.roles sr ON sr.role_id=src.main_role_id JOIN public.employees dst ON dst.employee_id=$3 JOIN public.roles dr ON dr.role_id=dst.main_role_id JOIN public.permissions p ON p.permission_code='demand.responsible.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=mgr.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=mgr.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=mgr.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=mgr.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$4 JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships sm ON sm.employee_id=src.employee_id AND sm.team_id=t.team_id JOIN public.employee_team_memberships dm ON dm.employee_id=dst.employee_id AND dm.team_id=t.team_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=mgr.employee_id AND mm.team_id=t.team_id WHERE mgr.employee_id=$1 AND mgr.employment_status='active' AND mr.role_code IN ('manager','store_head') AND ($6::boolean OR src.employment_status='active') AND sr.role_code IN('sales','manager','store_head') AND dst.employment_status='active' AND dr.role_code IN('sales','manager','store_head') AND (mr.role_code='manager' OR mgr.store_id=t.store_id) AND st.status='active' AND t.team_status='active' AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp()))))) AND sm.valid_from<=statement_timestamp() AND (sm.ended_at IS NULL OR sm.ended_at>statement_timestamp()) AND dm.valid_from<=statement_timestamp() AND (dm.ended_at IS NULL OR dm.ended_at>statement_timestamp()) AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND EXISTS(SELECT 1 FROM public.customers cx WHERE cx.customer_id=$5 AND cx.account_status='active')) permitted";
 return (await c.query(sql,[actor,from,to,team,customer,allowInactive])).rows[0].permitted===true;
}
async function authTx(auth,token,fn,opts={}){
 if(!hookAllowed(opts.testCheckpoint))return out('I02_TEST_HOOK_DENY');
 const v=await auth.pool.connect();try{
  if(opts.crossDomainRequestKeyCommit===true){
   const j=(await v.query("SELECT to_regclass('public.consultation_assignee_handover_receipts')::text AS tbl")).rows[0]?.tbl;
   if(j==='consultation_assignee_handover_receipts'){
    const {verify:verifyJ}=await import('../runtime-consultation-assignee-handover/migration.mjs');
    const k=(await v.query("SELECT to_regclass('public.waitlist_responsible_handover_receipts')::text AS tbl")).rows[0]?.tbl;
    if(k==='waitlist_responsible_handover_receipts'){
     const {verify:verifyK}=await import('../runtime-waitlist-responsible-handover/migration.mjs');
     await verifyK(v);
    }else await verifyJ(v);
   }else await verify(v);
  }else await verify(v);
 }finally{v.release()}
 try{
  return await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||!['manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false)return out('I02_NOT_CURRENT_MANAGER_OR_HEAD');
   await c.query("SET LOCAL lock_timeout='1200ms'");await c.query("SET LOCAL statement_timeout='9000ms'");
   await c.query('SELECT pg_advisory_xact_lock(20261010,306)'); // shared old SG06 trusted governance
   await c.query('SELECT pg_advisory_xact_lock(20261010,309)'); // serialize with H immutable item writes
   await c.query('SELECT pg_advisory_xact_lock(20261010,311)'); // Demand one-domain adapter
   return fn(c,a,opts.testCheckpoint);
  },{normalOnly:true})??out('I02_SESSION_DENY');
 }catch(e){
  if(['55P03','40P01','57014','40001'].includes(e.code))return out('I04_CONTENTION_DEFER_DENY');
  if(e.code==='23505'&&/f03_2_2i_receipt_(request_key_unique|item_unique)/.test(e.constraint||''))return out('I05_COLLISION_DENY');
  throw e;
 }
}
async function facts(c,actor,p,locking=false){
 const suffix=locking?' FOR UPDATE':' FOR SHARE';
 const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1'+suffix,[p.batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||str(b.initiated_by_id)!==str(actor.employee_id)||str(b.source_employee_id)!==str(p.fromEmployeeId)||!['collecting','pending_domain_handover','blocked'].includes(b.status))return {error:'I03_BATCH_IDENTITY_DENY'};
 const i=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 AND item_id=$2'+suffix,[p.batchId,p.itemId])).rows[0];
 if(!i||i.object_kind!=='Demand'||!['pending','retry_required'].includes(i.status)||str(i.from_employee_id)!==str(p.fromEmployeeId)||str(i.intended_to_employee_id)!==str(p.recipientEmployeeId)||!/^[1-9][0-9]{0,17}$/.test(i.object_id))return {error:'I03_ITEM_SCOPE_DENY'};
 const demandId=Number(i.object_id);if(!valid(demandId))return {error:'I03_DEMAND_ID_DENY'};
 const d=(await c.query('SELECT * FROM public.demands WHERE demand_id=$1'+suffix,[demandId])).rows[0];
 if(!d||!['active','paused'].includes(d.demand_state))return {error:'I03_DEMAND_TERMINAL_OR_MISSING'};
 const cust=(await c.query('SELECT * FROM public.customers WHERE customer_id=$1 FOR SHARE',[d.customer_id])).rows[0];
 if(!cust||cust.account_status!=='active'||cust.owner_assignment_state!=='assigned')return {error:'I03_CUSTOMER_INVALID'};
 const src=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.fromEmployeeId])).rows[0];
 const dst=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1 FOR SHARE',[p.recipientEmployeeId])).rows[0];
 if(!src||!dst||src.employment_status!=='active'&&!['planned_disable','sudden_inactive'].includes(b.change_kind))return {error:'I03_SOURCE_INVALID'};
 // Existing manual Demand responsibility != new automatic accepting pool. No receiving_status gate.
 if(dst.employment_status!=='active')return {error:'I03_RECIPIENT_INVALID'};
 if(!await scope(c,actor.employee_id,p.fromEmployeeId,p.recipientEmployeeId,p.teamId,d.customer_id,src.employment_status!=='active'))return {error:'I02_DEMAND_PERMISSION_SCOPE_DENY'};
 return {batch:b,item:i,demand:d,demandId,customerId:Number(d.customer_id),sourceInactive:src.employment_status!=='active'};
}
const display=r=>({receiptId:Number(r.receipt_id),batchId:Number(r.batch_id),itemId:Number(r.item_id),demandId:Number(r.demand_id),customerId:Number(r.customer_id),fromEmployeeId:Number(r.from_employee_id),toEmployeeId:Number(r.to_employee_id),actorEmployeeId:Number(r.actor_employee_id),teamId:Number(r.scope_team_id),auditId:Number(r.audit_id),requestKeySha256:r.request_key_sha256,committedAt:r.committed_at.toISOString(),demandDomainTransferred:true,priorityIsDerivedOnly:true,batchCompleted:false,otherDomainsCompleted:false});
// Validate EACH immutable domain event independently, then its complete
// ordered authorized receipt/audit lineage. An unrelated direct SQL update
// cannot manufacture a legitimate successor. Never require an old 'to' to
// equal today's responsible employee after a separately proven reassignment.
async function singleReceiptProven(c,r){
 const q=await c.query("SELECT b.source_employee_id bs,b.initiated_by_id ba,i.batch_id ib,i.object_kind ik,i.object_id io,i.from_employee_id iff,i.intended_to_employee_id ito,d.customer_id dc,a.actor_kind ak,a.actor_id aid,a.object_kind aok,a.object_id aoid,a.action act,a.role_context rc,a.before_json bj,a.after_json aj,a.occurred_at ats FROM public.handover_batches b JOIN public.handover_items i ON i.item_id=$2 JOIN public.demands d ON d.demand_id=$3 JOIN public.audit_events a ON a.audit_id=$4 WHERE b.batch_id=$1",[r.batch_id,r.item_id,r.demand_id,r.audit_id]);
 const v=q.rows[0];
 return !!v&&q.rows.length===1&&str(v.bs)===str(r.from_employee_id)&&str(v.ba)===str(r.actor_employee_id)&&str(v.ib)===str(r.batch_id)&&v.ik==='Demand'&&v.io===str(r.demand_id)&&str(v.iff)===str(r.from_employee_id)&&str(v.ito)===str(r.to_employee_id)&&str(v.dc)===str(r.customer_id)&&v.ak==='employee'&&v.aid===str(r.actor_employee_id)&&v.aok==='Demand'&&v.aoid===str(r.demand_id)&&v.act==='demand.responsible.handover'&&v.rc?.scope==='SG06_CI_ONLY_DEMAND'&&str(v.rc.batchId)===str(r.batch_id)&&str(v.rc.itemId)===str(r.item_id)&&str(v.rc.teamId)===str(r.scope_team_id)&&v.rc.requestKeySha256===r.request_key_sha256&&str(v.bj?.responsible)===str(r.from_employee_id)&&str(v.aj?.responsible)===str(r.to_employee_id)&&v.ats?.getTime()===r.committed_at?.getTime();
}
async function proven(c,r){
 const receipts=(await c.query('SELECT * FROM public.demand_responsible_handover_receipts WHERE demand_id=$1 ORDER BY committed_at,receipt_id FOR SHARE',[r.demand_id])).rows;
 if(!receipts.length)return false;
 let found=false,previous=null;
 const seen=new Set();
 for(const e of receipts){
  if(!await singleReceiptProven(c,e))return false;
  if(previous){
   if(str(previous.to_employee_id)!==str(e.from_employee_id)||
      e.committed_at.getTime()<previous.committed_at.getTime()||
      BigInt(e.audit_id)<=BigInt(previous.audit_id))return false;
  }
  if(str(e.receipt_id)===str(r.receipt_id)){
   if(found||str(e.item_id)!==str(r.item_id)||str(e.audit_id)!==str(r.audit_id))return false;
   found=true;
  }
  if(seen.has(String(e.request_key_sha256)))return false;
  seen.add(String(e.request_key_sha256));
  previous=e;
 }
 if(!found)return false;
 const current=(await c.query('SELECT customer_id,responsible_employee_id FROM public.demands WHERE demand_id=$1 FOR SHARE',[r.demand_id])).rows[0];
 return !!current&&str(current.customer_id)===str(previous.customer_id)&&str(current.responsible_employee_id)===str(previous.to_employee_id);
}
// Historical proof must test the reader's current right to view this scoped
// Demand, NOT historic source/recipient receiving or Team membership.
// An inactive historic employee remains part of immutable provenance.
async function receiptReadScope(c,actor,team,customer){
 const q=await c.query("SELECT EXISTS(SELECT 1 FROM public.employees m JOIN public.roles mr ON mr.role_id=m.main_role_id JOIN public.permissions p ON p.permission_code='demand.responsible.transfer' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=m.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=m.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=m.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=m.employee_id AND cb.permission_id=p.permission_id AND cb.scope_id=sc.scope_id JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id LEFT JOIN public.employee_team_memberships mm ON mm.employee_id=m.employee_id AND mm.team_id=t.team_id JOIN public.customers cu ON cu.customer_id=$3 WHERE m.employee_id=$1 AND m.employment_status='active' AND mr.role_code IN('manager','store_head') AND (mr.role_code='manager' OR m.store_id=t.store_id) AND t.team_status='active' AND st.status='active' AND cu.account_status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND ((mr.role_code='manager' AND sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (mr.role_code='store_head' AND ((sc.scope_kind='store' AND sc.scope_reference_id=t.store_id) OR (sc.scope_kind='team' AND sc.scope_reference_id=t.team_id AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())))))) allowed",[actor,team,customer]);
 return q.rows[0].allowed===true;
}
export async function prepareDemandResponsibleHandover(a,t,p,o){
 if(!request(p))return out('I01_BAD_REQUEST');
 return authTx(a,t,async(c,actor)=>{
  const f=await facts(c,actor,p);if(f.error)return out(f.error);
  if(str(f.demand.responsible_employee_id)!==str(p.fromEmployeeId))return out('I03_SOURCE_NOT_CURRENT');
  return out('I01_PREPARED_READ_ONLY',{batchId:p.batchId,itemId:p.itemId,demandId:f.demandId,customerId:f.customerId,demandState:f.demand.demand_state,sourceInactive:f.sourceInactive,commitTokenIssued:false,batchCompleted:false});
 },o);
}
async function transfer(c,actor,p,hook){
 const k=sha(p.clientRequestKey);
 // Previously committed item is an immutable past event, not a current
 // ownership precondition. Verify current reader scope plus the entire chain.
 const existing=(await c.query('SELECT * FROM public.demand_responsible_handover_receipts WHERE item_id=$1 FOR SHARE',[p.itemId])).rows[0];
 if(existing){
  if(!await receiptReadScope(c,actor.employee_id,p.teamId,existing.customer_id))return out('I02_DEMAND_PERMISSION_SCOPE_DENY');
  if(str(existing.actor_employee_id)!==str(actor.employee_id)||str(existing.batch_id)!==str(p.batchId)||str(existing.from_employee_id)!==str(p.fromEmployeeId)||str(existing.to_employee_id)!==str(p.recipientEmployeeId)||str(existing.scope_team_id)!==str(p.teamId)||existing.request_key_sha256!==k)return out('I05_COLLISION_DENY');
  if(!await proven(c,existing))return out('I05_RECEIPT_PROOF_DENY');
  return out('I05_IDEMPOTENT_RECEIPT',{receipt:display(existing),idempotent:true});
 }
 const f=await facts(c,actor,p,true);if(f.error)return out(f.error);
 // Domain H legacy receipt may already own this key: never reuse its intent in Domain I.
 if((await c.query('SELECT 1 FROM public.customer_owner_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[k])).rowCount)return out('I05_CROSS_DOMAIN_KEY_DENY');
 const j=(await c.query("SELECT to_regclass('public.consultation_assignee_handover_receipts')::text AS tbl")).rows[0]?.tbl;
 if(j==='consultation_assignee_handover_receipts'&&(await c.query('SELECT 1 FROM public.consultation_assignee_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[k])).rowCount)return out('I05_CROSS_DOMAIN_KEY_DENY');
 const kTable=(await c.query("SELECT to_regclass('public.waitlist_responsible_handover_receipts')::text AS tbl")).rows[0]?.tbl;
 if(kTable==='waitlist_responsible_handover_receipts'&&(await c.query('SELECT 1 FROM public.waitlist_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[k])).rowCount)return out('I05_CROSS_DOMAIN_KEY_DENY');
 const cross=(await c.query('SELECT item_id FROM public.demand_responsible_handover_receipts WHERE request_key_sha256=$1 FOR SHARE',[k])).rows[0];
 if(cross&&str(cross.item_id)!==str(p.itemId))return out('I05_COLLISION_DENY');
 if(str(f.demand.responsible_employee_id)!==str(p.fromEmployeeId))return out('I04_DEMAND_CAS_CONFLICT');
 if(hook)await hook('before_update',c);
 const q=await c.query("UPDATE public.demands SET responsible_employee_id=$1 WHERE demand_id=$2 AND responsible_employee_id=$3 AND demand_state IN ('active','paused') RETURNING demand_id",[p.recipientEmployeeId,f.demandId,p.fromEmployeeId]);
 if(q.rowCount!==1)return out('I04_DEMAND_CAS_CONFLICT');
 if(hook)await hook('after_update',c);
 const audit=(await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,'Demand',$3,'demand.responsible.handover',$4::jsonb,$5::jsonb,transaction_timestamp()) RETURNING audit_id",[str(actor.employee_id),JSON.stringify({scope:'SG06_CI_ONLY_DEMAND',batchId:p.batchId,itemId:p.itemId,teamId:p.teamId,requestKeySha256:k}),str(f.demandId),JSON.stringify({responsible:p.fromEmployeeId}),JSON.stringify({responsible:p.recipientEmployeeId})])).rows[0].audit_id;
 if(hook)await hook('after_audit',c);
 const receipt=(await c.query("INSERT INTO public.demand_responsible_handover_receipts(item_id,batch_id,demand_id,customer_id,from_employee_id,to_employee_id,actor_employee_id,scope_team_id,audit_id,request_key_sha256) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",[p.itemId,p.batchId,f.demandId,f.customerId,p.fromEmployeeId,p.recipientEmployeeId,actor.employee_id,p.teamId,audit,k])).rows[0];
 if(hook)await hook('after_receipt',c);
 if(hook)await hook('before_commit',c);
 return out('I04_DEMAND_DOMAIN_TRANSFERRED',{receipt:display(receipt),priorityLifecycleNotChanged:true,otherDomainsPending:true,idempotent:false});
}
export const commitDemandResponsibleHandover=(a,t,p,o)=>!request(p)?Promise.resolve(out('I04_BAD_REQUEST')):authTx(a,t,(c,actor,h)=>transfer(c,actor,p,h),{...o,crossDomainRequestKeyCommit:true});
export const retryDemandResponsibleHandover=(a,t,p,o)=>!request(p)?Promise.resolve(out('I05_BAD_RETRY')):authTx(a,t,(c,actor,h)=>transfer(c,actor,p,h),{...o,crossDomainRequestKeyCommit:true});
export async function readDemandResponsibleHandoverReceipt(auth,token,p,o){
 if(!exact(p,'batchId,itemId,teamId')||![p.batchId,p.itemId,p.teamId].every(valid))return out('I05_BAD_READ');
 return authTx(auth,token,async(c,actor)=>{
  const r=(await c.query('SELECT * FROM public.demand_responsible_handover_receipts WHERE item_id=$1 AND batch_id=$2 FOR SHARE',[p.itemId,p.batchId])).rows[0];
  if(!r||str(r.scope_team_id)!==str(p.teamId))return out('I05_RECEIPT_ABSENT');
  if(!await receiptReadScope(c,actor.employee_id,p.teamId,r.customer_id))return out('I02_DEMAND_PERMISSION_SCOPE_DENY');
  if(!await proven(c,r))return out('I05_RECEIPT_PROOF_DENY');
  return out('I05_RECEIPT_READ_ONLY',{receipt:display(r),batchCompleted:false});
 },o);
}
export async function readPriorityDerivedResponsibility(auth,token,p,o){
 if(!exact(p,'priorityId,teamId')||![p.priorityId,p.teamId].every(valid))return out('I06_BAD_REQUEST');
 return authTx(auth,token,async(c,actor)=>{
  const r=(await c.query("SELECT pl.*,d.customer_id dc,d.responsible_employee_id dr,d.demand_state ds,m.demand_id md,m.vehicle_id mv,m.listing_cycle_id ml,m.match_tier mt,m.current_state ms,m.invalidated_at mi,cu.account_status ca,em.employment_status es FROM public.priority_leases pl LEFT JOIN public.demands d ON d.demand_id=pl.trigger_demand_id LEFT JOIN public.demand_match_results m ON m.result_id=pl.source_match_result_id LEFT JOIN public.customers cu ON cu.customer_id=pl.customer_id LEFT JOIN public.employees em ON em.employee_id=d.responsible_employee_id WHERE pl.priority_id=$1 FOR SHARE OF pl",[p.priorityId])).rows[0];
  if(!r||!r.trigger_demand_id||!r.dc)return out('I06_PRIORITY_RELATION_REVALIDATE');
  if(!await scope(c,actor.employee_id,r.dr,r.dr,p.teamId,r.customer_id,false))return out('I02_DEMAND_PERMISSION_SCOPE_DENY');
  if(r.status!=='active'||r.ended_at||r.expires_at<=new Date()||r.ds!=='active'||r.ca!=='active'||r.es!=='active'||str(r.dc)!==str(r.customer_id)||str(r.md)!==str(r.trigger_demand_id)||str(r.mv)!==str(r.vehicle_id)||str(r.ml)!==str(r.listing_cycle_id)||!['high','acceptable'].includes(r.mt)||r.ms!=='current'||r.mi)return out('I06_PRIORITY_RELATION_REVALIDATE',{priorityId:p.priorityId,ttlUnmodified:true});
  return out('I06_PRIORITY_RESPONSIBLE_DERIVED_READ_ONLY',{priorityId:p.priorityId,triggerDemandId:Number(r.trigger_demand_id),responsibleEmployeeId:Number(r.dr),expiresAt:r.expires_at.toISOString(),ttlUnmodified:true,priorityUpdated:false,otherDomainsCompleted:false});
 },o);
}
