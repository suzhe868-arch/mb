// F04-2A: source+current Final+IA+Low-Fi evidence inside real isolated M94 PG16.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verify as verifyM94,connect} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {verifyCurrent,validateMapping,splitTsv} from '../source-verifier.mjs';

const src=new URL('../../../../09_历史工程资产基线/01_ENGINEERING_STARTER_LEGACY/packages/contracts/openapi.yaml',import.meta.url);
const original=new URL('../../contract-gate/legacy-endpoint-inventory.tsv',import.meta.url);
const matrix=new URL('../current-authority-route-matrix.tsv',import.meta.url);
const raw=readFileSync(matrix,'utf8'),old=readFileSync(original,'utf8'),api=readFileSync(src,'utf8');
const rows=splitTsv(raw),db=await connect();test.after(()=>db.end());
const mutate=(fn)=>{const x=raw.trimEnd().split('\n'),headers=x[0].split('\t'),entry=x[1].split('\t');
 const a=Object.fromEntries(headers.map((k,i)=>[k,i]));fn(entry,a);x[1]=entry.join('\t');return x.join('\n')+'\n'};
test('F04-A01 isolated genuine PG16 M94 seal remains 94 immutable tables',async()=>{
 assert.equal((await verifyM94(db)).verified,true);
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,94);
});
test('F04-A02 218 original methods = 215 mapped candidates + 3 forbidden; 198 paths and 62 colon paths',()=>{
 const sum=verifyCurrent();
 assert.deepEqual({routes:sum.routes,retired:sum.retired,paths:sum.paths,originalMethods:sum.originalMethods,colonPaths:sum.colonPaths},
 {routes:215,retired:3,paths:198,originalMethods:218,colonPaths:62});
 assert.equal(sum.EVIDENCE_MATCHED+sum.SOURCE_GAP+sum.CONFLICT_REQUIRES_USER,215);
 assert.ok(sum.EVIDENCE_MATCHED>=30&&sum.SOURCE_GAP>=1);
});
test('F04-A03 real verifiable PDM/IA/page quotes are not proxy for approving an old HTTP URL',()=>{
 for(const r of rows){assert.equal(r.decision,'UNDECIDED');assert.equal(r.current_stage,'CONTRACT_ONLY');
  assert.ok(r.source_gap_reason&&r.responsible_owner);
  if(r.mapping_evidence==='EVIDENCE_MATCHED')assert.ok(r.pdm_file&&r.nav_file&&r.page_file);
 }
});
test('F04-A04 original source method/path identity tampering and forged operationId are refused',()=>{
 assert.throws(()=>validateMapping(mutate((r,c)=>r[c.legacy_path]='/staff/customers/fake'),old,api),/FROZEN_OLD_ROUTE_DRIFT/);
 assert.throws(()=>validateMapping(mutate((r,c)=>r[c.operation_id]='forged'),old,api),/FROZEN_OLD_ROUTE_DRIFT/);
 assert.throws(()=>validateMapping(mutate((r,c)=>r[c.source_line]='99'),old,api),/FROZEN_OLD_ROUTE_DRIFT/);
});
test('F04-A05 fake PDM/IA/Low-Fi file, position or literal bytes cannot be certified',()=>{
 const good=rows.find(r=>r.mapping_evidence==='EVIDENCE_MATCHED');assert.ok(good);
 const at=rows.indexOf(good)+1;
 const m=(key,value)=>{const t=raw.trimEnd().split('\n'),h=t[0].split('\t'),v=t[at].split('\t');
  v[h.indexOf(key)]=value;t[at]=v.join('\t');return t.join('\n')+'\n'};
 assert.throws(()=>validateMapping(m('pdm_line','99999'),old,api),/FORGED_AUTHORITY/);
 assert.throws(()=>validateMapping(m('nav_quote','FABRICATED_AUTHORITY'),old,api),/FORGED_AUTHORITY/);
 assert.throws(()=>validateMapping(m('page_file','/tmp/fake'),old,api),/FORGED_AUTHORITY/);
});
test('F04-A06 SOURCE_GAP cannot be relabeled as approved route or business permission',()=>{
 assert.throws(()=>validateMapping(mutate((r,c)=>r[c.decision]='KEEP'),old,api),/ACTION_WITHOUT_VERIFIED_API_CONTRACT/);
 assert.throws(()=>validateMapping(mutate((r,c)=>r[c.current_stage]='IMPLEMENTED_CI_ONLY'),old,api),/LEGACY_ROUTE_OPENED/);
 const gapAt=rows.findIndex(r=>r.mapping_evidence==='SOURCE_GAP');
 assert.ok(gapAt>=0);
 const bad=raw.trimEnd().split('\n'),h=bad[0].split('\t'),vals=bad[gapAt+1].split('\t');
 vals[h.indexOf('mapping_evidence')]='EVIDENCE_MATCHED';bad[gapAt+1]=vals.join('\t');
 assert.throws(()=>validateMapping(bad.join('\n')+'\n',old,api),/NO_TRIPLE_AUTHORITY|FORGED_AUTHORITY/);
});
test('F04-A07 changing the physical historic OpenAPI cannot validate against a stale mapping',()=>{
 assert.throws(()=>validateMapping(raw,old,api.replace('  /customer/me:', '  /customer/me:spoof:')),/SOURCE_SEAL_COUNT|REBUILT_OPENAPI_DRIFT|FROZEN_OLD_ROUTE_DRIFT/);
});
test('F04-A08 no first-class live API inherits anonymous legacy customer rights',()=>{
 const c=rows.filter(x=>x.legacy_path.includes('customer'));
 assert.ok(c.length>20);
 for(const r of c)assert.ok(!r.current_stage.includes('IMPLEMENTED'));
 const retired=splitTsv(old).filter(x=>x.review_action==='RETIRE');
 assert.equal(retired.length,3);for(const x of retired)assert.ok(!rows.find(r=>r.legacy_id===x.legacy_id));
});
