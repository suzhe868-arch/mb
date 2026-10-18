import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {normalizeDictionaryDefinition,parseDictionaryTokens} from '../src/f05-matching-dictionary-parser.mjs';
import {createIsolatedDictionaryHandler} from '../src/f05-matching-dictionary-http.mjs';
import {createFoundationHandler} from '../src/app.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const globalRule={token:'audi_a6',mappedKey:'brandId',mappedValue:'59001',scopeKind:'global'};
const row=(id,scope,field,value,more={})=>({
 rule_id:String(id),token:'audi_a6',mapped_key:field,mapped_value:value,
 scope_kind:scope,version:'1',status:'enabled',...more
});
test('dictionary rejects values above physical 50-character limit before PostgreSQL',()=>{
 assert.throws(()=>normalizeDictionaryDefinition({token:'too_long_map',mappedKey:'exteriorColor',mappedValue:'red|'.repeat(17),scopeKind:'global'}));
});
test('PDM12 dictionary validates full scope binding and mapped field syntax',()=>{
 assert.equal(normalizeDictionaryDefinition(globalRule).scopeKind,'global');
 for(const rule of [
  {...globalRule,brandId:'59001'},
  {...globalRule,token:'audi a6'},
  {...globalRule,mappedValue:'foo'},
  {...globalRule,mappedKey:'VIN'},
  {...globalRule,scopeKind:'model_year',modelId:'59001',yearFrom:2026,yearTo:2027},
  {...globalRule,scopeKind:'series_year',seriesId:'59001',yearFrom:2027,yearTo:2026}
 ])assert.throws(()=>normalizeDictionaryDefinition(rule),undefined,JSON.stringify(rule));
});
test('PDM12 specificity order model+year > series+year > series > brand > global',()=>{
 const rules=[row(1,'global','brandId','59001'),
 row(2,'brand','maxMileageKm','80000',{brand_id:'59001'}),
 row(3,'series','maxMileageKm','50000',{series_id:'59001'}),
 row(4,'series_year','minModelYear','2025',{series_id:'59001',year_from:2025,year_to:2027}),
 row(5,'model_year','minModelYear','2026',{model_id:'59001',year_from:2026,year_to:2026})];
 const context={brandId:'59001',seriesId:'59001',modelId:'59001',modelYear:2026};
 assert.equal(parseDictionaryTokens('audi_a6',rules,context).ruleHits[0].ruleId,'5');
 assert.equal(parseDictionaryTokens('audi_a6',rules,{...context,modelId:'59003'}).ruleHits[0].ruleId,'4');
 assert.equal(parseDictionaryTokens('audi_a6',rules,{brandId:'59001',seriesId:'59001'}).ruleHits[0].ruleId,'3');
 assert.equal(parseDictionaryTokens('audi_a6',rules,{brandId:'59001'}).ruleHits[0].ruleId,'2');
 assert.equal(parseDictionaryTokens('audi_a6',rules,{}).ruleHits[0].ruleId,'1');
});
test('same-specificity conflicting rules are never resolved silently or by creation order',()=>{
 const rows=[row(11,'global','brandId','59001'),row(12,'global','brandId','59002')];
 assert.equal(parseDictionaryTokens('audi_a6',rows).reason,'RULE_PARSE_SCOPE_CONFLICT');
 assert.equal(parseDictionaryTokens('audi_a6',rows.slice(0,1)).ready,true);
 assert.equal(parseDictionaryTokens('audi_a6',rows.map(r=>({...r,status:'disabled'}))).reason,'RULE_PARSE_UNKNOWN_TOKEN');
 assert.equal(parseDictionaryTokens('audi_a6;audi_a6',rows).reason,'RULE_PARSE_DUPLICATE_OR_LIMIT');
});
test('dictionary HTTP fail closed outside disposable loopback and never allows forged actor headers',async()=>{
 const stub={mutate:async()=>({status:200,body:{code:'TEST_ONLY'}}),preview:async()=>({status:200,body:{code:'PREVIEW'}})};
 assert.throws(()=>createIsolatedDictionaryHandler(stub,{...env,APP_ENV:'production'}));
 const s=createServer(createFoundationHandler({dictionaryHandler:createIsolatedDictionaryHandler(stub,env)}));
 await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 const addr='http://127.0.0.1:'+s.address().port+'/api/v1/catalog/matching/rules';
 const post=async(path='',headers={},body={definition:globalRule})=>{
  const res=await fetch(addr+path,{method:'POST',headers:{authorization:'Bearer '+'A'.repeat(43),
   'x-idempotency-key':'I'.repeat(32),'content-type':'application/json',...headers},
    body:JSON.stringify(body)});return {status:res.status,body:await res.json()};
 };
 try{
  assert.equal((await post('',{'x-employee-id':'60200'})).status,403);
  assert.equal((await post('',{authorization:''})).status,401);
  assert.equal((await post('?forged=true')).status,400);
  assert.equal((await post('/test-parse',{}, {text:'audi_a6'})).status,200);
  assert.equal((await post('',{}, {definition:globalRule,ownerId:'1'})).status,400);
 }finally{await new Promise(ok=>s.close(ok))}
});
