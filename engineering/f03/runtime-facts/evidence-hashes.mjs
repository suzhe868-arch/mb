// Read-only artifact SHA-256 verification. This module never opens a DB or exposes secrets.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const prefix='f03/runtime-facts/artifacts/';
const keys=['pg16_schema_only.sql','pg16_inventory.json'];
export const artifactHash=(bytes)=>createHash('sha256').update(bytes).digest('hex');
export function verifyArtifactHashes(files,manifest){
 assert.ok(Buffer.isBuffer(files['pg16_schema_only.sql'])&&Buffer.isBuffer(files['pg16_inventory.json']),'ARTIFACT_BYTES_REQUIRED');
 assert.equal(typeof manifest,'string');
 const lines=manifest.trimEnd().split(/\r?\n/);
 assert.equal(lines.length,2,'EXPECTED_EXACT_TWO_HASH_LINES');
 const seen=new Set();
 for(const line of lines){
  const m=/^([0-9a-f]{64})  (f03\/runtime-facts\/artifacts\/pg16_(?:schema_only\.sql|inventory\.json))$/.exec(line);
  assert.ok(m,'UNSAFE_OR_BAD_SHA256_MANIFEST_FORMAT');
  const name=m[2].slice(prefix.length);
  assert.ok(keys.includes(name)&&!seen.has(name),'UNKNOWN_OR_DUPLICATE_SHA_FILE');
  assert.equal(m[1],artifactHash(files[name]),'SHA256_ACTUAL_BYTES_MISMATCH_'+name);
  seen.add(name);
 }
 assert.deepEqual([...seen].sort(),[...keys].sort(),'REQUIRED_SHA_FILE_MISSING');
 return Object.fromEntries(keys.map(n=>[n,artifactHash(files[n])]));
}
