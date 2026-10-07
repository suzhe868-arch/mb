import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const ops=JSON.parse(fs.readFileSync('packages/contracts/generated/operation-index.json','utf8'));
const owners=JSON.parse(fs.readFileSync('workstreams/operation-owner-map.json','utf8'));
test('every operation owner has a generated executable manifest',()=>{
 const set=new Set(Object.values(owners));
 for(const owner of set){
  const p=`workstreams/${owner}_OPERATIONS.md`; assert.ok(fs.existsSync(p),p);
  const body=fs.readFileSync(p,'utf8');
  const expected=ops.filter(o=>owners[o.operationId]===owner).length;
  assert.match(body,new RegExp(`Count: ${expected}\\*\\*`));
  for(const o of ops.filter(o=>owners[o.operationId]===owner)) assert.ok(body.includes(`\`${o.operationId}\``),`${owner} missing ${o.operationId}`);
 }
});
