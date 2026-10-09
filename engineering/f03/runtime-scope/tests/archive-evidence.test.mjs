import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {checkActualOriginalAgainstCurrent,canonicalPgDumpOnlyPairedRestrict} from '../archive-evidence.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const mk=(key)=>{
 const x={
  'old-structure.json':Buffer.from('{"structure_sha256":"'+ 'a'.repeat(64)+'","objects":[]}\n'),
  'new-structure.json':Buffer.from('{"structure_sha256":"'+ 'b'.repeat(64)+'","objects":[]}\n'),
  'pg16_inventory.json':Buffer.from('{"versionChain":["000001","000002","000003"]}\n'),
  'pg16_schema_only.sql':Buffer.from('-- PG16\n\\restrict '+key+'\nCREATE TABLE public.a (id bigint);\n\\unrestrict '+key+'\n')
 };
 x['sha256sums.txt']=Buffer.from(['pg16_schema_only.sql','pg16_inventory.json'].map(n=>sha(x[n])+'  f03/runtime-scope/artifacts/'+n).join('\n')+'\n');
 return x;
};
test('E1-01 preserved originals can differ ONLY in a paired pg_dump random session key',()=>{
 const a=mk('A'.repeat(64)),b=mk('B'.repeat(64));
 const r=checkActualOriginalAgainstCurrent(a,b);
 assert.notEqual(r.sourceHashes['pg16_schema_only.sql'],r.currentHashes['pg16_schema_only.sql']);
 assert.equal(r.sourceHashes['pg16_inventory.json'],r.currentHashes['pg16_inventory.json']);
});
test('E1-02 rejects tampered original and current real raw hashes, not merely hex formatting',()=>{
 const a=mk('A'.repeat(64)),b=mk('B'.repeat(64));
 for(const name of ['pg16_schema_only.sql','pg16_inventory.json']){
  const broken={...a,[name]:Buffer.concat([a[name],Buffer.from('!')])};
  assert.throws(()=>checkActualOriginalAgainstCurrent(broken,b),/REAL_SHA256_BYTES_MISMATCH/);
 }
});
test('E1-03 rejects changed schema definition, index, object JSON or inventory',()=>{
 const a=mk('A'.repeat(64)),b=mk('B'.repeat(64));
 const forged={...b,'pg16_schema_only.sql':Buffer.from(b['pg16_schema_only.sql'].toString().replace('id bigint','id text'))};
 forged['sha256sums.txt']=Buffer.from(['pg16_schema_only.sql','pg16_inventory.json'].map(n=>sha(forged[n])+'  f03/runtime-scope/artifacts/'+n).join('\n')+'\n');
 assert.throws(()=>checkActualOriginalAgainstCurrent(a,forged),/NONRANDOM_SQL_BYTES_DIFFER/);
 const changed={...b,'new-structure.json':Buffer.from('{}')};
 assert.throws(()=>checkActualOriginalAgainstCurrent(a,changed),/ARCHIVED_AND_CI_OBJECT_BYTES_DIFFER/);
});
test('E1-04 rejects unpaired/repeated pg_dump markers and missing hash entry',()=>{
 const a=mk('A'.repeat(64));const b=mk('B'.repeat(64));
 assert.throws(()=>canonicalPgDumpOnlyPairedRestrict(Buffer.from('\\restrict '+ 'A'.repeat(64)+'\n')),/ONE_SOURCE_UNRESTRICT_KEY_REQUIRED/);
 assert.throws(()=>canonicalPgDumpOnlyPairedRestrict(Buffer.from('\\restrict '+ 'A'.repeat(64)+'\n\\unrestrict '+ 'B'.repeat(64)+'\n')),/PG_DUMP_RANDOM_KEY_MUST_PAIR/);
 const repeated=Buffer.from(a['pg16_schema_only.sql'].toString()+'\\restrict '+ 'A'.repeat(64)+'\n');
 assert.throws(()=>canonicalPgDumpOnlyPairedRestrict(repeated),/ONE_SOURCE_RESTRICT_KEY_REQUIRED/);
 assert.throws(()=>checkActualOriginalAgainstCurrent(a,{...b,'sha256sums.txt':Buffer.from('garbage')}),/SHA256_MANIFEST_MUST_HAVE_TWO_ORIGINAL_ITEMS|MALFORMED_SOURCE_OR_CURRENT_MANIFEST/);
});
