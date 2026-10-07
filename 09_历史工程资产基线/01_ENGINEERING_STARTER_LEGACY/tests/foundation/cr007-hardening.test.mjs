import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('CR-007 parses JYT price_label into the existing cents field', async () => {
  const { parseJytPriceLabel } = await import('../../apps/api/src/modules/vehicle/jyt-price-label.ts');
  assert.deepEqual(parseJytPriceLabel('5.5万'), { rawLabel: '5.5万', amountCents: 5_500_000 });
  assert.deepEqual(parseJytPriceLabel('5.50万'), { rawLabel: '5.50万', amountCents: 5_500_000 });
  assert.deepEqual(parseJytPriceLabel('55000元'), { rawLabel: '55000元', amountCents: 5_500_000 });
  assert.deepEqual(parseJytPriceLabel('价格咨询'), { rawLabel: '价格咨询', amountCents: null });
});

test('CR-007 rejects malformed JYT price labels without inventing zero', async () => {
  const { parseJytPriceLabel } = await import('../../apps/api/src/modules/vehicle/jyt-price-label.ts');
  assert.throws(() => parseJytPriceLabel('待定'), /PRICE_PARSE_FAILED/);
  assert.throws(() => parseJytPriceLabel('-1万'), /PRICE_PARSE_FAILED/);
});

test('CR-007 lock eligibility never depends on an internal wholesale price', async () => {
  const { decideLockEligibility } = await import('../../apps/api/src/modules/lock/lock-eligibility.ts');
  assert.deepEqual(decideLockEligibility({
    sourceStatus: 'active', bizStatus: 'normal', internalWholesalePriceCents: null,
    activeLockCustomerId: null, customerId: 10n,
    canCreateLock: true, inDataScope: true,
  }), { allowed: true });
});

test('CR-007 Priority is not an extra Lock competition gate', async () => {
  const { decideLockEligibility } = await import('../../apps/api/src/modules/lock/lock-eligibility.ts');
  assert.deepEqual(decideLockEligibility({
    sourceStatus: 'active', bizStatus: 'normal', internalWholesalePriceCents: null,
    activeLockCustomerId: null, customerId: 10n,
    canCreateLock: true, inDataScope: true,
  }), { allowed: true });
});

test('CR-007 hidden visibility is public deny but Recommendation grant can authorize the target customer', async () => {
  const { decideCustomerVisibility } = await import('../../apps/api/src/modules/vehicle/visibility.ts');
  assert.deepEqual(decideCustomerVisibility({
    sourceStatus: 'active', bizStatus: 'normal', platformVisibility: 'hidden',
    hasCustomerGrant: true, customerId: 10n,
    activePriorityCustomerId: null, hasActiveRecommendationForPriorityCustomer: false,
  }), { visible: true, reason: 'RECOMMENDATION_GRANT' });
  assert.deepEqual(decideCustomerVisibility({
    sourceStatus: 'active', bizStatus: 'normal', platformVisibility: 'visible',
    hasCustomerGrant: true, customerId: 10n,
    activePriorityCustomerId: 11n, hasActiveRecommendationForPriorityCustomer: false,
  }), { visible: false, reason: 'VEHICLE_PRIORITY_PROTECTED' });
  assert.deepEqual(decideCustomerVisibility({
    sourceStatus: 'active', bizStatus: 'normal', platformVisibility: 'hidden',
    hasCustomerGrant: false, customerId: 11n,
    activePriorityCustomerId: 11n, hasActiveRecommendationForPriorityCustomer: false,
  }), { visible: false, reason: 'PRIORITY_NOT_YET_RECOMMENDED' });
  assert.deepEqual(decideCustomerVisibility({
    sourceStatus: 'active', bizStatus: 'normal', platformVisibility: 'hidden',
    hasCustomerGrant: true, customerId: 11n,
    activePriorityCustomerId: 11n, hasActiveRecommendationForPriorityCustomer: true,
  }), { visible: true, reason: 'PRIORITY_RECOMMENDATION_GRANT' });
});

test('CR-007 staff Priority visibility is responsible-sales or priority.view only', async () => {
  const { decideStaffPriorityVisibility } = await import('../../apps/api/src/modules/vehicle/visibility.ts');
  assert.deepEqual(decideStaffPriorityVisibility({activePriorityCustomerId: 1n,priorityCustomerResponsibleEmployeeId: 7n,employeeId: 7n,hasPriorityView: false}), {visible:true,reason:'RESPONSIBLE_SALES'});
  assert.deepEqual(decideStaffPriorityVisibility({activePriorityCustomerId: 1n,priorityCustomerResponsibleEmployeeId: 7n,employeeId: 8n,hasPriorityView: true}), {visible:true,reason:'PRIORITY_VIEW'});
  assert.deepEqual(decideStaffPriorityVisibility({activePriorityCustomerId: 1n,priorityCustomerResponsibleEmployeeId: 7n,employeeId: 8n,hasPriorityView: false}), {visible:false,reason:'VEHICLE_PRIORITY_PROTECTED'});
});

test('CR-007 ordinary share carries attribution only', async () => {
  const { resolveShareCapabilities } = await import('../../apps/api/src/modules/vehicle/visibility.ts');
  assert.deepEqual(resolveShareCapabilities(), {
    attribution: true,
    recommendation: false,
    visibilityGrant: false,
    priceEntitlement: false,
  });
});

test('CR-007 Collector configuration accepts only a relative phone path under a deployment allowlist', async () => {
  const { validateCollectorTarget } = await import('../../apps/api/src/modules/vehicle/collector-phone.ts');
  assert.deepEqual(validateCollectorTarget({
    baseUrl: 'https://collector.internal.example',
    phonePath: '/internal/phones/by-car-code',
    allowedOrigins: ['https://collector.internal.example'],
  }), { origin: 'https://collector.internal.example', phonePath: '/internal/phones/by-car-code' });
  assert.throws(() => validateCollectorTarget({
    baseUrl: 'https://evil.example', phonePath: '/phone',
    allowedOrigins: ['https://collector.internal.example'],
  }), /COLLECTOR_ORIGIN_NOT_ALLOWED/);
  assert.throws(() => validateCollectorTarget({
    baseUrl: 'https://collector.internal.example', phonePath: 'https://evil.example/phone',
    allowedOrigins: ['https://collector.internal.example'],
  }), /COLLECTOR_PHONE_PATH_MUST_BE_RELATIVE/);
});

test('CR-007 database migration carries the required hard constraints', async () => {
  const sql = await read('database/migrations/000005_cr007_hardening.sql');
  assert.match(sql, /ALTER COLUMN internal_wholesale_snapshot_cents DROP NOT NULL/);
  assert.match(sql, /upstream_wholesale_price_label TEXT/); // historical 000005; renamed by 000008
  assert.match(sql, /CREATE UNIQUE INDEX uq_vehicle_active_priority/);
  assert.match(sql, /CREATE UNIQUE INDEX uq_pending_refund_transaction/);
  assert.match(sql, /CREATE UNIQUE INDEX uq_pending_refund_lock/);
  assert.match(sql, /CREATE TABLE vehicle_visibility_grants/);
  assert.match(sql, /CREATE TABLE demand_priority_leases/);
  assert.doesNotMatch(sql, /priority_limit|maximum_priority|max_priority/i);
  const p6 = await read('database/migrations/000006_priority_unification.sql');
  assert.match(p6, /is_priority_customer BOOLEAN NOT NULL DEFAULT FALSE/);
  assert.match(p6, /fk_priority_trigger_demand_customer/);
  assert.match(p6, /fk_priority_listing_cycle_vehicle/);
  assert.match(p6, /uq_active_recommendation_customer_vehicle_cycle/);
  assert.match(p6, /priority\.view/);
  assert.match(p6, /DELETE FROM permissions WHERE permission_code='priority\.override'/);
  const p8 = await read('database/migrations/000008_price_visibility_closure.sql');
  assert.match(p8, /RENAME COLUMN upstream_wholesale_price_label TO upstream_list_price_label/);
  assert.match(p8, /DROP TABLE IF EXISTS vehicle_model_visibility_rules/);
  assert.match(p8, /DELETE FROM permissions WHERE permission_code='vehicle\.visibility\.manage'/);
  assert.match(p8, /grant_reason='recommendation'/);
});

test('CR-007 freezes pnpm as the only package-manager contract', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const workspace = await read('pnpm-workspace.yaml');
  assert.match(pkg.packageManager, /^pnpm@/);
  assert.match(pkg.scripts['dev:api'], /^pnpm /);
  assert.match(workspace, /apps\/\*/);
  assert.match(workspace, /packages\/\*/);
});

test('CR-007 clean rebuild is limited to development and test', async () => {
  const { assertCleanRebuildEnvironment } = await import('../../scripts/clean-rebuild-policy.mjs');
  assert.equal(assertCleanRebuildEnvironment('development'), 'development');
  assert.equal(assertCleanRebuildEnvironment('test'), 'test');
  assert.throws(() => assertCleanRebuildEnvironment('production'), /CLEAN_REBUILD_REFUSED/);
  assert.throws(() => assertCleanRebuildEnvironment(undefined), /CLEAN_REBUILD_REFUSED/);
});
