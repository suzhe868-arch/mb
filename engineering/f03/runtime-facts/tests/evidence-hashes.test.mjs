import {test} from 'node:test';
import assert from 'node:assert/strict';
import {artifactHash,verifyArtifactHashes} from '../evidence-hashes.mjs';
const sql=Buffer.from('CREATE TABLE public.synthetic (id bigint);\n');
const inv=Buffer.from('{"kind":"synthetic only"}\n');
const base={'pg16_schema_only.sql':sql,'pg16_inventory.json':inv};
const manifest=Object.entries(base).map(([n,b])=>artifactHash(b)+'  f03/runtime-facts/artifacts/'+n).join('\n')+'\n';
test('E1-01 recomputes real SHA-256 from exact binary input instead of only checking text format',()=>{
 const parsed=verifyArtifactHashes(base,manifest);
 assert.equal(parsed['pg16_schema_only.sql'],artifactHash(sql));
 assert.equal(parsed['pg16_inventory.json'],artifactHash(inv));
});
test('E1-02 altered SQL bytes, altered inventory bytes, or plausible fake checksums must fail closed',()=>{
 for(const [k,value] of [['pg16_schema_only.sql',Buffer.concat([sql,Buffer.from(' ' )])],['pg16_inventory.json',Buffer.from('{"kind":"tampered"}\n')]]){
  assert.throws(()=>verifyArtifactHashes({...base,[k]:value},manifest),/SHA256_ACTUAL_BYTES_MISMATCH/);
 }
 assert.throws(()=>verifyArtifactHashes(base,manifest.replace(artifactHash(sql),'f'.repeat(64))),/SHA256_ACTUAL_BYTES_MISMATCH/);
});
test('E1-03 wrong path, duplicates, dropped line and reordering with invalid mapping rejected',()=>{
 const lines=manifest.trimEnd().split('\n');
 assert.throws(()=>verifyArtifactHashes(base,lines[0]+'\n'+lines[0]+'\n'),/UNKNOWN_OR_DUPLICATE_SHA_FILE/);
 assert.throws(()=>verifyArtifactHashes(base,lines[0]+'\n'),/EXPECTED_EXACT_TWO_HASH_LINES/);
 assert.throws(()=>verifyArtifactHashes(base,manifest.replace('pg16_schema_only.sql','pg16_other.sql')), /UNSAFE_OR_BAD_SHA256_MANIFEST_FORMAT/);
 assert.throws(()=>verifyArtifactHashes(base,manifest.replace(/f03\/runtime-facts\/artifacts\//g,'elsewhere/')), /UNSAFE_OR_BAD_SHA256_MANIFEST_FORMAT/);
});

test('E1-04 pg_dump restrict/unrestrict run key is the ONLY allowed cross-run difference',async()=>{
 const {normalizeOnlyPgDumpRestrictKey,assertSameApprovedSchemaExceptPgDumpKey}=await import('../evidence-hashes.mjs');
 const keyA='A'.repeat(64),keyB='B'.repeat(64);
 const dump=(key)=>Buffer.from('-- PostgreSQL database dump\n\\restrict '+key+'\nCREATE TABLE public.example (id bigint);\n\\unrestrict '+key+'\n');
 assert.doesNotThrow(()=>assertSameApprovedSchemaExceptPgDumpKey(dump(keyA),dump(keyB)));
 assert.notEqual(artifactHash(dump(keyA)),artifactHash(dump(keyB)));
 assert.throws(()=>assertSameApprovedSchemaExceptPgDumpKey(dump(keyA),Buffer.from(dump(keyB).toString().replace('id bigint','id text'))),/PG_DUMP_NON_RANDOM_STRUCTURE_BYTES_DIFFER/);
 assert.throws(()=>normalizeOnlyPgDumpRestrictKey(Buffer.from(dump(keyA).toString().replace('unrestrict '+keyA,'unrestrict '+keyB))),/PG_DUMP_RESTRICT_KEY_PAIR_MISMATCH/);
 assert.throws(()=>normalizeOnlyPgDumpRestrictKey(Buffer.from('-- no dump markers')),/PG_DUMP_RESTRICT_MARKER_REQUIRED/);
});
