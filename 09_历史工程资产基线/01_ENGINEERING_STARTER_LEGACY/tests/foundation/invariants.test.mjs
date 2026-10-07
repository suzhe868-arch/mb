import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const schema = await readFile(new URL("../../database/migrations/000001_initial_schema.sql", import.meta.url), "utf8");
test("SystemAdmin has independent table and employee table is not reused", () => {
  assert.match(schema, /CREATE TABLE employees \(/);
  assert.match(schema, /CREATE TABLE system_admins \(/);
  assert.match(schema, /guard_last_active_system_admin/);
});
test("outbox and idempotency infrastructure exist in physical schema", () => {
  assert.match(schema, /CREATE TABLE idempotency_records \(/);
  assert.match(schema, /CREATE TABLE outbox_events \(/);
  assert.match(schema, /UNIQUE\(actor_domain,actor_id,action,idempotency_key\)/);
});
test("runtime configuration is versioned", () => {
  assert.match(schema, /CREATE TABLE runtime_config_versions \(/);
  assert.match(schema, /uq_runtime_config_current/);
});
test("publisher phone cache and completed transaction correction are physical, history-preserving carriers", () => {
  assert.match(schema, /CREATE TABLE publisher_phone_cache \(/);
  assert.match(schema, /CREATE TABLE publisher_phone_history \(/);
  assert.match(schema, /CREATE TABLE upstream_phone_access_logs \(/);
  assert.match(schema, /CREATE TABLE transaction_corrections \(/);
  assert.doesNotMatch(schema, /upstream_phone_cached/);
});
