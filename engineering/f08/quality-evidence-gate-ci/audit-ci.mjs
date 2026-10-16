// F08-1 A03：仅使用官方GitHub Checks只读接口；运行期快照不等于完成后的最终验证。
import {writeFileSync} from 'node:fs';
import {normalizeCheck,isSha} from './quality.mjs';

export function summarizeGithubCheckRuns(api,expectedSha){
 if(!isSha(expectedSha))throw Error('CI_AUDIT_EXPECTED_SHA_INVALID');
 if(!api||!Array.isArray(api.check_runs)||!Number.isInteger(api.total_count)||api.total_count<api.check_runs.length)throw Error('CI_AUDIT_PAYLOAD_INVALID');
 const seen=new Set(),checks=api.check_runs.map(c=>{
  if(!Number.isInteger(c.id)||seen.has(c.id))throw Error('CI_AUDIT_DUPLICATE_OR_INVALID_JOB');
  seen.add(c.id);
  const checked=normalizeCheck({head_sha:c.head_sha,status:c.status,conclusion:c.conclusion},expectedSha);
  if(!c.details_url||!c.name)throw Error('CI_AUDIT_ORIGIN_MISSING');
  return {check_id:c.id,name:c.name,observed_sha:c.head_sha,status:c.status,conclusion:c.conclusion??null,state:checked.state,details_url:c.details_url,completed_at:c.completed_at??null,origin:'GH_REST_CHECK_RUNS_READ_ONLY'};
 });
 const old=checks.filter(x=>x.name.startsWith('F05-'));
 const n=checks.filter(x=>x.name.startsWith('F08-1'));
 const count=rows=>rows.reduce((a,x)=>(a[x.state]=(a[x.state]??0)+1,a),{success:0,failure:0,queued:0,in_progress:0,skipped:0,cancelled:0,missing:0});
 return {expected_sha:expectedSha,declared_total:api.total_count,observed_total:checks.length,
  old_f05:{count:old.length,states:count(old),global_old_ci_green:old.length>0&&old.every(x=>x.state==='success')},
  f08_1:{count:n.length,states:count(n)},
  all_checks_states:count(checks),checks,
  current_head_at_observation_only:true,not_a_final_success_certificate:true,
  history_not_inherited:true,branch_protection:'UNKNOWN'};
}

export async function captureLiveChecks({repo,sha,token,transport=fetch}){
 if(repo!=='suzhe868-arch/mb'||!isSha(sha)||!token)throw Error('LIVE_AUDIT_CONTEXT_INVALID');
 let page=1,total=null,all=[];
 do{
  const url='https://api.github.com/repos/'+repo+'/commits/'+sha+'/check-runs?per_page=100&page='+page;
  const response=await transport(url,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
  if(!response.ok)throw Error('LIVE_AUDIT_HTTP_'+response.status);
  const body=await response.json();
  if(!Number.isInteger(body.total_count)||!Array.isArray(body.check_runs))throw Error('LIVE_AUDIT_BAD_API');
  if(total!==null&&total!==body.total_count)throw Error('LIVE_AUDIT_PAGINATION_CHANGED');
  total=body.total_count;all.push(...body.check_runs);
  if(page++>=10&&all.length<total)throw Error('LIVE_AUDIT_TOO_MANY_JOBS');
  if(body.check_runs.length===0&&all.length<total)throw Error('LIVE_AUDIT_INCOMPLETE_PAGE');
 }while(all.length<total);
 const report=summarizeGithubCheckRuns({total_count:total,check_runs:all},sha);
 if(report.observed_total!==report.declared_total)throw Error('LIVE_AUDIT_COUNT_MISMATCH');
 report.observed_at_utc=new Date().toISOString();
 report.evidence_endpoint='https://api.github.com/repos/'+repo+'/commits/'+sha+'/check-runs';
 return report;
}
if(process.argv[1]&&import.meta.url==='file://'+process.argv[1]){
 try{
  const report=await captureLiveChecks({repo:process.env.GITHUB_REPOSITORY,sha:process.env.GITHUB_SHA,token:process.env.GITHUB_TOKEN});
  writeFileSync('f08-1-current-checks.json',JSON.stringify(report,null,2)+'\n');
  console.log('F08_1_LIVE_CHECK_SNAPSHOT_CAPTURED',report.expected_sha,'total',report.observed_total,'old_f05',report.old_f05.count,'states',JSON.stringify(report.all_checks_states),'NOT_FINAL_CERTIFICATE');
 }catch(e){console.error('F08_1_LIVE_CHECK_AUDIT_FAILED',e.message);process.exitCode=1;}
}
