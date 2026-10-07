import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ops = JSON.parse(fs.readFileSync(path.join(root,'packages/contracts/generated/operation-index.json'),'utf8'));
const ownerMap = JSON.parse(fs.readFileSync(path.join(root,'workstreams/operation-owner-map.json'),'utf8'));
const fields = ['owner','method','path','operationId','identityDomain','permission','scope','projection','idempotency'];
const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"','""')}"` : s;
};
const rows = [];
for (const op of ops) {
  const owner = ownerMap[op.operationId];
  if (!owner) throw new Error(`Missing owner for ${op.operationId}`);
  rows.push({ owner, ...op });
}
const csv = [fields.join(','), ...rows.map(r => fields.map(f=>esc(r[f])).join(','))].join('\n')+'\n';
fs.writeFileSync(path.join(root,'workstreams/OPERATION_OWNERSHIP.csv'),csv);
const counts = new Map();
for (const r of rows) counts.set(r.owner,(counts.get(r.owner)??0)+1);
const lines = ['# Operation Ownership Summary','',...Array.from(counts).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`- \`${k}\`: ${v} OpenAPI operations`),'','This is an engineering ownership map, not product authority. Shared operations may require cross-workstream review.',''];
fs.writeFileSync(path.join(root,'workstreams/OPERATION_OWNERSHIP_SUMMARY.md'),lines.join('\n'));
console.log(`Generated ownership for ${rows.length} operations.`);
