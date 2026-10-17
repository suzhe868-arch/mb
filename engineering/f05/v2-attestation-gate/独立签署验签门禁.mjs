// Non-production candidate only. No signing, no Source issuer mutation, no consumer activation.
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export const VERSION='V2_SOURCE_ORACLE_REPLACEMENT_V1';
export const REPO='suzhe868-arch/mb';
export const HEAD='bdffc492df7dc09d9192d3ac485d598df7a8c040';
export const RUN=39035485532;
export const EXPECTED_FROZEN8_ROOT='319d4bc6264f597d354ff3b6eec98c182c170e5dd9983632185243a40241ef44';
export const EXPECTED_MATRIX66_ROOT='b24ab94147d6586b327318794158eed8cd6c5d71567165b8bc469da5dfbd56b0';
export const EXPECTED_BODY931_MERKLE_ROOT='f28eb01052054bb1427d8aad0bb678e82288d6b9be7e43a4e78a6ebbc9f2eed2';
const blobs=[
 'd0d6723e8b6fb5a6ad6ec442b8d71f9426589f10b5a1d49e9ddf9a77acd04649',
 'd3eb27569b09068498781a284467e636e79261b14d2e9a068ed43a8ca7a06cda',
 '6e2acf179aa7058b2eaee19ed76c3a8837001f67619dda9bdecd5c6df9a8884f',
 'cb87bcc89f74007a5eb835a7f7f33792a3c2ddb8550ba38d32c9a432bae255c0'
];
export const ORIGINAL_ARTIFACT_DIGESTS=Object.freeze(blobs);
export const FIVE_SOURCE_CONSUMERS=Object.freeze(['F05-7','F05-8','F05-9','F05-10-D1','F05-10']);
export const deny=code=>{throw Error('V2_SIGNER_FAIL_CLOSED_'+code)};
function isSha256(x){return typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)}
export function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 if(value===null||typeof value==='string'||typeof value==='boolean'||(typeof value==='number'&&Number.isSafeInteger(value)))return JSON.stringify(value);
 deny('NONCANONICAL_INPUT');
}
export function proofDigest(x){return createHash('sha256').update(canonical(x)).digest('hex')}
export function validateUnsignedCandidate(proof){
 if(!proof||proof.protocol!==VERSION||proof.repository!==REPO||proof.head_sha!==HEAD||proof.run_id!==RUN||
   proof.run_attempt!==1||proof.original_total!==66||proof.pg16_pass!==63||proof.original_nonpg_pass!==2||
   proof.old_oracle!=='BLOCKED_EQUIVALENCE'||proof.old_source_issuer_signed!==false||
   proof.original_workflows_are_native_66!==false||proof.old_ref_push_authorized!==false||
   proof.production_ready!==false||proof.status!=='SOURCE_GAP_OPEN'||
   !Array.isArray(proof.artifact_digests)||proof.artifact_digests.length!==4||
   proof.artifact_digests.some((x,i)=>x!==blobs[i])||
   proof.frozen_eight_blob_roots_sha256!==EXPECTED_FROZEN8_ROOT||
   proof.original_66_matrix_sha256!==EXPECTED_MATRIX66_ROOT||
   proof.original_body_merkle_root_sha256!==EXPECTED_BODY931_MERKLE_ROOT)deny('SCOPE_OR_REALITY');
 return {status:'CANDIDATE_ONLY_NO_SOURCE_RIGHTS',proof_sha256:proofDigest(proof)};
}
// policy must be obtained OUTSIDE the B-controlled repository from the independent A-controlled verifier.
// Revocation / replay state must be persisted by the A verifier; no in-repo writable policy is trusted.
export function verifyIndependentAttestation(envelope,policy,{now=Date.now(),usedNonces, trustedPublicKeySha256}={}){
 // Never trust B-supplied PEM as the root: the verifier must receive A-pinned fingerprint out of band.
 if(!(usedNonces instanceof Set)||!isSha256(trustedPublicKeySha256))deny('INDEPENDENT_ANCHOR_OR_PERSISTENT_REPLAY_MISSING');
 const unsigned=validateUnsignedCandidate(envelope?.payload);
 if(!policy?.a_controlled_external_policy||policy?.approved_protocol!==VERSION||
   policy?.key_id!==envelope?.key_id||!policy?.public_key_pem||!Array.isArray(policy?.revoked_proof_hashes)||
   !Array.isArray(policy?.approved_consumers)||!Array.isArray(policy?.approved_heads)||
   !policy.approved_heads.includes(HEAD))deny('INDEPENDENT_A_POLICY_ABSENT');
 if(envelope?.signature_algorithm!=='Ed25519'||typeof envelope.signature_base64!=='string'||
    !/^[a-zA-Z0-9+/]+={0,2}$/.test(envelope.signature_base64)||typeof envelope.nonce!=='string'||
    !/^[a-f0-9]{32,64}$/.test(envelope.nonce)||usedNonces.has(envelope.nonce))deny('SIGNATURE_OR_NONCE');
 if(policy.revoked_proof_hashes.includes(unsigned.proof_sha256))deny('REVOKED');
 if(!Number.isSafeInteger(envelope.issued_at_ms)||!Number.isSafeInteger(envelope.expires_at_ms)||
   envelope.issued_at_ms>now||envelope.expires_at_ms<=now||
   envelope.expires_at_ms-envelope.issued_at_ms>24*3600*1000)deny('TIME_WINDOW');
 // SHA256 B-supplied snapshot alone cannot replace A-controlled durable evidence custody.
 if(envelope.payload.long_term_evidence?.approved_by_A!==true||
    envelope.payload.long_term_evidence?.immutable_archive_verified!==true||
    !isSha256(envelope.payload.long_term_evidence?.archive_root_sha256))deny('A_ARCHIVE_NOT_VERIFIED');
 if(FIVE_SOURCE_CONSUMERS.some(name=>!policy.approved_consumers.includes(name)))deny('CONSUMERS_NOT_MIGRATED');
 let pub;try{pub=createPublicKey(policy.public_key_pem)}catch{deny('A_PUBLIC_KEY_INVALID')}
 if(pub.asymmetricKeyType!=='ed25519')deny('A_KEY_TYPE');
 const fp=createHash('sha256').update(pub.export({type:'spki',format:'der'})).digest('hex');
 if(fp!==trustedPublicKeySha256)deny('A_TRUST_ANCHOR_MISMATCH');
 const message=Buffer.from(canonical({payload:envelope.payload,key_id:envelope.key_id,
  nonce:envelope.nonce,issued_at_ms:envelope.issued_at_ms,expires_at_ms:envelope.expires_at_ms}));
 const signature=Buffer.from(envelope.signature_base64,'base64');
 if(signature.length!==64||!verify(null,message,pub,signature))deny('A_SIGNATURE_INVALID');
 usedNonces.add(envelope.nonce);
 // A caller's in-memory Set cannot establish durable replay custody or A account identity.
 // Even on valid Ed25519 bytes, this is *not* an authorization decision.
 return {cryptographic_signature_check_only:true,protocol:VERSION,proof_sha256:unsigned.proof_sha256,
  formal_issuer_signed:false,authorization_granted:false,
  independent_A_identity_verified:false,persistent_replay_custody_verified:false,
  requires_A_independent_release:true};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
 try{
  if(process.argv.length!==4)deny('A_ENVELOPE_AND_POLICY_PATH_REQUIRED');
  const e=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const p=JSON.parse(readFileSync(process.argv[3],'utf8'));
  // A-owned persistent replay store is deliberately not available from a B-controlled CLI.
  // Standalone CLI must not pretend it can complete independent A attestation.
  deny('A_EXTERNAL_VERIFIER_AND_PERSISTENT_REPLAY_LEDGER_REQUIRED');
 }catch(e){console.error(e.message);process.exitCode=2}
}
