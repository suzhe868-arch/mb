import test from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {canonical,ORIGINAL_ARTIFACT_DIGESTS,HEAD,RUN,REPO,VERSION,FIVE_SOURCE_CONSUMERS,
 validateUnsignedCandidate,verifyIndependentAttestation,EXPECTED_FROZEN8_ROOT,EXPECTED_MATRIX66_ROOT,EXPECTED_BODY931_MERKLE_ROOT} from './独立签署验签门禁.mjs';
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const now=Date.UTC(2026,9,17,14,0,0);
const trustedPublicKeySha256=createHash('sha256').update(publicKey.export({type:'spki',format:'der'})).digest('hex');
const proof=()=>({protocol:VERSION,repository:REPO,head_sha:HEAD,run_id:RUN,run_attempt:1,
 original_total:66,pg16_pass:63,original_nonpg_pass:2,old_oracle:'BLOCKED_EQUIVALENCE',
 old_source_issuer_signed:false,original_workflows_are_native_66:false,old_ref_push_authorized:false,
 production_ready:false,status:'SOURCE_GAP_OPEN',artifact_digests:[...ORIGINAL_ARTIFACT_DIGESTS],
 frozen_eight_blob_roots_sha256:EXPECTED_FROZEN8_ROOT,original_66_matrix_sha256:EXPECTED_MATRIX66_ROOT,
 original_body_merkle_root_sha256:EXPECTED_BODY931_MERKLE_ROOT,long_term_evidence:{approved_by_A:true,immutable_archive_verified:true,archive_root_sha256:'d'.repeat(64)}});
const policy=()=>({a_controlled_external_policy:true,approved_protocol:VERSION,key_id:'A-EXTERNAL-KEY',
 public_key_pem:publicKey.export({type:'spki',format:'pem'}),approved_consumers:[...FIVE_SOURCE_CONSUMERS],
 approved_heads:[HEAD],revoked_proof_hashes:[]});
const envelope=(payload=proof())=>{
 const e={payload,key_id:'A-EXTERNAL-KEY',nonce:'1'.repeat(32),issued_at_ms:now-1000,
  expires_at_ms:now+10000,signature_algorithm:'Ed25519'};
 const message=Buffer.from(canonical({payload:e.payload,key_id:e.key_id,nonce:e.nonce,
   issued_at_ms:e.issued_at_ms,expires_at_ms:e.expires_at_ms}));
 e.signature_base64=sign(null,message,privateKey).toString('base64');return e;
};
const accept=(e=envelope(),p=policy())=>verifyIndependentAttestation(e,p,{now,usedNonces:new Set(),trustedPublicKeySha256});
test('only externally verified Ed25519 and A policy passes candidate gate, NOT issuer',()=>{
 const value=accept();assert.equal(value.cryptographic_signature_check_only,true);assert.equal(value.formal_issuer_signed,false);assert.equal(value.authorization_granted,false)});
test('candidate hash reproducible despite key order',()=>{
 const o=proof();assert.equal(canonical(o),canonical({...o,protocol:VERSION}))});
for(const [name,mutate] of [
 ['wrong head',e=>e.payload.head_sha='f'.repeat(40)],
 ['fake 66 complete',e=>e.payload.pg16_pass=64],
 ['old Oracle fake success',e=>e.payload.old_oracle='PASS'],
 ['source signed spoof',e=>e.payload.old_source_issuer_signed=true],
 ['wrong digest',e=>e.payload.artifact_digests[0]='0'.repeat(64)],
 ['forged frozen eight blob root',e=>e.payload.frozen_eight_blob_roots_sha256='a'.repeat(64)],
 ['forged 66 job matrix',e=>e.payload.original_66_matrix_sha256='b'.repeat(64)],
 ['forged 931 body Merkle root',e=>e.payload.original_body_merkle_root_sha256='c'.repeat(64)],
 ['missing archive',e=>e.payload.long_term_evidence=null],
 ['changed nonce',e=>e.nonce='2'.repeat(32)],
 ['expired',e=>e.expires_at_ms=now-1],
 ['changed version',e=>e.payload.protocol='V1'],
 ['fake native 66',e=>e.payload.original_workflows_are_native_66=true]
])test('reject forged '+name,()=>{const e=envelope();mutate(e);assert.throws(()=>accept(e),/FAIL_CLOSED/)});
for(const [name,mutate] of [
 ['missing trust anchor',p=>delete p.a_controlled_external_policy],
 ['wrong key',p=>p.key_id='SOMEONE_ELSE'],
 ['unapproved HEAD',p=>p.approved_heads=[]],
 ['unapproved consumer',p=>p.approved_consumers=['F05-7']],
 ['bad pubkey',p=>p.public_key_pem='BAD'],
 ['revocation',p=>p.revoked_proof_hashes=[validateUnsignedCandidate(proof()).proof_sha256]]
])test('reject A policy '+name,()=>{const p=policy();mutate(p);assert.throws(()=>accept(envelope(),p),/FAIL_CLOSED/)});
test('reject missing independent A anchor',()=>assert.throws(()=>verifyIndependentAttestation(envelope(),policy(),{now,usedNonces:new Set()}),/FAIL_CLOSED/));
test('reject B-provided alternate public key without A pin approval',()=>assert.throws(()=>verifyIndependentAttestation(envelope(),policy(),{now,usedNonces:new Set(),trustedPublicKeySha256:'f'.repeat(64)}),/FAIL_CLOSED/));
test('reject absent persistent replay ledger',()=>assert.throws(()=>verifyIndependentAttestation(envelope(),policy(),{now,trustedPublicKeySha256}),/FAIL_CLOSED/));
test('replay nonce fails after first use',()=>{const e=envelope(),p=policy(),usedNonces=new Set();
 assert.equal(verifyIndependentAttestation(e,p,{now,usedNonces,trustedPublicKeySha256}).cryptographic_signature_check_only,true);
 assert.throws(()=>verifyIndependentAttestation(e,p,{now,usedNonces,trustedPublicKeySha256}),/FAIL_CLOSED/)});
