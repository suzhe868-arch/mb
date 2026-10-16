// F05-7 第一阶段受控来源恢复：只读审计，不写 GitHub ref、不签发父链证明。
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export const REPO='suzhe868-arch/mb';
export const BRANCH='feat/f05-7-deterministic-matching-readiness-four-tier';
export const EXPECTED_OLD_SHA='99c38d013f67cc56975f1664120fb87c204afc3c';
export const SPECS=[
 ['f05-7-deterministic-matching-readiness-four-tier.yml',2],
 ['f05-7-frozen-h52-revalidation.yml',52],
 ['f05-7-frozen-i2-revalidation.yml',2],
 ['f05-7-frozen-j2-revalidation.yml',2],
 ['f05-7-frozen-k2-revalidation.yml',2],
 ['f05-7-frozen-f05-4-2-revalidation.yml',2],
 ['f05-7-frozen-f05-5-2-revalidation.yml',2],
 ['f05-7-frozen-f05-6-2-revalidation.yml',2]
].map(([file,jobs])=>({file,jobs}));
export const sha40=/^[a-f0-9]{40}$/;
export function gap(reason){return {status:'SOURCE_GAP',reason,formal_parent_positive:false};}
export function jobKeys(yaml){
 const matches=[...yaml.matchAll(/^  ([a-z][a-z0-9-]+):(?=\s|$)/gm)];
 return matches.map(m=>m[1]).filter(x=>!['push','pull_request','workflow_dispatch'].includes(x));
}
export function inspectStatic(files){
 const rows=[];
 for(const spec of SPECS){
  const yaml=files[spec.file];
  if(typeof yaml!=='string')throw Error('MISSING_WORKFLOW_'+spec.file);
  const jobs=jobKeys(yaml);
  if(jobs.length!==spec.jobs)throw Error('JOB_COUNT_DIFFERENCE_'+spec.file+'_'+jobs.length);
  if(!yaml.includes('feat/f05-7-deterministic-matching-readiness-four-'))throw Error('ORIGINAL_PUSH_BRANCH_MISSING_'+spec.file);
  if(!yaml.includes('upload-artifact@v4'))throw Error('ARTIFACT_STEP_MISSING_'+spec.file);
  const ecr=(yaml.match(/image: public\.ecr\.aws\/docker\/library\/postgres:16-alpine/g)||[]).length;
  const write=(yaml.match(/contents: write/g)||[]).length;
  const crossBranchPush=(yaml.match(/git push origin HEAD:refs\/heads\/feat\/f03-/g)||[]).length;
  rows.push({file:spec.file,expected_jobs:spec.jobs,defined_jobs:jobs.length,ecr_pg_service_definitions:ecr,contents_write_occurrences:write,historical_f03_branch_push_commands:crossBranchPush,original_push_trigger_present:true,artifact_upload_present:true});
 }
 if(rows.reduce((n,x)=>n+x.expected_jobs,0)!==66)throw Error('SIXTY_SIX_EXPECTATION_CHANGED');
 return rows;
}
export function validateRun(run,spec,sha){
 if(!sha40.test(sha)||!run||run.head_sha!==sha)return gap('CROSS_SHA');
 if(run.repository?.full_name!==REPO||run.head_repository?.full_name!==REPO)return gap('CROSS_REPO');
 if(run.head_branch!==BRANCH||run.path!=='.github/workflows/'+spec.file)return gap('CROSS_BRANCH_OR_WORKFLOW');
 if(run.event!=='push')return gap('NOT_NATIVE_PUSH');
 if(run.status!=='completed'||run.conclusion!=='success')return gap('RUN_NOT_SUCCESS');
 if(!Number.isSafeInteger(run.id)||!Number.isSafeInteger(run.run_attempt)||run.run_attempt<1)return gap('INVALID_RUN_OR_ATTEMPT');
 return {status:'HISTORICAL_RUN_VALID',formal_parent_positive:false};
}
export function validateJobs(run,collection,required){
 if(!collection||!Array.isArray(collection.jobs)||collection.total_count!==required||collection.jobs.length!==required)return gap('INCOMPLETE_JOBS');
 const seen=new Set();
 for(const j of collection.jobs){
  if(!Number.isSafeInteger(j.id)||seen.has(j.id)||j.run_id!==run.id||j.run_attempt!==run.run_attempt||j.status!=='completed'||j.conclusion!=='success')return gap('JOB_STATUS_OR_ATTEMPT_INVALID');
  seen.add(j.id);
 }
 return {status:'HISTORICAL_JOBS_VALID',count:seen.size,formal_parent_positive:false};
}
export function validateArtifacts(run,collection,sha,now=Date.now()){
 if(!collection||!Array.isArray(collection.artifacts)||!Number.isSafeInteger(collection.total_count)||collection.total_count!==collection.artifacts.length||!collection.artifacts.length)return gap('INCOMPLETE_ARTIFACTS');
 for(const a of collection.artifacts){
  if(!Number.isSafeInteger(a.id)||a.workflow_run?.id!==run.id||a.workflow_run?.head_sha!==sha||a.expired!==false||!(a.size_in_bytes>0)||!/^sha256:[a-f0-9]{64}$/.test(a.digest||'')||!(Date.parse(a.expires_at)>now))return gap('ARTIFACT_EXPIRED_INVALID_OR_CROSS_SHA');
 }
 return {status:'HISTORICAL_ARTIFACT_METADATA_VALID',count:collection.artifacts.length,zip_digest_independently_checked:false,formal_parent_positive:false};
}
const apiRoot='https://api.github.com/repos/'+REPO;
async function api(path){
 if(!path.startsWith('/')||path.startsWith('//')||path.includes('#'))throw Error('INVALID_READ_PATH');
 const token=process.env.GITHUB_TOKEN;
 if(!token)throw Error('MISSING_READ_ONLY_GITHUB_TOKEN');
 const response=await fetch(apiRoot+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('GITHUB_GET_FAILED_'+response.status+'_'+path.substring(0,70));
 return response.json();
}
async function snapshot(){
 const main=await api('/branches/main'),old=await api('/branches/'+BRANCH);
 const mainSha=main.commit?.sha,oldSha=old.commit?.sha;
 if(!sha40.test(mainSha||'')||oldSha!==EXPECTED_OLD_SHA)throw Error('SOURCE_OR_MAIN_CHANGED_REVALIDATE');
 const compare=await api('/compare/'+oldSha+'...'+mainSha);
 if(compare.status!=='ahead'||compare.behind_by!==0||compare.merge_base_commit?.sha!==oldSha||compare.base_commit?.sha!==oldSha)throw Error('FAST_FORWARD_PRECONDITION_NOT_MET');
 const before=await api('/actions/runs?head_sha='+oldSha+'&per_page=100');
 if(before.total_count>100||!Array.isArray(before.workflow_runs))throw Error('RUN_PAGINATION_INCOMPLETE');
 const rows=[];
 for(const spec of SPECS){
  const candidates=before.workflow_runs.filter(r=>r.event==='push'&&r.head_sha===oldSha&&r.head_branch===BRANCH&&r.path==='.github/workflows/'+spec.file).sort((a,b)=>b.id-a.id);
  if(!candidates.length)throw Error('ORIGINAL_RUN_NOT_FOUND_'+spec.file);
  const r=candidates[0],runGate=validateRun(r,spec,oldSha);
  if(runGate.status==='SOURCE_GAP')throw Error('RUN_'+runGate.reason+'_'+spec.file);
  const jobs=await api('/actions/runs/'+r.id+'/jobs?per_page=100');
  const jobGate=validateJobs(r,jobs,spec.jobs);
  if(jobGate.status==='SOURCE_GAP')throw Error('JOB_'+jobGate.reason+'_'+spec.file);
  const artifacts=await api('/actions/runs/'+r.id+'/artifacts?per_page=100');
  const artifactGate=validateArtifacts(r,artifacts,oldSha);
  if(artifactGate.status==='SOURCE_GAP')throw Error('ARTIFACT_'+artifactGate.reason+'_'+spec.file);
  rows.push({file:spec.file,run_id:r.id,attempt:r.run_attempt,original_event:'push',original_sha:oldSha,historical_job_count:jobGate.count,artifact_count:artifactGate.count,earliest_expiry:artifacts.artifacts.map(a=>a.expires_at).sort()[0],historical_only:true});
 }
 const [queued,running,mainAfter,oldAfter]=await Promise.all([api('/actions/runs?status=queued&per_page=1'),api('/actions/runs?status=in_progress&per_page=1'),api('/branches/main'),api('/branches/'+BRANCH)]);
 if(mainAfter.commit?.sha!==mainSha||oldAfter.commit?.sha!==oldSha)throw Error('GIT_REFS_CHANGED_DURING_AUDIT');
 return {main_sha:mainSha,original_sha:oldSha,main_ahead_by:compare.ahead_by,main_behind_by:compare.behind_by,merge_base_sha:compare.merge_base_commit.sha,queue_queued:queued.total_count,queue_in_progress:running.total_count,historical_workflows:rows,historical_jobs_total:rows.reduce((n,r)=>n+r.historical_job_count,0)};
}
export async function audit(){
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REPOSITORY!==REPO)throw Error('ISOLATED_GITHUB_ACTIONS_ONLY');
 const root=join(dirname(fileURLToPath(import.meta.url)),'../../..');
 const files=Object.fromEntries(SPECS.map(s=>[s.file,readFileSync(join(root,'.github','workflows',s.file),'utf8')]));
 const staticRows=inspectStatic(files),live=await snapshot();
 if(live.historical_jobs_total!==66)throw Error('HISTORICAL_JOB_COUNT_MISMATCH');
 const output={audit:'F05_7_PHASE1_READ_ONLY_PREFLIGHT',generated_at:new Date().toISOString(),auditor_sha:process.env.GITHUB_SHA,repository:REPO,static_workflows:staticRows,live,can_fast_forward_as_observed:true,source_gap_open_for_new_main_sha:true,phase2_branch_push_authorized:false,original_branch_or_other_refs_mutated:false,formal_parent_positive:false,production_authorized:false,zip_independent_sha256_checked:false};
 const folder=join(dirname(fileURLToPath(import.meta.url)),'artifacts');mkdirSync(folder,{recursive:true});
 writeFileSync(join(folder,'F05-7_官方只读预检结果.json'),JSON.stringify(output,null,2)+'\n');
 console.log('F05_7_PHASE1_READ_ONLY_PREFLIGHT_SUCCESS',JSON.stringify({auditor_sha:output.auditor_sha,main_sha:live.main_sha,original_sha:live.original_sha,workflow_count:staticRows.length,historical_jobs:live.historical_jobs_total,queued:live.queue_queued,running:live.queue_in_progress,formal_parent_positive:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 if(process.argv[2]!=='audit'){console.error('ONLY_READ_ONLY_AUDIT_ALLOWED');process.exitCode=2;}
 else audit().catch(e=>{console.error('F05_7_PREFLIGHT_FAIL_CLOSED',e.message);process.exitCode=2;});
}
