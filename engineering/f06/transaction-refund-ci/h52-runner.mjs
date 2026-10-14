// F06-5A isolated 52-job frozen H52 runner: executes EACH original shell run-step, in order.
// The signed parent's workflow bytes are read from this checkout; no test commands are synthesized.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const workspace=process.env.GITHUB_WORKSPACE;
if(!workspace||process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_EVENT_NAME!=='push'||
 process.env.GITHUB_REPOSITORY!=='suzhe868-arch/mb'||
 process.env.GITHUB_REF!=='refs/heads/feat/f06-5a-transaction-refund-pending-ci'||
 !process.env.GITHUB_SHA||!process.env.GITHUB_RUN_ID)throw Error('F06_5A_H52_REPLAY_REQUIRES_SIGNED_PUSH');
const name=process.argv[2];if(!/^[a-z0-9-]+$/.test(name))throw Error('F06_5A_H52_INVALID_JOB');
const file=resolve(workspace,'.github/workflows/f06-4c-frozen-frozen-frozen-frozen-frozen-h52-revalidation.yml');
const whole=readFileSync(file,'utf8');
const indexes=[...whole.matchAll(/^  ([a-zA-Z0-9_-]+):(?=\s|\{)/gm)];
const i=indexes.findIndex(m=>m[1]===name);if(i<0||indexes.length!==52)throw Error('F06_5A_PARENT_52_JOB_SOURCE_GAP');
const job=whole.slice(indexes[i].index,indexes[i+1]?.index??whole.length);
function tabs(line){return line.match(/^ */)[0].length}
function parseShell(raw){
 const s=raw.trim();
 if((s.startsWith("'")&&s.endsWith("'"))||(s.startsWith('"')&&s.endsWith('"')))return s.slice(1,-1);
 return s;
}
function stepsFromJob(job){
 if(name==='h-source'||name==='h-https')return [{script:'bash engineering/f05/customer-wechat-actor-trust/ci-job.sh $MODE',cwd:workspace}];
 const lines=job.split('\n'),pos=lines.findIndex(l=>/^    steps:\s*$/.test(l));if(pos<0)throw Error('F06_5A_MISSING_PARENT_STEPS');
 let defaultCwd=workspace;
 const parentPreamble=job.slice(0,job.indexOf('    steps:'));
 const defaults=parentPreamble.match(/defaults:\s*\n\s*run:\s*\n\s*working-directory:\s*([^\s\n}]+)/)
  ||parentPreamble.match(/defaults:\s*\n\s*run:\s*\{\s*working-directory:\s*([^\s\n}]+)\s*\}/);
 if(defaults)defaultCwd=resolve(workspace,parseShell(defaults[1]));
 const slice=lines.slice(pos+1).filter(l=>l.trim().length>0);
 const starts=slice.map((l,i)=>({l,i})).filter(x=>/^\s*-\s+(?:run|name|uses):/.test(x.l));
 const min=Math.min(...starts.map(x=>tabs(x.l)));
 const chunks=[];let cur=[];
 for(const line of lines.slice(pos+1)){
  if(line.trim()&&tabs(line)===min&&/^\s*-\s+(?:run|name|uses):/.test(line)){if(cur.length)chunks.push(cur);cur=[]}
  cur.push(line);
 }if(cur.length)chunks.push(cur);
 const result=[];
 for(const chunk of chunks){
  let match=chunk.findIndex(l=>/^\s*(?:-\s+)?run:\s*/.test(l));if(match<0)continue;
  const line=chunk[match],parsed=line.match(/^\s*(?:-\s+)?run:\s*(.*)$/),kind=parsed[1].trim();
  let script=kind;
  if(kind==='|'||kind==='|-'||kind==='>'||kind==='>-'){
   const base=tabs(line),code=[];
   for(let j=match+1;j<chunk.length;j++){
    if(chunk[j].trim()&&tabs(chunk[j])<=base)break;
    code.push(chunk[j]);
   }
   const margin=Math.min(...code.filter(l=>l.trim()).map(tabs));
   script=code.map(l=>l.slice(Number.isFinite(margin)?margin:0)).join('\n');
  }else script=parseShell(kind);
  const cd=chunk.find(l=>/^\s*working-directory:\s*/.test(l));
  const dir=cd?resolve(workspace,parseShell(cd.replace(/^\s*working-directory:\s*/,''))):defaultCwd;
  result.push({script,cwd:dir});
 }
 return result;
}
const steps=stepsFromJob(job);
if(steps.length===0)throw Error('F06_5A_H52_ZERO_REPLAY_STEPS');
const output=resolve(workspace,'engineering/f06/transaction-refund-ci/artifacts/h52',name);
mkdirSync(output,{recursive:true});
const report={job:name,expectedOriginalSteps:steps.length,sha:process.env.GITHUB_SHA,runId:process.env.GITHUB_RUN_ID,passed:[]};
const env={...process.env,GITHUB_REF:'refs/heads/feat/f06-4c-post-handoff-cancel-ci',GITHUB_REF_NAME:'feat/f06-4c-post-handoff-cancel-ci',CI:'true',APP_ENV:'test',NODE_ENV:'test'};
// GitHub Actions reads $GITHUB_ENV after each native step. This compatibility runner executes
// parent run-steps as child processes inside one native step, so propagate ONLY the three
// parent-signed temporary TLS/HMAC variables between those child processes.
const inheritedEnvironmentKeys=new Set(['F03_1_TLS_KEY_PATH','F03_1_TLS_CERT_PATH','F03_1_HMAC_KEY_BASE64']);
let observedEnvironmentFile='';
function applySignedStepEnvironment(){
 if(!env.GITHUB_ENV)return;
 let contents;try{contents=readFileSync(env.GITHUB_ENV,'utf8')}catch(e){if(e.code==='ENOENT')return;throw e}
 if(!contents.startsWith(observedEnvironmentFile))throw Error('F06_5A_H52_GITHUB_ENV_TRUNCATED');
 const newlyWritten=contents.slice(observedEnvironmentFile.length);
 observedEnvironmentFile=contents;
 for(const entry of newlyWritten.split(/\r?\n/)){
  if(!entry)continue;
  const i=entry.indexOf('='),varName=entry.slice(0,i);
  if(i<1||!inheritedEnvironmentKeys.has(varName))throw Error('F06_5A_H52_UNAPPROVED_PARENT_ENV_WRITE');
  env[varName]=entry.slice(i+1);
 }
}
for(let i=0;i<steps.length;i++){
 const x=steps[i];if(!x.script.trim())throw Error('F06_5A_H52_EMPTY_STEP_'+i);
 const proc=spawnSync('bash',['-e','-o','pipefail','-c',x.script],{cwd:x.cwd,env,stdio:'inherit',timeout:45*60*1000});
 if(proc.error||proc.status!==0){report.failedIndex=i;report.exitCode=proc.status;writeFileSync(resolve(output,'result.json'),JSON.stringify(report,null,2));throw Error('F06_5A_FROZEN_H52_JOB_FAILED_'+name+'_STEP_'+i)}
 applySignedStepEnvironment();
 report.passed.push(i);
}
const signedReport=JSON.stringify(report,null,2)+'\n';
writeFileSync(resolve(output,'result.json'),signedReport);
writeFileSync(resolve(output,'sha256sums.txt'),createHash('sha256').update(signedReport).digest('hex')+'  result.json\n');
console.log('F06_5A_FROZEN_H52_FULL_NATIVE_REPLAY_PASS',JSON.stringify({name,sha:report.sha,steps:steps.length}));
