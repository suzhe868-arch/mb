import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTriBridge} from '../tri-bridge-verify.mjs';
const text=readFileSync(new URL('../Current旧新三向可追溯台账.tsv',import.meta.url),'utf8');
function modify(kind,id,field,value){
 const lines=text.trimEnd().split('\n'),h=lines[0].split('\t');
 const k=h.indexOf('relation_kind'),v=h.indexOf('source_record_id'),p=h.indexOf(field);
 const i=lines.findIndex((s,j)=>j>0&&s.split('\t')[k]===kind&&s.split('\t')[v]===id);
 assert.ok(i>0,kind+id);assert.ok(p>=0,field);
 const row=lines[i].split('\t');row[p]=value;lines[i]=row.join('\t');return lines.join('\n')+'\n';
}
test('F04-4 tri-way verified 215 historical + frozen32 + new8 + 3 retired; zero production',()=>{
 assert.deepEqual(verifyTriBridge(),{rows:258,old:215,oldMatched:23,oldGap:192,signed:32,additional:8,retired:3,productionRoutes:0,allOldUndecided:true});
});
test('F04-4 old 192 missing-current Action cannot become KEEP or bridge to unrelated same-file source',()=>{
 assert.throws(()=>verifyTriBridge(modify('LEGACY_HISTORICAL','LEGACY-001','old_decision','KEEP')),/FAKE_OLD_AUTHORITY/);
 assert.throws(()=>verifyTriBridge(modify('LEGACY_HISTORICAL','LEGACY-019','current_action_id','CURRENTACTION_WAITLIST_REGISTER_020')),/FAKE_OLD_AUTHORITY/);
});
test('F04-4 frozen signed 32 and additional 8 cannot grant production/live merchant/body permission',()=>{
 assert.throws(()=>verifyTriBridge(modify('F04_3_SIGNED_CI_PROPOSAL','CURRENTACTION_CRM_SCOPE_MINIMAL_PROOF','production_state','PRODUCTION')),/SIGNED_32_BASELINE_DRIFT/);
 assert.throws(()=>verifyTriBridge(modify('F04_4_ADDITIONAL_CI_PROPOSAL','F04_4_SYSTEM_MODEL_MAPPING_BIND','scope_state','ALL_4S_MERCHANTS')),/EXTRA_SCOPE_OR_PRODUCT_APPROVAL/);
});
test('F04-4 3 banned Collector connections never return as old/new REST',()=>{
 assert.throws(()=>verifyTriBridge(modify('RETIRED_FORBIDDEN','FORBIDDEN-1','contract_state','NOT_APPROVED')),/COLLECTOR_RESTORATION/);
});
