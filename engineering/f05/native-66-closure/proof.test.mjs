import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyEvidence,LEVEL,REPO,BRANCH,WORKFLOW} from './proof.mjs';
const S='a'.repeat(40),T='b'.repeat(40);
const context=()=>({repo:REPO,branch:BRANCH,workflow:WORKFLOW,event:'push',sha:S,runId:931,attempt:1});
const job=id=>({id,run_id:931,name:'original PG16',status:'completed',conclusion:'success'});
const check=id=>({id,head_sha:S,status:'completed',conclusion:'success',completed_at:'2026-10-17',
 details_url:'https://github.com/'+REPO+'/actions/runs/931/job/'+id});
const artifact=id=>({id,size_in_bytes:999,expired:false,digest:'sha256:'+('c'.repeat(64)),
 workflow_run:{id:931,head_sha:S}});
const response=()=>({
 run:{repository:{full_name:REPO},head_branch:BRANCH,head_sha:S,event:'push',id:931,
      run_attempt:1,path:WORKFLOW,status:'completed',conclusion:'success'},
 jobs:[job(101),job(102)],checks:[check(101),check(102)],artifacts:[artifact(201),artifact(202)],
 jobs_total:2,checks_total:2,artifacts_total:2
});
test('正确结构的自述JSON不能取得官方证据或者Source签发',()=>{
 const r=verifyEvidence(context(),response());
 assert.equal(r.level,LEVEL.UNTRUSTED);assert.equal(r.formal_source_issuer_signed,false);
 assert.equal(r.original_66_jobs_passed,false);
});
const mutations=[
 ['伪造仓库',(a,c)=>c.repo='evil/repo'],['伪造分支',(a,c)=>c.branch='main'],
 ['伪造SHA',(a,c)=>c.sha=T],['伪造事件',(a,c)=>c.event='pull_request'],
 ['重放尝试',(a,c)=>c.attempt=2],['伪造Run ID',(a,c)=>c.runId=932],
 ['伪造Workflow',(a,c)=>c.workflow='evil.yml'],['官方Run仓库不符',a=>a.run.repository.full_name='bad/r'],
 ['官方Run SHA不符',a=>a.run.head_sha=T],['官方Run分支不符',a=>a.run.head_branch='main'],
 ['Run未完成',a=>a.run.status='in_progress'],['Run失败',a=>a.run.conclusion='failure'],
 ['Run尝试版本不符',a=>a.run.run_attempt=2],['Run事件不符',a=>a.run.event='workflow_dispatch'],
 ['Run路径不符',a=>a.run.path='.github/workflows/old.yml'],
 ['少1个真Job',a=>{a.jobs.pop();a.jobs_total=1}],['少1个Check',a=>{a.checks.pop();a.checks_total=1}],
 ['Check重放其他SHA',a=>a.checks[0].head_sha=T],
 ['Check跳过',a=>a.checks[0].conclusion='skipped'],
 ['Check未完成',a=>a.checks[0].status='in_progress'],
 ['Check伪造链接',a=>a.checks[0].details_url='https://github.com/'+REPO+'/actions/runs/999/job/101'],
 ['Job失败',a=>a.jobs[0].conclusion='failure'],
 ['Job跨Run',a=>a.jobs[0].run_id=999],
 ['Job重复',a=>a.jobs[1].id=101],
 ['Check重复',a=>a.checks[1].id=101],
 ['Job缺失分页',a=>a.jobs_total=3],
 ['Check缺失分页',a=>a.checks_total=3],
 ['Artifact缺失分页',a=>a.artifacts_total=3],
 ['工件过期',a=>a.artifacts[0].expired=true],
 ['工件空',a=>a.artifacts[0].size_in_bytes=0],
 ['工件无SHA256',a=>delete a.artifacts[0].digest],
 ['工件错误SHA256',a=>a.artifacts[0].digest='sha256:abc'],
 ['工件其它SHA',a=>a.artifacts[0].workflow_run.head_sha=T],
 ['工件其它Run',a=>a.artifacts[0].workflow_run.id=932],
 ['工件重复',a=>a.artifacts[1].id=201]
];
for(const [name,mut] of mutations)test('防重放拒绝：'+name,()=>{
 const a=response(),c=context();mut(a,c);
 assert.throws(()=>verifyEvidence(c,a),/NATIVE66_EVIDENCE_DENIED_/);
});
test('官方真实查询只能证明新V2候选，两原业务Job不等于旧66签',()=>{
 const p=verifyEvidence(context(),response(),{official:true});
 assert.equal(p.level,LEVEL.CANDIDATE);assert.equal(p.phase2_original_ref_push_authorized,false);
 assert.equal(p.formal_source_issuer_signed,false);
 assert.equal(p.production_ready,false);
});
