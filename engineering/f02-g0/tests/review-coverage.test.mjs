import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=n=>readFile(new URL(n,root),'utf8');
const parse=s=>s.trim().split(/\r?\n/).map(x=>x.split('\t'));
test('原376字段与新增37字段逐项分级、原80项REVIEW全覆盖且无擅自冻结',async()=>{
 const m=parse(await read('field-matrix.tsv')).slice(1), r=parse(await read('nullable-review-80.tsv')).slice(1),t=parse(await read('field-tiers-376.tsv')).slice(1);
 assert.equal(m.length,510);assert.equal(r.length,80);assert.equal(t.length,510);assert.equal(m.filter(z=>Number(z[0].slice(-4))<=381).length,376);
 const lookup=new Map(m.map(z=>[z[0],z]));
 assert.equal(new Set(t.map(z=>z[0])).size,510);assert.equal(new Set(r.map(z=>z[0])).size,80);
 for(const row of r){
  assert.equal(row.length,7);assert.ok(['REVIEW','YES','NO'].includes(lookup.get(row[0])[4]));
  assert.equal(row[1],lookup.get(row[0])[1]+'.'+lookup.get(row[0])[2]);
  assert.match(row[2],/^(CORE_PROPOSAL|A_TECHNICAL_HOLD|DEFER_WITH_REASON)$/);
  assert.ok(row[4].startsWith('PDM-'));assert.ok(row[5].length>12);
  assert.match(row[6],/^(A_DIRECTION_REVIEW_PENDING_FINAL_FREEZE|DEFERRED_PENDING_A_ACKNOWLEDGMENT)$/);
 }
 for(const row of t){
  assert.equal(row.length,6);assert.ok(lookup.has(row[0]));assert.equal(row[4],'CANDIDATE_UNFROZEN');
 }
});
test('历史80条REVIEW有完整处理，仍无A最终冻结',async()=>{
 const m=parse(await read('field-matrix.tsv')).slice(1),r=parse(await read('nullable-review-80.tsv')).slice(1);
 assert.ok(m.filter(z=>z[4]==='REVIEW').every(z=>r.some(x=>x[0]===z[0])));assert.equal(r.filter(z=>z[2]==='CORE_PROPOSAL').length,36);assert.equal(r.filter(z=>z[2]==='A_TECHNICAL_HOLD').length,28);assert.equal(r.filter(z=>z[2]==='DEFER_WITH_REASON').length,16);
});
