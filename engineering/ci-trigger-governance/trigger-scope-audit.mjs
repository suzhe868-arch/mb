// A已签 CI 触发治理：只读清册/诊断，绝不修改历史F05 workflow或签发新父来源。
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join,relative} from 'node:path';

export const REPO='suzhe868-arch/mb';
const eventSet=['push','pull_request','pull_request_target','workflow_dispatch','workflow_call','schedule','repository_dispatch','workflow_run','merge_group'];
const nameRx=/^name:\s*(.*)$/m;
function topField(yaml,field){
 const lines=yaml.replace(/\r\n?/g,'\n').split('\n');
 const start=lines.findIndex(x=>new RegExp("^['\"]?"+field+"['\"]?:\\s*").test(x));
 if(start<0)return '';
 const out=[lines[start]];
 for(let i=start+1;i<lines.length;i++){
  const ln=lines[i];if(/^\S/.test(ln)&&!ln.startsWith('#'))break;out.push(ln);
 }
 return out.join('\n');
}
export function readTrigger(yaml){
 const block=topField(yaml,'on');
 if(!block)return {events:[],kind:'UNPARSEABLE',pathScoped:false,raw:''};
 const first=block.split('\n')[0].replace(/^['"]?on['"]?:\s*/,'').replace(/\s+#.*$/,'').trim();
 let events=[];
 if(first.startsWith('{')){
  events=eventSet.filter(e=>new RegExp('(?:\\{|,)\\s*'+e+'\\s*:').test(first));
 }else if(first.startsWith('['))events=eventSet.filter(e=>new RegExp('(?:\\[|,)\\s*'+e+'(?:\\s*,|\\s*\\])').test(first));
 else if(first && !first.startsWith('#') && eventSet.includes(first))events=[first];
 else if(!first){
  events=block.split('\n').slice(1).filter(x=>/^ {2}[\w-]+:/.test(x)).map(x=>x.trim().split(':')[0]).filter(x=>eventSet.includes(x));
 }
 events=[...new Set(events)];
 const pr=events.includes('pull_request')||events.includes('pull_request_target');
 // 严格只看pull_request自身的路径选择器；push.paths不得为宽PR伪造过滤条件。
 let prScope='';
 if(first.startsWith('{')){
  const match=first.match(/(?:^|[,{}])\s*pull_request(?:_target)?\s*:\s*\{([^{}]*)\}/);
  prScope=match?.[1]??'';
 }else if(!first){
  const lines=block.split('\n');
  let active=false;
  for(const line of lines.slice(1)){
   if(/^ {2}\S/.test(line)){
    active=/^ {2}pull_request(?:_target)?:/.test(line);
   }
   if(active)prScope+='\n'+line;
  }
 }
 const paths=pr&&/\bpaths\s*:/.test(prScope);
 const ignored=pr&&/\bpaths-ignore\s*:/.test(prScope);
 const hasPR=pr;
 // 只把明确有路径选择器判为过滤；绝不把 paths-ignore 视为可替代安全门禁。
 const prRestricted=hasPR&&(paths||ignored);
 return {events,kind:first.startsWith('{')?'INLINE_MAP':first.startsWith('[')?'INLINE_ARRAY':first?'SCALAR':'INDENTED',pathScoped:prRestricted,hasPaths:paths,hasPathsIgnore:ignored,hasPR,broadPR:hasPR&&!prRestricted,raw:block};
}
export function jobsAndCost(yaml){
 const block=topField(yaml,'jobs').split('\n').slice(1);
 const jobs=block.filter(x=>/^ {2}[a-zA-Z_][\w-]*:\s*(?:#.*)?$/.test(x)).map(x=>x.trim().slice(0,-1).trim());
 const t=[...yaml.matchAll(/^\s*timeout-minutes:\s*(\d+)\s*$/gm)].map(x=>Number(x[1]));
 return {jobIds:jobs,jobCount:jobs.length,timeoutCeilingMinutes:t.reduce((a,b)=>a+b,0),hasServices:/^\s+services:\s*$/m.test(yaml),hasPostgres:/\bpostgres:16\b|postgres:16-alpine\b/.test(yaml)};
}
export function classifyWorkflow(path,yaml){
 const event=readTrigger(yaml);
 const job=jobsAndCost(yaml);
 const n=(yaml.match(nameRx)?.[1]??'').trim().replace(/^['"]|['"]$/g,'');
 const frozen=/\/f05-(?:7|8|9|10)(?:-d1)?-frozen-|\/f05-(?:7|8|9|10)(?:-d1)?-[^.]*\.yml$/.test(path);
 const isF05=path.startsWith('.github/workflows/f05-');
 const guard=/GH_ACTIONS_READ_TOKEN|ci-verify-(?:66|68|70|72)|ci-job\.sh source/.test(yaml);
 const affected=isF05?'F05':path.includes('/c-app-')?'C':'OTHER';
 return {path,name:n,events:event.events,triggerForm:event.kind,prStatus:event.hasPR?(event.broadPR?'BROAD':'PATH_FILTERED'):'NO_PR',
  pathsConfigured:event.hasPaths,pathsIgnoreConfigured:event.hasPathsIgnore,jobCount:job.jobCount,
  timeoutCeilingMinutes:job.timeoutCeilingMinutes,hasPG16:job.hasPostgres,
  hasPGService:job.hasServices,officialSourceGuard:guard,frozenOrLegacyParent:frozen,
  criticalCandidate:frozen||guard,domain:affected,concurrency:/^concurrency:/m.test(yaml)||/^\s+concurrency:/m.test(yaml),
  rawTrigger:event.raw,sourceRisk:isF05&&(frozen||guard)?'DO_NOT_MODIFY_WITHOUT_A_PER_FILE_AUTHORIZATION':'A_PER_FILE_REVIEW_REQUIRED'};
}
export function scan(root){
 const dir=join(root,'.github/workflows');
 const files=readdirSync(dir).filter(f=>/\.ya?ml$/.test(f));
 return files.map(f=>classifyWorkflow('.github/workflows/'+f,readFileSync(join(dir,f),'utf8'))).sort((a,b)=>a.path.localeCompare(b.path));
}
export const cases=Object.freeze([
 {id:'C_ONLY',changes:['apps/mobile/src/pages/c01/index.tsx'],domains:['C']},
 {id:'F05_ONLY',changes:['engineering/f05/contract.js'],domains:['F05']},
 {id:'F08_ONLY',changes:['engineering/f08/contract.js'],domains:['F08']},
 {id:'SHARED',changes:['engineering/shared/auth.js','package-lock.json'],domains:['C','F05','F08']},
 {id:'WORKFLOW_SELF',changes:['.github/workflows/f05-10-consultation-assignee-sla.yml'],domains:['F05','CI']},
 {id:'MIXED',changes:['apps/mobile/src/pages/c01/index.tsx','engineering/f05/contract.js'],domains:['C','F05']},
 {id:'DOC_ONLY',changes:['07_重建工作区/CI治理.md'],domains:['DOC']}
]);
export function changedDomains(paths){
 const out=new Set();
 for(const p of paths){
  if(p.startsWith('.github/workflows/')){out.add('CI');if(/\/f05-/.test(p))out.add('F05');if(/\/c-app-/.test(p))out.add('C');continue;}
  if(p.startsWith('apps/mobile/'))out.add('C');
  else if(p.startsWith('engineering/f05/'))out.add('F05');
  else if(p.startsWith('engineering/f08/'))out.add('F08');
  else if(/^(engineering\/shared\/|package(-lock)?\.json$|pnpm-lock\.yaml$|yarn\.lock$|engineering\/package)/.test(p)){out.add('C');out.add('F05');out.add('F08');}
  else if(/(^|\/)(README|[^\/]+\.md)$/.test(p))out.add('DOC');
  else out.add('UNKNOWN');
 }
 return [...out].sort();
}
export function policyStatus(records){
 const bad=records.filter(r=>r.domain==='F05'&&r.prStatus==='BROAD');
 const names=new Map();for(const r of records){const k=r.name;if(!k)continue;names.set(k,[...(names.get(k)||[]),r.path]);}
 return {fileCount:records.length,f05Workflows:records.filter(r=>r.domain==='F05').length,
  broadPR:records.filter(r=>r.prStatus==='BROAD').length,f05BroadPR:bad.length,
  highRiskF05BroadPR:bad.filter(x=>x.criticalCandidate).length,
  duplicateDisplayNames:[...names].filter(([n,paths])=>paths.length>1).map(([name,paths])=>({name,paths})),
  requiredChecks:'REQUIRED_CHECKS_UNKNOWN_UNTIL_OFFICIAL_API_OR_A_AUTHORIZED_UI',f05ParentProof:'SOURCE_GAP_FOR_CURRENT_MAIN',
  cOnlyTriggersIrrelevantF05:bad.length>0,perFileAWhitelistRequired:true};
}
function safeText(s){return String(s??'').replace(/[\r\n\t]/g,' ').replace(/\s+/g,' ').slice(0,180);}
function tsv(records){const fields=['path','name','events','triggerForm','prStatus','pathsConfigured','pathsIgnoreConfigured','jobCount','timeoutCeilingMinutes','hasPG16','hasPGService','officialSourceGuard','frozenOrLegacyParent','domain','concurrency','sourceRisk','rawTrigger'];
 return fields.join('\t')+'\n'+records.map(r=>fields.map(k=>safeText(Array.isArray(r[k])?r[k].join(','):r[k])).join('\t')).join('\n')+'\n';
}
const API='https://api.github.com/repos/'+REPO;
async function official(path){
 if(!path.startsWith('/')||path.startsWith('//')||!process.env.GH_ACTIONS_READ_TOKEN)throw Error('OFFICIAL_READ_ACCESS_BLOCKED');
 const r=await fetch(API+path,{headers:{Authorization:'Bearer '+process.env.GH_ACTIONS_READ_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(25000),redirect:'error'});
 if(r.status===403||r.status===401||r.status===429)return {__error:'HTTP_'+r.status};
 if(!r.ok)throw Error('OFFICIAL_API_HTTP_'+r.status+'_'+path);
 return r.json();
}
async function fetchAllRuns(sha){
 const results=[];
 for(let pg=1;pg<=5;pg++){
  const z=await official('/actions/runs?event=pull_request&head_sha='+sha+'&per_page=100&page='+pg);
  if(z.__error)return {status:'API_BLOCKED',error:z.__error};
  if(!Number.isSafeInteger(z.total_count)||!Array.isArray(z.workflow_runs))throw Error('RUN_API_BAD_SHAPE');
  results.push(...z.workflow_runs);
  if(results.length===z.total_count)break;
  if(!z.workflow_runs.length)throw Error('RUN_PAGINATION_STALLED');
  if(pg===5)throw Error('RUN_PAGINATION_NOT_COMPLETE');
 }
 const byPath={};for(const r of results){if(r.head_sha!==sha||r.event!=='pull_request')throw Error('RUN_SOURCE_MISMATCH');const k=r.path;const item=byPath[k]??{runs:0,jobCountObserved:0,ids:[],status:{}};item.runs++;item.ids.push(r.id);item.status[r.status==='completed'?String(r.conclusion):r.status]=(item.status[r.status==='completed'?String(r.conclusion):r.status]||0)+1;byPath[k]=item;}
 return {status:'OFFICIAL_PR_RUN_METADATA',sha,total:results.length,uniqueWorkflows:Object.keys(byPath).length,f05RunCount:results.filter(x=>x.path?.startsWith('.github/workflows/f05-')).length,byPath,runnerMinutes:'NOT_CALCULATED_FROM_JOB_LOGS'};
}
async function liveAudit(policy){
 if(process.env.GITHUB_ACTIONS!=='true'||process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_REF!=='refs/heads/fix/ci-trigger-scope-governance-01')throw Error('OFFICIAL_GOVERNANCE_PUSH_ONLY');
 const refs=[['C_PR68',68],['B_PR75',75]],samples=[];
 for(const [label,n] of refs){
  const pr=await official('/pulls/'+n);
  if(pr.__error){samples.push({label,number:n,status:'API_BLOCKED',reason:pr.__error});continue;}
  if(!pr.head?.sha)throw Error('PR_HEAD_SHA_EMPTY');
  const runs=await fetchAllRuns(pr.head.sha);
  samples.push({label,number:n,sha:pr.head.sha,runSample:runs});
 }
 const protection=await official('/branches/main/protection');
 const rulesets=await official('/rulesets?includes_parents=true');
 const status=protection.__error?'REQUIRED_CHECKS_UNKNOWN_'+protection.__error:
  (protection.required_status_checks?.checks??[]).map(x=>({context:x.context,app_id:x.app_id}));
 const data={captured_at:new Date().toISOString(),audit_sha:process.env.GITHUB_SHA,repo:REPO,
   policy,samples,required_checks:status,rulesets:rulesets.__error?'UNKNOWN_'+rulesets.__error:rulesets,
   formal_source_restored:false,changed_old_workflows:false,proposal_only:true};
 writeFileSync('ci-trigger-official-sample.json',JSON.stringify(data,null,2)+'\n');
 console.log('CI_GOVERNANCE_OFFICIAL_SAMPLE',JSON.stringify({sha:data.audit_sha,requiredChecks:status,prs:samples.map(x=>({id:x.label,sha:x.sha,total:x.runSample?.total,f05:x.runSample?.f05RunCount,status:x.runSample?.status}))}));
}
const command=process.argv[2],isDirect=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isDirect){
 if(command!=='audit'){console.error('usage: node trigger-scope-audit.mjs audit');process.exitCode=2;}
 else{
  const root=resolve('.');
  const scanned=scan(root),policy=policyStatus(scanned);
  writeFileSync('ci-trigger-workflow-inventory.tsv',tsv(scanned));
  writeFileSync('ci-trigger-policy.json',JSON.stringify({sha:process.env.GITHUB_SHA??'LOCAL',policy,cases},null,2)+'\n');
  console.log('CI_TRIGGER_STATIC_INVENTORY',JSON.stringify(policy));
  liveAudit(policy).catch(e=>{console.error('CI_GOVERNANCE_LIVE_API_FAILED',e.message);process.exitCode=2;});
 }
}
