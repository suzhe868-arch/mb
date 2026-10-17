// F05-F08 版本化证据契约：CI结果的字节/运行关联验证，不签发五条历史业务Source。
export const REPO='suzhe868-arch/mb';
export const LEVEL=Object.freeze({exact:'PROVEN_EXACT_SHA',old:'HISTORIC_DIFFERENT_SHA',retry:'REVALIDATION_REQUIRED',gap:'SOURCE_GAP'});
const sha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const id=x=>Number.isSafeInteger(x)&&x>0;
const completed=x=>x?.status==='completed'&&x?.conclusion==='success';
function fail(code){throw Error('F05_F08_'+code)}
const safePath=p=>typeof p==='string'&&p.length>0&&p.length<250&&!p.startsWith('/')&&!p.includes('..')&&!p.includes('\\')&&!p.includes('\0');
export function validateContext(c){
 if(!c||c.repo!==REPO||!sha(c.candidateSha)||!sha(c.observedSha)||!c.branch||!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{1,180}$/.test(c.branch)||c.branch.includes('..')||c.branch.includes('//'))fail('CONTEXT_INVALID');
 if(c.event!=='push'||!safePath(c.workflow)||!c.workflow.startsWith('.github/workflows/')||!c.workflow.endsWith('.yml'))fail('EVENT_OR_PATH_INVALID');
 if(!id(c.attempt)||!id(c.runId))fail('ATTEMPT_OR_RUN_INVALID');
 return true;
}
export function validateNativeProof(c,api){
 validateContext(c);
 if(api?.error||api?.http_error||api?.ok===false)fail('GITHUB_API_ERROR');
 if(!api||!api.run||!Array.isArray(api.checks)||!Array.isArray(api.jobs)||!Array.isArray(api.artifacts))fail('GITHUB_API_INCOMPLETE');
 const run=api.run;
 if(run.repository?.full_name!==REPO||run.head_branch!==c.branch||run.head_sha!==c.observedSha||run.id!==c.runId||run.run_attempt!==c.attempt||run.event!=='push')fail('RUN_ORIGIN_MISMATCH');
 if(run.path!==c.workflow+'@refs/heads/'+c.branch&&run.path!==c.workflow)fail('RUN_WORKFLOW_MISMATCH');
 if(!completed(run))fail('RUN_NOT_SUCCESS');
 if(!api.checks.length||!api.jobs.length||!api.artifacts.length)fail('MISSING_CHECK_JOB_ARTIFACT');
 if(api.checks_total!==api.checks.length||api.jobs_total!==api.jobs.length||api.artifacts_total!==api.artifacts.length)fail('INCOMPLETE_GITHUB_PAGES');
 const checks=new Set(),jobs=new Set(),artifacts=new Set();
 for(const ckr of api.checks){
  if(!id(ckr.id)||checks.has(ckr.id)||!ckr.name||ckr.head_sha!==c.observedSha||!completed(ckr)||!ckr.completed_at)fail('CHECK_INVALID');
  if(ckr.details_url!=='https://github.com/'+REPO+'/actions/runs/'+c.runId+'/job/'+ckr.id)fail('CROSS_RUN_CHECK');checks.add(ckr.id);
 }
 for(const j of api.jobs){
  if(!id(j.id)||jobs.has(j.id)||j.run_id!==c.runId||!completed(j)||!checks.has(j.id)||j.name!==api.checks.find(x=>x.id===j.id).name)fail('JOB_INVALID');
  jobs.add(j.id);
 }
 if(jobs.size!==checks.size)fail('CHECK_JOB_COUNT_MISMATCH');
 for(const a of api.artifacts){
  if(!id(a.id)||artifacts.has(a.id)||a.expired!==false||!Number.isSafeInteger(a.size_in_bytes)||a.size_in_bytes<=0||!a.name||a.workflow_run?.id!==c.runId||a.workflow_run?.head_sha!==c.observedSha)fail('ARTIFACT_INVALID');
  if(typeof a.digest!=='string'||!/^sha256:[a-f0-9]{64}$/i.test(a.digest))fail('ARTIFACT_DIGEST_INVALID');
  artifacts.add(a.id);
 }
 return Object.freeze({level:c.observedSha===c.candidateSha?LEVEL.exact:LEVEL.old,
  observed_sha:c.observedSha,candidate_sha:c.candidateSha,run_id:c.runId,run_attempt:c.attempt,
  jobs_confirmed:jobs.size,artifacts_confirmed:artifacts.size,origin:'UNVERIFIED_GITHUB_API_SHAPED_STRUCTURE_ONLY',official_api_verified:false,
  formal_source_issuer_signed:false,source_gate:'SOURCE_GAP',production_ready:false});
}
export function classifyCandidate(c,api){
 validateContext(c);
 try{return validateNativeProof(c,api)}
 catch(e){return Object.freeze({level:!api?.run||api?.error?LEVEL.gap:LEVEL.retry,error:String(e.message),source_gate:'SOURCE_GAP',formal_source_issuer_signed:false,production_ready:false})}
}
const DEPENDENCIES=Object.freeze([
 {prefix:'engineering/f05/',affected:['F05','F06','F07','F08']},
 {prefix:'engineering/f06/',affected:['F06','F08']},
 {prefix:'engineering/f07/',affected:['F07','F08']},
 {prefix:'engineering/f08/',affected:['F08']},
 {prefix:'engineering/f03/',affected:['F03','F05','F06','F07','F08'],shared:true},
 {prefix:'engineering/src/',affected:['F01','F05','F06','F07','F08'],shared:true},
 {prefix:'engineering/package',affected:['F05','F06','F07','F08'],shared:true},
 {prefix:'.github/workflows/',affected:['F05','F06','F07','F08'],shared:true},
]);
export function analyzeImpact({baseSha,candidateSha,changedPaths}={}){
 if(!sha(baseSha)||!sha(candidateSha)||baseSha===candidateSha||!Array.isArray(changedPaths)||!changedPaths.length)fail('IMPACT_INPUT_INVALID');
 const affected=new Set(),unknown=[];
 let shared=false;
 for(const p of changedPaths){
  if(!safePath(p))fail('IMPACT_PATH_INVALID');
  const dep=DEPENDENCIES.find(x=>p.startsWith(x.prefix));
  if(!dep){unknown.push(p);shared=true;continue}
  dep.affected.forEach(x=>affected.add(x));if(dep.shared)shared=true;
 }
 if(unknown.length){['F05','F06','F07','F08'].forEach(x=>affected.add(x))}
 return {base_sha:baseSha,candidate_sha:candidateSha,affected_domains:[...affected].sort(),
  unknown_shared_paths:unknown,shared_dependency_changed:shared,requires_revalidation:true,
  level:unknown.length?LEVEL.gap:LEVEL.retry,formal_source_issuer_signed:false,production_ready:false};
}
