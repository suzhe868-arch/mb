import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {INTENTS} from '../state-model.mjs';
const root=new URL('../',import.meta.url);
const parse=async file=>(await readFile(new URL(file,root),'utf8')).trimEnd().split(/\r?\n/).map(s=>s.split('\t'));
test('credential transitions and authority responsibilities are explicit and without unreviewed grant seeds',async()=>{
 const [header,...r]=await parse('credential-state-machine.tsv');
 assert.deepEqual(header,['transition_id','principal_kind','before_credential_state','before_force_change','trigger','required_current_facts','decision','after_account_state','session_invalidation','audit_fields','runtime_stage']);
 assert.equal(r.length,14);
 const triggers=new Set(r.map(x=>x[4]));
 for(const a of INTENTS)assert.ok(triggers.has(a),'missing credential intent '+a);
 for(const action of ['EMPLOYEE_INACTIVE','EMPLOYEE_REHIRE','FOUR_S_PC_REVOKE','SYSTEM_ADMIN_INACTIVE','SESSION_EXPIRED_OR_REVOKED'])
  assert.ok(triggers.has(action));
 for(const row of r){assert.ok(row.every(v=>v.length>0));assert.match(row.at(-1),/NOT_RUN/)}
 const [hh,...cc]=await parse('authority-test-coverage.tsv');
 assert.deepEqual(hh,['id','authority','principal','scenario','guard','fake_test','runtime_not_run','owner','state']);
 assert.equal(cc.length,15);
 const ids=new Set(cc.map(x=>x[0]));
 assert.equal(ids.size,15);
 for(const c of cc){assert.match(c[1],/^PDM-/);assert.ok(c[6].length>0);assert.ok(!c.includes('ACCEPTED'))}
 console.log('F03-1-G0 AUTHORITY/STATE COVERAGE PASS: '+r.length+' transitions; '+cc.length+' authority items; implementation NOT_RUN');
});
