// 只读五源恢复可行性核证。返回历史证据事实，不颁发新SHA父签或生产许可。
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export const REPO='suzhe868-arch/mb';
const sha40=/^[0-9a-f]{40}$/, digest=/^sha256:[0-9a-f]{64}$/;
const base=[['h52',52],['i2',2],['j2',2],['k2',2],['f05-4-2',2],['f05-5-2',2],['f05-6-2',2]];
const data=[
 ['F05-7','feat/f05-7-deterministic-matching-readiness-four-tier','f05-7-deterministic-matching-readiness-four-tier.yml',2,66,base,'engineering/f05/deterministic-matching-readiness-four-tier/ci-verify-workflows.mjs'],
 ['F05-8','feat/f05-8-priority-arbitration-ttl-handover','f05-8-priority-arbitration-ttl-handover.yml',4,68,base,'engineering/f05/priority-arbitration-ttl-handover/ci-verify-68.mjs'],
 ['F05-9','feat/f05-9-recommendation-visibility-grants','f05-9-recommendation-visibility-grants.yml',2,70,[...base,['f05-8-four',4]],'engineering/f05/recommendation-visibility-grants/ci-verify-70.mjs'],
 ['F05-10','feat/f05-10-consultation-assignee-sla','f05-10-consultation-assignee-sla.yml',2,72,[...base,['f05-8-four',4],['f05-9-two',2]],'engineering/f05/consultation-assignee-sla/ci-verify-72.mjs'],
 ['F05-10-D1','feat/f05-10-d1-pdm17-public-pool-owner-claim','f05-10-d1-public-pool-owner-claim.yml',2,72,[...base,['f05-8-four',4],['f05-9-two',2]],'engineering/f05/pdm17-public-pool-owner-claim/ci-verify-72.mjs']
];
export const SOURCES=Object.freeze(data.map(([id,branch,sourceFile,newJobs,total,old,verifyFile])=>({
 id,branch,sourceFile,newJobs,total,verifyFile,expected:Object.freeze([...old.map(([tag,jobs])=>({file:(id==='F05-10-D1'?'f05-10-d1':id.toLowerCase())+'-frozen-'+tag+'-revalidation.yml',jobs})),{file:sourceFile,jobs:newJobs}])
})));
export function gap(reason,detail={}){return {status:'SOURCE_GAP',reason,formal_parent_positive:false,...detail};}
export function validateRun(run,spec,sha,file){
 if(!run||run.repository?.full_name!==REPO||run.head_repository?.full_name!==REPO)return gap('REPOSITORY_MISMATCH_OR_UNTRUSTED');
 if(!sha40.test(sha)||run.head_sha!==sha)return gap('CROSS_SHA');
 if(run.head_branch!==spec.branch||run.path!=='.github/workflows/'+file)return gap('CROSS_BRANCH_OR_WORKFLOW');
 if(run.event!=='push')return gap('NOT_ORIGINAL_PUSH');
 if(run.status!=='completed'||run.conclusion!=='success')return gap('RUN_NOT_SUCCESS');
 if(!Number.isSafeInteger(run.id)||!Number.isSafeInteger(run.run_attempt)||run.run_attempt<1||run.html_url!== 'https://github.com/'+REPO+'/actions/runs/'+run.id)return gap('RUN_ORIGIN_INVALID');
 return {status:'ORIGINAL_PUSH_COMPLETED_SUCCESS',run_id:run.id,url:run.html_url,attempt:run.run_attempt,formal_parent_positive:false};
}
export function validateJobs(run,collection,expected){
 if(!collection||!Array.isArray(collection.jobs)||collection.total_count!==expected||collection.jobs.length!==expected)return gap('MISSING_OR_INCOMPLETE_JOBS');
 const seen=new Set();
 for(const j of collection.jobs){
  if(!Number.isSafeInteger(j.id)||seen.has(j.id)||j.run_id!==run.id||j.run_attempt!==run.run_attempt||
    j.status!=='completed'||j.conclusion!=='success'||j.html_url!== 'https://github.com/'+REPO+'/actions/runs/'+run.id+'/job/'+j.id)return gap('JOB_ATTEMPT_OR_RESULT_INVALID');
  seen.add(j.id);
 }
 return {status:'OFFICIAL_JOB_METADATA_COMPLETE',count:expected,job_ids:[...seen],formal_parent_positive:false};
}
export function validateArtifacts(run,collection,sha,at=Date.now()){
 if(!collection||!Array.isArray(collection.artifacts)||!Number.isSafeInteger(collection.total_count)||collection.total_count!==collection.artifacts.length)return gap('ARTIFACT_API_INCOMPLETE');
 const valid=collection.artifacts.filter(a=>Number.isSafeInteger(a.id)&&a.workflow_run?.id===run.id&&a.workflow_run?.head_sha===sha&&a.expired===false&&a.size_in_bytes>0&&digest.test(a.digest??'')&&Date.parse(a.expires_at)>at&&a.archive_download_url?.startsWith('https://api.github.com/repos/'+REPO+'/actions/artifacts/'));
 if(!valid.length)return gap('ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
 return {status:'OFFICIAL_ARTIFACT_METADATA_AVAILABLE',valid_count:valid.length,samples:valid.slice(0,3).map(a=>({id:a.id,name:a.name,bytes:a.size_in_bytes,digest:a.digest,expires_at:a.expires_at})),zip_independent_sha256_verified:false,formal_parent_positive:false};
}
export function judge(spec,sha,items){
 const rows=[],found=new Set();
 for(const expected of spec.expected){
  const item=items.find(x=>x.file===expected.file);
  if(!item){rows.push({file:expected.file,required:expected.jobs,...gap('MISSING_SAME_SHA_ORIGINAL_PUSH')});continue;}
  const identity=validateRun(item.run,spec,sha,expected.file);
  if(identity.status==='SOURCE_GAP'){rows.push({file:expected.file,required:expected.jobs,...identity});continue;}
  const jobs=validateJobs(item.run,item.jobs,expected.jobs);
  if(jobs.status==='SOURCE_GAP'){rows.push({file:expected.file,required:expected.jobs,run_url:identity.url,...jobs});continue;}
  const art=validateArtifacts(item.run,item.artifacts,sha);
  if(art.status==='SOURCE_GAP'){rows.push({file:expected.file,required:expected.jobs,run_url:identity.url,...art});continue;}
  found.add(expected.file);
  rows.push({file:expected.file,required:expected.jobs,run_url:identity.url,run_id:identity.run_id,attempt:identity.attempt,job_count:jobs.count,job_sample_ids:jobs.job_ids.slice(0,2),artifacts:art,...{status:'HISTORICAL_METADATA_CANDIDATE_ONLY',formal_parent_positive:false}});
 }
 const valid=rows.filter(x=>x.status==='HISTORICAL_METADATA_CANDIDATE_ONLY').reduce((n,x)=>n+x.required,0);
 return {id:spec.id,branch:spec.branch,original_sha:sha,required_workflows:spec.expected.length,required_pg16_jobs:spec.total,metadata_valid_pg16_jobs:valid,workflows:rows,decision:valid===spec.total?'HISTORICAL_COMPLETE_METADATA_ONLY_NOT_NEW_PARENT_PROOF':'SOURCE_GAP',formal_parent_positive:false,production_authorized:false};
}
const API='https://api.github.com/repos/'+REPO;
async function api(path){
 if(!path.startsWith('/')||path.startsWith('//')||path.includes('#'))throw Error('UNAUTHORIZED_PATH');
 const result=await fetch(API+path,{headers:{Authorization:'Bearer '+process.env.GH_ACTIONS_READ_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(25000),redirect:'error'});
 if(!result.ok)throw Error('OFFICIAL_API_HTTP_'+result.status+'_'+path.slice(0,65));
 return result.json();
}
async function pages(path,key,max=10){
 let total=null;const list=[],ids=new Set();
 for(let i=1;i<=max;i++){
  const value=await api(path+(path.includes('?')?'&':'?')+'per_page=100&page='+i);
  if(!Array.isArray(value[key])||!Number.isSafeInteger(value.total_count))throw Error('API_INCOMPLETE_'+key);
  if(total!==null&&total!==value.total_count)throw Error('API_PAGINATION_CHANGED');
  total=value.total_count;
  for(const x of value[key]){if(!Number.isSafeInteger(x.id)||ids.has(x.id))throw Error('API_DUPLICATE_ID');ids.add(x.id);list.push(x);}
  if(list.length===total)return {total_count:total,[key]:list};
  if(!value[key].length||list.length>total)throw Error('API_PAGINATION_INCOMPLETE');
 }
 throw Error('API_PAGINATION_LIMIT');
}
function enforceRuntime(){
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_REF!=='refs/heads/feat/f05-parent-chain-restore-feasibility-01'||!sha40.test(process.env.GITHUB_SHA??'')||!process.env.GH_ACTIONS_READ_TOKEN)throw Error('ONLY_OFFICIAL_READ_ONLY_BRANCH_PUSH');
}
async function collectOne(spec){
 const branch=await api('/branches/'+spec.branch);
 if(!sha40.test(branch.commit?.sha))throw Error('BRANCH_HEAD_INVALID');
 const sha=branch.commit.sha;
 const historical=await pages('/actions/runs?head_sha='+sha+'&event=push','workflow_runs');
 const rows=[];
 for(const expected of spec.expected){
  const run=historical.workflow_runs.filter(x=>x.path==='.github/workflows/'+expected.file&&x.head_sha===sha&&x.head_branch===spec.branch&&x.event==='push').sort((a,b)=>b.id-a.id)[0];
  if(!run)continue;
  // 官方只读GET，可检测跨SHA、跨尝试、失败、Artifact过期；拒绝伪造回包作为真父签。
  let jobs,artifacts,error;
  try{
   jobs=await pages('/actions/runs/'+run.id+'/jobs?filter=latest','jobs',4);
   artifacts=await pages('/actions/runs/'+run.id+'/artifacts','artifacts',6);
  }catch(e){error=e.message;}
  rows.push({file:expected.file,run,jobs,artifacts,error});
 }
 const result=judge(spec,sha,rows);
 const after=await api('/branches/'+spec.branch);
 if(after.commit?.sha!==sha){result.decision='SOURCE_GAP_BRANCH_CHANGED_DURING_AUDIT';result.formal_parent_positive=false;}
 result.branch_last_commit=branch.commit?.commit?.committer?.date??null;
 result.original_workflow='https://github.com/'+REPO+'/blob/'+sha+'/.github/workflows/'+spec.sourceFile;
 result.source_verify_script='https://github.com/'+REPO+'/blob/'+sha+'/'+spec.verifyFile;
 return result;
}
async function main(){
 enforceRuntime();
 const results=[];
 for(const s of SOURCES){
  try{results.push(await collectOne(s));}
  catch(e){results.push({id:s.id,branch:s.branch,...gap('OFFICIAL_API_BLOCKED',{error:String(e.message)})});}
 }
 const out={version:'F05_PARENT_FEASIBILITY_OFFICIAL_GET_V1',generated_at:new Date().toISOString(),repo:REPO,audit_code_sha:process.env.GITHUB_SHA,source:'GITHUB_ACTIONS_OFFICIAL_GET_ONLY',historical_sources:results,formal_parent_positive:false,no_branch_push_or_rerun:true,zip_independent_digest_checked:false,production_authorized:false,full_original_parent_chain_restored_for_current_main:false};
 writeFileSync('f05-parent-chain-live.json',JSON.stringify(out,null,2)+'\n');
 console.log('F05_PARENT_FEASIBILITY_LIVE',JSON.stringify({at:out.generated_at,codeSha:out.audit_code_sha,rows:results.map(x=>[x.id,x.original_sha,x.metadata_valid_pg16_jobs,x.required_pg16_jobs,x.decision??x.status])}));
 if(results.some(x=>!x.decision)){console.error('OFFICIAL_API_INCOMPLETE_FAIL_CLOSED');process.exitCode=2;}
 else console.log('HISTORICAL_COMPLETENESS_IS_NOT_NEW_MAIN_SHA_PARENT_CERTIFICATE');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv[2]!=='audit'){console.error('ONLY_READ_ONLY_AUDIT');process.exitCode=2;}
 else main().catch(e=>{console.error('READ_ONLY_AUDIT_BLOCKED',e.message);process.exitCode=2;});
}
