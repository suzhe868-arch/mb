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

// pg_dump 16.15 chooses a fresh SQL client-side \restrict key on every run.
// For cross-run semantic comparison ONLY, allow this exact paired-key change,
// never treat canonical content as an original archive or as a raw SHA match.
export function normalizeOnlyPgDumpRestrictKey(raw){
 assert.ok(Buffer.isBuffer(raw),'PG_DUMP_BYTES_REQUIRED');
 const s=raw.toString('utf8');
 const start=[...s.matchAll(/^\\restrict ([A-Za-z0-9]{32,128})\r?$/gm)];
 const end=[...s.matchAll(/^\\unrestrict ([A-Za-z0-9]{32,128})\r?$/gm)];
 assert.equal(start.length,1,'PG_DUMP_RESTRICT_MARKER_REQUIRED');
 assert.equal(end.length,1,'PG_DUMP_UNRESTRICT_MARKER_REQUIRED');
 assert.equal(start[0][1],end[0][1],'PG_DUMP_RESTRICT_KEY_PAIR_MISMATCH');
 assert.ok(start[0].index<end[0].index,'PG_DUMP_RESTRICT_ORDER_INVALID');
 return s.replace(/^\\restrict ([A-Za-z0-9]{32,128})\r?$/gm,'\\restrict __PG_DUMP_RANDOM_KEY__')
         .replace(/^\\unrestrict ([A-Za-z0-9]{32,128})\r?$/gm,'\\unrestrict __PG_DUMP_RANDOM_KEY__');
}
export function assertSameApprovedSchemaExceptPgDumpKey(sourceBytes,currentBytes){
 assert.equal(normalizeOnlyPgDumpRestrictKey(sourceBytes),normalizeOnlyPgDumpRestrictKey(currentBytes),
   'PG_DUMP_NON_RANDOM_STRUCTURE_BYTES_DIFFER');
}
