import {readFile,mkdir,writeFile} from 'node:fs/promises';
const repo=process.env.GITHUB_REPOSITORY,token=process.env.GH_ACTIONS_READ_TOKEN;
if(repo!=='suzhe868-arch/mb'||!token||process.env.CI!=='true'||process.env.GITHUB_ACTIONS!=='true')
 throw Error('F05_10_GITHUB_PUSH_AUDIT_GATE');
import {verifyCurrentPullRequestRun} from '../source-gate-event-evidence.mjs';
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
if(process.env.GITHUB_EVENT_NAME==='pull_request'){
 await verifyCurrentPullRequestRun({workflowPath:".github/workflows/f05-10-consultation-assignee-sla.yml",sourceJobName:"F05-10 new Source v26 true PG16",expectedJobs:2,artifactDirectory:"engineering/f05/consultation-assignee-sla/artifacts/source/"});
 process.exit(0);
}
if(process.env.GITHUB_EVENT_NAME!=='push')throw Error('SOURCE_GATE_UNSUPPORTED_EVENT_FAIL_CLOSED');

const sha=event.pull_request?.head?.sha??process.env.GITHUB_SHA;
if(!/^[a-f0-9]{40}$/.test(sha))throw Error('F05_10_INVALID_HEAD');
const old=[['h52',52],['i2',2],['j2',2],['k2',2],['f05-4-2',2],['f05-5-2',2],['f05-6-2',2],['f05-8-four',4],['f05-9-two',2]];
async function api(path){
 const r=await fetch('https://api.github.com/repos/'+repo+path,{headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json'}});
 if(!r.ok)throw Error('F05_10_GITHUB_ACTIONS_API_'+r.status);
 return r.json();
}
let evidence=null;
for(let n=0;n<190;n++){
 const runs=(await api('/actions/runs?head_sha='+sha+'&per_page=100')).workflow_runs??[];
 let total=0,pending=false;const records=[];
 for(const [tag,expected] of old){
  const file='f05-10-frozen-'+tag+'-revalidation.yml';
  const run=runs.filter(x=>x.event==='push'&&x.head_sha===sha&&x.path?.endsWith('/'+file)).sort((a,b)=>b.id-a.id)[0];
  if(!run){pending=true;records.push({file,missing:true});continue}
  const jobs=await api('/actions/runs/'+run.id+'/jobs?per_page=100');
  const success=(jobs.jobs||[]).filter(j=>j.status==='completed'&&j.conclusion==='success').length;
  const skipped=(jobs.jobs||[]).filter(j=>j.conclusion==='skipped').length;
  records.push({file,runId:run.id,event:run.event,head:run.head_sha,expected,count:jobs.total_count,success,skipped});
  if(run.status==='completed'&&run.conclusion!=='success')throw Error('F05_10_FROZEN_PUSH_FAILED_'+tag);
  if(run.status!=='completed'||run.conclusion!=='success'||jobs.total_count!==expected||success!==expected||skipped)pending=true;
  else total+=success;
 }
 const mine=runs.find(x=>x.id===Number(process.env.GITHUB_RUN_ID));
 if(!mine||mine.event!=='push'||mine.head_sha!==sha||!mine.path?.endsWith('/f05-10-consultation-assignee-sla.yml'))
  throw Error('F05_10_NOT_NEW_OFFICIAL_PUSH');
 const jobs=await api('/actions/runs/'+mine.id+'/jobs?per_page=100');
 const https=(jobs.jobs||[]).filter(j=>j.name==='F05-10 new HTTPS v26 true PG16');
 if(jobs.total_count!==2||https.length!==1||https[0].status!=='completed'||https[0].conclusion!=='success')pending=true;
 if(n%5===0)console.log('F05_10_OFFICIAL_72_PROGRESS',JSON.stringify({sha,n,successOld:total}));
 if(!pending&&total===70){evidence={head:sha,old:records,oldSuccess:70,newRunId:mine.id,
  newHttpsSuccess:true,newSourceStillExecuting:true,expectedTotal:72,officialPushRuns:10};break}
 await new Promise(ok=>setTimeout(ok,12000));
}
if(!evidence)throw Error('F05_10_TEN_REAL_PUSH_SEVENTY_TWO_NOT_PROVEN');
const dir=new URL('./artifacts/source/',import.meta.url);await mkdir(dir,{recursive:true});
await writeFile(new URL('official-ten-push-same-sha-72.json',dir),JSON.stringify(evidence,null,2)+'\n');
console.log('F05_10_OFFICIAL_GITHUB_TEN_PUSH_SAME_SHA_72',JSON.stringify(evidence));
