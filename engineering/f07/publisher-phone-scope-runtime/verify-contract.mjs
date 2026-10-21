import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const base = new URL('../../f03/permission-contract.tsv',import.meta.url);
const scope = new URL('../../f03/runtime-design/capability-scope-contract.tsv',import.meta.url);
const ledger = new URL('../nonprod-runtime-integration/SOURCE_GAP与外部授权依赖台账.tsv',import.meta.url);
const allowed = new Set([
  'vehicle.publisher_phone.read',
  'vehicle.publisher_phone.latest',
  'vehicle.publisher_phone.dial'
]);
function parse(text) {
  const lines=text.trimEnd().split('\n');
  const header=lines.shift().split('\t');
  return lines.map(line=>Object.fromEntries(line.split('\t').map((value,index)=>[header[index],value])));
}
const permissionText=await readFile(base,'utf8');
const permissionRows=parse(permissionText).filter(row=>allowed.has(row.operation));
assert.equal(permissionRows.length,3,'only the three A-approved phone operations are mapped');
assert.equal(parse(permissionText).some(row=>row.operation==='can_call_wholesale_phone'),false);
for (const row of permissionRows) {
  assert.equal(row.capability_origin,'A_APPROVED_NONPROD_ONLY');
  assert.equal(row.capability_or_governance_fact,'publisher.phone.sensitive');
  assert.equal(row.implementation_status,'F03_G0_STATIC');
}
const scopeRows=parse(await readFile(scope,'utf8')).filter(row=>allowed.has(row.operation));
assert.equal(scopeRows.length,3,'only the three A-approved phone operations are scoped');
for (const row of scopeRows) {
  assert.equal(row.alias_authority,'A_APPROVED_NONPROD_ONLY');
  assert.equal(row.g0_permission_decision,'SYNTHETIC_CONTRACT_ONLY');
  assert.match(row.per_capability_scope_proof,/LOCKED_ONLY.*ALL_ACTIVE_JYT/);
  assert.match(row.reason,/SOURCE_GAP/);
}
const ledgerText=await readFile(ledger,'utf8');
assert.match(ledgerText,/publisher\.phone\.sensitive/);
assert.match(ledgerText,/SOURCE_GAP/);
assert.match(ledgerText,/CI_SYNTHETIC_ONLY/);
assert.doesNotMatch(ledgerText,/can_call_wholesale_phone/);
console.log('F08_3_CONTRACT_MAPPING_SCOPE_GAP_PASS');
