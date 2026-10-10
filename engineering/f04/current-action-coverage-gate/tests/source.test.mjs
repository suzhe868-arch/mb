import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connect,verify as verifyM94} from '../../../f03/runtime-transaction-responsible-handover/migration.mjs';
import {verifyCoverage,validateCoverage,validateIncremental,validateDtoValue,loadIncremental} from '../coverage-verify.mjs';
const db=await connect();test.after(()=>db.end());
const f=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const table=f('Current全量动作覆盖与页面消费台账.tsv'),seal=f('Current覆盖计数与原文封印.json'),inc=f('incremental-contracts.json');
const mutate=(key,field,value)=>{let l=table.trimEnd().split('\n'),h=l[0].split('\t');let col=h.indexOf('stable_key');let i=l.findIndex((x,j)=>j>0&&x.split('\t')[col].startsWith(key+':'));assert.ok(i>0,key);let z=l[i].split('\t'),p=h.indexOf(field);assert.ok(p>=0);z[p]=value;l[i]=z.join('\t');return l.join('\n')+'\n'};
const proof=(intent,change)=>{let x=JSON.parse(inc),c=x.actions.find(a=>a.intent===intent);assert.ok(c);change(c);return JSON.stringify(x)};
test('F04-4-A01 real sealed M94 PG16: 94 tables, not mock',async()=>{assert.equal((await verifyM94(db)).verified,true);assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='public'")).rows[0].n,94)});
test('F04-4-A02 full line-level Current coverage including all source types',()=>{let x=verifyCoverage();assert.equal(x.total,437);assert.deepEqual(x.sourceCounts,{NAV:228,ACTION:58,GUARD:16,PAGE:132,RETIRED:3});assert.equal(Object.values(x.counts).reduce((a,b)=>a+b,0),437);assert.equal(x.newCandidates,8)});
test('F04-4-A03 legitimate navigation/page cannot be relabeled a business mutation',()=>{assert.throws(()=>validateCoverage(mutate('NAV:269','classification','CURRENT_ACTION_COVERAGE'),seal,inc),/NAV_READ_ONLY/);assert.throws(()=>validateCoverage(mutate('PAGE:42','classification','CURRENT_ACTION_COVERAGE'),seal,inc),/NAV_READ_ONLY/);assert.throws(()=>validateCoverage(mutate('RETIRED:2','classification','CONTRACT_CANDIDATE_TYPED'),seal,inc),/NAV_READ_ONLY/)});
test('F04-4-A04 real but wrong PDM/Nav action citation and missing records fail',()=>{assert.throws(()=>validateCoverage(mutate('NAV:248','source_line','251'),seal,inc),/TRUE_QUOTE/);assert.throws(()=>validateCoverage(mutate('ACTION:84','source_line','85'),seal,inc),/TRUE_QUOTE/);let bad=table.split('\n').filter((x,i)=>i===0||!x.split('\t')[4]?.startsWith('NAV:248:')).join('\n');assert.throws(()=>validateCoverage(bad,seal,inc),/INCOMPLETE_COVERAGE/)});
test('F04-4-A05 fake legacy approvals, counts and category partitions denied',()=>{let m=JSON.parse(seal);m.legacy_originals.source_gap=0;assert.throws(()=>validateCoverage(table,JSON.stringify(m),inc),/LEGACY_SOURCE/);m=JSON.parse(seal);m.counts.PAGE_NAV_ONLY=999;assert.throws(()=>validateCoverage(table,JSON.stringify(m),inc),/CLASSIFICATION_COUNT/)});
test('F04-4-A06 8 Current same actor/action/resource/state/domain sealed',()=>{assert.equal(validateIncremental().newCandidates,8);assert.throws(()=>validateIncremental(proof('LOCKREQUEST_APPROVE_FINAL',x=>x.nav_line=251)),/ACTOR_OPERATION/);assert.throws(()=>validateIncremental(proof('LOCKREQUEST_REJECT_FINAL',x=>x.actor='CUSTOMER')),/ACTOR_OPERATION/);assert.throws(()=>validateIncremental(proof('VEHICLE_DELIST',x=>x.domain='PDM-18')),/ACTOR_OPERATION/)});
test('F04-4-A07 SystemAdmin control plane does not acquire Employee Vehicle business powers',()=>{assert.throws(()=>validateIncremental(proof('SYSTEM_MODEL_MAPPING_BIND',x=>x.actor='EMPLOYEE_MANAGER')),/ACTOR_OPERATION/);assert.throws(()=>validateIncremental(proof('VEHICLE_SOURCE_TYPE_EDIT',x=>x.actor='SYSTEM_ADMIN')),/ACTOR_OPERATION/)});
test('F04-4-A08 exact two-field synthetic typed vehicle source change, target mandatory',()=>{
 const all=loadIncremental(),typed=all.actions.filter(a=>a.contract_class==='EXECUTABLE_TYPED_CI_SCHEMA');
 assert.equal(typed.length,1);assert.equal(validateIncremental().verifiedExecutableTypedContracts,1);
 assert.equal(validateIncremental().intentOnlySourceGapContracts,7);
 const v=typed[0];assert.equal(v.intent,'VEHICLE_SOURCE_TYPE_EDIT');
 for(const choice of ['名邦','4S'])assert.equal(validateDtoValue(v,{vehicleId:12,targetSourceType:choice}),true);
 for(const bad of [{vehicleId:12},{targetSourceType:'名邦'},
  {vehicleId:12,targetSourceType:'WHOLESALE'},{vehicleId:12,targetSourceType:'4s'},
  {vehicleId:'12',targetSourceType:'4S'},{vehicleId:0,targetSourceType:'名邦'},
  {vehicleId:12,targetSourceType:'名邦',vin:'SECRET'},
  {vehicleId:12,targetSourceType:'名邦',phone:'PRIVATE'},
  {vehicleId:12,targetSourceType:'名邦',internalWholesalePrice:299},
  {vehicleId:12,targetSourceType:'名邦',customerLevel:'VIP'},
  {vehicleId:12,targetSourceType:'名邦',merchantId:1},
  {vehicleId:12,targetSourceType:'名邦',role:'SYSTEM_ADMIN'}])
  assert.equal(validateDtoValue(v,bad),false);
 assert.throws(()=>validateIncremental(proof('VEHICLE_SOURCE_TYPE_EDIT',x=>{
  x.dto_body.required=['vehicleId'];delete x.dto_body.properties.targetSourceType;
 })),/BUSINESS_DTO/);
 assert.throws(()=>validateIncremental(proof('VEHICLE_SOURCE_TYPE_EDIT',x=>{
  x.field_authority[1].quote=x.field_authority[0].quote;
 })),/FALSE_FIELD_AUTHORITY/);
 assert.throws(()=>validateIncremental(proof('VEHICLE_SOURCE_TYPE_EDIT',x=>{
  x.dto_body.properties.targetSourceType.enum.push('批发');
 })),/BUSINESS_DTO/);
});
test('F04-4-A12 CREATE has no old announcementId; missing source is not fake executable DTO',()=>{
 const candidates=loadIncremental().actions;const announce=candidates.find(a=>a.intent==='ANNOUNCEMENT_CREATE');
 assert.equal(announce.contract_class,'INTENT_ONLY_CI_CONTRACT');
 assert.equal(announce.request_schema_state,'REQUEST_SCHEMA_SOURCE_GAP');
 assert.equal(announce.dto_body,null);assert.equal(announce.field,null);
 assert.equal(validateDtoValue(announce,{announcementId:11}),false);
 assert.throws(()=>validateIncremental(proof('ANNOUNCEMENT_CREATE',x=>{
  x.field='announcementId';
  x.dto_body={type:'object',properties:{announcementId:{type:'integer'}},required:['announcementId'],additionalProperties:false};
 })),/SOURCE_GAP_PRETENDED_EXECUTABLE|ANNOUNCEMENT_CREATE/);
 assert.throws(()=>validateIncremental(proof('ANNOUNCEMENT_CREATE',x=>{
  x.operation='EDIT_EXISTING_ANNOUNCEMENT';
 })),/OPERATION_INTENT/);
});
test('F04-4-A13 Markup needs intervals/value; model mapping needs canonical model: otherwise remain intent-only',()=>{
 for(const id of ['MARKUP_RULE_SAVE','SYSTEM_MODEL_MAPPING_BIND']){
  const a=loadIncremental().actions.find(x=>x.intent===id);
  assert.equal(a.request_schema_state,'REQUEST_SCHEMA_SOURCE_GAP');
  assert.equal(a.contract_class,'INTENT_ONLY_CI_CONTRACT');
  assert.equal(a.dto_body,null);
  assert.equal(validateDtoValue(a,{[a.intent==='MARKUP_RULE_SAVE'?'markupRuleId':'modelMappingId']:1}),false);
  assert.throws(()=>validateIncremental(proof(id,x=>{
   x.contract_class='EXECUTABLE_TYPED_CI_SCHEMA';
   x.request_schema_state='FIELD_PROVEN_SYNTHETIC_CI_ONLY';
   x.dto_body={type:'object',properties:{[id==='MARKUP_RULE_SAVE'?'markupRuleId':'modelMappingId']:{type:'integer'}},required:[id==='MARKUP_RULE_SAVE'?'markupRuleId':'modelMappingId'],additionalProperties:false};
  })),/OPERATION_INTENT|SOURCE_GAP_PRETENDED_EXECUTABLE/);
 }
});
test('F04-4-A14 spoofed actor, Final/Nav and dependency no longer pass synthetic contract',()=>{
 assert.throws(()=>validateIncremental(proof('VEHICLE_SOURCE_TYPE_EDIT',x=>x.operation='EDIT_VEHICLE_DETAILS')),/OPERATION_INTENT/);
 assert.throws(()=>validateIncremental(proof('LOCKREQUEST_APPROVE_FINAL',x=>x.operation_source.line=71)),/OPERATION_INTENT/);
 assert.throws(()=>validateIncremental(proof('VEHICLE_DELIST',x=>x.intent_semantics.object_scope='GLOBAL_ALL')),/OPERATION_INTENT/);
 assert.throws(()=>validateIncremental(proof('ANNOUNCEMENT_CREATE',x=>x.response_codes[200]='CREATED')),/EXTRA_PRIVATE/);
});
test('F04-4-A11 forged action actor, old approval and Current object resource on real NAV line fail',()=>{
 assert.throws(()=>validateCoverage(mutate('NAV:269','actor','SYSTEM_ADMIN'),seal,inc),/TRUE_QUOTE|SIGNED_NAV_ACTOR|NAV_SEMANTIC/);
 assert.throws(()=>validateCoverage(mutate('NAV:248','target_resource','4S_MERCHANT_TREE'),seal,inc),/TRUE_QUOTE|ADDITIONAL_NAV|NAV_SEMANTIC/);
 assert.throws(()=>validateCoverage(mutate('NAV:269','legacy_bridge','KEEP'),seal,inc),/TRUE_QUOTE|NAV_SEMANTIC/);
});
test('F04-4-A10 source manifest declared 140 but 132 rows actually enumerated, delta flagged SOURCE_GAP',()=>{const m=JSON.parse(seal);assert.equal(m.page_manifest_declared_carriers,140);assert.equal(m.page_manifest_enumerated_current_rows,132);assert.equal(m.page_manifest_unresolved_carrier_delta,8);assert.match(m.page_manifest_discrepancy_state,/SOURCE_GAP/)});
test('F04-4-A09 no 200 response, old Collector routes and unauthorized scope',()=>{assert.throws(()=>validateIncremental(proof('VEHICLE_DELIST',x=>x.response_codes[200]='OK')),/EXTRA_PRIVATE/);assert.throws(()=>validateIncremental(proof('IMAGE_FAILED_RETRY',x=>x.path='/admin/integrations/collector/connection')),/ACTOR_OPERATION|LEGACY_PATH/);assert.throws(()=>validateIncremental(proof('MARKUP_RULE_SAVE',x=>x.scope='GLOBAL_ANY_STORE')),/ACTOR_OPERATION/)});
