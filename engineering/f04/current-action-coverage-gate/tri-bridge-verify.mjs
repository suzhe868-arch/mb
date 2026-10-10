// F04-4 signed tri-way provenance: 215 historical -> 32 frozen F04-3 -> 8 additional CI proposals, and 3 retired.
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {loadIncremental} from './coverage-verify.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const d='engineering/f04/current-action-coverage-gate/';
const paths={bridge:'engineering/f04/current-action-api-registry/旧接口与Current动作桥接.tsv',
 signed:'engineering/f04/current-action-api-registry/current-route-contracts.tsv',
 retired:'engineering/f04/current-action-api-registry/旧Collector禁恢复独立封印.tsv'};
const read=p=>readFileSync(join(root,p),'utf8');
const parse=s=>{const [h,...lines]=s.trimEnd().split('\n'),keys=h.split('\t');return lines.map((line,i)=>({...Object.fromEntries(line.split('\t').map((v,j)=>[keys[j],v])),line:i+2}))};
const fail=s=>{throw Error('F04_4_TRI_BRIDGE_'+s)};
export const loadTriBridge=()=>parse(read(d+'Current旧新三向可追溯台账.tsv'));
export function verifyTriBridge(source=read(d+'Current旧新三向可追溯台账.tsv')){
 const data=parse(source),old=parse(read(paths.bridge)),signed=parse(read(paths.signed)),retired=parse(read(paths.retired)),extra=loadIncremental().actions;
 if(data.length!==258||old.length!==215||signed.length!==32||retired.length!==3||extra.length!==8)fail('COUNT');
 const byKind=k=>data.filter(r=>r.relation_kind===k);
 const oldRows=byKind('LEGACY_HISTORICAL'),signedRows=byKind('F04_3_SIGNED_CI_PROPOSAL'),extraRows=byKind('F04_4_ADDITIONAL_CI_PROPOSAL'),retRows=byKind('RETIRED_FORBIDDEN');
 if(oldRows.length!==215||signedRows.length!==32||extraRows.length!==8||retRows.length!==3)fail('PARTITION');
 const ids=new Set();
 for(let i=0;i<215;i++){
  const s=old[i],r=oldRows[i],contract=signed.find(x=>x.source_legacy_id===s.legacy_id);
  if(r.source_file!==paths.bridge||r.source_record_id!==s.legacy_id||Number(r.source_line)!==s.line||
   r.old_method!==s.method||r.old_path!==s.legacy_path||
   r.old_decision!=='UNDECIDED'||r.old_evidence!==s.source_evidence||
   r.current_action_id!==(s.current_action_contract||'SOURCE_GAP')||
   r.bridge_match_state!==(s.source_evidence==='EVIDENCE_MATCHED'?'CURRENT_SAME_ACTION_PROOF_NOT_URL_AUTHORIZATION':'SOURCE_GAP')||
   r.new_candidate_path!=='NO_APPROVED_LEGACY_URL'||r.contract_state!=='CONTRACT_ONLY_UNDECIDED'||
   r.production_state!=='NOT_PRODUCTION'||s.source_legacy_decision!=='UNDECIDED'||
   r.domain_owner!==s.business_implementation_owner||
   (contract?.action_id||'')!==s.current_action_contract)
   fail('FAKE_OLD_AUTHORITY_'+s.legacy_id);
  if(ids.has('O'+r.source_record_id))fail('DUPLICATE_LEGACY');ids.add('O'+r.source_record_id);
 }
 if(oldRows.filter(x=>x.old_evidence==='EVIDENCE_MATCHED').length!==23||
 oldRows.filter(x=>x.old_evidence==='SOURCE_GAP').length!==192)fail('OLD_SOURCE_GAP_COUNT');
 for(let i=0;i<32;i++){
  const s=signed[i],r=signedRows[i];
  if(r.source_file!==paths.signed||r.source_record_id!==s.action_id||
   Number(r.source_line)!==s.line||r.current_action_id!==s.action_id||
   r.current_actor!==s.subject||r.current_resource!==s.resource_kind||
   r.current_domain!==s.domain_authority||r.domain_owner!==s.owner||
   r.new_candidate_path!==s.path||r.contract_state!=='NOT_APPROVED'||
   r.scope_state!==s.authentication_contract+'|'+s.scope||
   r.production_state!=='NOT_PRODUCTION'||s.production_enablement_status!=='NOT_PRODUCTION'||
   r.historical_fact!=='F04_3_SIGNED_TECHNICAL_CI_ONLY')
   fail('SIGNED_32_BASELINE_DRIFT_'+s.action_id);
 }
 for(let i=0;i<8;i++){
  const s=extra[i],r=extraRows[i];
  if(r.source_file!==d+'incremental-contracts.json'||r.source_record_id!==s.id||
   Number(r.source_line)!==i+1||r.current_action_id!==s.id||
   r.current_actor!==s.actor||r.current_resource!==s.resource||
   r.current_domain!==s.domain||r.domain_owner!==s.owner||r.scope_state!==s.scope||
   r.new_candidate_path!==s.path||r.contract_state!=='CI_ONLY_PROPOSED_NOT_PRODUCTION'||
   r.production_state!=='NOT_PRODUCTION'||r.old_decision!=='NO_LEGACY_KEEP')
   fail('EXTRA_SCOPE_OR_PRODUCT_APPROVAL_'+s.intent);
 }
 for(let i=0;i<3;i++){
  const s=retired[i],r=retRows[i];
  if(r.source_file!==paths.retired||r.source_record_id!==s.legacy_id||
   Number(r.source_line)!==s.line||r.old_method!==s.method||r.old_path!==s.old_path||
   s.decision!=='RETIRE/FORBIDDEN'||r.old_decision!=='RETIRE/FORBIDDEN'||
   r.new_candidate_path!=='NO_CURRENT_CONTRACT'||r.contract_state!=='FORBIDDEN'||
   r.production_state!=='NEVER'||r.scope_state!=='HARD_DENY')
   fail('COLLECTOR_RESTORATION_'+s.legacy_id);
 }
 return Object.freeze({rows:258,old:215,oldMatched:23,oldGap:192,signed:32,additional:8,retired:3,productionRoutes:0,allOldUndecided:true});
}
