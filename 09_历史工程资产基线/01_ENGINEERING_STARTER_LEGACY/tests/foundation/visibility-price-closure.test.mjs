import test from 'node:test';
import assert from 'node:assert/strict';

const visibility = () => import('../../apps/api/src/modules/vehicle/visibility.ts');
const matching = () => import('../../apps/api/src/modules/demand/unified-matching.ts');

test('1 hidden ordinary browsing is not publicly discoverable', async()=>{
  const {isVehiclePubliclyDiscoverable}=await visibility();
  assert.equal(isVehiclePubliclyDiscoverable({sourceStatus:'active',bizStatus:'normal',platformVisibility:'hidden'}),false);
});

test('2 hidden direct public search is excluded by the same discovery predicate', async()=>{
  const {isVehiclePubliclyDiscoverable}=await visibility();
  assert.equal(isVehiclePubliclyDiscoverable({sourceStatus:'active',bizStatus:'locked',platformVisibility:'hidden'}),false);
});

test('3 hidden vehicle participates in ordinary Demand matching', async()=>{
  const {isVehicleEligibleForDemandMatching}=await matching();
  assert.equal(isVehicleEligibleForDemandMatching({sourceStatus:'active',bizStatus:'normal',platformVisibility:'hidden',hasActiveLock:false,hasInProgressTransaction:false}),true);
});

test('4 hidden vehicle participates in Priority matching/arbitration', async()=>{
  const {isVehicleEligibleForDemandMatching,choosePriorityCandidate}=await matching();
  const eligible=isVehicleEligibleForDemandMatching({sourceStatus:'active',bizStatus:'normal',platformVisibility:'hidden',hasActiveLock:false,hasInProgressTransaction:false});
  const winner=choosePriorityCandidate({vehicleOpenForMatching:eligible,hasActiveLock:false,hasInProgressTransaction:false,hasActivePriority:false,candidates:[{customerId:7n,demandId:9n,demandCreatedAt:new Date('2026-09-01'),tier:'high',isPriorityCustomer:true,hasResponsibleSales:true,alreadyEndedForCustomerVehicleCycle:false}]});
  assert.equal(winner?.customerId,7n);
});

test('5 hidden + active Priority + no Recommendation remains invisible to target customer', async()=>{
  const {decideCustomerVisibility}=await visibility();
  assert.deepEqual(decideCustomerVisibility({sourceStatus:'active',bizStatus:'normal',platformVisibility:'hidden',hasCustomerGrant:false,customerId:7n,activePriorityCustomerId:7n,hasActiveRecommendationForPriorityCustomer:false}),{visible:false,reason:'PRIORITY_NOT_YET_RECOMMENDED'});
});

test('6 hidden + formal Recommendation grant makes target customer visible', async()=>{
  const {decideCustomerVisibility}=await visibility();
  assert.deepEqual(decideCustomerVisibility({sourceStatus:'active',bizStatus:'normal',platformVisibility:'hidden',hasCustomerGrant:true,customerId:7n,activePriorityCustomerId:null,hasActiveRecommendationForPriorityCustomer:false}),{visible:true,reason:'RECOMMENDATION_GRANT'});
});

test('7 hidden Recommendation does not expose vehicle to unrelated customer', async()=>{
  const {decideCustomerVisibility}=await visibility();
  assert.deepEqual(decideCustomerVisibility({sourceStatus:'active',bizStatus:'normal',platformVisibility:'hidden',hasCustomerGrant:false,customerId:8n,activePriorityCustomerId:null,hasActiveRecommendationForPriorityCustomer:false}),{visible:false,reason:'PLATFORM_HIDDEN'});
});

test('8 Recommendation end closes its visibility grant through service', async()=>{
  const {endRecommendationVisibilityGrant}=await import('../../apps/api/src/modules/recommendation/visibility-grant.ts');
  const calls=[]; const db={query:async(q)=>{calls.push(q); return {rows:[],rowCount:1};}};
  await endRecommendationVisibilityGrant(db,'42','recommendation_cancelled');
  assert.match(calls[0].text,/UPDATE vehicle_visibility_grants/);
  assert.match(calls[0].text,/ended_at IS NULL/);
  assert.deepEqual(calls[0].values,['42','recommendation_cancelled']);
});

test('9 Recommendation/grant end does not cut off an existing Lock/Transaction business access', async()=>{
  const {decideCustomerVisibility}=await visibility();
  assert.deepEqual(decideCustomerVisibility({sourceStatus:'active',bizStatus:'locked',platformVisibility:'hidden',hasCustomerGrant:false,hasBusinessAccess:true,customerId:7n,activePriorityCustomerId:null,hasActiveRecommendationForPriorityCustomer:false}),{visible:true,reason:'BUSINESS_ACCESS'});
});

test('10 unavailable source states are not ordinary/Priority matching candidates', async()=>{
  const {isVehicleEligibleForDemandMatching}=await matching();
  for(const sourceStatus of ['offline','unavailable','sold_external']) assert.equal(isVehicleEligibleForDemandMatching({sourceStatus,bizStatus:'normal',platformVisibility:'hidden',hasActiveLock:false,hasInProgressTransaction:false}),false);
});

test('price_label is list price; base wholesale falls back true wholesale -> list', async()=>{
  const {parseJytPriceLabel,resolveBaseWholesalePriceCents}=await import('../../apps/api/src/modules/vehicle/jyt-price-label.ts');
  assert.equal(parseJytPriceLabel('12.8万').amountCents,12_800_000);
  assert.equal(resolveBaseWholesalePriceCents(11_000_000,12_800_000),11_000_000);
  assert.equal(resolveBaseWholesalePriceCents(null,12_800_000),12_800_000);
  assert.equal(resolveBaseWholesalePriceCents(null,null),null);
});

test('hidden Recommendation auto-grant service only creates grant for active hidden Recommendation', async()=>{
  const {ensureRecommendationVisibilityGrant}=await import('../../apps/api/src/modules/recommendation/visibility-grant.ts');
  const calls=[]; const db={query:async(q)=>{calls.push(q); if(calls.length===1)return {rows:[{recommendation_id:5,customer_id:7,vehicle_id:9,listing_cycle_id:11,platform_visibility:'hidden'}],rowCount:1}; return {rows:[],rowCount:1};}};
  const result=await ensureRecommendationVisibilityGrant(db,'5');
  assert.deepEqual(result,{created:true,reason:'HIDDEN_RECOMMENDATION_GRANT'});
  assert.match(calls[1].text,/INSERT INTO vehicle_visibility_grants/);
  assert.match(calls[1].text,/ON CONFLICT \(source_recommendation_id\) DO NOTHING/);
});
