import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSourceMigration,PROTOCOL,REPO,BRANCH,HISTORY_SHA} from './v2-source-contract.mjs';
const S='b'.repeat(40),H='c'.repeat(40),BL='d'.repeat(40),D='sha256:'+('e'.repeat(64));
const current=()=>({
 repo:REPO,branch:BRANCH,head_sha:S,event:'push',run_id:301,run_attempt:1,issuer_signed:false,
 legacy_oracle:{required_frozen_workflow_count:7,required_frozen_job_count:64,required_same_sha_push:true,official_legacy_oracle_satisfied:false},
 jobs:Array.from({length:66},(_,i)=>({
  workflow:'f05-7-frozen-h52-revalidation.yml',
  job_id:'job-'+i,frozen_blob:BL,status:'REAL_PG16_PASS',evidence_sha:S,
  official_artifact_digest:D,original_log_digest:D,official_job_id:100+i,job_run_id:301
 }))
});
test('候选即使66份同SHA也绝不自动签原正式Source',()=>{
 const r=assessSourceMigration(current());
 assert.equal(r.protocol,PROTOCOL);assert.equal(r.formal_source_issuer_signed,false);
 assert.equal(r.legacy_source_verifier_equivalent,false);assert.equal(r.production_ready,false);
});
const bad=[
 ['cross_sha',x=>x.jobs[5].evidence_sha=H],
 ['old_history_replay',x=>x.jobs[5].evidence_sha=HISTORY_SHA],
 ['wrong_branch',x=>x.branch='main'],
 ['different_run',x=>x.jobs[5].job_run_id=999],
 ['fake_digest',x=>x.jobs[0].official_artifact_digest='sha256:fake'],
 ['fake_log',x=>x.jobs[0].original_log_digest='fake'],
 ['duplicate_original_job',x=>x.jobs[4].job_id='job-3'],
 ['signed_issuer_claim',x=>x.issuer_signed=true],
 ['legacy_false_claim',x=>x.legacy_oracle.official_legacy_oracle_satisfied=true],
 ['legacy_oracle_mismatch',x=>x.legacy_oracle.required_frozen_job_count=52],
 ['missing_64',x=>x.jobs.pop()],
 ['faked_nonpg',x=>x.jobs[0].status='REAL_ORIGINAL_NONPG_PASS'],
 ['unverified_event',x=>x.event='pull_request']
];
for(const [name,mut] of bad)test('新V2 Source候选fail closed '+name,()=>{
 const x=current();mut(x);assert.throws(()=>assessSourceMigration(x),/V2_SOURCE_CANDIDATE_DENIED_/);
});
test('原match-source保留阻断但不自行签发',()=>{
 const x=current();x.jobs[0].status='BLOCKED_EQUIVALENCE';delete x.jobs[0].evidence_sha;
 const result=assessSourceMigration(x);assert.equal(result.states.BLOCKED_EQUIVALENCE,1);
 assert.equal(result.formal_source_issuer_signed,false);
});
