// Candidate evidence only: an original frozen-source job remains distinct from its V2 run.
import {createHash} from 'node:crypto';
export const PROTOCOL='V2_SOURCE_CANDIDATE_66_NEW_HEAD_V1';
export const REPO='suzhe868-arch/mb';
export const BRANCH='feat/f05-7-v2-versioned-source-66-candidate-01';
export const WORKFLOW='.github/workflows/f05-7-v2-issuer-candidate-ci.yml';
export const JOB_NAMES=Object.freeze(Array.from({length:4},(_,i)=>'F05-7 V2 同SHA来源候选 分片'+i));
export const ARTIFACT_NAMES=Object.freeze(Array.from({length:4},(_,i)=>'f05-v2-candidate-66-shard-'+i));
export const sha256=x=>createHash('sha256').update(x).digest('hex');
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const dig=x=>typeof x==='string'&&/^sha256:[a-f0-9]{64}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
export const refuse=code=>{throw Error('V2_SOURCE_PROOF_FAIL_CLOSED_'+code)};
export function assertFrozenIdentity(frozen,catalog){
 if(frozen?.schema!=='V2_SOURCE_FROZEN_66_NEW_HEAD_V1'||frozen.total_original!==66||
    frozen.jobs?.length!==66||catalog?.jobs?.length!==66||catalog.sources?.length!==8||
    catalog.ref_sha!=='99c38d013f67cc56975f1664120fb87c204afc3c')refuse('FROZEN_CATALOG');
 const src=new Map(catalog.sources.map(s=>[s.file,s]));
 if(src.size!==8)refuse('SOURCE_COUNT');
 const seen=new Set();
 for(let i=0;i<66;i++){
  const a=frozen.jobs[i],b=catalog.jobs[i],s=src.get(b.file);
  if(!s||!sha(s.blob)||a.key!==b.file+'#'+b.id||
     a.source_workflow!==b.file||a.original_job_id!==b.id||
     a.source_blob!==s.blob||b.blob!==s.blob||
     JSON.stringify(a.command_sha256)!==JSON.stringify(b.commands.map(sha256))||
     JSON.stringify(a.step_sha256)!==JSON.stringify(b.steps.map(x=>sha256(JSON.stringify(x))))||
     a.original_job_name!==b.name||a.original_step_count!==b.steps.length||
     a.original_job_kind!==(b.pg16?'PG16':'NONPG')||
     a.pg16_image!==(b.pg16||null)||a.shard!==i%4||
     seen.has(a.key))refuse('ORIGINAL_JOB_BLOB_STEP_REPLACED');
  seen.add(a.key);
 }
 if(frozen.jobs.filter(j=>j.pg16_image===null).length!==2 ||
    frozen.jobs.filter(j=>j.history!==null).length!==2)refuse('SERVICE_OR_HISTORY');
 return true;
}
export function verifyOfficialGraph(ctx,api){
 if(!ctx||ctx.repo!==REPO||ctx.branch!==BRANCH||ctx.workflow!==WORKFLOW||
    ctx.event!=='push'||!sha(ctx.sha)||!positive(ctx.runId)||ctx.attempt!==1||
    !api?.run||api.jobs?.length!==4||api.artifacts?.length!==4||
    !Array.isArray(api.checks)||api.complete_pagination!==true)refuse('CONTEXT_OR_PAGINATION');
 const r=api.run;
 if(r.id!==ctx.runId||r.head_branch!==BRANCH||r.head_sha!==ctx.sha||
    r.repository?.full_name!==REPO||r.event!=='push'||r.run_attempt!==1||
    r.status!=='completed'||![WORKFLOW,WORKFLOW+'@refs/heads/'+BRANCH].includes(r.path))refuse('RUN_REPLAY');
 const jobIDs=new Set(),artIDs=new Set();
 for(let i=0;i<4;i++){
  const j=api.jobs.find(x=>x.name===JOB_NAMES[i]),a=api.artifacts.find(x=>x.name===ARTIFACT_NAMES[i]);
  if(!j||!positive(j.id)||jobIDs.has(j.id)||j.run_id!==ctx.runId||
     j.status!=='completed'||!['success','failure'].includes(j.conclusion))refuse('JOB_ID_STATUS_REPLAY');
  jobIDs.add(j.id);
  const check=api.checks.find(x=>x.id===j.id);
  if(!check||check.head_sha!==ctx.sha||check.status!=='completed'||
     check.conclusion!==j.conclusion||
     check.details_url!=='https://github.com/'+REPO+'/actions/runs/'+ctx.runId+'/job/'+j.id)refuse('CHECK_ID_REPLAY');
  if(!a||!positive(a.id)||artIDs.has(a.id)||a.expired!==false||
     !dig(a.digest)||!positive(a.size_in_bytes)||a.size_in_bytes>5*1024*1024||
     a.workflow_run?.id!==ctx.runId||a.workflow_run?.head_sha!==ctx.sha)refuse('OFFICIAL_ARTIFACT');
  artIDs.add(a.id);
 }
 if(jobIDs.size!==4||artIDs.size!==4)refuse('DUPLICATE_JOB_OR_ARTIFACT');
 return {level:'V2_OFFICIAL_GRAPH_VERIFIED_AWAIT_ORIGINAL_BODY',head_sha:ctx.sha,
  formal_issuer_signed:false,legacy_issuer_equivalent:false};
}
export function verifyCandidateRecords(ctx,frozen,records){
 if(frozen?.jobs?.length!==66||!Array.isArray(records)||records.length!==66)refuse('EXACT_66_RECORDS');
 const source=new Map(frozen.jobs.map(j=>[j.key,j])),seen=new Set(),statusCounts={};
 for(const item of records){
  const key=item?.original_file+'#'+item?.original_job_id,e=source.get(key);
  if(!e||seen.has(key)||item.source_blob!==e.source_blob||
     item.original_job_name!==e.original_job_name||item.candidate_head!==ctx.sha||
     item.candidate_branch!==BRANCH||String(item.run_id)!==String(ctx.runId)||
     Number(item.attempt)!==1||item.formal_issuer_signed!==false||
     JSON.stringify(item.command_sha256)!==JSON.stringify(e.command_sha256)||
     item.step_count!==e.original_step_count||item.clean_git_worktree!==true)refuse('ORIGINAL_RECORD_SUBSTITUTED');
  seen.add(key);statusCounts[item.status]=(statusCounts[item.status]||0)+1;
  const real=['REAL_PG16_PASS','REAL_ORIGINAL_NONPG_PASS'].includes(item.status);
  if(real){
   if(item.status!==(e.original_job_kind==='PG16'?'REAL_PG16_PASS':'REAL_ORIGINAL_NONPG_PASS')||
      item.executed_commands!==e.original_run_commands||!item.log_redaction?.startsWith('SECURE_MASKED_')||
      !/^[a-f0-9]{64}$/.test(item.log_sha256||'')||
      !Array.isArray(item.artifacts)||item.artifacts.length!==e.expected_artifacts.length)refuse('FAKE_REAL_BUSINESS_PASS');
  }else{
   if(!['NOT_RUN','FAIL','BLOCKED_EQUIVALENCE'].includes(item.status))refuse('UNKNOWN_FAIL_CLOSED_STATUS');
   if(item.status==='BLOCKED_EQUIVALENCE'&&key==='f05-7-deterministic-matching-readiness-four-tier.yml#match-source' &&
      item.executed_commands>=e.original_run_commands)refuse('LEGACY_FALSE_ORACLE_SUCCESS');
  }
 }
 if(seen.size!==66)refuse('MISSING_OR_DUPLICATE_ORIGINAL');
 const legacy=records.find(j=>j.original_file==='f05-7-deterministic-matching-readiness-four-tier.yml'&&j.original_job_id==='match-source');
 if(legacy?.status!=='BLOCKED_EQUIVALENCE'||
    !String(legacy.blocker).includes('LEGACY_SOURCE_ORACLE'))refuse('LEGACY_ORACLE_MUST_REMAIN_BLOCKED');
 return {protocol:PROTOCOL,run_id:ctx.runId,head_sha:ctx.sha,
  original_current_head_real_shell_complete:(statusCounts.REAL_PG16_PASS||0)+(statusCounts.REAL_ORIGINAL_NONPG_PASS||0),
  original_legacy_oracle:'NOT_SATISFIED',
  proposed_replacement:'V2_SOURCE_ORACLE_REPLACEMENT_CANDIDATE_PENDING_A_SIGNOFF',
  statusCounts,formal_issuer_signed:false,source_gap:'OPEN',original_ref_push_authorized:false,production_ready:false,
  conclusion:'CANDIDATE_FOR_A_REVIEW_BLOCKED_LEGACY_ORACLE'};
}
