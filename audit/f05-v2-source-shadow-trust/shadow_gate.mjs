/** F05 V2 only: evidence binding, Sigstore interface specification, and five *denied* shadow consumers.
 * This file MUST NEVER sign, enable a formal Source, transmit raw ZIPs, or access a live GitHub token.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export const CONSUMERS=Object.freeze(['F05-7','F05-8','F05-9','F05-10-D1','F05-10']);
export const REPO='suzhe868-arch/mb';
export const REPO_ID=1382955791;
export const RUN=39035485532;
export const HEAD='bdffc492df7dc09d9192d3ac485d598df7a8c040';
export const VERSION='F05_V2_SHADOW_EVIDENCE_MANIFEST_V1';
export const EXPECTED_ARTIFACT_IDS=Object.freeze([12101319115,12102520536,12101854148,12102560092]);
export const EXPECTED_ARTIFACT_SHA256=Object.freeze([
 'd0d6723e8b6fb5a6ad6ec442b8d71f9426589f10b5a1d49e9ddf9a77acd04649',
 'd3eb27569b09068498781a284467e636e79261b14d2e9a068ed43a8ca7a06cda',
 '6e2acf179aa7058b2eaee19ed76c3a8837001f67619dda9bdecd5c6df9a8884f',
 'cb87bcc89f74007a5eb835a7f7f33792a3c2ddb8550ba38d32c9a432bae255c0'
]);
// Correct pinned shard-3 digest is asserted separately to make accidental copy damage fail closed.
export const ROOTS=Object.freeze({
 root_frozen8_sha256:'319d4bc6264f597d354ff3b6eec98c182c170e5dd9983632185243a40241ef44',
 root_job66_sha256:'b24ab94147d6586b327318794158eed8cd6c5d71567165b8bc469da5dfbd56b0',
 root_body931_sha256:'f28eb01052054bb1427d8aad0bb678e82288d6b9be7e43a4e78a6ebbc9f2eed2'
});
export function deny(code){throw new Error('V2_SHADOW_FAIL_CLOSED_'+code)}
const SHA256=/^[a-f0-9]{64}$/;
const EXACT_DIGEST_3='cb87bcc89f74007a5eb835a7f7f33792a3c2ddb8550ba38d32c9a432bae255c0';
function equalArray(a,b){return Array.isArray(a)&&a.length===b.length&&a.every((x,i)=>x===b[i])}
function plain(o){return o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)}
export function canonical(x){
 if(x===null||typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isSafeInteger(x)))return JSON.stringify(x);
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 if(plain(x))return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
 deny('UNSUPPORTED_CANONICAL_VALUE');
}
export function sha256(data){return createHash('sha256').update(data).digest('hex')}
export function validateManifest(m){
 if(!plain(m))deny('MANIFEST_NOT_OBJECT');
 const accepted=new Set(['schema','repository','repository_id','run_id','head_sha','run_attempt','event',
  'artifact_ids','artifact_sha256','body_file_count','original_job_count','pg16_pass',
  'original_nonpg_pass','legacy_oracle','legacy_native_66_success',...Object.keys(ROOTS),
  'bytes_verified_locally','online_github_rest_verified_by_A','sigstore_identity_verified_by_A',
  'private_immutable_archive_verified_by_A','independent_reviewer_verified_by_A',
  'persistent_replay_ledger_verified_by_A','authorization_granted','formal_issuer_signed',
  'five_source_status','production_ready']);
 if(Object.keys(m).length!==accepted.size||Object.keys(m).some(k=>!accepted.has(k)))deny('UNEXPECTED_OR_SECRET_FIELDS');
 if(m.schema!==VERSION||m.repository!==REPO||m.repository_id!==REPO_ID||m.run_id!==RUN||
    m.head_sha!==HEAD||m.run_attempt!==1||m.event!=='push'||
    !equalArray(m.artifact_ids,EXPECTED_ARTIFACT_IDS)||
    !equalArray(m.artifact_sha256,[...EXPECTED_ARTIFACT_SHA256.slice(0,3),EXACT_DIGEST_3])||
    m.body_file_count!==931||m.original_job_count!==66||m.pg16_pass!==63||
    m.original_nonpg_pass!==2||m.legacy_oracle!=='BLOCKED_EQUIVALENCE'||
    m.legacy_native_66_success!==false||
    Object.entries(ROOTS).some(([k,v])=>m[k]!==v))deny('OFFICIAL_PIN_OR_ORACLE_MISMATCH');
 if(m.bytes_verified_locally!==true||
    ['online_github_rest_verified_by_A','sigstore_identity_verified_by_A',
     'private_immutable_archive_verified_by_A','independent_reviewer_verified_by_A',
     'persistent_replay_ledger_verified_by_A','authorization_granted','formal_issuer_signed',
     'production_ready'].some(k=>m[k]!==false)||m.five_source_status!=='SOURCE_GAP_OPEN_FAIL_CLOSED'){
   deny('PROHIBITED_TRUST_OR_SOURCE_ESCALATION');
 }
 // Whitelisted fixed values only; never include original bytes or logs in any outgoing digest.
 const digest=sha256(canonical(m));
 if(!SHA256.test(digest))deny('DIGEST_INVALID');
 return Object.freeze({manifest_digest_sha256:digest,normalized_official_bytes:true,
  legacy_native_66_success:false,old_oracle:'BLOCKED_EQUIVALENCE',
  online_rest_verified_by_A:false,formal_issuer_signed:false,authorization_granted:false});
}

/** Interface validation only. `claimed` object from B or a mock can never become an independent A trust anchor. */
export function inspectSigstoreClaim(claim, manifestDigest, externalPolicy){
 const blockers=[];
 if(!plain(claim)||!plain(externalPolicy))return Object.freeze(['BLOCKED_A_POLICY_OR_SIGSTORE_CLAIM_ABSENT']);
 if(!SHA256.test(manifestDigest)||claim.subject_sha256!==manifestDigest)blockers.push('BLOCKED_SIGSTORE_SUBJECT_DIGEST');
 if(claim.repository_id!==REPO_ID||claim.repository!==REPO)blockers.push('BLOCKED_SIGSTORE_REPO');
 if(claim.source_sha!==HEAD||claim.run_id!==RUN||claim.event!=='push'||claim.attempt!==1)blockers.push('BLOCKED_SIGSTORE_SOURCE_IDENTITY');
 if(typeof claim.signing_workflow_ref!=='string'||
    !claim.signing_workflow_ref.startsWith(REPO+'/.github/workflows/')||
    !claim.signing_workflow_ref.endsWith('@refs/heads/main')||
    !/^[a-f0-9]{40}$/.test(claim.signing_workflow_sha||'')||
    claim.signing_workflow_ref!==externalPolicy.expected_workflow_ref||
    claim.signing_workflow_sha!==externalPolicy.expected_workflow_sha)blockers.push('BLOCKED_PROTECTED_WORKFLOW_PIN');
 if(typeof claim.environment!=='string'||claim.environment!==externalPolicy.expected_environment)blockers.push('BLOCKED_ENVIRONMENT');
 if(externalPolicy.repository_id!==REPO_ID||externalPolicy.expected_reviewed_subject!==manifestDigest||
    !SHA256.test(externalPolicy.trusted_bundle_digest)||claim.bundle_sha256!==externalPolicy.trusted_bundle_digest)
  blockers.push('BLOCKED_INDEPENDENT_A_TRUST_ANCHOR');
 if(claim.reviewer_id===claim.submitter_id||!claim.reviewer_id||!claim.submitter_id)
  blockers.push('BLOCKED_INDEPENDENT_REVIEWER');
 if(claim.protected_environment_reviewed!==true||claim.prevent_self_review!==true)
  blockers.push('BLOCKED_PROTECTED_REVIEW_SETTINGS');
 // Values here are deliberately untrusted assertions; a valid-looking shape != verified Sigstore bytes.
 blockers.push('BLOCKED_SIGSTORE_CRYPTOGRAPHIC_VERIFICATION_NOT_AVAILABLE_IN_SHADOW');
 blockers.push('BLOCKED_A_ACCOUNT_INDEPENDENCE_UNVERIFIED');
 return Object.freeze([...new Set(blockers)]);
}

/** Interface for independent A-WORM custodian; supplied assertions are NEVER treated as proof by this module. */
export function inspectArchiveClaim(archive){
 const blockers=[];
 if(!plain(archive)||archive.kind!=='A_EXTERNAL_PRIVATE_WORM'||archive.private!==true||archive.immutable!==true||
    !SHA256.test(archive.root_sha256)||archive.recovery_audit_verified!==true)blockers.push('BLOCKED_IMMUTABLE_ARCHIVE');
 // A-controlled external attestation cannot be inferred from caller-owned JSON.
 blockers.push('BLOCKED_A_INDEPENDENT_CUSTODY_UNVERIFIED');
 return Object.freeze(blockers);
}

/** Evidence-independent replay interface. No Set/Map accepted as persistent ledger. */
export async function shadowReplayProbe(ledger,nonce,expiry,now){
 if(!ledger||ledger.kind!=='A_EXTERNAL_DURABLE_LEDGER'||typeof ledger.reserveOnce!=='function'||
    typeof ledger.isRevoked!=='function'||ledger instanceof Set||ledger instanceof Map||
    typeof nonce!=='string'||!/^[0-9a-f]{32,64}$/.test(nonce)||
    !Number.isSafeInteger(now)||!Number.isSafeInteger(expiry)||expiry<=now||expiry-now>86400000){
  return Object.freeze({status:'DENY',reason:'BLOCKED_PERSISTENT_LEDGER_OR_NONCE'});
 }
 try{
  if(await ledger.isRevoked(nonce))return Object.freeze({status:'DENY',reason:'BLOCKED_REVOKED'});
  const reserved=await ledger.reserveOnce(nonce,expiry);
  if(reserved!==true)return Object.freeze({status:'DENY',reason:'BLOCKED_REPLAY_OR_UNPROVEN_PERSISTENCE'});
  // Even a mock durable ledger cannot establish externally audited identity/custody.
  return Object.freeze({status:'DENY',reason:'BLOCKED_EXTERNAL_A_LEDGER_ATTESTATION_UNVERIFIED',reservation_probe_passed:true});
 }catch{
  return Object.freeze({status:'DENY',reason:'BLOCKED_LEDGER_UNAVAILABLE'});
 }
}

export function assertFiveConsumers(consumerRequests){
 if(!Array.isArray(consumerRequests)||consumerRequests.length!==CONSUMERS.length||
    !equalArray(consumerRequests.map(x=>x?.name),CONSUMERS))deny('FIVE_CONSUMERS_INCOMPLETE_OR_REORDERED');
 for(const entry of consumerRequests){
  if(!plain(entry)||entry.action!=='SHADOW_READ_ONLY'||entry.migration_approved!==false||
     entry.rollback_target!=='SOURCE_GAP_OPEN_FAIL_CLOSED'||entry.source_state!=='SOURCE_GAP_OPEN_FAIL_CLOSED'||
     entry.authorized!==false||entry.formal_issuer_signed!==false)deny('CONSUMER_ESCALATION_OR_FALSE_ROLLBACK');
 }
 return true;
}
export function fiveDeniedConsumers(){
 const entries=CONSUMERS.map(name=>Object.freeze({name,action:'SHADOW_READ_ONLY',
  migration_approved:false,rollback_target:'SOURCE_GAP_OPEN_FAIL_CLOSED',
  source_state:'SOURCE_GAP_OPEN_FAIL_CLOSED',authorized:false,formal_issuer_signed:false}));
 assertFiveConsumers(entries);
 return Object.freeze(entries);
}
export function evaluateShadow(manifest,{sigstoreClaim,externalPolicy,archiveClaim,replayResult,consumerRequests}={}){
 const digest=validateManifest(manifest);
 const blockers=[...inspectSigstoreClaim(sigstoreClaim,digest.manifest_digest_sha256,externalPolicy),
  ...inspectArchiveClaim(archiveClaim)];
 if(replayResult?.status!=='DENY')blockers.push('BLOCKED_A_REPLAY_LEDGER_NOT_ESTABLISHED');
 else blockers.push(replayResult.reason);
 if(consumerRequests!==undefined)assertFiveConsumers(consumerRequests);
 const consumers=fiveDeniedConsumers();
 const uniqueness=CONSUMERS.length===new Set(CONSUMERS).size;
 if(!uniqueness)deny('CONSUMER_CATALOG_BAD');
 blockers.push('BLOCKED_LEGACY_ORACLE');
 blockers.push('BLOCKED_ONLINE_READONLY_A_CONTEXT');
 blockers.push('BLOCKED_FORMAL_ISSUER_NOT_SIGNED');
 return Object.freeze({protocol:'F05_V2_SHADOW_TRUST_ONLY_V1',
  status:'READY_FOR_A_REVIEW_BLOCKED_FORMAL_ISSUER',
  evidence_manifest_sha256:digest.manifest_digest_sha256,
  old_oracle:'BLOCKED_EQUIVALENCE',legacy_native_66_success:false,
  authorization_granted:false,formal_issuer_signed:false,production_ready:false,
  consumers,blockers:Object.freeze([...new Set(blockers)])});
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 if(process.argv.length!==3){console.error('Usage: node shadow_gate.mjs <sanitized-manifest.json>');process.exitCode=2;}
 else try{
  const out=evaluateShadow(JSON.parse(readFileSync(process.argv[2],'utf8')));
  console.log(JSON.stringify(out,null,2));
 }catch(e){console.error(String(e.message).startsWith('V2_SHADOW_FAIL_CLOSED_')?e.message:'V2_SHADOW_FAIL_CLOSED_INVALID_INPUT');process.exitCode=2;}
}
