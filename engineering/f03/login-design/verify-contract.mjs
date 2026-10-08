// F03-1-G0 NO-DB NO-HTTP guard. Only read frozen files, never mutate them.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const here=new URL('./',import.meta.url);
const source=await Promise.all(['state-model.mjs','benchmark-scrypt.mjs', 'verify-contract.mjs'].map(n=>readFile(new URL(n,here),'utf8')));
for(const src of source){
 assert.doesNotMatch(src,/(?:from|require\()\s*['"](?:pg|postgres|node:http|node:https|node:net|express|fastify)['"]/);
 assert.doesNotMatch(src,/\b(?:fetch|createServer|listen|connect|pool\.query|executeSql)\s*\(/);
}
const rows=await Promise.all(['schema-delta.tsv','credential-state-machine.tsv','authority-test-coverage.tsv'].map(n=>readFile(new URL(n,here),'utf8')));
for(const [i,content] of rows.entries()){
 const lines=content.trimEnd().split(/\r?\n/).map(l=>l.split('\t'));
 const width=lines[0].length;
 assert.ok(lines.length>(i===0?35:10));
 assert.ok(lines.every(l=>l.length===width&&l.every(v=>v.trim())),'TSV column width/empty field');
}
assert.match(rows[0],/EXISTING_EXCLUDED_DO_NOT_ADD\tsystem_admins\tcredential_hash/);
assert.match(rows[0],/CREATE_TABLE_COLUMN\tpc_auth_sessions\ttoken_digest/);
assert.match(rows[0],/ADD_COLUMN\tpc_login_accounts\tcredential_epoch/);
for(const s of ['password-session-design.md','session-contract.md','schema-migration-advice.md']){
 const doc=await readFile(new URL(s,here),'utf8');
 assert.match(doc,/NOT_RUN|不执行|不实施|只设计/);
}
console.log('F03-1-G0 NO-DB NO-HTTP STATIC SCOPE PASS');
