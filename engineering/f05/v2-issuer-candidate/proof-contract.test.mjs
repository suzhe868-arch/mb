import test from 'node:test';import assert from 'node:assert/strict';
import {sha256,assertFrozenIdentity,verifyOfficialGraph,verifyCandidateRecords,REPO,BRANCH,WORKFLOW,JOB_NAMES,ARTIFACT_NAMES} from './proof-contract.mjs';
const SHA='b'.repeat(40),BLOB='a'.repeat(40),D='sha256:'+'f'.repeat(64);
const ctx=()=>({repo:REPO,branch:BRANCH,workflow:WORKFLOW,event:'push',sha:SHA,runId:123,attempt:1});
const catalog=()=>({ref_sha:'99c38d013f67cc56975f1664120fb87c204afc3c',
 sources:Array.from({length:8},(_,i)=>({file:'f05-7-'+i+'.yml',blob:BLOB})),
 jobs:Array.from({length:66},(_,i)=>({file:'f05-7-'+Math.floor(i/9)+'.yml',blob:BLOB,id:'j'+i,name:'j'+i,pg16:i<64?'postgres:16':null,
  steps:[{run:'echo original-'+i}],commands:['echo original-'+i]}))});
const freeze=()=>{const c=catalog(),f={schema:'V2_SOURCE_FROZEN_66_NEW_HEAD_V1',total_original:66,
 jobs:c.jobs.map((j,i)=>({key:j.file+'#'+j.id,source_workflow:j.file,source_blob:j.blob,original_job_id:j.id,
  original_job_name:j.name,command_sha256:j.commands.map(sha256),step_sha256:j.steps.map(x=>sha256(JSON.stringify(x))),
  pg16_image:j.pg16,original_job_kind:j.pg16?'PG16':'NONPG',original_step_count:1,
  original_run_commands:1,expected_artifacts:[],shard:i%4,history:i<2?{old:true}:null}))};return {c,f}};
const graph=()=>({run:{id:123,head_branch:BRANCH,head_sha:SHA,repository:{full_name:REPO},
 event:'push',run_attempt:1,status:'completed',path:WORKFLOW},
 jobs:Array.from({length:4},(_,i)=>({id:i+100,run_id:123,name:JOB_NAMES[i],status:'completed',conclusion:i===0?'failure':'success'})),
 checks:Array.from({length:4},(_,i)=>({id:i+100,head_sha:SHA,status:'completed',conclusion:i===0?'failure':'success',
  details_url:'https://github.com/'+REPO+'/actions/runs/123/job/'+(i+100)})),
 artifacts:Array.from({length:4},(_,i)=>({id:i+200,name:ARTIFACT_NAMES[i],expired:false,digest:D,size_in_bytes:200000,
  workflow_run:{id:123,head_sha:SHA}})),complete_pagination:true});
const records=f=>f.jobs.map(j=>({original_file:j.source_workflow,original_job_id:j.original_job_id,
 source_blob:j.source_blob,original_job_name:j.original_job_name,candidate_head:SHA,candidate_branch:BRANCH,
 run_id:'123',attempt:'1',formal_issuer_signed:false,command_sha256:j.command_sha256,step_count:j.original_step_count,
 executed_commands:1,status:j.original_job_kind==='PG16'?'REAL_PG16_PASS':'REAL_ORIGINAL_NONPG_PASS',
 log_redaction:'SECURE_MASKED_CAPTURE_V1',log_sha256:'f'.repeat(64),artifacts:[],clean_git_worktree:true,blocker:null}));
test('Frozen66 real IDs blobs and original steps anchored',()=>{const {c,f}=freeze();assert.equal(assertFrozenIdentity(f,c),true)});
test('Official 4 jobs checks artifact bytes anchored',()=>{assert.equal(verifyOfficialGraph(ctx(),graph()).formal_issuer_signed,false)});
function scenario(){const o=freeze();o.f.jobs[0].source_workflow='f05-7-deterministic-matching-readiness-four-tier.yml';
 o.f.jobs[0].original_job_id='match-source';o.f.jobs[0].key=o.f.jobs[0].source_workflow+'#match-source';
 const r=records(o.f);r[0].status='BLOCKED_EQUIVALENCE';r[0].executed_commands=0;r[0].blocker='BLOCKED_EQUIVALENCE_LEGACY_SOURCE_ORACLE';
 return {f:o.f,records:r};}
test('65 real jobs plus legacy oracle blocked cannot sign',()=>{let {f,records}=scenario(),a=verifyCandidateRecords(ctx(),f,records);
 assert.equal(a.original_current_head_real_shell_complete,65);assert.equal(a.formal_issuer_signed,false);assert.equal(a.source_gap,'OPEN')});
const attacks=[
 ['wrong blob',o=>o.f.jobs[0].source_blob='d'.repeat(40)],
 ['changed shell',o=>o.f.jobs[0].command_sha256[0]='e'.repeat(64)],
 ['lost original job',o=>o.f.jobs.pop()],
 ['relabelled ID',o=>o.f.jobs[2].original_job_id='bogus'],
 ['duplicate key',o=>o.f.jobs[3].key=o.f.jobs[2].key],
 ['fake nonPG',o=>o.f.jobs[3].original_job_kind='NONPG'],
 ['catalog changed',o=>o.c.jobs[2].id='changed']
];
for(const [name,fn] of attacks)test('Immutable catalog denies '+name,()=>{const o=freeze();fn(o);assert.throws(()=>assertFrozenIdentity(o.f,o.c),/FAIL_CLOSED/)});
for(const [name,fn] of [
 ['wrong sha',o=>o.run.head_sha='c'.repeat(40)],
 ['wrong branch',o=>o.run.head_branch='main'],
 ['wrong event',o=>o.run.event='pull_request'],
 ['duplicate Artifact',o=>o.artifacts[1].id=o.artifacts[0].id],
 ['forged SHA',o=>o.artifacts[0].digest='sha256:fake'],
 ['wrong artifact head',o=>o.artifacts[0].workflow_run.head_sha='f'.repeat(40)],
 ['wrong Check ID',o=>o.checks[0].id=999],
 ['missing page',o=>o.complete_pagination=false],
 ['oversized ZIP',o=>o.artifacts[2].size_in_bytes=10*1024*1024],
 ['missing official job',o=>o.jobs.pop()]
])test('Official API denies '+name,()=>{let o=graph();fn(o);assert.throws(()=>verifyOfficialGraph(ctx(),o),/FAIL_CLOSED/)});
for(const [name,fn] of [
 ['cross HEAD',r=>r[5].candidate_head='e'.repeat(40)],
 ['old SHA reused',r=>r[5].candidate_head='346fb11133f0883014b7911effb58052bd17b2c1'],
 ['changed blob',r=>r[4].source_blob='f'.repeat(40)],
 ['fake pass with missing shell',r=>r[5].executed_commands=0],
 ['pretend old oracle passed',r=>r[0].status='REAL_PG16_PASS'],
 ['clone job',r=>r[6].original_job_id=r[5].original_job_id],
 ['wrong source log',r=>r[3].log_sha256='BAD'],
 ['signed claim',r=>r[2].formal_issuer_signed=true],
 ['not entire 66',r=>r.pop()],
 ['different run',r=>r[5].run_id='999']
])test('Original record denies '+name,()=>{let o=scenario();fn(o.records);assert.throws(()=>verifyCandidateRecords(ctx(),o.f,o.records),/FAIL_CLOSED/)});
