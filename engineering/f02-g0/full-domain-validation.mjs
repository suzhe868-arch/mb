import {validateBuildableClosure} from './closure-validation.mjs';
const parse=s=>s.trimEnd().split(/\r?\n/).map(x=>x.split('\t'));
const check=(c,k)=>{if(!c)throw Error('F02_G0_ALL_'+k)};
const type=s=>s.startsWith('INCLUDE_')?'F02_1_MINIMUM':s==='DEFER_WITH_REASON'?'LATER_WITH_EXPLICIT_BOUNDARY':'DO_NOT_RESTORE';
const identity={role_permission_defaults:'role_id+permission_id',employee_permission_overrides:'employee_id+permission_id',customer_day_quota_ledger:'customer_id+business_day_shanghai'};
function vals(rows,index){const result=new Map();for(const r of rows){check(!result.has(r[index]),'DUPLICATE_'+r[index]);result.set(r[index],r)}return result}
export function validateFullDomain(matrix,freeze,tiers,fieldEvidence,entityEvidence,pdmEvidence,foreignKeys,issues){
 const closure=validateBuildableClosure(matrix,freeze,tiers);
 check(closure.fieldCount===510&&closure.entityCount===76&&closure.foreignKeyCount===137,'EXPECTED_COVERAGE_TOTALS');
 check(JSON.stringify(closure.counts)===JSON.stringify({included:466,deferred:33,excluded:11}),'EXPECTED_FREEZE_CLASSIFICATION');
 const m=parse(matrix),f=parse(freeze),F=vals(f.slice(1),0),M=vals(m.slice(1),0),fk=parse(foreignKeys).slice(1);
 const evidence=parse(fieldEvidence),entities=parse(entityEvidence),domains=parse(pdmEvidence),findings=parse(issues);
 check(evidence.length===511&&entities.length===83&&domains.length===26&&findings.length===23,'EVIDENCE_COUNT');
 const e=vals(evidence.slice(1),0),observed=new Set();
 for(const r of m.slice(1)){
  const q=e.get(r[0]),d=F.get(r[0]);check(q&&q.length===12,'MISSING_FIELD_PROOF_'+r[0]);observed.add(r[0]);
  check(q[1]===r[1]+'.'+r[2]&&q[2]===r[8]&&q[3]===type(d[4])&&q[4]===d[4],'FALSE_FIELD_PHASE_'+r[0]);
  check(q[5]===r[3]&&q[6]===r[4]&&q[7]===r[5]&&q[8]===r[6]&&q[9]===r[7],'STALE_FIELD_CONTRACT_'+r[0]);
  check(q[11]==='PENDING_A_FINAL_FREEZE'&&d[7]==='PENDING_A_FINAL_FREEZE','FAKE_A_FREEZE_'+r[0]);
  if(q[3]!=='F02_1_MINIMUM')check(q[10].length>30&&!/以后做|反正以后|非此阶段基础身份\/FK/.test(q[10]),'UNEXPLAINED_DEFER_'+r[0]);
 }
 check(observed.size===510&&e.size===510,'FIELD_ID_COVERAGE');
 const byTable=new Map();for(const r of m.slice(1)){if(!byTable.has(r[1]))byTable.set(r[1],[]);byTable.get(r[1]).push(r)}
 const E=vals(entities.slice(1),0);check(E.size===82&&byTable.size===82,'ENTITY_COVERAGE');
 for(const [table,rows] of byTable){
  const er=E.get(table);check(er&&er.length===12,'MISSING_ENTITY_PROOF_'+table);
  const ins=rows.filter(x=>F.get(x[0])[4].startsWith('INCLUDE_'));
  const key=ins.filter(x=>x[5].split(';').includes('PK')).map(x=>x[2]).join('+')||identity[table]||'NONE';
  const refs=fk.filter(x=>x[0]===table).length;
  check(+er[1]===rows.length&&+er[2]===ins.length&&+er[3]===rows.length-ins.length,'ENTITY_FIELD_ACCOUNTING_'+table);
  check(er[5]===key&&+er[6]===refs&&er[7]===rows[0][8],'ENTITY_IDENTITY_OR_FK_'+table);
  check(er[8]===(ins.map(x=>x[0]).join('+')||'NONE'),'ENTITY_INCLUDED_DRIFT_'+table);
  check(er[9]===(rows.filter(x=>!F.get(x[0])[4].startsWith('INCLUDE_')).map(x=>x[0]).join('+')||'NONE'),'ENTITY_DEFER_DRIFT_'+table);
  check(er[11]==='PENDING_A_FINAL_FREEZE','ENTITY_FALSE_A_'+table);
 }
 const pdms=vals(domains.slice(1),0);check(pdms.size===25,'PDM_01_25_COUNT');
 for(let n=1;n<=25;n++){
  const key='PDM-'+String(n).padStart(2,'0'),rr=m.slice(1).filter(x=>x[8].includes(key)),v=pdms.get(key);
  check(v&&v.length===9&&rr.length>0,'PDM_MISSING_'+key);
  const ids=fn=>rr.filter(x=>fn(F.get(x[0])[4])).map(x=>x[0]).join('+')||'NONE';
  check(v[3]===ids(x=>x.startsWith('INCLUDE_')),'PDM_CURRENT_DRIFT_'+key);
  check(v[4]===ids(x=>x==='DEFER_WITH_REASON'),'PDM_DEFER_DRIFT_'+key);
  check(v[5]===ids(x=>x.startsWith('EXCLUDE_')),'PDM_EXCLUDE_DRIFT_'+key);
  check(v[1].length>7&&v[2].length>2&&v[8]==='PENDING_A_FINAL_FREEZE','PDM_UNGROUNDED_'+key);
 }
 const issuesMap=vals(findings.slice(1),0);check(issuesMap.size===22,'ISSUE_22_COUNT');
 for(let n=1;n<=22;n++){
  const code='G0-ALL-'+String(n).padStart(2,'0'),v=issuesMap.get(code);
  check(v&&v.length===9&&v[1].includes('PDM-')&&v[3].length>10&&v[5].length>10,'ISSUE_MISSING_'+code);
  check(!v.some(x=>x==='A_ACCEPTED'||x==='G0_ACCEPTED'),'ISSUE_FALSE_ACCEPTANCE_'+code);
 }
 check(issuesMap.get('G0-ALL-05')[7]==='A_TECHNICAL_ADJUDICATION_PENDING','ADMIN_CREDENTIAL_CONFLICT_NOT_DISCLOSED');
 const bykey=new Map(m.slice(1).map(x=>[x[1]+'.'+x[2],x]));
 const get=k=>{const r=bykey.get(k);check(!!r,'REQUIRED_'+k);check(F.get(r[0])[4].startsWith('INCLUDE_'),'REQUIRED_NOT_INCLUDED_'+k);return r};
 check(get('pc_login_accounts.normalized_login_key')[5].includes('UNIQUE_GLOBAL_PC_LOGIN_KEY'),'PC_GLOBAL_UNIQUE');
 check(get('pc_login_accounts.principal_kind')[5].includes('XOR_PRINCIPAL_ID'),'PC_PRINCIPAL_XOR');
 check(get('system_admins.login_account')[5].includes('GLOBAL_PC_REGISTRY_SAME_KEY_TX'),'PC_ADMIN_BINDING');
 check(get('matching_dictionary_rules.rule_scope')[5].includes('SCOPE_PRIORITY_MODEL_YEAR_SERIES_BRAND_GLOBAL'),'DICT_SCOPE_ORDER');
 check(get('matching_dictionary_rules.rule_status')[5].includes('CHECK_enabled_disabled_retired'),'DICT_ENABLE_DISABLE');
 check(get('matching_rule_change_history.after_json')[5].includes('IMMUTABLE_RULE_SNAPSHOT'),'DICT_VERSION_HISTORY');
 check(get('vehicle_hide_rules.conditions_json')[5].includes('AND_FIELDS_OR_VALUES_OR_RULES'),'HIDE_BOOLEAN_LOGIC');
 check(get('image_asset_jobs.status')[5].includes('CHECK_processing_success_partial_failed_failed'),'IMAGE_ASSET_HISTORY');
 check(get('notification_events.dedupe_key')[5].includes('PARTIAL_UQ_EVENT_CHANNEL_RECIPIENT_STAGE_WHEN_PRESENT'),'NOTIFICATION_IDEMPOTENCE');
 check(!byTable.get('four_s_organizations').some(x=>F.get(x[0])[4].startsWith('INCLUDE_')),'RESTORE_4S_ORG');
 check(!byTable.get('customer_daily_price_access').some(x=>F.get(x[0])[4].startsWith('INCLUDE_')),'RESTORE_DAILY_CYCLE_MIXED');
 return {pdm:25,fields:510,entities:82,buildable:76,foreignKeys:137,deferredWhole:6,issues:22,counts:closure.counts};
}
