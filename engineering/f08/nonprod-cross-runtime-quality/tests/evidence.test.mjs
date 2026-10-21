import test from 'node:test';
import assert from 'node:assert/strict';
import {PARENTS,verifyHistoricalParent,fetchAndVerifyParents} from '../parent-evidence.mjs';
const e=PARENTS[1],now=Date.parse('2026-10-22T00:00:00Z'),current='a'.repeat(40);
function fixture(){
 return {pr:{merged:true,head:{sha:e.sha},merge_commit_sha:'b'.repeat(40)},
  run:{id:e.run,head_sha:e.sha,repository:{full_name:'suzhe868-arch/mb'},event:'push',
    head_branch:e.branch,path:e.workflow,run_attempt:1,status:'completed',conclusion:'success'},
  jobs:e.jobs.map(id=>({id,run_id:e.run,status:'completed',conclusion:'success'})),
  artifacts:e.artifacts.map(id=>({id,expired:false,size_in_bytes:1024,expires_at:'2026-11-04T15:51:56Z',
   workflow_run:{id:e.run,head_sha:e.sha,head_branch:e.branch}}))};
}
function reject(change,code){
 const s=fixture();change(s);assert.throws(()=>verifyHistoricalParent(s,e,current,now),new RegExp('F08_2_PARENT_'+code));
}
test('E01 F07两个Job两Artifact仅获得历史SHA等级',()=>{
 const r=verifyHistoricalParent(fixture(),e,current,now);assert.equal(r.level,'HISTORIC_DIFFERENT_SHA');
 assert.equal(r.current_head_positive,false);assert.equal(r.production_ready,false);assert.equal(r.run,e.run);
});
test('E02 历史SHA不得被提升为本SHA',()=>assert.throws(()=>verifyHistoricalParent(fixture(),e,e.sha,now),/HISTORIC_REPLAY_AS_CURRENT/));
test('E03 PR未合并拒绝',()=>reject(s=>s.pr.merged=false,'PR_NOT_MERGED_OR_HEAD_MISMATCH'));
test('E04 PR真实Head不一致拒绝',()=>reject(s=>s.pr.head.sha='c'.repeat(40),'PR_NOT_MERGED_OR_HEAD_MISMATCH'));
test('E05 Run ID错误拒绝',()=>reject(s=>s.run.id=123,'RUN_SHA_MISMATCH'));
test('E06 Run SHA错误拒绝',()=>reject(s=>s.run.head_sha='d'.repeat(40),'RUN_SHA_MISMATCH'));
test('E07 GitHub仓库来源错误拒绝',()=>reject(s=>s.run.repository.full_name='evil/repo','RUN_ORIGIN_MISMATCH'));
test('E08 Run绑定其它分支拒绝',()=>reject(s=>s.run.head_branch='main','RUN_ORIGIN_MISMATCH'));
test('E09 PR触发不能代替真实Push',()=>reject(s=>s.run.event='pull_request','RUN_ORIGIN_MISMATCH'));
test('E10 失败Run拒绝',()=>reject(s=>s.run.conclusion='failure','RUN_UNVERIFIED'));
test('E11 queued Run拒绝',()=>reject(s=>s.run.status='queued','RUN_UNVERIFIED'));
test('E12 run_attempt为零拒绝',()=>reject(s=>s.run.run_attempt=0,'RUN_UNVERIFIED'));
test('E13 只有单Job不得冒充双Job',()=>reject(s=>s.jobs.pop(),'JOBS_MISSING'));
test('E14 失败Job不得提升成功',()=>reject(s=>s.jobs[0].conclusion='failure','JOB_MISSING_FAILED_OR_AMBIGUOUS'));
test('E15 相同Job双份记录不得冒充双独立',()=>reject(s=>s.jobs[1]={...s.jobs[0]},'JOB_MISSING_FAILED_OR_AMBIGUOUS'));
test('E16 Artifact缺失拒绝',()=>reject(s=>s.artifacts.pop(),'ARTIFACTS_MISSING'));
test('E17 Artifact已过期拒绝',()=>reject(s=>s.artifacts[0].expired=true,'ARTIFACT_EXPIRED_EMPTY_OR_UNDATED'));
test('E18 Artifact零字节拒绝',()=>reject(s=>s.artifacts[0].size_in_bytes=0,'ARTIFACT_EXPIRED_EMPTY_OR_UNDATED'));
test('E19 Artifact过期时间早于当前拒绝',()=>reject(s=>s.artifacts[0].expires_at='2026-10-01T00:00:00Z','ARTIFACT_EXPIRED_EMPTY_OR_UNDATED'));
test('E20 Artifact挂载其它SHA拒绝',()=>reject(s=>s.artifacts[0].workflow_run.head_sha='f'.repeat(40),'ARTIFACT_PARENT_BINDING_MISMATCH'));
test('E21 Artifact挂载其它Run拒绝',()=>reject(s=>s.artifacts[0].workflow_run.id=999,'ARTIFACT_PARENT_BINDING_MISMATCH'));
test('E22 旧工作流路径伪造拒绝',()=>reject(s=>s.run.path='.github/workflows/fake.yml','WORKFLOW_PATH_MISMATCH'));
test('E23 缺token不得进行GitHub现场只读验真',async()=>assert.rejects(()=>fetchAndVerifyParents({token:'',currentSha:current}),/F08_2_GITHUB_READ_TOKEN_MISSING/));
test('E24 F06单Job历史父证据仍不是新业务正例',()=>{
 const f=PARENTS[0],s=fixture();s.pr.head.sha=f.sha;s.run={...s.run,id:f.run,head_sha:f.sha,head_branch:f.branch,path:f.workflow};
 s.jobs=f.jobs.map(id=>({id,run_id:f.run,status:'completed',conclusion:'success'}));
 s.artifacts=f.artifacts.map(id=>({id,expired:false,size_in_bytes:36014,expires_at:'2026-11-04T13:01:30Z',workflow_run:{id:f.run,head_sha:f.sha,head_branch:f.branch}}));
 assert.equal(verifyHistoricalParent(s,f,current,now).level,'HISTORIC_DIFFERENT_SHA');
});
