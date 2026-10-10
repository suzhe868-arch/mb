// F04-3：读真实当前PDM/IA/Low-Fi及F04-2冻结证据，不通过旧URL授权新端点。
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {verifyCurrent,splitTsv} from '../authority-route-mapping/source-verifier.mjs';
import {ACTION_PROOFS} from '../authority-route-mapping/action-semantic-contract.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>readFileSync(join(root,p),'utf8');
const base='engineering/f04/current-action-api-registry/';
export const loadContracts=()=>splitTsv(read(base+'current-route-contracts.tsv'));
const fail=(code,id='')=>{throw Error(code+(id?'_'+id:''))};
const forbidden=['/admin/integrations/collector/connection','/admin/integrations/collector/connection:test'];
const nav='03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md';
const page='03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md';
const matrixFile='engineering/f04/authority-route-mapping/current-authority-route-matrix.tsv';
const norm=p=>p.replace(/\{[^/}]+\}/g,'{id}').toLowerCase();
export function validateRegistry(contractText=read(base+'current-route-contracts.tsv'),
  specText=read(base+'current-openapi.json'),bridgeText=read(base+'旧接口与Current动作桥接.tsv')){
 const oldSummary=verifyCurrent();
 if(oldSummary.routes!==215||oldSummary.retired!==3||
    oldSummary.EVIDENCE_MATCHED!==23||oldSummary.SOURCE_GAP!==192||
    oldSummary.originalMethods!==218||oldSummary.paths!==198||oldSummary.colonPaths!==62)
   fail('F04_3_FROZEN_SOURCE_COUNT');
 const mapping=splitTsv(read(matrixFile));
 const index=new Map(mapping.map(r=>[r.legacy_id,r]));
 const contracts=splitTsv(contractText),bridge=splitTsv(bridgeText);
 if(contracts.length!==30||bridge.length!==215)fail('F04_3_30_215_COUNT');
 let verified=0,fresh=0,scoped=0;
 const seen=new Set(),templates=new Set(),sourceRows=new Set(),sourceCache=new Map();
 const lineAt=(path,num)=>{
  if(!path||!Number.isSafeInteger(Number(num))||Number(num)<1)return null;
  if(!sourceCache.has(path))try{sourceCache.set(path,read(path).split(/\r?\n/))}catch{return null}
  return sourceCache.get(path)[Number(num)-1]||null;
 };
 const spec=JSON.parse(specText);
 if(spec.openapi!=='3.1.0'||spec.servers.length!==1||
    spec.servers[0].url!=='https://127.0.0.1:48983'||!spec.components?.securitySchemes?.isolatedPcSession)fail('F04_3_OPENAPI_ROOT');
 let specCount=0;
 for(const [path,obj] of Object.entries(spec.paths||{})){
  for(const [method,def] of Object.entries(obj)){
   if(!['get','post','put','patch','delete'].includes(method))fail('F04_3_UNKNOWN_METHOD_IN_SPEC');
   specCount++;
   const r=contracts.find(x=>x.path===path&&x.method.toLowerCase()===method);
   if(!r||r.action_id!==def.operationId||def['x-not-production']!==true||def['x-current-ci-only']!==true||
      def['x-owner']!==r.owner||def['x-pdm-line']!==Number(r.pdm_line)||
      def['x-domain-implementation-state']!==r.domain_implementation_status)fail('F04_3_OPENAPI_CONTRACT_DRIFT');
   if(Object.hasOwn(def.responses||{},'200')!==(r.intent==='CRM_SCOPE_MINIMAL_PROOF'))
      fail('F04_3_UNAPPROVED_200_RESPONSE');
  }
 }
 if(specCount!==contracts.length)fail('F04_3_OPENAPI_COVERAGE');
 for(const r of contracts){
  if(!/^CURRENTACTION_[A-Z0-9_]+$/.test(r.action_id)||seen.has(r.action_id))fail('F04_3_DUPLICATE_OPERATION',r.action_id);
  seen.add(r.action_id);
  if(!['GET','POST','PUT','PATCH','DELETE'].includes(r.method)||!/^\/__ci__\/current\/v1\/[a-z0-9_{}\/-]+$/.test(r.path)||
     /\/\.\.?($|\/)|\/\//.test(r.path)||forbidden.some(x=>r.path.includes(x))||
     /\/(customer|staff|admin)\//.test(r.path)||r.path.includes(':'))fail('F04_3_LEGACY_ROUTE_RESURRECTION',r.action_id);
  const key=r.method+' '+norm(r.path);
  if(templates.has(key))fail('F04_3_TEMPLATE_COLLISION',r.action_id);
  templates.add(key);
  if(r.contract_owner||r.legacy_status==='KEEP'||r.http_contract_review_state!=='NOT_APPROVED'||
     r.production_enablement_status!=='NOT_PRODUCTION'||r.product_authority_evidence==='APPROVED'||
     !['CI_ONLY_PROPOSED','CI_ONLY_TESTED'].includes(r.ci_route_test_status))
    fail('F04_3_FAKE_AUTHORIZATION',r.action_id);
  if(!r.request_dto.startsWith('v1:')||!r.response_dto.startsWith('v1:')||
     !r.scope||!r.deny||!r.owner||!r.permission||r.domain_implementation_status==='PRODUCTION')
    fail('F04_3_UNDEFINED_DTO_PERMISSION',r.action_id);
  if(!r.pdm_file.startsWith('07_重建工作区/PDM-')||
     !r.page_file.startsWith('03_证据_C_IA_V5_Current/'))fail('F04_3_INVALID_AUTHORITY_PATH',r.action_id);
  if(!lineAt(r.pdm_file,r.pdm_line)||!lineAt(r.page_file,r.page_line)?.startsWith('| '+r.page_id+' |'))
    fail('F04_3_FAKE_PDM_PAGE',r.action_id);
  if(r.source_kind==='F04_2_VERIFIED_CURRENT_ACTION'){
   verified++;sourceRows.add(r.source_legacy_id);
   const prev=index.get(r.source_legacy_id),p=ACTION_PROOFS[r.source_legacy_id];
   if(!p||!prev||prev.mapping_evidence!=='EVIDENCE_MATCHED'||
      r.pdm_file!==p.pdmFile||r.pdm_line!==String(p.pdmLine)||
      r.nav_line!==String(p.navLine)||r.page_line!==String(p.pageLine)||
      r.page_id!==p.pageId||r.intent!==p.intent||r.subject!==p.subject||
      r.method!==prev.method||r.owner!==prev.business_implementation_owner||
      r.nav_action!==p.navAction)fail('F04_3_VERIFIED_ACTION_DRIFT',r.action_id);
  }else if(r.source_kind==='NEW_CURRENT_ACTION'){
   fresh++;
   if(r.source_legacy_id||!r.nav_file||!r.nav_line||r.source_evidence_state!=='CURRENT_FINAL_IA_PAGE')
      fail('F04_3_NEW_ACTION_EVIDENCE_MISSING',r.action_id);
  }else if(r.source_kind==='F04_1_ACCEPTED_TECHNICAL_PROOF'){
   scoped++;
   if(r.intent!=='CRM_SCOPE_MINIMAL_PROOF'||r.method!=='GET'||r.subject!=='EMPLOYEE'||
      r.source_legacy_id||r.permission!=='crm.customer.view'||
      r.path!=='/__ci__/current/v1/objects/customers/{customerId}/proof'||
      r.domain_implementation_status!=='CI_ONLY_TESTED_MINIMAL_READ')
      fail('F04_3_CRM_PROOF_EXPANSION');
  }else fail('F04_3_INVENTED_ACTION_SOURCE',r.action_id);
  if(r.nav_file){
   if(r.nav_file!==nav||!lineAt(r.nav_file,r.nav_line)?.startsWith('| ')||
      lineAt(r.nav_file,r.nav_line).split('|')[2].trim()!==r.nav_action)
      fail('F04_3_WRONG_CURRENT_ACTION',r.action_id);
  }
 }
 if(verified!==23||fresh<5||scoped!==1||sourceRows.size!==23)fail('F04_3_ACTION_CLASS_COUNT');
 const ids=new Set();
 for(const b of bridge){
  const old=index.get(b.legacy_id);
  if(!old||ids.has(b.legacy_id)||old.method!==b.method||old.legacy_path!==b.legacy_path||
    old.mapping_evidence!==b.source_evidence||old.decision!==b.source_legacy_decision||
    old.domain_authority!==b.domain_authority||old.business_implementation_owner!==b.business_implementation_owner||
    b.source_legacy_decision!=='UNDECIDED')fail('F04_3_BRIDGE_DRIFT',b.legacy_id);
  const contract=contracts.find(x=>x.source_legacy_id===b.legacy_id);
  if((contract?.action_id||'')!==b.current_action_contract||
     b.current_route_status!==(contract?'NOT_APPROVED':'NO_CURRENT_CONTRACT'))
    fail('F04_3_BRIDGE_APPROVAL',b.legacy_id);
  ids.add(b.legacy_id);
 }
 const retired=splitTsv(read(base+'旧Collector禁恢复独立封印.tsv'));
 if(retired.length!==3||retired.some(x=>x.decision!=='RETIRE/FORBIDDEN'))fail('F04_3_RETIRED_DRIFT');
 return Object.freeze({contracts:30,verified:23,fresh,scoped,oldCandidates:215,oldSourceGap:192,retired:3,openapiOperations:specCount});
}
export const verifyCurrentRegistry=()=>validateRegistry();
