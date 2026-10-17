import test from 'node:test';
import assert from 'node:assert/strict';
import {buildInventory,sha256,ORIGINAL_SHA,ORIGINAL_HISTORICAL} from './inventory.mjs';
import {verifyOfficialIndex,checkJobRecord,digest,REPO,BRANCH,WORKFLOW,JOB_NAMES,ARTIFACT_NAMES} from './evidence-proof.mjs';
const S='b'.repeat(40),OTHER='c'.repeat(40);
const source=()=>({source_workflow:'f05-7-frozen-k2-revalidation.yml',source_blob:'d'.repeat(40),
 original_job_id:'x',original_job_name:'Known PG16',original_run_commands:1,
 command_sha256:[digest('bash safe-test')],expected_artifacts:[{name:'original-artifact',path:'engineering/evidence/'}],key:'file#x'});
const rec=()=>({original_file:'f05-7-frozen-k2-revalidation.yml',source_blob:'d'.repeat(40),
 original_job_id:'x',original_job_name:'Known PG16',status:'REAL_PG16_PASS',pg16:true,
 clean_git_worktree:true,run_id:'100',attempt:'1',event:'push',formal_issuer_signed:false,
 candidate_head:S,candidate_branch:BRANCH,executed_commands:1,command_sha256:[digest('bash safe-test')],
 log_sha256:digest('SOURCE_STEP_PASS'),artifacts:[{name:'original-artifact',original_path:'engineering/evidence/',
 files:[{path:'engineering/evidence/a.log',bytes:4,sha256:digest('real')}],bytes:4}]});
const ctx=()=>({sha:S,runId:100,attempt:1});
const file=()=>new Map([['engineering/evidence/a.log',Buffer.from('real')]]);
test('单项日志、业务命令和原Artifact真实正文内容hash均成立',()=>{
 const x=checkJobRecord(source(),rec(),'SOURCE_STEP_PASS',file(),ctx());
 assert.equal(x.issuer_signed,false);assert.equal(x.legacy_66_proven,false);
});
const localBad=[
 ['换原工作流',(s,r)=>s.source_workflow='f05-7-old.yml'],
 ['替换Job ID',(s,r)=>r.original_job_id='y'],
 ['替换Job名称',(s,r)=>r.original_job_name='UNRELATED_GREEN_JOB'],
 ['替换源Blob',(s,r)=>r.source_blob='a'.repeat(40)],
 ['伪造PG16',(s,r)=>r.pg16=false],
 ['复用旧SHA',(s,r)=>r.candidate_head=OTHER],
 ['复用旧branch',(s,r)=>r.candidate_branch='main'],
 ['跨Run',(s,r)=>r.run_id='101'],
 ['重放Attempt',(s,r)=>r.attempt='2'],
 ['改event',(s,r)=>r.event='pull_request'],
 ['Job跳过',(s,r)=>r.status='SKIPPED'],
 ['声称Issuer已签发',(s,r)=>r.formal_issuer_signed=true],
 ['跳过独立工作区',(s,r)=>r.clean_git_worktree=false],
 ['篡改原业务命令',(s,r)=>r.command_sha256[0]=OTHER],
 ['未真正执行原Shell',(s,r)=>r.executed_commands=0],
 ['伪造日志摘要',(s,r)=>r.log_sha256=OTHER],
 ['丢失Artifact',(s,r)=>r.artifacts=[]],
 ['替换Artifact名称',(s,r)=>r.artifacts[0].name='evil'],
 ['替换Artifact路径',(s,r)=>r.artifacts[0].original_path='evil'],
 ['丢失Artifact正文',(s,r)=>r.artifacts[0].files=[]],
 ['篡改Artifact正文hash',(s,r)=>r.artifacts[0].files[0].sha256=OTHER],
 ['篡改Artifact字节数',(s,r)=>r.artifacts[0].files[0].bytes=3],
 ['改变Artifact总尺寸',(s,r)=>r.artifacts[0].bytes=3],
 ['路径穿越',(s,r)=>r.artifacts[0].files[0].path='../etc/passwd']
];
for(const [name,fn] of localBad)test('V2恶意本地记录拒绝：'+name,()=>{
 const s=source(),r=rec();fn(s,r);
 assert.throws(()=>checkJobRecord(s,r,'SOURCE_STEP_PASS',file(),ctx()),/V2_EVIDENCE_FAIL_CLOSED_/);
});
const c=()=>({repo:REPO,branch:BRANCH,event:'push',workflow:WORKFLOW,sha:S,runId:100,attempt:1});
const j=i=>({id:101+i,run_id:100,name:JOB_NAMES[i],status:'completed',conclusion:'success'});
const ch=i=>({id:101+i,head_sha:S,status:'completed',conclusion:'success',
 details_url:`https://github.com/${REPO}/actions/runs/100/job/${101+i}`});
const a=i=>({id:201+i,name:ARTIFACT_NAMES[i],size_in_bytes:100,expired:false,
 digest:'sha256:'+('d'.repeat(64)),workflow_run:{id:100,head_sha:S}});
const official=()=>({run:{id:100,repository:{full_name:REPO},head_branch:BRANCH,head_sha:S,
 event:'push',run_attempt:1,path:WORKFLOW,status:'completed',conclusion:'success'},
 jobs:Array.from({length:4},(_,i)=>j(i)),checks:Array.from({length:4},(_,i)=>ch(i)),
 artifacts:Array.from({length:4},(_,i)=>a(i)),jobsTotal:4,checksTotal:4,artifactsTotal:4});
test('四项完整官方元数据仅为V2候选，不能签Source',()=>{
 const result=verifyOfficialIndex(c(),official());
 assert.equal(result.issuer_signed,false);assert.equal(result.original_66_proven,false);
});
const officialBad=[
 ['官方branch',(x,y)=>x.run.head_branch='main'],['官方SHA',(x,y)=>x.run.head_sha=OTHER],
 ['官方repo',(x,y)=>x.run.repository.full_name='fake/repo'],['错误事件',(x,y)=>x.run.event='pull_request'],
 ['错误尝试',(x,y)=>x.run.run_attempt=2],['未完成',(x,y)=>x.run.status='in_progress'],
 ['Run失败',(x,y)=>x.run.conclusion='failure'],['原旧工作流冒充',(x,y)=>x.run.path='old.yml'],
 ['任意成功Job冒充',(x,y)=>x.jobs[2].name='Any green job'],
 ['某Job失败',(x,y)=>x.jobs[0].conclusion='failure'],['Check跳过',(x,y)=>x.checks[0].conclusion='skipped'],
 ['Check错SHA',(x,y)=>x.checks[1].head_sha=OTHER],
 ['Check跨Run',(x,y)=>x.checks[3].details_url=x.checks[3].details_url.replace('/100/','/101/')],
 ['Job跨Run',(x,y)=>x.jobs[2].run_id=101],['重复Job',(x,y)=>x.jobs[3].id=101],
 ['替换工件名称',(x,y)=>x.artifacts[2].name='fake.zip'],
 ['工件零字节',(x,y)=>x.artifacts[1].size_in_bytes=0],
 ['工件过期',(x,y)=>x.artifacts[3].expired=true],
 ['工件哈希伪造',(x,y)=>x.artifacts[0].digest='sha256:bad'],
 ['工件跨Run',(x,y)=>x.artifacts[1].workflow_run.id=101],
 ['工件跨SHA',(x,y)=>x.artifacts[3].workflow_run.head_sha=OTHER],
 ['重复工件',(x,y)=>x.artifacts[2].id=201],
 ['Job数不足',(x,y)=>{x.jobs.pop();x.jobsTotal=3}],
 ['分片分页不完整',(x,y)=>x.artifactsTotal=5]
];
for(const [name,fn] of officialBad)test('官方来源欺骗负例：'+name,()=>{
 const api=official(),ctx=c();fn(api,ctx);
 assert.throws(()=>verifyOfficialIndex(ctx,api),/V2_EVIDENCE_FAIL_CLOSED_/);
});
test('66格必须2份历史独立来源与64项当前真实待跑',()=>{
 const sources=Array.from({length:8},(_,i)=>({file:`file${i}.yml`,blob:String(i).repeat(40)}));
 const sourceMap=new Map(sources.map(s=>[s.file,s]));
 for(const hist of ORIGINAL_HISTORICAL)sourceMap.set(hist.file,{file:hist.file,blob:'0'.repeat(40)});
 sources.splice(0,2,...ORIGINAL_HISTORICAL.map(h=>sourceMap.get(h.file)));
 const jobs=Array.from({length:66},(_,i)=>({file:sources[i%8].file,blob:sources[i%8].blob,
 id:'j'+i,name:'job'+i,pg16:'postgres:16-alpine',steps:[{run:'true'}],commands:['true'],artifacts:[]}));
 jobs[0].file=ORIGINAL_HISTORICAL[0].file;jobs[0].blob=sourceMap.get(jobs[0].file).blob;jobs[0].id=ORIGINAL_HISTORICAL[0].id;
 jobs[1].file=ORIGINAL_HISTORICAL[1].file;jobs[1].blob=sourceMap.get(jobs[1].file).blob;jobs[1].id=ORIGINAL_HISTORICAL[1].id;
 const matrix=buildInventory({total:66,ref_sha:ORIGINAL_SHA,sources,jobs});
 assert.equal(matrix.jobs.length,66);assert.equal(matrix.jobs.filter(x=>x.history).length,2);
 assert.equal(matrix.jobs.filter(x=>!x.history).length,64);
 assert.deepEqual([0,1,2,3].map(sh=>matrix.jobs.filter(x=>x.shard===sh).length),[16,16,16,16]);
 assert.equal(matrix.formal_source_issuer_signed,false);
});
