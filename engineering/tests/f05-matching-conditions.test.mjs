import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExplicitSalesDescription,evaluateExplicitMatch} from '../src/f05-matching-evaluator.mjs';
import {normalizeDictionaryDefinition} from '../src/f05-matching-dictionary-parser.mjs';
const raw='exteriorColor=red|blue;powerType=gasoline|hybrid;displacementMinCc=1400;displacementMaxCc=2500;excludeCondition=flood|major_accident;interiorColor=beige';
const facts={exteriorColor:'red',powerType:'gasoline',displacementCc:2000,conditionFlags:[],interiorColor:'beige',customerDisplayCents:null};
test('PDM12 multi-valued exterior and power use OR; independent hard dimensions use AND',()=>{
 const p=parseExplicitSalesDescription(raw);
 assert.equal(p.ready,true,JSON.stringify(p));assert.deepEqual(p.criteria.exteriorColor,['red','blue']);
 assert.deepEqual(p.criteria.powerType,['gasoline','hybrid']);
 assert.equal(evaluateExplicitMatch(p,facts).tier,'high');
 assert.equal(evaluateExplicitMatch(p,{...facts,exteriorColor:'blue',powerType:'hybrid'}).tier,'high');
 assert.equal(evaluateExplicitMatch(p,{...facts,exteriorColor:'white'}).tier,'no_match');
 assert.equal(evaluateExplicitMatch(p,{...facts,powerType:'electric'}).tier,'no_match');
});
test('PDM12 unknown hard vehicle fact is confirmation_needed, not invented high/acceptable',()=>{
 const p=parseExplicitSalesDescription(raw);
 for(const missing of ['exteriorColor','powerType','displacementCc','conditionFlags']){
  assert.equal(evaluateExplicitMatch(p,{...facts,[missing]:null}).tier,'confirmation_needed',missing);
 }
 assert.equal(evaluateExplicitMatch(p,{...facts,conditionFlags:['flood']}).tier,'no_match');
 assert.equal(evaluateExplicitMatch(p,{...facts,displacementCc:2800}).tier,'no_match');
});
test('known no-exclusion evidence differs from absent exclusion evidence; interior is preferred',()=>{
 const p=parseExplicitSalesDescription(raw);
 assert.equal(evaluateExplicitMatch(p,{...facts,conditionFlags:[]}).tier,'high');
 assert.equal(evaluateExplicitMatch(p,{...facts,conditionFlags:null}).tier,'confirmation_needed');
 assert.equal(evaluateExplicitMatch(p,{...facts,interiorColor:'black'}).tier,'acceptable');
 assert.equal(evaluateExplicitMatch(p,{...facts,customerDisplayCents:null}).tier,'high');
});
test('PDM12 invalid range, repeated OR values, unknown enum or arbitrary textual car facts fail closed',()=>{
 for(const s of [
  'exteriorColor=red|red','powerType=gas','excludeCondition=none',
  'displacementMinCc=2600;displacementMaxCc=2000','displacementMinCc=50',
  'displacementCc=1200|1200','powerType=hybrid;powerType=electric','exteriorColor=',
  'cityId=50001','interiorColor=beige'
 ])assert.equal(parseExplicitSalesDescription(s).ready,false,s);
});
test('dictionary can separately govern preferred term, but a preferred-only Demand remains not ready',()=>{
 const mapped=normalizeDictionaryDefinition({token:'soft_beige',mappedKey:'interiorColor',mappedValue:'beige',scopeKind:'global'});
 assert.equal(mapped.mappedKey,'interiorColor');
 const alias=normalizeDictionaryDefinition({token:'exterior_blue',mappedKey:'exteriorColor',mappedValue:'blue|red',scopeKind:'global'});
 assert.equal(alias.mappedKey,'exteriorColor');
 assert.equal(parseExplicitSalesDescription('interiorColor=beige',{allowPreferredOnly:true}).ready,true);
 assert.equal(parseExplicitSalesDescription('interiorColor=beige').ready,false);
});
