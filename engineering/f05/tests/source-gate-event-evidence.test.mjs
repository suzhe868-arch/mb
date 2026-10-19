import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePullRequestEvidence,validateOfficialMainPushContext} from '../source-gate-event-evidence.mjs';

const env={
 GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_EVENT_NAME:'pull_request',
 GITHUB_SHA:'b'.repeat(40),GITHUB_RUN_ID:'1234',GITHUB_RUN_ATTEMPT:'1',GITHUB_REF:'refs/pull/126/merge'
};
const event={
 repository:{full_name:'suzhe868-arch/mb'},
 pull_request:{number:126,head:{sha:'a'.repeat(40)},base:{ref:'main',repo:{full_name:'suzhe868-arch/mb'}}}
};
const run={id:1234,run_attempt:1,event:'pull_request',head_sha:env.GITHUB_SHA,
 path:'.github/workflows/f05-9-recommendation-visibility-grants.yml',status:'in_progress'};
const jobs=[
 {name:'F05-9 new Source v25 true PG16',status:'in_progress',conclusion:null},
 {name:'F05-9 new HTTPS v25 true PG16',status:'completed',conclusion:'success'}
];
const peerArtifacts=[{name:'f05-9-https-native-pg16-evidence',digest:'sha256:'+'f'.repeat(64),size_in_bytes:1024,expired:false}];
const args=(patch={})=>({event,env,run,jobs,workflowPath:run.path,
 sourceJobName:'F05-9 new Source v25 true PG16',expectedJobs:2,
 artifactNames:['f05-9-https-native-pg16-evidence'],artifacts:peerArtifacts,...patch});

test('PR mode accepts exact current run and successful HTTPS peer without requiring old push evidence',()=>{
 const result=validatePullRequestEvidence(args());
 assert.equal(result.verification_mode,'nonproduction_pull_request');
 assert.equal(result.pr_head_sha,'a'.repeat(40));
 assert.equal(result.tested_run_sha,'b'.repeat(40));
 assert.equal(result.old_push_evidence_applicability,'not_applicable_to_pull_request_event; no claim that old push jobs passed');
 assert.equal(result.formal_source_signed,false);
 assert.equal(result.production_ready,false);
 assert.equal(result.failed_jobs,0);
 assert.equal(result.skipped_jobs,0);
 assert.equal(result.verified_peer_artifacts[0].name,'f05-9-https-native-pg16-evidence');
});
const reject=(name,patch,code)=>test(name,()=>assert.throws(()=>validatePullRequestEvidence(args(patch)),new RegExp(code)));
reject('reject wrong event type',{env:{...env,GITHUB_EVENT_NAME:'push'}},'EVENT_TYPE_MISMATCH');
reject('reject wrong repository',{env:{...env,GITHUB_REPOSITORY:'evil/repo'}},'REPOSITORY_MISMATCH');
reject('reject non-main PR target',{event:{...event,pull_request:{...event.pull_request,base:{...event.pull_request.base,ref:'release'}}}},'TARGET_BRANCH_MISMATCH');
reject('reject invalid PR head SHA',{event:{...event,pull_request:{...event.pull_request,head:{sha:'bad'}}}},'INVALID_PR_HEAD_SHA');
reject('reject run SHA mismatch',{run:{...run,head_sha:'c'.repeat(40)}},'RUN_SHA_MISMATCH');
reject('reject missing Run ID consistency',{env:{...env,GITHUB_RUN_ID:'999'}},'RUN_ID_MISMATCH');
reject('reject Run Attempt mismatch',{env:{...env,GITHUB_RUN_ATTEMPT:'2'}},'RUN_ATTEMPT_MISMATCH');
reject('reject wrong workflow path',{run:{...run,path:'.github/workflows/other.yml'}},'WORKFLOW_PATH_MISMATCH');
reject('reject job count mismatch',{expectedJobs:3},'JOB_COUNT_MISMATCH');
reject('reject missing source job',{jobs:[jobs[1]]},'JOB_COUNT_MISMATCH');
reject('reject failed HTTPS peer',{jobs:[jobs[0],{...jobs[1],conclusion:'failure'}]},'PEER_JOB_NOT_SUCCESS');
reject('reject skipped HTTPS peer',{jobs:[jobs[0],{...jobs[1],conclusion:'skipped'}]},'PEER_JOB_NOT_SUCCESS');
reject('reject source job already completed',{jobs:[{...jobs[0],status:'completed',conclusion:'success'},jobs[1]]},'SOURCE_JOB_NOT_CURRENTLY_RUNNING');
reject('reject duplicate job names',{jobs:[jobs[0],{...jobs[1],name:jobs[0].name}]},'JOB_NAMES_INVALID');

const pushEnv={GITHUB_REPOSITORY:'suzhe868-arch/mb',GITHUB_EVENT_NAME:'push',
 GITHUB_REF:'refs/heads/main',GITHUB_SHA:'d'.repeat(40),GITHUB_RUN_ID:'9876',GITHUB_RUN_ATTEMPT:'2'};
const pushEvent={repository:{full_name:'suzhe868-arch/mb'},ref:'refs/heads/main'};
const pushRun={id:9876,run_attempt:2,event:'push',head_sha:pushEnv.GITHUB_SHA,
 path:'.github/workflows/f05-9-recommendation-visibility-grants.yml',status:'in_progress'};
test('main push mode accepts only exact official main push context',()=>{
 const result=validateOfficialMainPushContext({event:pushEvent,env:pushEnv,run:pushRun,workflowPath:pushRun.path});
 assert.equal(result.verification_mode,'official_main_push');
 assert.equal(result.ref,'refs/heads/main');
 assert.equal(result.formal_source_signed,false);
 assert.equal(result.production_ready,false);
});
test('main push mode rejects pull_request evidence',()=>assert.throws(()=>
 validateOfficialMainPushContext({event,env,run,jobs,workflowPath:run.path}),/NOT_OFFICIAL_MAIN_PUSH/));
test('main push mode rejects wrong branch',()=>assert.throws(()=>
 validateOfficialMainPushContext({event:{...pushEvent,ref:'refs/heads/feature'},env:{...pushEnv,GITHUB_REF:'refs/heads/feature'},run:pushRun,workflowPath:pushRun.path}),/NOT_OFFICIAL_MAIN_PUSH/));
test('main push mode rejects SHA mismatch',()=>assert.throws(()=>
 validateOfficialMainPushContext({event:pushEvent,env:pushEnv,run:{...pushRun,head_sha:'e'.repeat(40)},workflowPath:pushRun.path}),/RUN_SHA_MISMATCH/));
test('main push mode rejects workflow path mismatch',()=>assert.throws(()=>
 validateOfficialMainPushContext({event:pushEvent,env:pushEnv,run:pushRun,workflowPath:'.github/workflows/wrong.yml'}),/RUN_CONTEXT_MISMATCH/));

reject('reject missing HTTPS artifact',{artifacts:[]},'PEER_ARTIFACT_MISSING');
reject('reject artifact with invalid digest',{artifacts:[{...peerArtifacts[0],digest:'sha256:bad'}]},'PEER_ARTIFACT_DIGEST_INVALID');
reject('reject expired HTTPS artifact',{artifacts:[{...peerArtifacts[0],expired:true}]},'PEER_ARTIFACT_MISSING');

reject('reject PR ref mismatch',{env:{...env,GITHUB_REF:'refs/pull/127/merge'}},'PR_REF_MISMATCH');
