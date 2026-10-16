import test from 'node:test';
import assert from 'node:assert/strict';
import {SOURCES,REPO,BASELINE_SHA,recordGap,candidate,assessSource,classifyLog} from '../audit.mjs';
const sha='a'.repeat(40),runId=123;
const base={id:runId,run_attempt:1,repository:{full_name:REPO},head_repository:{full_name:REPO},
 path:'.github/workflows/f05-7-deterministic-matching-readiness-four-tier.yml',
 head_branch:'feat/f05-7-deterministic-matching-readiness-four-tier',head_sha:sha,
 event:'push',status:'completed',conclusion:'success',html_url:'https://github.com/'+REPO+'/actions/runs/123'};
const job=(id)=>({id,run_id:runId,run_attempt:1,status:'completed',conclusion:'success',
 html_url:'https://github.com/'+REPO+'/actions/runs/123/job/'+id});
const artifact={id:11,workflow_run:{id:runId,head_sha:sha},expired:false,size_in_bytes:200,
 expires_at:'2099-01-01T00:00:00Z',digest:'sha256:'+'b'.repeat(64),
 archive_download_url:'https://api.github.com/repos/'+REPO+'/actions/artifacts/11/zip'};
const good={run:base,jobs:{total_count:2,jobs:[job(1),job(2)]},artifacts:{total_count:1,artifacts:[artifact]}};
const spec={repo:REPO,sha,branch:base.head_branch,file:base.path.split('/').at(-1),count:2};
function cloned(){return structuredClone(good)}
function deny(label,modify,expected){test(label,()=>{const c=cloned();modify(c);const r=candidate(c.run,c.jobs,c.artifacts,spec);assert.equal(r.status,'SOURCE_GAP');assert.equal(r.reason,expected);assert.equal(r.formal_parent_positive,false);});}
test('五个正式Source任务与既有66/68/70/72门槛原样保留',()=>{
 assert.deepEqual(SOURCES.map(x=>[x.id,x.total,x.newJobs,x.old.reduce((n,i)=>n+i.jobs,0)]),
 [['F05-7',66,2,64],['F05-8',68,4,64],['F05-9',70,2,68],['F05-10',72,2,70],['F05-10-D1',72,2,70]]);
 assert.equal(BASELINE_SHA.length,40);
});
test('正面fixture仅是候选，不是已验证官方父签',()=>{const r=candidate(good.run,good.jobs,good.artifacts,spec);assert.match(r.status,/CANDIDATE_ONLY/);assert.equal(r.formal_parent_positive,false);});
deny('跨repo来源拒绝',x=>x.run.repository.full_name='attacker/repo','CROSS_REPO');
deny('跨head_repo拒绝',x=>x.run.head_repository.full_name='attacker/repo','CROSS_REPO');
deny('跨SHA拒绝',x=>x.run.head_sha='b'.repeat(40),'CROSS_SHA');
deny('跨branch拒绝',x=>x.run.head_branch='main','CROSS_BRANCH_OR_WORKFLOW');
deny('跨workflow拒绝',x=>x.run.path='.github/workflows/other.yml','CROSS_BRANCH_OR_WORKFLOW');
deny('PR事件拒绝',x=>x.run.event='pull_request','NOT_ORIGINAL_PUSH');
deny('dispatch事件拒绝',x=>x.run.event='workflow_dispatch','NOT_ORIGINAL_PUSH');
deny('排队拒绝',x=>x.run.status='queued','RUN_NOT_COMPLETED_SUCCESS');
deny('运行中拒绝',x=>x.run.status='in_progress','RUN_NOT_COMPLETED_SUCCESS');
deny('失败拒绝',x=>x.run.conclusion='failure','RUN_NOT_COMPLETED_SUCCESS');
deny('跳过拒绝',x=>x.run.conclusion='skipped','RUN_NOT_COMPLETED_SUCCESS');
deny('取消拒绝',x=>x.run.conclusion='cancelled','RUN_NOT_COMPLETED_SUCCESS');
deny('伪造run URL拒绝',x=>x.run.html_url='https://evil.example/run','RUN_IDENTITY_UNTRUSTED');
deny('run_attempt缺失拒绝',x=>delete x.run.run_attempt,'RUN_IDENTITY_UNTRUSTED');
deny('Job不足拒绝',x=>x.jobs.jobs.pop(),'JOB_COUNT_INCOMPLETE');
deny('Job总数不足拒绝',x=>x.jobs.total_count=1,'JOB_COUNT_INCOMPLETE');
deny('Job跨run拒绝',x=>x.jobs.jobs[0].run_id=9,'JOB_UNTRUSTED_OR_NOT_SUCCESS');
deny('Job跨attempt拒绝',x=>x.jobs.jobs[0].run_attempt=2,'JOB_UNTRUSTED_OR_NOT_SUCCESS');
deny('Job伪成功拒绝',x=>x.jobs.jobs[0].status='queued','JOB_UNTRUSTED_OR_NOT_SUCCESS');
deny('Job跳过拒绝',x=>x.jobs.jobs[0].conclusion='skipped','JOB_UNTRUSTED_OR_NOT_SUCCESS');
deny('Job重复ID拒绝',x=>x.jobs.jobs[1].id=1,'JOB_UNTRUSTED_OR_NOT_SUCCESS');
deny('Job伪造URL拒绝',x=>x.jobs.jobs[0].html_url='https://evil.example','JOB_UNTRUSTED_OR_NOT_SUCCESS');
deny('Artifact为空拒绝',x=>x.artifacts.artifacts=[],'ARTIFACT_LIST_INCOMPLETE');
deny('Artifact过期拒绝',x=>x.artifacts.artifacts[0].expired=true,'ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
deny('Artifact无SHA256摘要拒绝',x=>x.artifacts.artifacts[0].digest=null,'ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
deny('Artifact零字节拒绝',x=>x.artifacts.artifacts[0].size_in_bytes=0,'ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
deny('Artifact跨SHA拒绝',x=>x.artifacts.artifacts[0].workflow_run.head_sha='c'.repeat(40),'ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
deny('Artifact跨run拒绝',x=>x.artifacts.artifacts[0].workflow_run.id=99,'ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
deny('Artifact伪URL拒绝',x=>x.artifacts.artifacts[0].archive_download_url='https://evil.example','ARTIFACT_MISSING_EXPIRED_OR_UNSIGNED');
test('缺少完整66项绝不签父',()=>{const result=assessSource(SOURCES[0],[],sha);assert.equal(result.status,'SOURCE_GAP');assert.equal(result.official_candidate_jobs,0);assert.equal(result.details.length,8);assert.equal(result.formal_parent_positive,false);});
test('完整人工fixture也不能自证官方完成',()=>{const s=SOURCES[0];const obs=[...s.old,{file:s.file,jobs:2}].map(({file,jobs})=>({file,run:{...structuredClone(base),path:'.github/workflows/'+file,id:100+jobs},jobs:{total_count:jobs,jobs:Array.from({length:jobs},(_,i)=>({...job(i+1),run_id:100+jobs}))},artifacts:good.artifacts}));const r=assessSource(s,obs,sha);assert.equal(r.formal_parent_positive,false);assert.equal(r.status,'SOURCE_GAP');});
test('日志类型来源缺口与资源问题区分',()=>{
 assert.equal(classifyLog('F05_7_CANNOT_PROVE_66_SAME_SHA_OFFICIAL_PG16_JOBS_IN_BOUNDED_CI_RUN'),'SAME_SHA_PARENT_JOBS_GAP');
 assert.equal(classifyLog('D1_NOT_NEW_OFFICIAL_PUSH'),'ORIGINAL_PUSH_ORIGIN_GAP');
 assert.equal(classifyLog('toomanyrequests: Data limit exceeded'),'EXTERNAL_RESOURCE_LIMIT');
 assert.equal(classifyLog('some unknown error'),'UNCLASSIFIED_REQUIRES_A_REVIEW');
});
test('401/403/429及无运行时token不能经合成观察转换为正式通过',()=>{for(const e of ['401','403','429']){const a=recordGap('READ_ONLY_API_HTTP_'+e);assert.equal(a.status,'SOURCE_GAP');assert.equal(a.formal_parent_positive,false);}});
