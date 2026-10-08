import {validateMatrix} from './matrix-validation.mjs';
export const COMPOSITE_IDENTITY_KEYS=Object.freeze({
  role_permission_defaults:['role_id','permission_id'],
  employee_permission_overrides:['employee_id','permission_id'],
  customer_day_quota_ledger:['customer_id','business_day_shanghai']
});
const MINIMUM={
  customer_levels:['level_id','level_code'],
  stores:['store_id','store_name','status'],
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
  insist(matrix.length===414&&freeze.length===414&&tier.length===414,'ROW_413_COUNT');
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
  for(const child of ['recommendations','consultations','lock_requests','locks','waitlists','transactions','customer_price_cycle_unlocks','customer_price_unlock_events']){
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
  for(const t of ['publisher_phone_cache'])for(const k of ['source_platform','upstream_publisher_id','source_status'])required(fields,t,k,'PUBLISHER_KEY');
  const deferredEntities=[];
  for(const [t,rows] of allTables)if(!included.has(t)){
    const dispositions=uniq(rows.map(x=>x.freeze[4]));
    insist(dispositions.length===1,'DEFERRED_ENTITY_MIXED_'+t);
    const kind=dispositions[0];
    insist(kind==='DEFER_WITH_REASON'||kind.startsWith('EXCLUDE_'),'DEFERRED_ENTITY_INVALID_'+t);
    const reason=kind==='EXCLUDE_4S_ORG'?'PDM-02 Final禁止独立4S组织层级，4S成员账号直接代表合作主体':kind==='EXCLUDE_OLD_MIXED'?'原混合日账/单车周期已拆为三张独立候选，不能进入Current DDL':'后续对应领域处理；该实体并非F02-1当前身份与外键闭合所必需，整体延期且无拟纳入字段';
    deferredEntities.push([t,rows.map(x=>x.row[2]).join('+'),kind,reason,rows[0].row[8],'PENDING_A_FINAL_FREEZE']);
  }
  const counts={included:[...included.values()].reduce((a,r)=>a+r.length,0),deferred:freeze.slice(1).filter(x=>x[4]==='DEFER_WITH_REASON').length,excluded:freeze.slice(1).filter(x=>x[4].startsWith('EXCLUDE_')).length};
  insist(counts.included+counts.deferred+counts.excluded===413,'CLASSIFICATION_NOT_DISJOINT');
  insist(entityRows.length===included.size,'ENTITY_ROWS_MISMATCH');
  return {fieldCount:baseline.fieldCount,entityCount:entityRows.length,foreignKeyCount:foreignKeyRows.length,deferredEntityCount:deferredEntities.length,counts,entities:entityRows,foreignKeys:foreignKeyRows,deferredEntities,keys};
}
