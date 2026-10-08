import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=n=>readFile(new URL(n,root),'utf8');
const parse=s=>s.trim().split(/\r?\n/).map(x=>x.split('\t'));
test('376行分级、80项review全部有处理分类和明确依据且没有擅自冻结',async()=>{
 const m=parse(await read('field-matrix.tsv')).slice(1), r=parse(await read('nullable-review-80.tsv')).slice(1),t=parse(await read('field-tiers-376.tsv')).slice(1);
 assert.equal(m.length,376);assert.equal(r.length,80);assert.equal(t.length,376);
 const lookup=new Map(m.map(z=>[z[0],z]));
 assert.equal(new Set(t.map(z=>z[0])).size,376);assert.equal(new Set(r.map(z=>z[0])).size,80);
 for(const row of r){
  assert.equal(row.length,7);assert.equal(lookup.get(row[0])[4],'REVIEW');
  assert.equal(row[1],lookup.get(row[0])[1]+'.'+lookup.get(row[0])[2]);
  assert.match(row[2],/^(CORE_PROPOSAL|A_TECHNICAL_HOLD|DEFER_WITH_REASON)$/);
  assert.ok(row[4].startsWith('PDM-'));assert.ok(row[5].length>12);
  assert.equal(row[6],'PENDING_A');
 }
 for(const row of t){
  assert.equal(row.length,6);assert.ok(lookup.has(row[0]));assert.equal(row[4],'CANDIDATE_UNFROZEN');
 }
});
test('每个REVIEW唯一匹配一条审查意见，非REVIEW不能伪造为已裁定',async()=>{
 const m=parse(await read('field-matrix.tsv')).slice(1),r=parse(await read('nullable-review-80.tsv')).slice(1);
 assert.deepEqual(new Set(r.map(z=>z[0])),new Set(m.filter(z=>z[4]==='REVIEW').map(z=>z[0])));
});
