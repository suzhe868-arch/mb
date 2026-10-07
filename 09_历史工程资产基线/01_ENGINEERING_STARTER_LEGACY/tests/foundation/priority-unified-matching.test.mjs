import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = async (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('unified matching uses one tier model for ordinary and Priority customers', async () => {
  const { classifyUnifiedMatch } = await import('../../apps/api/src/modules/demand/unified-matching.ts');
  assert.deepEqual(classifyUnifiedMatch({hardConditions:['match','match'],customerDisplayPriceCents:20000000,budgetMaxCents:20000000}), {tier:'high',reason:'ALL_REQUESTED_CONDITIONS_MET'});
  assert.deepEqual(classifyUnifiedMatch({hardConditions:['match'],customerDisplayPriceCents:21000000,budgetMaxCents:20000000}), {tier:'acceptable',reason:'BUDGET_WITHIN_TOLERANCE'});
  assert.deepEqual(classifyUnifiedMatch({hardConditions:['match'],customerDisplayPriceCents:21000001,budgetMaxCents:20000000}), {tier:'no_match',reason:'BUDGET_OVER_TOLERANCE'});
  assert.deepEqual(classifyUnifiedMatch({hardConditions:['unknown'],customerDisplayPriceCents:19000000,budgetMaxCents:20000000}), {tier:'confirmation_needed',reason:'HARD_CONDITION_UNKNOWN'});
  assert.deepEqual(classifyUnifiedMatch({hardConditions:['mismatch'],customerDisplayPriceCents:19000000,budgetMaxCents:20000000}), {tier:'no_match',reason:'HARD_CONDITION_MISMATCH'});
  assert.deepEqual(classifyUnifiedMatch({hardConditions:['match'],customerDisplayPriceCents:null,budgetMaxCents:20000000}), {tier:'no_match',reason:'CUSTOMER_DISPLAY_PRICE_MISSING'});
});

test('Priority arbitration groups by customer and uses high > acceptable > earlier demand > demand id', async () => {
  const { choosePriorityCandidate } = await import('../../apps/api/src/modules/demand/unified-matching.ts');
  const winner=choosePriorityCandidate({vehicleOpenForMatching:true,hasActiveLock:false,hasInProgressTransaction:false,hasActivePriority:false,candidates:[
    {customerId:1n,demandId:12n,demandCreatedAt:new Date('2026-01-02'),tier:'high',isPriorityCustomer:true,hasResponsibleSales:true,alreadyEndedForCustomerVehicleCycle:false},
    {customerId:1n,demandId:11n,demandCreatedAt:new Date('2026-01-01'),tier:'high',isPriorityCustomer:true,hasResponsibleSales:true,alreadyEndedForCustomerVehicleCycle:false},
    {customerId:2n,demandId:20n,demandCreatedAt:new Date('2025-01-01'),tier:'acceptable',isPriorityCustomer:true,hasResponsibleSales:true,alreadyEndedForCustomerVehicleCycle:false},
  ]});
  assert.equal(winner?.customerId,1n);
  assert.equal(winner?.demandId,11n);
});

test('Priority arbitration excludes non-Priority, unowned, repeated-cycle and occupied vehicle cases', async () => {
  const { choosePriorityCandidate } = await import('../../apps/api/src/modules/demand/unified-matching.ts');
  const candidates=[
    {customerId:1n,demandId:1n,demandCreatedAt:new Date('2026-01-01'),tier:'high',isPriorityCustomer:false,hasResponsibleSales:true,alreadyEndedForCustomerVehicleCycle:false},
    {customerId:2n,demandId:2n,demandCreatedAt:new Date('2026-01-01'),tier:'high',isPriorityCustomer:true,hasResponsibleSales:false,alreadyEndedForCustomerVehicleCycle:false},
    {customerId:3n,demandId:3n,demandCreatedAt:new Date('2026-01-01'),tier:'high',isPriorityCustomer:true,hasResponsibleSales:true,alreadyEndedForCustomerVehicleCycle:true},
  ];
  assert.equal(choosePriorityCandidate({vehicleOpenForMatching:true,hasActiveLock:false,hasInProgressTransaction:false,hasActivePriority:false,candidates}),null);
  assert.equal(choosePriorityCandidate({vehicleOpenForMatching:true,hasActiveLock:true,hasInProgressTransaction:false,hasActivePriority:false,candidates:[{...candidates[2],alreadyEndedForCustomerVehicleCycle:false}]}),null);
});

test('Priority OpenAPI surface is minimal and has no manual create/override/extend route', async () => {
  const api=await read('packages/contracts/openapi.yaml');
  assert.match(api,/\/system-admin\/customers\/\{id\}\/priority:/);
  assert.match(api,/\/staff\/matching\/priorities\/\{id\}:release:/);
  assert.match(api,/\/staff\/recommendations\/\{id\}:cancel:/);
  assert.doesNotMatch(api,/priority\.override/);
  assert.doesNotMatch(api,/\/staff\/matching\/priorities:\s*\n\s*post:/);
});
