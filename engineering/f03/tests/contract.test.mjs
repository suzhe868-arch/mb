import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ACTIONS,authorize} from '../policy.mjs';
const contract=await readFile(new URL('../permission-contract.tsv',import.meta.url),'utf8');
const [head,...entries]=contract.trimEnd().split(/\r?\n/).map(row=>row.split('\t'));
const fields=['operation','source_final','actor','capability_or_governance_fact','capability_origin','deny_and_precedence','data_scope','object_state','safe_field_projection','responsibility','implementation_status'];
test('complete contract has required source/actor/capability/scope/state/field/stage and explicit implementation status',()=>{
 assert.deepEqual(head,fields);
 assert.ok(entries.length>=40);
 const seen=new Set();
 for(const row of entries){
  assert.equal(row.length,fields.length,'invalid TSV cells for '+row[0]);
  assert.ok(row.every(x=>x.length>0),'empty contract field in '+row[0]);
  assert.ok(!seen.has(row[0]),'duplicate operation '+row[0]);seen.add(row[0]);
  assert.match(row[1],/^PDM-\d\d/);
  assert.ok(['F03_G0_STATIC','DEFER_NOT_IMPLEMENTED'].includes(row[10]));
  if(row[10]==='F03_G0_STATIC')assert.ok(ACTIONS[row[0]],'static row not implemented '+row[0]);
 }
 for(const action of Object.keys(ACTIONS))assert.ok(seen.has(action),'registered action lacks source contract '+action);
 console.log('F03-G0 TRACEABILITY PASS: '+entries.length+' frozen-obligation mappings; '+Object.keys(ACTIONS).length+' static actions');
});
test('each registered action is reachable with valid isolated synthetic current facts',()=>{
 for(const [action,rule] of Object.entries(ACTIONS)){
  const fourS=rule.onlyFourS===true;
  const system=rule.actor==='system_admin';
  const actor=system?{kind:'system_admin',id:91,status:'active'}:{kind:'employee',id:11,status:'active',role:fourS?'four_s':'sales',storeId:4};
  const resource={kind:rule.resource,id:45,state:rule.statuses[0],accountStatus:'active',sourceType:rule.source||(fourS?'four_s':'mingbang'),fourSEmployeeId:fourS?actor.id:undefined,storeId:4};
  if(action.startsWith('vehicle.publisher_phone.'))resource.upstreamPublisherId=12;
  const caps=system?[rule.systemCap]:rule.cap;
  const ctx={actor,resource,facts:{roleDefaults:[...caps],personalDecisions:{},hardDenies:[],systemCapabilities:system?[rule.systemCap]:[],scopeGrants:caps.map(capability=>({
   actorId:actor.id,resourceKind:resource.kind,resourceId:resource.id,capability,relation:fourS?'four_s_vehicle':'global',active:true
  }))}};
  const actual=authorize(action,ctx);
  assert.equal(actual.allowed,true,action+': '+JSON.stringify(actual));
 }
 console.log('F03-G0 ALL ACTION POSITIVE BRANCHES PASS: '+Object.keys(ACTIONS).length);
});
test('unknown capabilities or unsafe historical recovery actions never acquire a registered operation',()=>{
 for(const action of ['vehicle.price.adjust','vehicle.convert_mingbang_permission','customer.merge','collector.phone.connection.save','customer.owner.system_admin_fallback','refund.close.extra_permission']){
  assert.equal(Object.prototype.hasOwnProperty.call(ACTIONS,action),false,action);
 }
});
