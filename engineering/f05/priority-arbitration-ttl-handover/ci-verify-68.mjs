// F05-8 official read-only 68 independent PostgreSQL16 Jobs audit.
// Read-only Actions API. Never writes workflow status, permissions or production data.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GH_ACTIONS_READ_TOKEN;
if(repo!=='suzhe868-arch/mb'||!token||process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')
 throw Error('F05_8_OFFICIAL_GITHUB_AUDIT_SOURCE_GAP');
import {verifyCurrentPullRequestRun} from '../source-gate-event-evidence.mjs';
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
if(process.env.GITHUB_EVENT_NAME==='pull_request'){
 await verifyCurrentPullRequestRun({workflowPath:".github/workflows/f05-8-priority-arbitration-ttl-handover.yml",sourceJobName:"F05-8 priority Source v24 true PostgreSQL16 PG",expectedJobs:4,artifactDirectory:'./artifacts/source/'});
 process.exit(0);
}
if(process.env.GITHUB_EVENT_NAME!=='push')throw Error('SOURCE_GATE_UNSUPPORTED_EVENT_FAIL_CLOSED');

const head=event.pull_request?.head?.sha??process.env.GITHUB_SHA;
if(!/^[0-9a-f]{40}$/.test(head))throw Error('F05_8_INVALID_COMMIT_SHA');
const old=[
 ['f05-8-frozen-h52-revalidation.yml',52],
 ['f05-8-frozen-i2-revalidation.yml',2],['f05-8-frozen-j2-revalidation.yml',2],
 ['f05-8-frozen-k2-revalidation.yml',2],['f05-8-frozen-f05-4-2-revalidation.yml',2],
 ['f05-8-frozen-f05-5-2-revalidation.yml',2],['f05-8-frozen-f05-6-2-revalidation.yml',2]
];
const current='.github/workflows/f05-8-priority-arbitration-ttl-handover.yml';
const expectedNames=['compat-f05-7-source','compat-f05-7-https','priority-source','priority-https'];
async function api(s){
 const res=await fetch('https://api.github.com/repos/'+repo+s,{
  headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'}
 });if(!res.ok)throw Error('F05_8_GITHUB_API_ERROR_'+res.status+'_'+s);
 return res.json();
}
const snooze=ms=>new Promise(r=>setTimeout(r,ms));
let final=null;
for(let attempt=0;attempt<115;attempt++){
 const runs=(await api('/actions/runs?head_sha='+head+'&per_page=100')).workflow_runs||[];
 let pending=false,oldSuccess=0;const rows=[];
 for(const [file,required] of old){
  const candidates=runs.filter(r=>r.path?.endsWith('/'+file)&&r.event==='push'&&r.head_sha===head).sort((a,b)=>b.id-a.id);
  const run=candidates[0];
  if(!run){pending=true;rows.push({file,required,missing:true});continue}
  const a=await api('/actions/runs/'+run.id+'/jobs?per_page=100'),jobs=a.jobs||[];
  const success=jobs.filter(j=>j.status==='completed'&&j.conclusion==='success').length;
  const skip=jobs.filter(j=>j.conclusion==='skipped').length;
  const row={file,runId:run.id,required,jobs:a.total_count,success,skip,conclusion:run.conclusion,status:run.status,head:run.head_sha,attempt:run.run_attempt};
  rows.push(row);
  if(run.status==='completed'&&run.conclusion!=='success')
   throw Error('F05_8_OFFICIAL_FROZEN_JOB_FAILURE_RERUN_REQUIRED_'+JSON.stringify(row));
  if(run.status!=='completed'||a.total_count!==required||success!==required||skip!==0)pending=true;
  else oldSuccess+=success;
 }
 const self=runs.filter(r=>r.id===Number(process.env.GITHUB_RUN_ID)&&r.path===current);
 if(self.length!==1)throw Error('F05_8_SOURCE_NOT_IN_CURRENT_WORKFLOW');
 const all=await api('/actions/runs/'+process.env.GITHUB_RUN_ID+'/jobs?per_page=100'),jobs=all.jobs||[];
 const done=jobs.filter(j=>j.name&&j.status==='completed'&&j.conclusion==='success').length;
 const completed=jobs.filter(j=>j.name&&j.name!=='F05-8 priority Source v24 true PostgreSQL16 PG'&&j.status==='completed'&&j.conclusion==='success').length;
 // self must be pending (this script is part of that last Source Job)
 const others=jobs.filter(j=>!j.name?.includes('priority Source v24'));
 if(jobs.length!==4||others.length!==3||others.some(j=>j.status!=='completed'||j.conclusion!=='success'))pending=true;
 if(attempt%5===0)console.log('F05_8_OFFICIAL_68_PROGRESS',JSON.stringify({
  head,attempt,oldSuccess,requiredOld:64,otherNewCompleted:completed,
  status:rows.map(x=>[x.file,x.success,x.required]),new:jobs.map(x=>[x.name,x.status,x.conclusion])
 }));
 if(!pending&&oldSuccess===64){
  final={head,runId:Number(process.env.GITHUB_RUN_ID),old:rows,
   frozen64Success:true,compatOldF05_7Source28AndHTTPS7Success:true,priorityV24SourceStillRunningUntilExit:true,
   newOtherThreeJobsSuccess:true,expectedIndependentPostgreSQL16Jobs:68,skipped:0,
   allSameHead:true,readOnlyOfficialAPI:true,proof:'64 old + 2 signed F05-7 equivalents + 2 Priority new'};
  break;
 }
 await snooze(15000);
}
if(!final)throw Error('F05_8_OFFICIAL_68_JOB_GATE_UNPROVEN');
const dir=new URL('./artifacts/priority-source/',import.meta.url);await mkdir(dir,{recursive:true});
await writeFile(new URL('official-github-actions-same-sha-68-audit.json',dir),JSON.stringify(final,null,2)+'\n');
console.log('F05_8_OFFICIAL_GITHUB_64_FROZEN_PLUS_2_COMPAT_PLUS_2_NEW',JSON.stringify(final));
