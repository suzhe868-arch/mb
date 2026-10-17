import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {validateManifest,evaluateShadow,sha256,canonical,inspectSigstoreClaim,inspectArchiveClaim,
 shadowReplayProbe,fiveDeniedConsumers,assertFiveConsumers,CONSUMERS,REPO,REPO_ID,RUN,HEAD} from './shadow_gate.mjs';
const BASE=dirname(fileURLToPath(import.meta.url));
const example=JSON.parse(readFileSync(join(BASE,'official_shadow_manifest.json'),'utf8'));
const clone=()=>structuredClone(example);
const mustReject=(x,tag)=>assert.throws(()=>validateManifest(x),new RegExp('V2_SHADOW_FAIL_CLOSED_'+tag));

test('four genuine pinned ZIP produce sanitizer digest, never source rights',()=>{
 let d=validateManifest(clone());assert.match(d.manifest_digest_sha256,/^[a-f0-9]{64}$/);
 assert.equal(d.authorization_granted,false);assert.equal(d.formal_issuer_signed,false);
});
test('canonicalization is stable across object key order',()=>{
 assert.equal(sha256(canonical({z:[1,'s'],a:0})),sha256(canonical({a:0,z:[1,'s']})));
});
test('noncanonical values refused',()=>{for(const x of [undefined,NaN,Infinity,new Date(),()=>1])assert.throws(()=>canonical(x))});
test('mandatory manifest field cannot be removed',()=>{let m=clone();delete m.repository_id;mustReject(m,'UNEXPECTED_OR_SECRET_FIELDS')});
test('unknown sensitive or secret field refused',()=>{let m=clone();m.github_token='ghp_EXAMPLE_NEVER_REAL';mustReject(m,'UNEXPECTED_OR_SECRET_FIELDS')});
test('private PEM injection field refused',()=>{let m=clone();m.pem_private_key='-----BEGIN PRIVATE KEY-----';mustReject(m,'UNEXPECTED_OR_SECRET_FIELDS')});
test('bad repo id fails',()=>{let m=clone();m.repository_id=0;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('bad repo path fails',()=>{let m=clone();m.repository='another/repo';mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('bad head fails',()=>{let m=clone();m.head_sha='f'.repeat(40);mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('bad Run ID fails',()=>{let m=clone();m.run_id=2;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('bad run event fails',()=>{let m=clone();m.event='pull_request';mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('bad attempt fails',()=>{let m=clone();m.run_attempt=2;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('artifact ID swapped fails',()=>{let m=clone();m.artifact_ids[0]=123;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('artifact digest altered fails',()=>{let m=clone();m.artifact_sha256[1]='0'.repeat(64);mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('artifact manifest length altered fails',()=>{let m=clone();m.artifact_sha256.pop();mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('original file 931 completeness enforced',()=>{let m=clone();m.body_file_count=930;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('66 job completeness enforced',()=>{let m=clone();m.original_job_count=65;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('old Oracle cannot disappear',()=>{let m=clone();m.legacy_oracle='PASS';mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('legacy native 66 may not turn green',()=>{let m=clone();m.legacy_native_66_success=true;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('PG16 job count cannot change',()=>{let m=clone();m.pg16_pass=64;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('nonPG job count cannot change',()=>{let m=clone();m.original_nonpg_pass=3;mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('8-blob root changed fails',()=>{let m=clone();m.root_frozen8_sha256='1'.repeat(64);mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('66 matrix root changed fails',()=>{let m=clone();m.root_job66_sha256='1'.repeat(64);mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('931-body root changed fails',()=>{let m=clone();m.root_body931_sha256='1'.repeat(64);mustReject(m,'OFFICIAL_PIN_OR_ORACLE_MISMATCH')});
test('cannot self-assert A REST already verified',()=>{let m=clone();m.online_github_rest_verified_by_A=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot self-assert Sigstore already verified',()=>{let m=clone();m.sigstore_identity_verified_by_A=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot self-assert private WORM approved',()=>{let m=clone();m.private_immutable_archive_verified_by_A=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot self-assert independent reviewer',()=>{let m=clone();m.independent_reviewer_verified_by_A=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot self-assert persistent replay ledger',()=>{let m=clone();m.persistent_replay_ledger_verified_by_A=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot mark formally signed',()=>{let m=clone();m.formal_issuer_signed=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot mark authorized',()=>{let m=clone();m.authorization_granted=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('cannot mark production ready',()=>{let m=clone();m.production_ready=true;mustReject(m,'PROHIBITED_TRUST_OR_SOURCE_ESCALATION')});
test('five listed shadow consumers uniformly deny',()=>{
 const result=evaluateShadow(clone());assert.equal(result.consumers.length,5);
 assert.deepEqual(result.consumers.map(x=>x.name),CONSUMERS);
 assert(result.consumers.every(x=>x.authorized===false&&x.formal_issuer_signed===false));
 assert(result.blockers.includes('BLOCKED_FORMAL_ISSUER_NOT_SIGNED'));
});
test('missing fifth consumer blocks',()=>{let a=fiveDeniedConsumers().map(x=>({...x}));a.pop();assert.throws(()=>assertFiveConsumers(a),/FIVE_CONSUMERS_INCOMPLETE/)});
test('consumer forged authorization blocks',()=>{let a=fiveDeniedConsumers().map(x=>({...x}));a[1].authorized=true;assert.throws(()=>assertFiveConsumers(a),/CONSUMER_ESCALATION/)});
test('consumer migration claim blocks',()=>{let a=fiveDeniedConsumers().map(x=>({...x}));a[0].migration_approved=true;assert.throws(()=>assertFiveConsumers(a),/CONSUMER_ESCALATION/)});
test('consumer rolls back to old green rather than deny blocks',()=>{let a=fiveDeniedConsumers().map(x=>({...x}));a[4].rollback_target='LEGACY_SOURCE_PASS';assert.throws(()=>assertFiveConsumers(a),/CONSUMER_ESCALATION/)});
test('consumer order cannot conceal skipped F05-10-D1',()=>{let a=fiveDeniedConsumers().map(x=>({...x}));[a[3],a[4]]=[a[4],a[3]];assert.throws(()=>assertFiveConsumers(a),/FIVE_CONSUMERS_INCOMPLETE/)});
test('wrong signing subject blocked',()=>{
 const b=inspectSigstoreClaim({subject_sha256:'f'.repeat(64)},validateManifest(clone()).manifest_digest_sha256,{});
 assert(b.includes('BLOCKED_SIGSTORE_SUBJECT_DIGEST'));
});
test('spoofed signer repo blocked',()=>{
 const b=inspectSigstoreClaim({repository_id:42,repository:'forged/repo'},validateManifest(clone()).manifest_digest_sha256,{});
 assert(b.includes('BLOCKED_SIGSTORE_REPO'));
});
test('spoofed reviewer cannot self-approve',()=>{
 const b=inspectSigstoreClaim({reviewer_id:'same',submitter_id:'same'},validateManifest(clone()).manifest_digest_sha256,{});
 assert(b.includes('BLOCKED_INDEPENDENT_REVIEWER'));
});
test('no external policy cannot prove Sigstore',()=>{
 assert(inspectSigstoreClaim({signer:true},'0'.repeat(64),undefined).includes('BLOCKED_A_POLICY_OR_SIGSTORE_CLAIM_ABSENT'));
});
test('even apparently valid-looking signer shape is not cryptographic verification',()=>{
 const digest=validateManifest(clone()).manifest_digest_sha256;
 const fake={subject_sha256:digest,repository:REPO,repository_id:REPO_ID,source_sha:HEAD,run_id:RUN,
 event:'push',attempt:1,signing_workflow_ref:REPO+'/.github/workflows/shadow-review.yml@refs/heads/main',
 signing_workflow_sha:'a'.repeat(40),environment:'independent_A_review',bundle_sha256:'b'.repeat(64),
 reviewer_id:'A',submitter_id:'B',protected_environment_reviewed:true,prevent_self_review:true};
 const policy={repository_id:REPO_ID,expected_reviewed_subject:digest,expected_environment:'independent_A_review',expected_workflow_ref:REPO+'/.github/workflows/shadow-review.yml@refs/heads/main',expected_workflow_sha:'a'.repeat(40),trusted_bundle_digest:'b'.repeat(64)};
 const b=inspectSigstoreClaim(fake,digest,policy);
 assert(b.includes('BLOCKED_SIGSTORE_CRYPTOGRAPHIC_VERIFICATION_NOT_AVAILABLE_IN_SHADOW'));
 const all=evaluateShadow(clone(),{sigstoreClaim:fake,externalPolicy:policy});
 assert.equal(all.authorization_granted,false);assert.equal(all.formal_issuer_signed,false);
});
test('mutable local store cannot act as WORM',()=>{
 const b=inspectArchiveClaim({kind:'LOCAL_SET',private:true,immutable:true,root_sha256:'f'.repeat(64),recovery_audit_verified:true});
 assert(b.includes('BLOCKED_IMMUTABLE_ARCHIVE'));
});
test('fake WORM JSON cannot count as independent A custody',()=>{
 const b=inspectArchiveClaim({kind:'A_EXTERNAL_PRIVATE_WORM',private:true,immutable:true,root_sha256:'f'.repeat(64),recovery_audit_verified:true});
 assert(b.includes('BLOCKED_A_INDEPENDENT_CUSTODY_UNVERIFIED'));
});
test('ordinary JS Set refused for durable nonce',async()=>{
 let r=await shadowReplayProbe(new Set(),'a'.repeat(32),100,10);assert.equal(r.status,'DENY');assert.match(r.reason,/PERSISTENT/);
});
test('expired nonce refused',async()=>{
 let r=await shadowReplayProbe({kind:'A_EXTERNAL_DURABLE_LEDGER',reserveOnce:async()=>true,isRevoked:async()=>false},'a'.repeat(32),10,10);
 assert.equal(r.status,'DENY');
});
test('revoked nonce refused',async()=>{
 let r=await shadowReplayProbe({kind:'A_EXTERNAL_DURABLE_LEDGER',reserveOnce:async()=>true,isRevoked:async()=>true},'a'.repeat(32),100,10);
 assert.equal(r.reason,'BLOCKED_REVOKED');
});
test('ledger exceptions fail closed',async()=>{
 let r=await shadowReplayProbe({kind:'A_EXTERNAL_DURABLE_LEDGER',reserveOnce:async()=>true,isRevoked:async()=>{throw Error('api offline')}},'a'.repeat(32),100,10);
 assert.equal(r.reason,'BLOCKED_LEDGER_UNAVAILABLE');
});
test('reused nonce and concurrent reservations fail closed',async()=>{
 const used=new Set();const ledger={kind:'A_EXTERNAL_DURABLE_LEDGER',isRevoked:async()=>false,
  reserveOnce:async n=>{if(used.has(n))return false;used.add(n);return true}};
 const [a,b]=await Promise.all([shadowReplayProbe(ledger,'d'.repeat(32),500,10),shadowReplayProbe(ledger,'d'.repeat(32),500,10)]);
 assert.equal(a.status,'DENY');assert.equal(b.status,'DENY');
 assert([a,b].some(x=>x.reason==='BLOCKED_REPLAY_OR_UNPROVEN_PERSISTENCE'));
});
test('valid mock nonce reservation still cannot authorize',async()=>{
 let r=await shadowReplayProbe({kind:'A_EXTERNAL_DURABLE_LEDGER',reserveOnce:async()=>true,isRevoked:async()=>false},'a'.repeat(32),100,10);
 assert.equal(r.status,'DENY');assert.equal(r.reservation_probe_passed,true);
});
test('mock that returns five authorized consumers blocked',()=>{
 const consumers=fiveDeniedConsumers().map(x=>({...x}));consumers[2].formal_issuer_signed=true;
 assert.throws(()=>evaluateShadow(clone(),{consumerRequests:consumers}),/CONSUMER_ESCALATION/);
});
