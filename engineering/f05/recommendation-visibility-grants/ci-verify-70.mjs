// F05-9: read-only, same final push HEAD official nine-workflow PG16 70-job gate.
// No workflow control, no branch mutations, no public/production API Issuer.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GH_ACTIONS_READ_TOKEN;
if(repo!=='suzhe868-arch/mb'||!token||process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')
 throw Error('F05_9_OFFICIAL_70_SOURCE_NOT_SIGNED');
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
const head=event.pull_request?.head?.sha??process.env.GITHUB_SHA;
if(!/^[a-f0-9]{40}$/.test(head))throw Error('F05_9_INVALID_HEAD_SHA');
const old=[
 ['f05-9-frozen-h52-revalidation.yml',52],
 ['f05-9-frozen-i2-revalidation.yml',2],
 ['f05-9-frozen-j2-revalidation.yml',2],
 ['f05-9-frozen-k2-revalidation.yml',2],
 ['f05-9-frozen-f05-4-2-revalidation.yml',2],
 ['f05-9-frozen-f05-5-2-revalidation.yml',2],
 ['f05-9-frozen-f05-6-2-revalidation.yml',2],
 ['f05-9-frozen-f05-8-four-revalidation.yml',4]
];
async function api(path){
 const response=await fetch('https://api.github.com/repos/'+repo+path,{
  headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'}
 });
 if(!response.ok)throw Error('F05_9_GITHUB_ACTIONS_API_'+response.status);
 return response.json();
}
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
let evidence=null;
for(let n=0;n<150;n++){
 const runs=(await api('/actions/runs?head_sha='+head+'&per_page=100')).workflow_runs||[];
 const records=[];let success=0,pending=false;
 for(const [file,required] of old){
  const run=runs.filter(x=>x.event==='push'&&x.head_sha===head&&x.path?.endsWith('/'+file))
   .sort((a,b)=>b.id-a.id)[0];
  if(!run){pending=true;records.push({file,required,missing:true});continue}
  const jobs=await api('/actions/runs/'+run.id+'/jobs?per_page=100');
  const good=(jobs.jobs||[]).filter(x=>x.status==='completed'&&x.conclusion==='success').length;
  const skipped=(jobs.jobs||[]).filter(x=>x.conclusion==='skipped').length;
  const rec={file,runId:run.id,head:run.head_sha,event:run.event,status:run.status,
   conclusion:run.conclusion,required,count:jobs.total_count,success:good,skipped};
  records.push(rec);
  if(run.status==='completed'&&run.conclusion!=='success')throw Error('F05_9_FAILED_FROZEN_PUSH_RERUN_REQUIRED_'+JSON.stringify(rec));
  if(run.status!=='completed'||run.conclusion!=='success'||jobs.total_count!==required||good!==required||skipped)
   pending=true;
  else success+=good;
 }
 const mine=runs.find(x=>x.id===Number(process.env.GITHUB_RUN_ID));
 if(!mine||mine.event!=='push'||mine.head_sha!==head||
    !mine.path.endsWith('/f05-9-recommendation-visibility-grants.yml'))
  throw Error('F05_9_NOT_IN_OFFICIAL_NEW_PUSH');
 const newJobs=await api('/actions/runs/'+mine.id+'/jobs?per_page=100');
 const own=(newJobs.jobs||[]).filter(x=>x.name==='F05-9 new Source v25 true PG16').length;
 const other=(newJobs.jobs||[]).filter(x=>x.name==='F05-9 new HTTPS v25 true PG16');
 if(newJobs.total_count!==2||own!==1||other.length!==1||
    other[0].status!=='completed'||other[0].conclusion!=='success')pending=true;
 if(n%5===0)console.log('F05_9_OFFICIAL_70_PROGRESS',JSON.stringify({head,n,success,expectedOld:68,records:records.map(x=>[x.file,x.success,x.required])}));
 if(!pending&&success===68){
  evidence={head,newRunId:mine.id,old:records,successOld:68,newSourceStillExecuting:true,
    newHttpsJobPassed:true,expectedTotal:70,officialPushRuns:9,allSameSHA:true,
    noSkippedOrFailedJobs:true,readOnlyGitHubAPI:true};
  break;
 }
 await sleep(12000);
}
if(!evidence)throw Error('F05_9_OFFICIAL_70_NOT_PROVEN');
const dir=new URL('./artifacts/source/',import.meta.url);
await mkdir(dir,{recursive:true});
await writeFile(new URL('official-github-push-same-sha-70.json',dir),JSON.stringify(evidence,null,2)+'\n');
console.log('F05_9_OFFICIAL_GITHUB_NINE_PUSH_SAME_SHA_70',JSON.stringify(evidence));
