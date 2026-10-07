import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const spec = path.join(root, 'spec', 'FINAL_DEV_READY');
const openapiText = fs.readFileSync(path.join(spec, '10_API', '10_OPENAPI.yaml'), 'utf8');
const physical = fs.readFileSync(path.join(spec, '08_DATABASE', '08_PHYSICAL_DB_SCHEMA.sql'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'database', 'migrations', '000007_refund_and_business_integrity.sql'), 'utf8');

function schemaBlock(name, nextName) {
  const start = openapiText.indexOf(`    ${name}:`);
  assert.ok(start >= 0, `${name} missing`);
  const end = nextName ? openapiText.indexOf(`    ${nextName}:`, start + 1) : openapiText.length;
  return openapiText.slice(start, end > start ? end : openapiText.length);
}

test('RefundCreateRequest requires exactly one Lock or Transaction subject', () => {
  const block = schemaBlock('RefundCreateRequest', 'RefundPaymentRequest');
  assert.match(block, /oneOf:/);
  assert.match(block, /oneOf:[\s\S]*required:[\s\S]*- transaction_id[\s\S]*required:[\s\S]*- lock_id/);
});

test('RefundDTO carries the same exact-one subject invariant', () => {
  const block = schemaBlock('RefundDTO', 'BannerCustomerDTO');
  assert.match(block, /oneOf:/);
  assert.match(block, /oneOf:[\s\S]*required:[\s\S]*- transaction_id[\s\S]*required:[\s\S]*- lock_id/);
});

test('DB enforces refund XOR and same-customer subject links', () => {
  for (const token of [
    'ck_refund_exactly_one_subject',
    'fk_refund_transaction_customer',
    'fk_refund_lock_customer',
    'REFERENCES transactions(transaction_id, customer_id)',
    'REFERENCES locks(lock_id, customer_id)'
  ]) assert.match(physical, new RegExp(token.replace(/[()]/g, '\\$&')));
});

test('business source chain has composite integrity guards', () => {
  for (const token of [
    'fk_recommendation_source_demand_customer',
    'fk_consultation_source_recommendation_business',
    'fk_lock_source_recommendation_business',
    'fk_lock_source_consultation_business',
    'fk_waitlist_source_recommendation_business',
    'fk_transaction_source_lock_business',
    'fk_price_access_source_recommendation_business'
  ]) assert.match(migration, new RegExp(token));
});
