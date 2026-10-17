// F05-7 V2证据结构与官方只读验证。仅候选，不得签发旧五正式Source。
import fs from 'node:fs';
export const REPO='suzhe868-arch/mb';
export const BRANCH='feat/f05-7-66-real-source-closure-01';
export const WORKFLOW='.github/workflows/f05-7-native-66-closure-ci.yml';
export const LEVEL=Object.freeze({CANDIDATE:'V2_CANDIDATE_ONLY',UNTRUSTED:'UNVERIFIED_USER_SUPPLIED_JSON'});
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const id=x=>Number.isSafeInteger(x)&&x>0;
const succeeded=x=>x?.status==='completed'&&x?.conclusion==='success';
function deny(s){throw Error('NATIVE66_EVIDENCE_DENIED_'+s)}
export function verifyEvidence(c,a,{official=false}={}){
 if(!c||c.repo!==REPO||c.branch!==BRANCH||c.workflow!==WORKFLOW||c.event!=='push'||
    !sha(c.sha)||!id(c.runId)||!id(c.attempt))deny('CONTEXT');
 if(!a||!a.run||!Array.isArray(a.jobs)||!Array.isArray(a.checks)||!Array.isArray(a.artifacts))deny('API_STRUCTURE');
 let r=a.run;
 if(r.repository?.full_name!==REPO||r.head_branch!==BRANCH||r.head_sha!==c.sha||
    r.id!==c.runId||r.run_attempt!==c.attempt||r.event!=='push'||!succeeded(r))deny('RUN_REPLAY');
 if(r.path!==WORKFLOW&&r.path!==WORKFLOW+'@refs/heads/'+BRANCH)deny('WORKFLOW_PATH');
 if(a.jobs_total!==a.jobs.length||a.checks_total!==a.checks.length||a.artifacts_total!==a.artifacts.length)deny('PAGING');
 if(a.jobs.length!==2||a.artifacts.length!==2||a.checks.length!==2)deny('TWO_JOBS_REQUIRED');
 const checkIds=new Set(),jobIds=new Set(),artifactIds=new Set();
 for(const x of a.checks){
  if(!id(x.id)||checkIds.has(x.id)||!succeeded(x)||x.head_sha!==c.sha||!x.completed_at||
    x.details_url!=='https://github.com/'+REPO+'/actions/runs/'+c.runId+'/job/'+x.id)deny('CHECK');
  checkIds.add(x.id);
 }
 for(const j of a.jobs){
  if(!id(j.id)||jobIds.has(j.id)||!checkIds.has(j.id)||!succeeded(j)||j.run_id!==c.runId)deny('JOB');
  jobIds.add(j.id);
 }
 for(const a0 of a.artifacts){
  if(!id(a0.id)||artifactIds.has(a0.id)||a0.expired!==false||!id(a0.size_in_bytes)||
     a0.workflow_run?.id!==c.runId||a0.workflow_run?.head_sha!==c.sha||
     !/^sha256:[0-9a-f]{64}$/i.test(a0.digest))deny('ARTIFACT');
  artifactIds.add(a0.id);
 }
 return Object.freeze({
  level:official?LEVEL.CANDIDATE:LEVEL.UNTRUSTED,origin:official?'GITHUB_API_READONLY':'USER_SUPPLIED_JSON_UNVERIFIED',
  candidate_sha:c.sha,run_id:c.runId,run_attempt:c.attempt,jobs_confirmed:jobIds.size,
  artifacts_confirmed:artifactIds.size,source_gap:'OPEN',formal_source_issuer_signed:false,
  original_66_jobs_passed:false,phase2_original_ref_push_authorized:false,production_ready:false
 });
}
export async function collectOfficial(context, token, fetcher=fetch){
 if(typeof token!=='string'||token.length<10)deny('TOKEN_MISSING');
 const base='https://api.github.com/repos/'+REPO;
 const get=async path=>{
  const response=await fetcher(base+path,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'}});
  if(!response.ok)deny('GITHUB_HTTP_'+response.status);
  return response.json();
 };
 const [run,jobs,artifacts,checks]=await Promise.all([
  get('/actions/runs/'+context.runId),get('/actions/runs/'+context.runId+'/jobs?per_page=100'),
  get('/actions/runs/'+context.runId+'/artifacts?per_page=100'),
  get('/commits/'+context.sha+'/check-runs?per_page=100')
 ]);
 if(jobs.total_count>100||artifacts.total_count>100||checks.total_count>100)deny('PAGES_NOT_COMPLETE');
 const jobIds=new Set((jobs.jobs||[]).map(x=>x.id));
 const ownedChecks=(checks.check_runs||[]).filter(x=>jobIds.has(x.id));
 return verifyEvidence(context,{run,jobs:jobs.jobs,checks:ownedChecks,artifacts:artifacts.artifacts,
   jobs_total:jobs.total_count,checks_total:ownedChecks.length,artifacts_total:artifacts.total_count},{official:true});
}
if(process.argv[1] && import.meta.url==='file://'+process.argv[1]){
 const mode=process.argv[2];
 try{
  if(mode==='--offline-json'){
   const p=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
   console.log(JSON.stringify(verifyEvidence(p.context,p.github),null,2));
  }else if(mode==='--official'){
   const c={repo:REPO,branch:BRANCH,workflow:WORKFLOW,event:'push',
    sha:process.argv[3],runId:Number(process.argv[4]),attempt:Number(process.argv[5])};
   const x=await collectOfficial(c,process.env.GH_ACTIONS_READ_TOKEN);
   console.log(JSON.stringify(x,null,2));
  }else deny('CLI_MODE');
 }catch(e){console.error(e.message);process.exitCode=1;}
}
