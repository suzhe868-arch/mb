// F03-G0 static safety gate: no PostgreSQL/HTTP/login imports or side effects.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const policy=await readFile(new URL('./policy.mjs',import.meta.url),'utf8');
const tests=await Promise.all(['policy.test.mjs','contract.test.mjs','sensitivity.test.mjs'].map(name=>readFile(new URL('./tests/'+name,import.meta.url),'utf8')));
const all=[policy,...tests];
for(const [i,src] of all.entries()){
 assert.doesNotMatch(src,/\b(?:require|import)\s*\(?\s*['"](?:pg|postgres|mysql|sqlite3|mongodb|fastify|express|node:net|node:http|node:https)['"]/);
 assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|WebSocket|createServer|openDatabase|connectDatabase)\s*\(/);
}
assert.doesNotMatch(policy,/\b(?:process\.env|process\.argv|setTimeout|setInterval|globalThis|eval)\b/);
assert.ok(policy.includes("UNKNOWN_OR_RETIRED_ACTION"));
assert.ok(policy.includes("HARD_DENY_FOUR_S"));
assert.ok(policy.includes("SCOPE_DENIED"));
assert.ok(policy.includes("RESOURCE_ACCOUNT_INACTIVE"));
assert.ok(policy.includes("CURRENT_SCOPE_PROJECTED"));
assert.ok(policy.includes("ACTIONS"));
const contract=await readFile(new URL('./permission-contract.tsv',import.meta.url),'utf8');
assert.ok(contract.split(/\r?\n/).length>=40);
assert.ok(contract.includes('TECH_ALIAS_PENDING_A'));
assert.ok(contract.includes('DEFER_NOT_IMPLEMENTED'));
console.log('F03-G0 STATIC BOUNDARY PASS: no database/real identity calls; exact-authorized files only');
