import {assertTrustedParentReceipt} from './trusted-parent.mjs';
// F08-1: 只读非生产跨域证据门禁。任何“目录存在”都不能推定运行成功。
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
export const PREFIX='engineering/f08/quality-evidence-gate-ci/';
export const EVIDENCE_LEVELS=Object.freeze(['SIGNED_PARENT_VERIFIED','SIGNED_PARENT_NEGATIVE_ONLY','CI_SYNTHETIC_ONLY','STATIC_CONTRACT_ONLY','NOT_RUN','SOURCE_GAP']);
export const CI_STATES=Object.freeze(['success','failure','queued','in_progress','skipped','cancelled','missing']);
export const FILES=Object.freeze({coverage:PREFIX+'F01_F08真实证据覆盖矩阵.tsv',gaps:PREFIX+'SOURCE_GAP与质量阻断台账.tsv',legacy:PREFIX+'旧CI检查状态矩阵.tsv'});
export function isSha(s){return typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);}
export function parseTsv(s){
 const lines=s.replace(/\r/g,'').split('\n').filter(x=>x.trim()&&!x.startsWith('#'));
 if(!lines.length)throw Error('EMPTY_TSV');
 const header=lines.shift().split('\t');
 if(header.length<2||new Set(header).size!==header.length)throw Error('BAD_HEADER');
 return lines.map((line,i)=>{
  const parts=line.split('\t');
  if(parts.length!==header.length)throw Error('BAD_COLUMNS_AT_'+(i+2));
  return Object.fromEntries(header.map((h,j)=>[h,parts[j]]));
 });
}
export function load(name){return parseTsv(readFileSync(resolve(ROOT,FILES[name]),'utf8'));}
export function uniqueRows(rows,key){
 if(!rows.length)throw Error('NO_ROWS');
 const s=new Set();for(const row of rows){if(!row[key]||s.has(row[key]))throw Error('DUPLICATE_OR_MISSING_KEY:'+row[key]);s.add(row[key]);}
 return true;
}
export function normalizeCheck(check,requestedSha){
 if(!isSha(requestedSha))throw Error('EXPECTED_SHA_INVALID');
 if(!check)return {state:'missing',sha:requestedSha,meaning:'NO_CHECK_FOUND'};
 const observed=check.head_sha??check.sha;
 if(observed!==requestedSha)throw Error('CHECK_SHA_MISMATCH');
 if(check.status==='queued'||check.status==='in_progress')return {state:check.status,sha:observed,meaning:'EXTERNAL_CHECK_PENDING'};
 if(check.status!=='completed')throw Error('CHECK_STATUS_INVALID');
 const conclusion=check.conclusion;
 if(!['success','failure','skipped','cancelled'].includes(conclusion))throw Error('CHECK_CONCLUSION_INVALID');
 return {state:conclusion,sha:observed,meaning:conclusion==='success'?'CHECK_FINISHED_SUCCESS':conclusion==='failure'?'CHECK_FAILED':'CHECK_NOT_SUCCESS'};
}
export function requireEvidence(row,{target='NONPRODUCTION',observedCheck=null,verifiedProof=null}={}){
 if(!EVIDENCE_LEVELS.includes(row.level))throw Error('EVIDENCE_LEVEL_UNKNOWN');
 if(target==='PRODUCTION_READY'||target==='UAT_ACCEPTED')throw Error('PRODUCTION_OR_UAT_NOT_AUTHORIZED');
 if(target==='SIGNED_PARENT_POSITIVE'&&row.level!=='SIGNED_PARENT_VERIFIED')throw Error('PARENT_POSITIVE_NOT_VERIFIED');
 if(target==='SIGNED_PARENT_POSITIVE'&&(!isSha(row.evidence_sha)||!row.run_id))throw Error('PARENT_POSITIVE_EVIDENCE_MISSING');
 if(target==='SIGNED_PARENT_POSITIVE')assertTrustedParentReceipt(row,verifiedProof);
 if(target==='REAL_EXTERNAL'&&row.level!=='SIGNED_PARENT_VERIFIED')throw Error('REAL_EXTERNAL_SOURCE_GAP');
 if(row.level==='SOURCE_GAP'||row.level==='NOT_RUN')return {eligible:false,reason:row.level};
 if(observedCheck&&observedCheck.state!=='success')return {eligible:false,reason:'CI_'+observedCheck.state.toUpperCase()};
 if(row.level==='SIGNED_PARENT_NEGATIVE_ONLY'&&target==='SIGNED_PARENT_POSITIVE')throw Error('NEGATIVE_IS_NOT_POSITIVE');
 return {eligible:row.level==='SIGNED_PARENT_VERIFIED'&&target==='SIGNED_PARENT_POSITIVE'||target==='NONPRODUCTION',reason:row.level};
}
export function validateCoverage(rows,{verifiedProofs=[]}={}){
 uniqueRows(rows,'id');
 const domains=new Set(rows.map(x=>x.domain));
 for(const domain of ['F01','F02','F03','F04','F05','F06','F07','F08','C'])if(!domains.has(domain))throw Error('MISSING_DOMAIN_'+domain);
 for(const row of rows){
  if(!EVIDENCE_LEVELS.includes(row.level))throw Error('COVERAGE_LEVEL_INVALID:'+row.id);
  if(!['SOURCE_PRESENT','SOURCE_GAP'].includes(row.source_presence))throw Error('PRESENCE_INVALID:'+row.id);
  if(row.source_presence==='SOURCE_GAP'&&row.level!=='SOURCE_GAP'&&row.level!=='NOT_RUN')throw Error('MISSING_SOURCE_CLAIMED:'+row.id);
  if(row.production_ready!=='NO')throw Error('FORBIDDEN_PRODUCTION_CLAIM:'+row.id);
  if(!['YES','NO'].includes(row.positive_parent))throw Error('PARENT_POSITIVE_FLAG_INVALID:'+row.id);
  if(row.positive_parent==='YES'&&row.level!=='SIGNED_PARENT_VERIFIED'){
   if(row.level==='CI_SYNTHETIC_ONLY')throw Error('FALSE_SYNTHETIC_ESCALATION:'+row.id);
   throw Error('FALSE_PARENT_POSITIVE:'+row.id);
  }
  if(row.level==='SIGNED_PARENT_VERIFIED'&&(!isSha(row.evidence_sha)||!row.run_id||row.run_id==='—'))throw Error('PARENT_SIGNED_PROOF_MISSING:'+row.id);
  // TSV声明只能表明待核验：正例必须另有从GitHub只读接口独立取得的同SHA成功Check。
  if(row.positive_parent==='YES'){
   const proof=verifiedProofs.find(x=>{try{return assertTrustedParentReceipt(row,x);}catch{return false;}});
   if(!proof)throw Error('PARENT_POSITIVE_INDEPENDENT_CHECK_MISSING:'+row.id);
  }
 }
 return true;
}
export function validateGaps(rows){
 uniqueRows(rows,'id');for(const row of rows){
  if(!['SOURCE_GAP','NOT_RUN','EXTERNAL_CHECK_PENDING','BLOCKED'].includes(row.state))throw Error('GAP_MISCLASSIFIED:'+row.id);
  if(!row.owner||!row.release_condition||row.claimed_done!=='NO')throw Error('GAP_NOT_ACTIONABLE:'+row.id);
 }return true;
}
export function validateLegacy(rows){
 uniqueRows(rows,'id');
 for(const row of rows){
  if(!isSha(row.observed_sha)||!CI_STATES.includes(row.state))throw Error('LEGACY_UNTRUSTED_STATE:'+row.id);
  if(row.snapshot_kind!=='HISTORICAL_SNAPSHOT')throw Error('LEGACY_SNAPSHOT_KIND_REQUIRED:'+row.id);
  if(row.current_head_claim!=='NO')throw Error('LEGACY_IS_NOT_LIVE:'+row.id);
  if(!['YES','NO'].includes(row.success_claim))throw Error('LEGACY_SUCCESS_FLAG_INVALID:'+row.id);
  // 失败、排队、进行中、跳过、取消、缺失：六态均不能宣称成功。
  if(row.state!=='success'&&row.success_claim!=='NO')throw Error('NON_SUCCESS_CANNOT_CLAIM_SUCCESS:'+row.state+':'+row.id);
  // 允许记录历史成功的前提是提供独立只读核验事实；默认不接受自述成功。
  if(row.state==='success'&&row.success_claim==='YES'){
   // 历史TSV和字符串provenance都不是当前真实GitHub校验回执，不可从静态输入自行提权。
   throw Error('LEGACY_SUCCESS_INDEPENDENT_CHECK_MISSING:'+row.id);
  }
 }return true;
}
export function gitFiles(){
 return execFileSync('git',['ls-files','-z'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean);
}
export function gitSha(){const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();if(!isSha(sha))throw Error('GIT_HEAD_INVALID');return sha;}
export function sourceInventory(rows,files=gitFiles()){
 const set=new Set(files);
 return rows.map(r=>{
  const match=r.source_path.endsWith('/')?files.filter(x=>x.startsWith(r.source_path)):r.source_path==='—'?[]:set.has(r.source_path)?[r.source_path]:[];
  return {...r,matched_files:match.length,found_paths:match.slice(0,4),source_observed:match.length?'SOURCE_PRESENT':'SOURCE_GAP',source_consistent:r.source_presence===(match.length?'SOURCE_PRESENT':'SOURCE_GAP')};
 });
}
export function runAudit(){
 const coverage=load('coverage'),gaps=load('gaps'),legacy=load('legacy');
 validateCoverage(coverage);validateGaps(gaps);validateLegacy(legacy);
 const inventory=sourceInventory(coverage);
 if(inventory.some(x=>!x.source_consistent))throw Error('SOURCE_INVENTORY_MISMATCH:'+inventory.filter(x=>!x.source_consistent).map(x=>x.id).join(','));
 const currentSha=gitSha();const files=gitFiles();
 const workflowNames=files.filter(x=>/^\.github\/workflows\/(f0[1-8]|c-app)/.test(x));
 const report={audit_kind:'F08_1_NONPRODUCTION_REPO_INVENTORY',head_sha:currentSha,branch:process.env.GITHUB_REF_NAME??'LOCAL_NOT_AUTHORITY',source:'GIT_TRACKED_TREE_ONLY',generated_at:new Date().toISOString(),production_ready:false,uat_accepted:false,tests_executed_by_this_inventory:false,coverage:inventory,gaps,legacy,workflow_count:workflowNames.length,workflow_names:workflowNames,previous_ci_snapshots_not_current:true,real_third_party_invocations:0};
 const out=resolve(ROOT,'f08-1-quality-evidence.json');writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log('F08_1_REPORT_GENERATED',currentSha,'entries',inventory.length,'gaps',gaps.length,'workflow_files',workflowNames.length);
 console.log('F08_1_GLOBAL_NOT_READY_SOURCE_GAP');
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{if(process.argv[2]!=='report')throw Error('ONLY_REPORT_SUBCOMMAND_ALLOWED');runAudit();}
 catch(e){console.error('F08_1_GATE_DENIED',e.message);process.exitCode=1;}
}
