// F03-2-2N: strictly read-only SG06 synthetic PG16 evidence reconciliation.
// Outputs do not authorize batch close, employee disable or production.
import {verify} from '../runtime-transaction-responsible-handover/migration.mjs';
const str=v=>v==null?null:String(v),valid=n=>Number.isSafeInteger(n)&&n>0;
const deny=(code,extra={})=>Object.freeze({code,...extra,writeAuthorized:false,batchCloseAuthorized:false,employeeDisableAuthorized:false,globalReady:false});
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
async function priority(c,obj,item){
 const r=(await c.query("SELECT d.customer_id dc,d.responsible_employee_id dr,d.demand_state ds,e.employment_status es,m.demand_id md,m.vehicle_id mv,m.listing_cycle_id ml,m.match_tier tier,m.current_state ms,m.invalidated_at mi FROM public.demands d JOIN public.demand_match_results m ON m.result_id=$2 JOIN public.employees e ON e.employee_id=d.responsible_employee_id WHERE d.demand_id=$1",[obj.trigger_demand_id,obj.source_match_result_id])).rows[0];
 if(!r||obj.status!=='active'||obj.ended_at!==null||obj.expires_at<=new Date()||r.ds!=='active'||r.es!=='active'||str(r.dc)!==str(obj.customer_id)||str(r.md)!==str(obj.trigger_demand_id)||str(r.mv)!==str(obj.vehicle_id)||str(r.ml)!==str(obj.listing_cycle_id)||!['high','acceptable'].includes(r.tier)||r.ms!=='current'||r.mi!==null||str(r.dr)!==str(item.intended_to_employee_id))return {status:'DERIVATION_UNPROVEN'};
 const last=(await c.query('SELECT * FROM public.demand_responsible_handover_receipts WHERE demand_id=$1 ORDER BY committed_at DESC,receipt_id DESC LIMIT 1',[obj.trigger_demand_id])).rows[0];
 if(!last||str(last.to_employee_id)!==str(r.dr)||str(last.scope_team_id)!==str(item.scope_team_id??last.scope_team_id))return {status:'DERIVATION_UNPROVEN'};
 const d=(await c.query('SELECT * FROM public.demands WHERE demand_id=$1',[obj.trigger_demand_id])).rows[0];
 const i=(await c.query('SELECT * FROM public.handover_items WHERE item_id=$1',[last.item_id])).rows[0];
 if(!d||!i||(await proof(c,'Demand',d,i,last.scope_team_id)).status!=='PROVEN_RECEIPT')return {status:'DERIVATION_UNPROVEN'};
 return {status:'PRIORITY_DERIVED_ONLY',triggerDemandId:Number(obj.trigger_demand_id),ttlUnmodified:true};
}
async function examine(c,actor,team,item){
 const kind=item.object_kind,d=domain[kind];
 if(!(d||kind==='Priority')||!/^[1-9][0-9]{0,17}$/.test(item.object_id))return {itemId:Number(item.item_id),kind,status:'BLOCKED'};
 const table=kind==='Priority'?'priority_leases':d[2],pk=kind==='Priority'?'priority_id':d[1];
 const obj=(await c.query('SELECT * FROM public.'+table+' WHERE '+pk+'=$1',[item.object_id])).rows[0];
 if(!obj)return {itemId:Number(item.item_id),kind,status:'STALE_OBJECT'};
 if(!await allowed(c,actor,team,obj.customer_id,kind==='Priority'?'demand.responsible.transfer':d[4],item.from_employee_id,item.intended_to_employee_id))return {itemId:Number(item.item_id),kind,status:'OUT_OF_SCOPE'};
 if(item.status==='blocked')return {itemId:Number(item.item_id),kind,status:'BLOCKED'};
 let result=kind==='Priority'?await priority(c,obj,item):await proof(c,kind,obj,item,team);
 if(kind==='Transaction'&&result.status==='PROVEN_RECEIPT'){
  const l=(await c.query('SELECT * FROM public.locks WHERE lock_id=$1',[obj.source_lock_id])).rows[0];
  if(!l||l.lock_status!=='released'||l.end_reason!=='converted_to_transaction'||str(l.customer_id)!==str(obj.customer_id)||str(l.vehicle_id)!==str(obj.vehicle_id)||str(l.listing_cycle_id)!==str(obj.listing_cycle_id))result={status:'UNPROVEN_CHAIN'};
 }
 if(result.status==='NEEDS_DOMAIN_HANDOVER'){
  const terminal=(kind==='Consultation'&&!['pending','processing'].includes(obj.status))||(kind==='Waitlist'&&obj.ended_at!==null)||(kind==='Lock'&&(obj.lock_status!=='active'||obj.expires_at<=new Date()))||(kind==='Transaction'&&obj.status!=='in_progress')||(kind==='Demand'&&!['active','paused'].includes(obj.demand_state));
  if(terminal)result={status:'TERMINAL_HISTORICAL_ONLY'};
 }
 return {itemId:Number(item.item_id),kind,...result};
}
export async function reconcileHandoverBatchReadOnly(auth,token,p,opts={}){
 if(!p||Object.keys(p).sort().join(',')!=='batchId,teamId'||!valid(p.batchId)||!valid(p.teamId)||Object.keys(opts).some(k=>k!=='testCheckpoint')||opts.testCheckpoint!==undefined&&!(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof opts.testCheckpoint==='function'))return deny('N01_INPUT_DENY');
 const v=await auth.pool.connect();try{await verify(v)}catch{return deny('N01_SCHEMA_SEAL_DENY')}finally{v.release()}
 try{return await auth.withSession(token,async(c,a,s)=>{
  if(s.restricted||a.principal_kind!=='employee'||a.system_admin_id!==null||a.employee_id===null||!['manager','store_head'].includes(a.role_code)||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false)return deny('N02_SESSION_DENY');
  await c.query("SET LOCAL lock_timeout='1200ms'");await c.query("SET LOCAL statement_timeout='16000ms'");
  await c.query('SELECT pg_advisory_xact_lock(20261010,306)');await c.query('SELECT pg_advisory_xact_lock(20261010,309)');
  const b=(await c.query('SELECT * FROM public.handover_batches WHERE batch_id=$1',[p.batchId])).rows[0];
  if(!b||b.initiated_by_kind!=='employee'||!['collecting','pending_domain_handover','blocked'].includes(b.status))return deny('N02_BATCH_DENY');
  const items=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 ORDER BY item_id LIMIT 101',[p.batchId])).rows;
  if(!items.length||items.length>100)return deny('N03_EMPTY_OR_TRUNCATED');
  const inspect=async()=>{const out=[];for(const item of items)out.push(await examine(c,a.employee_id,p.teamId,item));return out};
  const first=await inspect();if(opts.testCheckpoint)await opts.testCheckpoint('before_last_guard',c);
  const last=await inspect();const fresh=(await c.query('SELECT * FROM public.handover_items WHERE batch_id=$1 ORDER BY item_id',[p.batchId])).rows;
  if(JSON.stringify(first)!==JSON.stringify(last)||JSON.stringify(items)!==JSON.stringify(fresh))throw Object.assign(new Error('N_READ_ONLY_CURRENT_FACT_DRIFT_ROLLBACK'),{code:'N08_ROLLBACK'});
  const refund=(await c.query("SELECT count(*)::int n FROM public.refund_cases WHERE status='pending' AND customer_id IN (SELECT customer_id FROM public.customers WHERE current_owner_employee_id=$1)",[b.source_employee_id])).rows[0].n;
  const complete=refund===0&&first.every(x=>['PROVEN_RECEIPT','PRIORITY_DERIVED_ONLY'].includes(x.status));
  return deny('N03_RECONCILED_READ_ONLY',{batchId:p.batchId,items:first,observedItemCount:first.length,pendingRefundBlocker:refund>0,observedReadOnlyState:complete?'ALL_OBSERVED_ITEMS_RECONCILED_READ_ONLY':'DEFER_DENY',batchStatusUnchanged:true});
 },{normalOnly:true})??deny('N02_SESSION_DENY')}catch(e){if(e.code==='N08_ROLLBACK'||['55P03','40P01','57014','40001'].includes(e.code))return deny('N08_DRIFT_DEFER_DENY');throw e}
}
export const prepareHandoverReconciliationReadOnly=reconcileHandoverBatchReadOnly;
export const readHandoverReconciliationReadOnly=reconcileHandoverBatchReadOnly;
