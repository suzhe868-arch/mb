import {validateBuildableClosure} from './closure-validation.mjs';
const assert=(ok,code)=>{if(!ok)throw Error('F02_G0_SC_'+code)};
const parse=s=>s.trimEnd().split(/\r?\n/).map(x=>x.split('\t'));
const included=x=>x.startsWith('INCLUDE_');
const mandatory={
 '01':['system_admins.system_admin_id','system_admins.account_status','system_admins.created_at','system_admins.login_account','system_admins.credential_hash','system_admins.bootstrap_origin','system_admins.created_by_system_admin_id','audit_events.actor_id','audit_events.occurred_at'],
 '02':['demand_match_results.result_id','demand_match_results.demand_id','demand_match_results.vehicle_id','demand_match_results.listing_cycle_id','demand_match_results.match_tier','demand_match_results.match_explanation','demand_match_results.current_state','demand_match_results.calculated_at','priority_leases.source_match_result_id','priority_leases.listing_cycle_id'],
 '03':['crm_followups.followup_id','crm_followups.customer_id','crm_followups.actor_employee_id','crm_followups.occurred_at','crm_followups.content','crm_followups.business_demand_id','crm_followup_tasks.task_id','crm_followup_tasks.customer_id','crm_followup_tasks.responsible_employee_id','crm_followup_tasks.planned_at','crm_followup_tasks.task_state'],
 '04':['public_pool_events.pool_event_id','public_pool_events.customer_id','public_pool_events.event_kind','public_pool_events.source_owner_history_id','public_pool_events.actor_kind','public_pool_events.occurred_at','customer_owner_history.owner_history_id','customer_owner_history.customer_id','customers.current_owner_employee_id','priority_leases.status','crm_followup_tasks.task_state']
};
export function validateFourDomainScope(matrix,freeze,tiers,mapping){
 const closure=validateBuildableClosure(matrix,freeze,tiers);
 const m=parse(matrix),f=parse(freeze),rows=parse(mapping);
 const fields=new Map(m.slice(1).map(x=>[x[1]+'.'+x[2],x]));
 const disposition=new Map(f.slice(1).map(x=>[x[0],x]));
 assert(rows.length===15,'MAPPING_14_ROWS');
 const head=['事实编号','补审域','required_fact','Authority正式条款','physical_carrier实体字段及ID','身份/唯一性/外键/审计策略','phase','disposition','negative_case','未来守卫/本阶段测试边界','A最终签发'];
 assert(JSON.stringify(rows[0])===JSON.stringify(head),'MAPPING_HEADERS');
 const covered={'01':new Set(),'02':new Set(),'03':new Set(),'04':new Set()};
 const recordIds=new Set();
 for(const r of rows.slice(1)){
  assert(r.length===11,'MAPPING_COLUMN_COUNT');
  assert(/^G0-SC-0[1-4]-\d{2}$/.test(r[0])&&!recordIds.has(r[0]),'MAPPING_FACT_ID');
  recordIds.add(r[0]);
  const domain=r[0].slice(6,8);
  assert(r[1]==='G0-SC-'+domain,'MAPPING_DOMAIN');
  assert(r[2].length>=10&&r[3].includes('PDM-')&&r[5].length>=8,'AUTHORITY_OR_FACT_EMPTY');
  assert(r[6]==='F02_1_MINIMUM'&&r[7]==='INCLUDE_MINIMUM','FAKE_DEFER_OR_PHASE');
  assert(r[8].length>=9&&r[9].includes('NOT_RUN')&&r[10]==='PENDING_A_FINAL_FREEZE','BAD_NEGATIVE_OR_FAKE_ACCEPTANCE');
  const references=r[4].split(';');
  assert(references.length>0,'MISSING_CARRIERS');
  for(const ref of references){
   const [key,id]=ref.split('#');
   const data=fields.get(key);
   assert(data&&data[0]===id,'MAPPING_FIELD_ID_DRIFT');
   const fd=disposition.get(id);
   assert(fd&&included(fd[4])&&fd[7]==='PENDING_A_FINAL_FREEZE','CARRIER_DEFERRED_OR_ACCEPTED_'+key);
   covered[domain].add(key);
  }
 }
 for(const [d,req] of Object.entries(mandatory)){
  assert([...recordIds].filter(s=>s.startsWith('G0-SC-'+d+'-')).length>=3,'DOMAIN_INSUFFICIENT_'+d);
  for(const key of req)assert(covered[d].has(key),'MISSING_REQUIRED_FACT_'+d+'_'+key);
 }
 const get=key=>{const x=fields.get(key);assert(x&&included(disposition.get(x[0])?.[4]||''),'MISSING_INCLUDED_'+key);return x;};
 const sys=get('system_admins.system_admin_id');
 assert(sys[5]==='PK'&&!sys[5].includes('FK:employees.'),'SYSTEM_ADMIN_EMPLOYEE_IDENTITY_COLLISION');
 assert(get('system_admins.created_by_system_admin_id')[5].includes('FK:system_admins.system_admin_id'),'SYSTEM_ADMIN_PROVENANCE');
 assert(get('system_admins.login_account')[5].includes('UNIQUE_SYSTEM_ADMIN_LOGIN_ACCOUNT'),'SYSTEM_ADMIN_CREDENTIAL_ID');
 assert(get('demand_match_results.match_tier')[5].includes('CHECK_high_acceptable_confirmation_needed_no_match'),'FORMAL_MATCH_FOUR_TIERS');
 assert(get('demand_match_results.current_state')[5].includes('PARTIAL_UNIQUE_CURRENT_DEMAND_VEHICLE_CYCLE'),'FORMAL_MATCH_CURRENT_HISTORY');
 assert(get('priority_leases.source_match_result_id')[5].includes('CURRENT_HIGH_ACCEPTABLE_TX_GUARD'),'PRIORITY_CANNOT_CONSUME_STALE');
 assert(get('crm_followups.occurred_at')[5].includes('APPEND_ONLY'),'CRM_HISTORY_NOT_APPEND_ONLY');
 for(const col of ['planned_at','completed_at','status']){
  const x=fields.get('crm_followups.'+col);
  assert(x&&!included(disposition.get(x[0])[4]),'FUTURE_TASK_MERGED_WITH_FOLLOWUP_HISTORY');
 }
 assert(get('crm_followup_tasks.task_id')[5]==='PK','FUTURE_CRM_TASK_NOT_INDEPENDENT');
 assert(get('public_pool_events.event_kind')[5].includes('FORMAL_POOL_ENTER_EXIT_TRANSFER_ONLY'),'POOL_CANDIDATE_AS_FORMAL_POOL');
 assert(get('public_pool_events.source_owner_history_id')[5].includes('COMPOSITE_SAME_CUSTOMER_OWNER_HISTORY'),'POOL_OWNER_HISTORY_MISMATCH');
 return {domainCount:4,factCount:14,fieldCount:closure.fieldCount,entities:closure.entityCount,staticFKs:closure.foreignKeyCount,counts:closure.counts};
}
