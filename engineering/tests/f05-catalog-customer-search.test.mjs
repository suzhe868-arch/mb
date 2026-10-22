import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createIsolatedCatalogSearchService,normalizeCatalogSearchExpression} from '../src/f05-catalog-search.mjs';
import {formatCustomerPriceCents} from '../src/f05-catalog-customer-read-service.mjs';
import {encodeCursor,decodeCursor} from '../src/catalog-service.mjs';
import {parseDictionaryTokens} from '../src/f05-matching-dictionary-parser.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const row=(rule_id,token,mapped_key,mapped_value,scope_kind='global',extra={})=>({rule_id:String(rule_id),token,mapped_key,mapped_value,scope_kind,brand_id:null,series_id:null,model_id:null,year_from:null,year_to:null,version:'1',status:'enabled',...extra});
const rules=[
 row(1,'26款','minModelYear','2026'),row(2,'奥迪A6','brandId','60300'),
 row(3,'冲突','brandId','60300'),row(4,'冲突','brandId','60301'),
 row(5,'停用词','brandId','60300','global',{status:'disabled'}),
 row(6,'品牌年款','minModelYear','2026','brand',{brand_id:'60300'})
];
const pool={query:async(_sql,[tokens])=>({rows:rules.filter(r=>tokens.includes(r.token))})};
test('确定性搜索只做有界的字词分隔，不做模糊猜测',()=>{
 assert.deepEqual(normalizeCatalogSearchExpression(' 26款  奥迪A6 '),{ready:true,normalizedExpression:'26款;奥迪A6',tokens:['26款','奥迪A6']});
 assert.equal(normalizeCatalogSearchExpression('26款;奥迪A6').ready,true);
 for(const bad of ['', 'x', '奥迪/A6', '26款;;奥迪A6', '26款;26款', '未知词 '.repeat(30)])assert.equal(normalizeCatalogSearchExpression(bad).ready,false,bad);
});
test('Rule Dictionary 与 deterministic parser 返回结构化筛选及规则版本指纹',async()=>{
 const service=createIsolatedCatalogSearchService({pool,env}),a=await service.parse({expression:'26款 奥迪A6'});
 assert.equal(a.ready,true);assert.equal(String(a.criteria.brandId),'60300');assert.equal(Number(a.criteria.minModelYear),2026);assert.equal(a.ruleHits.length,2);
 const old=a.fingerprint;rules[0].version='2';
 const b=await service.parse({expression:'26款 奥迪A6'});assert.equal(b.ready,true);assert.notEqual(b.fingerprint,old);
});
test('目录搜索允许仅偏好型条件；默认 Matching 解析契约保持不变',async()=>{
 const preferred=[row(7,'黑内饰','interiorColor','black')];
 assert.equal(parseDictionaryTokens('黑内饰',preferred).reason,'RULE_PARSE_NOT_EXECUTABLE');
 const service=createIsolatedCatalogSearchService({pool:{query:async()=>({rows:preferred})},env});
 const parsed=await service.parse({expression:'黑内饰'});
 assert.equal(parsed.ready,true,JSON.stringify(parsed));
 assert.deepEqual(parsed.criteria,{interiorColor:'black'});
 assert.equal(parsed.productionReady,false);
});
test('未知、禁用及同作用域冲突均拒绝，不退化为 contains',async()=>{
 const service=createIsolatedCatalogSearchService({pool,env});
 assert.equal((await service.parse({expression:'完全未知'})).reason,'RULE_PARSE_UNKNOWN_TOKEN');
 assert.equal((await service.parse({expression:'停用词'})).reason,'RULE_PARSE_UNKNOWN_TOKEN');
 assert.equal((await service.parse({expression:'冲突'})).reason,'RULE_PARSE_SCOPE_CONFLICT');
});
test('作用域规则没有明确品牌上下文时 fail closed',async()=>{
 const service=createIsolatedCatalogSearchService({pool,env});
 assert.equal((await service.parse({expression:'品牌年款'})).reason,'RULE_PARSE_UNKNOWN_TOKEN');
 const scoped=await service.parse({expression:'品牌年款',context:{brandId:'60300'}});
 assert.equal(scoped.ready,true);assert.equal(Number(scoped.criteria.minModelYear),2026);
});
test('Customer display price uses exact cents and formal 万 formatting',()=>{
 assert.equal(formatCustomerPriceCents('12800000'),'12.8万');assert.equal(formatCustomerPriceCents('18000000'),'18万');
 assert.equal(formatCustomerPriceCents('12580000'),'12.58万');assert.equal(formatCustomerPriceCents('0'),null);
 assert.equal(formatCustomerPriceCents('100000000000000'),null);
});
test('search cursor v6 binds normalized expression, rule versions and price range fingerprint',()=>{
 const key=randomBytes(32),hash='a'.repeat(64);
 const cur=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'33',source:'wholesale',sort:'newest',searchHash:hash},key);
 assert.equal(decodeCursor(cur,key,'wholesale','newest',null,null,null,null,hash).id,'33');
 assert.throws(()=>decodeCursor(cur,key,'wholesale','newest',null,null,null,null,'b'.repeat(64)));
 const old=encodeCursor({at:'2026-10-15T09:00:00.123456Z',id:'33',source:'wholesale',sort:'newest'},key);
 assert.equal(decodeCursor(old,key,'wholesale','newest').v,4);
});
