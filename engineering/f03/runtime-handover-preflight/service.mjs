// SG06 F03-2-2G: current facts only, strictly no domain mutation or completion token.
import {verify} from '../runtime-handover-ledger/migration.mjs';
const valid=n=>Number.isSafeInteger(n)&&n>0;
const shape=(p,s)=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')===s;
const fail=(code,extra={})=>Object.freeze({code,writeDenied:true,...extra});
const roles=['sales','manager','store_head'];
const chk=f=>f===undefined||(process.env.CI==='true'&&process.env.GITHUB_ACTIONS==='true'&&typeof f==='function');
const str=x=>x===null||x===undefined?null:String(x);
const defs=[
 ['Demand','demands','demand_id','responsible_employee_id','demand_state'],
 ['Priority','priority_leases','priority_id',null,'status'],
 ['Recommendation','recommendations','recommendation_id','recommender_employee_id','status'],
 ['Consultation','consultations','consultation_id','assignee_employee_id','status'],
 ['Waitlist','waitlists','waitlist_id','responsible_employee_id',null],
 ['Lock','locks','lock_id','responsible_employee_id','lock_status'],
 ['Transaction','transactions','transaction_id','responsible_employee_id','status']
];
async function guard(auth){const c=await auth.pool.connect();try{await verify(c)}finally{c.release()}}
async function capable(c,manager,employee,team){
 const q="SELECT EXISTS(SELECT 1 FROM public.employees m JOIN public.roles mr ON mr.role_id=m.main_role_id JOIN public.employees e ON e.employee_id=$2 JOIN public.roles er ON er.role_id=e.main_role_id JOIN public.permissions p ON p.permission_code='employee.manage' LEFT JOIN public.role_permission_defaults rd ON rd.role_id=m.main_role_id AND rd.permission_id=p.permission_id LEFT JOIN public.employee_permission_overrides ov ON ov.employee_id=m.employee_id AND ov.permission_id=p.permission_id JOIN public.employee_data_scopes sc ON sc.employee_id=m.employee_id AND sc.scope_kind='team' AND sc.scope_reference_id=$3 JOIN public.employee_capability_scope_bindings cb ON cb.employee_id=m.employee_id AND cb.scope_id=sc.scope_id AND cb.permission_id=p.permission_id JOIN public.teams t ON t.team_id=sc.scope_reference_id JOIN public.stores st ON st.store_id=t.store_id JOIN public.employee_team_memberships mm ON mm.team_id=t.team_id AND mm.employee_id=m.employee_id JOIN public.employee_team_memberships em ON em.team_id=t.team_id AND em.employee_id=e.employee_id WHERE m.employee_id=$1 AND mr.role_code='manager' AND m.employment_status='active' AND e.employment_status='active' AND er.role_code=ANY($4::text[]) AND t.team_status='active' AND st.status='active' AND (ov.decision='allow' OR (ov.decision IS NULL AND rd.enabled=true)) AND ov.decision IS DISTINCT FROM 'deny' AND (sc.ended_at IS NULL OR sc.ended_at>statement_timestamp()) AND cb.granted_at<=statement_timestamp() AND (cb.ended_at IS NULL OR cb.ended_at>statement_timestamp()) AND mm.valid_from<=statement_timestamp() AND (mm.ended_at IS NULL OR mm.ended_at>statement_timestamp()) AND em.valid_from<=statement_timestamp() AND (em.ended_at IS NULL OR em.ended_at>statement_timestamp())) permitted";
 return (await c.query(q,[manager,employee,team,roles])).rows[0].permitted===true;
}
async function batch(c,a,p){
 const b=(await c.query('SELECT batch_id,source_employee_id,initiated_by_kind,initiated_by_id,status,version FROM public.handover_batches WHERE batch_id=$1 FOR SHARE',[p.batchId])).rows[0];
 if(!b||b.initiated_by_kind!=='employee'||str(b.initiated_by_id)!==str(a.employee_id)||!['collecting','pending_domain_handover','blocked'].includes(b.status))return null;
 const e=(await c.query('SELECT employment_status FROM public.employees WHERE employee_id=$1',[b.source_employee_id])).rows[0];
 if(e?.employment_status!=='active')return null;
 return b;
}
async function context(c,a,s,p){
 if(s.restricted||a.principal_kind!=='employee'||a.employee_id===null||a.system_admin_id!==null||a.credential_state!=='enabled'||a.subject_status!=='active'||a.force_password_change!==false||a.role_code!=='manager')return {error:'G02_MANAGER_SESSION_DENY'};
 await c.query('SELECT pg_advisory_xact_lock(20261010,306)');
 const b=await batch(c,a,p);
 if(!b)return {error:'G02_BATCH_NOT_OWNED_OR_INACTIVE_SOURCE'};
 if(!await capable(c,a.employee_id,b.source_employee_id,p.teamId))return {error:'G02_TEAM_SCOPE_DENY'};
 return {batch:b,source:str(b.source_employee_id),manager:str(a.employee_id)};
}
async function eligibility(c,ctx,p){
 if(ctx.source===str(p.recipientEmployeeId))return {eligible:false,code:'G04_SAME_EMPLOYEE_DENY'};
 const t=(await c.query('SELECT e.employment_status,e.receiving_status,r.role_code,v.eligible,st.status store_status FROM public.employees e JOIN public.roles r ON r.role_id=e.main_role_id LEFT JOIN public.employee_receiving_eligibility v ON v.employee_id=e.employee_id LEFT JOIN public.stores st ON st.store_id=e.store_id WHERE e.employee_id=$1',[p.recipientEmployeeId])).rows[0];
 if(!t||t.employment_status!=='active'||t.receiving_status!=='receiving'||t.eligible!==true||!roles.includes(t.role_code)||t.store_status!=='active')return {eligible:false,code:'G04_RECEIVER_NOT_ELIGIBLE'};
 if(!await capable(c,ctx.manager,p.recipientEmployeeId,p.teamId))return {eligible:false,code:'G04_TARGET_OUTSIDE_TEAM_SCOPE'};
 return {eligible:true,code:'RECIPIENT_FACTS_CURRENT_ONLY',recipientEmployeeId:str(p.recipientEmployeeId),managerEmployeeId:ctx.manager,teamId:str(p.teamId),writeCapability:'WRITE_CAPABILITY_UNPROVEN'};
}
const liveTime=t=>!!t&&new Date(t)>new Date();
function classOf(kind,r){
 if(kind==='Customer')return r.account_status==='active'&&r.owner_assignment_state==='assigned'?'ACTIVE':'REVALIDATE';
 if(kind==='Demand')return r.demand_state==='active'?'ACTIVE':r.demand_state==='paused'?'REVALIDATE':['completed','cancelled'].includes(r.demand_state)?'TERMINAL':'UNKNOWN_DEFER_DENY';
 if(kind==='Consultation')return ['pending','processing'].includes(r.status)?'ACTIVE':['resolved','invalid'].includes(r.status)?'TERMINAL':'UNKNOWN_DEFER_DENY';
 if(kind==='Waitlist')return r.ended_at===null?'ACTIVE':'TERMINAL';
 if(kind==='Priority')return r.ended_at!==null?'TERMINAL':r.status==='active'&&liveTime(r.expires_at)?'ACTIVE':'UNKNOWN_DEFER_DENY';
 if(kind==='Lock')return r.lock_status==='active'&&liveTime(r.expires_at)?'ACTIVE':'UNKNOWN_DEFER_DENY';
 if(kind==='Transaction')return r.status==='in_progress'?'ACTIVE':'UNKNOWN_DEFER_DENY';
 if(kind==='Recommendation')return r.status==='active'?'ACTIVE':'UNKNOWN_DEFER_DENY';
 return 'UNKNOWN_DEFER_DENY';
}
async function impact(c,source){
 const idsQ="SELECT customer_id,account_status,owner_assignment_state,current_owner_employee_id FROM public.customers WHERE current_owner_employee_id=$1 OR customer_id IN (SELECT customer_id FROM public.demands WHERE responsible_employee_id=$1 UNION SELECT customer_id FROM public.consultations WHERE assignee_employee_id=$1 UNION SELECT customer_id FROM public.waitlists WHERE responsible_employee_id=$1 UNION SELECT customer_id FROM public.locks WHERE responsible_employee_id=$1 UNION SELECT customer_id FROM public.transactions WHERE responsible_employee_id=$1 UNION SELECT customer_id FROM public.recommendations WHERE recommender_employee_id=$1) ORDER BY customer_id LIMIT 101";
 const customers=(await c.query(idsQ,[source])).rows;
 if(customers.length>100)return {error:'G03_INVENTORY_TRUNCATED_DEFER_DENY'};
 const ids=customers.map(r=>r.customer_id),objects=[];
 for(const cst of customers)objects.push({kind:'Customer',objectId:str(cst.customer_id),customerId:str(cst.customer_id),responsibleEmployeeId:str(cst.current_owner_employee_id),state:cst.account_status+':'+cst.owner_assignment_state,lifecycle:classOf('Customer',cst),relation:null});
 for(const [kind,table,key,owner,state] of defs){
  const rows=(await c.query('SELECT * FROM public.'+table+' WHERE customer_id=ANY($1::bigint[]) ORDER BY '+key+' LIMIT 501',[ids])).rows;
  if(rows.length>500)return {error:'G03_INVENTORY_TRUNCATED_DEFER_DENY'};
  for(const r of rows)objects.push({kind,objectId:str(r[key]),customerId:str(r.customer_id),responsibleEmployeeId:owner?str(r[owner]):null,state:state?str(r[state]):r.ended_at===null?'open':'ended',lifecycle:classOf(kind,r),relation:kind==='Priority'?{triggerDemandId:str(r.trigger_demand_id)}:kind==='Recommendation'?{sourceDemandId:str(r.source_demand_id)}:null});
 }
 return {objects,openObjects:objects.filter(o=>o.lifecycle!=='TERMINAL'),customerCount:customers.length,writeCapability:'WRITE_CAPABILITY_UNPROVEN',noBusinessHandoverProof:true};
}
async function cover(c,ctx,p,imp){
 const ledger=(await c.query("SELECT item_id,object_kind,object_id,from_employee_id,intended_to_employee_id,status,attempt_count,last_error_code FROM public.handover_items WHERE batch_id=$1 ORDER BY item_id FOR SHARE LIMIT 501",[p.batchId])).rows;
 if(ledger.length>500)return {error:'G06_LEDGER_TRUNCATED_DEFER_DENY'};
 const all=(await c.query("SELECT i.batch_id,i.object_kind,i.object_id,i.intended_to_employee_id FROM public.handover_items i JOIN public.handover_batches b ON b.batch_id=i.batch_id WHERE b.source_employee_id=$1 ORDER BY i.item_id LIMIT 501",[ctx.source])).rows;
 if(all.length>500)return {error:'G06_LEDGER_TRUNCATED_DEFER_DENY'};
 const items=ledger.map(x=>({itemId:str(x.item_id),kind:x.object_kind,objectId:x.object_id,fromEmployeeId:str(x.from_employee_id),recipientEmployeeId:str(x.intended_to_employee_id),state:x.status,lastError:x.last_error_code}));
 const findings=[];
 for(const x of imp.openObjects){
  const matches=items.filter(i=>i.kind===x.kind&&i.objectId===x.objectId),one=matches[0];
  const conflicting=all.some(v=>v.object_kind===x.kind&&v.object_id===x.objectId&&str(v.batch_id)!==str(p.batchId)&&str(v.intended_to_employee_id)!==str(p.recipientEmployeeId));
  let reason='PENDING';
  if(x.kind==='Recommendation'||!['Customer','Demand'].includes(x.kind))reason='UNSUPPORTED';
  else if(x.lifecycle==='UNKNOWN_DEFER_DENY'||x.lifecycle==='REVALIDATE'||x.responsibleEmployeeId!==ctx.source)reason='REVALIDATE';
  else if(matches.length>1||conflicting||one&&(one.fromEmployeeId!==ctx.source||one.recipientEmployeeId!==str(p.recipientEmployeeId)))reason='CONFLICT';
  else if(one&&one.state!=='pending')reason='REVALIDATE';
  findings.push({kind:x.kind,objectId:x.objectId,customerId:x.customerId,reason,itemId:one?.itemId??null});
 }
 for(const i of items)if(!imp.openObjects.some(x=>x.kind===i.kind&&x.objectId===i.objectId))findings.push({kind:i.kind,objectId:i.objectId,customerId:null,reason:'REVALIDATE',itemId:i.itemId});
 return {items,findings,overall:'DEFER_DENY',noDomainAdapterAccepted:true,writeCapability:'WRITE_CAPABILITY_UNPROVEN',batchState:ctx.batch.status};
}
async function execute(auth,token,p,fields,callback,opts){
 if(!shape(p,fields)||!valid(p.batchId)||!valid(p.teamId)||('recipientEmployeeId' in p&&!valid(p.recipientEmployeeId))||!chk(opts?.testCheckpoint))return fail('G02_INPUT_DENY');
 await guard(auth);
 const res=await auth.withSession(token,async(c,a,s)=>{
  const ctx=await context(c,a,s,p);
  if(ctx.error)return fail(ctx.error);
  return callback(c,ctx,opts?.testCheckpoint);
 },{normalOnly:true});
 return res??fail('G02_INVALID_OR_REVOKED_SESSION');
}
export const readHandoverCustomerImpact=(a,t,p,o)=>execute(a,t,p,'batchId,teamId',async(c,ctx)=>{
 const i=await impact(c,ctx.source);return i.error?fail(i.error):fail('G03_IMPACT_READ_ONLY',{batchId:str(p.batchId),...i});
},o);
export const readHandoverRecipientEligibility=(a,t,p,o)=>execute(a,t,p,'batchId,recipientEmployeeId,teamId',async(c,ctx)=>{
 const e=await eligibility(c,ctx,p);return fail(e.eligible?'G04_ELIGIBILITY_FACTS_ONLY':e.code,{recipient:e});
},o);
export const readHandoverBatchCoverage=(a,t,p,o)=>execute(a,t,p,'batchId,recipientEmployeeId,teamId',async(c,ctx)=>{
 const e=await eligibility(c,ctx,p);if(!e.eligible)return fail(e.code,{recipient:e});
 const i=await impact(c,ctx.source);if(i.error)return fail(i.error);
 const cv=await cover(c,ctx,p,i);return cv.error?fail(cv.error):fail('G06_COVERAGE_DEFER_DENY',{recipient:e,customerCount:i.customerCount,...cv});
},o);
export const readHandoverCommitPreflight=(a,t,p,o)=>execute(a,t,p,'batchId,recipientEmployeeId,teamId',async(c,ctx,checkpoint)=>{
 const again=async()=>{
  const b=await batch(c,{employee_id:ctx.manager},p);
  if(!b||str(b.source_employee_id)!==ctx.source||!await capable(c,ctx.manager,ctx.source,p.teamId))return {error:'G05_CURRENT_MANAGER_OR_BATCH_CHANGED'};
  const e=await eligibility(c,ctx,p);if(!e.eligible)return {error:e.code};
  const i=await impact(c,ctx.source);if(i.error)return {error:i.error};
  const cv=await cover(c,ctx,p,i);if(cv.error)return {error:cv.error};
  return {e,i,cv,signature:JSON.stringify({version:str(b.version),state:b.status,recipient:e,objects:i.objects,items:cv.items,findings:cv.findings})};
 };
 const first=await again();if(first.error)return fail(first.error);
 if(checkpoint)await checkpoint('after_first_read',c);
 const latest=await again();if(latest.error)return fail(latest.error);
 if(first.signature!==latest.signature)return fail('G05_CONCURRENT_STATE_CHANGED_REVALIDATE');
 return fail('PREFLIGHT_FACTS_CURRENT_BUT_WRITE_DENIED',{recipient:latest.e,coverage:latest.cv,customerCount:latest.i.customerCount,noReusableCommitToken:true});
},o);
