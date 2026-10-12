// F05-7 B independent official GitHub Actions GET-only audit; never approves production.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GH_ACTIONS_READ_TOKEN;
if(repo!=='suzhe868-arch/mb'||!token||process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')
 throw Error('F05_7_OFFICIAL_ACTIONS_READ_ONLY_AUDIT_GATE');
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
const target=event.pull_request?.head?.sha??process.env.GITHUB_SHA;
if(!/^[0-9a-f]{40}$/.test(target))throw Error('F05_7_INVALID_HEAD_SHA');
const paths=[
 ['f05-7-frozen-h52-revalidation.yml',52],
 ['f05-7-frozen-i2-revalidation.yml',2],
 ['f05-7-frozen-j2-revalidation.yml',2],
 ['f05-7-frozen-k2-revalidation.yml',2],
 ['f05-7-frozen-f05-4-2-revalidation.yml',2],
 ['f05-7-frozen-f05-5-2-revalidation.yml',2],
 ['f05-7-frozen-f05-6-2-revalidation.yml',2]
];
async function api(path){
 const res=await fetch('https://api.github.com/repos/'+repo+path,{
  headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'}
 });
 if(!res.ok)throw Error('F05_7_GITHUB_ACTIONS_API_'+res.status+'_'+path.slice(0,50));
 return res.json();
}
const snooze=ms=>new Promise(r=>setTimeout(r,ms));
let final=null;
for(let attempt=0;attempt<40;attempt++){
 const data=await api('/actions/runs?head_sha='+target+'&per_page=100');
 const all=data.workflow_runs??[],rows=[];let pending=false;
 for(const [file,expected] of paths){
  const candidates=all.filter(r=>r.path?.endsWith('/'+file)&&r.head_sha===target&&r.event==='push')
   .sort((a,b)=>b.id-a.id);
  const x=candidates[0];
  if(!x){rows.push({workflow:file,expected,runId:null,state:'missing'});pending=true;continue}
  const jobs=await api('/actions/runs/'+x.id+'/jobs?per_page=100');
  const list=jobs.jobs||[],succeeded=list.filter(j=>j.status==='completed'&&j.conclusion==='success').length;
  const skipped=list.filter(j=>j.conclusion==='skipped').length;
  const status={workflow:file,expected,runId:x.id,attempt:x.run_attempt,headSHA:x.head_sha,runStatus:x.status,
   conclusion:x.conclusion,jobCount:jobs.total_count,successes:succeeded,skipped};
  rows.push(status);
  if(x.status!=='completed'||jobs.total_count!==expected||succeeded!==expected||skipped!==0){
   if(x.status==='completed'&&x.conclusion!=='success')
    throw Error('F05_7_HISTORICAL_CI_FAILURE_NEEDS_OFFICIAL_SAME_SHA_RERUN_'+JSON.stringify(status));
   pending=true;
  }
 }
 const currentRun=await api('/actions/runs/'+process.env.GITHUB_RUN_ID+'/jobs?per_page=100');
 const selfJobs=currentRun.jobs||[],https=selfJobs.find(j=>j.name?.includes('HTTPS denial test'));
 if(!https||https.status!=='completed'||https.conclusion!=='success')pending=true;
 const count=rows.reduce((n,r)=>n+r.successes,0);
 if(attempt%4===0)console.log('F05_7_OFFICIAL_64_OLD_PLUS_2_NEW_PROGRESS',
  JSON.stringify({targetSha:target,attempt,oldPassed:count,oldRequired:64,https:https?.conclusion||https?.status||'pending',
    rows:rows.map(x=>({workflow:x.workflow,runId:x.runId,successes:x.successes||0,expected:x.expected}))}));
 if(!pending&&count===64&&selfJobs.length===2){
  final={targetSha:target,githubRunId:process.env.GITHUB_RUN_ID,oldRuns:rows,oldPG16JobsSuccess:64,
   sameShaNewSourceTestPassed:true,sameShaNewHTTPSJobSuccess:true,expectedTotalPG16Jobs:66,
   sourceJobStillRunningUntilUpload:true,readOnlyOfficialAPI:true};
  break;
 }
 await snooze(15000);
}
if(!final)throw Error('F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN');
const dir=new URL('./artifacts/source/',import.meta.url);await mkdir(dir,{recursive:true});
await writeFile(new URL('official-github-actions-same-sha-66-audit.json',dir),JSON.stringify(final,null,2)+'\n');
console.log('F05_7_OFFICIAL_GITHUB_64_OLD_PLUS_2_NEW_READ_ONLY_AUDIT',JSON.stringify(final));
