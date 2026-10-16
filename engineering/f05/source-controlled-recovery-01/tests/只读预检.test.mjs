import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECS,BRANCH,REPO,EXPECTED_OLD_SHA,jobKeys,inspectStatic,validateRun,validateJobs,validateArtifacts} from '../只读预检.mjs';
const src=SPECS[0],sha=EXPECTED_OLD_SHA;
const run={id:38189425635,run_attempt:1,event:'push',head_sha:sha,head_branch:BRANCH,path:'.github/workflows/'+src.file,status:'completed',conclusion:'success',repository:{full_name:REPO},head_repository:{full_name:REPO}};
const jobs={total_count:2,jobs:[1,2].map(i=>({id:100+i,run_id:run.id,run_attempt:1,status:'completed',conclusion:'success'}))};
const arts={total_count:1,artifacts:[{id:1,workflow_run:{id:run.id,head_sha:sha},expired:false,size_in_bytes:128,digest:'sha256:'+'a'.repeat(64),expires_at:'2099-01-01T00:00:00Z'}]};
test('8 workflow / 66 expected native jobs',()=>assert.equal(SPECS.reduce((n,s)=>n+s.jobs,0),66));
test('inline H52 jobs counted',()=>assert.deepEqual(jobKeys('jobs:\n  a:\n    runs-on: ubuntu-latest\n  b: {runs-on: ubuntu-latest}\n'),['a','b']));
test('source run is historical candidate only',()=>assert.equal(validateRun(run,src,sha).formal_parent_positive,false));
for(const [label,change,reason] of [
 ['wrong repo',{repository:{full_name:'other/repo'}},'CROSS_REPO'],
 ['wrong branch',{head_branch:'main'},'CROSS_BRANCH_OR_WORKFLOW'],
 ['PR impersonation',{event:'pull_request'},'NOT_NATIVE_PUSH'],
 ['different SHA',{head_sha:'b'.repeat(40)},'CROSS_SHA'],
 ['wrong workflow',{path:'.github/workflows/another.yml'},'CROSS_BRANCH_OR_WORKFLOW'],
 ['failed run',{conclusion:'failure'},'RUN_NOT_SUCCESS'],
 ['missing attempt',{run_attempt:0},'INVALID_RUN_OR_ATTEMPT']
])test(label,()=>assert.equal(validateRun({...run,...change},src,sha).reason,reason));
test('jobs present and success',()=>assert.equal(validateJobs(run,jobs,2).count,2));
test('job missing fails closed',()=>assert.equal(validateJobs(run,{...jobs,total_count:1},2).reason,'INCOMPLETE_JOBS'));
test('job failed fails closed',()=>assert.equal(validateJobs(run,{...jobs,jobs:[jobs.jobs[0],{...jobs.jobs[1],conclusion:'failure'}]},2).reason,'JOB_STATUS_OR_ATTEMPT_INVALID'));
test('job different attempt fails closed',()=>assert.equal(validateJobs(run,{...jobs,jobs:[jobs.jobs[0],{...jobs.jobs[1],run_attempt:2}]},2).reason,'JOB_STATUS_OR_ATTEMPT_INVALID'));
test('artifact metadata only is not formal parent proof',()=>assert.equal(validateArtifacts(run,arts,sha).formal_parent_positive,false));
for(const change of [{expired:true},{size_in_bytes:0},{digest:'sha256:bad'},{expires_at:'2020-01-01T00:00:00Z'},{workflow_run:{id:1,head_sha:sha}}]){
 test('invalid artifact denied '+JSON.stringify(change),()=>assert.equal(validateArtifacts(run,{total_count:1,artifacts:[{...arts.artifacts[0],...change}]},sha).reason,'ARTIFACT_EXPIRED_INVALID_OR_CROSS_SHA'));
}
test('static no workflow missing silently',()=>assert.throws(()=>inspectStatic({}),'MISSING_WORKFLOW'));
test('static count change denied',()=>assert.throws(()=>inspectStatic({[src.file]:'on:\n  push: feat/f05-7-deterministic-matching-readiness-four-\njobs:\n  one:\n    uses: actions/upload-artifact@v4'})));
