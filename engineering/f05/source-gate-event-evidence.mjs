// Event-aware evidence validation for F05 Source gates.
// Pull-request evidence is non-production only; official main push keeps its frozen same-SHA chain.
import {mkdir,writeFile} from 'node:fs/promises';

const SHA=/^[a-f0-9]{40}$/;
const own=(v)=>v&&typeof v==='object'&&!Array.isArray(v);
export function validatePullRequestEvidence({event,env,run,jobs,workflowPath,sourceJobName,expectedJobs}){
 const fail=(code)=>{throw Error('SOURCE_GATE_PR_EVIDENCE_'+code)};
 if(env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||event?.repository?.full_name!=='suzhe868-arch/mb')fail('REPOSITORY_MISMATCH');
 if(env.GITHUB_EVENT_NAME!=='pull_request'||run?.event!=='pull_request')fail('EVENT_TYPE_MISMATCH');
 const pr=event.pull_request;
 if(!own(pr)||pr.base?.ref!=='main'||pr.base?.repo?.full_name!=='suzhe868-arch/mb')fail('TARGET_BRANCH_MISMATCH');
 if(!SHA.test(pr.head?.sha||''))fail('INVALID_PR_HEAD_SHA');
 if(!SHA.test(env.GITHUB_SHA||'')||run.head_sha!==env.GITHUB_SHA)fail('RUN_SHA_MISMATCH');
 if(!Number.isSafeInteger(Number(env.GITHUB_RUN_ID))||Number(env.GITHUB_RUN_ID)!==run.id)fail('RUN_ID_MISMATCH');
 if(!Number.isSafeInteger(Number(env.GITHUB_RUN_ATTEMPT))||Number(env.GITHUB_RUN_ATTEMPT)!==run.run_attempt)fail('RUN_ATTEMPT_MISMATCH');
 if(run.path!==workflowPath)fail('WORKFLOW_PATH_MISMATCH');
 if(run.status!=='in_progress')fail('RUN_NOT_IN_PROGRESS');
 if(!Array.isArray(jobs)||jobs.length!==expectedJobs)fail('JOB_COUNT_MISMATCH');
 const named=jobs.filter(j=>typeof j.name==='string'&&j.name.length>0);
 if(named.length!==expectedJobs||new Set(named.map(j=>j.name)).size!==expectedJobs)fail('JOB_NAMES_INVALID');
 const ownJobs=named.filter(j=>j.name===sourceJobName);
 if(ownJobs.length!==1||ownJobs[0].status!=='in_progress'||ownJobs[0].conclusion!=null)fail('SOURCE_JOB_NOT_CURRENTLY_RUNNING');
 const others=named.filter(j=>j.name!==sourceJobName);
 if(others.length!==expectedJobs-1)fail('EXPECTED_JOB_SET_MISMATCH');
 for(const job of others){
  if(job.status!=='completed'||job.conclusion!=='success')fail('PEER_JOB_NOT_SUCCESS_'+job.name.replace(/[^A-Za-z0-9_-]/g,'_'));
 }
 if(named.some(j=>j.conclusion==='skipped'||j.conclusion==='failure'||j.conclusion==='cancelled'))fail('SKIPPED_OR_FAILED_JOB');
 return {
  verification_mode:'nonproduction_pull_request',
  repository:env.GITHUB_REPOSITORY,
  event_name:env.GITHUB_EVENT_NAME,
  base_ref:pr.base.ref,
  pr_number:pr.number,
  pr_head_sha:pr.head.sha,
  tested_run_sha:env.GITHUB_SHA,
  run_id:run.id,
  run_attempt:run.run_attempt,
  workflow_path:run.path,
  expected_job_count:expectedJobs,
  actual_job_count:named.length,
  source_job_name:sourceJobName,
  source_job_state:'in_progress_until_evidence_upload_and_job_exit',
  peer_jobs:named.filter(j=>j.name!==sourceJobName).map(j=>({name:j.name,status:j.status,conclusion:j.conclusion})),
  failed_jobs:0,
  skipped_jobs:0,
  old_push_evidence_applicability:'not_applicable_to_pull_request_event; no claim that old push jobs passed',
  formal_source_signed:false,
  production_ready:false
 };
}
async function api(repo,path,token){
 const response=await fetch('https://api.github.com/repos/'+repo+path,{
  headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'}
 });
 if(!response.ok)throw Error('SOURCE_GATE_PR_EVIDENCE_GITHUB_API_'+response.status+'_'+path.slice(0,80));
 return response.json();
}
export async function verifyCurrentPullRequestRun({workflowPath,sourceJobName,expectedJobs,artifactDirectory}){
 const env=process.env;
 if(env.GITHUB_EVENT_NAME!=='pull_request')throw Error('SOURCE_GATE_PR_EVIDENCE_WRONG_DISPATCH');
 if(env.CI!=='true'||env.GITHUB_ACTIONS!=='true'||env.GITHUB_REPOSITORY!=='suzhe868-arch/mb')
  throw Error('SOURCE_GATE_PR_EVIDENCE_CI_CONTEXT_REQUIRED');
 if(!env.GH_ACTIONS_READ_TOKEN||!env.GITHUB_EVENT_PATH)throw Error('SOURCE_GATE_PR_EVIDENCE_READ_TOKEN_OR_EVENT_MISSING');
 const event=JSON.parse(await (await import('node:fs/promises')).readFile(env.GITHUB_EVENT_PATH,'utf8'));
 const repo=env.GITHUB_REPOSITORY;
 const run=await api(repo,'/actions/runs/'+env.GITHUB_RUN_ID,env.GH_ACTIONS_READ_TOKEN);
 const jobData=await api(repo,'/actions/runs/'+env.GITHUB_RUN_ID+'/jobs?per_page=100',env.GH_ACTIONS_READ_TOKEN);
 const evidence=validatePullRequestEvidence({event,env,run,jobs:jobData.jobs||[],workflowPath,sourceJobName,expectedJobs});
 if(jobData.total_count!==expectedJobs)throw Error('SOURCE_GATE_PR_EVIDENCE_API_JOB_TOTAL_MISMATCH');
 const dir=new URL(artifactDirectory,import.meta.url);
 await mkdir(dir,{recursive:true});
 await writeFile(new URL('event-aware-pull-request-evidence.json',dir),JSON.stringify(evidence,null,2)+'\\n');
 console.log('SOURCE_GATE_EVENT_AWARE_PULL_REQUEST_EVIDENCE',JSON.stringify(evidence));
 return evidence;
}
