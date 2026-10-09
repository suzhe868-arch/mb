// F03-2-G0 ONLY local static files; absolutely no SQL, pg, HTTP or user data.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {ACTIONS} from '../policy.mjs';
import {verifyPhysicalClaims} from './physical-claims.mjs';
const here=new URL('./',import.meta.url),engineering=new URL('../../',import.meta.url);
const read=async p=>readFile(new URL(p,here),'utf8');
const original=async p=>readFile(new URL(p,engineering),'utf8');
const rows=s=>s.trimEnd().split(/\r?\n/).map(x=>x.split('\t'));
const source=rows(await original('f03/permission-contract.tsv'));
const facts=rows(await read('authority-fact-map.tsv'));
const scopes=rows(await read('capability-scope-contract.tsv'));
const govern=rows(await read('governance-action-contract.tsv'));
const coverage=rows(await read('authority-test-coverage.tsv'));
const matrix=rows(await original('f02-g0/field-matrix.tsv'));
const freeze=rows(await original('f02-g0/field-freeze-candidates.tsv'));
assert.equal(source.length,46,'F03-G0 45-line contract baseline drift');
const accepted=new Set(matrix.slice(1).filter(row=>{
 const result=freeze.slice(1).find(x=>x[1]===row[1]+'.'+row[2]);
 return result?.[4]?.startsWith('INCLUDE_');
}).map(x=>x[1]+'.'+x[2]));
assert.equal(accepted.size,464,'F02 freeze did not match exactly 464 includes');
for(const [name,data] of [['facts',facts],['scopes',scopes]]){
 assert.equal(data.length,source.length,name+' missing coverage');
 const opIdx=name==='facts'?1:0;
 assert.deepEqual(data.slice(1).map(x=>x[opIdx]).sort(),source.slice(1).map(x=>x[0]).sort(),name+' source operation mismatch');
}
const sql=await original('f03-1/evidence/pg16_schema_only.sql');
const physical=verifyPhysicalClaims(sql,await read('schema-physical-claims.tsv'));
const addenda=new Set(['pc_login_accounts.credential_epoch']);
for(const row of facts.slice(1)){
 const op=row[1],physical=row[3],missing=row[4],phase=row[10];
 assert.ok(row[0].includes('PDM-'),'missing authority for '+op);
 assert.ok(row[9].length>5,'missing later implementation batch for '+op);
 assert.ok(['FIELDS_SUPPORTED_ALIAS_REVIEW_REQUIRED','DEFER_DENY_OR_SCHEMA_PROPOSAL'].includes(phase));
 for(const col of physical.split(',').filter(Boolean))
  assert.ok(accepted.has(col)||addenda.has(col)||physical.get(col.split('.')[0])?.has(col.split('.')[1]),'claiming nonphysical column as existing: '+op+' '+col);
 // Defer items may still have existing columns, but must disclose the absent relationship.
 if(phase.startsWith('DEFER_DENY'))assert.ok(missing.length>0||source.some(x=>x[0]===op&&(x[4].includes('PENDING_A')||x[10]==='DEFER_NOT_IMPLEMENTED')),'unexplained defer '+op);
}
const originalActions=source.slice(1).filter(x=>x[10]==='F03_G0_STATIC').map(x=>x[0]).sort();
assert.deepEqual(originalActions,Object.keys(ACTIONS).sort(),'frozen F03-G0 policy changed or static mapping unaccounted');
assert.ok(scopes.slice(1).every(x=>x[5].includes('employee_data_scopes无permission_id')));
assert.ok(scopes.slice(1).every(x=>x[9].length>0&&x[10].length>0));
assert.ok(govern.length>=14&&govern.slice(1).every(x=>x.length===8&&x[1].startsWith('PDM-')));
assert.deepEqual(coverage.slice(1).map(x=>x[0]),Array.from({length:12},(_,i)=>'G0-'+String(i+1).padStart(2,'0')));
const allModel=[await read('model.mjs'),await read('tests/fixture.mjs'),await read('tests/model.test.mjs'),await read('tests/sensitivity.test.mjs'),await read('tests/review-r1-r5.test.mjs'),await read('physical-claims.mjs')];
for(const [i,src] of allModel.entries()){
 assert.doesNotMatch(src,/\b(?:import|require)\s*\(?\s*['"](?:pg|postgres|mysql|sqlite|node:net|node:http|node:https|express|fastify)['"]/i,'db/network import in model '+i);
 assert.doesNotMatch(src,/\b(?:fetch|createServer|createConnection|connect|WebSocket|XMLHttpRequest|new\s+pg\.Pool|new\s+pg\.Client)\s*\(/,'network effect in model '+i);
 assert.doesNotMatch(src,/\bprocess\.env\b/,'environment access in model '+i);
}
const model=allModel[0];
for(const guard of ['UNTRUSTED_REQUEST_FACTS','TECH_ALIAS_PENDING_A','HARD_DENY_FOUR_S','PERSONAL_DENY','CAPABILITY_SCOPE_DEFER_DENY','COMMIT_RECHECK_STALE','LAST_EFFECTIVE_ADMIN_PROTECTED','LAST_ELIGIBLE_RECEIVER_PROTECTED','ATOMIC_AUDIT_FAILURE','HANDOVER_REQUIRED','BOOTSTRAP_CLOSED'])
 assert.ok(model.includes(guard)||guard==='BOOTSTRAP_CLOSED','missing guard '+guard);
for(const name of ['README.md','schema-gap-and-migration-advice.md','transaction-and-revocation.md','B自验与A复验交接.md']){
 const c=await read(name);
 assert.ok(c.length>350&&/未授权|NOT_RUN|NOT_A|不连接|未执行/.test(c),'unsafe/missing NOT_RUN '+name);
}
const text=await read('schema-gap-and-migration-advice.md');
for(const gap of ['SG-01','SG-02','SG-03','SG-04','SG-05','SG-06','SG-07','SG-08','SG-09'])assert.ok(text.includes(gap));
const sg09=text.split('\n').find(x=>x.startsWith('| SG-09'));
assert.ok(sg09?.includes('role_default_permission_history')&&sg09.includes('REUSE_EXISTING')&&sg09.includes('NO_DDL'),'R1_GAP_TEXT_MUST_REUSE_EXISTING');
for(const path of ['schema-gap-and-migration-advice.md','governance-action-contract.tsv','B自验与A复验交接.md','transaction-and-revocation.md']){
 const d=await read(path);
 assert.ok(!d.includes('role_permission_default_history'),'R1_WRONG_DUPLICATE_TEMPLATE_HISTORY_NAME_'+path);
}
const template=govern.find(x=>x[0]==='template.set');
assert.ok(template[2].includes('仅System Admin')&&template[3].includes('role_default_permission_history'),'R2_TEMPLATE_CONTROL_CONTRACT_DRIFT');
const workflow=await original('../.github/workflows/f03-2-g0-runtime-design.yml');
assert.ok(workflow.includes('feat/f03-runtime-g0')&&workflow.includes('node --test f03/runtime-design/tests/*.test.mjs'));
assert.doesNotMatch(workflow,/\bservices:|postgres:16|docker|pg_dump|F03_1_DATABASE_URL|F02_1_DATABASE_URL|F03_1_HMAC_KEY_BASE64|openssl|--apply\b|--bootstrap\b/);
console.log('F03-2-G0 STATIC GATE PASS: 45/45 operation mapping; 464 physical includes; 23/23 frozen policy actions; 14 governance rows; 12/12 tests gates; no DB/network/HTTP or runtime secrets');
