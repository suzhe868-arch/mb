// F03 package G CI-only actual SG06 item and batch status governance.
// No production routes; G never modifies an H-M business owner, receipt or money.
import {createHash} from 'node:crypto';
import {verify} from './migration.mjs';
const str=v=>v==null?null:String(v),valid=n=>Number.isSafeInteger(n)&&n>0;
const deny=(code,extra={})=>Object.freeze({code,ok:false,...extra,productionAuthorized:false});
const approved=(code,extra={})=>Object.freeze({code,ok:true,...extra,productionAuthorized:false});
const KEY=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{12,90}$/.test(x);
const digest=x=>createHash('sha256').update(x).digest('hex');
function ci(){if(process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')throw Error('G_CI_ONLY');}
const domain={
Customer:['customer_owner_handover_receipts','customer_id','customers','current_owner_employee_id','customer.owner.transfer','customer.owner.handover','CUSTOMER_OWNER','owner'],
Demand:['demand_responsible_handover_receipts','demand_id','demands','responsible_employee_id','demand.responsible.transfer','demand.responsible.handover','DEMAND','responsible'],
Consultation:['consultation_assignee_handover_receipts','consultation_id','consultations','assignee_employee_id','consultation.assignee.transfer','consultation.assignee.handover','CONSULTATION','assignee'],
Waitlist:['waitlist_responsible_handover_receipts','waitlist_id','waitlists','responsible_employee_id','waitlist.responsible.transfer','waitlist.responsible.handover','WAITLIST','responsible'],
Lock:['lock_responsible_handover_receipts','lock_id','locks','responsible_employee_id','lock.responsible.transfer','lock.responsible.handover','LOCK','responsible'],
Transaction:['transaction_responsible_handover_receipts','transaction_id','transactions','responsible_employee_id','transaction.responsible.transfer','transaction.responsible.handover','TRANSACTION','responsible']
};
const tables=Object.values(domain).map(v=>v[0]);
async function allowed(c,actor,team,customer,permission,source,dest){
 const sql="SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id JOIN public.permissions p ON p.permission_code=$4 LEFT JOIN public.role_permission_defaults rd ON rd.role_id=e.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=e.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes s ON s.employee_id=e.employee_id JOIN public.employee_capability_scope_bindings cb ON cb.scope_id=s.scope_id AND cb.employee_id=e.employee_id AND cb.permission_id=p.permission_id JOIN public.teams t ON t.team_id=$2 JOIN public.stores st ON st.store_id=t.store_id JOIN public.customers cu ON cu.customer_id=$3 JOIN public.employee_team_memberships sm ON sm.team_id=t.team_id AND sm.employee_id=$5 JOIN public.employee_team_memberships dm ON dm.team_id=t.team_id AND dm.employee_id=$6 LEFT JOIN public.employee_team_memberships mm ON mm.team_id=t.team_id AND mm.employee_id=e.employee_id WHERE e.employee_id=$1 AND e.employment_status='active' AND r.role_code IN('manager','store_head') AND cu.account_status='active' AND st.status='active' AND t.team_status='active' AND (r.role_code='manager' OR e.store_id=t.store_id) AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (s.ended_at IS NULL OR s.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND sm.valid_from<=statement_timestamp() AND (sm.ended_at IS NULL OR sm.ended_at>statement_timestamp()) AND dm.valid_from<=statement_timestamp() AND (dm.ended_at IS NULL OR dm.ended_at>statement_timestamp()) AND ((r.role_code='manager' AND s.scope_kind='team' AND s.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())) OR (r.role_code='store_head' AND ((s.scope_kind='store' AND s.scope_reference_id=t.store_id) OR (s.scope_kind='team' AND s.scope_reference_id=t.team_id AND mm.employee_id IS NOT NULL AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp())))))) ok";
 return (await c.query(sql,[actor,team,customer,permission,source,dest])).rows[0].ok===true;
}
async function proof(c,kind,obj,item,team){
 const d=domain[kind],rr=(await c.query('SELECT * FROM public.'+d[0]+' WHERE '+d[1]+'=$1 ORDER BY committed_at,receipt_id',[item.object_id])).rows;
 if(rr.length>50)return {status:'UNPROVEN_CHAIN'};
 if(!rr.length)return {status:'NEEDS_DOMAIN_HANDOVER'};
 let last=null,selected=null;
 for(const r of rr){
  const q=await c.query("SELECT b.source_employee_id bs,b.initiated_by_id ba,i.batch_id ib,i.object_kind ik,i.object_id io,i.from_employee_id fr,i.intended_to_employee_id dest,a.actor_kind ak,a.actor_id aid,a.object_kind aok,a.object_id aoid,a.action act,a.role_context rc,a.before_json bj,a.after_json aj,a.occurred_at tm FROM public.handover_batches b JOIN public.handover_items i ON i.item_id=$2 JOIN public.audit_events a ON a.audit_id=$3 WHERE b.batch_id=$1",[r.batch_id,r.item_id,r.audit_id]);
  const v=q.rows[0];
  if(q.rows.length!==1||!v||str(v.bs)!==str(r.from_employee_id)||str(v.ba)!==str(r.actor_employee_id)||str(v.ib)!==str(r.batch_id)||v.ik!==kind||v.io!==str(r[d[1]])||str(v.fr)!==str(r.from_employee_id)||str(v.dest)!==str(r.to_employee_id)||str(r.customer_id)!==str(obj.customer_id)||v.ak!=='employee'||v.aid!==str(r.actor_employee_id)||v.aok!==kind||v.aoid!==str(r[d[1]])||v.act!==d[5]||v.rc?.scope!=='SG06_CI_ONLY_'+d[6]||str(v.rc?.batchId)!==str(r.batch_id)||str(v.rc?.itemId)!==str(r.item_id)||str(v.rc?.teamId)!==str(r.scope_team_id)||v.rc?.requestKeySha256!==r.request_key_sha256||str(v.bj?.[d[7]])!==str(r.from_employee_id)||str(v.aj?.[d[7]])!==str(r.to_employee_id)||v.tm?.getTime()!==r.committed_at.getTime())return {status:'UNPROVEN_CHAIN'};
  if(last&&(str(last.to_employee_id)!==str(r.from_employee_id)||last.committed_at>r.committed_at||BigInt(last.audit_id)>=BigInt(r.audit_id)))return {status:'UNPROVEN_CHAIN'};
  let n=0;for(const table of tables)n+=Number((await c.query('SELECT count(*)::int n FROM public.'+table+' WHERE request_key_sha256=$1',[r.request_key_sha256])).rows[0].n);
  if(n!==1)return {status:'UNPROVEN_CHAIN'};
  if(kind==='Customer'){
   const h=(await c.query('SELECT * FROM public.customer_owner_history WHERE owner_history_id=$1',[r.owner_history_id])).rows[0];
   if(!h||str(h.customer_id)!==str(r.customer_id)||str(h.from_employee_id)!==str(r.from_employee_id)||str(h.to_employee_id)!==str(r.to_employee_id)||h.changed_at?.getTime()!==r.committed_at.getTime())return {status:'UNPROVEN_CHAIN'};
  }
  if(str(r.item_id)===str(item.item_id)&&str(r.batch_id)===str(item.batch_id))selected=r;
  last=r;
 }
 if(!selected)return {status:'NEEDS_DOMAIN_HANDOVER'};
 if(str(selected.from_employee_id)!==str(item.from_employee_id)||str(selected.to_employee_id)!==str(item.intended_to_employee_id)||str(selected.scope_team_id)!==str(team)||str(obj[d[3]])!==str(last.to_employee_id))return {status:'UNPROVEN_CHAIN'};
 return {status:'PROVEN_RECEIPT',receiptId:Number(selected.receipt_id),auditId:Number(selected.audit_id)};
}
async function priority(c,actor,team,obj,item){
 // Priority has no independent handover receipt. Its item may be derived only
 // from the genuine Demand transfer in THIS batch, with the SAME source and
 // recipient, and with current authority over both scopes if they differ.
 if(!['pending','retry_required'].includes(item.status))return {status:'DERIVATION_UNPROVEN'};
 const batch=(await c.query('SELECT source_employee_id,initiated_by_kind FROM public.handover_batches WHERE batch_id=$1',[item.batch_id])).rows[0];
 if(!batch||batch.initiated_by_kind!=='employee'||str(batch.source_employee_id)!==str(item.from_employee_id))return {status:'DERIVATION_UNPROVEN'};
 const r=(await c.query("SELECT d.customer_id dc,d.responsible_employee_id dr,d.demand_state ds,e.employment_status es,m.demand_id md,m.vehicle_id mv,m.listing_cycle_id ml,m.match_tier tier,m.current_state ms,m.invalidated_at mi FROM public.demands d JOIN public.demand_match_results m ON m.result_id=$2 JOIN public.employees e ON e.employee_id=d.responsible_employee_id WHERE d.demand_id=$1",[obj.trigger_demand_id,obj.source_match_result_id])).rows[0];
 if(!r||obj.status!=='active'||obj.ended_at!==null||obj.expires_at<=new Date()||r.ds!=='active'||r.es!=='active'||str(r.dc)!==str(obj.customer_id)||str(r.md)!==str(obj.trigger_demand_id)||str(r.mv)!==str(obj.vehicle_id)||str(r.ml)!==str(obj.listing_cycle_id)||!['high','acceptable'].includes(r.tier)||r.ms!=='current'||r.mi!==null||str(r.dr)!==str(item.intended_to_employee_id))return {status:'DERIVATION_UNPROVEN'};
 // A receipt from a PREVIOUS batch is never evidence that THIS Priority item
 // was carried. The domain item and its immutable receipt/audit must share
 // exactly this batch, Demand, customer, source and recipient.
 const candidates=(await c.query("SELECT r.*,i.object_kind ik,i.object_id io,i.from_employee_id fr,i.intended_to_employee_id dest,i.batch_id ib FROM public.demand_responsible_handover_receipts r JOIN public.handover_items i ON i.item_id=r.item_id WHERE r.demand_id=$1 AND r.batch_id=$2",[obj.trigger_demand_id,item.batch_id])).rows;
 if(candidates.length!==1)return {status:'DERIVATION_UNPROVEN'};
 const selected=candidates[0];
 if(selected.ik!=='Demand'||str(selected.io)!==str(obj.trigger_demand_id)||str(selected.ib)!==str(item.batch_id)||str(selected.from_employee_id)!==str(item.from_employee_id)||str(selected.fr)!==str(item.from_employee_id)||str(selected.to_employee_id)!==str(item.intended_to_employee_id)||str(selected.dest)!==str(item.intended_to_employee_id)||str(selected.customer_id)!==str(obj.customer_id))return {status:'DERIVATION_UNPROVEN'};
 const last=(await c.query('SELECT receipt_id,to_employee_id FROM public.demand_responsible_handover_receipts WHERE demand_id=$1 ORDER BY committed_at DESC,receipt_id DESC LIMIT 1',[obj.trigger_demand_id])).rows[0];
 if(!last||str(last.receipt_id)!==str(selected.receipt_id)||str(last.to_employee_id)!==str(r.dr))return {status:'DERIVATION_UNPROVEN'};
 // A team is NOT a column of handover_items. Never fall back to the receipt's
 // own team as a substitute for the caller's currently authorized team.
 // An explicitly scoped cross-team manager must hold BOTH current rights;
 // lack of either scope fails closed, even for a formerly authentic receipt.
 if(!await allowed(c,actor,selected.scope_team_id,obj.customer_id,'demand.responsible.transfer',item.from_employee_id,item.intended_to_employee_id))return {status:'DERIVATION_UNPROVEN'};
 const d=(await c.query('SELECT * FROM public.demands WHERE demand_id=$1',[obj.trigger_demand_id])).rows[0];
 const demandItem=(await c.query('SELECT * FROM public.handover_items WHERE item_id=$1',[selected.item_id])).rows[0];
 if(!d||!demandItem||(await proof(c,'Demand',d,demandItem,selected.scope_team_id)).status!=='PROVEN_RECEIPT')return {status:'DERIVATION_UNPROVEN'};
 return {status:'PRIORITY_DERIVED_ONLY',triggerDemandId:Number(obj.trigger_demand_id),ttlUnmodified:true};
}

const kinds={Customer:['customers','customer_id','account_status',s=>s.account_status==='active'],Demand:['demands','demand_id','demand_state',s=>s.demand_state==='active'||s.demand_state==='paused'],Consultation:['consultations','consultation_id','status',s=>['pending','processing'].includes(s.status)],Waitlist:['waitlists','waitlist_id','ended_at',s=>s.ended_at===null],Lock:['locks','lock_id','lock_status',s=>s.lock_status==='active'&&s.expires_at>new Date()],Transaction:['transactions','transaction_id','status',s=>s.status==='in_progress'],Priority:['priority_leases','priority_id','status',s=>s.status==='active'&&s.ended_at===null&&s.expires_at>new Date()]};
async function scopeFor(c,a,team,source,recipient){
 const permission='employee.manage';
 // The source may have become inactive in sudden-inactive G3; that is only
 // admissible to emergency protective actions, never planned completion.
 return allowed(c,a.employee_id,team,source.customer_id,permission,source.source_employee_id??source.employee_id,recipient);
}
async function actorSession(auth,token,fn){
 ci();
 const c=await auth.pool.connect();try{await verify(c)}finally{c.release()}
 try{
  return await auth.withSession(token,async(c,a,s)=>{
   if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||a.employee_id===null||!['manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false)return deny('G_ROLE_SESSION_DENY');
   await c.query("SET LOCAL lock_timeout='1400ms'");
   await c.query("SET LOCAL statement_timeout='18000ms'");
   await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
   await c.query('SELECT pg_advisory_xact_lock(20261010,309)');
   return fn(c,a);
  },{normalOnly:true})??deny('G_SESSION_DENY');
 }catch(e){if(['55P03','40P01','40001','57014'].includes(e.code)||e.message==='G_COMMIT_ATOMIC_ROLLBACK')return deny('G_CONCURRENT_ROLLBACK');throw e}
}
async function itemFact(c,item,team,actor){
 if(!kinds[item.object_kind]||!/^[1-9][0-9]{0,17}$/.test(item.object_id))return deny('G_KIND_DENY');
 const [table,pk,,usable]=kinds[item.object_kind];
 const obj=(await c.query('SELECT * FROM public.'+table+' WHERE '+pk+'=$1',[item.object_id])).rows[0];
 if(!obj||!usable(obj))return deny('G_OBJECT_INACTIVE_OR_TERMINAL');
 const permission=item.object_kind==='Priority'?'demand.responsible.transfer':domain[item.object_kind][4];
 if(!await allowed(c,actor.employee_id,team,obj.customer_id,permission,item.from_employee_id,item.intended_to_employee_id))return deny('G_ITEM_SCOPE_DENY');
 const details=item.object_kind==='Priority'?await priority(c,actor.employee_id,team,obj,item):await proof(c,item.object_kind,obj,item,team);
 if(!['PROVEN_RECEIPT','PRIORITY_DERIVED_ONLY'].includes(details.status))return deny('G_EVIDENCE_UNPROVEN',{evidenceStatus:details.status});
 if(item.object_kind==='Transaction'){
  const l=(await c.query('SELECT lock_status,end_reason,customer_id,vehicle_id,listing_cycle_id FROM public.locks WHERE lock_id=$1',[obj.source_lock_id])).rows[0];
  if(!l||l.lock_status!=='released'||l.end_reason!=='converted_to_transaction'||str(l.customer_id)!==str(obj.customer_id)||str(l.vehicle_id)!==str(obj.vehicle_id)||str(l.listing_cycle_id)!==str(obj.listing_cycle_id))return deny('G_TRANSACTION_SOURCE_DENY');
 }
 if(item.object_kind==='Lock'){
  if(obj.expires_at<=(await c.query('SELECT clock_timestamp() now')).rows[0].now)return deny('G_LOCK_EXPIRED');
 }
 const refunds=(await c.query("SELECT count(*)::int n FROM public.refund_cases WHERE customer_id=$1 AND status='pending'",[obj.customer_id])).rows[0].n;
 if(refunds>0)return deny('G_PENDING_REFUND');
 return approved('G_ITEM_CERTIFIED',{itemId:Number(item.item_id),evidenceType:details.status,receiptId:details.receiptId??null});
}
async function batchFacts(c,a,batchId,teamId,forWrite){
 const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1 '+(forWrite?'FOR UPDATE':''),[batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||!['collecting','pending_domain_handover','blocked','completed'].includes(b.status))return null;
 const source=(await c.query('SELECT * FROM public.employees WHERE employee_id=$1 FOR SHARE',[b.source_employee_id])).rows[0];
 if(!source)return null;
 const first=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 ORDER BY item_id '+(forWrite?'FOR UPDATE':''),[batchId])).rows;
 if(!first.length||first.length>200)return null;
 for(const i of first)if(str(i.from_employee_id)!==str(b.source_employee_id))return null;
 // Complete authorization is object-specific. Generic employee.manage alone
 // is never taken as authority for all six receipt domains.
 return {b,items:first,source};
}
async function audit(c,a,objectKind,objectId,action,before,after,requestKey,team){
 const key=digest(requestKey);
 await c.query("INSERT INTO public.audit_events(actor_kind,actor_id,role_context,object_kind,object_id,action,before_json,after_json,occurred_at) VALUES('employee',$1,$2::jsonb,$3,$4,$5,$6::jsonb,$7::jsonb,transaction_timestamp())",[str(a.employee_id),JSON.stringify({scope:'F03_G_CI_ONLY',teamId:team,keySha256:key}),objectKind,str(objectId),action,JSON.stringify(before),JSON.stringify(after)]);
}
export async function certifyHandoverItem(auth,token,p){
 if(!p||Object.keys(p).sort().join(',')!=='batchId,itemId,teamId'||![p.batchId,p.itemId,p.teamId].every(valid))return deny('G_INPUT_DENY');
 return actorSession(auth,token,async(c,a)=>{
  const x=await batchFacts(c,a,p.batchId,p.teamId,false);
  if(!x)return deny('G_BATCH_SCOPE_DENY');
  const item=x.items.find(i=>Number(i.item_id)===p.itemId);
  if(!item||item.status==='blocked')return deny('G_ITEM_BLOCKED');
  return itemFact(c,item,p.teamId,a);
 });
}
export const prepareHandoverItem=certifyHandoverItem;
export async function commitHandoverItem(auth,token,p,opts={}){
 if(!p||Object.keys(p).sort().join(',')!=='batchId,itemId,requestKey,teamId'||![p.batchId,p.itemId,p.teamId].every(valid)||!KEY(p.requestKey)||Object.keys(opts).some(x=>x!=='testCheckpoint')||opts.testCheckpoint!==undefined&&!(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof opts.testCheckpoint==='function'))return deny('G_INPUT_DENY');
 return actorSession(auth,token,async(c,a)=>{
  const x=await batchFacts(c,a,p.batchId,p.teamId,true);
  if(!x||!['pending_domain_handover','blocked','collecting'].includes(x.b.status))return deny('G_BATCH_NOT_WRITABLE');
  const item=x.items.find(i=>Number(i.item_id)===p.itemId);
  if(!item)return deny('G_ITEM_NOT_FOUND');
  const audits=(await c.query("SELECT actor_id,role_context,before_json,after_json FROM public.audit_events WHERE object_kind='handover_item' AND object_id=$1 AND action='sg06.item.complete' ORDER BY audit_id",[str(p.itemId)])).rows;
  if(item.status==='completed')return audits.length===1&&audits[0].role_context?.keySha256===digest(p.requestKey)?approved('G_ITEM_IDEMPOTENT',{itemId:p.itemId}):deny('G_ITEM_ALREADY_COMPLETED');
  if(!['pending','retry_required'].includes(item.status)||audits.length!==0)return deny('G_ITEM_STATE_DENY');
  const evidence=await itemFact(c,item,p.teamId,a);
  if(!evidence.ok)return evidence;
  if(opts.testCheckpoint)await opts.testCheckpoint('before_cas',c);
  const updated=await c.query("UPDATE public.handover_items SET status='completed',attempt_count=attempt_count+1,last_error_code=NULL,updated_at=transaction_timestamp() WHERE item_id=$1 AND batch_id=$2 AND status=$3",[p.itemId,p.batchId,item.status]);
  if(updated.rowCount!==1)throw Error('G_COMMIT_ATOMIC_ROLLBACK');
  if(opts.testCheckpoint)await opts.testCheckpoint('after_cas',c);
  await audit(c,a,'handover_item',p.itemId,'sg06.item.complete',{status:item.status,objectKind:item.object_kind,objectId:item.object_id},{status:'completed',evidenceType:evidence.evidenceType,receiptId:evidence.receiptId},p.requestKey,p.teamId);
  if(opts.testCheckpoint)await opts.testCheckpoint('after_audit',c);
  // All evidence is re-proven immediately before commit, not merely prepared.
  const last=await itemFact(c,item,p.teamId,a);
  if(!last.ok)throw Error('G_COMMIT_ATOMIC_ROLLBACK');
  if(opts.testCheckpoint)await opts.testCheckpoint('before_commit',c);
  return approved('G_ITEM_COMPLETED',{itemId:p.itemId,receiptId:evidence.receiptId??null,batchCompleted:false});
 });
}
export const retryHandoverItem=commitHandoverItem;
const obligations=[
 ['Customer','customers','current_owner_employee_id',"account_status='active'"],
 ['Demand','demands','responsible_employee_id',"demand_state IN ('active','paused')"],
 ['Consultation','consultations','assignee_employee_id',"status IN ('pending','processing')"],
 ['Waitlist','waitlists','responsible_employee_id','ended_at IS NULL'],
 ['Lock','locks','responsible_employee_id',"lock_status='active' AND expires_at>clock_timestamp()"],
 ['Transaction','transactions','responsible_employee_id',"status='in_progress'"]
];
async function closedBatchSafe(c,a,x,team){
 if(x.items.some(i=>i.status!=='completed'))return deny('G_BATCH_PENDING_ITEMS');
 for(const i of x.items){
  if(!await allowed(c,a.employee_id,team,(await c.query('SELECT customer_id FROM public.'+kinds[i.object_kind][0]+' WHERE '+kinds[i.object_kind][1]+'=$1',[i.object_id])).rows[0]?.customer_id,i.object_kind==='Priority'?'demand.responsible.transfer':domain[i.object_kind][4],i.from_employee_id,i.intended_to_employee_id))return deny('G_BATCH_CURRENT_SCOPE_DENY');
  const ev=await itemFact(c,i,team,a);if(!ev.ok)return ev;
  const audits=(await c.query("SELECT count(*)::int n FROM public.audit_events WHERE object_kind='handover_item' AND object_id=$1 AND action='sg06.item.complete'",[str(i.item_id)])).rows[0].n;
  if(audits!==1)return deny('G_ITEM_AUDIT_MISSING_OR_DUPLICATE');
 }
 for(const [kind,table,field,status] of obligations){
  const n=(await c.query('SELECT count(*)::int n FROM public.'+table+' WHERE '+field+'=$1 AND '+status,[x.b.source_employee_id])).rows[0].n;
  if(n>0)return deny('G_SOURCE_ACTIVE_OBLIGATIONS_'+kind);
 }
 const refund=(await c.query("SELECT count(*)::int n FROM public.refund_cases WHERE status='pending' AND customer_id IN (SELECT customer_id FROM public.customers WHERE current_owner_employee_id=$1)",[x.b.source_employee_id])).rows[0].n;
 if(refund>0)return deny('G_PENDING_FINANCIAL_OBLIGATION');
 for(const t of tables){
  const refs=(await c.query('SELECT item_id FROM public.'+t+' WHERE batch_id=$1',[x.b.batch_id])).rows;
  if(refs.some(y=>!x.items.some(i=>str(i.item_id)===str(y.item_id))))return deny('G_ORPHAN_RECEIPT');
 }
 return approved('G_BATCH_CERTIFIED');
}
export async function commitHandoverBatch(auth,token,p,opts={}){
 if(!p||Object.keys(p).sort().join(',')!=='batchId,requestKey,teamId'||![p.batchId,p.teamId].every(valid)||!KEY(p.requestKey)||Object.keys(opts).some(x=>x!=='testCheckpoint')||opts.testCheckpoint!==undefined&&!(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof opts.testCheckpoint==='function'))return deny('G_INPUT_DENY');
 return actorSession(auth,token,async(c,a)=>{
  const x=await batchFacts(c,a,p.batchId,p.teamId,true);
  if(!x)return deny('G_BATCH_SCOPE_DENY');
  const audits=(await c.query("SELECT role_context FROM public.audit_events WHERE object_kind='handover_batch' AND object_id=$1 AND action='sg06.batch.complete'",[str(p.batchId)])).rows;
  if(x.b.status==='completed')return audits.length===1&&audits[0].role_context?.keySha256===digest(p.requestKey)?approved('G_BATCH_IDEMPOTENT'):deny('G_BATCH_ALREADY_COMPLETED');
  if(x.b.status!=='pending_domain_handover'||audits.length!==0)return deny('G_BATCH_STATE_DENY');
  const fact=await closedBatchSafe(c,a,x,p.teamId);if(!fact.ok)return fact;
  if(opts.testCheckpoint)await opts.testCheckpoint('before_cas',c);
  const v=await c.query("UPDATE public.handover_batches SET status='completed',version=version+1,updated_at=transaction_timestamp() WHERE batch_id=$1 AND status='pending_domain_handover' AND version=$2",[p.batchId,x.b.version]);
  if(v.rowCount!==1)throw Error('G_COMMIT_ATOMIC_ROLLBACK');
  await audit(c,a,'handover_batch',p.batchId,'sg06.batch.complete',{status:x.b.status,version:x.b.version},{status:'completed',version:Number(x.b.version)+1},p.requestKey,p.teamId);
  if(opts.testCheckpoint)await opts.testCheckpoint('after_audit',c);
  const still=await closedBatchSafe(c,a,x,p.teamId);
  if(!still.ok)throw Error('G_COMMIT_ATOMIC_ROLLBACK');
  if(opts.testCheckpoint)await opts.testCheckpoint('before_commit',c);
  return approved('G_BATCH_COMPLETED',{batchId:p.batchId,employeeDisableAuthorized:false});
 });
}
export async function readHandoverClosure(auth,token,p){
 if(!p||Object.keys(p).sort().join(',')!=='batchId,teamId'||![p.batchId,p.teamId].every(valid))return deny('G_INPUT_DENY');
 return actorSession(auth,token,async(c,a)=>{
  const x=await batchFacts(c,a,p.batchId,p.teamId,false);if(!x)return deny('G_BATCH_SCOPE_DENY');
  const mapped=[];
  for(const i of x.items){const ev=await itemFact(c,i,p.teamId,a);mapped.push({itemId:Number(i.item_id),objectKind:i.object_kind,status:i.status,proof:ev.ok?'PROVEN':'UNPROVEN'})}
  return approved('G_BATCH_READ',{batchId:p.batchId,status:x.b.status,items:mapped,canDisable:false,productionAuthorized:false});
 });
}
