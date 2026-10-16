import test from 'node:test';
import assert from 'node:assert/strict';
import {SOURCES,REPO,gap,validateRun,validateJobs,validateArtifacts,judge} from '../核证工具.mjs';
const spec=SOURCES[0],sha='a'.repeat(40),id=101;
const workflow=spec.sourceFile,run={id,run_attempt:2,repository:{full_name:REPO},head_repository:{full_name:REPO},
 head_sha:sha,head_branch:spec.branch,path:'.github/workflows/'+workflow,event:'push',status:'completed',conclusion:'success',
 html_url:'https://github.com/'+REPO+'/actions/runs/'+id};
const j=(n)=>({id:n,run_id:id,run_attempt:2,status:'completed',conclusion:'success',html_url:'https://github.com/'+REPO+'/actions/runs/'+id+'/job/'+n});
const jobs={total_count:2,jobs:[j(1),j(2)]};
const artifact={id:51,workflow_run:{id,head_sha:sha},expired:false,size_in_bytes:120,
 expires_at:'2099-01-01T00:00:00Z',digest:'sha256:'+'b'.repeat(64),
 archive_download_url:'https://api.github.com/repos/'+REPO+'/actions/artifacts/51/zip'};
const arts={total_count:1,artifacts:[artifact]};
function clone(x){return structuredClone(x);}
function badRun(name,edit,reason){test(name,()=>{const x=clone(run);edit(x);const r=validateRun(x,spec,sha,workflow);assert.equal(r.reason,reason);assert.equal(r.formal_parent_positive,false);});}
function badJobs(name,edit,reason){test(name,()=>{const x=clone(jobs);edit(x);const r=validateJobs(run,x,2);assert.equal(r.reason,reason);assert.equal(r.formal_parent_positive,false);});}
function badArtifacts(name,edit,reason){test(name,()=>{const x=clone(arts);edit(x);const r=validateArtifacts(run,x,sha);assert.equal(r.reason,reason);assert.equal(r.formal_parent_positive,false);});}
test('五原分支唯一清单和PG16原生348作业门槛完整',()=>{
 assert.deepEqual(SOURCES.map(s=>[s.id,s.expected.length,s.total,s.expected.reduce((n,x)=>n+x.jobs,0)]),
 [['F05-7',8,66,66],['F05-8',8,68,68],['F05-9',9,70,70],['F05-10',10,72,72],['F05-10-D1',10,72,72]]);
 assert.equal(SOURCES.reduce((n,s)=>n+s.total,0),348);
});
test('原始成功Run也只是历史元数据，不是现main正式父签',()=>{
 const r=validateRun(run,spec,sha,workflow);assert.equal(r.status,'ORIGINAL_PUSH_COMPLETED_SUCCESS');assert.equal(r.formal_parent_positive,false);
});
badRun('跨仓库拒绝',r=>r.repository.full_name='evil/repo','REPOSITORY_MISMATCH_OR_UNTRUSTED');
badRun('跨Head仓库拒绝',r=>r.head_repository.full_name='evil/repo','REPOSITORY_MISMATCH_OR_UNTRUSTED');
badRun('错误SHA拒绝',r=>r.head_sha='b'.repeat(40),'CROSS_SHA');
badRun('错误原分支拒绝',r=>r.head_branch='main','CROSS_BRANCH_OR_WORKFLOW');
badRun('错误workflow拒绝',r=>r.path='fake/workflow','CROSS_BRANCH_OR_WORKFLOW');
badRun('PR事件拒绝',r=>r.event='pull_request','NOT_ORIGINAL_PUSH');
badRun('手工dispatch事件拒绝',r=>r.event='workflow_dispatch','NOT_ORIGINAL_PUSH');
badRun('排队拒绝',r=>r.status='queued','RUN_NOT_SUCCESS');
badRun('执行中拒绝',r=>r.status='in_progress','RUN_NOT_SUCCESS');
badRun('失败拒绝',r=>r.conclusion='failure','RUN_NOT_SUCCESS');
badRun('跳过拒绝',r=>r.conclusion='skipped','RUN_NOT_SUCCESS');
badRun('取消拒绝',r=>r.conclusion='cancelled','RUN_NOT_SUCCESS');
badRun('虚假Run网址拒绝',r=>r.html_url='https://example.com/run','RUN_ORIGIN_INVALID');
badRun('失效尝试次数拒绝',r=>r.run_attempt=0,'RUN_ORIGIN_INVALID');
test('真实Job数候选具有两条同run且同attempt成功任务',()=>{const r=validateJobs(run,jobs,2);assert.equal(r.status,'OFFICIAL_JOB_METADATA_COMPLETE');assert.equal(r.formal_parent_positive,false);});
badJobs('Job计数不完整',r=>r.jobs.pop(),'MISSING_OR_INCOMPLETE_JOBS');
badJobs('Job总计数伪造',r=>r.total_count=3,'MISSING_OR_INCOMPLETE_JOBS');
badJobs('跨run任务拒绝',r=>r.jobs[0].run_id=999,'JOB_ATTEMPT_OR_RESULT_INVALID');
badJobs('跨attempt任务拒绝',r=>r.jobs[0].run_attempt=1,'JOB_ATTEMPT_OR_RESULT_INVALID');
badJobs('任务跳过拒绝',r=>r.jobs[0].conclusion='skipped','JOB_ATTEMPT_OR_RESULT_INVALID');
badJobs('任务运行中拒绝',r=>r.jobs[0].status='in_progress','JOB_ATTEMPT_OR_RESULT_INVALID');
badJobs('伪造任务链接拒绝',r=>r.jobs[0].html_url='https://example.com','JOB_ATTEMPT_OR_RESULT_INVALID');
badJobs('重复Job ID拒绝',r=>r.jobs[1].id=1,'JOB_ATTEMPT_OR_RESULT_INVALID');
test('非空有效Artifact只有元数据候选资格',()=>{const r=validateArtifacts(run,arts,sha);assert.equal(r.status,'OFFICIAL_ARTIFACT_METADATA_AVAILABLE');assert.equal(r.zip_independent_sha256_verified,false);});
badArtifacts('Artifact为空拒绝',a=>a.artifacts=[],'ARTIFACT_API_INCOMPLETE');
badArtifacts('Artifact数量不匹配拒绝',a=>a.total_count=3,'ARTIFACT_API_INCOMPLETE');
badArtifacts('Artifact过期拒绝',a=>a.artifacts[0].expired=true,'ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
badArtifacts('Artifact旧到期时间拒绝',a=>a.artifacts[0].expires_at='2020-01-01T00:00:00Z','ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
badArtifacts('Artifact跨run拒绝',a=>a.artifacts[0].workflow_run.id=999,'ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
badArtifacts('Artifact跨SHA拒绝',a=>a.artifacts[0].workflow_run.head_sha='b'.repeat(40),'ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
badArtifacts('Artifact缺Digest拒绝',a=>delete a.artifacts[0].digest,'ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
badArtifacts('Artifact零字节拒绝',a=>a.artifacts[0].size_in_bytes=0,'ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
badArtifacts('Artifact非官方URL拒绝',a=>a.artifacts[0].archive_download_url='https://evil.example','ARTIFACT_MISSING_EXPIRED_OR_NO_DIGEST');
test('虚构所有上游作业满额也不得颁发真实父签',()=>{
 const rows=spec.expected.map(({file,jobs:count},offset)=>{
  const rid=200+offset;const rr={...clone(run),id:rid,path:'.github/workflows/'+file,html_url:'https://github.com/'+REPO+'/actions/runs/'+rid};
  const jj={total_count:count,jobs:Array.from({length:count},(_,i)=>({id:1000+offset*100+i,run_id:rid,run_attempt:2,status:'completed',conclusion:'success',html_url:'https://github.com/'+REPO+'/actions/runs/'+rid+'/job/'+(1000+offset*100+i)}))};
  const aa={total_count:1,artifacts:[{...clone(artifact),workflow_run:{id:rid,head_sha:sha}}]};
  return {file,run:rr,jobs:jj,artifacts:aa};
 });
 const r=judge(spec,sha,rows);assert.equal(r.metadata_valid_pg16_jobs,66);assert.equal(r.decision,'HISTORICAL_COMPLETE_METADATA_ONLY_NOT_NEW_PARENT_PROOF');assert.equal(r.formal_parent_positive,false);
});
test('不完整原分支必定拒绝',()=>{const r=judge(spec,sha,[]);assert.equal(r.decision,'SOURCE_GAP');assert.equal(r.metadata_valid_pg16_jobs,0);});
test('401/403/429、资源限流及假证明对象绝不转PASS',()=>{for(const code of [401,403,429]){const g=gap('OFFICIAL_API_HTTP_'+code);assert.equal(g.status,'SOURCE_GAP');assert.equal(g.formal_parent_positive,false);}});
