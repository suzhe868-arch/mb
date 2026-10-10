// Current F04-4, immutable source inventory and scoped incremental contracts. CI-only.
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verifyCurrentRegistry,loadContracts} from '../current-action-api-registry/source-guard.mjs';
import {verifyCurrent} from '../authority-route-mapping/source-verifier.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),d='engineering/f04/current-action-coverage-gate/';
const files={NAV:'03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md',ACTION:'03_证据_C_IA_V5_Current/IA_V5_ACTION_CONTRACT.md',GUARD:'03_证据_C_IA_V5_Current/IA_V5_CANONICAL_GUARD_CONTRACT.md',PAGE:'03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md',RETIRED:'engineering/f04/current-action-api-registry/旧Collector禁恢复独立封印.tsv',CONTRACT:'engineering/f04/current-action-api-registry/current-route-contracts.tsv'};
const read=p=>readFileSync(join(root,p),'utf8'),fail=s=>{throw Error('F04_4_'+s)};
const classes=['CURRENT_ACTION_COVERAGE','PAGE_NAV_ONLY','CONTRACT_CANDIDATE_TYPED','CURRENT_AUTHORITY_GAP','DOMAIN_IMPLEMENTATION_BLOCKED','RETIRED_FORBIDDEN'];
const proof=Object.freeze({
 LOCKREQUEST_APPROVE_FINAL:['EMPLOYEE','LockRequest','PDM-18','F06',248,80,'lockRequestId','POST','lockrequests/approve-pending'],
 LOCKREQUEST_REJECT_FINAL:['EMPLOYEE','LockRequest','PDM-18','F06',251,71,'lockRequestId','POST','lockrequests/reject-pending'],
 VEHICLE_SOURCE_TYPE_EDIT:['EMPLOYEE','Vehicle','PDM-06','F05',234,347,'vehicleId','PATCH','vehicles/source-type-change'],
 VEHICLE_DELIST:['EMPLOYEE','Vehicle','PDM-04','F05',227,260,'vehicleId','POST','vehicles/delist-current-cycle'],
 SYSTEM_MODEL_MAPPING_BIND:['SYSTEM_ADMIN','VehicleModelMapping','PDM-05','F05',218,164,'modelMappingId','POST','models/source-mapping-bind'],
 MARKUP_RULE_SAVE:['EMPLOYEE_MANAGER','MarkupRule','PDM-10','F05',286,63,'markupRuleId','POST','pricing/markup-rule-save'],
 IMAGE_FAILED_RETRY:['EMPLOYEE','VehicleImageAsset','PDM-21','F07',283,360,'imageAssetId','POST','vehicles/image-retry-failed'],
 ANNOUNCEMENT_CREATE:['AUTHORIZED_ADMIN','Announcement','PDM-24','F04',291,23,'announcementId','POST','announcements/create-new']
});
const parse=s=>{const [h,...l]=s.trimEnd().split('\n');const cols=h.split('\t');return l.map(x=>Object.fromEntries(x.split('\t').map((v,i)=>[cols[i],v])))};
function semanticKey(r){
 let src=[r.source_kind,r.source_line,r.source_page,r.control,r.actor,r.target_resource,r.object_state_guard,r.version,r.source_original].join('\x1f');
 let h=0xcbf29ce484222325n;
 for(const ch of src){h^=BigInt(ch.codePointAt(0));h=BigInt.asUintN(64,h*0x100000001b3n)}
 return r.source_kind+':'+r.source_line+':'+h.toString(16).padStart(16,'0');
}
export const loadInventory=()=>parse(read(d+'Current全量动作覆盖与页面消费台账.tsv'));
export const loadSeal=()=>JSON.parse(read(d+'Current覆盖计数与原文封印.json'));
export const loadIncremental=()=>JSON.parse(read(d+'incremental-contracts.json'));
const idx=(k,lines)=>lines.map((l,i)=>({l,n:i+1})).filter(x=>k==='NAV'?x.l.startsWith('| ')&&x.l.split('|').length===6&&!x.l.startsWith('| source_page |')&&!x.l.startsWith('|---|'):
 k==='ACTION'?/^\| ACT-V4-[0-9]+ \|/.test(x.l):
 k==='GUARD'?/^\| [A-Z_0-9]+ \|/.test(x.l)&&!x.l.startsWith('| COMMAND_FAMILY_ID'):
 k==='PAGE'?/^\| (?:C|E|P)[A-Z0-9-]+ \|/.test(x.l)&&x.l.split('|').length===6:
 k==='RETIRED'?x.n>1&&x.l.length>0:false);
function navClass(src,line,inc){
 const [page,control,target,condition]=src.split('|').slice(1,-1).map(x=>x.trim());
 if(loadContracts().some(x=>Number(x.nav_line)===line)||inc.actions.some(x=>x.nav_line===line))return 'CONTRACT_CANDIDATE_TYPED';
 const isRead=/^(打开|查看|进入|预览|浏览|复制|渲染|收到|选择|显示|跳转|返回|搜索)/.test(control);
 const mutation=!isRead&&/(确认|新增|创建|提交|保存|编辑|更新|撤回|开启|关闭|停用|恢复|删除|重试|配置|记录|切换|调整|下架|上架|分配|清除|处理|登记|补录|同意|拒绝|发布|修改|转换|建立)/.test(control);
 return !mutation?'PAGE_NAV_ONLY':/REF_GUARD|capability|scope|permission|authorized|active|revalidate|提交/.test(condition)?'DOMAIN_IMPLEMENTATION_BLOCKED':'CURRENT_AUTHORITY_GAP';
}

const policy=Object.freeze({
 LOCKREQUEST_APPROVE_FINAL:['INTENT_ONLY_CI_CONTRACT','APPROVE_PENDING_LOCK_REQUEST',80],
 LOCKREQUEST_REJECT_FINAL:['INTENT_ONLY_CI_CONTRACT','REJECT_PENDING_LOCK_REQUEST',71],
 VEHICLE_SOURCE_TYPE_EDIT:['EXECUTABLE_TYPED_CI_SCHEMA','CHANGE_PUBLISHED_MANUAL_VEHICLE_SOURCE_TYPE',342],
 VEHICLE_DELIST:['INTENT_ONLY_CI_CONTRACT','REAL_DELIST_NOT_HIDE',203],
 SYSTEM_MODEL_MAPPING_BIND:['INTENT_ONLY_CI_CONTRACT','BIND_EXISTING_CANONICAL_MODEL',227],
 MARKUP_RULE_SAVE:['INTENT_ONLY_CI_CONTRACT','SAVE_MARKUP_RULE_DRAFT',73],
 IMAGE_FAILED_RETRY:['INTENT_ONLY_CI_CONTRACT','RETRY_FAILED_IMAGE_ITEMS_ONLY',355],
 ANNOUNCEMENT_CREATE:['INTENT_ONLY_CI_CONTRACT','CREATE_NEW_ANNOUNCEMENT_NOT_UPDATE',23]
});
const vehicleSourceDto=Object.freeze({
 type:'object',additionalProperties:false,
 properties:{vehicleId:{type:'integer',minimum:1},targetSourceType:{type:'string',enum:['名邦','4S']}},
 required:['vehicleId','targetSourceType']
});
const dtoExact=x=>JSON.stringify(x)===JSON.stringify(vehicleSourceDto);
export function validateDtoValue(c,value){
 if(c?.contract_class!=='EXECUTABLE_TYPED_CI_SCHEMA'||c.intent!=='VEHICLE_SOURCE_TYPE_EDIT'||
   !dtoExact(c.dto_body)||!value||typeof value!=='object'||Array.isArray(value))return false;
 const keys=Object.keys(value);
 return keys.length===2&&keys.includes('vehicleId')&&keys.includes('targetSourceType')&&
   Number.isSafeInteger(value.vehicleId)&&value.vehicleId>=1&&
   ['名邦','4S'].includes(value.targetSourceType);
}
export function validateIncremental(content=read(d+'incremental-contracts.json')){
 const data=JSON.parse(content);
 if(data.version!=='F04_4_INCREMENTAL_CI_ONLY'||data.actions?.length!==8)fail('INCREMENTAL_COUNT');
 const seen=new Set(),paths=new Set(loadContracts().map(x=>x.path));let typed=0,intentOnly=0;
 for(const a of data.actions){
  const p=proof[a.intent],s=policy[a.intent];
  if(!p||!s||seen.has(a.intent))fail('DUPLICATE_OR_INVENTED_ACTION');
  seen.add(a.intent);
  if(a.id!=='F04_4_'+a.intent||a.actor!==p[0]||a.resource!==p[1]||
     a.domain!==p[2]||a.owner!==p[3]||a.nav_line!==p[4]||
     a.pdm_line!==p[5]||a.method!==p[7]||
     a.path!=='/__ci__/current/v1/coverage/'+p[8]||a.nav_path!==files.NAV||
     a.pdm_path!=='07_重建工作区/'+p[2]+'_最终完整规则.md'||
     a.nav_quote!==read(files.NAV).split('\n')[p[4]-1]||
     a.pdm_quote!==read(a.pdm_path).split('\n')[p[5]-1]||
     a.status!=='CI_ONLY_PROPOSED_NOT_PRODUCTION'||a.scope!=='DEPENDENCY_BLOCKED'||
     a.customer_auth!=='NONE_IN_NEW_CANDIDATES')
     fail('ACTOR_OPERATION_DOMAIN_SOURCE_MISMATCH');
  if(paths.has(a.path)||a.path.includes(':')||/collector|legacy|merchant/.test(a.path))
     fail('LEGACY_PATH_RESURRECTION');
  paths.add(a.path);
  if(a.contract_class!==s[0]||a.operation!==s[1]||
     a.request_schema_state!==(s[0]==='EXECUTABLE_TYPED_CI_SCHEMA'?'FIELD_PROVEN_SYNTHETIC_CI_ONLY':'REQUEST_SCHEMA_SOURCE_GAP')||
     a.operation_source?.pdm_path!==a.pdm_path||a.operation_source.line!==s[2]||
     a.operation_source.quote!==read(a.pdm_path).split('\n')[s[2]-1]||
     a.intent_semantics?.final_source!==a.pdm_path||
     a.intent_semantics?.state_guard!==a.state_guard||
     a.intent_semantics?.authority!=='PDM_FINAL_AND_CURRENT_NAV_ONLY'||
     a.intent_semantics?.object_scope!=='REAL_OBJECT_SCOPE_UNPROVEN'||
     a.intent_semantics?.business_execution!=='BLOCKED'||
     a.intent_semantics?.http_production!=='NOT_APPROVED')
     fail('OPERATION_INTENT_NOT_SAME_FINAL_NAV_ACTION');
  if(a.state_guard!==a.nav_quote.split('|').slice(-2)[0].trim())
     fail('OPERATION_STATE_GUARD_MISMATCH');
  const fields=a.field_authority;
  if(!Array.isArray(fields)||fields.length!==(s[0]==='EXECUTABLE_TYPED_CI_SCHEMA'?2:1))
     fail('FIELD_LEVEL_AUTHORITY_REQUIRED');
  for(const field of fields){
   if(field.source_path!==a.pdm_path||!Number.isInteger(field.line)||field.line<1||
      field.quote!==read(field.source_path).split('\n')[field.line-1]||
      !field.semantic||!field.value_type||!field.wire_status)
      fail('FALSE_FIELD_AUTHORITY');
  }
  if(s[0]==='EXECUTABLE_TYPED_CI_SCHEMA'){
    if(a.field!=='vehicleId'||!dtoExact(a.dto_body)||
       fields.map(x=>x.field).join(',')!=='vehicleId,targetSourceType'||
       fields[0].line!==348||fields[1].line!==342||
       fields[1].value_type!=='enum:名邦|4S'||
       fields[1].wire_status!=='CI_LOCAL_LITERAL_NOT_PRODUCTION_ENUM'||
       !fields[0].wire_status.includes('CI_SYNTHETIC_ID')||
       a.intent_only_reason!==null)
        fail('BUSINESS_DTO_REQUIRED_TARGET_SOURCE_TYPE');
    typed++;
  }else{
    if(a.field!==null||a.dto_body!==null||!a.intent_only_reason||
       a.intent_only_reason!==a.required_source_gap||
       fields[0].field!=='INTENT_ONLY_NO_REQUEST_SCHEMA'||
       fields[0].wire_status!=='REQUEST_SCHEMA_SOURCE_GAP'||
       a.request_schema_state!=='REQUEST_SCHEMA_SOURCE_GAP')
       fail('SOURCE_GAP_PRETENDED_EXECUTABLE_DTO');
    intentOnly++;
  }
  if(Object.keys(a.response_codes||{}).sort().join(',')!=='403,501'||
     a.response_codes['403']!=='F04_4_AUTH_OR_SCOPE_DENIED'||
     a.response_codes['501']!=='F04_4_DOMAIN_DEPENDENCY_BLOCKED')
      fail('EXTRA_PRIVATE_DTO_OR_FAKE_RESPONSE');
  // The action coverage exists; this does not prove a production-ready HTTP/DB DTO.
  if(a.intent==='ANNOUNCEMENT_CREATE'&&
     (a.dto_body!==null||a.field!==null||JSON.stringify(a).includes('"announcementId"')))
      fail('ANNOUNCEMENT_CREATE_MUST_NOT_REQUIRE_EXISTING_ID');
  if(a.intent==='SYSTEM_MODEL_MAPPING_BIND'&&a.contract_class==='EXECUTABLE_TYPED_CI_SCHEMA'&&
     !JSON.stringify(a.dto_body).includes('vehicle_model_id'))
      fail('MODEL_MAPPING_MISSING_CANONICAL_TARGET');
  if(a.intent==='MARKUP_RULE_SAVE'&&a.contract_class==='EXECUTABLE_TYPED_CI_SCHEMA'&&
     !JSON.stringify(a.dto_body).includes('ranges'))
      fail('MARKUP_RULE_MISSING_RANGE_AND_VALUE');
 }
 const old=verifyCurrent(),f03=verifyCurrentRegistry();
 if(old.routes!==215||old.EVIDENCE_MATCHED!==23||old.SOURCE_GAP!==192||old.retired!==3||
    old.originalMethods!==218||old.paths!==198||old.colonPaths!==62||f03.contracts!==32)
    fail('FROZEN_F04_2_F04_3_CHANGED');
 const p02=read('07_重建工作区/PDM-02_最终完整规则.md').split('\n');
 if(!p02[29].includes('不建设')||!p02[31].includes('一个 4S 成员账号直接代表')||
    !p02[36].includes('hard DENY'))fail('FORGED_4S_ORGANIZATION');
 return {newCandidates:8,verifiedExecutableTypedContracts:typed,intentOnlySourceGapContracts:intentOnly,
         oldCandidates:215,oldUnproven:192,oldProven:23,retired:3};
}
export function validateCoverage(text=read(d+'Current全量动作覆盖与页面消费台账.tsv'),metaText=read(d+'Current覆盖计数与原文封印.json'),incrementText=read(d+'incremental-contracts.json')){
 const data=parse(text),meta=JSON.parse(metaText),inc=JSON.parse(incrementText);
 const signedByNav=new Map(loadContracts().filter(x=>Number(x.nav_line)>0).map(x=>[Number(x.nav_line),x]));
 const addedByNav=new Map(inc.actions.map(x=>[x.nav_line,x]));
 if(meta.version!=='F04_4_CURRENT_COVERAGE_V1'||meta.baseline!=='74fa9943062519310704f03e348aad9c85b27e1d'||
 meta.f04_3_frozen_contracts!==32||meta.types.join('|')!==classes.join('|'))fail('VERSION_DRIFT');
 const expected=new Map(),source={};
 for(const k of ['NAV','ACTION','GUARD','PAGE','RETIRED']){
  const raw=read(files[k]),lines=raw.split(/\r?\n/);source[k]=lines;
  const all=idx(k,lines);
  if(all.length!==meta.by_source[k])fail('SOURCE_INVENTORY_OMISSION');
  for(const entry of all)expected.set(k+':'+entry.n,{...entry,k});
 }
 if(data.length!==expected.size||meta.total!==expected.size)fail('INCOMPLETE_COVERAGE');
 let counts=Object.fromEntries(classes.map(k=>[k,0])),seen=new Set();
 for(const row of data){
  if(seen.has(row.stable_key))fail('DUPLICATE_KEY');seen.add(row.stable_key);
  const raw=expected.get(row.source_kind+':'+row.source_line);
  if(!raw||row.stable_key!==semanticKey(row)||row.source_kind!==raw.k||Number(row.source_line)!==raw.n||
  row.source_original.replace(/\\t/g,'\t')!==raw.l||row.source_path!==files[raw.k]||row.version!=='CURRENT_2026_10_10')
   fail('TRUE_QUOTE_WRONG_ACTION_OR_OMISSION');
  const klass=raw.k==='NAV'?navClass(raw.l,raw.n,inc):
    raw.k==='ACTION'?raw.l.split('|')[3].trim()==='ACTION'?'CURRENT_ACTION_COVERAGE':'PAGE_NAV_ONLY':
    raw.k==='GUARD'?'DOMAIN_IMPLEMENTATION_BLOCKED':raw.k==='PAGE'?'PAGE_NAV_ONLY':'RETIRED_FORBIDDEN';
  if(row.classification!==klass||!Object.hasOwn(counts,klass))fail('NAV_READ_ONLY_MUTATION_FORGED');
  counts[klass]++;
  if(raw.k==='NAV'){
   const f=raw.l.split('|').slice(1,-1).map(x=>x.trim());
   if(row.source_page!==f[0]||row.control!==f[1]||row.target_page!==f[2]||
   row.object_state_guard!==f[3]||row.authority_review==='APPROVED'||
   row.legacy_bridge==='KEEP'||row.dto_state==='PRODUCTION')fail('NAV_SEMANTIC_CONDITION_DRIFT');
   const prior=signedByNav.get(raw.n),added=addedByNav.get(raw.n);
   if(prior&&(
      row.actor!==prior.subject||row.target_resource!==prior.resource_kind||
      row.legacy_bridge!==(prior.source_legacy_id||'SOURCE_GAP')||
      row.dto_state!==prior.dto_schema_ref||row.implementation_owner!==prior.owner))
     fail('SIGNED_NAV_ACTOR_RESOURCE_BRIDGE_DRIFT');
   if(!prior&&added&&(row.actor!==added.actor||row.target_resource!==added.resource||
       row.dto_state!==added.intent||row.implementation_owner!==added.owner))
     fail('ADDITIONAL_NAV_ACTOR_RESOURCE_BRIDGE_DRIFT');
  }
 }
 if(Object.entries(counts).some(([k,n])=>meta.counts[k]!==n)||
 Object.values(counts).reduce((a,b)=>a+b,0)!==meta.category_partition_sum)fail('CLASSIFICATION_COUNT');
 if(meta.page_manifest_declared_carriers!==140||meta.page_manifest_enumerated_current_rows!==132||meta.page_manifest_unresolved_carrier_delta!==8||!meta.page_manifest_discrepancy_state?.startsWith('SOURCE_GAP_'))fail('UNRECONCILED_PAGE_MANIFEST_CARRIER_DELTA');
 if(meta.legacy_originals?.candidates!==215||meta.legacy_originals?.source_gap!==192||
 meta.legacy_originals?.retired!==3)fail('LEGACY_SOURCE_GAP_FAKE_APPROVAL');
 for(const [k,m] of Object.entries(meta.source_meta||{})){
  if(!files[k]||m.file!==files[k]||read(m.file).length!==m.length||(source[k]??read(m.file).split(/\r?\n/)).length!==m.lines)fail('UPSTREAM_SOURCE_DRIFT');
 }
 const checked=validateIncremental(incrementText);
 return {total:data.length,counts,sourceCounts:meta.by_source,...checked,sourceSha256:Object.fromEntries(Object.entries(files).map(([k,p])=>[k,createHash('sha256').update(read(p)).digest('hex')]))};
}
export const verifyCoverage=()=>validateCoverage();
