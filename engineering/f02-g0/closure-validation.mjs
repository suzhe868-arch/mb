import {validateMatrix} from './matrix-validation.mjs';
export const COMPOSITE_IDENTITY_KEYS=Object.freeze({
  role_permission_defaults:['role_id','permission_id'],
  employee_permission_overrides:['employee_id','permission_id'],
  customer_day_quota_ledger:['customer_id','business_day_shanghai']
});
const MINIMUM={
  customer_levels:['level_id','level_code'],
  stores:['store_id','store_name','status'],
  matching_dictionary_rules:['rule_id','rule_scope','rule_expression','version','rule_status','normalized_mapping_json','created_by_employee_id','updated_by_employee_id','created_at','updated_at'],
  matching_rule_change_history:['event_id','rule_id','rule_version','after_json','actor_employee_id','occurred_at'],
  pc_login_accounts:['account_id','normalized_login_key','principal_kind','employee_id','system_admin_id','password_hash','credential_state','force_password_change','created_at'],
  vehicle_hide_rules:['rule_id','source_scope_json','conditions_json','is_enabled','updated_by_employee_id'],
  vehicle_conversions:['conversion_id','vehicle_id','from_source','to_source','converted_at'],
  vehicle_documents:['document_id','vehicle_id','document_kind','customer_visible','origin_ref','added_at'],
  image_asset_jobs:['asset_job_id','vehicle_id','status','retry_count','last_attempt_at'],
  vehicle_model_review_cases:['case_id','upstream_model_id','vehicle_id','case_state','resolved_by'],
  publisher_phone_history:['phone_history_id','source_platform','upstream_publisher_id','result_status','received_at'],
  collector_integration_events:['integration_event_id','source_platform','upstream_publisher_id','event_kind','dedupe_key','received_at'],
  crm_stage_dictionary:['stage_id','stage_name','sort_order','status'],
  crm_customer_stages:['customer_id','stage_id','updated_by_employee_id','updated_at'],
  crm_tag_dictionary:['tag_id','tag_name','sort_order','status'],
  crm_customer_tag_links:['link_id','customer_id','tag_id','assigned_by_employee_id','ended_at'],
  crm_personal_notes:['note_id','customer_id','author_employee_id','note_text','created_at'],
  crm_shared_profiles:['profile_id','customer_id','profile_json','updated_by_employee_id','updated_at'],
  crm_service_labels:['label_id','customer_id','author_employee_id','label_text','source_kind','occurred_at'],
  matching_change_events:['event_id','result_id','trigger_kind','before_json','after_json','occurred_at','idempotency_key'],
  system_admins:['system_admin_id','account_status','created_at','login_account','credential_hash','bootstrap_origin','created_by_system_admin_id'],
  demand_match_results:['result_id','demand_id','vehicle_id','listing_cycle_id','match_tier','match_explanation','current_state','calculated_at','invalidated_at'],
  crm_followups:['followup_id','customer_id','responsible_employee_id','actor_employee_id','occurred_at','content','business_demand_id','source_context_json'],
  crm_followup_tasks:['task_id','customer_id','responsible_employee_id','planned_at','task_state','created_at'],
  public_pool_events:['pool_event_id','customer_id','from_owner_id','to_owner_id','event_reason','occurred_at','event_kind','source_owner_history_id','actor_kind','actor_id'],
  customer_entitlement_events:['entitlement_event_id','customer_id','entitlement_kind','occurred_at'],
  vehicle_images:['image_id','vehicle_id','relative_path','source_url_fact','asset_storage_status'],
  vehicle_price_history:['price_event_id','vehicle_id','price_kind','amount_cents','valid_from','changed_by'],
  pricing_rule_versions:['version_id','version_state','effective_at','approved_by'],
  pricing_rule_ranges:['range_id','version_id','min_price_cents','max_price_cents','markup_cents'],
  customer_collaborations:['collaboration_id','customer_id','employee_id','scope_json','ended_at'],
  financial_corrections:['correction_id','subject_kind','subject_id','correction_amount_cents','actor_employee_id','occurred_at'],
  publisher_phone_cache:['cache_id','source_platform','upstream_publisher_id','phone_secret','fetched_at','source_status'],
  notification_events:['notification_id','recipient_kind','source_object_kind','source_object_id','result_state'],
  share_attributions:['share_id','vehicle_id','sharer_customer_id','source_employee_id','created_at']
};
const BANNED_TABLES=new Set(['four_s_organizations','customer_daily_price_access']);
const INC=k=>k.startsWith('INCLUDE_');
const uniq=a=>[...new Set(a)];
const insist=(c,code)=>{if(!c)throw Error('F02_G0_CL_'+code)};
const parse=text=>text.trimEnd().split(/\r?\n/).map(s=>s.split('\t'));
function required(fields,table,col,tag){const r=fields.get(table+'.'+col);insist(r&&r.included,'MISSING_REQUIRED_'+tag+'_'+table+'.'+col);insist(r.row[4]!=='REVIEW','UNRESOLVED_NULLABILITY_'+table+'.'+col);return r.row}
const has=(r,marker)=>r[5].split(';').some(s=>s===marker);
const staticRefs=r=>[...r[5].matchAll(/(FK|XOR_FK):([a-z_]+)\.([a-z_]+)/g)];
export function validateBuildableClosure(matrixText,freezeText,tierText){
  const matrix=parse(matrixText),freeze=parse(freezeText),tier=parse(tierText);
  const baseline=validateMatrix(matrixText);
  insist(matrix.length===511&&freeze.length===511&&tier.length===511,'ROW_510_COUNT');
  const m=new Map(matrix.slice(1).map(r=>[r[0],r])),f=new Map(),tiers=new Map(tier.slice(1).map(r=>[r[0],r]));
  const kindPattern=/^(INCLUDE_(CORE_CANDIDATE|SUPPORT_CANDIDATE|WITH_A_REVIEW|MINIMUM_COMPLETE_ENTITY)|DEFER_WITH_REASON|EXCLUDE_(4S_ORG|OLD_MIXED))$/;
  for(const r of freeze.slice(1)){
    insist(r.length===8&&m.has(r[0])&&!f.has(r[0]),'FREEZE_ROW_ID');
    insist(kindPattern.test(r[4]),'FREEZE_DISPOSITION_'+r[0]);
    insist(r[7]==='PENDING_A_FINAL_FREEZE','FALSE_A_ACCEPTANCE_'+r[0]);
    insist(r[1]===m.get(r[0])[1]+'.'+m.get(r[0])[2],'FIELD_ID_DRIFT_'+r[0]);
    insist(r[5]===m.get(r[0])[4]+' | '+m.get(r[0])[5]+' | '+m.get(r[0])[6],'FIELD_CONSTRAINT_DRIFT_'+r[0]);
    const tr=tiers.get(r[0]);insist(tr&&tr[1]===r[1]&&tr[2]===r[3]&&tr[4]==='CANDIDATE_UNFROZEN','TIER_DRIFT_'+r[0]);
    const type=r[4].startsWith('EXCLUDE_')?'EXCLUDE':INC(r[4])?'INCLUDE':'DEFER';
    insist((type==='EXCLUDE')===(r[3].startsWith('P2_EXCLUDE_')),'EXCLUDE_TIER_DRIFT_'+r[0]);
    if(type==='DEFER')insist(r[3].startsWith('P2_'),'DEFER_TIER_DRIFT_'+r[0]);
    if(type==='INCLUDE')insist(r[3].startsWith('P0_')||r[3].startsWith('P1_'),'INCLUDE_TIER_DRIFT_'+r[0]);
    f.set(r[0],r);
  }
  insist(f.size===m.size&&tiers.size===m.size,'MATRIX_FREEZE_TIER_COVERAGE');
  const fields=new Map(),included=new Map(),allTables=new Map();
  for(const r of matrix.slice(1)){
    const selected=INC(f.get(r[0])[4]);
    const q={row:r,included:selected,freeze:f.get(r[0])};
    fields.set(r[1]+'.'+r[2],q);
    if(!allTables.has(r[1]))allTables.set(r[1],[]);
    allTables.get(r[1]).push(q);
    if(selected){
      insist(!BANNED_TABLES.has(r[1]),'BANNED_ENTITY_INCLUDED_'+r[1]);
      insist(r[4]!=='REVIEW','UNRESOLVED_INCLUDED_NULLABILITY_'+r[1]+'.'+r[2]);
      if(!included.has(r[1]))included.set(r[1],[]);
      included.get(r[1]).push(r);
    }
  }
  for(const t of BANNED_TABLES)insist(!included.has(t),'BANNED_AS_PARENT_'+t);
  // Validate all included source FKs before evaluating entity PKs so a deferred parent
  // is reported as a foreign-key disconnection even when its PK was also deferred.
  for(const rows of included.values())for(const source of rows){
    for(const [,kind,parent,column] of staticRefs(source)){
      required(fields,parent,column,'FK_PARENT_FOR_'+source[1]+'.'+source[2]);
      insist(!BANNED_TABLES.has(parent),'FORBIDDEN_FK_PARENT_'+parent);
    }
  }
  const entityRows=[],foreignKeyRows=[],keys={};
  for(const [t,rows] of [...included].sort(([a],[b])=>a.localeCompare(b))){
    const explicit=rows.filter(r=>has(r,'PK'));
    insist(explicit.length<=1,'AMBIGUOUS_PK_'+t);
    let key=explicit.map(r=>r[2]);
    if(!key.length){key=COMPOSITE_IDENTITY_KEYS[t]||[];insist(key.length>0,'GHOST_NO_PK_'+t);}
    for(const col of key)insist(required(fields,t,col,'IDENTITY')[4]==='NO','NULL_IDENTITY_'+t+'.'+col);
    if(COMPOSITE_IDENTITY_KEYS[t]){
      insist(key.join('|')===COMPOSITE_IDENTITY_KEYS[t].join('|'),'COMPOSITE_PK_MISMATCH_'+t);
      const marker=t==='role_permission_defaults'?'UNIQUE_CURRENT_ROLE_PERMISSION':t==='employee_permission_overrides'?'UNIQUE_CURRENT_EMPLOYEE_PERMISSION':'UNIQUE_CUSTOMER_DAY';
      for(const col of key)insist(has(required(fields,t,col,'COMPOSITE'),marker),'COMPOSITE_KEY_NOT_UNIQUE_'+t+'.'+col);
    }
    for(const col of MINIMUM[t]||[])required(fields,t,col,'ENTITY_MINIMUM');
    const parents=[];
    for(const r of rows){
      for(const [,kind,parent,pcol] of staticRefs(r)){
        const target=required(fields,parent,pcol,'FK_PARENT_FOR_'+t+'.'+r[2]);
        insist(!BANNED_TABLES.has(parent),'FORBIDDEN_FK_PARENT_'+parent);
        insist(has(target,'PK'),'FK_TARGET_NOT_PK_'+parent+'.'+pcol);
        parents.push(parent);
        foreignKeyRows.push([t,r[2],kind,parent,pcol,key.join('+'),'PHASE2_FK_AFTER_TABLE_CREATE','PENDING_A_FINAL_FREEZE']);
      }
    }
    keys[t]=key;
    entityRows.push([t,rows.length,key.length===1?'SINGLE_PK':'COMPOSITE_UNIQUE_KEY',key.join('+'),rows.filter(r=>r[4]==='NO').map(r=>r[2]).join('+'),uniq(parents).sort().join('+')||'NONE','INCLUDE_MINIMUM_COMPLETE_ENTITY','PHASE1_CREATE_ENTITY__PHASE2_ATTACH_FK','PENDING_A_FINAL_FREEZE',rows[0][8]]);
  }
  // Referential consistency to the real Vehicle/cycle is not two unrelated FK facts.
  for(const key of ['listing_cycle_id','vehicle_id'])insist(has(required(fields,'vehicle_listing_cycles',key,'CYCLE_PARENT'),'UNIQUE_LISTING_CYCLE_VEHICLE_PAIR'),'MISSING_CYCLE_PARENT_COMPOSITE');
  for(const child of ['demand_match_results','priority_leases','recommendations','consultations','lock_requests','locks','waitlists','transactions','customer_price_cycle_unlocks','customer_price_unlock_events']){
    const cycle=required(fields,child,'listing_cycle_id','CYCLE_CHILD');
    required(fields,child,'vehicle_id','CYCLE_CHILD');
    insist(cycle[5].includes('COMPOSITE_FK_LISTING_CYCLE_VEHICLE'),'MISSING_COMPOSITE_CYCLE_'+child);
  }
  for(const [child,key,marker] of [['refund_cases','lock_id','UNIQUE_REFUND_LOCK_CUSTOMER_PAIR'],['refund_cases','transaction_id','UNIQUE_REFUND_TRANSACTION_CUSTOMER_PAIR']]){
    const p=key==='lock_id'?'locks':'transactions';
    insist(required(fields,child,key,'REFUND')[5].includes('COMPOSITE_SUBJECT_CUSTOMER_CYCLE'),'REFUND_MISSING_COMPOSITE_'+key);
    required(fields,child,'customer_id','REFUND');
    for(const col of [key==='lock_id'?'lock_id':'transaction_id','customer_id'])insist(has(required(fields,p,col,'REFUND_PARENT'),marker),'REFUND_PARENT_NO_UNIQUE_'+p+'.'+col);
  }
  insist(required(fields,'refund_cases','lock_id','XOR')[5].includes('XOR_FK')&&required(fields,'refund_cases','transaction_id','XOR')[5].includes('XOR_FK'),'REFUND_XOR_MISSING');
  for(const col of ['role_id','permission_id'])required(fields,'role_permission_defaults',col,'ROLE_KEY');
  for(const col of ['employee_id','permission_id'])required(fields,'employee_permission_overrides',col,'EMPLOYEE_KEY');
  for(const col of ['recommendation_id','customer_id','vehicle_id','listing_cycle_id'])required(fields,'recommendations',col,'RECOMMENDATION_TRIPLE');
  insist(has(required(fields,'recommendations','recommendation_id','GRANT_KEY'),'UNIQUE_RECOMMENDATION_GRANT_TRIPLE'),'RECOMMENDATION_COMPOSITE_UNIQUE_MISSING');
  const src=required(fields,'customer_price_cycle_unlocks','source_recommendation_id','GRANT_SOURCE');
  insist(src[5].includes('CONDITIONAL_SAME_TRIPLE'),'GRANT_SOURCE_MISMATCH');
  for(const c of ['customer_id','business_day_shanghai'])insist(has(required(fields,'customer_day_quota_ledger',c,'DAILY_LEDGER'),'UNIQUE_CUSTOMER_DAY'),'DAILY_LEDGER_COMPOSITE_MISSING');
  for(const c of ['customer_id','business_day_shanghai'])required(fields,'customer_price_unlock_events',c,'DAILY_EVENT');
  insist(required(fields,'customer_price_unlock_events','business_day_shanghai','DAILY_EVENT')[5].includes('FK_LOGICAL_CUSTOMER_DAY'),'DAILY_LEDGER_LOGICAL_RELATION_MISSING');
  insist(has(required(fields,'vehicle_listing_cycles','ended_at','ACTIVE_CYCLE'),'PARTIAL_UNIQUE_ACTIVE_VEHICLE_CYCLE'),'ACTIVE_CYCLE_UNIQUENESS_MISSING');
  insist(required(fields,'consultations','listing_cycle_id','CONSULTATION_ACTIVE')[5].includes('PARTIAL_UNIQUE_ACTIVE_CONSULTATION_TRIPLE'),'ACTIVE_CONSULTATION_UNIQUENESS_MISSING');
  // Full-domain source-derived minimum physical carriers; real execution belongs to future stages.
  for(const k of ['rule_id','rule_scope','rule_expression','version','rule_status','normalized_mapping_json','created_by_employee_id','updated_by_employee_id','created_at','updated_at'])required(fields,'matching_dictionary_rules',k,'ALL_RULE');
  for(const k of ['event_id','rule_id','rule_version','after_json','actor_employee_id','occurred_at'])required(fields,'matching_rule_change_history',k,'ALL_RULE_HISTORY');
  insist(required(fields,'matching_dictionary_rules','rule_scope','ALL')[5].includes('SCOPE_PRIORITY_MODEL_YEAR_SERIES_BRAND_GLOBAL'),'ALL_SCOPE_PRIORITY');
  insist(required(fields,'matching_dictionary_rules','rule_status','ALL')[5].includes('CHECK_enabled_disabled_retired'),'ALL_RULE_STATE');
  for(const k of ['account_id','normalized_login_key','principal_kind','employee_id','system_admin_id','password_hash','credential_state','force_password_change'])required(fields,'pc_login_accounts',k,'ALL_PC');
  insist(required(fields,'pc_login_accounts','normalized_login_key','ALL')[5].includes('UNIQUE_GLOBAL_PC_LOGIN_KEY'),'ALL_PC_UNIQUE');
  insist(required(fields,'pc_login_accounts','principal_kind','ALL')[5].includes('XOR_PRINCIPAL_ID'),'ALL_PC_XOR');
  for(const table of ['crm_stage_dictionary','crm_customer_stages','crm_tag_dictionary','crm_customer_tag_links','crm_personal_notes','crm_shared_profiles','crm_service_labels'])insist(included.has(table),'ALL_CRM_PARTITION_'+table);
  for(const table of ['vehicle_conversions','vehicle_documents','image_asset_jobs','vehicle_model_review_cases','publisher_phone_history','collector_integration_events','vehicle_hide_rules','matching_change_events'])insist(included.has(table),'ALL_ARCHIVE_'+table);
  insist(required(fields,'vehicle_hide_rules','source_scope_json','ALL')[5].includes('NONEMPTY_EXPLICIT_SOURCE_SCOPE'),'ALL_HIDE_SCOPE');
  insist(required(fields,'vehicle_hide_rules','conditions_json','ALL')[5].includes('AND_FIELDS_OR_VALUES_OR_RULES'),'ALL_HIDE_COMBINATOR');
  insist(required(fields,'image_asset_jobs','status','ALL')[5].includes('CHECK_processing_success_partial_failed_failed'),'ALL_IMAGE_STATUS');
  for(const k of ['dedupe_key','channel_kind','recipient_ref','notification_stage'])required(fields,'notification_events',k,'ALL_NOTIFY');
  insist(required(fields,'notification_events','dedupe_key','ALL')[5].includes('PARTIAL_UQ_EVENT_CHANNEL_RECIPIENT_STAGE_WHEN_PRESENT'),'ALL_NOTIFY_DEDUPE');
  // G0-SC F02-1 mandatory physical carriers; all runtime authorization, transactional concurrency and real DDL remain NOT_RUN.
  for(const k of ['system_admin_id','account_status','created_at','login_account','credential_hash','bootstrap_origin','created_by_system_admin_id'])required(fields,'system_admins',k,'SC01');
  insist(required(fields,'system_admins','created_by_system_admin_id','SC01')[5].includes('FK:system_admins.system_admin_id'),'SC01_CREATOR_MISSING');
  for(const k of ['result_id','demand_id','vehicle_id','listing_cycle_id','match_tier','match_explanation','current_state','calculated_at'])required(fields,'demand_match_results',k,'SC02');
  insist(required(fields,'demand_match_results','match_tier','SC02')[5].includes('CHECK_high_acceptable_confirmation_needed_no_match'),'SC02_FOUR_TIERS');
  insist(required(fields,'demand_match_results','current_state','SC02')[5].includes('PARTIAL_UNIQUE_CURRENT_DEMAND_VEHICLE_CYCLE'),'SC02_CURRENT_STALE');
  insist(required(fields,'priority_leases','source_match_result_id','SC02')[5].includes('FK:demand_match_results.result_id'),'SC02_PRIORITY_CONSUMES_MATCH_RESULT');
  for(const k of ['followup_id','customer_id','actor_employee_id','occurred_at','content','business_demand_id'])required(fields,'crm_followups',k,'SC03');
  insist(required(fields,'crm_followups','occurred_at','SC03')[5].includes('APPEND_ONLY'),'SC03_NOT_APPEND_ONLY');
  for(const k of ['task_id','customer_id','responsible_employee_id','planned_at','task_state'])required(fields,'crm_followup_tasks',k,'SC03_TASK');
  for(const k of ['pool_event_id','customer_id','event_kind','source_owner_history_id','occurred_at'])required(fields,'public_pool_events',k,'SC04');
  insist(required(fields,'public_pool_events','event_kind','SC04')[5].includes('FORMAL_POOL_ENTER_EXIT_TRANSFER_ONLY'),'SC04_CANDIDATE_AS_POOL');
  insist(required(fields,'public_pool_events','source_owner_history_id','SC04')[5].includes('COMPOSITE_SAME_CUSTOMER_OWNER_HISTORY'),'SC04_NOT_OWNER_HISTORY');
  for(const k of ['owner_history_id','customer_id'])insist(has(required(fields,'customer_owner_history',k,'SC04_PARENT'),'UNIQUE_OWNER_HISTORY_CUSTOMER_PAIR'),'SC04_OWNER_PAIR_MISSING');
  for(const t of ['publisher_phone_cache'])for(const k of ['source_platform','upstream_publisher_id','source_status'])required(fields,t,k,'PUBLISHER_KEY');
  const deferredEntities=[];
  for(const [t,rows] of allTables)if(!included.has(t)){
    const dispositions=uniq(rows.map(x=>x.freeze[4]));
    insist(dispositions.length===1,'DEFERRED_ENTITY_MIXED_'+t);
    const kind=dispositions[0];
    insist(kind==='DEFER_WITH_REASON'||kind.startsWith('EXCLUDE_'),'DEFERRED_ENTITY_INVALID_'+t);
    const reason=kind==='EXCLUDE_4S_ORG'?'PDM-02 Final禁止独立4S组织层级，4S成员账号直接代表合作主体':kind==='EXCLUDE_OLD_MIXED'?'已由客户每日额度账本、单车周期权益、幂等成功扣额事件三表替代，不得施工混合表':'非F02-1初始域最低必须：实体整体留待对应领域功能的F02后续增量承载，当前基础实体无反向FK引用；须由A按正式施工范围复核';
    deferredEntities.push([t,rows.map(x=>x.row[2]).join('+'),kind,reason,rows[0].row[8],'PENDING_A_FINAL_FREEZE']);
  }
  const counts={included:[...included.values()].reduce((a,r)=>a+r.length,0),deferred:freeze.slice(1).filter(x=>x[4]==='DEFER_WITH_REASON').length,excluded:freeze.slice(1).filter(x=>x[4].startsWith('EXCLUDE_')).length};
  insist(counts.included+counts.deferred+counts.excluded===510,'CLASSIFICATION_NOT_DISJOINT');
  insist(entityRows.length===included.size,'ENTITY_ROWS_MISMATCH');
  return {fieldCount:baseline.fieldCount,entityCount:entityRows.length,foreignKeyCount:foreignKeyRows.length,deferredEntityCount:deferredEntities.length,counts,entities:entityRows,foreignKeys:foreignKeyRows,deferredEntities,keys};
}
