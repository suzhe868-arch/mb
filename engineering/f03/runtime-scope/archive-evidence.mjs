// E1: actual original bytes from immutable successful source CI, not reconstructed text.
// Run against final disposable CI exports. No file writes, no DB connections.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=x=>createHash('sha256').update(x).digest('hex');
const original=['old-structure.json','new-structure.json','pg16_schema_only.sql','pg16_inventory.json','sha256sums.txt'];
export function verifyTwoFileManifest(root,manifest){
 const expected=['pg16_schema_only.sql','pg16_inventory.json'];
 const rows=manifest.toString('utf8').trimEnd().split(/\r?\n/);
 assert.equal(rows.length,2,'SHA256_MANIFEST_MUST_HAVE_TWO_ORIGINAL_ITEMS');
 const map=new Map();
 for(const line of rows){
  const m=/^([0-9a-f]{64})  f03\/runtime-scope\/artifacts\/(pg16_schema_only\.sql|pg16_inventory\.json)$/.exec(line);
  assert.ok(m,'MALFORMED_SOURCE_OR_CURRENT_MANIFEST');
  assert.ok(!map.has(m[2]),'DUPLICATED_HASH_PATH');
  assert.ok(Buffer.isBuffer(root[m[2]]),'RAW_EVIDENCE_BYTES_REQUIRED');
  assert.equal(m[1],hash(root[m[2]]),'REAL_SHA256_BYTES_MISMATCH_'+m[2]);
  map.set(m[2],m[1]);
 }
 assert.deepEqual([...map.keys()].sort(),[...expected].sort(),'MISSING_MANDATORY_HASH_ENTRY');
 return map;
}
export function canonicalPgDumpOnlyPairedRestrict(x){
 assert.ok(Buffer.isBuffer(x),'RAW_DUMP_REQUIRED');
 const txt=x.toString('utf8');
 const start=[...txt.matchAll(/^\\restrict ([A-Za-z0-9]{32,128})\r?$/gm)];
 const end=[...txt.matchAll(/^\\unrestrict ([A-Za-z0-9]{32,128})\r?$/gm)];
 assert.equal(start.length,1,'ONE_SOURCE_RESTRICT_KEY_REQUIRED');
 assert.equal(end.length,1,'ONE_SOURCE_UNRESTRICT_KEY_REQUIRED');
 assert.equal(start[0][1],end[0][1],'PG_DUMP_RANDOM_KEY_MUST_PAIR');
 assert.ok(start[0].index<end[0].index,'PG_DUMP_RANDOM_KEY_ORDER');
 return txt.replace(/^\\restrict [A-Za-z0-9]{32,128}\r?$/gm,'\\restrict __ONLY_RANDOM_PG_DUMP_KEY__')
           .replace(/^\\unrestrict [A-Za-z0-9]{32,128}\r?$/gm,'\\unrestrict __ONLY_RANDOM_PG_DUMP_KEY__');
}
export function checkActualOriginalAgainstCurrent(source,current){
 for(const name of original)assert.ok(Buffer.isBuffer(source[name])&&Buffer.isBuffer(current[name]),'MISSING_ORIGINAL_RAW_'+name);
 const sourceHashes=verifyTwoFileManifest(source,source['sha256sums.txt']);
 const currentHashes=verifyTwoFileManifest(current,current['sha256sums.txt']);
 for(const name of ['old-structure.json','new-structure.json','pg16_inventory.json'])
  assert.ok(source[name].equals(current[name]),'ARCHIVED_AND_CI_OBJECT_BYTES_DIFFER_'+name);
 assert.equal(canonicalPgDumpOnlyPairedRestrict(source['pg16_schema_only.sql']),
              canonicalPgDumpOnlyPairedRestrict(current['pg16_schema_only.sql']),
              'ARCHIVED_AND_CI_NONRANDOM_SQL_BYTES_DIFFER');
 for(const name of ['old-structure.json','new-structure.json']){
  const parsed=JSON.parse(source[name]);
  assert.ok(/^[a-f0-9]{64}$/.test(parsed.structure_sha256),'MISSING_PINNED_STRUCTURE_FINGERPRINT');
 }
 return {sourceHashes:Object.fromEntries(sourceHashes),currentHashes:Object.fromEntries(currentHashes),
  structureHashes:Object.fromEntries(['old-structure.json','new-structure.json'].map(name=>[name,hash(source[name])]))};
}
export async function assertArchiveEvidence(){
 const location=new URL('./',import.meta.url);
 const paths=[new URL('./evidence/',location),new URL('./artifacts/',location)];
 const [source,current]=await Promise.all(paths.map(async dir=>Object.fromEntries(
  await Promise.all(original.map(async name=>[name,await readFile(new URL(name,dir))]))
 )));
 const origin=await readFile(new URL('SOURCE.md',paths[0]),'utf8');
 assert.match(origin,/source_run_id:\s*37901077203\b/);
 assert.match(origin,/source_commit_sha:\s*df27522891438c51ff8847cc5e018b698c0a98fc\b/);
 assert.match(origin,/source_artifact_id:\s*11602367762\b/);
 const verified=checkActualOriginalAgainstCurrent(source,current);
 console.log('F03-2-1B E1 REAL ORIGINAL SOURCE SHA256 '+JSON.stringify(verified.sourceHashes));
 console.log('F03-2-1B E1 REAL CURRENT CI SHA256 '+JSON.stringify(verified.currentHashes));
 console.log('F03-2-1B E1 OLD/NEW FULL PHYSICAL JSON RAW SHA256 '+JSON.stringify(verified.structureHashes));
 console.log('F03-2-1B E1 PASS: source raw bytes preserved; full object JSON and inventory exact, SQL differs only in the allowed paired pg_dump random key');
}
if(process.argv[1]?.endsWith('/archive-evidence.mjs'))await assertArchiveEvidence();
