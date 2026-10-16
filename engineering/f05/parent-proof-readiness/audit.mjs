// F05 正式父来源只读核证工具。纯规则函数只产生候选判断，不能签发正式父正例。
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const REPO='suzhe868-arch/mb';
export const BASELINE_SHA='3ee47d9df08d9e73596be5db73ee623eb856e537';
const shaPattern=/^[a-f0-9]{40}$/;
const refPrefix='.github/workflows/';
const baseOld=[['h52',52],['i2',2],['j2',2],['k2',2],['f05-4-2',2],['f05-5-2',2],['f05-6-2',2]];
const cases=[
 ['F05-7','f05-7-deterministic-matching-readiness-four-tier.yml','feat/f05-7-deterministic-matching-readiness-four-tier',2,baseOld,66],
 ['F05-8','f05-8-priority-arbitration-ttl-handover.yml','feat/f05-8-priority-arbitration-ttl-handover',4,baseOld,68],
 ['F05-9','f05-9-recommendation-visibility-grants.yml','feat/f05-9-recommendation-visibility-grants',2,[...baseOld,['f05-8-four',4]],70],
 ['F05-10','f05-10-consultation-assignee-sla.yml','feat/f05-10-consultation-assignee-sla',2,[...baseOld,['f05-8-four',4],['f05-9-two',2]],72],
 ['F05-10-D1','f05-10-d1-public-pool-owner-claim.yml','feat/f05-10-d1-pdm17-public-pool-owner-claim',2,[...baseOld,['f05-8-four',4],['f05-9-two',2]],72]
];
export const SOURCES=Object.freeze(cases.map(([id,file,branch,newJobs,old,total])=>{
 const prefix=id==='F05-10-D1'?'f05-10-d1':id.toLowerCase();
 return Object.freeze({id,file,branch,newJobs,total,old:Object.freeze(old.map(([tag,jobs])=>Object.freeze({file:prefix+'-frozen-'+tag+'-revalidation.yml',jobs})))});
}));
export function recordGap(reason,more={}) {return {status:'SOURCE_GAP',reason,...more,formal_parent_positive:false};}
export function candidate(run,jobs,artifacts,{repo=REPO,sha,branch,file,count,now=Date.now()}){
 const bad=(reason)=>recordGap(reason);
 if(repo!==REPO||!shaPattern.test(sha??''))return bad('REPO_OR_SHA_INVALID');
 if(!run||run.repository?.full_name!==repo||run.head_repository?.full_name!==repo)return bad('CROSS_REPO');
 if(run.path!==refPrefix+file||run.head_branch!==branch)return bad('CROSS_BRANCH_OR_WORKFLOW');
 if(run.head_sha!==sha)return bad('CROSS_SHA');
 if(run.event!=='push')return bad('NOT_ORIGINAL_PUSH');
 if(run.status!=='completed'||run.conclusion!=='success')return bad('RUN_NOT_COMPLETED_SUCCESS');
 if(!Number.isSafeInteger(run.id)||!Number.isSafeInteger(run.run_attempt)||!run.html_url?.startsWith('https://github.com/'+repo+'/actions/runs/'))return bad('RUN_IDENTITY_UNTRUSTED');
 if(!jobs||jobs.total_count!==count||!Array.isArray(jobs.jobs)||jobs.jobs.length!==count)return bad('JOB_COUNT_INCOMPLETE');
 const ids=new Set();
 for(const job of jobs.jobs){
  if(!Number.isSafeInteger(job.id)||ids.has(job.id)||job.run_id!==run.id||job.run_attempt!==run.run_attempt||job.status!=='completed'||job.conclusion!=='success'||!job.html_url?.startsWith('https://github.com/'+repo+'/actions/runs/'))return bad('JOB_UNTRUSTED_OR_NOT_SUCCESS');
  ids.add(job.id);
 }
 if(!artifacts||!Array.isArray(artifacts.artifacts)||!Number.isSafeInteger(artifacts.total_count)||artifacts.total_count!==artifacts.artifacts.length)return bad('ARTIFACT_LIST_INCOMPLETE');
 const valid=artifacts.artifacts.filter(a=>a.workflow_run?.id===run.id&&a.workflow_run?.head_sha===sha&&a.expired===false&&a.size_in_bytes>0&&Number.isFinite(Date.parse(a.expires_at))&&Date.parse(a.expires_at)>now&&/^sha256:[a-f0-9]{64}$/.test(a.digest??'')&&a.archive_download_url?.startsWith('https://api.github.com/repos/'+repo+'/actions/artifacts/'));
 if(!valid.length)return bad('ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
 return {status:'CANDIDATE_ONLY_REQUIRES_NATIVE_PG_LOG_INDEPENDENT_CHECK',run_id:run.id,run_url:run.html_url,job_urls:jobs.jobs.map(j=>j.html_url),artifact_ids:valid.map(a=>a.id),official_digest_metadata_only:true,formal_parent_positive:false};
}
export function assessSource(spec,observations,sha){
 const details=[],all=[...spec.old,{file:spec.file,jobs:spec.newJobs}];
 let count=0;
 for(const item of all){
  const entries=observations.filter(v=>v.file===item.file);
  const x=entries[0];
  if(!x){details.push({file:item.file,required:item.jobs,...recordGap('OFFICIAL_SAME_SHA_PUSH_MISSING')});continue;}
  const result=candidate(x.run,x.jobs,x.artifacts,{sha,branch:spec.branch,file:item.file,count:item.jobs});
  details.push({file:item.file,required:item.jobs,run_id:x.run?.id??null,run_url:x.run?.html_url??null,...result});
  if(result.status.startsWith('CANDIDATE_ONLY'))count+=item.jobs;
 }
 // 纯函数即便输入是伪造的对象，也永远不能构成正式正例。
 return {id:spec.id,required_jobs:spec.total,official_candidate_jobs:count,details,...recordGap(count===spec.total?'NATIVE_PG16_LOG_AND_ARTIFACT_BYTES_NOT_ATTESTED':'OFFICIAL_PARENT_CHAIN_INCOMPLETE')};
}
export function classifyLog(text){
 if(/CANNOT_PROVE_66_SAME_SHA|OFFICIAL_68_JOB_GATE_UNPROVEN|OFFICIAL_70_NOT_PROVEN|OFFICIAL_[0-9]+_JOB_GATE_UNPROVEN/.test(text))return 'SAME_SHA_PARENT_JOBS_GAP';
 if(/NOT_IN_OFFICIAL_NEW_PUSH|NOT_NEW_OFFICIAL_PUSH|SOURCE_NOT_IN_CURRENT_WORKFLOW/.test(text))return 'ORIGINAL_PUSH_ORIGIN_GAP';
 if(/toomanyrequests|Data limit exceeded/.test(text))return 'EXTERNAL_RESOURCE_LIMIT';
 return 'UNCLASSIFIED_REQUIRES_A_REVIEW';
}
const exactRepoUrl='https://api.github.com/repos/'+REPO;
function authorizedRuntime(){
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_EVENT_NAME!=='push')throw Error('LIVE_GITHUB_PUSH_RUNTIME_REQUIRED');
 if(!shaPattern.test(process.env.GITHUB_SHA??''))throw Error('OFFICIAL_SHA_MISSING');
 if(!process.env.GH_ACTIONS_READ_TOKEN)throw Error('OFFICIAL_READ_TOKEN_MISSING');
}
async function api(path){
 if(!path.startsWith('/')||path.startsWith('//')||/[#@]/.test(path))throw Error('UNAUTHORIZED_API_PATH');
 const url=exactRepoUrl+path;
 const response=await fetch(url,{headers:{Authorization:'Bearer '+process.env.GH_ACTIONS_READ_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(25000),redirect:'error'});
 if(!response.ok)throw Error('READ_ONLY_API_HTTP_'+response.status);
 return response.json();
}
async function pages(path,key,limit=10){
 const seen=[],ids=new Set();let total=null;
 for(let p=1;p<=limit;p++){
  const sep=path.includes('?')?'&':'?';
  const body=await api(path+sep+'per_page=100&page='+p);
  if(!Array.isArray(body[key])||!Number.isSafeInteger(body.total_count)||body.total_count<0)throw Error('API_SHAPE_INVALID');
  if(total!==null&&total!==body.total_count)throw Error('PAGINATION_COUNT_CHANGED');
  total=body.total_count;
  for(const rec of body[key]){if(!Number.isSafeInteger(rec.id)||ids.has(rec.id))throw Error('API_DUPLICATE_ID');ids.add(rec.id);seen.push(rec);}
  if(seen.length===total)return {total_count:total,[key]:seen};
  if(!body[key].length||seen.length>total)throw Error('PAGINATION_INCOMPLETE');
 }
 throw Error('PAGINATION_LIMIT_EXCEEDED');
}
async function observationsFor(sha,spec){
 // 每次仅从官方 Actions API 取证，不从测试注入“成功回包”。
 const runs=await pages('/actions/runs?head_sha='+sha,'workflow_runs');
 const observations=[];
 for(const {file} of [...spec.old,{file:spec.file}]){
  const chosen=runs.workflow_runs.filter(r=>r.path===refPrefix+file&&r.head_sha===sha&&r.event==='push'&&r.head_branch===spec.branch&&r.repository?.full_name===REPO&&r.head_repository?.full_name===REPO).sort((a,b)=>b.id-a.id)[0];
  if(!chosen)continue;
  let jobs,artifacts;
  try{
   jobs=await pages('/actions/runs/'+chosen.id+'/jobs?filter=latest','jobs');
   artifacts=await pages('/actions/runs/'+chosen.id+'/artifacts','artifacts');
  }catch(e){observations.push({file,run:chosen,error:String(e.message)});continue;}
  observations.push({file,run:chosen,jobs,artifacts});
 }
 return observations;
}
async function baselineChecks(sha){
 const info=await pages('/commits/'+sha+'/check-runs','check_runs');
 return {sha,total:info.total_count,counts:info.check_runs.reduce((a,c)=>{const k=c.status==='completed'?(c.conclusion??'unknown'):c.status;a[k]=(a[k]??0)+1;return a;},{}),jobs:info.check_runs.filter(c=>c.name?.startsWith('F05-')).map(c=>({id:c.id,name:c.name,status:c.status,conclusion:c.conclusion,url:c.details_url}))};
}
async function main(){
 authorizedRuntime();
 const now=new Date().toISOString(),sha=process.env.GITHUB_SHA;
 const report={schema:'F05_PARENT_PROOF_READINESS_READ_ONLY_V1',observed_at:now,repo:REPO,run_sha:sha,baseline_sha:BASELINE_SHA,source_type:'OFFICIAL_GITHUB_READ_ONLY_API',formal_parent_positive:false,production_ready:false,sources:[],baseline_checks:null,errors:[]};
 for(const spec of SOURCES){
  try{report.sources.push(assessSource(spec,await observationsFor(sha,spec),sha));}
  catch(e){report.sources.push({id:spec.id,...recordGap('OFFICIAL_API_UNAVAILABLE_OR_INCOMPLETE',{error:String(e.message)})});}
 }
 try{report.baseline_checks=await baselineChecks(BASELINE_SHA);}catch(e){report.errors.push('BASELINE_CHECKS_'+e.message);}
 report.all_sources='SOURCE_GAP';
 writeFileSync('f05-parent-proof-live.json',JSON.stringify(report,null,2)+'\n');
 console.log('F05_PARENT_PROOF_AUDIT_SOURCE_GAP',JSON.stringify({sha,baseline_checks:report.baseline_checks?.total??null,sources:report.sources.map(s=>[s.id,s.status,s.reason])}));
 if(report.errors.length)console.log('F05_BASELINE_API_INCOMPLETE',report.errors.join(';'));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv[2]!=='audit') {console.error('AUDIT_ONLY_COMMAND');process.exitCode=2;}
 else main().catch(e=>{console.error('F05_PARENT_AUDIT_BLOCKED',e.message);process.exitCode=2;});
}
