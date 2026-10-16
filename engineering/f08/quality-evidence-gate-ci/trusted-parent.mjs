// F08-1 R2：来源真实性边界。只有此模块执行的GitHub官方只读读取能产生私有受信回执。
// 重要：GitHub CI成功≠正式父业务签发；尚无A批准的父正例Issuer，默认全部拒绝。
const GITHUB_REPO='suzhe868-arch/mb';
const ISSUER_REGISTRY=Object.freeze({}); // 无正式SIGNED_PARENT_POSITIVE父Issuer授权，禁止凭CI名称自行添入。
const receiptSecrets=new WeakMap();
const nativeFetch=globalThis.fetch.bind(globalThis);
const shaOk=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const runIdOk=s=>typeof s==='string'&&/^[1-9][0-9]*$/.test(s);
const success=x=>x?.status==='completed'&&x?.conclusion==='success';
const exactGithubJobUrl=(url,runId,jobId)=>url==='https://github.com/'+GITHUB_REPO+'/actions/runs/'+runId+'/job/'+jobId;

export function validateParentGithubBinding(row,issuer,{run,checks,jobs}={}){
 if(!row||!issuer||!run||!Array.isArray(checks)||!Array.isArray(jobs))throw Error('PARENT_BINDING_INCOMPLETE');
 if(row.level!=='SIGNED_PARENT_VERIFIED'||row.positive_parent!=='YES')throw Error('PARENT_NOT_SIGNED_POSITIVE');
 if(!shaOk(row.evidence_sha)||!runIdOk(String(row.run_id))||!Number.isSafeInteger(Number(row.run_id)))throw Error('PARENT_RUN_ID_OR_SHA_INVALID');
 if(issuer.row_id!==row.id||issuer.workflow_path!==row.workflow_path||!issuer.check_name||!issuer.branch||issuer.parent_signed!==true)throw Error('PARENT_ISSUER_NOT_SIGNED');
 if(run.id!==Number(row.run_id)||run.head_sha!==row.evidence_sha)throw Error('PARENT_RUN_OR_SHA_MISMATCH');
 if(run.repository?.full_name!==GITHUB_REPO||run.event!=='push'||run.head_branch!==issuer.branch)throw Error('PARENT_RUN_ORIGIN_INVALID');
 if(run.path!==issuer.workflow_path+'@refs/heads/'+issuer.branch&&run.path!==GITHUB_REPO+'/'+issuer.workflow_path+'@refs/heads/'+issuer.branch)throw Error('PARENT_WORKFLOW_PATH_MISMATCH');
 if(!success(run))throw Error('PARENT_RUN_NOT_COMPLETED_SUCCESS');
 const matching=checks.filter(x=>x.name===issuer.check_name&&x.head_sha===row.evidence_sha);
 if(matching.length!==1)throw Error('PARENT_CHECK_MISSING_OR_AMBIGUOUS');
 const check=matching[0];
 if(!success(check)||!Number.isSafeInteger(check.id)||!check.completed_at)throw Error('PARENT_CHECK_NOT_COMPLETED_SUCCESS');
 if(!exactGithubJobUrl(check.details_url,run.id,check.id))throw Error('PARENT_CHECK_CROSS_RUN');
 const job=jobs.find(x=>x.id===check.id&&x.run_id===run.id);
 if(!job||!success(job)||job.name!==check.name)throw Error('PARENT_JOB_NOT_COMPLETED_SUCCESS');
 // 这里只验证JSON结构及跨源绑定，不赋予任何“已核验”身份；合成测试即使通过也不能发放回执。
 return Object.freeze({kind:'CI_BINDING_STRUCTURE_ONLY',eligible:false,sha:row.evidence_sha,run_id:row.run_id,check_id:check.id});
}

async function githubRead(path,token){
 if(!token||typeof token!=='string')throw Error('PARENT_READ_TOKEN_REQUIRED');
 const response=await nativeFetch('https://api.github.com/repos/'+GITHUB_REPO+'/'+path,{
  headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
  signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw Error('PARENT_GITHUB_READ_HTTP_'+response.status);
 return await response.json();
}
async function readPages(path,token,key){
 const first=await githubRead(path+'?per_page=100&page=1',token);
 if(!Array.isArray(first[key])||!Number.isSafeInteger(first.total_count))throw Error('PARENT_GITHUB_PAGE_INVALID');
 const all=[...first[key]],total=first.total_count;
 for(let page=2;all.length<total&&page<=10;page++){
  const body=await githubRead(path+'?per_page=100&page='+page,token);
  if(body.total_count!==total||!Array.isArray(body[key])||body[key].length===0)throw Error('PARENT_GITHUB_PAGE_CHANGED');
  all.push(...body[key]);
 }
 if(all.length!==total)throw Error('PARENT_GITHUB_RESULTS_INCOMPLETE');
 return all;
}
export async function obtainTrustedParentReceipt(row,{token}={}){
 // 签发权只能来自仓库正式确认后的静态白名单；不能由请求方传入issuer/provenance/transport。
 const issuer=ISSUER_REGISTRY[row?.id];
 if(!issuer||issuer.parent_signed!==true)throw Error('PARENT_POSITIVE_ISSUER_NOT_RELEASED');
 if(row.evidence_sha!==issuer.sha||String(row.run_id)!==issuer.run_id)throw Error('PARENT_ISSUER_PIN_MISMATCH');
 const run=await githubRead('actions/runs/'+issuer.run_id,token);
 const checks=await readPages('commits/'+issuer.sha+'/check-runs',token,'check_runs');
 const jobs=await readPages('actions/runs/'+issuer.run_id+'/jobs',token,'jobs');
 const structure=validateParentGithubBinding(row,issuer,{run,checks,jobs});
 const receipt=Object.freeze({kind:'INTERNAL_GITHUB_RECEIPT',row_id:row.id,sha:issuer.sha,run_id:issuer.run_id,check_id:structure.check_id,expires_at:Date.now()+10*60*1000});
 receiptSecrets.set(receipt,{row_id:row.id,sha:issuer.sha,run_id:issuer.run_id,issuer:issuer.row_id});
 return receipt;
}
export function assertTrustedParentReceipt(row,receipt){
 if(!receipt||typeof receipt!=='object'||!receiptSecrets.has(receipt))throw Error('PARENT_POSITIVE_TRUSTED_PROOF_REQUIRED');
 const actual=receiptSecrets.get(receipt),issuer=ISSUER_REGISTRY[row?.id];
 if(!issuer||issuer.parent_signed!==true||actual.issuer!==issuer.row_id)throw Error('PARENT_POSITIVE_ISSUER_NOT_RELEASED');
 if(actual.row_id!==row.id||actual.sha!==row.evidence_sha||actual.run_id!==String(row.run_id))throw Error('PARENT_POSITIVE_BINDING_MISMATCH');
 if(Date.now()>receipt.expires_at)throw Error('PARENT_POSITIVE_RECEIPT_EXPIRED');
 return true;
}
export const AUTHORIZED_PARENT_POSITIVE_ISSUER_COUNT=Object.keys(ISSUER_REGISTRY).length;
