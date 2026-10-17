import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {validateNativeProof,classifyCandidate,analyzeImpact,LEVEL} from './proof.mjs';
const S='a'.repeat(40),T='b'.repeat(40),REPO='suzhe868-arch/mb',branch='feat/f05-f08-bounded-real-engineering-01',workflow='.github/workflows/f05-f08-bounded-ci.yml';
const ctx=()=>({repo:REPO,candidateSha:S,observedSha:S,branch,workflow,event:'push',attempt:1,runId:123});
const api=()=>({run:{id:123,run_attempt:1,head_sha:S,head_branch:branch,event:'push',path:workflow,repository:{full_name:REPO},status:'completed',conclusion:'success'},
 checks:[{id:501,name:'safe',head_sha:S,status:'completed',conclusion:'success',completed_at:'2026-10-17',details_url:'https://github.com/'+REPO+'/actions/runs/123/job/501'}],
 jobs:[{id:501,run_id:123,name:'safe',status:'completed',conclusion:'success'}],
 artifacts:[{id:800,name:'evidence',expired:false,size_in_bytes:111,digest:'sha256:'+('c'.repeat(64)),workflow_run:{id:123,head_sha:S}}],
 checks_total:1,jobs_total:1,artifacts_total:1});
test('N01 准确同SHA原生绑定只证明结构，不签Source',()=>{const r=validateNativeProof(ctx(),api());assert.equal(r.level,LEVEL.exact);assert.equal(r.formal_source_issuer_signed,false)});
test('N02 历史不同SHA只能标历史',()=>{const c=ctx(),x=api();c.observedSha=T;x.run.head_sha=T;x.checks[0].head_sha=T;x.artifacts[0].workflow_run.head_sha=T;assert.equal(validateNativeProof(c,x).level,LEVEL.old)});
const mutations=[
 ['错误仓库',(_,c)=>c.repo='fake/repo'],['错误branch',(_,c)=>c.branch='main'],['错误候选sha',(_,c)=>c.candidateSha='bad'],['错误事件',(_,c)=>c.event='pull_request'],
 ['错误attempt',(_,c)=>c.attempt=2],['错误run id',(_,c)=>c.runId=777],['错误workflow',(_,c)=>c.workflow='.github/workflows/unknown.yml'],
 ['来源repo错误',a=>a.run.repository.full_name='other/repo'],['run sha错误',a=>a.run.head_sha=T],['run未完成',a=>a.run.status='in_progress'],
 ['run失败',a=>a.run.conclusion='failure'],['没有check',a=>{a.checks=[];a.checks_total=0}],['没有job',a=>{a.jobs=[];a.jobs_total=0}],
 ['没有artifact',a=>{a.artifacts=[];a.artifacts_total=0}],['check跳过',a=>a.checks[0].conclusion='skipped'],
 ['job失败',a=>a.jobs[0].conclusion='failure'],['cross run check',a=>a.checks[0].details_url='https://github.com/'+REPO+'/actions/runs/124/job/501'],
 ['过期工件',a=>a.artifacts[0].expired=true],['空工件',a=>a.artifacts[0].size_in_bytes=0],
 ['check分页缺口',a=>a.checks_total=2],['job分页缺口',a=>a.jobs_total=2],['artifact分页缺口',a=>a.artifacts_total=2],
 ['check重复',a=>{a.checks.push({...a.checks[0]});a.checks_total=2}],['job来源错误',a=>a.jobs[0].run_id=124],
 ['缺completed at',a=>a.checks[0].completed_at=null],['API异常',a=>a.error='HTTP_403'],
];
for(const [i,[name,change]] of mutations.entries())test('N'+String(i+3).padStart(2,'0')+' '+name+'拒绝',()=>{const c=ctx(),a=api();change(a,c);assert.throws(()=>validateNativeProof(c,a),/F05_F08_/);});
test('N29 未识别共享源码必须SOURCE_GAP',()=>{const r=analyzeImpact({baseSha:T,candidateSha:S,changedPaths:['unexpected/lib/magic.mjs']});assert.equal(r.level,'SOURCE_GAP');assert.deepEqual(r.affected_domains,['F05','F06','F07','F08'])});
test('N30 已知F05源码变更会影响F05/06/07/08',()=>{const r=analyzeImpact({baseSha:T,candidateSha:S,changedPaths:['engineering/f05/deterministic-matching-readiness-four-tier/contract.mjs']});assert.deepEqual(r.affected_domains,['F05','F06','F07','F08'])});
test('N31 公共依赖标记共享且必须复验',()=>{const r=analyzeImpact({baseSha:T,candidateSha:S,changedPaths:['engineering/package-lock.json']});assert.equal(r.shared_dependency_changed,true);assert.equal(r.level,LEVEL.retry)});
test('N32 恶意路径与零变更拒绝',()=>{assert.throws(()=>analyzeImpact({baseSha:T,candidateSha:S,changedPaths:['../test']}));assert.throws(()=>analyzeImpact({baseSha:S,candidateSha:S,changedPaths:['engineering/f05/x']}))});
test('N33 错误API输入不可能生成正签发',()=>{const r=classifyCandidate(ctx(),{error:'timeout'});assert.equal(r.level,LEVEL.gap);assert.equal(r.formal_source_issuer_signed,false)});
test('N34 旧CI看似成功的其它SHA绝不会提升成当前证明',()=>{const c=ctx(),a=api();c.observedSha=T;a.run.head_sha=T;a.checks[0].head_sha=T;a.artifacts[0].workflow_run.head_sha=T;assert.equal(classifyCandidate(c,a).level,LEVEL.old)});

test('N35 工件缺失官方sha256摘要必须拒绝',()=>{const a=api();delete a.artifacts[0].digest;assert.throws(()=>validateNativeProof(ctx(),a),/ARTIFACT_DIGEST_INVALID/)});
test('N36 工件摘要伪格式必须拒绝',()=>{const a=api();a.artifacts[0].digest='sha256:bad';assert.throws(()=>validateNativeProof(ctx(),a),/ARTIFACT_DIGEST_INVALID/)});
test('N37 本地JSON --verify不能提升为官方PROVEN_EXACT_SHA',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'mb-f05-native-proof-'));
 try{
  const input=path.join(dir,'input.json'),output=path.join(dir,'output.json');
  writeFileSync(input,JSON.stringify({context:ctx(),github:api()}));
  execFileSync(process.execPath,[fileURLToPath(new URL('./snapshot.mjs',import.meta.url)),'--verify',input,output],{encoding:'utf8',cwd:dir});
  const obj=JSON.parse(readFileSync(output,'utf8'));
  assert.equal(obj.level,LEVEL.retry);assert.equal(obj.official_api_verified,false);
  assert.equal(obj.origin,'UNVERIFIED_USER_SUPPLIED_JSON');assert.equal(obj.formal_source_issuer_signed,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('N38 原五正式Source清单第五项固定为F05-10-D1',()=>{
 const src=readFileSync(fileURLToPath(new URL('./snapshot.mjs',import.meta.url)),'utf8');
 assert.match(src,/five_formal_sources:\['F05-7','F05-8','F05-9','F05-10','F05-10-D1'\]/);
 assert.doesNotMatch(src,/F05-11/);
});
