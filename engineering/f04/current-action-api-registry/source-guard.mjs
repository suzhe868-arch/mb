// F04-3 A二轮整改：Current业务动作/真实证据/资源级路由/独立身份/逐字段DTO/OpenAPI双向严格封印。仅CI使用。
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyCurrent,splitTsv} from '../authority-route-mapping/source-verifier.mjs';
import {ACTION_PROOFS} from '../authority-route-mapping/action-semantic-contract.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const BASE='engineering/f04/current-action-api-registry/';
const read=p=>readFileSync(join(ROOT,p),'utf8');
const failed=(code,id='')=>{throw Error(code+(id?'_'+id:''))};
const fileLines=new Map();
function lineAt(path,line){
 if(!path||!/^\d+$/.test(String(line))||Number(line)<1)return null;
 if(!fileLines.has(path))try{fileLines.set(path,read(path).split(/\r?\n/))}catch{return null}
 return fileLines.get(path)[Number(line)-1]??null;
}
export const loadContracts=()=>splitTsv(read(BASE+'current-route-contracts.tsv'));
export const loadDto=()=>JSON.parse(read(BASE+'dto-contract-lock.json'));
export const loadSemantic=()=>JSON.parse(read(BASE+'current-action-semantic-lock.json'));
const NAV='03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md';
const PAGE='03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md';
const SOURCE='engineering/f04/authority-route-mapping/current-authority-route-matrix.tsv';
const rejectFields=/^(vin|phone|mobile|password|token|publisherPhone|upstreamPhone|internalWholesalePrice|baseWholesalePrice|accessToken|authorization|customerLevelOverride|merchantId)$/i;
const canonicalRoutes=Object.freeze({
 FAVORITE_TOGGLE:'/favorites/vehicles',CONSULTATION_CREATE:'/consultations/create',
 WAITLIST_REGISTER:'/waitlists/register',CONSULTATION_PROCESS:'/consultations/start-processing',
 CONSULTATION_RESOLVE:'/consultations/resolve',CONSULTATION_INVALIDATE:'/consultations/invalidate',
 CONSULTATION_REASSIGN:'/consultations/reassign',VEHICLE_PUBLISH:'/vehicles/publish',
 PUBLISHER_PHONE_REFRESH:'/publisher-phone/refresh',VEHICLE_CONVERT_SOURCE:'/vehicles/convert-mingbang',
 PUBLIC_POOL_PUT:'/public-pool/put',EMPLOYEE_DEACTIVATE:'/employee-governance/business-deactivate',
 EMPLOYEE_REACTIVATE:'/employee-governance/business-reactivate',PERMISSION_OVERRIDE:'/employee-governance/permission-override',
 DATA_SCOPE_CONFIG:'/employee-governance/data-scope',RECEIVING_CONFIG:'/employees/receiving-config',
 ANNOUNCEMENT_ENABLE:'/announcements/enable',ANNOUNCEMENT_DISABLE:'/announcements/disable',
 BANNER_CREATE:'/banners/create',BANNER_EDIT:'/banners/edit',BANNER_ENABLE:'/banners/enable',BANNER_DISABLE:'/banners/disable',
 LOCKREQUEST_PENDING_CREATE:'/lockrequests/request-pending',LOCKREQUEST_REVIEW_OPEN:'/lockrequests/{lockRequestId}/review-open',
 APPLICATION_PENDING_WITHDRAW:'/applications/withdraw-pending',EMPLOYEE_SELF_RECEIVING:'/employees/self-receiving',
 PRICE_QUOTA_CONFIG:'/price-entitlements/daily-quota',CONSULTATION_NORMAL_CLOSE:'/consultations/normal-close',
 SYSTEM_ADMIN_EMPLOYEE_DISABLE:'/employee-governance/control-plane-deactivate',
 SYSTEM_ADMIN_EMPLOYEE_ENABLE:'/employee-governance/control-plane-enable',
 CRM_SCOPE_MINIMAL_PROOF:'/objects/customers/{customerId}/proof'
});
const FRESH=Object.freeze({
 LOCKREQUEST_PENDING_CREATE:['CUSTOMER','LockRequest','PENDING','PDM-18','F06',75,56,'C01-01'],
 LOCKREQUEST_REVIEW_OPEN:['EMPLOYEE','LockRequest','PENDING_REVIEW','PDM-18','F06',269,80,'E07-08'],
 APPLICATION_PENDING_WITHDRAW:['CUSTOMER','Application','pending','PDM-11','F06',270,73,'C02-01'],
 EMPLOYEE_SELF_RECEIVING:['EMPLOYEE','Employee.own_receiving','active_eligible','PDM-02','F04',274,210,'E01'],
 PRICE_QUOTA_CONFIG:['EMPLOYEE_MANAGER','CustomerLevel.daily_price_quota','UTC8_configured','PDM-10','F05',287,188,'P08-02'],
 CONSULTATION_NORMAL_CLOSE:['EMPLOYEE','Consultation','resolved.NORMAL_CLOSED','PDM-15','OWNER_REVIEW_GAP',129,502,'E06-02'],
 SYSTEM_ADMIN_EMPLOYEE_DISABLE:['SYSTEM_ADMIN','EmployeeAccount','inactive','PDM-02','F04',275,91,'P04-01'],
 SYSTEM_ADMIN_EMPLOYEE_ENABLE:['SYSTEM_ADMIN','EmployeeAccount','active','PDM-02','F04',275,91,'P04-01']
});
const authOf=s=>s==='CUSTOMER'?'CUSTOMER_AUTH_DEPENDENCY_BLOCKED':
 s==='SYSTEM_ADMIN'?'SYSTEM_ADMIN_CONTROL_PLANE_PC':
 s==='EMPLOYEE_MANAGER'?'MANAGER_CAPABILITY_SCOPE_REQUIRED':
 s==='AUTHORIZED_ADMIN'?'BUSINESS_CONTENT_MANAGER_CAPABILITY_REQUIRED':'EMPLOYEE_BUSINESS_PC_CAPABILITY_REQUIRED';
function validShape(schema,value){
 if(!schema||typeof schema!=='object')return false;
 if(schema.const!==undefined&&value!==schema.const)return false;
 if(schema.enum&&!schema.enum.includes(value))return false;
 if(schema.type==='object'){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const props=schema.properties||{};
  if(schema.additionalProperties===false&&Object.keys(value).some(k=>!Object.hasOwn(props,k)))return false;
  if((schema.required||[]).some(k=>!Object.hasOwn(value,k)))return false;
  return Object.entries(value).every(([k,v])=>props[k]?validShape(props[k],v):schema.additionalProperties!==false);
 }
 if(schema.type==='integer')return Number.isSafeInteger(value)&&(schema.minimum===undefined||value>=schema.minimum)&&(schema.maximum===undefined||value<=schema.maximum);
 if(schema.type==='string')return typeof value==='string'&&(schema.minLength===undefined||value.length>=schema.minLength);
 if(schema.type==='boolean')return typeof value==='boolean';
 if(schema.type==='number')return typeof value==='number'&&Number.isFinite(value);
 return false;
}
export function validateDtoValue(actionId,payload,kind='request',status='501',dtoText=read(BASE+'dto-contract-lock.json')){
 const models=JSON.parse(dtoText).schemas;
 const model=models.find(x=>x.actionId===actionId);
 if(!model)return false;
 if(kind==='request')return validShape(model.request.schema,payload);
 return validShape(model.responseSchemas[status],payload);
}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const norm=p=>p.replace(/\{[^/}]+\}/g,'{id}').toLowerCase();
export function validateRegistry(
 contractText=read(BASE+'current-route-contracts.tsv'),
 specText=read(BASE+'current-openapi.json'),
 bridgeText=read(BASE+'旧接口与Current动作桥接.tsv'),
 dtoText=read(BASE+'dto-contract-lock.json'),
 semanticText=read(BASE+'current-action-semantic-lock.json')){
 const s=verifyCurrent();
 if(!equal({r:s.routes,ret:s.retired,matched:s.EVIDENCE_MATCHED,gap:s.SOURCE_GAP,methods:s.originalMethods,paths:s.paths,colon:s.colonPaths},
 {r:215,ret:3,matched:23,gap:192,methods:218,paths:198,colon:62}))failed('F04_3_FROZEN_SOURCE_COUNT');
 const prior=splitTsv(read(SOURCE)),ix=new Map(prior.map(x=>[x.legacy_id,x]));
 const rows=splitTsv(contractText),bridge=splitTsv(bridgeText);
 const models=JSON.parse(dtoText),sem=JSON.parse(semanticText);
 const spec=JSON.parse(specText);
 if(rows.length!==32||bridge.length!==215||models.schemas.length!==32||
  models.version!=='F04_3_DTO_V2_CI_ONLY'||sem.version!=='F04_3_CURRENT_SEMANTIC_V2')
   failed('F04_3_CONTRACT_DTO_SEMANTIC_COUNT');
 if(spec.openapi!=='3.1.0'||spec.servers?.length!==1||spec.servers[0].url!=='https://127.0.0.1:48983'||
   !spec.components?.securitySchemes?.employeePcSession||!spec.components.securitySchemes.systemAdminControlSession||
   !spec.components.securitySchemes.futureCustomerSessionBlocked?.['x-runtime-disabled'])
   failed('F04_3_OPENAPI_ROOT_AUTH_DRIFT');
 const entries=new Map(rows.map(x=>[x.action_id,x]));
 const types=new Map(models.schemas.map(x=>[x.actionId,x]));
 if(entries.size!==32||types.size!==32||Object.keys(sem.entries).length!==8)failed('F04_3_DUPLICATE_MODEL');
 let verified=0,fresh=0,scoped=0,control=0,count=0;
 const seen=new Set(),templates=new Set(),matchedLegacy=new Set();
 for(const [path,methods] of Object.entries(spec.paths||{})){
  for(const [method,op] of Object.entries(methods)){
   count++;
   const r=rows.find(x=>x.path===path&&x.method.toLowerCase()===method);
   if(!r||!op||r.action_id!==op.operationId||op['x-current-ci-only']!==true||op['x-not-production']!==true||
    op['x-owner']!==r.owner||op['x-resource-kind']!==r.resource_kind||
    op['x-pdm-line']!==Number(r.pdm_line)||op['x-authentication-contract']!==r.authentication_contract||
    op['x-dto-schema-ref']!==r.dto_schema_ref||op['x-domain-implementation-state']!==r.domain_implementation_status)
     failed('F04_3_OPENAPI_CONTRACT_DRIFT');
   const dto=types.get(r.action_id);if(!dto)failed('F04_3_DTO_MODEL_MISSING',r.action_id);
   const scheme=r.authentication_contract==='CUSTOMER_AUTH_DEPENDENCY_BLOCKED'?null:
    r.authentication_contract==='SYSTEM_ADMIN_CONTROL_PLANE_PC'?'systemAdminControlSession':
    r.authentication_contract==='MANAGER_CAPABILITY_SCOPE_REQUIRED'?'managerEmployeePcSession':'employeePcSession';
   if(scheme){
    if(!equal(op.security,[{[scheme]:[]}])||op['x-customer-authentication-dependency'])
     failed('F04_3_AUTH_SCHEME_MISMATCH',r.action_id);
   }else{
    if(!equal(op.security,[])||op['x-customer-authentication-dependency']?.status!=='BLOCKED'||
     op['x-customer-authentication-dependency']?.pcEmployeeCookie!=='HARD_DENY')
     failed('F04_3_CUSTOMER_PC_AUTH_FALSE_CLAIM',r.action_id);
   }
   const expectedParam=r.intent==='LOCKREQUEST_REVIEW_OPEN'?[{name:'lockRequestId',in:'path',required:true,schema:{type:'integer',minimum:1,maximum:9007199254740991}}]:r.intent==='CRM_SCOPE_MINIMAL_PROOF'?[{name:'customerId',in:'path',required:true,schema:{type:'integer',minimum:1}}]:undefined;
   if(!equal(op.parameters,expectedParam))failed('F04_3_OBJECT_PATH_DTO_PARAMETER_DRIFT',r.action_id);
   const isBody=r.method!=='GET'&&r.method!=='DELETE';
   if(isBody){
    if(!equal(op.requestBody?.content?.['application/json']?.schema,dto.request.schema)||
       op.requestBody?.required!==true)failed('F04_3_REQUEST_DTO_SCHEMA_DRIFT',r.action_id);
   }else if(op.requestBody)failed('F04_3_UNEXPECTED_BODY_SCHEMA',r.action_id);
   const actual=Object.fromEntries(Object.entries(op.responses||{}).map(([status,value])=>[status,value.content?.['application/json']?.schema]));
   if(!equal(actual,dto.responseSchemas)||Object.hasOwn(actual,'200')!==(r.intent==='CRM_SCOPE_MINIMAL_PROOF'))
    failed('F04_3_RESPONSE_DTO_SCHEMA_DRIFT',r.action_id);
  }
 }
 if(count!==rows.length||Object.keys(spec.paths||{}).length<29)failed('F04_3_OPENAPI_COVERAGE');
 for(const r of rows){
  if(!/^CURRENTACTION_[A-Z0-9_]+$/.test(r.action_id)||seen.has(r.action_id))failed('F04_3_DUPLICATE_OPERATION',r.action_id);
  seen.add(r.action_id);
  if(!['GET','POST','PUT','PATCH','DELETE'].includes(r.method)||!/^\/__ci__\/current\/v1\/[a-zA-Z0-9_{}\/-]+$/.test(r.path)||
    r.path!=='/__ci__/current/v1/'+canonicalRoutes[r.intent]?.replace(/^\//,'')||
    /\.\.|%2f|%5c|:|\?/.test(r.path))failed('F04_3_NON_CURRENT_RESOURCE_ROUTE',r.action_id);
  const key=r.method+' '+norm(r.path);if(templates.has(key))failed('F04_3_TEMPLATE_COLLISION',r.action_id);templates.add(key);
  if(r.http_contract_review_state!=='NOT_APPROVED'||r.production_enablement_status!=='NOT_PRODUCTION'||
   r.current_action_contract_state!=='CI_ONLY_PROPOSED_NOT_REVIEWED'||
   r.contract_owner||r.legacy_status==='KEEP'||!['CI_ONLY_TESTED','CI_ONLY_PROPOSED'].includes(r.ci_route_test_status))
   failed('F04_3_FAKE_AUTHORIZATION',r.action_id);
  if(!r.request_dto.startsWith('v2:typed:DTO_'+r.action_id+':request')||
   r.response_dto!=='v2:typed:DTO_'+r.action_id+':responses'||
   r.dto_schema_ref!=='DTO_'+r.action_id||r.authentication_contract!==authOf(r.subject)||
   !r.field_authority_state||!r.permission||!r.scope||!r.owner||!r.domain_authority)
   failed('F04_3_DTO_ACTOR_CONTRACT_DRIFT',r.action_id);
  if(!lineAt(r.pdm_file,r.pdm_line)||!lineAt(r.page_file,r.page_line)?.startsWith('| '+r.page_id+' |'))
   failed('F04_3_FAKE_PDM_PAGE',r.action_id);
  const dto=types.get(r.action_id);
  if(!dto||dto.id!==r.dto_schema_ref||dto.intent!==r.intent||
   dto.actor!==r.subject||dto.domain!==r.domain_authority||
   dto.resourceKind!==r.resource_kind||dto.authenticationContract!==r.authentication_contract||
   dto.status!=='CI_ONLY_NOT_PRODUCTION'||dto.evidenceRef!==r.semantic_proof_ref||
   dto.request.needsDownstreamImplementation!==(r.intent!=='CRM_SCOPE_MINIMAL_PROOF')||
   dto.request.bodyAllowedByRuntime!==false)failed('F04_3_DTO_IDENTITY_DRIFT',r.action_id);
  const sch=dto.request.schema,props=sch?.properties;
  if(sch?.type!=='object'||sch.additionalProperties!==false||
   !props||!equal(sch.required,Object.keys(props))||!Array.isArray(dto.request.fieldSources)||
   dto.request.fieldSources.length!==Object.keys(props).length||
   dto.request.fieldSources.some(x=>!Object.hasOwn(props,x.field)||!lineAt(x.authorityFile,x.authorityLine)||
      x.authorityFile!==r.pdm_file||x.evidenceState==='APPROVED_PRODUCTION')||
   Object.keys(props).some(k=>rejectFields.test(k)))failed('F04_3_FIELD_WHITELIST_GAP',r.action_id);
  for(const [k,v] of Object.entries(props)){
   if(!['integer','string','boolean'].includes(v.type)||
      !equal(dto.request.fieldSources.find(x=>x.field===k)?.type,v.type))
      failed('F04_3_FIELD_TYPE_DRIFT',r.action_id);
  }
  if(!dto.responseSchemas['403']||!dto.responseSchemas['501']||
    Object.values(dto.responseSchemas).some(x=>x.additionalProperties!==false||
      !equal(x.required,['code'])&&r.intent!=='CRM_SCOPE_MINIMAL_PROOF'))
    failed('F04_3_RESPONSE_FIELD_ALLOWLIST',r.action_id);
  if(r.source_kind==='F04_2_VERIFIED_CURRENT_ACTION'){
   verified++;matchedLegacy.add(r.source_legacy_id);
   const prev=ix.get(r.source_legacy_id),p=ACTION_PROOFS[r.source_legacy_id];
   if(!p||!prev||prev.mapping_evidence!=='EVIDENCE_MATCHED'||r.intent!==p.intent||
     r.pdm_file!==p.pdmFile||r.pdm_line!==String(p.pdmLine)||
     r.nav_line!==String(p.navLine)||r.page_line!==String(p.pageLine)||
     r.nav_action!==p.navAction||r.subject!==p.subject||r.method!==prev.method||
     r.owner!==prev.business_implementation_owner)
     failed('F04_3_FROZEN_ACTION_DRIFT',r.action_id);
  }else if(r.source_kind==='NEW_CURRENT_ACTION'||r.source_kind==='NEW_CONTROL_PLANE_ACTION'){
   if(r.source_kind==='NEW_CURRENT_ACTION')fresh++;else control++;
   const q=FRESH[r.intent],e=sem.entries[r.intent];
   if(!q||!e||r.source_legacy_id||
     r.subject!==q[0]||e.actor!==q[0]||e.resource!==q[1]||
     e.objectState!==q[2]||e.domain!==q[3]||r.domain_authority!==q[3]||
     e.implementationOwner!==q[4]||r.owner!==q[4]||
     Number(r.nav_line)!==q[5]||Number(r.pdm_line)!==q[6]||
     r.page_id!==q[7]||e.pageId!==q[7]||
     Number(e.navLine)!==q[5]||Number(e.pdmLine)!==q[6]||
     e.navFile!==NAV||e.pageFile!==PAGE||e.pdmFile!==r.pdm_file||
     e.navText!==lineAt(NAV,e.navLine)||e.pdmText!==lineAt(e.pdmFile,e.pdmLine)||
     e.pageText!==lineAt(PAGE,e.pageLine)||
     e.navText.split('|')[2].trim()!==r.nav_action||
     !e.navText.includes('| '+r.nav_action+' |'))
     failed('F04_3_CURRENT_SEMANTIC_MISMATCH',r.action_id);
   if(r.source_kind==='NEW_CONTROL_PLANE_ACTION'&&
       (r.subject!=='SYSTEM_ADMIN'||r.authentication_contract!=='SYSTEM_ADMIN_CONTROL_PLANE_PC'||
       !e.pdmText.includes('员工账号')))failed('F04_3_CONTROL_PLANE_AUTHORITY_MISMATCH');
   if(r.source_kind==='NEW_CURRENT_ACTION'&&r.subject==='SYSTEM_ADMIN')
     failed('F04_3_CONTROL_PLANE_ROLE_CONFUSION');
  }else if(r.source_kind==='F04_1_ACCEPTED_TECHNICAL_PROOF'){
   scoped++;
   if(r.intent!=='CRM_SCOPE_MINIMAL_PROOF'||r.permission!=='crm.customer.view'||
    r.path!=='/__ci__/current/v1/objects/customers/{customerId}/proof'||
    r.scope!=='F04_1_FROZEN_PHYSICAL_EXACT_CUSTOMER_OBJECT_SCOPE'||
    r.domain_implementation_status!=='CI_ONLY_TESTED_MINIMAL_READ'||r.subject!=='EMPLOYEE')
    failed('F04_3_CRM_SCOPE_PROOF_EXPANSION');
  }else failed('F04_3_UNKNOWN_CURRENT_AUTHORITY',r.action_id);
  if(r.nav_file&&(!lineAt(r.nav_file,r.nav_line)?.startsWith('| ')||
      lineAt(r.nav_file,r.nav_line).split('|')[2].trim()!==r.nav_action))
    failed('F04_3_NAV_ACTION_NOT_SAME',r.action_id);
 }
 if(verified!==23||fresh!==6||scoped!==1||control!==2||matchedLegacy.size!==23)
   failed('F04_3_ACTION_COUNTS_OR_CONTROL_PLANE');
 const visited=new Set();
 for(const b of bridge){
  const old=ix.get(b.legacy_id);
  if(!old||visited.has(b.legacy_id)||b.source_legacy_decision!=='UNDECIDED'||
   b.legacy_path!==old.legacy_path||b.method!==old.method||b.source_evidence!==old.mapping_evidence||
   b.business_implementation_owner!==old.business_implementation_owner||
   b.domain_authority!==old.domain_authority)failed('F04_3_LEGACY_BRIDGE_MISMATCH',b.legacy_id);
  const candidate=rows.find(x=>x.source_legacy_id===b.legacy_id);
  if(b.current_action_contract!==(candidate?.action_id||'')||
   b.current_route_status!==(candidate?'NOT_APPROVED':'NO_CURRENT_CONTRACT'))
   failed('F04_3_LEGACY_BRIDGE_FAKE_APPROVAL',b.legacy_id);
  visited.add(b.legacy_id);
 }
 const retired=splitTsv(read(BASE+'旧Collector禁恢复独立封印.tsv'));
 if(retired.length!==3||retired.some(x=>x.decision!=='RETIRE/FORBIDDEN'))failed('F04_3_COLLECTOR_RESTORE_BLOCK');
 return Object.freeze({contracts:rows.length,verified,fresh,scoped,control,oldCandidates:215,oldSourceGap:192,retired:3,openapiOperations:count,allDtoTyped:true,customerAuthBlocked:true});
}
export const verifyCurrentRegistry=()=>validateRegistry();
