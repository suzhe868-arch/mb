import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const ops=JSON.parse(fs.readFileSync('packages/contracts/generated/operation-index.json','utf8'));
const owners=JSON.parse(fs.readFileSync('workstreams/operation-owner-map.json','utf8'));
const groups=new Map();
for(const op of ops){const owner=owners[op.operationId]; if(!owner) throw new Error(`owner missing ${op.operationId}`); if(!groups.has(owner))groups.set(owner,[]); groups.get(owner).push(op);}
for(const [owner,items] of groups){
 const lines=[`# ${owner} — OpenAPI Operation Manifest`,'',`Generated from current .10 CR-007 operation-index. **Count: ${items.length}**.`,'','| Method | Path | operationId | Identity | Permission/Capability | Scope | Projection | Idempotency |','|---|---|---|---|---|---|---|---|'];
 for(const o of items) lines.push(`| \`${o.method}\` | \`${o.path}\` | \`${o.operationId}\` | \`${o.identityDomain}\` | \`${o.permission}\` | ${String(o.scope).replaceAll('|','\\|')} | \`${o.projection}\` | ${String(o.idempotency).replaceAll('|','\\|')} |`);
 lines.push('','Generated engineering routing only; product authority remains the independent FINAL_DEV_READY .10 mother copy.','');
 fs.writeFileSync(path.join('workstreams',`${owner}_OPERATIONS.md`),lines.join('\n'));
}
console.log(`Generated ${groups.size} workstream operation manifests for ${ops.length} operations.`);
