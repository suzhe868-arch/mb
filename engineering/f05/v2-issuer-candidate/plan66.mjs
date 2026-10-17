// Deterministic 66-job immutable source identity from 8 frozen original Git Blobs.
// Native66.catalog.rb confirms Git blob byte equality before this process runs.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {buildInventory,loadOfficialCatalog} from '../v2-original-64/inventory.mjs';
export const BRANCH='feat/f05-7-v2-versioned-source-66-candidate-01';
const sha=s=>createHash('sha256').update(s).digest('hex');
export function plan66(catalog){
 const inv=buildInventory(catalog);
 if(inv.jobs.length!==66||inv.jobs.filter(x=>x.pg16_image===null).length!==2||
    inv.jobs.filter(x=>x.history!==null).length!==2)throw Error('CANDIDATE_66_FREEZE_DENIED');
 const jobs=inv.jobs.map((j,i)=>({...j,shard:i%4,status:'NOT_RUN',
    history:j.history?{...j.history,requires_new_head_real_reexecution:true,current_head_accepted:false}:null,
    current_head_real_pg16_pass:false,current_head_real_original_nonpg_pass:false,
    previous_SHA_never_accepted_as_this_SHA:true}));
 for(const j of jobs)if(!/^[a-f0-9]{40}$/.test(j.source_blob)||
   j.command_sha256.some(x=>!/[a-f0-9]{64}/.test(x)))throw Error('FREEZE_BLOB_OR_STEP_HASH');
 return {schema:'V2_SOURCE_FROZEN_66_NEW_HEAD_V1',source_ref_sha:inv.source_ref_sha,
  frozen_sources:catalog.sources,locked_job_keys_sha256:sha(jobs.map(x=>x.key+'|'+x.source_blob+'|'+x.command_sha256.join(',')).join('\n')),
  total_original:66,requires_all_current_head:true,all_native_legacy_oracle_satisfied:false,
  legacy_oracle_replacement:'PENDING_INDEPENDENT_A_SIGNOFF',
  source_gap:'OPEN',formal_issuer_signed:false,production_ready:false,jobs};
}
export function writePlan(){
 const c=loadOfficialCatalog(),m=plan66(c),out=resolve(import.meta.dirname,'evidence/66格同SHA候选源清册.json');
 const rules=JSON.parse(readFileSync(resolve(import.meta.dirname,'evidence/原66项权限服务条件逐项冻结规则.json'),'utf8'));
 if(rules.schema!=='V2_FIXED_GIT_BLOB_RULES_66'||rules.rules?.length!==66)throw Error('CANDIDATE_RULES_MISSING');
 for(let i=0;i<66;i++){
  const j=m.jobs[i],rule=rules.rules[i];
  if(j.key!==rule.key||j.source_blob!==rule.source_blob||
    JSON.stringify(j.step_sha256)!==JSON.stringify(rule.step_sha256)||
    j.original_run_commands!==rule.original_command_count||j.original_step_count!==rule.original_steps)throw Error('CANDIDATE_RULE_BLOB_MISMATCH');
  j.frozen_rule=rule;
 }
 m.locked_rule_digest_sha256=sha(rules.rules.map(x=>JSON.stringify(x)).join('\n'));
 mkdirSync(resolve(out,'..'),{recursive:true});writeFileSync(out,JSON.stringify(m,null,2)+'\n');
 console.log('V2_NEW_HEAD_FROZEN_66_EXACT pg16=64 nonpg=2 two_historical=REEXECUTION_REQUIRED');
 return m
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))writePlan();
