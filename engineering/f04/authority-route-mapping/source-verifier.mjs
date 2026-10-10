// F04-2: verify actual main-source bytes, evidence lines, and the 215/3 split.
// No generated authority or historical OpenAPI may grant a live HTTP route.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
import {ACTION_PROOFS,currentBusinessDomain} from './action-semantic-contract.mjs';
import {parseLegacyOpenApi,assertLegacyDecision} from '../contract-gate/parse-legacy-openapi.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const read=p=>readFileSync(join(root,p),'utf8');
export const splitTsv=src=>{
 const lines=src.trimEnd().split(/\r?\n/),headers=lines.shift().split('\t');
 if(new Set(headers).size!==headers.length)throw Error('F04_2_DUPLICATE_TSV_COLUMN');
 return lines.map((line,index)=>{
  const vals=line.split('\t');if(vals.length!==headers.length)throw Error('F04_2_TSV_SHAPE_'+index);
  return Object.fromEntries(headers.map((key,i)=>[key,vals[i]]));
 });
};
const source='09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml';
const old='engineering/f04/contract-gate/legacy-endpoint-inventory.tsv';
const current='engineering/f04/authority-route-mapping/current-authority-route-matrix.tsv';
const quoteCheck=(row,prefix,cache)=>{
 const path=row[prefix+'_file'],line=row[prefix+'_line'],quote=row[prefix+'_quote'];
 if(!path)return ((!line||line==='0')&&!quote);
 if(!path.startsWith(prefix==='pdm'?'07_重建工作区/PDM-':'03_证据_C_IA_V5_Current/'))return false;
 let lines=cache.get(path);
 if(!lines){try{lines=read(path).split(/\r?\n/);cache.set(path,lines)}catch{return false}}
 const n=Number(line);return Number.isSafeInteger(n)&&n>0&&n<=lines.length&&quote.length>=3&&
        lines[n-1].startsWith(quote)&&!quote.includes('\t');
};
export function validateMapping(matrix,original,openApi){
 const sourceIndex=parseLegacyOpenApi(openApi).endpoints;
 if(sourceIndex.length!==218||new Set(sourceIndex.map(x=>x.path)).size!==198||
    new Set(sourceIndex.filter(x=>x.path.includes(':')).map(x=>x.path)).size!==62)
    throw Error('F04_2_SOURCE_SEAL_COUNT');
 const oldRows=splitTsv(original),rows=splitTsv(matrix);
 if(oldRows.length!==218||rows.length!==215)throw Error('F04_2_218_215_COUNT');
 const index=new Map(oldRows.map(r=>[r.legacy_id,r]));
 if(index.size!==218)throw Error('F04_2_DUPLICATE_LEGACY_ID');
 const retired=oldRows.filter(x=>x.review_action==='RETIRE');
 if(retired.length!==3||retired.some(x=>x.current_stage!=='FORBIDDEN'))throw Error('F04_2_RETIRED_DRIFT');
 for(const r of oldRows)assertLegacyDecision(r);
 const cache=new Map(),seen=new Set(),summary={EVIDENCE_MATCHED:0,SOURCE_GAP:0,CONFLICT_REQUIRES_USER:0};
 for(const [i,r] of rows.entries()){
  const prev=index.get(r.legacy_id),real=sourceIndex.find(x=>x.line===Number(r.source_line));
  if(!prev||prev.review_action==='RETIRE'||seen.has(r.legacy_id))throw Error('F04_2_MISSING_OR_DUPLICATE_ID_'+i);
  seen.add(r.legacy_id);
  for(const [left,right] of [['method','http_method'],['legacy_path','legacy_path'],
   ['operation_id','operation_id'],['source_line','source_line'],['source_file','source_file'],
   ['old_identity','legacy_identity'],['old_permission','legacy_permission'],['old_projection','legacy_projection']]){
    if(r[left]!==prev[right])throw Error('F04_2_FROZEN_OLD_ROUTE_DRIFT_'+r.legacy_id+'_'+left);
  }
  if(!real||real.path!==r.legacy_path||real.method.toUpperCase()!==r.method||
      real.operationId!==r.operation_id)throw Error('F04_2_REBUILT_OPENAPI_DRIFT_'+r.legacy_id);
  if(!Object.hasOwn(summary,r.mapping_evidence))throw Error('F04_2_BAD_EVIDENCE_STATE');
  if(!['UNDECIDED','KEEP','MODIFY','RETIRE','REPLACE'].includes(r.decision))
    throw Error('F04_2_INVALID_DECISION');
  if(r.decision!=='UNDECIDED')throw Error('F04_2_ACTION_WITHOUT_VERIFIED_API_CONTRACT_'+r.legacy_id);
  if(r.current_stage!=='CONTRACT_ONLY')throw Error('F04_2_LEGACY_ROUTE_OPENED');
  if(!r.source_gap_reason||!r.responsible_owner||!['F04','F05','F06','F07'].includes(r.responsible_owner))
    throw Error('F04_2_UNJUSTIFIED_GAP_'+r.legacy_id);
  for(const p of ['pdm','nav','page']){
    if(!quoteCheck(r,p,cache))throw Error('F04_2_FORGED_AUTHORITY_'+r.legacy_id+'_'+p);
  }
  if(r.mapping_evidence==='EVIDENCE_MATCHED'&&(!r.pdm_file||!r.nav_file||!r.page_file))
    throw Error('F04_2_NO_TRIPLE_AUTHORITY_'+r.legacy_id);

  // Current业务对象≠HTTP vehicle URL前缀；F04合同责任≠领域实施责任。
  const [domain,implementation]=currentBusinessDomain(r.legacy_path);
  if(r.domain_authority!==domain||r.contract_owner!=='F04'||
     r.business_implementation_owner!==implementation||
     r.owner_review_gap!==(implementation==='OWNER_REVIEW_GAP'?'OWNER_REVIEW_GAP':''))
    throw Error('F04_2_DOMAIN_OWNER_SEMANTIC_MISMATCH_'+r.legacy_id);
  if(r.mapping_evidence==='EVIDENCE_MATCHED'){
    const p=ACTION_PROOFS[r.legacy_id];
    if(!p||r.nav_line!==String(p.navLine)||r.pdm_file!==p.pdmFile||
       r.pdm_line!==String(p.pdmLine)||r.page_line!==String(p.pageLine)||
       r.nav_file!=='03_证据_C_IA_V5_Current/04_LOW_FI_NAVIGATION_REGISTER.md'||
       r.page_file!=='03_证据_C_IA_V5_Current/04_LOW_FI_PAGE_MANIFEST.md'||
       !r.nav_quote.includes('| '+p.navAction+' |')||
       !r.page_quote.startsWith('| '+p.pageId+' |')||
       r.semantic_action_id!==r.nav_quote.split('|')[1].trim()||
       r.semantic_subject!==p.subject||r.semantic_intent!==p.intent)
       throw Error('F04_2_SEMANTIC_ACTION_MISMATCH_'+r.legacy_id);
  }else if(r.semantic_action_id||r.semantic_subject||r.semantic_intent)
    throw Error('F04_2_UNPROVEN_SEMANTIC_ASSERTION_'+r.legacy_id);
  if(r.mapping_evidence==='SOURCE_GAP'&&r.decision!=='UNDECIDED')
    throw Error('F04_2_UNREVIEWED_AS_APPROVED');
  summary[r.mapping_evidence]++;
 }
 if(seen.size!==215)throw Error('F04_2_215_INCOMPLETE');
 for(const r of retired)if(seen.has(r.legacy_id))throw Error('F04_2_RETIRED_REAPPEARED');
 if(summary.EVIDENCE_MATCHED===0||summary.SOURCE_GAP===0)
  throw Error('F04_2_NO_REAL_AUTHORITY_REVIEW');
 return Object.freeze({routes:rows.length,retired:3,paths:198,originalMethods:218,colonPaths:62,...summary});
}
export const verifyCurrent=()=>validateMapping(read(current),read(old),read(source));
