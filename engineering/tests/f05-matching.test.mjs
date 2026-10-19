import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFoundationHandler} from '../src/app.mjs';
import {parseExplicitSalesDescription,evaluateExplicitMatch} from '../src/f05-matching-evaluator.mjs';
import {createIsolatedMatchingHandler} from '../src/f05-matching-http.mjs';
import {createIsolatedMatchingService} from '../src/f05-matching-service.mjs';
const env={APP_ENV:'test',NODE_ENV:'test',API_HOST:'127.0.0.1',F05_CATALOG_TEST_CONSENT:'I_AUTHORIZE_DISPOSABLE_F05_CATALOG_PG16_ONLY'};
const text='brandId=59001;minModelYear=2024;maxMileageKm=50000;budgetCents=12000000;interiorColor=black';
const url='/api/v1/catalog/demands/59600/vehicles/59601/recompute-match';
const mock={recompute:async()=>({status:200,body:{code:'MATCH_RESULT_RECOMPUTED',matchTier:'high',matchingReady:true,noRecommendation:true,noPriority:true,productionReady:false}})};
async function request({path=url,method='POST',headers={},body,service=mock}={}){
 const s=createServer(createFoundationHandler({matchingHandler:createIsolatedMatchingHandler(service,env)}));
 await new Promise(ok=>s.listen(0,'127.0.0.1',ok));
 try{
  const r=await fetch('http://127.0.0.1:'+s.address().port+path,{method,headers:{authorization:'Bearer '+'A'.repeat(43),'x-idempotency-key':'I'.repeat(32),...headers},body});
  return {status:r.status,body:await r.json()};
 }finally{await new Promise(ok=>s.close(ok))}
}
test('PDM12 explicit deterministic conditions parse without NLP, with immutable normalized fields',()=>{
 const p=parseExplicitSalesDescription(text);
 assert.equal(p.ready,true);assert.equal(p.criteria.brandId,'59001');
 assert.equal(p.criteria.minModelYear,2024);assert.equal(p.criteria.maxMileageKm,50000);
 assert.equal(p.criteria.budgetCents,'12000000');assert.equal(p.ruleHits.length,5);
});
test('missing hard fields, unknown dictionary tokens, duplicates, whitespace and conflicting values never become matching-ready',()=>{
 for(const s of ['', 'interiorColor=black','brandId=59001;brandId=59002','series=5',
  'brandId=59001;',' brandId=59001','budgetCents=none','maxMileageKm=abc',
  'minModelYear=2201','brandId=0','maxMileageKm=99999999']){
  assert.equal(parseExplicitSalesDescription(s).ready,false,s);
 }
});
test('hard condition no match dominates another unknown; unknown is never acceptable',()=>{
 const p=parseExplicitSalesDescription(text);
 const no=evaluateExplicitMatch(p,{brandId:'59002',minModelYear:null,maxMileageKm:null,customerDisplayCents:null,interiorColor:'white'});
 assert.equal(no.tier,'no_match');
 const unknown=evaluateExplicitMatch(p,{brandId:'59001',minModelYear:null,maxMileageKm:10000,customerDisplayCents:'11000000',interiorColor:'black'});
 assert.equal(unknown.tier,'confirmation_needed');
});
test('PDM12 four tiers and exact inclusive 5 percent tolerance boundary',()=>{
 const p=parseExplicitSalesDescription(text);
 const base={brandId:'59001',minModelYear:2026,maxMileageKm:40000,customerDisplayCents:'12000000',interiorColor:'black'};
 assert.equal(evaluateExplicitMatch(p,base).tier,'high');
 assert.equal(evaluateExplicitMatch(p,{...base,customerDisplayCents:'12600000'}).tier,'acceptable');
 assert.equal(evaluateExplicitMatch(p,{...base,customerDisplayCents:'12600001'}).tier,'no_match');
 assert.equal(evaluateExplicitMatch(p,{...base,interiorColor:'white'}).tier,'acceptable');
 assert.equal(evaluateExplicitMatch(p,{...base,customerDisplayCents:null}).tier,'confirmation_needed');
});
test('missing optional condition is unlimited and must never be inferred as unknown',()=>{
 const p=parseExplicitSalesDescription('maxMileageKm=50000');
 const r=evaluateExplicitMatch(p,{maxMileageKm:15000,brandId:null,minModelYear:null,customerDisplayCents:null});
 assert.equal(r.tier,'high');
 assert.equal(r.explanation.components.length,1);
});
test('PDM12 matching test-only endpoint never runs in production or on public network',()=>{
 for(const v of [{...env,APP_ENV:'production'},{...env,NODE_ENV:'production'},{...env,API_HOST:'0.0.0.0'},{...env,F05_CATALOG_TEST_CONSENT:'NO'}]){
  assert.throws(()=>createIsolatedMatchingService({pool:{connect:()=>{}},env:v}));
  assert.throws(()=>createIsolatedMatchingHandler(mock,v));
 }
});
test('Matching recompute HTTP denies forged tier, price, scope, Demand and Priority claims',async()=>{
 assert.equal((await request({headers:{authorization:''}})).status,401);
 assert.equal((await request({headers:{'x-idempotency-key':''}})).status,400);
 for(const h of [{'x-customer-id':'59600'},{'x-role':'manager'},{'x-match-tier':'high'},
  {'x-criteria':'brandId=59001'},{'x-price':'9999'},{'x-priority':'true'},
  {'x-recommendation':'true'},{'x-employee-id':'59600'},{'x-forwarded-for':'127.0.0.1'},{cookie:'admin=yes'}]){
  assert.equal((await request({headers:h})).status,403,JSON.stringify(h));
 }
});
test('Matching route denies GET, query, client payload, invalid IDs and generic DB errors',async()=>{
 assert.equal((await request({method:'GET'})).status,405);
 assert.equal((await request({path:url+'?tier=high'})).status,400);
 assert.equal((await request({path:'/api/v1/catalog/demands/0/vehicles/59601/recompute-match'})).status,400);
 assert.equal((await request({body:'{"tier":"high"}'})).status,403);
 const denied=await request({service:{recompute:async()=>{throw Error('SECRET_CUSTOMER_PHONE')}}});
 assert.equal(denied.status,503);
 assert.equal(JSON.stringify(denied.body).includes('SECRET_CUSTOMER_PHONE'),false);
});
