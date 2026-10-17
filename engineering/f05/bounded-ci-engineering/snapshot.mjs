import fs from 'node:fs';
import cp from 'node:child_process';
import {analyzeImpact,validateNativeProof,REPO,LEVEL} from './proof.mjs';
const BASE='e0f800f1659c9eb1d8f7854f2f64c9a12ebd71c8';
const BRANCH='feat/f05-f08-bounded-real-engineering-01';
const head=()=>cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
function snapshot(){
 if(process.env.GITHUB_EVENT_NAME!=='push'||process.env.GITHUB_REF_NAME!==BRANCH||process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_SHA!==head())throw Error('BOUND_CI_SNAPSHOT_REF_MISMATCH');
 const h=head(),changed=cp.execFileSync('git',['-c','core.quotePath=false','diff','--name-only',BASE+'...HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const impact=analyzeImpact({baseSha:BASE,candidateSha:h,changedPaths:changed});
 const out={repo:REPO,branch:BRANCH,base_sha:BASE,candidate_sha:h,github_run_id:process.env.GITHUB_RUN_ID,event:'push',candidate_level:LEVEL.retry,
 current_candidate_attestation:'PENDING_FINAL_GITHUB_RUN_CHECK_JOB_ARTIFACT',prior_ci_snapshots:[
 {id:'PR92',sha:'4b6a934d45ef65d66a89225940fdff2b8a17c96d',run_id:38997110086,level:LEVEL.old,formal_business_source_signed:false},
 {id:'PR94',sha:'cb960eeb0b09dabacf43c096152a88057ae1fac9',run_id:38998693209,level:LEVEL.old,formal_business_source_signed:false}],
 impacted:impact,five_formal_sources:['F05-7','F05-8','F05-9','F05-10','F05-10-D1'].map(id=>({id,level:LEVEL.gap,formal_issuer_signed:false})),
 production_ready:false,real_external_invocations:0};
 fs.writeFileSync('engineering/f05/bounded-ci-engineering/current-evidence.json',JSON.stringify(out,null,2)+'\n');
 console.log('F05_F08_VERSIONED_CI_SNAPSHOT',h,impact.affected_domains.join(','),'SOURCE_GAP_FAIL_CLOSED');
}
if(process.argv[2]==='--snapshot')snapshot();
else if(process.argv[2]==='--verify'){
 const input=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
 // --verify接收任意本地JSON，不具备GitHub官方API来源认证，严禁提升为PROVEN_EXACT_SHA。
 const structural=validateNativeProof(input.context,input.github);
 const result={...structural,level:LEVEL.retry,origin:'UNVERIFIED_USER_SUPPLIED_JSON',official_api_verified:false,formal_source_issuer_signed:false,source_gate:'SOURCE_GAP',production_ready:false};
 fs.writeFileSync(process.argv[4]||'verified-evidence.json',JSON.stringify(result,null,2)+'\n');
 console.log('F05_F08_SAME_SHA_NATIVE_EVIDENCE',result.level,'FORMAL_SOURCE_NOT_SIGNED');
}else throw Error('ONLY_SNAPSHOT_OR_VERIFY_ALLOWED');
