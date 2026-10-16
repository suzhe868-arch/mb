// F05历史CI治理只读审计：绝不颁发历史父证明，也不替换冻结ci-job.sh。
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
export const EXPECTED=Object.freeze({
 'f05-7-deterministic-matching-readiness-four-tier.yml':{jobs:2,branch:'feat/f05-7-deterministic-matching-readiness-four-tier',runner:'engineering/f05/deterministic-matching-readiness-four-tier/ci-job.sh'},
 'f05-8-priority-arbitration-ttl-handover.yml':{jobs:4,branch:'feat/f05-8-priority-arbitration-ttl-handover',runner:'engineering/f05/priority-arbitration-ttl-handover/ci-job.sh'},
 'f05-9-recommendation-visibility-grants.yml':{jobs:2,branch:'feat/f05-9-recommendation-visibility-grants',runner:'engineering/f05/recommendation-visibility-grants/ci-job.sh'},
 'f05-10-consultation-assignee-sla.yml':{jobs:2,branch:'feat/f05-10-consultation-assignee-sla',runner:'engineering/f05/consultation-assignee-sla/ci-job.sh'},
 'f05-10-d1-public-pool-owner-claim.yml':{jobs:2,branch:'feat/f05-10-d1-pdm17-public-pool-owner-claim',runner:'engineering/f05/pdm17-public-pool-owner-claim/ci-job.sh'},
});
export const BASELINE_SHA='f368ed870a4d432f25eb2fb1fb3915f78a4fd720';
export function examineWorkflow(text,name){
 const x=EXPECTED[name];if(!x)throw Error('F05_UNAUTHORIZED_WORKFLOW');
 const count=(s)=>(text.match(s)||[]).length;
 if(count(/image: postgres:16\s*$/gm)!==x.jobs)throw Error('F05_POSTGRES16_IMAGE_COUNT:'+name);
 if(count(/^\s*image:\s*public\.ecr\.aws\/docker\/library\/postgres:16-alpine\s*$/gm)!==0||text.includes('docker pull public.ecr.aws/docker/library/postgres:16-alpine'))throw Error('F05_ECR_LIMITED_IMAGE_REMAINS:'+name);
 if(count(/services:\s*\n\s*postgres:/g)!==x.jobs)throw Error('F05_PG_SERVICE_REMOVED:'+name);
 if((text.split('docker tag postgres:16 public.ecr.aws/docker/library/postgres:16-alpine').length-1)!==x.jobs)throw Error('F05_LEGACY_ANCESTOR_LOCAL_ALIAS_MISSING:'+name);
 if(count(/F05_PG16_DOCKERHUB_LOCAL_TAG_ALIAS_CONFIRMED_NO_ECR_NETWORK_PULL/g)!==x.jobs)throw Error('F05_DOCKERHUB_ORIGIN_AUDIT_MISSING:'+name);
 if(count(/ci-job\.sh\s+(source|https|priority-source|priority-https|compat-source|compat-https)/g)!==x.jobs)throw Error('F05_TEST_ENTRY_REDUCED:'+name);
 if(count(/uses: actions\/upload-artifact@v4/g)!==x.jobs)throw Error('F05_ORIGINAL_ARTIFACT_REDUCED:'+name);
 if(count(/if-no-files-found: error/g)!==x.jobs)throw Error('F05_ARTIFACT_REQUIRED:'+name);
 if(!text.includes('push:')||!text.includes(x.branch)||!text.includes('pull_request:')||!text.includes('branches: [main]')||!text.includes('workflow_dispatch:'))throw Error('F05_ORIGINAL_TRIGGERS_MODIFIED:'+name);
 if(!text.includes(x.runner)||/continue-on-error:\s*true|\|\|\s*true|\|\|\s*exit 0/.test(text))throw Error('F05_SOURCE_GATE_BYPASS:'+name);
 if(count(/POSTGRES_USER:\s*postgres|POSTGRES_USER: postgres/g)!==x.jobs)throw Error('F05_BOOTSTRAP_ROLE_CHANGED:'+name);
 return {workflow:name,legacy_jobs:x.jobs,image:'postgres:16',expected_pg_major:16,source_gate_retained:true,original_push_ref_retained:true,pr_main_trigger_retained:true,artifact_required:true};
}
export function auditWorkflows(){
 const rows=Object.keys(EXPECTED).map(f=>examineWorkflow(readFileSync(resolve(ROOT,'.github/workflows',f),'utf8'),f));
 if(rows.reduce((n,x)=>n+x.legacy_jobs,0)!==12)throw Error('F05_EXPECTED_12_JOBS_MISSING');
 return rows;
}
export function normalizeCheck(c,sha){
 if(!/^[a-f0-9]{40}$/.test(sha)||c?.head_sha!==sha)throw Error('F05_WRONG_SHA');
 if(!Number.isSafeInteger(c.id)||!c.name||!c.details_url)throw Error('F05_CHECK_ORIGIN_INVALID');
 if(c.status==='queued'||c.status==='in_progress')return c.status.toUpperCase();
 if(c.status!=='completed')throw Error('F05_UNSUPPORTED_STATE');
 if(!['success','failure','cancelled','skipped'].includes(c.conclusion))throw Error('F05_CONCLUSION_INVALID');
 return c.conclusion.toUpperCase();
}
export function classifyFailure({state,log='',event='',sourceAuthorized=false}={}){
 if(state==='QUEUED'||state==='IN_PROGRESS')return 'PENDING';
 if(state==='SUCCESS')return 'SUCCESS_OBSERVED_CI_ONLY';
 if(/toomanyrequests: Data limit exceeded|Docker pull failed/.test(log))return 'EXTERNAL_RESOURCE_LIMIT';
 if(/NOT_IN_OFFICIAL_NEW_PUSH|NOT_NEW_OFFICIAL_PUSH|CANNOT_PROVE_[0-9]+_SAME_SHA|OFFICIAL_[0-9]+_JOB_GATE_UNPROVEN/.test(log)||(!sourceAuthorized&&event==='pull_request'&&state==='FAILURE'))return 'STRICT_PARENT_PUSH_NOT_ELIGIBLE';
 if(state==='FAILURE')return 'TRUE_TEST_FAILURE_OR_UNCLASSIFIED_REQUIRES_LOG';
 return 'NOT_A_PARENT_PROOF';
}
export function summarizeChecks(api,sha){
 if(!api||!Array.isArray(api.check_runs)||!Number.isSafeInteger(api.total_count)||api.total_count!==api.check_runs.length)throw Error('F05_LIVE_API_INCOMPLETE');
 const seen=new Set();const checks=api.check_runs.map(c=>{
  if(seen.has(c.id))throw Error('F05_DUPLICATE_CHECK_ID');seen.add(c.id);
  return {check_id:c.id,name:c.name,head_sha:c.head_sha,state:normalizeCheck(c,sha),details_url:c.details_url,source_authorized:false,formal_parent_positive:false};
 });
 const legacy=checks.filter(x=>x.name.startsWith('F05-'));
 return {snapshot_kind:'LIVE_NONPRODUCTION_CHECKS_ONLY',sha,observed_at:new Date().toISOString(),total_checks:checks.length,legacy_count:legacy.length,legacy,states:legacy.reduce((a,x)=>(a[x.state]=(a[x.state]??0)+1,a),{}),historical_parent_proof_source_gap:true,not_business_ready:true,not_a_success_certificate:true};
}
async function pages(repo,sha,token){
 const data=[];let page=1,total=null;
 do {
  const url='https://api.github.com/repos/'+repo+'/commits/'+sha+'/check-runs?per_page=100&page='+page++;
  const response=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('F05_READ_ONLY_API_HTTP_'+response.status);
  const b=await response.json();if(!Array.isArray(b.check_runs)||!Number.isSafeInteger(b.total_count))throw Error('F05_BAD_API_RESPONSE');
  if(total!==null&&total!==b.total_count)throw Error('F05_PAGINATION_CHANGED');
  total=b.total_count;data.push(...b.check_runs);
  if(page>12&&data.length<total||!b.check_runs.length&&data.length<total)throw Error('F05_PAGINATION_INCOMPLETE');
 }while(data.length<total);
 if(data.length!==total)throw Error('F05_CHECK_COUNT_MISMATCH');
 return {total_count:total,check_runs:data};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv[2]!=='audit')throw Error('F05_ONLY_AUDIT_SUBCOMMAND');
  const workflows=auditWorkflows();const sha=process.env.GITHUB_SHA;
  if(!/^[a-f0-9]{40}$/.test(sha))throw Error('F05_OFFICIAL_SHA_REQUIRED');
  const report={audit:'F05_CI_GOVERNANCE_01',head_sha:sha,workflows,expected_legacy_jobs:12,formal_parent_positive:false,production_ready:false,source_gaps:['66/68/70 SAME_SHA OFFICIAL JOBS','SIGNED_PARENT_OFFICIAL_PUSH'],required_checks:'UNKNOWN',generated_at:new Date().toISOString()};
  writeFileSync('f05-ci-governance-static.json',JSON.stringify(report,null,2)+'\n');
  console.log('F05_GOVERNANCE_STATIC_12_JOBS_PRESERVED',sha);
  if(process.env.GITHUB_TOKEN){
   const repo=process.env.GITHUB_REPOSITORY;if(repo!=='suzhe868-arch/mb')throw Error('F05_REPO_MISMATCH');
   const live=summarizeChecks(await pages(repo,sha,process.env.GITHUB_TOKEN),sha);
   writeFileSync('f05-ci-governance-live.json',JSON.stringify(live,null,2)+'\n');
   console.log('F05_LIVE_CHECKS_SNAPSHOT_ONLY',live.legacy_count,JSON.stringify(live.states),'NO_PARENT_PROOF');
  }
  console.log('F05_HISTORICAL_PARENT_PROOF_SOURCE_GAP');
 }catch(e){console.error('F05_CI_GOVERNANCE_DENIED',e.message);process.exitCode=1;}
}
