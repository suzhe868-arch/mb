import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (rel) => readFile(new URL(`../../${rel}`, import.meta.url), 'utf8');

test('CN4 cumulative physical schema embeds CR007 database deltas', async () => {
  const physical = await read('spec/FINAL_DEV_READY/08_DATABASE/08_PHYSICAL_DB_SCHEMA.sql');
  const m5 = (await read('database/migrations/000005_cr007_hardening.sql')).trim();
  const m6 = (await read('database/migrations/000006_priority_unification.sql')).trim();
  const m7 = (await read('database/migrations/000007_refund_and_business_integrity.sql')).trim();
  const m8 = (await read('database/migrations/000008_price_visibility_closure.sql')).trim();
  assert.ok(physical.includes(m5), '000005 must be embedded in cumulative physical schema');
  assert.ok(physical.includes(m6), '000006 must be embedded in cumulative physical schema');
  assert.ok(physical.includes(m7), '000007 must be embedded in cumulative physical schema');
  assert.ok(physical.includes(m8), '000008 must be embedded in cumulative physical schema');
  for (const token of [
    'CREATE TABLE vehicle_visibility_grants',
    'DROP TABLE IF EXISTS vehicle_model_visibility_rules',
    'CREATE TABLE demand_priority_leases',
    'CREATE TABLE collector_connection_config',
    'fk_priority_trigger_demand_customer',
    'fk_priority_listing_cycle_vehicle',
    'fk_priority_recommendation_business',
    'uq_active_recommendation_customer_vehicle_cycle',
    'RENAME COLUMN upstream_wholesale_price_label TO upstream_list_price_label',
    'ck_visibility_grant_recommendation_only',
  ]) assert.match(physical, new RegExp(token));
});

test('CN4 database docs do not claim unverified runtime migration PASS', async () => {
  const migration = await read('spec/FINAL_DEV_READY/08_DATABASE/08_MIGRATION_CONTRACT.md');
  const constraints = await read('spec/FINAL_DEV_READY/08_DATABASE/08_DB_CONSTRAINT_REGISTER.md');
  assert.match(migration, /MIGRATION_READY = CONDITIONALLY_READY/);
  assert.match(migration, /PostgreSQL 16 clean apply \+ replay evidence is still `EXT-DB-01`/);
  assert.match(constraints, /DB_INVARIANT_COVERAGE = CONDITIONALLY_READY/);
});
