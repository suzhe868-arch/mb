import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map(line => {
    const vals=[]; let cur=''; let q=false;
    for (let i=0;i<line.length;i++) {
      const c=line[i];
      if (q) { if (c==='"' && line[i+1]==='"') {cur+='"';i++;} else if(c==='"') q=false; else cur+=c; }
      else if(c==='"') q=true; else if(c===','){vals.push(cur);cur='';} else cur+=c;
    }
    vals.push(cur);
    return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']));
  });
}

test('operation ownership is a lossless projection of current operation-index', () => {
  const ops=JSON.parse(fs.readFileSync('packages/contracts/generated/operation-index.json','utf8'));
  const owners=JSON.parse(fs.readFileSync('workstreams/operation-owner-map.json','utf8'));
  const rows=parseCsv(fs.readFileSync('workstreams/OPERATION_OWNERSHIP.csv','utf8'));
  assert.equal(rows.length,ops.length);
  const byId=new Map(rows.map(r=>[r.operationId,r]));
  for(const op of ops){
    const r=byId.get(op.operationId); assert.ok(r,`missing ${op.operationId}`);
    assert.equal(r.owner,owners[op.operationId],`owner ${op.operationId}`);
    for(const k of ['method','path','identityDomain','permission','scope','projection','idempotency']) assert.equal(r[k],String(op[k]??''),`${op.operationId} ${k}`);
  }
});
