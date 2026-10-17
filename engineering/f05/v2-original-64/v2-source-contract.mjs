// F05-7 NEW versioned Source acceptance candidate; never an Issuer.
export const PROTOCOL='V2_SOURCE_CONTRACT_MIGRATION_CANDIDATE_ONLY_V1';
export const REPO='suzhe868-arch/mb';
export const BRANCH='feat/f05-7-v2-remaining-64-real-pg16-01';
export const ORIGINAL_REF_SHA='99c38d013f67cc56975f1664120fb87c204afc3c';
export const HISTORY_SHA='346fb11133f0883014b7911effb58052bd17b2c1';
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^sha256:[a-f0-9]{64}$/;
const VALID=new Set(['REAL_PG16_PASS','REAL_ORIGINAL_NONPG_PASS','BLOCKED_EQUIVALENCE','FAIL','NOT_RUN']);
const key=x=>x.workflow+'#'+x.job_id;
export function assessSourceMigration(input){
 function fail(code){throw Error('V2_SOURCE_CANDIDATE_DENIED_'+code)}
 if(!input||input.repo!==REPO||input.branch!==BRANCH||!SHA.test(input.head_sha||'')||
    input.event!=='push'||!Number.isSafeInteger(input.run_id)||input.run_id<1||
    input.run_attempt!==1||input.issuer_signed!==false)fail('OFFICIAL_CONTEXT');
 if(!Array.isArray(input.jobs)||input.jobs.length!==66)fail('EXACT_66_JOB_MATRIX_REQUIRED');
 const seen=new Set(),states={};
 for(const j of input.jobs){
  if(typeof j.workflow!=='string'||!j.workflow.startsWith('f05-7-')||
     typeof j.job_id!=='string'||!j.job_id||seen.has(key(j))||
     !SHA.test(j.frozen_blob||'')||!VALID.has(j.status))fail('SOURCE_JOB_ID_OR_BLOB');
  seen.add(key(j));states[j.status]=(states[j.status]||0)+1;
  if(j.evidence_sha!==input.head_sha && j.status.startsWith('REAL_'))fail('CROSS_SHA_EVIDENCE');
  if(j.status.startsWith('REAL_')){
   if(!DIGEST.test(j.official_artifact_digest||'')||!Number.isSafeInteger(j.job_run_id)||
      j.job_run_id!==input.run_id||!Number.isSafeInteger(j.official_job_id)||j.official_job_id<1||
      !DIGEST.test(j.original_log_digest||''))fail('FAKE_ARTIFACT_OR_LOG');
  }
 }
 const nonpg=input.jobs.filter(j=>j.status==='REAL_ORIGINAL_NONPG_PASS');
 if(nonpg.some(j=>j.workflow!=='f05-7-frozen-h52-revalidation.yml'||!['h-source','h-https'].includes(j.job_id)))fail('NONPG_ID_FORGED');
 const legacy=input.legacy_oracle;
 if(!legacy||legacy.required_frozen_workflow_count!==7||legacy.required_frozen_job_count!==64||
    legacy.required_same_sha_push!==true||legacy.official_legacy_oracle_satisfied!==false)fail('LEGACY_ORACLE_LIED');
 return Object.freeze({
  protocol:PROTOCOL,scope:'READ_ONLY_ISOLATED_CANDIDATE',
  head_sha:input.head_sha,run_id:input.run_id,record_count:66,
  states,legacy_source_verifier_equivalent:false,
  legacy_source_oracle:'NOT_SATISFIED_DO_NOT_BYPASS',
  formal_source_issuer_signed:false,five_formal_sources:'SOURCE_GAP_OPEN_FAIL_CLOSED',
  phase2_original_ref_push_authorized:false,production_ready:false,
  gate:'REQUIRES_A_SEPARATE_NEW_SOURCE_CONTRACT_REVIEW_AND_SIGNATURE',
  warning:'A real Job with legacy source oracle must remain BLOCKED; do not upgrade old Shell or merge historical SHA.'
 });
}
