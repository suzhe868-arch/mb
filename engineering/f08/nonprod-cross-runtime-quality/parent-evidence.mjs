// 只读历史父证据校验：结构正确也不能签发本 SHA 的业务正例。
export const PARENTS=Object.freeze([
 {id:'F06_ISSUE171',pr:174,run:39602409488,sha:'06c880d7f53adda7862da88cde0b790fdc60f415',
  branch:'feat/f06-nonprod-composite-lock-lifecycle-01',workflow:'.github/workflows/f06-nonprod-composite-lock-lifecycle-onejob.yml',
  jobs:[119229953562],artifacts:[12347892081]},
 {id:'F07_ISSUE178',pr:181,run:39629427298,sha:'32f180238ff3271b38d2b91402cf4a7b55e07d52',
  branch:'feat/f07-runtime-integration-nonprod-01',workflow:'.github/workflows/f07-runtime-integration-nonprod.yml',
  jobs:[119323288481,119323289005],artifacts:[12357563978,12357469078]}
]);
const repo='suzhe868-arch/mb',shaOk=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const yes=x=>x?.status==='completed'&&x?.conclusion==='success';
const bad=(condition,code)=>{if(condition)throw Error('F08_2_PARENT_'+code);};
export function verifyHistoricalParent(snapshot,expected,currentSha,now=Date.now()){
 const {pr,run,jobs,artifacts}=snapshot??{};
 bad(!shaOk(currentSha)||!shaOk(expected?.sha),'SHA_INVALID');
 bad(currentSha===expected.sha,'HISTORIC_REPLAY_AS_CURRENT');
 bad(!pr?.merged||pr.head?.sha!==expected.sha||!shaOk(pr.merge_commit_sha),'PR_NOT_MERGED_OR_HEAD_MISMATCH');
 bad(run?.id!==expected.run||run.head_sha!==expected.sha,'RUN_SHA_MISMATCH');
 bad(run.repository?.full_name!==repo||run.event!=='push'||run.head_branch!==expected.branch,'RUN_ORIGIN_MISMATCH');
 bad(run.path!==expected.workflow,'WORKFLOW_PATH_MISMATCH');
 bad(!Number.isSafeInteger(run.run_attempt)||run.run_attempt<1||!yes(run),'RUN_UNVERIFIED');
 bad(!Array.isArray(jobs)||jobs.length<expected.jobs.length,'JOBS_MISSING');
 for(const id of expected.jobs){
  const matches=jobs.filter(j=>j.id===id&&j.run_id===expected.run);
  bad(matches.length!==1||!yes(matches[0]),'JOB_MISSING_FAILED_OR_AMBIGUOUS');
 }
 bad(!Array.isArray(artifacts)||artifacts.length<expected.artifacts.length,'ARTIFACTS_MISSING');
 for(const id of expected.artifacts){
  const m=artifacts.filter(a=>a.id===id);
  bad(m.length!==1,'ARTIFACT_ID_MISSING');
  const a=m[0];
  bad(a.expired!==false||!Number.isFinite(a.size_in_bytes)||a.size_in_bytes<=0||
   !Number.isFinite(Date.parse(a.expires_at))||Date.parse(a.expires_at)<=now,'ARTIFACT_EXPIRED_EMPTY_OR_UNDATED');
  bad(a.workflow_run?.id!==expected.run||a.workflow_run?.head_sha!==expected.sha||
   a.workflow_run?.head_branch!==expected.branch,'ARTIFACT_PARENT_BINDING_MISMATCH');
 }
 return Object.freeze({parent:expected.id,sha:expected.sha,run:expected.run,level:'HISTORIC_DIFFERENT_SHA',
  current_head_positive:false,production_ready:false,verified_at:new Date(now).toISOString()});
}
async function read(url,token){
 if(!token)throw Error('F08_2_GITHUB_READ_TOKEN_MISSING');
 const r=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
  'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('F08_2_GITHUB_HTTP_'+r.status);
 return r.json();
}
export async function fetchAndVerifyParents({token,currentSha}){
 const out=[];
 for(const e of PARENTS){
  const prefix='https://api.github.com/repos/'+repo;
  const [pr,run,jobs,artifacts]=await Promise.all([
   read(prefix+'/pulls/'+e.pr,token),
   read(prefix+'/actions/runs/'+e.run,token),
   read(prefix+'/actions/runs/'+e.run+'/jobs?per_page=100',token),
   read(prefix+'/actions/runs/'+e.run+'/artifacts?per_page=100',token)
  ]);
  bad((jobs.total_count??0)>100||(artifacts.total_count??0)>100,'PAGINATION_INCOMPLETE');
  out.push(verifyHistoricalParent({pr,run,jobs:jobs.jobs,artifacts:artifacts.artifacts},e,currentSha));
 }
 return out;
}
